"use client";

import Link from "next/link";
import { signIn, signOut, useSession } from "next-auth/react";

export default function Navbar() {
    const { data: session, status } = useSession();

    return (
        <nav className="navbar">
            {/* Logo */}
            <Link href="/" className="navbar-logo">
                ShopKu
            </Link>

            {/* Links */}
            <div className="navbar-links">
                <Link href="/">Home</Link>
                <Link href="/cart">Keranjang</Link>
                <Link href="/orders">Pesanan</Link>
            </div>

            {/* Auth */}
            <div className="navbar-auth">
                {status === "loading" && <span>Loading...</span>}

                {!session && status !== "loading" && (
                    <button onClick={() => signIn()}>Login</button>
                )}

                {session && (
                    <>
                        <span>Hi, {session.user.name}</span>
                        <button onClick={() => signOut()}>Logout</button>
                    </>
                )}
            </div>
        </nav>
    );
}
