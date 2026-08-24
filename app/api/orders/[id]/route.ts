import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { getAuthUserId } from "@/lib/jwt";

export async function GET(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  const userId = await getAuthUserId(req);

  if (!userId) {
    return NextResponse.json(
      { success: false, message: "Unauthorized" },
      { status: 401 }
    );
  }

  const { id } = await ctx.params;

  const { data: order, error } = await supabase
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
    .eq("id", Number(id))
    .single();

  if (error || !order) {
    return NextResponse.json(
      { success: false, message: "Order not found" },
      { status: 404 }
    );
  }

  if (order.user_id !== userId) {
    return NextResponse.json(
      { success: false, message: "Forbidden" },
      { status: 403 }
    );
  }

  return NextResponse.json({
    success: true,
    data: order,
  });
}
