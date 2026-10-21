-- Wspinaczka: zasada podwójnej kwalifikacji (boulder ↔ prowadzenie) w opisach konkurencji.
update public.konkurencje k
set opis = case when k.slug like 'boulder-%' then '12 zawodników. Maks. 2 z kraju. ' else '12 zawodników. Maks. 2 z kraju. ' end ||
  'Podwójna kwalifikacja: kto zdobędzie miejsce w boulderze, może startować też w prowadzeniu (i odwrotnie), jeśli kraj nie przekroczy limitu 2 zawodników. Taki zawodnik liczy się raz, a zwolnione miejsce przechodzi na kolejnego. Zrezygnowanie z jednego miejsca oznacza utratę obu.'
from public.dyscypliny d
where d.id = k.dyscyplina_id and d.slug = 'wspinaczka-sportowa' and (k.slug like 'boulder-%' or k.slug like 'prowadzenie-%');
