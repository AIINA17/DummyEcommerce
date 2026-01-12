import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// =====================================================
// GET - Ambil semua item di cart user
// =====================================================
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("user_id");

    if (!userId) {
      return NextResponse.json({ error: "user_id is required" }, { status: 400 });
    }

    // Ambil cart items dengan join ke tabel products
    const { data, error } = await supabase
      .from("cart")
      .select(`
        *,
        products (*)
      `)
      .eq("user_id", parseInt(userId))
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Supabase error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data: data || [] });
  } catch (error) {
    console.error("Server error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// =====================================================
// POST - Tambah item ke cart
// =====================================================
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { user_id, product_id, quantity = 1 } = body;

    if (!user_id || !product_id) {
      return NextResponse.json(
        { error: "user_id and product_id are required" },
        { status: 400 }
      );
    }

    // Cek apakah product sudah ada di cart
    const { data: existing } = await supabase
      .from("cart")
      .select("*")
      .eq("user_id", user_id)
      .eq("product_id", product_id)
      .single();

    if (existing) {
      // Kalau sudah ada, update quantity
      const { data, error } = await supabase
        .from("cart")
        .update({ quantity: existing.quantity + quantity })
        .eq("id", existing.id)
        .select()
        .single();

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      return NextResponse.json({ data, message: "Quantity updated" });
    } else {
      // Kalau belum ada, insert baru
      const { data, error } = await supabase
        .from("cart")
        .insert({ user_id, product_id, quantity })
        .select()
        .single();

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      return NextResponse.json({ data, message: "Added to cart" });
    }
  } catch (error) {
    console.error("Server error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// =====================================================
// PUT - Update quantity item di cart
// =====================================================
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { cart_id, quantity } = body;

    if (!cart_id || quantity === undefined) {
      return NextResponse.json(
        { error: "cart_id and quantity are required" },
        { status: 400 }
      );
    }

    // Kalau quantity 0 atau kurang, hapus item
    if (quantity <= 0) {
      const { error } = await supabase
        .from("cart")
        .delete()
        .eq("id", cart_id);

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      return NextResponse.json({ message: "Item removed from cart" });
    }

    // Update quantity
    const { data, error } = await supabase
      .from("cart")
      .update({ quantity })
      .eq("id", cart_id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data, message: "Quantity updated" });
  } catch (error) {
    console.error("Server error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// =====================================================
// DELETE - Hapus item dari cart
// =====================================================
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const cartId = searchParams.get("cart_id");

    if (!cartId) {
      return NextResponse.json({ error: "cart_id is required" }, { status: 400 });
    }

    const { error } = await supabase
      .from("cart")
      .delete()
      .eq("id", parseInt(cartId));

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ message: "Item removed from cart" });
  } catch (error) {
    console.error("Server error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}