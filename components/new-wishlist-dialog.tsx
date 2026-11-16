"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { WISHLIST_COLORS, WISHLIST_EMOJIS } from "@/lib/categories";
import { cn } from "@/lib/utils";
import type { NewWishlist } from "@/types";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreate: (input: NewWishlist) => Promise<void>;
}

export function NewWishlistDialog({ open, onOpenChange, onCreate }: Props) {
  const [name, setName] = useState("");
  const [emoji, setEmoji] = useState(WISHLIST_EMOJIS[0]);
  const [color, setColor] = useState(WISHLIST_COLORS[0]);
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setSaving(true);
    try {
      await onCreate({ name: name.trim(), emoji, color });
      setName("");
      onOpenChange(false);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <form onSubmit={handleSubmit} className="space-y-5">
          <DialogHeader>
            <DialogTitle>Nuova lista</DialogTitle>
            <DialogDescription>Dai un nome, un&apos;emoji e un colore alla tua wishlist.</DialogDescription>
          </DialogHeader>

          {/* Anteprima live */}
          <div className="flex items-center gap-3 rounded-xl border border-[#1A1A1A] p-3">
            <span
              className="grid h-10 w-10 place-items-center rounded-lg text-xl"
              style={{ backgroundColor: `${color}26`, boxShadow: `inset 0 0 0 1px ${color}55` }}
            >
              {emoji}
            </span>
            <span className={cn("font-medium", !name && "text-muted-foreground")}>{name || "Nome della lista"}</span>
          </div>

          <div className="space-y-2">
            <Label htmlFor="wl-name">Nome</Label>
            <Input
              id="wl-name"
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="es. Regali di compleanno"
              maxLength={60}
            />
          </div>

          <div className="space-y-2">
            <Label>Emoji</Label>
            <div className="flex flex-wrap gap-1.5">
              {WISHLIST_EMOJIS.map((e) => (
                <button
                  type="button"
                  key={e}
                  onClick={() => setEmoji(e)}
                  className={cn(
                    "grid h-9 w-9 place-items-center rounded-lg border text-lg transition-colors",
                    emoji === e ? "border-white/40 bg-white/10" : "border-[#1A1A1A] hover:bg-white/5"
                  )}
                >
                  {e}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label>Colore</Label>
            <div className="flex flex-wrap gap-2">
              {WISHLIST_COLORS.map((c) => (
                <button
                  type="button"
                  key={c}
                  onClick={() => setColor(c)}
                  aria-label={`Colore ${c}`}
                  className={cn(
                    "h-7 w-7 rounded-full transition-transform hover:scale-110",
                    color === c && "ring-2 ring-white ring-offset-2 ring-offset-[#0F0F0F]"
                  )}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
              Annulla
            </Button>
            <Button type="submit" disabled={!name.trim() || saving}>
              {saving ? "Creo…" : "Crea lista"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
