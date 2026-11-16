"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { Loader2, Mail } from "lucide-react";
import { toast } from "sonner";
import { Logo } from "@/components/logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { isSupabaseConfigured } from "@/lib/config";
import { createClient } from "@/lib/supabase/client";

export function LoginForm() {
  const searchParams = useSearchParams();
  const next = searchParams.get("next") ?? "/";
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState<"email" | "google" | null>(null);
  const [sent, setSent] = useState(false);

  useEffect(() => {
    if (searchParams.get("error")) toast.error("Accesso non riuscito, riprova.");
  }, [searchParams]);

  // Dopo il login Supabase rimanda l'utente qui, che poi lo porta a "next"
  const redirectTo = () => `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`;

  async function handleMagicLink(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;
    setLoading("email");
    const { error } = await createClient().auth.signInWithOtp({
      email: email.trim(),
      options: { emailRedirectTo: redirectTo() },
    });
    setLoading(null);
    if (error) return toast.error(error.message);
    setSent(true);
  }

  async function handleGoogle() {
    setLoading("google");
    const { error } = await createClient().auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: redirectTo() },
    });
    // Se va tutto bene il browser viene reindirizzato a Google, quindi qui arriviamo solo in caso di errore
    if (error) {
      setLoading(null);
      toast.error(error.message);
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className="relative w-full max-w-sm"
    >
      <div className="mb-10 flex flex-col items-center text-center">
        <Logo size="lg" />
        <p className="mt-4 text-[15px] text-muted-foreground">Tutto quello che vuoi, in un solo posto.</p>
      </div>

      <div className="rounded-2xl border border-[#1A1A1A] bg-[#0F0F0F]/80 p-6 backdrop-blur">
        {!isSupabaseConfigured ? (
          // Modalità demo: Supabase non ancora configurato
          <div className="space-y-4 text-center">
            <p className="text-sm text-muted-foreground">
              Supabase non è ancora configurato. Puoi provare l&apos;app con dati di esempio.
            </p>
            <Button asChild className="w-full">
              <Link href="/">Entra in modalità demo</Link>
            </Button>
          </div>
        ) : sent ? (
          <div className="space-y-3 py-4 text-center">
            <Mail className="mx-auto h-8 w-8 text-fuchsia-400" />
            <p className="font-medium">Controlla la tua email</p>
            <p className="text-sm text-muted-foreground">
              Ti abbiamo inviato un link di accesso a <span className="text-foreground">{email}</span>.
            </p>
            <Button variant="ghost" size="sm" onClick={() => setSent(false)}>
              Usa un&apos;altra email
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <Button variant="outline" className="w-full gap-2" onClick={handleGoogle} disabled={loading !== null}>
              {loading === "google" ? <Loader2 className="animate-spin" /> : <GoogleIcon />}
              Continua con Google
            </Button>

            <div className="flex items-center gap-3 text-[11px] uppercase tracking-wider text-muted-foreground/60">
              <div className="h-px flex-1 bg-[#1A1A1A]" />
              oppure
              <div className="h-px flex-1 bg-[#1A1A1A]" />
            </div>

            <form onSubmit={handleMagicLink} className="space-y-3">
              <Input
                type="email"
                required
                placeholder="tu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              <Button type="submit" className="w-full" disabled={loading !== null}>
                {loading === "email" && <Loader2 className="animate-spin" />}
                Ricevi il link magico
              </Button>
            </form>
          </div>
        )}
      </div>

      <p className="mt-6 text-center text-xs text-muted-foreground/60">
        Nessuna password. Ti mandiamo un link via email.
      </p>
    </motion.div>
  );
}

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden>
      <path fill="#EA4335" d="M12 10.2v3.9h5.5c-.2 1.3-1.6 3.9-5.5 3.9-3.3 0-6-2.7-6-6.1s2.7-6.1 6-6.1c1.9 0 3.1.8 3.8 1.5l2.6-2.5C16.8 3.2 14.6 2.2 12 2.2 6.6 2.2 2.2 6.6 2.2 12s4.4 9.8 9.8 9.8c5.7 0 9.4-4 9.4-9.6 0-.6-.1-1.1-.2-1.6H12z" />
    </svg>
  );
}
