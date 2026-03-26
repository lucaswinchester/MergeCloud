import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createOrderWithCache, getOrders, getOrderStats } from "@/server/services/orderService";
import type { OrderType } from "@/server/bequickApi";

// GET /api/orders - List orders
export async function GET(request: NextRequest) {
  try {
    const { userId, orgId } = await auth();

    if (!userId || !orgId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1", 10);
    const pageSize = parseInt(searchParams.get("pageSize") || "20", 10);
    const status = searchParams.get("status") || undefined;
    const orderType = searchParams.get("orderType") as OrderType | undefined;
    const startDate = searchParams.get("startDate")
      ? new Date(searchParams.get("startDate")!)
      : undefined;
    const endDate = searchParams.get("endDate")
      ? new Date(searchParams.get("endDate")!)
      : undefined;

    // Check if stats are requested
    if (searchParams.get("stats") === "true") {
      const stats = await getOrderStats(orgId, startDate, endDate);
      return NextResponse.json(stats);
    }

    const result = await getOrders(orgId, {
      page,
      pageSize,
      status,
      orderType,
      startDate,
      endDate,
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error fetching orders:", error);
    return NextResponse.json(
      { error: "Failed to fetch orders" },
      { status: 500 }
    );
  }
}

// POST /api/orders - Create a new order
export async function POST(request: NextRequest) {
  try {
    const { userId, orgId } = await auth();

    if (!userId || !orgId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();

    // Validate required fields
    if (!body.orderType || !body.lineItems?.length) {
      return NextResponse.json(
        { error: "Missing required fields: orderType, lineItems" },
        { status: 400 }
      );
    }

    // Validate fulfillment-specific requirements
    const fulfillmentType = body.fulfillmentType as
      | "inventory"
      | "dropship"
      | undefined;

    if (fulfillmentType === "dropship") {
      if (!body.customer || !body.shippingAddress) {
        return NextResponse.json(
          {
            error:
              "Dropship orders require customer info and shipping address",
          },
          { status: 400 }
        );
      }
    }

    if (fulfillmentType === "inventory") {
      if (!body.warehouseAddress && !body.shippingAddress) {
        return NextResponse.json(
          { error: "Inventory orders require a warehouse/delivery address" },
          { status: 400 }
        );
      }
    }

    // Build customer fallback for non-dropship
    const customer = body.customer || {
      name: "",
      email: "",
      phone: "",
    };

    const shippingAddress = body.shippingAddress || body.warehouseAddress || {
      street1: "",
      city: "",
      state: "",
      zipCode: "",
    };

    const result = await createOrderWithCache({
      orderType: body.orderType,
      userId,
      organizationId: orgId,
      customer: {
        name: customer.name,
        email: customer.email,
        phone: customer.phone,
      },
      shippingAddress,
      lineItems: body.lineItems,
      notes: body.notes,
      fulfillmentType,
      warehouseAddress: body.warehouseAddress,
    });

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    console.error("Error creating order:", error);
    return NextResponse.json(
      { error: "Failed to create order" },
      { status: 500 }
    );
  }
}
