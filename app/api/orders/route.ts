import { NextResponse } from "next/server";
import { orders, findProduct } from "../_store";

export async function GET() {
  return NextResponse.json({
    success: true,
    data: orders
  });
}

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

  const product = findProduct(Number(body.product_id));

  if (!product) {
    return NextResponse.json(
      { success: false, message: "Product not found" },
      { status: 404 }
    );
  }

  const qty = Number(body.qty) || 1;

  const newOrder = {
    id: orders.length + 1,
    status: "pending",

    payment_method: body.payment_method || "unselected",

    items: [
      {
        product_id: product.id,
        qty,
        name_snapshot: product.name,
        price_at_purchase: product.price
      }
    ],

    total: product.price * qty
  };

  orders.push(newOrder);

  return NextResponse.json({
    success: true,
    data: newOrder
  });
}
