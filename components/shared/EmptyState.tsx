import type { LucideIcon } from "lucide-react";

export function EmptyState({
  icon: Icon,
  title,
  body,
  action,
}: {
  icon: LucideIcon;
  title: string;
  body: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="surface rise flex flex-col items-center px-6 py-16 text-center">
      <span className="grid size-14 place-items-center rounded-2xl bg-secondary text-ink-3">
        <Icon aria-hidden className="size-6" strokeWidth={1.7} />
      </span>
      <h2 className="mt-5 text-[18px]">{title}</h2>
      <p className="mt-2 max-w-sm text-[14px] leading-relaxed text-ink-3">{body}</p>
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}
