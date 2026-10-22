-- Gimnastyka sportowa – status Rosji (drużyna mężczyzn, srebro MŚ 2026). Można uruchomić ponownie.
-- MKOl 7.07.2026 przestał zalecać ograniczenia dla Rosjan i tymczasowo zniósł zawieszenie ROC;
-- World Gymnastics (FIG) od maja 2026 dopuszcza rosyjskich zawodników i drużyny do pełnych startów.

with k as (
  select k.id from public.konkurencje k join public.dyscypliny d on d.id = k.dyscyplina_id
  where d.slug = 'gimnastyka-sportowa' and k.slug = 'mezczyzni'
)
update public.kwoty q set kraj = 'RUS', status = 'ok',
  uwagi = 'Srebro – 250,329 pkt. W Rotterdamie startowali jako neutralni (WG2). FIG od maja 2026 dopuszcza Rosjan do pełnych startów, a MKOl 7.07.2026 tymczasowo zniósł zawieszenie Rosyjskiego Komitetu Olimpijskiego. Nie ma jeszcze decyzji, czy w LA28 wystąpią pod flagą i z hymnem.'
from k where q.konkurencja_id = k.id and q.kolejnosc = 3;
