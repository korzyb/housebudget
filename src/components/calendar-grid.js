import { h } from '../dom.js';
import { toDate, isSameDay, toISODate } from '../format.js';
import { getCategory, categoryColor } from '../categories.js';

// month: Date (jakikolwiek dzień miesiąca)
// receipts: lista rachunków
// selected: ISO date string | null
// onSelectDay: (iso) => void
export function calendarGrid({ month, receipts, selected, onSelectDay }) {
  const year = month.getFullYear();
  const m = month.getMonth();
  const first = new Date(year, m, 1);
  const last = new Date(year, m + 1, 0);
  const firstDay = (first.getDay() + 6) % 7; // poniedziałek = 0
  const daysInMonth = last.getDate();

  const today = toISODate(new Date());

  // Agregacja rachunków po dniu (tylko ten miesiąc)
  const byDay = new Map();
  for (const r of receipts) {
    const d = toDate(r.purchase_date);
    if (!d || d.getFullYear() !== year || d.getMonth() !== m) continue;
    const key = r.purchase_date;
    if (!byDay.has(key)) byDay.set(key, { total: 0, cats: new Set() });
    const entry = byDay.get(key);
    entry.total += Number(r.amount || 0);
    if (r.category_id) entry.cats.add(r.category_id);
  }

  const root = h('div', {});

  // Nagłówki dni
  const weekdays = ['Pon', 'Wt', 'Śr', 'Czw', 'Pt', 'Sob', 'Nd'];
  const head = h('div', { class: 'cal-grid' },
    weekdays.map(d => h('div', { class: 'cal-weekday' }, d))
  );
  root.appendChild(head);

  // Komórki
  const grid = h('div', { class: 'cal-grid' });
  // Puste komórki przed pierwszym
  for (let i = 0; i < firstDay; i++) {
    grid.appendChild(h('div', { class: 'cal-day outside' }));
  }
  for (let d = 1; d <= daysInMonth; d++) {
    const date = new Date(year, m, d);
    const iso = toISODate(date);
    const data = byDay.get(iso);
    const isToday = iso === today;
    const isSelected = iso === selected;

    const cell = h('button', {
      class: 'cal-day' + (isToday ? ' today' : '') + (isSelected ? ' selected' : ''),
      type: 'button',
      onClick: () => onSelectDay(iso),
    }, [
      h('div', { class: 'num' }, String(d)),
      data
        ? h('div', { class: 'amt' }, compactAmount(data.total))
        : null,
      data
        ? h('div', { class: 'dots' }, [...data.cats].slice(0, 4).map(cid => {
            const c = getCategory(cid);
            return h('div', { class: 'dot', style: { background: categoryColor(c) } });
          }))
        : null,
    ]);
    grid.appendChild(cell);
  }
  root.appendChild(grid);

  return root;
}

function compactAmount(n) {
  if (n >= 1000) return (n / 1000).toFixed(1).replace('.', ',') + 'k';
  return Math.round(n) + '';
}
