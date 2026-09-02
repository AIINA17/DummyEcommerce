"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { MapPin, ShoppingCart, Truck } from "lucide-react";
import { toast } from "sonner";

import { useCart } from "@/components/cart-store";
import { OrderSummary } from "@/components/order/OrderSummary";
import { PaymentMethodPicker } from "@/components/order/PaymentMethodPicker";
import { EmptyState } from "@/components/shared/EmptyState";
import { PageHeader } from "@/components/shared/PageHeader";
import { Button } from "@/components/ui/button";
import { SERVICE_FEE } from "@/lib/constants";
import { formatIDR, productImage } from "@/lib/format";
import type { UserData } from "@/lib/types";

function CheckoutView() {
  const router = useRouter();
  const params = useSearchParams();
  const { status } = useSession();
  const { items, loading, refresh } = useCart();

  const [user, setUser] = useState<UserData | null>(null);
  const [payment, setPayment] = useState("ShopKuPay");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (status === "unauthenticated") router.replace("/login?callbackUrl=/cart");
  }, [status, router]);

  useEffect(() => {
    if (status !== "authenticated") return;
    const controller = new AbortController();
    fetch("/api/user", { signal: controller.signal })
      .then((r) => (r.ok ? r.json() : null))
      .then((j) => j?.success && setUser(j.data))
      .catch(() => {});
    return () => controller.abort();
  }, [status]);

  // ?items=1,2 memilih baris keranjang tertentu. Tanpa parameter itu, seluruh
  // keranjang yang di-checkout.
  const selectedIds = useMemo(() => {
    const raw = params.get("items");
    if (!raw) return null;
    return raw.split(",").map(Number).filter(Number.isInteger);
  }, [params]);

  const chosen = useMemo(
    () => (selectedIds ? items.filter((i) => selectedIds.includes(i.id)) : items),
    [items, selectedIds]
  );

  const subtotal = chosen.reduce(
    (sum, i) => sum + Number(i.products.price) * i.quantity,
    0
  );
  const total = subtotal + SERVICE_FEE;
  const balance = user ? Number(user.balance) : null;
  const walletShort = payment === "ShopKuPay" && balance !== null && balance < total;

  async function submit() {
    setSubmitting(true);
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: chosen.map((i) => ({
            product_id: i.product_id,
            quantity: i.quantity,
          })),
          payment_method: payment,
        }),
      });
      const json = await res.json();

      if (!res.ok || !json.success) {
        toast.error(json.message ?? "Gagal membuat pesanan");
        return;
      }

      // Bersihkan hanya baris yang benar-benar jadi pesanan; barang lain di
      // keranjang tidak ikut terhapus.
      await Promise.all(
        chosen.map((i) =>
          fetch(`/api/cart?cart_id=${i.id}`, { method: "DELETE" }).catch(() => {})
        )
      );
      await refresh();

      toast.success("Pesanan dibuat");
      router.push(`/order/${json.data.id}`);
    } finally {
      setSubmitting(false);
    }
  }

  if (loading && items.length === 0) {
    return (
      <div className="shell grid gap-6 py-8 lg:grid-cols-[1fr_380px]">
        <div className="shimmer h-96 rounded-2xl" />
        <div className="shimmer h-72 rounded-2xl" />
      </div>
    );
  }

  if (chosen.length === 0) {
    return (
      <div className="shell py-16">
        <EmptyState
          icon={ShoppingCart}
          title="Tidak ada barang untuk dibayar"
          body="Pilih dulu barangnya di keranjang, baru lanjut ke pembayaran."
          action={<Button render={<Link href="/cart" />}>Ke keranjang</Button>}
        />
      </div>
    );
  }

  return (
    <div className="shell py-6 md:py-8">
      <PageHeader
        title="Checkout"
        subtitle="Periksa pesananmu sebelum membayar"
        backHref="/cart"
        backLabel="Kembali ke keranjang"
      />

      <div className="grid items-start gap-6 lg:grid-cols-[1fr_380px]">
        <div className="space-y-4">
          <section className="surface p-5">
            <h2 className="flex items-center gap-2 text-[15px]">
              <MapPin aria-hidden className="size-4 text-brand-ink" />
              Alamat pengiriman
            </h2>
            <p className="mt-3 text-[14px] font-semibold">
              {user?.username ?? "—"}
              {user?.phone && (
                <span className="ml-2 font-normal text-ink-3">{user.phone}</span>
              )}
            </p>
            <p className="mt-1 text-[13.5px] leading-relaxed text-ink-3">
              {user?.address || "Alamat belum diisi — lengkapi di halaman profil."}
            </p>
            <Button
              variant="link"
              size="xs"
              className="mt-2 px-0"
              render={<Link href="/profile" />}
            >
              Ubah alamat
            </Button>
          </section>

          <section className="surface p-5">
            <h2 className="text-[15px]">Barang yang dibeli</h2>
            <ul className="mt-4 divide-y divide-line">
              {chosen.map((item) => (
                <li key={item.id} className="flex gap-3 py-3 first:pt-0 last:pb-0">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={productImage(item.product_id, item.products.image_url)}
                    alt=""
                    width={56}
                    height={56}
                    className="size-14 shrink-0 rounded-xl border border-line object-cover"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="clamp-2 text-[13.5px] leading-snug">
                      {item.products.name}
                    </p>
                    <p className="tnum mt-0.5 text-[12.5px] text-ink-3">
                      {item.quantity} × {formatIDR(Number(item.products.price))}
                    </p>
                  </div>
                  <p className="tnum text-[14px] font-bold">
                    {formatIDR(Number(item.products.price) * item.quantity)}
                  </p>
                </li>
              ))}
            </ul>

            <p className="mt-4 flex items-center gap-2 rounded-xl bg-success-soft px-3.5 py-2.5 text-[12.5px] text-ink-2">
              <Truck aria-hidden className="size-4 shrink-0 text-success" />
              <span>
                <b>Reguler</b> — estimasi tiba 2–4 hari, ongkir gratis.
              </span>
            </p>
          </section>

          <section className="surface p-5">
            <h2 className="text-[15px]">Metode pembayaran</h2>
            <div className="mt-4">
              <PaymentMethodPicker
                value={payment}
                onChange={setPayment}
                balance={balance}
                total={total}
              />
            </div>
          </section>
        </div>

        <div className="surface p-5 lg:sticky lg:top-24">
          <h2 className="text-[15px]">Ringkasan transaksi</h2>
          <div className="mt-4">
            <OrderSummary itemCount={chosen.length} subtotal={subtotal} />
          </div>

          <Button
            size="lg"
            className="mt-5 w-full"
            disabled={submitting || walletShort}
            data-testid="pay-button"
            onClick={() => void submit()}
          >
            {submitting ? "Memproses…" : "Bayar sekarang"}
          </Button>

          <p className="mt-3 text-center text-[11.5px] leading-relaxed text-ink-3">
            Ini situs demo. Tidak ada uang sungguhan yang berpindah.
          </p>
        </div>
      </div>
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense
      fallback={
        <div className="shell grid gap-6 py-8 lg:grid-cols-[1fr_380px]">
          <div className="shimmer h-96 rounded-2xl" />
          <div className="shimmer h-72 rounded-2xl" />
        </div>
      }
    >
      <CheckoutView />
    </Suspense>
  );
}
