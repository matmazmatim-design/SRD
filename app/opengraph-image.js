import { ImageResponse } from 'next/og';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';

// Obrazek podglądu linku (X, Facebook, komunikatory) – 1200×630 w barwach SRD.
export const alt = 'Sportowy Rytm Dnia – Polacy w drodze do LA28';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default async function OgImage() {
  const logo = await readFile(join(process.cwd(), 'public', 'logo-srd-ciemne-tlo.png'));
  const logoSrc = `data:image/png;base64,${logo.toString('base64')}`;
  return new ImageResponse(
    (
      <div style={{ width: '100%', height: '100%', display: 'flex', background: '#000000', color: '#FFFFFF', padding: 64, alignItems: 'center', gap: 48, borderBottom: '12px solid #00A0FE' }}>
        <img src={logoSrc} width={330} height={292} alt="" />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          <div style={{ fontSize: 30, letterSpacing: 4, color: '#A9B8C6', textTransform: 'uppercase' }}>Sportowy Rytm Dnia</div>
          <div style={{ fontSize: 62, fontWeight: 800, fontStyle: 'italic', lineHeight: 1, textTransform: 'uppercase', display: 'flex', flexDirection: 'column' }}>
            <span>Polacy w drodze</span>
            <span style={{ color: '#00A0FE' }}>do LA28</span>
          </div>
          <div style={{ fontSize: 30, color: '#C9D1DA' }}>Rankingi, linie kwalifikacji i terminy</div>
          <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
            <div style={{ width: 120, height: 10, background: '#00A0FE', transform: 'skewX(-20deg)' }} />
            <div style={{ width: 80, height: 10, background: '#00A0FE', transform: 'skewX(-20deg)' }} />
            <div style={{ width: 44, height: 10, background: '#00A0FE', transform: 'skewX(-20deg)' }} />
          </div>
        </div>
      </div>
    ),
    size
  );
}
