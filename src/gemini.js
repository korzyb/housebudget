// Wywołanie Google Gemini Vision do analizy paragonu.
// Zwraca obiekt: { store_name, purchase_date, items, total_amount, suggested_category_slug }

import { BUILTIN_CATEGORIES } from './categories.js';

const GEMINI_KEY = 'gemini_api_key';
const MODEL = 'gemini-2.0-flash';
const ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`;

export function hasGeminiKey() {
  return !!localStorage.getItem(GEMINI_KEY);
}

export function getGeminiKey() {
  return localStorage.getItem(GEMINI_KEY) || '';
}

const PROMPT_PL = `
Jesteś asystentem do analizy paragonów sklepowych. Otrzymasz zdjęcie paragonu z polskiego sklepu.

Wyodrębnij dane do JSON o następującej strukturze (wszystkie pola opcjonalne — zostaw null/pustą tablicę jeśli nie pewne):

{
  "store_name": string lub null,         // nazwa sklepu (np. "Biedronka", "Lidl")
  "purchase_date": string lub null,      // YYYY-MM-DD
  "items": [                              // pozycje z paragonu
    { "name": string, "price": number }
  ],
  "total_amount": number lub null,       // łączna kwota w złotych (liczba, kropka jako separator)
  "suggested_category_slug": string lub null  // jedno z: ${BUILTIN_CATEGORIES.map(c => `"${c.slug}"`).join(', ')}
}

Reguły:
- Kwoty zawsze w PLN, format liczby (np. 12.50, nie "12,50 zł").
- Nazwy pozycji skracaj sensownie (max 40 znaków).
- Jeśli nie jesteś pewny pola, użyj null.
- Sugestia kategorii: dopasuj do typu sklepu (np. Biedronka/Lidl → food, Orlen/MPK → transport, IKEA → home, apteka → health).
- Zwróć WYŁĄCZNIE poprawny JSON bez żadnego dodatkowego tekstu, bez backticków, bez \`\`\`json.
`.trim();

export async function analyzeReceipt(blob) {
  const key = getGeminiKey();
  if (!key) throw new Error('Brak klucza Gemini. Wpisz go w ustawieniach.');

  const base64 = await blobToBase64(blob);
  const body = {
    contents: [{
      role: 'user',
      parts: [
        { text: PROMPT_PL },
        { inline_data: { mime_type: blob.type || 'image/jpeg', data: base64 } },
      ],
    }],
    generationConfig: {
      temperature: 0.2,
      responseMimeType: 'application/json',
    },
  };

  const res = await fetch(`${ENDPOINT}?key=${encodeURIComponent(key)}`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Gemini ${res.status}: ${text.slice(0, 200)}`);
  }

  const json = await res.json();
  const text = json?.candidates?.[0]?.content?.parts?.[0]?.text || '';
  return parseResult(text);
}

function parseResult(text) {
  // Try direct JSON
  let parsed;
  try { parsed = JSON.parse(text); }
  catch {
    // Czasem mimo responseMimeType model wrzuca ```json … ```
    const m = text.match(/\{[\s\S]*\}/);
    if (!m) throw new Error('Nie udało się sparsować odpowiedzi AI');
    parsed = JSON.parse(m[0]);
  }
  return {
    store_name: typeof parsed.store_name === 'string' ? parsed.store_name : null,
    purchase_date: typeof parsed.purchase_date === 'string' ? parsed.purchase_date : null,
    items: Array.isArray(parsed.items)
      ? parsed.items
          .filter(it => it && typeof it === 'object')
          .map(it => ({
            name: String(it.name || '').slice(0, 80),
            price: Number(it.price) || 0,
          }))
      : [],
    total_amount: typeof parsed.total_amount === 'number' ? parsed.total_amount : null,
    suggested_category_slug: typeof parsed.suggested_category_slug === 'string'
      ? parsed.suggested_category_slug
      : null,
  };
}

function blobToBase64(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result;
      const idx = result.indexOf(',');
      resolve(idx >= 0 ? result.slice(idx + 1) : result);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}
