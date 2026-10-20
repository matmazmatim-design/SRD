import { supabase } from './supabase';
import { SPORTS } from './sports';
import { rowIsPolish, lastQuotaPosition } from './compute';
import { simulateTriathlon } from './triathlon';

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
  const all = data.map(d => ({
    id: d.id,
    parentId: d.nadrzedna_id ?? null,
    slug: d.slug,
    name: d.nazwa,
    badge: d.plakietka || undefined,
    tracked: d.sledzona,
    detail: d.opis_kafla || undefined,
    hasRanking: withRanking.has(d.slug)
  }));
  for (const s of all) {
    const kids = all.filter(c => c.parentId === s.id);
    s.childCount = kids.length;
    if (kids.some(c => c.hasRanking)) s.hasRanking = true;
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
    rankings = await getRankingsFor(ids, { onlyPolish: true });
  }

  const autos = await Promise.all(events.map(e => algorithmSimulation(e)));
  const enriched = events.map((e, i) => {
    const auto = autos[i];
    const sim = auto?.simulation || sims.find(s => s.konkurencja_id === e.id) || null;
    const poles = auto ? auto.rows.filter(r => r.lista === 'polacy') : sim ? polishRows.filter(r => r.symulacja_id === sim.id) : [];
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
    const rankings = await getRankingsFor([event.id], { onlyPolish: false });
    return { sport: hub.sport, parent: hub.parent, event, siblings: hub.events, simulation: event.auto.simulation, rows: event.auto.rows, rankings };
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

  const rankings = await getRankingsFor([event.id], { onlyPolish: false });
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
      rows: onlyPolish ? [] : rows
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
  if (!cfg || cfg.typ !== 'triathlon-la28') return null;
  const [ioqr, relay, wtr] = await Promise.all([latestRows(cfg.zrodla?.ioqr), latestRows(cfg.zrodla?.sztafety), latestRows(cfg.zrodla?.ranking)]);
  if (!ioqr || !relay) return null;
  const { rows, notes } = simulateTriathlon({ ioqr: ioqr.rows, relay: relay.rows, wtr: wtr?.rows || null, cfg });
  const dates = [ioqr.stanNa, relay.stanNa, wtr?.stanNa].filter(Boolean).sort();
  const opis = `Wyliczone automatycznie z IOQR (${fmt(ioqr.stanNa)}), rankingu sztafet (${fmt(relay.stanNa)})${wtr ? ` i rankingu World Triathlon (${fmt(wtr.stanNa)})` : ''} oraz wpisów redakcji.`;
  return { simulation: { stan_na: dates[dates.length - 1], opis, notes, auto: true }, rows };
}

function fmt(iso) {
  const [y, m, d] = String(iso).slice(0, 10).split('-');
  return `${d}.${m}.${y}`;
}
