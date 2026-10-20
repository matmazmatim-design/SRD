// Pobieranie rankingów World Triathlon z eksportu (przycisk „pobierz XLS” na triathlon.org).
// Obsługuje XLSX (zip z XML – czytany wbudowanym zlib, bez dodatkowych bibliotek), CSV i tabelę HTML.

import { inflateRawSync } from 'node:zlib';
import { parsePastedTable } from './paste.js';
import { toNoc } from './countries.js';

// --- minimalny czytnik XLSX ---------------------------------------------------

function unzip(buf) {
  let eocd = -1;
  for (let i = buf.length - 22; i >= Math.max(0, buf.length - 65557); i--) {
    if (buf.readUInt32LE(i) === 0x06054b50) { eocd = i; break; }
  }
  if (eocd < 0) throw new Error('Plik XLSX jest uszkodzony (brak katalogu zip).');
  const count = buf.readUInt16LE(eocd + 10);
  let p = buf.readUInt32LE(eocd + 16);
  const files = {};
  for (let n = 0; n < count; n++) {
    if (buf.readUInt32LE(p) !== 0x02014b50) break;
    const method = buf.readUInt16LE(p + 10);
    const size = buf.readUInt32LE(p + 20);
    const nameLen = buf.readUInt16LE(p + 28);
    const extraLen = buf.readUInt16LE(p + 30);
    const commentLen = buf.readUInt16LE(p + 32);
    const offset = buf.readUInt32LE(p + 42);
    const name = buf.toString('utf8', p + 46, p + 46 + nameLen);
    files[name] = () => {
      const start = offset + 30 + buf.readUInt16LE(offset + 26) + buf.readUInt16LE(offset + 28);
      const data = buf.subarray(start, start + size);
      return (method === 8 ? inflateRawSync(data) : data).toString('utf8');
    };
    p += 46 + nameLen + extraLen + commentLen;
  }
  return files;
}

function decode(s) {
  return s.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&apos;/g, "'")
    .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(+d)).replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCodePoint(parseInt(h, 16)))
    .replace(/&amp;/g, '&');
}
const texts = xml => [...xml.matchAll(/<t[^>]*>([\s\S]*?)<\/t>/g)].map(m => decode(m[1])).join('');

function colIndex(ref) {
  const letters = ref.match(/^[A-Z]+/)[0];
  let n = 0;
  for (const ch of letters) n = n * 26 + (ch.charCodeAt(0) - 64);
  return n - 1;
}

export function readXlsx(buf) {
  const files = unzip(buf);
  const shared = files['xl/sharedStrings.xml'] ? [...files['xl/sharedStrings.xml']().matchAll(/<si>([\s\S]*?)<\/si>/g)].map(m => texts(m[1])) : [];
  const sheetName = Object.keys(files).filter(n => /^xl\/worksheets\/sheet\d+\.xml$/.test(n)).sort((a, b) => parseInt(a.match(/\d+/)) - parseInt(b.match(/\d+/)))[0];
  if (!sheetName) throw new Error('W pliku XLSX nie ma arkusza.');
  const xml = files[sheetName]();
  const rows = [];
  for (const rm of xml.matchAll(/<row[^>]*>([\s\S]*?)<\/row>/g)) {
    const row = [];
    for (const cm of rm[1].matchAll(/<c\s([^>]*?)(?:\/>|>([\s\S]*?)<\/c>)/g)) {
      const attrs = cm[1];
      const ref = (attrs.match(/\br="([A-Z]+\d+)"/) || [])[1];
      const type = (attrs.match(/\bt="(\w+)"/) || [])[1];
      const inner = cm[2] || '';
      const v = (inner.match(/<v>([\s\S]*?)<\/v>/) || [])[1];
      let val = '';
      if (type === 's') val = shared[Number(v)] ?? '';
      else if (type === 'inlineStr') val = texts(inner);
      else if (v !== undefined) val = decode(v);
      row[ref ? colIndex(ref) : row.length] = String(val).trim();
    }
    rows.push(Array.from(row, c => c ?? ''));
  }
  return rows;
}

// --- tabela → wiersze rankingu --------------------------------------------------

const H = {
  pos: /^(#|rank|ranking|pos|position|place|pl|lp)$/i,
  name: /^(athlete|athlete name|name|full name|nation|country name|team|team name)$/i,
  first: /^(first ?name|given name)$/i,
  last: /^(last ?name|surname|family name)$/i,
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
    const pos = Number(String(r[c.pos] ?? '').replace(/[^\d]/g, ''));
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

function tableFromHtml(html) {
  const rows = [];
  for (const tr of html.matchAll(/<tr[^>]*>([\s\S]*?)<\/tr>/gi)) {
    rows.push([...tr[1].matchAll(/<t[hd][^>]*>([\s\S]*?)<\/t[hd]>/gi)].map(m => decode(m[1].replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim())));
  }
  return rows;
}

export function parseRankingFile(buf) {
  if (buf[0] === 0x50 && buf[1] === 0x4b) return rowsFromTable(readXlsx(buf));
  if (buf[0] === 0xd0 && buf[1] === 0xcf) throw new Error('Plik jest w starym formacie XLS (Excel 97–2003), którego nie umiem odczytać. Daj znać – dodam obsługę.');
  const text = buf.toString('utf8').replace(/^﻿/, '');
  if (/<table/i.test(text)) return rowsFromTable(tableFromHtml(text));
  const sep = text.includes('\t') ? '\t' : text.split('\n')[0].includes(';') ? ';' : ',';
  return rowsFromTable(text.split(/\r?\n/).filter(l => l.trim()).map(l => l.split(sep).map(c => c.replace(/^"|"$/g, '').trim())));
}

export async function fetchWorldTriathlonRanking(params) {
  const url = params?.url || (params?.rankingId ? `https://triathlon.org/api/rankings/${params.rankingId}/export` : null);
  if (!url) throw new Error('Brak linku do pliku z rankingiem.');
  if (!/^https:\/\/([a-z0-9-]+\.)*triathlon\.org\//i.test(url)) throw new Error('Link musi prowadzić do triathlon.org.');
  const res = await fetch(url, {
    headers: { 'user-agent': 'Mozilla/5.0 (SportowyRytmDnia; ranking LA28)', accept: '*/*' },
    cache: 'no-store'
  });
  if (!res.ok) throw new Error(`triathlon.org odpowiedział ${res.status}.`);
  const buf = Buffer.from(await res.arrayBuffer());
  const type = res.headers.get('content-type') || '?';
  let rows = [];
  let peek = '';
  try {
    rows = parseRankingFile(buf);
  } catch (e) {
    throw new Error(`${e.message} [typ: ${type}, ${buf.length} B]`);
  }
  if (rows.length < 3) {
    try {
      peek = buf[0] === 0x50 && buf[1] === 0x4b
        ? readXlsx(buf).slice(0, 4).map(r => r.join(' | ')).join(' / ')
        : buf.toString('utf8', 0, 300).replace(/\s+/g, ' ');
    } catch {}
    throw new Error(`W pliku nie znalazłem tabeli rankingu [typ: ${type}, ${buf.length} B, początek: ${peek.slice(0, 300)}]`);
  }
  return rows;
}
