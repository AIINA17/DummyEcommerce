import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/lib/db";
import { getAuthUserId } from "@/lib/jwt";

export async function GET(
    req: NextRequest,
    ctx: { params: Promise<{ id: string }> },
) {
    const userId = await getAuthUserId(req);

    if (!userId) {
        return NextResponse.json(
            { success: false, message: "Unauthorized" },
            { status: 401 },
        );
    }

    const { id } = await ctx.params;

    const { rows } = await pool.query(
        `
    SELECT o.*, COALESCE(json_agg(json_build_object(
      'id', oi.id, 'product_id', oi.product_id, 'quantity', oi.quantity,
      'price_at_purchase', oi.price_at_purchase, 'name_snapshot', oi.name_snapshot
    ) ORDER BY oi.id) FILTER (WHERE oi.id IS NOT NULL), '[]') AS order_items
    FROM orders o LEFT JOIN order_items oi ON oi.order_id = o.id
    WHERE o.id = $1 GROUP BY o.id
  `,
        [Number(id)],
    );
    const order = rows[0];

    if (!order) {
        return NextResponse.json(
            { success: false, message: "Order not found" },
            { status: 404 },
        );
    }

    if (Number(order.user_id) !== Number(userId)) {
        return NextResponse.json(
            { success: false, message: "Forbidden" },
            { status: 403 },
        );
    }

    return NextResponse.json({
        success: true,
        data: order,
    });
}
