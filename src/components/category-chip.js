import { h } from '../dom.js';
import { icon } from '../icons.js';
import { categoryBg, categoryColor } from '../categories.js';

// Sama ikona kategorii w kolorowym kwadracie
export function categoryIconBox(category, { size = 40 } = {}) {
  const bg = categoryBg(category);
  const color = categoryColor(category);
  return h('div', {
    class: 'cat-icon',
    style: { background: bg, color: color, width: size + 'px', height: size + 'px' },
  }, icon(category?.icon || 'package', { size: Math.round(size * 0.55), strokeWidth: 2 }));
}

// Karta kategorii (do karuzeli na dashboardzie)
export function categoryCard(category, amount, formatPLN) {
  return h('div', { class: 'cat-card' }, [
    h('div', { class: 'row' }, [
      categoryIconBox(category, { size: 32 }),
      h('div', { class: 'name' }, category.name),
    ]),
    h('div', { class: 'amount' }, formatPLN(amount)),
  ]);
}

// Karta kategorii do siatki 3-kolumnowej na dashboardzie (z procentem)
export function categoryGridCard(category, amount, pct, formatPLN) {
  return h('div', { class: 'cat-grid-card' }, [
    categoryIconBox(category, { size: 28 }),
    h('div', { class: 'name' }, category.name),
    h('div', { class: 'amount' }, formatPLN(amount)),
    h('div', { class: 'pct' }, Math.round(pct) + '%'),
  ]);
}
