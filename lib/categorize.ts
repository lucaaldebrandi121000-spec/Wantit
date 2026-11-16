import { CATEGORIES, type Category } from "@/types";

/**
 * Assegna una categoria al prodotto.
 * - Se c'è GEMINI_API_KEY → chiede all'AI di Google
 * - Altrimenti (o se Gemini non risponde) → indovina con parole chiave
 */
export async function categorize(input: {
  title: string;
  description?: string | null;
  site?: string | null;
}): Promise<Category> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (apiKey) {
    try {
      const fromAi = await askGemini(apiKey, input);
      if (fromAi) return fromAi;
    } catch (err) {
      console.warn("[categorize] Gemini non disponibile, uso le parole chiave:", err);
    }
  }
  return categorizeByKeywords(`${input.title} ${input.description ?? ""} ${input.site ?? ""}`);
}

async function askGemini(
  apiKey: string,
  input: { title: string; description?: string | null; site?: string | null }
): Promise<Category | null> {
  // Il modello si può cambiare da .env.local senza toccare il codice.
  // "-latest" punta sempre all'ultima versione: non si rompe quando Google ritira un modello.
  const model = process.env.GEMINI_MODEL || "gemini-flash-lite-latest";

  const prompt = `Sei un classificatore di prodotti e-commerce.
Classifica il prodotto in UNA sola di queste categorie: ${CATEGORIES.join(", ")}.
Rispondi solo con il nome della categoria, senza altro testo.

Titolo: ${input.title}
Descrizione: ${input.description ?? "-"}
Sito: ${input.site ?? "-"}`;

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-goog-api-key": apiKey },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0,
          // Forziamo la risposta a essere esattamente una delle categorie
          responseMimeType: "text/x.enum",
          responseSchema: { type: "STRING", enum: [...CATEGORIES] },
        },
      }),
      signal: AbortSignal.timeout(8_000),
    }
  );

  if (!res.ok) throw new Error(`Gemini ${res.status}: ${await res.text()}`);
  const data = await res.json();
  const text: string = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
  return matchCategory(text);
}

function matchCategory(text: string): Category | null {
  const t = text.trim().toLowerCase();
  return CATEGORIES.find((c) => t.includes(c.toLowerCase())) ?? null;
}

/** Piano B senza AI: cerca parole tipiche di ogni categoria (italiano + inglese). */
const KEYWORDS: Record<Exclude<Category, "Altro">, string[]> = {
  Moda: ["scarp", "sneaker", "shoe", "maglia", "shirt", "giacca", "jacket", "jeans", "pantalon", "vestit", "dress", "borsa", "bag", "orologio", "watch", "felpa", "hoodie", "cappotto", "coat", "zara", "h&m", "nike", "adidas", "zalando", "gucci", "abbigliamento"],
  Tecnologia: ["iphone", "samsung", "laptop", "notebook", "pc", "computer", "cuffie", "headphone", "earbuds", "tablet", "ipad", "monitor", "tastiera", "keyboard", "mouse", "camera", "fotocamera", "smartwatch", "console", "playstation", "xbox", "nintendo", "tv", "speaker", "usb", "ssd", "apple", "gpu"],
  Casa: ["divano", "sofa", "lampada", "lamp", "tavolo", "table", "sedia", "chair", "letto", "bed", "cuscino", "pillow", "tappeto", "rug", "cucina", "kitchen", "ikea", "mobile", "arredo", "furniture", "vaso", "candela", "candle", "pentola"],
  Sport: ["running", "palestra", "gym", "yoga", "bici", "bike", "fitness", "pallone", "ball", "racchetta", "tennis", "calcio", "football", "decathlon", "trekking", "sci", "ski", "nuoto", "manubri", "dumbbell"],
  Bellezza: ["crema", "cream", "profumo", "perfume", "fragrance", "makeup", "trucco", "rossetto", "lipstick", "mascara", "siero", "serum", "skincare", "shampoo", "sephora", "douglas", "smalto"],
  Libri: ["libro", "book", "romanzo", "novel", "kindle", "ebook", "isbn", "autore", "author", "feltrinelli", "mondadori", "paperback", "copertina"],
  Cibo: ["cioccolat", "chocolate", "caffè", "coffee", "tè", "tea", "vino", "wine", "pasta", "olio", "snack", "biscott", "food", "gourmet", "birra", "beer"],
  Viaggi: ["volo", "flight", "hotel", "valigia", "suitcase", "luggage", "zaino", "backpack", "booking", "airbnb", "viaggio", "travel", "trolley", "tour", "biglietto"],
};

export function categorizeByKeywords(text: string): Category {
  const t = text.toLowerCase();
  let best: Category = "Altro";
  let bestScore = 0;
  for (const [cat, words] of Object.entries(KEYWORDS) as [Category, string[]][]) {
    const score = words.reduce((acc, w) => acc + (t.includes(w) ? 1 : 0), 0);
    if (score > bestScore) {
      best = cat;
      bestScore = score;
    }
  }
  return best;
}
