"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";

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
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);

  async function loadOrder() {
    try {
      const res = await fetch(`/api/orders/${id}`);
      const data = await res.json();
      setOrder(data.data);
    } catch (error) {
      console.error("Error loading order:", error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadOrder();
    // Auto refresh every 5 seconds
    const interval = setInterval(loadOrder, 5000);
    return () => clearInterval(interval);
  }, [id]);

  async function handlePay() {
    setPaying(true);
    try {
      await fetch(`/api/orders/${id}/pay`, { method: "POST" });
      loadOrder();
    } catch (error) {
      console.error("Error paying:", error);
    } finally {
      setPaying(false);
    }
  }

  function formatDate(dateString: string) {
    return new Date(dateString).toLocaleDateString("id-ID", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  function getStatusInfo(status: string) {
    switch (status) {
      case "paid":
        return { label: "Dibayar", color: "bg-green-100 text-green-700", icon: "✓" };
      case "shipped":
        return { label: "Dikirim", color: "bg-blue-100 text-blue-700", icon: "🚚" };
      case "completed":
        return { label: "Selesai", color: "bg-gray-100 text-gray-700", icon: "📦" };
      case "cancelled":
        return { label: "Dibatalkan", color: "bg-red-100 text-red-700", icon: "✕" };
      default:
        return { label: "Menunggu Pembayaran", color: "bg-yellow-100 text-yellow-700", icon: "⏳" };
    }
  }

  function getPaymentIcon(method: string) {
    if (method?.includes("BCA")) return "🏦";
    if (method?.includes("BRI")) return "🏦";
    if (method?.includes("Mandiri")) return "🏦";
    if (method?.includes("GoPay")) return "💚";
    if (method?.includes("OVO")) return "💜";
    if (method?.includes("ShopeePay")) return "🧡";
    if (method?.includes("DANA")) return "💙";
    return "💳";
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-[#EE4D2D] border-t-transparent"></div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
        <div className="text-6xl mb-4">😕</div>
        <h2 className="text-xl font-semibold text-gray-800 mb-2">Pesanan Tidak Ditemukan</h2>
        <Link href="/orders" className="text-[#EE4D2D] hover:underline">
          ← Kembali ke Pesanan
        </Link>
      </div>
    );
  }

  const statusInfo = getStatusInfo(order.status);

  return (
    <div className="min-h-screen bg-gray-50 pb-32">
      {/* Header */}
      <div className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Link href="/orders" className="text-gray-600 hover:text-[#EE4D2D]">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </Link>
            <h1 className="text-xl font-semibold text-gray-800">Detail Pesanan</h1>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6 space-y-4">
        {/* Order Status Card */}
        <div className="bg-white rounded-lg shadow-sm p-4">
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm text-gray-500">Order #{order.id}</span>
            <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium ${statusInfo.color}`}>
              <span>{statusInfo.icon}</span>
              {statusInfo.label}
            </span>
          </div>
          <p className="text-sm text-gray-500">{formatDate(order.created_at)}</p>
        </div>

        {/* Items Card */}
        <div className="bg-white rounded-lg shadow-sm p-4">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">
            Produk Dipesan ({order.order_items?.length || 0} item)
          </h2>
          <div className="space-y-4">
            {order.order_items?.map((item) => (
              <div key={item.id} className="flex gap-4 pb-4 border-b border-gray-100 last:border-0 last:pb-0">
                <div className="w-16 h-16 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                  <img
                    src={`https://picsum.photos/seed/${item.product_id}/100/100`}
                    alt={item.name_snapshot}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-gray-800">{item.name_snapshot}</h3>
                  <p className="text-sm text-gray-500">x{item.quantity}</p>
                  <p className="text-[#EE4D2D] font-semibold mt-1">
                    Rp {item.price_at_purchase.toLocaleString("id-ID")}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-gray-800">
                    Rp {(item.price_at_purchase * item.quantity).toLocaleString("id-ID")}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Payment Info Card */}
        <div className="bg-white rounded-lg shadow-sm p-4">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">Informasi Pembayaran</h2>
          <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
            <span className="text-2xl">{getPaymentIcon(order.payment_method)}</span>
            <div>
              <p className="font-medium text-gray-800">{order.payment_method}</p>
              <p className="text-sm text-gray-500">Metode pembayaran</p>
            </div>
          </div>
        </div>

        {/* Order Summary Card */}
        <div className="bg-white rounded-lg shadow-sm p-4">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">Ringkasan Pembayaran</h2>
          <div className="space-y-2">
            <div className="flex justify-between text-gray-600">
              <span>Subtotal Produk</span>
              <span>Rp {order.total.toLocaleString("id-ID")}</span>
            </div>
            <div className="flex justify-between text-gray-600">
              <span>Ongkos Kirim</span>
              <span className="text-green-600">Gratis</span>
            </div>
            <div className="flex justify-between text-gray-600">
              <span>Biaya Layanan</span>
              <span>Rp 0</span>
            </div>
            <div className="border-t border-gray-200 pt-2 mt-2">
              <div className="flex justify-between font-semibold text-lg">
                <span>Total</span>
                <span className="text-[#EE4D2D]">Rp {order.total.toLocaleString("id-ID")}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Fixed Bottom Button - Show only for pending orders */}
      {order.status === "pending" && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 shadow-lg">
          <div className="max-w-4xl mx-auto flex items-center justify-between gap-4">
            <div>
              <p className="text-sm text-gray-500">Total Pembayaran</p>
              <p className="text-xl font-bold text-[#EE4D2D]">Rp {order.total.toLocaleString("id-ID")}</p>
            </div>
            <button
              onClick={handlePay}
              disabled={paying}
              className="bg-[#EE4D2D] hover:bg-[#D73211] disabled:bg-gray-400 text-white font-semibold px-8 py-3 rounded-lg transition-colors flex items-center gap-2"
            >
              {paying ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                  <span>Memproses...</span>
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
