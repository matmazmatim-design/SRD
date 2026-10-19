# Sportowy Rytm Dnia

Strona SRD z działem **Kwalifikacje LA28** – status kwalifikacji Polaków do igrzysk w Los Angeles.

Next.js (App Router), hosting na Vercelu, dane w Supabase.

## Uruchomienie lokalnie

1. Zainstaluj Node.js 20 lub nowszy.
2. `npm install`
3. Skopiuj `.env.example` jako `.env.local` i wpisz adres oraz klucz `anon` z Supabase.
4. `npm run dev` i otwórz http://localhost:3000

## Wdrożenie

Każde wypchnięcie do gałęzi `main` wdraża się automatycznie na Vercelu.
W Vercelu ustaw zmienne `NEXT_PUBLIC_SUPABASE_URL` i `NEXT_PUBLIC_SUPABASE_ANON_KEY`.

## Struktura

- `app/` – strony: start (`/`), dyscypliny (`/dyscypliny`), dyscyplina (`/dyscypliny/[slug]`)
- `components/` – nagłówek, przełącznik trybu, kafle dyscyplin
- `lib/sports.js` – lista 37 dyscyplin LA28 (później z bazy)
- `lib/supabase.js` – klient Supabase
- `public/` – logo SRD na ciemne i jasne tło
- `scripts/uci-ranking.mjs` – pobieranie rankingów UCI (`npm run ranking:uci -- --inspect`)

## Motyw

Kolory są zmiennymi w `app/globals.css`. Tryb jasny włącza `data-theme="light"` na `<html>`;
wybór użytkownika zapisuje się w przeglądarce.
