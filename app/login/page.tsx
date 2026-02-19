"use client";
// app/login/page.tsx

import { signIn } from "next-auth/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ArrowLeft, Lock, AlertCircle } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const result = await signIn("credentials", {
        username,
        password,
        redirect: false,
      });
      if (result?.error) {
        setError("Username atau password salah. Silakan coba lagi.");
        setLoading(false);
      } else {
        router.push("/");
        router.refresh();
      }
    } catch {
      setError("Terjadi masalah koneksi. Coba beberapa saat lagi.");
      setLoading(false);
    }
  };

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
            <h1 className="header-title">Masuk</h1>
            <p className="header-subtitle">
              Silakan login untuk melanjutkan transaksi
            </p>
          </div>
        </div>
      </header>

      {/* ── Main ── */}
      <main
        className="page-main"
        style={{ maxWidth: 520, justifyContent: "flex-start" }}
      >
        {/* Error Alert */}
        {error && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              background: "var(--primary-50)",
              border: "1px solid var(--primary-100)",
              borderLeft: "3px solid var(--primary)",
              color: "var(--primary-dark)",
              padding: "12px 16px",
              borderRadius: "var(--radius-lg)",
              fontSize: 13,
              fontWeight: 500,
            }}
          >
            <AlertCircle size={16} style={{ flexShrink: 0 }} />
            <p>{error}</p>
          </div>
        )}

        {/* Login Card */}
        <div className="card">
          {/* Card Header */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              marginBottom: 20,
              paddingBottom: 16,
              borderBottom: "1px solid var(--gray-200)",
            }}
          >
            <div
              style={{
                width: 42,
                height: 42,
                borderRadius: "var(--radius-lg)",
                background: "var(--primary-50)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "var(--primary)",
              }}
            >
              <Lock size={20} />
            </div>
            <div>
              <p
                style={{
                  fontWeight: 700,
                  fontSize: 14,
                  color: "var(--gray-900)",
                }}
              >
                Akses Akun
              </p>
              <p
                style={{ fontSize: 12, color: "var(--gray-500)", marginTop: 2 }}
              >
                Gunakan username dan password kamu
              </p>
            </div>
          </div>

          {/* Form */}
          <form
            onSubmit={handleSubmit}
            style={{ display: "flex", flexDirection: "column", gap: 16 }}
          >
            <div className="form-group">
              <label className="form-label">Username</label>
              <input
                type="text"
                required
                placeholder="Masukkan username"
                className="form-input"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                disabled={loading}
              />
            </div>

            <div className="form-group">
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: 7,
                }}
              >
                <label className="form-label" style={{ marginBottom: 0 }}>
                  Password
                </label>
                <Link
                  href="#"
                  style={{
                    fontSize: 12,
                    color: "var(--info)",
                    textDecoration: "none",
                  }}
                >
                  Lupa Password?
                </Link>
              </div>
              <input
                type="password"
                required
                placeholder="Masukkan password"
                className="form-input"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary btn-full"
              style={{ padding: "14px", marginTop: 4 }}
            >
              {loading ? (
                <>
                  <span className="spinner-sm" /> Memproses...
                </>
              ) : (
                "Masuk Sekarang"
              )}
            </button>
          </form>

          {/* Register Footer */}
          <div
            style={{
              textAlign: "center",
              marginTop: 24,
              paddingTop: 20,
              borderTop: "1px dashed var(--gray-200)",
              fontSize: 13,
              color: "var(--gray-600)",
            }}
          >
            Belum punya akun?{" "}
            <Link
              href="/register"
              style={{
                color: "var(--primary)",
                fontWeight: 700,
                textDecoration: "none",
              }}
            >
              Daftar Sekarang
            </Link>
          </div>
        </div>

        {/* Support Links */}
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            gap: 12,
            fontSize: 12,
            color: "var(--gray-400)",
          }}
        >
          <Link
            href="#"
            style={{ color: "var(--gray-400)", textDecoration: "none" }}
          >
            Bantuan
          </Link>
          <span>•</span>
          <Link
            href="#"
            style={{ color: "var(--gray-400)", textDecoration: "none" }}
          >
            Kebijakan Privasi
          </Link>
        </div>
      </main>
    </div>
  );
}
