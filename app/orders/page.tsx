"use client";

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
  order_items: OrderItem[];
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  const userId = 1; // TODO: Get from session

  async function loadOrders() {
    try {
      const res = await fetch(`/api/orders?user_id=${userId}`);
      const data = await res.json();
      setOrders(data.data || []);
    } catch (error) {
      console.error("Error loading orders:", error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadOrders();
    // Auto refresh every 5 seconds
    const interval = setInterval(loadOrders, 5000);
    return () => clearInterval(interval);
  }, []);

  function formatDate(dateString: string) {
    return new Date(dateString).toLocaleDateString("id-ID", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  function getStatusBadge(status: string) {
    switch (status) {
      case "paid":
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-700">
            <span className="w-2 h-2 rounded-full bg-green-500"></span>
            Dibayar
          </span>
        );
      case "shipped":
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-700">
            <span className="w-2 h-2 rounded-full bg-blue-500"></span>
            Dikirim
          </span>
        );
      case "completed":
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-700">
            <span className="w-2 h-2 rounded-full bg-gray-500"></span>
            Selesai
          </span>
        );
      case "cancelled":
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-700">
            <span className="w-2 h-2 rounded-full bg-red-500"></span>
            Dibatalkan
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium bg-yellow-100 text-yellow-700">
            <span className="w-2 h-2 rounded-full bg-yellow-500"></span>
            Menunggu Pembayaran
          </span>
        );
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

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Link href="/" className="text-gray-600 hover:text-[#EE4D2D]">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </Link>
            <h1 className="text-xl font-semibold text-gray-800">Pesanan Saya</h1>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6">
        {orders.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm p-8 text-center">
            <div className="text-6xl mb-4">📦</div>
            <h2 className="text-xl font-semibold text-gray-800 mb-2">Belum Ada Pesanan</h2>
            <p className="text-gray-500 mb-6">Yuk mulai belanja dan buat pesanan pertamamu!</p>
            <Link
              href="/"
              className="inline-block bg-[#EE4D2D] text-white px-6 py-3 rounded-lg hover:bg-[#D73211] transition-colors"
            >
              Mulai Belanja
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => (
              <div key={order.id} className="bg-white rounded-lg shadow-sm overflow-hidden">
                {/* Order Header */}
                <div className="p-4 border-b border-gray-100">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div className="flex items-center gap-3">
                      <span className="text-sm text-gray-500">Order #{order.id}</span>
                      <span className="text-gray-300">•</span>
                      <span className="text-sm text-gray-500">{formatDate(order.created_at)}</span>
                    </div>
                    {getStatusBadge(order.status)}
                  </div>
                </div>

                {/* Order Items */}
                <div className="p-4 space-y-3">
                  {order.order_items?.map((item) => (
                    <div key={item.id} className="flex items-center gap-4">
                      <div className="w-16 h-16 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                        <img
                          src={`https://picsum.photos/seed/${item.product_id}/100/100`}
                          alt={item.name_snapshot}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-gray-800 truncate">{item.name_snapshot}</h3>
                        <p className="text-sm text-gray-500">x{item.quantity}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-gray-800">
                          Rp {(item.price_at_purchase * item.quantity).toLocaleString("id-ID")}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Order Footer */}
                <div className="p-4 bg-gray-50 border-t border-gray-100">
                  <div className="flex items-center justify-between flex-wrap gap-3">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <span>{getPaymentIcon(order.payment_method)}</span>
                      <span>{order.payment_method || "Belum dipilih"}</span>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="text-sm text-gray-500">Total Pesanan</p>
                        <p className="text-lg font-bold text-[#EE4D2D]">
                          Rp {order.total.toLocaleString("id-ID")}
                        </p>
                      </div>
                      <Link
                        href={`/order/${order.id}`}
                        className="bg-[#EE4D2D] text-white px-4 py-2 rounded-lg hover:bg-[#D73211] transition-colors text-sm font-medium"
                      >
                        Detail
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
