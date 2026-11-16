import { CATEGORY_STYLES } from "@/lib/categories";
import { cn } from "@/lib/utils";
import type { Category } from "@/types";

/** Pillola colorata con emoji + nome categoria. Il colore viene da lib/categories.ts */
export function CategoryBadge({ category, className }: { category: Category; className?: string }) {
  const { emoji, color } = CATEGORY_STYLES[category] ?? CATEGORY_STYLES.Altro;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-medium",
        className
      )}
      style={{
        color,
        borderColor: `${color}33`, // stesso colore, trasparente al 20%
        backgroundColor: `${color}14`, // stesso colore, trasparente all'8%
      }}
    >
      <span aria-hidden>{emoji}</span>
      {category}
    </span>
  );
}
