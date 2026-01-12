"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
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

interface CartItem {
  id: number;
  user_id: number;
  product_id: number;
  quantity: number;
  products: Product;
  selected?: boolean;
}

export default function CartPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{ message: string; type: string } | null>(null);

  const userId = session?.user?.id ? Number(session.user.id) : null;

  async function loadCart() {
    if (!userId) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/cart?user_id=${userId}`);
      const data = await res.json();
      const itemsWithSelection = (data.data || []).map((item: CartItem) => ({
        ...item,
        selected: true,
      }));
      setCartItems(itemsWithSelection);
    } catch (error) {
      console.error("Error loading cart:", error);
    } finally {
      setLoading(false);
    }
  }

  async function updateQuantity(cartId: number, newQuantity: number) {
    try {
      const res = await fetch("/api/cart", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cart_id: cartId, quantity: newQuantity }),
      });

      if (res.ok) {
        if (newQuantity <= 0) {
          setCartItems((prev) => prev.filter((item) => item.id !== cartId));
          showToast("Produk dihapus dari keranjang", "success");
        } else {
          setCartItems((prev) =>
            prev.map((item) =>
              item.id === cartId ? { ...item, quantity: newQuantity } : item
            )
          );
        }
      }
    } catch (error) {
      showToast("Gagal mengupdate keranjang", "error");
    }
  }

  async function deleteItem(cartId: number) {
    try {
      const res = await fetch(`/api/cart?cart_id=${cartId}`, { method: "DELETE" });
      if (res.ok) {
        setCartItems((prev) => prev.filter((item) => item.id !== cartId));
        showToast("Produk dihapus dari keranjang", "success");
      }
    } catch (error) {
      showToast("Gagal menghapus produk", "error");
    }
  }

  function toggleSelect(cartId: number) {
    setCartItems((prev) =>
      prev.map((item) =>
        item.id === cartId ? { ...item, selected: !item.selected } : item
      )
    );
  }

  function toggleSelectAll() {
    const allSelected = cartItems.every((item) => item.selected);
    setCartItems((prev) => prev.map((item) => ({ ...item, selected: !allSelected })));
  }

  const selectedItems = cartItems.filter((item) => item.selected);
  const totalItems = selectedItems.reduce((sum, item) => sum + item.quantity, 0);
  const subtotal = selectedItems.reduce(
    (sum, item) => sum + item.products.price * item.quantity, 0
  );

  function showToast(message: string, type: string) {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  }

  function formatPrice(price: number) {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(price);
  }

  function handleCheckout() {
    if (selectedItems.length === 0) {
      showToast("Pilih produk yang ingin di-checkout", "error");
      return;
    }
    // Redirect to checkout page
    window.location.href = "/checkout";
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

  return (
    <main className="main-container">
      <div className="page-header">
        <h1 className="page-title">🛒 Keranjang Belanja</h1>
        <p className="page-subtitle">
          {cartItems.length > 0 ? `${cartItems.length} produk di keranjang kamu` : "Keranjang kamu masih kosong"}
        </p>
      </div>

      {loading ? (
        <div className="loading"><div className="spinner"></div></div>
      ) : cartItems.length === 0 ? (
        <div className="cart-items">
          <div className="cart-empty">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/>
              <path d="M1 1h4l2.68 13.39a2 2 0 002 1.61h9.72a2 2 0 002-1.61L23 6H6"/>
            </svg>
            <h3 className="cart-empty-title">Keranjang Kosong</h3>
            <p className="cart-empty-text">Yuk, mulai belanja dan temukan produk favoritmu!</p>
            <Link href="/"><button className="btn btn-primary">Mulai Belanja</button></Link>
          </div>
        </div>
      ) : (
        <div className="cart-container">
          <div className="cart-items">
            <div className="cart-header">
              <label className="cart-select-all">
                <input
                  type="checkbox"
                  className="checkbox-custom"
                  checked={cartItems.every((item) => item.selected)}
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
                    checked={item.selected || false}
                    onChange={() => toggleSelect(item.id)}
                  />
                </div>

                <img
                  src={item.products.image_url || `https://picsum.photos/seed/${item.product_id}/100/100`}
                  alt={item.products.name}
                  className="cart-item-image"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = `https://picsum.photos/seed/${item.product_id}/100/100`;
                  }}
                />

                <div className="cart-item-details">
                  <h3 className="cart-item-name">{item.products.name}</h3>
                  <p className="cart-item-category">{item.products.category}</p>
                  <p className="cart-item-price">{formatPrice(item.products.price)}</p>
                </div>

                <div className="cart-item-actions">
                  <button className="cart-item-delete" onClick={() => deleteItem(item.id)}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="3 6 5 6 21 6"/>
                      <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/>
                    </svg>
                  </button>

                  <div className="quantity-control">
                    <button
                      className="quantity-btn"
                      onClick={() => updateQuantity(item.id, item.quantity - 1)}
                      disabled={item.quantity <= 1}
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <line x1="5" y1="12" x2="19" y2="12"/>
                      </svg>
                    </button>
                    <input type="text" className="quantity-value" value={item.quantity} readOnly />
                    <button
                      className="quantity-btn"
                      onClick={() => updateQuantity(item.id, item.quantity + 1)}
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="cart-summary">
            <h3 className="cart-summary-title">Ringkasan Belanja</h3>
            <div className="cart-summary-row">
              <span className="cart-summary-label">Total Produk</span>
              <span className="cart-summary-value">{totalItems} barang</span>
            </div>
            <div className="cart-summary-row">
              <span className="cart-summary-label">Produk Dipilih</span>
              <span className="cart-summary-value">{selectedItems.length} produk</span>
            </div>
            <div className="cart-summary-row total">
              <span className="cart-summary-label">Total Harga</span>
              <span className="cart-summary-value">{formatPrice(subtotal)}</span>
            </div>
            <button
              className="btn btn-primary btn-checkout"
              onClick={handleCheckout}
              disabled={selectedItems.length === 0}
            >
              Checkout ({selectedItems.length})
            </button>
            <Link href="/" style={{ display: "block", marginTop: "12px" }}>
              <button className="btn btn-secondary" style={{ width: "100%" }}>Lanjut Belanja</button>
            </Link>
          </div>
        </div>
      )}

      {toast && <div className={`toast ${toast.type}`}>{toast.message}</div>}
    </main>
  );
}