import { createClient } from '@supabase/supabase-js';

// Klient Supabase do odczytu publicznych danych. Wartości ustawiasz w Vercelu
// (Project Settings → Environment Variables) i lokalnie w pliku .env.local.

// Z adresu zostawiamy tylko https://xxxx.supabase.co – nawet gdy wklejono go z końcówką
// typu /rest/v1/ albo ze spacją, co powoduje błąd „Invalid path specified in request URL”.
function cleanUrl(raw) {
  if (!raw) return null;
  try {
    const u = new URL(raw.trim());
    return `${u.protocol}//${u.host}`;
  } catch {
    return null;
  }
}

const url = cleanUrl(process.env.NEXT_PUBLIC_SUPABASE_URL);
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();

export const supabase = url && anonKey ? createClient(url, anonKey) : null;
