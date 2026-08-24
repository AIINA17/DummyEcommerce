"use client";
// app/components/PaymentMethodPicker.tsx
// Dipakai bareng oleh checkout/page.tsx (dari keranjang) dan
// checkout/[id]/page.tsx (Beli Sekarang) supaya daftar & tampilan metode
// pembayaran selalu sama di kedua flow.

import { Check } from "lucide-react";
import SpotlightCard from "@/app/components/reactbits/SpotlightCard/SpotlightCard";

export interface PaymentMethod {
  value: string;
  label: string;
  desc: string;
  icon: string;
}

export const PAYMENT_METHODS: PaymentMethod[] = [
  { value: "ShopKuPay", label: "ShopKu Pay", desc: "Bayar pakai saldo ShopKu", icon: "❤️" },
  { value: "VA_BCA", label: "Virtual Account BCA", desc: "ATM / m-Banking BCA", icon: "🏦" },
  { value: "VA_BRI", label: "Virtual Account BRI", desc: "Transfer cepat", icon: "🏦" },
  { value: "VA_Mandiri", label: "Virtual Account Mandiri", desc: "Pembayaran instan", icon: "🏦" },
  { value: "GoPay", label: "GoPay", desc: "E-wallet terpopuler", icon: "💚" },
  { value: "OVO", label: "OVO", desc: "Cashback s.d 10%", icon: "💜" },
  { value: "ShopeePay", label: "ShopeePay", desc: "Promo eksklusif", icon: "🧡" },
  { value: "DANA", label: "DANA", desc: "Bayar praktis", icon: "💙" },
];

export default function PaymentMethodPicker({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="payment-methods-grid">
      {PAYMENT_METHODS.map((method) => (
        <SpotlightCard
          as="button"
          key={method.value}
          type="button"
          spotlightColor="rgba(238, 77, 45, 0.25)"
          className={`payment-method-card${value === method.value ? " selected" : ""}`}
          onClick={() => onChange(method.value)}
        >
          <div className="payment-method-icon">{method.icon}</div>
          <div>
            <span className="payment-method-label">{method.label}</span>
            <span className="payment-method-desc">{method.desc}</span>
          </div>
          <div className="payment-method-check">
            <Check size={12} color="white" strokeWidth={3} />
          </div>
        </SpotlightCard>
      ))}
    </div>
  );
}
