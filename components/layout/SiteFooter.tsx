import Link from "next/link";
import { ShoppingBag } from "lucide-react";

const CATEGORIES = ["Gadget & Tech", "Lifestyle", "Home & Living", "Lain-lain"];

/**
 * Footer sengaja pendek.
 *
 * Versi sebelumnya punya empat kolom berisi tautan yang tidak menuju ke mana
 * pun — "Karier", "Blog", "Kebijakan Privasi". Di situs demo itu bukan
 * navigasi, itu isian. Yang ditinggal cuma yang benar-benar bisa diklik:
 * kategori produk.
 */
export function SiteFooter() {
  return (
    <footer className="mt-20 bg-brand-deep text-white">
      <div className="shell flex flex-col gap-8 py-10 sm:flex-row sm:items-start sm:justify-between">
        <div className="max-w-xs">
          <div className="flex items-center gap-2">
            <span className="grid size-7 place-items-center rounded-md bg-white text-brand-deep">
              <ShoppingBag aria-hidden className="size-4" strokeWidth={2.2} />
            </span>
            <span className="text-[17px] leading-none font-extrabold tracking-[-0.03em]">
              ShopKu
            </span>
          </div>
          <p className="mt-3 text-[13px] leading-relaxed text-white/65">
            Situs demo untuk latihan. Semua produk, toko, dan transaksi di sini
            fiktif — tidak ada uang sungguhan yang berpindah.
          </p>
        </div>

        <nav aria-labelledby="footer-kategori">
          <h2 id="footer-kategori" className="micro text-white/60">
            Kategori
          </h2>
          <ul className="mt-3 space-y-2">
            {CATEGORIES.map((c) => (
              <li key={c}>
                <Link
                  href={`/?category=${encodeURIComponent(c)}`}
                  className="text-[13.5px] text-white/85 transition-colors duration-160 hover:text-white"
                >
                  {c}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>

      <div className="border-t border-white/15">
        <div className="shell py-4">
          <p className="micro text-white/55">
            © {new Date().getFullYear()} ShopKu — proyek latihan
          </p>
        </div>
      </div>
    </footer>
  );
}
