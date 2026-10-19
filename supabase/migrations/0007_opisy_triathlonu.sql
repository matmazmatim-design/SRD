-- Opisy konkurencji triathlonu: bez „pierwszego medalu igrzysk”, sztafeta z trasą LA28.
update public.konkurencje k
set opis = '1,5 km pływania, 40 km roweru, 10 km biegu.'
from public.dyscypliny d
where d.id = k.dyscyplina_id and d.slug = 'triathlon' and k.slug = 'kobiety';

update public.konkurencje k
set opis = 'Czworo zawodników startuje po kolei: kobieta, mężczyzna, kobieta, mężczyzna. Każdy pokonuje 350 m pływania, 6,6 km roweru i 1,6 km biegu.'
from public.dyscypliny d
where d.id = k.dyscyplina_id and d.slug = 'triathlon' and k.slug = 'sztafeta-mieszana';
