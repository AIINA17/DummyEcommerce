"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";

/* =======================
    TYPES
======================= */
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
  order_items: OrderItem[];
}

/* =======================
    CONSTANTS
======================= */
const TABS = [
  { id: "semua", label: "Semua" },
  { id: "pending", label: "Pending" },
  { id: "proses", label: "Proses" },
  { id: "selesai", label: "Selesai" },
] as const;

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: string }> = {
  paid: { label: "Dibayar", color: "text-success", icon: "✅" },
  shipped: { label: "Dikirim", color: "text-info", icon: "🚚" },
  completed: { label: "Selesai", color: "text-success", icon: "🎉" },
  cancelled: { label: "Dibatalkan", color: "text-error", icon: "❌" },
  default: { label: "Menunggu", color: "text-warning", icon: "⏳" },
};

const PAYMENT_ICONS: Record<string, string> = {
  gopay: "💚",
  ovo: "💜",
  shopee: "🧡",
  dana: "💙",
  va: "🏦",
  default: "💳",
};

/* =======================
    HELPER FUNCTIONS
======================= */
const formatPrice = (price: number) => new Intl.NumberFormat("id-ID").format(price);

const formatDate = (dateString: string) =>
  new Date(dateString).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

const getStatusInfo = (status: string) =>
  STATUS_CONFIG[status] || STATUS_CONFIG.default;

const getPaymentIcon = (method: string) => {
  const methodLower = method?.toLowerCase() || "";
  const iconKey = Object.keys(PAYMENT_ICONS).find(key => methodLower.includes(key));
  return PAYMENT_ICONS[iconKey || "default"];
};

/* =======================
    MAIN COMPONENT
======================= */
export default function OrdersPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<typeof TABS[number]["id"]>("semua");

  const userId = session?.user?.id ? Number(session.user.id) : null;

  const loadOrders = async () => {
    if (!userId) return;
    try {
      const res = await fetch(`/api/orders?user_id=${userId}`);
      const { data } = await res.json();
      setOrders(data || []);
    } catch (error) {
      console.error("Error loading orders:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
      return;
    }
    if (status === "authenticated" && userId) {
      loadOrders();
      const interval = setInterval(loadOrders, 10000);
      return () => clearInterval(interval);
    }
  }, [status, userId]);

  const filteredOrders = orders.filter((order) => {
    switch (activeTab) {
      case "pending":
        return order.status === "pending" || order.status === "waiting";
      case "proses":
        return order.status === "paid" || order.status === "shipped";
      case "selesai":
        return order.status === "completed";
      default:
        return true;
    }
  });

  /* =======================
      RENDER STATES
  ======================= */
  if (loading) {
    return (
      <div className="checkout-page">
        <div className="loading">
          <div className="checkout-spinner"></div>
          <p>Memuat daftar pesanan...</p>
        </div>
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="checkout-page">
        <div className="checkout-empty">
          <div className="checkout-empty-icon">📦</div>
          <h2>Belum Ada Pesanan</h2>
          <p>Sepertinya kamu belum berbelanja apapun hari ini.</p>
          <Link href="/">
            <button className="btn btn-primary">🛍️ Cari Produk</button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="checkout-page">
      {/* Header */}
      <header className="checkout-header">
        <div className="checkout-header-content">
          <button
            onClick={() => router.push("/")}
            className="checkout-back-btn"
            aria-label="Kembali ke beranda"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
          </button>
          <div className="checkout-header-text">
            <h1>Pesanan Saya</h1>
            <p>{orders.length} transaksi ditemukan</p>
          </div>
          <div className="checkout-badge">🕒 Update Otomatis</div>
        </div>
      </header>

      {/* Main Content */}
      <main className="checkout-main">
        {/* Tabs Navigation */}
        <nav className="orders-tabs" aria-label="Filter status pesanan">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`order-tab-item ${activeTab === tab.id ? "active" : ""}`}
              aria-pressed={activeTab === tab.id}
            >
              {tab.label}
            </button>
          ))}
        </nav>

        {/* Orders List */}
        <div className="orders-list">
          {filteredOrders.length === 0 ? (
            <div className="checkout-empty" style={{ padding: "40px" }}>
              <p>Tidak ada pesanan di kategori ini</p>
            </div>
          ) : (
            filteredOrders.map((order, index) => {
              const statusInfo = getStatusInfo(order.status);
              return (
                <section
                  key={order.id}
                  className="checkout-card order-card"
                  style={{ animationDelay: `${index * 0.05}s` }}
                >
                  {/* Card Header: Order ID & Status */}
                  <div className="order-card-header">
                    <div className="order-meta">
                      <span className="order-number">ORD-{order.id}</span>
                      <span className="order-date">{formatDate(order.created_at)}</span>
                    </div>
                    <div className={`order-status-badge ${statusInfo.color}`}>
                      {statusInfo.icon} {statusInfo.label}
                    </div>
                  </div>

                  {/* Items Preview */}
                  <div className="checkout-items">
                    {order.order_items.map((item) => (
                      <div key={item.id} className="checkout-item">
                        <div className="checkout-item-image-container">
                          <img
                            src={`https://picsum.photos/seed/${item.product_id}/80/80`}
                            alt={item.name_snapshot}
                            className="checkout-item-image"
                            loading="lazy"
                          />
                        </div>
                        <div className="checkout-item-details">
                          <h3>{item.name_snapshot}</h3>
                          <div className="checkout-item-bottom">
                            <span className="checkout-item-price">
                              Rp {formatPrice(item.price_at_purchase)}
                            </span>
                            <span className="checkout-item-qty">x{item.quantity}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Card Footer: Payment & Total */}
                  <div className="order-footer">
                    <div className="order-payment-method">
                      <span className="method-icon">{getPaymentIcon(order.payment_method)}</span>
                      <span>{order.payment_method}</span>
                    </div>
                    <div className="order-total-section">
                      <p>Total Pesanan</p>
                      <h2 className="order-total-price">Rp {formatPrice(order.total)}</h2>
                    </div>
                  </div>

                  <Link href={`/order/${order.id}`}>
                    <button className="btn btn-secondary w-full mt-3" style={{ fontSize: "0.85rem" }}>
                      Lihat Detail Pesanan
                    </button>
                  </Link>
                </section>
              );
            })
          )}
        </div>
      </main>

      <style jsx>{`
        /* Tabs */
        .orders-tabs {
          display: flex;
          background: white;
          border-radius: 12px;
          padding: 4px;
          margin-bottom: 24px;
          gap: 4px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
        }

        .order-tab-item {
          flex: 1;
          padding: 12px;
          border: none;
          border-radius: 8px;
          font-size: 0.9rem;
          font-weight: 600;
          color: #666;
          background: transparent;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .order-tab-item:hover {
          background: #f5f5f5;
        }

        .order-tab-item.active {
          background: #ee4d2d;
          color: white;
          box-shadow: 0 2px 4px rgba(238, 77, 45, 0.3);
        }

        /* Order Card Header */
        .order-card-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          padding-bottom: 12px;
          margin-bottom: 16px;
          border-bottom: 1px solid #f0f0f0;
        }

        .order-meta {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .order-number {
          font-weight: 700;
          color: #333;
          font-size: 0.95rem;
        }

        .order-date {
          font-size: 0.75rem;
          color: #888;
        }

        .order-status-badge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          font-weight: 600;
          font-size: 0.8rem;
          padding: 6px 12px;
          border-radius: 20px;
          background: #f8f9fa;
          white-space: nowrap;
        }

        /* Order Footer */
        .order-footer {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-top: 20px;
          padding-top: 16px;
          border-top: 1px dashed #eee;
        }

        .order-payment-method {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 0.85rem;
          color: #666;
        }

        .order-total-section {
          text-align: right;
        }

        .order-total-section p {
          font-size: 0.75rem;
          color: #888;
          margin: 0 0 4px 0;
        }

        .order-total-price {
          margin: 0;
          font-size: 1.2rem;
          font-weight: 800;
          color: #ee4d2d;
        }

        /* Utility Classes */
        .text-primary {
          color: #ee4d2d;
        }

        .text-success {
          color: #2ecc71;
        }

        .text-error {
          color: #e74c3c;
        }

        .text-warning {
          color: #f1c40f;
        }

        .text-info {
          color: #3498db;
        }

        .w-full {
          width: 100%;
        }

        .mt-3 {
          margin-top: 12px;
        }
      `}</style>
    </div>
  );
}