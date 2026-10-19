-- Sportowy Rytm Dnia · Kwalifikacje LA28
-- 0004: rankingi źródłowe widoczne na stronach konkurencji.
-- Uruchom w Supabase: SQL Editor → New query → wklej całość → Run.

-- Rodzaj rankingu: zawodników (indywidualny) albo krajów (krajowy – kwoty dla NOC, np. MTB).
alter table public.zrodla_rankingow
  add column if not exists rodzaj text not null default 'indywidualny'
  check (rodzaj in ('indywidualny', 'krajowy'));

-- Konkurencje kolarstwa górskiego w LA28.
insert into public.konkurencje (dyscyplina_id, slug, nazwa, plec, opis)
select d.id, v.slug, v.nazwa, v.plec, v.opis
from (values
  ('mtb-xco-kobiety', 'Kolarstwo górskie (XCO) kobiet', 'K', 'Cross-country olimpijski. Miejsca dostają kraje według rankingu olimpijskiego UCI.'),
  ('mtb-xco-mezczyzni', 'Kolarstwo górskie (XCO) mężczyzn', 'M', 'Cross-country olimpijski. Miejsca dostają kraje według rankingu olimpijskiego UCI.')
) as v(slug, nazwa, plec, opis)
join public.dyscypliny d on d.slug = 'kolarstwo'
on conflict (dyscyplina_id, slug) do nothing;

-- Ranking MTB mężczyzn: przypięty do konkurencji, to ranking krajów.
update public.zrodla_rankingow z
set konkurencja_id = k.id, rodzaj = 'krajowy'
from public.konkurencje k
join public.dyscypliny d on d.id = k.dyscyplina_id
where z.slug = 'uci-mtb-xco-m' and d.slug = 'kolarstwo' and k.slug = 'mtb-xco-mezczyzni';
