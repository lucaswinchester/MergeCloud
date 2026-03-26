/**
 * BeQuick OSS/BSS API Client
 *
 * This client handles order submission to BeQuick for fulfillment.
 * Orders are submitted to BeQuick for processing and a local copy
 * is stored in Supabase for reporting purposes.
 */

const BEQUICK_API_BASE_URL = process.env.BEQUICK_API_URL || "https://api.bequick.com/v1";
const BEQUICK_API_KEY = process.env.BEQUICK_API_KEY;

// Order Types
export type OrderType = "residential" | "business" | "iot" | "wholesale";

export interface Address {
  street1: string;
  street2?: string;
  city: string;
  state: string;
  zipCode: string;
  country?: string;
}

export interface CustomerInfo {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  companyName?: string;
}

export interface LineItem {
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  description?: string;
}

export type FulfillmentType = "inventory" | "dropship";

export interface CreateOrderRequest {
  orderType: OrderType;
  customer: CustomerInfo;
  shippingAddress: Address;
  billingAddress?: Address;
  lineItems: LineItem[];
  notes?: string;
  referenceId?: string;
  agentId?: string;
  fulfillmentType?: FulfillmentType;
  warehouseAddress?: Address & { contactName?: string };
}

export interface OrderResponse {
  orderId: string;
  status: string;
  createdAt: string;
  estimatedDelivery?: string;
  trackingNumber?: string;
  total: number;
}

export interface OrderStatusResponse {
  orderId: string;
  status: "pending" | "processing" | "shipped" | "delivered" | "cancelled";
  statusHistory: Array<{
    status: string;
    timestamp: string;
    note?: string;
  }>;
  trackingInfo?: {
    carrier: string;
    trackingNumber: string;
    trackingUrl?: string;
  };
}

// Helper to make authenticated requests
async function beQuickFetch(
  endpoint: string,
  options: RequestInit = {}
): Promise<Response> {
  if (!BEQUICK_API_KEY) {
    throw new Error("BEQUICK_API_KEY environment variable is not configured");
  }

  const url = `${BEQUICK_API_BASE_URL}${endpoint}`;

  const response = await fetch(url, {
    ...options,
    headers: {
      "Authorization": `Bearer ${BEQUICK_API_KEY}`,
      "Content-Type": "application/json",
      "Accept": "application/json",
      ...options.headers,
    },
  });

  return response;
}

/**
 * Create a new order in BeQuick
 */
export async function createOrder(order: CreateOrderRequest): Promise<OrderResponse> {
  try {
    const response = await beQuickFetch("/orders", {
      method: "POST",
      body: JSON.stringify(order),
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => "");
      throw new Error(`Failed to create order: ${response.status} ${errorText}`);
    }

    return await response.json();
  } catch (error) {
    console.error("Error creating BeQuick order:", error);
    throw error;
  }
}

/**
 * Get order status from BeQuick
 */
export async function getOrderStatus(orderId: string): Promise<OrderStatusResponse> {
  try {
    const response = await beQuickFetch(`/orders/${encodeURIComponent(orderId)}/status`);

    if (!response.ok) {
      const errorText = await response.text().catch(() => "");
      throw new Error(`Failed to get order status: ${response.status} ${errorText}`);
    }

    return await response.json();
  } catch (error) {
    console.error("Error getting BeQuick order status:", error);
    throw error;
  }
}

/**
 * Get order details from BeQuick
 */
export async function getOrderDetails(orderId: string): Promise<OrderResponse> {
  try {
    const response = await beQuickFetch(`/orders/${encodeURIComponent(orderId)}`);

    if (!response.ok) {
      const errorText = await response.text().catch(() => "");
      throw new Error(`Failed to get order details: ${response.status} ${errorText}`);
    }

    return await response.json();
  } catch (error) {
    console.error("Error getting BeQuick order details:", error);
    throw error;
  }
}

/**
 * Cancel an order in BeQuick
 */
export async function cancelOrder(orderId: string, reason?: string): Promise<{ success: boolean }> {
  try {
    const response = await beQuickFetch(`/orders/${encodeURIComponent(orderId)}/cancel`, {
      method: "POST",
      body: JSON.stringify({ reason }),
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => "");
      throw new Error(`Failed to cancel order: ${response.status} ${errorText}`);
    }

    return { success: true };
  } catch (error) {
    console.error("Error cancelling BeQuick order:", error);
    throw error;
  }
}

/**
 * Get available products from BeQuick catalog
 */
export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  orderType: OrderType[];
  inStock: boolean;
  specifications?: Record<string, string>;
}

export async function getProducts(orderType?: OrderType): Promise<Product[]> {
  try {
    const endpoint = orderType
      ? `/products?type=${encodeURIComponent(orderType)}`
      : "/products";

    const response = await beQuickFetch(endpoint);

    if (!response.ok) {
      const errorText = await response.text().catch(() => "");
      throw new Error(`Failed to get products: ${response.status} ${errorText}`);
    }

    return await response.json();
  } catch (error) {
    console.error("Error getting BeQuick products:", error);
    throw error;
  }
}

/**
 * Calculate shipping for an order
 */
export interface ShippingQuote {
  method: string;
  carrier: string;
  price: number;
  estimatedDays: number;
}

export async function getShippingQuotes(
  address: Address,
  lineItems: LineItem[]
): Promise<ShippingQuote[]> {
  try {
    const response = await beQuickFetch("/shipping/quotes", {
      method: "POST",
      body: JSON.stringify({ address, lineItems }),
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => "");
      throw new Error(`Failed to get shipping quotes: ${response.status} ${errorText}`);
    }

    return await response.json();
  } catch (error) {
    console.error("Error getting shipping quotes:", error);
    throw error;
  }
}

/**
 * Validate address with BeQuick
 */
export interface AddressValidationResult {
  valid: boolean;
  suggestedAddress?: Address;
  errors?: string[];
}

export async function validateAddress(address: Address): Promise<AddressValidationResult> {
  try {
    const response = await beQuickFetch("/address/validate", {
      method: "POST",
      body: JSON.stringify(address),
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => "");
      throw new Error(`Failed to validate address: ${response.status} ${errorText}`);
    }

    return await response.json();
  } catch (error) {
    console.error("Error validating address:", error);
    throw error;
  }
}

/**
 * Check if BeQuick API is available
 */
export function isBeQuickConfigured(): boolean {
  return Boolean(BEQUICK_API_KEY && BEQUICK_API_BASE_URL);
}
