import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/lib/db";
import { getAuthUserId } from "@/lib/jwt";
import { SERVICE_FEE } from "@/lib/constants";

function isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === "object" && value !== null && !Array.isArray(value);
}
function toPositiveInt(value: unknown): number | null {
    const number = typeof value === "string" ? Number(value) : value;
    return typeof number === "number" && Number.isInteger(number) && number > 0
        ? number
        : null;
}

export async function GET(req: NextRequest) {
    const userId = await getAuthUserId(req);
    if (!userId)
        return NextResponse.json(
            { success: false, message: "Unauthorized" },
            { status: 401 },
        );
    const { rows } = await pool.query(
        `SELECT o.*, COALESCE(json_agg(oi ORDER BY oi.id) FILTER (WHERE oi.id IS NOT NULL), '[]') AS order_items FROM orders o LEFT JOIN order_items oi ON oi.order_id = o.id WHERE o.user_id = $1 GROUP BY o.id ORDER BY o.created_at DESC`,
        [userId],
    );
    return NextResponse.json({ success: true, data: rows });
}

export async function POST(req: NextRequest) {
    const userId = await getAuthUserId(req);
    if (!userId)
        return NextResponse.json(
            { success: false, message: "Unauthorized" },
            { status: 401 },
        );
    let body: unknown;
    try {
        body = await req.json();
    } catch {
        return NextResponse.json(
            { success: false, message: "Invalid JSON body" },
            { status: 400 },
        );
    }
    if (
        !isRecord(body) ||
        !Array.isArray(body.items) ||
        body.items.length === 0
    )
        return NextResponse.json(
            { success: false, message: "No items provided" },
            { status: 400 },
        );
    const requested: { product_id: number; quantity: number }[] = [];
    for (const raw of body.items) {
        if (!isRecord(raw))
            return NextResponse.json(
                { success: false, message: "Invalid items payload" },
                { status: 400 },
            );
        const product_id = toPositiveInt(raw.product_id);
        const quantity = toPositiveInt(raw.quantity);
        if (!product_id || !quantity)
            return NextResponse.json(
                { success: false, message: "Invalid items payload" },
                { status: 400 },
            );
        requested.push({ product_id, quantity });
    }
    const payment =
        typeof body.payment_method === "string" && body.payment_method.trim()
            ? body.payment_method.toUpperCase().replace(/\s/g, "_")
            : "UNSELECTED";
    const client = await pool.connect();
    try {
        await client.query("BEGIN");
        const result = await client.query(
            "SELECT id, name, price, stock FROM products WHERE id = ANY($1::int[]) FOR UPDATE",
            [requested.map((item) => item.product_id)],
        );
        const products = new Map(
            result.rows.map((product) => [product.id, product]),
        );
        for (const item of requested) {
            const product = products.get(item.product_id);
            if (!product) {
                await client.query("ROLLBACK");
                return NextResponse.json(
                    {
                        success: false,
                        message: `Produk ${item.product_id} tidak ditemukan`,
                    },
                    { status: 404 },
                );
            }
            if (product.stock < item.quantity) {
                await client.query("ROLLBACK");
                return NextResponse.json(
                    {
                        success: false,
                        message: `Stok \"${product.name}\" tidak mencukupi`,
                    },
                    { status: 400 },
                );
            }
        }
        const total = requested.reduce(
            (sum, item) =>
                sum +
                Number(products.get(item.product_id)!.price) * item.quantity,
            SERVICE_FEE,
        );
        if (payment === "SHOPKUPAY") {
            const user = await client.query(
                "SELECT balance FROM users WHERE id = $1 FOR UPDATE",
                [userId],
            );
            if (!user.rows[0]) {
                await client.query("ROLLBACK");
                return NextResponse.json(
                    { success: false, message: "User not found" },
                    { status: 404 },
                );
            }
            if (Number(user.rows[0].balance) < total) {
                await client.query("ROLLBACK");
                return NextResponse.json(
                    {
                        success: false,
                        message: "Insufficient ShopKu Pay balance",
                    },
                    { status: 400 },
                );
            }
            await client.query(
                "UPDATE users SET balance = balance - $1 WHERE id = $2",
                [total, userId],
            );
        }
        for (const item of requested)
            await client.query(
                "UPDATE products SET stock = stock - $1 WHERE id = $2",
                [item.quantity, item.product_id],
            );
        const orderResult = await client.query(
            "INSERT INTO orders (user_id, payment_method, status, total) VALUES ($1, $2, $3, $4) RETURNING *",
            [
                userId,
                payment,
                payment === "SHOPKUPAY" ? "paid" : "pending",
                total,
            ],
        );
        const order = orderResult.rows[0];
        const orderItems = [];
        for (const item of requested) {
            const product = products.get(item.product_id)!;
            const itemResult = await client.query(
                "INSERT INTO order_items (order_id, product_id, quantity, price_at_purchase, name_snapshot) VALUES ($1, $2, $3, $4, $5) RETURNING id, product_id, quantity, price_at_purchase, name_snapshot",
                [
                    order.id,
                    item.product_id,
                    item.quantity,
                    product.price,
                    product.name,
                ],
            );
            orderItems.push(itemResult.rows[0]);
        }
        await client.query("COMMIT");
        return NextResponse.json({
            success: true,
            data: { ...order, items: orderItems },
        });
    } catch (error) {
        await client.query("ROLLBACK");
        console.error("Order error:", error);
        return NextResponse.json(
            { success: false, message: "Failed to create order" },
            { status: 500 },
        );
    } finally {
        client.release();
    }
}
