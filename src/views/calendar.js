import { h } from '../dom.js';
import { icon } from '../icons.js';
import { store } from '../store.js';
import { loadReceipts } from '../supabase.js';
import { bottomNav } from '../components/bottom-nav.js';
import { receiptRow } from '../components/receipt-row.js';
import { categoryIconBox } from '../components/category-chip.js';
import { calendarGrid } from '../components/calendar-grid.js';
import { getCategory, categoryColor } from '../categories.js';
import { formatPLN, formatDate, addMonths, toDate, toISODate } from '../format.js';

let monthCursor = (() => { const d = new Date(); d.setDate(1); return d; })();
let selectedDay = null;

export function renderCalendar() {
  loadReceipts();

  const root = h('div', {});

  function rerender() {
    root.replaceChildren();

    root.appendChild(h('div', { class: 'cal-header' }, [
      h('button', {
        class: 'btn btn-icon',
        type: 'button',
        'aria-label': 'Poprzedni miesiąc',
        onClick: () => { monthCursor = addMonths(monthCursor, -1); monthCursor.setDate(1); selectedDay = null; rerender(); },
      }, icon('chevron-left')),
      h('h2', {}, formatDate(monthCursor, 'month')),
      h('button', {
        class: 'btn btn-icon',
        type: 'button',
        'aria-label': 'Następny miesiąc',
        onClick: () => { monthCursor = addMonths(monthCursor, 1); monthCursor.setDate(1); selectedDay = null; rerender(); },
      }, icon('chevron-right')),
    ]));

    root.appendChild(calendarGrid({
      month: monthCursor,
      receipts: store.receipts,
      selected: selectedDay,
      onSelectDay: (iso) => {
        selectedDay = (selectedDay === iso) ? null : iso;
        rerender();
      },
    }));

    if (selectedDay) {
      root.appendChild(daySummary(selectedDay));
    } else {
      root.appendChild(monthSummary(monthCursor));
    }
  }

  function daySummary(iso) {
    const list = store.receipts.filter(r => r.purchase_date === iso);
    const total = list.reduce((s, r) => s + Number(r.amount || 0), 0);
    return h('div', { class: 'view', style: { marginTop: '16px' } }, [
      h('div', { class: 'row', style: { justifyContent: 'space-between', marginBottom: '10px' } }, [
        h('div', { class: 't-section' }, formatDate(iso, 'weekday')),
        h('div', { style: { fontSize: '14px', fontWeight: '700' } }, formatPLN(total)),
      ]),
      list.length
        ? h('div', { class: 'receipt-list' }, list.map(receiptRow))
        : h('div', { class: 'empty', style: { padding: '32px 16px' } }, [
            h('div', { class: 'hint' }, 'Brak rachunków w tym dniu'),
          ]),
    ]);
  }

  function monthSummary(monthDate) {
    const y = monthDate.getFullYear(), m = monthDate.getMonth();
    const start = new Date(y, m, 1);
    const end = new Date(y, m + 1, 1);
    const list = store.receipts.filter(r => {
      const d = toDate(r.purchase_date);
      return d >= start && d < end;
    });

    if (!list.length) {
      return h('div', { class: 'view', style: { marginTop: '16px' } }, [
        h('div', { class: 'empty', style: { padding: '32px 16px' } }, [
          h('div', { class: 'title' }, 'Brak rachunków w tym miesiącu'),
          h('div', { class: 'hint' }, 'Wybierz inny miesiąc lub dodaj rachunek.'),
        ]),
      ]);
    }

    // Suma po kategoriach
    const byCat = new Map();
    for (const r of list) {
      byCat.set(r.category_id, (byCat.get(r.category_id) || 0) + Number(r.amount || 0));
    }
    const total = list.reduce((s, r) => s + Number(r.amount || 0), 0);
    const sorted = [...byCat.entries()]
      .map(([cid, amt]) => ({ cat: getCategory(cid), amt }))
      .filter(x => x.cat)
      .sort((a, b) => b.amt - a.amt);

    return h('div', { class: 'view', style: { marginTop: '16px' } }, [
      h('div', { class: 'row', style: { justifyContent: 'space-between', marginBottom: '12px' } }, [
        h('div', { class: 't-section' }, 'Podsumowanie miesiąca'),
        h('div', { style: { fontSize: '16px', fontWeight: '800' } }, formatPLN(total)),
      ]),
      h('div', { class: 'stack', style: { '--gap': '8px' } },
        sorted.map(({ cat, amt }) => h('div', { class: 'receipt-row', style: { cursor: 'default' } }, [
          categoryIconBox(cat),
          h('div', { class: 'info' }, [
            h('div', { class: 'store' }, cat.name),
            h('div', { class: 'meta' }, percent(amt, total) + '% miesiąca'),
          ]),
          h('div', { class: 'amount' }, formatPLN(amt)),
        ]))
      ),
    ]);
  }

  const unsub = store.on(() => rerender());
  window.addEventListener('hashchange', () => unsub(), { once: true });
  rerender();

  return h('div', {}, [root, bottomNav()]);
}

function percent(part, total) {
  if (!total) return 0;
  return Math.round((part / total) * 100);
}
