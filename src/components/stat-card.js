import { h } from '../dom.js';
import { formatPLN } from '../format.js';

export function statCard(label, amount) {
  return h('div', { class: 'stat-card' }, [
    h('div', { class: 'label' }, label),
    h('div', { class: 'value' }, formatPLN(amount, { compact: amount >= 10000 })),
  ]);
}
