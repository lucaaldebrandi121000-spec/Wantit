import { NextResponse } from "next/server";
import { extractProduct, fetchHtml, isSafePublicUrl, safeHostname } from "@/lib/scrape";
import { categorize } from "@/lib/categorize";
import type { ScrapeResult } from "@/types";

// Questa route deve girare su Node.js (cheerio non funziona sull'Edge runtime)
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * POST /api/scrape
 * Body: { "url": "https://..." }
 * Risposta: { url, title, image_url, price, currency, category, source_site }
 */
export async function POST(request: Request) {
  // 1. Leggiamo e validiamo l'URL ricevuto
  let body: { url?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Richiesta non valida" }, { status: 400 });
  }

  const rawUrl = typeof body.url === "string" ? body.url.trim() : "";
  let url: URL;
  try {
    // Se l'utente scrive "amazon.it/..." senza https://, lo aggiungiamo noi
    url = new URL(/^https?:\/\//i.test(rawUrl) ? rawUrl : `https://${rawUrl}`);
  } catch {
    return NextResponse.json({ error: "Il link non sembra valido" }, { status: 400 });
  }
  if (!isSafePublicUrl(url)) {
    return NextResponse.json({ error: "Questo indirizzo non è consentito" }, { status: 400 });
  }

  const source_site = safeHostname(url.toString());

  // 2. Scarichiamo la pagina ed estraiamo i dati.
  //    Se il sito ci blocca, non falliamo: restituiamo quello che sappiamo
  //    e l'utente potrà completare a mano nell'anteprima.
  let raw = { title: null, image_url: null, price: null, currency: null, description: null } as ReturnType<
    typeof extractProduct
  >;
  let warning: string | undefined;
  try {
    const html = await fetchHtml(url.toString());
    raw = extractProduct(html, url.toString());
  } catch (err) {
    warning = `Non sono riuscito a leggere la pagina (${(err as Error).message}). Completa i dati a mano.`;
  }

  const title = raw.title ?? prettifySlug(url) ?? source_site;

  // 3. Categoria con l'AI (o con le parole chiave)
  const category = await categorize({ title, description: raw.description, site: source_site });

  const result: ScrapeResult & { warning?: string } = {
    url: url.toString(),
    title,
    image_url: raw.image_url,
    price: raw.price,
    currency: raw.currency ?? "EUR",
    category,
    source_site,
    ...(warning ? { warning } : {}),
  };

  return NextResponse.json(result);
}

/** Da ".../nike-air-max-90-uomo/dp/123" ricava "Nike air max 90 uomo" come titolo di riserva. */
function prettifySlug(url: URL): string | null {
  const segment = url.pathname
    .split("/")
    .filter((s) => s.length > 3 && /[a-z]/i.test(s) && s.includes("-"))
    .sort((a, b) => b.length - a.length)[0];
  if (!segment) return null;
  const text = decodeURIComponent(segment).replace(/\.\w+$/, "").replace(/[-_]+/g, " ").trim();
  return text ? text.charAt(0).toUpperCase() + text.slice(1) : null;
}
