'use client';

import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { toNoc, countryPl } from '../../lib/countries';
import { GAMES } from '../../lib/triathlon';
import { parsePastedTable } from '../../lib/paste';

const PLEC = { K: 'Kobiety', M: 'Mężczyźni', X: 'Mieszana' };

async function revalidate(token) {
  try { await fetch('/api/odswiez', { method: 'POST', headers: { 'content-type': 'application/json', authorization: 'Bearer ' + token }, body: JSON.stringify({ revalidateOnly: true }) }); } catch {}
}

// Podgląd rozpoznanych krajów pod polem
function Resolved({ value }) {
  const parts = String(value || '').split(/[,;\n]+/).map(s => s.trim()).filter(Boolean);
  if (!parts.length) return <span className="hint">Puste – na stronie: „Miejsce do rozstrzygnięcia”.</span>;
  return (
    <span className="hint">
      {parts.map((p, i) => {
        const noc = toNoc(p);
        return <span key={i} style={{ color: noc ? 'var(--body)' : 'var(--warn)' }}>{i > 0 && ' → '}{noc ? `${countryPl(noc)} (${noc})` : `nie rozpoznano: „${p}”`}</span>;
      })}
    </span>
  );
}

function CountryField({ id, label, help, value, onChange }) {
  return (
    <label className="field" htmlFor={id}>
      {label}
      <input id={id} value={value} onChange={e => onChange(e.target.value)} placeholder="np. FRA albo Francja" autoComplete="off" />
      {help && <span className="hint">{help}</span>}
      <Resolved value={value} />
    </label>
  );
}

function SourceSelect({ id, label, value, sources, onChange, optional }) {
  return (
    <label className="field" htmlFor={id}>
      {label}
      <select id={id} value={value || ''} onChange={e => onChange(e.target.value || null)}>
        <option value="">{optional ? '— brak (liczone z IOQR) —' : '— wybierz —'}</option>
        {sources.map(s => <option key={s.slug} value={s.slug}>{s.nazwa}</option>)}
      </select>
    </label>
  );
}

// Wyniki igrzysk kontynentalnych: podgląd zapisanych i wklejanie nowych
function GamesResults({ plec, game, rows, token, onSaved }) {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState('');
  const [msg, setMsg] = useState({ ok: '', err: '' });
  const [busy, setBusy] = useState(false);

  const parsed = text.trim() ? parsePastedTable(text) : null;
  const items = (parsed?.rows || []).map(r => {
    const raw = r.kod_kraju || r.kraj || '';
    return { miejsce: r.pozycja, zawodnik: r.zawodnik, kraj: toNoc(raw), raw };
  });
  const bad = items.filter(i => !i.kraj);

  async function save() {
    setBusy(true);
    setMsg({ ok: '', err: '' });
    const good = items.filter(i => i.kraj);
    const del = await supabase.from('wyniki_igrzysk').delete().eq('dyscyplina', 'triathlon').eq('plec', plec).eq('zawody', game.key);
    if (del.error) { setBusy(false); return setMsg({ ok: '', err: 'Nie zapisano: ' + del.error.message }); }
    const ins = await supabase.from('wyniki_igrzysk').insert(good.map(i => ({ dyscyplina: 'triathlon', plec, zawody: game.key, miejsce: i.miejsce, zawodnik: i.zawodnik, kraj: i.kraj })));
    setBusy(false);
    if (ins.error) return setMsg({ ok: '', err: 'Nie zapisano: ' + ins.error.message });
    await revalidate(token);
    setText(''); setOpen(false);
    setMsg({ ok: `Zapisano ${good.length} wyników.`, err: '' });
    onSaved();
  }

  async function clear() {
    const { error } = await supabase.from('wyniki_igrzysk').delete().eq('dyscyplina', 'triathlon').eq('plec', plec).eq('zawody', game.key);
    if (error) return setMsg({ ok: '', err: error.message });
    await revalidate(token);
    setMsg({ ok: 'Usunięto wyniki.', err: '' });
    onSaved();
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 13 }}>
      {rows.length ? (
        <span style={{ color: 'var(--body)' }}>
          <strong>Wyniki w bazie ({rows.length}):</strong> {rows.slice(0, 3).map(r => `${r.miejsce}. ${r.zawodnik} (${r.kraj})`).join(' · ')}{rows.length > 3 ? ' …' : ''}
        </span>
      ) : <span className="hint">Brak wyników w bazie – liczy się pole z krajami powyżej.</span>}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <button type="button" className="btn btn-ghost" onClick={() => setOpen(o => !o)} aria-expanded={open}>{open ? 'Zamknij' : rows.length ? 'Wklej nowe wyniki' : 'Wklej wyniki'}</button>
        {rows.length > 0 && <button type="button" className="btn btn-ghost" onClick={clear}>Usuń wyniki</button>}
      </div>
      {open && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <textarea value={text} onChange={e => setText(e.target.value)} rows={6} aria-label={`Wyniki – ${game.nazwa}`}
            placeholder={'Skopiuj tabelę wyników (miejsce, zawodnik, kraj), np.\n1\tTakumi Hojo\tJPN\n2\tXirui Zhang\tCHN'}
            style={{ font: 'inherit', fontSize: 13, padding: 10, borderRadius: 8, border: '1px solid var(--line-2)', background: 'var(--bg)', color: 'var(--ink)', resize: 'vertical' }} />
          {parsed && (
            <span style={{ color: 'var(--body)' }}>
              Rozpoznano {items.length} zawodników{items.length ? `: ${items.slice(0, 4).map(i => `${i.miejsce}. ${i.zawodnik} (${i.kraj || '?'})`).join(' · ')}` : ''}.
              {bad.length > 0 && <span style={{ color: 'var(--warn)' }}> Bez rozpoznanego kraju ({bad.length}) – zostaną pominięci: {bad.slice(0, 5).map(b => `${b.zawodnik} „${b.raw}”`).join(', ')}.</span>}
            </span>
          )}
          <button type="button" className="btn btn-primary" style={{ alignSelf: 'flex-start' }} disabled={busy || !items.some(i => i.kraj)} onClick={save}>{busy ? 'Zapisuję…' : 'Zapisz wyniki'}</button>
        </div>
      )}
      {msg.ok && <span className="msg-ok" role="status">{msg.ok}</span>}
      {msg.err && <span className="msg-err" role="alert">{msg.err}</span>}
    </div>
  );
}

function toForm(cfg) {
  const list = v => (Array.isArray(v) ? v.join(', ') : v || '');
  return {
    zrodla: { ioqr: cfg.zrodla?.ioqr || null, sztafety: cfg.zrodla?.sztafety || null, ranking: cfg.zrodla?.ranking || null },
    gospodarz: list(cfg.gospodarz) || 'USA',
    ms2026: list(cfg.ms2026),
    ms2027: list(cfg.ms2027),
    uniwersalne: list(cfg.uniwersalne),
    igrzyska: Object.fromEntries(GAMES.map(g => [g.key, list(cfg.igrzyska?.[g.key])]))
  };
}

function EventCard({ event, sources, results, token, onSaved }) {
  const [f, setF] = useState(() => toForm(event.algorytm || {}));
  const [msg, setMsg] = useState({ ok: '', err: '' });
  const [busy, setBusy] = useState(false);
  const set = patch => setF(prev => ({ ...prev, ...patch }));
  const pid = k => `alg-${event.id}-${k}`;

  async function save(e) {
    e.preventDefault();
    setBusy(true);
    setMsg({ ok: '', err: '' });
    const algorytm = { ...(event.algorytm || {}), typ: 'triathlon-la28', ...f };
    const { error } = await supabase.from('konkurencje').update({ algorytm }).eq('id', event.id);
    setBusy(false);
    if (error) return setMsg({ ok: '', err: 'Nie zapisano: ' + error.message });
    await revalidate(token);
    setMsg({ ok: 'Zapisane. Strona przeliczy listę w ciągu kilku sekund.', err: '' });
    onSaved();
  }

  return (
    <form onSubmit={save} className="panel" style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      <h3 className="h2" style={{ fontSize: 26 }}>{event.dyscypliny?.nazwa} – {PLEC[event.plec] || event.nazwa}</h3>

      <fieldset className="form-grid" style={{ border: 0, padding: 0, margin: 0 }}>
        <legend className="eyebrow" style={{ marginBottom: 10 }}>Rankingi (wklejasz je w „Źródła danych”)</legend>
        <SourceSelect id={pid('ioqr')} label="Ranking IOQR" value={f.zrodla.ioqr} sources={sources} onChange={v => set({ zrodla: { ...f.zrodla, ioqr: v } })} />
        <SourceSelect id={pid('sztafety')} label="Ranking sztafet mieszanych" value={f.zrodla.sztafety} sources={sources} onChange={v => set({ zrodla: { ...f.zrodla, sztafety: v } })} />
        <SourceSelect id={pid('ranking')} label="Ranking World Triathlon (nowa flaga)" value={f.zrodla.ranking} sources={sources} optional onChange={v => set({ zrodla: { ...f.zrodla, ranking: v } })} />
      </fieldset>

      <fieldset className="form-grid" style={{ border: 0, padding: 0, margin: 0 }}>
        <legend className="eyebrow" style={{ marginBottom: 10 }}>Sztafety i gospodarz (po 2 miejsca)</legend>
        <CountryField id={pid('host')} label="Gospodarz" value={f.gospodarz} onChange={v => set({ gospodarz: v })} />
        <CountryField id={pid('ms26')} label="MŚ sztafet 2026" value={f.ms2026} onChange={v => set({ ms2026: v })}
          help="Kraje w kolejności wyników. Miejsca dostaje pierwszy, który jeszcze ich nie ma." />
        <CountryField id={pid('ms27')} label="MŚ sztafet 2027" value={f.ms2027} onChange={v => set({ ms2027: v })}
          help="Kraje w kolejności wyników, np. GBR, GER, ITA." />
      </fieldset>

      <fieldset className="form-grid" style={{ border: 0, padding: 0, margin: 0 }}>
        <legend className="eyebrow" style={{ marginBottom: 10 }}>Nowa flaga – igrzyska kontynentalne (po 1 miejscu)</legend>
        {GAMES.map(g => (
          <div key={g.key} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <CountryField id={pid(g.key)} label={g.nazwa} value={f.igrzyska[g.key]}
              onChange={v => set({ igrzyska: { ...f.igrzyska, [g.key]: v } })}
              help="Gdy nie masz pełnych wyników: kraje w kolejności. Pełne wyniki (niżej) mają pierwszeństwo." />
            {event.plec !== 'X' && <GamesResults plec={event.plec} game={g} rows={results.filter(r => r.zawody === g.key)} token={token} onSaved={onSaved} />}
          </div>
        ))}
      </fieldset>

      <fieldset className="form-grid" style={{ border: 0, padding: 0, margin: 0 }}>
        <legend className="eyebrow" style={{ marginBottom: 10 }}>Miejsca uniwersalne (2)</legend>
        <CountryField id={pid('uni')} label="Kraje z miejscem uniwersalnym" value={f.uniwersalne} onChange={v => set({ uniwersalne: v })}
          help="Maksymalnie dwa kraje, oddzielone przecinkiem." />
      </fieldset>

      <p className="hint" style={{ margin: 0 }}>Nowa flaga z rankingu (5 miejsc) liczy się sama i ma na stronie gwiazdkę z zasadami.</p>
      <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
        <button type="submit" className="btn btn-primary" disabled={busy}>{busy ? 'Zapisuję…' : 'Zapisz i przelicz'}</button>
        {msg.ok && <span className="msg-ok" role="status">{msg.ok}</span>}
        {msg.err && <span className="msg-err" role="alert">{msg.err}</span>}
      </div>
    </form>
  );
}

export default function Algorithm({ session }) {
  const [events, setEvents] = useState(null);
  const [sources, setSources] = useState([]);
  const [results, setResults] = useState([]);
  const [err, setErr] = useState('');

  async function load() {
    const { data, error } = await supabase.from('konkurencje').select('id, slug, nazwa, plec, algorytm, dyscypliny(nazwa)').not('algorytm', 'is', null).order('plec');
    if (error) { setErr('Uruchom w Supabase migrację 0008_algorytm_triathlonu.sql. (' + error.message + ')'); setEvents([]); return; }
    setEvents(data || []);
    const { data: src } = await supabase.from('zrodla_rankingow').select('slug, nazwa').order('nazwa');
    setSources(src || []);
    const { data: wy } = await supabase.from('wyniki_igrzysk').select('plec, zawody, miejsce, zawodnik, kraj').eq('dyscyplina', 'triathlon').order('miejsce');
    setResults(wy || []);
  }
  useEffect(() => { load(); }, []);

  if (!events) return <p style={{ color: 'var(--muted)' }}>Wczytuję…</p>;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <p style={{ margin: 0, color: 'var(--body)', maxWidth: '72ch' }}>
        Lista olimpijska liczy się sama z rankingów. Tu wpisujesz tylko to, czego nie ma w rankingach: wyniki MŚ sztafet, igrzysk kontynentalnych i miejsca uniwersalne.
      </p>
      {err && <p className="msg-err" role="alert">{err}</p>}
      {events.map(e => <EventCard key={e.id} event={e} sources={sources} results={results.filter(r => r.plec === e.plec)} token={session.access_token} onSaved={load} />)}
    </div>
  );
}
