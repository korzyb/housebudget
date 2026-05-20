// Helper do pracy z kategoriami. Lista wbudowanych kategorii jest "źródłem prawdy"
// też w bazie (seed w docs/supabase-schema.sql) — ten plik daje fallback gdy baza
// nie zwróci kategorii, plus helpery.

import { store } from './store.js';

export const BUILTIN_CATEGORIES = [
  { slug: 'food',       name: 'Jedzenie',              icon: 'shopping-cart',   color: '#34d399', bg: 'var(--cat-food-bg)',
    hint: 'zakupy spożywcze (Biedronka, Lidl, Carrefour, Frisco), piekarnia, słodycze, alkohol ze sklepu' },
  { slug: 'dining',     name: 'Jedzenie poza domem',   icon: 'utensils',        color: '#fb923c', bg: 'var(--cat-dining-bg)',
    hint: 'restauracje, fast food (McDonald\'s, KFC, Burger King), pizzeria, sushi, kebab, kawiarnia, kawa na mieście, lody, bar' },
  { slug: 'transport',  name: 'Transport',             icon: 'car',             color: '#6366f1', bg: 'var(--cat-transport-bg)',
    hint: 'paliwo (Orlen, Shell, BP), MPK, ZTM, taxi, Uber, Bolt, parkingi, opłaty drogowe, naprawy/serwis auta' },
  { slug: 'fun',        name: 'Rozrywka',              icon: 'gamepad-2',       color: '#8b5cf6', bg: 'var(--cat-fun-bg)',
    hint: 'kino, koncerty, eventy, gry, książki, hobby, sport rekreacyjny, wyjścia ze znajomymi (nie restauracje)' },
  { slug: 'home',       name: 'Dom',         icon: 'home',          color: '#f59e0b', bg: 'var(--cat-home-bg)',
    hint: 'czynsz, prąd, gaz, woda, internet, meble, AGD, RTV, IKEA, Castorama, remonty, ogród' },
  { slug: 'health',     name: 'Zdrowie',     icon: 'heart-pulse',   color: '#f87171', bg: 'var(--cat-health-bg)',
    hint: 'apteka, leki, wizyty lekarskie, dentysta, fizjoterapia, okulary, kosmetyki/drogeria (Rossmann, Hebe)' },
  { slug: 'kids',       name: 'Dzieci',      icon: 'baby',          color: '#f472b6', bg: 'var(--cat-kids-bg)',
    hint: 'zabawki, ubrania dla dzieci, pieluchy, szkoła, przedszkole, książki dziecięce, zajęcia dodatkowe' },
  { slug: 'travel',     name: 'Wyjazdy',     icon: 'plane',         color: '#22d3ee', bg: 'var(--cat-travel-bg)',
    hint: 'bilety lotnicze/kolejowe, hotele, Airbnb, Booking, wakacje, urlop, wycieczki' },
  { slug: 'subs',       name: 'Subskrypcje', icon: 'smartphone',    color: '#a78bfa', bg: 'var(--cat-subs-bg)',
    hint: 'Netflix, Spotify, YouTube Premium, abonament telefoniczny, chmury (iCloud, Google), SaaS' },
  { slug: 'loans',      name: 'Spłaty rat',  icon: 'credit-card',   color: '#475569', bg: 'var(--cat-loans-bg)',
    hint: 'rata kredytu, leasing samochodu/sprzętu, pożyczki, raty 0%, zakupy na raty (Allegro Pay, PayU Później)' },
  { slug: 'extra',      name: 'Dodatkowe wydatki', icon: 'wallet',      color: '#14b8a6', bg: 'var(--cat-extra-bg)',
    hint: 'ubrania, prezenty, elektronika, AGD, zakupy na Allegro/Amazon, wydatki których nie spodziewałeś się w tym miesiącu' },
  { slug: 'other',      name: 'Inne',              icon: 'package',     color: '#94a3b8', bg: 'var(--cat-other-bg)',
    hint: 'cokolwiek co nie pasuje do pozostałych kategorii — darowizny, różne drobne, opłaty bankowe' },
];

const CATEGORY_SHORT_LABELS = {
  food:      'zakupy spożywcze',
  dining:    'restauracja / jedzenie',
  transport: 'transport / paliwo',
  fun:       'rozrywka',
  home:      'dom / media',
  health:    'zdrowie / drogeria',
  kids:      'dzieci / edukacja',
  travel:    'podróż',
  subs:      'subskrypcja / abonament',
  loans:     'rata / kredyt',
  extra:     'dodatkowe wydatki',
  other:     'inne',
};

// Krótki opis kategorii do automatycznego wypełniania pola "opis" rachunku.
// Zwraca null gdy slug nieznany — caller może pominąć pole.
export function autoDescription(slug) {
  if (!slug) return null;
  return CATEGORY_SHORT_LABELS[slug] || null;
}

export function getCategoryHint(idOrSlug) {
  if (!idOrSlug) return null;
  const storeCat = store.categories.find(c => c.id === idOrSlug || c.slug === idOrSlug);
  const slug = storeCat?.slug || idOrSlug;
  return BUILTIN_CATEGORIES.find(b => b.slug === slug)?.hint || null;
}

export function bgForColor(hex) {
  // Konwertuje hex na rgba(...,0.16). Używane gdy custom category nie ma bg.
  if (!hex || !hex.startsWith('#')) return 'var(--surface-2)';
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, 0.16)`;
}

export function getCategory(idOrSlug) {
  if (!idOrSlug) return null;
  return store.categories.find(c => c.id === idOrSlug || c.slug === idOrSlug) || null;
}

export function categoryColor(c) {
  if (!c) return 'var(--text-muted)';
  return c.color || 'var(--text-muted)';
}

export function categoryBg(c) {
  if (!c) return 'var(--surface-2)';
  if (c.slug) {
    const map = {
      food:      'var(--cat-food-bg)',
      dining:    'var(--cat-dining-bg)',
      transport: 'var(--cat-transport-bg)',
      fun:       'var(--cat-fun-bg)',
      home:      'var(--cat-home-bg)',
      health:    'var(--cat-health-bg)',
      kids:      'var(--cat-kids-bg)',
      travel:    'var(--cat-travel-bg)',
      subs:      'var(--cat-subs-bg)',
      loans:     'var(--cat-loans-bg)',
      extra:     'var(--cat-extra-bg)',
      other:     'var(--cat-other-bg)',
    };
    if (map[c.slug]) return map[c.slug];
  }
  return bgForColor(c.color);
}
