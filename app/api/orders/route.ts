import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { verifyToken } from "@/lib/jwt";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function toNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim() !== "") {
    const n = Number(value);
    return Number.isFinite(n) ? n : null;
  }
  return null;
}

type OrderItemInput = {
  product_id: number;
  quantity: number;
  price: number;
  name: string;
};

// Helper: Get user_id from JWT token OR query param/body
function getUserId(req: NextRequest, fromBody?: number): number | null {
  // 1. Check JWT token first
  const jwtPayload = verifyToken(req);
  if (jwtPayload?.userId) {
    return jwtPayload.userId;
  }

  // 2. Fallback to body
  if (fromBody) {
    return fromBody;
  }

  // 3. Fallback to query param
  const { searchParams } = new URL(req.url);
  const userIdParam = searchParams.get("user_id");
  if (userIdParam) {
    return parseInt(userIdParam);
  }

  return null;
}

// GET all orders (by user_id)
export async function GET(req: NextRequest) {
  const userId = getUserId(req);

  if (!userId) {
    return NextResponse.json(
      { success: false, message: "user_id is required or provide valid token" },
      { status: 400 }
    );
  }

  const { data: orders, error } = await supabase
    .from("orders")
    .select(
      `
      *,
      order_items (
        id,
        product_id,
        quantity,
        price_at_purchase,
        name_snapshot
      )
    `
    )
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }

  return NextResponse.json({
    success: true,
    data: orders || [],
  });
}

// POST create new order
export async function POST(req: NextRequest) {
  let body: unknown;

  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { success: false, message: "Invalid JSON body" },
      { status: 400 }
    );
  }

  if (!isRecord(body)) {
    return NextResponse.json(
      { success: false, message: "Invalid JSON body" },
      { status: 400 }
    );
  }

  // Get user_id from token or body
  const bodyUserId = toNumber(body.user_id);
  const userId = getUserId(req, bodyUserId || undefined);

  if (!userId) {
    return NextResponse.json(
      { success: false, message: "user_id is required or provide valid token" },
      { status: 400 }
    );
  }

  const items_raw = body.items;
  const payment_method_raw = body.payment_method;

  if (!Array.isArray(items_raw) || items_raw.length === 0) {
    return NextResponse.json(
      { success: false, message: "No items provided" },
      { status: 400 }
    );
  }

  const items: OrderItemInput[] = [];
  for (const raw of items_raw) {
    if (!isRecord(raw)) {
      return NextResponse.json(
        { success: false, message: "Invalid items payload" },
        { status: 400 }
      );
    }

    const product_id = toNumber(raw.product_id);
    const quantity = toNumber(raw.quantity);
    const price = toNumber(raw.price);
    const name = typeof raw.name === "string" ? raw.name : null;

    if (!product_id || !quantity || !price || !name) {
      return NextResponse.json(
        { success: false, message: "Invalid items payload" },
        { status: 400 }
      );
    }

    items.push({
      product_id,
      quantity,
      price,
      name,
    });
  }

  const payment_method =
    typeof payment_method_raw === "string" && payment_method_raw.trim() !== ""
      ? payment_method_raw
      : undefined;

  // Calculate total
  const total = items.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  // Create order
  const { data: order, error: orderError } = await supabase
    .from("orders")
    .insert({
      user_id: userId,
      payment_method: payment_method || "unselected",
      status: "pending",
      total,
    })
    .select()
    .single();

  if (orderError) {
    return NextResponse.json(
      { success: false, message: orderError.message },
      { status: 500 }
    );
  }

  // Create order items
  const orderItems = items.map((item) => ({
    order_id: order.id,
    product_id: item.product_id,
    quantity: item.quantity,
    price_at_purchase: item.price,
    name_snapshot: item.name,
  }));

  const { error: itemsError } = await supabase
    .from("order_items")
    .insert(orderItems);

  if (itemsError) {
    // Rollback: delete order if items failed
    await supabase.from("orders").delete().eq("id", order.id);
    return NextResponse.json(
      { success: false, message: itemsError.message },
      { status: 500 }
    );
  }

  return NextResponse.json({
    success: true,
    data: { ...order, items: orderItems },
  });
}