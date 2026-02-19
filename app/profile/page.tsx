"use client";
// app/profile/page.tsx

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import {
  User,
  ShoppingCart,
  ClipboardList,
  Save,
  RotateCcw,
} from "lucide-react";

/* =======================  TYPES  ======================= */
interface UserData {
  id: number;
  username: string;
  email?: string;
  phone?: string;
  address?: string;
  avatar_url?: string;
  created_at?: string;
}

/* =======================  HELPERS  ======================= */
const getInitials = (name: string) =>
  name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

const formatDate = (d: string) =>
  new Date(d).toLocaleDateString("id-ID", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

/* =======================  PAGE  ======================= */
export default function ProfilePage() {
  const router = useRouter();
  const { data: session, status } = useSession();

  const [user, setUser] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: string } | null>(
    null,
  );
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    phone: "",
    address: "",
  });

  const userId = session?.user?.id ? Number(session.user.id) : null;

  async function loadUser() {
    if (!userId) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/user?user_id=${userId}`);
      const data = await res.json();
      if (data.data) {
        setUser(data.data);
        setFormData({
          username: data.data.username || "",
          email: data.data.email || "",
          phone: data.data.phone || "",
          address: data.data.address || "",
        });
      }
    } catch {
      showToast("Gagal memuat data profil", "error");
    } finally {
      setLoading(false);
    }
  }

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!userId) {
      router.push("/login");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/user", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: userId, ...formData }),
      });
      const data = await res.json();
      if (res.ok) {
        setUser(data.data);
        showToast("Profil berhasil diperbarui!", "success");
      } else {
        showToast(data.error || "Gagal memperbarui profil", "error");
      }
    } catch {
      showToast("Terjadi kesalahan", "error");
    } finally {
      setSaving(false);
    }
  }

  const showToast = (message: string, type: string) => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
      return;
    }
    if (status === "authenticated" && userId) loadUser();
  }, [status, userId]);

  /* ── States ── */
  if (loading) {
    return (
      <main className="main-container">
        <div className="state-screen">
          <div className="spinner" />
          <p className="state-text">Memuat profil...</p>
        </div>
      </main>
    );
  }

  if (!user) {
    return (
      <main className="main-container">
        <div className="state-screen">
          <div className="state-icon">
            <User size={34} />
          </div>
          <h3 className="state-title">Pengguna tidak ditemukan</h3>
          <p className="state-text">Silakan login terlebih dahulu</p>
          <Link href="/login">
            <button className="btn btn-primary">Login</button>
          </Link>
        </div>
      </main>
    );
  }

  /* ── Main ── */
  return (
    <main className="main-container">
      {/* ── Hero ── */}
      <div className="page-hero">
        <h1 className="page-title">Profil Saya</h1>
        <p className="page-subtitle">
          Kelola informasi profil untuk mengontrol akunmu
        </p>
      </div>

      <div className="profile-container">
        {/* ── Sidebar ── */}
        <aside className="profile-sidebar">
          <div className="profile-avatar">
            {getInitials(user.username || "U")}
          </div>
          <h2 className="profile-name">{user.username}</h2>
          <p className="profile-email">{user.email || "Email belum diatur"}</p>

          <nav className="profile-menu">
            <button className="profile-menu-item active">
              <User size={16} /> Profil Saya
            </button>
            <Link href="/cart" className="profile-menu-item">
              <ShoppingCart size={16} /> Keranjang Saya
            </Link>
            <Link href="/orders" className="profile-menu-item">
              <ClipboardList size={16} /> Pesanan Saya
            </Link>
          </nav>
        </aside>

        {/* ── Form ── */}
        <div className="profile-content">
          <h3 className="profile-section-title">Informasi Profil</h3>

          <form className="profile-form" onSubmit={handleSave}>
            <div className="form-group">
              <label className="form-label">Username</label>
              <input
                type="text"
                name="username"
                className="form-input"
                value={formData.username}
                onChange={handleChange}
                placeholder="Masukkan username"
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Email</label>
                <input
                  type="email"
                  name="email"
                  className="form-input"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="contoh@email.com"
                />
              </div>
              <div className="form-group">
                <label className="form-label">Nomor Telepon</label>
                <input
                  type="tel"
                  name="phone"
                  className="form-input"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="08xxxxxxxxxx"
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Alamat Lengkap</label>
              <textarea
                name="address"
                className="form-input"
                value={formData.address}
                onChange={handleChange}
                placeholder="Masukkan alamat lengkap untuk pengiriman"
                rows={3}
                style={{ resize: "vertical" }}
              />
            </div>

            {user.created_at && (
              <div className="form-group">
                <label className="form-label">Member Sejak</label>
                <input
                  type="text"
                  className="form-input"
                  value={formatDate(user.created_at)}
                  disabled
                />
              </div>
            )}

            <div style={{ display: "flex", gap: 12, marginTop: 8 }}>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={saving}
              >
                {saving ? (
                  <>
                    <span className="spinner-sm" /> Menyimpan...
                  </>
                ) : (
                  <>
                    <Save size={15} /> Simpan Perubahan
                  </>
                )}
              </button>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={loadUser}
              >
                <RotateCcw size={15} /> Reset
              </button>
            </div>
          </form>
        </div>
      </div>

      {toast && <div className={`toast ${toast.type}`}>{toast.message}</div>}
    </main>
  );
}
