-- Koszykówka 3x3: ranking krajów FIBA 3x3 wklejany w panelu (strona FIBA nie udostępnia danych).
-- Daje 5 wirtualnych miejsc na płeć: najlepszy kraj z Afryki, Europy, Ameryk + 2 z Azji i Oceanii (min. 1 z Azji).
insert into public.zrodla_rankingow (slug, nazwa, typ, rodzaj, adres_strony, konkurencja_id, zasady)
select v.slug, v.nazwa, 'wklejka', 'krajowy', 'https://fiba3x3.com/en/rankings/federation.html', k.id,
  '{"algorytm": "kwoty-ranking-kontynenty", "sciezka": "Ranking krajów FIBA 3x3", "zamkniecie": "2027-12-01",
    "grupy": [
      {"etykieta": "Afryka", "kontynenty": ["Afryka"], "miejsc": 1},
      {"etykieta": "Europa", "kontynenty": ["Europa"], "miejsc": 1},
      {"etykieta": "Ameryki", "kontynenty": ["Ameryka"], "miejsc": 1},
      {"etykieta": "Azja i Oceania", "kontynenty": ["Azja", "Oceania"], "miejsc": 2, "minAzja": 1}
    ],
    "pozostali": "Pozostałe kraje: turnieje i serie kwalifikacyjne 2028. Uwaga: wklejamy ranking federacji FIBA 3x3 (top 25 zawodników) – oficjalny ranking olimpijski liczy 20 najlepszych, więc kolejność może się nieznacznie różnić.",
    "regulamin": "https://cdn.nocnsf.nl/media/a3vagxnn/bk3-la28-qualification-system.pdf"}'::jsonb
from (values ('fiba3x3-m', 'Koszykówka 3x3 – ranking krajów, mężczyźni', 'mezczyzni'), ('fiba3x3-k', 'Koszykówka 3x3 – ranking krajów, kobiety', 'kobiety')) as v(slug, nazwa, ev)
join public.dyscypliny d on d.slug = 'koszykowka-3x3'
join public.konkurencje k on k.dyscyplina_id = d.id and k.slug = v.ev
on conflict (slug) do nothing;
