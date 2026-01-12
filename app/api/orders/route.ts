import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

// GET all orders (by user_id)
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get("user_id") || "1"; // Default user 1

  const { data: orders, error } = await supabase
    .from("orders")
    .select(`
      *,
      order_items (
        id,
        product_id,
        quantity,
        price_at_purchase,
        name_snapshot
      )
    `)
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
export async function POST(req: Request) {
  let body: any;

  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { success: false, message: "Invalid JSON body" },
      { status: 400 }
    );
  }

  const { user_id = 1, payment_method, items } = body;

  if (!items || !Array.isArray(items) || items.length === 0) {
    return NextResponse.json(
      { success: false, message: "No items provided" },
      { status: 400 }
    );
  }

  // Calculate total
  const total = items.reduce(
    (sum: number, item: any) => sum + item.price * item.quantity,
    0
  );

  // Create order
  const { data: order, error: orderError } = await supabase
    .from("orders")
    .insert({
      user_id,
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
  const orderItems = items.map((item: any) => ({
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
