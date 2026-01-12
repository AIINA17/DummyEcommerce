"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";

interface User {
    id: number;
    username: string;
    email?: string;
    phone?: string;
    address?: string;
    avatar_url?: string;
    created_at?: string;
}

export default function ProfilePage() {
    const router = useRouter();
    const { data: session, status } = useSession();
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [toast, setToast] = useState<{
        message: string;
        type: string;
    } | null>(null);

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
        } catch (error) {
            console.error("Error loading user:", error);
            showToast("Gagal memuat data profil", "error");
        } finally {
            setLoading(false);
        }
    }

    function handleChange(
        e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
    ) {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    }

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
                showToast("Profil berhasil diperbarui! ✅", "success");
            } else {
                showToast(data.error || "Gagal memperbarui profil", "error");
            }
        } catch (error) {
            showToast("Terjadi kesalahan", "error");
        } finally {
            setSaving(false);
        }
    }

    function showToast(message: string, type: string) {
        setToast({ message, type });
        setTimeout(() => setToast(null), 3000);
    }

    function getInitials(name: string) {
        return name
            .split(" ")
            .map((w) => w[0])
            .join("")
            .toUpperCase()
            .slice(0, 2);
    }

    function formatDate(dateString: string) {
        return new Date(dateString).toLocaleDateString("id-ID", {
            year: "numeric",
            month: "long",
            day: "numeric",
        });
    }

    useEffect(() => {
        if (status === "unauthenticated") {
            router.push("/login");
            return;
        }
        if (status === "authenticated" && userId) {
            loadUser();
        }
    }, [status, userId]);

    if (loading) {
        return (
            <main className="main-container">
                <div className="loading">
                    <div className="spinner"></div>
                </div>
            </main>
        );
    }

    if (!user) {
        return (
            <main className="main-container">
                <div className="empty-state">
                    <h3>Pengguna tidak ditemukan</h3>
                    <p>Silakan login terlebih dahulu</p>
                </div>
            </main>
        );
    }

    return (
        <main className="main-container">
            <div className="page-header">
                <h1 className="page-title">👤 Profil Saya</h1>
                <p className="page-subtitle">
                    Kelola informasi profil untuk mengontrol akun kamu
                </p>
            </div>

            <div className="profile-container">
                <aside className="profile-sidebar">
                    <div className="profile-avatar">
                        {getInitials(user.username || "U")}
                    </div>
                    <h2 className="profile-name">{user.username}</h2>
                    <p className="profile-email">
                        {user.email || "Email belum diatur"}
                    </p>

                    <nav className="profile-menu">
                        <button className="profile-menu-item active">
                            <svg
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2">
                                <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
                                <circle cx="12" cy="7" r="4" />
                            </svg>
                            Profil Saya
                        </button>
                        <Link href="/cart" className="profile-menu-item">
                            <svg
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2">
                                <circle cx="9" cy="21" r="1" />
                                <circle cx="20" cy="21" r="1" />
                                <path d="M1 1h4l2.68 13.39a2 2 0 002 1.61h9.72a2 2 0 002-1.61L23 6H6" />
                            </svg>
                            Keranjang Saya
                        </Link>
                        <Link href="/orders" className="profile-menu-item">
                            <svg
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2">
                                <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
                                <polyline points="14,2 14,8 20,8" />
                            </svg>
                            Pesanan Saya
                        </Link>
                    </nav>
                </aside>

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
                                <label className="form-label">
                                    Nomor Telepon
                                </label>
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
                                <label className="form-label">
                                    Member Sejak
                                </label>
                                <input
                                    type="text"
                                    className="form-input"
                                    value={formatDate(user.created_at)}
                                    disabled
                                />
                            </div>
                        )}

                        <div
                            style={{
                                display: "flex",
                                gap: "12px",
                                marginTop: "8px",
                            }}>
                            <button
                                type="submit"
                                className="btn btn-primary"
                                disabled={saving}>
                                {saving ? "Menyimpan..." : "Simpan Perubahan"}
                            </button>
                            <button
                                type="button"
                                className="btn btn-secondary"
                                onClick={loadUser}>
                                Reset
                            </button>
                        </div>
                    </form>
                </div>
            </div>

            {toast && (
                <div className={`toast ${toast.type}`}>{toast.message}</div>
            )}
        </main>
    );
}
