import * as cheerio from "cheerio";

/**
 * Estrae nome, immagine e prezzo da una pagina prodotto.
 * Ogni sito è diverso, quindi proviamo più fonti in ordine di affidabilità:
 *  1. meta tag Open Graph (og:title, og:image, product:price:amount…)
 *  2. dati strutturati JSON-LD (schema.org/Product, usati da molti e-commerce)
 *  3. attributi microdata (itemprop="price")
 *  4. selettori specifici per Amazon e fallback generici (<title>, <h1>)
 */

export interface RawProduct {
  title: string | null;
  image_url: string | null;
  price: number | null;
  currency: string | null;
  description: string | null;
}

// Fingiamo di essere un browser normale: molti siti bloccano le richieste "da robot"
const BROWSER_HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36",
  Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
  "Accept-Language": "it-IT,it;q=0.9,en-US;q=0.8,en;q=0.7",
};

/** Scarica l'HTML della pagina (massimo 10 secondi di attesa). */
export async function fetchHtml(url: string): Promise<string> {
  const res = await fetch(url, {
    headers: BROWSER_HEADERS,
    redirect: "follow",
    signal: AbortSignal.timeout(10_000),
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`Il sito ha risposto con errore ${res.status}`);
  return res.text();
}

export function extractProduct(html: string, pageUrl: string): RawProduct {
  const $ = cheerio.load(html);

  // Legge il "content" del primo meta tag trovato tra quelli indicati
  const meta = (...names: string[]) => {
    for (const n of names) {
      const v =
        $(`meta[property="${n}"]`).attr("content") ??
        $(`meta[name="${n}"]`).attr("content") ??
        $(`meta[itemprop="${n}"]`).attr("content");
      if (v && v.trim()) return v.trim();
    }
    return null;
  };

  const ld = findJsonLdProduct($);
  const offer = ld ? firstOffer(ld.offers) : null;

  // --- Titolo ---
  const title =
    meta("og:title", "twitter:title") ??
    str(ld?.name) ??
    clean($("#productTitle").text()) ?? // Amazon
    clean($("title").first().text()) ??
    clean($("h1").first().text());

  // --- Immagine ---
  const rawImage =
    meta("og:image", "og:image:secure_url", "twitter:image", "twitter:image:src") ??
    ldImage(ld?.image) ??
    $("#landingImage").attr("data-old-hires") ?? // Amazon
    $("#landingImage").attr("src") ??
    $('[itemprop="image"]').attr("content") ??
    $('[itemprop="image"]').attr("src") ??
    null;

  // --- Prezzo ---
  const rawPrice =
    meta("product:price:amount", "og:price:amount", "og:price", "price") ??
    str(offer?.price) ??
    str(offer?.lowPrice) ??
    $('[itemprop="price"]').attr("content") ??
    clean($('[itemprop="price"]').first().text()) ??
    // Amazon: il prezzo "da pagare" è in questi elementi nascosti
    firstText($, [
      "#apex-pricetopay-accessibility-label",
      ".priceToPay .a-offscreen",
      "#corePriceDisplay_desktop_feature_div .a-offscreen",
      "#corePrice_feature_div .a-offscreen",
      ".a-price .a-offscreen",
    ]) ??
    null;

  // --- Valuta ---
  const currency =
    meta("product:price:currency", "og:price:currency", "priceCurrency") ??
    str(offer?.priceCurrency) ??
    $('[itemprop="priceCurrency"]').attr("content") ??
    guessCurrency(rawPrice, pageUrl);

  const description = meta("og:description", "description", "twitter:description") ?? str(ld?.description);

  return {
    title: title ? decodeEntities(title).slice(0, 300) : null,
    image_url: rawImage ? absolutize(rawImage, pageUrl) : null,
    price: rawPrice ? parsePrice(rawPrice) : null,
    currency: currency ? currency.toUpperCase() : null,
    description: description ? description.slice(0, 500) : null,
  };
}

/* ------------------------------------------------------------------ */
/* Funzioni di supporto                                                */
/* ------------------------------------------------------------------ */

// I dati JSON-LD hanno forme molto variabili da sito a sito: li trattiamo come "qualsiasi"
// eslint-disable-next-line
type Json = any;

/** Cerca, tra gli script JSON-LD della pagina, l'oggetto di tipo "Product". */
function findJsonLdProduct($: cheerio.CheerioAPI): Json | null {
  const scripts = $('script[type="application/ld+json"]').toArray();
  for (const s of scripts) {
    try {
      const parsed = JSON.parse($(s).contents().text());
      const found = walk(parsed);
      if (found) return found;
    } catch {
      // JSON non valido: lo ignoriamo
    }
  }
  return null;

  function walk(node: Json): Json | null {
    if (!node || typeof node !== "object") return null;
    if (Array.isArray(node)) {
      for (const n of node) {
        const f = walk(n);
        if (f) return f;
      }
      return null;
    }
    const type = node["@type"];
    if (type === "Product" || (Array.isArray(type) && type.includes("Product"))) return node;
    if (node["@graph"]) return walk(node["@graph"]);
    return null;
  }
}

function firstOffer(offers: Json): Json | null {
  if (!offers) return null;
  if (Array.isArray(offers)) return offers[0] ?? null;
  return offers;
}

function ldImage(image: Json): string | null {
  if (!image) return null;
  if (typeof image === "string") return image;
  if (Array.isArray(image)) return ldImage(image[0]);
  return str(image.url);
}

function str(v: unknown): string | null {
  if (v == null) return null;
  const s = String(v).trim();
  return s || null;
}

function clean(s: string | undefined): string | null {
  if (!s) return null;
  const t = s.replace(/\s+/g, " ").trim();
  return t || null;
}

/** Primo testo non vuoto (e con almeno una cifra) tra gli elementi che corrispondono ai selettori. */
function firstText($: cheerio.CheerioAPI, selectors: string[]): string | null {
  for (const sel of selectors) {
    for (const el of $(sel).toArray()) {
      const t = clean($(el).text());
      if (t && /\d/.test(t)) return t;
    }
  }
  return null;
}

function decodeEntities(s: string) {
  return cheerio.load(`<p>${s}</p>`)("p").text();
}

/** Trasforma un URL relativo ("/img/foto.jpg") in assoluto. */
function absolutize(src: string, base: string) {
  try {
    return new URL(src, base).toString();
  } catch {
    return src;
  }
}

/**
 * Converte testi come "1.299,00 €", "$1,299.99", "49,90" in un numero.
 * La difficoltà è che in Italia la virgola è il separatore decimale, negli USA il punto.
 */
export function parsePrice(input: string): number | null {
  const s = input.replace(/[^\d.,]/g, "");
  if (!s) return null;

  const lastComma = s.lastIndexOf(",");
  const lastDot = s.lastIndexOf(".");
  let normalized: string;

  if (lastComma > -1 && lastDot > -1) {
    // Ci sono entrambi: quello più a destra è il separatore decimale
    normalized =
      lastComma > lastDot ? s.replace(/\./g, "").replace(",", ".") : s.replace(/,/g, "");
  } else if (lastComma > -1 || lastDot > -1) {
    const sep = lastComma > -1 ? "," : ".";
    const parts = s.split(sep);
    const decimals = parts[parts.length - 1];
    // "1.299" o "1,299" (3 cifre dopo) → separatore delle migliaia
    if (parts.length > 2 || decimals.length === 3) normalized = parts.join("");
    else normalized = parts.slice(0, -1).join("") + "." + decimals;
  } else {
    normalized = s;
  }

  const n = Number.parseFloat(normalized);
  return Number.isFinite(n) && n > 0 ? Math.round(n * 100) / 100 : null;
}

/** Se il sito non dichiara la valuta, la indoviniamo dal simbolo o dal dominio. */
function guessCurrency(rawPrice: string | null, pageUrl: string): string | null {
  if (rawPrice) {
    if (rawPrice.includes("€")) return "EUR";
    if (rawPrice.includes("£")) return "GBP";
    if (rawPrice.includes("$")) return "USD";
    if (rawPrice.includes("¥")) return "JPY";
    if (/CHF/i.test(rawPrice)) return "CHF";
  }
  const host = safeHostname(pageUrl);
  if (/\.(it|de|fr|es|nl|be|at|pt|ie|fi|gr)$/.test(host)) return "EUR";
  if (host.endsWith(".co.uk") || host.endsWith(".uk")) return "GBP";
  if (host.endsWith(".ch")) return "CHF";
  if (host.endsWith(".com")) return rawPrice ? "USD" : null;
  return null;
}

export function safeHostname(url: string) {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return "";
  }
}

/**
 * Sicurezza: impediamo di usare lo scraper per leggere indirizzi interni
 * (es. http://localhost o la rete di casa/aziendale).
 */
export function isSafePublicUrl(url: URL) {
  if (url.protocol !== "http:" && url.protocol !== "https:") return false;
  const h = url.hostname.toLowerCase();
  if (h === "localhost" || h.endsWith(".localhost") || h.endsWith(".local") || h.endsWith(".internal")) return false;
  if (h === "[::1]" || h.startsWith("[fc") || h.startsWith("[fd") || h.startsWith("[fe80")) return false;
  const ipv4 = h.match(/^(\d+)\.(\d+)\.(\d+)\.(\d+)$/);
  if (ipv4) {
    const [a, b] = [Number(ipv4[1]), Number(ipv4[2])];
    if (a === 10 || a === 127 || a === 0) return false;
    if (a === 169 && b === 254) return false;
    if (a === 172 && b >= 16 && b <= 31) return false;
    if (a === 192 && b === 168) return false;
  }
  return true;
}
