-- Siatkówka halowa: czytelne nazwy mistrzostw kontynentów 2026. Można uruchomić ponownie.
update public.kwoty q set zawody = v.nowe
from (values
  ('Mistrzostwa kontynentu 2026 – Europa', 'Mistrzostwa Europy 2026'),
  ('Mistrzostwa kontynentu 2026 – Ameryka Południowa', 'Mistrzostwa Ameryki Południowej 2026'),
  ('Mistrzostwa kontynentu 2026 – NORCECA', 'Mistrzostwa NORCECA 2026'),
  ('Mistrzostwa kontynentu 2026 – Azja', 'Mistrzostwa Azji 2026'),
  ('Mistrzostwa kontynentu 2026 – Afryka', 'Mistrzostwa Afryki 2026')
) as v(stare, nowe), public.konkurencje k, public.dyscypliny d
where q.zawody = v.stare and q.konkurencja_id = k.id and k.dyscyplina_id = d.id and d.slug = 'siatkowka-halowa';
