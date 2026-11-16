/**
 * Se le chiavi Supabase non sono impostate, l'app gira in "modalità demo":
 * niente login, dati finti salvati nel browser (localStorage).
 */
export const isSupabaseConfigured = Boolean(
  process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);
