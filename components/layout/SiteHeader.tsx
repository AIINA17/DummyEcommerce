"use client";

import {
  Suspense,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import {
  ChevronDown,
  ClipboardList,
  LogOut,
  Moon,
  Search,
  ShoppingBag,
  ShoppingCart,
  Sun,
  User,
  Wallet,
} from "lucide-react";

import { useCart } from "@/components/cart-store";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { formatIDR } from "@/lib/format";
import { cn } from "@/lib/utils";

function Logo() {
  return (
    <Link
      href="/"
      aria-label="ShopKu — ke beranda"
      className="flex shrink-0 items-center gap-2 rounded-lg outline-none focus-visible:ring-[3px] focus-visible:ring-brand/25"
    >
      <span className="grid size-8 place-items-center rounded-md bg-white text-brand">
        <ShoppingBag aria-hidden className="size-[18px]" strokeWidth={2.2} />
      </span>
      <span className="text-[19px] leading-none font-extrabold tracking-[-0.03em] text-white">
        ShopKu
      </span>
    </Link>
  );
}

function SearchField() {
  const router = useRouter();
  const params = useSearchParams();
  const inputRef = useRef<HTMLInputElement>(null);
  const query = params.get("q") ?? "";

  // Nilai ditulis langsung ke DOM, bukan disimpan di state: input tidak perlu
  // di-mount ulang tiap URL berubah, jadi kursor tidak lompat saat mengetik.
  useEffect(() => {
    const input = inputRef.current;
    if (input && input !== document.activeElement) input.value = query;
  }, [query]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = document.activeElement?.tagName;
      if (e.key === "/" && tag !== "INPUT" && tag !== "TEXTAREA") {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <form
      role="search"
      onSubmit={(e) => {
        e.preventDefault();
        const next = inputRef.current?.value.trim() ?? "";
        router.push(next ? `/?q=${encodeURIComponent(next)}` : "/");
      }}
      className="relative order-3 min-w-0 basis-full md:order-2 md:flex-1 md:basis-auto"
    >
      <Search
        aria-hidden
        className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-[#8a7a73]"
      />
      <input
        ref={inputRef}
        name="q"
        defaultValue={query}
        placeholder="Cari produk di ShopKu"
        aria-label="Cari produk"
        className={cn(
          "h-10 w-full rounded-md border border-transparent bg-white pr-14 pl-9 text-[14px] text-[#1a1210]",
          "placeholder:text-[#8a7a73]",
          "transition-[box-shadow] duration-160 ease-out",
          "focus:ring-[3px] focus:ring-white/45 focus:outline-none"
        )}
      />
      <kbd
        aria-hidden
        // Kolom pencarian selalu putih (duduk di atas header oranye), jadi
        // kbd di dalamnya tidak boleh ikut token tema — di mode gelap itu
        // membuatnya jadi kotak hitam di atas kolom putih.
        className="pointer-events-none absolute top-1/2 right-3 hidden -translate-y-1/2 rounded border border-[#e7ded9] bg-[#f6f1ee] px-1.5 py-0.5 text-[11px] font-medium text-[#8a7a73] lg:block"
      >
        /
      </kbd>
    </form>
  );
}

// Tema yang sebenarnya hidup di `<html class="dark">`, bukan di React —
// script di layout sudah memasangnya sebelum paint pertama. Menyalinnya ke
// state lewat effect berarti React merender dua kali dan sempat salah di
// render pertama. useSyncExternalStore membaca langsung dari DOM, dengan
// snapshot server `false` supaya hidrasi tetap cocok.
const themeListeners = new Set<() => void>();

function subscribeTheme(onChange: () => void) {
  themeListeners.add(onChange);
  return () => {
    themeListeners.delete(onChange);
  };
}

function isDarkNow() {
  return document.documentElement.classList.contains("dark");
}

function ThemeToggle() {
  const dark = useSyncExternalStore(subscribeTheme, isDarkNow, () => false);

  return (
    <Button
      variant="ghost"
      size="icon-sm"
      className="text-white hover:bg-white/15 hover:text-white"
      aria-label={dark ? "Mode terang" : "Mode gelap"}
      onClick={() => {
        const next = !dark;
        document.documentElement.classList.toggle("dark", next);
        localStorage.setItem("theme", next ? "dark" : "light");
        themeListeners.forEach((listener) => listener());
      }}
    >
      {dark ? (
        <Sun aria-hidden className="size-[18px]" />
      ) : (
        <Moon aria-hidden className="size-[18px]" />
      )}
    </Button>
  );
}

function AccountMenu() {
  const { data: session } = useSession();
  const [balance, setBalance] = useState<number | null>(null);

  useEffect(() => {
    let alive = true;
    fetch("/api/me")
      .then((r) => (r.ok ? r.json() : null))
      .then((j) => {
        if (alive && j?.success) setBalance(Number(j.data.balance));
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, [session?.user?.id]);

  const name = session?.user?.name ?? "Pengguna";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label="Menu akun"
        className={cn(
          "flex items-center gap-2 rounded-md py-1 pr-1.5 pl-1.5 text-[14px] font-medium text-white",
          "transition-colors duration-160 hover:bg-white/15",
          "focus-visible:ring-2 focus-visible:ring-white focus-visible:outline-none"
        )}
      >
        <span className="grid size-7 shrink-0 place-items-center rounded-full bg-white text-[12px] font-bold text-brand">
          {name.slice(0, 1).toUpperCase()}
        </span>
        <span className="hidden max-w-20 truncate lg:inline">{name}</span>
        <ChevronDown aria-hidden className="size-4 text-white/70" />
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-64">
        <div className="px-2 pt-1.5 pb-2">
          <p className="truncate text-[14px] font-bold">{name}</p>
          <div className="mt-2 flex items-center gap-2 rounded-md bg-brand-soft px-2.5 py-2">
            <Wallet aria-hidden className="size-4 shrink-0 text-brand-ink" />
            <span className="text-[12px] text-brand-ink">ShopKu Pay</span>
            <span className="tnum ml-auto text-[13px] font-bold text-brand-ink">
              {balance === null ? "—" : formatIDR(balance)}
            </span>
          </div>
        </div>
        <DropdownMenuSeparator />
        <DropdownMenuItem render={<Link href="/profile" />}>
          <User aria-hidden className="size-4 text-ink-3" />
          Pengaturan Profil
        </DropdownMenuItem>
        <DropdownMenuItem render={<Link href="/orders" />}>
          <ClipboardList aria-hidden className="size-4 text-ink-3" />
          Pesanan Saya
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem variant="destructive" onSelect={() => signOut()}>
          <LogOut aria-hidden className="size-4" />
          Keluar
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

const NAV = [
  { href: "/", label: "Belanja" },
  { href: "/orders", label: "Pesanan" },
];

export function SiteHeader() {
  const pathname = usePathname();
  const { status } = useSession();
  const { count } = useCart();

  const onLogin = pathname.startsWith("/login");
  const onRegister = pathname.startsWith("/register");

  const isActive = (href: string) =>
    href === "/"
      ? pathname === "/"
      : pathname.startsWith(href) || pathname.startsWith("/order/");

  return (
    <header className="sticky top-0 z-50 bg-brand text-white">
      {/* Di bawah md, header jadi dua baris: logo + aksi di atas, kolom
          pencarian penuh di bawahnya. Sebelumnya kolom pencarian disembunyikan
          di layar kecil — di marketplace itu berarti menghapus satu-satunya
          cara mencari barang. */}
      <div className="shell flex flex-wrap items-center gap-x-3 gap-y-2.5 py-3 md:h-16 md:flex-nowrap md:gap-x-5 md:py-0">
        <Logo />

        {/* useSearchParams butuh Suspense; fallback berukuran sama supaya
            header tidak bergeser saat hydrate. */}
        <Suspense
          fallback={
            <div className="order-3 h-10 min-w-0 basis-full rounded-md bg-white md:order-2 md:flex-1 md:basis-auto" />
          }
        >
          <SearchField />
        </Suspense>

        <nav
          aria-label="Utama"
          className="hidden items-center gap-1 md:order-3 md:flex"
        >
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              aria-current={isActive(item.href) ? "page" : undefined}
              className={cn(
                "rounded-md px-3 py-2 text-[14px] font-medium",
                "transition-colors duration-160",
                isActive(item.href)
                  ? "bg-white text-brand"
                  : "text-white/85 hover:bg-white/15 hover:text-white"
              )}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="order-2 ml-auto flex items-center gap-1.5 md:order-4 md:ml-0">
          <Link
            href="/cart"
            aria-label={`Keranjang${count ? `, ${count} barang` : ", kosong"}`}
            className={cn(
              "relative grid size-9 place-items-center rounded-md text-white",
              "transition-colors duration-160 hover:bg-white/15",
              "focus-visible:ring-2 focus-visible:ring-white focus-visible:outline-none"
            )}
          >
            <ShoppingCart aria-hidden className="size-[19px]" strokeWidth={1.9} />
            {count > 0 && (
              <span className="tnum absolute top-0.5 right-0.5 grid min-w-[17px] place-items-center rounded-full bg-white px-1 text-[10px] leading-[17px] font-bold text-brand">
                {count > 99 ? "99+" : count}
              </span>
            )}
          </Link>

          <ThemeToggle />

          <div aria-hidden className="mx-1 hidden h-6 w-px bg-white/25 sm:block" />

          {status === "authenticated" ? (
            <AccountMenu />
          ) : (
            // Di halaman login/daftar, tombol yang sama sudah jadi aksi utama
            // di dalam form. Menampilkannya lagi di header bikin dua tombol
            // "Masuk" di satu layar — tawarkan alternatifnya saja.
            <div className="flex items-center gap-2">
              {onRegister ? (
                <Button
                  size="sm"
                  className="bg-white text-brand hover:bg-white/90"
                  render={<Link href="/login" />}
                >
                  Masuk
                </Button>
              ) : onLogin ? (
                <Button
                  size="sm"
                  className="bg-white text-brand hover:bg-white/90"
                  render={<Link href="/register" />}
                >
                  Daftar
                </Button>
              ) : (
                <>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="hidden text-white hover:bg-white/15 hover:text-white sm:inline-flex"
                    render={<Link href="/login" />}
                  >
                    Masuk
                  </Button>
                  <Button
                    size="sm"
                    className="bg-white text-brand hover:bg-white/90"
                    render={<Link href="/register" />}
                  >
                    Daftar
                  </Button>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
