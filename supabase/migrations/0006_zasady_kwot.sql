-- Sportowy Rytm Dnia · Kwalifikacje LA28
-- 0006: zasady przydziału miejsc z rankingu (progi kwot) dla każdego źródła.
-- Uruchom w Supabase: SQL Editor → New query → wklej całość → Run. Można uruchomić ponownie.

alter table public.zrodla_rankingow
  add column if not exists zasady jsonb;

-- MTB XCO (regulamin UCI dla LA28, wersja z 12.05.2026):
-- ranking olimpijski krajów: miejsca 1–8 → 2 zawodników, 9–19 → 1 zawodnik.
update public.zrodla_rankingow
set zasady = '{
  "progi": [ { "od": 1, "do": 8, "miejsc": 2 }, { "od": 9, "do": 19, "miejsc": 1 } ],
  "pozostali": "Szansa jeszcze przez MŚ 2027 (4 miejsca) albo mistrzostwa kontynentu 2027 (Afryka, Ameryki, Azja).",
  "zamkniecie": "2028-05-30",
  "regulamin": "https://stillmed.olympics.com/media/Documents/Olympic-Games/LA28/MTB-LA28-Qualification-System.pdf"
}'::jsonb
where slug = 'uci-mtb-xco-m';
