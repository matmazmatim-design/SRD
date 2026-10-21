-- Łucznictwo: miejsca gospodarza (USA) są warunkowe – liczą się dopiero po starcie na MŚ 2027.
update public.kwoty q
set status = 'pending', uwagi = 'Warunkowo: USA muszą wystartować na MŚ 2027 (drużyna = 3 miejsca, 1–2 zawodników = po 1 miejscu).'
from public.konkurencje k join public.dyscypliny d on d.id = k.dyscyplina_id
where q.konkurencja_id = k.id and d.slug = 'lucznictwo' and q.sciezka = 'Gospodarz';
