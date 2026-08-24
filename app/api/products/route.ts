//app/api/products/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Buat Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

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

    // Mulai query ke Supabase
    let query = supabase.from("products").select("*");

    // Filter by search query (nama produk DAN deskripsi)
    // Pake OR filter untuk search di multiple columns.
    // PostgREST's filter DSL treats `,` `(` `)` `:` as syntax, not literal
    // characters — so a search query containing them could otherwise inject
    // extra filter conditions. Per PostgREST's own escaping rule, a value
    // with reserved characters must be wrapped in double quotes, with `"`
    // and `\` inside it backslash-escaped.
    if (q) {
      const escaped = q.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
      const safeQ = `"%${escaped}%"`;
      query = query.or(`name.ilike.${safeQ},description.ilike.${safeQ}`);
    }

    // Filter by category
    if (category) {
      query = query.eq("category", category);
    }

    // Filter by min price
    const minPrice = parseInt(min);
    if (min && Number.isFinite(minPrice)) {
      query = query.gte("price", minPrice);
    }

    // Filter by max price
    const maxPrice = parseInt(max);
    if (max && Number.isFinite(maxPrice)) {
      query = query.lte("price", maxPrice);
    }

    // Filter by minimum rating
    const minRating = parseFloat(rating);
    if (rating && Number.isFinite(minRating)) {
      query = query.gte("rating", minRating);
    }

    // Sorting
    switch (sort) {
      case "price_asc":
        query = query.order("price", { ascending: true });
        break;
      case "price_desc":
        query = query.order("price", { ascending: false });
        break;
      case "rating_desc":
        query = query.order("rating", { ascending: false });
        break;
      default:
        query = query.order("id", { ascending: true });
    }

    // Execute query
    const { data, error } = await query;

    if (error) {
      console.error("Supabase error:", error);
      return NextResponse.json({ 
        success: false, 
        error: error.message 
      }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true, 
      data: data || [] 
    });

  } catch (error) {
    console.error("Server error:", error);
    return NextResponse.json({ 
      success: false, 
      error: "Internal server error" 
    }, { status: 500 });
  }
}