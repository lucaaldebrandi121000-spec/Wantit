"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { Plus, SearchX } from "lucide-react";
import { toast } from "sonner";
import { AddProductDialog } from "@/components/add-product-dialog";
import { Header } from "@/components/header";
import { NewWishlistDialog } from "@/components/new-wishlist-dialog";
import { ProductCard } from "@/components/product-card";
import { ProductSkeleton } from "@/components/product-skeleton";
import { Sidebar } from "@/components/sidebar";
import { Button } from "@/components/ui/button";
import { isSupabaseConfigured } from "@/lib/config";
import { getStore } from "@/lib/data";
import { createClient } from "@/lib/supabase/client";
import type { Category, NewProduct, NewWishlist, Product, Wishlist } from "@/types";

/**
 * Schermata principale: tiene in memoria liste e prodotti,
 * gestisce filtri/ricerca e passa i dati ai componenti figli.
 */
export function Dashboard() {
  const store = getStore();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [wishlists, setWishlists] = useState<Wishlist[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [userEmail, setUserEmail] = useState<string | null>(null);

  // Filtri
  const [selectedId, setSelectedId] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<Category | "all">("all");

  // Modal e menu mobile
  const [addOpen, setAddOpen] = useState(false);
  const [addUrl, setAddUrl] = useState<string | undefined>();
  const [newListOpen, setNewListOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  // --- Caricamento iniziale ---
  useEffect(() => {
    (async () => {
      try {
        const [w, p] = await Promise.all([store.listWishlists(), store.listProducts()]);
        setWishlists(w);
        setProducts(p);
      } catch (err) {
        toast.error(`Impossibile caricare i dati: ${(err as Error).message}`);
      } finally {
        setLoading(false);
      }
    })();

    if (isSupabaseConfigured) {
      createClient()
        .auth.getUser()
        .then(({ data }) => setUserEmail(data.user?.email ?? null));
    }
  }, [store]);

  // --- Link arrivato dall'estensione Chrome: /?add=https://... ---
  useEffect(() => {
    const incoming = searchParams.get("add");
    if (incoming) {
      setAddUrl(incoming);
      setAddOpen(true);
      router.replace("/", { scroll: false }); // pulisce la barra degli indirizzi
    }
  }, [searchParams, router]);

  // --- Prodotti filtrati da mostrare nella griglia ---
  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    return products.filter(
      (p) =>
        (selectedId === "all" || p.wishlist_id === selectedId) &&
        (category === "all" || p.category === category) &&
        (!q || p.title.toLowerCase().includes(q) || (p.source_site ?? "").toLowerCase().includes(q))
    );
  }, [products, selectedId, category, search]);

  const counts = useMemo(() => {
    const c: Record<string, number> = {};
    for (const p of products) c[p.wishlist_id] = (c[p.wishlist_id] ?? 0) + 1;
    return c;
  }, [products]);

  const selectedList = wishlists.find((w) => w.id === selectedId);

  // --- Azioni ---
  const handleAddProduct = useCallback(
    async (input: NewProduct) => {
      try {
        const created = await store.addProduct(input);
        setProducts((prev) => [created, ...prev]);
        const list = wishlists.find((w) => w.id === input.wishlist_id);
        toast.success(`Aggiunto a ${list?.emoji ?? ""} ${list?.name ?? "wishlist"}`);
      } catch (err) {
        toast.error(`Salvataggio non riuscito: ${(err as Error).message}`);
        throw err;
      }
    },
    [store, wishlists]
  );

  async function handleUpdate(id: string, patch: Partial<NewProduct>, successMsg: string) {
    try {
      const updated = await store.updateProduct(id, patch);
      setProducts((prev) => prev.map((p) => (p.id === id ? updated : p)));
      toast.success(successMsg);
    } catch (err) {
      toast.error((err as Error).message);
    }
  }

  async function handleDeleteProduct(product: Product) {
    try {
      await store.deleteProduct(product.id);
      setProducts((prev) => prev.filter((p) => p.id !== product.id));
      toast("Prodotto eliminato", {
        // "Annulla" lo ricrea con gli stessi dati
        action: {
          label: "Annulla",
          onClick: async () => {
            const { wishlist_id, url, title, image_url, price, currency, category, source_site, notes, is_bought } = product;
            const restored = await store.addProduct({ wishlist_id, url, title, image_url, price, currency, category, source_site, notes, is_bought });
            setProducts((prev) => [restored, ...prev]);
          },
        },
      });
    } catch (err) {
      toast.error((err as Error).message);
    }
  }

  async function handleCreateList(input: NewWishlist) {
    try {
      const created = await store.createWishlist(input);
      setWishlists((prev) => [...prev, created]);
      setSelectedId(created.id);
      toast.success(`Lista "${created.name}" creata`);
    } catch (err) {
      toast.error((err as Error).message);
      throw err;
    }
  }

  function handleDeleteList(w: Wishlist) {
    // Chiediamo conferma con un toast: elimina anche tutti i prodotti dentro
    toast(`Eliminare "${w.name}" e i suoi ${counts[w.id] ?? 0} prodotti?`, {
      action: {
        label: "Elimina",
        onClick: async () => {
          try {
            await store.deleteWishlist(w.id);
            setWishlists((prev) => prev.filter((x) => x.id !== w.id));
            setProducts((prev) => prev.filter((p) => p.wishlist_id !== w.id));
            if (selectedId === w.id) setSelectedId("all");
            toast.success("Lista eliminata");
          } catch (err) {
            toast.error((err as Error).message);
          }
        },
      },
    });
  }

  async function handleLogout() {
    await createClient().auth.signOut();
    router.push("/login");
    router.refresh();
  }

  function openAdd() {
    setAddUrl(undefined);
    setAddOpen(true);
  }

  const sidebar = (
    <Sidebar
      wishlists={wishlists}
      counts={counts}
      totalCount={products.length}
      selectedId={selectedId}
      onSelect={(id) => {
        setSelectedId(id);
        setMenuOpen(false);
      }}
      onNewList={() => {
        setNewListOpen(true);
        setMenuOpen(false);
      }}
      onDeleteList={handleDeleteList}
      userEmail={userEmail}
      onLogout={handleLogout}
      isDemo={!isSupabaseConfigured}
    />
  );

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar fissa su desktop */}
      <div className="hidden md:block">{sidebar}</div>

      {/* Sidebar a scomparsa su mobile */}
      <AnimatePresence>
        {menuOpen && (
          <>
            <motion.div
              className="fixed inset-0 z-40 bg-black/60 md:hidden"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMenuOpen(false)}
            />
            <motion.div
              className="fixed inset-y-0 left-0 z-50 md:hidden"
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ type: "spring", damping: 30, stiffness: 300 }}
            >
              {sidebar}
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <main className="flex-1 overflow-y-auto scrollbar-thin">
        <Header
          title={selectedList?.name ?? "Tutti i prodotti"}
          emoji={selectedList?.emoji}
          search={search}
          onSearchChange={setSearch}
          category={category}
          onCategoryChange={setCategory}
          onAdd={openAdd}
          onOpenMenu={() => setMenuOpen(true)}
        />

        <div className="px-4 py-6 md:px-8 md:py-8">
          {loading ? (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <ProductSkeleton key={i} />
              ))}
            </div>
          ) : visible.length === 0 ? (
            <EmptyState filtered={products.length > 0} onAdd={openAdd} />
          ) : (
            // Griglia: 1 colonna su mobile, 2 su tablet, 3 su desktop
            <motion.div layout className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              <AnimatePresence mode="popLayout">
                {visible.map((p, i) => (
                  <ProductCard
                    key={p.id}
                    product={p}
                    index={i}
                    wishlists={wishlists}
                    onMove={(id, wishlistId) => {
                      const target = wishlists.find((w) => w.id === wishlistId);
                      handleUpdate(id, { wishlist_id: wishlistId }, `Spostato in ${target?.emoji} ${target?.name}`);
                    }}
                    onToggleBought={(prod) =>
                      handleUpdate(
                        prod.id,
                        { is_bought: !prod.is_bought },
                        prod.is_bought ? "Segnato come da comprare" : "Segnato come comprato 🎉"
                      )
                    }
                    onDelete={handleDeleteProduct}
                  />
                ))}
              </AnimatePresence>
            </motion.div>
          )}
        </div>
      </main>

      <AddProductDialog
        open={addOpen}
        onOpenChange={setAddOpen}
        wishlists={wishlists}
        defaultWishlistId={selectedList?.id}
        initialUrl={addUrl}
        onSave={handleAddProduct}
      />
      <NewWishlistDialog open={newListOpen} onOpenChange={setNewListOpen} onCreate={handleCreateList} />
    </div>
  );
}

function EmptyState({ filtered, onAdd }: { filtered: boolean; onAdd: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="mx-auto flex max-w-sm flex-col items-center py-24 text-center"
    >
      {filtered ? (
        <>
          <SearchX className="mb-4 h-10 w-10 text-muted-foreground/50" />
          <h2 className="text-lg font-medium">Nessun risultato</h2>
          <p className="mt-1 text-sm text-muted-foreground">Prova a cambiare ricerca o filtro.</p>
        </>
      ) : (
        <>
          <div className="mb-5 text-5xl">🛍️</div>
          <h2 className="text-lg font-medium">La tua wishlist è vuota</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Incolla il link di un prodotto da qualsiasi negozio online e lo salviamo noi.
          </p>
          <Button onClick={onAdd} className="mt-6 gap-1.5">
            <Plus /> Aggiungi il primo prodotto
          </Button>
        </>
      )}
    </motion.div>
  );
}
