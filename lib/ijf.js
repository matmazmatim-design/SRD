// Ranking olimpijski IJF (judo) – strona ijf.org/wrl_olympic ma dane rankingu wbudowane w HTML
// (obiekt _CONF → "wrlBrowserOlympic" → data.rows). Kategorie: id_weight 1–7 mężczyźni (−60…+100), 8–14 kobiety (−48…+78).

export const IJF_WEIGHTS = {
  1: '−60 kg', 2: '−66 kg', 3: '−73 kg', 4: '−81 kg', 5: '−90 kg', 6: '−100 kg', 7: '+100 kg',
  8: '−48 kg', 9: '−52 kg', 10: '−57 kg', 11: '−63 kg', 12: '−70 kg', 13: '−78 kg', 14: '+78 kg'
};

function cap(s) {
  return String(s || '').toLowerCase().replace(/(^|[\s-])(\p{L})/gu, (m, a, b) => a + b.toUpperCase());
}

// Wyciąga obiekt JSON zaczynający się od pierwszej klamry po znaczniku (liczy nawiasy, pomija napisy)
function jsonAfter(text, marker) {
  const i = text.indexOf(marker);
  if (i < 0) return null;
  const start = text.indexOf('{', i + marker.length);
  if (start < 0) return null;
  let depth = 0, inStr = false, esc = false;
  for (let j = start; j < text.length; j++) {
    const c = text[j];
    if (inStr) {
      if (esc) esc = false;
      else if (c === '\\') esc = true;
      else if (c === '"') inStr = false;
      continue;
    }
    if (c === '"') inStr = true;
    else if (c === '{') depth++;
    else if (c === '}' && --depth === 0) return JSON.parse(text.slice(start, j + 1));
  }
  return null;
}

// HTML strony rankingu → wiersze notowania. Działa w przeglądarce (wgrany plik) i na serwerze.
export function parseIjfOlympicHtml(html) {
  const block = jsonAfter(html, '"wrlBrowserOlympic"');
  const rows = block?.data?.rows;
  if (!Array.isArray(rows) || !rows.length) throw new Error('Nie znalazłem rankingu IJF na stronie (brak danych „wrlBrowserOlympic”).');
  const category = String(block.filters?.category ?? rows[0].id_weight ?? '');
  return {
    category,
    weight: IJF_WEIGHTS[category] || rows[0].weight_name || null,
    rows: rows
      .filter(r => Number(r.place) > 0 && r.family_name)
      .map(r => ({
        pozycja: Number(r.place),
        zawodnik: `${cap(r.given_name)} ${cap(r.family_name)}`.trim(),
        kraj: r.country_name || null,
        kod_kraju: r.country_ioc_code ? String(r.country_ioc_code).toUpperCase() : null,
        punkty: r.sum_points ?? null,
        dodatkowe: { ijf_q_status: r.q_status ?? null, id_person: r.id_person ?? null }
      }))
  };
}

export async function fetchIjfOlympicRanking(params = {}) {
  const cat = String(params.category || '').trim();
  if (!IJF_WEIGHTS[cat]) throw new Error('Brak kategorii IJF (1–14) w parametrach źródła.');
  const res = await fetch(`https://www.ijf.org/wrl_olympic?category=${cat}`, {
    headers: {
      accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      'accept-language': 'en-US,en;q=0.9,pl;q=0.8',
      'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36'
    },
    cache: 'no-store'
  });
  if (!res.ok) throw new Error(`ijf.org odpowiedział ${res.status}. Zapisz stronę rankingu (Ctrl+S) i wgraj plik w panelu.`);
  const parsed = parseIjfOlympicHtml(await res.text());
  if (parsed.category !== cat) throw new Error(`ijf.org zwrócił kategorię ${parsed.weight || parsed.category} zamiast ${IJF_WEIGHTS[cat]}.`);
  return parsed.rows;
}
