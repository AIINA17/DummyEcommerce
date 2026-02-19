"use client";
// app/checkout/page.tsx

import { Suspense, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import {
  ArrowLeft,
  ShoppingBag,
  CreditCard,
  Receipt,
  ShoppingCart,
  Check,
} from "lucide-react";

/* =======================  TYPES  ======================= */
interface Product {
  id: number;
  name: string;
  price: number;
  image_url: string;
  category: string;
  stock: number;
}
interface CartItem {
  id: number;
  product_id: number;
  quantity: number;
  products: Product;
}

/* =======================  CONSTANTS  ======================= */
const PAYMENT_METHODS = [
  {
    value: "VA_BCA",
    label: "Virtual Account BCA",
    desc: "ATM / m-Banking BCA",
    icon: "🏦",
  },
  {
    value: "VA_BRI",
    label: "Virtual Account BRI",
    desc: "Transfer cepat",
    icon: "🏦",
  },
  {
    value: "VA_Mandiri",
    label: "Virtual Account Mandiri",
    desc: "Pembayaran instan",
    icon: "🏦",
  },
  { value: "GoPay", label: "GoPay", desc: "E-wallet terpopuler", icon: "💚" },
  { value: "OVO", label: "OVO", desc: "Cashback s.d 10%", icon: "💜" },
  {
    value: "ShopeePay",
    label: "ShopeePay",
    desc: "Promo eksklusif",
    icon: "🧡",
  },
  { value: "DANA", label: "DANA", desc: "Bayar praktis", icon: "💙" },
  { value: "ShopKuPay", label: "ShopKuPay", desc: "Bayar praktis", icon: "❤️" },
];

/* =======================  HELPERS  ======================= */
const formatPrice = (p: number) => new Intl.NumberFormat("id-ID").format(p);

/* =======================  CHECKOUT CONTENT  ======================= */
function CheckoutContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session, status } = useSession();

  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [payment, setPayment] = useState("ShopKuPay");
  const [toast, setToast] = useState<{ message: string; type: string } | null>(
    null,
  );

  const userId = session?.user?.id ? Number(session.user.id) : null;

  /* ── Load Cart ── */
  async function loadCart() {
    if (!userId) return;
    const selectedIds = searchParams.get("items");
    if (!selectedIds) {
      router.push("/cart");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`/api/cart?user_id=${userId}`);
      const data = await res.json();
      const ids = selectedIds.split(",").map((id) => parseInt(id.trim()));
      const filtered = (data.data || []).filter((item: CartItem) =>
        ids.includes(item.id),
      );

      if (filtered.length === 0) {
        showToast("Item tidak ditemukan", "error");
        router.push("/cart");
        return;
      }
      setCartItems(filtered);
    } catch {
      showToast("Gagal memuat keranjang", "error");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
      return;
    }
    if (status === "authenticated" && userId) loadCart();
  }, [status, userId, searchParams]);

  /* ── Derived ── */
  const { subtotal, totalItems } = useMemo(
    () => ({
      subtotal: cartItems.reduce(
        (s, i) => s + i.products.price * i.quantity,
        0,
      ),
      totalItems: cartItems.reduce((s, i) => s + i.quantity, 0),
    }),
    [cartItems],
  );

  const serviceFee = 1000;
  const shippingCost = 0;
  const totalPayment = subtotal + serviceFee + shippingCost;

  const showToast = (message: string, type: string) => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  /* ── Place Order ── */
  async function handlePlaceOrder() {
    if (!cartItems.length || !userId) {
      router.push("/login");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: userId,
          payment_method: payment,
          items: cartItems.map((item) => ({
            product_id: item.products.id,
            quantity: item.quantity,
            price: item.products.price,
            name: item.products.name,
          })),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        showToast(data.message || "Gagal membuat pesanan", "error");
        setSubmitting(false);
        return;
      }

      // Clear cart
      for (const item of cartItems)
        await fetch(`/api/cart?cart_id=${item.id}`, { method: "DELETE" });

      showToast("Pesanan berhasil dibuat!", "success");
      setTimeout(() => router.push("/orders"), 1500);
    } catch {
      showToast("Terjadi kesalahan", "error");
      setSubmitting(false);
    }
  }

  /* ── States ── */
  if (loading) {
    return (
      <div className="page-container state-screen">
        <div className="spinner" />
        <p className="state-text">Memuat data checkout...</p>
      </div>
    );
  }

  if (!cartItems.length) {
    return (
      <div className="page-container state-screen">
        <div className="state-icon">
          <ShoppingCart size={34} />
        </div>
        <h2 className="state-title">Keranjang Kosong</h2>
        <p className="state-text">
          Yuk, mulai belanja dan temukan produk favoritmu!
        </p>
        <Link href="/">
          <button className="btn btn-primary">
            <ShoppingBag size={15} /> Mulai Belanja
          </button>
        </Link>
      </div>
    );
  }

  /* ── Main ── */
  return (
    <div className="page-container">
      {/* ── Header ── */}
      <header className="page-header-bar">
        <div className="page-header-bar-inner">
          <button
            onClick={() => router.back()}
            className="back-btn"
            aria-label="Kembali"
          >
            <ArrowLeft size={18} />
          </button>
          <div className="header-text">
            <h1 className="header-title">Checkout</h1>
            <p className="header-subtitle">{totalItems} item di keranjang</p>
          </div>
          <div className="header-badge">Gratis Ongkir</div>
        </div>
      </header>

      {/* ── Main ── */}
      <main className="page-main" style={{ paddingBottom: 100 }}>
        {/* Order Summary */}
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
                Ringkasan Pesanan
              </p>
              <p
                style={{ fontSize: 12, color: "var(--gray-500)", marginTop: 2 }}
              >
                {totalItems} produk
              </p>
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {cartItems.map((item, i) => (
              <div
                key={item.id}
                className="item-row"
                style={{ animationDelay: `${i * 0.06}s` }}
              >
                <img
                  src={
                    item.products.image_url ||
                    `https://picsum.photos/seed/${item.product_id}/80/80`
                  }
                  alt={item.products.name}
                  className="item-row-img"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src =
                      `https://picsum.photos/seed/${item.product_id}/80/80`;
                  }}
                />
                <div className="item-row-body">
                  <p className="item-row-name">{item.products.name}</p>
                  <p
                    style={{
                      fontSize: 11,
                      color: "var(--gray-500)",
                      marginBottom: 6,
                    }}
                  >
                    {item.products.category}
                  </p>
                  <div className="item-row-bottom">
                    <span className="item-row-price">
                      Rp {formatPrice(item.products.price)}
                    </span>
                    <span className="item-row-qty">x{item.quantity}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Payment Methods */}
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
                Pilih cara bayar yang nyaman
              </p>
            </div>
          </div>

          <div className="payment-methods-grid">
            {PAYMENT_METHODS.map((method) => (
              <button
                key={method.value}
                className={`payment-method-card${payment === method.value ? " selected" : ""}`}
                onClick={() => setPayment(method.value)}
              >
                <div className="payment-method-icon">{method.icon}</div>
                <div>
                  <span className="payment-method-label">{method.label}</span>
                  <span className="payment-method-desc">{method.desc}</span>
                </div>
                <div className="payment-method-check">
                  <Check size={12} color="white" strokeWidth={3} />
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Payment Detail */}
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
              <Receipt size={20} />
            </div>
            <div>
              <p
                style={{
                  fontWeight: 700,
                  fontSize: 14,
                  color: "var(--gray-900)",
                }}
              >
                Rincian Pembayaran
              </p>
              <p
                style={{ fontSize: 12, color: "var(--gray-500)", marginTop: 2 }}
              >
                Detail biaya pesanan
              </p>
            </div>
          </div>

          <div className="order-summary">
            <div className="order-summary-row">
              <span>Subtotal ({totalItems} produk)</span>
              <span>Rp {formatPrice(subtotal)}</span>
            </div>
            <div className="order-summary-row">
              <span>Ongkos Kirim</span>
              <span style={{ color: "var(--success)", fontWeight: 600 }}>
                Gratis
              </span>
            </div>
            <div className="order-summary-row">
              <span>Biaya Layanan</span>
              <span>Rp {formatPrice(serviceFee)}</span>
            </div>
            <div className="order-summary-row order-summary-row--total">
              <span>Total Pembayaran</span>
              <span>Rp {formatPrice(totalPayment)}</span>
            </div>
          </div>
        </div>
      </main>

      {/* ── Sticky Footer ── */}
      <div className="checkout-footer">
        <div className="checkout-footer-inner">
          <div className="checkout-footer-total">
            <p className="checkout-footer-label">Total Pembayaran</p>
            <p className="checkout-footer-price">
              Rp {formatPrice(totalPayment)}
            </p>
          </div>
          <button
            className="btn btn-primary"
            style={{ padding: "14px 32px", flexShrink: 0 }}
            disabled={submitting}
            onClick={handlePlaceOrder}
          >
            {submitting ? (
              <>
                <span className="spinner-sm" /> Memproses...
              </>
            ) : (
              "Bayar Sekarang"
            )}
          </button>
        </div>
      </div>

      {toast && <div className={`toast ${toast.type}`}>{toast.message}</div>}
    </div>
  );
}

/* =======================  PAGE WITH SUSPENSE  ======================= */
export default function CheckoutPage() {
  return (
    <Suspense
      fallback={
        <div className="page-container state-screen">
          <div className="spinner" />
          <p className="state-text">Memuat data checkout...</p>
        </div>
      }
    >
      <CheckoutContent />
    </Suspense>
  );
}
