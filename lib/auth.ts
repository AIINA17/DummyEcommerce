import type { NextAuthOptions } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcrypt";

import { pool } from "@/lib/db";

export const authOptions: NextAuthOptions = {
    providers: [
        Credentials({
            name: "Credentials",
            credentials: {
                username: { label: "Username", type: "text" },
                password: { label: "Password", type: "password" },
            },
            async authorize(credentials) {
                if (!credentials?.username || !credentials.password)
                    return null;

                const result = await pool.query(
                    "SELECT id, username, password FROM users WHERE username = $1",
                    [credentials.username]
                );

                const user = result.rows[0];
                if (!user) return null;

                const valid = await bcrypt.compare(
                    credentials.password,
                    user.password
                );
                if (!valid) return null;

                return {
                    id: String(user.id),
                    name: user.username,
                };
            },
        }),
    ],
    session: {
        strategy: "jwt",
    },
    callbacks: {
        async jwt({ token, user }) {
            if (user?.id) {
                token.userId = String(user.id);
            }
            return token;
        },
        async session({ session, token }) {
            if (session.user) {
                session.user.id =
                    (token.userId as string | undefined) ??
                    (typeof token.sub === "string" ? token.sub : "");
            }
            return session;
        },
    },
    secret: process.env.NEXTAUTH_SECRET,
};
