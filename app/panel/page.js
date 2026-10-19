'use client';

import { useEffect, useMemo, useState } from 'react';
import { supabase } from '../../lib/supabase';
import Sources from './Sources';

const PATHS = {
  triathlon: ['Gospodarz', 'MŚ sztafet 2026', 'MŚ sztafet 2027', 'Ranking sztafet (MROQR)', 'Ranking IOQR', 'Nowa flaga – igrzyska kontynentalne', 'Nowa flaga – World Triathlon Ranking', 'Zaproszenie (uniwersalność)', 'Realokacja'],
  golf: ['Ranking olimpijski (OGR)', 'Miejsce kontynentalne', 'Gospodarz', 'Realokacja']
};
const GENERIC = ['Ranking olimpijski', 'Mistrzostwa świata', 'Turniej kwalifikacyjny', 'Igrzyska kontynentalne', 'Zaproszenie', 'Realokacja'];
const CUSTOM = 'Inna ścieżka…';
const PLEC = { K: 'Kobiety', M: 'Mężczyźni', X: 'Mieszana' };

function Login() {
  const [email, setEmail] = useState('');
  const [state, setState] = useState({ sending: false, sent: false, error: '' });

  async function send(e) {
    e.preventDefault();
    setState({ sending: true, sent: false, error: '' });
    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: { emailRedirectTo: window.location.origin + '/panel' }
    });
    setState({ sending: false, sent: !error, error: error ? 'Nie udało się wysłać linku: ' + error.message : '' });
  }

  return (
    <form onSubmit={send} className="panel" style={{ maxWidth: 480, display: 'flex', flexDirection: 'column', gap: 14 }}>
      <h2 className="h2">Zaloguj się</h2>
      <p style={{ margin: 0, color: 'var(--body)' }}>Wyślemy Ci link do logowania na e-mail. Bez hasła.</p>
      <label className="field" htmlFor="email">E-mail
        <input id="email" type="email" required value={email} onChange={e => setEmail(e.target.value)} autoComplete="email" />
      </label>
      <button type="submit" className="btn btn-primary" disabled={state.sending}>{state.sending ? 'Wysyłam…' : 'Wyślij link do logowania'}</button>
      {state.sent && <p className="msg-ok" role="status" style={{ margin: 0 }}>Link wysłany. Otwórz go na tym urządzeniu.</p>}
      {state.error && <p className="msg-err" role="alert" style={{ margin: 0 }}>{state.error}</p>}
    </form>
  );
}

function Editor({ session }) {
  const [sports, setSports] = useState([]);
  const [sel, setSel] = useState('triathlon');
  const [events, setEvents] = useState([]);
  const [entries, setEntries] = useState([]);
  const [form, setForm] = useState({ name: '', eventId: null, path: null, custom: '', status: 'symulacja', date: '' });
  const [msg, setMsg] = useState({ ok: '', err: '' });
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    supabase.from('dyscypliny').select('id, slug, nazwa').order('nazwa').then(({ data }) => setSports(data || []));
  }, []);

  async function loadSport(slug) {
    const { data: ev } = await supabase.from('konkurencje').select('id, slug, nazwa, plec, dyscypliny!inner(slug)').eq('dyscypliny.slug', slug).order('plec');
    const list = ev || [];
    setEvents(list);
    const ids = list.map(e => e.id);
    const { data: kw } = ids.length
      ? await supabase.from('kwalifikacje').select('id, konkurencja_id, zawodnik, kraj, sciezka, status, data_przyznania').in('konkurencja_id', ids).order('utworzono')
      : { data: [] };
    setEntries(kw || []);
    setForm(f => ({ ...f, eventId: list.find(e => e.plec === 'M')?.id ?? list[0]?.id ?? null, path: null, custom: '' }));
  }

  useEffect(() => { loadSport(sel); }, [sel]);

  const paths = useMemo(() => [...(PATHS[sel] || GENERIC), CUSTOM], [sel]);
  const path = form.path && paths.includes(form.path) ? form.path : paths[0];
  const finalPath = path === CUSTOM ? form.custom.trim() : path;

  async function add(e) {
    e.preventDefault();
    setMsg({ ok: '', err: '' });
    if (!form.eventId) return setMsg({ ok: '', err: 'Ta dyscyplina nie ma jeszcze konkurencji w bazie.' });
    if (!form.name.trim()) return setMsg({ ok: '', err: 'Wpisz zawodnika lub drużynę.' });
    if (!finalPath) return setMsg({ ok: '', err: 'Wpisz własną ścieżkę.' });
    setBusy(true);
    const { error } = await supabase.from('kwalifikacje').insert({
      konkurencja_id: form.eventId,
      zawodnik: form.name.trim(),
      sciezka: finalPath,
      status: form.status,
      data_przyznania: form.date || null
    });
    setBusy(false);
    if (error) return setMsg({ ok: '', err: 'Nie zapisano: ' + error.message });
    setForm(f => ({ ...f, name: '', custom: '' }));
    setMsg({ ok: 'Dodano. Strona pokaże zmianę w ciągu kilku minut.', err: '' });
    loadSport(sel);
  }

  async function remove(id) {
    const { error } = await supabase.from('kwalifikacje').delete().eq('id', id);
    if (error) return setMsg({ ok: '', err: 'Nie usunięto: ' + error.message });
    setEntries(list => list.filter(x => x.id !== id));
  }

  const sportName = sports.find(s => s.slug === sel)?.nazwa || sel;

  return (
    <div className="row-wrap" style={{ alignItems: 'flex-start' }}>
      <aside className="side" style={{ display: 'flex', flexDirection: 'column', gap: 10, flexBasis: 280 }}>
        <span className="eyebrow">Dyscypliny</span>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 8 }}>
          {sports.map(s => (
            <button key={s.slug} type="button" className="pill" aria-pressed={s.slug === sel} onClick={() => setSel(s.slug)} style={{ borderRadius: 10, minHeight: 48, textAlign: 'left', padding: '6px 10px', fontSize: 13 }}>
              {s.nazwa}
            </button>
          ))}
        </div>
      </aside>

      <section className="grow" style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: 12, flexWrap: 'wrap' }}>
          <h1 className="display" style={{ fontSize: 52 }}>{sportName}</h1>
          <span style={{ color: 'var(--muted)', fontSize: 14 }}>Zalogowano: {session.user.email}</span>
        </div>

        <div className="panel" style={{ padding: 0, overflow: 'hidden' }}>
          {entries.length === 0 && <p style={{ margin: 0, padding: 20, color: 'var(--muted)' }}>Brak wpisów. Dodaj pierwszą kwalifikację poniżej.</p>}
          {entries.map(k => (
            <div key={k.id} style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 10, padding: '12px 18px', borderBottom: '1px solid var(--rowline)' }}>
              <strong style={{ minWidth: 160 }}>{k.zawodnik}</strong>
              <span style={{ color: 'var(--body)' }}>{PLEC[events.find(e => e.id === k.konkurencja_id)?.plec] || ''}</span>
              <span className="chip chip-path">{k.sciezka}</span>
              <span className={k.status === 'potwierdzona' ? 'chip chip-ok' : 'chip chip-warn'}>{k.status === 'potwierdzona' ? 'Potwierdzona' : 'Symulacja'}</span>
              <span style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ color: 'var(--muted)', fontSize: 13 }}>{k.data_przyznania || ''}</span>
                <button type="button" className="btn btn-ghost" onClick={() => remove(k.id)} aria-label={'Usuń wpis: ' + k.zawodnik} style={{ minHeight: 36, padding: '0 12px', fontWeight: 500 }}>Usuń</button>
              </span>
            </div>
          ))}
        </div>

        <form onSubmit={add} className="panel" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <h2 className="h2" style={{ fontSize: 24 }}>Dodaj kwalifikację</h2>
          <div className="form-grid">
            <label className="field" htmlFor="kw-name">Zawodnik lub drużyna
              <input id="kw-name" type="text" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="np. Kuba Gajda" />
            </label>
            <label className="field" htmlFor="kw-date">Data przyznania
              <input id="kw-date" type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} />
            </label>
          </div>
          <fieldset style={{ margin: 0, padding: 0, border: 0, display: 'flex', flexDirection: 'column', gap: 8 }}>
            <legend className="field" style={{ marginBottom: 8 }}>Konkurencja</legend>
            <div className="pills">
              {events.length === 0 && <span style={{ color: 'var(--muted)', fontSize: 14 }}>Brak konkurencji tej dyscypliny w bazie.</span>}
              {events.map(e => (
                <button key={e.id} type="button" className="pill" aria-pressed={form.eventId === e.id} onClick={() => setForm({ ...form, eventId: e.id })}>{PLEC[e.plec] || e.nazwa}</button>
              ))}
            </div>
          </fieldset>
          <fieldset style={{ margin: 0, padding: 0, border: 0, display: 'flex', flexDirection: 'column', gap: 8 }}>
            <legend className="field" style={{ marginBottom: 8 }}>Ścieżka kwalifikacji</legend>
            <div className="pills">
              {paths.map(p => (
                <button key={p} type="button" className="pill" aria-pressed={p === path} onClick={() => setForm({ ...form, path: p })}>{p}</button>
              ))}
            </div>
            {path === CUSTOM && (
              <label className="field" htmlFor="kw-custom" style={{ marginTop: 6 }}>Wpisz własną ścieżkę
                <input id="kw-custom" type="text" value={form.custom} onChange={e => setForm({ ...form, custom: e.target.value })} placeholder="np. Turniej kwalifikacyjny w Paryżu" />
              </label>
            )}
          </fieldset>
          <fieldset style={{ margin: 0, padding: 0, border: 0, display: 'flex', flexDirection: 'column', gap: 8 }}>
            <legend className="field" style={{ marginBottom: 8 }}>Status</legend>
            <div className="pills">
              {[['potwierdzona', 'Potwierdzona'], ['symulacja', 'Symulacja']].map(([v, l]) => (
                <button key={v} type="button" className="pill" aria-pressed={form.status === v} onClick={() => setForm({ ...form, status: v })}>{l}</button>
              ))}
            </div>
          </fieldset>
          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 12, paddingTop: 14, borderTop: '1px solid var(--line)' }}>
            <span style={{ fontSize: 13, color: 'var(--muted)' }}>
              Na stronie: <strong style={{ color: 'var(--ink)' }}>{form.name.trim() || 'Zawodnik'}</strong> <span className="chip chip-path">{finalPath || 'własna ścieżka'}</span>
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              {msg.err && <span className="msg-err" role="alert">{msg.err}</span>}
              {msg.ok && <span className="msg-ok" role="status">{msg.ok}</span>}
              <button type="submit" className="btn btn-primary" disabled={busy}>{busy ? 'Zapisuję…' : 'Dodaj do kafla'}</button>
            </span>
          </div>
        </form>
      </section>
    </div>
  );
}

export default function PanelPage() {
  const [session, setSession] = useState(undefined);
  const [isAdmin, setIsAdmin] = useState(null);
  const [tab, setTab] = useState('kwalifikacje');

  useEffect(() => {
    if (!supabase) return;
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    return () => sub.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!session) { setIsAdmin(null); return; }
    supabase.from('admini').select('user_id').eq('user_id', session.user.id).maybeSingle()
      .then(({ data }) => setIsAdmin(!!data));
  }, [session]);

  return (
    <main className="container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
        <span className="eyebrow">Panel redakcji</span>
        {session && <button type="button" className="btn btn-ghost" onClick={() => supabase.auth.signOut()}>Wyloguj</button>}
      </div>
      {!supabase && <p className="panel msg-err">Brak połączenia z bazą: ustaw zmienne Supabase w Vercelu.</p>}
      {supabase && session === undefined && <p style={{ color: 'var(--muted)' }}>Sprawdzam logowanie…</p>}
      {supabase && session === null && <Login />}
      {session && isAdmin === false && (
        <div className="panel" style={{ maxWidth: 640, display: 'flex', flexDirection: 'column', gap: 10 }}>
          <h2 className="h2">Konto bez uprawnień redakcji</h2>
          <p style={{ margin: 0, color: 'var(--body)' }}>Jesteś zalogowany jako <strong>{session.user.email}</strong>, ale to konto nie jest jeszcze na liście administratorów.</p>
          <p style={{ margin: 0, color: 'var(--body)' }}>Identyfikator konta: <code style={{ userSelect: 'all' }}>{session.user.id}</code></p>
        </div>
      )}
      {session && isAdmin && (
        <>
          <div className="seg" role="tablist" aria-label="Sekcje panelu">
            {[['kwalifikacje', 'Kwalifikacje'], ['zrodla', 'Źródła danych']].map(([id, label]) => (
              <button key={id} type="button" role="tab" aria-selected={tab === id} onClick={() => setTab(id)}
                style={{ font: 'inherit', minHeight: 40, padding: '0 18px', borderRadius: 999, border: 0, cursor: 'pointer', fontWeight: tab === id ? 600 : 500, background: tab === id ? 'var(--blue)' : 'transparent', color: tab === id ? '#000000' : 'var(--body)' }}>
                {label}
              </button>
            ))}
          </div>
          {tab === 'kwalifikacje' ? <Editor session={session} /> : <Sources session={session} />}
        </>
      )}
    </main>
  );
}
