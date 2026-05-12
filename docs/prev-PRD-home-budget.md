# PRD — Home Budget: Inteligentny Asystent Budżetu Domowego

**Wersja:** 1.1
**Data:** kwiecień 2026
**Status:** W trakcie rozwoju

---

## 1. Cel

Home Budget to prywatna aplikacja webowa, która zamienia chaos paragonów i rachunków w przejrzysty obraz domowych finansów. Zamiast ręcznego wpisywania danych — wystarczy zrobić zdjęcie lub wgrać skan rachunku. Resztą zajmuje się wbudowana sztuczna inteligencja.

**Główna obietnica dla użytkownika:**

> *„Sfotografuj paragon, a aplikacja sama go ogarnie. Zawsze wiesz, gdzie idą pieniądze."*

---

## 2. Dla kogo jest ta aplikacja?

Aplikacja jest przeznaczona do użytku osobistego lub rodzinnego — przez jedną osobę lub parę prowadzącą wspólny budżet domowy. Główne scenariusze:

- Ktoś, kto chce wiedzieć, ile miesięcznie wydaje na jedzenie, paliwo czy rozrywkę.
- Osoba, która gubi paragony i traci poczucie kontroli nad wydatkami.
- Rodzina, która chce łatwo śledzić, czy mieści się w miesięcznym budżecie.

Aplikacja **nie wymaga zakładania konta ani logowania** — wszystkie dane są przechowywane lokalnie, wyłącznie na urządzeniu użytkownika.

---

## 3. Co aplikacja robi - przegląd funkcji

### 3.1 Skanowanie rachunków przez AI

Użytkownik wgrywa zdjęcie lub skan paragonu (JPG, PNG, PDF). Aplikacja wysyła go do silnika sztucznej inteligencji (Google Gemini), który automatycznie:

- rozpoznaje nazwę sklepu lub usługodawcy,
- wyciąga datę zakupu,
- tworzy listę pozycji z cenami,
- oblicza kwotę końcową,
- proponuje kategorię wydatku (np. Jedzenie, Transport, Dom).

Po analizie użytkownik widzi wynik i może go poprawić przed zapisaniem — na wypadek, gdyby AI pomyliła się w jakimś szczególe.

### 3.2 Lokalne przechowywanie danych

Wszystkie rachunki, zdjęcia i dane są zapisywane bezpośrednio w przeglądarce użytkownika (w lokalnej bazie danych). Oznacza to:

- **żadnych serwerów**, żadnej rejestracji, żadnego logowania,
- dane **nigdy nie opuszczają urządzenia** (poza chwilą analizy przez AI),
- aplikacja działa nawet bez dostępu do internetu (po pierwszym załadowaniu).

### 3.3 Kategorie wydatków

Aplikacja posiada 6 wbudowanych kategorii, każda z własnym kolorem i ikoną:

| Kategoria    | Opis                                      |
| ------------ | ----------------------------------------- |
| 🛒 Jedzenie  | Sklepy spożywcze, restauracje, kawiarnie |
| 🚗 Transport | Paliwo, bilety komunikacji, parking       |
| 🎮 Rozrywka  | Kino, książki, sport, streaming         |
| 🏠 Dom       | Artykuły domowe, meble, remonty          |
| 💊 Zdrowie   | Apteka, kosmetyki, siłownia              |
| 📦 Inne      | Elektronika, usługi, zakupy online       |

Użytkownik może też dodawać własne kategorie z wybraną ikoną i kolorem.

---

## 4. Widoki aplikacji

### 4.1 Widok: Przegląd (Dashboard)

Strona główna aplikacji. Otwiera się jako pierwsza i daje pełny obraz sytuacji finansowej na jeden rzut oka.

**Co zawiera:**

- **3 karty z kwotami** — wydatki dziś, w tym tygodniu i w bieżącym miesiącu.
- **Wykres słupkowy** — historia wydatków z ostatnich 6 miesięcy, żeby zobaczyć trendy.
- **Pierścień budżetu** — wizualizacja tego, ile z miesięcznego limitu (5 000 zł) zostało już wydane. Centrum pierścienia pokazuje dokładną kwotę, a kolor zmienia się na czerwony gdy zbliżamy się do limitu.
- **Karty kategorii** — poziomy karuzel pokazujący, ile wydano w każdej kategorii tego miesiąca, uszeregowany od najwyższych do najniższych.
- **Panel boczny** z:
  - listą ostatnich rachunków (klikalne, prowadzą do szczegółów),
  - własne kategorie użytkownika,
  - przyciskiem dodania nowej kategorii,
  - mini-kalendarzem z zaznaczonymi dniami, w których były zakupy.
- **Przycisk dodania rachunku** — otwiera strefę do wgrania zdjęcia.

### 4.2 Widok: Rachunki (Lista)

Pełna lista wszystkich zapisanych rachunków w formie tabeli.

**Co zawiera:**

- Tabela z kolumnami: sklep, data, kategoria, kwota.
- **Filtry** — według zakresu dat (od–do) i według kategorii.
- Sortowanie po dacie.
- Przycisk usunięcia rachunku przy każdym wierszu.
- Kliknięcie rachunku → otwiera widok Szczegółów.

### 4.3 Widok: Szczegóły rachunku

Pełny podgląd jednego rachunku po kliknięciu go z listy lub po dodaniu nowego.

**Co zawiera:**

- Podgląd zdjęcia/skanu paragonu (po lewej).
- Formularz z danymi (po prawej):
  - Nazwa sklepu
  - Data zakupu
  - Kategoria (można zmienić)
  - Lista pozycji z cenami
  - Kwota łączna
- Przyciski: **Zapisz zmiany** i **Usuń rachunek**.

Ten widok pojawia się automatycznie po analizie AI, żeby użytkownik mógł zweryfikować wyciągnięte dane.

### 4.4 Widok: Kalendarz

Miesięczny podgląd wydatków w układzie kalendarza. Pozwala zobaczyć, kiedy i ile wydano w konkretnych dniach.

**Co zawiera:**

- Siatka kalendarza z bieżącym miesiącem.
- Nawigacja między miesiącami (strzałki wstecz/wprzód + przycisk „Dziś").
- Każdy dzień z rachunkami pokazuje łączną kwotę i kolorowe kropki (jedna na kategorię).
- Kliknięcie dnia → panel boczny pokazuje listę rachunków z tego dnia.
- Kliknięcie rachunku w panelu → przejście do widoku Szczegółów.
- Gdy żaden dzień nie jest wybrany, panel boczny pokazuje podsumowanie kategorii za cały wybrany miesiąc.

---

## 5. Nawigacja

Aplikacja używa prostej nawigacji tekstowej na górze strony:

```
Przegląd   Rachunki   Kalendarz   [Szczegóły — tylko gdy otwarty rachunek]
```

Aktywna sekcja jest podkreślona cienką linią.

---

## 6. Integracja z AI (Google Gemini)

Aplikacja korzysta z modelu **Google Gemini** do analizy obrazów rachunków.

**Jak to działa w praktyce:**

1. Użytkownik wgrywa zdjęcie paragonu.
2. Zdjęcie jest wysyłane do API Gemini z prośbą o wyciągnięcie danych w ustrukturyzowanym formacie (JSON).
3. Gemini odpowiada z rozpoznanymi danymi.
4. Aplikacja wyświetla wynik użytkownikowi do weryfikacji.

**Klucz API:** Użytkownik podaje własny klucz API Google Gemini — jest on przechowywany lokalnie w przeglądarce i nigdy nie trafia na żaden zewnętrzny serwer poza Google.

---

## 7. Co jest poza zakresem obecnej wersji

Poniższe funkcje nie są częścią aktualnej wersji, ale mogą pojawić się w przyszłości:

- **Synchronizacja między urządzeniami** — teraz dane są tylko na jednym urządzeniu.
- **Eksport do CSV lub PDF** — na potrzeby zestawień lub podatków.
- **Wersja mobilna (PWA)** — instalacja na telefonie jak normalna aplikacja.
- **Wiele portfeli / kont** — np. oddzielnie moje wydatki i wydatki partnera.
- **Powiadomienia o przekroczeniu limitu** — alert gdy budżet się kończy.
- **Planowanie budżetu** — określanie limitów per kategoria.
- **Logowanie i backup w chmurze** — dla bezpieczeństwa danych i dostępu z wielu urządzeń.
- **Rozpoznawanie paragonów z aparatu na żywo** — bezpośredni aparat zamiast wgrywania pliku.
