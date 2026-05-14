# CLAUDE.md

Kontekst projektu **Home Budget** dla przyszłych sesji Claude'a.

## Czym jest aplikacja

Mobilna PWA do zarządzania domowym budżetem. Pełna specyfikacja w `docs/PRD-home-budget.md`, design w `docs/design-guide.md`. Krótkie podsumowanie tech-stack'u w `docs/sumup.txt`.

Główne funkcje:
- Skanowanie paragonów przez Google Gemini Vision (klucz użytkownika)
- Ręczne dodawanie/edycja rachunków
- 8 ekranów: login, register, dashboard, kamera, szczegóły rachunku, lista, kalendarz, ustawienia
- Dwa motywy (dark domyślny, light opcjonalny)
- Wspólny workspace dla wszystkich zalogowanych użytkowników (1 budżet domowy, 2-3 osoby)

## Tech stack (świadomie minimalistyczny)

- **Vanilla HTML + CSS + ES Modules** — bez frameworka, bez build step, bez bundlera. Decyzja: maksymalna prostota, brak narzędzi do utrzymania.
- **Supabase** — PostgreSQL + auth (email/password) + storage (zdjęcia paragonów). Klient via `https://esm.sh/@supabase/supabase-js@2`.
- **Google Gemini Vision** (`gemini-2.5-flash-lite`) — OCR paragonów. Klucz API podawany przez użytkownika w ustawieniach, trzymany w `localStorage`.
- **GitHub Pages** — hosting statyczny, deploy via `git push`.
- **http-server** — tylko lokalny dev server (`npm start`).

## Struktura plików

```
/
├── CLAUDE.md                       # ten plik
├── README.md                       # instrukcja setup Supabase + Gemini + deploy
├── index.html                      # SPA entry, importuje main.js jako module
├── manifest.webmanifest            # PWA manifest
├── sw.js                           # service worker (NIE rejestruje się na localhost)
├── config.js                       # SUPABASE_URL i SUPABASE_ANON_KEY — committed, anon key jest publiczny z założenia
├── package.json                    # tylko devDep: http-server
├── icons/icon.svg                  # placeholder ikona PWA
├── styles/
│   ├── tokens.css                  # CSS custom properties: paleta dark+light, kategorie, spacing, radius
│   ├── base.css                    # reset, typografia (Plus Jakarta Sans z Google Fonts), mobile container
│   ├── components.css              # karty, przyciski, formularze, nav, sheet, toast
│   └── views.css                   # specyfika ekranów (dashboard, kalendarz, kamera, detal)
├── src/
│   ├── main.js                     # bootstrap (theme, routes, router, supabase init, sw)
│   ├── router.js                   # hash router z auth gate, render z renderingLock
│   ├── store.js                    # globalny state + pub/sub (user, profile, categories, receipts, theme, draftReceipt)
│   ├── supabase.js                 # init klienta + helpery DB (loadProfile, loadReceipts, saveReceipt, uploadReceiptPhoto, ...)
│   ├── gemini.js                   # callGemini(blob) → strukturalny JSON z paragonu
│   ├── categories.js               # 9 wbudowanych kategorii (slug, name, icon Lucide, color)
│   ├── format.js                   # formatPLN, formatDate, parsePLN, helpery dat
│   ├── icons.js                    # inline SVG (Lucide) z dynamicznym tworzeniem
│   ├── dom.js                      # mini-helper h(tag, attrs, children) i toast()
│   ├── components/
│   │   ├── bottom-nav.js           # 4 zakładki + central +
│   │   ├── add-sheet.js            # bottom sheet z opcjami (aparat/galeria/ręcznie); triggerGalleryPick otwiera natywny picker
│   │   ├── budget-ring.js          # SVG pierścień budżetu (czerwony >90%)
│   │   ├── bar-chart.js            # SVG słupki 6 mc
│   │   ├── calendar-grid.js        # siatka miesięczna z kropkami kategorii
│   │   ├── category-chip.js        # ikona w kolorowym kafelku
│   │   ├── receipt-row.js          # wiersz listy rachunków
│   │   └── stat-card.js
│   └── views/
│       ├── login.js / register.js
│       ├── dashboard.js
│       ├── camera.js               # eksportuje processReceiptBlob(blob) — wspólna procedura kompresja → upload → Gemini → draft → navigate
│       ├── receipt-detail.js       # formularz CRUD; sticky save/delete nad bottom-nav
│       ├── receipts.js             # lista + filtry zakres dat / kategoria
│       ├── calendar.js
│       └── settings.js             # motyw, limit budżetu, custom kategorie, klucz Gemini, konto, wyloguj
└── docs/
    ├── PRD-home-budget.md          # pełne wymagania produktowe
    ├── design-guide.md             # paleta, typografia, layout — źródło prawdy dla UI
    ├── supabase-schema.sql         # migracja DB do wklejenia w SQL Editor
    └── sumup.txt                   # ustalenia tech-stack
```

## Setup (raz, po klonie)

1. **Supabase**: utwórz darmowy projekt, w SQL Editor wklej `docs/supabase-schema.sql`, w Storage utwórz bucket `receipts` (public). URL + anon key → `config.js`.
2. **Polityki Storage** (oddzielnie, w SQL Editor — w `docs/supabase-schema.sql` na końcu są SQL z policies dla `storage.objects`).
3. **Gemini API key**: opcjonalnie do OCR. User wpisuje klucz w aplikacji w Ustawienia → klucz żyje w `localStorage`.

Lokalnie: `npm install && npm start` → http://localhost:8080.

Deploy: `git push` → GitHub Pages auto-deploy na `main` branch.

## Architektura — kluczowe decyzje

### Routing
Hash router (`#/dashboard`, `#/receipt/:id` itp.). Wybrany świadomie zamiast History API — GitHub Pages nie wymaga konfiguracji fallback 404→index. Trasy publiczne: `/login`, `/register`. Reszta wymaga `store.user`.

**Auth gate** w `router.js` — przed render sprawdza czy trasa publiczna i czy user zalogowany, jeśli nie pasuje robi redirect via `location.hash`.

**`renderingLock`** w `render()` zapobiega współbieżnym renderom.

**`prevUserId` (po id, nie po referencji)** — token refresh w Supabase tworzy nowy obiekt `user`, ale z tym samym id; bez tego porównania re-render leciał przy każdym refresh tokenu.

### Stan
`store.js` to prosty obiekt z metodami + pub/sub listenerami. Widoki subskrybują przez `store.on(() => rerender())` i odsubskrybują przez `window.addEventListener('hashchange', () => unsub(), { once: true })`.

`draftReceipt` jest tymczasowym bufferem: ustawiany w `processReceiptBlob` po analizie AI, czytany przez `renderReceiptDetail` (`#/receipt/new`) który klonuje i od razu czyści.

### Style i motywy
`data-theme="dark"|"light"` na `<html>`. Wszystkie kolory przez CSS custom properties w `tokens.css`. Motyw zapisany w `profiles.theme` w Supabase + w `localStorage`.

### Model danych
- `profiles` (1:1 z auth.users) — imię, monthly_budget, theme
- `categories` — 9 builtinów (seedowane w SQL) + custom userów
- `receipts` — sklep, data, kategoria, kwota, opis, photo_url, items (JSONB)
- Storage bucket `receipts` — pliki w `{user_id}/{uuid}.{ext}`

**RLS**: jeden wspólny workspace — każdy zalogowany user widzi i pisze wszystko. Akceptowalne dla MVP (2-3 osoby z jednego gospodarstwa). Per PRD §7, ról i workspace'ów nie ma.

## Gotchas / nauczki z dotychczasowej pracy

### 1. Supabase JS SDK i `.single()` potrafią wisieć
Przy `.insert().select().single()` SDK czasem nie zwalniał promise mimo że request wracał 200. Rachunek ZAPISYWAŁ się w bazie, ale klient wisiał do timeoutu. **Workaround**: bez `.single()`, użyj `.select()` i unwrap `rows[0]` ręcznie. Patrz `saveReceipt()` w `supabase.js`. Cała baza operacji w `supabase.js` została z `.single()`/`.maybeSingle()` przepisana — nie używaj tych metod w nowym kodzie.

Podobny pattern może dotyczyć innych operacji. Jak coś wisi mimo 200 w Network — zrezygnuj z `.single()`.

### 1a. DEADLOCK na `navigator.locks` w `onAuthStateChange` (CRITICAL)
**Najgrubszy bug który złapaliśmy.** Objaw: "pierwsza operacja działa, kolejne wiszą do timeoutu". Stack trace pokazuje `locks.ts` + `_recoverAndRefresh` + `_notifyAllSubscribers`.

Supabase auth SDK (`@supabase/auth-js` → `GoTrueClient`) używa `navigator.locks` na klucz typu `sb-<projectref>-auth-token`. Lock jest trzymany przez cały czas trwania callbacka `onAuthStateChange`. Jeśli w callbacku **awaitujemy** cokolwiek co używa tego samego locka (a `supabase.from(...)` go używa do walidacji JWT), mamy klasyczny deadlock — callback czeka na zapytanie, zapytanie czeka na zwolnienie locka, lock zwolni się dopiero gdy callback wyjdzie.

**Reguła**: callback `onAuthStateChange` **musi być synchroniczny** (nie `async`) i NIE wolno w nim awaitować operacji na `supabase.from(...)` ani `supabase.storage` ani `supabase.auth`. Fire-and-forget z `.catch()`:

```js
supabase.auth.onAuthStateChange((event, session) => {
  if (event === 'SIGNED_IN') {
    store.set({ user: session.user });
    afterSignIn().catch(console.error);  // BEZ await
  }
});
```

Ten sam pattern dotyczy `signOut()` — bezpośredni `await supabase.auth.signOut()` w handlerze kliku też wisiał (Violation: click took 3000ms+). Rozwiązanie: ręcznie wyczyść `store` + `sb-*` z localStorage synchronicznie, SDK signOut puścić w tle.

### 2. Service worker NIE rejestruje się na localhost
`main.js` sprawdza `location.hostname` i pomija SW na `localhost`/`127.0.0.1`. Plus aktywnie wyrejestrowuje pozostałości z poprzednich sesji. Powód: SW agresywnie cache'ował stare moduły w developmentie i każda zmiana wymagała czyszczenia storage.

Na produkcji (GH Pages) SW działa normalnie z app-shell caching i bumpniętą wersją.

### 3. `popstate` powodował double render
Usunięty z `router.js` listener — w Chromie pewnie odpalał razem z `hashchange` przy zmianie fragmentu URL. Skutek: każdy widok renderował się 2x; w `receipt-detail.js` pierwszy render konsumował `draftReceipt`, drugi widział null i renderował pusty formularz NA WIERZCHU pierwszego.

### 4. Gemini limity per model
Twój projekt Google miał `limit: 0` na `gemini-2.0-flash` i `gemini-2.5-flash` na darmowym tierze. **`gemini-2.5-flash-lite` ma największy darmowy quota** — używamy tego. Lista innych modeli w komentarzu w `gemini.js`.

### 5. Kompresja zdjęcia w `processReceiptBlob`
Mobilne aparaty robią 3-5MB zdjęcia. Bez kompresji upload na wolniejszej sieci timeoutował (30s). `compressImage()` redukuje do 1600px po dłuższym boku, JPEG q=0.85. Typowo 4MB → ~300KB. Pomijamy dla plików <500KB.

### 6. Galeria — przetwarzanie inline
Po wyborze pliku z galerii **nie nawigujemy** do dedykowanego route'a. `add-sheet.js` w `change` handlerze woła `processReceiptBlob(file)` bezpośrednio. Ta procedura pokazuje overlay w `<body>` (niezależny od mountowanych widoków), upload + Gemini, potem `navigate('/receipt/new')` z draftem. Wcześniejsza wersja używała route'a `/camera?source=process` i doprowadzała do double-renderów.

### 7. `config.js` jest publiczny (anon key Supabase jest by-design)
Mimo nazwy "local"-podobnej, `config.js` zawiera **SUPABASE_URL i SUPABASE_ANON_KEY** które są publiczne — RLS chroni dane. **Nie wkładaj tu `service_role` key.**

### 8. Lokalne testowanie
Najpewniejsze: **incognito** (`Ctrl+Shift+N`) na `localhost:8080`. Brak cache, brak SW, brak stałych localStorage. Po teście można wrócić do zwykłej karty — auto-unregister SW zadziała.

Throttling sieci do testów mobilnych: F12 → Network → "Slow 4G" / "Fast 3G".

## Workflow rozwojowy

User preferuje: **zmiana → test lokalnie → potwierdzenie → commit + push**. Nie pushuj zmian bez wcześniejszego potwierdzenia że działają lokalnie, chyba że to oczywisty hotfix.

Commit messages: zwięzłe, opisowe, po polsku jeśli kontekst polski. Format jak w historii: jednoliniowy subject + multi-line body z `Co-Authored-By: Claude ...`.

## Co zostało do zrobienia / znane braki

- **Upload zdjęcia czasem wisi** (podobnie jak save przed naszym fixem). Trzeba albo dorobić retry/timeout fallback, albo użyć tej samej techniki "bez .single() i sprawdź czy plik tam jest". Dla MVP akceptowalne — bez zdjęcia rachunek i tak się zapisze.
- **PWA install na iOS** — wymaga PNG ikon, mamy SVG. Działa na Androidzie. Można dorobić PNG przez np. ImageMagick.
- **Custom kategorie** — działają w ustawieniach, ale color picker jest minimalny (9 predefiniowanych kolorów).
- **Walidacja** w formularzach — minimalna. Idealnie więcej guards.
- Funkcje "planowane" z PRD §7: eksport CSV/PDF, push notifs, planowanie budżetu per kategoria, role userów, wiele portfeli.

## Komendy

```bash
npm install              # raz po klonie
npm start                # serwer dev na localhost:8080
npm run dev              # serwer na 0.0.0.0:8080 (dostępny w sieci lokalnej, do testów telefonem)
git push                 # deploy na GitHub Pages
```
