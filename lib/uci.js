// Pobieranie rankingów z UCI DataRide – ten sam endpoint, który zasila tabele na stronie UCI.
// Parametry źródła (zrodla_rankingow.parametry): { rankingId, disciplineId, rankingTypeId, filters: {...} }

const ENDPOINT = 'https://dataride.uci.ch/iframe/ObjectRankings/';
const PAGE_SIZE = 200;
const MAX_PAGES = 50;

function body(p, skip, take) {
  const q = new URLSearchParams();
  q.set('rankingId', p.rankingId);
  q.set('disciplineId', p.disciplineId);
  q.set('rankingTypeId', p.rankingTypeId);
  q.set('take', take);
  q.set('skip', skip);
  q.set('page', Math.floor(skip / take) + 1);
  q.set('pageSize', take);
  Object.entries(p.filters || {}).forEach(([field, value], i) => {
    q.set(`filter[filters][${i}][field]`, field);
    q.set(`filter[filters][${i}][value]`, value === null || value === undefined ? '' : String(value));
  });
  return q.toString();
}

function pick(row, ...names) {
  const keys = Object.keys(row || {});
  for (const n of names) {
    const k = keys.find(x => x.toLowerCase() === n.toLowerCase());
    if (k !== undefined && row[k] !== null && row[k] !== '') return row[k];
  }
  return null;
}

export function normalizeUciRow(row, index) {
  const pos = Number(pick(row, 'Rank', 'Ranking', 'Position', 'Pos'));
  const pts = Number(String(pick(row, 'Points', 'Pts', 'TotalPoints') ?? '').replace(',', '.'));
  return {
    pozycja: Number.isFinite(pos) && pos > 0 ? pos : index + 1,
    zawodnik: String(pick(row, 'FullName', 'DisplayName', 'IndividualName', 'Name') ?? '').trim(),
    kraj: pick(row, 'NationFullName', 'NationName', 'CountryName'),
    kod_kraju: pick(row, 'NationCode', 'CountryCode', 'CountryIsoCode', 'Nation'),
    punkty: Number.isFinite(pts) ? pts : null,
    dodatkowe: { druzyna: pick(row, 'TeamName', 'Team') }
  };
}

export async function fetchUciRanking(params, { referer } = {}) {
  const raw = [];
  let total = null;
  for (let page = 0; page < MAX_PAGES; page++) {
    const res = await fetch(ENDPOINT, {
      method: 'POST',
      headers: {
        accept: 'application/json, text/javascript, */*; q=0.01',
        'content-type': 'application/x-www-form-urlencoded; charset=UTF-8',
        'x-requested-with': 'XMLHttpRequest',
        origin: 'https://dataride.uci.ch',
        referer: referer || 'https://dataride.uci.ch/',
        'user-agent': 'SportowyRytmDnia/1.0 (status kwalifikacji LA28)'
      },
      body: body(params, page * PAGE_SIZE, PAGE_SIZE),
      cache: 'no-store'
    });
    if (!res.ok) throw new Error(`UCI odpowiedziało ${res.status} ${res.statusText}`);
    const json = await res.json();
    const rows = json.data ?? json.Data ?? (Array.isArray(json) ? json : []);
    if (json.total ?? json.Total) total = json.total ?? json.Total;
    raw.push(...rows);
    if (rows.length < PAGE_SIZE || (total !== null && raw.length >= total)) break;
    await new Promise(r => setTimeout(r, 500));
  }
  if (raw.length === 0) throw new Error('UCI nie zwróciło żadnych wierszy – sprawdź parametry źródła (np. SeasonId).');
  return raw.map(normalizeUciRow).filter(r => r.zawodnik);
}

// Zamienia „Copy as cURL” z DevTools na parametry źródła UCI.
export function paramsFromCurl(curl) {
  const m = String(curl).match(/--data(?:-raw|-binary)?\s+(\$?)'([^']*)'/) || String(curl).match(/--data(?:-raw|-binary)?\s+"([^"]*)"/);
  const data = m ? (m[2] ?? m[1]) : null;
  if (!data) throw new Error('Nie znalazłem w cURL części --data-raw z parametrami.');
  const q = new URLSearchParams(data);
  const rankingId = q.get('rankingId');
  if (!rankingId) throw new Error('W parametrach brakuje rankingId – to chyba nie jest zapytanie ObjectRankings.');
  const filters = {};
  for (let i = 0; i < 30; i++) {
    const field = q.get(`filter[filters][${i}][field]`);
    if (field === null) break;
    filters[field] = q.get(`filter[filters][${i}][value]`) ?? '';
  }
  // MomentId pusty = zawsze najnowsze notowanie
  if ('MomentId' in filters) filters.MomentId = '';
  const ref = String(curl).match(/referer:\s*([^'"\s]+)/i);
  return {
    params: {
      rankingId: Number(rankingId),
      disciplineId: Number(q.get('disciplineId')),
      rankingTypeId: Number(q.get('rankingTypeId')),
      filters
    },
    referer: ref ? ref[1] : null
  };
}
