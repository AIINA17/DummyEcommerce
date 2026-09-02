"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { AlertCircle, Check, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";

import { AuthShell } from "@/components/auth/AuthShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

export default function RegisterPage() {
  const router = useRouter();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  // Syaratnya ditampilkan dan dicentang sambil user mengetik, bukan baru
  // muncul sebagai error setelah submit.
  const rules = [
    { label: "Username minimal 3 karakter", ok: username.trim().length >= 3 },
    { label: "Password minimal 6 karakter", ok: password.length >= 6 },
  ];
  const valid = rules.every((r) => r.ok);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!valid) return;

    setPending(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: username.trim(), password }),
      });
      const json = await res.json();

      if (!res.ok || !json.success) {
        setError(json.message ?? "Pendaftaran gagal");
        return;
      }

      // Langsung masuk setelah daftar — tidak masuk akal menyuruh user
      // mengetik ulang kredensial yang baru saja dia buat.
      const signInRes = await signIn("credentials", {
        username: username.trim(),
        password,
        redirect: false,
      });

      if (signInRes?.error) {
        toast.success("Akun dibuat. Silakan masuk.");
        router.push("/login");
        return;
      }

      toast.success("Selamat datang di ShopKu!");
      router.push("/");
      router.refresh();
    } finally {
      setPending(false);
    }
  }

  return (
    <AuthShell
      title="Daftar"
      subtitle="Bikin akun dalam 10 detik, langsung bisa belanja."
      footer={
        <>
          Sudah punya akun?{" "}
          <Link
            href="/login"
            className="font-semibold text-brand-ink transition-colors duration-160 hover:underline"
          >
            Masuk
          </Link>
        </>
      }
    >
      <form onSubmit={onSubmit} className="space-y-4" noValidate>
        {error && (
          <p
            role="alert"
            data-testid="auth-error"
            className="flex items-center gap-2 rounded-xl bg-destructive/10 px-3.5 py-2.5 text-[13px] font-semibold text-destructive"
          >
            <AlertCircle aria-hidden className="size-4 shrink-0" />
            {error}
          </p>
        )}

        <div>
          <Label htmlFor="username">Username</Label>
          <Input
            id="username"
            autoComplete="username"
            required
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Pilih username unik"
            className="mt-1.5 h-11"
          />
        </div>

        <div>
          <Label htmlFor="password">Password</Label>
          <div className="relative mt-1.5">
            <Input
              id="password"
              type={show ? "text" : "password"}
              autoComplete="new-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Minimal 6 karakter"
              className="h-11 pr-11"
            />
            <button
              type="button"
              aria-label={show ? "Sembunyikan password" : "Tampilkan password"}
              onClick={() => setShow((v) => !v)}
              className="absolute top-1/2 right-1 grid size-9 -translate-y-1/2 place-items-center rounded-lg text-ink-3 transition-colors duration-160 hover:text-ink focus-visible:ring-[3px] focus-visible:ring-brand/25 focus-visible:outline-none"
            >
              {show ? (
                <EyeOff aria-hidden className="size-4" />
              ) : (
                <Eye aria-hidden className="size-4" />
              )}
            </button>
          </div>
        </div>

        <ul className="space-y-2">
          {rules.map((rule) => (
            <li
              key={rule.label}
              className={cn(
                "flex items-center gap-2 text-[12.5px] transition-colors duration-160",
                rule.ok ? "text-success" : "text-ink-3"
              )}
            >
              <Check
                aria-hidden
                className={cn(
                  "size-3.5 transition-opacity duration-160",
                  rule.ok ? "opacity-100" : "opacity-35"
                )}
              />
              {rule.label}
            </li>
          ))}
        </ul>

        <Button
          type="submit"
          size="lg"
          className="w-full"
          disabled={!valid || pending}
        >
          {pending ? "Mendaftarkan…" : "Daftar"}
        </Button>
      </form>
    </AuthShell>
  );
}
