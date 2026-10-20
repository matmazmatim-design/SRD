-- Golf mężczyzn: ranking pobierany automatycznie z API OWGR (codziennie nad ranem).
-- Zapisuje top 1000 i wszystkich Polaków. Anglia/Szkocja/Walia → Wielka Brytania, Irlandia Płn. → Irlandia.
update public.zrodla_rankingow
set typ = 'owgr',
    nazwa = 'Golf – ranking OWGR = OGR, mężczyźni (automatycznie)',
    parametry = '{"top": 1000, "nir": "IRL"}'::jsonb,
    adres_strony = 'https://www.owgr.com/current-world-ranking'
where slug = 'ogr-m';
