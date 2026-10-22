-- Gimnastyka sportowa – wyniki finałów drużynowych MŚ 2026 (Rotterdam) i przeniesienie miejsca gospodarza u kobiet.
-- Kobiety: Chiny, USA, Japonia. Mężczyźni: Japonia, Rosja (WG2), Chiny. Można uruchomić ponownie.

with k as (
  select k.id from public.konkurencje k join public.dyscypliny d on d.id = k.dyscyplina_id
  where d.slug = 'gimnastyka-sportowa' and k.slug = 'kobiety'
)
update public.kwoty q set kraj = v.kraj, status = 'ok', uwagi = v.uwagi
from k, (values (2, 'CHN', 'Złoto – 165,764 pkt.'), (3, 'USA', 'Srebro – 165,531 pkt.'), (4, 'JPN', 'Brąz – 164,063 pkt.')) as v(kol, kraj, uwagi)
where q.konkurencja_id = k.id and q.kolejnosc = v.kol;

-- USA mają drużynę, więc indywidualne miejsce gospodarza przechodzi na kolejną zawodniczkę
-- z eliminacji wieloboju MŚ 2027 (z kraju bez drużyny).
with k as (
  select k.id from public.konkurencje k join public.dyscypliny d on d.id = k.dyscyplina_id
  where d.slug = 'gimnastyka-sportowa' and k.slug = 'kobiety'
)
update public.kwoty q set sciezka = 'Wielobój (imiennie)', zawody = 'Mistrzostwa świata 2027 – eliminacje wieloboju',
  data_zawodow = '2027-09-28', kraj = null, status = 'pending',
  uwagi = 'Miejsce gospodarza przeniesione – USA mają drużynę z MŚ 2026. Trafia do kolejnej zawodniczki z wieloboju (kraj bez drużyny).'
from k where q.konkurencja_id = k.id and q.kolejnosc = 1;

with k as (
  select k.id from public.konkurencje k join public.dyscypliny d on d.id = k.dyscyplina_id
  where d.slug = 'gimnastyka-sportowa' and k.slug = 'mezczyzni'
)
update public.kwoty q set kraj = v.kraj, status = v.status, uwagi = v.uwagi
from k, (values (2, 'JPN', 'ok', 'Złoto – 251,928 pkt.'),
                (3, 'RUS', 'pending', 'Srebro – 250,329 pkt. (jako WG2). Start Rosji w LA28 zależy od decyzji MKOl.'),
                (4, 'CHN', 'ok', 'Brąz – 249,193 pkt.')) as v(kol, kraj, status, uwagi)
where q.konkurencja_id = k.id and q.kolejnosc = v.kol;

update public.terminy t set opis = 'Finał drużynowy: kobiety – Chiny, USA, Japonia; mężczyźni – Japonia, Rosja (WG2), Chiny.'
from public.dyscypliny d where d.id = t.dyscyplina_id and d.slug = 'gimnastyka-sportowa' and t.data_od = '2026-10-17';
