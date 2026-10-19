import 'server-only';
import { createClient } from '@supabase/supabase-js';

// Klient z kluczem secret – tylko po stronie serwera (API, cron). Omija RLS,
// więc nigdy nie importuj tego pliku w komponentach z 'use client'.

function cleanUrl(raw) {
  try { const u = new URL(String(raw || '').trim()); return `${u.protocol}//${u.host}`; } catch { return null; }
}

const url = cleanUrl(process.env.NEXT_PUBLIC_SUPABASE_URL);
const secret = process.env.SUPABASE_SECRET_KEY?.trim();
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();

export const supabaseAdmin = url && secret
  ? createClient(url, secret, { auth: { persistSession: false, autoRefreshToken: false } })
  : null;

// Sprawdza, czy zapytanie przyszło od zalogowanego admina panelu (token z nagłówka Authorization).
export async function requireAdmin(request) {
  const token = (request.headers.get('authorization') || '').replace(/^Bearer\s+/i, '');
  if (!token || !url || !anon) return null;
  const client = createClient(url, anon, { auth: { persistSession: false } });
  const { data, error } = await client.auth.getUser(token);
  if (error || !data?.user) return null;
  if (!supabaseAdmin) return null;
  const { data: row } = await supabaseAdmin.from('admini').select('user_id').eq('user_id', data.user.id).maybeSingle();
  return row ? data.user : null;
}

export function missingConfig() {
  if (!url) return 'Brak NEXT_PUBLIC_SUPABASE_URL w zmiennych Vercela.';
  if (!secret) return 'Brak SUPABASE_SECRET_KEY w zmiennych Vercela (klucz secret z Supabase → API Keys).';
  return null;
}
