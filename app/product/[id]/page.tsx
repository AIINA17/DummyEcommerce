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
  description: string | null;
  price: number;
  category: string;
  rating: number;
  stock: number;
  image_url: string | null;
}

/* =======================
    HELPER FUNCTIONS
======================= */
const formatPrice = (price: number) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(price);

const getStockStatus = (stock: number) => {
  if (stock === 0) return { label: "Habis", color: "error", icon: "❌", bg: "#fee2e2" };
  if (stock < 10) return { label: "Terbatas", color: "warning", icon: "⚠️", bg: "#fef3c7" };
  return { label: "Tersedia", color: "success", icon: "✅", bg: "#d1fae5" };
};

// Fungsi untuk mengacak array (Fisher-Yates Shuffle)
const shuffleArray = (array: any[]) => {
  const newArr = [...array];
  for (let i = newArr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArr[i], newArr[j]] = [newArr[j], newArr[i]];
  }
  return newArr;
};

/* =======================
    MAIN COMPONENT
======================= */
export default function ProductDetail() {
  const { id } = useParams();
  const router = useRouter();
  const { data: session, status } = useSession();
  const userId = session?.user?.id ? Number(session.user.id) : null;

  const [product, setProduct] = useState<Product | null>(null);
  const [related, setRelated] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  /* =======================
      DATA LOADING
  ======================= */
  const loadProduct = async () => {
    setLoading(true);
    try {
      // Ambil data produk utama
      const res = await fetch(`/api/products/${id}`);
      const json = await res.json();

      if (!json.success) {
        setProduct(null);
        return;
      }

      const currentProduct = json.data;
      setProduct(currentProduct);

      // Ambil data untuk rekomendasi (kategori sama)
      const resAll = await fetch(`/api/products?category=${currentProduct.category}`);
      const all = await resAll.json();

      if (all.success && Array.isArray(all.data)) {
        // Filter agar produk yang sedang dibuka tidak muncul di rekomendasi
        let filtered = all.data.filter((p: Product) => p.id !== currentProduct.id);

        // Fallback: Jika di kategori tersebut cuma ada 1 produk
        if (filtered.length === 0) {
          const resFallback = await fetch(`/api/products`);
          const fallbackJson = await resFallback.json();
          filtered = fallbackJson.data.filter((p: Product) => p.id !== currentProduct.id);
        }

        // Acak dan ambil 4 produk
        const randomProducts = shuffleArray(filtered).slice(0, 4);
        setRelated(randomProducts);
      }
    } catch (err) {
      console.error("Fetch Error:", err);
      setProduct(null);
    } finally {
      setLoading(false);
    }
  };

  const addToCart = async () => {
    if (!userId || status !== "authenticated") {
      setToast({ message: "Silakan login terlebih dahulu", type: "error" });
      setTimeout(() => router.push("/login"), 1500);
      return;
    }

    try {
      const res = await fetch("/api/cart", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: userId,
          product_id: product?.id,
          quantity: quantity,
        }),
      });

      if (res.ok) {
        setToast({ message: `${quantity} item berhasil ditambahkan! 🛒`, type: "success" });
      } else {
        setToast({ message: "Gagal menambahkan ke keranjang", type: "error" });
      }
    } catch (error) {
      setToast({ message: "Terjadi kesalahan", type: "error" });
    }
  };

  useEffect(() => {
    if (id) {
      loadProduct();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [id]);

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  /* =======================
      RENDER STATES
  ======================= */
  if (loading) {
    return (
      <div className="page-container">
        <div className="loading">
          <div className="checkout-spinner"></div>
          <p>Memuat detail produk...</p>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="page-container">
        <div className="empty-state">
          <div className="empty-icon">📦</div>
          <h2>Produk Tidak Ditemukan</h2>
          <p>Maaf, produk yang Anda cari tidak tersedia</p>
          <Link href="/">
            <button className="btn btn-primary">🏠 Kembali ke Beranda</button>
          </Link>
        </div>
      </div>
    );
  }

  const stockStatus = getStockStatus(product.stock);

  return (
    <div className="page-container">
      {/* HEADER */}
      <header className="page-header">
        <div className="header-wrapper">
          <button onClick={() => router.back()} className="back-btn" aria-label="Kembali">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
          </button>
          <div className="header-text">
            <h1>Detail Produk</h1>
            <p>{product.category}</p>
          </div>
        </div>
      </header>

      {/* MAIN CONTENT */}
      <main className="main-wrapper">
        <div className="container">
          {/* PRODUCT DETAIL CARD */}
          <article className="product-card">
            {/* Product Image */}
            <div className="image-container">
              <div className="image-box">
                <img
                  src={product.image_url || `https://picsum.photos/seed/${product.id}/800/800`}
                  alt={product.name}
                  className="product-img"
                />
                <div className="rating-tag">
                  <span className="star-icon">⭐</span>
                  <span className="rating-num">{product.rating.toFixed(1)}</span>
                </div>
              </div>
            </div>

            {/* Product Info */}
            <div className="info-container">
              {/* Title Section */}
              <div className="title-section">
                <h2 className="product-title">{product.name}</h2>
                <span className="category-tag">{product.category}</span>
              </div>

              {/* Price & Stock Section */}
              <div className="price-section">
                <div className="price-box">
                  <span className="price-label">Harga Produk</span>
                  <h3 className="product-price">{formatPrice(product.price)}</h3>
                </div>
                <div className="stock-box" style={{ background: stockStatus.bg }}>
                  <span className="stock-icon">{stockStatus.icon}</span>
                  <div className="stock-text">
                    <span className="stock-status">{stockStatus.label}</span>
                    <span className="stock-qty">{product.stock} unit</span>
                  </div>
                </div>
              </div>

              {/* Description Section */}
              <div className="desc-section">
                <h4 className="desc-title">Deskripsi Produk</h4>
                <p className="desc-text">
                  {product.description || "Belum ada deskripsi untuk produk ini."}
                </p>
              </div>

              {/* Quantity Section */}
              <div className="qty-section">
                <label className="qty-label">Jumlah Pembelian</label>
                <div className="qty-controls">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="qty-btn"
                    disabled={quantity <= 1}
                    aria-label="Kurangi jumlah"
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                      <path d="M5 12h14" />
                    </svg>
                  </button>
                  <div className="qty-display">
                    <span className="qty-value">{quantity}</span>
                  </div>
                  <button
                    onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}
                    className="qty-btn"
                    disabled={quantity >= product.stock}
                    aria-label="Tambah jumlah"
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                      <path d="M12 5v14M5 12h14" />
                    </svg>
                  </button>
                </div>
                <p className="qty-hint">Maksimal {product.stock} unit tersedia</p>
              </div>

              {/* Action Buttons */}
              <div className="action-section">
                <button
                  onClick={addToCart}
                  className="btn btn-primary"
                  disabled={product.stock === 0}
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="9" cy="21" r="1" />
                    <circle cx="20" cy="21" r="1" />
                    <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
                  </svg>
                  Tambah ke Keranjang
                </button>
                <Link href="/cart" className="btn-link">
                  <button className="btn btn-secondary">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="10" />
                      <path d="M12 16v-4M12 8h.01" />
                    </svg>
                    Lihat Keranjang
                  </button>
                </Link>
              </div>
            </div>
          </article>

          {/* RELATED PRODUCTS */}
          {related.length > 0 && (
            <section className="related-section">
              <div className="related-header">
                <div className="related-header-text">
                  <h3 className="related-title">Produk Serupa</h3>
                  <p className="related-subtitle">Rekomendasi produk lainnya dari kategori yang sama</p>
                </div>
              </div>

              <div className="related-grid">
                {related.map((p, index) => {
                  const rStock = getStockStatus(p.stock);
                  return (
                    <Link
                      href={`/product/${p.id}`}
                      key={p.id}
                      className="related-item"
                      style={{ animationDelay: `${index * 0.08}s` }}
                    >
                      <div className="related-img-box">
                        <img
                          src={p.image_url || `https://picsum.photos/seed/${p.id}/400/400`}
                          alt={p.name}
                          className="related-img"
                          loading="lazy"
                        />
                        <div className="related-rating">⭐ {p.rating.toFixed(1)}</div>
                      </div>
                      <div className="related-info">
                        <h4 className="related-name">{p.name}</h4>
                        <p className="related-price">{formatPrice(p.price)}</p>
                        <span className={`related-stock stock-${rStock.color}`}>
                          {rStock.icon} {p.stock} unit
                        </span>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </section>
          )}
        </div>
      </main>

      {/* TOAST NOTIFICATION */}
      {toast && (
        <div className={`toast toast-${toast.type}`}>
          <div className="toast-icon">
            {toast.type === "success" ? "✅" : "❌"}
          </div>
          <span className="toast-msg">{toast.message}</span>
        </div>
      )}

      <style jsx>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&display=swap');

        /* ============================================
           GLOBAL STYLES & RESET
        ============================================ */
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }

        .page-container {
          min-height: 100vh;
          background: linear-gradient(180deg, #f8fafc 0%, #f1f5f9 100%);
          font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif;
          color: #0f172a;
        }

        /* ============================================
           HEADER SECTION
        ============================================ */
        .page-header {
          background: rgba(255, 255, 255, 0.95);
          backdrop-filter: blur(16px);
          border-bottom: 1px solid rgba(0, 0, 0, 0.06);
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
          position: sticky;
          top: 0;
          z-index: 1000;
        }

        .header-wrapper {
          max-width: 1280px;
          margin: 0 auto;
          padding: 18px 24px;
          display: flex;
          align-items: center;
          gap: 16px;
        }

        .back-btn {
          width: 42px;
          height: 42px;
          border: 1.5px solid #e2e8f0;
          background: white;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
          flex-shrink: 0;
        }

        .back-btn:hover {
          background: #ee4d2d;
          border-color: #ee4d2d;
          transform: translateX(-3px);
        }

        .back-btn:hover svg {
          stroke: white;
        }

        .header-text {
          flex: 1;
        }

        .header-text h1 {
          font-size: 1.35rem;
          font-weight: 800;
          color: #0f172a;
          margin: 0 0 2px 0;
          letter-spacing: -0.025em;
        }

        .header-text p {
          font-size: 0.875rem;
          color: #64748b;
          font-weight: 500;
          margin: 0;
        }

        /* ============================================
           MAIN CONTENT
        ============================================ */
        .main-wrapper {
          padding: 32px 20px 80px;
        }

        .container {
          max-width: 1280px;
          margin: 0 auto;
        }

        /* ============================================
           PRODUCT CARD
        ============================================ */
        .product-card {
          background: white;
          border-radius: 24px;
          overflow: hidden;
          box-shadow: 0 4px 24px rgba(0, 0, 0, 0.06);
          margin-bottom: 48px;
          animation: fadeInUp 0.5s cubic-bezier(0.4, 0, 0.2, 1);
          border: 1px solid rgba(0, 0, 0, 0.04);
        }

        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(24px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .image-container {
          position: relative;
          background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
        }

        .image-box {
          position: relative;
          width: 100%;
          padding-bottom: 100%;
          overflow: hidden;
        }

        .product-img {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          object-fit: cover;
          transition: transform 0.4s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .product-card:hover .product-img {
          transform: scale(1.04);
        }

        .rating-tag {
          position: absolute;
          top: 20px;
          right: 20px;
          background: rgba(255, 255, 255, 0.98);
          backdrop-filter: blur(12px);
          padding: 10px 18px;
          border-radius: 100px;
          display: flex;
          align-items: center;
          gap: 7px;
          box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12);
          font-weight: 700;
          animation: popIn 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275) 0.2s backwards;
        }

        @keyframes popIn {
          from {
            opacity: 0;
            transform: scale(0.7);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }

        .star-icon {
          font-size: 1.15rem;
        }

        .rating-num {
          font-size: 0.95rem;
          color: #0f172a;
        }

        /* ============================================
           INFO SECTION
        ============================================ */
        .info-container {
          padding: 36px;
        }

        .title-section {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 16px;
          margin-bottom: 28px;
          padding-bottom: 28px;
          border-bottom: 2px solid #f1f5f9;
        }

        .product-title {
          font-size: 1.875rem;
          font-weight: 800;
          color: #0f172a;
          line-height: 1.25;
          letter-spacing: -0.035em;
          flex: 1;
        }

        .category-tag {
          background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
          color: white;
          padding: 9px 20px;
          border-radius: 100px;
          font-size: 0.8rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.06em;
          white-space: nowrap;
          box-shadow: 0 4px 12px rgba(99, 102, 241, 0.25);
        }

        .price-section {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 24px;
          margin-bottom: 32px;
          flex-wrap: wrap;
        }

        .price-box {
          flex: 1;
        }

        .price-label {
          display: block;
          font-size: 0.8rem;
          color: #64748b;
          font-weight: 600;
          margin-bottom: 8px;
          text-transform: uppercase;
          letter-spacing: 0.1em;
        }

        .product-price {
          font-size: 2.5rem;
          font-weight: 900;
          background: linear-gradient(135deg, #ee4d2d 0%, #ff6b4a 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          margin: 0;
          letter-spacing: -0.04em;
        }

        .stock-box {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 14px 22px;
          border-radius: 16px;
          border: 2px solid rgba(0, 0, 0, 0.06);
        }

        .stock-icon {
          font-size: 1.4rem;
        }

        .stock-text {
          display: flex;
          flex-direction: column;
          gap: 3px;
        }

        .stock-status {
          font-size: 0.8rem;
          font-weight: 700;
          color: #0f172a;
          text-transform: uppercase;
          letter-spacing: 0.06em;
        }

        .stock-qty {
          font-size: 0.875rem;
          color: #475569;
          font-weight: 600;
        }

        /* ============================================
           DESCRIPTION
        ============================================ */
        .desc-section {
          margin-bottom: 32px;
          padding: 28px;
          background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
          border-radius: 20px;
          border: 1px solid #e2e8f0;
        }

        .desc-title {
          font-size: 0.95rem;
          font-weight: 800;
          color: #0f172a;
          margin: 0 0 14px 0;
          text-transform: uppercase;
          letter-spacing: 0.1em;
        }

        .desc-text {
          font-size: 0.95rem;
          line-height: 1.75;
          color: #475569;
          margin: 0;
          font-weight: 400;
        }

        /* ============================================
           QUANTITY SELECTOR
        ============================================ */
        .qty-section {
          margin-bottom: 32px;
        }

        .qty-label {
          display: block;
          font-size: 0.95rem;
          font-weight: 800;
          color: #0f172a;
          margin: 0 0 14px 0;
          text-transform: uppercase;
          letter-spacing: 0.1em;
        }

        .qty-controls {
          display: flex;
          align-items: center;
          gap: 6px;
          background: #f8fafc;
          padding: 10px;
          border-radius: 18px;
          width: fit-content;
          box-shadow: inset 0 2px 8px rgba(0, 0, 0, 0.04);
          border: 1px solid #e2e8f0;
        }

        .qty-btn {
          width: 46px;
          height: 46px;
          border: none;
          background: white;
          border-radius: 14px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
        }

        .qty-btn:hover:not(:disabled) {
          background: linear-gradient(135deg, #ee4d2d 0%, #ff6b4a 100%);
          transform: scale(1.06);
          box-shadow: 0 4px 12px rgba(238, 77, 45, 0.3);
        }

        .qty-btn:hover:not(:disabled) svg {
          stroke: white;
        }

        .qty-btn:disabled {
          opacity: 0.25;
          cursor: not-allowed;
        }

        .qty-display {
          min-width: 70px;
          text-align: center;
          padding: 0 12px;
        }

        .qty-value {
          font-size: 1.25rem;
          font-weight: 800;
          color: #0f172a;
          font-family: 'Plus Jakarta Sans', sans-serif;
        }

        .qty-hint {
          font-size: 0.8rem;
          color: #64748b;
          margin: 10px 0 0 0;
          font-weight: 500;
        }

        /* ============================================
           ACTION BUTTONS
        ============================================ */
        .action-section {
          display: flex;
          flex-direction: column;
          gap: 14px;
        }

        .btn {
          border: none;
          padding: 18px 32px;
          border-radius: 16px;
          font-size: 1rem;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
          font-family: 'Plus Jakarta Sans', sans-serif;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 12px;
          letter-spacing: 0.015em;
        }

        .btn-primary {
          background: linear-gradient(135deg, #ee4d2d 0%, #ff6b4a 100%);
          color: white;
          box-shadow: 0 8px 20px rgba(238, 77, 45, 0.3);
        }

        .btn-primary:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 12px 28px rgba(238, 77, 45, 0.4);
        }

        .btn-primary:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .btn-secondary {
          background: white;
          color: #ee4d2d;
          border: 2px solid #ee4d2d;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.06);
        }

        .btn-secondary:hover {
          background: #fef2f2;
          transform: translateY(-2px);
        }

        .btn-link {
          text-decoration: none;
          display: block;
        }

        /* ============================================
           RELATED PRODUCTS
        ============================================ */
        .related-section {
          animation: fadeInUp 0.5s cubic-bezier(0.4, 0, 0.2, 1) 0.15s backwards;
        }

        .related-header {
          margin-bottom: 28px;
        }

        .related-title {
          font-size: 2rem;
          font-weight: 900;
          color: #0f172a;
          margin: 0 0 8px 0;
          letter-spacing: -0.04em;
        }

        .related-subtitle {
          font-size: 0.95rem;
          color: #64748b;
          margin: 0;
          font-weight: 500;
        }

        .related-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 20px;
        }

        .related-item {
          background: white;
          border-radius: 20px;
          overflow: hidden;
          text-decoration: none;
          color: inherit;
          box-shadow: 0 4px 16px rgba(0, 0, 0, 0.06);
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          animation: fadeIn 0.5s ease backwards;
          border: 1px solid rgba(0, 0, 0, 0.04);
        }

        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(16px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .related-item:hover {
          transform: translateY(-6px);
          box-shadow: 0 12px 28px rgba(0, 0, 0, 0.12);
        }

        .related-img-box {
          position: relative;
          width: 100%;
          padding-bottom: 100%;
          background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
          overflow: hidden;
        }

        .related-img {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          object-fit: cover;
          transition: transform 0.4s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .related-item:hover .related-img {
          transform: scale(1.08);
        }

        .related-rating {
          position: absolute;
          top: 12px;
          right: 12px;
          background: rgba(255, 255, 255, 0.98);
          backdrop-filter: blur(8px);
          padding: 6px 14px;
          border-radius: 100px;
          font-size: 0.8rem;
          font-weight: 700;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        }

        .related-info {
          padding: 18px;
        }

        .related-name {
          font-size: 0.95rem;
          font-weight: 700;
          color: #0f172a;
          margin: 0 0 10px 0;
          line-height: 1.4;
          overflow: hidden;
          text-overflow: ellipsis;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
        }

        .related-price {
          font-size: 1.25rem;
          font-weight: 900;
          background: linear-gradient(135deg, #ee4d2d 0%, #ff6b4a 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          margin: 0 0 10px 0;
          letter-spacing: -0.025em;
        }

        .related-stock {
          font-size: 0.8rem;
          font-weight: 600;
          padding: 5px 12px;
          border-radius: 100px;
          display: inline-flex;
          align-items: center;
          gap: 5px;
        }

        .stock-success {
          background: #d1fae5;
          color: #065f46;
        }

        .stock-warning {
          background: #fef3c7;
          color: #92400e;
        }

        .stock-error {
          background: #fee2e2;
          color: #991b1b;
        }

        /* ============================================
           TOAST NOTIFICATION
        ============================================ */
        .toast {
          position: fixed;
          bottom: 32px;
          left: 50%;
          transform: translateX(-50%);
          padding: 18px 32px;
          border-radius: 100px;
          color: white;
          font-weight: 700;
          font-size: 0.95rem;
          z-index: 2000;
          display: flex;
          align-items: center;
          gap: 14px;
          box-shadow: 0 12px 32px rgba(0, 0, 0, 0.2);
          animation: toastSlide 0.35s cubic-bezier(0.4, 0, 0.2, 1);
          backdrop-filter: blur(16px);
        }

        @keyframes toastSlide {
          from {
            opacity: 0;
            transform: translate(-50%, 16px);
          }
          to {
            opacity: 1;
            transform: translate(-50%, 0);
          }
        }

        .toast-success {
          background: linear-gradient(135deg, #10b981 0%, #059669 100%);
        }

        .toast-error {
          background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
        }

        .toast-icon {
          font-size: 1.25rem;
        }

        /* ============================================
            LOADING & EMPTY STATES
          ============================================ */
          .loading-state,
          .empty-state {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            min-height: 60vh;
            padding: 48px 24px;
          }

          /* Enhanced Spinner */
          .spinner {
            position: relative;
            width: 64px;
            height: 64px;
          }

          .spinner::before,
          .spinner::after {
            content: '';
            position: absolute;
            border-radius: 50%;
            border: 4px solid transparent;
          }

          .spinner::before {
            width: 64px;
            height: 64px;
            border-top-color: #ee4d2d;
            border-right-color: #ee4d2d;
            animation: spin 1s cubic-bezier(0.5, 0, 0.5, 1) infinite;
          }

          .spinner::after {
            width: 48px;
            height: 48px;
            top: 8px;
            left: 8px;
            border-bottom-color: #ff6b4a;
            border-left-color: #ff6b4a;
            animation: spin 1s cubic-bezier(0.5, 0, 0.5, 1) infinite reverse;
          }

          @keyframes spin {
            to {
              transform: rotate(360deg);
            }
          }

          .loading-text {
            margin-top: 24px;
            font-size: 1rem;
            color: #64748b;
            font-weight: 600;
            animation: pulse 2s ease-in-out infinite;
          }

          @keyframes pulse {
            0%, 100% { opacity: 0.6; }
            50% { opacity: 1; }
          }

          /* Enhanced Empty State */
          .empty-icon {
            font-size: 5rem;
            margin-bottom: 24px;
            animation: float 3s ease-in-out infinite;
            position: relative;
          }

          .empty-icon::before {
            content: '';
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            width: 130px;
            height: 130px;
            background: radial-gradient(circle, rgba(238, 77, 45, 0.1) 0%, transparent 70%);
            border-radius: 50%;
            z-index: -1;
          }

          @keyframes float {
            0%, 100% {
              transform: translateY(0);
            }
            50% {
              transform: translateY(-10px);
            }
          }

          .empty-state h2 {
            font-size: 1.75rem;
            font-weight: 800;
            color: #0f172a;
            margin: 0 0 12px 0;
            animation: fadeIn 0.5s ease-out;
          }

          .empty-state p {
            font-size: 0.95rem;
            color: #64748b;
            margin: 0 0 28px 0;
            max-width: 400px;
            text-align: center;
            line-height: 1.6;
            animation: fadeIn 0.5s ease-out 0.1s backwards;
          }

          @keyframes fadeIn {
            from {
              opacity: 0;
              transform: translateY(10px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }

          /* Responsive */
          @media (max-width: 640px) {
            .spinner {
              width: 56px;
              height: 56px;
            }
            
            .spinner::before {
              width: 56px;
              height: 56px;
            }
            
            .spinner::after {
              width: 40px;
              height: 40px;
              top: 8px;
              left: 8px;
            }
            
            .empty-icon {
              font-size: 4rem;
            }
            
            .empty-state h2 {
              font-size: 1.5rem;
            }
          }

        /* ============================================
           RESPONSIVE DESIGN
        ============================================ */
        @media (min-width: 768px) {
          .product-card {
            display: grid;
            grid-template-columns: 1fr 1fr;
          }

          .image-box {
            padding-bottom: 0;
            height: 100%;
          }

          .product-img {
            position: static;
            width: 100%;
            height: 100%;
          }

          .related-grid {
            grid-template-columns: repeat(4, 1fr);
          }

          .action-section {
            flex-direction: row;
          }
        }

        @media (min-width: 1024px) {
          .main-wrapper {
            padding: 40px 24px 100px;
          }

          .info-container {
            padding: 44px;
          }
        }

        @media (max-width: 640px) {
          .header-text h1 {
            font-size: 1.15rem;
          }

          .product-title {
            font-size: 1.5rem;
          }

          .product-price {
            font-size: 2rem;
          }

          .related-title {
            font-size: 1.5rem;
          }

          .action-section {
            flex-direction: column;
          }
        }
      `}</style>
    </div>
  );
}