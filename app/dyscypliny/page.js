import SportTiles from '../../components/SportTiles';
import { SPORTS } from '../../lib/sports';

export const metadata = { title: 'Kwalifikacje LA28 – dyscypliny' };

export default function DyscyplinyPage() {
  return (
    <main className="container">
      <section style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <span className="eyebrow">Kwalifikacje LA28</span>
        <h1 className="display">Dyscypliny <span className="accent">LA28</span></h1>
        <p className="lead">Wszystkie sporty igrzysk w Los Angeles. Wybierz dyscyplinę, a potem konkurencję kobiet lub mężczyzn, żeby zobaczyć, gdzie dziś są Polacy w drodze po kwalifikację.</p>
      </section>
      <SportTiles sports={SPORTS} />
    </main>
  );
}
