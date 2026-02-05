"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { signOut, useSession } from "next-auth/react";

export default function Navbar() {
  const { data: session } = useSession();
  const [open, setOpen] = useState(false);
  const [balance, setBalance] = useState<number | null>(null);
  const [darkMode, setDarkMode] = useState(false);

  // Fetch balance
  useEffect(() => {
    if (!session) return;

    fetch("/api/me")
      .then(res => res.json())
      .then(res => {
        if (res.success) {
          setBalance(res.data.balance);
        }
      });
  }, [session]);

  // Dark mode - load dari localStorage waktu pertama kali
  useEffect(() => {
    const savedTheme = localStorage.getItem("theme");
    const isDark = savedTheme === "dark";
    setDarkMode(isDark);

    if (isDark) {
      document.documentElement.classList.add("dark");
    }
  }, []);

  // Function untuk toggle dark mode
  function toggleDarkMode() {
    const newMode = !darkMode;
    setDarkMode(newMode);

    if (newMode) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  }

  return (
    <nav className="navbar">
      {/* Logo & Brand */}
      <Link href="/" className="navbar-logo">
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2">
          <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" />
          <line x1="3" y1="6" x2="21" y2="6" />
          <path d="M16 10a4 4 0 01-8 0" />
        </svg>
        ShopKu
      </Link>

      {/* Search Bar */}
      <div className="search-container">
        <form className="search-bar" action="/" method="GET">
          <input
            type="text"
            name="q"
            placeholder="Cari produk di ShopKu..."
          />
          <button type="submit">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2">
              <circle cx="11" cy="11" r="8" />
              <path d="M21 21l-4.35-4.35" />
            </svg>
          </button>
        </form>
      </div>

      {/* Navigation Links */}
      <div className="navbar-links">
        <Link href="/" className="navbar-link">
          <span>Home</span>
        </Link>

        <Link href="/cart" className="navbar-link">
          <span>Keranjang</span>
        </Link>

        <Link href="/orders" className="navbar-link">
          <span>Pesanan</span>
        </Link>

        {/* Dark Mode Toggle Button */}
        <button
          onClick={toggleDarkMode}
          className="navbar-link"
          style={{ cursor: "pointer", background: "none", border: "none" }}
          title={darkMode ? "Light Mode" : "Dark Mode"}
        >
          {darkMode ? (
            // Icon Matahari (untuk switch ke light)
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="5"/>
              <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/>
            </svg>
          ) : (
            // Icon Bulan (untuk switch ke dark)
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"/>
            </svg>
          )}
        </button>

        {session && (
          <div className="navbar-account">
            <button
              className="account-trigger"
              onClick={() => setOpen(!open)}>
              <span>Akun</span>
              <svg
                className={`chevron ${open ? "open" : ""}`}
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2">
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </button>

            {open && (
              <div className="account-dropdown">
                <div className="dropdown-header">
                  <div className="user-avatar">
                    {session.user?.name?.charAt(0).toUpperCase() || "U"}
                  </div>
                  <div className="user-info">
                    <div className="user-name">
                      {session.user?.name || "User"}
                    </div>
                    <div className="user-email">
                      {session.user?.email}
                    </div>
                    <div className="user-balance">
                      💳 ShopKu Pay:{" "}
                      {balance !== null
                        ? `Rp ${balance.toLocaleString()}`
                        : "Loading..."}
                    </div>
                  </div>
                </div>

                <div className="dropdown-divider"></div>

                <Link
                  href="/profile"
                  className="dropdown-item"
                  onClick={() => setOpen(false)}>
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2">
                    <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
                    <circle cx="12" cy="7" r="4" />
                  </svg>
                  <span>Pengaturan Profil</span>
                </Link>

                <div className="dropdown-divider"></div>

                <button
                  className="dropdown-item logout"
                  onClick={() => signOut()}>
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2">
                    <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" />
                    <polyline points="16 17 21 12 16 7" />
                    <line x1="21" y1="12" x2="9" y2="12" />
                  </svg>
                  <span>Logout</span>
                </button>
              </div>
            )}
          </div>
        )}

        {!session && (
          <Link href="/login" className="navbar-link">
            <span>Login</span>
          </Link>
        )}
      </div>
    </nav>
  );
}