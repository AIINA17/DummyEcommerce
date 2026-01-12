"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";

/* =======================
   TYPES
======================= */
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

/* =======================
   PAYMENT CONFIG
======================= */
const PAYMENT_METHODS = [
  { value: "VA_BCA", label: "Virtual Account BCA", desc: "ATM / m-Banking BCA", icon: "🏦" },
  { value: "VA_BRI", label: "Virtual Account BRI", desc: "Transfer cepat", icon: "🏦" },
  { value: "VA_Mandiri", label: "Virtual Account Mandiri", desc: "Pembayaran instan", icon: "🏦" },
  { value: "GoPay", label: "GoPay", desc: "E-wallet terpopuler", icon: "💚" },
  { value: "OVO", label: "OVO", desc: "Cashback s.d 10%", icon: "💜" },
  { value: "ShopeePay", label: "ShopeePay", desc: "Promo eksklusif", icon: "🧡" },
  { value: "DANA", label: "DANA", desc: "Bayar praktis", icon: "💙" },
];

/* =======================
   PAGE
======================= */
export default function CheckoutProductPage() {
  const { id } = useParams();
  const router = useRouter();
  const { data: session, status } = useSession();

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [qty, setQty] = useState(1);
  const [payment, setPayment] = useState("GoPay");
  const [toast, setToast] = useState<{ message: string; type: string } | null>(null);

  const userId = session?.user?.id ? Number(session.user.id) : null;

  /* =======================
     LOAD PRODUCT
  ======================= */
  useEffect(() => {
    async function loadProduct() {
      try {
        const res = await fetch(`/api/products/${id}`);
        const data = await res.json();
        setProduct(data.data);
      } catch (error) {
        console.error("Error loading product:", error);
      } finally {
        setLoading(false);
      }
    }
    loadProduct();
  }, [id]);

  /* =======================
     COMPUTED VALUES
  ======================= */
  const subtotal = product ? product.price * qty : 0;
  const serviceFee = 1000;
  const shippingCost = 0;
  const totalPayment = subtotal + serviceFee + shippingCost;

  /* =======================
     FORMAT PRICE
  ======================= */
  function formatPrice(price: number) {
    return new Intl.NumberFormat("id-ID").format(price);
  }

  /* =======================
     SHOW TOAST
  ======================= */
  function showToast(message: string, type: string) {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  }

  /* =======================
     PLACE ORDER
  ======================= */
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
          items: [{
            product_id: product.id,
            quantity: qty,
            price: product.price,
            name: product.name,
          }],
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

      showToast("Pesanan berhasil dibuat! 🎉", "success");

      setTimeout(() => {
        router.push("/orders");
      }, 1500);

    } catch (error) {
      console.error("Error placing order:", error);
      showToast("Terjadi kesalahan", "error");
      setSubmitting(false);
    }
  }

  /* =======================
     LOADING STATE
  ======================= */
  if (loading) {
    return (
      <div className="checkout-page">
        <div className="checkout-loading">
          <div className="checkout-spinner"></div>
          <p>Memuat produk...</p>
        </div>
      </div>
    );
  }

  /* =======================
     NOT FOUND STATE
  ======================= */
  if (!product) {
    return (
      <div className="checkout-page">
        <div className="checkout-empty">
          <div className="checkout-empty-icon">😕</div>
          <h2>Produk Tidak Ditemukan</h2>
          <p>Maaf, produk yang kamu cari tidak tersedia.</p>
          <Link href="/">
            <button className="btn btn-primary">🏠 Kembali ke Home</button>
          </Link>
        </div>
      </div>
    );
  }

  /* =======================
     MAIN UI
  ======================= */
  return (
    <div className="checkout-page">
      {/* Header */}
      <header className="checkout-header">
        <div className="checkout-header-content">
          <button onClick={() => router.back()} className="checkout-back-btn">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M19 12H5M12 19l-7-7 7-7"/>
            </svg>
          </button>
          <div className="checkout-header-text">
            <h1>Checkout</h1>
            <p>Beli langsung</p>
          </div>
          <div className="checkout-badge">✨ Gratis Ongkir</div>
        </div>
      </header>

      {/* Main Content */}
      <main className="checkout-main">
        
        {/* Product Section */}
        <section className="checkout-card">
          <div className="checkout-card-header">
            <div className="checkout-card-icon">🛍️</div>
            <div>
              <h2>Produk</h2>
              <p>Detail barang yang dibeli</p>
            </div>
          </div>
          
          <div className="checkout-product-single">
            <img
              src={product.image_url || `https://picsum.photos/seed/${product.id}/120/120`}
              alt={product.name}
              className="checkout-product-image"
              onError={(e) => {
                (e.target as HTMLImageElement).src = `https://picsum.photos/seed/${product.id}/120/120`;
              }}
            />
            <div className="checkout-product-info">
              <h3>{product.name}</h3>
              <p className="checkout-product-category">{product.category}</p>
              <div className="checkout-product-rating">
                <span>⭐</span>
                <span>{product.rating}</span>
              </div>
              <p className="checkout-product-price">Rp {formatPrice(product.price)}</p>
            </div>
          </div>

          {/* Quantity Selector */}
          <div className="checkout-quantity-section">
            <label>Jumlah</label>
            <div className="checkout-quantity-control">
              <button 
                onClick={() => setQty(Math.max(1, qty - 1))}
                disabled={qty <= 1}
                className="checkout-qty-btn"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="5" y1="12" x2="19" y2="12"/>
                </svg>
              </button>
              <input 
                type="number" 
                min={1} 
                max={product.stock}
                value={qty} 
                onChange={e => setQty(Math.max(1, Math.min(product.stock, Number(e.target.value))))}
                className="checkout-qty-input"
              />
              <button 
                onClick={() => setQty(Math.min(product.stock, qty + 1))}
                disabled={qty >= product.stock}
                className="checkout-qty-btn"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="12" y1="5" x2="12" y2="19"/>
                  <line x1="5" y1="12" x2="19" y2="12"/>
                </svg>
              </button>
            </div>
            <span className="checkout-stock-info">Stok: {product.stock}</span>
          </div>
        </section>

        {/* Payment Methods Section */}
        <section className="checkout-card">
          <div className="checkout-card-header">
            <div className="checkout-card-icon">💳</div>
            <div>
              <h2>Metode Pembayaran</h2>
              <p>Pilih cara bayar yang nyaman</p>
            </div>
          </div>
          
          <div className="payment-methods-grid">
            {PAYMENT_METHODS.map((method) => (
              <button
                key={method.value}
                className={`payment-method-card ${payment === method.value ? 'selected' : ''}`}
                onClick={() => setPayment(method.value)}
              >
                <div className="payment-method-icon">{method.icon}</div>
                <div className="payment-method-info">
                  <span className="payment-method-label">{method.label}</span>
                  <span className="payment-method-desc">{method.desc}</span>
                </div>
                <div className="payment-method-check">
                  {payment === method.value && (
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                      <polyline points="20 6 9 17 4 12"/>
                    </svg>
                  )}
                </div>
              </button>
            ))}
          </div>
        </section>

        {/* Order Summary Section */}
        <section className="checkout-card">
          <div className="checkout-card-header">
            <div className="checkout-card-icon">📋</div>
            <div>
              <h2>Rincian Pembayaran</h2>
              <p>Detail biaya pesanan</p>
            </div>
          </div>
          
          <div className="order-summary">
            <div className="order-summary-row">
              <span>Subtotal ({qty} produk)</span>
              <span>Rp {formatPrice(subtotal)}</span>
            </div>
            <div className="order-summary-row">
              <span>Ongkos Kirim</span>
              <span className="text-success">Gratis</span>
            </div>
            <div className="order-summary-row">
              <span>Biaya Layanan</span>
              <span>Rp {formatPrice(serviceFee)}</span>
            </div>
            <div className="order-summary-row total">
              <span>Total Pembayaran</span>
              <span>Rp {formatPrice(totalPayment)}</span>
            </div>
          </div>
        </section>
      </main>

      {/* Fixed Bottom CTA */}
      <div className="checkout-footer">
        <div className="checkout-footer-content">
          <div className="checkout-footer-total">
            <p>Total Pembayaran</p>
            <p className="checkout-footer-price">Rp {formatPrice(totalPayment)}</p>
          </div>
          
          <button
            disabled={submitting}
            onClick={handlePlaceOrder}
            className="btn btn-primary checkout-pay-btn"
          >
            {submitting ? (
              <>
                <span className="btn-spinner"></span>
                Memproses...
              </>
            ) : (
              "Bayar Sekarang"
            )}
          </button>
        </div>
      </div>

      {/* Toast */}
      {toast && <div className={`toast ${toast.type}`}>{toast.message}</div>}
    </div>
  );
}