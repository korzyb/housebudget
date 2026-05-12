# Design Guide — Home Budget

**Wersja:** 1.0
**Data:** maj 2026

Aplikacja mobilna PWA. Ciemny motyw (dark) jest głównym i domyślnym. Jasny motyw pozostaje jako opcja do wyboru w ustawieniach. Nawigacja w dolnym pasku nawigacji (standard mobilny). Układ ekranów dostosowany do pionowego telefonu.

---

## 1. Filozofia designu

Home Budget wygląda jak aplikacja finansowa klasy premium na telefon — czysta, ciemna, czytelna. Inspiracja: hb04 (mobilny finance tracker), Revolut, Apple Wallet.

Trzy słowa opisujące styl:

- **Jasność** — użytkownik rozumie co widzi bez czytania instrukcji.
- **Głębia** — ciemne tło z wyraźnymi kartami tworzącymi poczucie warstw.
- **Precyzja** — liczby są głównym bohaterem. Duże, pogrubione, wyraźne.

---

## 2. Motywy

Aplikacja posiada dwa motywy. **Ciemny jest domyślny** — aplikacja uruchamia się w nim zawsze, chyba że użytkownik zmieni to w ustawieniach.

### Motyw ciemny (domyślny)

| Rola | Kolor | Opis |
|------|-------|------|
| Tło aplikacji | Głęboki granatowo-fioletowy | Bazowa powierzchnia ekranu |
| Karty | Ciemny niebieskoszary | Wyraźnie odróżnia się od tła |
| Kolor główny (primary) | Żywy indygo-niebieski | Aktywne przyciski, nawigacja, focus |
| Kolor akcentowy | Żywy koral / różowo-fioletowy | Budżet ring, wyróżnienia, „wydano" |
| Tekst główny | Jasna, lekko niebieskawa biel | Czytelny na ciemnym tle |
| Tekst pomocniczy | Przygaszony niebieskoszary | Etykiety, daty, podpisy |

### Motyw jasny (opcjonalny)

| Rola | Kolor | Opis |
|------|-------|------|
| Tło aplikacji | Chłodna, lekko szaroniebieskawa biel | Bazowa powierzchnia |
| Karty | Czysta, lekko ciepła biel | Wyraźnie odróżnia się od tła |
| Kolor główny (primary) | Żywy indygo-niebieski | Jak w ciemnym motywie |
| Kolor akcentowy | Żywy koral | Jak w ciemnym motywie |
| Tekst główny | Głęboki granatowo-szary | Nie czarny — tintowany w kierunku niebieskiego |
| Tekst pomocniczy | Jasny niebieskoszary | Etykiety, daty, podpisy |

### Kolory kategorii

Kolory kategorii są spójne w obu motywach — w ciemnym nieco jaśniejsze dla lepszej widoczności:

| Kategoria | Kolor |
|-----------|-------|
| 🛒 Jedzenie | Szmaragdowy ziel (ciepły teal) |
| 🚗 Transport | Indygo-niebieski (jak kolor główny) |
| 🎮 Rozrywka | Głęboki fiolet |
| 🏠 Dom | Bursztynowy (ciepły żółto-pomarańczowy) |
| 💊 Zdrowie | Koral (jak kolor akcentowy) |
| 👶 Dzieci | Ciepły różowy |
| ✈️ Wyjazdy | Turkusowy (jasny cyan) |
| 📱 Subskrypcje | Chłodny szarofioletowy |
| 📦 Inne | Szaroniebieski (stonowany, neutralny) |

Każda kategoria ma też wersję tła (10–15% nasycenia) stosowaną w ikonkach i kafelkach.

### Zasady używania kolorów

- Kolory kategorii są zawsze spójne w całej aplikacji.
- Kolor główny (niebieski) = akcja, nawigacja, focus.
- Koral = budżet, kwoty „wydano".
- Tekst na kolorowym tle nigdy nie jest szary — jest ciemniejszą (motyw jasny) lub jaśniejszą (motyw ciemny) wersją koloru tła.

---

## 3. Typografia

### Czcionka

Aplikacja używa **Plus Jakarta Sans** — nowoczesnej, geometrycznej czcionki bez szeryfów. Czytelna w małych rozmiarach, wyraźna różnica między wagami.

### Hierarchia tekstu

| Rodzaj tekstu | Rozmiar | Waga | Przykład |
|---------------|---------|------|---------|
| Kwota główna (hero) | 28–32px | Pogrubiona | Kwota w karcie statystyk, centrum pierścienia |
| Liczba w liście | 15–16px | Pogrubiona | Kwoty rachunków |
| Tytuł sekcji | 11–13px | Pogrubiona, WERSALIKI | „OSTATNIE RACHUNKI" |
| Etykieta | 11–12px | Normalna, pomocnicza | „Wydatki dziś" |
| Tekst wiersza | 13–14px | Normalna lub średnia | Nazwa sklepu, data |

**Zasada:** Kwoty zawsze pogrubione. Etykiety zawsze lżejsze. Duży kontrast między nimi tworzy hierarchię bez bałaganu.

Wszystkie kwoty finansowe w formacie polskim: `1 234,56 zł`.

---

## 4. Układ mobilny

Aplikacja jest zaprojektowana wyłącznie pod pionowy ekran telefonu (portrait). Szerokość robocza: 375–430px.

### Dolny pasek nawigacji

Stały pasek na dole ekranu z 4 ikonami:

```
[Dashboard]  [Rachunki]  [Kalendarz]  [Ustawienia]
```

Centralny przycisk „+" (dodaj paragon) — wyróżniony kolorem głównym, lekko uniesiony ponad pasek — widoczny z każdego ekranu.

Aktywna zakładka podświetlona kolorem głównym. Pozostałe w kolorze pomocniczym.

### Bezpieczne strefy

- Górna strefa (status bar): 44–50px margines od góry.
- Dolna strefa (home indicator na iPhone): 34px margines od dołu.
- Boczne marginesy ekranu: 16–20px.

### Karty i sekcje

- Karty z zaokrąglonymi rogami zajmują pełną szerokość ekranu (minus boczne marginesy).
- Sekcje oddzielane przestrzenią (16–24px), nie liniami.
- Przewijanie pionowe jako główny sposób poruszania się po ekranie.
- Poziome przewijanie tylko w karuzelach kategorii.

---

## 5. Zaokrąglenia i kształty

Żadnych ostrych kątów w całym interfejsie.

| Element | Zaokrąglenie |
|---------|-------------|
| Główne karty | 20–24px |
| Ikony kategorii | 16px |
| Przyciski | 12px |
| Pola formularza | 10px |
| Tagi i małe elementy | 8px |
| Przycisk „+" (dodaj) | Okrąg (50%) |

---

## 6. Cienie i głębia

W ciemnym motywie cienie są subtelne i fioletowo-niebieskie — karty lekko unoszą się nad tłem.

- Cień zawsze tintowany kolorem tła (fioletowo-niebieski w dark, niebieski w light).
- Małe krycie (6–10%).
- Duże rozmycie — brak twardych krawędzi.
- Dotknięcie elementu (tap) delikatnie zmienia jego jasność jako feedback.

---

## 7. Przestrzeń i rytm

- Karty mają duże wewnętrzne marginesy: 20–24px.
- Odstępy między kartami: 12–16px.
- Ważniejsze elementy (statystyki, pierścień budżetu) mają więcej przestrzeni wokół siebie.
- Sekcje oddzielane przestrzenią, nie liniami.

---

## 8. Ikony

Biblioteka **Lucide** — minimalne, jednolinijkowe ikony konturowe.

Ikony kategorii zawsze wewnątrz kolorowego kwadratu z zaokrąglonymi rogami (kolor tła danej kategorii) — nigdy same.

Ikony nawigacji: konturowe w kolorze pomocniczym, wypełnione (lub podświetlone) gdy aktywne.

---

## 9. Wykresy i wizualizacje

### Wykres słupkowy (historia miesięcy)

- Słupki dwukolorowe — jak na screenie hb04: kolor główny + kolor akcentowy (dochody vs wydatki) lub jeden kolor dla samych wydatków.
- Etykiety miesięcy pod spodem.
- Dotknięcie słupka pokazuje dymek z dokładną kwotą.
- Bez siatki, bez ramki.

### Pierścień budżetu

- Okrągły wykres z otworem w środku.
- Kolor akcentowy (koral/fiolet) → ile z limitu wydano.
- Ciemniejsze tło pierścienia → ile zostało.
- Centrum: duża kwota + etykieta „wydano".
- Gdy wydatki przekraczają 90% limitu — kolor zmienia się na czerwony.

---

## 10. Interakcje dotykowe

Aplikacja jest obsługiwana dotykiem — wszystkie elementy interaktywne dostosowane do palca:

- Minimalna powierzchnia dotyku: 44×44px.
- Feedback na dotknięcie: delikatna zmiana jasności elementu (nie animacja układu).
- Przeciąganie (swipe) w poziomie na liście rachunku → opcja usunięcia.
- Przeciąganie w dół na ekranie głównym → odświeżenie danych.

---

## 11. Zasady, których nie łamiemy

- Nigdy nie używamy czystej czerni (#000) ani czystej bieli (#fff) — zawsze tintowane.
- Nigdy nie pokazujemy szarego tekstu na kolorowym tle.
- Nie ma gradientów tekstu na kwotach ani nagłówkach.
- Nie zagnieżdżamy kart wewnątrz kart.
- Nie używamy wyskakujących okienek (modalów) — zamiast tego ekrany wsuwane od dołu lub osobne widoki.
- Nie animujemy właściwości układu (szerokość, wysokość, marginesy) — tylko opacity i transform.
- Każdy element interaktywny ma minimalną powierzchnię dotyku 44×44px.
