# Design Guide — Home Budget

**Wersja:** 1.0  
**Data:** kwiecień 2026

---

## 1. Filozofia designu

Home Budget wygląda jak narzędzie finansowe klasy premium — czyste, spokojne, czytelne. Nie ma tu niepotrzebnego chaosu wizualnego, krzykliwych kolorów ani przeładowania informacjami. Każdy element na ekranie jest tam po coś.

Trzy słowa, które opisują styl:

- **Jasność** — użytkownik rozumie, co widzi, bez czytania instrukcji.
- **Spokój** — jasne tło, dużo powietrza, miękkie cienie. Nic nie krzyczy.
- **Precyzja** — liczby są głównym bohaterem. Kwoty są duże, pogrubione i wyraźne.

Inspiracje: Apple (przestrzeń i czytelność), Revolut (dynamika danych finansowych), Airbnb (ciepło w detalach).

---

## 2. Kolory

### Paleta główna

Aplikacja używa jasnego trybu z chłodnymi odcieniami. Tło jest lekko niebieskaw szare — nie czysta biel, żeby nie było płasko.

| Rola | Kolor | Opis |
|------|-------|------|
| Tło aplikacji | Chłodna, lekko szaroniebieskawa biel | Bazowa powierzchnia, na której leżą karty |
| Karty (białe prostokąty) | Czysta, lekko ciepła biel | Wyraźnie odróżnia się od tła |
| Kolor główny (primary) | Żywy indygo-niebieski | Aktywne przyciski, podkreślenia, nawigacja |
| Kolor akcentowy | Żywy koral | Budżet ring, wyróżnienia, „wydano" |
| Tekst główny | Głęboki granatowo-szary | Nie czarny — tintowany w kierunku niebieskiego |
| Tekst pomocniczy | Jasny niebieskoszary | Etykiety, daty, podpisy — wyraźnie słabszy od głównego |

### Kolory kategorii

Każda kategoria ma swój własny kolor, wyraźnie nasycony i rozpoznawalny:

| Kategoria | Kolor | Odcień |
|-----------|-------|--------|
| Jedzenie | Szmaragdowy ziel | ciepły teal |
| Transport | Indygo-niebieski | jak kolor główny |
| Rozrywka | Fioletowy | głęboki violet |
| Dom | Bursztynowy | ciepły żółto-pomarańczowy |
| Zdrowie | Koral | jak kolor akcentowy |
| Inne | Szaroniebieski | stonowany, neutralny |

Każda kategoria ma też jasną wersję tła (10–15% nasycenia) stosowaną w ikonkach i kafelkach.

### Zasady używania kolorów

- Kolory kategorii **zawsze** są spójne w całej aplikacji — ta sama kategoria ma zawsze ten sam kolor niezależnie od widoku.
- Kolor główny (niebieski) = akcja, nawigacja, focus.
- Koral = budżet, kwoty „wydano", drugi plan.
- **Tekst na kolorowym tle** nigdy nie jest szary — jest ciemniejszą wersją koloru tła.

---

## 3. Typografia

### Czcionka

Aplikacja używa **Plus Jakarta Sans** — nowoczesnej, geometrycznej czcionki bez szeryfów. Jej cechy:
- Okrągłe, geometryczne litery — miękkie i przyjazne.
- Bardzo czytelna w małych rozmiarach.
- Wyraźna różnica między wagami (cienka vs pogrubiona).

### Hierarchia tekstu

System działa na kontraście — nie wszystkie teksty są tak samo ważne:

| Rodzaj tekstu | Rozmiar | Waga | Przykład zastosowania |
|---------------|---------|------|----------------------|
| Kwota główna (hero) | 22–26px | **Pogrubiona** | Kwota w karcie statystyk, centrum pierścienia |
| Liczba w tabeli | 14–16px | Pogrubiona | Kwoty na listach rachunków |
| Tytuł sekcji | 11–13px | Pogrubiona, WERSALIKI | „OSTATNIE WYDATKI", „KALENDARZ" |
| Etykieta | 11–12px | Normalna, szara | „Wydatki dziś", „Limit miesięczny" |
| Tekst w wierszu | 13px | Normalna lub średnia | Nazwa sklepu, data |

**Kluczowa zasada:** Kwoty i liczby są zawsze pogrubione. Etykiety i opisy zawsze lżejsze. Duża różnica między nimi tworzy wyraźną hierarchię bez bałaganu.

### Liczby

Wszystkie kwoty finansowe używają **tabulatorów liczbowych** — cyfry mają identyczną szerokość, więc kolumny liczb zawsze się wyrównują pionowo. Kwoty zapisywane są w formacie polskim: `1 234,56 zł`.

---

## 4. Zaokrąglenia i kształty

To jeden z najbardziej charakterystycznych elementów wizualnych aplikacji.

| Element | Zaokrąglenie | Przykład |
|---------|-------------|---------|
| Główne karty | ~28px | Karty statystyk, wykresy, sidebar |
| Ikony kategorii | ~20px | Kolorowe kwadraty z ikoną |
| Przyciski | ~12px | Przyciski akcji, filtry |
| Bardzo małe elementy | ~8px | Tagi, pola formularza |

**Żadnych ostrych kątów** w całym interfejsie. Duże zaokrąglenia dają poczucie miękkości i nowoczesności, nawiązując do stylu aplikacji mobilnych premium.

---

## 5. Cienie i głębia

Aplikacja używa subtelnnych, **rozmytych cieni** z lekkim odcieniem koloru tła. Efekt: karty wydają się lekko unosić nad tłem, ale nie w sposób krzykliwy.

Zasady:
- Cień jest zawsze niebieskawy (tintowany), nigdy czarny ani szary.
- Małe krycie (4–8%) — ledwo widoczne, ale wyczuwalne.
- Duże rozmycie — żadnych twardych krawędzi.
- Hover na kartach (gdy myszka nad elementem) delikatnie podnosi cień.

---

## 6. Przestrzeń i rytm

Aplikacja oddycha. Elementy nie są ściśnięte razem.

- **Karty mają duże wewnętrzne marginesy** (24–28px) — treść nigdy nie jest przy samej krawędzi.
- **Odstępy między kartami** są konsekwentne (16px między małymi elementami, 24–32px między sekcjami).
- **Sekcje są oddzielane przestrzenią**, nie liniami. Linie pojawia się rzadko i są bardzo jasne.

Rytm wizualny jest **zróżnicowany** — nie wszystko ma ten sam rozmiar i odstępy. Ważniejsze elementy (statystyki, pierścień) mają więcej przestrzeni wokół siebie.

---

## 7. Ikony

Aplikacja używa biblioteki **Lucide** — minimalnych, jednolinijnych ikon konturowych. Każda kategoria ma dedykowaną ikonę:

- Jedzenie → koszyk sklepowy
- Transport → samochód
- Rozrywka → gamepad
- Dom → dom
- Zdrowie → serce z pulsem
- Inne → paczka

Ikony pojawiają się zawsze wewnątrz **kolorowego kwadratu** (kolor tła danej kategorii), nigdy same. Dzięki temu są widoczne nawet gdy bardzo małe.

---

## 8. Nawigacja

Nawigacja główna to **prosty tekst z podkreśleniem** — żadnych przycisków, zakładek ani pól. Aktywna sekcja podkreślona jest cienką kreską.

Zasada: nawigacja jest w tle, nie przykuwa uwagi. Treść jest na pierwszym planie.

---

## 9. Wykresy i wizualizacje

### Wykres słupkowy (historia 6 miesięcy)

- Słupki w kolorze głównym (niebieski indygo).
- Po najechaniu myszką słupek rozjaśnia się, a nad nim pojawia się dymek z dokładną kwotą.
- Etykiety miesięcy pod spodem, wartości osi pionowej po lewej.
- Proste, bez siatki, bez ramki.

### Pierścień budżetu

- Okrągły wykres kołowy z okrągłym otworem w środku.
- Kolor korala → ile z limitu zostało wydane.
- Szare tło pierścienia → ile zostało.
- Centrum: duża kwota + mała etykieta „zł" w kolorze akcentowym + napis „wydano".
- Gdy wydatki przekraczają 90% limitu — kolor zmienia się na czerwony jako ostrzeżenie.
- Pod pierścieniem: limit miesięczny i pozostała kwota.

---

## 10. Tryb ciemny

Aplikacja posiada wersję ciemną (dark mode), dostosowaną do preferencji systemowych przeglądarki lub urządzenia. W trybie ciemnym:

- Tło zmienia się na głęboki granatowy.
- Karty na ciemny niebieskoszary.
- Kolory kategorii rozjaśniają się (większa widoczność na ciemnym tle).
- Cienie stają się mniej widoczne (nie ma sensu robić cieni na ciemnym tle).

---

## 11. Zasady, których nie łamiemy

- Nigdy nie używamy czystej czerni (#000) ani czystej bieli (#fff) — zawsze tintowane.
- Nigdy nie pokazujemy szarego tekstu na kolorowym tle — zawsze ciemniejszy odcień tego koloru.
- Nie ma gradientów tekstu na kwotach ani nagłówkach.
- Nie zagnieżdżamy kart wewnątrz kart (karty w kartach).
- Nie używamy modali (okienek dialogowych) — zamiast tego ekspandowane sekcje lub osobne widoki.
- Nie animujemy właściwości układu (szerokość, wysokość, marginesy) — tylko opacity i transform.
