'use client';

import { useState } from 'react';
import { condenseRanking, rowIsPolish, formatNumber, formatDatePl } from '../lib/compute';

const SOURCE_NAME = { uci: 'UCI', world_triathlon: 'World Triathlon', owgr: 'OWGR' };

export default function SourceRanking({ ranking }) {
  const [full, setFull] = useState(false);
  const national = ranking.rodzaj === 'krajowy';
  const items = full ? ranking.rows.map(r => ({ type: 'row', row: r })) : condenseRanking(ranking.rows);
  const cols = national ? '64px minmax(0, 1fr) 100px' : '64px minmax(0, 2fr) minmax(0, 1.2fr) 100px';
  const digits = ranking.rows.some(r => r.punkty !== null && !Number.isInteger(Number(r.punkty))) ? 2 : 0;
  const source = SOURCE_NAME[ranking.typ] || 'strona źródła';

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
        <p style={{ margin: 0, fontSize: 14, color: 'var(--body)', maxWidth: '70ch' }}>
          W tej konkurencji miejsca olimpijskie dostają kraje, a nie konkretni zawodnicy. O tym, kto pojedzie, decyduje później krajowa federacja.
        </p>
      )}
      <div className="table-box">
        <div className="rtable" style={{ minWidth: national ? 360 : 560 }}>
          <div className="rrow head" style={{ gridTemplateColumns: cols }}>
            <span>Poz.</span><span>{national ? 'Kraj' : 'Zawodnik'}</span>{!national && <span>Kraj</span>}<span className="n">Pkt</span>
          </div>
          {items.map((it, i) => it.type === 'gap' ? (
            <div key={'g' + i} className="rgap">· · · miejsca {it.from}–{it.to} · · ·</div>
          ) : (
            <div key={'r' + i} className={'rrow' + (rowIsPolish(it.row) ? ' pl' : '')} style={{ gridTemplateColumns: cols }}>
              <span style={{ fontWeight: 600 }}>{it.row.pozycja}</span>
              <span style={{ fontWeight: rowIsPolish(it.row) ? 700 : 500 }}>{it.row.zawodnik}</span>
              {!national && <span>{it.row.kraj || it.row.kod_kraju || '—'}</span>}
              <span className="n">{formatNumber(it.row.punkty, digits)}</span>
            </div>
          ))}
        </div>
      </div>
      {ranking.rows.length > 18 && (
        <button type="button" className="btn btn-ghost" style={{ alignSelf: 'flex-start' }} onClick={() => setFull(f => !f)}>
          {full ? 'Pokaż skrót' : `Pokaż cały ranking (${ranking.rows.length})`}
        </button>
      )}
    </section>
  );
}
