import { h } from '../dom.js';
import { icon } from '../icons.js';
import { navigate } from '../router.js';
import { store } from '../store.js';

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
    option('image', 'Galeria', 'Wybierz zdjęcie paragonu z telefonu', () => triggerGalleryPick()),
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

  const onKey = (e) => { if (e.key === 'Escape') { close(); document.removeEventListener('keydown', onKey); } };
  document.addEventListener('keydown', onKey);
}

// Otwiera natywny picker zdjęć BEZPOŚREDNIO w user gesture (kliknięcie "Galeria").
// Bez tego setTimeout-em wewnątrz późniejszego view często powoduje race condition
// i picker się otwiera dwa razy.
function triggerGalleryPick() {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = 'image/*,application/pdf';
  input.style.position = 'fixed';
  input.style.left = '-9999px';
  input.style.top = '-9999px';

  input.addEventListener('change', () => {
    const file = input.files?.[0];
    input.remove();
    if (!file) return;
    store.setPendingPhoto(file);
    navigate('/camera?source=process');
  });

  // Anulowanie pickera nie emituje 'change' — sprzątamy po cancel events (Chrome 113+)
  input.addEventListener('cancel', () => {
    input.remove();
  });

  document.body.appendChild(input);
  input.click();
}
