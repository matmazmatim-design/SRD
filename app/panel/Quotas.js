'use client';

import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { toNoc, countryPl } from '../../lib/countries';

async function revalidate(token) {
  try { await fetch('/api/odswiez', { method: 'POST', headers: { 'content-type': 'application/json', authorization: 'Bearer ' + token }, body: JSON.stringify({ revalidateOnly: true }) }); } catch {}
}

const STATUS = [['pending', 'Do rozstrzygnięcia'], ['virt', 'Wirtualna kwalifikacja'], ['ok', 'Zakwalifikowany']];

function Row({ k, token, onSaved }) {
  const [kraj, setKraj] = useState(k.kraj || '');
  const [zaw, setZaw] = useState(k.zawodnik || '');
  const [status, setStatus] = useState(k.status);
  const [msg, setMsg] = useState('');
  const noc = kraj.trim() ? toNoc(kraj) : null;
  const dirty = (k.kraj || '') !== (noc || '') || (k.zawodnik || '') !== zaw.trim() || k.status !== status;

  async function save() {
    if (kraj.trim() && !noc) return setMsg('Nie rozpoznano kraju.');
    const st = !noc ? 'pending' : status;
    const { error } = await supabase.from('kwoty').update({ kraj: noc, zawodnik: zaw.trim() || null, status: st }).eq('id', k.id);
    if (error) return setMsg('Błąd: ' + error.message);
    setStatus(st);
    await revalidate(token);
    setMsg('Zapisano');
    onSaved();
  }

  return (
    <div className="rrow" style={{ gridTemplateColumns: 'minmax(0, 1.6fr) 50px minmax(0, 1fr) minmax(0, 1.3fr) 190px 110px', alignItems: 'center' }}>
      <span style={{ fontSize: 14 }}>{k.zawody}<span className="hint" style={{ display: 'block' }}>{k.sciezka}</span></span>
      <span style={{ textAlign: 'center' }}>{k.liczba}</span>
      <span>
        <input aria-label={`Kraj – ${k.zawody}`} value={kraj} onChange={e => setKraj(e.target.value)} placeholder="np. POL"
          style={{ width: '100%', font: 'inherit', minHeight: 36, padding: '0 8px', borderRadius: 6, border: '1px solid var(--line-2)', background: 'var(--bg)', color: 'var(--ink)' }} />
        {kraj.trim() && <span className="hint" style={{ display: 'block' }}>{noc ? countryPl(noc) : 'nie rozpoznano'}</span>}
      </span>
      <input aria-label={`Zawodnicy – ${k.zawody}`} value={zaw} onChange={e => setZaw(e.target.value)} placeholder="opcjonalnie"
        style={{ width: '100%', font: 'inherit', minHeight: 36, padding: '0 8px', borderRadius: 6, border: '1px solid var(--line-2)', background: 'var(--bg)', color: 'var(--ink)' }} />
      <select aria-label={`Status – ${k.zawody}`} value={status} onChange={e => setStatus(e.target.value)}
        style={{ font: 'inherit', minHeight: 36, borderRadius: 6, border: '1px solid var(--line-2)', background: 'var(--bg)', color: 'var(--ink)' }}>
        {STATUS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
      </select>
      <span style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <button type="button" className="btn btn-ghost" disabled={!dirty} onClick={save} style={{ minHeight: 36 }}>Zapisz</button>
        {msg && <span className="hint">{msg}</span>}
      </span>
    </div>
  );
}

// Panel: wpisywanie krajów, które zdobyły miejsca na zawodach (dyscypliny z tablicą kwot)
export default function Quotas({ session }) {
  const [events, setEvents] = useState([]);
  const [sel, setSel] = useState(null);
  const [rows, setRows] = useState([]);

  useEffect(() => {
    supabase.from('konkurencje').select('id, nazwa, algorytm, dyscypliny(nazwa)').not('algorytm', 'is', null).then(({ data }) => {
      const list = (data || []).filter(e => e.algorytm?.typ === 'kwoty');
      setEvents(list);
      if (list.length) setSel(list[0].id);
    });
  }, []);

  async function load() {
    if (!sel) return;
    const { data } = await supabase.from('kwoty').select('*').eq('konkurencja_id', sel).order('kolejnosc');
    setRows(data || []);
  }
  useEffect(() => { load(); }, [sel]);

  if (!events.length) return <p style={{ color: 'var(--muted)' }}>Brak konkurencji z tablicą kwot. Uruchom migrację 0017.</p>;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <p style={{ margin: 0, color: 'var(--body)', maxWidth: '72ch' }}>Po zawodach wpisz kraj (kod albo nazwa), który zdobył miejsce. Wybierz status: „Zakwalifikowany” dla miejsca zdobytego na zawodach, „Do rozstrzygnięcia” dla warunkowego (np. gospodarz).</p>
      <label className="field" htmlFor="q-event" style={{ maxWidth: 420 }}>Konkurencja
        <select id="q-event" value={sel || ''} onChange={e => setSel(Number(e.target.value))}>
          {events.map(e => <option key={e.id} value={e.id}>{e.dyscypliny?.nazwa} – {e.nazwa}</option>)}
        </select>
      </label>
      <div className="table-box"><div className="rtable" style={{ minWidth: 900 }}>
        {rows.map(k => <Row key={k.id + ':' + (k.kraj || '') + k.status} k={k} token={session.access_token} onSaved={load} />)}
      </div></div>
    </div>
  );
}
