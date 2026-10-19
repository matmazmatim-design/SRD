'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const LINKS = [
  { href: '/', label: 'Start', exact: true },
  { href: '/dyscypliny', label: 'Kwalifikacje LA28' }
];

export default function SiteNav() {
  const path = usePathname() || '/';
  return (
    <nav className="nav" aria-label="Menu główne">
      {LINKS.map(l => {
        const active = l.exact ? path === l.href : path.startsWith(l.href);
        return (
          <Link key={l.href} href={l.href} aria-current={active ? 'page' : undefined}>{l.label}</Link>
        );
      })}
    </nav>
  );
}
