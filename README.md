# Home Budget

Mobilna PWA do zarządzania budżetem domowym. Skanowanie paragonów przez AI (Google Gemini), synchronizacja danych między urządzeniami przez Supabase, instalowana na telefonie z ekranu głównego.

## Stack

- Vanilla HTML + CSS + ES Modules (bez frameworka, bez build step)
- Supabase (PostgreSQL + auth + storage)
- Google Gemini Vision API (OCR paragonów — klucz API podawany przez użytkownika)
- GitHub Pages (hosting)
- http-server (lokalny serwer dev)

## Setup lokalny

### 1. Konto Supabase

1. Wejdź na https://supabase.com i utwórz darmowy projekt.
2. W panelu projektu otwórz **SQL Editor** → wklej zawartość pliku `docs/supabase-schema.sql` → Run. To tworzy tabele, RLS, trigger profilu i seedy 9 wbudowanych kategorii.
3. W panelu **Storage** utwórz bucket `receipts` (public read).
4. W **Project Settings → API** skopiuj `Project URL` i `anon public` key.

### 2. Konfiguracja kluczy

Otwórz `config.js` i wklej swoje wartości z Supabase:

```js
export const SUPABASE_URL = 'https://YOUR-PROJECT.supabase.co';
export const SUPABASE_ANON_KEY = 'eyJ...';
```

**Uwaga o bezpieczeństwie:** `SUPABASE_URL` i `SUPABASE_ANON_KEY` są publiczne z założenia
(każda frontendowa apka Supabase ma je wbite w bundle). Bezpieczeństwo zapewniają polityki RLS
w bazie. Nigdy nie wklejaj do `config.js` `service_role` key — ten ma pełen dostęp do bazy.

### 3. Klucz Gemini (opcjonalny — bez niego OCR paragonów nie działa, ręczne dodawanie działa)

1. Wejdź na https://aistudio.google.com/apikey i wygeneruj klucz.
2. Wklej klucz w ustawieniach aplikacji już po zalogowaniu (Ustawienia → Klucz Gemini). Klucz trzymany w localStorage przeglądarki — nigdy nie idzie do Supabase ani innego serwera.

### 4. Uruchomienie

```bash
npm install
npm start
```

Otwiera http://localhost:8080.

### Test na telefonie (lokalnie)

```bash
npm run dev
```

Aplikacja słucha na `0.0.0.0:8080`. W przeglądarce telefonu (w tej samej sieci WiFi) otwórz `http://<IP-twojego-komputera>:8080`. Uwaga: kamera (`getUserMedia`) wymaga HTTPS, więc lokalnie zadziała tylko fallback przez galerię. Pełna kamera działa na produkcji (GitHub Pages serwuje HTTPS).

## Deploy na GitHub Pages

1. Wypchnij commit na `main`.
2. W repo na GitHubie: **Settings → Pages → Source: Deploy from a branch → main / root → Save**.
3. Po chwili apka dostępna pod `https://<username>.github.io/housebudget/`.
4. Otwórz URL w Chrome na telefonie → menu → **Dodaj do ekranu głównego**.

## Architektura

- `index.html` — single page, hash routing
- `src/main.js` — bootstrap (router, store, auth, service worker)
- `src/router.js` — hash router z guard'em uwierzytelnienia
- `src/store.js` — globalny state z pub/sub
- `src/supabase.js` — wszystkie wywołania DB (jedna warstwa)
- `src/gemini.js` — OCR przez Gemini Vision
- `src/views/` — ekrany (login, register, dashboard, receipts, calendar, settings, camera, receipt-detail)
- `src/components/` — wspólne komponenty UI (bottom-nav, budget-ring, bar-chart, calendar-grid, ...)
- `styles/tokens.css` — design tokens (paleta dark+light z Design Guide)

## Uwagi bezpieczeństwa

- Aplikacja zakłada **jeden wspólny budżet** dla wszystkich zalogowanych userów. Nie udostępniaj URL i konta Supabase osobom spoza twojego gospodarstwa.
- Klucz Gemini API żyje w localStorage przeglądarki. Wyloguj się i wyczyść storage jeśli ktoś inny używa twojego telefonu.

## Dokumentacja produktowa

- `docs/PRD-home-budget.md` — opis funkcji i ekranów
- `docs/design-guide.md` — kolory, typografia, układ
- `docs/supabase-schema.sql` — migracja bazy
