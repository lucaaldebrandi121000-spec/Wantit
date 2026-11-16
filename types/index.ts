// Tipi condivisi in tutta l'app. Rispecchiano le tabelle del database Supabase.

export const CATEGORIES = [
  "Moda",
  "Tecnologia",
  "Casa",
  "Sport",
  "Bellezza",
  "Libri",
  "Cibo",
  "Viaggi",
  "Altro",
] as const;

export type Category = (typeof CATEGORIES)[number];

export interface Wishlist {
  id: string;
  user_id: string;
  name: string;
  emoji: string;
  color: string; // colore esadecimale, es. "#8B5CF6"
  created_at: string;
}

export interface Product {
  id: string;
  wishlist_id: string;
  url: string;
  title: string;
  image_url: string | null;
  price: number | null;
  currency: string | null;
  category: Category;
  source_site: string | null;
  added_at: string;
  notes: string | null;
  is_bought: boolean;
}

/** Quello che restituisce /api/scrape */
export interface ScrapeResult {
  url: string;
  title: string;
  image_url: string | null;
  price: number | null;
  currency: string | null;
  category: Category;
  source_site: string;
}

export type NewProduct = Omit<Product, "id" | "added_at">;
export type NewWishlist = Pick<Wishlist, "name" | "emoji" | "color">;
