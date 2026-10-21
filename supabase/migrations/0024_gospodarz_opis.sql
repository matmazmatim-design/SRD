-- Pływanie artystyczne: jaśniejszy opis miejsc gospodarza (bez daty, która wyglądała jak termin zawodów).
update public.kwoty q
set data_zawodow = null,
    uwagi = case k.slug
      when 'druzyny' then 'Miejsce przysługuje USA jako gospodarzowi. Wystarczy, że formalnie je przyjmą (do 17.08.2027).'
      else 'Gospodarz dostaje też duet – z zawodniczek swojej drużyny.'
    end
from public.konkurencje k join public.dyscypliny d on d.id = k.dyscyplina_id
where q.konkurencja_id = k.id and d.slug = 'plywanie-artystyczne' and q.sciezka = 'Gospodarz';
