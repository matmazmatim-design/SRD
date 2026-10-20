'use client';

import { useMemo, useState } from 'react';
import { condense, isPolish, qualKind, QUAL, formatNumber } from '../lib/compute';
import { countryPl } from '../lib/countries';


const COLS = '48px 64px minmax(0, 1.5fr) minmax(0, 1fr) 96px minmax(0, 1.8fr) 190px';
const center = { textAlign: 'center', justifySelf: 'center' };

// „Zakwalifikowany – realokacja kwot Oceanii” → „Realokacja kwot Oceanii” (status jest w osobnej kolumnie)
function pathText(sciezka) {
  const t = String(sciezka || '');
  const i = t.indexOf(' – ');
  if (i > 0 && /^zakwalifik/i.test(t)) { const rest = t.slice(i + 3); return rest.charAt(0).toUpperCase() + rest.slice(1); }
  return t;
}

function Row({ r, label, pointsDigits }) {
  const kind = qualKind(r.sciezka);
  return (
    <div className={'rrow' + (isPolish(r.kraj) ? ' pl' : '')} style={{ gridTemplateColumns: COLS }}>
      <span style={{ fontWeight: 600 }}>{label}</span>
      <span className="rank">{r.pozycja_rankingu ?? '—'}</span>
      <span style={{ fontWeight: isPolish(r.kraj) ? 700 : 500 }}>{r.zawodnik}</span>
      <span>{countryPl(r.kraj)}</span>
      <span style={center}>{formatNumber(r.punkty, pointsDigits)}</span>
      <span style={{ fontSize: 13, color: 'var(--body)' }}>{pathText(r.sciezka)}</span>
      <span className={QUAL[kind].chip} style={center}>{QUAL[kind].label}</span>
    </div>
  );
}

export default function RankingTable({ qualified, reserve, rankingLabel = 'Ranking', pointsDigits = 2 }) {
  const [full, setFull] = useState(false);
  const [query, setQuery] = useState('');
  const q = query.trim().toLowerCase();

  const match = r => !q || `${r.zawodnik} ${r.kraj} ${r.sciezka}`.toLowerCase().includes(q);
  const items = useMemo(() => {
    if (q) return qualified.filter(match).map(r => ({ type: 'row', row: r }));
    return full ? qualified.map(r => ({ type: 'row', row: r })) : condense(qualified);
  }, [qualified, full, q]);
  const reserveShown = q ? reserve.filter(match) : (full ? reserve : reserve.slice(0, 3));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <label htmlFor="szukaj-ranking" className="field" style={{ maxWidth: 340 }}>
        Szukaj zawodnika, kraju lub ścieżki
        <input id="szukaj-ranking" type="search" value={query} onChange={e => setQuery(e.target.value)} placeholder="np. Polska" />
      </label>
      <div className="table-box">
        <div className="rtable" style={{ minWidth: 940 }}>
          <div className="rrow head" style={{ gridTemplateColumns: COLS }}>
            <span>#</span><span>{rankingLabel}</span><span>Zawodnik</span><span>Kraj</span><span style={center}>Pkt</span><span>Ścieżka</span><span style={center}>Status</span>
          </div>
          {items.map((it, i) =>
            it.type === 'gap'
              ? <div key={'g' + i} className="rgap">· · · miejsca {it.from}–{it.to} · · ·</div>
              : <Row key={'r' + it.row.lp} r={it.row} label={it.row.lp} pointsDigits={pointsDigits} />
          )}
          {items.length === 0 && <div className="rgap">Brak wyników na liście olimpijskiej.</div>}
          <div className="qline">Linia kwalifikacji</div>
          {reserveShown.map(r => <Row key={'rez' + r.lp} r={r} label={'R' + r.lp} pointsDigits={pointsDigits} />)}
        </div>
      </div>
      {!q && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
          <button type="button" className="btn btn-ghost" onClick={() => setFull(f => !f)}>
            {full ? 'Pokaż skróconą listę' : `Pokaż pełną listę (${qualified.length}) i rezerwę (${reserve.length})`}
          </button>
        </div>
      )}
    </div>
  );
}
