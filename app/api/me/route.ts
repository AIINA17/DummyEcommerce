import { NextResponse } from "next/server";
import { pool } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET() {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
        return NextResponse.json({ success: false }, { status: 401 });
    }

    const { rows } = await pool.query(
        "SELECT username, balance FROM users WHERE id = $1",
        [session.user.id],
    );
    const data = rows[0];

    if (!data) {
        return NextResponse.json(
            { success: false, message: "User not found" },
            { status: 404 },
        );
    }

    return NextResponse.json({ success: true, data });
}
