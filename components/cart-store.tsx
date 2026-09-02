"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useSession } from "next-auth/react";

import type { CartItem } from "@/lib/types";

interface CartStore {
  items: CartItem[];
  count: number;
  loading: boolean;
  refresh: () => Promise<void>;
  add: (productId: number, quantity?: number) => Promise<boolean>;
  setQuantity: (cartId: number, quantity: number) => Promise<void>;
  remove: (cartId: number) => Promise<void>;
}

const Ctx = createContext<CartStore | null>(null);

/**
 * Satu sumber kebenaran untuk keranjang.
 *
 * Sebelumnya Navbar melakukan polling `/api/cart` tiap 10 detik hanya untuk
 * menjaga angka di badge tetap benar — request terus-menerus, dan angkanya
 * tetap bisa basi sampai 10 detik setelah user menambah barang. Sekarang
 * setiap aksi yang mengubah keranjang langsung menyegarkan state ini, jadi
 * badge-nya benar seketika dan tidak ada request menganggur.
 */
export function CartProvider({ children }: { children: React.ReactNode }) {
  const { status } = useSession();
  const [items, setItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Semua setState ada di dalam callback promise, bukan di badan effect —
  // setState sinkron di effect memicu render berantai.
  const load = useCallback((signal?: AbortSignal) => {
    return fetch("/api/cart", { signal })
      .then((r) => (r.ok ? r.json() : { success: false }))
      .then((json) => setItems(json.success ? (json.data ?? []) : []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    // status "loading" = NextAuth belum tahu user login atau tidak. Menembak
    // /api/cart di titik itu selalu balik 401 dan bikin badge berkedip 0.
    if (status === "loading") return;

    const controller = new AbortController();
    void load(controller.signal);
    return () => controller.abort();
  }, [status, load]);

  const refresh = useCallback(() => load(), [load]);

  const add = useCallback(
    async (productId: number, quantity = 1) => {
      const res = await fetch("/api/cart", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ product_id: productId, quantity }),
      });
      if (res.ok) await refresh();
      return res.ok;
    },
    [refresh]
  );

  const setQuantity = useCallback(
    async (cartId: number, quantity: number) => {
      // Optimistis: stepper jumlah harus terasa instan. Kalau server menolak,
      // refresh() di bawah mengembalikan angka yang benar.
      setItems((prev) =>
        quantity <= 0
          ? prev.filter((i) => i.id !== cartId)
          : prev.map((i) => (i.id === cartId ? { ...i, quantity } : i))
      );
      await fetch("/api/cart", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cart_id: cartId, quantity }),
      });
      await refresh();
    },
    [refresh]
  );

  const remove = useCallback(
    async (cartId: number) => {
      setItems((prev) => prev.filter((i) => i.id !== cartId));
      await fetch(`/api/cart?cart_id=${cartId}`, { method: "DELETE" });
      await refresh();
    },
    [refresh]
  );

  const value = useMemo<CartStore>(
    () => ({
      items,
      count: items.reduce((n, i) => n + i.quantity, 0),
      loading,
      refresh,
      add,
      setQuantity,
      remove,
    }),
    [items, loading, refresh, add, setQuantity, remove]
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useCart(): CartStore {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useCart harus dipakai di dalam <CartProvider>");
  return ctx;
}
