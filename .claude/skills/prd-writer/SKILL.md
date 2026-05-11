---
name: prd-writer
description: Tworzy lub aktualizuje dokument PRD dla aplikacji webowej. Pisze w stylu zrozumiałym dla osoby nietechnicznej — skupia się na tym CO i DLACZEGO, nie na szczegółach technicznych. Używaj gdy zaczynasz nowy projekt lub chcesz udokumentować istniejące funkcje.
user-invocable: true
argument-hint: "[nowy PRD / aktualizacja istniejącego / konkretna sekcja do napisania]"
---

Napisz lub zaktualizuj dokument PRD zgodnie z poniższymi zasadami. Dokument ma być użyteczny — nie szablonowy.

## Zasady pisania

**Język:**
- Polski, poprawny, bez żargonu technicznego
- Piszesz dla osoby, która wie CO chce, ale nie wie JAK to zrobić
- Unikaj: "endpoint", "komponent", "hook", "state management", "deploy"
- Zamiast tego: "ekran", "przycisk", "dane", "zapisuje", "wyświetla"

**Ton:**
- Konkretny i rzeczowy — żadnych ogólników ("aplikacja będzie świetna")
- Zorientowany na użytkownika — zawsze pytaj "co użytkownik może zrobić?"
- Zwięzły — każde zdanie musi nieść informację

## Struktura dokumentu

Buduj PRD z tych sekcji (pomijaj te, które nie mają zastosowania):

### 1. Wizja i cel (2-3 zdania)
Jedno zdanie o tym co to jest. Jedno zdanie o tym dla kogo. Jedno zdanie o głównej obietnicy dla użytkownika.

### 2. Dla kogo?
Kim jest użytkownik, w jakim kontekście używa aplikacji, jakie ma potrzeby. Nie persona z demografią — konkretny scenariusz użycia.

### 3. Co aplikacja robi — przegląd funkcji
Numerowana lista głównych możliwości. Każda funkcja: nazwa pogrubiona + 2-4 zdania opisu z perspektywy użytkownika.

### 4. Widoki / ekrany
Dla każdego ekranu:
- Nazwa
- Cel (po co ten ekran istnieje)
- Co zawiera (lista elementów które użytkownik widzi i z czym może interagować)

### 5. Nawigacja
Jak użytkownik porusza się między ekranami. Krótko.

### 6. Integracje zewnętrzne
Jakie zewnętrzne usługi są używane i po co (AI, płatności, email itp.) — opisane dla laika.

### 7. Co jest poza zakresem
Lista rzeczy których aplikacja NIE robi (ważne żeby zarządzać oczekiwaniami).

## Czego NIE wpisywać

- Nazw bibliotek, frameworków, baz danych
- Szczegółów implementacyjnych ("użyjemy IndexedDB")
- Wymagań technicznych i miar sukcesu
- Danych mockowych / przykładowych
- Harmonogramów i estymacji

## Format pliku

Zapisz jako Markdown w `docs/PRD-[nazwa-projektu].md`. Używaj nagłówków H2/H3, list wypunktowanych i tabel gdzie to pomaga czytelności. Unikaj ścian tekstu.

## Przed pisaniem

Zbierz kontekst pytając o:
1. Kto będzie używać aplikacji i w jakim celu?
2. Jakie są główne ekrany/widoki?
3. Jakie zewnętrzne usługi są używane?
4. Co jest poza zakresem / czego aplikacja nie robi?

Jeśli masz już kod lub istniejące dokumenty — przeczytaj je zanim zaczniesz pisać.
