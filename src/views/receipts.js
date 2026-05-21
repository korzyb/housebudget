import { h } from '../dom.js';
import { store } from '../store.js';
import { loadReceipts } from '../supabase.js';
import { bottomNav } from '../components/bottom-nav.js';
import { receiptRow } from '../components/receipt-row.js';
import { formatPLN, toDate, toISODate, addMonths } from '../format.js';

const _today = new Date();
const filters = {
  from: toISODate(new Date(_today.getFullYear(), _today.getMonth(), 1)),
  to:   toISODate(new Date(_today.getFullYear(), _today.getMonth() + 1, 0)),
  categoryId: null,
  rangeKey: 'month',
};

// Ustawia filtry przed przejściem z innego widoku (np. dashboard → kategoria)
export function presetFilter(categoryId) {
  const today = new Date();
  filters.rangeKey   = 'month';
  filters.from       = toISODate(new Date(today.getFullYear(), today.getMonth(), 1));
  filters.to         = toISODate(new Date(today.getFullYear(), today.getMonth() + 1, 0));
  filters.categoryId = categoryId ?? null;
}

export function renderReceipts() {
  loadReceipts();

  function applyFilters(list) {
    return list.filter(r => {
      if (filters.from && r.purchase_date < filters.from) return false;
      if (filters.to   && r.purchase_date > filters.to)   return false;
      if (filters.categoryId && r.category_id !== filters.categoryId) return false;
      return true;
    });
  }

  // ── Header (subtitle updated in-place) ──────────────────────────
  const subtitleEl = h('div', { class: 'muted', style: { fontSize: '13px' } }, '');
  const headerEl = h('div', { class: 'view-header' }, [
    h('h1', {}, 'Rachunki'),
    subtitleEl,
  ]);

  // ── Rząd 1: bieżący + 3 poprzednie miesiące ─────────────────────
  const _fmt = new Intl.DateTimeFormat('pl-PL', { month: 'long' });
  const _now  = new Date();
  const MONTH_KEYS   = ['month', 'prev1', 'prev2', 'prev3'];
  const MONTH_LABELS = MONTH_KEYS.map((k, i) => {
    if (i === 0) return 'Ten miesiąc';
    const d = new Date(_now.getFullYear(), _now.getMonth() - i, 1);
    const n = _fmt.format(d);
    return n.charAt(0).toUpperCase() + n.slice(1);
  });

  // ── Rząd 2: zakresy wielomiesięczne ─────────────────────────────
  const RANGE_KEYS   = ['3months', '6months', 'year', 'all'];
  const RANGE_LABELS = ['3 miesiące', '6 miesięcy', 'Rok', 'Wszystkie'];

  function applyRangeKey(key) {
    filters.rangeKey = key;
    const today = new Date();
    if (key === 'all') {
      filters.from = null; filters.to = null;
    } else if (key === 'year') {
      filters.from = toISODate(new Date(today.getFullYear(), 0, 1));
      filters.to   = toISODate(new Date(today.getFullYear(), 11, 31));
    } else if (key === '3months') {
      filters.from = toISODate(addMonths(today, -2));
      filters.to   = toISODate(today);
    } else if (key === '6months') {
      filters.from = toISODate(addMonths(today, -5));
      filters.to   = toISODate(today);
    } else {
      // month | prev1 | prev2 | prev3
      const offset = key === 'month' ? 0 : parseInt(key.slice(4));
      filters.from = toISODate(new Date(today.getFullYear(), today.getMonth() - offset, 1));
      filters.to   = toISODate(new Date(today.getFullYear(), today.getMonth() - offset + 1, 0));
    }
  }

  const monthChipEls = MONTH_KEYS.map((key, i) =>
    h('button', {
      class: 'chip' + (filters.rangeKey === key ? ' active' : ''),
      type: 'button',
      onClick: () => { applyRangeKey(key); syncRangeChips(); renderList(); },
    }, MONTH_LABELS[i]),
  );

  const rangeChipEls = RANGE_KEYS.map((key, i) =>
    h('button', {
      class: 'chip' + (filters.rangeKey === key ? ' active' : ''),
      type: 'button',
      onClick: () => { applyRangeKey(key); syncRangeChips(); renderList(); },
    }, RANGE_LABELS[i]),
  );

  const allRangeChipEls = [...monthChipEls, ...rangeChipEls];
  const allRangeKeys    = [...MONTH_KEYS, ...RANGE_KEYS];

  const rangeBar1El = h('div', { class: 'filter-bar' }, monthChipEls);
  const rangeBar2El = h('div', { class: 'filter-bar' }, rangeChipEls);

  function syncRangeChips() {
    allRangeChipEls.forEach((el, i) =>
      el.classList.toggle('active', filters.rangeKey === allRangeKeys[i]),
    );
  }

  // ── Category chips (bar element lives forever, chips rebuilt only
  //    when store.categories list changes length) ───────────────────
  const catBarEl = h('div', { class: 'filter-bar' }, []);
  let catChipEls = [];
  let prevCatCount = -1;

  function buildCatChips() {
    const makeChip = (label, id, color) => {
      const active = filters.categoryId === id;
      const el = h('button', {
        class: 'chip' + (active ? ' active' : ''),
        type: 'button',
        style: color && active ? { background: color } : {},
        onClick: () => {
          filters.categoryId = id;
          syncCatChips();
          renderList();
        },
      }, label);
      el._catId    = id;
      el._catColor = color;
      return el;
    };

    catChipEls = [
      makeChip('Wszystkie kategorie', null, undefined),
      ...store.categories.map(c => makeChip(c.name, c.id, c.color)),
    ];
    catBarEl.replaceChildren(...catChipEls);
    prevCatCount = store.categories.length;
  }

  function syncCatChips() {
    catChipEls.forEach(el => {
      const active = filters.categoryId === el._catId;
      el.classList.toggle('active', active);
      el.style.background = (el._catColor && active) ? el._catColor : '';
    });
  }

  // ── List area (rebuilt on every data/filter change) ──────────────
  const listEl = h('div', {}, []);

  function renderList() {
    const list  = applyFilters(store.receipts);
    const total = list.reduce((s, r) => s + Number(r.amount || 0), 0);
    subtitleEl.textContent = `${list.length} szt. · ${formatPLN(total)}`;

    listEl.replaceChildren();

    if (!list.length) {
      listEl.appendChild(h('div', { class: 'empty' }, [
        h('div', { class: 'title' }, 'Brak rachunków'),
        h('div', { class: 'hint' }, store.receipts.length
          ? 'Zmień filtry, żeby zobaczyć więcej.'
          : 'Dodaj pierwszy paragon przyciskiem +.'),
      ]));
      return;
    }

    const byDay = new Map();
    for (const r of list) {
      if (!byDay.has(r.purchase_date)) byDay.set(r.purchase_date, []);
      byDay.get(r.purchase_date).push(r);
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
      days.appendChild(h('div', { class: 'receipt-list' }, rows.map(receiptRow)));
    }
    listEl.appendChild(days);
  }

  // ── Main rerender (called by store subscription) ─────────────────
  function rerender() {
    if (store.categories.length !== prevCatCount) {
      buildCatChips();
    } else {
      syncCatChips();
    }
    syncRangeChips();
    renderList();
  }

  const unsub = store.on(() => rerender());
  rerender();

  setTimeout(() => {
    window.addEventListener('hashchange', () => unsub(), { once: true });
  }, 0);

  const root = h('div', {}, [headerEl, rangeBar1El, rangeBar2El, catBarEl, listEl]);
  return h('div', {}, [root, bottomNav()]);
}

function formatDateLabel(iso) {
  const today     = toISODate(new Date());
  const yesterday = toISODate(new Date(Date.now() - 86400000));
  if (iso === today)     return 'Dzisiaj';
  if (iso === yesterday) return 'Wczoraj';
  const d = toDate(iso);
  return new Intl.DateTimeFormat('pl-PL', { weekday: 'long', day: 'numeric', month: 'long' }).format(d);
}
