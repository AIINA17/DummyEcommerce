import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/lib/db";
import { getAuthUserId } from "@/lib/jwt";

// =====================================================
// GET - Ambil data profile user yang sedang login (termasuk balance)
// =====================================================
export async function GET(request: NextRequest) {
    try {
        const userId = await getAuthUserId(request);

        if (!userId) {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 },
            );
        }

        const { rows } = await pool.query(
            "SELECT id, username, email, phone, address, avatar_url, balance, created_at FROM users WHERE id = $1",
            [userId],
        );
        const data = rows[0];

        if (!data) {
            return NextResponse.json(
                { error: "User not found" },
                { status: 404 },
            );
        }

        return NextResponse.json({ success: true, data });
    } catch (error) {
        console.error("Server error:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 },
        );
    }
}

// =====================================================
// PUT - Update data profile user yang sedang login
// =====================================================
export async function PUT(request: NextRequest) {
    try {
        const userId = await getAuthUserId(request);

        if (!userId) {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 },
            );
        }

        const body = await request.json();
        const { username, email, phone, address } = body;

        // Buat object update (hanya field yang ada)
        const updateData: Record<string, string> = {};
        if (username !== undefined) updateData.username = username;
        if (email !== undefined) updateData.email = email;
        if (phone !== undefined) updateData.phone = phone;
        if (address !== undefined) updateData.address = address;

        const fields = Object.keys(updateData);
        const values = Object.values(updateData);
        if (fields.length === 0) {
            return NextResponse.json(
                { error: "Tidak ada data untuk diperbarui" },
                { status: 400 },
            );
        }
        const assignments = fields
            .map((field, index) => `${field} = $${index + 1}`)
            .join(", ");
        try {
            const { rows } = await pool.query(
                `UPDATE users SET ${assignments} WHERE id = $${values.length + 1} RETURNING id, username, email, phone, address, avatar_url, balance, created_at`,
                [...values, userId],
            );
            const data = rows[0];
            if (!data)
                return NextResponse.json(
                    { error: "User not found" },
                    { status: 404 },
                );
            return NextResponse.json({
                success: true,
                data,
                message: "Profile updated successfully",
            });
        } catch (error: unknown) {
            const message =
                error instanceof Error &&
                "code" in error &&
                error.code === "23505"
                    ? "Username sudah digunakan"
                    : "Gagal memperbarui profil";
            return NextResponse.json({ error: message }, { status: 409 });
        }
    } catch (error) {
        console.error("Server error:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 },
        );
    }
}
