import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

function toInt(value: string | null, fallback: number): number {
    if (!value) return fallback;
    const n = Number.parseInt(value, 10);
    return Number.isFinite(n) ? n : fallback;
}

// GET all orders (admin / dashboard use)
export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);
    const limit = Math.min(
        Math.max(toInt(searchParams.get("limit"), 50), 1),
        200
    );
    const offset = Math.max(toInt(searchParams.get("offset"), 0), 0);

    const { data: orders, error } = await supabase
        .from("orders")
        .select(
            `
      *,
      order_items (
        id,
        product_id,
        quantity,
        price_at_purchase,
        name_snapshot
      )
    `
        )
        .order("created_at", { ascending: false })
        .range(offset, offset + limit - 1);

    if (error) {
        return NextResponse.json(
            { success: false, message: error.message },
            { status: 500 }
        );
    }

    return NextResponse.json({
        success: true,
        data: orders || [],
        meta: { limit, offset },
    });
}
