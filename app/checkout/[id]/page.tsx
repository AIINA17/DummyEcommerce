"use client";

import { Suspense, use, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { MapPin, PackageX, Truck } from "lucide-react";
import { toast } from "sonner";

import { OrderSummary } from "@/components/order/OrderSummary";
import { PaymentMethodPicker } from "@/components/order/PaymentMethodPicker";
import { EmptyState } from "@/components/shared/EmptyState";
import { PageHeader } from "@/components/shared/PageHeader";
import { Button } from "@/components/ui/button";
import { SERVICE_FEE } from "@/lib/constants";
import { formatIDR, productImage } from "@/lib/format";
import type { Product, UserData } from "@/lib/types";

function BuyNowView({ id }: { id: string }) {
  const router = useRouter();
  const params = useSearchParams();
  const { status } = useSession();

  const [product, setProduct] = useState<Product | null>(null);
  const [user, setUser] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [payment, setPayment] = useState("ShopKuPay");
  const [submitting, setSubmitting] = useState(false);

  // Jumlah dibawa lewat URL dari halaman produk, lalu dijepit ke stok yang
  // tersedia — angka di URL bisa saja diedit tangan.
  const requestedQty = Math.max(1, Number(params.get("qty")) || 1);
  const qty = product ? Math.min(requestedQty, Math.max(product.stock, 1)) : requestedQty;

  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace(`/login?callbackUrl=/product/${id}`);
    }
  }, [status, router, id]);

  useEffect(() => {
    const controller = new AbortController();
    fetch(`/api/products/${id}`, { signal: controller.signal })
      .then((r) => (r.ok ? r.json() : null))
      .then((j) => setProduct(j?.success ? j.data : null))
      .catch(() => {})
      .finally(() => setLoading(false));
    return () => controller.abort();
  }, [id]);

  useEffect(() => {
    if (status !== "authenticated") return;
    const controller = new AbortController();
    fetch("/api/user", { signal: controller.signal })
      .then((r) => (r.ok ? r.json() : null))
      .then((j) => j?.success && setUser(j.data))
      .catch(() => {});
    return () => controller.abort();
  }, [status]);

  if (loading) {
    return (
      <div className="shell grid gap-6 py-8 lg:grid-cols-[1fr_380px]">
        <div className="shimmer h-96 rounded-2xl" />
        <div className="shimmer h-72 rounded-2xl" />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="shell py-16">
        <EmptyState
          icon={PackageX}
          title="Produk tidak ditemukan"
          body="Produk yang mau dibeli sudah tidak tersedia."
          action={<Button render={<Link href="/" />}>Kembali ke beranda</Button>}
        />
      </div>
    );
  }

  const subtotal = Number(product.price) * qty;
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
          items: [{ product_id: product!.id, quantity: qty }],
          payment_method: payment,
        }),
      });
      const json = await res.json();

      if (!res.ok || !json.success) {
        toast.error(json.message ?? "Gagal membuat pesanan");
        return;
      }

      toast.success("Pesanan dibuat");
      router.push(`/order/${json.data.id}`);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="shell py-6 md:py-8">
      <PageHeader
        title="Checkout"
        subtitle="Beli langsung tanpa lewat keranjang"
        backHref={`/product/${product.id}`}
        backLabel="Kembali ke produk"
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
            <div className="mt-4 flex gap-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={productImage(product.id, product.image_url)}
                alt=""
                width={72}
                height={72}
                className="size-18 shrink-0 rounded-xl border border-line object-cover"
              />
              <div className="min-w-0 flex-1">
                <p className="clamp-2 text-[14px] leading-snug font-medium">
                  {product.name}
                </p>
                <p className="tnum mt-1 text-[12.5px] text-ink-3">
                  {qty} × {formatIDR(Number(product.price))}
                </p>
              </div>
              <p className="tnum text-[16px] font-extrabold">
                {formatIDR(subtotal)}
              </p>
            </div>

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
            <OrderSummary itemCount={qty} subtotal={subtotal} />
          </div>

          <Button
            size="lg"
            className="mt-5 w-full"
            disabled={submitting || walletShort || product.stock <= 0}
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

export default function BuyNowPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);

  return (
    <Suspense
      fallback={
        <div className="shell grid gap-6 py-8 lg:grid-cols-[1fr_380px]">
          <div className="shimmer h-96 rounded-2xl" />
          <div className="shimmer h-72 rounded-2xl" />
        </div>
      }
    >
      <BuyNowView id={id} />
    </Suspense>
  );
}
