// Rankingi World Archery z API (api.worldarchery.org/v3/WORLDRANKINGS) – np. drużyny mieszane, łuk bloczkowy (CatCode=CX, Team=1).
// API zwraca po 20 wyników na stronę; nazwę parametru strony wykrywamy, bo nie jest opisana.

const PAGE_PARAMS = ['Page', 'page', 'PageNumber', 'pageNumber', 'PageNo', 'Start'];

function buildUrl(base, extra) {
  const u = new URL(base);
  for (const k of ['Date', 'RBP', ...PAGE_PARAMS]) u.searchParams.delete(k);
  u.searchParams.set('RBP', '20');
  for (const [k, v] of Object.entries(extra)) u.searchParams.set(k, String(v));
  return u.toString();
}

async function getJson(url) {
  const res = await fetch(url, { headers: { accept: 'application/json', 'user-agent': 'Mozilla/5.0 (SportowyRytmDnia; ranking LA28)', referer: 'https://www.worldarchery.sport/' }, cache: 'no-store' });
  if (!res.ok) throw new Error(`World Archery odpowiedział ${res.status}.`);
  return res.json();
}

function toRows(items) {
  return (items || []).map(it => {
    const team = it.Team || it.Athlete || {};
    const name = team.Name || [team.FName, team.GName].filter(Boolean).join(' ') || team.NOC;
    return { pozycja: Number(it.Rnk), zawodnik: name, kraj: null, kod_kraju: team.NOC || null, punkty: it.Points ?? null, stan: it.RnkDtIssued || null };
  }).filter(r => r.pozycja && r.zawodnik);
}

export async function fetchWorldArcheryRanking(params = {}) {
  if (!params.url || !/^https:\/\/api\.worldarchery\.org\//.test(params.url)) throw new Error('Brak linku do API World Archery.');
  const first = await getJson(buildUrl(params.url, {}));
  const rows = toRows(first.items);
  if (!rows.length) throw new Error('API World Archery zwróciło pusty ranking (sprawdź parametry, np. Team=1).');
  const total = first.pageInfo?.totalResults || rows.length;
  const pages = Math.ceil(total / 20);
  let pageParam = params.pageParam || null;
  for (let p = 1; p < pages && p < 50; p++) {
    let got = null;
    for (const name of pageParam ? [pageParam] : PAGE_PARAMS) {
      const value = name === 'Start' ? p * 20 : name.toLowerCase().includes('no') ? p + 1 : p;
      const json = await getJson(buildUrl(params.url, { [name]: value }));
      const r = toRows(json.items);
      if (r.length && r[0].pozycja > rows[rows.length - 1].pozycja - 1 && r[0].pozycja !== rows[0].pozycja) { got = r; pageParam = name; break; }
    }
    if (!got) break; // nie udało się przejść na kolejne strony – zostaje to, co mamy
    rows.push(...got);
  }
  const stanNa = rows[0].stan ? String(rows[0].stan).slice(0, 10) : undefined;
  return { rows: rows.map(({ stan, ...r }) => r), stanNa, complete: rows.length >= total };
}
