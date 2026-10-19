-- Sportowy Rytm Dnia · Kwalifikacje LA28
-- 0003: funkcja sprawdzająca admina przeniesiona do schematu niewystawionego w API
-- (zalecenie doradcy bezpieczeństwa Supabase: SECURITY DEFINER nie powinna być dostępna przez /rest/v1/rpc).

create schema if not exists prywatne;
grant usage on schema prywatne to authenticated;

create or replace function prywatne.jest_adminem()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (select 1 from public.admini where user_id = auth.uid());
$$;

revoke all on function prywatne.jest_adminem() from public, anon;
grant execute on function prywatne.jest_adminem() to authenticated;

do $$
declare t text;
begin
  foreach t in array array['dyscypliny','konkurencje','zrodla_rankingow','notowania','wiersze_notowan','symulacje','wiersze_symulacji','kwalifikacje','terminy']
  loop
    execute format('drop policy if exists "zapis admin" on public.%I', t);
    execute format('create policy "zapis admin" on public.%I for all to authenticated using (prywatne.jest_adminem()) with check (prywatne.jest_adminem())', t);
  end loop;
end $$;

drop function if exists public.jest_adminem();
