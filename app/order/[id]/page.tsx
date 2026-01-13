"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";

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
  updated_at: string;
  order_items: OrderItem[];
}

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
    } catch (error) {
      console.error("Error loading order:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrder();
    const interval = setInterval(loadOrder, 10000);
    return () => clearInterval(interval);
  }, [id]);

  const handlePay = async () => {
    setPaying(true);
    try {
      await fetch(`/api/orders/${id}/pay`, { method: "POST" });
      loadOrder();
    } catch (error) {
      console.error("Error paying:", error);
    } finally {
      setPaying(false);
    }
  };

  /* =======================
      HELPERS
  ======================= */
  const formatPrice = (p: number) => new Intl.NumberFormat("id-ID").format(p);

  const getStatusConfig = (status: string) => {
    switch (status) {
      case "paid": return { label: "Dibayar", color: "text-success", icon: "✅" };
      case "shipped": return { label: "Dikirim", color: "text-info", icon: "🚚" };
      case "completed": return { label: "Selesai", color: "text-success", icon: "🎉" };
      case "cancelled": return { label: "Dibatalkan", color: "text-error", icon: "❌" };
      default: return { label: "Menunggu Pembayaran", color: "text-warning", icon: "⏳" };
    }
  };

  if (loading) {
    return (
      <div className="checkout-page">
        <div className="checkout-loading">
          <div className="checkout-spinner"></div>
          <p>Memuat rincian pesanan...</p>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="checkout-page">
        <div className="checkout-empty">
          <div className="checkout-empty-icon">❌</div>
          <h2>Pesanan Tidak Ada</h2>
          <Link href="/orders"><button className="btn btn-primary mt-4">Kembali</button></Link>
        </div>
      </div>
    );
  }

  const statusInfo = getStatusConfig(order.status);

  return (
    <div className="checkout-page">
      {/* Header */}
      <header className="checkout-header">
        <div className="checkout-header-content">
          <button onClick={() => router.push("/orders")} className="checkout-back-btn">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M19 12H5M12 19l-7-7 7-7"/>
            </svg>
          </button>
          <div className="checkout-header-text">
            <h1>Rincian Pesanan</h1>
            <p>ID Transaksi: ORD-{order.id}</p>
          </div>
          <div className={`status-badge-detail ${statusInfo.color}`}>
            {statusInfo.icon} {statusInfo.label}
          </div>
        </div>
      </header>

      <main className="checkout-main">
        {/* Order Status Section */}
        <section className="checkout-card">
          <div className="checkout-card-header">
            <div className="checkout-card-icon">📄</div>
            <div>
              <h2>Informasi Pesanan</h2>
              <p>Waktu Pemesanan: {new Date(order.created_at).toLocaleString("id-ID")}</p>
            </div>
          </div>
        </section>

        {/* Items Section */}
        <section className="checkout-card">
          <div className="checkout-card-header">
            <div className="checkout-card-icon">🛍️</div>
            <div>
              <h2>Produk Dipesan</h2>
              <p>{order.order_items.length} item dalam pesanan ini</p>
            </div>
          </div>
          <div className="checkout-items">
            {order.order_items.map((item) => (
              <div key={item.id} className="checkout-item">
                <img 
                   src={`https://picsum.photos/seed/${item.product_id}/80/80`} 
                   alt={item.name_snapshot} 
                   className="checkout-item-image" 
                />
                <div className="checkout-item-details">
                  <h3>{item.name_snapshot}</h3>
                  <div className="checkout-item-bottom">
                    <span className="checkout-item-price">Rp {formatPrice(item.price_at_purchase)}</span>
                    <span className="checkout-item-qty">x{item.quantity}</span>
                  </div>
                </div>
                <div className="item-total-price">
                   Rp {formatPrice(item.price_at_purchase * item.quantity)}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Payment Detail Section */}
        <section className="checkout-card">
          <div className="checkout-card-header">
            <div className="checkout-card-icon">💳</div>
            <div>
              <h2>Metode Pembayaran</h2>
              <p>{order.payment_method}</p>
            </div>
          </div>
          <div className="order-summary mt-2">
            <div className="order-summary-row">
              <span>Total Harga Produk</span>
              <span>Rp {formatPrice(order.total)}</span>
            </div>
            <div className="order-summary-row">
              <span>Ongkos Kirim</span>
              <span className="text-success">Gratis</span>
            </div>
            <div className="order-summary-row total">
              <span>Total Pembayaran</span>
              <span className="text-primary font-bold">Rp {formatPrice(order.total)}</span>
            </div>
          </div>
        </section>
      </main>

      {/* Floating Bottom Action (Only for Pending) */}
      {order.status === "pending" && (
        <div className="checkout-footer">
          <div className="checkout-footer-content">
            <div className="checkout-footer-total">
              <p>Total yang harus dibayar</p>
              <p className="checkout-footer-price">Rp {formatPrice(order.total)}</p>
            </div>
            <button 
              onClick={handlePay} 
              disabled={paying} 
              className="btn btn-primary checkout-pay-btn"
            >
              {paying ? "Memproses..." : "Bayar Sekarang"}
            </button>
          </div>
        </div>
      )}

      <style jsx>{`
        .status-badge-detail {
          background: #f8f9fa;
          padding: 6px 14px;
          border-radius: 50px;
          font-weight: 700;
          font-size: 0.85rem;
          border: 1px solid #eee;
        }
        .item-total-price {
          font-weight: 700;
          color: #333;
          font-size: 0.95rem;
          min-width: 100px;
          text-align: right;
        }
        .text-primary { color: #EE4D2D; }
        .text-success { color: #2ecc71; }
        .text-info { color: #3498db; }
        .text-warning { color: #f1c40f; }
        .text-error { color: #e74c3c; }
        .font-bold { font-weight: 800; }
        .mt-2 { margin-top: 10px; }
        @media (max-width: 640px) {
          .item-total-price { display: none; }
        }
      `}</style>
    </div>
  );
}