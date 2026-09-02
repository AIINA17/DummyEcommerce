import Link from "next/link";
import { ChevronLeft } from "lucide-react";

/**
 * Judul halaman dengan tombol kembali opsional. Dipakai di semua halaman
 * dalam alur (keranjang → checkout → pesanan) supaya titik "kembali" selalu
 * ada di tempat yang sama.
 */
export function PageHeader({
  title,
  subtitle,
  backHref,
  backLabel = "Kembali",
  action,
}: {
  title: string;
  subtitle?: string;
  backHref?: string;
  backLabel?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="mb-6">
      {backHref && (
        <Link
          href={backHref}
          className="mb-3 inline-flex items-center gap-1 rounded-lg py-1 text-[13px] font-medium text-ink-3 transition-colors duration-160 hover:text-brand-ink focus-visible:ring-[3px] focus-visible:ring-brand/25 focus-visible:outline-none"
        >
          <ChevronLeft aria-hidden className="size-4" />
          {backLabel}
        </Link>
      )}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="display text-[34px] sm:text-[40px]">{title}</h1>
          {subtitle && <p className="micro mt-3">{subtitle}</p>}
        </div>
        {action}
      </div>
    </div>
  );
}
