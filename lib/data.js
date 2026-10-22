import { supabase } from './supabase';
import { SPORTS } from './sports';
import { rowIsPolish, lastQuotaPosition } from './compute';
import { simulateTriathlon, relayAllocation } from './triathlon';
import { simulateGolf, simulateGolfMixed } from './golf';
import { toNoc, continentOf } from './countries';

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
  // Kwalifikacje z rankingu: źródło rankingu, algorytm rankingowy albo miejsca z rankingu na tablicy kwot
  const [rankAlg, rankKwoty, plKwoty, quotaSources] = await Promise.all([
    safe(supabase.from('konkurencje').select('algorytm, dyscypliny!inner(slug)').not('algorytm', 'is', null), 'algorytmy'),
    safe(supabase.from('kwoty').select('konkurencje!inner(dyscypliny!inner(slug))').ilike('zawody', '%ranking%').limit(10000), 'kwoty z rankingu'),
    safe(supabase.from('kwoty').select('konkurencje!inner(dyscypliny!inner(slug))').eq('kraj', 'POL').in('status', ['ok', 'virt']), 'kwoty Polski'),
    safe(supabase.from('zrodla_rankingow').select('zasady, konkurencje!inner(dyscypliny!inner(slug))').eq('aktywne', true), 'źródła z kwotami')
  ]);
  const rankingBased = new Set([
    ...withRanking,
    ...(rankAlg || []).filter(k => k.algorytm?.typ && k.algorytm.typ !== 'kwoty').map(k => k.dyscypliny?.slug),
    ...(rankKwoty || []).map(k => k.konkurencje?.dyscypliny?.slug)
  ].filter(Boolean));
  // Polak w strefie: miejsce Polski na tablicy kwot (wpisane albo wyliczone z rankingu)
  const inZone = new Set((plKwoty || []).map(k => k.konkurencje?.dyscypliny?.slug).filter(Boolean));
  const dynamicSlugs = [...new Set((quotaSources || []).filter(q => /^kwoty-ranking/.test(q.zasady?.algorytm || '')).map(q => q.konkurencje?.dyscypliny?.slug).filter(Boolean))];
  for (const slug of dynamicSlugs) if (!inZone.has(slug) && await polishInQuotaZone(slug)) inZone.add(slug);
  const all = data.map(d => ({
    id: d.id,
    parentId: d.nadrzedna_id ?? null,
    slug: d.slug,
    name: d.nazwa,
    badge: d.plakietka || undefined,
    tracked: d.sledzona || inZone.has(d.slug),
    rankingBased: rankingBased.has(d.slug),
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
    if (kids.some(c => c.rankingBased)) s.rankingBased = true;
  }
  return all;
}

// Czy Polska ma miejsce (pewne albo wirtualne) na którejś tablicy kwot dyscypliny po uwzględnieniu rankingów
async function polishInQuotaZone(slug) {
  const events = (await safe(
    supabase.from('konkurencje').select(`${EVENT_COLS}, algorytm, dyscypliny!inner(slug)`).eq('dyscypliny.slug', slug).not('algorytm', 'is', null),
    'konkurencje (strefa)'
  )) || [];
  if (!events.length) return false;
  const rankings = await getRankingsFor(events.map(e => e.id), { onlyPolish: false });
  for (const e of events) {
    const board = await quotaBoard(e);
    if (!board) continue;
    const own = rankings.filter(r => (e.algorytm?.zbiorcze ? r.konkurencja_id !== e.id : r.konkurencja_id === e.id));
    const { kwoty } = applyQuotaRanking(own, board.kwoty);
    if (kwoty.some(k => k.kraj === 'POL' && (k.status === 'ok' || k.status === 'virt'))) return true;
  }
  return false;
}

// Kafle na stronie Dyscypliny: tylko dyscypliny główne (poddyscypliny są w środku).
export async function getSports() {
  const all = await getAllSports();
  return all.filter(s => !s.parentId);
}

const EVENT_COLS = 'id, dyscyplina_id, slug, nazwa, plec, miejsc, data_startu, godzina, miejsce, opis';

// Strona dyscypliny: konkurencje z krótkim stanem Polski i kalendarz terminów.
export async function getSportHub(slug) {
  const all = await getAllSports();
  const found = all.find(s => s.slug === slug) || null;
  if (!found) return { sport: null, events: [], terms: [], children: [], parent: null };
  const sport = found;
  const children = all.filter(c => sport.id && c.parentId === sport.id);
  const parent = sport.parentId ? all.find(p => p.id === sport.parentId) || null : null;

  let events = await safe(
    supabase?.from('konkurencje').select(`${EVENT_COLS}, algorytm, dyscypliny!inner(slug)`).eq('dyscypliny.slug', slug).order('plec').order('id'),
    'konkurencje'
  );
  // Zanim zostanie uruchomiona migracja 0008, nie ma kolumny algorytm.
  if (!events && supabase) events = await safe(supabase.from('konkurencje').select(`${EVENT_COLS}, dyscypliny!inner(slug)`).eq('dyscypliny.slug', slug).order('plec').order('id'), 'konkurencje (bez algorytmu)');
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
      const applied = applyQuotaRanking(rankings.filter(r => (e.algorytm?.zbiorcze ? r.konkurencja_id !== e.id : r.konkurencja_id === e.id)), auto.kwoty);
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
    // Tablica zbiorcza (np. kwoty kontynentalne judo): wypełniana z rankingów wszystkich konkurencji tej dyscypliny,
    // same rankingi są na stronach konkurencji
    const zbiorcze = !!event.algorytm?.zbiorcze;
    const ids = zbiorcze ? hub.events.filter(e => e.id !== event.id).map(e => e.id) : [event.id];
    const applied = applyQuotaRanking(withAllocation(await getRankingsFor(ids, { onlyPolish: false }), hub.events), event.auto.kwoty);
    const rankings = zbiorcze ? [] : applied.rankings;
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
      supabase.from('wiersze_notowan').select('pozycja, zawodnik, kraj, kod_kraju, punkty, dodatkowe').eq('notowanie_id', snap.id).order('pozycja').limit(5000),
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
    supabase.from('wiersze_notowan').select('pozycja, zawodnik, kraj, kod_kraju, punkty, dodatkowe').eq('notowanie_id', snap.id).order('pozycja').limit(5000),
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
  // Duety z krajów, które mają drużynę: wolne miejsca „Kraje z drużyną” wypełniają się z tablicy drużyn
  if (event.algorytm?.z_druzyn) {
    const teams = (await safe(
      supabase.from('kwoty').select('kraj, status, konkurencje!inner(slug, dyscyplina_id)').eq('konkurencje.slug', event.algorytm.z_druzyn).eq('konkurencje.dyscyplina_id', event.dyscyplina_id ?? -1).not('kraj', 'is', null),
      'kwoty drużyn'
    )) || [];
    const taken = new Set(kwoty.filter(k => k.kraj).map(k => k.kraj));
    const queue = teams.filter(t => !taken.has(t.kraj));
    for (const k of kwoty) {
      if (k.sciezka !== 'Kraje z drużyną' || k.kraj || !queue.length) continue;
      const t = queue.shift();
      k.kraj = t.kraj;
      k.status = t.status;
      k.uwagi = [k.uwagi, 'kraj z drużyną'].filter(Boolean).join(' · ');
    }
  }
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
  const clean = kwoty.filter(k => !k.dopisane).map(k => (k.auto_ranking ? { ...k, kraj: null, zawodnik: null, status: 'pending', auto_ranking: false, uwagi: k.uwagi_org ?? k.uwagi } : k));
  let board = clean;
  const pathOf = k => (k.sciezka === 'Gospodarz' ? 'Gospodarz (warunkowo – start na MŚ 2027)' : `${k.sciezka} – ${k.zawody}`);
  const out = rankings.map(r => {
    if (r.zasady?.algorytm === 'kwoty-ranking-kontynenty') {
      const res = continentalRanking(r, clean);
      board = board.map(k => res.fill.get(k) || k);
      return res.ranking;
    }
    if (r.zasady?.algorytm !== 'kwoty-ranking') return r;
    const path = r.zasady.sciezka;
    const slots = clean.filter(k => k.sciezka === path);
    const n = r.zasady.miejsc || slots.length;
    // tylko_sciezka: inne grupy tablicy (np. inne kategorie wagowe w judo) nie blokują kraju
    const owned = r.zasady.tylko_sciezka ? {} : Object.fromEntries(clean.filter(k => k.kraj && k.sciezka !== path).map(k => [k.kraj, k]));
    const fixed = Object.fromEntries(slots.filter(k => k.kraj).map(k => [k.kraj, k]));
    let given = Object.keys(fixed).length;
    const picked = [];
    // jeden_na_kraj: ranking zawodników, z kraju liczy się tylko najwyżej sklasyfikowany
    const seen = new Set();
    const contPicked = [];
    const pickedNames = [];
    const fixedNames = new Map();
    const rows = r.rows.map(row => {
      const noc = toNoc(row.kod_kraju) || toNoc(row.zawodnik);
      if (r.zasady.jeden_na_kraj && noc) {
        if (seen.has(noc)) return { ...row, status: 'res', sciezka: 'Limit kraju – liczy się 1 zawodnik w kategorii' };
        seen.add(noc);
      }
      if (owned[noc]) return { ...row, status: owned[noc].status, sciezka: pathOf(owned[noc]) };
      if (fixed[noc]) {
        if (r.zasady.jeden_na_kraj && !fixed[noc].zawodnik) fixedNames.set(fixed[noc], row.zawodnik);
        return { ...row, status: fixed[noc].status, sciezka: pathOf(fixed[noc]) };
      }
      if (given < n) { given++; picked.push(noc); pickedNames.push(r.zasady.jeden_na_kraj ? row.zawodnik : null); return { ...row, status: 'virt', sciezka: `${path} (${row.pozycja}. miejsce)` }; }
      // kontynentalne: zawodnik oznaczony przez federację jako kwota kontynentalna (IJF: q_status 2)
      if (r.zasady.kontynentalne && String(row.dodatkowe?.ijf_q_status) === '2') {
        contPicked.push({ noc, zawodnik: row.zawodnik });
        return { ...row, status: 'virt', sciezka: `${r.zasady.kontynentalne} (wg IJF)` };
      }
      return { ...row, status: 'res', sciezka: null };
    });
    let i = 0;
    board = board.map(k => (k.sciezka === path && !k.kraj && picked[i]
      ? { ...k, zawodnik: pickedNames[i] || k.zawodnik, kraj: picked[i++], status: 'virt', auto_ranking: true, uwagi_org: k.uwagi, uwagi: [k.uwagi, 'wg aktualnego rankingu'].filter(Boolean).join(' · ') }
      : k));
    board = board.map(k => {
      const name = [...fixedNames.entries()].find(([f]) => f.kolejnosc === k.kolejnosc && f.sciezka === k.sciezka)?.[1];
      return name ? { ...k, zawodnik: name } : k;
    });
    // Brak takich miejsc na tablicy (strona kategorii) – dopisujemy wiersze z oznaczonymi zawodnikami
    if (r.zasady.kontynentalne && !board.some(k => k.sciezka === r.zasady.kontynentalne)) {
      board = [...board, ...contPicked.map((c, x) => ({
        id: `kont-${x}`, kolejnosc: 1000 + x, sciezka: r.zasady.kontynentalne, zawody: 'Ranking olimpijski IJF – kwota kontynentalna',
        data_zawodow: r.zasady.zamkniecie || null, liczba: 1, kraj: c.noc, zawodnik: c.zawodnik, status: 'virt', dopisane: true,
        uwagi: 'Zawodnik oznaczony przez IJF jako kwota kontynentalna · wg aktualnego rankingu'
      }))];
      contPicked.length = 0;
    }
    let j = 0;
    board = board.map(k => (r.zasady.kontynentalne && k.sciezka === r.zasady.kontynentalne && !k.kraj && contPicked[j]
      ? { ...k, kraj: contPicked[j].noc, zawodnik: contPicked[j++].zawodnik + ` (${path})`, status: 'virt', auto_ranking: true, uwagi_org: k.uwagi, uwagi: [k.uwagi, 'wg aktualnego rankingu'].filter(Boolean).join(' · ') }
      : k));
    const lastPicked = rows.filter(x => x.status === 'virt' && x.sciezka?.startsWith(path)).map(x => x.pozycja);
    return { ...r, rows, polish: rows.filter(rowIsPolish), allocation: { entries: [], pending: [] }, quotaRanking: true, linePos: lastPicked.length ? Math.max(...lastPicked) : null };
  });
  return { rankings: out, kwoty: board };
}

// Ranking z miejscami dla kontynentów (np. 3x3: najlepszy kraj z Afryki, Europy, Ameryk + 2 z Azji i Oceanii, w tym min. 1 z Azji).
// zasady.grupy: [{ etykieta: 'Europa', kontynenty: ['Europa'], miejsc: 1, minAzja?: 1 }]
function continentalRanking(r, kwoty) {
  const path = r.zasady.sciezka;
  const owned = Object.fromEntries(kwoty.filter(k => k.kraj && k.sciezka !== path && k.status !== 'pending').map(k => [k.kraj, k]));
  const rows = r.rows.map(row => ({ ...row, noc: toNoc(row.kod_kraju) || toNoc(row.zawodnik) }));
  const picks = new Map(); // noc -> etykieta grupy
  for (const g of r.zasady.grupy || []) {
    const fixed = kwoty.filter(k => k.sciezka === path && k.kraj && k.zawody.includes(g.etykieta)).map(k => k.kraj);
    fixed.forEach(n => picks.set(n, g.etykieta));
    let left = (g.miejsc || 1) - fixed.length;
    const pool = rows.filter(x => x.noc && g.kontynenty.includes(continentOf(x.noc)) && !owned[x.noc] && !picks.has(x.noc));
    const chosen = [];
    for (const x of pool) {
      if (left <= 0) break;
      const needAsia = g.minAzja && left === 1 && ![...chosen, ...fixed].some(n => continentOf(n) === 'Azja');
      if (needAsia && continentOf(x.noc) !== 'Azja') continue;
      chosen.push(x.noc); left--;
    }
    chosen.forEach(n => picks.set(n, g.etykieta));
  }
  const out = rows.map(({ noc, ...row }) => {
    if (owned[noc]) return { ...row, status: owned[noc].status, sciezka: `${owned[noc].sciezka} – ${owned[noc].zawody}` };
    if (picks.has(noc)) return { ...row, status: 'virt', sciezka: `${path} – ${picks.get(noc)} (${row.pozycja}. miejsce)` };
    return { ...row, status: 'res', sciezka: null };
  });
  // Wolne miejsca w tablicy kwot dostają kraje z rankingu (wirtualnie)
  const fill = new Map();
  const used = new Set(kwoty.filter(k => k.sciezka === path && k.kraj).map(k => k.kraj));
  for (const k of kwoty) {
    if (k.sciezka !== path || k.kraj) continue;
    const noc = [...picks.entries()].find(([n, et]) => k.zawody.includes(et) && !used.has(n))?.[0];
    if (!noc) continue;
    used.add(noc);
    fill.set(k, { ...k, kraj: noc, status: 'virt', auto_ranking: true, uwagi_org: k.uwagi, uwagi: [k.uwagi, 'wg aktualnego rankingu'].filter(Boolean).join(' · ') });
  }
  return { ranking: { ...r, rows: out, polish: out.filter(rowIsPolish), allocation: { entries: [], pending: [] }, quotaRanking: true, linePos: null }, fill };
}
