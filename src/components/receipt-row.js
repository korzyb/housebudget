import { h } from '../dom.js';
import { icon } from '../icons.js';
import { categoryIconBox } from './category-chip.js';
import { getCategory } from '../categories.js';
import { formatPLN, formatDate } from '../format.js';
import { navigate } from '../router.js';

export function receiptRow(receipt) {
  const cat = getCategory(receipt.category_id);
  const isPossibleDup = Array.isArray(receipt.items) && receipt.items.some(i => i.__meta && i.possible_duplicate);

  const nameEl = h('div', { class: 'store' }, receipt.store_name || cat?.name || 'Bez nazwy');
  if (isPossibleDup) {
    const badge = h('span', { class: 'dup-badge', title: 'Możliwy duplikat — sprawdź' }, [
      icon('alert-triangle', { size: 11, strokeWidth: 2.5 }),
    ]);
    nameEl.appendChild(badge);
  }

  return h('div', {
    class: 'receipt-row',
    onClick: () => navigate('/receipt/' + receipt.id),
  }, [
    categoryIconBox(cat),
    h('div', { class: 'info' }, [
      nameEl,
      h('div', { class: 'meta' }, [formatDate(receipt.purchase_date, 'short'), ' · ', cat?.name || '—'].join('')),
    ]),
    h('div', { class: 'amount' }, formatPLN(receipt.amount)),
  ]);
}
