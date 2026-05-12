import { h } from '../dom.js';
import { categoryIconBox } from './category-chip.js';
import { getCategory } from '../categories.js';
import { formatPLN, formatDate } from '../format.js';
import { navigate } from '../router.js';

export function receiptRow(receipt) {
  const cat = getCategory(receipt.category_id);
  return h('div', {
    class: 'receipt-row',
    onClick: () => navigate('/receipt/' + receipt.id),
  }, [
    categoryIconBox(cat),
    h('div', { class: 'info' }, [
      h('div', { class: 'store' }, receipt.store_name || cat?.name || 'Bez nazwy'),
      h('div', { class: 'meta' }, [formatDate(receipt.purchase_date, 'short'), ' · ', cat?.name || '—'].join('')),
    ]),
    h('div', { class: 'amount' }, formatPLN(receipt.amount)),
  ]);
}
