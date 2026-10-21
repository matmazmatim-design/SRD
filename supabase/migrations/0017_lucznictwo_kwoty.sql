-- Łucznictwo LA28: tablica kwot (miejsca olimpijskie zdobywane na zawodach).
-- Ogólny mechanizm „kwoty” – lista miejsc z każdej ścieżki; kraje wpisujesz w panelu po zawodach.
-- Można uruchomić ponownie (nie nadpisuje istniejących kwot łucznictwa).

create table if not exists public.kwoty (
  id bigint generated always as identity primary key,
  konkurencja_id smallint not null references public.konkurencje (id) on delete cascade,
  kolejnosc integer not null default 0,
  sciezka text not null,                -- grupa: Drużyny, Indywidualnie, Gospodarz…
  zawody text not null,                 -- gdzie zdobywa się miejsce
  data_zawodow date,
  liczba smallint not null default 1,   -- ilu zawodników daje to miejsce (drużyna = 3)
  kraj text,                            -- kod MKOl; null = do rozstrzygnięcia
  zawodnik text,
  status text not null default 'pending' check (status in ('ok', 'virt', 'pending')),
  uwagi text
);
alter table public.kwoty enable row level security;
drop policy if exists "odczyt publiczny" on public.kwoty;
create policy "odczyt publiczny" on public.kwoty for select using (true);
drop policy if exists "zapis admin" on public.kwoty;
create policy "zapis admin" on public.kwoty for all to authenticated using (prywatne.jest_adminem()) with check (prywatne.jest_adminem());
grant select on public.kwoty to anon, authenticated;
grant insert, update, delete on public.kwoty to authenticated;

-- Konkurencje łucznictwa w LA28
insert into public.konkurencje (dyscyplina_id, slug, nazwa, plec, miejsc, opis, algorytm)
select d.id, v.slug, v.nazwa, v.plec, v.miejsc, v.opis, '{"typ":"kwoty"}'::jsonb
from (values
  ('klasyczny-kobiety', 'Łuk klasyczny – kobiety', 'K', 52::smallint, 'Turniej indywidualny i drużynowy (drużyny 3-osobowe). Miejsca zdobywają kraje na zawodach kwalifikacyjnych.'),
  ('klasyczny-mezczyzni', 'Łuk klasyczny – mężczyźni', 'M', 52::smallint, 'Turniej indywidualny i drużynowy (drużyny 3-osobowe). Miejsca zdobywają kraje na zawodach kwalifikacyjnych.'),
  ('mieszana-klasyczny', 'Drużyny mieszane – łuk klasyczny', 'X', 16::smallint, 'Na igrzyskach startuje 16 najlepszych par z rundy rankingowej spośród krajów, które mają łuczniczkę i łucznika. Igrzyska kontynentalne dają 5 dodatkowych par.'),
  ('mieszana-bloczkowy', 'Drużyny mieszane – łuk bloczkowy', 'X', 12::smallint, 'Jedyna konkurencja z łukiem bloczkowym: 12 par (kobieta + mężczyzna). Debiut na igrzyskach.')
) as v(slug, nazwa, plec, miejsc, opis)
join public.dyscypliny d on d.slug = 'lucznictwo'
on conflict (dyscyplina_id, slug) do update set algorytm = excluded.algorytm;

-- Miejsca (kwoty) – tylko jeśli konkurencja nie ma jeszcze żadnych
insert into public.kwoty (konkurencja_id, kolejnosc, sciezka, zawody, data_zawodow, liczba, kraj, zawodnik, status, uwagi)
select k.id, v.kolejnosc, v.sciezka, v.zawody, v.data::date, v.liczba, v.kraj, v.zawodnik, v.status, v.uwagi
from (values
  ('klasyczny-kobiety', 1, 'Gospodarz', 'Stany Zjednoczone – gospodarz', '2027-09-20', 3, 'USA', null, 'virt', '3 miejsca, jeśli USA zgłoszą drużynę na MŚ 2027; przy 1–2 zawodnikach – po 1 miejscu.'),
  ('klasyczny-kobiety', 2, 'Drużyny (3 łuczników)', 'Mistrzostwa świata 2027, Medellín', '2027-09-20', 3, null, null, 'pending', '3 najlepsze drużyny.'),
  ('klasyczny-kobiety', 3, 'Drużyny (3 łuczników)', 'Mistrzostwa świata 2027, Medellín', '2027-09-20', 3, null, null, 'pending', '3 najlepsze drużyny.'),
  ('klasyczny-kobiety', 4, 'Drużyny (3 łuczników)', 'Mistrzostwa świata 2027, Medellín', '2027-09-20', 3, null, null, 'pending', '3 najlepsze drużyny.'),
  ('klasyczny-kobiety', 5, 'Drużyny (3 łuczników)', 'Mistrzostwa Europy 2028, Nottingham', '2028-05-15', 3, null, null, 'pending', 'Najlepsza drużyna (Europa).'),
  ('klasyczny-kobiety', 6, 'Drużyny (3 łuczników)', 'Mistrzostwa Azji 2027, Hangzhou', '2027-11-01', 3, null, null, 'pending', 'Najlepsza drużyna (Azja).'),
  ('klasyczny-kobiety', 7, 'Drużyny (3 łuczników)', 'Mistrzostwa panamerykańskie 2028', '2028-03-01', 3, null, null, 'pending', 'Najlepsza drużyna (Ameryki).'),
  ('klasyczny-kobiety', 8, 'Drużyny (3 łuczników)', 'Światowy turniej kwalifikacyjny drużyn (FTQT) 2028', null, 3, null, null, 'pending', 'Zwycięska drużyna; dla krajów bez drużyny z MŚ i mistrzostw kontynentów.'),
  ('klasyczny-kobiety', 9, 'Indywidualnie', 'Mistrzostwa świata 2027, Medellín', '2027-09-20', 1, null, null, 'pending', '3 najlepszych z krajów bez drużyny, maks. 1 na kraj.'),
  ('klasyczny-kobiety', 10, 'Indywidualnie', 'Mistrzostwa świata 2027, Medellín', '2027-09-20', 1, null, null, 'pending', '3 najlepszych z krajów bez drużyny, maks. 1 na kraj.'),
  ('klasyczny-kobiety', 11, 'Indywidualnie', 'Mistrzostwa świata 2027, Medellín', '2027-09-20', 1, null, null, 'pending', '3 najlepszych z krajów bez drużyny, maks. 1 na kraj.'),
  ('klasyczny-kobiety', 12, 'Indywidualnie', 'Igrzyska Azjatyckie 2026, Nagoja', '2026-09-25', 1, 'IND', 'Kumkum Mohod', 'ok', 'Złoto Igrzysk Azjatyckich 2026.'),
  ('klasyczny-kobiety', 13, 'Indywidualnie', 'Igrzyska Azjatyckie 2026, Nagoja', '2026-09-25', 1, null, null, 'pending', '2 najlepszych z różnych krajów.'),
  ('klasyczny-kobiety', 14, 'Indywidualnie', 'Igrzyska Europejskie 2027, Stambuł', '2027-06-16', 1, null, null, 'pending', '2 najlepszych z różnych krajów.'),
  ('klasyczny-kobiety', 15, 'Indywidualnie', 'Igrzyska Europejskie 2027, Stambuł', '2027-06-16', 1, null, null, 'pending', '2 najlepszych z różnych krajów.'),
  ('klasyczny-kobiety', 16, 'Indywidualnie', 'Igrzyska Panamerykańskie 2027, Lima', '2027-07-23', 1, null, null, 'pending', '2 najlepszych z różnych krajów.'),
  ('klasyczny-kobiety', 17, 'Indywidualnie', 'Igrzyska Panamerykańskie 2027, Lima', '2027-07-23', 1, null, null, 'pending', '2 najlepszych z różnych krajów.'),
  ('klasyczny-kobiety', 18, 'Indywidualnie', 'Kontynentalny turniej kwalifikacyjny 2028 – Europa', null, 1, null, null, 'pending', null),
  ('klasyczny-kobiety', 19, 'Indywidualnie', 'Kontynentalny turniej kwalifikacyjny 2028 – Europa', null, 1, null, null, 'pending', null),
  ('klasyczny-kobiety', 20, 'Indywidualnie', 'Kontynentalny turniej kwalifikacyjny 2028 – Europa', null, 1, null, null, 'pending', null),
  ('klasyczny-kobiety', 21, 'Indywidualnie', 'Kontynentalny turniej kwalifikacyjny 2028 – Azja', null, 1, null, null, 'pending', null),
  ('klasyczny-kobiety', 22, 'Indywidualnie', 'Kontynentalny turniej kwalifikacyjny 2028 – Azja', null, 1, null, null, 'pending', null),
  ('klasyczny-kobiety', 23, 'Indywidualnie', 'Kontynentalny turniej kwalifikacyjny 2028 – Ameryki', null, 1, null, null, 'pending', null),
  ('klasyczny-kobiety', 24, 'Indywidualnie', 'Kontynentalny turniej kwalifikacyjny 2028 – Ameryki', null, 1, null, null, 'pending', null),
  ('klasyczny-kobiety', 25, 'Indywidualnie', 'Kontynentalny turniej kwalifikacyjny 2028 – Afryka', null, 1, null, null, 'pending', null),
  ('klasyczny-kobiety', 26, 'Indywidualnie', 'Kontynentalny turniej kwalifikacyjny 2028 – Afryka', null, 1, null, null, 'pending', null),
  ('klasyczny-kobiety', 27, 'Indywidualnie', 'Kontynentalny turniej kwalifikacyjny 2028 – Oceania', null, 1, null, null, 'pending', null),
  ('klasyczny-kobiety', 28, 'Indywidualnie', 'Światowy turniej kwalifikacyjny (FIQT) 2028', null, 1, null, null, 'pending', 'Maks. 1 na kraj.'),
  ('klasyczny-kobiety', 29, 'Indywidualnie', 'Światowy turniej kwalifikacyjny (FIQT) 2028', null, 1, null, null, 'pending', 'Maks. 1 na kraj.'),
  ('klasyczny-kobiety', 30, 'Miejsca uniwersalne', 'Komisja Trójstronna', null, 1, null, null, 'pending', 'Przyznawane po zgłoszeniach komitetów (do 15.01.2028).'),
  ('klasyczny-kobiety', 31, 'Miejsca uniwersalne', 'Komisja Trójstronna', null, 1, null, null, 'pending', 'Przyznawane po zgłoszeniach komitetów (do 15.01.2028).'),
  ('klasyczny-mezczyzni', 1, 'Gospodarz', 'Stany Zjednoczone – gospodarz', '2027-09-20', 3, 'USA', null, 'virt', '3 miejsca, jeśli USA zgłoszą drużynę na MŚ 2027; przy 1–2 zawodnikach – po 1 miejscu.'),
  ('klasyczny-mezczyzni', 2, 'Drużyny (3 łuczników)', 'Mistrzostwa świata 2027, Medellín', '2027-09-20', 3, null, null, 'pending', '3 najlepsze drużyny.'),
  ('klasyczny-mezczyzni', 3, 'Drużyny (3 łuczników)', 'Mistrzostwa świata 2027, Medellín', '2027-09-20', 3, null, null, 'pending', '3 najlepsze drużyny.'),
  ('klasyczny-mezczyzni', 4, 'Drużyny (3 łuczników)', 'Mistrzostwa świata 2027, Medellín', '2027-09-20', 3, null, null, 'pending', '3 najlepsze drużyny.'),
  ('klasyczny-mezczyzni', 5, 'Drużyny (3 łuczników)', 'Mistrzostwa Europy 2028, Nottingham', '2028-05-15', 3, null, null, 'pending', 'Najlepsza drużyna (Europa).'),
  ('klasyczny-mezczyzni', 6, 'Drużyny (3 łuczników)', 'Mistrzostwa Azji 2027, Hangzhou', '2027-11-01', 3, null, null, 'pending', 'Najlepsza drużyna (Azja).'),
  ('klasyczny-mezczyzni', 7, 'Drużyny (3 łuczników)', 'Mistrzostwa panamerykańskie 2028', '2028-03-01', 3, null, null, 'pending', 'Najlepsza drużyna (Ameryki).'),
  ('klasyczny-mezczyzni', 8, 'Drużyny (3 łuczników)', 'Światowy turniej kwalifikacyjny drużyn (FTQT) 2028', null, 3, null, null, 'pending', 'Zwycięska drużyna; dla krajów bez drużyny z MŚ i mistrzostw kontynentów.'),
  ('klasyczny-mezczyzni', 9, 'Indywidualnie', 'Mistrzostwa świata 2027, Medellín', '2027-09-20', 1, null, null, 'pending', '3 najlepszych z krajów bez drużyny, maks. 1 na kraj.'),
  ('klasyczny-mezczyzni', 10, 'Indywidualnie', 'Mistrzostwa świata 2027, Medellín', '2027-09-20', 1, null, null, 'pending', '3 najlepszych z krajów bez drużyny, maks. 1 na kraj.'),
  ('klasyczny-mezczyzni', 11, 'Indywidualnie', 'Mistrzostwa świata 2027, Medellín', '2027-09-20', 1, null, null, 'pending', '3 najlepszych z krajów bez drużyny, maks. 1 na kraj.'),
  ('klasyczny-mezczyzni', 12, 'Indywidualnie', 'Igrzyska Azjatyckie 2026, Nagoja', '2026-09-25', 1, null, null, 'pending', '2 najlepszych z różnych krajów.'),
  ('klasyczny-mezczyzni', 13, 'Indywidualnie', 'Igrzyska Azjatyckie 2026, Nagoja', '2026-09-25', 1, null, null, 'pending', '2 najlepszych z różnych krajów.'),
  ('klasyczny-mezczyzni', 14, 'Indywidualnie', 'Igrzyska Europejskie 2027, Stambuł', '2027-06-16', 1, null, null, 'pending', '2 najlepszych z różnych krajów.'),
  ('klasyczny-mezczyzni', 15, 'Indywidualnie', 'Igrzyska Europejskie 2027, Stambuł', '2027-06-16', 1, null, null, 'pending', '2 najlepszych z różnych krajów.'),
  ('klasyczny-mezczyzni', 16, 'Indywidualnie', 'Igrzyska Panamerykańskie 2027, Lima', '2027-07-23', 1, null, null, 'pending', '2 najlepszych z różnych krajów.'),
  ('klasyczny-mezczyzni', 17, 'Indywidualnie', 'Igrzyska Panamerykańskie 2027, Lima', '2027-07-23', 1, null, null, 'pending', '2 najlepszych z różnych krajów.'),
  ('klasyczny-mezczyzni', 18, 'Indywidualnie', 'Kontynentalny turniej kwalifikacyjny 2028 – Europa', null, 1, null, null, 'pending', null),
  ('klasyczny-mezczyzni', 19, 'Indywidualnie', 'Kontynentalny turniej kwalifikacyjny 2028 – Europa', null, 1, null, null, 'pending', null),
  ('klasyczny-mezczyzni', 20, 'Indywidualnie', 'Kontynentalny turniej kwalifikacyjny 2028 – Europa', null, 1, null, null, 'pending', null),
  ('klasyczny-mezczyzni', 21, 'Indywidualnie', 'Kontynentalny turniej kwalifikacyjny 2028 – Azja', null, 1, null, null, 'pending', null),
  ('klasyczny-mezczyzni', 22, 'Indywidualnie', 'Kontynentalny turniej kwalifikacyjny 2028 – Azja', null, 1, null, null, 'pending', null),
  ('klasyczny-mezczyzni', 23, 'Indywidualnie', 'Kontynentalny turniej kwalifikacyjny 2028 – Ameryki', null, 1, null, null, 'pending', null),
  ('klasyczny-mezczyzni', 24, 'Indywidualnie', 'Kontynentalny turniej kwalifikacyjny 2028 – Ameryki', null, 1, null, null, 'pending', null),
  ('klasyczny-mezczyzni', 25, 'Indywidualnie', 'Kontynentalny turniej kwalifikacyjny 2028 – Afryka', null, 1, null, null, 'pending', null),
  ('klasyczny-mezczyzni', 26, 'Indywidualnie', 'Kontynentalny turniej kwalifikacyjny 2028 – Afryka', null, 1, null, null, 'pending', null),
  ('klasyczny-mezczyzni', 27, 'Indywidualnie', 'Kontynentalny turniej kwalifikacyjny 2028 – Oceania', null, 1, null, null, 'pending', null),
  ('klasyczny-mezczyzni', 28, 'Indywidualnie', 'Światowy turniej kwalifikacyjny (FIQT) 2028', null, 1, null, null, 'pending', 'Maks. 1 na kraj.'),
  ('klasyczny-mezczyzni', 29, 'Indywidualnie', 'Światowy turniej kwalifikacyjny (FIQT) 2028', null, 1, null, null, 'pending', 'Maks. 1 na kraj.'),
  ('klasyczny-mezczyzni', 30, 'Miejsca uniwersalne', 'Komisja Trójstronna', null, 1, null, null, 'pending', 'Przyznawane po zgłoszeniach komitetów (do 15.01.2028).'),
  ('klasyczny-mezczyzni', 31, 'Miejsca uniwersalne', 'Komisja Trójstronna', null, 1, null, null, 'pending', 'Przyznawane po zgłoszeniach komitetów (do 15.01.2028).'),
  ('mieszana-klasyczny', 1, 'Igrzyska kontynentalne (1 K + 1 M)', 'Igrzyska Azjatyckie 2026, Nagoja', '2026-09-25', 2, null, null, 'pending', 'Zwycięska drużyna mieszana.'),
  ('mieszana-klasyczny', 2, 'Igrzyska kontynentalne (1 K + 1 M)', 'Igrzyska Europejskie 2027, Stambuł', '2027-06-16', 2, null, null, 'pending', 'Zwycięska drużyna mieszana.'),
  ('mieszana-klasyczny', 3, 'Igrzyska kontynentalne (1 K + 1 M)', 'Igrzyska Panamerykańskie 2027, Lima', '2027-07-23', 2, null, null, 'pending', 'Zwycięska drużyna mieszana.'),
  ('mieszana-klasyczny', 4, 'Igrzyska kontynentalne (1 K + 1 M)', 'Igrzyska Pacyfiku 2027, Tahiti', '2027-07-24', 2, null, null, 'pending', 'Zwycięska drużyna mieszana.'),
  ('mieszana-klasyczny', 5, 'Igrzyska kontynentalne (1 K + 1 M)', 'Igrzyska Afrykańskie 2027, Kair', '2027-08-27', 2, null, null, 'pending', 'Zwycięska drużyna mieszana.'),
  ('mieszana-bloczkowy', 1, 'Gospodarz', 'Stany Zjednoczone – gospodarz', '2027-09-20', 2, 'USA', null, 'virt', 'Jeśli USA zgłoszą łuczników bloczkowych obu płci na MŚ 2027.'),
  ('mieszana-bloczkowy', 2, 'Mistrzostwa świata', 'Mistrzostwa świata 2027, Medellín', '2027-09-20', 2, null, null, 'pending', '3 najlepsze drużyny mieszane.'),
  ('mieszana-bloczkowy', 3, 'Mistrzostwa świata', 'Mistrzostwa świata 2027, Medellín', '2027-09-20', 2, null, null, 'pending', '3 najlepsze drużyny mieszane.'),
  ('mieszana-bloczkowy', 4, 'Mistrzostwa świata', 'Mistrzostwa świata 2027, Medellín', '2027-09-20', 2, null, null, 'pending', '3 najlepsze drużyny mieszane.'),
  ('mieszana-bloczkowy', 5, 'Igrzyska kontynentalne', 'Igrzyska Azjatyckie 2026, Nagoja', '2026-09-25', 2, 'IND', 'Chikitha Taniparthi, Sahil Jadhav', 'ok', 'Złoto w finale z Koreą Płd. (158:157).'),
  ('mieszana-bloczkowy', 6, 'Igrzyska kontynentalne', 'Igrzyska Europejskie 2027, Stambuł', '2027-06-16', 2, null, null, 'pending', 'Zwycięska drużyna mieszana.'),
  ('mieszana-bloczkowy', 7, 'Igrzyska kontynentalne', 'Igrzyska Panamerykańskie 2027, Lima', '2027-07-23', 2, null, null, 'pending', 'Zwycięska drużyna mieszana.'),
  ('mieszana-bloczkowy', 8, 'Igrzyska kontynentalne', 'Igrzyska Pacyfiku 2027, Tahiti', '2027-07-24', 2, null, null, 'pending', 'Zwycięska drużyna mieszana.'),
  ('mieszana-bloczkowy', 9, 'Igrzyska kontynentalne', 'Igrzyska Afrykańskie 2027, Kair', '2027-08-27', 2, null, null, 'pending', 'Zwycięska drużyna mieszana.'),
  ('mieszana-bloczkowy', 10, 'Ranking światowy', 'Ranking drużyn mieszanych (bloczkowy) przed FTQT 2028', null, 2, null, null, 'pending', '2 najwyżej sklasyfikowane drużyny bez kwalifikacji.'),
  ('mieszana-bloczkowy', 11, 'Ranking światowy', 'Ranking drużyn mieszanych (bloczkowy) przed FTQT 2028', null, 2, null, null, 'pending', '2 najwyżej sklasyfikowane drużyny bez kwalifikacji.'),
  ('mieszana-bloczkowy', 12, 'Turniej kwalifikacyjny', 'Światowy turniej kwalifikacyjny (FTQT) 2028', null, 2, null, null, 'pending', 'Zwycięska drużyna mieszana.')
) as v(slug, kolejnosc, sciezka, zawody, data, liczba, kraj, zawodnik, status, uwagi)
join public.konkurencje k on k.slug = v.slug
join public.dyscypliny d on d.id = k.dyscyplina_id and d.slug = 'lucznictwo'
where not exists (select 1 from public.kwoty x where x.konkurencja_id = k.id);

-- Kalendarz kwalifikacji
delete from public.terminy t using public.dyscypliny d where d.id = t.dyscyplina_id and d.slug = 'lucznictwo';
insert into public.terminy (dyscyplina_id, data_od, data_do, etykieta_daty, tytul, opis, typ, kolejnosc)
select d.id, v.od::date, v.do_::date, v.etykieta, v.tytul, v.opis, v.typ, v.kol
from (values
  ('2026-09-15', null, '15.09.2026', 'Start okresu kwalifikacji', 'Od tego dnia można zdobywać minimum (MQS): łuk klasyczny 650 pkt (M) / 620 pkt (K) na 70 m.', 'okno', 1),
  ('2026-09-25', '2026-10-03', '25.09–03.10.2026', 'Igrzyska Azjatyckie, Nagoja', '2 miejsca indywidualne na płeć, para mieszana (klasyczny i bloczkowy).', 'kontynentalne', 2),
  ('2027-06-16', '2027-06-27', '16–27.06.2027', 'Igrzyska Europejskie, Stambuł', '2 miejsca indywidualne na płeć, para mieszana (klasyczny i bloczkowy). Najbliższa szansa Polaków.', 'kontynentalne', 3),
  ('2027-07-23', '2027-08-07', '23.07–07.08.2027', 'Igrzyska Panamerykańskie, Lima', '2 miejsca indywidualne na płeć, para mieszana.', 'kontynentalne', 4),
  ('2027-07-24', '2027-08-07', '24.07–07.08.2027', 'Igrzyska Pacyfiku, Tahiti', 'Para mieszana (klasyczny i bloczkowy).', 'kontynentalne', 5),
  ('2027-08-27', '2027-09-10', '27.08–10.09.2027', 'Igrzyska Afrykańskie, Kair', 'Para mieszana (klasyczny i bloczkowy).', 'kontynentalne', 6),
  ('2027-09-20', '2027-09-27', '20–27.09.2027', 'Mistrzostwa świata, Medellín', '3 drużyny i 3 miejsca indywidualne na płeć, 3 pary bloczkowe.', 'okno', 7),
  ('2027-11-01', null, 'listopad 2027', 'Mistrzostwa Azji, Hangzhou', '1 drużyna na płeć.', 'kontynentalne', 8),
  ('2028-01-15', null, '15.01.2028', 'Wnioski o miejsca uniwersalne', 'Termin zgłoszeń komitetów olimpijskich.', 'formalny', 9),
  ('2028-05-15', null, 'maj–czerwiec 2028', 'Mistrzostwa Europy, Nottingham', '1 drużyna na płeć (Europa).', 'kontynentalne', 10),
  (null, null, '2028 – termin wkrótce', 'Kontynentalne turnieje kwalifikacyjne', 'Europa: 3 miejsca na płeć, Azja/Ameryki/Afryka: 2, Oceania: 1.', 'okno', 11),
  (null, null, '2028 – termin wkrótce', 'Światowy turniej kwalifikacyjny (FIQT/FTQT)', '1 drużyna i 2 miejsca indywidualne na płeć, 1 para bloczkowa.', 'okno', 12),
  ('2028-06-26', null, '26.06.2028', 'Zgłoszenia na igrzyska', 'Ostateczny termin zgłoszeń zawodników.', 'formalny', 13),
  ('2028-07-14', '2028-07-30', '14–30.07.2028', 'Igrzyska olimpijskie', 'Turnieje łuczników w Los Angeles.', 'igrzyska', 14)
) as v(od, do_, etykieta, tytul, opis, typ, kol)
join public.dyscypliny d on d.slug = 'lucznictwo';
