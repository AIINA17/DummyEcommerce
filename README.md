# ShopKu — Dummy Marketplace

Marketplace demo: cari produk, masukkan keranjang, checkout, bayar dengan saldo
ShopKu Pay. Next.js + shadcn/ui + Supabase.

## Menjalankan

```bash
cp .env.example .env.local   # kalau belum ada — isi DATABASE_URL & kunci Supabase
npm install
npm run dev                  # http://localhost:3000
```

```bash
npm run build      # build produksi
npm run typecheck  # tsc --noEmit
npm run lint       # eslint
npm test           # Playwright E2E (otomatis build + start di port 3210)
npm run test:report
```

Tes memakai akun uji yang disiapkan `scripts/seed-e2e.mjs` (dipanggil otomatis
lewat `globalSetup`). Ganti kredensialnya lewat `E2E_USERNAME` / `E2E_PASSWORD`.

## Struktur

```
app/
  page.tsx           katalog — hero, chip kategori, filter, grid produk
  product/[id]/      halaman produk + panel beli + produk serupa
  cart/              keranjang, seleksi item, stepper jumlah
  checkout/          checkout dari keranjang
  checkout/[id]/     "beli langsung", tanpa lewat keranjang
  order/[id]/        detail pesanan + bayar pesanan pending
  orders/            riwayat transaksi + tab status
  login/ register/   autentikasi
  profile/           biodata + saldo ShopKu Pay
  api/               route handler (Supabase + NextAuth + JWT)
components/
  ui/                shadcn/ui
  layout/            SiteHeader, SiteFooter
  product/           ProductCard
  order/             PaymentMethodPicker, OrderSummary, StatusBadge
  auth/ shared/      AuthShell, PageHeader, EmptyState, Rating
  cart-store.tsx     satu sumber kebenaran untuk keranjang
lib/                 format, types, auth, jwt, db, supabase, constants
tests/e2e/           spesifikasi Playwright
```

## Arah desain

Satu kalimat: **oranye jadi permukaan, bukan aksen.** Header, masthead, dan
footer adalah blok oranye penuh; di antaranya kanvas krem hangat, bukan putih.

Halaman yang seluruhnya putih dengan satu aksen kecil terbaca kosong dan
generik. Di sini warnanya yang membawa identitas: header oranye yang selalu
menempel, masthead yang menyambung jadi satu blok besar, harga dalam oranye di
tiap kartu, dan footer oranye pekat sebagai penutup.

**Tone-nya dipilih dari kontras, bukan dari selera.** `#ee4d2d` milik Shopee
cuma 3.66:1 lawan teks putih dan gagal WCAG AA. `--brand: #cf4718` lulus di
4.60:1 tanpa kehilangan karakter oranyenya, jadi itu yang dipakai untuk semua
permukaan yang memuat teks putih. Tone terang aslinya disimpan sebagai
`--brand-bright` untuk aksen yang tidak memuat teks.

**Tipografi: tiga suara, masing-masing satu tugas.** Instrument Serif untuk
pernyataan besar saja — begitu serif muncul di mana-mana, kontrasnya hilang dan
dia cuma jadi dekorasi. Plus Jakarta Sans untuk isi dan kontrol. IBM Plex Mono
untuk label mikro, ID pesanan, dan hitungan; mono di metadata itu yang memberi
tekstur pada teks yang biasanya cuma abu kecil, sekaligus bikin angka sejajar.

**Struktur dibawa garis, bukan tumpukan kotak.** Judul bagian pakai garis rambut
yang menyambung ke tepi kanan, dan kartu produk tidak punya border sama sekali —
yang dibingkai cuma gambarnya. Waktu setiap produk dibungkus kotak + tombol
selebar kartu, dikalikan 60, yang menonjol jadi kotaknya, bukan barangnya.

Token, tipografi, dan aturan gerak ada di [`app/globals.css`](app/globals.css).

**Gerak.** Semua transisi di bawah 300ms dan hanya menyentuh `transform` /
`opacity` supaya jalan di GPU. Kurva bawaan CSS diganti varian yang lebih kuat
(`--ease-out: cubic-bezier(0.23, 1, 0.32, 1)`), tombol menyusut ke `scale(0.97)`
saat ditekan, hover-lift dibatasi ke perangkat berpointer lewat
`@media (hover: hover)`, dan semuanya dimatikan di `prefers-reduced-motion`.

**Yang dihapus.** Komponen dekoratif ReactBits (Aurora, TiltedCard, ClickSpark,
ShinyText, StarBorder, BlurText, SpotlightCard) dibuang seluruhnya, beserta
dependensi `ogl` dan `motion`. Efek-efek itu berjalan di setiap kartu produk dan
setiap halaman — animasi yang tidak menjelaskan apa pun, di elemen yang dilihat
puluhan kali per sesi. Kartu produk yang memiringkan diri saat disentuh bikin
gambar produk lebih susah dibaca, bukan lebih menarik.

## Catatan teknis

**Keranjang.** Dulu Navbar polling `/api/cart` tiap 10 detik hanya untuk menjaga
angka badge; angkanya tetap bisa basi sampai 10 detik. Sekarang
[`components/cart-store.tsx`](components/cart-store.tsx) jadi satu sumber
kebenaran — setiap aksi yang mengubah keranjang langsung menyegarkannya, jadi
badge benar seketika dan tidak ada request menganggur.

**Filter hidup di URL.** Kata kunci, kategori, rentang harga, rating, dan urutan
semuanya disimpan di query string. Artinya hasil pencarian bisa dibagikan lewat
tautan dan tombol back mengembalikan filter yang tadi dipakai — sebelumnya
semua itu state lokal yang hilang begitu halaman berpindah.

**Tema tanpa kedipan.** Kelas `dark` dipasang oleh script kecil di `<head>`
sebelum paint pertama. Toggle-nya membaca DOM lewat `useSyncExternalStore`,
bukan menyalin ke state lewat effect — menyalinnya berarti render pertama selalu
salah lalu dikoreksi, yang terlihat sebagai kedipan.

**Harga tidak dipercaya dari client.** API order hanya menerima `product_id` dan
`quantity`; harga dan nama dibaca ulang dari database. Ada tes Playwright yang
khusus memverifikasi ini.

Semua produk, toko, dan transaksi di sini fiktif. Proyek latihan, bukan situs
komersial.
