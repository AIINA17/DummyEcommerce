import { NextResponse } from "next/server";
import { pool } from "@/lib/db";

export async function GET(
    req: Request,
    ctx: { params: Promise<{ id: string }> },
) {
    const { id } = await ctx.params;

    const { rows } = await pool.query("SELECT * FROM products WHERE id = $1", [
        Number(id),
    ]);
    const data = rows[0];

    if (!data) {
        return NextResponse.json(
            { success: false, message: "Product not found" },
            { status: 404 },
        );
    }

    return NextResponse.json({
        success: true,
        data,
    });
}
