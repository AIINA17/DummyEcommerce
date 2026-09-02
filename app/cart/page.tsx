"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Minus, Plus, ShoppingCart, Trash2 } from "lucide-react";

import { useCart } from "@/components/cart-store";
import { EmptyState } from "@/components/shared/EmptyState";
import { PageHeader } from "@/components/shared/PageHeader";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { SERVICE_FEE } from "@/lib/constants";
import { formatIDR, productImage } from "@/lib/format";

export default function CartPage() {
  const router = useRouter();
  const { status } = useSession();
  const { items, loading, setQuantity, remove } = useCart();

  // Yang disimpan adalah id yang SENGAJA dilepas centangnya, bukan yang
  // tercentang. Dengan begitu barang baru otomatis ikut terpilih dan barang
  // yang dihapus hilang sendiri dari perhitungan — tanpa effect yang menyalin
  // isi keranjang ke dalam state seleksi.
  const [unchecked, setUnchecked] = useState<number[]>([]);

  const chosen = useMemo(
    () => items.filter((i) => !unchecked.includes(i.id)),
    [items, unchecked]
  );

  const subtotal = chosen.reduce(
    (sum, i) => sum + Number(i.products.price) * i.quantity,
    0
  );
  const total = chosen.length ? subtotal + SERVICE_FEE : 0;

  if (status === "unauthenticated") {
    return (
      <div className="shell py-16">
        <EmptyState
          icon={ShoppingCart}
          title="Masuk dulu untuk lihat keranjang"
          body="Keranjang tersimpan di akunmu, jadi bisa dibuka dari perangkat mana saja."
          action={
            <Button render={<Link href="/login?callbackUrl=/cart" />}>Masuk</Button>
          }
        />
      </div>
    );
  }

  if (loading && items.length === 0) {
    return (
      <div className="shell grid gap-6 py-8 lg:grid-cols-[1fr_360px]">
        <div className="space-y-3">
          {Array.from({ length: 3 }, (_, i) => (
            <div key={i} className="shimmer h-28 rounded-2xl" />
          ))}
        </div>
        <div className="shimmer h-64 rounded-2xl" />
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="shell py-16">
        <EmptyState
          icon={ShoppingCart}
          title="Keranjang kamu masih kosong"
          body="Yuk isi dengan barang yang kamu incar. Cek dulu produk yang lagi ramai dibeli."
          action={<Button render={<Link href="/" />}>Mulai belanja</Button>}
        />
      </div>
    );
  }

  const allChecked = chosen.length === items.length;

  return (
    <div className="shell py-6 md:py-8">
      <PageHeader
        title="Keranjang"
        subtitle={`${items.length} barang tersimpan`}
        backHref="/"
        backLabel="Lanjut belanja"
      />

      <div className="grid items-start gap-6 lg:grid-cols-[1fr_360px]">
        <div className="space-y-3">
          <div className="surface flex items-center gap-3 px-4 py-3.5">
            <Checkbox
              id="pilih-semua"
              checked={allChecked}
              onCheckedChange={(checked) =>
                setUnchecked(checked ? [] : items.map((i) => i.id))
              }
            />
            <label htmlFor="pilih-semua" className="text-[14px] font-semibold">
              Pilih semua
            </label>
            <span className="tnum ml-auto text-[13px] text-ink-3">
              {chosen.length}/{items.length} dipilih
            </span>
          </div>

          <ul className="stagger space-y-3">
            {items.map((item) => {
              const price = Number(item.products.price);
              const checked = !unchecked.includes(item.id);

              return (
                <li
                  key={item.id}
                  data-testid="cart-item"
                  className="surface flex gap-3 p-4 sm:gap-4"
                >
                  <Checkbox
                    className="mt-1 shrink-0"
                    checked={checked}
                    aria-label={`Pilih ${item.products.name}`}
                    onCheckedChange={(next) =>
                      setUnchecked((prev) =>
                        next
                          ? prev.filter((id) => id !== item.id)
                          : [...prev, item.id]
                      )
                    }
                  />

                  <Link
                    href={`/product/${item.product_id}`}
                    className="shrink-0 overflow-hidden rounded-xl border border-line"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={productImage(item.product_id, item.products.image_url)}
                      alt={item.products.name}
                      width={88}
                      height={88}
                      className="size-18 object-cover sm:size-22"
                    />
                  </Link>

                  <div className="flex min-w-0 flex-1 flex-col">
                    <Link
                      href={`/product/${item.product_id}`}
                      className="clamp-2 text-[14px] leading-snug font-medium transition-colors duration-160 hover:text-brand-ink"
                    >
                      {item.products.name}
                    </Link>
                    <p className="tnum mt-1 text-[12.5px] text-ink-3">
                      {formatIDR(price)} / barang
                    </p>

                    <div className="mt-auto flex flex-wrap items-center justify-between gap-3 pt-3">
                      <div className="flex h-9 items-center rounded-md border border-line">
                        <button
                          type="button"
                          aria-label="Kurangi"
                          onClick={() => void setQuantity(item.id, item.quantity - 1)}
                          className="grid size-9 place-items-center rounded-l-md text-brand-ink transition-colors duration-160 hover:bg-brand-soft"
                        >
                          <Minus aria-hidden className="size-3.5" />
                        </button>
                        <span
                          aria-live="polite"
                          className="tnum grid h-full w-10 place-items-center border-x border-line text-[13px] font-bold"
                        >
                          {item.quantity}
                        </span>
                        <button
                          type="button"
                          aria-label="Tambah"
                          disabled={item.quantity >= item.products.stock}
                          onClick={() => void setQuantity(item.id, item.quantity + 1)}
                          className="grid size-9 place-items-center rounded-r-md text-brand-ink transition-colors duration-160 hover:bg-brand-soft disabled:text-ink-3/40 disabled:hover:bg-transparent"
                        >
                          <Plus aria-hidden className="size-3.5" />
                        </button>
                      </div>

                      <p className="tnum text-[16px] font-extrabold">
                        {formatIDR(price * item.quantity)}
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    aria-label={`Hapus ${item.products.name}`}
                    onClick={() => void remove(item.id)}
                    className="grid size-9 shrink-0 place-items-center self-start rounded-md text-ink-3 transition-colors duration-160 hover:bg-destructive/10 hover:text-destructive focus-visible:ring-[3px] focus-visible:ring-destructive/25 focus-visible:outline-none"
                  >
                    <Trash2 aria-hidden className="size-4" />
                  </button>
                </li>
              );
            })}
          </ul>
        </div>

        <div className="surface p-5 lg:sticky lg:top-24">
          <h2 className="text-[16px]">Ringkasan belanja</h2>

          <dl className="mt-4 space-y-2.5 text-[13.5px]">
            <Row label={`Subtotal (${chosen.length} barang)`} value={subtotal} />
            <Row label="Ongkos kirim" free />
            <Row label="Biaya layanan" value={chosen.length ? SERVICE_FEE : 0} />
          </dl>

          <div className="mt-4 flex items-baseline justify-between border-t border-line pt-4">
            <span className="text-[14px] font-semibold">Total</span>
            <span data-testid="cart-total" className="tnum text-[20px] font-extrabold">
              {formatIDR(total)}
            </span>
          </div>

          <Button
            size="lg"
            className="mt-5 w-full"
            disabled={chosen.length === 0}
            data-testid="checkout-button"
            onClick={() =>
              router.push(`/checkout?items=${chosen.map((i) => i.id).join(",")}`)
            }
          >
            Checkout ({chosen.length})
          </Button>
        </div>
      </div>
    </div>
  );
}

function Row({
  label,
  value,
  free,
}: {
  label: string;
  value?: number;
  free?: boolean;
}) {
  return (
    <div className="flex justify-between gap-4">
      <dt className="text-ink-3">{label}</dt>
      <dd className={free ? "font-semibold text-success" : "tnum font-semibold"}>
        {free ? "Gratis" : formatIDR(value ?? 0)}
      </dd>
    </div>
  );
}
