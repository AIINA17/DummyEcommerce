import NextAuth from "next-auth"
import Credentials from "next-auth/providers/credentials"
import { pool } from "@/lib/db"
import bcrypt from "bcrypt"

const handler = NextAuth({
  providers: [
    Credentials({
      name: "Credentials",
      credentials: {
        username: { label: "Username", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.username || !credentials.password) {
          return null
        }

        const result = await pool.query(
          "SELECT id, username, password FROM users WHERE username = $1",
          [credentials.username]
        )

        const user = result.rows[0]
        if (!user) return null

        const valid = await bcrypt.compare(
          credentials.password,
          user.password
        )

        if (!valid) return null

        return {
          id: user.id,
          name: user.username,
        }
      },
    }),
  ],
  session: {
    strategy: "jwt",
  },
  secret: process.env.NEXTAUTH_SECRET,
})

export { handler as GET, handler as POST }
