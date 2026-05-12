// Hash router z guardem auth.
// Trasy publiczne: #/login, #/register
// Wszystkie inne wymagają store.user.

import { store } from './store.js';
import { mount } from './dom.js';

const routes = [];
const PUBLIC = new Set(['/login', '/register']);
let appEl = null;
let renderingLock = false;

// Rejestracja trasy: pattern → handler(params, ctx)
export function route(pattern, handler, opts = {}) {
  // pattern może mieć :param
  const keys = [];
  const regex = new RegExp('^' + pattern.replace(/:[^/]+/g, m => {
    keys.push(m.slice(1));
    return '([^/]+)';
  }) + '$');
  routes.push({ pattern, regex, keys, handler, opts });
}

let prevUser = null;

export function initRouter(el) {
  appEl = el;
  window.addEventListener('hashchange', () => render());
  window.addEventListener('popstate', () => render());
  // Re-render tylko gdy auth się zmienia — żeby nie resetować inputów przy każdej zmianie store
  store.on(() => {
    if (store.user !== prevUser) {
      prevUser = store.user;
      render();
    }
  });
  prevUser = store.user;
}

export function navigate(path) {
  if (!path.startsWith('#')) path = '#' + (path.startsWith('/') ? path : '/' + path);
  if (location.hash === path) render();
  else location.hash = path;
}

export function currentPath() {
  const h = location.hash || '#/';
  return h.startsWith('#') ? h.slice(1) : h;
}

export async function render() {
  if (renderingLock) return;
  renderingLock = true;
  try {
    let raw = currentPath();
    if (!raw || raw === '/') {
      raw = store.user ? '/dashboard' : '/login';
      location.hash = '#' + raw;
      return;
    }
    // Odetnij query string przed dopasowaniem trasy
    const qIdx = raw.indexOf('?');
    const path = qIdx >= 0 ? raw.slice(0, qIdx) : raw;

    const requiresAuth = !PUBLIC.has(splitMain(path));
    if (requiresAuth && !store.user) {
      location.hash = '#/login';
      return;
    }
    if (!requiresAuth && store.user) {
      location.hash = '#/dashboard';
      return;
    }

    const match = matchRoute(path);
    if (!match) {
      mount(appEl, notFound(path));
      return;
    }

    appEl.classList.toggle('no-nav', !!match.def.opts.noNav || PUBLIC.has(splitMain(path)));

    const result = await match.def.handler(match.params, { path });
    if (result instanceof Node) {
      mount(appEl, result);
    } else if (typeof result === 'string') {
      appEl.innerHTML = result;
    }
    // Po renderze — scroll do góry
    appEl.scrollTop = 0;
    window.scrollTo({ top: 0, behavior: 'instant' });
  } finally {
    renderingLock = false;
  }
}

function splitMain(path) {
  // /dashboard → /dashboard; /receipt/123 → /receipt
  const parts = path.split('/').filter(Boolean);
  return '/' + (parts[0] || '');
}

function matchRoute(path) {
  for (const def of routes) {
    const m = def.regex.exec(path);
    if (m) {
      const params = {};
      def.keys.forEach((k, i) => { params[k] = decodeURIComponent(m[i + 1]); });
      return { def, params };
    }
  }
  return null;
}

function notFound(path) {
  const div = document.createElement('div');
  div.className = 'view';
  div.innerHTML = `<div class="empty"><div class="title">Strona nie znaleziona</div><div class="hint">${path}</div></div>`;
  return div;
}
