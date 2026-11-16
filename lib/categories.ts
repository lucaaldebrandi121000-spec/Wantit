import type { Category } from "@/types";

/** Emoji e colore di ogni categoria (usati dai badge). */
export const CATEGORY_STYLES: Record<Category, { emoji: string; color: string }> = {
  Moda: { emoji: "👗", color: "#F472B6" },
  Tecnologia: { emoji: "💻", color: "#60A5FA" },
  Casa: { emoji: "🏠", color: "#FBBF24" },
  Sport: { emoji: "⚽", color: "#34D399" },
  Bellezza: { emoji: "💄", color: "#F87171" },
  Libri: { emoji: "📚", color: "#A78BFA" },
  Cibo: { emoji: "🍕", color: "#FB923C" },
  Viaggi: { emoji: "✈️", color: "#22D3EE" },
  Altro: { emoji: "✨", color: "#A3A3A3" },
};

/** Colori disponibili quando si crea una nuova lista. */
export const WISHLIST_COLORS = [
  "#8B5CF6",
  "#3B82F6",
  "#10B981",
  "#F59E0B",
  "#EF4444",
  "#EC4899",
  "#14B8A6",
  "#A3A3A3",
];

export const WISHLIST_EMOJIS = ["🎁", "✨", "🛍️", "🏠", "🎄", "💻", "👟", "📚", "✈️", "💍", "🎮", "🌱"];
