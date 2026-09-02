import Link from "next/link";
import { Check, ShoppingBag } from "lucide-react";

const POINTS = [
  "Gratis ongkir untuk semua pesanan",
  "Bayar sekali klik pakai saldo ShopKu Pay",
  "Uang kembali kalau barang tidak sampai",
];

/**
 * Dua kolom: panel bercerita di kiri, form di kanan. Di bawah lg panel-nya
 * hilang sepenuhnya — di layar kecil yang dibutuhkan cuma form.
 */
export function AuthShell({
  title,
  subtitle,
  children,
  footer,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
  footer: React.ReactNode;
}) {
  return (
    <div className="shell py-10 md:py-16">
      <div className="surface mx-auto grid max-w-4xl overflow-hidden lg:grid-cols-2">
        <div className="relative hidden flex-col justify-between overflow-hidden bg-brand p-9 text-white lg:flex">
          <Link href="/" className="relative flex items-center gap-2">
            <span className="grid size-8 place-items-center rounded-md bg-white text-brand">
              <ShoppingBag aria-hidden className="size-[18px]" strokeWidth={2.2} />
            </span>
            <span className="text-[19px] leading-none font-extrabold tracking-[-0.03em]">
              ShopKu
            </span>
          </Link>

          <div className="relative">
            <p className="display text-[42px] text-white">
              Barang bagus,
              <br />
              harga jujur.
            </p>
            <ul className="mt-6 space-y-3">
              {POINTS.map((point) => (
                <li key={point} className="flex items-start gap-2.5 text-[13.5px]">
                  <Check aria-hidden className="mt-0.5 size-4 shrink-0" />
                  {point}
                </li>
              ))}
            </ul>
          </div>

          <p className="micro relative text-white/50">
            Situs demo untuk latihan. Jangan masukkan data asli.
          </p>
        </div>

        <div className="p-7 sm:p-9">
          <h1 className="text-[26px]">{title}</h1>
          <p className="mt-1.5 text-[13.5px] text-ink-3">{subtitle}</p>

          <div className="mt-7">{children}</div>

          <div className="mt-6 text-center text-[13.5px] text-ink-3">{footer}</div>
        </div>
      </div>
    </div>
  );
}
