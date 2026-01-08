import { NextResponse } from "next/server";
import { orders } from "../../../_store";

export async function POST(
  req: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  const { id } = await ctx.params;

  const order = orders.find(o => o.id === Number(id));

  if (!order) {
    return NextResponse.json(
      { success: false, message: "Order not found" },
      { status: 404 }
    );
  }

  order.status = "paid";

  return NextResponse.json({
    success: true,
    data: order
  });
}
