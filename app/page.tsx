"use client";

import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { PackageSearch, SlidersHorizontal, X } from "lucide-react";

import {
  ProductCard,
  ProductCardSkeleton,
} from "@/components/product/ProductCard";
import { EmptyState } from "@/components/shared/EmptyState";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Product } from "@/lib/types";
import { cn } from "@/lib/utils";

const CATEGORIES = ["Gadget & Tech", "Lifestyle", "Home & Living", "Lain-lain"];

const SORTS = [
  { value: "default", label: "Paling Sesuai" },
  { value: "price_asc", label: "Harga Terendah" },
  { value: "price_desc", label: "Harga Tertinggi" },
  { value: "rating_desc", label: "Rating Tertinggi" },
];

const RATINGS = [
  { value: "all", label: "Semua Rating" },
  { value: "4", label: "4.0 ke atas" },
  { value: "4.5", label: "4.5 ke atas" },
];

/** Nilai sentinel dipakai karena Select tidak boleh punya item bernilai "". */
const ALL = "all";

function Catalog() {
  const router = useRouter();
  const params = useSearchParams();

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);

  const q = params.get("q") ?? "";
  const category = params.get("category") ?? "";
  const sort = params.get("sort") ?? "";
  const rating = params.get("rating") ?? "";
  const min = params.get("min") ?? "";
  const max = params.get("max") ?? "";

  const minRef = useRef<HTMLInputElement>(null);
  const maxRef = useRef<HTMLInputElement>(null);

  // URL adalah sumber kebenaran untuk filter. Sebelumnya semuanya disimpan di
  // state lokal, jadi hasil pencarian tidak bisa dibagikan lewat tautan dan
  // tombol back browser tidak mengembalikan filter yang tadi dipakai.
  const setParam = useCallback(
    (patch: Record<string, string>) => {
      const next = new URLSearchParams(params.toString());
      for (const [key, value] of Object.entries(patch)) {
        if (value && value !== ALL) next.set(key, value);
        else next.delete(key);
      }
      router.push(next.size ? `/?${next}` : "/");
    },
    [params, router]
  );

  useEffect(() => {
    const controller = new AbortController();
    const search = new URLSearchParams();
    for (const [key, value] of [
      ["q", q],
      ["category", category],
      ["min", min],
      ["max", max],
      ["rating", rating],
      ["sort", sort],
    ] as const) {
      if (value) search.set(key, value);
    }

    fetch(`/api/products?${search}`, { signal: controller.signal })
      .then((r) => (r.ok ? r.json() : { data: [] }))
      .then((json) => setProducts(json.data ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));

    return () => controller.abort();
  }, [q, category, min, max, rating, sort]);

  const activeCount = [q, category, rating, min, max].filter(Boolean).length;

  return (
    <>
      {/* Masthead menyambung langsung dari header — satu blok oranye penuh,
          tanpa garis pemisah. Warnanya yang jadi identitas halaman, bukan
          satu aksen kecil di tengah lautan putih. */}
      <section className="bg-brand text-white">
        <div className="shell flex flex-col gap-10 pb-14 md:flex-row md:items-end md:justify-between md:pb-20">
          <div>
            <p className="micro text-white/70">ShopKu — Katalog</p>
            <h1 className="display mt-4 text-[46px] text-white sm:text-[64px] lg:text-[76px]">
              Barang bagus,
              <br />
              harga jujur.
            </h1>
          </div>

          {/* Angka sungguhan, bukan janji pemasaran. */}
          <dl className="flex shrink-0 gap-8 md:gap-10">
            {[
              { k: "Produk", v: loading ? "—" : String(products.length) },
              { k: "Kategori", v: String(CATEGORIES.length) },
              { k: "Ongkir", v: "Gratis" },
            ].map((stat) => (
              <div key={stat.k}>
                <dd className="tnum text-[22px] leading-none font-bold text-white">
                  {stat.v}
                </dd>
                <dt className="micro mt-2 text-white/70">{stat.k}</dt>
              </div>
            ))}
          </dl>
        </div>
      </section>

      <div className="shell py-6 md:py-8">
      {/* Toolbar filter */}
      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-2">
        <div className="no-scrollbar -mx-1 flex gap-2 overflow-x-auto px-1 py-0.5 sm:flex-1">
          <FilterChip
            active={!category}
            onClick={() => setParam({ category: "" })}
          >
            Semua
          </FilterChip>
          {CATEGORIES.map((c) => (
            <FilterChip
              key={c}
              active={category === c}
              onClick={() => setParam({ category: category === c ? "" : c })}
            >
              {c}
            </FilterChip>
          ))}
        </div>

        <div className="flex items-center gap-2">
        <Select
          value={sort || "default"}
          onValueChange={(value) => setParam({ sort: String(value) === "default" ? "" : String(value) })}
        >
          <SelectTrigger className="h-9 w-[168px]" aria-label="Urutkan produk">
            <SelectValue>
              {(value) =>
                SORTS.find((s) => s.value === value)?.label ?? SORTS[0].label
              }
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {SORTS.map((s) => (
              <SelectItem key={s.value} value={s.value}>
                {s.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Button
          variant={showFilters ? "brandOutline" : "outline"}
          size="sm"
          aria-expanded={showFilters}
          onClick={() => setShowFilters((v) => !v)}
        >
          <SlidersHorizontal aria-hidden className="size-4" />
          Filter
          {activeCount > 0 && (
            <span className="tnum grid size-5 place-items-center rounded-full bg-brand text-[11px] font-bold text-white">
              {activeCount}
            </span>
          )}
        </Button>
        </div>
      </div>

      {showFilters && (
        <form
          className="rise surface mt-3 grid gap-4 p-4 sm:grid-cols-[1fr_1fr_1fr_auto] sm:items-end"
          onSubmit={(e) => {
            e.preventDefault();
            setParam({
              min: minRef.current?.value ?? "",
              max: maxRef.current?.value ?? "",
            });
          }}
        >
          <div className="space-y-1.5">
            <Label htmlFor="min">Harga minimum</Label>
            <Input
              id="min"
              ref={minRef}
              inputMode="numeric"
              defaultValue={min}
              placeholder="0"
              className="h-10"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="max">Harga maksimum</Label>
            <Input
              id="max"
              ref={maxRef}
              inputMode="numeric"
              defaultValue={max}
              placeholder="Tanpa batas"
              className="h-10"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="rating">Rating</Label>
            <Select
              value={rating || ALL}
              onValueChange={(value) => setParam({ rating: String(value) })}
            >
              <SelectTrigger id="rating" className="h-10 w-full">
                <SelectValue>
                  {(value) =>
                    RATINGS.find((r) => r.value === value)?.label ??
                    RATINGS[0].label
                  }
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {RATINGS.map((r) => (
                  <SelectItem key={r.value} value={r.value}>
                    {r.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button type="submit" className="h-10">
            Terapkan
          </Button>
        </form>
      )}

      {/* Judul hasil: garis rambut menyambung ke tepi kanan, jadi strukturnya
          dibawa garis dan bukan satu kotak lagi. */}
      <div className="mt-8 flex flex-wrap items-baseline gap-x-4 gap-y-2">
        <h2 className="display shrink-0 text-[26px] sm:text-[30px]">
          {q ? (
            <>
              Hasil untuk <em className="not-italic text-brand-ink">{q}</em>
            </>
          ) : category ? (
            category
          ) : (
            "Semua produk"
          )}
        </h2>

        <span className="micro shrink-0">
          {loading ? "Memuat" : `${products.length} barang`}
        </span>

        <span aria-hidden className="hidden h-px flex-1 bg-line sm:block" />

        {activeCount > 0 && (
          <button
            type="button"
            onClick={() => router.push("/")}
            className="inline-flex shrink-0 items-center gap-1 rounded-lg px-2 py-1 text-[13px] font-medium text-ink-3 transition-colors duration-160 hover:text-brand-ink focus-visible:ring-[3px] focus-visible:ring-brand/25 focus-visible:outline-none"
          >
            <X aria-hidden className="size-3.5" />
            Hapus filter
          </button>
        )}
      </div>

      <div className="mt-5">
        {loading ? (
          <div className="grid grid-cols-2 gap-x-4 gap-y-9 sm:gap-x-5 md:grid-cols-3 lg:grid-cols-4">
            {Array.from({ length: 8 }, (_, i) => (
              <ProductCardSkeleton key={i} />
            ))}
          </div>
        ) : products.length === 0 ? (
          <EmptyState
            icon={PackageSearch}
            title="Produknya belum ketemu"
            body="Coba kata kunci yang lebih umum, atau lepas beberapa filter yang sedang aktif."
            action={
              <Button variant="outline" onClick={() => router.push("/")}>
                Lihat semua produk
              </Button>
            }
          />
        ) : (
          <div
            data-testid="product-grid"
            className="stagger grid grid-cols-2 gap-x-4 gap-y-9 sm:gap-x-5 md:grid-cols-3 lg:grid-cols-4"
          >
            {products.map((product, i) => (
              <ProductCard key={product.id} product={product} priority={i < 4} />
            ))}
          </div>
        )}
      </div>
      </div>
    </>
  );
}

function FilterChip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "h-9 shrink-0 rounded-full border px-4 text-[13px] font-medium",
        "transition-[background-color,border-color,color,transform] duration-160 ease-out",
        "active:scale-[0.97] focus-visible:ring-[3px] focus-visible:ring-brand/25 focus-visible:outline-none",
        active
          ? "border-brand bg-brand text-white"
          : "border-line bg-card text-ink-2 hover:border-brand-line hover:bg-brand-soft hover:text-brand-ink"
      )}
    >
      {children}
    </button>
  );
}

export default function HomePage() {
  return (
    <Suspense
      fallback={
        <div className="shell py-8">
          <div className="shimmer h-64 rounded-2xl" />
        </div>
      }
    >
      <Catalog />
    </Suspense>
  );
}
