"use client";
// app/page.tsx

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { Search, RotateCcw, ShoppingCart, Star } from "lucide-react";
import ShinyText from "@/app/components/reactbits/ShinyText/ShinyText";
import TiltedCard from "@/app/components/reactbits/TiltedCard/TiltedCard";
import ClickSpark from "@/app/components/reactbits/ClickSpark/ClickSpark";

/* =======================  TYPES  ======================= */
interface Product {
  id: number;
  name: string;
  description: string;
  price: number;
  category: string;
  rating: number;
  stock: number;
  image_url: string;
}

/* =======================  HELPERS  ======================= */
const formatPrice = (price: number) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(price);

/* =======================  MAIN PAGE  ======================= */
export default function Home() {
  const { data: session, status } = useSession();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{ message: string; type: string } | null>(
    null,
  );

  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("");
  const [min, setMin] = useState("");
  const [max, setMax] = useState("");
  const [rating, setRating] = useState("");
  const [sort, setSort] = useState("");

  const userId = session?.user?.id ? Number(session.user.id) : null;

  async function loadProducts() {
    setLoading(true);
    const params = new URLSearchParams();
    if (query) params.append("q", query);
    if (category) params.append("category", category);
    if (min) params.append("min", min);
    if (max) params.append("max", max);
    if (rating) params.append("rating", rating);
    if (sort) params.append("sort", sort);
    try {
      const res = await fetch("/api/products?" + params.toString());
      const data = await res.json();
      setProducts(data.data || []);
    } catch {
      console.error("Error loading products");
    } finally {
      setLoading(false);
    }
  }

  async function addToCart(productId: number) {
    if (status !== "authenticated" || !userId) {
      showToast("Silakan login dulu untuk menambahkan ke keranjang", "error");
      return;
    }
    try {
      const res = await fetch("/api/cart", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          product_id: productId,
          quantity: 1,
        }),
      });
      const data = await res.json();
      showToast(
        res.ok
          ? "Berhasil ditambahkan ke keranjang!"
          : data.error || "Gagal menambahkan ke keranjang",
        res.ok ? "success" : "error",
      );
    } catch {
      showToast("Terjadi kesalahan", "error");
    }
  }

  const showToast = (message: string, type: string) => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const resetFilters = () => {
    setQuery("");
    setCategory("");
    setMin("");
    setMax("");
    setRating("");
    setSort("");
  };

  // Muat produk sekali saat halaman dibuka. Filter di bawah baru diterapkan
  // lewat tombol "Terapkan Filter" / Enter, bukan otomatis tiap state
  // berubah — jadi loadProducts sengaja tidak dimasukkan ke dependency
  // array (kalau dimasukkan, tiap ketikan akan memicu refetch).
  useEffect(() => {
    loadProducts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="main-container">
      {/* ── Red Hero Band ── */}
      <div className="page-hero">
        <h1 className="page-title">
          <ShinyText
            text="Semua Produk"
            speed={3}
            color="rgba(255, 255, 255, 0.85)"
            shineColor="#ffffff"
          />
        </h1>
        <p className="page-subtitle">
          Temukan produk terbaik untuk kebutuhanmu
        </p>
      </div>

      {/* ── Filter Section ── */}
      <section className="filter-section">
        <div className="filter-row">
          <input
            type="text"
            className="filter-input"
            placeholder="Cari nama produk..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && loadProducts()}
          />
          <select
            className="filter-input"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          >
            <option value="">Semua Kategori</option>
            <option value="Gadget & Tech">Gadget & Tech</option>
            <option value="Lifestyle">Lifestyle</option>
            <option value="Home & Living">Home & Living</option>
            <option value="Lain-lain">Lain-lain</option>
          </select>
          <select
            className="filter-input"
            value={sort}
            onChange={(e) => setSort(e.target.value)}
          >
            <option value="">Urutkan Default</option>
            <option value="price_asc">Harga: Rendah → Tinggi</option>
            <option value="price_desc">Harga: Tinggi → Rendah</option>
            <option value="rating_desc">Rating Tertinggi</option>
          </select>
        </div>
        <div className="filter-row">
          <input
            type="number"
            className="filter-input"
            placeholder="Harga minimum"
            value={min}
            onChange={(e) => setMin(e.target.value)}
          />
          <input
            type="number"
            className="filter-input"
            placeholder="Harga maksimum"
            value={max}
            onChange={(e) => setMax(e.target.value)}
          />
          <select
            className="filter-input"
            value={rating}
            onChange={(e) => setRating(e.target.value)}
          >
            <option value="">Semua Rating</option>
            <option value="4">4.0+</option>
            <option value="4.5">4.5+</option>
          </select>
        </div>
        <div className="filter-actions">
          <button className="btn btn-primary" onClick={loadProducts}>
            <Search size={14} /> Terapkan Filter
          </button>
          <button className="btn btn-secondary" onClick={resetFilters}>
            <RotateCcw size={14} /> Reset
          </button>
        </div>
      </section>

      {/* ── Products ── */}
      {loading ? (
        <div className="state-screen">
          <div className="spinner" />
          <p className="state-text">Memuat produk...</p>
        </div>
      ) : products.length === 0 ? (
        <div className="state-screen">
          <div className="state-icon">
            <Search size={34} />
          </div>
          <h3 className="state-title">Produk tidak ditemukan</h3>
          <p className="state-text">Coba ubah filter pencarian kamu</p>
        </div>
      ) : (
        <div className="product-grid">
          {products.map((product, i) => (
            <Link
              href={`/product/${product.id}`}
              key={product.id}
              className="product-card"
              style={{ animationDelay: `${Math.min(i, 10) * 0.04}s` }}
            >
              <div className="product-image">
                <TiltedCard
                  imageSrc={
                    product.image_url ||
                    `https://picsum.photos/seed/${product.id}/300/300`
                  }
                  altText={product.name}
                  containerHeight="100%"
                  containerWidth="100%"
                  imageHeight="100%"
                  imageWidth="100%"
                  scaleOnHover={1.06}
                  rotateAmplitude={10}
                  showMobileWarning={false}
                  showTooltip={false}
                  onImageError={(e) => {
                    (e.target as HTMLImageElement).src =
                      `https://picsum.photos/seed/${product.id}/300/300`;
                  }}
                />
              </div>
              <div className="product-info">
                <h3 className="product-name">{product.name}</h3>
                <p className="product-price">{formatPrice(product.price)}</p>
                <div className="product-meta">
                  <div className="product-rating">
                    <Star
                      size={12}
                      fill="var(--warning)"
                      color="var(--warning)"
                    />
                    <span>{product.rating}</span>
                  </div>
                  <span className="product-category">{product.category}</span>
                </div>
                <ClickSpark sparkColor="#ee4d2d" sparkCount={10} sparkRadius={18}>
                  <button
                    className="btn btn-primary btn-sm btn-full"
                    onClick={(e) => {
                      e.preventDefault();
                      addToCart(product.id);
                    }}
                  >
                    <ShoppingCart size={13} /> + Keranjang
                  </button>
                </ClickSpark>
              </div>
            </Link>
          ))}
        </div>
      )}

      {toast && <div className={`toast ${toast.type}`}>{toast.message}</div>}
    </div>
  );
}
