import { CheckCircle2, Clock, XCircle } from "lucide-react";

import type { OrderStatus } from "@/lib/types";
import { cn } from "@/lib/utils";

// Sistem ini cuma punya 2 status nyata: menunggu pembayaran atau sudah
// dibayar — tidak ada alur pengiriman/kurir sungguhan. "cancelled" ikut
// didefinisikan supaya status tak terduga dari server tetap tampil rapi.
const STYLES: Record<
  OrderStatus,
  { label: string; Icon: typeof Clock; className: string }
> = {
  paid: {
    label: "Dibayar",
    Icon: CheckCircle2,
    className: "bg-success-soft text-success",
  },
  pending: {
    label: "Menunggu pembayaran",
    Icon: Clock,
    className: "bg-warning-soft text-warning",
  },
  cancelled: {
    label: "Dibatalkan",
    Icon: XCircle,
    className: "bg-destructive/10 text-destructive",
  },
};

export function StatusBadge({
  status,
  className,
}: {
  status: OrderStatus;
  className?: string;
}) {
  const { label, Icon, className: tone } = STYLES[status] ?? STYLES.pending;

  return (
    <span
      data-testid="order-status"
      className={cn(
        "inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-[12px] font-bold",
        tone,
        className
      )}
    >
      <Icon aria-hidden className="size-3.5" />
      {label}
    </span>
  );
}
