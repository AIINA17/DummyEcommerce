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
        `(p.name ILIKE $${values.length} OR p.description ILIKE $${values.length})`,
      );
    }
    if (category) {
      values.push(category);
      conditions.push(`p.category = $${values.length}`);
    }
    const minPrice = parseInt(min);
    if (min && Number.isFinite(minPrice)) {
      values.push(minPrice);
      conditions.push(`p.price >= $${values.length}`);
    }
    const maxPrice = parseInt(max);
    if (max && Number.isFinite(maxPrice)) {
      values.push(maxPrice);
      conditions.push(`p.price <= $${values.length}`);
    }
    const minRating = parseFloat(rating);
    if (rating && Number.isFinite(minRating)) {
      values.push(minRating);
      conditions.push(`COALESCE(rv.avg_rating, p.rating) >= $${values.length}`);
    }
    const orderBy =
      sort === "price_asc"
        ? "p.price ASC"
        : sort === "price_desc"
          ? "p.price DESC"
          : sort === "rating_desc"
            ? "COALESCE(rv.avg_rating, p.rating) DESC"
            : "p.id ASC";
    const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";
    const { rows: data } = await pool.query(
      `SELECT
                p.id,
                p.name,
                p.description,
                p.price,
                p.category,
                p.stock,
                p.image_url,
                p.store_id,
                p.created_at,
                COALESCE(rv.avg_rating, p.rating) AS rating,
                CASE WHEN s.id IS NOT NULL THEN
                    json_build_object(
                        'id', s.id,
                        'name', s.name,
                        'city', s.city,
                        'address', s.address,
                        'created_at', s.created_at
                    )
                ELSE NULL END AS store
             FROM products p
             LEFT JOIN stores s ON s.id = p.store_id
             LEFT JOIN (
                 SELECT product_id, ROUND(AVG(rating)::numeric, 1) AS avg_rating
                 FROM product_reviews
                 GROUP BY product_id
             ) rv ON rv.product_id = p.id
             ${where}
             ORDER BY ${orderBy}`,
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
