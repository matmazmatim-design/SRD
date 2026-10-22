'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';

const FILTERS = [
  { id: 'all', label: 'Wszystkie' },
  { id: 'tracked', label: 'Z Polakami (kwalifikacja lub strefa)' },
  { id: 'new', label: 'Nowe i powracające' }
];

export default function SportTiles({ sports }) {
  const [filter, setFilter] = useState('all');
  const [query, setQuery] = useState('');

  const counts = {
    all: sports.length,
    tracked: sports.filter(s => s.tracked).length,
    new: sports.filter(s => s.badge).length
  };

  const list = useMemo(() => {
    const q = query.trim().toLowerCase();
    return sports
      .filter(s => filter === 'all' || (filter === 'tracked' && s.tracked) || (filter === 'new' && s.badge))
      .filter(s => !q || s.name.toLowerCase().includes(q))
      .sort((a, b) => (Number(!!b.tracked) - Number(!!a.tracked)) || (Number(!!b.hasStatus || !!b.hasRanking) - Number(!!a.hasStatus || !!a.hasRanking)) || a.name.localeCompare(b.name, 'pl'));
  }, [sports, filter, query]);

  return (
    <section style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
        <div role="group" aria-label="Filtr dyscyplin" style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {FILTERS.map(f => (
            <button
              key={f.id}
              type="button"
              aria-pressed={filter === f.id}
              onClick={() => setFilter(f.id)}
              style={{
                font: 'inherit', fontSize: 14, minHeight: 44, padding: '0 16px', borderRadius: 999, cursor: 'pointer',
                border: '1px solid ' + (filter === f.id ? 'var(--blue)' : 'var(--line-2)'),
                background: filter === f.id ? 'var(--blue)' : 'var(--surface)',
                color: filter === f.id ? '#000000' : 'var(--ink)',
                fontWeight: filter === f.id ? 600 : 400
              }}
            >
              {f.label} · {counts[f.id]}
            </button>
          ))}
        </div>
        <label htmlFor="szukaj" style={{ display: 'flex', alignItems: 'center', gap: 8, border: '1px solid var(--line-2)', borderRadius: 8, padding: '0 12px', minHeight: 44, flex: '0 1 300px', background: 'var(--surface)' }}>
          <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true"><circle cx="7" cy="7" r="5" fill="none" stroke="currentColor" strokeWidth="1.6" /><path d="M11 11l3.5 3.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" /></svg>
          <span style={{ position: 'absolute', width: 1, height: 1, overflow: 'hidden', clip: 'rect(0 0 0 0)' }}>Szukaj dyscypliny</span>
          <input
            id="szukaj"
            type="search"
            placeholder="Szukaj dyscypliny"
            value={query}
            onChange={e => setQuery(e.target.value)}
            style={{ border: 0, outline: 'none', font: 'inherit', fontSize: 14, width: '100%', background: 'transparent', color: 'var(--ink)' }}
          />
        </label>
      </div>

      {list.length === 0 ? (
        <p style={{ padding: 32, textAlign: 'center', color: 'var(--muted)', background: 'var(--surface)', border: '1px dashed var(--line-2)', borderRadius: 12, margin: 0 }}>
          Brak dyscyplin dla tego filtra.
        </p>
      ) : (
        <div className="tiles">
          {list.map(s => (
            <Link key={s.slug} href={`/dyscypliny/${s.slug}`} className={'tile' + (s.tracked || s.hasRanking || s.hasStatus ? ' tracked' : '')}>
              <span className="speed" aria-hidden="true"><i /><i /><i /></span>
              <span className="tile-name">{s.name}</span>
              <span className="tile-foot">
                {s.qualified ? <span className="chip chip-ok">Kwalifikacja</span> : s.tracked && <span className="chip chip-zone">Polak w strefie</span>}
                {s.rankingBased && <span className="chip chip-path">Ranking</span>}
                {s.badge && <span className="chip chip-new">{s.badge}</span>}
              </span>
              <span className="tile-detail">{s.detail || ''}</span>
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}
