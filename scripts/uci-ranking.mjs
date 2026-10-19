// Pobiera ranking z UCI DataRide (ten sam endpoint, który zasila tabelę na stronie)
// i zapisuje go jako CSV + JSON. Wymaga Node.js 18 lub nowszego (wbudowany fetch).
//
// Użycie:
//   node uci-ranking.mjs                 -> pobiera ranking "mtb-xco-men" i zapisuje pliki
//   node uci-ranking.mjs mtb-xco-men     -> to samo, z nazwą rankingu
//   node uci-ranking.mjs --inspect       -> pokazuje surowy pierwszy wiersz (do sprawdzenia nazw pól)
//
// Nowy ranking UCI = nowy wpis w RANKINGS (parametry bierzesz z zakładki "Ładunek" w DevTools).

import { writeFile } from 'node:fs/promises';

const RANKINGS = {
  'mtb-xco-men': {
    label: 'MTB – ranking kwalifikacji olimpijskiej, mężczyźni',
    sourceUrl: 'https://dataride.uci.ch/iframe/RankingDetails/220?disciplineId=7&groupId=136&momentId=202689&disciplineSeasonId=453&rankingTypeId=3&categoryId=22&raceTypeId=0',
    rankingId: 220,
    disciplineId: 7,
    rankingTypeId: 3,
    filters: { RaceTypeId: 0, CategoryId: 22, SeasonId: 453, MomentId: '', CountryId: 0, IndividualName: '', TeamName: '' }
  }
};

const ENDPOINT = 'https://dataride.uci.ch/iframe/ObjectRankings/';
const PAGE_SIZE = 200;      // strona UCI używa 40; większa paczka = mniej zapytań
const PAUSE_MS = 600;       // grzeczna przerwa między stronami
const MAX_PAGES = 100;      // bezpiecznik

const args = process.argv.slice(2);
const inspect = args.includes('--inspect');
const key = args.find(a => !a.startsWith('--')) || 'mtb-xco-men';
const cfg = RANKINGS[key];
if (!cfg) {
  console.error(`Nie znam rankingu "${key}". Dostępne: ${Object.keys(RANKINGS).join(', ')}`);
  process.exit(1);
}

function body(skip, take) {
  const p = new URLSearchParams();
  p.set('rankingId', cfg.rankingId);
  p.set('disciplineId', cfg.disciplineId);
  p.set('rankingTypeId', cfg.rankingTypeId);
  p.set('take', take);
  p.set('skip', skip);
  p.set('page', Math.floor(skip / take) + 1);
  p.set('pageSize', take);
  Object.entries(cfg.filters).forEach(([field, value], i) => {
    p.set(`filter[filters][${i}][field]`, field);
    p.set(`filter[filters][${i}][value]`, String(value));
  });
  return p.toString();
}

async function fetchPage(skip, take) {
  const res = await fetch(ENDPOINT, {
    method: 'POST',
    headers: {
      'accept': 'application/json, text/javascript, */*; q=0.01',
      'content-type': 'application/x-www-form-urlencoded; charset=UTF-8',
      'x-requested-with': 'XMLHttpRequest',
      'origin': 'https://dataride.uci.ch',
      'referer': cfg.sourceUrl,
      'user-agent': 'DrogaDoLA28/1.0 (ranking dla strony Sportowy Rytm Dnia)'
    },
    body: body(skip, take)
  });
  if (!res.ok) throw new Error(`UCI odpowiedziało ${res.status} ${res.statusText}`);
  const json = await res.json();
  // Odpowiedź siatki Kendo: { data: [...], total: N } (wielkość liter bywa różna)
  const rows = json.data ?? json.Data ?? (Array.isArray(json) ? json : []);
  const total = json.total ?? json.Total ?? null;
  return { rows, total };
}

// Nazwy pól w odpowiedzi UCI – szukamy kilku wariantów, bez względu na wielkość liter.
function pick(row, ...names) {
  const keys = Object.keys(row);
  for (const n of names) {
    const k = keys.find(x => x.toLowerCase() === n.toLowerCase());
    if (k !== undefined && row[k] !== null && row[k] !== '') return row[k];
  }
  return '';
}

function normalize(row) {
  return {
    pozycja: pick(row, 'Rank', 'Ranking', 'Position', 'Pos'),
    zawodnik: pick(row, 'FullName', 'DisplayName', 'IndividualName', 'Name'),
    kraj: pick(row, 'NationFullName', 'NationName', 'CountryName'),
    kod_kraju: pick(row, 'NationCode', 'CountryCode', 'CountryIsoCode', 'Nation'),
    druzyna: pick(row, 'TeamName', 'Team'),
    punkty: pick(row, 'Points', 'Pts', 'TotalPoints')
  };
}

function toCsv(rows) {
  const cols = Object.keys(rows[0] ?? normalize({}));
  const esc = v => {
    const s = String(v ?? '');
    return /[",\n;]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  return [cols.join(','), ...rows.map(r => cols.map(c => esc(r[c])).join(','))].join('\n');
}

const sleep = ms => new Promise(r => setTimeout(r, ms));

async function main() {
  console.log(`Pobieram: ${cfg.label}`);
  const raw = [];
  let total = null;
  for (let page = 0; page < MAX_PAGES; page++) {
    const { rows, total: t } = await fetchPage(page * PAGE_SIZE, PAGE_SIZE);
    if (t !== null) total = t;
    if (inspect) {
      console.log('Liczba wierszy w rankingu:', total);
      console.log('Pierwszy wiersz (surowy):');
      console.log(JSON.stringify(rows[0], null, 2));
      return;
    }
    raw.push(...rows);
    process.stdout.write(`  ${raw.length}${total ? ' / ' + total : ''}\r`);
    if (rows.length < PAGE_SIZE || (total !== null && raw.length >= total)) break;
    await sleep(PAUSE_MS);
  }
  console.log('');

  if (raw.length === 0) {
    console.error('UCI nie zwróciło żadnych wierszy. Sprawdź parametry w RANKINGS (np. SeasonId).');
    process.exit(1);
  }

  const rows = raw.map(normalize);
  if (rows.every(r => r.pozycja === '')) rows.forEach((r, i) => { r.pozycja = i + 1; });
  if (rows.every(r => r.punkty === '')) {
    console.warn('Uwaga: nie znalazłem pola z punktami. Uruchom z --inspect i podeślij wynik.');
  }

  const stamp = new Date().toISOString().slice(0, 10);
  const base = `${key}-${stamp}`;
  await writeFile(`${base}.csv`, '﻿' + toCsv(rows), 'utf8');   // BOM: polskie znaki w Excelu
  await writeFile(`${base}.json`, JSON.stringify({
    ranking: key, label: cfg.label, source: cfg.sourceUrl, fetchedAt: new Date().toISOString(), total: rows.length, rows
  }, null, 2), 'utf8');

  const pol = rows.filter(r => /poland|polska|^pol$/i.test(String(r.kraj)) || /^pol$/i.test(String(r.kod_kraju)));
  console.log(`Zapisano ${rows.length} zawodników do ${base}.csv i ${base}.json`);
  console.log(pol.length ? 'Polacy w rankingu:' : 'Brak Polaków w rankingu.');
  pol.forEach(r => console.log(`  ${r.pozycja}. ${r.zawodnik} – ${r.punkty} pkt`));
}

main().catch(err => {
  console.error('Błąd:', err.message);
  process.exit(1);
});
