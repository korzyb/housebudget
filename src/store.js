// Globalny state z pub/sub. Czytany przez widoki, mutowany przez akcje.

const state = {
  user: null,           // supabase user
  profile: null,        // wiersz z public.profiles
  categories: [],       // lista kategorii (builtin + custom)
  receipts: [],         // wszystkie rachunki (jeden wspólny workspace)
  theme: 'dark',
  loading: false,
  // Tymczasowy bufor po OCR — używany przez camera → receipt-detail
  draftReceipt: null,
};

const listeners = new Set();

export const store = {
  get state() { return state; },
  get user() { return state.user; },
  get profile() { return state.profile; },
  get categories() { return state.categories; },
  get receipts() { return state.receipts; },
  get theme() { return state.theme; },
  get draftReceipt() { return state.draftReceipt; },

  set(partial) {
    Object.assign(state, partial);
    emit();
  },

  setReceipts(list) { state.receipts = list; emit(); },
  upsertReceipt(r) {
    const i = state.receipts.findIndex(x => x.id === r.id);
    if (i >= 0) state.receipts[i] = r;
    else state.receipts = [r, ...state.receipts];
    emit();
  },
  removeReceipt(id) {
    state.receipts = state.receipts.filter(r => r.id !== id);
    emit();
  },
  setCategories(list) { state.categories = list; emit(); },
  upsertCategory(c) {
    const i = state.categories.findIndex(x => x.id === c.id);
    if (i >= 0) state.categories[i] = c;
    else state.categories.push(c);
    emit();
  },
  removeCategory(id) {
    state.categories = state.categories.filter(c => c.id !== id);
    emit();
  },
  setTheme(theme) {
    state.theme = theme;
    document.documentElement.setAttribute('data-theme', theme);
    // theme_color meta
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', theme === 'dark' ? '#1a1830' : '#f3f4f8');
    emit();
  },
  setDraftReceipt(r) { state.draftReceipt = r; emit(); },
  clearDraftReceipt() { state.draftReceipt = null; emit(); },

  on(fn) { listeners.add(fn); return () => listeners.delete(fn); },
};

function emit() {
  for (const fn of listeners) {
    try { fn(state); } catch (e) { console.error(e); }
  }
}

// Helper: znajdź kategorię po id lub slug
export function findCategory(idOrSlug) {
  if (!idOrSlug) return null;
  return state.categories.find(c => c.id === idOrSlug || c.slug === idOrSlug) || null;
}
