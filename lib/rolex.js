// Ranking kobiet w golfie: plik CSV z rolexrankings.com (Rolex Women's World Golf Rankings).
// Olympic Golf Ranking kobiet liczy się tym samym wzorem (średnia z 2 lat, dzielnik min. 35),
// więc kolejność OGR = kolejność rankingu Rolex.

import { olympicCode } from './owgr.js';

const URL_CSV = 'https://www.rolexrankings.com/rolexrankings.csv';

function parseCsvLine(line) {
  const out = [];
  let cur = '', q = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (q) {
      if (ch === '"' && line[i + 1] === '"') { cur += '"'; i++; }
      else if (ch === '"') q = false;
      else cur += ch;
    } else if (ch === '"') q = true;
    else if (ch === ',') { out.push(cur); cur = ''; }
    else cur += ch;
  }
  out.push(cur);
  return out.map(c => c.trim());
}

export function parseRolexCsv(text, params = {}) {
  const lines = String(text).replace(/^﻿/, '').split(/\r?\n/).filter(l => l.trim());
  const head = parseCsvLine(lines[0]).map(h => h.toLowerCase());
  const col = name => head.indexOf(name);
  const c = { rank: col('rank'), name: col('player_name'), country: col('country_code'), avg: col('average_points'), events: col('event_count') };
  if (c.rank < 0 || c.name < 0) throw new Error('Nieznany format pliku Rolex (nagłówek: ' + lines[0].slice(0, 120) + ').');
  const rows = [];
  for (const line of lines.slice(1)) {
    const r = parseCsvLine(line);
    const pos = Number(r[c.rank]);
    const name = (r[c.name] || '').replace(/\s+/g, ' ').trim();
    if (!pos || !name) continue;
    const raw = (r[c.country] || '').toUpperCase();
    rows.push({
      pozycja: pos,
      zawodnik: name,
      kraj: null,
      kod_kraju: olympicCode(raw, name, params) || null,
      punkty: r[c.avg] !== undefined && r[c.avg] !== '' ? Number(r[c.avg]) : null,
      dodatkowe: { turnieje: r[c.events] ? Number(r[c.events]) : null, rolex_kraj: raw || null }
    });
  }
  return rows;
}

export async function fetchRolexRanking(params = {}) {
  const res = await fetch(params.url || URL_CSV, {
    headers: { referer: 'https://www.rolexrankings.com/rankings', 'user-agent': 'Mozilla/5.0 (SportowyRytmDnia; ranking LA28)', accept: 'text/csv,*/*' },
    cache: 'no-store'
  });
  if (!res.ok) throw new Error(`rolexrankings.com odpowiedział ${res.status}.`);
  const rows = parseRolexCsv(await res.text(), params);
  if (rows.length < 100) throw new Error('W pliku Rolex jest za mało wierszy.');
  return rows;
}
