-- Golf kobiet: ranking pobierany automatycznie z pliku CSV rolexrankings.com (codziennie nad ranem).
alter table public.zrodla_rankingow drop constraint if exists zrodla_rankingow_typ_check;
alter table public.zrodla_rankingow add constraint zrodla_rankingow_typ_check
  check (typ in ('uci', 'world_triathlon', 'owgr', 'rolex', 'wklejka'));

update public.zrodla_rankingow
set typ = 'rolex',
    nazwa = 'Golf – ranking Rolex = OGR, kobiety (automatycznie)',
    parametry = '{"url": "https://www.rolexrankings.com/rolexrankings.csv", "nir": "IRL"}'::jsonb,
    adres_strony = 'https://www.rolexrankings.com/rankings'
where slug = 'ogr-k';
