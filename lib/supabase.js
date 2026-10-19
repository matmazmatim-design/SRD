import { createClient } from '@supabase/supabase-js';

// Klient Supabase do odczytu publicznych danych. Wartości ustawiasz w Vercelu
// (Project Settings → Environment Variables) i lokalnie w pliku .env.local.
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const supabase = url && anonKey ? createClient(url, anonKey) : null;
