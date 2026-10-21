-- Badminton, baseball, softball, koszykówka 5x5 i 3x3 – tablice kwot LA28 i kalendarze.
-- Koszykówka dostaje poddyscypliny 5x5 i 3x3 (jak kolarstwo). Można uruchomić ponownie.
-- Źródła: systemy kwalifikacji BWF, WBSC i FIBA dla LA28 (wersje z 12.05.2026).

insert into public.dyscypliny (slug, nazwa, nadrzedna_id, kolejnosc)
select v.slug, v.nazwa, k.id, v.kol
from (values ('koszykowka-5x5', 'Koszykówka 5x5', 1), ('koszykowka-3x3', 'Koszykówka 3x3', 2)) as v(slug, nazwa, kol)
cross join (select id from public.dyscypliny where slug = 'koszykowka') k
on conflict (slug) do update set nadrzedna_id = excluded.nadrzedna_id, nazwa = excluded.nazwa;

update public.dyscypliny set opis_kafla = v.opis from (values
  ('badminton', 'Single, deble i mikst · ranking olimpijski BWF od 05.2027'),
  ('baseball', '6 drużyn · USA, Dominikana i Wenezuela już z miejscami'),
  ('softball', '6 drużyn · miejsca z turniejów 2027–2028'),
  ('koszykowka', 'Koszykówka 5x5 i 3x3'),
  ('koszykowka-5x5', 'Kobiety i mężczyźni · 12 drużyn'),
  ('koszykowka-3x3', 'Kobiety i mężczyźni · ranking krajów FIBA 3x3')
) as v(slug, opis) where dyscypliny.slug = v.slug;

insert into public.konkurencje (dyscyplina_id, slug, nazwa, plec, miejsc, data_startu, opis, algorytm)
select d.id, v.slug, v.nazwa, v.plec, v.miejsc, v.data::date, v.opis, v.alg::jsonb
from (values
  ('badminton', 'singiel-kobiet', 'Badminton – singiel kobiet', 'K', 38::smallint, null, '38 zawodników: 35 z rankingu olimpijskiego BWF, gospodarz i 2 miejsca uniwersalne.', '{"typ": "kwoty", "etykieta": "Singiel kobiet"}'),
  ('badminton', 'singiel-mezczyzn', 'Badminton – singiel mężczyzn', 'M', 38::smallint, null, '38 zawodników: 35 z rankingu olimpijskiego BWF, gospodarz i 2 miejsca uniwersalne.', '{"typ": "kwoty", "etykieta": "Singiel mężczyzn"}'),
  ('badminton', 'debel-kobiet', 'Badminton – debel kobiet', 'K', 16::smallint, null, '16 par z rankingu olimpijskiego BWF.', '{"typ": "kwoty", "etykieta": "Debel kobiet"}'),
  ('badminton', 'debel-mezczyzn', 'Badminton – debel mężczyzn', 'M', 16::smallint, null, '16 par z rankingu olimpijskiego BWF.', '{"typ": "kwoty", "etykieta": "Debel mężczyzn"}'),
  ('badminton', 'mikst', 'Badminton – mikst', 'X', 16::smallint, null, '16 par z rankingu olimpijskiego BWF.', '{"typ": "kwoty", "etykieta": "Mikst"}'),
  ('baseball', 'mezczyzni', 'Baseball – mężczyźni', 'M', 6::smallint, '2028-07-13', '6 drużyn po 24 zawodników. Turniej na Dodger Stadium.', '{"typ": "kwoty", "etykieta": "Mężczyźni"}'),
  ('softball', 'kobiety', 'Softball – kobiety', 'K', 6::smallint, null, '6 drużyn po 15 zawodniczek.', '{"typ": "kwoty", "etykieta": "Kobiety"}'),
  ('koszykowka-5x5', 'kobiety', 'Koszykówka 5x5 – kobiety', 'K', 12::smallint, null, '12 drużyn po 12 zawodniczek.', '{"typ": "kwoty", "etykieta": "Kobiety"}'),
  ('koszykowka-5x5', 'mezczyzni', 'Koszykówka 5x5 – mężczyźni', 'M', 12::smallint, null, '12 drużyn po 12 zawodników.', '{"typ": "kwoty", "etykieta": "Mężczyźni"}'),
  ('koszykowka-3x3', 'kobiety', 'Koszykówka 3x3 – kobiety', 'K', 12::smallint, '2028-07-16', '12 drużyn po 4 zawodników.', '{"typ": "kwoty", "etykieta": "Kobiety"}'),
  ('koszykowka-3x3', 'mezczyzni', 'Koszykówka 3x3 – mężczyźni', 'M', 12::smallint, '2028-07-16', '12 drużyn po 4 zawodników.', '{"typ": "kwoty", "etykieta": "Mężczyźni"}')
) as v(sport, slug, nazwa, plec, miejsc, data, opis, alg)
join public.dyscypliny d on d.slug = v.sport
on conflict (dyscyplina_id, slug) do update set algorytm = excluded.algorytm, opis = excluded.opis, nazwa = excluded.nazwa;

insert into public.kwoty (konkurencja_id, kolejnosc, sciezka, zawody, data_zawodow, liczba, kraj, status, uwagi)
select k.id, v.kol, v.sciezka, v.zawody, v.data::date, v.liczba, v.kraj, v.status, v.uwagi
from (values
  ('badminton', 'singiel-kobiet', 1, 'Ranking olimpijski BWF', 'Ranking olimpijski BWF (stan na 2.05.2028)', '2028-05-02', 35, null, 'pending', 'Maks. 2 z kraju, jeśli obaj są w top 16; min. 2 zawodników z każdego kontynentu (z top 250).'),
  ('badminton', 'singiel-kobiet', 2, 'Gospodarz', 'Stany Zjednoczone – gospodarz', null, 1, 'USA', 'pending', 'Tylko jeśli USA nie mają miejsca z rankingu.'),
  ('badminton', 'singiel-kobiet', 3, 'Miejsca uniwersalne', 'Komisja Trójstronna', null, 1, null, 'pending', 'Wnioski do 15.01.2028.'),
  ('badminton', 'singiel-kobiet', 4, 'Miejsca uniwersalne', 'Komisja Trójstronna', null, 1, null, 'pending', 'Wnioski do 15.01.2028.'),
  ('badminton', 'singiel-mezczyzn', 1, 'Ranking olimpijski BWF', 'Ranking olimpijski BWF (stan na 2.05.2028)', '2028-05-02', 35, null, 'pending', 'Maks. 2 z kraju, jeśli obaj są w top 16; min. 2 zawodników z każdego kontynentu (z top 250).'),
  ('badminton', 'singiel-mezczyzn', 2, 'Gospodarz', 'Stany Zjednoczone – gospodarz', null, 1, 'USA', 'pending', 'Tylko jeśli USA nie mają miejsca z rankingu.'),
  ('badminton', 'singiel-mezczyzn', 3, 'Miejsca uniwersalne', 'Komisja Trójstronna', null, 1, null, 'pending', 'Wnioski do 15.01.2028.'),
  ('badminton', 'singiel-mezczyzn', 4, 'Miejsca uniwersalne', 'Komisja Trójstronna', null, 1, null, 'pending', 'Wnioski do 15.01.2028.'),
  ('badminton', 'debel-kobiet', 1, 'Ranking olimpijski BWF', 'Ranking olimpijski BWF (stan na 2.05.2028)', '2028-05-02', 32, null, 'pending', '16 par. Maks. 2 pary z kraju, jeśli obie są w top 8; min. 1 para z każdego kontynentu (z top 50).'),
  ('badminton', 'debel-mezczyzn', 1, 'Ranking olimpijski BWF', 'Ranking olimpijski BWF (stan na 2.05.2028)', '2028-05-02', 32, null, 'pending', '16 par. Maks. 2 pary z kraju, jeśli obie są w top 8; min. 1 para z każdego kontynentu (z top 50).'),
  ('badminton', 'mikst', 1, 'Ranking olimpijski BWF', 'Ranking olimpijski BWF (stan na 2.05.2028)', '2028-05-02', 32, null, 'pending', '16 par. Maks. 2 pary z kraju, jeśli obie są w top 8; min. 1 para z każdego kontynentu (z top 50).'),
  ('baseball', 'mezczyzni', 1, 'Gospodarz', 'Stany Zjednoczone – gospodarz', null, 24, 'USA', 'ok', 'Miejsce zagwarantowane.'),
  ('baseball', 'mezczyzni', 2, 'World Baseball Classic 2026', 'World Baseball Classic 2026 – Ameryki', '2026-03-05', 24, 'DOM', 'ok', '2 najlepsze drużyny Ameryk bez kwalifikacji.'),
  ('baseball', 'mezczyzni', 3, 'World Baseball Classic 2026', 'World Baseball Classic 2026 – Ameryki', '2026-03-05', 24, 'VEN', 'ok', '2 najlepsze drużyny Ameryk bez kwalifikacji.'),
  ('baseball', 'mezczyzni', 4, 'Premier12 2027', 'Premier12 2027, Tokio – najlepsza drużyna Azji', '2027-11-01', 24, null, 'pending', null),
  ('baseball', 'mezczyzni', 5, 'Premier12 2027', 'Premier12 2027, Tokio – najlepsza drużyna Europy lub Oceanii', '2027-11-01', 24, null, 'pending', null),
  ('baseball', 'mezczyzni', 6, 'Turniej kwalifikacyjny', 'Finałowy turniej kwalifikacyjny (do marca 2028)', '2028-03-01', 24, null, 'pending', '6 drużyn: po 2 z mistrzostw Azji i Europy, 1 z Afryki i Oceanii.'),
  ('softball', 'kobiety', 1, 'Gospodarz', 'Stany Zjednoczone – gospodarz', null, 15, 'USA', 'ok', 'Miejsce zagwarantowane.'),
  ('softball', 'kobiety', 2, 'Puchar Świata 2027', 'Puchar Świata – finały 2027, Redcliffe', '2027-04-05', 15, null, 'pending', 'Najlepsza drużyna bez kwalifikacji.'),
  ('softball', 'kobiety', 3, 'Turnieje kontynentalne 2027', 'Turniej kwalifikacyjny Ameryk 2027', '2027-07-01', 15, null, 'pending', null),
  ('softball', 'kobiety', 4, 'Turnieje kontynentalne 2027', 'Turniej kwalifikacyjny Azji i Oceanii 2027, Shaoxing', '2027-07-01', 15, null, 'pending', null),
  ('softball', 'kobiety', 5, 'Turnieje kontynentalne 2027', 'Turniej kwalifikacyjny Europy i Afryki 2027, Barcelona', '2027-09-01', 15, null, 'pending', null),
  ('softball', 'kobiety', 6, 'Turniej kwalifikacyjny', 'Finałowy turniej kwalifikacyjny (do marca 2028)', '2028-03-01', 15, null, 'pending', 'Drużyny z miejsc 2–3 turniejów kontynentalnych.'),
  ('koszykowka-5x5', 'kobiety', 1, 'Gospodarz / mistrz świata', 'Stany Zjednoczone – gospodarz i mistrz świata 2026 (Berlin)', '2026-09-13', 12, 'USA', 'ok', 'USA wygrały MŚ 2026 (finał z Francją), więc 11 miejsc rozdają turnieje kwalifikacyjne.'),
  ('koszykowka-5x5', 'kobiety', 2, 'Turnieje kwalifikacyjne 2028', 'Olimpijskie turnieje kwalifikacyjne (luty 2028)', '2028-02-10', 12, null, 'pending', '16 drużyn w 4 grupach, awansują 3 najlepsze z grupy. Europa wystawia 6 drużyn z EuroBasketu 2027.'),
  ('koszykowka-5x5', 'kobiety', 3, 'Turnieje kwalifikacyjne 2028', 'Olimpijskie turnieje kwalifikacyjne (luty 2028)', '2028-02-10', 12, null, 'pending', '16 drużyn w 4 grupach, awansują 3 najlepsze z grupy. Europa wystawia 6 drużyn z EuroBasketu 2027.'),
  ('koszykowka-5x5', 'kobiety', 4, 'Turnieje kwalifikacyjne 2028', 'Olimpijskie turnieje kwalifikacyjne (luty 2028)', '2028-02-10', 12, null, 'pending', '16 drużyn w 4 grupach, awansują 3 najlepsze z grupy. Europa wystawia 6 drużyn z EuroBasketu 2027.'),
  ('koszykowka-5x5', 'kobiety', 5, 'Turnieje kwalifikacyjne 2028', 'Olimpijskie turnieje kwalifikacyjne (luty 2028)', '2028-02-10', 12, null, 'pending', '16 drużyn w 4 grupach, awansują 3 najlepsze z grupy. Europa wystawia 6 drużyn z EuroBasketu 2027.'),
  ('koszykowka-5x5', 'kobiety', 6, 'Turnieje kwalifikacyjne 2028', 'Olimpijskie turnieje kwalifikacyjne (luty 2028)', '2028-02-10', 12, null, 'pending', '16 drużyn w 4 grupach, awansują 3 najlepsze z grupy. Europa wystawia 6 drużyn z EuroBasketu 2027.'),
  ('koszykowka-5x5', 'kobiety', 7, 'Turnieje kwalifikacyjne 2028', 'Olimpijskie turnieje kwalifikacyjne (luty 2028)', '2028-02-10', 12, null, 'pending', '16 drużyn w 4 grupach, awansują 3 najlepsze z grupy. Europa wystawia 6 drużyn z EuroBasketu 2027.'),
  ('koszykowka-5x5', 'kobiety', 8, 'Turnieje kwalifikacyjne 2028', 'Olimpijskie turnieje kwalifikacyjne (luty 2028)', '2028-02-10', 12, null, 'pending', '16 drużyn w 4 grupach, awansują 3 najlepsze z grupy. Europa wystawia 6 drużyn z EuroBasketu 2027.'),
  ('koszykowka-5x5', 'kobiety', 9, 'Turnieje kwalifikacyjne 2028', 'Olimpijskie turnieje kwalifikacyjne (luty 2028)', '2028-02-10', 12, null, 'pending', '16 drużyn w 4 grupach, awansują 3 najlepsze z grupy. Europa wystawia 6 drużyn z EuroBasketu 2027.'),
  ('koszykowka-5x5', 'kobiety', 10, 'Turnieje kwalifikacyjne 2028', 'Olimpijskie turnieje kwalifikacyjne (luty 2028)', '2028-02-10', 12, null, 'pending', '16 drużyn w 4 grupach, awansują 3 najlepsze z grupy. Europa wystawia 6 drużyn z EuroBasketu 2027.'),
  ('koszykowka-5x5', 'kobiety', 11, 'Turnieje kwalifikacyjne 2028', 'Olimpijskie turnieje kwalifikacyjne (luty 2028)', '2028-02-10', 12, null, 'pending', '16 drużyn w 4 grupach, awansują 3 najlepsze z grupy. Europa wystawia 6 drużyn z EuroBasketu 2027.'),
  ('koszykowka-5x5', 'kobiety', 12, 'Turnieje kwalifikacyjne 2028', 'Olimpijskie turnieje kwalifikacyjne (luty 2028)', '2028-02-10', 12, null, 'pending', '16 drużyn w 4 grupach, awansują 3 najlepsze z grupy. Europa wystawia 6 drużyn z EuroBasketu 2027.'),
  ('koszykowka-5x5', 'mezczyzni', 1, 'Gospodarz', 'Stany Zjednoczone – gospodarz', null, 12, 'USA', 'pending', 'Po decyzji Zarządu Centralnego FIBA w 2027 r.'),
  ('koszykowka-5x5', 'mezczyzni', 2, 'Mistrzostwa świata 2027', 'Mistrzostwa świata 2027, Katar – najlepsze drużyny Afryki', '2027-08-27', 12, null, 'pending', null),
  ('koszykowka-5x5', 'mezczyzni', 3, 'Mistrzostwa świata 2027', 'Mistrzostwa świata 2027, Katar – najlepsze drużyny Ameryk', '2027-08-27', 12, null, 'pending', null),
  ('koszykowka-5x5', 'mezczyzni', 4, 'Mistrzostwa świata 2027', 'Mistrzostwa świata 2027, Katar – najlepsze drużyny Ameryk', '2027-08-27', 12, null, 'pending', null),
  ('koszykowka-5x5', 'mezczyzni', 5, 'Mistrzostwa świata 2027', 'Mistrzostwa świata 2027, Katar – najlepsze drużyny Azji', '2027-08-27', 12, null, 'pending', null),
  ('koszykowka-5x5', 'mezczyzni', 6, 'Mistrzostwa świata 2027', 'Mistrzostwa świata 2027, Katar – najlepsze drużyny Europy', '2027-08-27', 12, null, 'pending', null),
  ('koszykowka-5x5', 'mezczyzni', 7, 'Mistrzostwa świata 2027', 'Mistrzostwa świata 2027, Katar – najlepsze drużyny Europy', '2027-08-27', 12, null, 'pending', null),
  ('koszykowka-5x5', 'mezczyzni', 8, 'Mistrzostwa świata 2027', 'Mistrzostwa świata 2027, Katar – najlepsze drużyny Oceanii', '2027-08-27', 12, null, 'pending', null),
  ('koszykowka-5x5', 'mezczyzni', 9, 'Turnieje kwalifikacyjne 2028', 'Olimpijskie turnieje kwalifikacyjne (26.06–02.07.2028)', '2028-06-26', 12, null, 'pending', '24 drużyny w 4 turniejach, awansują zwycięzcy.'),
  ('koszykowka-5x5', 'mezczyzni', 10, 'Turnieje kwalifikacyjne 2028', 'Olimpijskie turnieje kwalifikacyjne (26.06–02.07.2028)', '2028-06-26', 12, null, 'pending', '24 drużyny w 4 turniejach, awansują zwycięzcy.'),
  ('koszykowka-5x5', 'mezczyzni', 11, 'Turnieje kwalifikacyjne 2028', 'Olimpijskie turnieje kwalifikacyjne (26.06–02.07.2028)', '2028-06-26', 12, null, 'pending', '24 drużyny w 4 turniejach, awansują zwycięzcy.'),
  ('koszykowka-5x5', 'mezczyzni', 12, 'Turnieje kwalifikacyjne 2028', 'Olimpijskie turnieje kwalifikacyjne (26.06–02.07.2028)', '2028-06-26', 12, null, 'pending', '24 drużyny w 4 turniejach, awansują zwycięzcy.'),
  ('koszykowka-3x3', 'kobiety', 1, 'Ranking krajów FIBA 3x3', 'Ranking krajów FIBA 3x3 (1.12.2027) – najlepszy kraj: Afryka', '2027-12-01', 4, null, 'pending', null),
  ('koszykowka-3x3', 'kobiety', 2, 'Ranking krajów FIBA 3x3', 'Ranking krajów FIBA 3x3 (1.12.2027) – najlepszy kraj: Europa', '2027-12-01', 4, null, 'pending', null),
  ('koszykowka-3x3', 'kobiety', 3, 'Ranking krajów FIBA 3x3', 'Ranking krajów FIBA 3x3 (1.12.2027) – najlepszy kraj: Ameryki', '2027-12-01', 4, null, 'pending', null),
  ('koszykowka-3x3', 'kobiety', 4, 'Ranking krajów FIBA 3x3', 'Ranking krajów FIBA 3x3 (1.12.2027) – Azja i Oceania', '2027-12-01', 4, null, 'pending', '2 najlepsze kraje, w tym min. 1 z Azji.'),
  ('koszykowka-3x3', 'kobiety', 5, 'Ranking krajów FIBA 3x3', 'Ranking krajów FIBA 3x3 (1.12.2027) – Azja i Oceania', '2027-12-01', 4, null, 'pending', '2 najlepsze kraje, w tym min. 1 z Azji.'),
  ('koszykowka-3x3', 'kobiety', 6, 'Turnieje kwalifikacyjne 2028', 'Turniej kwalifikacyjny 1 (uniwersalność) 2028', '2028-04-01', 4, null, 'pending', 'Dla krajów bez koszykówki 5x5 na 2 ostatnich igrzyskach.'),
  ('koszykowka-3x3', 'kobiety', 7, 'Turnieje kwalifikacyjne 2028', 'Turniej kwalifikacyjny 1 (uniwersalność) 2028', '2028-04-01', 4, null, 'pending', 'Dla krajów bez koszykówki 5x5 na 2 ostatnich igrzyskach.'),
  ('koszykowka-3x3', 'kobiety', 8, 'Turnieje kwalifikacyjne 2028', 'Turniej kwalifikacyjny 2 – 2028', '2028-04-01', 4, null, 'pending', null),
  ('koszykowka-3x3', 'kobiety', 9, 'Turnieje kwalifikacyjne 2028', 'Turniej kwalifikacyjny 2 – 2028', '2028-04-01', 4, null, 'pending', null),
  ('koszykowka-3x3', 'kobiety', 10, 'Turnieje kwalifikacyjne 2028', 'Olimpijska seria kwalifikacyjna 1 – 2028', '2028-05-01', 4, null, 'pending', null),
  ('koszykowka-3x3', 'kobiety', 11, 'Turnieje kwalifikacyjne 2028', 'Olimpijska seria kwalifikacyjna 2 – 2028', '2028-05-01', 4, null, 'pending', null),
  ('koszykowka-3x3', 'kobiety', 12, 'Gospodarz', 'Stany Zjednoczone – gospodarz', null, 4, 'USA', 'pending', 'Po decyzji Zarządu Centralnego FIBA.'),
  ('koszykowka-3x3', 'mezczyzni', 1, 'Ranking krajów FIBA 3x3', 'Ranking krajów FIBA 3x3 (1.12.2027) – najlepszy kraj: Afryka', '2027-12-01', 4, null, 'pending', null),
  ('koszykowka-3x3', 'mezczyzni', 2, 'Ranking krajów FIBA 3x3', 'Ranking krajów FIBA 3x3 (1.12.2027) – najlepszy kraj: Europa', '2027-12-01', 4, null, 'pending', null),
  ('koszykowka-3x3', 'mezczyzni', 3, 'Ranking krajów FIBA 3x3', 'Ranking krajów FIBA 3x3 (1.12.2027) – najlepszy kraj: Ameryki', '2027-12-01', 4, null, 'pending', null),
  ('koszykowka-3x3', 'mezczyzni', 4, 'Ranking krajów FIBA 3x3', 'Ranking krajów FIBA 3x3 (1.12.2027) – Azja i Oceania', '2027-12-01', 4, null, 'pending', '2 najlepsze kraje, w tym min. 1 z Azji.'),
  ('koszykowka-3x3', 'mezczyzni', 5, 'Ranking krajów FIBA 3x3', 'Ranking krajów FIBA 3x3 (1.12.2027) – Azja i Oceania', '2027-12-01', 4, null, 'pending', '2 najlepsze kraje, w tym min. 1 z Azji.'),
  ('koszykowka-3x3', 'mezczyzni', 6, 'Turnieje kwalifikacyjne 2028', 'Turniej kwalifikacyjny 1 (uniwersalność) 2028', '2028-04-01', 4, null, 'pending', 'Dla krajów bez koszykówki 5x5 na 2 ostatnich igrzyskach.'),
  ('koszykowka-3x3', 'mezczyzni', 7, 'Turnieje kwalifikacyjne 2028', 'Turniej kwalifikacyjny 1 (uniwersalność) 2028', '2028-04-01', 4, null, 'pending', 'Dla krajów bez koszykówki 5x5 na 2 ostatnich igrzyskach.'),
  ('koszykowka-3x3', 'mezczyzni', 8, 'Turnieje kwalifikacyjne 2028', 'Turniej kwalifikacyjny 2 – 2028', '2028-04-01', 4, null, 'pending', null),
  ('koszykowka-3x3', 'mezczyzni', 9, 'Turnieje kwalifikacyjne 2028', 'Turniej kwalifikacyjny 2 – 2028', '2028-04-01', 4, null, 'pending', null),
  ('koszykowka-3x3', 'mezczyzni', 10, 'Turnieje kwalifikacyjne 2028', 'Olimpijska seria kwalifikacyjna 1 – 2028', '2028-05-01', 4, null, 'pending', null),
  ('koszykowka-3x3', 'mezczyzni', 11, 'Turnieje kwalifikacyjne 2028', 'Olimpijska seria kwalifikacyjna 2 – 2028', '2028-05-01', 4, null, 'pending', null),
  ('koszykowka-3x3', 'mezczyzni', 12, 'Gospodarz', 'Stany Zjednoczone – gospodarz', null, 4, 'USA', 'pending', 'Po decyzji Zarządu Centralnego FIBA.')
) as v(sport, slug, kol, sciezka, zawody, data, liczba, kraj, status, uwagi)
join public.dyscypliny d on d.slug = v.sport
join public.konkurencje k on k.dyscyplina_id = d.id and k.slug = v.slug
where not exists (select 1 from public.kwoty x where x.konkurencja_id = k.id);

delete from public.terminy t using public.dyscypliny d
where d.id = t.dyscyplina_id and d.slug in ('badminton', 'baseball', 'softball', 'koszykowka-5x5', 'koszykowka-3x3');
insert into public.terminy (dyscyplina_id, data_od, data_do, etykieta_daty, tytul, opis, typ, kolejnosc)
select d.id, v.od::date, v.do_::date, v.etykieta, v.tytul, v.opis, v.typ, v.kol
from (values
  ('badminton', '2027-05-03', '2028-04-30', '03.05.2027–30.04.2028', 'Okres kwalifikacji (ranking olimpijski BWF)', 'Liczą się turnieje BWF, MŚ, mistrzostwa kontynentów; min. 3 turnieje w danej konkurencji.', 'okno', 1),
  ('badminton', '2028-01-15', null, '15.01.2028', 'Wnioski o miejsca uniwersalne', 'Termin zgłoszeń komitetów olimpijskich.', 'formalny', 2),
  ('badminton', '2028-05-02', null, '02.05.2028', 'Publikacja rankingu olimpijskiego', 'Na jego podstawie BWF rozdziela miejsca (10.05.2028).', 'okno', 3),
  ('badminton', '2028-06-23', null, '23.06.2028', 'Realokacja wolnych miejsc', 'Ostatni termin BWF.', 'formalny', 4),
  ('badminton', '2028-07-14', '2028-07-30', '14–30.07.2028', 'Igrzyska olimpijskie', 'Turniej badmintona w Los Angeles.', 'igrzyska', 5),
  ('baseball', '2026-03-05', '2026-03-17', '05–17.03.2026', 'World Baseball Classic', 'Dominikana i Wenezuela z miejscami (Ameryki).', 'okno', 1),
  ('baseball', '2027-11-01', '2027-11-30', 'listopad 2027', 'Premier12, Tokio', 'Najlepsza drużyna Azji i najlepsza z Europy/Oceanii.', 'okno', 2),
  ('baseball', '2028-03-01', null, 'do marca 2028', 'Finałowy turniej kwalifikacyjny', '1 miejsce. Prawo startu z mistrzostw Europy (2 drużyny).', 'okno', 3),
  ('baseball', '2028-07-13', '2028-07-19', '13–19.07.2028', 'Igrzyska olimpijskie', 'Dodger Stadium.', 'igrzyska', 4),
  ('softball', '2027-04-05', '2027-04-11', '05–11.04.2027', 'Puchar Świata – finały, Redcliffe', '1 miejsce.', 'okno', 1),
  ('softball', '2027-09-01', '2027-09-30', 'wrzesień 2027', 'Turniej Europy i Afryki, Barcelona', '1 miejsce; miejsca 2–3 do turnieju finałowego.', 'kontynentalne', 2),
  ('softball', '2028-03-01', null, 'do marca 2028', 'Finałowy turniej kwalifikacyjny', '1 miejsce.', 'okno', 3),
  ('softball', '2028-07-14', '2028-07-30', '14–30.07.2028', 'Igrzyska olimpijskie', 'Softball w Los Angeles.', 'igrzyska', 4),
  ('koszykowka-5x5', '2026-09-04', '2026-09-13', '04–13.09.2026', 'MŚ kobiet, Niemcy', 'Złoto USA – gospodarz i mistrz świata w jednym.', 'okno', 1),
  ('koszykowka-5x5', '2027-06-16', '2027-06-27', '16–27.06.2027', 'EuroBasket kobiet', '6 drużyn z Europy awansuje do turniejów kwalifikacyjnych – szansa Polek.', 'kontynentalne', 2),
  ('koszykowka-5x5', '2027-08-14', '2027-08-22', '14–22.08.2027', 'Turnieje pre-kwalifikacyjne mężczyzn', '5 drużyn do turniejów kwalifikacyjnych (Europa 2).', 'okno', 3),
  ('koszykowka-5x5', '2027-08-27', '2027-09-12', '27.08–12.09.2027', 'MŚ mężczyzn, Katar', '7 miejsc: Afryka 1, Ameryki 2, Azja 1, Europa 2, Oceania 1.', 'okno', 4),
  ('koszykowka-5x5', '2028-02-10', '2028-02-13', '10–13.02.2028', 'Turnieje kwalifikacyjne kobiet', '11 miejsc.', 'okno', 5),
  ('koszykowka-5x5', '2028-06-26', '2028-07-02', '26.06–02.07.2028', 'Turnieje kwalifikacyjne mężczyzn', '4 miejsca.', 'okno', 6),
  ('koszykowka-5x5', '2028-07-12', '2028-07-30', '12–30.07.2028', 'Igrzyska olimpijskie', 'Turnieje koszykówki w Los Angeles.', 'igrzyska', 7),
  ('koszykowka-3x3', '2026-01-01', '2027-12-01', '2026–01.12.2027', 'Okres rankingu krajów FIBA 3x3', 'Punkty 20 najlepszych zawodników kraju z dwóch lat.', 'okno', 1),
  ('koszykowka-3x3', '2027-12-01', null, '01.12.2027', 'Zamknięcie rankingów', 'Ranking krajów daje 5 miejsc na płeć.', 'okno', 2),
  ('koszykowka-3x3', '2028-04-01', null, '2028 – terminy wkrótce', 'Turnieje i serie kwalifikacyjne', '6 miejsc na płeć.', 'okno', 3),
  ('koszykowka-3x3', '2028-07-16', '2028-07-22', '16–22.07.2028', 'Igrzyska olimpijskie', 'Turniej 3x3 w Los Angeles.', 'igrzyska', 4)
) as v(sport, od, do_, etykieta, tytul, opis, typ, kol)
join public.dyscypliny d on d.slug = v.sport;
