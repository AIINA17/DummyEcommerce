"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import { AlertCircle, Eye, EyeOff } from "lucide-react";

import { AuthShell } from "@/components/auth/AuthShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const callbackUrl = params.get("callbackUrl") ?? "/";

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setPending(true);

    const res = await signIn("credentials", {
      username,
      password,
      redirect: false,
    });

    setPending(false);

    if (res?.error) {
      setError("Username atau password salah");
      return;
    }

    router.push(callbackUrl);
    router.refresh();
  }

  return (
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
          name="username"
          autoComplete="username"
          required
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="Masukkan username"
          className="mt-1.5 h-11"
        />
      </div>

      <div>
        <Label htmlFor="password">Password</Label>
        <div className="relative mt-1.5">
          <Input
            id="password"
            name="password"
            type={show ? "text" : "password"}
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Masukkan password"
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

      <Button type="submit" size="lg" className="w-full" disabled={pending}>
        {pending ? "Memproses…" : "Masuk"}
      </Button>
    </form>
  );
}

export default function LoginPage() {
  return (
    <AuthShell
      title="Masuk"
      subtitle="Lanjutkan belanja dari mana pun kamu berhenti."
      footer={
        <>
          Belum punya akun?{" "}
          <Link
            href="/register"
            className="font-semibold text-brand-ink transition-colors duration-160 hover:underline"
          >
            Daftar
          </Link>
        </>
      }
    >
      <Suspense fallback={<div className="shimmer h-64 rounded-xl" />}>
        <LoginForm />
      </Suspense>
    </AuthShell>
  );
}
