"use client";

import { signIn } from "next-auth/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

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
    } catch (err) {
      setError("Terjadi masalah koneksi. Coba beberapa saat lagi.");
      setLoading(false);
    }
  };

  return (
    <div className="checkout-page">
      {/* Header - Identik dengan Order Detail */}
      <header className="checkout-header">
        <div className="checkout-header-content">
          <button onClick={() => router.push("/")} className="checkout-back-btn">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
          </button>
          <div className="checkout-header-text">
            <h1>Masuk</h1>
            <p>Silakan login untuk melanjutkan transaksi</p>
          </div>
        </div>
      </header>

      <main className="checkout-main">
        <div style={{ maxWidth: "500px", margin: "0 auto" }}>
          
          {/* Error Alert Box */}
          {error && (
            <div className="checkout-error-alert mb-4">
              <span>❌</span>
              <p>{error}</p>
            </div>
          )}

          {/* Login Card - Mengikuti struktur checkout-card */}
          <section className="checkout-card">
            <div className="checkout-card-header">
              <div className="checkout-card-icon">🔒</div>
              <div>
                <h2>Akses Akun</h2>
                <p>Gunakan username dan password Anda</p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="mt-4">
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
                <div className="flex justify-between items-center mb-1">
                  <label className="form-label">Password</label>
                  <Link href="#" className="text-link-sm">Lupa Password?</Link>
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
                className="btn btn-primary w-full mt-4"
                style={{ padding: '14px' }}
              >
                {loading ? "Memproses..." : "Masuk Sekarang"}
              </button>
            </form>

            <div className="register-footer">
              <p>Belum punya akun?</p>
              <Link href="/register" className="text-primary font-bold"> Daftar Sekarang</Link>
            </div>
          </section>

          {/* Support Links */}
          <div className="support-links">
            <Link href="#">Bantuan</Link>
            <span>•</span>
            <Link href="#">Kebijakan Privasi</Link>
          </div>
        </div>
      </main>

      <style jsx>{`
        /* Sync dengan style OrderDetail */
        .checkout-page {
          min-height: 100vh;
          background: #f8f9fa;
        }
        .checkout-header {
          background: white;
          border-bottom: 1px solid #eee;
        }
        .checkout-header-content {
          max-width: 1200px;
          margin: 0 auto;
          padding: 15px 20px;
          display: flex;
          align-items: center;
          gap: 15px;
        }
        .checkout-header-text h1 {
          font-size: 1.25rem;
          font-weight: 700;
          color: #333;
          margin: 0;
        }
        .checkout-header-text p {
          font-size: 0.85rem;
          color: #666;
          margin: 0;
        }
        .checkout-back-btn {
          background: none;
          border: none;
          padding: 5px;
          cursor: pointer;
          color: #333;
        }
        .checkout-back-btn svg { width: 24px; height: 24px; }

        .checkout-main {
          max-width: 1200px;
          margin: 0 auto;
          padding: 20px;
        }

        .checkout-card {
          background: white;
          border-radius: 12px;
          padding: 20px;
          margin-bottom: 20px;
          box-shadow: 0 2px 10px rgba(0,0,0,0.05);
          border: 1px solid #f0f0f0;
        }
        .checkout-card-header {
          display: flex;
          gap: 15px;
          align-items: center;
          padding-bottom: 15px;
          border-bottom: 1px solid #f8f9fa;
          margin-bottom: 15px;
        }
        .checkout-card-icon {
          width: 45px;
          height: 45px;
          background: #fff5f2;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.2rem;
        }
        .checkout-card-header h2 {
          font-size: 1.05rem;
          font-weight: 700;
          margin: 0;
        }
        .checkout-card-header p {
          font-size: 0.85rem;
          color: #777;
          margin: 0;
        }

        .form-group { margin-bottom: 15px; }
        .form-label { display: block; font-size: 0.9rem; font-weight: 600; color: #444; margin-bottom: 8px; }
        .form-input {
          width: 100%;
          padding: 12px;
          border: 1px solid #ddd;
          border-radius: 8px;
          font-size: 1rem;
          outline: none;
          transition: border-color 0.2s;
        }
        .form-input:focus { border-color: #EE4D2D; }
        
        .btn-primary {
          background: #EE4D2D;
          color: white;
          border: none;
          border-radius: 8px;
          font-weight: 700;
          cursor: pointer;
          transition: opacity 0.2s;
        }
        .btn-primary:hover { opacity: 0.9; }
        .btn-primary:disabled { background: #ccc; }

        .checkout-error-alert {
          background: #fff1f0;
          border: 1px solid #ffccc7;
          padding: 12px;
          border-radius: 8px;
          display: flex;
          gap: 10px;
          color: #ff4d4f;
          font-size: 0.9rem;
          align-items: center;
        }

        .text-primary { color: #EE4D2D; }
        .font-bold { font-weight: 700; }
        .text-link-sm { font-size: 0.8rem; color: #3498db; text-decoration: none; }
        
        .register-footer {
          text-align: center;
          margin-top: 25px;
          padding-top: 20px;
          border-top: 1px dashed #eee;
          font-size: 0.9rem;
        }
        
        .support-links {
          display: flex;
          justify-content: center;
          gap: 15px;
          margin-top: 20px;
          font-size: 0.8rem;
          color: #999;
        }
        .support-links a { color: #999; text-decoration: none; }
        .w-full { width: 100%; }
        .mt-4 { margin-top: 1rem; }
        .mb-4 { margin-bottom: 1rem; }
      `}</style>
    </div>
  );
}