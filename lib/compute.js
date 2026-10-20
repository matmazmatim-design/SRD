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

// Trzy statusy pokazywane na stronie:
//  ok   – Zakwalifikowany: kwalifikacja pewna, już wywalczona,
//  virt – Wirtualna kwalifikacja: miejsce według dzisiejszego rankingu/symulacji,
//  res  – Rezerwa: bez kwalifikacji.
export const QUAL = {
  ok: { label: 'Zakwalifikowany', chip: 'chip chip-ok' },
  virt: { label: 'Wirtualna kwalifikacja', chip: 'chip chip-virt' },
  res: { label: 'Rezerwa', chip: 'chip chip-res' },
  pending: { label: 'Do rozstrzygnięcia', chip: 'chip chip-soon' }
};

// Status wiersza: z algorytmu (pole status) albo z opisu ścieżki (symulacje wgrane z arkusza).
export function rowKind(r) {
  return r?.status && QUAL[r.status] ? r.status : qualKind(r?.sciezka);
}

// Ścieżki, które dają kwalifikację już teraz (zawody rozegrane, gospodarz).
const CONFIRMED = /gospodarz|mś sztafet 2026|hamburg|potwierdz/i;

export function qualKind(sciezka, { confirmed = false } = {}) {
  const k = statusKind(sciezka);
  if (k === 'ok' || k === 'warn') return confirmed || CONFIRMED.test(String(sciezka || '')) ? 'ok' : 'virt';
  return 'res';
}

// Status kraju/zawodnika z rankingu z zasadami kwot: po zamknięciu rankingu kwota jest pewna.
export function quotaKind(pozycja, zasady, today = new Date().toISOString().slice(0, 10)) {
  if (!quotaFor(pozycja, zasady)) return 'res';
  return zasady?.zamkniecie && today > zasady.zamkniecie ? 'ok' : 'virt';
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
  const countries = new Set(q.map(r => r.kraj).filter(Boolean)).size;
  const lastRank = q.reduce((m, r) => Math.max(m, Number(r.pozycja_rankingu) || 0), 0) || null;
  const state = polesIn.some(r => rowKind(r) === 'ok') ? 'ok' : polesIn.length ? 'virt' : 'res';
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

// Wiersz rankingu źródłowego dotyczy Polski? (ranking zawodników: kraj/kod; ranking krajów: nazwa kraju)
export function rowIsPolish(r) {
  const pl = v => /^(polska|pol|poland)$/i.test(String(v || '').trim());
  return pl(r.kraj) || pl(r.kod_kraju) || pl(r.zawodnik);
}

// Skrócona lista rankingu źródłowego: czołówka, okolice Polaków, bez końcówki.
export function condenseRanking(rows, { top = 10, around = 2, line = null } = {}) {
  if (rows.length <= top + 8) return rows.map(r => ({ type: 'row', row: r }));
  const keep = new Set();
  for (let i = 0; i < Math.min(top, rows.length); i++) keep.add(i);
  if (line) rows.forEach((r, i) => { if (Math.abs(Number(r.pozycja) - line) <= 1 || Number(r.pozycja) === line + 2) keep.add(i); });
  rows.forEach((r, i) => {
    if (rowIsPolish(r)) for (let j = i - around; j <= i + around; j++) if (j >= 0 && j < rows.length) keep.add(j);
  });
  const idx = [...keep].sort((a, b) => a - b);
  const out = [];
  idx.forEach((i, k) => {
    if (k > 0 && i - idx[k - 1] > 1) out.push({ type: 'gap', from: rows[idx[k - 1] + 1].pozycja, to: rows[i - 1].pozycja });
    out.push({ type: 'row', row: rows[i] });
  });
  if (idx[idx.length - 1] < rows.length - 1) out.push({ type: 'gap', from: rows[idx[idx.length - 1] + 1].pozycja, to: rows[rows.length - 1].pozycja, end: true });
  return out;
}

// Zasady kwot z rankingu: { progi: [{ od, do, miejsc }], pozostali, zamkniecie, regulamin }
export function quotaFor(pozycja, zasady) {
  const p = Number(pozycja);
  const prog = (zasady?.progi || []).find(t => p >= t.od && p <= t.do);
  return prog ? prog.miejsc : 0;
}

export function lastQuotaPosition(zasady) {
  return (zasady?.progi || []).reduce((m, t) => Math.max(m, t.do), 0) || null;
}

// Ile punktów brakuje do ostatniego miejsca dającego kwotę (dla wiersza poza strefą).
export function gapToLine(rows, row, zasady) {
  const line = lastQuotaPosition(zasady);
  if (!line || Number(row.pozycja) <= line) return null;
  const cut = rows.find(r => Number(r.pozycja) === line);
  if (!cut || cut.punkty === null || row.punkty === null) return null;
  return Math.max(0, Number(cut.punkty) - Number(row.punkty));
}

// Tekst „1-8:2, 9-19:1” ⇄ progi
export function progiToText(progi) {
  return (progi || []).map(t => `${t.od}-${t.do}:${t.miejsc}`).join(', ');
}
export function textToProgi(text) {
  const out = [];
  for (const part of String(text || '').split(/[,;\n]+/)) {
    const m = part.trim().match(/^(\d+)\s*[-–]\s*(\d+)\s*:\s*(\d+)$/);
    if (m) out.push({ od: Number(m[1]), do: Number(m[2]), miejsc: Number(m[3]) });
    else if (part.trim()) return null;
  }
  return out.sort((a, b) => a.od - b.od);
}
