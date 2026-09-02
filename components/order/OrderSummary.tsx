import { SERVICE_FEE } from "@/lib/constants";
import { formatIDR } from "@/lib/format";

/**
 * Rincian biaya di checkout. SERVICE_FEE diambil dari sumber yang sama dengan
 * yang dipakai server saat menghitung total pesanan, supaya angka di layar
 * selalu sama dengan yang benar-benar ditagih.
 */
export function OrderSummary({
  itemCount,
  subtotal,
}: {
  itemCount: number;
  subtotal: number;
}) {
  const total = subtotal + SERVICE_FEE;

  return (
    <dl className="space-y-2.5 text-[13.5px]">
      <div className="flex justify-between gap-4">
        <dt className="text-ink-3">Subtotal ({itemCount} barang)</dt>
        <dd className="tnum font-semibold">{formatIDR(subtotal)}</dd>
      </div>
      <div className="flex justify-between gap-4">
        <dt className="text-ink-3">Ongkos kirim</dt>
        <dd className="font-semibold text-success">Gratis</dd>
      </div>
      <div className="flex justify-between gap-4">
        <dt className="text-ink-3">Biaya layanan</dt>
        <dd className="tnum font-semibold">{formatIDR(SERVICE_FEE)}</dd>
      </div>
      <div className="flex items-baseline justify-between gap-4 border-t border-line pt-3.5">
        <dt className="text-[14px] font-semibold text-ink">Total pembayaran</dt>
        <dd
          data-testid="checkout-total"
          className="tnum text-[20px] font-extrabold text-ink"
        >
          {formatIDR(total)}
        </dd>
      </div>
    </dl>
  );
}
