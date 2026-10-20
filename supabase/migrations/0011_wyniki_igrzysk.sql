-- Wyniki igrzysk kontynentalnych (nowa flaga w triathlonie LA28).
-- Algorytm bierze z nich pierwszego zawodnika, którego kraj nie ma jeszcze miejsca.
create table if not exists public.wyniki_igrzysk (
  id bigint generated always as identity primary key,
  dyscyplina text not null default 'triathlon',
  plec text not null check (plec in ('K', 'M')),
  zawody text not null check (zawody in ('afryka', 'ameryki', 'azja', 'europa', 'oceania')),
  miejsce integer not null,
  zawodnik text not null,
  kraj text not null,                     -- kod MKOl, np. JPN
  dodano timestamptz not null default now(),
  unique (dyscyplina, plec, zawody, miejsce, zawodnik)
);

alter table public.wyniki_igrzysk enable row level security;
drop policy if exists "odczyt publiczny" on public.wyniki_igrzysk;
create policy "odczyt publiczny" on public.wyniki_igrzysk for select using (true);
drop policy if exists "zapis admin" on public.wyniki_igrzysk;
create policy "zapis admin" on public.wyniki_igrzysk for all to authenticated using (prywatne.jest_adminem()) with check (prywatne.jest_adminem());
grant select on public.wyniki_igrzysk to anon, authenticated;
grant insert, update, delete on public.wyniki_igrzysk to authenticated;

-- Igrzyska Azjatyckie 2026 (Gamagori, 20–21.09.2026) – na razie podium; pełne wyniki wklej w panelu.
insert into public.wyniki_igrzysk (plec, zawody, miejsce, zawodnik, kraj) values
  ('M', 'azja', 1, 'Takumi Hojo', 'JPN'),
  ('M', 'azja', 2, 'Xirui Zhang', 'CHN'),
  ('M', 'azja', 3, 'Arlan Zhanabay', 'KAZ'),
  ('K', 'azja', 1, 'Xinyu Lin', 'CHN'),
  ('K', 'azja', 2, 'Anqi Huang', 'CHN'),
  ('K', 'azja', 3, 'Manami Hayashi', 'JPN')
on conflict do nothing;
