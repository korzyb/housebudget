// Instalacja PWA — captura beforeinstallprompt (Android Chrome) + detekcja iOS.

let deferredPrompt = null;
let installed = false;
const listeners = new Set();

// Chrome/Edge na Androidzie wystrzeliwują ten event gdy spełnione są kryteria
// instalacji PWA. Łapiemy go i zapisujemy, żeby później user mógł
// kliknąć nasz własny przycisk "Zainstaluj".
window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  deferredPrompt = e;
  emit();
});

window.addEventListener('appinstalled', () => {
  deferredPrompt = null;
  installed = true;
  emit();
});

function emit() {
  for (const fn of listeners) {
    try { fn(); } catch (e) { console.error(e); }
  }
}

export function onInstallChange(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export function canInstall() {
  return deferredPrompt !== null;
}

export function isInstalled() {
  // Sprawdzamy też media query display-mode (apka odpalona z ikony home screen)
  if (installed) return true;
  if (window.matchMedia?.('(display-mode: standalone)').matches) return true;
  if (window.navigator.standalone === true) return true; // Safari iOS
  return false;
}

export async function promptInstall() {
  if (!deferredPrompt) return false;
  deferredPrompt.prompt();
  const choice = await deferredPrompt.userChoice;
  deferredPrompt = null;
  emit();
  return choice.outcome === 'accepted';
}

export function isIOS() {
  const ua = navigator.userAgent || navigator.vendor || '';
  // iPad na iPadOS 13+ raportuje się jako Mac z touchpoints
  const isMacPad = navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1;
  return /iPad|iPhone|iPod/.test(ua) || isMacPad;
}

export function isSafari() {
  const ua = navigator.userAgent || '';
  return /^((?!chrome|android).)*safari/i.test(ua);
}
