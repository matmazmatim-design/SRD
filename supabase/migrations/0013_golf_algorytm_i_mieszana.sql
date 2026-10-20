-- Golf LA28: lista olimpijska liczona z Olympic Golf Ranking (OGR) i rywalizacja mieszana.
-- Dopóki nie wkleisz OGR w panelu, strona golfa mężczyzn pokazuje wgraną wcześniej symulację.
-- Można uruchomić ponownie.

-- Rywalizacja mieszana (16 drużyn: kobieta + mężczyzna z jednego kraju)
insert into public.konkurencje (dyscyplina_id, slug, nazwa, plec, miejsc, data_startu, opis)
select d.id, 'rywalizacja-mieszana', 'Golf – rywalizacja mieszana', 'X', 16, '2028-07-23',
       '16 drużyn: kobieta i mężczyzna z jednego kraju, oboje zakwalifikowani do turniejów indywidualnych. Debiut w programie igrzysk.'
from public.dyscypliny d where d.slug = 'golf'
on conflict (dyscyplina_id, slug) do nothing;

-- Źródła: Olympic Golf Ranking (wklejka ze strony IGF)
insert into public.zrodla_rankingow (slug, nazwa, typ, rodzaj, adres_strony) values
  ('ogr-m', 'Golf – Olympic Golf Ranking, mężczyźni', 'wklejka', 'indywidualny', 'https://igfgolf.org/olympic-golf-ranking/mens-olympic-golf-ranking'),
  ('ogr-k', 'Golf – Olympic Golf Ranking, kobiety', 'wklejka', 'indywidualny', 'https://igfgolf.org/olympic-golf-ranking/womens-olympic-golf-ranking')
on conflict (slug) do nothing;

-- Ustawienia algorytmu
update public.konkurencje k
set algorytm = case k.plec
  when 'M' then '{"typ":"golf-la28","zrodla":{"ogr":"ogr-m"},"gospodarz":"USA"}'::jsonb
  when 'K' then '{"typ":"golf-la28","zrodla":{"ogr":"ogr-k"},"gospodarz":"USA"}'::jsonb
  else '{"typ":"golf-la28-mieszana","gospodarz":"USA"}'::jsonb
end
from public.dyscypliny d
where d.id = k.dyscyplina_id and d.slug = 'golf' and k.algorytm is null;
