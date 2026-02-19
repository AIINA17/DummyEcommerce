"use client";
// app/cart/page.tsx

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import {
  ArrowLeft,
  ShoppingCart,
  ShoppingBag,
  Trash2,
  Minus,
  Plus,
  CheckCheck,
} from "lucide-react";

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
interface CartItem {
  id: number;
  user_id: number;
  product_id: number;
  quantity: number;
  products: Product;
  selected?: boolean;
}

/* =======================  HELPERS  ======================= */
const formatPrice = (price: number) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(price);

/* =======================  SUB-COMPONENTS  ======================= */
function LoadingState() {
  return (
    <div className="page-container state-screen">
      <div className="spinner" />
      <p className="state-text">Memuat keranjang...</p>
    </div>
  );
}

function EmptyCartState() {
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

/* =======================  MAIN PAGE  ======================= */
export default function CartPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{ message: string; type: string } | null>(
    null,
  );
  const userId = session?.user?.id ? Number(session.user.id) : null;

  /* ── Data ── */
  async function loadCart() {
    if (!userId) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/cart?user_id=${userId}`);
      const data = await res.json();
      setCartItems(
        (data.data || []).map((item: CartItem) => ({
          ...item,
          selected: true,
        })),
      );
    } catch {
      console.error("Error loading cart");
    } finally {
      setLoading(false);
    }
  }

  async function updateQuantity(cartId: number, newQty: number) {
    try {
      const res = await fetch("/api/cart", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cart_id: cartId, quantity: newQty }),
      });
      if (!res.ok) return;
      if (newQty <= 0) {
        setCartItems((prev) => prev.filter((i) => i.id !== cartId));
        showToast("Produk dihapus dari keranjang", "success");
      } else {
        setCartItems((prev) =>
          prev.map((i) => (i.id === cartId ? { ...i, quantity: newQty } : i)),
        );
      }
    } catch {
      showToast("Gagal mengupdate keranjang", "error");
    }
  }

  async function deleteItem(cartId: number) {
    try {
      const res = await fetch(`/api/cart?cart_id=${cartId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setCartItems((prev) => prev.filter((i) => i.id !== cartId));
        showToast("Produk dihapus dari keranjang", "success");
      }
    } catch {
      showToast("Gagal menghapus produk", "error");
    }
  }

  const toggleSelect = (id: number) =>
    setCartItems((prev) =>
      prev.map((i) => (i.id === id ? { ...i, selected: !i.selected } : i)),
    );
  const toggleSelectAll = () => {
    const all = cartItems.every((i) => i.selected);
    setCartItems((prev) => prev.map((i) => ({ ...i, selected: !all })));
  };
  const showToast = (message: string, type: string) => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };
  const handleCheckout = () => {
    if (selectedItems.length === 0) {
      showToast("Pilih produk yang ingin di-checkout", "error");
      return;
    }
    router.push(`/checkout?items=${selectedItems.map((i) => i.id).join(",")}`);
  };

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
      return;
    }
    if (status === "authenticated" && userId) loadCart();
  }, [status, userId]);

  /* ── Derived ── */
  const selectedItems = cartItems.filter((i) => i.selected);
  const totalItems = selectedItems.reduce((s, i) => s + i.quantity, 0);
  const subtotal = selectedItems.reduce(
    (s, i) => s + i.products.price * i.quantity,
    0,
  );
  const allSelected =
    cartItems.length > 0 && cartItems.every((i) => i.selected);

  /* ── Render ── */
  if (loading) return <LoadingState />;
  if (cartItems.length === 0) return <EmptyCartState />;

  return (
    <div className="page-container">
      {/* ── Header ── */}
      <header className="page-header-bar">
        <div className="page-header-bar-inner">
          <button
            onClick={() => router.push("/")}
            className="back-btn"
            aria-label="Kembali"
          >
            <ArrowLeft size={18} />
          </button>
          <div className="header-text">
            <h1 className="header-title">Keranjang Belanja</h1>
            <p className="header-subtitle">
              {cartItems.length} produk di keranjang kamu
            </p>
          </div>
        </div>
      </header>

      {/* ── Main ── */}
      <main
        className="page-main"
        style={{
          maxWidth: 960,
          flexDirection: "row",
          alignItems: "flex-start",
          flexWrap: "wrap",
        }}
      >
        {/* Items */}
        <div className="cart-items" style={{ flex: "1 1 480px" }}>
          <div className="cart-header">
            <label className="cart-select-all">
              <input
                type="checkbox"
                className="checkbox-custom"
                checked={allSelected}
                onChange={toggleSelectAll}
              />
              <span>Pilih Semua ({cartItems.length})</span>
            </label>
          </div>

          {cartItems.map((item) => (
            <div key={item.id} className="cart-item">
              <div className="cart-item-checkbox">
                <input
                  type="checkbox"
                  className="checkbox-custom"
                  checked={item.selected ?? false}
                  onChange={() => toggleSelect(item.id)}
                />
              </div>
              <img
                src={
                  item.products.image_url ||
                  `https://picsum.photos/seed/${item.product_id}/100/100`
                }
                alt={item.products.name}
                className="cart-item-image"
                onError={(e) => {
                  (e.target as HTMLImageElement).src =
                    `https://picsum.photos/seed/${item.product_id}/100/100`;
                }}
              />
              <div className="cart-item-details">
                <h3 className="cart-item-name">{item.products.name}</h3>
                <p className="cart-item-category">{item.products.category}</p>
                <p className="cart-item-price">
                  {formatPrice(item.products.price)}
                </p>
              </div>
              <div className="cart-item-actions">
                <button
                  className="cart-item-delete"
                  onClick={() => deleteItem(item.id)}
                  aria-label="Hapus"
                >
                  <Trash2 size={17} />
                </button>
                <div className="qty-control">
                  <button
                    className="qty-btn"
                    onClick={() => updateQuantity(item.id, item.quantity - 1)}
                    disabled={item.quantity <= 1}
                    aria-label="Kurangi"
                  >
                    <Minus size={13} />
                  </button>
                  <input
                    type="text"
                    className="qty-input"
                    value={item.quantity}
                    readOnly
                  />
                  <button
                    className="qty-btn"
                    onClick={() => updateQuantity(item.id, item.quantity + 1)}
                    aria-label="Tambah"
                  >
                    <Plus size={13} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Summary */}
        <div className="cart-summary" style={{ flex: "0 0 300px" }}>
          <h3 className="cart-summary-title">Ringkasan Belanja</h3>
          <div className="cart-summary-row">
            <span className="cart-summary-label">Total Produk</span>
            <span className="cart-summary-value">{totalItems} barang</span>
          </div>
          <div className="cart-summary-row">
            <span className="cart-summary-label">Produk Dipilih</span>
            <span className="cart-summary-value">
              {selectedItems.length} produk
            </span>
          </div>
          <div className="cart-summary-row total">
            <span className="cart-summary-label">Total Harga</span>
            <span className="cart-summary-value">{formatPrice(subtotal)}</span>
          </div>
          <button
            className="btn btn-primary btn-full"
            style={{ marginTop: 18, padding: "13px" }}
            onClick={handleCheckout}
            disabled={selectedItems.length === 0}
          >
            <CheckCheck size={15} /> Checkout ({selectedItems.length})
          </button>
          <Link href="/" style={{ display: "block", marginTop: 8 }}>
            <button className="btn btn-secondary btn-full">
              Lanjut Belanja
            </button>
          </Link>
        </div>
      </main>

      {toast && <div className={`toast ${toast.type}`}>{toast.message}</div>}
    </div>
  );
}
