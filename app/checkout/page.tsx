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
} from "lucide-react";
import PaymentMethodPicker from "@/app/components/PaymentMethodPicker";
import OrderSummaryCard from "@/app/components/OrderSummaryCard";
import { SERVICE_FEE } from "@/lib/constants";
import BlurText from "@/app/components/reactbits/BlurText/BlurText";
import StarBorder from "@/app/components/reactbits/StarBorder/StarBorder";

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
      const res = await fetch(`/api/cart`);
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
          payment_method: payment,
          items: cartItems.map((item) => ({
            product_id: item.products.id,
            quantity: item.quantity,
          })),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        showToast(data.message || "Gagal membuat pesanan", "error");
        setSubmitting(false);
        return;
      }

      // Bersihkan item yang sudah dibeli dari keranjang. Kalau ada yang
      // gagal terhapus, tetap beri tahu user daripada diam-diam
      // meninggalkan item yang sudah dibayar di keranjang.
      const deleteResults = await Promise.all(
        cartItems.map((item) =>
          fetch(`/api/cart?cart_id=${item.id}`, { method: "DELETE" }).then(
            (r) => r.ok,
          ),
        ),
      );
      if (deleteResults.some((ok) => !ok)) {
        showToast(
          "Pesanan berhasil dibuat, tapi ada item yang gagal dihapus dari keranjang",
          "error",
        );
        setTimeout(() => router.push("/orders"), 2000);
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
          <div className="section-header">
            <div className="section-header-icon">
              <ShoppingBag size={20} />
            </div>
            <div>
              <BlurText text="Ringkasan Pesanan" className="section-header-title" />
              <p className="section-header-subtitle">{totalItems} produk</p>
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
          <div className="section-header">
            <div className="section-header-icon">
              <CreditCard size={20} />
            </div>
            <div>
              <BlurText text="Metode Pembayaran" className="section-header-title" />
              <p className="section-header-subtitle">
                Pilih cara bayar yang nyaman
              </p>
            </div>
          </div>

          <PaymentMethodPicker value={payment} onChange={setPayment} />
        </div>

        {/* Payment Detail */}
        <div className="card">
          <div className="section-header">
            <div className="section-header-icon">
              <Receipt size={20} />
            </div>
            <div>
              <BlurText text="Rincian Pembayaran" className="section-header-title" />
              <p className="section-header-subtitle">Detail biaya pesanan</p>
            </div>
          </div>

          <OrderSummaryCard itemCount={totalItems} subtotal={subtotal} />
        </div>
      </main>

      {/* ── Sticky Footer ── */}
      <div className="checkout-footer">
        <div className="checkout-footer-inner">
          <div className="checkout-footer-total">
            <p className="checkout-footer-label">Total Pembayaran</p>
            <p className="checkout-footer-price">
              Rp {formatPrice(subtotal + SERVICE_FEE)}
            </p>
          </div>
          <StarBorder
            as="button"
            style={{ flexShrink: 0 }}
            innerClassName="btn btn-primary"
            color="#ffd280"
            thickness={2}
            disabled={submitting}
            onClick={handlePlaceOrder}
          >
            <span style={{ padding: "8px 24px", display: "inline-flex", alignItems: "center", gap: 7 }}>
              {submitting ? (
                <>
                  <span className="spinner-sm" /> Memproses...
                </>
              ) : (
                "Bayar Sekarang"
              )}
            </span>
          </StarBorder>
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
