import Link from 'next/link';
import { getSports } from '../lib/data';

export const revalidate = 3600;

export default async function HomePage() {
  const SPORTS = await getSports();
  const tracked = SPORTS.filter(s => s.tracked);
  return (
    <main className="container">
      <section style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <span className="eyebrow">Sportowy Rytm Dnia</span>
        <h1 className="display">Polacy w drodze <span className="accent">do LA28</span></h1>
        <p className="lead">Gdzie dziś są polscy sportowcy w walce o igrzyska w Los Angeles: rankingi, linie kwalifikacji i terminy, aktualizowane na bieżąco.</p>
      </section>

      <Link href="/dyscypliny" className="choice-card" style={{ border: '1.5px solid var(--blue)', background: 'linear-gradient(135deg, var(--blue-soft), transparent 55%), var(--surface)' }}>
        <span className="eyebrow">Kwalifikacje LA28</span>
        <h2 className="display">Wszystkie dyscypliny</h2>
        <span style={{ color: 'var(--body)' }}>{SPORTS.length} sportów · śledzimy {tracked.length}: {tracked.map(s => s.name.toLowerCase()).join(' i ')}</span>
        <span style={{ alignSelf: 'flex-start', display: 'inline-flex', alignItems: 'center', minHeight: 44, padding: '0 18px', borderRadius: 8, background: 'var(--blue)', color: '#000000', fontWeight: 600 }}>Zobacz dyscypliny ›</span>
      </Link>
    </main>
  );
}
