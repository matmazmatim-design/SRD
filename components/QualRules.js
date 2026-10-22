// Sekcja „Zasady kwalifikacji” na stronie dyscypliny – treść z kolumny dyscypliny.zasady (jsonb):
// { wstep, liczby: [{ wartosc, opis }], podzial: { tytul, czesci: [{ etykieta, liczba, opis }] },
//   kroki: [{ tytul, opis, meta }], statusy: 'tekst o tym, kiedy wirtualna kwalifikacja staje się pewna' }

const COLORS = ['#00A0FE', '#7CCBFF', '#2FD07A', '#5A6370', '#D98A1E', '#7C5CFF'];

export default function QualRules({ rules }) {
  const parts = rules.podzial?.czesci || [];
  const total = parts.reduce((n, p) => n + (Number(p.liczba) || 0), 0);
  return (
    <section className="panel rules" aria-labelledby="zasady-h">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <h2 id="zasady-h" className="h2">Zasady kwalifikacji</h2>
        {rules.wstep && <p style={{ margin: 0, color: 'var(--body)' }}>{rules.wstep}</p>}
      </div>
      {rules.liczby?.length > 0 && (
        <div className="rules-stats">
          {rules.liczby.map(l => (
            <div key={l.opis} className={'rules-stat' + (String(l.wartosc).length > 5 ? ' long' : '')}><b>{l.wartosc}</b><span>{l.opis}</span></div>
          ))}
        </div>
      )}
      {parts.length > 0 && total > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <span className="eyebrow">{rules.podzial.tytul || 'Skąd biorą się miejsca'}</span>
          <div className="rules-bar" role="img" aria-label={parts.map(p => `${p.etykieta}: ${p.liczba}`).join(', ')}>
            {parts.map((p, i) => (
              <div key={p.etykieta} style={{ flex: Number(p.liczba), background: COLORS[i % COLORS.length], color: i === 3 ? '#fff' : '#04121c' }}>
                {Number(p.liczba) / total > 0.12 ? `${p.liczba} · ${p.etykieta.toLowerCase()}` : p.liczba}
              </div>
            ))}
          </div>
          <div className="rules-legend">
            {parts.map((p, i) => <span key={p.etykieta}><i style={{ background: COLORS[i % COLORS.length] }} />{p.opis || p.etykieta}</span>)}
          </div>
        </div>
      )}
      {rules.kroki?.length > 0 && (
        <ol className="rules-steps">
          {rules.kroki.map((k, i) => (
            <li key={k.tytul} className="rules-step">
              <span className="n" aria-hidden="true">{i + 1}</span>
              <div>
                <h3>{k.tytul}</h3>
                <p>{k.opis}</p>
                {k.meta && <div className="meta">{k.meta}</div>}
              </div>
            </li>
          ))}
        </ol>
      )}
      {rules.statusy && (
        <p className="rules-note">
          Na stronie: <span className="chip chip-virt">Wirtualna kwalifikacja</span> = w strefie według dzisiejszego rankingu. {rules.statusy} <span className="chip chip-ok">Zakwalifikowany</span>.
        </p>
      )}
    </section>
  );
}
