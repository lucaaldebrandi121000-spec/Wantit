import type { NewProduct, NewWishlist, Product, Wishlist } from "@/types";

/**
 * "Contratto" del livello dati: tutte le operazioni che l'app può fare.
 * Ne esistono due versioni intercambiabili:
 *  - mock-store.ts     → modalità demo, dati nel browser
 *  - supabase-store.ts → database vero su Supabase
 * Il resto dell'app non sa (e non deve sapere) quale delle due sta usando.
 */
export interface DataStore {
  listWishlists(): Promise<Wishlist[]>;
  createWishlist(input: NewWishlist): Promise<Wishlist>;
  deleteWishlist(id: string): Promise<void>;

  listProducts(): Promise<Product[]>;
  addProduct(input: NewProduct): Promise<Product>;
  updateProduct(id: string, patch: Partial<NewProduct>): Promise<Product>;
  deleteProduct(id: string): Promise<void>;
}
