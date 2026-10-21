-- Piłka nożna i hokej na trawie – tablice kwot LA28 i kalendarze. Można uruchomić ponownie.
-- Źródła: system kwalifikacji FIH dla LA28; podział miejsc FIFA wg konfederacji;
-- wyniki: FIH Pro League 2025/26, Igrzyska Azjatyckie 2026, Copa América Femenina 2025, mistrzostwa CONCACAF U-20 2026.

update public.dyscypliny set opis_kafla = v.opis from (values
  ('pilka-nozna', 'Mężczyźni 12 drużyn (U-23), kobiety 16 · Polki: Liga Narodów 2027'),
  ('hokej-na-trawie', 'Kobiety i mężczyźni · 12 drużyn · ME 2027 w Londynie')
) as v(slug, opis) where dyscypliny.slug = v.slug;

insert into public.konkurencje (dyscyplina_id, slug, nazwa, plec, miejsc, data_startu, opis, algorytm)
select d.id, v.slug, v.nazwa, v.plec, v.miejsc, v.data::date, v.opis, v.alg::jsonb
from (values
  ('pilka-nozna', 'mezczyzni', 'Piłka nożna – mężczyźni', 'M', 12::smallint, null, '12 drużyn (zawodnicy do lat 23, z wyjątkami). Miejsca wg konfederacji: UEFA 3 (ME U-21 2027), AFC 2, CAF 2, CONMEBOL 2, CONCACAF 1, OFC 1, gospodarz.', '{"typ": "kwoty", "etykieta": "Mężczyźni"}'),
  ('pilka-nozna', 'kobiety', 'Piłka nożna – kobiety', 'K', 16::smallint, null, '16 drużyn. Miejsca wg konfederacji: UEFA 4 (Liga Narodów 2027), CONCACAF 3, AFC 2, CAF 2, CONMEBOL 2, OFC 1, baraż AFC–CONMEBOL, gospodarz.', '{"typ": "kwoty", "etykieta": "Kobiety"}'),
  ('hokej-na-trawie', 'kobiety', 'Hokej na trawie – kobiety', 'K', 12::smallint, null, '12 drużyn po 16 zawodników: gospodarz, 2 z FIH Pro League, 5 mistrzów kontynentów i 4 z turniejów kwalifikacyjnych.', '{"typ": "kwoty", "etykieta": "Kobiety"}'),
  ('hokej-na-trawie', 'mezczyzni', 'Hokej na trawie – mężczyźni', 'M', 12::smallint, null, '12 drużyn po 16 zawodników: gospodarz, 2 z FIH Pro League, 5 mistrzów kontynentów i 4 z turniejów kwalifikacyjnych.', '{"typ": "kwoty", "etykieta": "Mężczyźni"}')
) as v(sport, slug, nazwa, plec, miejsc, data, opis, alg)
join public.dyscypliny d on d.slug = v.sport
on conflict (dyscyplina_id, slug) do update set algorytm = excluded.algorytm, opis = excluded.opis, nazwa = excluded.nazwa, miejsc = excluded.miejsc;

insert into public.kwoty (konkurencja_id, kolejnosc, sciezka, zawody, data_zawodow, liczba, kraj, status, uwagi)
select k.id, v.kol, v.sciezka, v.zawody, v.data::date, v.liczba, v.kraj, v.status, v.uwagi
from (values
  ('pilka-nozna', 'mezczyzni', 1, 'Gospodarz', 'Stany Zjednoczone – gospodarz', null, 18, 'USA', 'ok', null),
  ('pilka-nozna', 'mezczyzni', 2, 'CONCACAF', 'Mistrzostwa CONCACAF U-20 2026, Meksyk', '2026-07-25', 18, 'MEX', 'ok', null),
  ('pilka-nozna', 'mezczyzni', 3, 'UEFA', 'Mistrzostwa Europy U-21 2027, Albania i Serbia', '2027-06-01', 18, null, 'pending', 'Szansa Polski – najpierw awans do turnieju finałowego ME U-21.'),
  ('pilka-nozna', 'mezczyzni', 4, 'UEFA', 'Mistrzostwa Europy U-21 2027, Albania i Serbia', '2027-06-01', 18, null, 'pending', 'Szansa Polski – najpierw awans do turnieju finałowego ME U-21.'),
  ('pilka-nozna', 'mezczyzni', 5, 'UEFA', 'Mistrzostwa Europy U-21 2027, Albania i Serbia', '2027-06-01', 18, null, 'pending', 'Szansa Polski – najpierw awans do turnieju finałowego ME U-21.'),
  ('pilka-nozna', 'mezczyzni', 6, 'CONMEBOL', 'Turniej kwalifikacyjny CONMEBOL', null, 18, null, 'pending', null),
  ('pilka-nozna', 'mezczyzni', 7, 'CONMEBOL', 'Turniej kwalifikacyjny CONMEBOL', null, 18, null, 'pending', null),
  ('pilka-nozna', 'mezczyzni', 8, 'CAF', 'Puchar Narodów Afryki U-23 2027', null, 18, null, 'pending', null),
  ('pilka-nozna', 'mezczyzni', 9, 'CAF', 'Puchar Narodów Afryki U-23 2027', null, 18, null, 'pending', null),
  ('pilka-nozna', 'mezczyzni', 10, 'AFC', 'Puchar Azji U-23 2028', null, 18, null, 'pending', null),
  ('pilka-nozna', 'mezczyzni', 11, 'AFC', 'Puchar Azji U-23 2028', null, 18, null, 'pending', null),
  ('pilka-nozna', 'mezczyzni', 12, 'OFC', 'Turniej kwalifikacyjny OFC', null, 18, null, 'pending', null),
  ('pilka-nozna', 'kobiety', 1, 'Gospodarz', 'Stany Zjednoczone – gospodarz', null, 18, 'USA', 'ok', null),
  ('pilka-nozna', 'kobiety', 2, 'CONMEBOL', 'Copa América Femenina 2025, Ekwador', '2025-07-11', 18, 'BRA', 'ok', null),
  ('pilka-nozna', 'kobiety', 3, 'CONMEBOL', 'Copa América Femenina 2025, Ekwador', '2025-07-11', 18, 'COL', 'ok', null),
  ('pilka-nozna', 'kobiety', 4, 'CONCACAF', 'Mistrzostwa CONCACAF W 2026, USA', '2026-11-27', 18, null, 'pending', 'Gdyby USA były w czołówce, miejsce przechodzi na kolejną drużynę.'),
  ('pilka-nozna', 'kobiety', 5, 'CONCACAF', 'Mistrzostwa CONCACAF W 2026, USA', '2026-11-27', 18, null, 'pending', 'Gdyby USA były w czołówce, miejsce przechodzi na kolejną drużynę.'),
  ('pilka-nozna', 'kobiety', 6, 'CONCACAF', 'Mistrzostwa CONCACAF W 2026, USA', '2026-11-27', 18, null, 'pending', 'Gdyby USA były w czołówce, miejsce przechodzi na kolejną drużynę.'),
  ('pilka-nozna', 'kobiety', 7, 'UEFA', 'Liga Narodów UEFA kobiet 2027', '2027-02-01', 18, null, 'pending', 'Szansa Polski.'),
  ('pilka-nozna', 'kobiety', 8, 'UEFA', 'Liga Narodów UEFA kobiet 2027', '2027-02-01', 18, null, 'pending', 'Szansa Polski.'),
  ('pilka-nozna', 'kobiety', 9, 'UEFA', 'Liga Narodów UEFA kobiet 2027', '2027-02-01', 18, null, 'pending', 'Szansa Polski.'),
  ('pilka-nozna', 'kobiety', 10, 'UEFA', 'Liga Narodów UEFA kobiet 2027', '2027-02-01', 18, null, 'pending', 'Szansa Polski.'),
  ('pilka-nozna', 'kobiety', 11, 'AFC', 'Azjatycki turniej kwalifikacyjny 2027', '2027-04-19', 18, null, 'pending', null),
  ('pilka-nozna', 'kobiety', 12, 'AFC', 'Azjatycki turniej kwalifikacyjny 2027', '2027-04-19', 18, null, 'pending', null),
  ('pilka-nozna', 'kobiety', 13, 'CAF', 'Afrykański turniej kwalifikacyjny 2026–2027', '2026-06-04', 18, null, 'pending', null),
  ('pilka-nozna', 'kobiety', 14, 'CAF', 'Afrykański turniej kwalifikacyjny 2026–2027', '2026-06-04', 18, null, 'pending', null),
  ('pilka-nozna', 'kobiety', 15, 'OFC', 'Turniej kwalifikacyjny OFC 2028', null, 18, null, 'pending', null),
  ('pilka-nozna', 'kobiety', 16, 'Baraż', 'Baraż AFC–CONMEBOL', null, 18, null, 'pending', null),
  ('hokej-na-trawie', 'kobiety', 1, 'Gospodarz', 'Stany Zjednoczone – gospodarz', null, 16, 'USA', 'ok', 'Warunek: USA w top 25 rankingu FIH po Paryżu 2024. Spełniony.'),
  ('hokej-na-trawie', 'kobiety', 2, 'FIH Pro League', 'FIH Pro League 2025/26', '2025-12-09', 16, 'NED', 'ok', null),
  ('hokej-na-trawie', 'kobiety', 3, 'FIH Pro League', 'FIH Pro League 2026/27', '2026-12-08', 16, null, 'pending', null),
  ('hokej-na-trawie', 'kobiety', 4, 'Mistrzostwa kontynentów', 'Igrzyska Azjatyckie 2026', '2026-09-19', 16, 'IND', 'ok', null),
  ('hokej-na-trawie', 'kobiety', 5, 'Mistrzostwa kontynentów', 'Igrzyska Panamerykańskie 2027, Lima', '2027-07-16', 16, null, 'pending', null),
  ('hokej-na-trawie', 'kobiety', 6, 'Mistrzostwa kontynentów', 'Mistrzostwa Europy 2027, Londyn', '2027-07-28', 16, null, 'pending', 'Najlepsza drużyna jeszcze bez miejsca.'),
  ('hokej-na-trawie', 'kobiety', 7, 'Mistrzostwa kontynentów', 'Puchar Oceanii 2027', null, 16, null, 'pending', null),
  ('hokej-na-trawie', 'kobiety', 8, 'Mistrzostwa kontynentów', 'Kwalifikacja afrykańska 2027', null, 16, null, 'pending', null),
  ('hokej-na-trawie', 'kobiety', 9, 'Turnieje kwalifikacyjne', 'Olimpijskie turnieje kwalifikacyjne', '2028-03-01', 16, null, 'pending', '2 turnieje po 8 drużyn, po 2 awansują. Zaproszenia wg rankingu FIH i kwot kontynentalnych – szansa Polski.'),
  ('hokej-na-trawie', 'kobiety', 10, 'Turnieje kwalifikacyjne', 'Olimpijskie turnieje kwalifikacyjne', '2028-03-01', 16, null, 'pending', '2 turnieje po 8 drużyn, po 2 awansują. Zaproszenia wg rankingu FIH i kwot kontynentalnych – szansa Polski.'),
  ('hokej-na-trawie', 'kobiety', 11, 'Turnieje kwalifikacyjne', 'Olimpijskie turnieje kwalifikacyjne', '2028-03-01', 16, null, 'pending', '2 turnieje po 8 drużyn, po 2 awansują. Zaproszenia wg rankingu FIH i kwot kontynentalnych – szansa Polski.'),
  ('hokej-na-trawie', 'kobiety', 12, 'Turnieje kwalifikacyjne', 'Olimpijskie turnieje kwalifikacyjne', '2028-03-01', 16, null, 'pending', '2 turnieje po 8 drużyn, po 2 awansują. Zaproszenia wg rankingu FIH i kwot kontynentalnych – szansa Polski.'),
  ('hokej-na-trawie', 'mezczyzni', 1, 'Gospodarz', 'Stany Zjednoczone – gospodarz', null, 16, 'USA', 'pending', 'Warunek: USA w top 25 rankingu FIH po Paryżu 2024.'),
  ('hokej-na-trawie', 'mezczyzni', 2, 'FIH Pro League', 'FIH Pro League 2025/26', '2025-12-09', 16, 'BEL', 'ok', null),
  ('hokej-na-trawie', 'mezczyzni', 3, 'FIH Pro League', 'FIH Pro League 2026/27', '2026-12-08', 16, null, 'pending', null),
  ('hokej-na-trawie', 'mezczyzni', 4, 'Mistrzostwa kontynentów', 'Igrzyska Azjatyckie 2026', '2026-09-19', 16, 'IND', 'ok', null),
  ('hokej-na-trawie', 'mezczyzni', 5, 'Mistrzostwa kontynentów', 'Igrzyska Panamerykańskie 2027, Lima', '2027-07-16', 16, null, 'pending', null),
  ('hokej-na-trawie', 'mezczyzni', 6, 'Mistrzostwa kontynentów', 'Mistrzostwa Europy 2027, Londyn', '2027-07-28', 16, null, 'pending', 'Najlepsza drużyna jeszcze bez miejsca.'),
  ('hokej-na-trawie', 'mezczyzni', 7, 'Mistrzostwa kontynentów', 'Puchar Oceanii 2027', null, 16, null, 'pending', null),
  ('hokej-na-trawie', 'mezczyzni', 8, 'Mistrzostwa kontynentów', 'Kwalifikacja afrykańska 2027', null, 16, null, 'pending', null),
  ('hokej-na-trawie', 'mezczyzni', 9, 'Turnieje kwalifikacyjne', 'Olimpijskie turnieje kwalifikacyjne', '2028-03-01', 16, null, 'pending', '2 turnieje po 8 drużyn, po 2 awansują. Zaproszenia wg rankingu FIH i kwot kontynentalnych – szansa Polski.'),
  ('hokej-na-trawie', 'mezczyzni', 10, 'Turnieje kwalifikacyjne', 'Olimpijskie turnieje kwalifikacyjne', '2028-03-01', 16, null, 'pending', '2 turnieje po 8 drużyn, po 2 awansują. Zaproszenia wg rankingu FIH i kwot kontynentalnych – szansa Polski.'),
  ('hokej-na-trawie', 'mezczyzni', 11, 'Turnieje kwalifikacyjne', 'Olimpijskie turnieje kwalifikacyjne', '2028-03-01', 16, null, 'pending', '2 turnieje po 8 drużyn, po 2 awansują. Zaproszenia wg rankingu FIH i kwot kontynentalnych – szansa Polski.'),
  ('hokej-na-trawie', 'mezczyzni', 12, 'Turnieje kwalifikacyjne', 'Olimpijskie turnieje kwalifikacyjne', '2028-03-01', 16, null, 'pending', '2 turnieje po 8 drużyn, po 2 awansują. Zaproszenia wg rankingu FIH i kwot kontynentalnych – szansa Polski.')
) as v(sport, slug, kol, sciezka, zawody, data, liczba, kraj, status, uwagi)
join public.dyscypliny d on d.slug = v.sport
join public.konkurencje k on k.dyscyplina_id = d.id and k.slug = v.slug
where not exists (select 1 from public.kwoty x where x.konkurencja_id = k.id);

delete from public.terminy t using public.dyscypliny d
where d.id = t.dyscyplina_id and d.slug in ('pilka-nozna', 'hokej-na-trawie');
insert into public.terminy (dyscyplina_id, data_od, data_do, etykieta_daty, tytul, opis, typ, kolejnosc)
select d.id, v.od::date, v.do_::date, v.etykieta, v.tytul, v.opis, v.typ, v.kol
from (values
  ('pilka-nozna', '2025-07-11', '2025-08-02', '11.07–02.08.2025', 'Copa América Femenina, Ekwador', 'Brazylia i Kolumbia z miejscami.', 'kontynentalne', 1),
  ('pilka-nozna', '2026-07-25', '2026-08-09', '25.07–09.08.2026', 'Mistrzostwa CONCACAF U-20, Meksyk', 'Meksyk z miejscem u mężczyzn.', 'kontynentalne', 2),
  ('pilka-nozna', '2026-11-27', '2026-12-05', '27.11–05.12.2026', 'Mistrzostwa CONCACAF W, USA', '3 miejsca u kobiet.', 'kontynentalne', 3),
  ('pilka-nozna', '2027-02-01', '2027-12-31', '2027', 'Liga Narodów UEFA kobiet', '4 miejsca dla Europy – szansa Polek.', 'kontynentalne', 4),
  ('pilka-nozna', '2027-06-01', '2027-06-30', 'czerwiec 2027', 'ME U-21, Albania i Serbia', '3 miejsca dla Europy – szansa Polski.', 'kontynentalne', 5),
  ('pilka-nozna', '2028-07-14', '2028-07-30', '14–30.07.2028', 'Igrzyska olimpijskie', 'Piłka nożna w Los Angeles i innych miastach USA.', 'igrzyska', 6),
  ('hokej-na-trawie', '2025-12-09', '2026-06-28', '09.12.2025–28.06.2026', 'FIH Pro League 2025/26', 'Belgia (M) i Holandia (K) z miejscami.', 'okno', 1),
  ('hokej-na-trawie', '2026-09-19', '2026-10-04', '19.09–04.10.2026', 'Igrzyska Azjatyckie', 'Indie z miejscami u kobiet i mężczyzn.', 'kontynentalne', 2),
  ('hokej-na-trawie', '2026-12-08', '2027-06-20', '08.12.2026–20.06.2027', 'FIH Pro League 2026/27', 'Po 1 miejscu na płeć.', 'okno', 3),
  ('hokej-na-trawie', '2027-07-16', '2027-08-01', '16.07–01.08.2027', 'Igrzyska Panamerykańskie, Lima', 'Po 1 miejscu na płeć.', 'kontynentalne', 4),
  ('hokej-na-trawie', '2027-07-28', '2027-08-08', '28.07–08.08.2027', 'Mistrzostwa Europy, Londyn', 'Po 1 miejscu na płeć.', 'kontynentalne', 5),
  ('hokej-na-trawie', '2027-09-01', null, 'wrzesień 2027', 'Zaproszenia do turniejów kwalifikacyjnych', 'FIH ogłasza 16 drużyn na płeć.', 'formalny', 6),
  ('hokej-na-trawie', '2028-03-01', '2028-03-31', 'marzec 2028', 'Olimpijskie turnieje kwalifikacyjne', '4 miejsca na płeć – główna szansa Polski.', 'okno', 7),
  ('hokej-na-trawie', '2028-07-12', '2028-07-30', '12–30.07.2028', 'Igrzyska olimpijskie', 'Hokej w Los Angeles (Carson).', 'igrzyska', 8)
) as v(sport, od, do_, etykieta, tytul, opis, typ, kol)
join public.dyscypliny d on d.slug = v.sport;
