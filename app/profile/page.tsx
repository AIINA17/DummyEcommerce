"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { ClipboardList, Wallet } from "lucide-react";
import { toast } from "sonner";

import { PageHeader } from "@/components/shared/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { formatDate, formatIDR } from "@/lib/format";
import type { UserData } from "@/lib/types";

const FIELDS = [
  { key: "username", label: "Username", type: "text", placeholder: "Username kamu" },
  { key: "email", label: "Email", type: "email", placeholder: "contoh@email.com" },
  { key: "phone", label: "Nomor telepon", type: "tel", placeholder: "08xxxxxxxxxx" },
] as const;

export default function ProfilePage() {
  const router = useRouter();
  const { status } = useSession();

  const [user, setUser] = useState<UserData | null>(null);
  const [form, setForm] = useState({
    username: "",
    email: "",
    phone: "",
    address: "",
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (status === "unauthenticated") router.replace("/login?callbackUrl=/profile");
  }, [status, router]);

  useEffect(() => {
    if (status !== "authenticated") return;
    const controller = new AbortController();
    fetch("/api/user", { signal: controller.signal })
      .then((r) => (r.ok ? r.json() : null))
      .then((j) => {
        if (!j?.success) return;
        setUser(j.data);
        setForm({
          username: j.data.username ?? "",
          email: j.data.email ?? "",
          phone: j.data.phone ?? "",
          address: j.data.address ?? "",
        });
      })
      .catch(() => {});
    return () => controller.abort();
  }, [status]);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch("/api/user", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const json = await res.json();

      if (!res.ok || !json.success) {
        toast.error(json.error ?? "Gagal menyimpan profil");
        return;
      }

      setUser(json.data);
      toast.success("Profil tersimpan");
      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  if (!user) {
    return (
      <div className="shell grid gap-6 py-8 lg:grid-cols-[300px_1fr]">
        <div className="shimmer h-64 rounded-2xl" />
        <div className="shimmer h-96 rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="shell py-6 md:py-8">
      <PageHeader
        title="Profil saya"
        subtitle="Alamat di sini yang dipakai saat checkout"
        backHref="/"
        backLabel="Kembali"
      />

      <div className="grid items-start gap-6 lg:grid-cols-[300px_1fr]">
        <aside className="space-y-3">
          <div className="surface flex flex-col items-center p-6 text-center">
            <span className="grid size-20 place-items-center rounded-full bg-brand-soft text-[28px] font-extrabold text-brand-ink">
              {user.username.slice(0, 1).toUpperCase()}
            </span>
            <p className="mt-4 max-w-full truncate text-[17px] font-bold">
              {user.username}
            </p>
            {user.created_at && (
              <p className="mt-1 text-[12.5px] text-ink-3">
                Bergabung {formatDate(user.created_at)}
              </p>
            )}
          </div>

          <div className="surface overflow-hidden">
            <div className="border-b border-line bg-brand-soft px-5 py-4">
              <p className="flex items-center gap-2 text-[12.5px] font-semibold text-brand-ink">
                <Wallet aria-hidden className="size-4" />
                ShopKu Pay
              </p>
              <p
                data-testid="wallet-balance"
                className="tnum mt-2 text-[24px] leading-none font-extrabold text-brand-ink"
              >
                {formatIDR(Number(user.balance))}
              </p>
            </div>
            <p className="px-5 py-3 text-[11.5px] leading-relaxed text-ink-3">
              Saldo demo, tidak bisa dicairkan.
            </p>
          </div>

          <Button variant="outline" className="w-full" render={<Link href="/orders" />}>
            <ClipboardList aria-hidden className="size-4" />
            Pesanan saya
          </Button>
        </aside>

        <form onSubmit={save} className="surface p-5 sm:p-6">
          <h2 className="text-[16px]">Informasi profil</h2>
          <p className="mt-1 text-[13px] text-ink-3">
            Data ini hanya dipakai untuk pengiriman pesanan.
          </p>

          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            {FIELDS.map((field) => (
              <div
                key={field.key}
                className={field.key === "username" ? "sm:col-span-2" : undefined}
              >
                <Label htmlFor={field.key}>{field.label}</Label>
                <Input
                  id={field.key}
                  type={field.type}
                  placeholder={field.placeholder}
                  value={form[field.key]}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, [field.key]: e.target.value }))
                  }
                  className="mt-1.5 h-11"
                />
              </div>
            ))}
          </div>

          <div className="mt-4">
            <Label htmlFor="address">Alamat lengkap</Label>
            <Textarea
              id="address"
              rows={3}
              placeholder="Jalan, nomor rumah, kelurahan, kota, kode pos"
              value={form.address}
              onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
              className="mt-1.5"
            />
          </div>

          <div className="mt-6 flex justify-end gap-2 border-t border-line pt-5">
            <Button
              type="button"
              variant="outline"
              onClick={() =>
                setForm({
                  username: user.username ?? "",
                  email: user.email ?? "",
                  phone: user.phone ?? "",
                  address: user.address ?? "",
                })
              }
            >
              Batalkan perubahan
            </Button>
            <Button type="submit" disabled={saving} data-testid="save-profile">
              {saving ? "Menyimpan…" : "Simpan"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
