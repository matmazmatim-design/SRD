-- Sportowy Rytm Dnia · Kwalifikacje LA28
-- 0005: poddyscypliny (np. Kolarstwo → Kolarstwo górskie). Uruchom PO 0004.
-- Uruchom w Supabase: SQL Editor → New query → wklej całość → Run. Można uruchomić ponownie.

alter table public.dyscypliny
  add column if not exists nadrzedna_id smallint references public.dyscypliny (id) on delete cascade;

-- Poddyscypliny kolarstwa w programie LA28
insert into public.dyscypliny (slug, nazwa, nadrzedna_id, kolejnosc)
select v.slug, v.nazwa, k.id, v.kolejnosc
from (values
  ('kolarstwo-szosowe', 'Kolarstwo szosowe', 1),
  ('kolarstwo-torowe', 'Kolarstwo torowe', 2),
  ('kolarstwo-gorskie', 'Kolarstwo górskie', 3),
  ('bmx-wyscigi', 'BMX – wyścigi', 4),
  ('bmx-freestyle', 'BMX – freestyle', 5)
) as v(slug, nazwa, kolejnosc)
cross join (select id from public.dyscypliny where slug = 'kolarstwo') k
on conflict (slug) do update set nadrzedna_id = excluded.nadrzedna_id, nazwa = excluded.nazwa;

-- Konkurencje MTB przechodzą z „Kolarstwa” do „Kolarstwa górskiego”
update public.konkurencje k
set dyscyplina_id = g.id,
    slug = case k.slug when 'mtb-xco-kobiety' then 'kobiety' when 'mtb-xco-mezczyzni' then 'mezczyzni' else k.slug end,
    nazwa = case k.slug when 'mtb-xco-kobiety' then 'Cross-country (XCO) kobiet' when 'mtb-xco-mezczyzni' then 'Cross-country (XCO) mężczyzn' else k.nazwa end
from public.dyscypliny g, public.dyscypliny kol
where g.slug = 'kolarstwo-gorskie' and kol.slug = 'kolarstwo'
  and k.dyscyplina_id = kol.id and k.slug in ('mtb-xco-kobiety', 'mtb-xco-mezczyzni');

-- Kafel „Kolarstwo” z opisem, co jest w środku
update public.dyscypliny set opis_kafla = 'Szosa, tor, MTB, BMX · ranking MTB dostępny' where slug = 'kolarstwo';
