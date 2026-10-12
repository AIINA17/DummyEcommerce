import { NextResponse } from "next/server";
import { pool } from "@/lib/db";

export async function GET(
  req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const { id } = await ctx.params;
  const productId = Number(id);

  const { rows } = await pool.query(
    `SELECT
            p.*,
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
         WHERE p.id = $1`,
    [productId],
  );
  const data = rows[0];

  if (!data) {
    return NextResponse.json(
      { success: false, message: "Product not found" },
      { status: 404 },
    );
  }

  const { rows: reviews } = await pool.query(
    `SELECT id, product_id, reviewer_name, rating, comment, created_at
         FROM product_reviews
         WHERE product_id = $1
         ORDER BY created_at DESC`,
    [productId],
  );

  return NextResponse.json({
    success: true,
    data: {
      ...data,
      reviews,
    },
  });
}
