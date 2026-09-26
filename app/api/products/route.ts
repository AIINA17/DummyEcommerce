import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/lib/db";

export async function GET(request: NextRequest) {
    try {
        // Ambil query parameters
        const { searchParams } = new URL(request.url);
        const q = searchParams.get("q")?.toLowerCase() || "";
        const category = searchParams.get("category") || "";
        const min = searchParams.get("min") || "";
        const max = searchParams.get("max") || "";
        const rating = searchParams.get("rating") || "";
        const sort = searchParams.get("sort") || "";

        const values: (string | number)[] = [];
        const conditions: string[] = [];
        if (q) {
            values.push(`%${q}%`);
            conditions.push(
                `(name ILIKE $${values.length} OR description ILIKE $${values.length})`,
            );
        }
        if (category) {
            values.push(category);
            conditions.push(`category = $${values.length}`);
        }
        const minPrice = parseInt(min);
        if (min && Number.isFinite(minPrice)) {
            values.push(minPrice);
            conditions.push(`price >= $${values.length}`);
        }
        const maxPrice = parseInt(max);
        if (max && Number.isFinite(maxPrice)) {
            values.push(maxPrice);
            conditions.push(`price <= $${values.length}`);
        }
        const minRating = parseFloat(rating);
        if (rating && Number.isFinite(minRating)) {
            values.push(minRating);
            conditions.push(`rating >= $${values.length}`);
        }
        const orderBy =
            sort === "price_asc"
                ? "price ASC"
                : sort === "price_desc"
                  ? "price DESC"
                  : sort === "rating_desc"
                    ? "rating DESC"
                    : "id ASC";
        const where = conditions.length
            ? `WHERE ${conditions.join(" AND ")}`
            : "";
        const { rows: data } = await pool.query(
            `SELECT * FROM products ${where} ORDER BY ${orderBy}`,
            values,
        );

        return NextResponse.json({
            success: true,
            data,
        });
    } catch (error) {
        console.error("Server error:", error);
        return NextResponse.json(
            {
                success: false,
                error: "Internal server error",
            },
            { status: 500 },
        );
    }
}
