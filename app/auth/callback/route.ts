import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * Qui arriva l'utente dopo aver cliccato il magic link nell'email
 * o dopo il login con Google. Scambiamo il "code" con una sessione valida.
 */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/";

  if (code) {
    const supabase = createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      // Accettiamo solo percorsi interni, per sicurezza
      const safeNext = next.startsWith("/") && !next.startsWith("//") ? next : "/";
      return NextResponse.redirect(`${origin}${safeNext}`);
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth`);
}
