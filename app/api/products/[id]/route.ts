import { NextResponse } from "next/server";
import productsData from "../../../../data/products.json";

export async function GET(
  req: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  const { id } = await ctx.params;

  const numericId = Number(id);

  const products = productsData as any[];

  const product = products.find(p => p.id === numericId);

  if (!product) {
    return NextResponse.json(
      { success: false, message: "Product not found" },
      { status: 404 }
    );
  }

  return NextResponse.json({
    success: true,
    data: product
  });
}
