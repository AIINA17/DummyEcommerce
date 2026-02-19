"use client";
// app/orders/page.tsx — ACUAN STYLE

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import {
  ArrowLeft, PackageOpen, ShoppingBag, RefreshCw,
  CheckCircle2, Truck, PartyPopper, XCircle, Clock, ChevronRight,
} from "lucide-react";

/* =======================  TYPES  ======================= */
interface OrderItem {
  id: number; product_id: number;
  quantity: number; price_at_purchase: number; name_snapshot: string;
}
interface Order {
  id: number; user_id: number; status: string;
  payment_method: string; total: number;
  created_at: string; order_items: OrderItem[];
}
type TabId = "semua" | "pending" | "proses" | "selesai";

/* =======================  CONSTANTS  ======================= */
const TABS: { id: TabId; label: string }[] = [
  { id: "semua", label: "Semua" }, { id: "pending", label: "Pending" },
  { id: "proses", label: "Proses" }, { id: "selesai", label: "Selesai" },
];

type StatusInfo = { label: string; icon: React.ReactNode; cls: string };

const STATUS_CONFIG: Record<string, StatusInfo> = {
  paid:      { label: "Dibayar",    icon: <CheckCircle2 size={12} />, cls: "status-badge--success" },
  shipped:   { label: "Dikirim",    icon: <Truck size={12} />,        cls: "status-badge--info"    },
  completed: { label: "Selesai",    icon: <PartyPopper size={12} />,  cls: "status-badge--success" },
  cancelled: { label: "Dibatalkan", icon: <XCircle size={12} />,      cls: "status-badge--error"   },
  default:   { label: "Menunggu",   icon: <Clock size={12} />,        cls: "status-badge--warning" },
};

const PAYMENT_LABELS: Record<string, string> = {
  gopay: "GoPay", ovo: "OVO", shopee: "ShopeePay", dana: "DANA", va: "Virtual Account",
};

const TAB_FILTER: Record<TabId, (s: string) => boolean> = {
  semua:   () => true,
  pending: (s) => s === "pending" || s === "waiting",
  proses:  (s) => s === "paid" || s === "shipped",
  selesai: (s) => s === "completed",
};

/* =======================  HELPERS  ======================= */
const formatPrice = (p: number) => new Intl.NumberFormat("id-ID").format(p);
const formatDate  = (d: string) => new Date(d).toLocaleDateString("id-ID", {
  day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit",
});
const getStatusInfo   = (s: string): StatusInfo => STATUS_CONFIG[s] ?? STATUS_CONFIG.default;
const getPaymentLabel = (method: string): string => {
  const lower = method?.toLowerCase() ?? "";
  const key = Object.keys(PAYMENT_LABELS).find((k) => lower.includes(k));
  return PAYMENT_LABELS[key ?? ""] ?? method;
};

/* =======================  SUB-COMPONENTS  ======================= */
function LoadingState() {
  return (
    <div className="page-container state-screen">
      <div className="spinner" />
      <p className="state-text">Memuat pesanan...</p>
    </div>
  );
}

function EmptyOrdersState() {
  return (
    <div className="page-container state-screen">
      <div className="state-icon"><PackageOpen size={34} /></div>
      <h2 className="state-title">Belum Ada Pesanan</h2>
      <p className="state-text">Sepertinya kamu belum berbelanja apapun hari ini.</p>
      <Link href="/"><button className="btn btn-primary"><ShoppingBag size={15} /> Cari Produk</button></Link>
    </div>
  );
}

function EmptyTabState() {
  return <div className="state-screen" style={{ minHeight: 160 }}><p className="state-text">Tidak ada pesanan di kategori ini.</p></div>;
}

function OrderCard({ order, index }: { order: Order; index: number }) {
  const s = getStatusInfo(order.status);
  return (
    <article className="card" style={{ animationDelay: `${index * 0.05}s` }}>
      {/* Header */}
      <div className="card-header-row">
        <div>
          <p className="card-header-id">ORD-{order.id}</p>
          <p className="card-header-date">{formatDate(order.created_at)}</p>
        </div>
        <span className={`status-badge ${s.cls}`}>{s.icon} {s.label}</span>
      </div>

      {/* Items */}
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {order.order_items.map((item) => (
          <div key={item.id} className="item-row">
            <img src={`https://picsum.photos/seed/${item.product_id}/80/80`} alt={item.name_snapshot} className="item-row-img" loading="lazy" />
            <div className="item-row-body">
              <p className="item-row-name">{item.name_snapshot}</p>
              <div className="item-row-bottom">
                <span className="item-row-price">Rp {formatPrice(item.price_at_purchase)}</span>
                <span className="item-row-qty">x{item.quantity}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="card-footer">
        <span className="card-footer-meta">{getPaymentLabel(order.payment_method)}</span>
        <div>
          <p className="card-footer-total-label">Total Pesanan</p>
          <p className="card-footer-total-value">Rp {formatPrice(order.total)}</p>
        </div>
      </div>

      {/* CTA */}
      <Link href={`/order/${order.id}`} style={{ display: "block", marginTop: 12 }}>
        <button className="btn btn-secondary btn-full">Lihat Detail Pesanan <ChevronRight size={14} /></button>
      </Link>
    </article>
  );
}

/* =======================  MAIN PAGE  ======================= */
export default function OrdersPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [orders, setOrders]       = useState<Order[]>([]);
  const [loading, setLoading]     = useState(true);
  const [activeTab, setActiveTab] = useState<TabId>("semua");
  const userId = session?.user?.id ? Number(session.user.id) : null;

  const loadOrders = async () => {
    if (!userId) return;
    try {
      const res = await fetch(`/api/orders?user_id=${userId}`);
      const { data } = await res.json();
      setOrders(data ?? []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (status === "unauthenticated") { router.push("/login"); return; }
    if (status === "authenticated" && userId) {
      loadOrders();
      const iv = setInterval(loadOrders, 10_000);
      return () => clearInterval(iv);
    }
  }, [status, userId]);

  if (loading)             return <LoadingState />;
  if (orders.length === 0) return <EmptyOrdersState />;

  const filtered = orders.filter((o) => TAB_FILTER[activeTab](o.status));

  return (
    <div className="page-container">
      <header className="page-header-bar">
        <div className="page-header-bar-inner">
          <button onClick={() => router.push("/")} className="back-btn" aria-label="Kembali"><ArrowLeft size={18} /></button>
          <div className="header-text">
            <h1 className="header-title">Pesanan Saya</h1>
            <p className="header-subtitle">{orders.length} transaksi ditemukan</p>
          </div>
          <div className="header-badge"><RefreshCw size={11} /> Live</div>
        </div>
      </header>

      <main className="page-main">
        <nav className="tabs" aria-label="Filter status pesanan">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              aria-pressed={activeTab === tab.id}
              className={`tab-btn${activeTab === tab.id ? " tab-btn--active" : ""}`}
            >{tab.label}</button>
          ))}
        </nav>
        {filtered.length === 0
          ? <EmptyTabState />
          : filtered.map((order, i) => <OrderCard key={order.id} order={order} index={i} />)
        }
      </main>
    </div>
  );
}