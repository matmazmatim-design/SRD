import 'server-only';
import { fetchIjfOlympicRanking } from './ijf';
import { supabaseAdmin } from './supabaseServer';
import { fetchUciRanking } from './uci';
import { fetchWorldTriathlonRanking } from './worldTriathlon';
import { fetchOwgrRanking } from './owgr';
import { fetchRolexRanking } from './rolex';
import { fetchWorldArcheryRanking } from './worldArchery';

function today() {
  return new Date().toLocaleDateString('sv-SE', { timeZone: 'Europe/Warsaw' });
}

// Zapisuje notowanie i jego wiersze. Przy błędzie zapisuje notowanie ze statusem „blad”.
export async function saveSnapshot(sourceId, rows, { stanNa, status = 'ok', message = null } = {}) {
  const { data: snap, error } = await supabaseAdmin
    .from('notowania')
    .insert({ zrodlo_id: sourceId, stan_na: stanNa || today(), liczba_wierszy: rows.length, status, komunikat: message })
    .select('id')
    .single();
  if (error) throw new Error('Zapis notowania: ' + error.message);
  if (rows.length) {
    // Duplikaty (ta sama pozycja i nazwisko) psułyby klucz główny – zostawiamy pierwszy wpis.
    const seen = new Set();
    const clean = rows.filter(r => {
      const k = r.pozycja + '|' + r.zawodnik;
      if (seen.has(k)) return false;
      seen.add(k);
      return true;
    });
    for (let i = 0; i < clean.length; i += 500) {
      const chunk = clean.slice(i, i + 500).map(r => ({
        notowanie_id: snap.id,
        pozycja: r.pozycja,
        zawodnik: r.zawodnik,
        kraj: r.kraj ?? null,
        kod_kraju: r.kod_kraju ?? null,
        punkty: r.punkty ?? null,
        dodatkowe: r.dodatkowe ?? null
      }));
      const { error: e2 } = await supabaseAdmin.from('wiersze_notowan').insert(chunk);
      if (e2) throw new Error('Zapis wierszy: ' + e2.message);
    }
  }
  // Sprzątanie: zostaw 30 ostatnich notowań źródła (rankingi bywają duże)
  try {
    const { data: old } = await supabaseAdmin.from('notowania').select('id').eq('zrodlo_id', sourceId).order('pobrano', { ascending: false }).range(30, 1000);
    if (old?.length) await supabaseAdmin.from('notowania').delete().in('id', old.map(o => o.id));
  } catch {}
  return snap.id;
}

export async function refreshSource(source) {
  try {
    let rows;
    if (source.typ === 'uci') rows = await fetchUciRanking(source.parametry, { referer: source.adres_strony });
    else if (source.typ === 'world_triathlon') rows = await fetchWorldTriathlonRanking(source.parametry);
    else if (source.typ === 'owgr') rows = await fetchOwgrRanking(source.parametry);
    else if (source.typ === 'rolex') rows = await fetchRolexRanking(source.parametry);
    else if (source.typ === 'ijf') rows = await fetchIjfOlympicRanking(source.parametry);
    else if (source.typ === 'worldarchery') {
      const r = await fetchWorldArcheryRanking(source.parametry);
      await saveSnapshot(source.id, r.rows, { stanNa: r.stanNa, message: r.complete ? null : 'Pobrano tylko pierwszą stronę rankingu.' });
      return { slug: source.slug, status: 'ok', rows: r.rows.length, message: r.complete ? undefined : 'Pobrano tylko pierwszą stronę (20 drużyn).' };
    }
    else return { slug: source.slug, status: 'pominiete', message: 'To źródło aktualizujesz wklejką w panelu.' };
    await saveSnapshot(source.id, rows);
    return { slug: source.slug, status: 'ok', rows: rows.length };
  } catch (e) {
    try { await saveSnapshot(source.id, [], { status: 'blad', message: e.message.slice(0, 500) }); } catch {}
    return { slug: source.slug, status: 'blad', message: e.message };
  }
}

export async function refreshAll({ slug } = {}) {
  let q = supabaseAdmin.from('zrodla_rankingow').select('id, slug, nazwa, typ, parametry, adres_strony').eq('aktywne', true);
  if (slug) q = q.eq('slug', slug);
  const { data: sources, error } = await q;
  if (error) throw new Error('Odczyt źródeł: ' + error.message);
  const results = [];
  for (const s of sources || []) results.push(await refreshSource(s));
  return results;
}
