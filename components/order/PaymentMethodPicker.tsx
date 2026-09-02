"use client";

import { Landmark, Wallet } from "lucide-react";

import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { formatIDR } from "@/lib/format";
import { cn } from "@/lib/utils";

export interface PaymentMethod {
  value: string;
  label: string;
  desc: string;
  kind: "wallet" | "bank";
}

// Dipakai bareng checkout dari keranjang dan checkout "Beli Sekarang", supaya
// daftar & tampilan metode pembayaran selalu sama di kedua alur.
export const PAYMENT_METHODS: PaymentMethod[] = [
  { value: "ShopKuPay", label: "ShopKu Pay", desc: "Saldo langsung terpotong", kind: "wallet" },
  { value: "GoPay", label: "GoPay", desc: "E-wallet terpopuler", kind: "wallet" },
  { value: "OVO", label: "OVO", desc: "Cashback s.d 10%", kind: "wallet" },
  { value: "DANA", label: "DANA", desc: "Bayar praktis", kind: "wallet" },
  { value: "VA_BCA", label: "Virtual Account BCA", desc: "ATM / m-Banking BCA", kind: "bank" },
  { value: "VA_BRI", label: "Virtual Account BRI", desc: "Transfer cepat", kind: "bank" },
  { value: "VA_Mandiri", label: "Virtual Account Mandiri", desc: "Pembayaran instan", kind: "bank" },
  { value: "ShopeePay", label: "ShopeePay", desc: "Promo eksklusif", kind: "wallet" },
];

export function PaymentMethodPicker({
  value,
  onChange,
  balance,
  total,
}: {
  value: string;
  onChange: (value: string) => void;
  balance?: number | null;
  total?: number;
}) {
  const short =
    value === "ShopKuPay" &&
    typeof balance === "number" &&
    typeof total === "number" &&
    balance < total;

  return (
    <div>
      <RadioGroup
        value={value}
        onValueChange={(next) => onChange(String(next))}
        className="grid gap-2.5 sm:grid-cols-2"
      >
        {PAYMENT_METHODS.map((method) => {
          const active = value === method.value;
          const Icon = method.kind === "wallet" ? Wallet : Landmark;
          const isShopKuPay = method.value === "ShopKuPay";

          return (
            <Label
              key={method.value}
              htmlFor={method.value}
              className={cn(
                "relative flex cursor-pointer items-start gap-3 rounded-xl border p-3.5",
                "transition-[border-color,background-color,box-shadow] duration-160 ease-out",
                active
                  ? "border-brand bg-brand-soft"
                  : "border-line bg-card hover:border-ink-3/40"
              )}
            >
              {/* Radio-nya sengaja terlihat, bukan sr-only: kalau disembunyikan,
                  satu-satunya penanda metode terpilih adalah warna border —
                  hilang untuk yang kesulitan membedakan warna, dan tidak bisa
                  jadi target klik langsung. */}
              <RadioGroupItem
                value={method.value}
                id={method.value}
                className="mt-0.5 shrink-0"
              />

              <span
                className={cn(
                  "grid size-9 shrink-0 place-items-center rounded-md",
                  active ? "bg-brand text-white" : "bg-secondary text-ink-3"
                )}
              >
                <Icon aria-hidden className="size-[18px]" />
              </span>

              <span className="min-w-0 flex-1">
                <span className="block text-[13.5px] font-semibold text-ink">
                  {method.label}
                </span>
                <span className="mt-0.5 block text-[12px] font-normal text-ink-3">
                  {isShopKuPay && typeof balance === "number"
                    ? `Saldo ${formatIDR(balance)}`
                    : method.desc}
                </span>
              </span>

            </Label>
          );
        })}
      </RadioGroup>

      {short && (
        <p
          role="alert"
          data-testid="balance-short"
          className="mt-3 rounded-xl bg-destructive/10 px-3.5 py-2.5 text-[13px] font-semibold text-destructive"
        >
          Saldo ShopKu Pay kurang {formatIDR(total! - balance!)}. Pilih metode
          lain atau kurangi jumlah barang.
        </p>
      )}
    </div>
  );
}
