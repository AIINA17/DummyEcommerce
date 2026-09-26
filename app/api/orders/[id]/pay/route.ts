import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/lib/db";
import { getAuthUserId } from "@/lib/jwt";

export async function POST(
    req: NextRequest,
    ctx: { params: Promise<{ id: string }> },
) {
    const user_id = await getAuthUserId(req);

    if (!user_id) {
        return NextResponse.json(
            { success: false, message: "Unauthorized" },
            { status: 401 },
        );
    }

    const { id } = await ctx.params;
    const order_id = Number(id);

    // Ambil order
    const orderResult = await pool.query(
        "SELECT id, user_id, total, status, payment_method FROM orders WHERE id = $1",
        [order_id],
    );
    const order = orderResult.rows[0];
    const orderError = !order;

    if (orderError || !order) {
        return NextResponse.json(
            { success: false, message: "Order not found" },
            { status: 404 },
        );
    }

    // Pastikan order milik user ini
    if (Number(order.user_id) !== Number(user_id)) {
        return NextResponse.json(
            { success: false, message: "Forbidden" },
            { status: 403 },
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
        const userResult = await pool.query(
            "SELECT balance FROM users WHERE id = $1",
            [user_id],
        );
        const user = userResult.rows[0];
        const userError = !user;

        if (userError || !user) {
            return NextResponse.json(
                { success: false, message: "User not found" },
                { status: 404 },
            );
        }

        const balance = Number(user.balance);
        const total = Number(order.total);

        if (balance < total) {
            return NextResponse.json(
                { success: false, message: "Insufficient ShopKu Pay balance" },
                { status: 400 },
            );
        }

        // Potong saldo
        const updateBalanceFailed =
            (
                await pool.query(
                    "UPDATE users SET balance = $1 WHERE id = $2",
                    [balance - total, user_id],
                )
            ).rowCount === 0;

        if (updateBalanceFailed) {
            return NextResponse.json(
                { success: false, message: "Failed to update balance" },
                { status: 500 },
            );
        }
    }

    // Set order paid
    const paidResult = await pool.query(
        "UPDATE orders SET status = 'paid', updated_at = NOW() WHERE id = $1 RETURNING *",
        [order_id],
    );
    const paidOrder = paidResult.rows[0];
    const payError = !paidOrder;

    if (payError || !paidOrder) {
        return NextResponse.json(
            { success: false, message: "Failed to update order" },
            { status: 500 },
        );
    }

    return NextResponse.json({
        success: true,
        data: paidOrder,
    });
}
