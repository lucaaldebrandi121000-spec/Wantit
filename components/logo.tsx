import { cn } from "@/lib/utils";

/** Logo "Wantit": un piccolo segno a cuore stilizzato + il nome. */
export function Logo({ className, size = "md" }: { className?: string; size?: "md" | "lg" }) {
  const big = size === "lg";
  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      <div
        className={cn(
          "grid place-items-center rounded-[10px] bg-gradient-to-br from-violet-500 via-fuchsia-500 to-orange-400 shadow-[0_0_24px_-4px_rgba(217,70,239,0.6)]",
          big ? "h-11 w-11" : "h-7 w-7"
        )}
      >
        <svg viewBox="0 0 24 24" className={big ? "h-6 w-6" : "h-4 w-4"} fill="white" aria-hidden>
          <path d="M12 21s-7.5-4.6-9.6-9.2C.9 8.4 3 4.5 6.7 4.5c2.1 0 3.6 1.1 4.3 2.4h2c.7-1.3 2.2-2.4 4.3-2.4 3.7 0 5.8 3.9 4.3 7.3C19.5 16.4 12 21 12 21z" />
        </svg>
      </div>
      <span className={cn("font-semibold tracking-tight", big ? "text-3xl" : "text-[17px]")}>Wantit</span>
    </div>
  );
}
