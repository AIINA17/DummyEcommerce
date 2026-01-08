import { NextResponse } from "next/server";
import { orders } from "../data";

export async function GET() {
  return NextResponse.json({
    success: true,
    data: orders
  });
}
