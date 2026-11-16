"use client";

import { useCallback, useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, ImageOff, Link2, Loader2, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { CategoryBadge } from "@/components/category-badge";
import { ProductSkeleton } from "@/components/product-skeleton";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { CATEGORY_STYLES } from "@/lib/categories";
import { CATEGORIES, type Category, type NewProduct, type ScrapeResult, type Wishlist } from "@/types";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  wishlists: Wishlist[];
  defaultWishlistId?: string;
  initialUrl?: string; // link passato dall'estensione Chrome (?add=...)
  onSave: (product: NewProduct) => Promise<void>;
}

// Le 3 fasi del modal: inserisci link → caricamento → anteprima modificabile
type Step = "input" | "loading" | "preview";

/** I campi modificabili nell'anteprima (il prezzo è testo finché l'utente scrive). */
interface Draft {
  url: string;
  title: string;
  image_url: string;
  price: string;
  currency: string;
  category: Category;
  source_site: string;
  notes: string;
  wishlist_id: string;
}

export function AddProductDialog({ open, onOpenChange, wishlists, defaultWishlistId, initialUrl, onSave }: Props) {
  const [step, setStep] = useState<Step>("input");
  const [url, setUrl] = useState("");
  const [draft, setDraft] = useState<Draft | null>(null);
  const [saving, setSaving] = useState(false);
  const [imgFailed, setImgFailed] = useState(false);

  const fallbackWishlist = defaultWishlistId ?? wishlists[0]?.id ?? "";

  const scrape = useCallback(
    async (target: string) => {
      if (!target.trim()) return;
      setStep("loading");
      try {
        const res = await fetch("/api/scrape", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ url: target }),
        });
        const data = (await res.json()) as ScrapeResult & { error?: string; warning?: string };
        if (!res.ok) throw new Error(data.error ?? "Errore durante la lettura del link");

        if (data.warning) toast.warning(data.warning);
        setImgFailed(false);
        setDraft({
          url: data.url,
          title: data.title,
          image_url: data.image_url ?? "",
          price: data.price != null ? String(data.price).replace(".", ",") : "",
          currency: data.currency ?? "EUR",
          category: data.category,
          source_site: data.source_site,
          notes: "",
          wishlist_id: fallbackWishlist,
        });
        setStep("preview");
      } catch (err) {
        toast.error((err as Error).message);
        setStep("input");
      }
    },
    [fallbackWishlist]
  );

  // Quando il modal si apre: reset; se arriva un link dall'estensione, parte subito lo scraping
  useEffect(() => {
    if (!open) return;
    setDraft(null);
    if (initialUrl) {
      setUrl(initialUrl);
      scrape(initialUrl);
    } else {
      setUrl("");
      setStep("input");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, initialUrl]);

  const update = <K extends keyof Draft>(key: K, value: Draft[K]) =>
    setDraft((d) => (d ? { ...d, [key]: value } : d));

  async function handleSave() {
    if (!draft) return;
    if (!draft.title.trim()) return toast.error("Il prodotto deve avere un nome");
    if (!draft.wishlist_id) return toast.error("Crea prima una lista");

    // "1.299,90" → 1299.9
    const priceNum = draft.price.trim()
      ? Number.parseFloat(draft.price.replace(/\s/g, "").replace(/\.(?=\d{3}(\D|$))/g, "").replace(",", "."))
      : null;
    if (priceNum != null && !Number.isFinite(priceNum)) return toast.error("Il prezzo non è valido");

    setSaving(true);
    try {
      await onSave({
        wishlist_id: draft.wishlist_id,
        url: draft.url,
        title: draft.title.trim(),
        image_url: draft.image_url.trim() || null,
        price: priceNum,
        currency: draft.currency.trim().toUpperCase() || "EUR",
        category: draft.category,
        source_site: draft.source_site,
        notes: draft.notes.trim() || null,
        is_bought: false,
      });
      onOpenChange(false);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>Aggiungi prodotto</DialogTitle>
          <DialogDescription>Incolla il link di un prodotto da qualsiasi sito.</DialogDescription>
        </DialogHeader>

        <AnimatePresence mode="wait">
          {/* FASE 1 e 2: campo link (+ skeleton durante il caricamento) */}
          {step !== "preview" && (
            <motion.div
              key="input"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="space-y-5"
            >
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  scrape(url);
                }}
                className="flex gap-2"
              >
                <div className="relative flex-1">
                  <Link2 className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    autoFocus
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    placeholder="https://www.amazon.it/…"
                    className="pl-9"
                    disabled={step === "loading"}
                  />
                </div>
                <Button type="submit" disabled={!url.trim() || step === "loading"}>
                  {step === "loading" ? <Loader2 className="animate-spin" /> : "Aggiungi"}
                </Button>
              </form>

              {step === "loading" && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
                  <p className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Sparkles className="h-3.5 w-3.5 animate-pulse text-fuchsia-400" />
                    Leggo la pagina e categorizzo con l&apos;AI…
                  </p>
                  <ProductSkeleton className="mx-auto max-w-xs" />
                </motion.div>
              )}
            </motion.div>
          )}

          {/* FASE 3: anteprima modificabile */}
          {step === "preview" && draft && (
            <motion.div
              key="preview"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="space-y-5"
            >
              <div className="grid gap-5 sm:grid-cols-[180px_1fr]">
                <div className="space-y-2">
                  <div className="aspect-[4/3] overflow-hidden rounded-lg border border-[#1A1A1A] bg-[#111] sm:aspect-square">
                    {draft.image_url && !imgFailed ? (
                      <img
                        src={draft.image_url}
                        alt=""
                        referrerPolicy="no-referrer"
                        onError={() => setImgFailed(true)}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="grid h-full place-items-center text-muted-foreground">
                        <ImageOff className="h-6 w-6 opacity-40" />
                      </div>
                    )}
                  </div>
                  <CategoryBadge category={draft.category} />
                </div>

                <div className="space-y-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="p-title">Nome</Label>
                    <Textarea
                      id="p-title"
                      rows={2}
                      value={draft.title}
                      onChange={(e) => update("title", e.target.value)}
                      className="min-h-0 resize-none"
                    />
                  </div>
                  <div className="grid grid-cols-[1fr_80px] gap-2">
                    <div className="space-y-1.5">
                      <Label htmlFor="p-price">Prezzo</Label>
                      <Input
                        id="p-price"
                        inputMode="decimal"
                        value={draft.price}
                        onChange={(e) => update("price", e.target.value)}
                        placeholder="es. 49,90"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="p-cur">Valuta</Label>
                      <Input
                        id="p-cur"
                        value={draft.currency}
                        maxLength={3}
                        onChange={(e) => update("currency", e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label>Categoria</Label>
                  <Select value={draft.category} onValueChange={(v) => update("category", v as Category)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {CATEGORIES.map((c) => (
                        <SelectItem key={c} value={c}>
                          {CATEGORY_STYLES[c].emoji} {c}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Salva nella lista</Label>
                  <Select value={draft.wishlist_id} onValueChange={(v) => update("wishlist_id", v)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Scegli una lista" />
                    </SelectTrigger>
                    <SelectContent>
                      {wishlists.map((w) => (
                        <SelectItem key={w.id} value={w.id}>
                          {w.emoji} {w.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="p-img">URL immagine</Label>
                <Input
                  id="p-img"
                  value={draft.image_url}
                  onChange={(e) => {
                    setImgFailed(false);
                    update("image_url", e.target.value);
                  }}
                  placeholder="https://…"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="p-notes">Note (facoltative)</Label>
                <Textarea
                  id="p-notes"
                  value={draft.notes}
                  onChange={(e) => update("notes", e.target.value)}
                  placeholder="Taglia M, colore nero…"
                  rows={2}
                />
              </div>

              <div className="flex items-center justify-between gap-2 pt-1">
                <Button variant="ghost" onClick={() => setStep("input")} className="gap-1.5">
                  <ArrowLeft /> Cambia link
                </Button>
                <Button onClick={handleSave} disabled={saving}>
                  {saving ? <Loader2 className="animate-spin" /> : null}
                  Salva nella wishlist
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
}
