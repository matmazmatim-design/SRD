import Link from 'next/link';
import { notFound } from 'next/navigation';
import { SPORTS } from '../../../lib/sports';
import { getSportHub } from '../../../lib/data';
import { statusKind, formatDatePl, daysBetween, quotaFor } from '../../../lib/compute';

export const revalidate = 300;

export function generateStaticParams() {
  return SPORTS.map(s => ({ slug: s.slug }));
}

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const { sport } = await getSportHub(slug);
  return { title: sport ? `${sport.name} – kwalifikacje LA28` : 'Dyscyplina' };
}

const PLEC = { K: 'Kobiety', M: 'Mężczyźni', X: 'Mieszana' };
const TYP = {
  okno: ['Okno kwalifikacji', '#00A0FE'],
  sztafety: ['Sztafety', '#7C5CFF'],
  kontynentalne: ['Igrzyska kontynentalne', '#D98A1E'],
  formalny: ['Termin formalny', '#8A949F'],
  igrzyska: ['Igrzyska', '#2FD07A']
};
const CHIP = { ok: 'chip chip-ok', warn: 'chip chip-warn', res: 'chip chip-res', out: 'chip chip-out' };

function todayIso() {
  return new Date().toLocaleDateString('sv-SE', { timeZone: 'Europe/Warsaw' });
}

function eventWhen(e) {
  if (!e.data_startu) return null;
  const d = new Date(e.data_startu + 'T12:00:00Z');
  const txt = d.toLocaleDateString('pl-PL', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' });
  return [txt, e.godzina, e.miejsce].filter(Boolean).join(' · ');
}

export default async function SportPage({ params }) {
  const { slug } = await params;
  const { sport, events, terms, children = [], parent } = await getSportHub(slug);
  if (!sport) notFound();

  const today = todayIso();
  const isPast = t => (t.data_do || t.data_od) && (t.data_do || t.data_od) < today;
  const firstUpcoming = terms.findIndex(t => !isPast(t));
  const next = firstUpcoming >= 0 ? terms[firstUpcoming] : null;
  const close = terms.find(t => /zamknięcie rankingów/i.test(t.tytul));

  // Znacznik „Jesteśmy tutaj” stoi przed nagłówkiem roku, jeśli ten rok jeszcze się nie zaczął.
  const marker = <div className="tl-today"><span>{formatDatePl(today)}</span><i aria-hidden="true" /><em>Jesteśmy tutaj</em></div>;
  const todayBeforeYear = (year, prevYear) => Boolean(year && year !== prevYear && today.slice(0, 4) < year);

  const cards = events.length ? events : children.length ? [] : [{ slug: null, plec: 'K' }, { slug: null, plec: 'M' }];

  return (
    <main className="container">
      <div className="crumbs">
        <Link href="/dyscypliny">Dyscypliny</Link> <span aria-hidden="true">›</span>{' '}
        {parent && <><Link href={`/dyscypliny/${parent.slug}`}>{parent.name}</Link> <span aria-hidden="true">›</span>{' '}</>}
        {sport.name}
      </div>
      <section style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <h1 className="display" style={{ fontSize: 'clamp(48px, 8vw, 76px)' }}>{sport.name}</h1>
        <p className="lead">{children.length && !events.length ? 'Wybierz dyscyplinę, a potem konkurencję kobiet lub mężczyzn.' : 'Wybierz konkurencję, żeby zobaczyć listę olimpijską, Polaków i linię kwalifikacji.'}</p>
      </section>

      {children.length > 0 && (
        <section style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <h2 className="eyebrow" style={{ margin: 0 }}>Dyscypliny</h2>
          <div className="tiles">
            {children.map(c => (
              <Link key={c.slug} href={`/dyscypliny/${c.slug}`} className={'tile' + (c.tracked || c.hasRanking ? ' tracked' : '')}>
                <span className="speed" aria-hidden="true"><i /><i /><i /></span>
                <span className="tile-name">{c.name}</span>
                <span className="tile-foot">
                  {c.tracked ? <span className="chip chip-ok">Polak w strefie</span> : c.hasRanking ? <span className="chip chip-path">Ranking dostępny</span> : <span className="chip chip-soon">Symulacja wkrótce</span>}
                </span>
              </Link>
            ))}
          </div>
        </section>
      )}

      {cards.length > 0 && <section style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <h2 className="eyebrow" style={{ margin: 0 }}>Konkurencje w Los Angeles</h2>
        <div className="choice">
          {cards.map((e, i) => {
            const ready = e.slug && (e.hasSimulation || e.rankings?.length > 0);
            const rk = e.rankings?.[0];
            const rkPl = rk?.polish?.[0];
            const when = e.slug ? eventWhen(e) : null;
            const inner = (
              <>
                <span style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10 }}>
                  <span className="display" style={{ fontSize: 'clamp(26px, 2.6vw, 34px)', minWidth: 0 }}>{PLEC[e.plec] || e.nazwa}</span>
                  {ready
                    ? <span className="chip chip-ok" style={{ flexShrink: 0, whiteSpace: 'nowrap' }}>Status dostępny</span>
                    : <span className="chip chip-res" style={{ flexShrink: 0, whiteSpace: 'nowrap' }}>Symulacja w przygotowaniu</span>}
                </span>
                {when && <span style={{ color: 'var(--muted)', fontSize: 14, textTransform: 'capitalize' }}>{when}</span>}
                {e.opis && <span style={{ color: 'var(--body)', fontSize: 15 }}>{e.opis}</span>}
                {e.miejsc ? <span style={{ fontSize: 14, color: 'var(--body)' }}>Miejsc w konkurencji: <strong style={{ color: 'var(--ink)' }}>{e.miejsc}</strong></span> : null}
                {e.poles?.length > 0 && (
                  <span style={{ display: 'flex', flexDirection: 'column', borderTop: '1px solid var(--line)' }}>
                    {e.poles.slice(0, 3).map(p => (
                      <span key={p.zawodnik} style={{ display: 'flex', justifyContent: 'space-between', gap: 10, padding: '10px 0', borderBottom: '1px solid var(--line)', fontSize: 15 }}>
                        <strong>{p.zawodnik}</strong>
                        <span className={CHIP[statusKind(p.sciezka)]}>{p.sciezka.split(' – ')[0]}</span>
                      </span>
                    ))}
                  </span>
                )}
                {!e.poles?.length && rk && (
                  <span style={{ display: 'flex', justifyContent: 'space-between', gap: 10, padding: '10px 0', borderTop: '1px solid var(--line)', fontSize: 15 }}>
                    <strong>{rk.rodzaj === 'krajowy' ? 'Polska w rankingu krajów' : (rkPl?.zawodnik || 'Polacy w rankingu')}</strong>
                    <span className={rkPl && rk.zasady?.progi && quotaFor(rkPl.pozycja, rk.zasady) ? 'chip chip-ok' : rkPl ? 'chip chip-res' : 'chip chip-out'}>
                      {rkPl ? `${rkPl.pozycja}. miejsce${rk.zasady?.progi ? (quotaFor(rkPl.pozycja, rk.zasady) ? ' · w strefie' : ' · poza strefą') : ''}` : 'poza rankingiem'}
                    </span>
                  </span>
                )}
                {ready && <span className="btn btn-primary" style={{ alignSelf: 'flex-start', marginTop: 'auto' }}>Zobacz status kwalifikacji ›</span>}
              </>
            );
            return ready ? (
              <Link key={e.slug} href={`/dyscypliny/${sport.slug}/${e.slug}`} className="choice-card" style={{ border: '1.5px solid var(--blue)', background: 'linear-gradient(135deg, var(--blue-soft), transparent 55%), var(--surface)' }}>{inner}</Link>
            ) : (
              <div key={e.slug || i} className="choice-card">{inner}</div>
            );
          })}
        </div>
      </section>}

      {terms.length > 0 && (
        <section className="row-wrap" style={{ alignItems: 'flex-start' }}>
          <div className="grow panel" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <h2 className="h2" style={{ fontSize: 30 }}>Kalendarz kwalifikacji</h2>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px 14px', fontSize: 12, color: 'var(--body)' }}>
              {Object.values(TYP).map(([label, color]) => (
                <span key={label} style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}><span style={{ width: 10, height: 10, borderRadius: '50%', background: color }} aria-hidden="true" />{label}</span>
              ))}
            </div>
            <ol className="timeline">
              {terms.map((t, i) => {
                const year = (t.data_od || '').slice(0, 4) || (t.etykieta_daty.match(/20\d\d/) || [''])[0];
                const prevYear = i > 0 ? ((terms[i - 1].data_od || '').slice(0, 4) || (terms[i - 1].etykieta_daty.match(/20\d\d/) || [''])[0]) : null;
                const past = isPast(t);
                const [label, color] = TYP[t.typ] || ['', '#8A949F'];
                return (
                  <li key={t.kolejnosc}>
                    {i === firstUpcoming && todayBeforeYear(year, prevYear) && marker}
                    {year && year !== prevYear && <div className="tl-year">{year}</div>}
                    {i === firstUpcoming && !todayBeforeYear(year, prevYear) && marker}
                    <div className={'tl-item' + (past ? ' past' : '')}>
                      <span className="tl-date">{t.etykieta_daty}</span>
                      <span className="tl-axis" aria-hidden="true"><span className="tl-dot" style={past ? { background: 'var(--surface)', border: `2px solid ${color}` } : { background: color }} /></span>
                      <div className="tl-body">
                        <strong>{t.tytul}</strong>
                        {t.opis && <span>{t.opis}</span>}
                        <span className="tl-tag" style={{ border: `1px solid ${color}` }}>{label}{past ? ' · zakończone' : ''}</span>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ol>
          </div>
          <aside className="side" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {next && (
              <div className="feature" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <span className="eyebrow muted-on-dark" style={{ color: '#A9B8C6' }}>Następny termin</span>
                <span style={{ fontSize: 20, fontWeight: 600 }}>{next.tytul}</span>
                {next.data_od && <span className="num" style={{ fontSize: 40 }}>za {daysBetween(today, next.data_od)} dni</span>}
                <span className="muted-on-dark" style={{ fontSize: 14 }}>{next.etykieta_daty}</span>
              </div>
            )}
            {close?.data_od && close.data_od >= today && (
              <div className="panel" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <span className="eyebrow">Zamknięcie rankingów</span>
                <span className="num" style={{ fontSize: 40 }}>za {daysBetween(today, close.data_od)} dni</span>
                <span style={{ fontSize: 14, color: 'var(--body)' }}>{close.etykieta_daty}. Liczy się wszystko, co Polacy zdobędą do tego dnia.</span>
              </div>
            )}
          </aside>
        </section>
      )}
    </main>
  );
}
