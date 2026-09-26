import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/lib/db";
import { getAuthUserId } from "@/lib/jwt";

const cartQuery = `SELECT c.*, row_to_json(p) AS products FROM cart c JOIN products p ON p.id = c.product_id`;

export async function GET(request: NextRequest) {
    try {
        const userId = await getAuthUserId(request);
        if (!userId)
            return NextResponse.json(
                { success: false, error: "Unauthorized" },
                { status: 401 },
            );
        const { rows } = await pool.query(
            `${cartQuery} WHERE c.user_id = $1 ORDER BY c.created_at DESC`,
            [userId],
        );
        return NextResponse.json({ success: true, data: rows });
    } catch (error) {
        console.error("Server error:", error);
        return NextResponse.json(
            { success: false, error: "Internal server error" },
            { status: 500 },
        );
    }
}

export async function POST(request: NextRequest) {
    try {
        const userId = await getAuthUserId(request);
        if (!userId)
            return NextResponse.json(
                { success: false, error: "Unauthorized" },
                { status: 401 },
            );
        const { product_id, quantity = 1 } = await request.json();
        if (!product_id)
            return NextResponse.json(
                { success: false, error: "product_id is required" },
                { status: 400 },
            );
        const existing = await pool.query(
            "SELECT id, quantity FROM cart WHERE user_id = $1 AND product_id = $2",
            [userId, product_id],
        );
        let cartId: number;
        let message: string;
        if (existing.rows[0]) {
            cartId = existing.rows[0].id;
            await pool.query("UPDATE cart SET quantity = $1 WHERE id = $2", [
                existing.rows[0].quantity + quantity,
                cartId,
            ]);
            message = "Quantity updated";
        } else {
            const inserted = await pool.query(
                "INSERT INTO cart (user_id, product_id, quantity) VALUES ($1, $2, $3) RETURNING id",
                [userId, product_id, quantity],
            );
            cartId = inserted.rows[0].id;
            message = "Added to cart";
        }
        const { rows } = await pool.query(`${cartQuery} WHERE c.id = $1`, [
            cartId,
        ]);
        return NextResponse.json({ success: true, data: rows[0], message });
    } catch (error) {
        console.error("Server error:", error);
        return NextResponse.json(
            { success: false, error: "Internal server error" },
            { status: 500 },
        );
    }
}

export async function PUT(request: NextRequest) {
    try {
        const userId = await getAuthUserId(request);
        if (!userId)
            return NextResponse.json(
                { success: false, error: "Unauthorized" },
                { status: 401 },
            );
        const { cart_id, quantity } = await request.json();
        if (!cart_id || quantity === undefined)
            return NextResponse.json(
                { success: false, error: "cart_id and quantity are required" },
                { status: 400 },
            );
        const existing = await pool.query(
            "SELECT user_id FROM cart WHERE id = $1",
            [cart_id],
        );
        if (!existing.rows[0])
            return NextResponse.json(
                { success: false, error: "Cart item not found" },
                { status: 404 },
            );
        if (existing.rows[0].user_id !== userId)
            return NextResponse.json(
                { success: false, error: "Forbidden" },
                { status: 403 },
            );
        if (quantity <= 0) {
            await pool.query("DELETE FROM cart WHERE id = $1", [cart_id]);
            return NextResponse.json({
                success: true,
                message: "Item removed from cart",
            });
        }
        await pool.query("UPDATE cart SET quantity = $1 WHERE id = $2", [
            quantity,
            cart_id,
        ]);
        const { rows } = await pool.query(`${cartQuery} WHERE c.id = $1`, [
            cart_id,
        ]);
        return NextResponse.json({
            success: true,
            data: rows[0],
            message: "Quantity updated",
        });
    } catch (error) {
        console.error("Server error:", error);
        return NextResponse.json(
            { success: false, error: "Internal server error" },
            { status: 500 },
        );
    }
}

export async function DELETE(request: NextRequest) {
    try {
        const userId = await getAuthUserId(request);
        if (!userId)
            return NextResponse.json(
                { success: false, error: "Unauthorized" },
                { status: 401 },
            );
        const cartId = Number(new URL(request.url).searchParams.get("cart_id"));
        if (!Number.isInteger(cartId) || cartId <= 0)
            return NextResponse.json(
                { success: false, error: "cart_id is required" },
                { status: 400 },
            );
        const existing = await pool.query(
            "SELECT user_id FROM cart WHERE id = $1",
            [cartId],
        );
        if (!existing.rows[0])
            return NextResponse.json(
                { success: false, error: "Cart item not found" },
                { status: 404 },
            );
        if (existing.rows[0].user_id !== userId)
            return NextResponse.json(
                { success: false, error: "Forbidden" },
                { status: 403 },
            );
        await pool.query("DELETE FROM cart WHERE id = $1", [cartId]);
        return NextResponse.json({
            success: true,
            message: "Item removed from cart",
        });
    } catch (error) {
        console.error("Server error:", error);
        return NextResponse.json(
            { success: false, error: "Internal server error" },
            { status: 500 },
        );
    }
}
