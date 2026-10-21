// Symulacja kwalifikacji olimpijskich w triathlonie (LA28), osobno dla każdej płci.
// Kolejność przydziału (regulamin World Triathlon / MKOl):
//   1. gospodarz – 2,  2. MŚ sztafet 2026 – 2,  3. MŚ sztafet 2027 – 2 (wpis w panelu),
//   4. ranking sztafet (MROQR) – 16 (8 krajów po 2; najpierw najlepszy kraj z każdego kontynentu z top 15),
//   5. ranking indywidualny (IOQR) – 21,
//   6. nowa flaga z igrzysk kontynentalnych – 5 (wpis w panelu),
//   7. uniwersalność – 2 (wpis w panelu),
//   8. nowa flaga z rankingu World Triathlon – 5 (wyliczane, z gwiazdką).
// Limit kraju: 2 miejsca, a 3 – gdy kraj ma co najmniej 3 zawodników w top 30 IOQR.
// Funkcja jest czysta: dostaje rankingi i ustawienia, zwraca wiersze w formacie wierszy symulacji.

import { toNoc, continentOf, CONTINENT_ORDER } from './countries.js';

export const GAMES = [
  { key: 'afryka', kontynent: 'Afryka', nazwa: 'Igrzyska Afrykańskie 2027' },
  { key: 'ameryki', kontynent: 'Ameryka', nazwa: 'Igrzyska Panamerykańskie 2027' },
  { key: 'azja', kontynent: 'Azja', nazwa: 'Igrzyska Azjatyckie 2026' },
  { key: 'europa', kontynent: 'Europa', nazwa: 'Igrzyska Europejskie 2027' },
  { key: 'oceania', kontynent: 'Oceania', nazwa: 'Igrzyska Pacyfiku 2027' }
];

const PLACES = 55;
const IOQR_PLACES = 21;
const RELAY_NOCS = 8;
const RELAY_TOP = 15;
const WTR_TOP = 160;

// „FRA, GBR” / „Francja” / ["FRA"] → ['FRA', 'GBR']
export function nocList(value) {
  const parts = Array.isArray(value) ? value : String(value || '').split(/[,;\n]+/);
  return parts.map(p => toNoc(String(p).trim())).filter(Boolean);
}

function nocOfRow(r) {
  return toNoc(r.kod_kraju) || toNoc(r.kraj) || toNoc(r.zawodnik);
}

// Miejsca dla krajów ze sztafet: gospodarz, MŚ 2026, MŚ 2027 i 8 krajów z rankingu sztafet
// (najpierw najlepszy kraj z każdego kontynentu z top 15, potem kolejne według rankingu).
export function relayAllocation({ relay = [], cfg = {} }) {
  const taken = new Set();
  const entries = [];
  const pending = [];
  const host = nocList(cfg.gospodarz || 'USA')[0];
  if (host) { taken.add(host); entries.push({ noc: host, sciezka: `Gospodarz (${host})`, status: 'ok' }); }
  for (const [key, label] of [['ms2026', 'MŚ sztafet 2026 (Hamburg)'], ['ms2027', 'MŚ sztafet 2027']]) {
    const noc = nocList(cfg[key]).find(n => !taken.has(n));
    if (noc) { taken.add(noc); entries.push({ noc, sciezka: label, status: 'ok' }); }
    else pending.push({ sciezka: label });
  }
  const relayNocs = relay.map(r => ({ pozycja: r.pozycja, noc: nocOfRow(r) })).filter(r => r.noc).sort((a, b) => a.pozycja - b.pozycja);
  if (!relayNocs.length) {
    for (let i = 0; i < RELAY_NOCS; i++) pending.push({ sciezka: 'Ranking sztafet mieszanych – brak danych' });
    return { entries, pending, hasRanking: false };
  }
  const chosen = [];
  for (const k of CONTINENT_ORDER) {
    const best = relayNocs.find(r => r.pozycja <= RELAY_TOP && continentOf(r.noc) === k && !taken.has(r.noc) && !chosen.some(c => c.noc === r.noc));
    if (best) chosen.push({ ...best, kontynentalna: true });
  }
  for (const r of relayNocs) {
    if (chosen.length >= RELAY_NOCS) break;
    if (!taken.has(r.noc) && !chosen.some(c => c.noc === r.noc)) chosen.push(r);
  }
  chosen.sort((a, b) => a.pozycja - b.pozycja);
  for (const c of chosen) {
    entries.push({ noc: c.noc, status: 'virt', sciezka: c.kontynentalna ? `Ranking sztafet – kwota kontynentalna (${c.pozycja}. miejsce)` : `Ranking sztafet (${c.pozycja}. miejsce)`, kontynentalna: !!c.kontynentalna });
  }
  return { entries, pending, hasRanking: true };
}

// „Zhang Xirui” = „Xirui Zhang”, „Vilaça” = „Vilaca”
export function nameKey(s) {
  return String(s || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/ł/g, 'l').replace(/Ł/g, 'L')
    .toLowerCase().split(/[^a-z0-9]+/).filter(Boolean).sort().join(' ');
}

export function simulateTriathlon({ ioqr = [], relay = [], wtr = null, cfg = {}, wyniki = {} }) {
  const athletes = ioqr
    .map(r => ({ ...r, noc: nocOfRow(r) }))
    .filter(r => r.noc && r.noc !== 'AIN') // sportowcy neutralni nie dostają kwot krajowych
    .sort((a, b) => a.pozycja - b.pozycja);

  const top30 = {};
  for (const a of athletes) if (a.pozycja <= 30) top30[a.noc] = (top30[a.noc] || 0) + 1;
  const maxFor = noc => ((top30[noc] || 0) >= 3 ? 3 : 2);

  const count = {};
  const used = new Set();
  const out = [];
  const notes = [];

  const has = noc => (count[noc] || 0) > 0;
  const canTake = a => !used.has(a.zawodnik) && (count[a.noc] || 0) < maxFor(a.noc);

  function addAthlete(a, sciezka, status, extra = {}) {
    used.add(a.zawodnik);
    count[a.noc] = (count[a.noc] || 0) + 1;
    out.push({ pozycja_rankingu: a.pozycja, zawodnik: a.zawodnik, kraj: a.noc, kontynent: continentOf(a.noc), punkty: a.punkty, sciezka, status, ...extra });
  }
  function addNocPlace(noc, sciezka, status, extra = {}) {
    const a = athletes.find(x => x.noc === noc && !used.has(x.zawodnik));
    if (a) return addAthlete(a, sciezka, status, extra);
    count[noc] = (count[noc] || 0) + 1;
    out.push({ pozycja_rankingu: null, zawodnik: 'Zawodnik do wskazania', kraj: noc, kontynent: continentOf(noc), punkty: null, sciezka, status, ...extra });
  }
  function pending(sciezka, n = 1) {
    for (let i = 0; i < n; i++) out.push({ pozycja_rankingu: null, zawodnik: 'Miejsce do rozstrzygnięcia', kraj: null, kontynent: null, punkty: null, sciezka, status: 'pending', pending: true });
  }
  // Następny zawodnik z IOQR bez miejsca (dowolny kontynent), z limitem kraju.
  function nextFromIoqr(sciezka, status, extra) {
    const a = athletes.find(canTake);
    if (a) addAthlete(a, sciezka, status, extra);
    else pending(sciezka);
  }

  // 1. Gospodarz
  const host = nocList(cfg.gospodarz || 'USA')[0];
  if (host) { addNocPlace(host, `Gospodarz (${host})`, 'ok'); addNocPlace(host, `Gospodarz (${host})`, 'ok'); }

  // 2–4. MŚ sztafet 2026 i 2027, ranking sztafet mieszanych (16 miejsc = 8 krajów)
  const alloc = relayAllocation({ relay, cfg });
  for (const e of alloc.entries) {
    if (e.noc === host) continue;
    addNocPlace(e.noc, e.sciezka, e.status); addNocPlace(e.noc, e.sciezka, e.status);
  }
  for (const p of alloc.pending) pending(p.sciezka, 2);
  if (!alloc.hasRanking) notes.push('Brak rankingu sztafet mieszanych – wklej go w panelu.');

  // 5. IOQR – 21 miejsc
  let lastIoqr = 0;
  let given = 0;
  for (const a of athletes) {
    if (given >= IOQR_PLACES) break;
    if (!canTake(a)) continue;
    const third = (count[a.noc] || 0) === 2;
    addAthlete(a, third ? 'Ranking indywidualny (IOQR) – 3. zawodnik' : 'Ranking indywidualny (IOQR)', 'virt');
    given++;
    lastIoqr = a.pozycja;
  }

  // 6. Nowa flaga z igrzysk kontynentalnych: najpierw pełne wyniki (tabela wyniki_igrzysk),
  //    a gdy ich nie ma – kolejność krajów wpisana w panelu.
  for (const g of GAMES) {
    const results = (wyniki[g.key] || []).map(r => ({ ...r, noc: toNoc(r.kraj) })).filter(r => r.noc && r.noc !== 'AIN').sort((a, b) => a.miejsce - b.miejsce);
    if (results.length) {
      const w = results.find(r => !has(r.noc) && continentOf(r.noc) === g.kontynent) || results.find(r => !has(r.noc));
      if (w) {
        const label = `Nowa flaga – ${g.nazwa} (${w.miejsce}. miejsce na igrzyskach)`;
        const a = athletes.find(x => !used.has(x.zawodnik) && x.noc === w.noc && nameKey(x.zawodnik) === nameKey(w.zawodnik));
        if (a) addAthlete(a, label, 'virt', { gwiazdka: 'igrzyska' });
        else {
          used.add(w.zawodnik);
          count[w.noc] = (count[w.noc] || 0) + 1;
          out.push({ pozycja_rankingu: null, zawodnik: w.zawodnik, kraj: w.noc, kontynent: continentOf(w.noc), punkty: null, sciezka: label, status: 'virt', gwiazdka: 'igrzyska' });
        }
      } else {
        nextFromIoqr(`Realokacja – ${g.nazwa} (kraje z wyników mają już miejsca)`, 'virt', { gwiazdka: 'igrzyska' });
      }
      continue;
    }
    const list = nocList(cfg.igrzyska?.[g.key]);
    if (!list.length) { pending(`Nowa flaga – ${g.nazwa}`); continue; }
    const noc = list.find(n => !has(n) && continentOf(n) === g.kontynent) || list.find(n => !has(n));
    if (noc) addNocPlace(noc, `Nowa flaga – ${g.nazwa}`, 'virt', { gwiazdka: 'igrzyska' });
    else nextFromIoqr(`Realokacja – ${g.nazwa} (kraje z wyników mają już miejsca)`, 'virt', { gwiazdka: 'igrzyska' });
  }

  // 7. Uniwersalność – kraje wpisane w panelu
  const uni = nocList(cfg.uniwersalne).slice(0, 2);
  for (const noc of uni) addNocPlace(noc, 'Miejsce uniwersalne', 'ok');
  pending('Miejsce uniwersalne', 2 - uni.length);

  // 8. Nowa flaga z rankingu World Triathlon (bez rankingu WT liczone z IOQR)
  const wtrRows = (wtr && wtr.length ? wtr : ioqr)
    .map(r => ({ ...r, noc: nocOfRow(r) }))
    .filter(r => r.noc && r.noc !== 'AIN' && r.pozycja <= WTR_TOP)
    .sort((a, b) => a.pozycja - b.pozycja);
  for (const k of CONTINENT_ORDER) {
    const r = wtrRows.find(x => continentOf(x.noc) === k && !has(x.noc));
    if (r) {
      const a = athletes.find(x => x.zawodnik === r.zawodnik) || { ...r, pozycja: r.pozycja };
      addAthlete(a, `Nowa flaga – ranking (${k})`, 'virt', { gwiazdka: 'ranking' });
    } else {
      nextFromIoqr(`Nowa flaga – realokacja (brak kraju bez miejsca: ${k})`, 'virt', { gwiazdka: 'ranking' });
    }
  }

  // Lista olimpijska: najpierw zawodnicy według IOQR, potem miejsca bez nazwiska
  const ranked = out.filter(r => !r.pending && r.pozycja_rankingu !== null).sort((a, b) => a.pozycja_rankingu - b.pozycja_rankingu);
  const unnamed = out.filter(r => !r.pending && r.pozycja_rankingu === null);
  const open = out.filter(r => r.pending);
  const zakwalifikowani = [...ranked, ...unnamed, ...open].slice(0, PLACES).map((r, i) => ({ ...r, lista: 'zakwalifikowani', lp: i + 1 }));

  // Rezerwa: kolejni z IOQR, którzy zmieściliby się w limicie kraju
  const rezerwa = athletes.filter(canTake).slice(0, 10).map((a, i) => ({
    lista: 'rezerwa', lp: i + 1, pozycja_rankingu: a.pozycja, zawodnik: a.zawodnik, kraj: a.noc, kontynent: continentOf(a.noc), punkty: a.punkty, sciezka: 'Rezerwa', status: 'res'
  }));

  // Wyżej niż ostatni z IOQR, ale bez miejsca przez limit kraju
  const limit_kraju = athletes.filter(a => !used.has(a.zawodnik) && a.pozycja < lastIoqr).map((a, i) => ({
    lista: 'limit_kraju', lp: i + 1, pozycja_rankingu: a.pozycja, zawodnik: a.zawodnik, kraj: a.noc, kontynent: continentOf(a.noc), punkty: a.punkty, sciezka: 'Poza limitem kraju', status: 'res'
  }));

  // Polacy w IOQR
  const polacy = athletes.filter(a => a.noc === 'POL').map((a, i) => {
    const q = zakwalifikowani.find(r => r.zawodnik === a.zawodnik);
    const rz = rezerwa.find(r => r.zawodnik === a.zawodnik);
    const sciezka = q ? q.sciezka : rz ? `${rz.lp}. na liście rezerwowej` : (count.POL || 0) >= maxFor('POL') ? 'Poza limitem kraju' : 'Poza strefą kwalifikacji';
    return { lista: 'polacy', lp: i + 1, pozycja_rankingu: a.pozycja, zawodnik: a.zawodnik, kraj: 'POL', kontynent: 'Europa', punkty: a.punkty, sciezka, status: q ? q.status : 'res', gwiazdka: q?.gwiazdka };
  });

  return { rows: [...zakwalifikowani, ...rezerwa, ...limit_kraju, ...polacy], notes, counts: { open: open.length } };
}
