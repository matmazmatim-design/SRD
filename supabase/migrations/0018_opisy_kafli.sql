-- Jednolite opisy kafli: co jest w środku dyscypliny (bez stanu Polaków, który się zmienia).
update public.dyscypliny set opis_kafla = 'Kobiety, mężczyźni i drużyny mieszane · ranking OGR' where slug = 'golf';
update public.dyscypliny set opis_kafla = 'Kobiety, mężczyźni i sztafeta mieszana · IOQR' where slug = 'triathlon';
update public.dyscypliny set opis_kafla = 'Szosa, tor, MTB, BMX · ranking MTB' where slug = 'kolarstwo';
update public.dyscypliny set opis_kafla = 'Łuk klasyczny i bloczkowy · miejsca z zawodów' where slug = 'lucznictwo';
