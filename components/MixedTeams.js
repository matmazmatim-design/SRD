'use client';

import { useState } from 'react';
import { QUAL } from '../lib/compute';
import { countryPl } from '../lib/countries';

const COLS = '56px minmax(0, 1fr) minmax(0, 1.4fr) minmax(0, 1.3fr) minmax(0, 1.3fr) 210px';
const center = { textAlign: 'center', justifySelf: 'center' };

function Person({ r }) {
  if (!r) return <span style={{ color: 'var(--muted)' }}>—</span>;
  return <span>{r.zawodnik} <span style={{ color: 'var(--muted)', fontSize: 13 }}>· OGR {r.pozycja_rankingu}</span></span>;
}

// Rywalizacja mieszana w golfie: kraje według OMTR i ich drużyny (kobieta + mężczyzna)
export default function MixedTeams({ omtr, teams = 16 }) {
  const [full, setFull] = useState(false);
  const lastTeam = omtr.reduce((m, r, i) => (r.status !== 'res' ? i : m), -1);
  const pl = omtr.findIndex(r => r.noc === 'POL');
  const limit = Math.max(lastTeam + 4, pl + 2, 20);
  const shown = full ? omtr : omtr.slice(0, limit);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div className="table-box">
        <div className="rtable" style={{ minWidth: 940 }}>
          <div className="rrow head" style={{ gridTemplateColumns: COLS }}>
            <span>OMTR</span><span>Kraj</span><span>Najlepszy w OGR</span><span>Mężczyzna na liście</span><span>Kobieta na liście</span><span style={center}>Status</span>
          </div>
          {shown.map((r, i) => (
            <div key={r.noc}>
              <div className={'rrow' + (r.noc === 'POL' ? ' pl' : '')} style={{ gridTemplateColumns: COLS }}>
                <span style={{ fontWeight: 600 }}>{r.omtr}</span>
                <span style={{ fontWeight: r.noc === 'POL' ? 700 : 500 }}>{countryPl(r.noc)}</span>
                <span>{r.zawodnik} <span style={{ color: 'var(--muted)', fontSize: 13 }}>· {r.plec === 'K' ? 'K' : 'M'}, OGR {r.pozycja}</span></span>
                <Person r={r.mezczyzna} />
                <Person r={r.kobieta} />
                <span className={QUAL[r.status].chip} style={center} title={r.sciezka}>{r.status === 'res' ? (r.eligible ? 'Rezerwa' : 'Bez drużyny') : QUAL[r.status].label}</span>
              </div>
              {i === lastTeam && <div className="qline">Linia kwalifikacji – {teams} drużyn</div>}
            </div>
          ))}
        </div>
      </div>
      {omtr.length > limit && (
        <button type="button" className="btn btn-ghost" style={{ alignSelf: 'flex-start' }} onClick={() => setFull(f => !f)}>
          {full ? 'Pokaż skrót' : `Pokaż wszystkie kraje (${omtr.length})`}
        </button>
      )}
    </div>
  );
}
