// Czyste funkcje liczące to, co pokazują strony konkurencji (bez dostępu do bazy – łatwe do testowania).

export function isPolish(kraj) {
  return /^(polska|pol|poland)$/i.test(String(kraj || '').trim());
}

// Rodzaj statusu do kolorowania: ok (w strefie), warn (na granicy), res (rezerwa), out (poza).
export function statusKind(text) {
  const t = String(text || '').toLowerCase();
  if (t.startsWith('poza') || t.includes('limit kraju')) return 'out';
  if (t.startsWith('zakwalifik')) return /realokac|projekc/.test(t) ? 'warn' : 'ok';
  if (t.includes('rezerw')) return 'res';
  if (/realokac|projekc/.test(t)) return 'warn';
  if (/kwalifikacja|ranking|sztafet|gospodarz|nowa flaga|mś /.test(t)) return 'ok';
  return 'out';
}

export function splitLists(rows) {
  const by = { zakwalifikowani: [], rezerwa: [], limit_kraju: [], polacy: [] };
  for (const r of rows) (by[r.lista] || (by[r.lista] = [])).push(r);
  for (const k of Object.keys(by)) by[k].sort((a, b) => a.lp - b.lp);
  return by;
}

export function summarize(rows) {
  const lists = splitLists(rows);
  const q = lists.zakwalifikowani;
  const polesIn = q.filter(r => isPolish(r.kraj));
  const polesRes = lists.rezerwa.filter(r => isPolish(r.kraj));
  const countries = new Set(q.map(r => r.kraj)).size;
  const lastRank = q.reduce((m, r) => Math.max(m, Number(r.pozycja_rankingu) || 0), 0) || null;
  let state = 'out';
  if (polesIn.length) {
    state = polesIn.every(r => statusKind(r.sciezka) === 'warn') ? 'warn' : 'ok';
  } else if (polesRes.length || lists.polacy.some(r => statusKind(r.sciezka) === 'res')) {
    state = 'res';
  }
  return { lists, polesIn, polesRes, countries, lastRank, state, qualifiedCount: q.length };
}

// Skrócona lista: czołówka, okolice Polaków i koniec listy, z przerwami między fragmentami.
export function condense(list, { top = 5, around = 2, tail = 3 } = {}) {
  if (list.length <= top + tail + 6) return list.map(r => ({ type: 'row', row: r }));
  const keep = new Set();
  for (let i = 0; i < Math.min(top, list.length); i++) keep.add(i);
  for (let i = Math.max(0, list.length - tail); i < list.length; i++) keep.add(i);
  list.forEach((r, i) => {
    if (isPolish(r.kraj)) for (let j = i - around; j <= i + around; j++) if (j >= 0 && j < list.length) keep.add(j);
  });
  const idx = [...keep].sort((a, b) => a - b);
  const out = [];
  idx.forEach((i, k) => {
    if (k > 0 && i - idx[k - 1] > 1) out.push({ type: 'gap', from: list[idx[k - 1] + 1].lp, to: list[i - 1].lp });
    out.push({ type: 'row', row: list[i] });
  });
  return out;
}

export const STATE_LABEL = {
  ok: 'W strefie kwalifikacji',
  warn: 'Na granicy',
  res: 'Na liście rezerwowej',
  out: 'Poza strefą'
};

export function formatNumber(v, digits = 2) {
  if (v === null || v === undefined || v === '') return '—';
  const n = Number(v);
  if (!Number.isFinite(n)) return String(v);
  return n.toLocaleString('pl-PL', { minimumFractionDigits: digits, maximumFractionDigits: digits });
}

export function formatDatePl(iso) {
  if (!iso) return '';
  const [y, m, d] = String(iso).slice(0, 10).split('-');
  return `${d}.${m}.${y}`;
}

export function daysBetween(fromIso, toIso) {
  const a = new Date(String(fromIso).slice(0, 10) + 'T00:00:00Z');
  const b = new Date(String(toIso).slice(0, 10) + 'T00:00:00Z');
  return Math.round((b - a) / 86400000);
}
