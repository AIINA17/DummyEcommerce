import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { pool } from "@/lib/db";
import { getAuthUserId } from "@/lib/jwt";
import { SERVICE_FEE } from "@/lib/constants";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function toPositiveInt(value: unknown): number | null {
  const n = typeof value === "string" ? Number(value) : value;
  if (typeof n !== "number" || !Number.isFinite(n) || !Number.isInteger(n) || n <= 0) {
    return null;
  }
  return n;
}

type RequestedItem = { product_id: number; quantity: number };

// Kembalikan stok yang sudah terlanjur dikurangi (dipakai saat rollback).
async function restoreStock(reserved: { product_id: number; quantity: number }[]) {
  for (const item of reserved) {
    try {
      await pool.query("UPDATE products SET stock = stock + $1 WHERE id = $2", [
        item.quantity,
        item.product_id,
      ]);
    } catch (err) {
      console.error("Failed to restore stock:", err);
    }
  }
}

// Kembalikan saldo ShopKu Pay yang sudah terlanjur dipotong (dipakai saat rollback).
async function restoreBalance(userId: number, amount: number) {
  const { data: current } = await supabase
    .from("users")
    .select("balance")
    .eq("id", userId)
    .single();
  if (current) {
    const { error } = await supabase
      .from("users")
      .update({ balance: Number(current.balance) + amount })
      .eq("id", userId);
    if (error) console.error("Failed to restore balance:", error);
  }
}

// GET orders of logged-in user
export async function GET(req: NextRequest) {
  const user_id = await getAuthUserId(req);

  if (!user_id) {
    return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
  }

  const { data, error } = await supabase
    .from("orders")
    .select(
      `
      *,
      order_items (
        id,
        product_id,
        quantity,
        price_at_purchase,
        name_snapshot
      )
      `
    )
    .eq("user_id", user_id)
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true, data: data || [] });
}

// POST create new order
export async function POST(req: NextRequest) {
  const user_id = await getAuthUserId(req);

  if (!user_id) {
    return NextResponse.json(
      { success: false, message: "Unauthorized" },
      { status: 401 }
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { success: false, message: "Invalid JSON body" },
      { status: 400 }
    );
  }

  if (!isRecord(body)) {
    return NextResponse.json(
      { success: false, message: "Invalid JSON body" },
      { status: 400 }
    );
  }

  const items_raw = body.items;
  const payment_method_raw = body.payment_method;

  if (!Array.isArray(items_raw) || items_raw.length === 0) {
    return NextResponse.json(
      { success: false, message: "No items provided" },
      { status: 400 }
    );
  }

  // Hanya percaya product_id & quantity dari client. Harga & nama produk
  // SELALU diambil dari database di bawah — jangan pernah pakai price/name
  // yang dikirim client, supaya request yang dimodifikasi tidak bisa
  // membeli barang dengan harga sembarangan.
  const requested: RequestedItem[] = [];
  for (const raw of items_raw) {
    if (!isRecord(raw)) {
      return NextResponse.json(
        { success: false, message: "Invalid items payload" },
        { status: 400 }
      );
    }
    const product_id = toPositiveInt(raw.product_id);
    const quantity = toPositiveInt(raw.quantity);
    if (!product_id || !quantity) {
      return NextResponse.json(
        { success: false, message: "Invalid items payload" },
        { status: 400 }
      );
    }
    requested.push({ product_id, quantity });
  }

  const payment_method =
    typeof payment_method_raw === "string" && payment_method_raw.trim() !== ""
      ? payment_method_raw
      : undefined;

  const normalizedPayment = payment_method?.toUpperCase().replace(/\s/g, "_");

  // Ambil harga, nama, dan stok TERKINI dari database (bukan dari client).
  const productIds = requested.map((i) => i.product_id);
  const { data: products, error: productsError } = await supabase
    .from("products")
    .select("id, name, price, stock")
    .in("id", productIds);

  if (productsError) {
    return NextResponse.json(
      { success: false, message: productsError.message },
      { status: 500 }
    );
  }

  const productById = new Map((products || []).map((p) => [p.id, p]));
  for (const item of requested) {
    const product = productById.get(item.product_id);
    if (!product) {
      return NextResponse.json(
        { success: false, message: `Produk ${item.product_id} tidak ditemukan` },
        { status: 404 }
      );
    }
    if (product.stock < item.quantity) {
      return NextResponse.json(
        { success: false, message: `Stok "${product.name}" tidak mencukupi` },
        { status: 400 }
      );
    }
  }

  const itemsTotal = requested.reduce((sum, item) => {
    const product = productById.get(item.product_id)!;
    return sum + Number(product.price) * item.quantity;
  }, 0);
  const total = itemsTotal + SERVICE_FEE;

  // Kurangi stok secara atomic per produk (guard "stock >= quantity" di level
  // SQL supaya aman dari race condition dua request yang datang bersamaan).
  // Kalau salah satu gagal, kembalikan stok yang sudah sempat dikurangi.
  const reserved: { product_id: number; quantity: number }[] = [];
  for (const item of requested) {
    const result = await pool.query(
      "UPDATE products SET stock = stock - $1 WHERE id = $2 AND stock >= $1 RETURNING stock",
      [item.quantity, item.product_id]
    );
    if (result.rowCount === 0) {
      await restoreStock(reserved);
      const product = productById.get(item.product_id)!;
      return NextResponse.json(
        { success: false, message: `Stok "${product.name}" tidak mencukupi` },
        { status: 400 }
      );
    }
    reserved.push(item);
  }

  // ShopKu Pay logic
  let balanceDeducted = false;
  if (normalizedPayment === "SHOPKUPAY") {
    const { data: user, error: userError } = await supabase
      .from("users")
      .select("balance")
      .eq("id", user_id)
      .single();

    if (userError || !user) {
      await restoreStock(reserved);
      return NextResponse.json(
        { success: false, message: "User not found" },
        { status: 404 }
      );
    }

    const balance = Number(user.balance);

    if (balance < total) {
      await restoreStock(reserved);
      return NextResponse.json(
        { success: false, message: "Insufficient ShopKu Pay balance" },
        { status: 400 }
      );
    }

    const { error: updateError } = await supabase
      .from("users")
      .update({ balance: balance - total })
      .eq("id", user_id);

    if (updateError) {
      await restoreStock(reserved);
      return NextResponse.json(
        { success: false, message: updateError.message },
        { status: 500 }
      );
    }
    balanceDeducted = true;
  }

  // Create order
  const { data: order, error: orderError } = await supabase
    .from("orders")
    .insert({
      user_id,
      payment_method: normalizedPayment || "UNSELECTED",
      status: normalizedPayment === "SHOPKUPAY" ? "paid" : "pending",
      total,
    })
    .select()
    .single();

  if (orderError) {
    await restoreStock(reserved);
    if (balanceDeducted) await restoreBalance(user_id, total);
    return NextResponse.json(
      { success: false, message: orderError.message },
      { status: 500 }
    );
  }

  const orderItems = requested.map((item) => {
    const product = productById.get(item.product_id)!;
    return {
      order_id: order.id,
      product_id: item.product_id,
      quantity: item.quantity,
      price_at_purchase: product.price,
      name_snapshot: product.name,
    };
  });

  const { error: itemsError } = await supabase
    .from("order_items")
    .insert(orderItems);

  if (itemsError) {
    await supabase.from("orders").delete().eq("id", order.id);
    await restoreStock(reserved);
    if (balanceDeducted) await restoreBalance(user_id, total);
    return NextResponse.json(
      { success: false, message: itemsError.message },
      { status: 500 }
    );
  }

  return NextResponse.json({
    success: true,
    data: { ...order, items: orderItems },
  });
}
