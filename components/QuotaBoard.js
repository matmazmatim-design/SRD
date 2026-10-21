import { QUAL, formatDatePl } from '../lib/compute';
import { countryPl } from '../lib/countries';

const COLS = 'minmax(0, 2fr) 70px minmax(0, 1.2fr) minmax(0, 1.4fr) 190px';
const center = { textAlign: 'center', justifySelf: 'center' };

// Tablica kwot: każde miejsce olimpijskie z każdej ścieżki, z krajem, który je zdobył
export default function QuotaBoard({ kwoty }) {
  const groups = [];
  for (const k of kwoty) {
    let g = groups.find(x => x.name === k.sciezka);
    if (!g) groups.push(g = { name: k.sciezka, items: [] });
    g.items.push(k);
  }
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
      {groups.map(g => {
        const total = g.items.reduce((s, k) => s + k.liczba, 0);
        const done = g.items.filter(k => k.kraj).reduce((s, k) => s + k.liczba, 0);
        return (
          <div key={g.name} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 10, flexWrap: 'wrap' }}>
              <h3 style={{ margin: 0, fontSize: 18 }}>{g.name}</h3>
              <span style={{ fontSize: 13, color: 'var(--muted)' }}>{total} {total === 1 ? 'miejsce' : total % 10 >= 2 && total % 10 <= 4 && (total % 100 < 12 || total % 100 > 14) ? 'miejsca' : 'miejsc'} · rozdzielone: {done}</span>
            </div>
            <div className="table-box">
              <div className="rtable" style={{ minWidth: 820 }}>
                <div className="rrow head" style={{ gridTemplateColumns: COLS }}>
                  <span>Zawody</span><span style={center}>Miejsc</span><span>Kraj</span><span>Zawodnicy</span><span style={center}>Status</span>
                </div>
                {g.items.map(k => {
                  const kind = k.kraj ? k.status : 'pending';
                  return (
                    <div key={k.id} className={'rrow' + (k.kraj === 'POL' ? ' pl' : '')} style={{ gridTemplateColumns: COLS }}>
                      <span>
                        <span style={{ fontWeight: 500 }}>{k.zawody}</span>
                        {(k.data_zawodow || k.uwagi) && <span style={{ display: 'block', fontSize: 12, color: 'var(--muted)' }}>{[k.data_zawodow && formatDatePl(k.data_zawodow), k.uwagi].filter(Boolean).join(' · ')}</span>}
                      </span>
                      <span style={{ ...center, fontWeight: 600 }}>{k.liczba}</span>
                      <span style={{ fontWeight: k.kraj === 'POL' ? 700 : 500, color: k.kraj ? 'var(--ink)' : 'var(--muted)', fontStyle: k.kraj ? 'normal' : 'italic' }}>{k.kraj ? countryPl(k.kraj) : 'do rozstrzygnięcia'}</span>
                      <span style={{ fontSize: 13, color: 'var(--body)' }}>{k.zawodnik || '—'}</span>
                      <span className={QUAL[kind].chip} style={center}>{QUAL[kind].label}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
