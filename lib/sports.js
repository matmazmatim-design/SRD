// Program sportowy LA28 (lista organizatorów igrzysk + boks, zatwierdzony przez MKOl w marcu 2025).
// Na razie dane statyczne – w etapie „Baza danych” przeniesiemy je do Supabase.

export const SPORTS = [
  { slug: 'badminton', name: 'Badminton' },
  { slug: 'baseball', name: 'Baseball', badge: 'Powrót' },
  { slug: 'boks', name: 'Boks' },
  { slug: 'flag-football', name: 'Flag football', badge: 'Nowość' },
  { slug: 'gimnastyka-sportowa', name: 'Gimnastyka sportowa' },
  { slug: 'gimnastyka-artystyczna', name: 'Gimnastyka artystyczna' },
  { slug: 'gimnastyka-trampoliny', name: 'Skoki na trampolinie' },
  { slug: 'golf', name: 'Golf', tracked: true, detail: 'M: Meronk – ścieżka: ranking olimpijski (OGR)' },
  { slug: 'hokej-na-trawie', name: 'Hokej na trawie' },
  { slug: 'jezdziectwo', name: 'Jeździectwo' },
  { slug: 'judo', name: 'Judo' },
  { slug: 'kajakarstwo', name: 'Kajakarstwo' },
  { slug: 'kolarstwo', name: 'Kolarstwo' },
  { slug: 'koszykowka', name: 'Koszykówka' },
  { slug: 'krykiet', name: 'Krykiet', badge: 'Nowość' },
  { slug: 'lacrosse', name: 'Lacrosse', badge: 'Nowość' },
  { slug: 'lekkoatletyka', name: 'Lekkoatletyka' },
  { slug: 'lucznictwo', name: 'Łucznictwo' },
  { slug: 'pilka-nozna', name: 'Piłka nożna' },
  { slug: 'pilka-reczna', name: 'Piłka ręczna' },
  { slug: 'piecioboj-nowoczesny', name: 'Pięciobój nowoczesny' },
  { slug: 'podnoszenie-ciezarow', name: 'Podnoszenie ciężarów' },
  { slug: 'rugby', name: 'Rugby' },
  { slug: 'siatkowka', name: 'Siatkówka' },
  { slug: 'skateboarding', name: 'Skateboarding' },
  { slug: 'softball', name: 'Softball', badge: 'Powrót' },
  { slug: 'sporty-wodne', name: 'Sporty wodne' },
  { slug: 'squash', name: 'Squash', badge: 'Nowość' },
  { slug: 'strzelectwo', name: 'Strzelectwo' },
  { slug: 'surfing', name: 'Surfing' },
  { slug: 'szermierka', name: 'Szermierka' },
  { slug: 'taekwondo', name: 'Taekwondo' },
  { slug: 'tenis', name: 'Tenis' },
  { slug: 'tenis-stolowy', name: 'Tenis stołowy' },
  { slug: 'triathlon', name: 'Triathlon', tracked: true, detail: 'M: Gajda – ścieżka: realokacja' },
  { slug: 'wioslarstwo', name: 'Wioślarstwo' },
  { slug: 'wspinaczka-sportowa', name: 'Wspinaczka sportowa' },
  { slug: 'zapasy', name: 'Zapasy' },
  { slug: 'zeglarstwo', name: 'Żeglarstwo' }
];

export function getSport(slug) {
  return SPORTS.find(s => s.slug === slug) || null;
}
