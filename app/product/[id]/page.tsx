"use client";

import { use, useEffect, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import {
  ChevronRight,
  Minus,
  PackageX,
  Plus,
  RotateCcw,
  ShieldCheck,
  ShoppingCart,
  Truck,
} from "lucide-react";
import { toast } from "sonner";

import { useCart } from "@/components/cart-store";
import { ProductCard } from "@/components/product/ProductCard";
import { EmptyState } from "@/components/shared/EmptyState";
import { Rating } from "@/components/shared/Rating";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { formatIDR, productImage } from "@/lib/format";
import type { Product } from "@/lib/types";

const GUARANTEES = [
  { Icon: ShieldCheck, label: "Garansi resmi 1 tahun" },
  { Icon: Truck, label: "Gratis ongkir ke seluruh Indonesia" },
  { Icon: RotateCcw, label: "Bisa dikembalikan dalam 7 hari" },
];

export default function ProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const { status } = useSession();
  const { add } = useCart();

  const [product, setProduct] = useState<Product | null>(null);
  const [related, setRelated] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [qty, setQty] = useState(1);
  const [broken, setBroken] = useState(false);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    const controller = new AbortController();

    fetch(`/api/products/${id}`, { signal: controller.signal })
      .then((r) => (r.ok ? r.json() : null))
      .then(async (json) => {
        if (!json?.success) {
          setProduct(null);
          return;
        }
        const current: Product = json.data;
        setProduct(current);

        const res = await fetch(
          `/api/products?category=${encodeURIComponent(current.category)}`,
          { signal: controller.signal }
        );
        const all = await res.json();
        setRelated(
          (all.data ?? [])
            .filter((p: Product) => p.id !== current.id)
            .slice(0, 4)
        );
      })
      .catch(() => {})
      .finally(() => setLoading(false));

    return () => controller.abort();
  }, [id]);

  function requireLogin(): boolean {
    if (status === "authenticated") return false;
    toast.info("Masuk dulu untuk mulai belanja");
    router.push(`/login?callbackUrl=/product/${id}`);
    return true;
  }

  async function addToCart(): Promise<boolean> {
    if (requireLogin()) return false;
    const ok = await add(Number(id), qty);
    if (ok) toast.success("Masuk keranjang");
    else toast.error("Gagal menambahkan ke keranjang");
    return ok;
  }

  if (loading) {
    return (
      <div className="shell grid gap-8 py-8 lg:grid-cols-[minmax(0,480px)_1fr]">
        <div className="shimmer aspect-square rounded-2xl" />
        <div className="space-y-4">
          <div className="shimmer h-8 w-3/4 rounded" />
          <div className="shimmer h-10 w-1/3 rounded" />
          <div className="shimmer h-40 w-full rounded-2xl" />
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="shell py-16">
        <EmptyState
          icon={PackageX}
          title="Produk tidak ditemukan"
          body="Mungkin produknya sudah dihapus penjual, atau alamatnya salah ketik."
          action={<Button render={<Link href="/" />}>Kembali ke beranda</Button>}
        />
      </div>
    );
  }

  const soldOut = product.stock <= 0;
  const subtotal = product.price * qty;

  return (
    <div className="shell py-6 md:py-8">
      <nav aria-label="Breadcrumb" className="mb-5">
        <ol className="flex flex-wrap items-center gap-1 text-[13px] text-ink-3">
          <li>
            <Link href="/" className="transition-colors duration-160 hover:text-brand-ink">
              Beranda
            </Link>
          </li>
          <ChevronRight aria-hidden className="size-3.5" />
          <li>
            <Link
              href={`/?category=${encodeURIComponent(product.category)}`}
              className="transition-colors duration-160 hover:text-brand-ink"
            >
              {product.category}
            </Link>
          </li>
          <ChevronRight aria-hidden className="size-3.5" />
          <li aria-current="page" className="truncate text-ink">
            {product.name}
          </li>
        </ol>
      </nav>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,460px)_1fr] lg:gap-10">
        <div className="lg:sticky lg:top-24 lg:h-fit">
          <div className="surface overflow-hidden">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={broken ? productImage(product.id) : productImage(product.id, product.image_url)}
              alt={product.name}
              width={800}
              height={800}
              onError={() => setBroken(true)}
              className="aspect-square w-full object-cover"
            />
          </div>
        </div>

        <div>
          <p className="micro">{product.category}</p>

          <h1 className="mt-2.5 text-[26px] leading-tight sm:text-[32px]">
            {product.name}
          </h1>

          <div className="mt-3 flex flex-wrap items-center gap-3 text-[13px] text-ink-3">
            <Rating value={product.rating} className="text-ink-2" />
            <span aria-hidden>·</span>
            <span className="tnum">Stok {product.stock}</span>
          </div>

          <p
            data-testid="product-price"
            className="tnum mt-5 text-[34px] leading-none font-extrabold text-brand"
          >
            {formatIDR(product.price)}
          </p>

          <Separator className="my-6" />

          {/* Panel beli. Jumlah, subtotal, dan dua aksi utama dikumpulkan dalam
              satu kotak supaya keputusan membeli tidak tersebar di halaman. */}
          <div className="surface p-5">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="text-[13px] font-semibold text-ink">Jumlah</p>
                <div className="mt-2 flex h-10 w-fit items-center rounded-md border border-line">
                  <button
                    type="button"
                    aria-label="Kurangi jumlah"
                    disabled={qty <= 1}
                    onClick={() => setQty((n) => Math.max(1, n - 1))}
                    className="grid size-10 place-items-center rounded-l-md text-brand-ink transition-colors duration-160 hover:bg-brand-soft disabled:text-ink-3/40 disabled:hover:bg-transparent"
                  >
                    <Minus aria-hidden className="size-4" />
                  </button>
                  <span
                    aria-live="polite"
                    className="tnum grid h-full w-12 place-items-center border-x border-line text-[14px] font-bold"
                  >
                    {qty}
                  </span>
                  <button
                    type="button"
                    aria-label="Tambah jumlah"
                    disabled={qty >= product.stock}
                    onClick={() =>
                      setQty((n) => Math.min(product.stock, n + 1))
                    }
                    className="grid size-10 place-items-center rounded-r-md text-brand-ink transition-colors duration-160 hover:bg-brand-soft disabled:text-ink-3/40 disabled:hover:bg-transparent"
                  >
                    <Plus aria-hidden className="size-4" />
                  </button>
                </div>
              </div>

              <div className="text-right">
                <p className="text-[13px] text-ink-3">Subtotal</p>
                <p
                  data-testid="subtotal"
                  className="tnum mt-1 text-[22px] leading-none font-extrabold"
                >
                  {formatIDR(subtotal)}
                </p>
              </div>
            </div>

            <div className="mt-5 grid gap-2.5 sm:grid-cols-2">
              <Button
                variant="brandOutline"
                size="lg"
                disabled={soldOut || pending}
                data-testid="add-to-cart"
                onClick={() => startTransition(async () => void (await addToCart()))}
              >
                <ShoppingCart aria-hidden className="size-4" />
                Keranjang
              </Button>
              <Button
                size="lg"
                disabled={soldOut || pending}
                data-testid="buy-now"
                onClick={() => {
                  if (requireLogin()) return;
                  router.push(`/checkout/${product.id}?qty=${qty}`);
                }}
              >
                {soldOut ? "Stok habis" : "Beli sekarang"}
              </Button>
            </div>
          </div>

          <ul className="mt-6 grid gap-3 sm:grid-cols-3">
            {GUARANTEES.map(({ Icon, label }) => (
              <li
                key={label}
                className="flex items-start gap-2.5 rounded-xl bg-secondary/70 p-3 text-[12.5px] leading-snug text-ink-2"
              >
                <Icon aria-hidden className="mt-0.5 size-4 shrink-0 text-brand-ink" />
                {label}
              </li>
            ))}
          </ul>

          <section className="mt-8">
            <h2 className="micro">Deskripsi</h2>
            <p className="mt-3 text-[14px] leading-relaxed whitespace-pre-line text-ink-2">
              {product.description || "Penjual belum menambahkan deskripsi."}
            </p>
          </section>
        </div>
      </div>

      {related.length > 0 && (
        <section className="mt-16" aria-labelledby="terkait">
          <div className="flex items-baseline gap-4">
            <h2 id="terkait" className="display shrink-0 text-[26px] sm:text-[30px]">
              Produk serupa
            </h2>
            <span aria-hidden className="h-px flex-1 bg-line" />
          </div>
          <div className="stagger mt-4 grid grid-cols-2 gap-x-4 gap-y-9 sm:gap-x-5 md:grid-cols-3 lg:grid-cols-4">
            {related.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
