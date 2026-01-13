// FILE: lib/jwt.ts
// Helper untuk verify JWT token

import jwt from "jsonwebtoken";
import { NextRequest } from "next/server";

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