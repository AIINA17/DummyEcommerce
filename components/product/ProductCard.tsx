"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Check, Plus, Star } from "lucide-react";
import { toast } from "sonner";

import { useCart } from "@/components/cart-store";
import { formatIDR, productImage } from "@/lib/format";
import type { Product } from "@/lib/types";
import { cn } from "@/lib/utils";

/**
 * Kartu produk tanpa kotak.
 *
 * Versi sebelumnya membungkus tiap produk dalam border + radius + tombol
 * selebar kartu. Dikalikan 60, yang menonjol jadi kotak dan tombolnya —
 * bukan barangnya. Di sini gambar berdiri sendiri, teks menggantung di
 * bawahnya, dan tombol tambah menyusut jadi satu tombol ikon di sudut
 * gambar: tetap selalu terlihat dan bisa disentuh, tapi berhenti bersaing
 * dengan harga.
 */
export function ProductCard({
  product,
  priority = false,
}: {
  product: Product;
  priority?: boolean;
}) {
  const router = useRouter();
  const { status } = useSession();
  const { add } = useCart();
  const [pending, startTransition] = useTransition();
  const [added, setAdded] = useState(false);
  const [broken, setBroken] = useState(false);

  const soldOut = product.stock <= 0;

  function addToCart(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();

    if (status !== "authenticated") {
      toast.info("Masuk dulu untuk mulai belanja");
      router.push(`/login?callbackUrl=/product/${product.id}`);
      return;
    }

    startTransition(async () => {
      const ok = await add(product.id, 1);
      if (!ok) {
        toast.error("Gagal menambahkan ke keranjang");
        return;
      }
      toast.success(`${product.name} masuk keranjang`);
      // Centang sesaat di tombolnya sendiri: konfirmasi muncul di tempat
      // aksinya terjadi, bukan cuma sebagai toast jauh di atas layar.
      setAdded(true);
      setTimeout(() => setAdded(false), 1400);
    });
  }

  return (
    <article className={cn("group relative", soldOut && "opacity-60")}>
      <Link
        href={`/product/${product.id}`}
        data-testid="product-card"
        className="block outline-none"
      >
        {/* Bingkai garis rambut + latar putih. Tanpa ini, foto produk yang
            latarnya putih melebur dengan kanvas abu dan tepi kartunya
            hilang — masalah yang dulu tertutupi oleh border kartu. */}
        <div className="relative aspect-4/5 overflow-hidden rounded-lg border border-line bg-card ring-offset-2 ring-offset-canvas group-focus-within:ring-2 group-focus-within:ring-brand">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={
              broken
                ? productImage(product.id)
                : productImage(product.id, product.image_url)
            }
            alt={product.name}
            width={600}
            height={750}
            loading={priority ? "eager" : "lazy"}
            onError={() => setBroken(true)}
            className="size-full object-cover transition-transform duration-[280ms] ease-out group-hover:scale-[1.03]"
          />

          {soldOut && (
            <span className="micro absolute inset-0 grid place-items-center bg-card/80 text-ink-2">
              Stok habis
            </span>
          )}
        </div>

        <div className="pt-3">
          <p className="micro">{product.category}</p>

          <h3 className="clamp-2 mt-1.5 min-h-[2.7em] text-[14px] leading-[1.35] text-ink">
            {product.name}
          </h3>

          <div className="mt-2 flex items-baseline gap-2.5">
            <p
              data-testid="card-price"
              className="tnum text-[17px] leading-none font-extrabold tracking-[-0.02em] text-brand"
            >
              {formatIDR(product.price)}
            </p>
            <span className="tnum inline-flex items-baseline gap-1 font-mono text-[11px] text-ink-3">
              <Star
                aria-hidden
                className="size-3 translate-y-px fill-star text-star"
                strokeWidth={0}
              />
              {Number(product.rating).toFixed(1)}
            </span>
          </div>
        </div>
      </Link>

      {/* Di luar <Link> supaya tidak jadi tombol di dalam tautan. */}
      <button
        type="button"
        disabled={soldOut || pending}
        data-testid="card-add-to-cart"
        aria-label={`Tambahkan ${product.name} ke keranjang`}
        onClick={addToCart}
        className={cn(
          "absolute top-2.5 right-2.5 grid size-9 place-items-center rounded-full",
          "border border-line bg-card/90 text-ink backdrop-blur-sm",
          "transition-[background-color,border-color,color,transform] duration-160 ease-out",
          "hover:border-brand hover:bg-brand hover:text-white",
          "active:scale-[0.92]",
          "focus-visible:ring-[3px] focus-visible:ring-brand/30 focus-visible:outline-none",
          "disabled:pointer-events-none disabled:opacity-0",
          added && "border-success bg-success text-white"
        )}
      >
        {added ? (
          <Check aria-hidden className="size-4" strokeWidth={2.6} />
        ) : (
          <Plus aria-hidden className="size-4" strokeWidth={2.4} />
        )}
      </button>
    </article>
  );
}

export function ProductCardSkeleton() {
  return (
    <div>
      <div className="shimmer aspect-4/5 rounded-lg border border-line" />
      <div className="space-y-2 pt-3">
        <div className="shimmer h-2.5 w-16 rounded" />
        <div className="shimmer h-3 w-full rounded" />
        <div className="shimmer h-3 w-2/3 rounded" />
        <div className="shimmer h-4 w-1/2 rounded" />
      </div>
    </div>
  );
}
