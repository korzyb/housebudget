import { h } from '../dom.js';
import { store } from '../store.js';
import { loadReceipts } from '../supabase.js';
import { bottomNav } from '../components/bottom-nav.js';
import { receiptRow } from '../components/receipt-row.js';
import { formatPLN, toDate, toISODate, addMonths } from '../format.js';

const filters = {
  from: null,      // ISO date string
  to: null,
  categoryId: null,
  rangeKey: 'all', // 'all' | 'month' | '3months' | 'year' | 'custom'
};

export function renderReceipts() {
  const root = h('div', {});

  // Lazy refresh przy wejściu (nie blokuje renderingu)
  loadReceipts();

  function applyFilters(list) {
    return list.filter(r => {
      if (filters.from && r.purchase_date < filters.from) return false;
      if (filters.to && r.purchase_date > filters.to) return false;
      if (filters.categoryId && r.category_id !== filters.categoryId) return false;
      return true;
    });
  }

  function rerender() {
    root.replaceChildren();

    const list = applyFilters(store.receipts);
    const total = list.reduce((s, r) => s + Number(r.amount || 0), 0);

    root.appendChild(h('div', { class: 'view-header' }, [
      h('h1', {}, 'Rachunki'),
      h('div', { class: 'muted', style: { fontSize: '13px' } }, `${list.length} szt. · ${formatPLN(total)}`),
    ]));

    // Filtry zakresu
    root.appendChild(h('div', { class: 'filter-bar' }, [
      rangeChip('Wszystkie', 'all'),
      rangeChip('Ten miesiąc', 'month'),
      rangeChip('3 miesiące', '3months'),
      rangeChip('Rok', 'year'),
    ]));

    // Filtry kategorii
    root.appendChild(h('div', { class: 'filter-bar' }, [
      categoryChip('Wszystkie kategorie', null),
      ...store.categories.map(c => categoryChip(c.name, c.id, c.color)),
    ]));

    // Lista
    if (!list.length) {
      root.appendChild(h('div', { class: 'empty' }, [
        h('div', { class: 'title' }, 'Brak rachunków'),
        h('div', { class: 'hint' }, store.receipts.length
          ? 'Zmień filtry, żeby zobaczyć więcej.'
          : 'Dodaj pierwszy paragon przyciskiem +.'),
      ]));
    } else {
      // Grupuj po dniach
      const byDay = new Map();
      for (const r of list) {
        const key = r.purchase_date;
        if (!byDay.has(key)) byDay.set(key, []);
        byDay.get(key).push(r);
      }
      const days = h('div', { class: 'stack', style: { padding: '0 16px 8px' } }, []);
      for (const [day, rows] of byDay) {
        const dayTotal = rows.reduce((s, r) => s + Number(r.amount || 0), 0);
        days.appendChild(h('div', {
          class: 'row',
          style: { justifyContent: 'space-between', padding: '8px 4px 4px', marginTop: '8px' },
        }, [
          h('div', { class: 't-section' }, formatDateLabel(day)),
          h('div', { class: 'muted', style: { fontSize: '12px', fontWeight: '600' } }, formatPLN(dayTotal)),
        ]));
        const group = h('div', { class: 'receipt-list' }, rows.map(receiptRow));
        days.appendChild(group);
      }
      root.appendChild(days);
    }
  }

  function rangeChip(label, key) {
    const active = filters.rangeKey === key;
    return h('button', {
      class: 'chip' + (active ? ' active' : ''),
      type: 'button',
      onClick: () => {
        filters.rangeKey = key;
        const today = new Date();
        if (key === 'all') { filters.from = null; filters.to = null; }
        else if (key === 'month') {
          filters.from = toISODate(new Date(today.getFullYear(), today.getMonth(), 1));
          filters.to = toISODate(new Date(today.getFullYear(), today.getMonth() + 1, 0));
        } else if (key === '3months') {
          filters.from = toISODate(addMonths(today, -2));
          filters.to = toISODate(today);
        } else if (key === 'year') {
          filters.from = toISODate(new Date(today.getFullYear(), 0, 1));
          filters.to = toISODate(new Date(today.getFullYear(), 11, 31));
        }
        rerender();
      },
    }, label);
  }

  function categoryChip(label, id, color) {
    const active = filters.categoryId === id;
    return h('button', {
      class: 'chip' + (active ? ' active' : ''),
      type: 'button',
      style: color && active ? { background: color } : {},
      onClick: () => { filters.categoryId = id; rerender(); },
    }, label);
  }

  // Subskrybuj zmiany store
  const unsub = store.on(() => rerender());
  // Pierwszy render
  rerender();

  // Cleanup gdy widok schodzi
  setTimeout(() => {
    // observer aborta brak; unsub na hashchange
    window.addEventListener('hashchange', () => unsub(), { once: true });
  }, 0);

  return h('div', {}, [root, bottomNav()]);
}

function formatDateLabel(iso) {
  const today = toISODate(new Date());
  const yesterday = toISODate(new Date(Date.now() - 86400000));
  if (iso === today) return 'Dzisiaj';
  if (iso === yesterday) return 'Wczoraj';
  const d = toDate(iso);
  return new Intl.DateTimeFormat('pl-PL', { weekday: 'long', day: 'numeric', month: 'long' }).format(d);
}
