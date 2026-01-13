import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function POST(
  req: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json(
      { success: false, message: "Unauthorized" },
      { status: 401 }
    );
  }

  const user_id = Number(session.user.id);
  const { id } = await ctx.params;
  const order_id = Number(id);

  // Ambil order
  const { data: order, error: orderError } = await supabase
    .from("orders")
    .select("id, user_id, total, status, payment_method")
    .eq("id", order_id)
    .single();

  if (orderError || !order) {
    return NextResponse.json(
      { success: false, message: "Order not found" },
      { status: 404 }
    );
  }

  // Pastikan order milik user ini
  if (order.user_id !== user_id) {
    return NextResponse.json(
      { success: false, message: "Forbidden" },
      { status: 403 }
    );
  }

  // Kalau sudah paid, jangan diproses ulang
  if (order.status === "paid") {
    return NextResponse.json({
      success: true,
      data: order,
    });
  }

  // Kalau ShopKu Pay → cek & potong saldo
  if (order.payment_method === "SHOPKUPAY") {
    const { data: user, error: userError } = await supabase
      .from("users")
      .select("balance")
      .eq("id", user_id)
      .single();

    if (userError || !user) {
      return NextResponse.json(
        { success: false, message: "User not found" },
        { status: 404 }
      );
    }

    const balance = Number(user.balance);
    const total = Number(order.total);

    if (balance < total) {
      return NextResponse.json(
        { success: false, message: "Insufficient ShopKu Pay balance" },
        { status: 400 }
      );
    }

    // Potong saldo
    const { error: updateBalanceError } = await supabase
      .from("users")
      .update({ balance: balance - total })
      .eq("id", user_id);

    if (updateBalanceError) {
      return NextResponse.json(
        { success: false, message: updateBalanceError.message },
        { status: 500 }
      );
    }
  }

  // Set order paid
  const { data: paidOrder, error: payError } = await supabase
    .from("orders")
    .update({ status: "paid", updated_at: new Date().toISOString() })
    .eq("id", order_id)
    .select()
    .single();

  if (payError || !paidOrder) {
    return NextResponse.json(
      { success: false, message: "Failed to update order" },
      { status: 500 }
    );
  }

  return NextResponse.json({
    success: true,
    data: paidOrder,
  });
}
