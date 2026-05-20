import { h, toast } from '../dom.js';
import { icon } from '../icons.js';
import { store } from '../store.js';
import { loadReceipts, updateProfile } from '../supabase.js';
import { bottomNav } from '../components/bottom-nav.js';
import { statCard } from '../components/stat-card.js';
import { budgetRing } from '../components/budget-ring.js';
import { barChart } from '../components/bar-chart.js';
import { categoryGridCard, categoryIconBox } from '../components/category-chip.js';
import { presetFilter } from './receipts.js';
import { categoryPieChart, extraPieChart } from '../components/pie-chart.js';
import { receiptRow } from '../components/receipt-row.js';
import { navigate } from '../router.js';
import { categoryColor } from '../categories.js';
import { formatPLN, startOfWeek, startOfMonth, toDate, toISODate } from '../format.js';

export function renderDashboard() {
  const root = h('div', {});

  loadReceipts();

  function rerender() {
    root.replaceChildren();

    const today = new Date();
    const todayISO      = toISODate(today);
    const weekStartISO  = toISODate(startOfWeek(today));
    const monthStartISO = toISODate(startOfMonth(today));
    const monthEndISO   = toISODate(new Date(today.getFullYear(), today.getMonth() + 1, 0));

    const all = store.receipts;
    const sumSince = (sinceISO) => all
      .filter(r => r.purchase_date && r.purchase_date >= sinceISO)
      .reduce((s, r) => s + Number(r.amount || 0), 0);

    const todayTotal = sumSince(todayISO);
    const weekTotal  = sumSince(weekStartISO);
    const monthTotal = sumSince(monthStartISO);
    const limit      = Number(store.profile?.monthly_budget || 0);
    const remaining  = Math.max(limit - monthTotal, 0);

    // Kategoria "Dodatkowe wydatki"
    const extraCat = store.categories.find(c => c.slug === 'extra');

    // Wydatki w tym miesiącu per kategoria
    const monthByCat = groupByCategoryInMonth(all, monthStartISO, monthEndISO);

    const sortedCats = store.categories
      .map(c => ({ c, total: monthByCat.get(c.id) || 0 }))
      .filter(x => x.total > 0)
      .sort((a, b) => b.total - a.total);

    // Miesięczne wydatki bez "Dodatkowych"
    const monthTotalNoExtra = all
      .filter(r => r.purchase_date >= monthStartISO && r.purchase_date <= monthEndISO && r.category_id !== extraCat?.id)
      .reduce((s, r) => s + Number(r.amount || 0), 0);

    // Rachunki z kategorii "Dodatkowe" — posortowane rosnąco po kwocie (małe = jasne)
    const extraReceipts = all
      .filter(r => r.purchase_date >= monthStartISO && r.purchase_date <= monthEndISO && r.category_id === extraCat?.id)
      .sort((a, b) => Number(a.amount) - Number(b.amount));
    const extraTotal = extraReceipts.reduce((s, r) => s + Number(r.amount || 0), 0);

    // ── Header ──────────────────────────────────────────────────────
    const isDark = store.theme === 'dark';
    const themeBtn = h('button', {
      class: 'toggle' + (isDark ? ' on' : ''),
      type: 'button',
      'aria-label': 'Przełącz motyw',
      onClick: () => {
        const next = store.theme === 'dark' ? 'light' : 'dark';
        store.setTheme(next);
        if (store.user) {
          updateProfile({ theme: next }).catch(err => toast(err.message, 'error'));
        }
        rerender();
      },
    });
    root.appendChild(h('div', { class: 'dash-hello' }, [
      h('div', { class: 'greeting' }, [
        h('div', { class: 'small' }, greetingForHour(today.getHours())),
        h('div', { class: 'name' }, store.profile?.name || 'Użytkowniku'),
      ]),
      h('div', { class: 'row', style: { gap: '10px' } }, [icon(isDark ? 'moon' : 'sun'), themeBtn]),
    ]));

    // ── Statystyki ───────────────────────────────────────────────────
    root.appendChild(h('div', { class: 'view' }, [
      h('div', { class: 'stat-grid' }, [
        statCard('Dziś', todayTotal),
        statCard('Tydzień', weekTotal),
        statCard('Miesiąc', monthTotal),
      ]),
    ]));

    // ── Karuzela 4 kart ─────────────────────────────────────────────
    const slides = [
      buildCatPieCard(sortedCats, monthTotal),
      buildBudgetRingCard(monthTotal, limit, 'BUDŻET MIESIĘCZNY', remaining),
      buildBudgetRingCard(monthTotalNoExtra, limit, 'BEZ DODATKOWYCH', Math.max(limit - monthTotalNoExtra, 0)),
      buildExtraPieCard(extraReceipts, extraTotal),
    ];

    const carousel = h('div', { class: 'rings-carousel-wrap' },
      slides.map(slide =>
        h('div', { class: 'card budget-ring-card' }, [slide])
      )
    );
    root.appendChild(h('div', { class: 'view', style: { marginTop: '12px' } }, [carousel]));

    // ── Kategorie w tym miesiącu (siatka 3-kolumnowa) ───────────────
    if (sortedCats.length) {
      root.appendChild(h('div', { class: 'view', style: { marginTop: '20px' } }, [
        h('div', { class: 't-section', style: { padding: '0 0 8px' } }, 'Kategorie w tym miesiącu'),
        h('div', { class: 'cat-grid-3' },
          sortedCats.map(({ c, total }) =>
            categoryGridCard(c, total, monthTotal > 0 ? (total / monthTotal) * 100 : 0, formatPLN, () => {
              presetFilter(c.id);
              navigate('/receipts');
            })
          )
        ),
      ]));
    }

    // ── Wykres 6 miesięcy ────────────────────────────────────────────
    const sixMonths = computeMonthly(all, 6);
    root.appendChild(h('div', { class: 'view', style: { marginTop: '20px' } }, [
      h('div', { class: 'card bar-chart-card' }, [
        h('div', { class: 'head' }, [
          h('div', { class: 't-section' }, 'Ostatnie 6 miesięcy'),
          h('div', { class: 'muted', style: { fontSize: '12px' } }, formatPLN(sixMonths.reduce((s, m) => s + m.value, 0))),
        ]),
        barChart(sixMonths, { height: 150 }),
      ]),
    ]));

    // ── Ostatnie rachunki ────────────────────────────────────────────
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

// ── Pomocnicze builderzy kart ────────────────────────────────────────

function buildCatPieCard(sortedCats, monthTotal) {
  if (!sortedCats.length || monthTotal === 0) {
    return h('div', { style: { textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px', padding: '24px 0' } },
      'Brak wydatków w tym miesiącu');
  }
  const segments = sortedCats.map(({ c, total }) => ({
    color: categoryColor(c) || 'var(--text-muted)',
    pct:   (total / monthTotal) * 100,
    iconEl: categoryIconBox(c, { size: 22 }),
  }));
  const wrapper = document.createElement('div');
  wrapper.style.cssText = 'display:flex;flex-direction:column;align-items:center;gap:var(--sp-3)';
  const lbl = document.createElement('div');
  lbl.className = 'label';
  lbl.textContent = 'PODZIAŁ WYDATKÓW';
  wrapper.appendChild(lbl);
  wrapper.appendChild(categoryPieChart({
    segments,
    centerLabel: formatPLN(monthTotal, { compact: monthTotal >= 10000 }),
    centerSub: 'wydano',
  }));
  return wrapper;
}

function buildBudgetRingCard(spent, limit, labelText, remaining) {
  const ringHost = document.createElement('div');
  ringHost.style.cssText = 'position:relative;width:200px;height:200px';
  ringHost.appendChild(budgetRing({ spent, limit, size: 200, stroke: 18 }));

  const center = document.createElement('div');
  center.style.cssText = 'position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:2px';
  const amtEl = document.createElement('div');
  amtEl.className = 'ring-amount';
  amtEl.textContent = formatPLN(spent, { compact: spent >= 10000 });
  const subEl = document.createElement('div');
  subEl.className = 'ring-sub';
  subEl.textContent = limit > 0 ? `z ${formatPLN(limit, { compact: limit >= 10000 })}` : 'wydano';
  center.appendChild(amtEl);
  center.appendChild(subEl);
  ringHost.appendChild(center);

  const wrapper = document.createElement('div');
  wrapper.style.cssText = 'display:flex;flex-direction:column;align-items:center;gap:var(--sp-3)';

  const lbl = document.createElement('div');
  lbl.className = 'label';
  lbl.textContent = labelText;
  wrapper.appendChild(lbl);
  wrapper.appendChild(ringHost);

  const footer = document.createElement('div');
  footer.className = 'ring-sub';
  if (limit > 0) {
    footer.textContent = spent > limit
      ? `Przekroczono o ${formatPLN(spent - limit)}`
      : `Zostało ${formatPLN(remaining)}`;
  } else {
    const btn = document.createElement('button');
    btn.className = 'btn btn-ghost';
    btn.style.fontSize = '13px';
    btn.textContent = 'Ustaw miesięczny limit →';
    btn.addEventListener('click', () => navigate('/settings'));
    footer.appendChild(btn);
  }
  wrapper.appendChild(footer);

  return wrapper;
}

function buildExtraPieCard(extraReceipts, extraTotal) {
  const wrapper = document.createElement('div');
  wrapper.style.cssText = 'display:flex;flex-direction:column;align-items:center;gap:var(--sp-3)';

  const lbl = document.createElement('div');
  lbl.className = 'label';
  lbl.textContent = 'DODATKOWE WYDATKI';
  wrapper.appendChild(lbl);

  if (!extraReceipts.length || extraTotal === 0) {
    const empty = document.createElement('div');
    empty.style.cssText = 'color:var(--text-muted);font-size:13px;padding:24px 0;text-align:center';
    empty.textContent = 'Brak dodatkowych wydatków';
    wrapper.appendChild(empty);
    return wrapper;
  }

  const segments = extraReceipts.map(r => ({
    pct:   (Number(r.amount) / extraTotal) * 100,
    label: r.description || r.store_name || '?',
  }));

  wrapper.appendChild(extraPieChart({
    segments,
    centerLabel: formatPLN(extraTotal, { compact: extraTotal >= 10000 }),
    centerSub: 'dodatkowe',
  }));

  return wrapper;
}

// ── Pomocnicze funkcje ───────────────────────────────────────────────

function greetingForHour(h) {
  if (h < 6)  return 'Cześć';
  if (h < 12) return 'Dzień dobry,';
  if (h < 18) return 'Cześć,';
  return 'Dobry wieczór,';
}

function computeMonthly(receipts, months) {
  const now = new Date();
  return Array.from({ length: months }, (_, i) => {
    const d    = new Date(now.getFullYear(), now.getMonth() - (months - 1 - i), 1);
    const next = new Date(now.getFullYear(), now.getMonth() - (months - 1 - i) + 1, 1);
    const value = receipts
      .filter(r => { const rd = toDate(r.purchase_date); return rd >= d && rd < next; })
      .reduce((s, r) => s + Number(r.amount || 0), 0);
    return {
      label: new Intl.DateTimeFormat('pl-PL', { month: 'short' }).format(d),
      value,
      highlight: i === months - 1,
    };
  });
}

function groupByCategoryInMonth(receipts, startISO, endISO) {
  const map = new Map();
  for (const r of receipts) {
    if (!r.purchase_date || r.purchase_date < startISO || r.purchase_date > endISO) continue;
    map.set(r.category_id, (map.get(r.category_id) || 0) + Number(r.amount || 0));
  }
  return map;
}
