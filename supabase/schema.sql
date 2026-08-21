-- Whalio — esquema de sincronização entre dispositivos.
-- Rode este SQL uma vez no seu projeto Supabase (SQL Editor → New query → Run).

create table if not exists public.categories (
  user_id uuid not null references auth.users (id) on delete cascade,
  id      text not null,
  name    text not null,
  icon    text not null default '💸',
  color   int  not null default 1,
  updated_at timestamptz not null default now(),
  primary key (user_id, id)
);

-- Coleções: agrupam lançamentos por grupo ("Meus gastos", "Gastos do sogro").
create table if not exists public.collections (
  user_id uuid not null references auth.users (id) on delete cascade,
  id      text not null,
  name    text not null,
  icon    text not null default '🙋',
  updated_at timestamptz not null default now(),
  primary key (user_id, id)
);

create table if not exists public.transactions (
  user_id     uuid not null references auth.users (id) on delete cascade,
  id          text not null,
  description text not null,
  amount      numeric(14, 2) not null check (amount > 0),
  currency    text not null check (currency in ('BRL', 'USD', 'EUR')),
  type        text not null check (type in ('expense', 'income')),
  category_id text not null,
  collection_id text,
  date        date not null,
  created_at  bigint not null,
  updated_at  timestamptz not null default now(),
  primary key (user_id, id)
);

create index if not exists transactions_user_date_idx
  on public.transactions (user_id, date desc);

-- Bancos criados antes das coleções: adiciona a coluna e adota tudo que existe.
alter table public.transactions
  add column if not exists collection_id text;

update public.transactions
   set collection_id = 'col-proprio'
 where collection_id is null;

-- Cada usuário só enxerga e escreve as próprias linhas.
alter table public.categories   enable row level security;
alter table public.collections  enable row level security;
alter table public.transactions enable row level security;

drop policy if exists "categories: own rows" on public.categories;
create policy "categories: own rows" on public.categories
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "collections: own rows" on public.collections;
create policy "collections: own rows" on public.collections
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "transactions: own rows" on public.transactions;
create policy "transactions: own rows" on public.transactions
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Realtime: é o que faz o celular atualizar sozinho quando você lança no PC.
-- (idempotente: pode rodar este arquivo de novo sem erro)
do $$
declare
  t text;
begin
  foreach t in array array['categories', 'collections', 'transactions'] loop
    if not exists (
      select 1 from pg_publication_tables
      where pubname = 'supabase_realtime'
        and schemaname = 'public'
        and tablename = t
    ) then
      execute format('alter publication supabase_realtime add table public.%I', t);
    end if;
  end loop;
end $$;
