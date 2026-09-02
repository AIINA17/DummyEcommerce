import type { Metadata } from "next";

import { SiteFooter } from "@/components/layout/SiteFooter";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { Toaster } from "@/components/ui/sonner";

import Providers from "./providers";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "ShopKu — Belanja Online Terpercaya",
    template: "%s · ShopKu",
  },
  description:
    "Marketplace demo: cari produk, masukkan keranjang, checkout, dan bayar dengan ShopKu Pay.",
};

// Tema dibaca SEBELUM paint pertama. Kalau dibaca di useEffect seperti
// sebelumnya, halaman sempat tampil terang lalu berkedip jadi gelap.
const THEME_SCRIPT = `
try {
  if (localStorage.theme === 'dark') document.documentElement.classList.add('dark');
} catch {}
`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} />
      </head>
      <body className="flex min-h-dvh flex-col antialiased">
        <Providers>
          <SiteHeader />
          <main className="flex-1">{children}</main>
          <SiteFooter />
          <Toaster position="top-center" richColors />
        </Providers>
      </body>
    </html>
  );
}
