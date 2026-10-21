import { supabase } from './supabase';
import { SPORTS } from './sports';
import { rowIsPolish, lastQuotaPosition } from './compute';
import { simulateTriathlon, relayAllocation } from './triathlon';
import { simulateGolf, simulateGolfMixed } from './golf';
import { toNoc } from './countries';

// Wszystkie odczyty z bazy. Gdy baza nie jest podłączona albo nie odpowiada,
// strony pokazują dane wbudowane albo pusty stan – nigdy błąd.

async function safe(query, label) {
  if (!supabase) return null;
  try {
    const { data, error } = await query;
    if (error) {
      console.error(`Supabase – ${label}:`, error.message);
      return null;
    }
    return data;
  } catch (e) {
    console.error(`Supabase – ${label}:`, e.message);
    return null;
  }
}

async function getAllSports() {
  let data = await safe(
    supabase?.from('dyscypliny').select('id, slug, nazwa, plakietka, sledzona, opis_kafla, nadrzedna_id').order('kolejnosc'),
    'dyscypliny'
  );
  // Zanim zostanie uruchomiona migracja 0005, nie ma kolumny nadrzedna_id.
  if (!data && supabase) data = await safe(supabase.from('dyscypliny').select('id, slug, nazwa, plakietka, sledzona, opis_kafla').order('kolejnosc'), 'dyscypliny (bez poddyscyplin)');
  if (!data || data.length === 0) return SPORTS.map(s => ({ ...s, id: null, parentId: null }));
  const linked = (await safe(
    supabase.from('zrodla_rankingow').select('konkurencje!inner(dyscypliny!inner(slug))').not('konkurencja_id', 'is', null).eq('aktywne', true),
    'dyscypliny z rankingiem'
  )) || [];
  const withRanking = new Set(linked.map(l => l.konkurencje?.dyscypliny?.slug).filter(Boolean));
  // Dyscypliny ze statusem: symulacja wgrana z arkusza albo lista liczona algorytmem / tablica kwot
  const [simEv, algEv] = await Promise.all([
    safe(supabase.from('symulacje').select('konkurencje!inner(dyscypliny!inner(slug))').eq('aktualna', true), 'dyscypliny z symulacją'),
    safe(supabase.from('konkurencje').select('dyscypliny!inner(slug)').not('algorytm', 'is', null), 'dyscypliny z algorytmem')
  ]);
  const withStatus = new Set([
    ...(simEv || []).map(s => s.konkurencje?.dyscypliny?.slug),
    ...(algEv || []).map(k => k.dyscypliny?.slug)
  ].filter(Boolean));
  const all = data.map(d => ({
    id: d.id,
    parentId: d.nadrzedna_id ?? null,
    slug: d.slug,
    name: d.nazwa,
    badge: d.plakietka || undefined,
    tracked: d.sledzona,
    detail: d.opis_kafla || undefined,
    hasRanking: withRanking.has(d.slug),
    hasStatus: withStatus.has(d.slug)
  }));
  for (const s of all) {
    const kids = all.filter(c => c.parentId === s.id);
    s.childCount = kids.length;
    if (kids.some(c => c.hasRanking)) s.hasRanking = true;
    if (kids.some(c => c.hasStatus)) s.hasStatus = true;
    if (kids.some(c => c.tracked)) s.tracked = true;
  }
  return all;
}

// Kafle na stronie Dyscypliny: tylko dyscypliny główne (poddyscypliny są w środku).
export async function getSports() {
  const all = await getAllSports();
  return all.filter(s => !s.parentId);
}

const EVENT_COLS = 'id, slug, nazwa, plec, miejsc, data_startu, godzina, miejsce, opis';

// Strona dyscypliny: konkurencje z krótkim stanem Polski i kalendarz terminów.
export async function getSportHub(slug) {
  const all = await getAllSports();
  const found = all.find(s => s.slug === slug) || null;
  if (!found) return { sport: null, events: [], terms: [], children: [], parent: null };
  const sport = found;
  const children = all.filter(c => sport.id && c.parentId === sport.id);
  const parent = sport.parentId ? all.find(p => p.id === sport.parentId) || null : null;

  let events = await safe(
    supabase?.from('konkurencje').select(`${EVENT_COLS}, algorytm, dyscypliny!inner(slug)`).eq('dyscypliny.slug', slug).order('plec'),
    'konkurencje'
  );
  // Zanim zostanie uruchomiona migracja 0008, nie ma kolumny algorytm.
  if (!events && supabase) events = await safe(supabase.from('konkurencje').select(`${EVENT_COLS}, dyscypliny!inner(slug)`).eq('dyscypliny.slug', slug).order('plec'), 'konkurencje (bez algorytmu)');
  events = events || [];

  const ids = events.map(e => e.id);
  let sims = [];
  let polishRows = [];
  let manual = [];
  let rankings = [];
  if (ids.length) {
    sims = (await safe(
      supabase.from('symulacje').select('id, konkurencja_id, stan_na').in('konkurencja_id', ids).eq('aktualna', true).order('utworzono', { ascending: false }),
      'symulacje'
    )) || [];
    const simIds = sims.map(s => s.id);
    if (simIds.length) {
      polishRows = (await safe(
        supabase.from('wiersze_symulacji').select('symulacja_id, lista, lp, zawodnik, sciezka').in('symulacja_id', simIds).eq('lista', 'polacy').order('lp'),
        'wiersze Polaków'
      )) || [];
    }
    manual = (await safe(
      supabase.from('kwalifikacje').select('konkurencja_id, zawodnik, sciezka, status').in('konkurencja_id', ids),
      'kwalifikacje'
    )) || [];
    rankings = withAllocation(await getRankingsFor(ids, { onlyPolish: true }), events);
  }

  const autos = await Promise.all(events.map(e => algorithmSimulation(e)));
  // Golf – rywalizacja mieszana: z list kobiet i mężczyzn (wyliczonych albo z wgranej symulacji)
  for (const [i, e] of events.entries()) {
    if (e.algorytm?.typ !== 'golf-la28-mieszana') continue;
    const listFor = async plec => {
      const ev = events.find(x => x.plec === plec);
      if (!ev) return null;
      const auto = autos[events.indexOf(ev)];
      if (auto) return { rows: auto.rows, stan: auto.simulation.stan_na };
      const sim = (await safe(supabase.from('symulacje').select('id, stan_na').eq('konkurencja_id', ev.id).eq('aktualna', true).order('utworzono', { ascending: false }).limit(1), 'symulacja golf'))?.[0];
      if (!sim) return null;
      const rows = (await safe(supabase.from('wiersze_symulacji').select('lista, lp, pozycja_rankingu, zawodnik, kraj, punkty').eq('symulacja_id', sim.id).limit(5000), 'wiersze golf')) || [];
      return rows.length ? { rows, stan: sim.stan_na } : null;
    };
    autos[i] = golfMixed(e, await listFor('M'), await listFor('K'));
  }
  const enriched = events.map((e, i) => {
    const auto = autos[i];
    const sim = auto?.simulation || sims.find(s => s.konkurencja_id === e.id) || null;
    if (auto?.kwoty) {
      const applied = applyQuotaRanking(rankings.filter(r => r.konkurencja_id === e.id), auto.kwoty);
      auto.kwoty = applied.kwoty;
      const pl = applied.kwoty.filter(k => k.kraj === 'POL');
      if (pl.length) auto.poles = pl.map((k, j) => ({ lista: 'polacy', lp: j + 1, zawodnik: k.zawodnik || 'Polska', sciezka: `${k.sciezka} – ${k.zawody}`, status: k.status }));
    }
    const poles = auto?.poles ? auto.poles : auto ? auto.rows.filter(r => r.lista === 'polacy') : sim ? polishRows.filter(r => r.symulacja_id === sim.id) : [];
    return {
      ...e,
      auto,
      hasSimulation: !!sim,
      stanNa: sim?.stan_na || null,
      poles,
      rankings: rankings.filter(r => r.konkurencja_id === e.id),
      manual: manual.filter(m => m.konkurencja_id === e.id)
    };
  });

  const terms = (await safe(
    supabase?.from('terminy').select('data_od, data_do, etykieta_daty, tytul, opis, typ, kolejnosc, dyscypliny!inner(slug)').eq('dyscypliny.slug', slug).order('kolejnosc'),
    'terminy'
  )) || [];

  return { sport, events: enriched, terms, children, parent };
}

// Strona konkurencji: pełna symulacja + ręczne kwalifikacje.
export async function getEventPage(sportSlug, eventSlug) {
  const hub = await getSportHub(sportSlug);
  if (!hub.sport) return null;
  const event = hub.events.find(e => e.slug === eventSlug);
  if (!event) return null;

  if (event.auto) {
    const applied = applyQuotaRanking(withAllocation(await getRankingsFor([event.id], { onlyPolish: false }), hub.events), event.auto.kwoty);
    const rankings = applied.rankings;
    if (applied.kwoty) event.auto.kwoty = applied.kwoty;
    return { sport: hub.sport, parent: hub.parent, event, siblings: hub.events, simulation: event.auto.simulation, rows: event.auto.rows, omtr: event.auto.omtr || null, kwoty: event.auto.kwoty || null, rankings };
  }

  const sim = (await safe(
    supabase?.from('symulacje').select('id, stan_na, opis').eq('konkurencja_id', event.id).eq('aktualna', true).order('utworzono', { ascending: false }).limit(1),
    'symulacja'
  ))?.[0] || null;

  let rows = [];
  if (sim) {
    rows = (await safe(
      supabase.from('wiersze_symulacji').select('lista, lp, pozycja_rankingu, zawodnik, kraj, kontynent, punkty, sciezka').eq('symulacja_id', sim.id).order('lp').limit(2000),
      'wiersze symulacji'
    )) || [];
  }

  const rankings = withAllocation(await getRankingsFor([event.id], { onlyPolish: false }), hub.events);
  return { sport: hub.sport, parent: hub.parent, event, siblings: hub.events, simulation: sim, rows, rankings };
}

// Data „Stan na” w nagłówku: najnowsza symulacja albo udane notowanie rankingu.
export async function getLastUpdate() {
  const [sim, snap] = await Promise.all([
    safe(supabase?.from('symulacje').select('stan_na').order('stan_na', { ascending: false }).limit(1), 'stan symulacji'),
    safe(supabase?.from('notowania').select('stan_na').eq('status', 'ok').order('stan_na', { ascending: false }).limit(1), 'stan notowań')
  ]);
  const dates = [sim?.[0]?.stan_na, snap?.[0]?.stan_na].filter(Boolean).sort();
  return dates.length ? dates[dates.length - 1] : null;
}

// Rankingi źródłowe (UCI, wklejki) przypięte do konkurencji – ostatnie udane notowanie każdego źródła.
async function getRankingsFor(eventIds, { onlyPolish }) {
  let sources = await safe(
    supabase?.from('zrodla_rankingow').select('id, nazwa, typ, rodzaj, adres_strony, konkurencja_id, zasady').in('konkurencja_id', eventIds).eq('aktywne', true),
    'źródła rankingów'
  );
  // Zanim zostanie uruchomiona migracja 0006, nie ma kolumny zasady.
  if (!sources && supabase) sources = await safe(supabase.from('zrodla_rankingow').select('id, nazwa, typ, rodzaj, adres_strony, konkurencja_id').in('konkurencja_id', eventIds).eq('aktywne', true), 'źródła rankingów (bez zasad)');
  sources = sources || [];
  if (!sources.length) return [];
  const snaps = (await safe(
    supabase.from('ostatnie_notowania').select('id, zrodlo_id, stan_na, pobrano, liczba_wierszy').in('zrodlo_id', sources.map(s => s.id)),
    'ostatnie notowania'
  )) || [];
  const out = [];
  for (const src of sources) {
    const snap = snaps.find(n => n.zrodlo_id === src.id);
    if (!snap) continue;
    const rows = (await safe(
      supabase.from('wiersze_notowan').select('pozycja, zawodnik, kraj, kod_kraju, punkty').eq('notowanie_id', snap.id).order('pozycja').limit(5000),
      'wiersze rankingu'
    )) || [];
    const polish = rows.filter(rowIsPolish);
    const line = lastQuotaPosition(src.zasady);
    const lineRow = line ? rows.find(r => Number(r.pozycja) === line) || null : null;
    out.push({
      lineRow,
      ...src,
      stanNa: snap.stan_na,
      pobrano: snap.pobrano,
      total: rows.length,
      polish,
      rows: onlyPolish && !src.zasady?.algorytm ? [] : rows
    });
  }
  return out;
}

// Ostatnie udane notowanie źródła (po slugu) – wiersze i data.
async function latestRows(slug) {
  if (!slug || !supabase) return null;
  const src = (await safe(supabase.from('zrodla_rankingow').select('id').eq('slug', slug).limit(1), 'źródło algorytmu'))?.[0];
  if (!src) return null;
  const snap = (await safe(supabase.from('ostatnie_notowania').select('id, stan_na').eq('zrodlo_id', src.id).limit(1), 'notowanie algorytmu'))?.[0];
  if (!snap) return null;
  const rows = (await safe(
    supabase.from('wiersze_notowan').select('pozycja, zawodnik, kraj, kod_kraju, punkty').eq('notowanie_id', snap.id).order('pozycja').limit(5000),
    'wiersze algorytmu'
  )) || [];
  return rows.length ? { rows, stanNa: snap.stan_na } : null;
}

// Symulacja liczona na bieżąco z rankingów i wpisów w panelu (konkurencje.algorytm).
async function algorithmSimulation(event) {
  const cfg = event.algorytm;
  if (cfg?.typ === 'kwoty') return quotaBoard(event);
  if (cfg?.typ === 'golf-la28') {
    const ogr = await latestRows(cfg.zrodla?.ogr);
    if (!ogr) return null;
    const { rows } = simulateGolf({ ogr: ogr.rows, cfg });
    return { simulation: { stan_na: ogr.stanNa, opis: `Wyliczone automatycznie z Olympic Golf Ranking (${fmt(ogr.stanNa)}) według systemu kwalifikacji IGF.`, auto: true }, rows };
  }
  if (!cfg || cfg.typ !== 'triathlon-la28') return null;
  const [ioqr, relay, wtr] = await Promise.all([latestRows(cfg.zrodla?.ioqr), latestRows(cfg.zrodla?.sztafety), latestRows(cfg.zrodla?.ranking)]);
  if (!ioqr || !relay) return null;
  const res = await safe(supabase.from('wyniki_igrzysk').select('zawody, miejsce, zawodnik, kraj').eq('dyscyplina', 'triathlon').eq('plec', event.plec).order('miejsce'), 'wyniki igrzysk');
  const wyniki = {};
  for (const r of res || []) (wyniki[r.zawody] = wyniki[r.zawody] || []).push(r);
  const { rows, notes } = simulateTriathlon({ ioqr: ioqr.rows, relay: relay.rows, wtr: wtr?.rows || null, cfg, wyniki });
  const dates = [ioqr.stanNa, relay.stanNa, wtr?.stanNa].filter(Boolean).sort();
  const opis = `Wyliczone automatycznie z IOQR (${fmt(ioqr.stanNa)}), rankingu sztafet (${fmt(relay.stanNa)})${wtr ? ` i rankingu World Triathlon (${fmt(wtr.stanNa)})` : ''} oraz wpisów redakcji.`;
  return { simulation: { stan_na: dates[dates.length - 1], opis, notes, auto: true }, rows };
}

function fmt(iso) {
  const [y, m, d] = String(iso).slice(0, 10).split('-');
  return `${d}.${m}.${y}`;
}

// Ranking sztafet: statusy krajów według przydziału miejsc (gospodarz, MŚ, 8 krajów z rankingu).
function withAllocation(rankings, events) {
  const cfg = events.find(e => e.algorytm?.typ === 'triathlon-la28')?.algorytm || {};
  return rankings.map(r => {
    if (r.zasady?.algorytm !== 'triathlon-sztafety') return r;
    const allocation = relayAllocation({ relay: r.rows, cfg });
    const byNoc = Object.fromEntries(allocation.entries.map(e => [e.noc, e]));
    const rows = r.rows.map(row => {
      const e = byNoc[toNoc(row.kod_kraju) || toNoc(row.kraj) || toNoc(row.zawodnik)];
      return { ...row, status: e ? e.status : 'res', sciezka: e ? e.sciezka : null };
    });
    const polish = rows.filter(rowIsPolish);
    const chosen = allocation.entries.filter(e => e.status === 'virt').map(e => rows.find(x => x.sciezka === e.sciezka)?.pozycja || 0);
    return { ...r, allocation, rows, polish, linePos: chosen.length ? Math.max(...chosen) : null };
  });
}

// Lista olimpijska + ranking OGR (wiersze bez duplikatów) z wierszy symulacji
function splitGolf(list) {
  if (!list) return { qualified: [], ogr: [] };
  const seen = new Set();
  const ogr = [];
  for (const r of list.rows) {
    if (r.pozycja_rankingu === null || r.pozycja_rankingu === undefined) continue;
    const k = r.zawodnik + '|' + r.pozycja_rankingu;
    if (seen.has(k)) continue;
    seen.add(k);
    ogr.push({ pozycja: r.pozycja_rankingu, zawodnik: r.zawodnik, kraj: r.kraj, punkty: r.punkty });
  }
  const qualified = list.rows.filter(r => r.lista === 'zakwalifikowani').map(r => ({ ...r, kraj: toNoc(r.kraj) || r.kraj }));
  return { qualified, ogr };
}

function golfMixed(event, men, women) {
  if (!men && !women) return null;
  const m = splitGolf(men);
  const k = splitGolf(women);
  const { omtr, teams } = simulateGolfMixed({ men: m.qualified, women: k.qualified, menOgr: m.ogr, womenOgr: k.ogr, cfg: event.algorytm });
  const notes = [];
  if (!women) notes.push('Brak listy kobiet – dopóki nie wgrasz rankingu OGR kobiet, żaden kraj nie ma kompletu (kobieta + mężczyzna).');
  if (!men) notes.push('Brak listy mężczyzn.');
  const pl = omtr.find(r => r.noc === 'POL') || null;
  const dates = [men?.stan, women?.stan].filter(Boolean).sort();
  return {
    simulation: { stan_na: dates[dates.length - 1], opis: 'Kolejność krajów według najlepszego zawodnika z OGR kobiet lub mężczyzn (OMTR). Drużynę tworzą kobieta i mężczyzna zakwalifikowani do turniejów indywidualnych.', notes, auto: true, mixed: true, teams },
    rows: [],
    omtr,
    poles: pl ? [{ lista: 'polacy', lp: 1, zawodnik: 'Polska', kraj: 'POL', sciezka: pl.sciezka, status: pl.status }] : []
  };
}

// Tablica kwot: miejsca zdobywane na zawodach (łucznictwo i inne dyscypliny „turniejowe”)
async function quotaBoard(event) {
  const kwoty = (await safe(
    supabase.from('kwoty').select('id, kolejnosc, sciezka, zawody, data_zawodow, liczba, kraj, zawodnik, status, uwagi').eq('konkurencja_id', event.id).order('kolejnosc'),
    'kwoty'
  )) || [];
  if (!kwoty.length) return null;
  const pl = kwoty.filter(k => k.kraj === 'POL');
  const poles = pl.length
    ? pl.map((k, i) => ({ lista: 'polacy', lp: i + 1, zawodnik: k.zawodnik || 'Polska', sciezka: `${k.sciezka} – ${k.zawody}`, status: k.status }))
    : [{ lista: 'polacy', lp: 1, zawodnik: 'Polska', sciezka: 'Brak miejsca', status: 'res' }];
  return {
    simulation: { stan_na: null, opis: 'Miejsca olimpijskie zdobywane na zawodach kwalifikacyjnych. Kraje wpisujemy po każdych zawodach.', auto: true, kwoty: true },
    rows: [],
    kwoty,
    poles
  };
}

// Ranking dający kwoty (np. 2 drużyny mieszane z rankingu World Archery): kraje z miejscem z innych zawodów
// mają „Zakwalifikowany”, kolejne N bez miejsca – „Wirtualna kwalifikacja”; uzupełnia też wolne miejsca w tablicy kwot.
function applyQuotaRanking(rankings, kwoty) {
  if (!kwoty) return { rankings, kwoty };
  // miejsca dopisane wcześniej z rankingu liczymy od nowa (funkcja może być wywołana drugi raz)
  const clean = kwoty.map(k => (k.auto_ranking ? { ...k, kraj: null, status: 'pending', auto_ranking: false, uwagi: k.uwagi_org ?? k.uwagi } : k));
  let board = clean;
  const pathOf = k => (k.sciezka === 'Gospodarz' ? 'Gospodarz (warunkowo – start na MŚ 2027)' : `${k.sciezka} – ${k.zawody}`);
  const out = rankings.map(r => {
    if (r.zasady?.algorytm !== 'kwoty-ranking') return r;
    const path = r.zasady.sciezka;
    const slots = clean.filter(k => k.sciezka === path);
    const n = r.zasady.miejsc || slots.length;
    const owned = Object.fromEntries(clean.filter(k => k.kraj && k.sciezka !== path).map(k => [k.kraj, k]));
    const fixed = Object.fromEntries(slots.filter(k => k.kraj).map(k => [k.kraj, k]));
    let given = Object.keys(fixed).length;
    const picked = [];
    const rows = r.rows.map(row => {
      const noc = toNoc(row.kod_kraju) || toNoc(row.zawodnik);
      if (owned[noc]) return { ...row, status: owned[noc].status, sciezka: pathOf(owned[noc]) };
      if (fixed[noc]) return { ...row, status: fixed[noc].status, sciezka: path };
      if (given < n) { given++; picked.push(noc); return { ...row, status: 'virt', sciezka: `${path} (${row.pozycja}. miejsce)` }; }
      return { ...row, status: 'res', sciezka: null };
    });
    let i = 0;
    board = board.map(k => (k.sciezka === path && !k.kraj && picked[i]
      ? { ...k, kraj: picked[i++], status: 'virt', auto_ranking: true, uwagi_org: k.uwagi, uwagi: [k.uwagi, 'wg aktualnego rankingu'].filter(Boolean).join(' · ') }
      : k));
    const lastPicked = rows.filter(x => x.status === 'virt' && x.sciezka?.startsWith(path)).map(x => x.pozycja);
    return { ...r, rows, polish: rows.filter(rowIsPolish), allocation: { entries: [], pending: [] }, quotaRanking: true, linePos: lastPicked.length ? Math.max(...lastPicked) : null };
  });
  return { rankings: out, kwoty: board };
}
