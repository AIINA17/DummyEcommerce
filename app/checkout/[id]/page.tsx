"use client";
// app/checkout/[id]/page.tsx

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import {
  ArrowLeft,
  ShoppingBag,
  CreditCard,
  Receipt,
  Star,
  PackageOpen,
  Check,
  Minus,
  Plus,
} from "lucide-react";

/* =======================  TYPES  ======================= */
interface Product {
  id: number;
  name: string;
  price: number;
  image_url: string;
  category: string;
  rating: number;
  stock: number;
  description: string;
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
];

/* =======================  HELPERS  ======================= */
const formatPrice = (p: number) => new Intl.NumberFormat("id-ID").format(p);

/* =======================  PAGE  ======================= */
export default function CheckoutProductPage() {
  const { id } = useParams();
  const router = useRouter();
  const { data: session, status } = useSession();

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [qty, setQty] = useState(1);
  const [payment, setPayment] = useState("GoPay");
  const [toast, setToast] = useState<{ message: string; type: string } | null>(
    null,
  );

  const userId = session?.user?.id ? Number(session.user.id) : null;

  /* ── Load ── */
  useEffect(() => {
    async function loadProduct() {
      try {
        const res = await fetch(`/api/products/${id}`);
        const data = await res.json();
        setProduct(data.data);
      } catch (err) {
        console.error("Error loading product:", err);
      } finally {
        setLoading(false);
      }
    }
    loadProduct();
  }, [id]);

  /* ── Derived ── */
  const subtotal = product ? product.price * qty : 0;
  const serviceFee = 1000;
  const totalPayment = subtotal + serviceFee;

  const showToast = (message: string, type: string) => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  /* ── Place Order ── */
  async function handlePlaceOrder() {
    if (!product) return;
    if (status === "unauthenticated" || !userId) {
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
          items: [
            {
              product_id: product.id,
              quantity: qty,
              price: product.price,
              name: product.name,
            },
          ],
        }),
      });
      if (res.status === 401) {
        router.push("/login");
        return;
      }
      const data = await res.json();
      if (!res.ok) {
        showToast(data.message || "Gagal membuat pesanan", "error");
        setSubmitting(false);
        return;
      }
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
        <p className="state-text">Memuat produk...</p>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="page-container state-screen">
        <div className="state-icon">
          <PackageOpen size={34} />
        </div>
        <h2 className="state-title">Produk Tidak Ditemukan</h2>
        <p className="state-text">
          Maaf, produk yang kamu cari tidak tersedia.
        </p>
        <Link href="/">
          <button className="btn btn-primary">Kembali ke Home</button>
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
            <p className="header-subtitle">Beli langsung</p>
          </div>
          <div className="header-badge">Gratis Ongkir</div>
        </div>
      </header>

      {/* ── Main ── */}
      <main className="page-main" style={{ paddingBottom: 100 }}>
        {/* Product Card */}
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
                Produk
              </p>
              <p
                style={{ fontSize: 12, color: "var(--gray-500)", marginTop: 2 }}
              >
                Detail barang yang dibeli
              </p>
            </div>
          </div>

          {/* Item row */}
          <div className="item-row" style={{ marginBottom: 20 }}>
            <img
              src={
                product.image_url ||
                `https://picsum.photos/seed/${product.id}/120/120`
              }
              alt={product.name}
              className="item-row-img"
              style={{ width: 80, height: 80 }}
              onError={(e) => {
                (e.target as HTMLImageElement).src =
                  `https://picsum.photos/seed/${product.id}/120/120`;
              }}
            />
            <div className="item-row-body">
              <p className="item-row-name">{product.name}</p>
              <p
                style={{
                  fontSize: 11,
                  color: "var(--gray-500)",
                  marginBottom: 5,
                }}
              >
                {product.category}
              </p>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 4,
                  marginBottom: 6,
                }}
              >
                <Star size={11} fill="var(--warning)" color="var(--warning)" />
                <span
                  style={{
                    fontSize: 12,
                    fontWeight: 600,
                    color: "var(--gray-700)",
                  }}
                >
                  {product.rating}
                </span>
              </div>
              <span className="item-row-price">
                Rp {formatPrice(product.price)}
              </span>
            </div>
          </div>

          {/* Quantity */}
          <div>
            <p
              style={{
                fontSize: 13,
                fontWeight: 700,
                color: "var(--gray-700)",
                marginBottom: 10,
              }}
            >
              Jumlah Pembelian
            </p>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div className="qty-control">
                <button
                  className="qty-btn"
                  onClick={() => setQty(Math.max(1, qty - 1))}
                  disabled={qty <= 1}
                  aria-label="Kurangi"
                >
                  <Minus size={13} />
                </button>
                <input
                  type="number"
                  className="qty-input"
                  min={1}
                  max={product.stock}
                  value={qty}
                  onChange={(e) =>
                    setQty(
                      Math.max(
                        1,
                        Math.min(product.stock, Number(e.target.value)),
                      ),
                    )
                  }
                />
                <button
                  className="qty-btn"
                  onClick={() => setQty(Math.min(product.stock, qty + 1))}
                  disabled={qty >= product.stock}
                  aria-label="Tambah"
                >
                  <Plus size={13} />
                </button>
              </div>
              <span style={{ fontSize: 12, color: "var(--gray-500)" }}>
                Stok: {product.stock} unit
              </span>
            </div>
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
              <span>Subtotal ({qty} produk)</span>
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
