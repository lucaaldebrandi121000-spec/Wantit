import { isSupabaseConfigured } from "@/lib/config";
import { mockStore } from "./mock-store";
import { createSupabaseStore } from "./supabase-store";
import type { DataStore } from "./store";

let store: DataStore | null = null;

/** Restituisce il livello dati giusto: Supabase se configurato, altrimenti demo. */
export function getStore(): DataStore {
  if (!store) store = isSupabaseConfigured ? createSupabaseStore() : mockStore;
  return store;
}

export type { DataStore };
