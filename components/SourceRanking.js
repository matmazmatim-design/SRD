'use client';

import { useState } from 'react';
import { condenseRanking, rowIsPolish, formatNumber, formatDatePl, quotaFor, lastQuotaPosition } from '../lib/compute';

const SOURCE_NAME = { uci: 'UCI', world_triathlon: 'World Triathlon', owgr: 'OWGR' };

function placesLabel(n) {
  return n === 1 ? '1 miejsce' : `${n} miejsca`;
}

export default function SourceRanking({ ranking }) {
  const [full, setFull] = useState(false);
  const national = ranking.rodzaj === 'krajowy';
  const rules = ranking.zasady && ranking.zasady.progi?.length ? ranking.zasady : null;
  const line = lastQuotaPosition(rules);
  const items = full ? ranking.rows.map(r => ({ type: 'row', row: r })) : condenseRanking(ranking.rows, { line });
  const name = national ? 'minmax(0, 1.4fr)' : 'minmax(0, 2fr) minmax(0, 1.2fr)';
  const cols = `64px ${name} 96px` + (rules ? ' 104px minmax(0, 1.4fr)' : '');
  const digits = ranking.rows.some(r => r.punkty !== null && !Number.isInteger(Number(r.punkty))) ? 2 : 0;
  const source = SOURCE_NAME[ranking.typ] || 'strona źródła';
  const totalPlaces = rules ? rules.progi.reduce((s, t) => s + (t.do - t.od + 1) * t.miejsc, 0) : 0;
  let lineDrawn = false;

  function Row({ r }) {
    const q = rules ? quotaFor(r.pozycja, rules) : 0;
    return (
      <div className={'rrow' + (rowIsPolish(r) ? ' pl' : '')} style={{ gridTemplateColumns: cols }}>
        <span style={{ fontWeight: 600 }}>{r.pozycja}</span>
        <span style={{ fontWeight: rowIsPolish(r) ? 700 : 500 }}>{r.zawodnik}</span>
        {!national && <span>{r.kraj || r.kod_kraju || '—'}</span>}
        <span className="n">{formatNumber(r.punkty, digits)}</span>
        {rules && <span className="n" style={{ fontWeight: 600 }}>{q || '—'}</span>}
        {rules && (q
          ? <span className="chip chip-ok" style={{ justifySelf: 'start' }}>{national ? 'Kraj z kwotą' : 'W strefie'}</span>
          : <span className="chip chip-out" style={{ justifySelf: 'start' }}>Poza strefą rankingu</span>)}
      </div>
    );
  }

  return (
    <section className="panel" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'baseline', gap: '6px 16px' }}>
        <h2 className="h2">{national ? 'Ranking krajów' : 'Ranking zawodników'}</h2>
        <span style={{ fontSize: 13, color: 'var(--muted)' }}>
          {ranking.nazwa} · stan na {formatDatePl(ranking.stanNa)} · źródło:{' '}
          {ranking.adres_strony ? <a href={ranking.adres_strony} target="_blank" rel="noreferrer">{source}</a> : source}
        </span>
      </div>
      {national && (
        <p style={{ margin: 0, fontSize: 14, color: 'var(--body)', maxWidth: '72ch' }}>
          W tej konkurencji miejsca olimpijskie dostają kraje, a nie konkretni zawodnicy. O tym, kto pojedzie, decyduje później krajowa federacja.
        </p>
      )}
      {rules && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center', fontSize: 14, color: 'var(--body)' }}>
          {rules.progi.map(t => (
            <span key={t.od} className="chip chip-path">miejsca {t.od}–{t.do}: {placesLabel(t.miejsc)}</span>
          ))}
          <span>Razem z rankingu: {totalPlaces} miejsc{rules.zamkniecie ? ` · ranking zamyka się ${formatDatePl(rules.zamkniecie)}` : ''}</span>
        </div>
      )}
      <div className="table-box">
        <div className="rtable" style={{ minWidth: rules ? (national ? 560 : 760) : (national ? 360 : 560) }}>
          <div className="rrow head" style={{ gridTemplateColumns: cols }}>
            <span>Poz.</span><span>{national ? 'Kraj' : 'Zawodnik'}</span>{!national && <span>Kraj</span>}<span className="n">Pkt</span>
            {rules && <span className="n">Miejsca na IO</span>}{rules && <span>Status</span>}
          </div>
          {items.map((it, i) => {
            if (it.type === 'gap') return <div key={'g' + i} className="rgap">· · · miejsca {it.from}–{it.to} · · ·</div>;
            const showLine = line && !lineDrawn && Number(it.row.pozycja) > line;
            if (showLine) lineDrawn = true;
            return (
              <div key={'r' + i}>
                {showLine && <div className="qline">Linia kwalifikacji z rankingu</div>}
                <Row r={it.row} />
              </div>
            );
          })}
        </div>
      </div>
      {rules?.pozostali && <p style={{ margin: 0, fontSize: 13, color: 'var(--muted)', maxWidth: '72ch' }}>Kraje poza strefą: {rules.pozostali}</p>}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'center' }}>
        {ranking.rows.length > 18 && (
          <button type="button" className="btn btn-ghost" onClick={() => setFull(f => !f)}>
            {full ? 'Pokaż skrót' : `Pokaż cały ranking (${ranking.rows.length})`}
          </button>
        )}
        {rules?.regulamin && <a href={rules.regulamin} target="_blank" rel="noreferrer" style={{ fontSize: 14 }}>Regulamin kwalifikacji ›</a>}
      </div>
    </section>
  );
}
