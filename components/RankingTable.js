'use client';

import { useMemo, useState } from 'react';
import { condense, isPolish, rowKind, QUAL, formatNumber } from '../lib/compute';
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
  const kind = rowKind(r);
  return (
    <div className={'rrow' + (isPolish(r.kraj) ? ' pl' : '')} style={{ gridTemplateColumns: COLS }}>
      <span style={{ fontWeight: 600 }}>{label}</span>
      <span className="rank">{r.pozycja_rankingu ?? '—'}</span>
      <span style={r.pending ? { color: 'var(--muted)', fontStyle: 'italic' } : { fontWeight: isPolish(r.kraj) ? 700 : 500 }}>{r.zawodnik}</span>
      <span>{r.kraj ? countryPl(r.kraj) : '—'}</span>
      <span style={center}>{formatNumber(r.punkty, pointsDigits)}</span>
      <span style={{ fontSize: 13, color: 'var(--body)' }}>
        {pathText(r.sciezka)}
        {r.gwiazdka && <button type="button" className="star" popoverTarget={'zasady-' + r.gwiazdka} aria-label="Jak to miejsce może się zmienić">*</button>}
      </span>
      <span className={QUAL[kind].chip} style={center}>{QUAL[kind].label}</span>
    </div>
  );
}

const RULES = {
  ranking: {
    title: 'Nowa flaga z rankingu – jak to może się zmienić',
    items: [
      'Liczy się ranking World Triathlon z 18 maja 2028. Do tego dnia kolejność będzie się zmieniać.',
      'Miejsce dostaje najlepszy zawodnik z kontynentu, którego kraj nie ma jeszcze żadnego miejsca w tej płci.',
      'Jeśli ten kraj zdobędzie miejsce inną drogą (IOQR, ranking sztafet, MŚ sztafet 2027, igrzyska kontynentalne), nowa flaga przechodzi na następny kraj z tego kontynentu.',
      'Igrzyska kontynentalne, które jeszcze się nie odbyły, mogą „zabrać” kraj z tej listy.',
      'Gdy na kontynencie nie ma kraju bez miejsca, miejsce wraca do IOQR – dostaje je najwyżej sklasyfikowany zawodnik bez miejsca, z dowolnego kontynentu, w ramach limitu kraju.',
      'Zawodnik musi być w top 160 rankingu World Triathlon.'
    ]
  },
  igrzyska: {
    title: 'Nowa flaga z igrzysk kontynentalnych – jak to może się zmienić',
    items: [
      'Miejsce dostaje najwyżej sklasyfikowany na igrzyskach kraj, który nie ma jeszcze miejsca w tej płci.',
      'Jeśli ten kraj zdobędzie później miejsce z rankingu IOQR, miejsce z igrzysk przechodzi na następny kraj z tego kontynentu według wyników igrzysk.',
      'Gdy nie ma takiego kraju, miejsce wraca do IOQR (najwyżej sklasyfikowany zawodnik bez miejsca, z dowolnego kontynentu).'
    ]
  }
};

function RulesPopover({ id, rules }) {
  return (
    <div id={'zasady-' + id} popover="auto" className="rules-pop">
      <strong>{rules.title}</strong>
      <ul>{rules.items.map(t => <li key={t}>{t}</li>)}</ul>
      <button type="button" className="btn btn-ghost" popoverTarget={'zasady-' + id} popoverTargetAction="hide">Zamknij</button>
    </div>
  );
}

export default function RankingTable({ qualified, reserve, rankingLabel = 'Ranking', pointsDigits = 2 }) {
  const [full, setFull] = useState(false);
  const [query, setQuery] = useState('');
  const q = query.trim().toLowerCase();

  const match = r => !q || `${r.zawodnik} ${r.kraj} ${countryPl(r.kraj)} ${r.sciezka}`.toLowerCase().includes(q);
  const items = useMemo(() => {
    if (q) return qualified.filter(match).map(r => ({ type: 'row', row: r }));
    return full ? qualified.map(r => ({ type: 'row', row: r })) : condense(qualified);
  }, [qualified, full, q]);
  const reserveShown = q ? reserve.filter(match) : (full ? reserve : reserve.slice(0, 3));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {Object.entries(RULES).filter(([id]) => [...qualified, ...reserve].some(r => r.gwiazdka === id)).map(([id, rules]) => <RulesPopover key={id} id={id} rules={rules} />)}
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
