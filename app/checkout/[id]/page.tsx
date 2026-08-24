"use client";
// app/checkout/[id]/page.tsx — "Beli Sekarang" (checkout 1 produk langsung)

import { useParams, useRouter, useSearchParams } from "next/navigation";
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
  Minus,
  Plus,
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
  rating: number;
  stock: number;
  description: string;
}

/* =======================  HELPERS  ======================= */
const formatPrice = (p: number) => new Intl.NumberFormat("id-ID").format(p);

/* =======================  PAGE  ======================= */
export default function CheckoutProductPage() {
  const { id } = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session, status } = useSession();

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [qty, setQty] = useState(1);
  const [payment, setPayment] = useState("ShopKuPay");
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
        const requestedQty = parseInt(searchParams.get("qty") || "1");
        if (data.data && Number.isFinite(requestedQty) && requestedQty > 0) {
          setQty(Math.min(requestedQty, data.data.stock || 1));
        }
      } catch (err) {
        console.error("Error loading product:", err);
      } finally {
        setLoading(false);
      }
    }
    loadProduct();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  /* ── Derived ── */
  const subtotal = product ? product.price * qty : 0;

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
          payment_method: payment,
          items: [
            {
              product_id: product.id,
              quantity: qty,
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
          <div className="section-header">
            <div className="section-header-icon">
              <ShoppingBag size={20} />
            </div>
            <div>
              <BlurText text="Produk" className="section-header-title" />
              <p className="section-header-subtitle">
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

          <OrderSummaryCard itemCount={qty} subtotal={subtotal} />
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
