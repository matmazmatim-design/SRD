-- Sportowy Rytm Dnia · Kwalifikacje LA28
-- 0001: schemat bazy i zasady dostępu.
-- Uruchom w Supabase: SQL Editor → New query → wklej całość → Run.

-- ─────────────────────────────────────────────────────────────
-- Administratorzy panelu redakcji (Twoje konto po pierwszym logowaniu)
-- ─────────────────────────────────────────────────────────────
create table if not exists public.admini (
  user_id uuid primary key references auth.users (id) on delete cascade,
  dodano timestamptz not null default now()
);

create or replace function public.jest_adminem()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (select 1 from public.admini where user_id = auth.uid());
$$;

-- ─────────────────────────────────────────────────────────────
-- Dyscypliny i konkurencje
-- ─────────────────────────────────────────────────────────────
create table if not exists public.dyscypliny (
  id smallint generated always as identity primary key,
  slug text not null unique,
  nazwa text not null,
  plakietka text check (plakietka in ('Nowość', 'Powrót')),
  sledzona boolean not null default false,
  opis_kafla text,
  kolejnosc smallint not null default 0
);

create table if not exists public.konkurencje (
  id smallint generated always as identity primary key,
  dyscyplina_id smallint not null references public.dyscypliny (id) on delete cascade,
  slug text not null,
  nazwa text not null,
  plec text not null check (plec in ('K', 'M', 'X')),   -- X = mieszana / drużyna mieszana
  miejsc smallint,                                      -- kwota startowa w LA28
  data_startu date,
  godzina text,
  miejsce text,
  opis text,
  unique (dyscyplina_id, slug)
);

-- ─────────────────────────────────────────────────────────────
-- Rankingi: źródła, notowania i wiersze notowań
-- ─────────────────────────────────────────────────────────────
create table if not exists public.zrodla_rankingow (
  id smallint generated always as identity primary key,
  slug text not null unique,
  nazwa text not null,
  typ text not null check (typ in ('uci', 'world_triathlon', 'owgr', 'wklejka')),
  parametry jsonb not null default '{}'::jsonb,         -- np. rankingId, filtry UCI
  adres_strony text,                                     -- link do źródła (podpis „Źródło”)
  konkurencja_id smallint references public.konkurencje (id) on delete set null,
  aktywne boolean not null default true
);

create table if not exists public.notowania (
  id bigint generated always as identity primary key,
  zrodlo_id smallint not null references public.zrodla_rankingow (id) on delete cascade,
  stan_na date not null,                                 -- data notowania („Stan na”)
  pobrano timestamptz not null default now(),
  liczba_wierszy integer not null default 0,
  status text not null default 'ok' check (status in ('ok', 'blad')),
  komunikat text
);
create index if not exists notowania_zrodlo_idx on public.notowania (zrodlo_id, pobrano desc);

create table if not exists public.wiersze_notowan (
  notowanie_id bigint not null references public.notowania (id) on delete cascade,
  pozycja integer not null,
  zawodnik text not null,
  kraj text,
  kod_kraju text,
  punkty numeric,
  dodatkowe jsonb,
  primary key (notowanie_id, pozycja, zawodnik)
);

-- ─────────────────────────────────────────────────────────────
-- Symulacje kwalifikacji (wynik przeliczenia zasad na rankingu)
-- ─────────────────────────────────────────────────────────────
create table if not exists public.symulacje (
  id bigint generated always as identity primary key,
  konkurencja_id smallint not null references public.konkurencje (id) on delete cascade,
  stan_na date not null,
  opis text,
  aktualna boolean not null default true,
  utworzono timestamptz not null default now()
);

create table if not exists public.wiersze_symulacji (
  symulacja_id bigint not null references public.symulacje (id) on delete cascade,
  lista text not null check (lista in ('zakwalifikowani', 'rezerwa', 'limit_kraju', 'polacy')),
  lp integer not null,                                   -- miejsce na liście (olimpijskiej / rezerwowej)
  pozycja_rankingu integer,                              -- np. OWGR, IOQR
  zawodnik text not null,
  kraj text,
  kontynent text,
  punkty numeric,
  sciezka text,                                          -- ścieżka kwalifikacji lub status
  primary key (symulacja_id, lista, lp)
);

-- ─────────────────────────────────────────────────────────────
-- Kwalifikacje wpisywane ręcznie w panelu (ze ścieżką)
-- ─────────────────────────────────────────────────────────────
create table if not exists public.kwalifikacje (
  id bigint generated always as identity primary key,
  konkurencja_id smallint not null references public.konkurencje (id) on delete cascade,
  zawodnik text not null,
  kraj text not null default 'Polska',
  sciezka text not null,
  status text not null default 'symulacja' check (status in ('potwierdzona', 'symulacja')),
  data_przyznania date,
  uwagi text,
  utworzono timestamptz not null default now(),
  zmieniono timestamptz not null default now()
);

-- ─────────────────────────────────────────────────────────────
-- Kalendarz kwalifikacji (terminy z regulaminów)
-- ─────────────────────────────────────────────────────────────
create table if not exists public.terminy (
  id bigint generated always as identity primary key,
  dyscyplina_id smallint not null references public.dyscypliny (id) on delete cascade,
  data_od date,
  data_do date,
  etykieta_daty text not null,                           -- jak pokazać datę, np. „czerwiec 2027”
  tytul text not null,
  opis text,
  typ text not null check (typ in ('okno', 'sztafety', 'kontynentalne', 'formalny', 'igrzyska')),
  kolejnosc smallint not null default 0
);

-- ─────────────────────────────────────────────────────────────
-- Zasady dostępu (RLS): wszyscy czytają, zapisują tylko admini.
-- Automat odświeżania używa klucza secret, który omija RLS.
-- ─────────────────────────────────────────────────────────────
do $$
declare t text;
begin
  foreach t in array array['dyscypliny','konkurencje','zrodla_rankingow','notowania','wiersze_notowan','symulacje','wiersze_symulacji','kwalifikacje','terminy']
  loop
    execute format('alter table public.%I enable row level security', t);
    execute format('drop policy if exists "odczyt publiczny" on public.%I', t);
    execute format('create policy "odczyt publiczny" on public.%I for select using (true)', t);
    execute format('drop policy if exists "zapis admin" on public.%I', t);
    execute format('create policy "zapis admin" on public.%I for all to authenticated using (public.jest_adminem()) with check (public.jest_adminem())', t);
  end loop;
end $$;

alter table public.admini enable row level security;
drop policy if exists "admin widzi siebie" on public.admini;
create policy "admin widzi siebie" on public.admini for select to authenticated using (user_id = auth.uid());

-- Wygodny widok: ostatnie udane notowanie każdego źródła
create or replace view public.ostatnie_notowania
with (security_invoker = true) as
select distinct on (n.zrodlo_id) n.*
from public.notowania n
where n.status = 'ok'
order by n.zrodlo_id, n.pobrano desc;
