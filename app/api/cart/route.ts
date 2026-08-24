//app/api/cart/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getAuthUserId } from "@/lib/jwt";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// =====================================================
// GET - Ambil semua item di cart user yang sedang login
// =====================================================
export async function GET(request: NextRequest) {
  try {
    const userId = await getAuthUserId(request);

    if (!userId) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Ambil cart items dengan join ke tabel products
    const { data, error } = await supabase
      .from("cart")
      .select(`
        *,
        products (*)
      `)
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Supabase error:", error);
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, data: data || [] });
  } catch (error) {
    console.error("Server error:", error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}

// =====================================================
// POST - Tambah item ke cart user yang sedang login
// =====================================================
export async function POST(request: NextRequest) {
  try {
    const userId = await getAuthUserId(request);

    if (!userId) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { product_id, quantity = 1 } = body;

    if (!product_id) {
      return NextResponse.json(
        { success: false, error: "product_id is required" },
        { status: 400 }
      );
    }

    // Cek apakah product sudah ada di cart
    const { data: existing } = await supabase
      .from("cart")
      .select("*")
      .eq("user_id", userId)
      .eq("product_id", product_id)
      .single();

    if (existing) {
      // Kalau sudah ada, update quantity
      const { data, error } = await supabase
        .from("cart")
        .update({ quantity: existing.quantity + quantity })
        .eq("id", existing.id)
        .select(`*, products (*)`)
        .single();

      if (error) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
      }

      return NextResponse.json({ success: true, data, message: "Quantity updated" });
    } else {
      // Kalau belum ada, insert baru
      const { data, error } = await supabase
        .from("cart")
        .insert({ user_id: userId, product_id, quantity })
        .select(`*, products (*)`)
        .single();

      if (error) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
      }

      return NextResponse.json({ success: true, data, message: "Added to cart" });
    }
  } catch (error) {
    console.error("Server error:", error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}

// =====================================================
// PUT - Update quantity item di cart (hanya milik sendiri)
// =====================================================
export async function PUT(request: NextRequest) {
  try {
    const userId = await getAuthUserId(request);

    if (!userId) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { cart_id, quantity } = body;

    if (!cart_id || quantity === undefined) {
      return NextResponse.json(
        { success: false, error: "cart_id and quantity are required" },
        { status: 400 }
      );
    }

    // Pastikan cart item ini benar milik user yang sedang login
    const { data: existing, error: findError } = await supabase
      .from("cart")
      .select("id, user_id")
      .eq("id", cart_id)
      .single();

    if (findError || !existing) {
      return NextResponse.json({ success: false, error: "Cart item not found" }, { status: 404 });
    }
    if (existing.user_id !== userId) {
      return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
    }

    // Kalau quantity 0 atau kurang, hapus item
    if (quantity <= 0) {
      const { error } = await supabase
        .from("cart")
        .delete()
        .eq("id", cart_id);

      if (error) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
      }

      return NextResponse.json({ success: true, message: "Item removed from cart" });
    }

    // Update quantity
    const { data, error } = await supabase
      .from("cart")
      .update({ quantity })
      .eq("id", cart_id)
      .select(`*, products (*)`)
      .single();

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, data, message: "Quantity updated" });
  } catch (error) {
    console.error("Server error:", error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}

// =====================================================
// DELETE - Hapus item dari cart (hanya milik sendiri)
// =====================================================
export async function DELETE(request: NextRequest) {
  try {
    const userId = await getAuthUserId(request);

    if (!userId) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const cartId = searchParams.get("cart_id");

    if (!cartId || !Number.isFinite(parseInt(cartId))) {
      return NextResponse.json({ success: false, error: "cart_id is required" }, { status: 400 });
    }

    // Pastikan cart item ini benar milik user yang sedang login
    const { data: existing, error: findError } = await supabase
      .from("cart")
      .select("id, user_id")
      .eq("id", parseInt(cartId))
      .single();

    if (findError || !existing) {
      return NextResponse.json({ success: false, error: "Cart item not found" }, { status: 404 });
    }
    if (existing.user_id !== userId) {
      return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
    }

    const { error } = await supabase
      .from("cart")
      .delete()
      .eq("id", parseInt(cartId));

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: "Item removed from cart" });
  } catch (error) {
    console.error("Server error:", error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}
