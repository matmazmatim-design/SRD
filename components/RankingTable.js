'use client';

import { useMemo, useState } from 'react';
import { condense, isPolish, statusKind, formatNumber } from '../lib/compute';

const CHIP = { ok: 'chip chip-ok', warn: 'chip chip-warn', res: 'chip chip-res', out: 'chip chip-out' };

function Row({ r, label, pointsDigits }) {
  const kind = statusKind(r.sciezka);
  return (
    <div className={'rrow' + (isPolish(r.kraj) ? ' pl' : '')}>
      <span style={{ fontWeight: 600 }}>{label}</span>
      <span className="rank">{r.pozycja_rankingu ?? '—'}</span>
      <span style={{ fontWeight: 500 }}>{r.zawodnik}</span>
      <span>{r.kraj}</span>
      <span className="n">{formatNumber(r.punkty, pointsDigits)}</span>
      <span className={CHIP[kind]} style={{ justifySelf: 'start' }}>{r.sciezka}</span>
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
        <div className="rtable">
          <div className="rrow head">
            <span>#</span><span>{rankingLabel}</span><span>Zawodnik</span><span>Kraj</span><span className="n">Pkt</span><span>Ścieżka / status</span>
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
