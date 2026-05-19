-- ===========================================
-- Home Budget — Supabase migration
-- Wklej całość w SQL Editor projektu Supabase i uruchom.
-- Bezpieczne do wielokrotnego uruchomienia (idempotentne).
-- ===========================================

-- ============ PROFILES ============
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text not null,
  monthly_budget numeric default 0,
  theme text default 'dark' check (theme in ('dark','light')),
  created_at timestamptz default now()
);

alter table public.profiles enable row level security;

drop policy if exists "profiles_select_all" on public.profiles;
create policy "profiles_select_all" on public.profiles
  for select to authenticated using (true);

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own" on public.profiles
  for update to authenticated using (auth.uid() = id) with check (auth.uid() = id);

drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own" on public.profiles
  for insert to authenticated with check (auth.uid() = id);

-- ============ CATEGORIES ============
create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  slug text unique,
  name text not null,
  icon text not null,
  color text not null,
  is_builtin boolean default false,
  created_by uuid references auth.users(id),
  created_at timestamptz default now()
);

alter table public.categories enable row level security;

drop policy if exists "categories_select_all" on public.categories;
create policy "categories_select_all" on public.categories
  for select to authenticated using (true);

drop policy if exists "categories_insert_auth" on public.categories;
create policy "categories_insert_auth" on public.categories
  for insert to authenticated with check (auth.uid() is not null and is_builtin = false);

drop policy if exists "categories_update_auth" on public.categories;
create policy "categories_update_auth" on public.categories
  for update to authenticated using (is_builtin = false) with check (is_builtin = false);

drop policy if exists "categories_delete_auth" on public.categories;
create policy "categories_delete_auth" on public.categories
  for delete to authenticated using (is_builtin = false);

-- ============ RECEIPTS ============
create table if not exists public.receipts (
  id uuid primary key default gen_random_uuid(),
  store_name text,
  purchase_date date not null,
  category_id uuid references public.categories(id) on delete set null,
  amount numeric not null,
  description text,
  photo_url text,
  items jsonb default '[]'::jsonb,
  created_by uuid references auth.users(id),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists receipts_purchase_date_idx on public.receipts(purchase_date desc);
create index if not exists receipts_category_id_idx on public.receipts(category_id);

alter table public.receipts enable row level security;

drop policy if exists "receipts_all_auth" on public.receipts;
create policy "receipts_all_auth" on public.receipts
  for all to authenticated using (true) with check (true);

-- Auto-update updated_at
create or replace function public.touch_updated_at() returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists receipts_touch_updated_at on public.receipts;
create trigger receipts_touch_updated_at
  before update on public.receipts
  for each row execute function public.touch_updated_at();

-- ============ AUTO-CREATE PROFILE PO SIGN-UP ============
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, name)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1))
  )
  on conflict (id) do nothing;
  return new;
end;
$$ language plpgsql security definer set search_path = public;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============ SEED 12 WBUDOWANYCH KATEGORII ============
insert into public.categories (slug, name, icon, color, is_builtin) values
  ('food',       'Jedzenie',              'shopping-cart', '#34d399', true),
  ('dining',     'Jedzenie poza domem',   'utensils',      '#fb923c', true),
  ('transport',  'Transport',             'car',           '#6366f1', true),
  ('fun',        'Rozrywka',              'gamepad-2',     '#8b5cf6', true),
  ('home',       'Dom',                   'home',          '#f59e0b', true),
  ('health',     'Zdrowie',               'heart-pulse',   '#f87171', true),
  ('kids',       'Dzieci',                'baby',          '#f472b6', true),
  ('travel',     'Wyjazdy',               'plane',         '#22d3ee', true),
  ('subs',       'Subskrypcje',           'smartphone',    '#a78bfa', true),
  ('loans',      'Spłaty rat',            'credit-card',   '#475569', true),
  ('extra',      'Dodatkowe wydatki',     'wallet',        '#14b8a6', true),
  ('other',      'Inne',                  'package',       '#94a3b8', true)
on conflict (slug) do update set
  name = excluded.name,
  icon = excluded.icon,
  color = excluded.color,
  is_builtin = excluded.is_builtin;

-- ============ MIGRACJA: nowe kategorie (jeśli baza już istnieje) ============
-- Uruchom ten fragment osobno w SQL Editor jeśli app jest już wdrożona:
-- insert into public.categories (slug, name, icon, color, is_builtin) values
--   ('dining', 'Jedzenie poza domem', 'utensils', '#fb923c', true),
--   ('extra',  'Dodatkowe wydatki',   'wallet',   '#14b8a6', true)
-- on conflict (slug) do update set
--   name = excluded.name, icon = excluded.icon, color = excluded.color, is_builtin = excluded.is_builtin;

-- ============ STORAGE BUCKET ============
-- Bucket `receipts` utwórz ręcznie w panelu Storage → New bucket → Public: ON.
-- Po utworzeniu uruchom poniższy SQL żeby ustawić polityki:

drop policy if exists "receipts_public_select" on storage.objects;
create policy "receipts_public_select" on storage.objects
  for select to public using (bucket_id = 'receipts');

drop policy if exists "receipts_auth_insert" on storage.objects;
create policy "receipts_auth_insert" on storage.objects
  for insert to authenticated with check (bucket_id = 'receipts');

drop policy if exists "receipts_auth_delete" on storage.objects;
create policy "receipts_auth_delete" on storage.objects
  for delete to authenticated using (bucket_id = 'receipts');

-- Gotowe. Po uruchomieniu skopiuj Project URL i anon key do config.local.js.
