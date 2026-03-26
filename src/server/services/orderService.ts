/**
 * Order Service
 *
 * Handles order creation and management.
 * Integrates with BeQuick API for fulfillment and stores order data
 * in Supabase for local reporting and commission tracking.
 */

import { eq, desc, and, gte, lte } from "drizzle-orm";
import { getDb, isDatabaseConfigured, orders, type NewOrder, type Order } from "@/db/client";
import {
  createOrder as createBeQuickOrder,
  getOrderStatus as getBeQuickOrderStatus,
  cancelOrder as cancelBeQuickOrder,
  isBeQuickConfigured,
  type CreateOrderRequest,
  type OrderType,
} from "@/server/bequickApi";

interface CreateOrderParams {
  orderType: OrderType;
  userId: string;
  organizationId: string;
  customer: {
    name: string;
    email: string;
    phone: string;
  };
  shippingAddress: {
    street1: string;
    street2?: string;
    city: string;
    state: string;
    zipCode: string;
  };
  lineItems: Array<{
    productId: string;
    productName: string;
    quantity: number;
    unitPrice: number;
    paymentOption?: "purchase" | "lease";
  }>;
  notes?: string;
  fulfillmentType?: "inventory" | "dropship";
  warehouseAddress?: {
    contactName?: string;
    phone?: string;
    street1: string;
    street2?: string;
    city: string;
    state: string;
    zipCode: string;
  };
}

interface OrderResult {
  id: string;
  externalOrderId?: string;
  status: string;
  total: number;
}

// Commission rates by order type
const COMMISSION_RATES: Record<OrderType, number> = {
  residential: 0.10, // 10%
  business: 0.12, // 12%
  iot: 0.08, // 8%
  wholesale: 0.05, // 5%
};

/**
 * Create a new order
 *
 * 1. Calculate totals and commission
 * 2. Submit to BeQuick API (if configured)
 * 3. Store in local database for reporting
 */
export async function createOrderWithCache(params: CreateOrderParams): Promise<OrderResult> {
  // Calculate totals
  const subtotal = params.lineItems.reduce(
    (sum, item) => sum + item.unitPrice * item.quantity,
    0
  );
  const tax = subtotal * 0.0825; // Example tax rate
  const total = subtotal + tax;
  const commission = subtotal * COMMISSION_RATES[params.orderType];

  let beQuickOrderId: string | undefined;
  let beQuickStatus: string | undefined;

  // Submit to BeQuick if configured
  if (isBeQuickConfigured()) {
    try {
      const beQuickRequest: CreateOrderRequest = {
        orderType: params.orderType,
        customer: {
          firstName: params.customer.name.split(" ")[0] || params.customer.name,
          lastName: params.customer.name.split(" ").slice(1).join(" ") || "",
          email: params.customer.email,
          phone: params.customer.phone,
        },
        shippingAddress: params.shippingAddress,
        lineItems: params.lineItems,
        notes: params.notes,
        agentId: params.userId,
        fulfillmentType: params.fulfillmentType,
        warehouseAddress: params.warehouseAddress
          ? { ...params.warehouseAddress }
          : undefined,
      };

      const beQuickResponse = await createBeQuickOrder(beQuickRequest);
      beQuickOrderId = beQuickResponse.orderId;
      beQuickStatus = beQuickResponse.status;
    } catch (error) {
      console.error("Error submitting to BeQuick:", error);
      // Continue with local storage even if BeQuick fails
    }
  }

  // Store in local database if configured
  if (isDatabaseConfigured()) {
    try {
      const db = getDb();

      const newOrder: NewOrder = {
        organizationId: params.organizationId,
        userId: params.userId,
        orderType: params.orderType,
        status: beQuickStatus || "pending",
        customerName: params.customer.name,
        customerEmail: params.customer.email,
        customerPhone: params.customer.phone,
        shippingAddress: params.shippingAddress,
        lineItems: params.lineItems,
        subtotal,
        tax,
        total,
        commission,
        notes: params.notes,
        fulfillmentType: params.fulfillmentType,
        warehouseAddress: params.warehouseAddress,
        beQuickOrderId,
        beQuickStatus,
        submittedAt: new Date(),
      };

      const [inserted] = await db.insert(orders).values(newOrder).returning();

      return {
        id: inserted.id,
        externalOrderId: beQuickOrderId,
        status: inserted.status || "pending",
        total,
      };
    } catch (error) {
      console.error("Error storing order in database:", error);
      throw error;
    }
  }

  // Return a mock response if neither BeQuick nor database is configured
  return {
    id: `local-${Date.now()}`,
    externalOrderId: beQuickOrderId,
    status: "pending",
    total,
  };
}

/**
 * Get orders for an organization with pagination and filtering
 */
export async function getOrders(
  organizationId: string,
  options: {
    page?: number;
    pageSize?: number;
    status?: string;
    orderType?: OrderType;
    startDate?: Date;
    endDate?: Date;
  } = {}
): Promise<{ orders: Order[]; total: number }> {
  if (!isDatabaseConfigured()) {
    return { orders: [], total: 0 };
  }

  const db = getDb();
  const page = options.page || 1;
  const pageSize = options.pageSize || 20;
  const offset = (page - 1) * pageSize;

  // Build conditions
  const conditions = [eq(orders.organizationId, organizationId)];

  if (options.status) {
    conditions.push(eq(orders.status, options.status));
  }

  if (options.orderType) {
    conditions.push(eq(orders.orderType, options.orderType));
  }

  if (options.startDate) {
    conditions.push(gte(orders.createdAt, options.startDate));
  }

  if (options.endDate) {
    conditions.push(lte(orders.createdAt, options.endDate));
  }

  const whereClause = and(...conditions);

  // Get orders with pagination
  const ordersList = await db
    .select()
    .from(orders)
    .where(whereClause)
    .orderBy(desc(orders.createdAt))
    .limit(pageSize)
    .offset(offset);

  // Get total count
  const countResult = await db
    .select()
    .from(orders)
    .where(whereClause);

  return {
    orders: ordersList,
    total: countResult.length,
  };
}

/**
 * Get a single order by ID
 */
export async function getOrderById(
  orderId: string,
  organizationId: string
): Promise<Order | null> {
  if (!isDatabaseConfigured()) {
    return null;
  }

  const db = getDb();

  const [order] = await db
    .select()
    .from(orders)
    .where(
      and(
        eq(orders.id, orderId),
        eq(orders.organizationId, organizationId)
      )
    )
    .limit(1);

  return order || null;
}

/**
 * Sync order status from BeQuick
 */
export async function syncOrderStatus(orderId: string): Promise<Order | null> {
  if (!isDatabaseConfigured()) {
    return null;
  }

  const db = getDb();

  // Get the order
  const [order] = await db
    .select()
    .from(orders)
    .where(eq(orders.id, orderId))
    .limit(1);

  if (!order || !order.beQuickOrderId) {
    return order || null;
  }

  // Get status from BeQuick
  if (isBeQuickConfigured()) {
    try {
      const status = await getBeQuickOrderStatus(order.beQuickOrderId);

      // Update local record
      await db
        .update(orders)
        .set({
          status: status.status,
          beQuickStatus: status.status,
          updatedAt: new Date(),
          completedAt: status.status === "delivered" ? new Date() : undefined,
        })
        .where(eq(orders.id, orderId));

      // Return updated order
      const [updated] = await db
        .select()
        .from(orders)
        .where(eq(orders.id, orderId))
        .limit(1);

      return updated || null;
    } catch (error) {
      console.error("Error syncing order status:", error);
      return order;
    }
  }

  return order;
}

/**
 * Cancel an order
 */
export async function cancelOrderById(
  orderId: string,
  organizationId: string,
  reason?: string
): Promise<{ success: boolean; message?: string }> {
  if (!isDatabaseConfigured()) {
    return { success: false, message: "Database not configured" };
  }

  const db = getDb();

  // Get the order
  const [order] = await db
    .select()
    .from(orders)
    .where(
      and(
        eq(orders.id, orderId),
        eq(orders.organizationId, organizationId)
      )
    )
    .limit(1);

  if (!order) {
    return { success: false, message: "Order not found" };
  }

  // Cancel in BeQuick if applicable
  if (order.beQuickOrderId && isBeQuickConfigured()) {
    try {
      await cancelBeQuickOrder(order.beQuickOrderId, reason);
    } catch (error) {
      console.error("Error cancelling order in BeQuick:", error);
      // Continue with local cancellation
    }
  }

  // Update local record
  await db
    .update(orders)
    .set({
      status: "cancelled",
      beQuickStatus: "cancelled",
      updatedAt: new Date(),
      notes: reason ? `${order.notes || ""}\n\nCancellation reason: ${reason}` : order.notes,
    })
    .where(eq(orders.id, orderId));

  return { success: true };
}

/**
 * Get order statistics for dashboard
 */
export interface OrderStats {
  totalOrders: number;
  pendingOrders: number;
  completedOrders: number;
  totalRevenue: number;
  totalCommission: number;
  ordersByType: Record<OrderType, number>;
}

export async function getOrderStats(
  organizationId: string,
  startDate?: Date,
  endDate?: Date
): Promise<OrderStats> {
  if (!isDatabaseConfigured()) {
    return {
      totalOrders: 0,
      pendingOrders: 0,
      completedOrders: 0,
      totalRevenue: 0,
      totalCommission: 0,
      ordersByType: {
        residential: 0,
        business: 0,
        iot: 0,
        wholesale: 0,
      },
    };
  }

  const db = getDb();

  const conditions = [eq(orders.organizationId, organizationId)];

  if (startDate) {
    conditions.push(gte(orders.createdAt, startDate));
  }

  if (endDate) {
    conditions.push(lte(orders.createdAt, endDate));
  }

  const ordersList = await db
    .select()
    .from(orders)
    .where(and(...conditions));

  const stats: OrderStats = {
    totalOrders: ordersList.length,
    pendingOrders: ordersList.filter((o) => o.status === "pending" || o.status === "processing").length,
    completedOrders: ordersList.filter((o) => o.status === "delivered" || o.status === "completed").length,
    totalRevenue: ordersList.reduce((sum, o) => sum + (o.total || 0), 0),
    totalCommission: ordersList.reduce((sum, o) => sum + (o.commission || 0), 0),
    ordersByType: {
      residential: ordersList.filter((o) => o.orderType === "residential").length,
      business: ordersList.filter((o) => o.orderType === "business").length,
      iot: ordersList.filter((o) => o.orderType === "iot").length,
      wholesale: ordersList.filter((o) => o.orderType === "wholesale").length,
    },
  };

  return stats;
}
