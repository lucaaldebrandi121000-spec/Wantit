"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Check, ExternalLink, FolderInput, ImageOff, MoreHorizontal, RotateCcw, Trash2 } from "lucide-react";
import { CategoryBadge } from "@/components/category-badge";
import { Card } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn, formatPrice } from "@/lib/utils";
import type { Product, Wishlist } from "@/types";

interface ProductCardProps {
  product: Product;
  wishlists: Wishlist[];
  index: number; // posizione nella griglia: serve per far entrare le card una dopo l'altra
  onMove: (productId: string, wishlistId: string) => void;
  onToggleBought: (product: Product) => void;
  onDelete: (product: Product) => void;
}

export function ProductCard({ product, wishlists, index, onMove, onToggleBought, onDelete }: ProductCardProps) {
  const [imgFailed, setImgFailed] = useState(false);
  const price = formatPrice(product.price, product.currency);
  const otherLists = wishlists.filter((w) => w.id !== product.wishlist_id);

  return (
    <motion.div
      layout
      // Ingresso: dissolvenza + leggero scivolamento dal basso
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.35, delay: Math.min(index * 0.04, 0.4), ease: [0.22, 1, 0.36, 1] }}
      // Hover: ingrandimento 1.05
      whileHover={{ scale: 1.05 }}
      className="group relative hover:z-10"
    >
      <Card
        className={cn(
          "overflow-hidden transition-shadow duration-300",
          "group-hover:border-[#262626] group-hover:shadow-[0_20px_50px_-12px_rgba(0,0,0,0.9)]",
          product.is_bought && "opacity-60"
        )}
      >
        {/* Immagine: tutta la card è un link al prodotto */}
        <a href={product.url} target="_blank" rel="noopener noreferrer" className="block">
          <div className="relative aspect-[4/3] overflow-hidden bg-[#111]">
            {product.image_url && !imgFailed ? (
              <img
                src={product.image_url}
                alt={product.title}
                loading="lazy"
                referrerPolicy="no-referrer"
                onError={() => setImgFailed(true)}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="grid h-full w-full place-items-center text-muted-foreground">
                <ImageOff className="h-8 w-8 opacity-40" />
              </div>
            )}

            {product.is_bought && (
              <span className="absolute left-3 top-3 inline-flex items-center gap-1 rounded-full bg-emerald-500/90 px-2 py-0.5 text-[11px] font-semibold text-black">
                <Check className="h-3 w-3" /> Comprato
              </span>
            )}
          </div>
        </a>

        <div className="space-y-3 p-4">
          <div className="flex items-start justify-between gap-2">
            <a
              href={product.url}
              target="_blank"
              rel="noopener noreferrer"
              className="line-clamp-2 text-[15px] font-medium leading-snug hover:underline"
              title={product.title}
            >
              {product.title}
            </a>

            {/* Menu contestuale (3 puntini) */}
            <DropdownMenu>
              <DropdownMenuTrigger
                className="-mr-1 -mt-0.5 shrink-0 rounded-md p-1 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground focus:outline-none"
                aria-label="Azioni"
              >
                <MoreHorizontal className="h-4 w-4" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuSub>
                  <DropdownMenuSubTrigger disabled={otherLists.length === 0}>
                    <FolderInput /> Sposta in lista
                  </DropdownMenuSubTrigger>
                  <DropdownMenuSubContent>
                    {otherLists.map((w) => (
                      <DropdownMenuItem key={w.id} onSelect={() => onMove(product.id, w.id)}>
                        <span>{w.emoji}</span> {w.name}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuSubContent>
                </DropdownMenuSub>
                <DropdownMenuItem onSelect={() => onToggleBought(product)}>
                  {product.is_bought ? (
                    <>
                      <RotateCcw /> Segna come da comprare
                    </>
                  ) : (
                    <>
                      <Check /> Segna come comprato
                    </>
                  )}
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <a href={product.url} target="_blank" rel="noopener noreferrer">
                    <ExternalLink /> Apri sul sito
                  </a>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onSelect={() => onDelete(product)}
                  className="text-red-400 focus:bg-red-500/10 focus:text-red-400"
                >
                  <Trash2 /> Elimina
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <p className={cn("text-lg font-semibold tracking-tight", !price && "text-sm font-normal text-muted-foreground")}>
            {price ?? "Prezzo non disponibile"}
          </p>

          {product.notes && <p className="line-clamp-2 text-xs text-muted-foreground">{product.notes}</p>}

          <div className="flex items-center justify-between gap-2">
            <CategoryBadge category={product.category} />
            <span className="truncate text-[11px] text-muted-foreground">{product.source_site}</span>
          </div>
        </div>
      </Card>
    </motion.div>
  );
}
