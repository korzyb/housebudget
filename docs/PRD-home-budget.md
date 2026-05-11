# PRD — Home Budget: Inteligentny Asystent Budżetu Domowego

**Wersja:** 1.0
**Data:** maj 2026
**Status:** W trakcie rozwoju

---

## 1. Wizja i cel

Home Budget to mobilna aplikacja do śledzenia domowych wydatków, instalowana na telefonie jak zwykła aplikacja. Przeznaczona dla jednej osoby lub pary, która chce mieć wspólny wgląd w finanse domowe z różnych urządzeń. Główna obietnica: sfotografuj paragon aparatem telefonu, a aplikacja sama wyciągnie dane i doda je do budżetu.

---

## 2. Dla kogo?

Aplikacja jest przeznaczona do użytku osobistego lub rodzinnego — przez jedną osobę lub dwie osoby prowadzące wspólny budżet (np. para). Każda z osób loguje się na swoje konto i widzi te same dane, zsynchronizowane na bieżąco.

Główne scenariusze użycia:

- Stoisz przy kasie, robisz zdjęcie paragonu telefonem — aplikacja sama go ogarnia.
- Sprawdzasz wieczorem ile wydałeś w tym tygodniu na jedzenie.
- Partner/partnerka dodaje swoje zakupy ze swojego telefonu — oboje widzicie wspólny obraz budżetu.
- Przeglądasz historię wydatków z poprzednich miesięcy, żeby zobaczyć trendy.

---

## 3. Co aplikacja robi — przegląd funkcji

1. **Skanowanie paragonów aparatem** — użytkownik otwiera aparat bezpośrednio w aplikacji i fotografuje paragon. Sztuczna inteligencja automatycznie rozpoznaje sklep, datę, listę pozycji z cenami i proponuje kategorię. Użytkownik widzi wynik i może go poprawić przed zapisaniem.

2. **Wgrywanie zdjęć i skanów** — alternatywnie użytkownik może wgrać zdjęcie lub skan paragonu z galerii telefonu (JPG, PNG, PDF). Dalszy proces jest identyczny jak przy aparacie.

3. **Ręczne wprowadzanie wydatków** — użytkownik może ręcznie wprowadzić wydatek, podając kwotę, datę, kategorię i opcjonalnie opis. Na przykład transakcje gotówkowe, które nie mają paragonu lub automatyczne operacje kartą (subskrypcje, raty, itp)

3. **Przechowywanie danych w chmurze** — wszystkie rachunki i dane są zapisywane na serwerze i dostępne z każdego zalogowanego urządzenia. Dane nie giną po wyczyszczeniu telefonu.

4. **Logowanie i konta użytkowników** — każda osoba loguje się własnym adresem e-mail i hasłem. Dane są wspólne — każdy zalogowany użytkownik widzi i może dodawać rachunki do wspólnego budżetu.

5. **Kategorie wydatków** — każdy rachunek przypisany jest do jednej z 9 wbudowanych kategorii (Jedzenie, Transport, Rozrywka, Dom, Zdrowie, Dzieci, Subskrypcje, Wyjazdy, Inne). Użytkownik może dodawać własne kategorie z wybraną ikoną i kolorem.

6. **Przegląd i statystyki** — ekran główny pokazuje wydatki dziś, w tym tygodniu i w bieżącym miesiącu, wykres historii za ostatnie miesiące oraz pierścień budżetu z informacją ile z miesięcznego limitu zostało już wydane.

7. **Lista rachunków z filtrami** — pełna historia wszystkich rachunków z możliwością filtrowania po dacie i kategorii.

8. **Widok kalendarza** — miesięczny podgląd wydatków w układzie kalendarza. Kliknięcie dnia pokazuje listę rachunków z tego dnia.

9. **Ciemny i jasny motyw** — aplikacja domyślnie uruchamia się w ciemnym motywie (dark). Użytkownik może przełączyć na jasny motyw w ustawieniach.

---

## 4. Widoki / ekrany

### 4.1 Ekran logowania

**Cel:** Umożliwia wejście do aplikacji po podaniu danych konta.

**Zawiera:**
- Pole e-mail i hasło.
- Przycisk „Zaloguj się".
- Link „Nie masz konta? Zarejestruj się".
- Link „Zapomniałem hasła".

---

### 4.2 Ekran rejestracji

**Cel:** Założenie nowego konta.

**Zawiera:**
- Pole imienia, e-mail, hasło i potwierdzenie hasła.
- Przycisk „Utwórz konto".
- Po rejestracji użytkownik trafia prosto do ekranu głównego.

---

### 4.3 Ekran główny (Dashboard)

**Cel:** Daje pełny obraz sytuacji finansowej na jeden rzut oka. To pierwszy ekran po zalogowaniu.

**Zawiera:**
- Powitanie z imieniem zalogowanego użytkownika.
- 3 karty z kwotami — wydatki dziś, w tym tygodniu i w bieżącym miesiącu.
- Pierścień budżetu — ile z miesięcznego limitu zostało wydane. Centrum pokazuje dokładną kwotę. Kolor zmienia się na czerwony gdy zbliżamy się do limitu.
- Wykres słupkowy — historia wydatków z ostatnich 6 miesięcy.
- Karty kategorii — poziomy przewijany pasek z kwotami wydanymi w każdej kategorii w bieżącym miesiącu, uszeregowany od najwyższych.
- Lista ostatnich rachunków — kilka ostatnich pozycji, klikalne, prowadzą do szczegółów.
- Duży przycisk „+" służący do dodania paragonu lub ręcznego wprowadzenia wydatku — zawsze widoczny, otwiera wybór: aparat lub galeria lub wpisanie ręcznie.

---

### 4.4 Ekran aparatu / wgrywania paragonu

**Cel:** Pobranie zdjęcia paragonu i uruchomienie analizy przez AI.

**Zawiera:**
- Podgląd aparatu z przyciskiem zdjęcia (tryb domyślny).
- Przycisk przełączenia na wybór z galerii.
- Po zrobieniu zdjęcia — podgląd z opcją „Użyj tego zdjęcia" lub „Zrób ponownie".
- Wskaźnik ładowania podczas analizy przez AI.
- Po analizie — automatyczne przejście do ekranu szczegółów paragonu.

---

### 4.5 Ekran szczegółów paragonu

**Cel:** Weryfikacja i zapis danych wyciągniętych przez AI z paragonu.

**Zawiera:**
- Miniatura zdjęcia paragonu (możliwość powiększenia).
- Formularz z danymi do weryfikacji i edycji:
  - Nazwa sklepu
  - Data zakupu
  - Kategoria (można zmienić)
  - Lista pozycji z cenami (można edytować)
  - Kwota łączna
- Przycisk „Zapisz".
- Przycisk „Usuń" (gdy przegląda się istniejący paragon).

Ten ekran pojawia się automatycznie po analizie AI oraz po kliknięciu rachunku z listy.

---

### 4.6 Ekran rachunków (Lista)

**Cel:** Pełna historia wszystkich zapisanych rachunków.

**Zawiera:**
- Lista rachunków posortowana od najnowszych: sklep, data, kategoria, kwota.
- Filtry — według zakresu dat i według kategorii.
- Kliknięcie rachunku otwiera ekran szczegółów.
- Możliwość usunięcia rachunku.

---

### 4.7 Ekran kalendarza

**Cel:** Podgląd wydatków w układzie miesięcznym — kiedy i ile wydano.

**Zawiera:**
- Siatka kalendarza z bieżącym miesiącem.
- Nawigacja między miesiącami.
- Każdy dzień z rachunkami pokazuje łączną kwotę i kolorowe kropki (jedna na kategorię).
- Kliknięcie dnia — lista rachunków z tego dnia.
- Kliknięcie rachunku z listy — przejście do ekranu szczegółów.
- Gdy żaden dzień nie jest wybrany — podsumowanie kategorii za cały miesiąc.

---

### 4.8 Ekran ustawień

**Cel:** Konfiguracja aplikacji i konta.

**Zawiera:**
- Przełącznik motywu: ciemny / jasny.
- Ustawienie miesięcznego limitu budżetu.
- Zarządzanie własnymi kategoriami (dodawanie, usuwanie).
- Sekcja konta: imię, e-mail, zmiana hasła.
- Przycisk „Wyloguj się".

---

## 5. Nawigacja

Aplikacja używa dolnego paska nawigacji (standard mobilny) z 4 pozycjami:

```
[Dashboard]  [Rachunki]  [Kalendarz]  [Ustawienia]
```

Centralny przycisk „+" (dodaj paragon) wyróżniony kolorem, zawsze widoczny ponad paskiem nawigacji — dostępny z każdego ekranu.

Ekran szczegółów paragonu otwiera się jako nakładka nad aktualnym ekranem z przyciskiem powrotu.

---

## 6. Integracje zewnętrzne

**Google Gemini (sztuczna inteligencja)**
Używana do analizy zdjęć paragonów. Gdy użytkownik fotografuje paragon, zdjęcie trafia do silnika AI, który rozpoznaje dane (sklep, data, pozycje, kwota) i odsyła je do aplikacji w postaci gotowej do wyświetlenia. Użytkownik podaje własny klucz dostępu do usługi Gemini — jest on przechowywany bezpiecznie i nigdy nie trafia nigdzie poza Google.

**Supabase (baza danych i konta)**
Zewnętrzna usługa przechowująca dane aplikacji w chmurze. Zapewnia logowanie użytkowników (e-mail + hasło) oraz synchronizację danych między urządzeniami. Dane są dostępne z każdego telefonu, na którym użytkownik się zaloguje.

---

## 7. Co jest poza zakresem obecnej wersji

- **Role użytkowników** — np. administrator / członek rodziny z ograniczonym dostępem. Architektura kont jest przygotowana na wprowadzenie ról w przyszłości, ale w obecnej wersji wszyscy zalogowani użytkownicy mają identyczne uprawnienia.
- **Kopiowanie wydatku** — można tworzyć nowy wydatek, kopiując istniejący (przydatne dla subskrypcji, rat itp), ale nie można edytować wydatku po jego zatwierdzeniu (planowane).
- **Eksport danych** — do CSV lub PDF (planowane).
- **Edycja kategorii** — dodawanie, usuwanie, zmiana ikon i kolorów (planowane).
- **Powiadomienia push** — alert gdy budżet się kończy (planowane).
- **Planowanie budżetu per kategoria** — określanie limitów dla każdej kategorii osobno (planowane).
- **Wiele portfeli** — np. oddzielny budżet domowy i osobisty (planowane).
- **Rozpoznawanie paragonów na żywo** — analiza w czasie rzeczywistym bez robienia zdjęcia (planowane).
- **Wersja desktopowa** — aplikacja jest zoptymalizowana pod telefon. Dostęp przez przeglądarkę na komputerze jest możliwy, ale nie jest priorytetem.
