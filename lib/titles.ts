export interface Title {
  id: string;
  name: string;
  genre: string;
  year: number;
  rating: 'PG' | '13' | '16' | '18';
  durationMin: number;
  premium: boolean; // requires a paid tier to watch
  synopsis: string;
  cast: string[];
  gradient: [string, string];
  tag?: 'NEW' | 'TOP 10' | 'TRENDING' | 'ORIGINAL';
  badge4k?: boolean;
}

// Generated-art catalogue (no external media needed — every poster is a designed gradient).
export const TITLES: Title[] = [
  {
    id: 'lagos-nights',
    name: 'Lagos Nights',
    genre: 'Crime Drama',
    year: 2024,
    rating: '16',
    durationMin: 124,
    premium: true,
    tag: 'ORIGINAL',
    badge4k: true,
    synopsis:
      'A retired detective is pulled back into the underworld of Lagos when a string of heists exposes a betrayal close to home.',
    cast: ['Adaeze Okonkwo', 'Tunde Bakare', 'Zainab Sule'],
    gradient: ['#3a1c71', '#d76d77'],
  },
  {
    id: 'the-bride-price',
    name: 'The Bride Price',
    genre: 'Romance',
    year: 2023,
    rating: '13',
    durationMin: 108,
    premium: false,
    tag: 'TOP 10',
    synopsis:
      'Two families, one tradition, and a love that refuses to follow the rules. A warm, funny, heart-tugging Nollywood romance.',
    cast: ['Ngozi Eze', 'Daniel Etim'],
    gradient: ['#ee0979', '#ff6a00'],
  },
  {
    id: 'oil-money',
    name: 'Oil Money',
    genre: 'Thriller',
    year: 2024,
    rating: '18',
    durationMin: 141,
    premium: true,
    tag: 'TRENDING',
    badge4k: true,
    synopsis:
      'In the creeks of the Niger Delta, an idealistic engineer discovers a conspiracy that could topple an empire — if it does not bury her first.',
    cast: ['Funke Adeyemi', 'Emeka Nwosu', 'Bassey Okon'],
    gradient: ['#0f2027', '#2c5364'],
  },
  {
    id: 'aunty-blessing',
    name: "Aunty Blessing's Kitchen",
    genre: 'Comedy',
    year: 2023,
    rating: 'PG',
    durationMin: 96,
    premium: false,
    synopsis:
      'A loud, loving aunty turns her struggling buka into the most talked-about kitchen in the city — one scandal at a time.',
    cast: ['Patience Ojo', 'Segun Cole'],
    gradient: ['#f12711', '#f5af19'],
  },
  {
    id: 'the-prophet',
    name: 'The Prophet of Surulere',
    genre: 'Drama',
    year: 2024,
    rating: '16',
    durationMin: 133,
    premium: true,
    tag: 'NEW',
    synopsis:
      'A charismatic street preacher builds a following of thousands, until his past and his miracles are put on trial.',
    cast: ['Chidi Mokeme', 'Rita Dominic'],
    gradient: ['#42275a', '#734b6d'],
  },
  {
    id: 'naija-by-night',
    name: 'Naija By Night',
    genre: 'Action',
    year: 2022,
    rating: '18',
    durationMin: 118,
    premium: false,
    synopsis:
      'A getaway driver with one rule breaks it for the wrong client. Now the whole city is chasing him before dawn.',
    cast: ['Kelechi Udo', 'Maryam Bello'],
    gradient: ['#1f1c2c', '#928dab'],
  },
  {
    id: 'kano-gold',
    name: 'Kano Gold',
    genre: 'Adventure',
    year: 2024,
    rating: '13',
    durationMin: 127,
    premium: true,
    tag: 'ORIGINAL',
    badge4k: true,
    synopsis:
      'A trader, a map, and a legend buried under the old city. A sweeping treasure-hunt across northern Nigeria.',
    cast: ['Aliyu Garba', 'Hauwa Musa'],
    gradient: ['#c31432', '#240b36'],
  },
  {
    id: 'second-wife',
    name: 'Second Wife',
    genre: 'Drama',
    year: 2023,
    rating: '16',
    durationMin: 112,
    premium: false,
    tag: 'TOP 10',
    synopsis:
      'When a successful woman marries into a polygamous home, she rewrites the rules of the house — and pays the price.',
    cast: ['Omotola J.', 'Ramsey Noah'],
    gradient: ['#603813', '#b29f94'],
  },
  {
    id: 'campus-vibes',
    name: 'Campus Vibes',
    genre: 'Teen',
    year: 2024,
    rating: '13',
    durationMin: 92,
    premium: false,
    tag: 'NEW',
    synopsis:
      'Freshers, frenemies and final-year heartbreak. A buzzy series about growing up at the University of Lagos.',
    cast: ['Demi Banwo', 'Ife Coker'],
    gradient: ['#2193b0', '#6dd5ed'],
  },
  {
    id: 'the-last-king',
    name: 'The Last King of Benin',
    genre: 'Historical',
    year: 2024,
    rating: '16',
    durationMin: 156,
    premium: true,
    tag: 'TRENDING',
    badge4k: true,
    synopsis:
      'An epic retelling of the fall of the Benin Kingdom, and the one prince who tried to save a civilisation.',
    cast: ['Sani Danladi', 'Osas Ighodaro'],
    gradient: ['#8e0e00', '#1f1c18'],
  },
  {
    id: 'ajebutter',
    name: 'Ajebutter',
    genre: 'Comedy',
    year: 2022,
    rating: 'PG',
    durationMin: 101,
    premium: false,
    synopsis:
      'A pampered rich kid is forced to survive one month on the streets of Lagos. Hilarity, and humility, follow.',
    cast: ['Broda Shaggi', 'Nancy Isime'],
    gradient: ['#f7971e', '#ffd200'],
  },
  {
    id: 'silent-houses',
    name: 'Silent Houses',
    genre: 'Horror',
    year: 2024,
    rating: '18',
    durationMin: 99,
    premium: true,
    tag: 'NEW',
    synopsis:
      'A family moves into an abandoned estate in Enugu. The houses are quiet. They should not be.',
    cast: ['Bimbo Ademoye', 'Stan Nze'],
    gradient: ['#16222a', '#3a6073'],
  },
  {
    id: 'market-queens',
    name: 'Market Queens',
    genre: 'Drama',
    year: 2023,
    rating: '13',
    durationMin: 115,
    premium: false,
    synopsis:
      'The women who rule Balogun market wage a quiet war for power, respect, and the future of their daughters.',
    cast: ['Sola Sobowale', 'Kehinde Bankole'],
    gradient: ['#cb2d3e', '#ef473a'],
  },
  {
    id: 'afrobeat-dreams',
    name: 'Afrobeat Dreams',
    genre: 'Music',
    year: 2024,
    rating: '13',
    durationMin: 121,
    premium: true,
    tag: 'ORIGINAL',
    badge4k: true,
    synopsis:
      'From a Surulere bedroom studio to a sold-out O2 arena — the rise of a generation-defining Afrobeats star.',
    cast: ['Bella Shmurda', 'Ayra Bright'],
    gradient: ['#7b4397', '#dc2430'],
  },
  {
    id: 'the-fishermans-son',
    name: "The Fisherman's Son",
    genre: 'Drama',
    year: 2022,
    rating: 'PG',
    durationMin: 104,
    premium: false,
    synopsis:
      'A boy from a coastal village dreams beyond the tide. A tender, award-winning coming-of-age story.',
    cast: ['Gideon Okeke', 'Mercy Aigbe'],
    gradient: ['#005c97', '#363795'],
  },
  {
    id: 'abuja-connections',
    name: 'Abuja Connections',
    genre: 'Political Thriller',
    year: 2024,
    rating: '16',
    durationMin: 138,
    premium: true,
    tag: 'TRENDING',
    badge4k: true,
    synopsis:
      'A junior aide stumbles onto a file that could decide an election. Everyone wants it. No one can be trusted.',
    cast: ['Richard Mofe-Damijo', 'Nse Ikpe-Etim'],
    gradient: ['#232526', '#414345'],
  },
];

export const GENRES = [
  { key: 'trending', label: 'Trending Now', ids: ['oil-money', 'the-last-king', 'afrobeat-dreams', 'abuja-connections', 'silent-houses'] },
  { key: 'originals', label: 'Nollybox Originals', ids: ['lagos-nights', 'kano-gold', 'afrobeat-dreams', 'abuja-connections'] },
  { key: 'top10', label: 'Top 10 in Nigeria', ids: ['the-bride-price', 'second-wife', 'oil-money', 'the-last-king', 'campus-vibes', 'market-queens'] },
  { key: 'comedy', label: 'Comedy & Family', ids: ['aunty-blessing', 'ajebutter', 'campus-vibes', 'the-bride-price'] },
  { key: 'drama', label: 'Drama', ids: ['the-prophet', 'second-wife', 'market-queens', 'the-fishermans-son'] },
];

export function getTitle(id: string): Title | undefined {
  return TITLES.find((t) => t.id === id);
}
