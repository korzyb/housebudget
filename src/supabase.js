// Klient Supabase + helpery do DB. Jedyne miejsce gdzie używamy SDK.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.4';
import { store } from './store.js';

let supabase = null;
let configLoaded = false;
let configError = null;

export async function initSupabase() {
  try {
    const mod = await import('../config.js');
    const { SUPABASE_URL, SUPABASE_ANON_KEY } = mod;
    if (!SUPABASE_URL || !SUPABASE_ANON_KEY || SUPABASE_URL.includes('YOUR-')) {
      throw new Error('Brak prawdziwych kluczy w config.js');
    }
    supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: { persistSession: true, autoRefreshToken: true, storage: localStorage },
    });
    configLoaded = true;

    // Init session + listener
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user) {
      store.set({ user: session.user });
      afterSignIn().catch(err => console.error('[afterSignIn]', err));
    }

    // KRYTYCZNE: callback NIE może być async/awaitujący — SDK trzyma navigator.locks
    // przez czas trwania callbacka. Jak tu awaitujemy operację która potrzebuje
    // tego samego locka (np. supabase.from()), mamy deadlock.
    supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        store.set({ user: session.user });
        afterSignIn().catch(err => console.error('[afterSignIn]', err));
      } else if (event === 'SIGNED_OUT') {
        store.set({ user: null, profile: null, receipts: [], categories: [] });
      }
    });

    return supabase;
  } catch (e) {
    configError = e;
    console.error('Supabase init failed:', e);
    return null;
  }
}

export function getSupabase() {
  return supabase;
}

export function isConfigured() {
  return configLoaded;
}

export function getConfigError() {
  return configError;
}

// Po zalogowaniu: pobierz profil, kategorie i rachunki
async function afterSignIn() {
  await Promise.all([
    loadProfile(),
    loadCategories(),
    loadReceipts(),
  ]);
  // Zastosuj theme z profilu
  const t = store.profile?.theme || 'dark';
  store.setTheme(t);
}

export async function loadProfile() {
  if (!supabase || !store.user) return;
  const op = supabase.from('profiles').select('*').eq('id', store.user.id).limit(1);
  const { data: rows, error } = await withTimeout(op, 15000, 'Pobieranie profilu trwa za długo.');
  if (error) { console.error(error); return; }
  store.set({ profile: (rows && rows[0]) || null });
}

export async function updateProfile(patch) {
  if (!supabase || !store.user) return null;
  const op = supabase.from('profiles').update(patch).eq('id', store.user.id).select();
  const { data: rows, error } = await withTimeout(op, 15000, 'Zapis profilu trwa za długo.');
  if (error) throw error;
  const data = Array.isArray(rows) ? rows[0] : rows;
  if (data) store.set({ profile: data });
  return data;
}

export async function loadCategories() {
  if (!supabase) return;
  const op = supabase.from('categories').select('*').order('is_builtin', { ascending: false }).order('name');
  const { data, error } = await withTimeout(op, 15000, 'Pobieranie kategorii trwa za długo.');
  if (error) { console.error(error); return; }
  store.setCategories(data || []);
}

export async function createCategory(c) {
  if (!supabase) return null;
  const op = supabase.from('categories').insert({ ...c, is_builtin: false, created_by: store.user?.id }).select();
  const { data: rows, error } = await withTimeout(op, 15000, 'Dodawanie kategorii trwa za długo.');
  if (error) throw error;
  const data = Array.isArray(rows) ? rows[0] : rows;
  if (data) store.upsertCategory(data);
  return data;
}

export async function deleteCategory(id) {
  if (!supabase) return;
  const op = supabase.from('categories').delete().eq('id', id);
  const { error } = await withTimeout(op, 15000, 'Usuwanie kategorii trwa za długo.');
  if (error) throw error;
  store.removeCategory(id);
}

export async function loadReceipts() {
  if (!supabase) return;
  const op = supabase.from('receipts').select('*').order('purchase_date', { ascending: false }).order('created_at', { ascending: false });
  const { data, error } = await withTimeout(op, 15000, 'Pobieranie rachunków trwa za długo.');
  if (error) { console.error(error); return; }
  store.setReceipts(data || []);
}

export async function saveReceipt(receipt) {
  if (!supabase) return null;
  const payload = { ...receipt, created_by: receipt.created_by || store.user?.id };

  // Świadomie BEZ .single() — w niektórych okolicznościach SDK nie zwalnia promise
  // (request kończy się 200 server-side, ale klient wisi). Bierzemy pierwszy element ręcznie.
  const op = payload.id
    ? (() => {
        const { id, created_at, created_by, ...patch } = payload;
        return supabase.from('receipts').update(patch).eq('id', id).select();
      })()
    : supabase.from('receipts').insert(payload).select();

  const { data: rows, error } = await withTimeout(op, 20000, 'Zapis rachunku trwa za długo (>20s). Sprawdź połączenie.');
  if (error) throw error;
  const data = Array.isArray(rows) ? rows[0] : rows;
  if (data) store.upsertReceipt(data);
  return data;
}

// Helper: timeout dla Promise SDK Supabase (nie ma natywnego AbortController na SDK calls).
function withTimeout(promise, ms, message) {
  return Promise.race([
    promise,
    new Promise((_, reject) => setTimeout(() => reject(new Error(message)), ms)),
  ]);
}

export async function deleteReceipt(id) {
  if (!supabase) return;
  const { error } = await supabase.from('receipts').delete().eq('id', id);
  if (error) throw error;
  store.removeReceipt(id);
}

export async function uploadReceiptPhoto(blob, ext = 'jpg') {
  if (!supabase || !store.user) throw new Error('Brak sesji');
  const filename = `${store.user.id}/${crypto.randomUUID()}.${ext}`;

  const uploadPromise = supabase.storage
    .from('receipts')
    .upload(filename, blob, { contentType: blob.type || 'image/jpeg', upsert: false });

  const timeoutPromise = new Promise((_, reject) =>
    setTimeout(() => reject(new Error('Upload timeout (30s). Sprawdź bucket "receipts" i polityki Storage w Supabase.')), 30000)
  );

  const result = await Promise.race([uploadPromise, timeoutPromise]);
  if (result.error) {
    throw new Error(`Storage ${result.error.statusCode || ''}: ${result.error.message || JSON.stringify(result.error)}`);
  }
  const { data } = supabase.storage.from('receipts').getPublicUrl(filename);
  return data.publicUrl;
}

export async function signIn(email, password) {
  if (!supabase) throw new Error('Supabase nie jest skonfigurowane');
  const op = supabase.auth.signInWithPassword({ email, password });
  const { data, error } = await withTimeout(op, 15000, 'Logowanie trwa za długo. Spróbuj ponownie.');
  if (error) throw error;
  return data;
}

export async function signUp(email, password, name) {
  if (!supabase) throw new Error('Supabase nie jest skonfigurowane');
  const op = supabase.auth.signUp({
    email,
    password,
    options: { data: { name } },
  });
  const { data, error } = await withTimeout(op, 15000, 'Rejestracja trwa za długo. Spróbuj ponownie.');
  if (error) throw error;
  return data;
}

export function signOut() {
  // Natychmiastowy logout — czyścimy store i sb-* z localStorage synchronicznie.
  // Bez await na SDK (potrafi wisieć 3+ sekund z navigator.locks). Router widzi
  // user=null i redirektuje na /login od razu.
  store.set({ user: null, profile: null, receipts: [], categories: [] });
  try {
    for (const k of Object.keys(localStorage)) {
      if (k.startsWith('sb-')) localStorage.removeItem(k);
    }
  } catch {}
  // SDK signOut w tle — bez wpływu na UX
  if (supabase) {
    supabase.auth.signOut({ scope: 'local' }).catch(err => console.warn('[signOut bg]', err));
  }
}

export async function resetPassword(email) {
  if (!supabase) throw new Error('Supabase nie jest skonfigurowane');
  const op = supabase.auth.resetPasswordForEmail(email, {
    redirectTo: location.origin + location.pathname,
  });
  const { error } = await withTimeout(op, 15000, 'Wysyłanie maila trwa za długo.');
  if (error) throw error;
}

export async function changePassword(newPassword) {
  if (!supabase) throw new Error('Supabase nie jest skonfigurowane');
  const op = supabase.auth.updateUser({ password: newPassword });
  const { error } = await withTimeout(op, 15000, 'Zmiana hasła trwa za długo.');
  if (error) throw error;
}
