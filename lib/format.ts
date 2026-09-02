const rupiah = new Intl.NumberFormat("id-ID", {
  style: "currency",
  currency: "IDR",
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

/** "Rp1.735.000" — tanpa spasi setelah Rp, seperti kebiasaan penulisan di ID. */
export function formatIDR(value: number | string): string {
  return rupiah.format(Number(value)).replace(/\s/g, "");
}

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/** Gambar placeholder yang stabil per produk, dipakai saat image_url kosong. */
export function productImage(id: number, url?: string | null): string {
  return url || `https://picsum.photos/seed/shopku-${id}/600/600`;
}
