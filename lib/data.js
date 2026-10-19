import { supabase } from './supabase';
import { SPORTS } from './sports';

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

export async function getSports() {
  const data = await safe(
    supabase?.from('dyscypliny').select('slug, nazwa, plakietka, sledzona, opis_kafla').order('kolejnosc'),
    'dyscypliny'
  );
  if (!data || data.length === 0) return SPORTS;
  return data.map(d => ({
    slug: d.slug,
    name: d.nazwa,
    badge: d.plakietka || undefined,
    tracked: d.sledzona,
    detail: d.opis_kafla || undefined
  }));
}

const EVENT_COLS = 'id, slug, nazwa, plec, miejsc, data_startu, godzina, miejsce, opis';

// Strona dyscypliny: konkurencje z krótkim stanem Polski i kalendarz terminów.
export async function getSportHub(slug) {
  const sports = await getSports();
  const sport = sports.find(s => s.slug === slug) || null;
  if (!sport) return { sport: null, events: [], terms: [] };

  const events = (await safe(
    supabase?.from('konkurencje').select(`${EVENT_COLS}, dyscypliny!inner(slug)`).eq('dyscypliny.slug', slug).order('plec'),
    'konkurencje'
  )) || [];

  const ids = events.map(e => e.id);
  let sims = [];
  let polishRows = [];
  let manual = [];
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
  }

  const enriched = events.map(e => {
    const sim = sims.find(s => s.konkurencja_id === e.id) || null;
    const poles = sim ? polishRows.filter(r => r.symulacja_id === sim.id) : [];
    return {
      ...e,
      hasSimulation: !!sim,
      stanNa: sim?.stan_na || null,
      poles,
      manual: manual.filter(m => m.konkurencja_id === e.id)
    };
  });

  const terms = (await safe(
    supabase?.from('terminy').select('data_od, data_do, etykieta_daty, tytul, opis, typ, kolejnosc, dyscypliny!inner(slug)').eq('dyscypliny.slug', slug).order('kolejnosc'),
    'terminy'
  )) || [];

  return { sport, events: enriched, terms };
}

// Strona konkurencji: pełna symulacja + ręczne kwalifikacje.
export async function getEventPage(sportSlug, eventSlug) {
  const hub = await getSportHub(sportSlug);
  if (!hub.sport) return null;
  const event = hub.events.find(e => e.slug === eventSlug);
  if (!event) return null;

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

  return { sport: hub.sport, event, siblings: hub.events, simulation: sim, rows };
}
