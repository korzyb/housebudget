import { h } from '../dom.js';
import { icon } from '../icons.js';
import { navigate } from '../router.js';

let currentSheet = null;

export function openAddSheet() {
  if (currentSheet) return;

  const close = () => {
    if (!currentSheet) return;
    currentSheet.remove();
    backdrop.remove();
    currentSheet = null;
  };

  const backdrop = h('div', {
    class: 'sheet-backdrop',
    onClick: close,
  });

  const option = (iconName, title, hint, onClick) => h('button', {
    class: 'sheet-option',
    type: 'button',
    onClick: () => { close(); onClick(); },
  }, [
    h('div', { class: 'icon-wrap' }, icon(iconName)),
    h('div', { class: 'label-block' }, [
      h('div', { class: 'title' }, title),
      h('div', { class: 'hint' }, hint),
    ]),
  ]);

  const sheet = h('div', { class: 'sheet', role: 'dialog' }, [
    h('div', { class: 'sheet-handle' }),
    h('div', { class: 't-section', style: { marginBottom: '8px', padding: '0 8px' } }, 'Dodaj wydatek'),
    option('camera', 'Aparat', 'Zrób zdjęcie paragonu — AI go ogarnie', () => navigate('/camera')),
    option('image', 'Galeria', 'Wybierz zdjęcie paragonu z telefonu', () => navigate('/camera?source=gallery')),
    option('edit', 'Wprowadź ręcznie', 'Wpisz kwotę i kategorię', () => navigate('/receipt/new')),
    h('button', {
      class: 'btn btn-ghost btn-block',
      type: 'button',
      style: { marginTop: '12px' },
      onClick: close,
    }, 'Anuluj'),
  ]);

  document.body.appendChild(backdrop);
  document.body.appendChild(sheet);
  currentSheet = sheet;

  // Esc do zamknięcia
  const onKey = (e) => { if (e.key === 'Escape') { close(); document.removeEventListener('keydown', onKey); } };
  document.addEventListener('keydown', onKey);
}
