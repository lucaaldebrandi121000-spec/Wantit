"use client";

import { motion } from "framer-motion";
import { Layers, LogOut, MoreHorizontal, Plus, Trash2 } from "lucide-react";
import { Logo } from "@/components/logo";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import type { Wishlist } from "@/types";

interface SidebarProps {
  wishlists: Wishlist[];
  counts: Record<string, number>; // numero di prodotti per lista
  totalCount: number;
  selectedId: string; // "all" oppure l'id di una lista
  onSelect: (id: string) => void;
  onNewList: () => void;
  onDeleteList: (wishlist: Wishlist) => void;
  userEmail: string | null;
  onLogout?: () => void;
  isDemo: boolean;
}

export function Sidebar({
  wishlists,
  counts,
  totalCount,
  selectedId,
  onSelect,
  onNewList,
  onDeleteList,
  userEmail,
  onLogout,
  isDemo,
}: SidebarProps) {
  return (
    <aside className="flex h-full w-64 flex-col border-r border-[#1A1A1A] bg-[#0A0A0A]">
      <div className="px-5 pb-6 pt-6">
        <Logo />
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto px-3 scrollbar-thin">
        <SidebarItem
          active={selectedId === "all"}
          onClick={() => onSelect("all")}
          icon={<Layers className="h-4 w-4 text-muted-foreground" />}
          label="Tutti i prodotti"
          count={totalCount}
        />

        <div className="px-2 pb-1 pt-5 text-[11px] font-medium uppercase tracking-wider text-muted-foreground/70">
          Le tue liste
        </div>

        {wishlists.map((w, i) => (
          <motion.div
            key={w.id}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.03 }}
            className="group relative"
          >
            <SidebarItem
              active={selectedId === w.id}
              onClick={() => onSelect(w.id)}
              icon={
                // Quadratino colorato con l'emoji della lista
                <span
                  className="grid h-6 w-6 place-items-center rounded-md text-[13px]"
                  style={{ backgroundColor: `${w.color}26`, boxShadow: `inset 0 0 0 1px ${w.color}40` }}
                >
                  {w.emoji}
                </span>
              }
              label={w.name}
              count={counts[w.id] ?? 0}
            />
            <DropdownMenu>
              <DropdownMenuTrigger
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-muted-foreground opacity-0 transition-opacity hover:bg-accent focus:opacity-100 group-hover:opacity-100"
                aria-label={`Opzioni ${w.name}`}
              >
                <MoreHorizontal className="h-3.5 w-3.5" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" side="right">
                <DropdownMenuItem
                  onSelect={() => onDeleteList(w)}
                  className="text-red-400 focus:bg-red-500/10 focus:text-red-400"
                >
                  <Trash2 /> Elimina lista
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </motion.div>
        ))}

        <button
          onClick={onNewList}
          className="mt-1 flex w-full items-center gap-3 rounded-lg px-2 py-2 text-sm text-muted-foreground transition-colors hover:bg-white/[0.03] hover:text-foreground"
        >
          <span className="grid h-6 w-6 place-items-center rounded-md border border-dashed border-[#2a2a2a]">
            <Plus className="h-3.5 w-3.5" />
          </span>
          Nuova lista
        </button>
      </nav>

      <div className="border-t border-[#1A1A1A] p-3">
        {isDemo ? (
          <div className="rounded-lg bg-amber-500/10 px-3 py-2 text-xs text-amber-300/90">
            Modalità demo — i dati restano in questo browser.
          </div>
        ) : (
          <div className="flex items-center justify-between gap-2 px-2">
            <span className="truncate text-xs text-muted-foreground">{userEmail}</span>
            <Button variant="ghost" size="icon" onClick={onLogout} aria-label="Esci" className="h-8 w-8 shrink-0">
              <LogOut />
            </Button>
          </div>
        )}
      </div>
    </aside>
  );
}

function SidebarItem({
  active,
  onClick,
  icon,
  label,
  count,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
  count: number;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex w-full items-center gap-3 rounded-lg px-2 py-2 text-left text-sm transition-colors",
        active ? "bg-white/[0.06] text-foreground" : "text-muted-foreground hover:bg-white/[0.03] hover:text-foreground"
      )}
    >
      <span className="grid h-6 w-6 shrink-0 place-items-center">{icon}</span>
      <span className="flex-1 truncate">{label}</span>
      {/* Il contatore si nasconde al passaggio del mouse per lasciare posto ai 3 puntini */}
      <span className="text-xs tabular-nums text-muted-foreground/60 transition-opacity group-hover:opacity-0">
        {count}
      </span>
    </button>
  );
}
