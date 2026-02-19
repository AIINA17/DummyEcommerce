"use client";
// components/Navbar.tsx

import Link from "next/link";
import { useState, useEffect } from "react";
import { signOut, useSession } from "next-auth/react";
import {
  ShoppingBag,
  Search,
  Home,
  ShoppingCart,
  ClipboardList,
  Sun,
  Moon,
  ChevronDown,
  User,
  LogOut,
  CreditCard,
} from "lucide-react";

export default function Navbar() {
  const { data: session } = useSession();
  const [open, setOpen] = useState(false);
  const [balance, setBalance] = useState<number | null>(null);
  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => {
    if (!session) return;
    fetch("/api/me")
      .then((r) => r.json())
      .then((r) => {
        if (r.success) setBalance(r.data.balance);
      });
  }, [session]);

  useEffect(() => {
    const isDark = localStorage.getItem("theme") === "dark";
    setDarkMode(isDark);
    if (isDark) document.documentElement.classList.add("dark");
  }, []);

  function toggleDarkMode() {
    const next = !darkMode;
    setDarkMode(next);
    document.documentElement.classList.toggle("dark", next);
    localStorage.setItem("theme", next ? "dark" : "light");
  }

  // Close dropdown when clicking outside
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest(".navbar-account")) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  return (
    <nav className="navbar">
      {/* ── Logo ── */}
      <Link href="/" className="navbar-logo">
        <ShoppingBag size={22} />
        ShopKu
      </Link>

      {/* ── Search ── */}
      <div className="search-container">
        <form className="search-bar" action="/" method="GET">
          <input type="text" name="q" placeholder="Cari produk di ShopKu..." />
          <button type="submit" aria-label="Cari">
            <Search size={17} color="white" />
          </button>
        </form>
      </div>

      {/* ── Links ── */}
      <div className="navbar-links">
        <Link href="/" className="navbar-link">
          <Home size={16} /> <span>Home</span>
        </Link>
        <Link href="/cart" className="navbar-link">
          <ShoppingCart size={16} /> <span>Keranjang</span>
        </Link>
        <Link href="/orders" className="navbar-link">
          <ClipboardList size={16} /> <span>Pesanan</span>
        </Link>

        {/* Dark Mode */}
        <button
          onClick={toggleDarkMode}
          className="navbar-link"
          style={{ cursor: "pointer", background: "none", border: "none" }}
          aria-label={darkMode ? "Light mode" : "Dark mode"}
        >
          {darkMode ? <Sun size={18} /> : <Moon size={18} />}
        </button>

        {/* Account Dropdown */}
        {session ? (
          <div className="navbar-account">
            <button className="account-trigger" onClick={() => setOpen(!open)}>
              <span>Akun</span>
              <ChevronDown
                size={15}
                className={`chevron${open ? " open" : ""}`}
              />
            </button>

            {open && (
              <div className="account-dropdown">
                {/* Header */}
                <div className="dropdown-header">
                  <div className="user-avatar">
                    {session.user?.name?.charAt(0).toUpperCase() || "U"}
                  </div>
                  <div className="user-info">
                    <div className="user-name">
                      {session.user?.name || "User"}
                    </div>
                    <div className="user-email">{session.user?.email}</div>
                    <div
                      style={{
                        fontSize: 16,
                        opacity: 0.85,
                        marginTop: 4,
                        display: "flex",
                        alignItems: "center",
                        gap: 5,
                      }}
                    >
                      ShopKu Pay:{" "}
                      {balance !== null
                        ? `Rp${balance.toLocaleString("id-ID")}`
                        : "—"}
                    </div>
                  </div>
                </div>

                <div className="dropdown-divider" />

                <Link
                  href="/profile"
                  className="dropdown-item"
                  onClick={() => setOpen(false)}
                >
                  <User size={16} /> <span>Pengaturan Profil</span>
                </Link>

                <div className="dropdown-divider" />

                <button
                  className="dropdown-item logout"
                  onClick={() => signOut()}
                >
                  <LogOut size={16} /> <span>Logout</span>
                </button>
              </div>
            )}
          </div>
        ) : (
          <Link href="/login" className="navbar-link">
            <span>Login</span>
          </Link>
        )}
      </div>
    </nav>
  );
}
