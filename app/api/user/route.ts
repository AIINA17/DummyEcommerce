import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { verifyToken } from "@/lib/jwt";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// Helper: Get user_id from JWT token OR query param
function getUserId(req: NextRequest): number | null {
  // 1. Check JWT token first
  const jwtPayload = verifyToken(req);
  if (jwtPayload?.userId) {
    return jwtPayload.userId;
  }

  // 2. Fallback to query param
  const { searchParams } = new URL(req.url);
  const userIdParam = searchParams.get("user_id");
  if (userIdParam) {
    return parseInt(userIdParam);
  }

  return null;
}

// =====================================================
// GET - Ambil data profile user (termasuk balance)
// =====================================================
export async function GET(request: NextRequest) {
  try {
    const userId = getUserId(request);

    if (!userId) {
      return NextResponse.json({ error: "user_id is required" }, { status: 400 });
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
// PUT - Update data profile user
// =====================================================
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { user_id, username, email, phone, address } = body;

    if (!user_id) {
      return NextResponse.json({ error: "user_id is required" }, { status: 400 });
    }

    // Buat object update (hanya field yang ada)
    const updateData: Record<string, string> = {};
    if (username !== undefined) updateData.username = username;
    if (email !== undefined) updateData.email = email;
    if (phone !== undefined) updateData.phone = phone;
    if (address !== undefined) updateData.address = address;

    const { data, error } = await supabase
      .from("users")
      .update(updateData)
      .eq("id", user_id)
      .select("id, username, email, phone, address, avatar_url, balance, created_at")
      .single();

    if (error) {
      console.error("Supabase error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, data, message: "Profile updated successfully" });
  } catch (error) {
    console.error("Server error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}