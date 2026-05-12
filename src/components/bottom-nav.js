import { h } from '../dom.js';
import { icon } from '../icons.js';
import { navigate, currentPath } from '../router.js';
import { openAddSheet } from './add-sheet.js';

export function bottomNav() {
  const path = currentPath();
  const isActive = (p) => path.startsWith(p);

  const navBtn = (path, name, label) => h('button', {
    class: 'nav-btn' + (isActive(path) ? ' active' : ''),
    type: 'button',
    onClick: () => navigate(path),
  }, [
    icon(name),
    h('span', {}, label),
  ]);

  return h('nav', { class: 'bottom-nav' }, [
    navBtn('/dashboard', 'home', 'Dashboard'),
    navBtn('/receipts', 'receipt', 'Rachunki'),
    h('button', {
      class: 'nav-add',
      type: 'button',
      'aria-label': 'Dodaj wydatek',
      onClick: () => openAddSheet(),
    }, icon('plus', { size: 28, strokeWidth: 2.4 })),
    navBtn('/calendar', 'calendar', 'Kalendarz'),
    navBtn('/settings', 'settings', 'Ustawienia'),
  ]);
}
