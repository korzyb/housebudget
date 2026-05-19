import { h } from '../dom.js';
import { icon } from '../icons.js';
import { navigate } from '../router.js';
import { processReceiptBlob } from '../views/camera.js';
import { importCSV } from '../import-csv.js';

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
    option('file-text', 'Plik', 'Wybierz PDF z paragonem (np. e-paragon)', () => triggerFilePick()),
    option('edit', 'Wprowadź ręcznie', 'Wpisz kwotę i kategorię', () => navigate('/receipt/new')),
    option('file-spreadsheet', 'Import CSV', 'Wczytaj historię operacji z mBanku (.csv)', () => triggerCSVPick()),
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

// Otwiera natywny picker zdjęć w user gesture (klik "Galeria"). Po wybraniu
// pliku przetwarzamy go bezpośrednio (upload + Gemini), bez routingu — to
// uniknięcie podwójnego rendera widoków (był bug gdzie tracone były dane z draftu).
function triggerGalleryPick() {
  openNativePicker('image/*');
}

// PDF-only — bez image/* w accept native OS picker pomija kafelek aparatu
// i otwiera prosto przeglądarkę plików / Downloads.
function triggerFilePick() {
  openNativePicker('application/pdf');
}

function triggerCSVPick() {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = '.csv,text/csv';
  input.style.cssText = 'position:fixed;left:-9999px;top:-9999px';

  let handled = false;

  input.addEventListener('change', () => {
    if (handled) return;
    handled = true;
    const file = input.files?.[0];
    input.remove();
    if (!file) return;
    importCSV(file);
  });

  input.addEventListener('cancel', () => {
    if (handled) return;
    handled = true;
    input.remove();
  });

  document.body.appendChild(input);
  input.click();
}

function openNativePicker(acceptStr) {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = acceptStr;
  input.style.position = 'fixed';
  input.style.left = '-9999px';
  input.style.top = '-9999px';

  let handled = false;

  input.addEventListener('change', () => {
    if (handled) return;
    handled = true;
    const file = input.files?.[0];
    input.remove();
    if (!file) return;
    processReceiptBlob(file);
  });

  input.addEventListener('cancel', () => {
    if (handled) return;
    handled = true;
    input.remove();
  });

  document.body.appendChild(input);
  input.click();
}
