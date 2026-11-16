import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/** Unisce classi Tailwind evitando conflitti (es. "p-2" + "p-4" → "p-4"). */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Formatta un prezzo nella valuta giusta, es. 129.9 + "EUR" → "129,90 €". */
export function formatPrice(price: number | null, currency: string | null) {
  if (price == null) return null;
  try {
    return new Intl.NumberFormat("it-IT", {
      style: "currency",
      currency: currency || "EUR",
    }).format(price);
  } catch {
    // Valuta non riconosciuta: mostriamo numero + sigla così com'è
    return `${price.toFixed(2)} ${currency ?? ""}`.trim();
  }
}

/** Genera un id univoco (usato solo in modalità demo). */
export function uid() {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2) + Date.now().toString(36);
}
