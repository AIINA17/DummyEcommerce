import { Button as ButtonPrimitive } from "@base-ui/react/button"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

// Tombol harus terasa merespons sentuhan: scale(0.97) saat ditekan, 160ms,
// kurva ease-out kustom. Tanpa itu tombol terasa "mati" — ini salah satu
// detail yang tidak disadari user tapi langsung terasa kalau hilang.
const buttonVariants = cva(
  [
    "group/button relative inline-flex shrink-0 items-center justify-center gap-2",
    "rounded-md border border-transparent bg-clip-padding",
    "font-semibold whitespace-nowrap select-none outline-none",
    "transition-[background-color,border-color,color,box-shadow,transform] duration-160 ease-out",
    "active:scale-[0.97]",
    "focus-visible:ring-[3px] focus-visible:ring-brand/25 focus-visible:border-brand",
    "disabled:pointer-events-none disabled:opacity-45",
    "[&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  ].join(" "),
  {
    variants: {
      variant: {
        default: "bg-brand text-white shadow-[var(--shadow-xs)] hover:bg-brand-hover",
        outline:
          "border-line bg-card text-ink hover:border-ink-3/45 hover:bg-secondary",
        brandOutline:
          "border-brand-line bg-card text-brand-ink hover:border-brand hover:bg-brand-soft",
        secondary: "bg-secondary text-ink hover:bg-line",
        ghost: "text-ink-2 hover:bg-secondary hover:text-ink",
        destructive: "bg-destructive text-white hover:brightness-95",
        link: "text-brand-ink underline-offset-4 hover:underline",
      },
      size: {
        default: "h-10 px-4 text-[14px]",
        sm: "h-9 px-3.5 text-[13px]",
        xs: "h-8 rounded-lg px-2.5 text-[12px] [&_svg:not([class*='size-'])]:size-3.5",
        lg: "h-12 px-6 text-[15px]",
        icon: "size-10",
        "icon-sm": "size-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

/**
 * `render` dari Base UI membuat tombol tampil sebagai elemen lain tanpa
 * membungkus node tambahan: `<Button render={<Link href="/cart" />}>`.
 *
 * Base UI defaultnya `nativeButton = true` dan mengharapkan elemen akhir
 * tetap `<button>`. Begitu `render` diisi `<Link>` (→ `<a>`), Base UI
 * memperingatkan lewat console. Jadi saat `render` dipakai, `nativeButton`
 * default ke `false`; pemanggil tetap bisa override.
 */
function Button({
  className,
  variant = "default",
  size = "default",
  nativeButton,
  ...props
}: ButtonPrimitive.Props & VariantProps<typeof buttonVariants>) {
  return (
    <ButtonPrimitive
      data-slot="button"
      nativeButton={nativeButton ?? !props.render}
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
