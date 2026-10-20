// Ranking mężczyzn w golfie z publicznego API OWGR (to samo, z którego korzysta owgr.com).
// Olympic Golf Ranking mężczyzn liczy się tym samym wzorem co OWGR (średnia z 2 lat, dzielnik 40–52),
// więc kolejność OGR = kolejność OWGR; różnią się kraje: Anglia, Szkocja, Walia → Wielka Brytania.

const API = 'https://apiweb.owgr.com/api/owgr/rankings/getRankings';
const PAGE = 1000;

// Kraje „golfowe” → kraj olimpijski (kod MKOl)
const HOME_NATIONS = { ENG: 'GBR', SCO: 'GBR', WAL: 'GBR' };

export async function fetchOwgrRanking(params = {}) {
  const top = Number(params.top) || 1000;   // ile pierwszych miejsc zapisać (Polacy zapisują się zawsze)
  const nir = params.nir || 'IRL';          // Irlandia Płn. – golfiści startują zwykle dla Irlandii
  const overrides = params.kraje || {};     // np. { "Tom McKibbin": "GBR" }
  const rows = [];
  for (let page = 1; page <= 15; page++) {
    const url = `${API}?regionId=0&pageSize=${PAGE}&pageNumber=${page}&countryId=0&sortString=Rank+ASC`;
    const res = await fetch(url, { headers: { accept: 'application/json', 'user-agent': 'Mozilla/5.0 (SportowyRytmDnia; ranking LA28)' }, cache: 'no-store' });
    if (!res.ok) throw new Error(`OWGR odpowiedział ${res.status}.`);
    const json = await res.json();
    const list = json.rankingsList || [];
    for (const it of list) {
      const p = it.player || {};
      const c = p.country || {};
      const raw = String(c.iocCode || c.code3 || '').toUpperCase();
      const name = p.fullName || [p.firstName, p.lastName].filter(Boolean).join(' ');
      const code = overrides[name] || (raw === 'NIR' ? nir : HOME_NATIONS[raw] || raw);
      if (it.rank > top && code !== 'POL') continue;
      rows.push({
        pozycja: it.rank,
        zawodnik: name + (p.isAmateur ? ' (am.)' : ''),
        kraj: c.name || null,
        kod_kraju: code || null,
        punkty: it.pointsAverage ?? null,
        dodatkowe: { dzielnik: it.divisorApplied ?? null, owgr_kraj: raw || null }
      });
    }
    if (!list.length || page >= (json.totalNumberOfPages || 0)) break;
  }
  if (rows.length < 100) throw new Error('OWGR zwrócił za mało wierszy.');
  return rows;
}
