-- Łucznictwo: ranking drużyn mieszanych (łuk bloczkowy) z API World Archery, pobierany co noc.
-- Daje 2 miejsca najwyżej sklasyfikowanym krajom bez kwalifikacji z innych zawodów.
alter table public.zrodla_rankingow drop constraint if exists zrodla_rankingow_typ_check;
alter table public.zrodla_rankingow add constraint zrodla_rankingow_typ_check
  check (typ in ('uci', 'world_triathlon', 'owgr', 'rolex', 'worldarchery', 'wklejka'));

insert into public.zrodla_rankingow (slug, nazwa, typ, rodzaj, parametry, adres_strony, konkurencja_id, zasady)
select 'wa-cx', 'Łucznictwo – ranking drużyn mieszanych, łuk bloczkowy (World Archery)', 'worldarchery', 'krajowy',
  '{"url": "https://api.worldarchery.org/v3/WORLDRANKINGS/?CatCode=CX&Detailed=0&SortBy=RANKING&Team=1"}'::jsonb,
  'https://www.worldarchery.sport/world-rankings',
  k.id,
  '{"algorytm": "kwoty-ranking", "sciezka": "Ranking światowy", "miejsc": 2, "pozostali": "Ostatnia szansa: światowy turniej kwalifikacyjny 2028 (1 para).", "regulamin": "https://cdn.dosb.de/Relaunch_2024/Athletenservice/Games/LA_2028/Internationale_Qualikriterien/Updates_11082026/ARC-LA28-Qualification-System_20260810.pdf"}'::jsonb
from public.konkurencje k join public.dyscypliny d on d.id = k.dyscyplina_id
where d.slug = 'lucznictwo' and k.slug = 'mieszana-bloczkowy'
on conflict (slug) do nothing;
