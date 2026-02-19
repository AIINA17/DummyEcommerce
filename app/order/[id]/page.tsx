"use client";
// app/order/[id]/page.tsx

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  RefreshCw,
  FileText,
  ShoppingBag,
  CreditCard,
  CheckCircle2,
  Truck,
  PartyPopper,
  XCircle,
  Clock,
} from "lucide-react";

/* =======================  TYPES  ======================= */
interface OrderItem {
  id: number;
  product_id: number;
  quantity: number;
  price_at_purchase: number;
  name_snapshot: string;
}
interface Order {
  id: number;
  user_id: number;
  status: string;
  payment_method: string;
  total: number;
  created_at: string;
  updated_at: string;
  order_items: OrderItem[];
}

/* =======================  CONSTANTS  ======================= */
type StatusInfo = { label: string; icon: React.ReactNode; cls: string };

const STATUS_CONFIG: Record<string, StatusInfo> = {
  paid: {
    label: "Dibayar",
    icon: <CheckCircle2 size={12} />,
    cls: "status-badge--success",
  },
  shipped: {
    label: "Dikirim",
    icon: <Truck size={12} />,
    cls: "status-badge--info",
  },
  completed: {
    label: "Selesai",
    icon: <PartyPopper size={12} />,
    cls: "status-badge--success",
  },
  cancelled: {
    label: "Dibatalkan",
    icon: <XCircle size={12} />,
    cls: "status-badge--error",
  },
  default: {
    label: "Menunggu Pembayaran",
    icon: <Clock size={12} />,
    cls: "status-badge--warning",
  },
};

const PAYMENT_LABELS: Record<string, string> = {
  gopay: "GoPay",
  ovo: "OVO",
  shopee: "ShopeePay",
  dana: "DANA",
  va: "Virtual Account",
};

/* =======================  HELPERS  ======================= */
const formatPrice = (p: number) => new Intl.NumberFormat("id-ID").format(p);
const getStatusInfo = (s: string): StatusInfo =>
  STATUS_CONFIG[s] ?? STATUS_CONFIG.default;
const getPaymentLabel = (method: string): string => {
  const lower = method?.toLowerCase() ?? "";
  const key = Object.keys(PAYMENT_LABELS).find((k) => lower.includes(k));
  return PAYMENT_LABELS[key ?? ""] ?? method;
};

/* =======================  MAIN PAGE  ======================= */
export default function OrderDetail() {
  const { id } = useParams();
  const router = useRouter();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);

  const loadOrder = async () => {
    try {
      const res = await fetch(`/api/orders/${id}`);
      const data = await res.json();
      setOrder(data.data);
    } catch (err) {
      console.error("Error loading order:", err);
    } finally {
      setLoading(false);
    }
  };

  const handlePay = async () => {
    setPaying(true);
    try {
      await fetch(`/api/orders/${id}/pay`, { method: "POST" });
      loadOrder();
    } catch (err) {
      console.error("Error paying:", err);
    } finally {
      setPaying(false);
    }
  };

  useEffect(() => {
    loadOrder();
    const iv = setInterval(loadOrder, 10_000);
    return () => clearInterval(iv);
  }, [id]);

  /* ── States ── */
  if (loading) {
    return (
      <div className="page-container state-screen">
        <div className="spinner" />
        <p className="state-text">Memuat rincian pesanan...</p>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="page-container state-screen">
        <div className="state-icon">
          <XCircle size={34} />
        </div>
        <h2 className="state-title">Pesanan Tidak Ditemukan</h2>
        <p className="state-text">
          Pesanan ini tidak tersedia atau sudah dihapus.
        </p>
        <Link href="/orders">
          <button className="btn btn-primary">Kembali ke Pesanan</button>
        </Link>
      </div>
    );
  }

  const statusInfo = getStatusInfo(order.status);

  return (
    <div className="page-container">
      {/* ── Header ── */}
      <header className="page-header-bar">
        <div className="page-header-bar-inner">
          <button
            onClick={() => router.push("/orders")}
            className="back-btn"
            aria-label="Kembali"
          >
            <ArrowLeft size={18} />
          </button>
          <div className="header-text">
            <h1 className="header-title">Rincian Pesanan</h1>
            <p className="header-subtitle">ORD-{order.id}</p>
          </div>
          <div className="header-badge">
            <RefreshCw size={11} /> Live
          </div>
        </div>
      </header>

      {/* ── Main ── */}
      <main
        className="page-main"
        style={{ paddingBottom: order.status === "pending" ? 100 : 24 }}
      >
        {/* Status Card */}
        <div
          className="card"
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 16,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div
              style={{
                width: 42,
                height: 42,
                borderRadius: "var(--radius-lg)",
                background: "var(--primary-50)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "var(--primary)",
              }}
            >
              <FileText size={20} />
            </div>
            <div>
              <p
                style={{
                  fontWeight: 700,
                  fontSize: 14,
                  color: "var(--gray-900)",
                }}
              >
                Informasi Pesanan
              </p>
              <p
                style={{ fontSize: 12, color: "var(--gray-500)", marginTop: 2 }}
              >
                {new Date(order.created_at).toLocaleString("id-ID", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>
            </div>
          </div>
          <span className={`status-badge ${statusInfo.cls}`}>
            {statusInfo.icon} {statusInfo.label}
          </span>
        </div>

        {/* Items Card */}
        <div className="card">
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              marginBottom: 16,
              paddingBottom: 14,
              borderBottom: "1px solid var(--gray-200)",
            }}
          >
            <div
              style={{
                width: 42,
                height: 42,
                borderRadius: "var(--radius-lg)",
                background: "var(--primary-50)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "var(--primary)",
              }}
            >
              <ShoppingBag size={20} />
            </div>
            <div>
              <p
                style={{
                  fontWeight: 700,
                  fontSize: 14,
                  color: "var(--gray-900)",
                }}
              >
                Produk Dipesan
              </p>
              <p
                style={{ fontSize: 12, color: "var(--gray-500)", marginTop: 2 }}
              >
                {order.order_items.length} item dalam pesanan ini
              </p>
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {order.order_items.map((item) => (
              <div
                key={item.id}
                style={{ display: "flex", gap: 12, alignItems: "center" }}
              >
                <img
                  src={`https://picsum.photos/seed/${item.product_id}/80/80`}
                  alt={item.name_snapshot}
                  className="item-row-img"
                />
                <div className="item-row-body">
                  <p className="item-row-name">{item.name_snapshot}</p>
                  <div className="item-row-bottom">
                    <span className="item-row-price">
                      Rp {formatPrice(item.price_at_purchase)}
                    </span>
                    <span className="item-row-qty">x{item.quantity}</span>
                  </div>
                </div>
                <p
                  style={{
                    fontSize: 14,
                    fontWeight: 700,
                    color: "var(--gray-800)",
                    minWidth: 90,
                    textAlign: "right",
                    flexShrink: 0,
                  }}
                >
                  Rp {formatPrice(item.price_at_purchase * item.quantity)}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Payment Card */}
        <div className="card">
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              marginBottom: 16,
              paddingBottom: 14,
              borderBottom: "1px solid var(--gray-200)",
            }}
          >
            <div
              style={{
                width: 42,
                height: 42,
                borderRadius: "var(--radius-lg)",
                background: "var(--primary-50)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "var(--primary)",
              }}
            >
              <CreditCard size={20} />
            </div>
            <div>
              <p
                style={{
                  fontWeight: 700,
                  fontSize: 14,
                  color: "var(--gray-900)",
                }}
              >
                Metode Pembayaran
              </p>
              <p
                style={{ fontSize: 12, color: "var(--gray-500)", marginTop: 2 }}
              >
                {getPaymentLabel(order.payment_method)}
              </p>
            </div>
          </div>

          <div className="order-summary">
            <div className="order-summary-row">
              <span>Total Harga Produk</span>
              <span>Rp {formatPrice(order.total)}</span>
            </div>
            <div className="order-summary-row">
              <span>Ongkos Kirim</span>
              <span style={{ color: "var(--success)", fontWeight: 600 }}>
                Gratis
              </span>
            </div>
            <div className="order-summary-row order-summary-row--total">
              <span>Total Pembayaran</span>
              <span>Rp {formatPrice(order.total)}</span>
            </div>
          </div>
        </div>
      </main>

      {/* ── Sticky Footer (pending only) ── */}
      {order.status === "pending" && (
        <div className="checkout-footer">
          <div className="checkout-footer-inner">
            <div className="checkout-footer-total">
              <p className="checkout-footer-label">Total yang harus dibayar</p>
              <p className="checkout-footer-price">
                Rp {formatPrice(order.total)}
              </p>
            </div>
            <button
              onClick={handlePay}
              disabled={paying}
              className="btn btn-primary"
              style={{ padding: "14px 32px", flexShrink: 0 }}
            >
              {paying ? (
                <>
                  <span className="spinner-sm" /> Memproses...
                </>
              ) : (
                "Bayar Sekarang"
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
