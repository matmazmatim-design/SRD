-- Lista olimpijska w triathlonie liczona automatycznie z rankingów (algorytm LA28).
-- 1) kolumna z ustawieniami algorytmu i wpisami redakcji,
-- 2) źródła rankingów World Triathlon (wklejane w panelu),
-- 3) dane startowe: ranking sztafet z 12.10.2026 i IOQR mężczyzn z symulacji z 18.10.2026.
-- Można uruchomić ponownie.

alter table public.konkurencje add column if not exists algorytm jsonb;

insert into public.zrodla_rankingow (slug, nazwa, typ, rodzaj, adres_strony) values
  ('wt-ioqr-m', 'Triathlon – IOQR, mężczyźni', 'wklejka', 'indywidualny', 'https://triathlon.org/world-rankings/olympic/men'),
  ('wt-ioqr-k', 'Triathlon – IOQR, kobiety', 'wklejka', 'indywidualny', 'https://triathlon.org/world-rankings/olympic/women'),
  ('wt-sztafety', 'Triathlon – ranking sztafet mieszanych (MROQR)', 'wklejka', 'krajowy', 'https://triathlon.org/world-rankings/olympic-qualification/mixed-relay'),
  ('wt-ranking-m', 'Triathlon – ranking World Triathlon, mężczyźni', 'wklejka', 'indywidualny', 'https://triathlon.org/world-rankings'),
  ('wt-ranking-k', 'Triathlon – ranking World Triathlon, kobiety', 'wklejka', 'indywidualny', 'https://triathlon.org/world-rankings')
on conflict (slug) do nothing;

-- Ranking sztafet mieszanych z 12.10.2026 (tylko jeśli źródło nie ma jeszcze notowań)
with src as (select id from public.zrodla_rankingow where slug = 'wt-sztafety'),
n as (
  insert into public.notowania (zrodlo_id, stan_na, liczba_wierszy, status)
  select id, '2026-10-12', 44, 'ok' from src
  where not exists (select 1 from public.notowania where zrodlo_id = (select id from src))
  returning id
)
insert into public.wiersze_notowan (notowanie_id, pozycja, zawodnik, kod_kraju, punkty)
select n.id, v.pozycja, v.zawodnik, v.kod, v.punkty from n, (values
  (1, 'France', 'FRA', 2275.86),
  (2, 'Spain', 'ESP', 1912.15),
  (3, 'United States', 'USA', 1874.33),
  (4, 'Great Britain', 'GBR', 1871.19),
  (5, 'Hungary', 'HUN', 1864.71),
  (6, 'Germany', 'GER', 1751.78),
  (7, 'Italy', 'ITA', 1702.50),
  (8, 'Portugal', 'POR', 1690.68),
  (9, 'Canada', 'CAN', 1426.74),
  (10, 'Switzerland', 'SUI', 1196.14),
  (11, 'Australia', 'AUS', 1175.65),
  (12, 'Belgium', 'BEL', 1082.08),
  (13, 'Poland', 'POL', 1079.56),
  (14, 'Mexico', 'MEX', 1070.90),
  (15, 'Japan', 'JPN', 1062.47),
  (16, 'Brazil', 'BRA', 1038.04),
  (17, 'New Zealand', 'NZL', 1008.19),
  (18, 'Netherlands', 'NED', 881.80),
  (19, 'Luxembourg', 'LUX', 763.54),
  (20, 'South Africa', 'RSA', 677.86),
  (21, 'Hong Kong, China', 'HKG', 662.51),
  (22, 'South Korea', 'KOR', 660.63),
  (23, 'Czech Republic', 'CZE', 633.81),
  (24, 'Israel', 'ISR', 570.13),
  (25, 'China', 'CHN', 545.00),
  (26, 'Chile', 'CHI', 500.54),
  (27, 'Morocco', 'MAR', 471.75),
  (28, 'Mauritius', 'MRI', 436.37),
  (29, 'Indonesia', 'INA', 398.99),
  (30, 'Argentina', 'ARG', 396.15),
  (31, 'Russia', 'RUS', 395.73),
  (32, 'Chinese Taipei', 'TPE', 369.07),
  (33, 'Peru', 'PER', 366.44),
  (34, 'Kazakhstan', 'KAZ', 341.39),
  (35, 'Costa Rica', 'CRC', 338.96),
  (36, 'Uzbekistan', 'UZB', 315.78),
  (37, 'Colombia', 'COL', 313.54),
  (38, 'Philippines', 'PHI', 292.10),
  (39, 'Denmark', 'DEN', 275.72),
  (40, 'Singapore', 'SGP', 270.19),
  (41, 'Estonia', 'EST', 235.92),
  (42, 'Belarus', 'BLR', 218.22),
  (43, 'Sweden', 'SWE', 186.72),
  (44, 'Ukraine', 'UKR', 172.71)
) as v(pozycja, zawodnik, kod, punkty);

-- IOQR mężczyzn z symulacji z 18.10.2026 (zawodnicy z list symulacji – wklej pełny ranking w panelu)
with src as (select id from public.zrodla_rankingow where slug = 'wt-ioqr-m'),
sim as (
  select s.id from public.symulacje s
  join public.konkurencje k on k.id = s.konkurencja_id
  join public.dyscypliny d on d.id = k.dyscyplina_id
  where d.slug = 'triathlon' and k.slug = 'mezczyzni'
  order by s.utworzono desc limit 1
),
rows as (
  select distinct on (w.zawodnik) w.pozycja_rankingu as pozycja, w.zawodnik, w.kraj as kod, w.punkty
  from public.wiersze_symulacji w, sim
  where w.symulacja_id = sim.id and w.pozycja_rankingu is not null
  order by w.zawodnik, w.pozycja_rankingu
),
n as (
  insert into public.notowania (zrodlo_id, stan_na, liczba_wierszy, status)
  select id, '2026-10-18', (select count(*) from rows), 'ok' from src
  where not exists (select 1 from public.notowania where zrodlo_id = (select id from src))
    and exists (select 1 from rows)
  returning id
)
insert into public.wiersze_notowan (notowanie_id, pozycja, zawodnik, kod_kraju, punkty)
select n.id, rows.pozycja, rows.zawodnik, rows.kod, rows.punkty from n, rows;

-- Ustawienia algorytmu dla triathlonu kobiet i mężczyzn (nie nadpisuje wpisów z panelu)
update public.konkurencje k
set algorytm = jsonb_build_object(
  'typ', 'triathlon-la28',
  'zrodla', jsonb_build_object('ioqr', case k.plec when 'M' then 'wt-ioqr-m' else 'wt-ioqr-k' end, 'sztafety', 'wt-sztafety', 'ranking', null),
  'gospodarz', 'USA',
  'ms2026', 'FRA',
  'ms2027', '',
  'uniwersalne', '',
  'igrzyska', jsonb_build_object('afryka', '', 'ameryki', '', 'azja', '', 'europa', '', 'oceania', '')
)
from public.dyscypliny d
where d.id = k.dyscyplina_id and d.slug = 'triathlon' and k.plec in ('K', 'M') and k.algorytm is null;
