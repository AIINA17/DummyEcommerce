"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { CheckCircle2, PackageX, Receipt } from "lucide-react";
import { toast } from "sonner";

import { PAYMENT_METHODS } from "@/components/order/PaymentMethodPicker";
import { StatusBadge } from "@/components/order/StatusBadge";
import { EmptyState } from "@/components/shared/EmptyState";
import { PageHeader } from "@/components/shared/PageHeader";
import { Button } from "@/components/ui/button";
import { SERVICE_FEE } from "@/lib/constants";
import { formatDateTime, formatIDR, productImage } from "@/lib/format";
import type { Order } from "@/lib/types";

function methodLabel(value: string): string {
  return PAYMENT_METHODS.find((m) => m.value === value)?.label ?? value;
}

export default function OrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const { status } = useSession();

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace(`/login?callbackUrl=/order/${id}`);
    }
  }, [status, router, id]);

  function load(signal?: AbortSignal) {
    return fetch(`/api/orders/${id}`, { signal })
      .then((r) => (r.ok ? r.json() : null))
      .then((j) => setOrder(j?.success ? j.data : null))
      .catch(() => {})
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    if (status !== "authenticated") return;
    const controller = new AbortController();
    void load(controller.signal);
    return () => controller.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, id]);

  async function pay() {
    setPaying(true);
    try {
      const res = await fetch(`/api/orders/${id}/pay`, { method: "POST" });
      const json = await res.json();
      if (!res.ok || !json.success) {
        toast.error(json.message ?? "Pembayaran gagal");
        return;
      }
      toast.success("Pembayaran berhasil");
      await load();
    } finally {
      setPaying(false);
    }
  }

  if (loading) {
    return (
      <div className="shell grid gap-6 py-8 lg:grid-cols-[1fr_360px]">
        <div className="shimmer h-96 rounded-2xl" />
        <div className="shimmer h-72 rounded-2xl" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="shell py-16">
        <EmptyState
          icon={PackageX}
          title="Pesanan tidak ditemukan"
          body="Pesanan ini tidak ada, atau bukan milik akun yang sedang masuk."
          action={<Button render={<Link href="/orders" />}>Ke daftar pesanan</Button>}
        />
      </div>
    );
  }

  const itemsTotal = Number(order.total) - SERVICE_FEE;

  return (
    <div className="shell py-6 md:py-8">
      <PageHeader
        title={`Pesanan #${order.id}`}
        subtitle={formatDateTime(order.created_at)}
        backHref="/orders"
        backLabel="Kembali ke pesanan"
        action={<StatusBadge status={order.status} />}
      />

      {order.status === "paid" && (
        <div className="rise mb-5 flex items-center gap-3 rounded-2xl bg-success-soft p-4">
          <CheckCircle2 aria-hidden className="size-6 shrink-0 text-success" />
          <div>
            <p className="text-[14.5px] font-bold text-success">
              Pembayaran berhasil
            </p>
            <p className="text-[13px] text-ink-2">
              Pesananmu sedang disiapkan penjual.
            </p>
          </div>
        </div>
      )}

      <div className="grid items-start gap-6 lg:grid-cols-[1fr_360px]">
        <section className="surface p-5">
          <h2 className="text-[15px]">Produk dipesan</h2>
          <ul className="mt-4 divide-y divide-line border-t border-line">
            {order.order_items?.map((item) => (
              <li key={item.id} className="flex gap-3 py-4">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={productImage(item.product_id)}
                  alt=""
                  width={64}
                  height={64}
                  className="size-16 shrink-0 rounded-xl border border-line object-cover"
                />
                <div className="min-w-0 flex-1">
                  <Link
                    href={`/product/${item.product_id}`}
                    className="clamp-2 text-[14px] leading-snug transition-colors duration-160 hover:text-brand-ink"
                  >
                    {item.name_snapshot}
                  </Link>
                  <p className="tnum mt-1 text-[12.5px] text-ink-3">
                    {item.quantity} × {formatIDR(Number(item.price_at_purchase))}
                  </p>
                </div>
                <p className="tnum text-[14px] font-bold">
                  {formatIDR(Number(item.price_at_purchase) * item.quantity)}
                </p>
              </li>
            ))}
          </ul>
        </section>

        <aside className="space-y-3 lg:sticky lg:top-24">
          <div className="surface p-5">
            <h2 className="flex items-center gap-2 text-[15px]">
              <Receipt aria-hidden className="size-4 text-brand-ink" />
              Rincian pembayaran
            </h2>

            <dl className="mt-4 space-y-2.5 text-[13.5px]">
              <div className="flex justify-between gap-4">
                <dt className="text-ink-3">Metode</dt>
                <dd className="font-semibold">{methodLabel(order.payment_method)}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-ink-3">Total harga</dt>
                <dd className="tnum font-semibold">{formatIDR(itemsTotal)}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-ink-3">Ongkos kirim</dt>
                <dd className="font-semibold text-success">Gratis</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-ink-3">Biaya layanan</dt>
                <dd className="tnum font-semibold">{formatIDR(SERVICE_FEE)}</dd>
              </div>
            </dl>

            <div className="mt-4 flex items-baseline justify-between border-t border-line pt-4">
              <span className="text-[14px] font-semibold">Total</span>
              <span data-testid="order-total" className="tnum text-[20px] font-extrabold">
                {formatIDR(Number(order.total))}
              </span>
            </div>

            {order.status === "pending" && (
              <>
                <Button
                  size="lg"
                  className="mt-5 w-full"
                  disabled={paying}
                  data-testid="pay-now"
                  onClick={() => void pay()}
                >
                  {paying ? "Memproses…" : "Bayar sekarang"}
                </Button>
                <p className="mt-2 text-center text-[11.5px] text-ink-3">
                  Saldo ShopKu Pay akan dipotong sebesar tagihan.
                </p>
              </>
            )}
          </div>

          <Button variant="outline" className="w-full" render={<Link href="/orders" />}>
            Lihat semua transaksi
          </Button>
        </aside>
      </div>
    </div>
  );
}
