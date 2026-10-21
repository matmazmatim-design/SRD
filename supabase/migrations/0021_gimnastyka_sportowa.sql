-- Gimnastyka: dwa osobne kafle (sportowa i artystyczna) + tablica kwot gimnastyki sportowej LA28.
-- Źródło: FIG, Olympic Qualification System Los Angeles 2028 – Artistic. Można uruchomić ponownie.

update public.dyscypliny set slug = 'gimnastyka-sportowa', nazwa = 'Gimnastyka sportowa' where slug = 'gimnastyka';
insert into public.dyscypliny (slug, nazwa, plakietka, sledzona, opis_kafla, kolejnosc)
select 'gimnastyka-artystyczna', 'Gimnastyka artystyczna', null, false, null, kolejnosc
from public.dyscypliny where slug = 'gimnastyka-sportowa'
on conflict (slug) do nothing;
update public.dyscypliny set opis_kafla = 'Kobiety, mężczyźni i drużyna mieszana · miejsca z MŚ i Pucharu Świata' where slug = 'gimnastyka-sportowa';

insert into public.konkurencje (dyscyplina_id, slug, nazwa, plec, miejsc, opis, algorytm)
select d.id, v.slug, v.nazwa, v.plec, v.miejsc, v.opis, v.alg::jsonb
from (values
  ('kobiety', 'Gimnastyka sportowa – kobiety', 'K', 96::smallint, 'Drużyna (5 zawodniczek), wielobój i 4 przyrządy: skok, poręcze asymetryczne, równoważnia, ćwiczenia wolne.', '{"typ":"kwoty"}'),
  ('mezczyzni', 'Gimnastyka sportowa – mężczyźni', 'M', 96::smallint, 'Drużyna (5 zawodników), wielobój i 6 przyrządów: ćwiczenia wolne, koń z łękami, kółka, skok, poręcze, drążek.', '{"typ":"kwoty"}'),
  ('druzyna-mieszana', 'Gimnastyka sportowa – drużyna mieszana', 'X', null, 'Nowa konkurencja w programie LA28. Regulamin kwalifikacji FIG nie opisuje jeszcze jej zasad – uzupełnimy, gdy zostaną ogłoszone.', null)
) as v(slug, nazwa, plec, miejsc, opis, alg)
join public.dyscypliny d on d.slug = 'gimnastyka-sportowa'
on conflict (dyscyplina_id, slug) do update set algorytm = excluded.algorytm, opis = excluded.opis;

insert into public.kwoty (konkurencja_id, kolejnosc, sciezka, zawody, data_zawodow, liczba, kraj, status, uwagi)
select k.id, v.kolejnosc, v.sciezka, v.zawody, v.data::date, v.liczba, v.kraj, v.status, v.uwagi
from (values
  ('kobiety', 1, 'Gospodarz', 'Stany Zjednoczone – gospodarz', '2027-09-28', 1, 'USA', 'pending', 'Najlepszy Amerykanin/Amerykanka z wieloboju MŚ 2027, jeśli USA nie mają już miejsca.'),
  ('kobiety', 2, 'Drużyny (5 zawodników)', 'Mistrzostwa świata 2026 – finał drużynowy', '2026-10-17', 5, null, 'pending', '3 najlepsze drużyny.'),
  ('kobiety', 3, 'Drużyny (5 zawodników)', 'Mistrzostwa świata 2026 – finał drużynowy', '2026-10-17', 5, null, 'pending', '3 najlepsze drużyny.'),
  ('kobiety', 4, 'Drużyny (5 zawodników)', 'Mistrzostwa świata 2026 – finał drużynowy', '2026-10-17', 5, null, 'pending', '3 najlepsze drużyny.'),
  ('kobiety', 5, 'Drużyny (5 zawodników)', 'Mistrzostwa świata 2027 – eliminacje drużynowe', '2027-09-28', 5, null, 'pending', '9 kolejnych drużyn.'),
  ('kobiety', 6, 'Drużyny (5 zawodników)', 'Mistrzostwa świata 2027 – eliminacje drużynowe', '2027-09-28', 5, null, 'pending', '9 kolejnych drużyn.'),
  ('kobiety', 7, 'Drużyny (5 zawodników)', 'Mistrzostwa świata 2027 – eliminacje drużynowe', '2027-09-28', 5, null, 'pending', '9 kolejnych drużyn.'),
  ('kobiety', 8, 'Drużyny (5 zawodników)', 'Mistrzostwa świata 2027 – eliminacje drużynowe', '2027-09-28', 5, null, 'pending', '9 kolejnych drużyn.'),
  ('kobiety', 9, 'Drużyny (5 zawodników)', 'Mistrzostwa świata 2027 – eliminacje drużynowe', '2027-09-28', 5, null, 'pending', '9 kolejnych drużyn.'),
  ('kobiety', 10, 'Drużyny (5 zawodników)', 'Mistrzostwa świata 2027 – eliminacje drużynowe', '2027-09-28', 5, null, 'pending', '9 kolejnych drużyn.'),
  ('kobiety', 11, 'Drużyny (5 zawodników)', 'Mistrzostwa świata 2027 – eliminacje drużynowe', '2027-09-28', 5, null, 'pending', '9 kolejnych drużyn.'),
  ('kobiety', 12, 'Drużyny (5 zawodników)', 'Mistrzostwa świata 2027 – eliminacje drużynowe', '2027-09-28', 5, null, 'pending', '9 kolejnych drużyn.'),
  ('kobiety', 13, 'Drużyny (5 zawodników)', 'Mistrzostwa świata 2027 – eliminacje drużynowe', '2027-09-28', 5, null, 'pending', '9 kolejnych drużyn.'),
  ('kobiety', 14, 'Kraje bez drużyny', 'Mistrzostwa świata 2027 – eliminacje drużynowe', '2027-09-28', 1, null, 'pending', '3 najlepsze kraje bez drużyny – 1 miejsce dla kraju.'),
  ('kobiety', 15, 'Kraje bez drużyny', 'Mistrzostwa świata 2027 – eliminacje drużynowe', '2027-09-28', 1, null, 'pending', '3 najlepsze kraje bez drużyny – 1 miejsce dla kraju.'),
  ('kobiety', 16, 'Kraje bez drużyny', 'Mistrzostwa świata 2027 – eliminacje drużynowe', '2027-09-28', 1, null, 'pending', '3 najlepsze kraje bez drużyny – 1 miejsce dla kraju.'),
  ('kobiety', 17, 'Wielobój (imiennie)', 'Mistrzostwa świata 2027 – eliminacje wieloboju', '2027-09-28', 1, null, 'pending', 'Maks. 1 na kraj; bez krajów z drużyną.'),
  ('kobiety', 18, 'Wielobój (imiennie)', 'Mistrzostwa świata 2027 – eliminacje wieloboju', '2027-09-28', 1, null, 'pending', 'Maks. 1 na kraj; bez krajów z drużyną.'),
  ('kobiety', 19, 'Wielobój (imiennie)', 'Mistrzostwa świata 2027 – eliminacje wieloboju', '2027-09-28', 1, null, 'pending', 'Maks. 1 na kraj; bez krajów z drużyną.'),
  ('kobiety', 20, 'Wielobój (imiennie)', 'Mistrzostwa świata 2027 – eliminacje wieloboju', '2027-09-28', 1, null, 'pending', 'Maks. 1 na kraj; bez krajów z drużyną.'),
  ('kobiety', 21, 'Wielobój (imiennie)', 'Mistrzostwa świata 2027 – eliminacje wieloboju', '2027-09-28', 1, null, 'pending', 'Maks. 1 na kraj; bez krajów z drużyną.'),
  ('kobiety', 22, 'Wielobój (imiennie)', 'Mistrzostwa świata 2027 – eliminacje wieloboju', '2027-09-28', 1, null, 'pending', 'Maks. 1 na kraj; bez krajów z drużyną.'),
  ('kobiety', 23, 'Wielobój (imiennie)', 'Mistrzostwa świata 2027 – eliminacje wieloboju', '2027-09-28', 1, null, 'pending', 'Maks. 1 na kraj; bez krajów z drużyną.'),
  ('kobiety', 24, 'Wielobój (imiennie)', 'Mistrzostwa świata 2027 – eliminacje wieloboju', '2027-09-28', 1, null, 'pending', 'Maks. 1 na kraj; bez krajów z drużyną.'),
  ('kobiety', 25, 'Wielobój (imiennie)', 'Mistrzostwa świata 2027 – eliminacje wieloboju', '2027-09-28', 1, null, 'pending', 'Maks. 1 na kraj; bez krajów z drużyną.'),
  ('kobiety', 26, 'Wielobój (imiennie)', 'Mistrzostwa świata 2027 – eliminacje wieloboju', '2027-09-28', 1, null, 'pending', 'Maks. 1 na kraj; bez krajów z drużyną.'),
  ('kobiety', 27, 'Wielobój (imiennie)', 'Mistrzostwa świata 2027 – eliminacje wieloboju', '2027-09-28', 1, null, 'pending', 'Maks. 1 na kraj; bez krajów z drużyną.'),
  ('kobiety', 28, 'Wielobój (imiennie)', 'Mistrzostwa świata 2027 – eliminacje wieloboju', '2027-09-28', 1, null, 'pending', 'Maks. 1 na kraj; bez krajów z drużyną.'),
  ('kobiety', 29, 'Wielobój (imiennie)', 'Mistrzostwa świata 2027 – eliminacje wieloboju', '2027-09-28', 1, null, 'pending', 'Maks. 1 na kraj; bez krajów z drużyną.'),
  ('kobiety', 30, 'Wielobój (imiennie)', 'Mistrzostwa świata 2027 – eliminacje wieloboju', '2027-09-28', 1, null, 'pending', 'Maks. 1 na kraj; bez krajów z drużyną.'),
  ('kobiety', 31, 'Przyrządy (imiennie)', 'Mistrzostwa świata 2027 – finał: skok', '2027-09-28', 1, null, 'pending', 'Najlepszy uprawniony z miejsc 1–3.'),
  ('kobiety', 32, 'Przyrządy (imiennie)', 'Mistrzostwa świata 2027 – finał: poręcze asymetryczne', '2027-09-28', 1, null, 'pending', 'Najlepszy uprawniony z miejsc 1–3.'),
  ('kobiety', 33, 'Przyrządy (imiennie)', 'Mistrzostwa świata 2027 – finał: równoważnia', '2027-09-28', 1, null, 'pending', 'Najlepszy uprawniony z miejsc 1–3.'),
  ('kobiety', 34, 'Przyrządy (imiennie)', 'Mistrzostwa świata 2027 – finał: ćwiczenia wolne', '2027-09-28', 1, null, 'pending', 'Najlepszy uprawniony z miejsc 1–3.'),
  ('kobiety', 35, 'Puchar Świata 2028 (ranking)', 'Ranking Pucharu Świata – skok', '2028-02-24', 1, null, 'pending', '2 najlepszych uprawnionych; liczą się 4 najlepsze z 6 zawodów.'),
  ('kobiety', 36, 'Puchar Świata 2028 (ranking)', 'Ranking Pucharu Świata – skok', '2028-02-24', 1, null, 'pending', '2 najlepszych uprawnionych; liczą się 4 najlepsze z 6 zawodów.'),
  ('kobiety', 37, 'Puchar Świata 2028 (ranking)', 'Ranking Pucharu Świata – poręcze asymetryczne', '2028-02-24', 1, null, 'pending', '2 najlepszych uprawnionych; liczą się 4 najlepsze z 6 zawodów.'),
  ('kobiety', 38, 'Puchar Świata 2028 (ranking)', 'Ranking Pucharu Świata – poręcze asymetryczne', '2028-02-24', 1, null, 'pending', '2 najlepszych uprawnionych; liczą się 4 najlepsze z 6 zawodów.'),
  ('kobiety', 39, 'Puchar Świata 2028 (ranking)', 'Ranking Pucharu Świata – równoważnia', '2028-02-24', 1, null, 'pending', '2 najlepszych uprawnionych; liczą się 4 najlepsze z 6 zawodów.'),
  ('kobiety', 40, 'Puchar Świata 2028 (ranking)', 'Ranking Pucharu Świata – równoważnia', '2028-02-24', 1, null, 'pending', '2 najlepszych uprawnionych; liczą się 4 najlepsze z 6 zawodów.'),
  ('kobiety', 41, 'Puchar Świata 2028 (ranking)', 'Ranking Pucharu Świata – ćwiczenia wolne', '2028-02-24', 1, null, 'pending', '2 najlepszych uprawnionych; liczą się 4 najlepsze z 6 zawodów.'),
  ('kobiety', 42, 'Puchar Świata 2028 (ranking)', 'Ranking Pucharu Świata – ćwiczenia wolne', '2028-02-24', 1, null, 'pending', '2 najlepszych uprawnionych; liczą się 4 najlepsze z 6 zawodów.'),
  ('kobiety', 43, 'Mistrzostwa kontynentów (imiennie)', 'Mistrzostwa kontynentalne 2028 – wielobój', '2028-05-01', 1, null, 'pending', 'Najlepszy uprawniony zawodnik; gwarancja reprezentacji kontynentów.'),
  ('kobiety', 44, 'Mistrzostwa kontynentów (imiennie)', 'Mistrzostwa kontynentalne 2028 – wielobój', '2028-05-01', 1, null, 'pending', 'Najlepszy uprawniony zawodnik; gwarancja reprezentacji kontynentów.'),
  ('kobiety', 45, 'Mistrzostwa kontynentów (imiennie)', 'Mistrzostwa kontynentalne 2028 – wielobój', '2028-05-01', 1, null, 'pending', 'Najlepszy uprawniony zawodnik; gwarancja reprezentacji kontynentów.'),
  ('kobiety', 46, 'Mistrzostwa kontynentów (imiennie)', 'Mistrzostwa kontynentalne 2028 – wielobój', '2028-05-01', 1, null, 'pending', 'Najlepszy uprawniony zawodnik; gwarancja reprezentacji kontynentów.'),
  ('kobiety', 47, 'Mistrzostwa kontynentów (imiennie)', 'Mistrzostwa kontynentalne 2028 – wielobój', '2028-05-01', 1, null, 'pending', 'Najlepszy uprawniony zawodnik; gwarancja reprezentacji kontynentów.'),
  ('kobiety', 48, 'Miejsca uniwersalne', 'Komisja Trójstronna', null, 1, null, 'pending', 'Wnioski do 15.01.2028.'),
  ('mezczyzni', 1, 'Gospodarz', 'Stany Zjednoczone – gospodarz', '2027-09-28', 1, 'USA', 'pending', 'Najlepszy Amerykanin/Amerykanka z wieloboju MŚ 2027, jeśli USA nie mają już miejsca.'),
  ('mezczyzni', 2, 'Drużyny (5 zawodników)', 'Mistrzostwa świata 2026 – finał drużynowy', '2026-10-17', 5, null, 'pending', '3 najlepsze drużyny.'),
  ('mezczyzni', 3, 'Drużyny (5 zawodników)', 'Mistrzostwa świata 2026 – finał drużynowy', '2026-10-17', 5, null, 'pending', '3 najlepsze drużyny.'),
  ('mezczyzni', 4, 'Drużyny (5 zawodników)', 'Mistrzostwa świata 2026 – finał drużynowy', '2026-10-17', 5, null, 'pending', '3 najlepsze drużyny.'),
  ('mezczyzni', 5, 'Drużyny (5 zawodników)', 'Mistrzostwa świata 2027 – eliminacje drużynowe', '2027-09-28', 5, null, 'pending', '9 kolejnych drużyn.'),
  ('mezczyzni', 6, 'Drużyny (5 zawodników)', 'Mistrzostwa świata 2027 – eliminacje drużynowe', '2027-09-28', 5, null, 'pending', '9 kolejnych drużyn.'),
  ('mezczyzni', 7, 'Drużyny (5 zawodników)', 'Mistrzostwa świata 2027 – eliminacje drużynowe', '2027-09-28', 5, null, 'pending', '9 kolejnych drużyn.'),
  ('mezczyzni', 8, 'Drużyny (5 zawodników)', 'Mistrzostwa świata 2027 – eliminacje drużynowe', '2027-09-28', 5, null, 'pending', '9 kolejnych drużyn.'),
  ('mezczyzni', 9, 'Drużyny (5 zawodników)', 'Mistrzostwa świata 2027 – eliminacje drużynowe', '2027-09-28', 5, null, 'pending', '9 kolejnych drużyn.'),
  ('mezczyzni', 10, 'Drużyny (5 zawodników)', 'Mistrzostwa świata 2027 – eliminacje drużynowe', '2027-09-28', 5, null, 'pending', '9 kolejnych drużyn.'),
  ('mezczyzni', 11, 'Drużyny (5 zawodników)', 'Mistrzostwa świata 2027 – eliminacje drużynowe', '2027-09-28', 5, null, 'pending', '9 kolejnych drużyn.'),
  ('mezczyzni', 12, 'Drużyny (5 zawodników)', 'Mistrzostwa świata 2027 – eliminacje drużynowe', '2027-09-28', 5, null, 'pending', '9 kolejnych drużyn.'),
  ('mezczyzni', 13, 'Drużyny (5 zawodników)', 'Mistrzostwa świata 2027 – eliminacje drużynowe', '2027-09-28', 5, null, 'pending', '9 kolejnych drużyn.'),
  ('mezczyzni', 14, 'Kraje bez drużyny', 'Mistrzostwa świata 2027 – eliminacje drużynowe', '2027-09-28', 1, null, 'pending', '3 najlepsze kraje bez drużyny – 1 miejsce dla kraju.'),
  ('mezczyzni', 15, 'Kraje bez drużyny', 'Mistrzostwa świata 2027 – eliminacje drużynowe', '2027-09-28', 1, null, 'pending', '3 najlepsze kraje bez drużyny – 1 miejsce dla kraju.'),
  ('mezczyzni', 16, 'Kraje bez drużyny', 'Mistrzostwa świata 2027 – eliminacje drużynowe', '2027-09-28', 1, null, 'pending', '3 najlepsze kraje bez drużyny – 1 miejsce dla kraju.'),
  ('mezczyzni', 17, 'Wielobój (imiennie)', 'Mistrzostwa świata 2027 – eliminacje wieloboju', '2027-09-28', 1, null, 'pending', 'Maks. 1 na kraj; bez krajów z drużyną.'),
  ('mezczyzni', 18, 'Wielobój (imiennie)', 'Mistrzostwa świata 2027 – eliminacje wieloboju', '2027-09-28', 1, null, 'pending', 'Maks. 1 na kraj; bez krajów z drużyną.'),
  ('mezczyzni', 19, 'Wielobój (imiennie)', 'Mistrzostwa świata 2027 – eliminacje wieloboju', '2027-09-28', 1, null, 'pending', 'Maks. 1 na kraj; bez krajów z drużyną.'),
  ('mezczyzni', 20, 'Wielobój (imiennie)', 'Mistrzostwa świata 2027 – eliminacje wieloboju', '2027-09-28', 1, null, 'pending', 'Maks. 1 na kraj; bez krajów z drużyną.'),
  ('mezczyzni', 21, 'Wielobój (imiennie)', 'Mistrzostwa świata 2027 – eliminacje wieloboju', '2027-09-28', 1, null, 'pending', 'Maks. 1 na kraj; bez krajów z drużyną.'),
  ('mezczyzni', 22, 'Wielobój (imiennie)', 'Mistrzostwa świata 2027 – eliminacje wieloboju', '2027-09-28', 1, null, 'pending', 'Maks. 1 na kraj; bez krajów z drużyną.'),
  ('mezczyzni', 23, 'Wielobój (imiennie)', 'Mistrzostwa świata 2027 – eliminacje wieloboju', '2027-09-28', 1, null, 'pending', 'Maks. 1 na kraj; bez krajów z drużyną.'),
  ('mezczyzni', 24, 'Wielobój (imiennie)', 'Mistrzostwa świata 2027 – eliminacje wieloboju', '2027-09-28', 1, null, 'pending', 'Maks. 1 na kraj; bez krajów z drużyną.'),
  ('mezczyzni', 25, 'Przyrządy (imiennie)', 'Mistrzostwa świata 2027 – finał: ćwiczenia wolne', '2027-09-28', 1, null, 'pending', 'Najlepszy uprawniony z miejsc 1–3.'),
  ('mezczyzni', 26, 'Przyrządy (imiennie)', 'Mistrzostwa świata 2027 – finał: koń z łękami', '2027-09-28', 1, null, 'pending', 'Najlepszy uprawniony z miejsc 1–3.'),
  ('mezczyzni', 27, 'Przyrządy (imiennie)', 'Mistrzostwa świata 2027 – finał: kółka', '2027-09-28', 1, null, 'pending', 'Najlepszy uprawniony z miejsc 1–3.'),
  ('mezczyzni', 28, 'Przyrządy (imiennie)', 'Mistrzostwa świata 2027 – finał: skok', '2027-09-28', 1, null, 'pending', 'Najlepszy uprawniony z miejsc 1–3.'),
  ('mezczyzni', 29, 'Przyrządy (imiennie)', 'Mistrzostwa świata 2027 – finał: poręcze', '2027-09-28', 1, null, 'pending', 'Najlepszy uprawniony z miejsc 1–3.'),
  ('mezczyzni', 30, 'Przyrządy (imiennie)', 'Mistrzostwa świata 2027 – finał: drążek', '2027-09-28', 1, null, 'pending', 'Najlepszy uprawniony z miejsc 1–3.'),
  ('mezczyzni', 31, 'Puchar Świata 2028 (ranking)', 'Ranking Pucharu Świata – ćwiczenia wolne', '2028-02-24', 1, null, 'pending', '2 najlepszych uprawnionych; liczą się 4 najlepsze z 6 zawodów.'),
  ('mezczyzni', 32, 'Puchar Świata 2028 (ranking)', 'Ranking Pucharu Świata – ćwiczenia wolne', '2028-02-24', 1, null, 'pending', '2 najlepszych uprawnionych; liczą się 4 najlepsze z 6 zawodów.'),
  ('mezczyzni', 33, 'Puchar Świata 2028 (ranking)', 'Ranking Pucharu Świata – koń z łękami', '2028-02-24', 1, null, 'pending', '2 najlepszych uprawnionych; liczą się 4 najlepsze z 6 zawodów.'),
  ('mezczyzni', 34, 'Puchar Świata 2028 (ranking)', 'Ranking Pucharu Świata – koń z łękami', '2028-02-24', 1, null, 'pending', '2 najlepszych uprawnionych; liczą się 4 najlepsze z 6 zawodów.'),
  ('mezczyzni', 35, 'Puchar Świata 2028 (ranking)', 'Ranking Pucharu Świata – kółka', '2028-02-24', 1, null, 'pending', '2 najlepszych uprawnionych; liczą się 4 najlepsze z 6 zawodów.'),
  ('mezczyzni', 36, 'Puchar Świata 2028 (ranking)', 'Ranking Pucharu Świata – kółka', '2028-02-24', 1, null, 'pending', '2 najlepszych uprawnionych; liczą się 4 najlepsze z 6 zawodów.'),
  ('mezczyzni', 37, 'Puchar Świata 2028 (ranking)', 'Ranking Pucharu Świata – skok', '2028-02-24', 1, null, 'pending', '2 najlepszych uprawnionych; liczą się 4 najlepsze z 6 zawodów.'),
  ('mezczyzni', 38, 'Puchar Świata 2028 (ranking)', 'Ranking Pucharu Świata – skok', '2028-02-24', 1, null, 'pending', '2 najlepszych uprawnionych; liczą się 4 najlepsze z 6 zawodów.'),
  ('mezczyzni', 39, 'Puchar Świata 2028 (ranking)', 'Ranking Pucharu Świata – poręcze', '2028-02-24', 1, null, 'pending', '2 najlepszych uprawnionych; liczą się 4 najlepsze z 6 zawodów.'),
  ('mezczyzni', 40, 'Puchar Świata 2028 (ranking)', 'Ranking Pucharu Świata – poręcze', '2028-02-24', 1, null, 'pending', '2 najlepszych uprawnionych; liczą się 4 najlepsze z 6 zawodów.'),
  ('mezczyzni', 41, 'Puchar Świata 2028 (ranking)', 'Ranking Pucharu Świata – drążek', '2028-02-24', 1, null, 'pending', '2 najlepszych uprawnionych; liczą się 4 najlepsze z 6 zawodów.'),
  ('mezczyzni', 42, 'Puchar Świata 2028 (ranking)', 'Ranking Pucharu Świata – drążek', '2028-02-24', 1, null, 'pending', '2 najlepszych uprawnionych; liczą się 4 najlepsze z 6 zawodów.'),
  ('mezczyzni', 43, 'Mistrzostwa kontynentów (imiennie)', 'Mistrzostwa kontynentalne 2028 – wielobój', '2028-05-01', 1, null, 'pending', 'Najlepszy uprawniony zawodnik; gwarancja reprezentacji kontynentów.'),
  ('mezczyzni', 44, 'Mistrzostwa kontynentów (imiennie)', 'Mistrzostwa kontynentalne 2028 – wielobój', '2028-05-01', 1, null, 'pending', 'Najlepszy uprawniony zawodnik; gwarancja reprezentacji kontynentów.'),
  ('mezczyzni', 45, 'Mistrzostwa kontynentów (imiennie)', 'Mistrzostwa kontynentalne 2028 – wielobój', '2028-05-01', 1, null, 'pending', 'Najlepszy uprawniony zawodnik; gwarancja reprezentacji kontynentów.'),
  ('mezczyzni', 46, 'Mistrzostwa kontynentów (imiennie)', 'Mistrzostwa kontynentalne 2028 – wielobój', '2028-05-01', 1, null, 'pending', 'Najlepszy uprawniony zawodnik; gwarancja reprezentacji kontynentów.'),
  ('mezczyzni', 47, 'Mistrzostwa kontynentów (imiennie)', 'Mistrzostwa kontynentalne 2028 – wielobój', '2028-05-01', 1, null, 'pending', 'Najlepszy uprawniony zawodnik; gwarancja reprezentacji kontynentów.'),
  ('mezczyzni', 48, 'Miejsca uniwersalne', 'Komisja Trójstronna', null, 1, null, 'pending', 'Wnioski do 15.01.2028.')
) as v(slug, kolejnosc, sciezka, zawody, data, liczba, kraj, status, uwagi)
join public.konkurencje k on k.slug = v.slug
join public.dyscypliny d on d.id = k.dyscyplina_id and d.slug = 'gimnastyka-sportowa'
where not exists (select 1 from public.kwoty x where x.konkurencja_id = k.id);

delete from public.terminy t using public.dyscypliny d where d.id = t.dyscyplina_id and d.slug = 'gimnastyka-sportowa';
insert into public.terminy (dyscyplina_id, data_od, data_do, etykieta_daty, tytul, opis, typ, kolejnosc)
select d.id, v.od::date, v.do_::date, v.etykieta, v.tytul, v.opis, v.typ, v.kol
from (values
  ('2026-10-17', '2026-10-25', '17–25.10.2026', 'Mistrzostwa świata 2026', 'Finał drużynowy: 3 najlepsze drużyny kobiet i mężczyzn dostają miejsca na igrzyska.', 'okno', 1),
  ('2027-09-28', '2027-10-06', '28.09–06.10.2027', 'Mistrzostwa świata 2027', 'Główne kwalifikacje: 9 drużyn, 3 kraje bez drużyny, wielobój (8 M / 14 K) i przyrządy.', 'okno', 2),
  ('2027-10-01', null, '01.10.2027', 'Zaproszenia do miejsc uniwersalnych', 'MKOl zaprasza komitety olimpijskie do składania wniosków.', 'formalny', 3),
  ('2028-01-15', null, '15.01.2028', 'Wnioski o miejsca uniwersalne', 'Termin zgłoszeń komitetów olimpijskich.', 'formalny', 4),
  ('2028-02-24', '2028-04-15', '24.02–15.04.2028', 'Puchar Świata na przyrządach (6 zawodów)', 'Ranking z 4 najlepszych startów: po 2 miejsca na każdy przyrząd.', 'okno', 5),
  ('2028-05-01', '2028-05-31', 'do końca maja 2028', 'Mistrzostwa kontynentalne', '5 miejsc na płeć z wieloboju; Mistrzostwa Europy to szansa dla Polaków.', 'kontynentalne', 6),
  ('2028-06-26', null, '26.06.2028', 'Zgłoszenia na igrzyska', 'Ostateczny termin zgłoszeń zawodników.', 'formalny', 7),
  ('2028-07-14', '2028-07-30', '14–30.07.2028', 'Igrzyska olimpijskie', 'Gimnastyka sportowa w Los Angeles.', 'igrzyska', 8)
) as v(od, do_, etykieta, tytul, opis, typ, kol)
join public.dyscypliny d on d.slug = 'gimnastyka-sportowa';
