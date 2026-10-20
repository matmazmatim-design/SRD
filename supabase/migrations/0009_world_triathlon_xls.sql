-- Ranking sztafet mieszanych pobierany automatycznie z pliku eksportu triathlon.org.
update public.zrodla_rankingow
set typ = 'world_triathlon',
    parametry = jsonb_build_object('url', 'https://triathlon.org/api/rankings/64/export')
where slug = 'wt-sztafety' and typ = 'wklejka';
