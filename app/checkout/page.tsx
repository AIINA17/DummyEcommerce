"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
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
  stock: number;
}

interface CartItem {
  id: number;
  product_id: number;
  quantity: number;
  products: Product;
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
export default function CheckoutPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [payment, setPayment] = useState("GoPay");
  const [toast, setToast] = useState<{ message: string; type: string } | null>(null);

  const userId = session?.user?.id ? Number(session.user.id) : null;

  /* =======================
     LOAD CART
  ======================= */
  async function loadCart() {
    if (!userId) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/cart?user_id=${userId}`);
      const data = await res.json();
      setCartItems(data.data || []);
    } catch (error) {
      console.error("Error loading cart:", error);
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
    if (status === "authenticated" && userId) {
      loadCart();
    }
  }, [status, userId]);

  /* =======================
     COMPUTED VALUES
  ======================= */
  const { subtotal, totalItems } = useMemo(() => {
    const subtotal = cartItems.reduce(
      (sum, i) => sum + i.products.price * i.quantity, 0
    );
    const totalItems = cartItems.reduce((s, i) => s + i.quantity, 0);
    return { subtotal, totalItems };
  }, [cartItems]);

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
     CLEAR CART AFTER ORDER
  ======================= */
  async function clearCart() {
    for (const item of cartItems) {
      await fetch(`/api/cart?cart_id=${item.id}`, { method: "DELETE" });
    }
  }

  /* =======================
     PLACE ORDER
  ======================= */
  async function handlePlaceOrder() {
    if (!cartItems.length) return;
    if (!userId) {
      router.push("/login");
      return;
    }
    setSubmitting(true);

    try {
      // Prepare items for order
      const items = cartItems.map(item => ({
        product_id: item.products.id,
        quantity: item.quantity,
        price: item.products.price,
        name: item.products.name,
      }));

      // Create order via API
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: userId,
          payment_method: payment,
          items,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        showToast(data.message || "Gagal membuat pesanan", "error");
        setSubmitting(false);
        return;
      }

      // Clear cart after successful order
      await clearCart();

      showToast("Pesanan berhasil dibuat! 🎉", "success");
      
      // Redirect to orders page
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
          <p>Memuat data...</p>
        </div>
      </div>
    );
  }

  /* =======================
     EMPTY STATE
  ======================= */
  if (!cartItems.length) {
    return (
      <div className="checkout-page">
        <div className="checkout-empty">
          <div className="checkout-empty-icon">🛒</div>
          <h2>Keranjang Kosong</h2>
          <p>Yuk, mulai belanja dan temukan produk favoritmu!</p>
          <Link href="/">
            <button className="btn btn-primary">🛍️ Mulai Belanja</button>
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
            <p>{totalItems} item di keranjang</p>
          </div>
          <div className="checkout-badge">✨ Gratis Ongkir</div>
        </div>
      </header>

      {/* Main Content */}
      <main className="checkout-main">
        
        {/* Products Section */}
        <section className="checkout-card">
          <div className="checkout-card-header">
            <div className="checkout-card-icon">🛍️</div>
            <div>
              <h2>Ringkasan Pesanan</h2>
              <p>{totalItems} produk</p>
            </div>
          </div>
          
          <div className="checkout-items">
            {cartItems.map((item, index) => (
              <div key={item.id} className="checkout-item" style={{ animationDelay: `${index * 0.1}s` }}>
                <img
                  src={item.products.image_url || `https://picsum.photos/seed/${item.product_id}/80/80`}
                  alt={item.products.name}
                  className="checkout-item-image"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = `https://picsum.photos/seed/${item.product_id}/80/80`;
                  }}
                />
                <div className="checkout-item-details">
                  <h3>{item.products.name}</h3>
                  <p className="checkout-item-category">{item.products.category}</p>
                  <div className="checkout-item-bottom">
                    <span className="checkout-item-price">Rp {formatPrice(item.products.price)}</span>
                    <span className="checkout-item-qty">x{item.quantity}</span>
                  </div>
                </div>
              </div>
            ))}
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
              <span>Subtotal ({totalItems} produk)</span>
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