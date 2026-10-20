-- Ranking sztafet mieszanych na stronie sztafety mieszanej, ze statusami krajów z algorytmu LA28.
update public.zrodla_rankingow z
set konkurencja_id = k.id,
    rodzaj = 'krajowy',
    zasady = jsonb_build_object(
      'algorytm', 'triathlon-sztafety',
      'zamkniecie', '2028-05-18',
      'pozostali', 'Ostatnia szansa poza rankingiem: MŚ sztafet mieszanych 2027 (jeden kraj, 2 kobiety + 2 mężczyzn).',
      'regulamin', 'https://cdn.nocnsf.nl/media/y12h0hkm/tri-la28-qualification-system.pdf'
    )
from public.konkurencje k
join public.dyscypliny d on d.id = k.dyscyplina_id
where z.slug = 'wt-sztafety' and d.slug = 'triathlon' and k.slug = 'sztafeta-mieszana';
