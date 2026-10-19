import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { saveSnapshot } from '../../../lib/refresh';
import { requireAdmin, missingConfig, supabaseAdmin } from '../../../lib/supabaseServer';

export const dynamic = 'force-dynamic';

// Zapis rankingu wklejonego w panelu (wiersze rozpoznane i sprawdzone w przeglądarce).
export async function POST(request) {
  const cfg = missingConfig();
  if (cfg) return NextResponse.json({ error: cfg }, { status: 500 });
  const user = await requireAdmin(request);
  if (!user) return NextResponse.json({ error: 'Zaloguj się jako administrator panelu.' }, { status: 401 });

  const { zrodloId, stanNa, rows } = await request.json().catch(() => ({}));
  if (!zrodloId || !Array.isArray(rows) || rows.length === 0) {
    return NextResponse.json({ error: 'Brak źródła albo wierszy do zapisania.' }, { status: 400 });
  }
  if (rows.length > 20000) return NextResponse.json({ error: 'Za dużo wierszy naraz (limit 20 000).' }, { status: 400 });
  const clean = rows
    .map((r, i) => ({
      pozycja: Number.isFinite(Number(r.pozycja)) ? Math.trunc(Number(r.pozycja)) : i + 1,
      zawodnik: String(r.zawodnik || '').trim().slice(0, 200),
      kraj: r.kraj ? String(r.kraj).slice(0, 100) : null,
      kod_kraju: r.kod_kraju ? String(r.kod_kraju).slice(0, 10) : null,
      punkty: Number.isFinite(Number(r.punkty)) && r.punkty !== null ? Number(r.punkty) : null
    }))
    .filter(r => r.zawodnik);

  const { data: src } = await supabaseAdmin.from('zrodla_rankingow').select('id').eq('id', zrodloId).maybeSingle();
  if (!src) return NextResponse.json({ error: 'Nie ma takiego źródła.' }, { status: 404 });

  try {
    const id = await saveSnapshot(zrodloId, clean, { stanNa: /^\d{4}-\d{2}-\d{2}$/.test(stanNa || '') ? stanNa : undefined });
    revalidatePath('/', 'layout');
    return NextResponse.json({ ok: true, notowanieId: id, rows: clean.length });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
