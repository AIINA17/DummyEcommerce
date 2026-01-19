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

    // Filter by search query (nama produk)
    if (q) {
      query = query.ilike("name", `%${q}%`);
    }

    // Filter by category
    if (category) {
      query = query.eq("category", category);
    }

    // Filter by min price
    if (min) {
      query = query.gte("price", parseInt(min));
    }

    // Filter by max price
    if (max) {
      query = query.lte("price", parseInt(max));
    }

    // Filter by minimum rating
    if (rating) {
      query = query.gte("rating", parseFloat(rating));
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