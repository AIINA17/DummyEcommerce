"use client";

import Link from "next/link";
import { useState } from "react";
import { signOut, useSession } from "next-auth/react";

export default function Navbar() {
    const { data: session } = useSession();
    const [open, setOpen] = useState(false);

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

                {/* AKUN DROPDOWN */}
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
                                        {session.user?.name
                                            ?.charAt(0)
                                            .toUpperCase() || "U"}
                                    </div>
                                    <div className="user-info">
                                        <div className="user-name">
                                            {session.user?.name || "User"}
                                        </div>
                                        <div className="user-email">
                                            {session.user?.email}
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
