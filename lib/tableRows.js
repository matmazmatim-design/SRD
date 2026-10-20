// Tabela (wiersze komórek) → wiersze rankingu/wyników { pozycja, zawodnik, kraj, kod_kraju, punkty }.
// Wspólne dla serwera (pliki XLSX z triathlon.org) i panelu (wklejka z Excela).

import { parsePastedTable } from './paste.js';
import { toNoc } from './countries.js';

const H = {
  pos: /^(#|rank|ranking|pos|position|place|pl|lp)$/i,
  name: /^(athlete|athlete name|name|full name|nation|country name|team|team name)$/i,
  first: /^(athlete )?(first ?name|given name)$/i,
  last: /^(athlete )?(last ?name|surname|family name)$/i,
  country: /^(noc|country|nation|country code|noc code|nat)$/i,
  points: /^(points|pts|total|total points)$/i
};

export function rowsFromTable(table) {
  const headerIdx = table.slice(0, 10).findIndex(r => r.filter(c => Object.values(H).some(re => re.test(String(c).trim()))).length >= 2);
  if (headerIdx < 0) {
    // bez rozpoznanego nagłówka – jak zwykła wklejka
    return parsePastedTable(table.map(r => r.join('\t')).join('\n')).rows;
  }
  const head = table[headerIdx].map(c => String(c).trim());
  const find = re => head.findIndex(h => re.test(h));
  const c = { pos: find(H.pos), name: find(H.name), first: find(H.first), last: find(H.last), country: find(H.country), points: find(H.points) };
  if (c.name === c.country) c.country = -1;
  // Ranking krajów („Team Name” + „Country”): nazwą jest sam kraj
  if (c.name >= 0 && /^team/i.test(head[c.name]) && c.country >= 0) { c.name = c.country; c.country = -1; }
  // Ranking krajów bez kolumny z nazwą – nazwą jest kraj
  if (c.name < 0 && c.first < 0 && c.country >= 0) { c.name = c.country; c.country = -1; }
  const out = [];
  for (const r of table.slice(headerIdx + 1)) {
    let name = c.name >= 0 ? r[c.name] : [r[c.first], r[c.last]].filter(Boolean).join(' ');
    name = String(name || '').replace(/^team\s*\|\s*/i, '').replace(/\s*\|\s*team$/i, '').trim();
    if (!name) continue;
    let code = null;
    const paren = name.match(/^(.*\S)\s*\(([A-Z]{3})\)$/);
    if (paren) { name = paren[1]; code = paren[2]; }
    const country = c.country >= 0 ? String(r[c.country] || '').trim() : '';
    if (!code && country) code = /^[A-Z]{3}$/.test(country) ? country : toNoc(country);
    if (!code && c.country < 0) code = toNoc(name); // ranking krajów: nazwa kraju w kolumnie z nazwą
    const rawPos = String(r[c.pos] ?? '').trim();
    // wyniki zawodów: bez miejsca (DNF, DSQ, LAP – w eksporcie „-3” lub puste) – pomijamy
    if (c.pos >= 0 && (!rawPos || rawPos.startsWith('-'))) continue;
    const pos = Number(rawPos.replace(/[^\d]/g, ''));
    const pts = Number(String(r[c.points] ?? '').replace(/\s/g, '').replace(',', '.'));
    out.push({
      pozycja: pos > 0 ? pos : out.length + 1,
      zawodnik: name,
      kraj: country && !/^[A-Z]{3}$/.test(country) ? country : null,
      kod_kraju: code,
      punkty: Number.isFinite(pts) && String(r[c.points] ?? '').trim() !== '' ? pts : null
    });
  }
  return out;
}

