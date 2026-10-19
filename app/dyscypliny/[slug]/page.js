import Link from 'next/link';
import { notFound } from 'next/navigation';
import { SPORTS, getSport } from '../../../lib/sports';

export function generateStaticParams() {
  return SPORTS.map(s => ({ slug: s.slug }));
}

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const sport = getSport(slug);
  return { title: sport ? `${sport.name} – kwalifikacje LA28` : 'Dyscyplina' };
}

export default async function SportPage({ params }) {
  const { slug } = await params;
  const sport = getSport(slug);
  if (!sport) notFound();

  return (
    <main className="container">
      <div className="crumbs"><Link href="/dyscypliny">Dyscypliny</Link> <span aria-hidden="true">›</span> {sport.name}</div>
      <section style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <h1 className="display">{sport.name}</h1>
        <p className="lead">Wybierz konkurencję. Strony konkurencji z rankingiem, kartami Polaków i linią kwalifikacji dodamy w kolejnych krokach.</p>
      </section>
      <section style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <h2 className="eyebrow" style={{ margin: 0 }}>Wybierz konkurencję</h2>
        <div className="choice">
          {['Kobiety', 'Mężczyźni'].map(label => (
            <div key={label} className="choice-card">
              <h2 className="display">{label}</h2>
              <span className="chip chip-soon" style={{ alignSelf: 'flex-start' }}>Symulacja w przygotowaniu</span>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
