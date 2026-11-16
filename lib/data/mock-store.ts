import type { DataStore } from "./store";
import type { Product, Wishlist } from "@/types";
import { uid } from "@/lib/utils";

/**
 * Modalità demo: salva tutto nel localStorage del browser.
 * Al primo avvio carica qualche wishlist e prodotto d'esempio.
 */

const KEY = "wantit:demo:v1";
const DEMO_USER = "demo-user";

interface DemoData {
  wishlists: Wishlist[];
  products: Product[];
}

function seed(): DemoData {
  const now = Date.now();
  const iso = (minutesAgo: number) => new Date(now - minutesAgo * 60_000).toISOString();
  const img = (id: string) => `https://images.unsplash.com/${id}?w=800&q=80&auto=format&fit=crop`;

  const wishlists: Wishlist[] = [
    { id: "wl-1", user_id: DEMO_USER, name: "Desideri", emoji: "✨", color: "#8B5CF6", created_at: iso(5000) },
    { id: "wl-2", user_id: DEMO_USER, name: "Regali Natale", emoji: "🎄", color: "#10B981", created_at: iso(4000) },
    { id: "wl-3", user_id: DEMO_USER, name: "Casa nuova", emoji: "🏠", color: "#F59E0B", created_at: iso(3000) },
  ];

  const base = { notes: null, is_bought: false, currency: "EUR" };
  const products: Product[] = [
    { ...base, id: uid(), wishlist_id: "wl-1", url: "https://www.nike.com", title: "Nike Air Max 90", image_url: img("photo-1542291026-7eec264c27ff"), price: 149.99, category: "Moda", source_site: "nike.com", added_at: iso(10) },
    { ...base, id: uid(), wishlist_id: "wl-1", url: "https://www.sony.it", title: "Cuffie wireless con cancellazione del rumore", image_url: img("photo-1505740420928-5e560c06d30e"), price: 299, category: "Tecnologia", source_site: "sony.it", added_at: iso(60) },
    { ...base, id: uid(), wishlist_id: "wl-2", url: "https://www.example.com/orologio", title: "Orologio minimal in acciaio", image_url: img("photo-1523275335684-37898b6baf30"), price: 189, category: "Moda", source_site: "example.com", added_at: iso(120) },
    { ...base, id: uid(), wishlist_id: "wl-2", url: "https://www.polaroid.com", title: "Fotocamera istantanea", image_url: img("photo-1526170375885-4d8ecf77b99f"), price: 129, category: "Tecnologia", source_site: "polaroid.com", added_at: iso(240) },
    { ...base, id: uid(), wishlist_id: "wl-3", url: "https://www.example.com/divano", title: "Divano in velluto verde", image_url: img("photo-1555041469-a586c61ea9bc"), price: 899, category: "Casa", source_site: "example.com", added_at: iso(500), notes: "Misurare il salotto prima!" },
    { ...base, id: uid(), wishlist_id: "wl-1", url: "https://www.amazon.it", title: "Il nome della rosa — Umberto Eco", image_url: img("photo-1544947950-fa07a98d237f"), price: 14.5, category: "Libri", source_site: "amazon.it", added_at: iso(900), is_bought: true },
  ];

  return { wishlists, products };
}

function load(): DemoData {
  if (typeof window === "undefined") return { wishlists: [], products: [] };
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return JSON.parse(raw) as DemoData;
  } catch {
    // localStorage non disponibile o dati corrotti: ripartiamo dai dati d'esempio
  }
  const data = seed();
  save(data);
  return data;
}

function save(data: DemoData) {
  try {
    localStorage.setItem(KEY, JSON.stringify(data));
  } catch {
    // Browser in modalità privata ecc.: i dati restano solo in memoria
  }
}

export const mockStore: DataStore = {
  async listWishlists() {
    return load().wishlists;
  },

  async createWishlist(input) {
    const data = load();
    const wl: Wishlist = { ...input, id: uid(), user_id: DEMO_USER, created_at: new Date().toISOString() };
    data.wishlists.push(wl);
    save(data);
    return wl;
  },

  async deleteWishlist(id) {
    const data = load();
    data.wishlists = data.wishlists.filter((w) => w.id !== id);
    data.products = data.products.filter((p) => p.wishlist_id !== id);
    save(data);
  },

  async listProducts() {
    return load().products;
  },

  async addProduct(input) {
    const data = load();
    const product: Product = { ...input, id: uid(), added_at: new Date().toISOString() };
    data.products.unshift(product);
    save(data);
    return product;
  },

  async updateProduct(id, patch) {
    const data = load();
    const idx = data.products.findIndex((p) => p.id === id);
    if (idx === -1) throw new Error("Prodotto non trovato");
    data.products[idx] = { ...data.products[idx], ...patch };
    save(data);
    return data.products[idx];
  },

  async deleteProduct(id) {
    const data = load();
    data.products = data.products.filter((p) => p.id !== id);
    save(data);
  },
};
