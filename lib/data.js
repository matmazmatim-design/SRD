import { supabase } from './supabase';
import { SPORTS } from './sports';

// Dyscypliny z bazy. Gdy baza nie jest jeszcze podłączona albo nie odpowiada,
// strona korzysta z listy statycznej w lib/sports.js, więc nigdy nie jest pusta.
export async function getSports() {
  if (!supabase) return SPORTS;
  const { data, error } = await supabase
    .from('dyscypliny')
    .select('slug, nazwa, plakietka, sledzona, opis_kafla')
    .order('kolejnosc');
  if (error || !data || data.length === 0) {
    if (error) console.error('Supabase – dyscypliny:', error.message);
    return SPORTS;
  }
  return data.map(d => ({
    slug: d.slug,
    name: d.nazwa,
    badge: d.plakietka || undefined,
    tracked: d.sledzona,
    detail: d.opis_kafla || undefined
  }));
}

export async function getSportWithEvents(slug) {
  const sports = await getSports();
  const sport = sports.find(s => s.slug === slug) || null;
  if (!sport || !supabase) return { sport, events: [] };
  const { data, error } = await supabase
    .from('konkurencje')
    .select('slug, nazwa, plec, miejsc, data_startu, godzina, miejsce, opis, dyscypliny!inner(slug)')
    .eq('dyscypliny.slug', slug)
    .order('plec');
  if (error) console.error('Supabase – konkurencje:', error.message);
  return { sport, events: data || [] };
}
