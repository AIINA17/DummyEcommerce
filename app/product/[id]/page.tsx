"use client";
// app/product/[id]/page.tsx

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import {
  ArrowLeft, ShoppingCart, Eye, Star,
  CheckCircle2, AlertTriangle, XCircle, PackageOpen,
  Minus, Plus,
} from "lucide-react";

/* =======================  TYPES  ======================= */
interface Product {
  id: number; name: string; description: string | null;
  price: number; category: string; rating: number; stock: number; image_url: string | null;
}

/* =======================  HELPERS  ======================= */
const formatPrice = (price: number) =>
  new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(price);

type StockInfo = { label: string; cls: string; icon: React.ReactNode };
const getStockInfo = (stock: number): StockInfo => {
  if (stock === 0) return { label: "Habis",    cls: "status-badge--error",   icon: <XCircle size={12} />       };
  if (stock < 10)  return { label: "Terbatas", cls: "status-badge--warning", icon: <AlertTriangle size={12} /> };
  return                  { label: "Tersedia", cls: "status-badge--success", icon: <CheckCircle2 size={12} />  };
};

const shuffleArray = <T,>(arr: T[]): T[] => {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};

/* =======================  MAIN PAGE  ======================= */
export default function ProductDetail() {
  const { id }    = useParams();
  const router    = useRouter();
  const { data: session, status } = useSession();
  const userId    = session?.user?.id ? Number(session.user.id) : null;

  const [product,  setProduct]  = useState<Product | null>(null);
  const [related,  setRelated]  = useState<Product[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [toast,    setToast]    = useState<{ message: string; type: "success" | "error" } | null>(null);

  /* ── Data ── */
  const loadProduct = async () => {
    setLoading(true);
    try {
      const res  = await fetch(`/api/products/${id}`);
      const json = await res.json();
      if (!json.success) { setProduct(null); return; }

      const cur = json.data;
      setProduct(cur);

      const resAll = await fetch(`/api/products?category=${cur.category}`);
      const all    = await resAll.json();
      let filtered: Product[] = [];

      if (all.success && Array.isArray(all.data)) {
        filtered = all.data.filter((p: Product) => p.id !== cur.id);
        if (filtered.length === 0) {
          const fb = await (await fetch("/api/products")).json();
          filtered = fb.data.filter((p: Product) => p.id !== cur.id);
        }
      }
      setRelated(shuffleArray(filtered).slice(0, 4));
    } catch (err) {
      console.error(err); setProduct(null);
    } finally {
      setLoading(false);
    }
  };

  const addToCart = async () => {
    if (!userId || status !== "authenticated") {
      showToast("Silakan login terlebih dahulu", "error");
      setTimeout(() => router.push("/login"), 1500);
      return;
    }
    try {
      const res = await fetch("/api/cart", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: userId, product_id: product?.id, quantity }),
      });
      showToast(
        res.ok ? `${quantity} item berhasil ditambahkan ke keranjang!` : "Gagal menambahkan ke keranjang",
        res.ok ? "success" : "error"
      );
    } catch { showToast("Terjadi kesalahan", "error"); }
  };

  const showToast = (message: string, type: "success" | "error") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  useEffect(() => {
    if (id) { loadProduct(); window.scrollTo({ top: 0, behavior: "smooth" }); }
  }, [id]);

  /* ── Loading / Not Found ── */
  if (loading) {
    return (
      <div className="page-container state-screen">
        <div className="spinner" />
        <p className="state-text">Memuat detail produk...</p>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="page-container state-screen">
        <div className="state-icon"><PackageOpen size={34} /></div>
        <h2 className="state-title">Produk Tidak Ditemukan</h2>
        <p className="state-text">Maaf, produk yang kamu cari tidak tersedia.</p>
        <Link href="/"><button className="btn btn-primary">Kembali ke Beranda</button></Link>
      </div>
    );
  }

  const stockInfo = getStockInfo(product.stock);

  return (
    <div className="page-container">

      {/* ── Header ── */}
      <header className="page-header-bar">
        <div className="page-header-bar-inner" style={{ maxWidth: 1100 }}>
          <button onClick={() => router.back()} className="back-btn" aria-label="Kembali">
            <ArrowLeft size={18} />
          </button>
          <div className="header-text">
            <h1 className="header-title">Detail Produk</h1>
            <p className="header-subtitle">{product.category}</p>
          </div>
        </div>
      </header>

      {/* ── Content ── */}
      <main style={{ maxWidth: 1100, margin: "0 auto", padding: "28px 24px 80px" }}>

        {/* Product Card */}
        <article
          className="card"
          style={{ display: "grid", gridTemplateColumns: "1fr 1fr", padding: 0, overflow: "hidden", marginBottom: 40 }}
        >
          {/* Image */}
          <div style={{ position: "relative", background: "var(--gray-100)", overflow: "hidden" }}>
            <img
              src={product.image_url || `https://picsum.photos/seed/${product.id}/800/800`}
              alt={product.name}
              style={{ width: "100%", aspectRatio: "1", objectFit: "cover", display: "block", transition: "transform .4s ease" }}
              onMouseEnter={(e) => (e.currentTarget.style.transform = "scale(1.04)")}
              onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
            />
            <div style={{
              position: "absolute", top: 16, right: 16,
              background: "rgba(255,255,255,.96)", backdropFilter: "blur(8px)",
              padding: "8px 16px", borderRadius: "var(--radius-pill)",
              display: "flex", alignItems: "center", gap: 6,
              boxShadow: "var(--shadow-md)", fontWeight: 700, fontSize: 14,
            }}>
              <Star size={14} fill="var(--warning)" color="var(--warning)" />
              {product.rating.toFixed(1)}
            </div>
          </div>

          {/* Info */}
          <div style={{ padding: 36, display: "flex", flexDirection: "column", gap: 24 }}>

            {/* Title */}
            <div style={{ paddingBottom: 20, borderBottom: "1px solid var(--gray-200)" }}>
              <h2 style={{ fontSize: 24, fontWeight: 800, color: "var(--gray-900)", lineHeight: 1.25, marginBottom: 12 }}>
                {product.name}
              </h2>
              <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                <span className={`status-badge ${stockInfo.cls}`}>{stockInfo.icon} {stockInfo.label}</span>
                <span style={{ fontSize: 12, color: "var(--gray-500)" }}>{product.stock} unit tersedia</span>
              </div>
            </div>

            {/* Price */}
            <div>
              <p style={{ fontSize: 11, fontWeight: 700, color: "var(--gray-500)", textTransform: "uppercase", letterSpacing: ".08em", marginBottom: 6 }}>
                Harga Produk
              </p>
              <p style={{ fontSize: 30, fontWeight: 900, color: "var(--primary)", letterSpacing: "-.03em" }}>
                {formatPrice(product.price)}
              </p>
            </div>

            {/* Description */}
            <div style={{ background: "var(--gray-50)", borderRadius: "var(--radius-lg)", padding: "16px 18px", border: "1px solid var(--gray-200)" }}>
              <p style={{ fontSize: 11, fontWeight: 700, color: "var(--gray-500)", textTransform: "uppercase", letterSpacing: ".08em", marginBottom: 8 }}>
                Deskripsi
              </p>
              <p style={{ fontSize: 14, lineHeight: 1.7, color: "var(--gray-600)" }}>
                {product.description || "Belum ada deskripsi untuk produk ini."}
              </p>
            </div>

            {/* Quantity */}
            <div>
              <p style={{ fontSize: 13, fontWeight: 700, color: "var(--gray-700)", marginBottom: 10 }}>Jumlah Pembelian</p>
              <div className="qty-control">
                <button className="qty-btn" onClick={() => setQuantity(Math.max(1, quantity - 1))} disabled={quantity <= 1} aria-label="Kurangi">
                  <Minus size={14} />
                </button>
                <input type="text" className="qty-input" value={quantity} readOnly style={{ width: 60 }} />
                <button className="qty-btn" onClick={() => setQuantity(Math.min(product.stock, quantity + 1))} disabled={quantity >= product.stock} aria-label="Tambah">
                  <Plus size={14} />
                </button>
              </div>
              <p style={{ fontSize: 12, color: "var(--gray-400)", marginTop: 8 }}>Maksimal {product.stock} unit tersedia</p>
            </div>

            {/* Actions */}
            <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: "auto" }}>
              <button className="btn btn-primary" style={{ padding: "14px" }} onClick={addToCart} disabled={product.stock === 0}>
                <ShoppingCart size={16} /> Tambah ke Keranjang
              </button>
              <Link href="/cart" style={{ display: "block" }}>
                <button className="btn btn-secondary btn-full" style={{ padding: "13px" }}>
                  <Eye size={16} /> Lihat Keranjang
                </button>
              </Link>
            </div>

          </div>
        </article>

        {/* Related Products */}
        {related.length > 0 && (
          <section>
            <div style={{ marginBottom: 20 }}>
              <h3 style={{ fontSize: 20, fontWeight: 800, color: "var(--gray-900)" }}>Produk Serupa</h3>
              <p style={{ fontSize: 13, color: "var(--gray-500)", marginTop: 4 }}>Rekomendasi dari kategori yang sama</p>
            </div>
            <div className="product-grid" style={{ gridTemplateColumns: "repeat(4, 1fr)" }}>
              {related.map((p, i) => {
                const rs = getStockInfo(p.stock);
                return (
                  <Link key={p.id} href={`/product/${p.id}`} className="product-card" style={{ animationDelay: `${i * 0.07}s` }}>
                    <div style={{ position: "relative", overflow: "hidden" }}>
                      <img
                        src={p.image_url || `https://picsum.photos/seed/${p.id}/400/400`}
                        alt={p.name} className="product-image" loading="lazy"
                      />
                      <div style={{
                        position: "absolute", top: 10, right: 10,
                        background: "rgba(255,255,255,.95)", backdropFilter: "blur(6px)",
                        padding: "4px 10px", borderRadius: "var(--radius-pill)",
                        fontSize: 11, fontWeight: 700,
                        display: "flex", alignItems: "center", gap: 4,
                        boxShadow: "var(--shadow-sm)",
                      }}>
                        <Star size={11} fill="var(--warning)" color="var(--warning)" />
                        {p.rating.toFixed(1)}
                      </div>
                    </div>
                    <div className="product-info">
                      <h4 className="product-name">{p.name}</h4>
                      <p className="product-price">{formatPrice(p.price)}</p>
                      <div className="product-meta">
                        <span className={`status-badge ${rs.cls}`} style={{ fontSize: 10, padding: "3px 8px" }}>
                          {rs.icon} {p.stock}
                        </span>
                        <span className="product-category">{p.category}</span>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </section>
        )}

      </main>

      {toast && <div className={`toast ${toast.type}`}>{toast.message}</div>}

      <style>{`
        @media (max-width: 768px) {
          article.card { grid-template-columns: 1fr !important; }
          .product-grid { grid-template-columns: repeat(2, 1fr) !important; }
        }
      `}</style>
    </div>
  );
}