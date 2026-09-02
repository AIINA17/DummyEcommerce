import { Star } from "lucide-react";

import { cn } from "@/lib/utils";

export function Rating({
  value,
  className,
  size = 14,
}: {
  value: number;
  className?: string;
  size?: number;
}) {
  return (
    <span className={cn("inline-flex items-center gap-1", className)}>
      <Star
        aria-hidden
        style={{ width: size, height: size }}
        className="fill-star text-star"
        strokeWidth={0}
      />
      <span className="tnum font-semibold">{Number(value).toFixed(1)}</span>
    </span>
  );
}
