-- =====================================================================
-- Wantit — schema iniziale
-- Incolla tutto questo file nel SQL Editor di Supabase e premi "Run".
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. USERS
-- Supabase gestisce già gli account in "auth.users" (tabella interna).
-- Qui creiamo una copia pubblica con i soli dati che ci servono.
-- ---------------------------------------------------------------------
create table if not exists public.users (
  id          uuid primary key references auth.users (id) on delete cascade,
  email       text not null,
  created_at  timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- 2. WISHLISTS
-- ---------------------------------------------------------------------
create table if not exists public.wishlists (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references public.users (id) on delete cascade,
  name        text not null,
  emoji       text not null default '🎁',
  color       text not null default '#8B5CF6',
  created_at  timestamptz not null default now()
);

create index if not exists wishlists_user_id_idx on public.wishlists (user_id);

-- ---------------------------------------------------------------------
-- 3. PRODUCTS
-- ---------------------------------------------------------------------
create table if not exists public.products (
  id           uuid primary key default gen_random_uuid(),
  wishlist_id  uuid not null references public.wishlists (id) on delete cascade,
  url          text not null,
  title        text not null,
  image_url    text,
  price        numeric(12, 2),
  currency     text default 'EUR',
  category     text not null default 'Altro'
               check (category in ('Moda','Tecnologia','Casa','Sport','Bellezza','Libri','Cibo','Viaggi','Altro')),
  source_site  text,
  added_at     timestamptz not null default now(),
  notes        text,
  is_bought    boolean not null default false
);

create index if not exists products_wishlist_id_idx on public.products (wishlist_id);

-- ---------------------------------------------------------------------
-- 4. SICUREZZA (Row Level Security)
-- Ogni utente può vedere e modificare SOLO i propri dati.
-- ---------------------------------------------------------------------
alter table public.users     enable row level security;
alter table public.wishlists enable row level security;
alter table public.products  enable row level security;

drop policy if exists "users: read own" on public.users;
create policy "users: read own" on public.users
  for select using (auth.uid() = id);

drop policy if exists "wishlists: all own" on public.wishlists;
create policy "wishlists: all own" on public.wishlists
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- I prodotti non hanno user_id: controlliamo che la wishlist sia dell'utente
drop policy if exists "products: all own" on public.products;
create policy "products: all own" on public.products
  for all
  using (exists (select 1 from public.wishlists w where w.id = wishlist_id and w.user_id = auth.uid()))
  with check (exists (select 1 from public.wishlists w where w.id = wishlist_id and w.user_id = auth.uid()));

-- ---------------------------------------------------------------------
-- 5. TRIGGER: quando qualcuno si registra
--    → crea la riga in public.users
--    → crea una prima wishlist di default
-- ---------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.users (id, email) values (new.id, new.email)
  on conflict (id) do nothing;

  insert into public.wishlists (user_id, name, emoji, color)
  values (new.id, 'La mia wishlist', '✨', '#8B5CF6');

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
