import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getAuthUserId } from "@/lib/jwt";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// =====================================================
// GET - Ambil data profile user yang sedang login (termasuk balance)
// =====================================================
export async function GET(request: NextRequest) {
  try {
    const userId = await getAuthUserId(request);

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data, error } = await supabase
      .from("users")
      .select("id, username, email, phone, address, avatar_url, balance, created_at")
      .eq("id", userId)
      .single();

    if (error) {
      console.error("Supabase error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!data) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error("Server error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// =====================================================
// PUT - Update data profile user yang sedang login
// =====================================================
export async function PUT(request: NextRequest) {
  try {
    const userId = await getAuthUserId(request);

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { username, email, phone, address } = body;

    // Buat object update (hanya field yang ada)
    const updateData: Record<string, string> = {};
    if (username !== undefined) updateData.username = username;
    if (email !== undefined) updateData.email = email;
    if (phone !== undefined) updateData.phone = phone;
    if (address !== undefined) updateData.address = address;

    const { data, error } = await supabase
      .from("users")
      .update(updateData)
      .eq("id", userId)
      .select("id, username, email, phone, address, avatar_url, balance, created_at")
      .single();

    if (error) {
      console.error("Supabase error:", error);
      const message = error.code === "23505"
        ? "Username sudah digunakan"
        : "Gagal memperbarui profil";
      return NextResponse.json({ error: message }, { status: 409 });
    }

    return NextResponse.json({ success: true, data, message: "Profile updated successfully" });
  } catch (error) {
    console.error("Server error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
