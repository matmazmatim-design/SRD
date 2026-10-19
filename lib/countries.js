// Polskie nazwy krajów. Klucz: angielska nazwa (jak w UCI, World Triathlon itd.) albo kod MKOl,
// zapisane wielkimi literami. Brak w słowniku → nazwa zostaje oryginalna, ładnie zapisana.

const NAMES = {
  AFGHANISTAN: 'Afganistan', ALBANIA: 'Albania', ALGERIA: 'Algieria', ANDORRA: 'Andora', ANGOLA: 'Angola',
  'ANTIGUA AND BARBUDA': 'Antigua i Barbuda', ARGENTINA: 'Argentyna', ARMENIA: 'Armenia', ARUBA: 'Aruba',
  AUSTRALIA: 'Australia', AUSTRIA: 'Austria', AZERBAIJAN: 'Azerbejdżan',
  BAHAMAS: 'Bahamy', BAHRAIN: 'Bahrajn', BANGLADESH: 'Bangladesz', BARBADOS: 'Barbados', BELARUS: 'Białoruś',
  BELGIUM: 'Belgia', BELIZE: 'Belize', BENIN: 'Benin', BERMUDA: 'Bermudy', BHUTAN: 'Bhutan', BOLIVIA: 'Boliwia',
  'BOSNIA AND HERZEGOVINA': 'Bośnia i Hercegowina', 'BOSNIA & HERZEGOVINA': 'Bośnia i Hercegowina',
  BOTSWANA: 'Botswana', BRAZIL: 'Brazylia', 'BRITISH VIRGIN ISLANDS': 'Brytyjskie Wyspy Dziewicze',
  BRUNEI: 'Brunei', BULGARIA: 'Bułgaria', 'BURKINA FASO': 'Burkina Faso', BURUNDI: 'Burundi',
  CAMBODIA: 'Kambodża', CAMEROON: 'Kamerun', CANADA: 'Kanada', 'CAPE VERDE': 'Republika Zielonego Przylądka',
  'CAYMAN ISLANDS': 'Kajmany', 'CENTRAL AFRICAN REPUBLIC': 'Republika Środkowoafrykańska', CHAD: 'Czad',
  CHILE: 'Chile', CHINA: 'Chiny', "PEOPLE'S REPUBLIC OF CHINA": 'Chiny', 'CHINESE TAIPEI': 'Chińskie Tajpej',
  COLOMBIA: 'Kolumbia', COMOROS: 'Komory', CONGO: 'Kongo', 'DR CONGO': 'Demokratyczna Republika Konga',
  'DEMOCRATIC REPUBLIC OF THE CONGO': 'Demokratyczna Republika Konga', 'COOK ISLANDS': 'Wyspy Cooka',
  'COSTA RICA': 'Kostaryka', "COTE D'IVOIRE": 'Wybrzeże Kości Słoniowej', "CÔTE D'IVOIRE": 'Wybrzeże Kości Słoniowej',
  'IVORY COAST': 'Wybrzeże Kości Słoniowej', CROATIA: 'Chorwacja', CUBA: 'Kuba', CURACAO: 'Curaçao', CYPRUS: 'Cypr',
  CZECHIA: 'Czechy', 'CZECH REPUBLIC': 'Czechy',
  DENMARK: 'Dania', DJIBOUTI: 'Dżibuti', DOMINICA: 'Dominika', 'DOMINICAN REPUBLIC': 'Dominikana',
  ECUADOR: 'Ekwador', EGYPT: 'Egipt', 'EL SALVADOR': 'Salwador', 'EQUATORIAL GUINEA': 'Gwinea Równikowa',
  ERITREA: 'Erytrea', ESTONIA: 'Estonia', ESWATINI: 'Eswatini', ETHIOPIA: 'Etiopia',
  FIJI: 'Fidżi', FINLAND: 'Finlandia', FRANCE: 'Francja',
  GABON: 'Gabon', GAMBIA: 'Gambia', GEORGIA: 'Gruzja', GERMANY: 'Niemcy', GHANA: 'Ghana',
  'GREAT BRITAIN': 'Wielka Brytania', 'UNITED KINGDOM': 'Wielka Brytania', GREECE: 'Grecja', GRENADA: 'Grenada',
  GUAM: 'Guam', GUATEMALA: 'Gwatemala', GUINEA: 'Gwinea', 'GUINEA-BISSAU': 'Gwinea Bissau', GUYANA: 'Gujana',
  HAITI: 'Haiti', HONDURAS: 'Honduras', 'HONG KONG': 'Hongkong', 'HONG KONG, CHINA': 'Hongkong', HUNGARY: 'Węgry',
  ICELAND: 'Islandia', INDIA: 'Indie', INDONESIA: 'Indonezja', IRAN: 'Iran', 'ISLAMIC REPUBLIC OF IRAN': 'Iran',
  IRAQ: 'Irak', IRELAND: 'Irlandia', ISRAEL: 'Izrael', ITALY: 'Włochy',
  JAMAICA: 'Jamajka', JAPAN: 'Japonia', JORDAN: 'Jordania',
  KAZAKHSTAN: 'Kazachstan', KENYA: 'Kenia', KIRIBATI: 'Kiribati', KOSOVO: 'Kosowo', KUWAIT: 'Kuwejt',
  KYRGYZSTAN: 'Kirgistan', 'KOREA': 'Korea Południowa', 'SOUTH KOREA': 'Korea Południowa',
  'REPUBLIC OF KOREA': 'Korea Południowa', 'NORTH KOREA': 'Korea Północna', "DPR KOREA": 'Korea Północna',
  LAOS: 'Laos', LATVIA: 'Łotwa', LEBANON: 'Liban', LESOTHO: 'Lesotho', LIBERIA: 'Liberia', LIBYA: 'Libia',
  LIECHTENSTEIN: 'Liechtenstein', LITHUANIA: 'Litwa', LUXEMBOURG: 'Luksemburg',
  MACAO: 'Makau', MACAU: 'Makau', MADAGASCAR: 'Madagaskar', MALAWI: 'Malawi', MALAYSIA: 'Malezja',
  MALDIVES: 'Malediwy', MALI: 'Mali', MALTA: 'Malta', 'MARSHALL ISLANDS': 'Wyspy Marshalla',
  MAURITANIA: 'Mauretania', MAURITIUS: 'Mauritius', MEXICO: 'Meksyk', MICRONESIA: 'Mikronezja',
  MOLDOVA: 'Mołdawia', 'REPUBLIC OF MOLDOVA': 'Mołdawia', MONACO: 'Monako', MONGOLIA: 'Mongolia',
  MONTENEGRO: 'Czarnogóra', MOROCCO: 'Maroko', MOZAMBIQUE: 'Mozambik', MYANMAR: 'Mjanma',
  NAMIBIA: 'Namibia', NAURU: 'Nauru', NEPAL: 'Nepal', NETHERLANDS: 'Holandia', 'NEW ZEALAND': 'Nowa Zelandia',
  NICARAGUA: 'Nikaragua', NIGER: 'Niger', NIGERIA: 'Nigeria', 'NORTH MACEDONIA': 'Macedonia Północna', NORWAY: 'Norwegia',
  OMAN: 'Oman',
  PAKISTAN: 'Pakistan', PALAU: 'Palau', PALESTINE: 'Palestyna', PANAMA: 'Panama', 'PAPUA NEW GUINEA': 'Papua-Nowa Gwinea',
  PARAGUAY: 'Paragwaj', PERU: 'Peru', PHILIPPINES: 'Filipiny', POLAND: 'Polska', PORTUGAL: 'Portugalia',
  'PUERTO RICO': 'Portoryko',
  QATAR: 'Katar',
  ROMANIA: 'Rumunia', RUSSIA: 'Rosja', 'RUSSIAN FEDERATION': 'Rosja', RWANDA: 'Rwanda',
  'SAINT KITTS AND NEVIS': 'Saint Kitts i Nevis', 'SAINT LUCIA': 'Saint Lucia',
  'SAINT VINCENT AND THE GRENADINES': 'Saint Vincent i Grenadyny', SAMOA: 'Samoa', 'SAN MARINO': 'San Marino',
  'SAO TOME AND PRINCIPE': 'Wyspy Świętego Tomasza i Książęca', 'SAUDI ARABIA': 'Arabia Saudyjska', SENEGAL: 'Senegal',
  SERBIA: 'Serbia', SEYCHELLES: 'Seszele', 'SIERRA LEONE': 'Sierra Leone', SINGAPORE: 'Singapur', SLOVAKIA: 'Słowacja',
  SLOVENIA: 'Słowenia', 'SOLOMON ISLANDS': 'Wyspy Salomona', SOMALIA: 'Somalia', 'SOUTH AFRICA': 'Republika Południowej Afryki',
  'SOUTH SUDAN': 'Sudan Południowy', SPAIN: 'Hiszpania', 'SRI LANKA': 'Sri Lanka', SUDAN: 'Sudan', SURINAME: 'Surinam',
  SWEDEN: 'Szwecja', SWITZERLAND: 'Szwajcaria', SYRIA: 'Syria',
  TAJIKISTAN: 'Tadżykistan', TANZANIA: 'Tanzania', THAILAND: 'Tajlandia', 'TIMOR-LESTE': 'Timor Wschodni', TOGO: 'Togo',
  TONGA: 'Tonga', 'TRINIDAD AND TOBAGO': 'Trynidad i Tobago', TUNISIA: 'Tunezja', TURKEY: 'Turcja', 'TÜRKIYE': 'Turcja',
  TURKIYE: 'Turcja', TURKMENISTAN: 'Turkmenistan', TUVALU: 'Tuvalu',
  UGANDA: 'Uganda', UKRAINE: 'Ukraina', 'UNITED ARAB EMIRATES': 'Zjednoczone Emiraty Arabskie',
  'UNITED STATES': 'Stany Zjednoczone', 'UNITED STATES OF AMERICA': 'Stany Zjednoczone', USA: 'Stany Zjednoczone',
  URUGUAY: 'Urugwaj', UZBEKISTAN: 'Uzbekistan',
  VANUATU: 'Vanuatu', VENEZUELA: 'Wenezuela', VIETNAM: 'Wietnam', 'VIET NAM': 'Wietnam',
  'VIRGIN ISLANDS': 'Wyspy Dziewicze Stanów Zjednoczonych', 'US VIRGIN ISLANDS': 'Wyspy Dziewicze Stanów Zjednoczonych',
  YEMEN: 'Jemen', ZAMBIA: 'Zambia', ZIMBABWE: 'Zimbabwe'
};

// Kody MKOl (używane np. w rankingach zawodników)
const IOC = {
  ALB: 'ALBANIA', ALG: 'ALGERIA', AND: 'ANDORRA', ARG: 'ARGENTINA', ARM: 'ARMENIA', AUS: 'AUSTRALIA', AUT: 'AUSTRIA',
  AZE: 'AZERBAIJAN', BAH: 'BAHAMAS', BEL: 'BELGIUM', BER: 'BERMUDA', BLR: 'BELARUS', BOL: 'BOLIVIA', BRA: 'BRAZIL',
  BUL: 'BULGARIA', CAN: 'CANADA', CHI: 'CHILE', CHN: 'CHINA', COL: 'COLOMBIA', CRC: 'COSTA RICA', CRO: 'CROATIA',
  CUB: 'CUBA', CYP: 'CYPRUS', CZE: 'CZECHIA', DEN: 'DENMARK', DOM: 'DOMINICAN REPUBLIC', ECU: 'ECUADOR', EGY: 'EGYPT',
  ERI: 'ERITREA', ESA: 'EL SALVADOR', ESP: 'SPAIN', EST: 'ESTONIA', ETH: 'ETHIOPIA', FIN: 'FINLAND', FRA: 'FRANCE',
  GBR: 'GREAT BRITAIN', GEO: 'GEORGIA', GER: 'GERMANY', GRE: 'GREECE', GUA: 'GUATEMALA', HKG: 'HONG KONG',
  HUN: 'HUNGARY', INA: 'INDONESIA', IND: 'INDIA', IRI: 'IRAN', IRL: 'IRELAND', ISL: 'ICELAND', ISR: 'ISRAEL',
  ITA: 'ITALY', JAM: 'JAMAICA', JPN: 'JAPAN', KAZ: 'KAZAKHSTAN', KEN: 'KENYA', KGZ: 'KYRGYZSTAN', KOR: 'SOUTH KOREA',
  KOS: 'KOSOVO', KSA: 'SAUDI ARABIA', LAT: 'LATVIA', LIE: 'LIECHTENSTEIN', LTU: 'LITHUANIA', LUX: 'LUXEMBOURG',
  MAR: 'MOROCCO', MAS: 'MALAYSIA', MDA: 'MOLDOVA', MEX: 'MEXICO', MGL: 'MONGOLIA', MKD: 'NORTH MACEDONIA', MLT: 'MALTA',
  MNE: 'MONTENEGRO', MON: 'MONACO', NAM: 'NAMIBIA', NED: 'NETHERLANDS', NOR: 'NORWAY', NZL: 'NEW ZEALAND',
  PAN: 'PANAMA', PAR: 'PARAGUAY', PER: 'PERU', PHI: 'PHILIPPINES', POL: 'POLAND', POR: 'PORTUGAL', PUR: 'PUERTO RICO',
  QAT: 'QATAR', ROU: 'ROMANIA', RSA: 'SOUTH AFRICA', RWA: 'RWANDA', SGP: 'SINGAPORE', SLO: 'SLOVENIA', SMR: 'SAN MARINO',
  SRB: 'SERBIA', SUI: 'SWITZERLAND', SVK: 'SLOVAKIA', SWE: 'SWEDEN', THA: 'THAILAND', TPE: 'CHINESE TAIPEI',
  TTO: 'TRINIDAD AND TOBAGO', TUN: 'TUNISIA', TUR: 'TURKEY', UAE: 'UNITED ARAB EMIRATES', UGA: 'UGANDA', UKR: 'UKRAINE',
  URU: 'URUGUAY', USA: 'UNITED STATES', UZB: 'UZBEKISTAN', VEN: 'VENEZUELA', VIE: 'VIETNAM', ZIM: 'ZIMBABWE'
};

function titleCase(s) {
  return s.toLowerCase().replace(/(^|[\s\-'(])(\p{L})/gu, (m, a, b) => a + b.toUpperCase());
}

// Polska nazwa kraju albo oryginał (ładnie zapisany, jeśli był WIELKIMI LITERAMI).
export function countryPl(value) {
  if (value === null || value === undefined) return value;
  const raw = String(value).trim();
  if (!raw) return raw;
  const key = raw.toUpperCase().replace(/\s+/g, ' ');
  if (NAMES[key]) return NAMES[key];
  if (IOC[key]) return NAMES[IOC[key]];
  return raw === raw.toUpperCase() && raw.length > 3 ? titleCase(raw) : raw;
}
