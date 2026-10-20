// Symulacja kwalifikacji olimpijskich w golfie (LA28), według systemu IGF:
//  – 60 miejsc na płeć: 59 z Olympic Golf Ranking (OGR) + 1 miejsce gospodarza,
//  – top 15 OGR: maks. 4 zawodników z kraju; od 16. miejsca: maks. 2 z kraju (licząc tych z top 15),
//  – każdy z 5 kontynentów ma co najmniej 1 zawodnika (w ramach 59 miejsc),
//  – gospodarz (USA): miejsce, gdy nie ma nikogo z OGR; inaczej miejsce przechodzi na kolejnego z OGR.
// Rywalizacja mieszana: 16 drużyn (kobieta + mężczyzna z tego samego kraju, oboje w turniejach indywidualnych),
// kolejność krajów według najlepszego zawodnika z OGR kobiet lub mężczyzn (OMTR); gospodarz ma miejsce.

import { toNoc, continentOf, CONTINENT_ORDER } from './countries.js';

const OGR_PLACES = 59;
const TOP = 15;
const TEAMS = 16;

function prepare(ogr) {
  return ogr
    .map(r => ({ ...r, pozycja: Number(r.pozycja), noc: toNoc(r.kod_kraju) || toNoc(r.kraj) }))
    .filter(r => r.noc && Number.isFinite(r.pozycja))
    .sort((a, b) => a.pozycja - b.pozycja);
}

export function simulateGolf({ ogr = [], cfg = {} }) {
  const athletes = prepare(ogr);
  const host = toNoc(cfg.gospodarz || 'USA');
  const count = {};
  const picked = [];
  const used = new Set();
  const take = (a, sciezka, status = 'virt') => {
    used.add(a.zawodnik + '|' + a.pozycja);
    count[a.noc] = (count[a.noc] || 0) + 1;
    picked.push({ ...a, sciezka, status });
  };
  const isUsed = a => used.has(a.zawodnik + '|' + a.pozycja);

  // 1. Top 15 – do 4 z kraju
  for (const a of athletes) if (a.pozycja <= TOP && (count[a.noc] || 0) < 4) take(a, 'Kwalifikacja z OGR (top 15)');
  // 2. Od 16. miejsca – do 2 z kraju, aż do 59
  let lastOgr = 0;
  for (const a of athletes) {
    if (picked.length >= OGR_PLACES) break;
    if (a.pozycja <= TOP || isUsed(a) || (count[a.noc] || 0) >= 2) continue;
    take(a, 'Kwalifikacja z OGR');
    lastOgr = a.pozycja;
  }
  // 3. Gwarancja kontynentów – brakujący kontynent dostaje najlepszego swojego zawodnika kosztem ostatniego z listy
  for (const k of CONTINENT_ORDER) {
    if (picked.some(p => continentOf(p.noc) === k)) continue;
    const best = athletes.find(a => !isUsed(a) && continentOf(a.noc) === k);
    if (!best) continue;
    for (let i = picked.length - 1; i >= 0; i--) {
      const p = picked[i];
      const cont = continentOf(p.noc);
      if (p.pozycja <= TOP || p.sciezka.startsWith('Miejsce kontynentalne')) continue;
      if (picked.filter(x => continentOf(x.noc) === cont).length <= 1) continue;
      picked.splice(i, 1);
      used.delete(p.zawodnik + '|' + p.pozycja);
      count[p.noc]--;
      break;
    }
    take(best, `Miejsce kontynentalne (${k})`);
  }
  // 4. Gospodarz
  if (host && !count[host]) {
    const h = athletes.find(a => a.noc === host && !isUsed(a));
    if (h) take(h, `Miejsce gospodarza (${host})`, 'ok');
  } else {
    const next = athletes.find(a => !isUsed(a) && (count[a.noc] || 0) < 2);
    if (next) take(next, 'Realokacja miejsca gospodarza');
  }

  const zakwalifikowani = picked.sort((a, b) => a.pozycja - b.pozycja).map((a, i) => row(a, 'zakwalifikowani', i + 1));
  // Rezerwa: kolejni z OGR, ale z każdego kraju tylu, ile brakuje mu do limitu 2
  const resCount = { ...count };
  const eligible = a => {
    if (isUsed(a) || (resCount[a.noc] || 0) >= 2) return false;
    resCount[a.noc] = (resCount[a.noc] || 0) + 1;
    return true;
  };
  const rezerwa = athletes.filter(eligible).slice(0, 50).map((a, i) => row({ ...a, sciezka: 'Rezerwa', status: 'res' }, 'rezerwa', i + 1));
  const lastPicked = Math.max(lastOgr, ...zakwalifikowani.map(r => r.pozycja_rankingu));
  const limit_kraju = athletes.filter(a => !isUsed(a) && a.pozycja < lastPicked).map((a, i) => row({ ...a, sciezka: 'Poza limitem kraju', status: 'res' }, 'limit_kraju', i + 1));
  let n = 0;
  const polacy = athletes.filter(a => a.noc === 'POL').map((a, i) => {
    const q = zakwalifikowani.find(r => r.zawodnik === a.zawodnik && r.pozycja_rankingu === a.pozycja);
    const rz = rezerwa.find(r => r.zawodnik === a.zawodnik && r.pozycja_rankingu === a.pozycja);
    n++;
    const sciezka = q ? `${q.sciezka} – ${q.lp}. miejsce na liście olimpijskiej`
      : rz ? `${rz.lp}. na liście rezerwowej (${n}. Polak w OGR)`
      : `Poza limitem – ${n}. Polak w OGR`;
    return row({ ...a, sciezka, status: q ? q.status : 'res' }, 'polacy', i + 1);
  });
  return { rows: [...zakwalifikowani, ...rezerwa, ...limit_kraju, ...polacy], qualified: zakwalifikowani };
}

function row(a, lista, lp) {
  return { lista, lp, pozycja_rankingu: a.pozycja, zawodnik: a.zawodnik, kraj: a.noc, kontynent: continentOf(a.noc), punkty: a.punkty ?? null, sciezka: a.sciezka, status: a.status };
}

// Rywalizacja mieszana na podstawie list olimpijskich kobiet i mężczyzn.
export function simulateGolfMixed({ men = [], women = [], menOgr = [], womenOgr = [], cfg = {} }) {
  const host = toNoc(cfg.gospodarz || 'USA');
  const best = {};
  const add = (list, plec) => {
    for (const a of prepare(list)) {
      const b = best[a.noc];
      if (!b || a.pozycja < b.pozycja) best[a.noc] = { pozycja: a.pozycja, zawodnik: a.zawodnik, plec };
    }
  };
  add(menOgr, 'M');
  add(womenOgr, 'K');
  const qualifiedBy = (list, noc) => list.filter(r => r.kraj === noc).sort((a, b) => a.pozycja_rankingu - b.pozycja_rankingu);
  const nocs = Object.entries(best).map(([noc, b]) => {
    const m = qualifiedBy(men, noc);
    const k = qualifiedBy(women, noc);
    return { noc, ...b, mezczyzna: m[0] || null, kobieta: k[0] || null, eligible: m.length > 0 && k.length > 0 };
  }).sort((a, b) => a.pozycja - b.pozycja || (a.plec === 'M' ? -1 : 1));

  let teams = nocs.filter(n => n.eligible).slice(0, TEAMS);
  const hostRow = nocs.find(n => n.noc === host && n.eligible);
  if (hostRow && !teams.includes(hostRow)) teams = [...teams.slice(0, TEAMS - 1), hostRow];
  const teamSet = new Set(teams.map(t => t.noc));
  const omtr = nocs.map((n, i) => ({
    ...n,
    omtr: i + 1,
    status: teamSet.has(n.noc) ? (n.noc === host ? 'ok' : 'virt') : 'res',
    sciezka: teamSet.has(n.noc)
      ? (n.noc === host && nocs.filter(x => x.eligible).indexOf(n) >= TEAMS ? 'Miejsce gospodarza' : 'Ranking OMTR')
      : n.eligible ? 'Rezerwa – poza 16 drużynami' : !n.mezczyzna && !n.kobieta ? 'Brak zawodników na listach olimpijskich' : !n.kobieta ? 'Brak kobiety na liście olimpijskiej' : 'Brak mężczyzny na liście olimpijskiej'
  }));
  return { omtr, teams: TEAMS };
}
