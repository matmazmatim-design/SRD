import { NextResponse } from 'next/server';
import { refreshAll } from '../../../lib/refresh';
import { requireAdmin, missingConfig } from '../../../lib/supabaseServer';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

// GET – wywołuje Vercel Cron (nagłówek Authorization: Bearer CRON_SECRET).
export async function GET(request) {
  const cfg = missingConfig();
  if (cfg) return NextResponse.json({ error: cfg }, { status: 500 });
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get('authorization') !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Brak dostępu' }, { status: 401 });
  }
  try {
    const results = await refreshAll();
    return NextResponse.json({ ok: true, results });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

// POST – przycisk „Odśwież teraz” w panelu (token zalogowanego admina).
export async function POST(request) {
  const cfg = missingConfig();
  if (cfg) return NextResponse.json({ error: cfg }, { status: 500 });
  const user = await requireAdmin(request);
  if (!user) return NextResponse.json({ error: 'Zaloguj się jako administrator panelu.' }, { status: 401 });
  const { slug } = await request.json().catch(() => ({}));
  try {
    const results = await refreshAll({ slug });
    return NextResponse.json({ ok: true, results });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
