// Bootstrap aplikacji: theme → supabase → router → routes → service worker.

import { store } from './store.js';
import { initRouter, route, navigate, render } from './router.js';
import { initSupabase, isConfigured, getConfigError } from './supabase.js';
import { mount, h, toast } from './dom.js';

// Widoki
import { renderLogin } from './views/login.js';
import { renderRegister } from './views/register.js';
import { renderDashboard } from './views/dashboard.js';
import { renderReceipts } from './views/receipts.js';
import { renderReceiptDetail } from './views/receipt-detail.js';
import { renderCalendar } from './views/calendar.js';
import { renderSettings } from './views/settings.js';
import { renderCamera } from './views/camera.js';

const appEl = document.getElementById('app');

// 1) Theme z localStorage (przed asynchronicznym ładowaniem profilu)
const savedTheme = localStorage.getItem('theme') || 'dark';
store.setTheme(savedTheme);

// 2) Trasy
route('/login', () => renderLogin(), { noNav: true });
route('/register', () => renderRegister(), { noNav: true });
route('/dashboard', () => renderDashboard());
route('/receipts', () => renderReceipts());
route('/calendar', () => renderCalendar());
route('/settings', () => renderSettings());
route('/receipt/new', () => renderReceiptDetail({ id: null }));
route('/receipt/:id', ({ id }) => renderReceiptDetail({ id }));
route('/camera', () => renderCamera(), { noNav: true });

// 3) Router init
initRouter(appEl);

// 4) Supabase init
(async () => {
  const sb = await initSupabase();
  if (!sb) {
    // Pokaż ekran z instrukcją konfiguracji
    mount(appEl, configMissingScreen());
    return;
  }
  // Aktualne theme z profilu nadpisze localStorage przy logowaniu.
  // Pierwszy render po inicie:
  render();
})();

// 5) Service worker (PWA)
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js').catch(err => {
      console.warn('SW registration failed:', err);
    });
  });
}

// Zapis theme do localStorage przy zmianie
store.on(s => {
  localStorage.setItem('theme', s.theme);
});

// Ekran "config missing"
function configMissingScreen() {
  const err = getConfigError();
  return h('div', { class: 'view auth-view' }, [
    h('div', { class: 'brand' }, [
      h('h1', {}, 'Konfiguracja wymagana'),
      h('p', { class: 'muted' }, 'Plik config.local.js nie jest skonfigurowany.'),
    ]),
    h('div', { class: 'card' }, [
      h('p', { style: { marginBottom: '12px', fontSize: '14px' } }, [
        'Skopiuj ',
        h('code', {}, 'config.example.js'),
        ' jako ',
        h('code', {}, 'config.local.js'),
        ' i wpisz w nim:',
      ]),
      h('ul', { style: { paddingLeft: '20px', fontSize: '13px', color: 'var(--text-muted)' } }, [
        h('li', {}, 'SUPABASE_URL — z panelu projektu Supabase'),
        h('li', {}, 'SUPABASE_ANON_KEY — z Project Settings → API'),
      ]),
      err ? h('p', {
        class: 'muted',
        style: { marginTop: '12px', fontSize: '12px' }
      }, 'Błąd: ' + err.message) : null,
      h('p', { style: { marginTop: '16px', fontSize: '13px' } }, [
        'Pełna instrukcja: ',
        h('a', { href: './README.md', target: '_blank' }, 'README'),
      ]),
    ]),
  ]);
}

// Eksport globalny do debugu w konsoli (tylko podczas developmentu)
window.__app = { store, navigate, toast };
