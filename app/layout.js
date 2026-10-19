import Link from 'next/link';
import './globals.css';
import ThemeToggle from '../components/ThemeToggle';
import SiteNav from '../components/SiteNav';
import { getLastUpdate } from '../lib/data';
import { formatDatePl } from '../lib/compute';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://sportowyrytmdnia.vercel.app';

export const revalidate = 3600;

export const metadata = {
  metadataBase: new URL(SITE_URL),
  openGraph: {
    type: 'website',
    locale: 'pl_PL',
    siteName: 'Sportowy Rytm Dnia',
    title: 'Sportowy Rytm Dnia – Polacy w drodze do LA28',
    description: 'Status kwalifikacji polskich sportowców do igrzysk w Los Angeles: rankingi, linie kwalifikacji i terminy.'
  },
  twitter: { card: 'summary_large_image' },
  title: {
    default: 'Sportowy Rytm Dnia',
    template: '%s · Sportowy Rytm Dnia'
  },
  description: 'Sportowy Rytm Dnia – status kwalifikacji Polaków do igrzysk LA28 i sportowe wiadomości dnia.'
};

// Ustawia tryb przed pierwszym malowaniem strony, żeby nie mignęła w złym kolorze.
const themeScript = `(function(){try{var t=localStorage.getItem('srd-theme');document.documentElement.dataset.theme=(t==='light'||t==='dark')?t:'dark';}catch(e){document.documentElement.dataset.theme='dark';}})();`;

export default async function RootLayout({ children }) {
  const stan = await getLastUpdate();
  return (
    <html lang="pl" data-theme="dark" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Saira:ital,wght@1,700;1,800&family=Barlow:wght@400;500;600;700&display=swap" />
      </head>
      <body>
        <header className="site-header">
          <div className="container">
            <Link href="/" className="brand">
              <img src="/logo-srd-ciemne-tlo.png" alt="" width="59" height="52" />
              <span className="brand-name">Sportowy Rytm Dnia<span>Kwalifikacje LA28</span></span>
            </Link>
            <SiteNav />
            <div className="header-side">
              {stan && <span className="stamp">Stan na {formatDatePl(stan)}</span>}
              <ThemeToggle />
            </div>
          </div>
        </header>
        {children}
        <footer className="site-footer">
          <div className="container">
            <span>© Sportowy Rytm Dnia</span>
            <span>Symulacje kwalifikacji na podstawie rankingów federacji. Dane mogą się różnić od oficjalnych list.</span>
          </div>
        </footer>
      </body>
    </html>
  );
}
