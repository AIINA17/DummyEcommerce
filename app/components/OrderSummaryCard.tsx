"use client";
// app/components/OrderSummaryCard.tsx
// Rincian biaya di halaman checkout. serviceFee sama persis dengan nilai
// yang dipakai server (lib/constants.ts) untuk menghitung total pesanan,
// supaya angka yang ditampilkan selalu sama dengan yang benar-benar ditagih.

import { SERVICE_FEE } from "@/lib/constants";

const formatPrice = (p: number) => new Intl.NumberFormat("id-ID").format(p);

export default function OrderSummaryCard({
  itemCount,
  subtotal,
}: {
  itemCount: number;
  subtotal: number;
}) {
  const total = subtotal + SERVICE_FEE;

  return (
    <div className="order-summary">
      <div className="order-summary-row">
        <span>Subtotal ({itemCount} produk)</span>
        <span>Rp {formatPrice(subtotal)}</span>
      </div>
      <div className="order-summary-row">
        <span>Ongkos Kirim</span>
        <span style={{ color: "var(--success)", fontWeight: 600 }}>Gratis</span>
      </div>
      <div className="order-summary-row">
        <span>Biaya Layanan</span>
        <span>Rp {formatPrice(SERVICE_FEE)}</span>
      </div>
      <div className="order-summary-row order-summary-row--total">
        <span>Total Pembayaran</span>
        <span>Rp {formatPrice(total)}</span>
      </div>
    </div>
  );
}
