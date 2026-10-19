'use client';

import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { paramsFromCurl } from '../../lib/uci';
import { parsePastedTable } from '../../lib/paste';
import { progiToText, textToProgi } from '../../lib/compute';

const TYP = { uci: 'UCI (automatycznie)', world_triathlon: 'World Triathlon', owgr: 'OWGR', wklejka: 'Wklejka' };

function slugify(s) {
  return String(s).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/ł/g, 'l')
    .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 60) || 'zrodlo';
}
function fmt(iso) {
  if (!iso) return '—';
  const d = new Date(iso);
  return d.toLocaleString('pl-PL', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}
async function revalidate(token) {
  try { await fetch('/api/odswiez', { method: 'POST', headers: { 'content-type': 'application/json', authorization: 'Bearer ' + token }, body: JSON.stringify({ revalidateOnly: true }) }); } catch {}
}
const PLEC = { K: 'kobiety', M: 'mężczyźni', X: 'mieszana' };
function eventLabel(e) { return `${e.dyscypliny?.nazwa || ''} – ${e.nazwa}`; }

function isPl(r) { return /^(pol|polska|poland)$/i.test(String(r.kod_kraju || '').trim()) || /^(polska|poland)$/i.test(String(r.kraj || '').trim()); }

function PasteBox({ source, token, onSaved }) {
  const [text, setText] = useState('');
  const [date, setDate] = useState(new Date().toLocaleDateString('sv-SE', { timeZone: 'Europe/Warsaw' }));
  const [state, setState] = useState({ busy: false, ok: '', err: '' });
  const parsed = text.trim() ? parsePastedTable(text) : null;

  async function save() {
    setState({ busy: true, ok: '', err: '' });
    const res = await fetch('/api/wklejka', {
      method: 'POST',
      headers: { 'content-type': 'application/json', authorization: 'Bearer ' + token },
      body: JSON.stringify({ zrodloId: source.id, stanNa: date, rows: parsed.rows })
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) return setState({ busy: false, ok: '', err: json.error || 'Nie udało się zapisać.' });
    setText('');
    setState({ busy: false, ok: `Zapisano ${json.rows} wierszy.`, err: '' });
    onSaved();
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10, paddingTop: 12, borderTop: '1px solid var(--line)' }}>
      <label className="field" htmlFor={'paste-' + source.id}>Wklej tabelę rankingu (zaznacz na stronie Ctrl+A, Ctrl+C)
        <textarea id={'paste-' + source.id} value={text} onChange={e => setText(e.target.value)} rows={6}
          style={{ font: 'inherit', fontSize: 14, fontWeight: 400, padding: 10, borderRadius: 8, border: '1px solid var(--line-2)', background: 'var(--bg)', color: 'var(--ink)', resize: 'vertical' }} />
      </label>
      <label className="field" htmlFor={'date-' + source.id} style={{ maxWidth: 220 }}>Stan na
        <input id={'date-' + source.id} type="date" value={date} onChange={e => setDate(e.target.value)} />
      </label>
      {parsed && parsed.error && <p className="msg-err" style={{ margin: 0 }}>{parsed.error}</p>}
      {parsed && parsed.rows.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <span style={{ fontSize: 14, color: 'var(--body)' }}>Rozpoznano <strong>{parsed.rows.length}</strong> wierszy{parsed.skipped > 0 ? ` (pominięto ${parsed.skipped} linii bez nazwiska)` : ''}. Sprawdź pierwsze:</span>
          <div className="table-box"><div className="rtable" style={{ minWidth: 520 }}>
            <div className="rrow head" style={{ gridTemplateColumns: '60px minmax(0,2fr) minmax(0,1fr) 90px' }}><span>Poz.</span><span>Zawodnik</span><span>Kraj</span><span className="n">Pkt</span></div>
            {parsed.rows.slice(0, 5).map((r, i) => (
              <div key={i} className="rrow" style={{ gridTemplateColumns: '60px minmax(0,2fr) minmax(0,1fr) 90px' }}><span>{r.pozycja}</span><span>{r.zawodnik}</span><span>{r.kraj || r.kod_kraju || '—'}</span><span className="n">{r.punkty ?? '—'}</span></div>
            ))}
          </div></div>
          <button type="button" className="btn btn-primary" style={{ alignSelf: 'flex-start' }} disabled={state.busy} onClick={save}>{state.busy ? 'Zapisuję…' : `Zapisz ${parsed.rows.length} wierszy`}</button>
        </div>
      )}
      {state.ok && <p className="msg-ok" role="status" style={{ margin: 0 }}>{state.ok}</p>}
      {state.err && <p className="msg-err" role="alert" style={{ margin: 0 }}>{state.err}</p>}
    </div>
  );
}

function SourceCard({ source, last, lastOk, token, onChange, events }) {
  const [open, setOpen] = useState(false);
  const [preview, setPreview] = useState(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState({ ok: '', err: '' });

  async function refresh() {
    setBusy(true); setMsg({ ok: '', err: '' });
    const res = await fetch('/api/odswiez', { method: 'POST', headers: { 'content-type': 'application/json', authorization: 'Bearer ' + token }, body: JSON.stringify({ slug: source.slug }) });
    const json = await res.json().catch(() => ({}));
    setBusy(false);
    const r = json.results?.[0];
    if (!res.ok) return setMsg({ ok: '', err: json.error || 'Nie udało się odświeżyć.' });
    if (r?.status === 'ok') setMsg({ ok: `Pobrano ${r.rows} wierszy.`, err: '' });
    else setMsg({ ok: '', err: r?.message || 'Nie udało się odświeżyć.' });
    onChange();
  }

  async function loadPreview() {
    if (!lastOk) return;
    const [{ data: top }, { data: all }] = await Promise.all([
      supabase.from('wiersze_notowan').select('pozycja, zawodnik, kraj, kod_kraju, punkty').eq('notowanie_id', lastOk.id).order('pozycja').limit(5),
      supabase.from('wiersze_notowan').select('pozycja, zawodnik, kraj, kod_kraju, punkty').eq('notowanie_id', lastOk.id).order('pozycja').limit(5000)
    ]);
    setPreview({ top: top || [], pl: (all || []).filter(isPl) });
  }

  const [rulesText, setRulesText] = useState(progiToText(source.zasady?.progi));
  const [rulesOther, setRulesOther] = useState(source.zasady?.pozostali || '');
  const [rulesClose, setRulesClose] = useState(source.zasady?.zamkniecie || '');
  const [rulesDoc, setRulesDoc] = useState(source.zasady?.regulamin || '');

  async function saveRules(e) {
    e.preventDefault();
    const progi = textToProgi(rulesText);
    if (progi === null) return setMsg({ ok: '', err: 'Progi wpisz w formie: 1-8:2, 9-19:1' });
    const zasady = progi.length || rulesOther.trim() ? { progi, pozostali: rulesOther.trim() || null, zamkniecie: rulesClose || null, regulamin: rulesDoc.trim() || null } : null;
    await updateLink({ zasady });
  }

  async function updateLink(patch) {
    setMsg({ ok: '', err: '' });
    const { error } = await supabase.from('zrodla_rankingow').update(patch).eq('id', source.id);
    if (error) return setMsg({ ok: '', err: 'Nie zapisano: ' + error.message });
    await revalidate(token);
    setMsg({ ok: 'Zapisano. Strona jest już zaktualizowana.', err: '' });
    onChange();
  }

  const failed = last && last.status === 'blad';
  return (
    <article className="panel" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10, flexWrap: 'wrap' }}>
        <div>
          <strong style={{ fontSize: 17 }}>{source.nazwa}</strong>
          <div style={{ fontSize: 13, color: 'var(--muted)' }}>{TYP[source.typ] || source.typ}{source.adres_strony ? <> · <a href={source.adres_strony} target="_blank" rel="noreferrer">strona źródła</a></> : null}</div>
        </div>
        {failed ? <span className="chip chip-warn">Błąd ostatniego pobrania</span> : lastOk ? <span className="chip chip-ok">OK</span> : <span className="chip chip-res">Brak notowań</span>}
      </div>
      <div style={{ fontSize: 14, color: 'var(--body)' }}>
        {lastOk ? <>Ostatnie dane: stan na <strong>{lastOk.stan_na}</strong>, {lastOk.liczba_wierszy} wierszy (pobrano {fmt(lastOk.pobrano)})</> : 'Jeszcze nie pobrano żadnego notowania.'}
        {failed && <div className="msg-err" style={{ marginTop: 4, fontWeight: 500 }}>{fmt(last.pobrano)}: {last.komunikat}</div>}
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'flex-end' }}>
        <label className="field" htmlFor={'ev-' + source.id} style={{ flex: '1 1 280px' }}>Pokazuj na stronie konkurencji
          <select id={'ev-' + source.id} value={source.konkurencja_id ?? ''} onChange={e => updateLink({ konkurencja_id: e.target.value ? Number(e.target.value) : null })}>
            <option value="">— nie pokazuj publicznie —</option>
            {events.map(e => <option key={e.id} value={e.id}>{eventLabel(e)}</option>)}
          </select>
        </label>
        <div className="pills" role="group" aria-label="Rodzaj rankingu">
          <button type="button" className="pill" aria-pressed={source.rodzaj !== 'krajowy'} onClick={() => updateLink({ rodzaj: 'indywidualny' })}>Ranking zawodników</button>
          <button type="button" className="pill" aria-pressed={source.rodzaj === 'krajowy'} onClick={() => updateLink({ rodzaj: 'krajowy' })}>Ranking krajów</button>
        </div>
      </div>
      <details>
        <summary style={{ cursor: 'pointer', minHeight: 40, display: 'flex', alignItems: 'center', fontWeight: 600, fontSize: 14 }}>
          Zasady kwot z rankingu {source.zasady?.progi?.length ? `(${progiToText(source.zasady.progi)})` : '(nie ustawione)'}
        </summary>
        <form onSubmit={saveRules} style={{ display: 'flex', flexDirection: 'column', gap: 10, paddingTop: 8 }}>
          <div className="form-grid">
            <label className="field" htmlFor={'progi-' + source.id}>Progi: miejsca w rankingu → liczba miejsc na IO
              <input id={'progi-' + source.id} type="text" value={rulesText} onChange={e => setRulesText(e.target.value)} placeholder="1-8:2, 9-19:1" />
            </label>
            <label className="field" htmlFor={'close-' + source.id}>Zamknięcie rankingu
              <input id={'close-' + source.id} type="date" value={rulesClose} onChange={e => setRulesClose(e.target.value)} />
            </label>
          </div>
          <label className="field" htmlFor={'other-' + source.id}>Dla krajów / zawodników poza strefą (opcjonalnie)
            <input id={'other-' + source.id} type="text" value={rulesOther} onChange={e => setRulesOther(e.target.value)} placeholder="np. Szansa jeszcze przez MŚ 2027" />
          </label>
          <label className="field" htmlFor={'doc-' + source.id}>Link do regulaminu (opcjonalnie)
            <input id={'doc-' + source.id} type="url" value={rulesDoc} onChange={e => setRulesDoc(e.target.value)} placeholder="https://…" />
          </label>
          <button type="submit" className="btn btn-ghost" style={{ alignSelf: 'flex-start' }}>Zapisz zasady</button>
        </form>
      </details>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
        {source.typ === 'uci' && <button type="button" className="btn btn-primary" disabled={busy} onClick={refresh}>{busy ? 'Pobieram…' : 'Odśwież teraz'}</button>}
        <button type="button" className="btn btn-ghost" onClick={() => setOpen(o => !o)} aria-expanded={open}>{open ? 'Zamknij wklejkę' : 'Wklej ranking'}</button>
        {lastOk && <button type="button" className="btn btn-ghost" onClick={loadPreview}>Podgląd danych</button>}
      </div>
      {msg.ok && <p className="msg-ok" role="status" style={{ margin: 0 }}>{msg.ok}</p>}
      {msg.err && <p className="msg-err" role="alert" style={{ margin: 0 }}>{msg.err}</p>}
      {preview && (
        <div style={{ fontSize: 14, color: 'var(--body)', display: 'flex', flexDirection: 'column', gap: 4 }}>
          <span><strong>Czołówka:</strong> {preview.top.map(r => `${r.pozycja}. ${r.zawodnik}`).join(' · ') || '—'}</span>
          <span><strong>Polacy:</strong> {preview.pl.length ? preview.pl.map(r => `${r.pozycja}. ${r.zawodnik}${r.punkty !== null ? ` (${r.punkty} pkt)` : ''}`).join(' · ') : 'brak w tym notowaniu'}</span>
        </div>
      )}
      {open && <PasteBox source={source} token={token} onSaved={onChange} />}
    </article>
  );
}

function AddSource({ onAdded }) {
  const [mode, setMode] = useState('uci');
  const [name, setName] = useState('');
  const [curl, setCurl] = useState('');
  const [url, setUrl] = useState('');
  const [msg, setMsg] = useState({ ok: '', err: '' });

  let parsed = null, parseErr = '';
  if (mode === 'uci' && curl.trim()) {
    try { parsed = paramsFromCurl(curl); } catch (e) { parseErr = e.message; }
  }

  async function add(e) {
    e.preventDefault();
    setMsg({ ok: '', err: '' });
    if (!name.trim()) return setMsg({ ok: '', err: 'Wpisz nazwę rankingu.' });
    if (mode === 'uci' && !parsed) return setMsg({ ok: '', err: parseErr || 'Wklej cURL zapytania ObjectRankings.' });
    const row = mode === 'uci'
      ? { slug: 'uci-' + slugify(name), nazwa: name.trim(), typ: 'uci', parametry: parsed.params, adres_strony: parsed.referer }
      : { slug: slugify(name), nazwa: name.trim(), typ: 'wklejka', parametry: {}, adres_strony: url.trim() || null };
    const { error } = await supabase.from('zrodla_rankingow').insert(row);
    if (error) return setMsg({ ok: '', err: error.message.includes('duplicate') ? 'Źródło o takiej nazwie już istnieje.' : 'Nie dodano: ' + error.message });
    setName(''); setCurl(''); setUrl('');
    setMsg({ ok: 'Dodano źródło.', err: '' });
    onAdded();
  }

  return (
    <form onSubmit={add} className="panel" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <h2 className="h2" style={{ fontSize: 24 }}>Dodaj źródło rankingu</h2>
      <div className="pills" role="group" aria-label="Rodzaj źródła">
        <button type="button" className="pill" aria-pressed={mode === 'uci'} onClick={() => setMode('uci')}>UCI – z cURL</button>
        <button type="button" className="pill" aria-pressed={mode === 'wklejka'} onClick={() => setMode('wklejka')}>Inna strona – wklejka</button>
      </div>
      <label className="field" htmlFor="src-name">Nazwa rankingu
        <input id="src-name" type="text" value={name} onChange={e => setName(e.target.value)} placeholder="np. MTB XCO – kobiety" />
      </label>
      {mode === 'uci' ? (
        <>
          <label className="field" htmlFor="src-curl">cURL zapytania ObjectRankings (DevTools → Sieć → prawy klik → Kopiuj jako cURL)
            <textarea id="src-curl" value={curl} onChange={e => setCurl(e.target.value)} rows={5}
              style={{ font: 'inherit', fontSize: 13, fontWeight: 400, padding: 10, borderRadius: 8, border: '1px solid var(--line-2)', background: 'var(--bg)', color: 'var(--ink)', resize: 'vertical' }} />
          </label>
          {parseErr && <p className="msg-err" style={{ margin: 0 }}>{parseErr}</p>}
          {parsed && <p style={{ margin: 0, fontSize: 13, color: 'var(--body)' }}>Rozpoznano: ranking {parsed.params.rankingId}, dyscyplina {parsed.params.disciplineId}, filtry: {Object.entries(parsed.params.filters).filter(([, v]) => v !== '' && v !== '0').map(([k, v]) => `${k}=${v}`).join(', ') || 'brak'}. Ciasteczka z cURL nie są zapisywane.</p>}
        </>
      ) : (
        <label className="field" htmlFor="src-url">Adres strony z rankingiem (do podpisu „Źródło”)
          <input id="src-url" type="url" value={url} onChange={e => setUrl(e.target.value)} placeholder="https://…" />
        </label>
      )}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
        <button type="submit" className="btn btn-primary">Dodaj źródło</button>
        {msg.ok && <span className="msg-ok" role="status">{msg.ok}</span>}
        {msg.err && <span className="msg-err" role="alert">{msg.err}</span>}
      </div>
    </form>
  );
}

function AddEvent({ sports, token, onAdded }) {
  const [sport, setSport] = useState('');
  const [plec, setPlec] = useState('M');
  const [name, setName] = useState('');
  const [msg, setMsg] = useState({ ok: '', err: '' });

  async function add(e) {
    e.preventDefault();
    setMsg({ ok: '', err: '' });
    if (!sport) return setMsg({ ok: '', err: 'Wybierz dyscyplinę.' });
    if (!name.trim()) return setMsg({ ok: '', err: 'Wpisz nazwę konkurencji.' });
    const { error } = await supabase.from('konkurencje').insert({ dyscyplina_id: Number(sport), slug: slugify(name), nazwa: name.trim(), plec });
    if (error) return setMsg({ ok: '', err: error.message.includes('duplicate') ? 'Taka konkurencja już istnieje w tej dyscyplinie.' : 'Nie dodano: ' + error.message });
    await revalidate(token);
    setName('');
    setMsg({ ok: 'Dodano konkurencję. Możesz do niej przypiąć ranking.', err: '' });
    onAdded();
  }

  return (
    <form onSubmit={add} className="panel" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <h2 className="h2" style={{ fontSize: 24 }}>Dodaj konkurencję</h2>
      <div className="form-grid">
        <label className="field" htmlFor="ev-sport">Dyscyplina
          <select id="ev-sport" value={sport} onChange={e => setSport(e.target.value)}>
            <option value="">— wybierz —</option>
            {sports.map(s => <option key={s.id} value={s.id}>{s.nazwa}</option>)}
          </select>
        </label>
        <label className="field" htmlFor="ev-name">Nazwa konkurencji
          <input id="ev-name" type="text" value={name} onChange={e => setName(e.target.value)} placeholder="np. Kolarstwo szosowe – wyścig ze startu wspólnego kobiet" />
        </label>
      </div>
      <div className="pills" role="group" aria-label="Płeć">
        {[['K', 'Kobiety'], ['M', 'Mężczyźni'], ['X', 'Mieszana']].map(([v, l]) => (
          <button key={v} type="button" className="pill" aria-pressed={plec === v} onClick={() => setPlec(v)}>{l}</button>
        ))}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
        <button type="submit" className="btn btn-primary">Dodaj konkurencję</button>
        {msg.ok && <span className="msg-ok" role="status">{msg.ok}</span>}
        {msg.err && <span className="msg-err" role="alert">{msg.err}</span>}
      </div>
    </form>
  );
}

export default function Sources({ session }) {
  const [sources, setSources] = useState([]);
  const [snaps, setSnaps] = useState([]);
  const [events, setEvents] = useState([]);
  const [sports, setSports] = useState([]);

  async function load() {
    const [{ data: s0 }, { data: n }, { data: ev }, { data: sp }] = await Promise.all([
      supabase.from('zrodla_rankingow').select('id, slug, nazwa, typ, rodzaj, parametry, adres_strony, aktywne, konkurencja_id, zasady').order('nazwa'),
      supabase.from('notowania').select('id, zrodlo_id, stan_na, pobrano, liczba_wierszy, status, komunikat').order('pobrano', { ascending: false }).limit(200),
      supabase.from('konkurencje').select('id, nazwa, plec, dyscypliny(nazwa)').order('nazwa'),
      supabase.from('dyscypliny').select('id, nazwa').order('nazwa')
    ]);
    setEvents((ev || []).sort((a, b) => eventLabel(a).localeCompare(eventLabel(b), 'pl')));
    setSports(sp || []);
    let s = s0;
    if (!s) ({ data: s } = await supabase.from('zrodla_rankingow').select('id, slug, nazwa, typ, rodzaj, parametry, adres_strony, aktywne, konkurencja_id').order('nazwa'));
    setSources(s || []);
    setSnaps(n || []);
  }
  useEffect(() => { load(); }, []);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <p style={{ margin: 0, color: 'var(--body)', maxWidth: '70ch' }}>
        Rankingi UCI pobierają się same codziennie nad ranem. Pozostałe aktualizujesz, wklejając tabelę ze strony źródła.
      </p>
      {sources.length === 0 && <p className="panel" style={{ color: 'var(--muted)' }}>Brak źródeł. Dodaj pierwsze poniżej.</p>}
      {sources.map(s => {
        const mine = snaps.filter(n => n.zrodlo_id === s.id);
        return <SourceCard key={s.id} source={s} last={mine[0]} lastOk={mine.find(n => n.status === 'ok')} token={session.access_token} onChange={load} events={events} />;
      })}
      <AddSource onAdded={load} />
      <AddEvent sports={sports} token={session.access_token} onAdded={load} />
    </div>
  );
}
