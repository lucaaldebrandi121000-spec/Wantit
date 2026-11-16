# Wantit ✨

La wishlist universale: incolli il link di un prodotto da qualsiasi sito, Wantit ne estrae nome, immagine e prezzo, lo categorizza con l'AI e lo salva in una lista.

## Avvio rapido (modalità demo, nessuna configurazione)

```bash
npm install
npm run dev
```

Apri http://localhost:3000. Senza chiavi Supabase l'app parte in **modalità demo**: niente login, dati di esempio salvati nel browser.

## Struttura

| Cartella | Cosa contiene |
|---|---|
| `app/` | Pagine (`/`, `/login`), API `/api/scrape`, callback di login |
| `components/` | Card, sidebar, header, modal; `components/ui` = componenti shadcn/ui |
| `lib/` | Scraping, categorizzazione AI, client Supabase, livello dati (demo / Supabase) |
| `types/` | Tipi TypeScript condivisi |
| `supabase/migrations/` | SQL per creare le tabelle |
| `extension/` | Estensione Chrome (Manifest V3) |

## Configurazione completa

1. Copia `.env.local.example` in `.env.local` e compila le chiavi (vedi sotto).
2. Su Supabase esegui `supabase/migrations/0001_init.sql` nel **SQL Editor**.
3. Riavvia `npm run dev`.

### Supabase
1. Crea un progetto su https://supabase.com/dashboard.
2. **Project Settings → API**: copia `Project URL` → `NEXT_PUBLIC_SUPABASE_URL` e la chiave `anon public` → `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
3. **SQL Editor → New query**: incolla `supabase/migrations/0001_init.sql` → **Run**.
4. **Authentication → URL Configuration**:
   - Site URL: `http://localhost:3000`
   - Redirect URLs: aggiungi `http://localhost:3000/auth/callback`
5. **Authentication → Sign In / Providers**: *Email* è già attivo (magic link).
6. Google (facoltativo):
   - Su https://console.cloud.google.com → *APIs & Services → Credentials → Create credentials → OAuth client ID* (tipo *Web application*).
   - In *Authorized redirect URIs* incolla l'URL di callback che Supabase mostra nella pagina del provider Google (tipo `https://xxxx.supabase.co/auth/v1/callback`).
   - Copia Client ID e Client Secret in Supabase → *Providers → Google* → abilita → salva.

### Gemini
Crea una chiave gratuita su https://aistudio.google.com/apikey → `GEMINI_API_KEY`.
Senza chiave l'app categorizza con parole chiave (meno precisa). Facoltativo: `GEMINI_MODEL` per cambiare modello (predefinito `gemini-flash-lite-latest`).

## Estensione Chrome
1. Apri `chrome://extensions` e attiva **Modalità sviluppatore**.
2. **Carica estensione non pacchettizzata** → scegli la cartella `extension/`.
3. Su una pagina prodotto clicca l'icona Wantit (o `Alt+Shift+W`) → **Salva nella wishlist**: si apre l'app con il link già pronto.
4. Se pubblichi l'app online, cambia l'indirizzo in *Impostazioni* nel popup.

## Limiti noti
Alcuni siti (es. Zalando, siti con protezioni anti-bot) bloccano la lettura automatica: in quel caso Wantit ricava un titolo dal link e ti lascia completare i dati a mano nell'anteprima.
