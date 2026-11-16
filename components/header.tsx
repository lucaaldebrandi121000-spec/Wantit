"use client";

import { Menu, Plus, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CATEGORY_STYLES } from "@/lib/categories";
import { cn } from "@/lib/utils";
import { CATEGORIES, type Category } from "@/types";

interface HeaderProps {
  title: string;
  emoji?: string;
  search: string;
  onSearchChange: (value: string) => void;
  category: Category | "all";
  onCategoryChange: (value: Category | "all") => void;
  onAdd: () => void;
  onOpenMenu: () => void; // apre la sidebar su mobile
}

export function Header({
  title,
  emoji,
  search,
  onSearchChange,
  category,
  onCategoryChange,
  onAdd,
  onOpenMenu,
}: HeaderProps) {
  return (
    <header className="sticky top-0 z-30 border-b border-[#1A1A1A] bg-[#0A0A0A]/80 backdrop-blur-xl">
      <div className="flex items-center gap-3 px-4 py-4 md:px-8">
        <Button variant="ghost" size="icon" className="md:hidden" onClick={onOpenMenu} aria-label="Apri menu">
          <Menu />
        </Button>

        <h1 className="flex min-w-0 items-center gap-2 text-lg font-semibold tracking-tight md:text-xl">
          {emoji && <span>{emoji}</span>}
          <span className="truncate">{title}</span>
        </h1>

        <div className="ml-auto flex items-center gap-2">
          <div className="relative hidden sm:block">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Cerca prodotti…"
              className="h-9 w-56 border-[#1A1A1A] bg-white/[0.02] pl-9 lg:w-72"
            />
          </div>
          <Button onClick={onAdd} size="sm" className="h-9 gap-1.5 px-3">
            <Plus /> <span className="hidden sm:inline">Aggiungi</span>
          </Button>
        </div>
      </div>

      {/* Ricerca su mobile (sotto il titolo) */}
      <div className="px-4 pb-3 sm:hidden">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Cerca prodotti…"
            className="h-9 border-[#1A1A1A] bg-white/[0.02] pl-9"
          />
        </div>
      </div>

      {/* Filtro per categoria: fila di "chip" scorrevole */}
      <div className="flex gap-2 overflow-x-auto px-4 pb-4 md:px-8 [scrollbar-width:none]">
        <Chip active={category === "all"} onClick={() => onCategoryChange("all")}>
          Tutte
        </Chip>
        {CATEGORIES.map((c) => (
          <Chip
            key={c}
            active={category === c}
            color={CATEGORY_STYLES[c].color}
            onClick={() => onCategoryChange(category === c ? "all" : c)}
          >
            <span aria-hidden>{CATEGORY_STYLES[c].emoji}</span> {c}
          </Chip>
        ))}
      </div>
    </header>
  );
}

function Chip({
  active,
  color,
  onClick,
  children,
}: {
  active: boolean;
  color?: string;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "inline-flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium transition-all",
        active
          ? "border-transparent bg-white text-black"
          : "border-[#1A1A1A] text-muted-foreground hover:border-[#2a2a2a] hover:text-foreground"
      )}
      style={active && color ? { backgroundColor: color, color: "#0A0A0A" } : undefined}
    >
      {children}
    </button>
  );
}
