-- Judo: ranking olimpijski IJF – 14 kategorii, pobierane co noc ze strony ijf.org/wrl_olympic.
-- W każdej kategorii 17 najlepszych krajów (1 zawodnik z kraju) dostaje wirtualne miejsca; USA mają miejsce gospodarza.
-- Kwoty kontynentalne: zawodnicy oznaczeni przez IJF (q_status 2) trafiają na wolne miejsca „Kwoty kontynentalne”. Można uruchomić ponownie.
alter table public.zrodla_rankingow drop constraint if exists zrodla_rankingow_typ_check;
alter table public.zrodla_rankingow add constraint zrodla_rankingow_typ_check
  check (typ in ('uci', 'world_triathlon', 'owgr', 'rolex', 'worldarchery', 'ijf', 'wklejka'));

insert into public.zrodla_rankingow (slug, nazwa, typ, rodzaj, parametry, adres_strony, konkurencja_id, zasady)
select v.slug, v.nazwa, 'ijf', 'indywidualny', jsonb_build_object('category', v.cat),
  'https://www.ijf.org/wrl_olympic?category=' || v.cat, k.id,
  jsonb_build_object('algorytm', 'kwoty-ranking', 'sciezka', v.kat, 'tylko_sciezka', true, 'jeden_na_kraj', true, 'kontynentalne', 'Kwoty kontynentalne',
    'zamkniecie', '2028-06-12',
    'pozostali', 'Poza top 17: kwoty kontynentalne (104 miejsca łącznie) – zaznaczamy zawodników, których IJF oznacza jako kwotę kontynentalną.')
from (values
  ('ijf-m60', 'Judo – ranking olimpijski IJF, mężczyźni −60 kg', 'mezczyzni', 1, '−60 kg'),
  ('ijf-m66', 'Judo – ranking olimpijski IJF, mężczyźni −66 kg', 'mezczyzni', 2, '−66 kg'),
  ('ijf-m73', 'Judo – ranking olimpijski IJF, mężczyźni −73 kg', 'mezczyzni', 3, '−73 kg'),
  ('ijf-m81', 'Judo – ranking olimpijski IJF, mężczyźni −81 kg', 'mezczyzni', 4, '−81 kg'),
  ('ijf-m90', 'Judo – ranking olimpijski IJF, mężczyźni −90 kg', 'mezczyzni', 5, '−90 kg'),
  ('ijf-m100', 'Judo – ranking olimpijski IJF, mężczyźni −100 kg', 'mezczyzni', 6, '−100 kg'),
  ('ijf-mp100', 'Judo – ranking olimpijski IJF, mężczyźni +100 kg', 'mezczyzni', 7, '+100 kg'),
  ('ijf-k48', 'Judo – ranking olimpijski IJF, kobiety −48 kg', 'kobiety', 8, '−48 kg'),
  ('ijf-k52', 'Judo – ranking olimpijski IJF, kobiety −52 kg', 'kobiety', 9, '−52 kg'),
  ('ijf-k57', 'Judo – ranking olimpijski IJF, kobiety −57 kg', 'kobiety', 10, '−57 kg'),
  ('ijf-k63', 'Judo – ranking olimpijski IJF, kobiety −63 kg', 'kobiety', 11, '−63 kg'),
  ('ijf-k70', 'Judo – ranking olimpijski IJF, kobiety −70 kg', 'kobiety', 12, '−70 kg'),
  ('ijf-k78', 'Judo – ranking olimpijski IJF, kobiety −78 kg', 'kobiety', 13, '−78 kg'),
  ('ijf-kp78', 'Judo – ranking olimpijski IJF, kobiety +78 kg', 'kobiety', 14, '+78 kg')
) as v(slug, nazwa, ev, cat, kat)
join public.dyscypliny d on d.slug = 'judo'
join public.konkurencje k on k.dyscyplina_id = d.id and k.slug = v.ev
on conflict (slug) do update set zasady = excluded.zasady, parametry = excluded.parametry, typ = excluded.typ, konkurencja_id = excluded.konkurencja_id;
