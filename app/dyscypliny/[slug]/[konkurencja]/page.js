import Link from 'next/link';
import { notFound } from 'next/navigation';
import RankingTable from '../../../../components/RankingTable';
import SourceRanking from '../../../../components/SourceRanking';
import MixedTeams from '../../../../components/MixedTeams';
import QuotaBoard from '../../../../components/QuotaBoard';
import { getEventPage } from '../../../../lib/data';
import { countryPl } from '../../../../lib/countries';
import { summarize, isPolish, formatNumber, formatDatePl, QUAL, rowKind, quotaKind, quotaFor, gapToLine, lastQuotaPosition } from '../../../../lib/compute';

export const revalidate = 300;

const RANKING_LABEL = { golf: 'OGR', triathlon: 'IOQR' };
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
  const { sport, parent, event, siblings, simulation, rows, rankings = [], omtr = null, kwoty = null } = data;
  const label = e => e.algorytm?.etykieta || (siblings.filter(x => x.plec === e.plec).length > 1 ? e.nazwa : PLEC[e.plec] || e.nazwa);
  const today = new Date().toLocaleDateString('sv-SE', { timeZone: 'Europe/Warsaw' });
  const plKwoty = (kwoty || []).filter(k => k.kraj === 'POL');
  const OTHER_CONT = /azjat|azji|azja|panamery|ameryk|pacyfik|oceani|afryk|concacaf|conmebol|norceca|\b(afc|caf|ofc)\b/i;
  // Najbliższe w czasie zawody, na których Polska może jeszcze zdobyć miejsce (bez zawód innych kontynentów)
  // Grupy FEI: Polska jest w grupie C – pomijamy zawody i rankingi innych grup
  const otherGroup = z => /grup[ay] /i.test(z) && !/grup[ay] C\b/i.test(z);
  const open = (kwoty || []).filter(k => !k.kraj && !otherGroup(k.zawody) && (!OTHER_CONT.test(k.zawody) || /europ/i.test(k.zawody)));
  // Judo: miejsca tylko z rankingu IJF – bez „najbliższej szansy”
  const nextChance = sport.slug === 'judo' || parent?.slug === 'judo' ? null : open.filter(k => k.data_zawodow && k.data_zawodow >= today).sort((a, b) => a.data_zawodow.localeCompare(b.data_zawodow))[0]
    || open.find(k => !k.data_zawodow);
  const plTeam = omtr?.find(r => r.noc === 'POL') || null;
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
        <Link href={`/dyscypliny/${sport.slug}`}>{sport.name}</Link> <span aria-hidden="true">›</span> {label(event)}
      </div>

      <nav className="seg" aria-label="Konkurencja">
        {siblings.map(e => (
          <Link key={e.slug} href={`/dyscypliny/${sport.slug}/${e.slug}`} aria-current={e.slug === event.slug ? 'page' : undefined}>
            {label(e)}
          </Link>
        ))}
      </nav>

      <section className="row-wrap">
        <div className="grow" style={{ display: 'flex', flexDirection: 'column', gap: 12, justifyContent: 'center' }}>
          <h1 className="display">{sport.name} <span className="accent">— {label(event).toLowerCase()}</span></h1>
          {event.opis && <p className="lead">{event.opis}</p>}
          {simulation && <p style={{ margin: 0, fontSize: 14, color: 'var(--muted)' }}>{simulation.stan_na ? `Stan na ${formatDatePl(simulation.stan_na)} · ` : ''}{simulation.opis}</p>}
          {simulation?.notes?.map(n => <p key={n} style={{ margin: 0, fontSize: 13, color: 'var(--muted)' }}>⚠ {n}</p>)}
        </div>
        <div className="side panel" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <span className="eyebrow">Polska dziś</span>
          {simulation?.kwoty ? (
            <>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
                <span className="num" style={{ fontSize: 68 }}>{plKwoty.reduce((s, k) => s + k.liczba, 0)}</span>
                <span style={{ fontSize: 17, color: 'var(--muted)' }}>{plKwoty.reduce((s, k) => s + k.liczba, 0) === 1 ? 'miejsce' : 'miejsc'} dla Polski</span>
              </div>
              {plKwoty.length
                ? plKwoty.map(k => <span key={k.id} className={QUAL[k.status].chip} style={{ alignSelf: 'flex-start', fontSize: 14 }}>{k.zawodnik ? `${k.zawodnik} · ${k.sciezka === 'Kwoty kontynentalne' ? 'kwota kontynentalna' : k.sciezka}` : `${k.sciezka}: ${k.zawody}`}</span>)
                : <span className="chip chip-res" style={{ alignSelf: 'flex-start', fontSize: 14 }}>Rezerwa – bez miejsca</span>}
              {nextChance && <span style={{ fontSize: 14, color: 'var(--body)' }}>Najbliższa szansa: <strong>{nextChance.zawody}</strong>{nextChance.data_zawodow ? ` (${formatDatePl(nextChance.data_zawodow)})` : ''}.</span>}
            </>
          ) : simulation?.mixed ? (
            plTeam ? (
              <>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
                  <span className="num" style={{ fontSize: 68 }}>{plTeam.omtr}.</span>
                  <span style={{ fontSize: 17, color: 'var(--muted)' }}>miejsce w rankingu krajów (OMTR)</span>
                </div>
                <span className={QUAL[plTeam.status].chip} style={{ alignSelf: 'flex-start', fontSize: 14 }}>{plTeam.status === 'res' ? (plTeam.eligible ? 'Rezerwa' : 'Bez drużyny') : QUAL[plTeam.status].label}</span>
                <span style={{ fontSize: 14, color: 'var(--body)' }}>{plTeam.sciezka}. Mężczyzna: {plTeam.mezczyzna?.zawodnik || 'brak na liście'} · kobieta: {plTeam.kobieta?.zawodnik || 'brak na liście'}.</span>
              </>
            ) : <span className="chip chip-res" style={{ alignSelf: 'flex-start' }}>Polski nie ma w rankingu</span>
          ) : simulation ? (
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
                {mainRanking.allocation && (
                  <>
                    <span className={QUAL[bestPl.status || 'res'].chip} style={{ alignSelf: 'flex-start', fontSize: 14 }}>{QUAL[bestPl.status || 'res'].label}</span>
                    {bestPl.sciezka && <span style={{ fontSize: 14, color: 'var(--body)' }}>{bestPl.sciezka}</span>}
                    {!bestPl.sciezka && mainRanking.linePos && <span style={{ fontSize: 14, color: 'var(--body)' }}>Ostatni kraj z miejscem z rankingu sztafet jest dziś na {mainRanking.linePos}. pozycji.</span>}
                  </>
                )}
                {!mainRanking.allocation && mainRanking.zasady?.progi?.length > 0 && (() => {
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
              const kind = rowKind(p);
              const onList = s.lists.zakwalifikowani.find(r => r.zawodnik === p.zawodnik);
              const onReserve = s.lists.rezerwa.find(r => r.zawodnik === p.zawodnik);
              const margin = onList ? s.qualifiedCount - onList.lp : 0;
              const foot = onList
                ? <>{onList.lp}. miejsce na liście olimpijskiej<br />Zapas: {margin} {margin === 1 ? 'miejsce' : margin % 10 >= 2 && margin % 10 <= 4 && (margin % 100 < 12 || margin % 100 > 14) ? 'miejsca' : 'miejsc'} nad linią</>
                : onReserve
                  ? `${onReserve.lp}. miejsce na liście rezerwowej`
                  : 'Poza listą olimpijską';
              return (
                <article key={p.zawodnik} className="person">
                  <div className="person-head">
                    <div className="person-name">{p.zawodnik}</div>
                    <span className={QUAL[kind].chip}>{QUAL[kind].label}</span>
                  </div>
                  <div className="person-sub">{p.sciezka}{p.gwiazdka && <button type="button" className="star" popoverTarget={'zasady-' + p.gwiazdka} aria-label="Jak to miejsce może się zmienić">*</button>}</div>
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

      {simulation?.kwoty ? (
        <section className="panel" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <h2 className="h2">Miejsca olimpijskie</h2>
          <p style={{ margin: 0, fontSize: 14, color: 'var(--muted)', maxWidth: '72ch' }}>Każde miejsce i zawody, na których się je zdobywa. Miejsca należą do krajów – o tym, kto pojedzie, decyduje później federacja.</p>
          <QuotaBoard kwoty={kwoty || []} />
        </section>
      ) : simulation?.mixed ? (
        <section className="panel" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <h2 className="h2">Ranking krajów (OMTR)</h2>
          <p style={{ margin: 0, fontSize: 14, color: 'var(--muted)', maxWidth: '72ch' }}>Miejsca dostaje {simulation.teams} krajów z najlepszym zawodnikiem w OGR (kobiet lub mężczyzn), które mają na listach olimpijskich i kobietę, i mężczyznę. Gospodarz (USA) ma miejsce zagwarantowane.</p>
          <MixedTeams omtr={omtr || []} teams={simulation.teams} />
        </section>
      ) : simulation ? (
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
                      <span>{r.lp}</span><span className="rank">{r.pozycja_rankingu}</span><span>{r.zawodnik}</span><span>{countryPl(r.kraj)}</span><span className="n">{formatNumber(r.punkty)}</span><span className="chip chip-out" style={{ justifySelf: 'start' }}>Limit kraju</span>
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
