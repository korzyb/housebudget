import { h } from '../dom.js';
import { icon } from '../icons.js';
import { store } from '../store.js';
import { loadReceipts } from '../supabase.js';
import { bottomNav } from '../components/bottom-nav.js';
import { statCard } from '../components/stat-card.js';
import { budgetRing } from '../components/budget-ring.js';
import { barChart } from '../components/bar-chart.js';
import { categoryCard } from '../components/category-chip.js';
import { receiptRow } from '../components/receipt-row.js';
import { navigate } from '../router.js';
import { formatPLN, startOfWeek, startOfMonth, toDate, toISODate } from '../format.js';

export function renderDashboard() {
  const root = h('div', {});

  // Lazy refresh
  loadReceipts();

  function rerender() {
    root.replaceChildren();

    const today = new Date();
    // Porównujemy stringi ISO (YYYY-MM-DD) — są leksykograficznie sortowalne, nie ma problemów ze strefami czasowymi
    const todayISO = toISODate(today);
    const weekStartISO = toISODate(startOfWeek(today));
    const monthStartISO = toISODate(startOfMonth(today));

    const all = store.receipts;
    const sumSince = (sinceISO) => all
      .filter(r => r.purchase_date && r.purchase_date >= sinceISO)
      .reduce((s, r) => s + Number(r.amount || 0), 0);

    const todayTotal = sumSince(todayISO);
    const weekTotal = sumSince(weekStartISO);
    const monthTotal = sumSince(monthStartISO);
    const limit = Number(store.profile?.monthly_budget || 0);
    const remaining = Math.max(limit - monthTotal, 0);

    // Header
    const greeting = h('div', { class: 'dash-hello' }, [
      h('div', { class: 'greeting' }, [
        h('div', { class: 'small' }, greetingForHour(today.getHours())),
        h('div', { class: 'name' }, store.profile?.name || 'Użytkowniku'),
      ]),
      h('button', {
        class: 'btn btn-icon',
        type: 'button',
        'aria-label': 'Ustawienia',
        onClick: () => navigate('/settings'),
      }, [icon('settings')]),
    ]);
    root.appendChild(greeting);

    // Statystyki
    root.appendChild(h('div', { class: 'view' }, [
      h('div', { class: 'stat-grid' }, [
        statCard('Dziś', todayTotal),
        statCard('Tydzień', weekTotal),
        statCard('Miesiąc', monthTotal),
      ]),
    ]));

    // Pierścień
    const ringHost = h('div', { style: { position: 'relative', width: '200px', height: '200px' } });
    ringHost.appendChild(budgetRing({ spent: monthTotal, limit, size: 200, stroke: 18 }));
    ringHost.appendChild(h('div', {
      style: {
        position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center', gap: '2px',
      },
    }, [
      h('div', { class: 'ring-amount' }, formatPLN(monthTotal, { compact: monthTotal >= 10000 })),
      h('div', { class: 'ring-sub' }, limit > 0 ? `z ${formatPLN(limit, { compact: limit >= 10000 })}` : 'wydano'),
    ]));

    const ringCard = h('div', { class: 'card budget-ring-card', style: { marginTop: '12px' } }, [
      h('div', { class: 'label' }, limit > 0 ? 'BUDŻET MIESIĘCZNY' : 'WYDANO W TYM MIESIĄCU'),
      ringHost,
      limit > 0
        ? h('div', { class: 'ring-sub' },
            monthTotal > limit
              ? `Przekroczono o ${formatPLN(monthTotal - limit)}`
              : `Zostało ${formatPLN(remaining)}`)
        : h('button', {
            class: 'btn btn-ghost',
            type: 'button',
            style: { fontSize: '13px' },
            onClick: () => navigate('/settings'),
          }, 'Ustaw miesięczny limit →'),
    ]);
    root.appendChild(h('div', { class: 'view', style: { marginTop: '12px' } }, [ringCard]));

    // Wykres 6 miesięcy
    const sixMonths = computeMonthly(all, 6);
    const chartCard = h('div', { class: 'card bar-chart-card', style: { marginTop: '12px' } }, [
      h('div', { class: 'head' }, [
        h('div', { class: 't-section' }, 'Ostatnie 6 miesięcy'),
        h('div', { class: 'muted', style: { fontSize: '12px' } }, formatPLN(sixMonths.reduce((s, m) => s + m.value, 0))),
      ]),
      barChart(sixMonths, { height: 150 }),
    ]);
    root.appendChild(h('div', { class: 'view' }, [chartCard]));

    // Kategorie — karuzela
    const monthByCat = groupByCategoryInMonth(all, monthStartISO);
    const sortedCats = store.categories
      .map(c => ({ c, total: monthByCat.get(c.id) || 0 }))
      .filter(x => x.total > 0)
      .sort((a, b) => b.total - a.total);

    if (sortedCats.length) {
      root.appendChild(h('div', { class: 'view', style: { marginTop: '20px' } }, [
        h('div', { class: 't-section', style: { padding: '0 0 8px' } }, 'Kategorie w tym miesiącu'),
      ]));
      const carousel = h('div', { class: 'h-scroll' },
        sortedCats.map(({ c, total }) => categoryCard(c, total, formatPLN))
      );
      root.appendChild(carousel);
    }

    // Ostatnie rachunki
    const recent = all.slice(0, 5);
    if (recent.length) {
      root.appendChild(h('div', { class: 'view', style: { marginTop: '20px' } }, [
        h('div', { class: 'row', style: { justifyContent: 'space-between', marginBottom: '8px' } }, [
          h('div', { class: 't-section' }, 'Ostatnie rachunki'),
          h('button', {
            class: 'btn btn-ghost',
            type: 'button',
            style: { minHeight: '32px', padding: '6px 10px', fontSize: '13px' },
            onClick: () => navigate('/receipts'),
          }, 'Wszystkie →'),
        ]),
        h('div', { class: 'receipt-list' }, recent.map(receiptRow)),
      ]));
    } else {
      root.appendChild(h('div', { class: 'view', style: { marginTop: '20px' } }, [
        h('div', { class: 'card empty' }, [
          h('div', { class: 'title' }, 'Zacznij od pierwszego rachunku'),
          h('div', { class: 'hint' }, 'Naciśnij przycisk + na dole ekranu.'),
        ]),
      ]));
    }
  }

  const unsub = store.on(() => rerender());
  window.addEventListener('hashchange', () => unsub(), { once: true });
  rerender();

  return h('div', {}, [root, bottomNav()]);
}

function greetingForHour(h) {
  if (h < 6) return 'Cześć';
  if (h < 12) return 'Dzień dobry,';
  if (h < 18) return 'Cześć,';
  return 'Dobry wieczór,';
}

function computeMonthly(receipts, months) {
  const now = new Date();
  const result = [];
  for (let i = months - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const next = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);
    const total = receipts
      .filter(r => {
        const rd = toDate(r.purchase_date);
        return rd >= d && rd < next;
      })
      .reduce((s, r) => s + Number(r.amount || 0), 0);
    result.push({
      label: new Intl.DateTimeFormat('pl-PL', { month: 'short' }).format(d),
      value: total,
      highlight: i === 0,
    });
  }
  return result;
}

function groupByCategoryInMonth(receipts, startMonthISO) {
  const map = new Map();
  for (const r of receipts) {
    if (!r.purchase_date || r.purchase_date < startMonthISO) continue;
    const cur = map.get(r.category_id) || 0;
    map.set(r.category_id, cur + Number(r.amount || 0));
  }
  return map;
}
