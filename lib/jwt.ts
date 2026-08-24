// FILE: lib/jwt.ts
// Helper untuk verify JWT token & resolve user yang sedang login

import jwt from "jsonwebtoken";
import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

const JWT_SECRET = process.env.NEXTAUTH_SECRET || process.env.JWT_SECRET;

export interface JWTPayload {
  userId: number;
  username: string;
}

export function verifyToken(req: NextRequest): JWTPayload | null {
  try {
    const authHeader = req.headers.get("authorization");

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return null;
    }

    const token = authHeader.split(" ")[1];

    if (!JWT_SECRET) {
      console.error("JWT_SECRET not configured");
      return null;
    }

    const decoded = jwt.verify(token, JWT_SECRET) as JWTPayload;
    return decoded;

  } catch (error) {
    console.error("JWT verification failed:", error);
    return null;
  }
}

/**
 * Resolves the authenticated user's id from the JWT bearer token (used by
 * API clients / the AI agent) or, failing that, the NextAuth session cookie
 * (used by the website). Never trusts a client-supplied user_id — a request
 * with neither a valid token nor a valid session is unauthenticated.
 */
export async function getAuthUserId(req: NextRequest): Promise<number | null> {
  const jwtPayload = verifyToken(req);
  if (jwtPayload?.userId) {
    return jwtPayload.userId;
  }

  const session = await getServerSession(authOptions);
  if (session?.user?.id) {
    return Number(session.user.id);
  }

  return null;
}