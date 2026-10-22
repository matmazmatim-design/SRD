-- Sekcja „Zasady kwalifikacji” na stronie dyscypliny (kolumna dyscypliny.zasady) – na start judo.
-- Kafle kategorii judo bez długich opisów (zasady są teraz na stronie Judo). Można uruchomić ponownie.
alter table public.dyscypliny add column if not exists zasady jsonb;

update public.dyscypliny set zasady = $${
  "wstep": "Wszystko rozstrzyga ranking olimpijski IJF. Miejsca należą do zawodników, ale kraj może mieć tylko jednego judokę w kategorii.",
  "liczby": [
    {"wartosc": "372", "opis": "miejsca w Los Angeles"},
    {"wartosc": "14", "opis": "kategorii wagowych (7 + 7)"},
    {"wartosc": "1", "opis": "zawodnik z kraju w kategorii"},
    {"wartosc": "12.06.2028", "opis": "zamknięcie rankingu IJF"}
  ],
  "podzial": {"tytul": "Skąd biorą się miejsca – na płeć (183)", "czesci": [
    {"etykieta": "Ranking", "liczba": 119, "opis": "Top 17 w każdej kategorii (7 × 17)"},
    {"etykieta": "Kontynenty", "liczba": 52, "opis": "Kwoty kontynentalne"},
    {"etykieta": "Gospodarz", "liczba": 7, "opis": "Gospodarz – USA, 1 w kategorii"},
    {"etykieta": "Uniwersalne", "liczba": 5, "opis": "Miejsca uniwersalne"}
  ]},
  "kroki": [
    {"tytul": "Top 17 w rankingu olimpijskim", "opis": "W każdej kategorii miejsce dostaje 17 najlepszych zawodników. Liczy się tylko najlepszy z danego kraju – drugi Japończyk czy Azer nie zabiera miejsca.", "meta": "238 miejsc · ranking 15.06.2026–12.06.2028"},
    {"tytul": "Kwoty kontynentalne", "opis": "Dla zawodników spoza top 17 – według kontynentów. Kraj może dostać tylko jedno takie miejsce, w jednej kategorii.", "meta": "104 miejsca dla obu płci · z tego samego rankingu"},
    {"tytul": "Gospodarz", "opis": "USA mają po jednym miejscu w każdej kategorii, jeśli nie zdobędą go z rankingu.", "meta": "14 miejsc"},
    {"tytul": "Miejsca uniwersalne i drużyna mieszana", "opis": "Komisja Trójstronna przyznaje 10 miejsc małym krajom. Drużyny mieszane tworzą kraje z zawodnikami w odpowiednich kategoriach – IJF może dodać 6 miejsc, by je uzupełnić.", "meta": "10 + 6 miejsc"}
  ],
  "statusy": "Po 15.06.2028 (lista IJF) zmieni się w"
}$$::jsonb
where slug = 'judo';

update public.konkurencje k set opis = null
from public.dyscypliny d
where d.id = k.dyscyplina_id and d.slug in ('judo-kobiety', 'judo-mezczyzni') and k.slug <> 'kwoty-kontynentalne';
