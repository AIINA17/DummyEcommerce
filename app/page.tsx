//app/page.tsx
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";

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

export default function Home() {
    const { data: session, status } = useSession();
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [toast, setToast] = useState<{
        message: string;
        type: string;
    } | null>(null);

    // Filter states
    const [query, setQuery] = useState("");
    const [category, setCategory] = useState("");
    const [min, setMin] = useState("");
    const [max, setMax] = useState("");
    const [rating, setRating] = useState("");
    const [sort, setSort] = useState("");

    const userId = session?.user?.id ? Number(session.user.id) : null;

    // Load products
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
        } catch (error) {
            console.error("Error loading products:", error);
        } finally {
            setLoading(false);
        }
    }

    // Add to cart
    async function addToCart(productId: number) {
        if (status !== "authenticated" || !userId) {
            showToast(
                "Silakan login dulu untuk menambahkan ke keranjang",
                "error"
            );
            return;
        }

        try {
            const res = await fetch("/api/cart", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    user_id: userId,
                    product_id: productId,
                    quantity: 1,
                }),
            });

            const data = await res.json();

            if (res.ok) {
                showToast("Berhasil ditambahkan ke keranjang! 🛒", "success");
            } else {
                showToast(
                    data.error || "Gagal menambahkan ke keranjang",
                    "error"
                );
            }
        } catch (error) {
            showToast("Terjadi kesalahan", "error");
        }
    }

    // Show toast notification
    function showToast(message: string, type: string) {
        setToast({ message, type });
        setTimeout(() => setToast(null), 3000);
    }

    // Reset filters
    function resetFilters() {
        setQuery("");
        setCategory("");
        setMin("");
        setMax("");
        setRating("");
        setSort("");
    }

    useEffect(() => {
        loadProducts();
    }, []);

    // Format price to Rupiah
    function formatPrice(price: number) {
        return new Intl.NumberFormat("id-ID", {
            style: "currency",
            currency: "IDR",
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(price);
    }

    return (
        <main className="main-container">
            {/* Page Header */}
            <div className="page-header">
                <h1 className="page-title">🛍️ Semua Produk</h1>
                <p className="page-subtitle">
                    Temukan produk terbaik untuk kebutuhanmu
                </p>
            </div>

            {/* Filter Section */}
            <section className="filter-section">
                <div className="filter-row">
                    {/* Search Input */}
                    <input
                        type="text"
                        className="filter-input"
                        placeholder="🔍 Cari nama produk..."
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                    />

                    {/* Category Select */}
                    <select
                        className="filter-input"
                        value={category}
                        onChange={(e) => setCategory(e.target.value)}>
                        <option value="">📂 Semua Kategori</option>
                        <option value="Gadget & Tech">💻 Gadget & Tech</option>
                        <option value="Lifestyle">👟 Lifestyle</option>
                        <option value="Home & Living">🏠 Home & Living</option>
                        <option value="Lain-lain">📦 Lain-lain</option>
                    </select>

                    {/* Sort Select */}
                    <select
                        className="filter-input"
                        value={sort}
                        onChange={(e) => setSort(e.target.value)}>
                        <option value="">🔄 Urutkan Default</option>
                        <option value="price_asc">
                            💰 Harga: Rendah → Tinggi
                        </option>
                        <option value="price_desc">
                            💰 Harga: Tinggi → Rendah
                        </option>
                        <option value="rating_desc">⭐ Rating Tertinggi</option>
                    </select>
                </div>

                <div className="filter-row">
                    {/* Min Price */}
                    <input
                        type="number"
                        className="filter-input"
                        placeholder="💵 Harga minimum"
                        value={min}
                        onChange={(e) => setMin(e.target.value)}
                    />

                    {/* Max Price */}
                    <input
                        type="number"
                        className="filter-input"
                        placeholder="💵 Harga maksimum"
                        value={max}
                        onChange={(e) => setMax(e.target.value)}
                    />

                    {/* Rating Filter */}
                    <select
                        className="filter-input"
                        value={rating}
                        onChange={(e) => setRating(e.target.value)}>
                        <option value="">⭐ Semua Rating</option>
                        <option value="4">⭐ 4.0+</option>
                        <option value="4.5">⭐ 4.5+</option>
                    </select>
                </div>

                {/* Filter Actions */}
                <div className="filter-actions">
                    <button className="btn btn-primary" onClick={loadProducts}>
                        <svg
                            width="18"
                            height="18"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2">
                            <circle cx="11" cy="11" r="8" />
                            <path d="M21 21l-4.35-4.35" />
                        </svg>
                        Terapkan Filter
                    </button>
                    <button
                        className="btn btn-secondary"
                        onClick={resetFilters}>
                        <svg
                            width="18"
                            height="18"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2">
                            <path d="M3 12a9 9 0 109-9 9.75 9.75 0 00-6.74 2.74L3 8" />
                            <path d="M3 3v5h5" />
                        </svg>
                        Reset
                    </button>
                </div>
            </section>

            {/* Products Grid */}
            {loading ? (
                <div className="loading">
                    <div className="checkout-spinner"></div>Memuat produk...
                </div>
            ) : products.length === 0 ? (
                <div className="empty-state">
                    <svg
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.5">
                        <path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    <h3>Produk tidak ditemukan</h3>
                    <p>Coba ubah filter pencarian kamu</p>
                </div>
            ) : (
                <div className="product-grid">
                    {products.map((product) => (
                    <Link
                    href={`/product/${product.id}`}
                    key={product.id}
                    className="product-card"
                    >
                            {/* Product Image */}
                            <img
                                src={
                                    product.image_url ||
                                    `https://picsum.photos/seed/${product.id}/300/300`
                                }
                                alt={product.name}
                                className="product-image"
                                onError={(e) => {
                                    (
                                        e.target as HTMLImageElement
                                    ).src = `https://picsum.photos/seed/${product.id}/300/300`;
                                }}
                            />

                            {/* Product Info */}
                            <div className="product-info">
                                <h3 className="product-name">{product.name}</h3>

                                <p className="product-price">
                                    {formatPrice(product.price)}
                                </p>

                                <div className="product-meta">
                                    <div className="product-rating">
                                        <svg
                                            viewBox="0 0 24 24"
                                            fill="currentColor">
                                            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                                        </svg>
                                        <span>{product.rating}</span>
                                    </div>
                                    <span className="product-category">
                                        {product.category}
                                    </span>
                                </div>

                                {/* Add to Cart Button */}
                                <button
                                    className="btn btn-primary btn-sm"
                                    style={{ width: "100%", marginTop: "12px" }}
                                    onClick={(e) => {
                                        e.preventDefault();
                                        addToCart(product.id);
                                    }}>
                                    <svg
                                        width="16"
                                        height="16"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth="2">
                                        <circle cx="9" cy="21" r="1" />
                                        <circle cx="20" cy="21" r="1" />
                                        <path d="M1 1h4l2.68 13.39a2 2 0 002 1.61h9.72a2 2 0 002-1.61L23 6H6" />
                                    </svg>
                                    + Keranjang
                                </button>
                            </div>
                        </Link>
                    ))}
                </div>
            )}

            {/* Toast Notification */}
            {toast && (
                <div className={`toast ${toast.type}`}>{toast.message}</div>
            )}
        </main>
    );
}
