// Rozpoznawanie tabeli wklejonej ze strony (Ctrl+A, Ctrl+C) albo z Excela.
// Zwraca wiersze { pozycja, zawodnik, kraj, kod_kraju, punkty } i opis wykrytych kolumn.

function toNumber(s) {
  if (s === undefined || s === null) return NaN;
  const t = String(s).trim().replace(/\s/g, '').replace(/^#/, '').replace(/\.$/, '');
  if (!t) return NaN;
  // 1 234,56 / 1,234.56 / 1234,56
  const norm = /,\d{1,3}$/.test(t) && !/\.\d+,/.test(t) ? t.replace(/\./g, '').replace(',', '.') : t.replace(/,/g, '');
  return /^-?\d+(\.\d+)?$/.test(norm) ? Number(norm) : NaN;
}

function splitLine(line) {
  if (line.includes('\t')) return line.split('\t').map(c => c.trim());
  if (line.includes(';')) return line.split(';').map(c => c.trim());
  if ((line.match(/,/g) || []).length >= 2) return line.split(',').map(c => c.trim());
  return line.split(/\s{2,}/).map(c => c.trim());
}

const HEADER = /^(rank|pos|position|#|lp|miejsce|pozycja|name|zawodnik|nazwisko|rider|athlete|nation|country|kraj|team|points|pts|punkty)$/i;

export function parsePastedTable(text) {
  const lines = String(text || '').split(/\r?\n/).map(l => l.trimEnd()).filter(l => l.trim());
  let rows = lines.map(splitLine).filter(cells => cells.filter(Boolean).length >= 2);
  if (rows.length === 0) return { rows: [], columns: null, skipped: lines.length };

  // Odrzuć wiersz nagłówka
  let header = null;
  if (rows[0].filter(c => HEADER.test(c)).length >= 2) header = rows.shift();

  const width = Math.max(...rows.map(r => r.length));
  const stats = Array.from({ length: width }, (_, i) => {
    const vals = rows.map(r => r[i]).filter(v => v !== undefined && v !== '');
    const nums = vals.map(toNumber).filter(n => !Number.isNaN(n));
    const avgLen = vals.reduce((s, v) => s + v.length, 0) / (vals.length || 1);
    const code = vals.filter(v => /^[A-Z]{3}$/.test(v)).length;
    const letters = vals.filter(v => /\p{L}{2,}/u.test(v)).length;
    const ints = nums.filter(n => Number.isInteger(n) && n > 0).length;
    return { i, filled: vals.length, numeric: nums.length / (vals.length || 1), avgLen, code: code / (vals.length || 1), letters: letters / (vals.length || 1), ints };
  });

  const byHeader = re => header ? header.findIndex(h => re.test(h)) : -1;
  let posCol = byHeader(/^(rank|pos|position|#|lp|miejsce|pozycja)$/i);
  let ptsCol = byHeader(/^(points|pts|punkty)$/i);
  let nameCol = byHeader(/^(name|zawodnik|nazwisko|rider|athlete)$/i);
  let countryCol = byHeader(/^(nation|country|kraj)$/i);

  const numericCols = stats.filter(s => s.numeric > 0.8).map(s => s.i);
  if (posCol < 0) posCol = numericCols.find(i => stats[i].ints === stats[i].filled) ?? -1;
  if (ptsCol < 0) ptsCol = [...numericCols].reverse().find(i => i !== posCol) ?? -1;
  const textCols = stats.filter(s => s.letters > 0.6 && s.i !== posCol && s.i !== ptsCol);
  if (nameCol < 0) nameCol = textCols.filter(s => s.code < 0.5).sort((a, b) => b.avgLen - a.avgLen)[0]?.i ?? -1;
  if (countryCol < 0) countryCol = (textCols.find(s => s.code > 0.6) || textCols.find(s => s.i !== nameCol))?.i ?? -1;

  if (nameCol < 0) return { rows: [], columns: null, skipped: lines.length, error: 'Nie rozpoznałem kolumny z nazwiskami.' };

  const out = [];
  rows.forEach((r, idx) => {
    let name = (r[nameCol] || '').trim();
    if (!name) return;
    // „Vasco Vilaca (POR)” / „France (FRA)” – kod kraju w nawiasie przy nazwie
    const inName = name.match(/^(.*\S)\s*\(([A-Z]{3})\)$/);
    if (inName) name = inName[1];
    const pos = posCol >= 0 ? toNumber(r[posCol]) : NaN;
    const pts = ptsCol >= 0 ? toNumber(r[ptsCol]) : NaN;
    const country = countryCol >= 0 && countryCol !== nameCol ? (r[countryCol] || '').trim() : (inName ? inName[2] : '');
    out.push({
      pozycja: Number.isFinite(pos) ? pos : out.length + 1,
      zawodnik: name,
      kraj: country && !/^[A-Z]{3}$/.test(country) ? country : null,
      kod_kraju: /^[A-Z]{3}$/.test(country) ? country : (inName ? inName[2] : null),
      punkty: Number.isFinite(pts) ? pts : null
    });
  });
  return {
    rows: out,
    columns: { pozycja: posCol, zawodnik: nameCol, kraj: countryCol, punkty: ptsCol },
    skipped: lines.length - out.length - (header ? 1 : 0)
  };
}
