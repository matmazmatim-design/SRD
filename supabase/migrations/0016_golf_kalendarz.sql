-- Golf LA28: kalendarz kwalifikacji i terminy turniejów (Riviera Country Club).
-- Źródła: system kwalifikacji IGF (LA28), harmonogram IGF/Golf Australia.
-- Można uruchomić ponownie: najpierw czyści terminy golfa.

delete from public.terminy t using public.dyscypliny d where d.id = t.dyscyplina_id and d.slug = 'golf';

insert into public.terminy (dyscyplina_id, data_od, data_do, etykieta_daty, tytul, opis, typ, kolejnosc)
select d.id, v.data_od::date, v.data_do::date, v.etykieta, v.tytul, v.opis, v.typ, v.kolejnosc
from (values
  ('2026-06-08', null, '08.06.2026', 'Start okresu kwalifikacji – kobiety', 'Od tego dnia liczy się Olympic Golf Ranking kobiet (ranking Rolex).', 'okno', 1),
  ('2026-06-22', null, '22.06.2026', 'Start okresu kwalifikacji – mężczyźni', 'Od tego dnia liczy się Olympic Golf Ranking mężczyzn (OWGR).', 'okno', 2),
  ('2028-06-05', null, '05.06.2028', 'Zamknięcie rankingów – kobiety', 'Ostatnie notowanie OGR kobiet. Lista olimpijska publikowana 6.06.2028.', 'okno', 3),
  ('2028-06-19', null, '19.06.2028', 'Zamknięcie rankingów – mężczyźni', 'Ostatnie notowanie OGR mężczyzn (lista 20.06). Tego dnia powstaje też ranking drużyn mieszanych (OMTR).', 'okno', 4),
  ('2028-06-22', null, '22.06.2028', 'Potwierdzenie miejsc przez komitety olimpijskie', 'Termin na przyjęcie miejsc w turniejach indywidualnych i w rywalizacji mieszanej.', 'formalny', 5),
  ('2028-06-24', null, '24.06.2028', 'Realokacja niewykorzystanych miejsc', 'Wolne miejsca przechodzą na kolejnych zawodników z OGR.', 'formalny', 6),
  ('2028-07-19', '2028-07-22', '19–22.07.2028', 'Turniej mężczyzn', 'Riviera Country Club, 4 rundy.', 'igrzyska', 7),
  ('2028-07-23', '2028-07-24', '23–24.07.2028', 'Rywalizacja mieszana', '16 drużyn: four-ball i foursomes.', 'igrzyska', 8),
  ('2028-07-26', '2028-07-29', '26–29.07.2028', 'Turniej kobiet', 'Riviera Country Club, 4 rundy.', 'igrzyska', 9)
) as v(data_od, data_do, etykieta, tytul, opis, typ, kolejnosc)
join public.dyscypliny d on d.slug = 'golf';

update public.konkurencje k
set data_startu = v.data::date, miejsce = 'Riviera Country Club'
from public.dyscypliny d, (values ('mezczyzni', '2028-07-19'), ('kobiety', '2028-07-26'), ('rywalizacja-mieszana', '2028-07-23')) as v(slug, data)
where d.id = k.dyscyplina_id and d.slug = 'golf' and k.slug = v.slug;
