"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { ClipboardList } from "lucide-react";

import { StatusBadge } from "@/components/order/StatusBadge";
import { EmptyState } from "@/components/shared/EmptyState";
import { PageHeader } from "@/components/shared/PageHeader";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatDate, formatIDR } from "@/lib/format";
import type { Order } from "@/lib/types";

const TABS = [
  { id: "semua", label: "Semua" },
  { id: "pending", label: "Belum dibayar" },
  { id: "paid", label: "Dibayar" },
] as const;

type TabId = (typeof TABS)[number]["id"];

export default function OrdersPage() {
  const router = useRouter();
  const { status } = useSession();

  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<TabId>("semua");

  useEffect(() => {
    if (status === "unauthenticated") router.replace("/login?callbackUrl=/orders");
  }, [status, router]);

  useEffect(() => {
    if (status !== "authenticated") return;
    const controller = new AbortController();
    fetch("/api/orders", { signal: controller.signal })
      .then((r) => (r.ok ? r.json() : { data: [] }))
      .then((json) => setOrders(json.data ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
    return () => controller.abort();
  }, [status]);

  const counts = useMemo(
    () => ({
      semua: orders.length,
      pending: orders.filter((o) => o.status === "pending").length,
      paid: orders.filter((o) => o.status === "paid").length,
    }),
    [orders]
  );

  const visible = useMemo(
    () => (tab === "semua" ? orders : orders.filter((o) => o.status === tab)),
    [orders, tab]
  );

  if (loading) {
    return (
      <div className="shell space-y-3 py-8">
        <div className="shimmer h-10 w-64 rounded-xl" />
        {Array.from({ length: 3 }, (_, i) => (
          <div key={i} className="shimmer h-36 rounded-2xl" />
        ))}
      </div>
    );
  }

  return (
    <div className="shell py-6 md:py-8">
      <PageHeader
        title="Pesanan saya"
        subtitle="Riwayat semua transaksi di akun ini"
        backHref="/"
        backLabel="Lanjut belanja"
      />

      <Tabs value={tab} onValueChange={(value) => setTab(value as TabId)}>
        <TabsList>
          {TABS.map((t) => (
            <TabsTrigger key={t.id} value={t.id}>
              {t.label}
              <span className="tnum ml-1.5 text-ink-3">{counts[t.id]}</span>
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      <div className="mt-5">
        {visible.length === 0 ? (
          <EmptyState
            icon={ClipboardList}
            title={
              tab === "semua" ? "Belum ada pesanan" : "Tidak ada pesanan di tab ini"
            }
            body={
              tab === "semua"
                ? "Semua pesananmu akan muncul di sini setelah checkout pertama."
                : "Coba lihat tab lain untuk menemukan pesanan yang kamu cari."
            }
            action={
              tab === "semua" ? (
                <Button render={<Link href="/" />}>Mulai belanja</Button>
              ) : (
                <Button variant="outline" onClick={() => setTab("semua")}>
                  Lihat semua pesanan
                </Button>
              )
            }
          />
        ) : (
          <ul className="stagger space-y-3">
            {visible.map((order) => {
              const preview = order.order_items?.slice(0, 2) ?? [];
              const rest = (order.order_items?.length ?? 0) - preview.length;

              return (
                <li
                  key={order.id}
                  data-testid="order-row"
                  className="surface p-4 sm:p-5"
                >
                  <div className="flex flex-wrap items-center gap-3 border-b border-line pb-3">
                    <StatusBadge status={order.status} />
                    <span className="text-[12.5px] text-ink-3">
                      {formatDate(order.created_at)}
                    </span>
                    <span className="tnum text-[12.5px] text-ink-3">
                      #{order.id}
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-x-6 gap-y-4 pt-4">
                    <ul className="min-w-50 flex-1 space-y-1.5">
                      {preview.map((item) => (
                        <li
                          key={item.id}
                          className="flex items-baseline gap-2 text-[13.5px]"
                        >
                          <span className="clamp-2 min-w-0 flex-1">
                            {item.name_snapshot}
                          </span>
                          <span className="tnum shrink-0 text-[12.5px] text-ink-3">
                            ×{item.quantity}
                          </span>
                        </li>
                      ))}
                      {rest > 0 && (
                        <li className="text-[12.5px] text-ink-3">
                          +{rest} produk lainnya
                        </li>
                      )}
                    </ul>

                    <div className="sm:border-l sm:border-line sm:pl-6">
                      <p className="text-[12.5px] text-ink-3">Total pesanan</p>
                      <p className="tnum mt-0.5 text-[17px] font-extrabold">
                        {formatIDR(Number(order.total))}
                      </p>
                    </div>

                    <Button
                      variant="outline"
                      size="sm"
                      render={<Link href={`/order/${order.id}`} />}
                    >
                      Lihat detail
                    </Button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
