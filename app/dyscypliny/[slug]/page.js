import Link from 'next/link';
import { notFound } from 'next/navigation';
import { SPORTS } from '../../../lib/sports';
import { getSportWithEvents } from '../../../lib/data';

export const revalidate = 3600;

export function generateStaticParams() {
  return SPORTS.map(s => ({ slug: s.slug }));
}

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const { sport } = await getSportWithEvents(slug);
  return { title: sport ? `${sport.name} – kwalifikacje LA28` : 'Dyscyplina' };
}

const PLEC = { K: 'Kobiety', M: 'Mężczyźni', X: 'Mieszana' };

function formatDate(iso, time) {
  if (!iso) return null;
  const d = new Date(iso + 'T12:00:00');
  const txt = d.toLocaleDateString('pl-PL', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  return time ? `${txt} · ${time}` : txt;
}

export default async function SportPage({ params }) {
  const { slug } = await params;
  const { sport, events } = await getSportWithEvents(slug);
  if (!sport) notFound();

  const cards = events.length
    ? events.map(e => ({ key: e.slug, title: PLEC[e.plec] || e.nazwa, name: e.nazwa, when: formatDate(e.data_startu, e.godzina), where: e.miejsce, slots: e.miejsc, desc: e.opis }))
    : ['Kobiety', 'Mężczyźni'].map(t => ({ key: t, title: t }));

  return (
    <main className="container">
      <div className="crumbs"><Link href="/dyscypliny">Dyscypliny</Link> <span aria-hidden="true">›</span> {sport.name}</div>
      <section style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <h1 className="display">{sport.name}</h1>
        <p className="lead">Wybierz konkurencję. Strony konkurencji z rankingiem, kartami Polaków i linią kwalifikacji dodamy w kolejnych krokach.</p>
      </section>
      <section style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <h2 className="eyebrow" style={{ margin: 0 }}>Konkurencje w Los Angeles</h2>
        <div className="choice">
          {cards.map(c => (
            <div key={c.key} className="choice-card">
              <h2 className="display">{c.title}</h2>
              {c.when && <span style={{ color: 'var(--muted)', fontSize: 14 }}>{c.when}{c.where ? ` · ${c.where}` : ''}</span>}
              {c.desc && <span style={{ color: 'var(--body)', fontSize: 15 }}>{c.desc}</span>}
              {c.slots ? <span style={{ fontSize: 14, color: 'var(--body)' }}>Miejsc w konkurencji: <strong style={{ color: 'var(--ink)' }}>{c.slots}</strong></span> : null}
              <span className="chip chip-soon" style={{ alignSelf: 'flex-start' }}>Status kwalifikacji w przygotowaniu</span>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
