import type { DataStore } from "./store";
import type { Product, Wishlist } from "@/types";
import { createClient } from "@/lib/supabase/client";

/**
 * Versione "vera" del livello dati: legge e scrive sul database Supabase.
 * Non serve filtrare per utente: ci pensano le regole RLS definite nella migration.
 */
export function createSupabaseStore(): DataStore {
  const supabase = createClient();

  // Supabase restituisce { data, error }: se c'è un errore lo "lanciamo"
  // così l'interfaccia può mostrare un toast.
  function check<T>(res: { data: T | null; error: { message: string } | null }): T {
    if (res.error) throw new Error(res.error.message);
    return res.data as T;
  }

  // Postgres restituisce i numeri decimali come stringhe: li convertiamo
  const normalize = (p: Product): Product => ({ ...p, price: p.price == null ? null : Number(p.price) });

  return {
    async listWishlists() {
      return check<Wishlist[]>(
        await supabase.from("wishlists").select("*").order("created_at", { ascending: true })
      );
    },

    async createWishlist(input) {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Devi effettuare il login");
      return check<Wishlist>(
        await supabase
          .from("wishlists")
          .insert({ ...input, user_id: user.id })
          .select()
          .single()
      );
    },

    async deleteWishlist(id) {
      check(await supabase.from("wishlists").delete().eq("id", id));
    },

    async listProducts() {
      const rows = check<Product[]>(
        await supabase.from("products").select("*").order("added_at", { ascending: false })
      );
      return rows.map(normalize);
    },

    async addProduct(input) {
      return normalize(check<Product>(await supabase.from("products").insert(input).select().single()));
    },

    async updateProduct(id, patch) {
      return normalize(
        check<Product>(await supabase.from("products").update(patch).eq("id", id).select().single())
      );
    },

    async deleteProduct(id) {
      check(await supabase.from("products").delete().eq("id", id));
    },
  };
}
