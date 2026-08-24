import { pool } from "@/lib/db"
import bcrypt from "bcrypt"

export async function POST(req: Request) {
  try {
    const { username, password } = await req.json()

    if (!username || !password) {
      return Response.json(
        { success: false, message: "Username dan password wajib diisi" },
        { status: 400 }
      )
    }

    if (password.length < 6) {
      return Response.json(
        { success: false, message: "Password minimal 6 karakter" },
        { status: 400 }
      )
    }

    // Cek apakah user sudah ada
    const existingUser = await pool.query(
      "SELECT id FROM users WHERE username = $1",
      [username]
    )

    if (existingUser.rows.length > 0) {
      return Response.json(
        { success: false, message: "Username sudah digunakan" },
        { status: 409 }
      )
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10)

    // Insert user baru
    await pool.query(
      "INSERT INTO users (username, password) VALUES ($1, $2)",
      [username, hashedPassword]
    )

    return Response.json({ success: true })
  } catch (error: unknown) {
    console.error("Register error:", error)
    return Response.json(
      { success: false, message: "Server error" },
      { status: 500 }
    )
  }
}
