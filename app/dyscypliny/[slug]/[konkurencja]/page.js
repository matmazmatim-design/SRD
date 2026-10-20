import Link from 'next/link';
import { notFound } from 'next/navigation';
import RankingTable from '../../../../components/RankingTable';
import SourceRanking from '../../../../components/SourceRanking';
import { getEventPage } from '../../../../lib/data';
import { summarize, isPolish, formatNumber, formatDatePl, QUAL, qualKind, quotaKind, quotaFor, gapToLine, lastQuotaPosition } from '../../../../lib/compute';

export const revalidate = 300;

const RANKING_LABEL = { golf: 'OWGR', triathlon: 'IOQR' };
const PLEC = { K: 'Kobiety', M: 'Mężczyźni', X: 'Mieszana' };

export async function generateMetadata({ params }) {
  const { slug, konkurencja } = await params;
  const data = await getEventPage(slug, konkurencja);
  return { title: data ? `${data.event.nazwa} – kwalifikacje LA28` : 'Konkurencja' };
}

function qualLabel(n) {
  if (n === 1) return 'kwalifikacja';
  const d = n % 10, t = n % 100;
  return d >= 2 && d <= 4 && (t < 12 || t > 14) ? 'kwalifikacje' : 'kwalifikacji';
}

export default async function EventPage({ params }) {
  const { slug, konkurencja } = await params;
  const data = await getEventPage(slug, konkurencja);
  if (!data) notFound();
  const { sport, parent, event, siblings, simulation, rows, rankings = [] } = data;
  const mainRanking = rankings[0] || null;
  const bestPl = mainRanking?.polish?.[0] || null;
  const rankingLabel = RANKING_LABEL[slug] || 'Ranking';
  const s = summarize(rows);
  const poles = s.lists.polacy.length ? s.lists.polacy : rows.filter(r => isPolish(r.kraj));
  const manual = event.manual || [];

  return (
    <main className="container">
      <div className="crumbs">
        <Link href="/dyscypliny">Dyscypliny</Link> <span aria-hidden="true">›</span>{' '}
        {parent && <><Link href={`/dyscypliny/${parent.slug}`}>{parent.name}</Link> <span aria-hidden="true">›</span>{' '}</>}
        <Link href={`/dyscypliny/${sport.slug}`}>{sport.name}</Link> <span aria-hidden="true">›</span> {PLEC[event.plec] || event.nazwa}
      </div>

      <nav className="seg" aria-label="Konkurencja">
        {siblings.map(e => (
          <Link key={e.slug} href={`/dyscypliny/${sport.slug}/${e.slug}`} aria-current={e.slug === event.slug ? 'page' : undefined}>
            {PLEC[e.plec] || e.nazwa}
          </Link>
        ))}
      </nav>

      <section className="row-wrap">
        <div className="grow" style={{ display: 'flex', flexDirection: 'column', gap: 12, justifyContent: 'center' }}>
          <h1 className="display">{sport.name} <span className="accent">— {(PLEC[event.plec] || event.nazwa).toLowerCase()}</span></h1>
          {event.opis && <p className="lead">{event.opis}</p>}
          {simulation && <p style={{ margin: 0, fontSize: 14, color: 'var(--muted)' }}>Stan na {formatDatePl(simulation.stan_na)} · {simulation.opis}</p>}
        </div>
        <div className="side panel" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <span className="eyebrow">Polska dziś</span>
          {simulation ? (
            <>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
                <span className="num" style={{ fontSize: 68 }}>{s.polesIn.length}</span>
                <span style={{ fontSize: 17, color: 'var(--muted)' }}>{qualLabel(s.polesIn.length)} w symulacji</span>
              </div>
              <span className={QUAL[s.state].chip} style={{ alignSelf: 'flex-start', fontSize: 14 }}>{QUAL[s.state].label}</span>
            </>
          ) : mainRanking ? (
            bestPl ? (
              <>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
                  <span className="num" style={{ fontSize: 68 }}>{bestPl.pozycja}.</span>
                  <span style={{ fontSize: 17, color: 'var(--muted)' }}>{mainRanking.rodzaj === 'krajowy' ? 'miejsce w rankingu krajów' : `miejsce – ${bestPl.zawodnik}`}</span>
                </div>
                <span style={{ fontSize: 14, color: 'var(--body)' }}>{formatNumber(bestPl.punkty, 0)} pkt · stan na {formatDatePl(mainRanking.stanNa)}</span>
                {mainRanking.zasady?.progi?.length > 0 && (() => {
                  const q = quotaFor(bestPl.pozycja, mainRanking.zasady);
                  const kind = quotaKind(bestPl.pozycja, mainRanking.zasady);
                  const gap = gapToLine(mainRanking.rows, bestPl, mainRanking.zasady);
                  return (
                    <>
                      <span className={QUAL[kind].chip} style={{ alignSelf: 'flex-start', fontSize: 14 }}>{QUAL[kind].label}{q ? ` · ${q === 1 ? '1 miejsce' : `${q} miejsca`} na IO` : ''}</span>
                      {!q && gap !== null && <span style={{ fontSize: 14, color: 'var(--body)' }}>Do {lastQuotaPosition(mainRanking.zasady)}. miejsca brakuje {formatNumber(gap, 0)} pkt</span>}
                    </>
                  );
                })()}
              </>
            ) : (
              <span className="chip chip-out" style={{ alignSelf: 'flex-start' }}>Polski nie ma w rankingu</span>
            )
          ) : (
            <span className="chip chip-res" style={{ alignSelf: 'flex-start' }}>Symulacja w przygotowaniu</span>
          )}
        </div>
      </section>

      {(poles.length > 0 || manual.length > 0) && (
        <section style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <h2 className="h2" style={{ fontSize: 32 }}>Polacy</h2>
          <div className="people">
            {poles.slice(0, 4).map(p => {
              const kind = qualKind(p.sciezka);
              const onList = s.lists.zakwalifikowani.find(r => r.zawodnik === p.zawodnik);
              const onReserve = s.lists.rezerwa.find(r => r.zawodnik === p.zawodnik);
              const margin = onList ? s.qualifiedCount - onList.lp : 0;
              const foot = onList
                ? `${onList.lp}. miejsce na liście olimpijskiej · zapas: ${margin} ${margin === 1 ? 'miejsce' : 'miejsc'} nad linią`
                : onReserve
                  ? `${onReserve.lp}. miejsce na liście rezerwowej`
                  : 'Poza listą olimpijską';
              return (
                <article key={p.zawodnik} className="person">
                  <div className="person-head">
                    <div className="person-name">{p.zawodnik}</div>
                    <span className={QUAL[kind].chip}>{QUAL[kind].label}</span>
                  </div>
                  <div className="person-sub">{p.sciezka}</div>
                  <div className="kv">
                    <div><div className="k">{rankingLabel}</div><div className="v">{p.pozycja_rankingu ?? '—'}</div></div>
                    <div><div className="k">Punkty</div><div className="v">{formatNumber(p.punkty, 2)}</div></div>
                  </div>
                  <div className="person-foot">{foot}</div>
                </article>
              );
            })}
          </div>
          {poles.length > 4 && (
            <details className="more">
              <summary>Pozostali Polacy w rankingu ({poles.length - 4})</summary>
              <ul style={{ margin: 0, paddingLeft: 20, color: 'var(--body)', lineHeight: 1.8 }}>
                {poles.slice(4).map(p => <li key={p.zawodnik}>{p.zawodnik} – {rankingLabel} {p.pozycja_rankingu}, {p.sciezka}</li>)}
              </ul>
            </details>
          )}
          {manual.length > 0 && (
            <div className="panel" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <span className="eyebrow">Ścieżki kwalifikacji (z panelu redakcji)</span>
              {manual.map(m => (
                <div key={m.zawodnik + m.sciezka} style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 10 }}>
                  <strong>{m.zawodnik}</strong>
                  <span className="chip chip-path">{m.sciezka}</span>
                  <span className={QUAL[m.status === 'potwierdzona' ? 'ok' : 'virt'].chip}>{QUAL[m.status === 'potwierdzona' ? 'ok' : 'virt'].label}</span>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {simulation ? (
        <section className="panel" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <h2 className="h2">Lista olimpijska</h2>
          <p style={{ margin: 0, fontSize: 14, color: 'var(--muted)' }}>Kolejność z symulacji przepisów kwalifikacji na aktualnym rankingu. Wiersze Polaków są podświetlone.</p>
          <RankingTable qualified={s.lists.zakwalifikowani} reserve={s.lists.rezerwa} rankingLabel={rankingLabel} />
          {s.lists.limit_kraju.length > 0 && (
            <details className="more">
              <summary>Wyżej w rankingu, ale bez miejsca przez limit kraju ({s.lists.limit_kraju.length})</summary>
              <div className="table-box">
                <div className="rtable">
                  {s.lists.limit_kraju.map(r => (
                    <div key={r.lp} className="rrow">
                      <span>{r.lp}</span><span className="rank">{r.pozycja_rankingu}</span><span>{r.zawodnik}</span><span>{r.kraj}</span><span className="n">{formatNumber(r.punkty)}</span><span className="chip chip-out" style={{ justifySelf: 'start' }}>Limit kraju</span>
                    </div>
                  ))}
                </div>
              </div>
            </details>
          )}
        </section>
      ) : rankings.length === 0 ? (
        <section className="panel" style={{ textAlign: 'center', color: 'var(--muted)' }}>
          Symulację tej konkurencji dodamy wkrótce. Do tego czasu sprawdź stronę dyscypliny z terminami kwalifikacji.
        </section>
      ) : null}

      {rankings.map(r => <SourceRanking key={r.id} ranking={r} />)}
    </main>
  );
}
