import { NextResponse } from "next/server";
import products from "../../../data/products.json";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);

  const q = searchParams.get("q")?.toLowerCase() || "";
  const category = searchParams.get("category") || "";
  const min = Number(searchParams.get("min") || 0);
  const max = Number(searchParams.get("max") || 999999999);
  const rating = Number(searchParams.get("rating") || 0);
  const sort = searchParams.get("sort") || "";

  let result = [...(products as any[])];

  // SEARCH
  if (q) {
    result = result.filter(p =>
      p.name.toLowerCase().includes(q)
    );
  }

  // CATEGORY FILTER
  if (category) {
    result = result.filter(p => p.category === category);
  }

  // PRICE RANGE FILTER
  result = result.filter(p => p.price >= min && p.price <= max);

  // RATING FILTER
  result = result.filter(p => p.rating >= rating);

  // SORTING
  if (sort === "price_asc") result.sort((a, b) => a.price - b.price);
  if (sort === "price_desc") result.sort((a, b) => b.price - a.price);
  if (sort === "rating_desc") result.sort((a, b) => b.rating - a.rating);

  return NextResponse.json({
    success: true,
    data: result
  });
}
