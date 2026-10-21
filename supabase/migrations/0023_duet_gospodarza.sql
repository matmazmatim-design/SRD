-- Pływanie artystyczne: duet USA jako miejsce gospodarza (a nie „kraj z drużyną”).
update public.kwoty q
set sciezka = 'Gospodarz', zawody = 'Stany Zjednoczone – gospodarz', data_zawodow = '2027-08-17',
    kraj = 'USA', status = 'ok', uwagi = 'Gospodarz ma drużynę i duet (z kadry drużyny).'
from public.konkurencje k join public.dyscypliny d on d.id = k.dyscyplina_id
where q.konkurencja_id = k.id and d.slug = 'plywanie-artystyczne' and k.slug = 'duety' and q.kolejnosc = 1;

update public.kwoty q
set zawody = 'Duet z kadry drużyny (automatycznie dla krajów z drużyną)'
from public.konkurencje k join public.dyscypliny d on d.id = k.dyscyplina_id
where q.konkurencja_id = k.id and d.slug = 'plywanie-artystyczne' and k.slug = 'duety' and q.sciezka = 'Kraje z drużyną';
