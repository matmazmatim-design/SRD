-- Sporty wodne: poddyscypliny (jak w kolarstwie) + pływanie artystyczne LA28 (tablica kwot).
-- Źródło: World Aquatics, LA28 Qualification System – Artistic Swimming. Można uruchomić ponownie.

insert into public.dyscypliny (slug, nazwa, nadrzedna_id, kolejnosc)
select v.slug, v.nazwa, w.id, v.kol
from (values
  ('plywanie', 'Pływanie', 1),
  ('plywanie-otwarte-akweny', 'Pływanie na otwartym akwenie', 2),
  ('skoki-do-wody', 'Skoki do wody', 3),
  ('pilka-wodna', 'Piłka wodna', 4),
  ('plywanie-artystyczne', 'Pływanie artystyczne', 5)
) as v(slug, nazwa, kol)
cross join (select id from public.dyscypliny where slug = 'sporty-wodne') w
on conflict (slug) do update set nadrzedna_id = excluded.nadrzedna_id, nazwa = excluded.nazwa;

update public.dyscypliny set opis_kafla = 'Pływanie, skoki, piłka wodna, pływanie artystyczne' where slug = 'sporty-wodne';
update public.dyscypliny set opis_kafla = 'Drużyny i duety · miejsca z MŚ i Pucharu Świata' where slug = 'plywanie-artystyczne';

insert into public.konkurencje (dyscyplina_id, slug, nazwa, plec, miejsc, data_startu, opis, algorytm)
select d.id, v.slug, v.nazwa, v.plec, v.miejsc, v.data::date, v.opis, v.alg::jsonb
from (values
  ('druzyny', 'Pływanie artystyczne – drużyny', 'X', 10::smallint, '2028-07-25', '10 drużyn po 8 zawodników (mogą w nich startować także mężczyźni): układ techniczny, dowolny i akrobatyczny.', '{"typ":"kwoty","etykieta":"Drużyny"}'),
  ('duety', 'Pływanie artystyczne – duety', 'K', 18::smallint, '2028-07-25', '18 duetów: 10 z krajów z drużyną, 8 z MŚ 2027 i Pucharu Świata 2028.', '{"typ":"kwoty","etykieta":"Duety","z_druzyn":"druzyny"}')
) as v(slug, nazwa, plec, miejsc, data, opis, alg)
join public.dyscypliny d on d.slug = 'plywanie-artystyczne'
on conflict (dyscyplina_id, slug) do update set algorytm = excluded.algorytm, opis = excluded.opis;

insert into public.kwoty (konkurencja_id, kolejnosc, sciezka, zawody, data_zawodow, liczba, kraj, status, uwagi)
select k.id, v.kolejnosc, v.sciezka, v.zawody, v.data::date, v.liczba, v.kraj, v.status, v.uwagi
from (values
  ('druzyny', 1, 'Gospodarz', 'Stany Zjednoczone – gospodarz (też przedstawiciel Ameryk)', '2027-08-17', 8, 'USA', 'ok', 'Miejsce zagwarantowane; USA potwierdzają je do 17.08.2027.'),
  ('druzyny', 2, 'Mistrzostwa świata', 'Mistrzostwa świata 2027, Budapeszt – ranking drużyn', '2027-07-11', 8, null, 'pending', '3 najlepsze drużyny.'),
  ('druzyny', 3, 'Mistrzostwa świata', 'Mistrzostwa świata 2027, Budapeszt – ranking drużyn', '2027-07-11', 8, null, 'pending', '3 najlepsze drużyny.'),
  ('druzyny', 4, 'Mistrzostwa świata', 'Mistrzostwa świata 2027, Budapeszt – ranking drużyn', '2027-07-11', 8, null, 'pending', '3 najlepsze drużyny.'),
  ('druzyny', 5, 'Mistrzostwa kontynentów 2027', 'Mistrzostwa kontynentalne 2027 – Afryka', '2027-08-01', 8, null, 'pending', 'Najlepsza drużyna (Afryka), jeśli kontynent nie ma jeszcze drużyny.'),
  ('druzyny', 6, 'Mistrzostwa kontynentów 2027', 'Mistrzostwa kontynentalne 2027 – Azja', '2027-08-01', 8, null, 'pending', 'Najlepsza drużyna (Azja), jeśli kontynent nie ma jeszcze drużyny.'),
  ('druzyny', 7, 'Mistrzostwa kontynentów 2027', 'Mistrzostwa Europy 2027', '2027-08-01', 8, null, 'pending', 'Najlepsza drużyna (Europa), jeśli kontynent nie ma jeszcze drużyny.'),
  ('druzyny', 8, 'Mistrzostwa kontynentów 2027', 'Mistrzostwa kontynentalne 2027 – Oceania', '2027-08-01', 8, null, 'pending', 'Najlepsza drużyna (Oceania), jeśli kontynent nie ma jeszcze drużyny.'),
  ('druzyny', 9, 'Super Final Pucharu Świata 2028', 'Super Final Pucharu Świata 2028', '2028-04-15', 8, null, 'pending', 'Pozostałe miejsca do 10 drużyn (2–4, zależnie od kontynentów).'),
  ('druzyny', 10, 'Super Final Pucharu Świata 2028', 'Super Final Pucharu Świata 2028', '2028-04-15', 8, null, 'pending', 'Pozostałe miejsca do 10 drużyn (2–4, zależnie od kontynentów).'),
  ('duety', 1, 'Kraje z drużyną', 'Duet z kadry drużyny (automatycznie dla 10 krajów z drużyną)', null, 2, null, 'pending', 'Duet z 8-osobowej kadry drużyny.'),
  ('duety', 2, 'Kraje z drużyną', 'Duet z kadry drużyny (automatycznie dla 10 krajów z drużyną)', null, 2, null, 'pending', 'Duet z 8-osobowej kadry drużyny.'),
  ('duety', 3, 'Kraje z drużyną', 'Duet z kadry drużyny (automatycznie dla 10 krajów z drużyną)', null, 2, null, 'pending', 'Duet z 8-osobowej kadry drużyny.'),
  ('duety', 4, 'Kraje z drużyną', 'Duet z kadry drużyny (automatycznie dla 10 krajów z drużyną)', null, 2, null, 'pending', 'Duet z 8-osobowej kadry drużyny.'),
  ('duety', 5, 'Kraje z drużyną', 'Duet z kadry drużyny (automatycznie dla 10 krajów z drużyną)', null, 2, null, 'pending', 'Duet z 8-osobowej kadry drużyny.'),
  ('duety', 6, 'Kraje z drużyną', 'Duet z kadry drużyny (automatycznie dla 10 krajów z drużyną)', null, 2, null, 'pending', 'Duet z 8-osobowej kadry drużyny.'),
  ('duety', 7, 'Kraje z drużyną', 'Duet z kadry drużyny (automatycznie dla 10 krajów z drużyną)', null, 2, null, 'pending', 'Duet z 8-osobowej kadry drużyny.'),
  ('duety', 8, 'Kraje z drużyną', 'Duet z kadry drużyny (automatycznie dla 10 krajów z drużyną)', null, 2, null, 'pending', 'Duet z 8-osobowej kadry drużyny.'),
  ('duety', 9, 'Kraje z drużyną', 'Duet z kadry drużyny (automatycznie dla 10 krajów z drużyną)', null, 2, null, 'pending', 'Duet z 8-osobowej kadry drużyny.'),
  ('duety', 10, 'Kraje z drużyną', 'Duet z kadry drużyny (automatycznie dla 10 krajów z drużyną)', null, 2, null, 'pending', 'Duet z 8-osobowej kadry drużyny.'),
  ('duety', 11, 'Mistrzostwa świata', 'Mistrzostwa świata 2027, Budapeszt – ranking duetów', '2027-07-11', 2, null, 'pending', '5 najlepszych krajów bez drużyny.'),
  ('duety', 12, 'Mistrzostwa świata', 'Mistrzostwa świata 2027, Budapeszt – ranking duetów', '2027-07-11', 2, null, 'pending', '5 najlepszych krajów bez drużyny.'),
  ('duety', 13, 'Mistrzostwa świata', 'Mistrzostwa świata 2027, Budapeszt – ranking duetów', '2027-07-11', 2, null, 'pending', '5 najlepszych krajów bez drużyny.'),
  ('duety', 14, 'Mistrzostwa świata', 'Mistrzostwa świata 2027, Budapeszt – ranking duetów', '2027-07-11', 2, null, 'pending', '5 najlepszych krajów bez drużyny.'),
  ('duety', 15, 'Mistrzostwa świata', 'Mistrzostwa świata 2027, Budapeszt – ranking duetów', '2027-07-11', 2, null, 'pending', '5 najlepszych krajów bez drużyny.'),
  ('duety', 16, 'Super Final Pucharu Świata 2028', 'Super Final Pucharu Świata 2028 – duety', '2028-04-15', 2, null, 'pending', '3 najlepsze kraje bez kwalifikacji.'),
  ('duety', 17, 'Super Final Pucharu Świata 2028', 'Super Final Pucharu Świata 2028 – duety', '2028-04-15', 2, null, 'pending', '3 najlepsze kraje bez kwalifikacji.'),
  ('duety', 18, 'Super Final Pucharu Świata 2028', 'Super Final Pucharu Świata 2028 – duety', '2028-04-15', 2, null, 'pending', '3 najlepsze kraje bez kwalifikacji.')
) as v(slug, kolejnosc, sciezka, zawody, data, liczba, kraj, status, uwagi)
join public.konkurencje k on k.slug = v.slug
join public.dyscypliny d on d.id = k.dyscyplina_id and d.slug = 'plywanie-artystyczne'
where not exists (select 1 from public.kwoty x where x.konkurencja_id = k.id);

delete from public.terminy t using public.dyscypliny d where d.id = t.dyscyplina_id and d.slug = 'plywanie-artystyczne';
insert into public.terminy (dyscyplina_id, data_od, data_do, etykieta_daty, tytul, opis, typ, kolejnosc)
select d.id, v.od::date, v.do_::date, v.etykieta, v.tytul, v.opis, v.typ, v.kol
from (values
  ('2027-07-11', '2027-07-18', '11–18.07.2027', 'Mistrzostwa świata, Budapeszt', '3 drużyny i 5 duetów (kraje bez drużyny). Główna szansa polskiego duetu.', 'okno', 1),
  ('2027-08-03', null, '03.08.2027', 'Potwierdzenie miejsc z MŚ', 'World Aquatics informuje komitety; 2 tygodnie na potwierdzenie.', 'formalny', 2),
  (null, null, '2027 – termin wkrótce', 'Mistrzostwa kontynentalne', 'Po 1 drużynie: Afryka, Azja, Europa, Oceania.', 'kontynentalne', 3),
  ('2028-04-15', null, 'kwiecień/maj 2028', 'Super Final Pucharu Świata', 'Pozostałe drużyny (2–4) i 3 duety.', 'okno', 4),
  ('2028-06-26', null, '26.06.2028', 'Zgłoszenia na igrzyska', 'Ostateczny termin zgłoszeń zawodników.', 'formalny', 5),
  ('2028-07-25', '2028-07-29', '25–29.07.2028', 'Igrzyska olimpijskie', 'Pływanie artystyczne w Los Angeles.', 'igrzyska', 6)
) as v(od, do_, etykieta, tytul, opis, typ, kol)
join public.dyscypliny d on d.slug = 'plywanie-artystyczne';
