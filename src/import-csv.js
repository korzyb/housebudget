// Import historii operacji bankowych z pliku CSV (format mBank).
// Parsuje plik, kategoryzuje transakcje przez Gemini (1 call), wykrywa duplikaty i zapisuje do Supabase.

import { getGeminiKey, getGeminiModel } from './gemini.js';
import { store } from './store.js';
import { saveReceipt } from './supabase.js';
import { toast } from './dom.js';
import { BUILTIN_CATEGORIES } from './categories.js';
import { getCategory } from './categories.js';

// Mapowanie kategorii mBanku → nasze slugi
const MBANK_MAP = {
  'Żywność i chemia domowa': 'food',
  'Jedzenie poza domem':     'dining',
  'Paliwo':                  'transport',
  'Przejazdy':               'transport',
  'Serwis i części':         'transport',
  'Zdrowie i uroda':         'health',
  'Rozrywka - inne':         'fun',
  'Wyjścia i wydarzenia':    'fun',
  'TV, internet, telefon':   'subs',
  'Dzieci - inne':           'kids',
  'Przedszkole i opiekunka': 'kids',
  'Remont i ogród':          'home',
  'Ubezpieczenia':           'other',
  'Osobiste - inne':         'other',
  'Płatności - inne':        'other',
};

// Keyword rules — uruchamiane PRZED mapą mBanku (wyższy priorytet, bardziej precyzyjne).
// Kolejność ma znaczenie: bardziej specyficzne reguły idą przed ogólnymi.
const KEYWORD_RULES = [
  // Restauracje / jedzenie poza domem
  { re: /mcdonald|kfc|burger\s*king|pizza|restaur|bistro|kawiarni|coffee\b|urban\s*grill|curry\s*house|garmarz|sushi|kebab|lody\s*autor|kuncer|sweet\s*factory|costa\s*coffee/i, slug: 'dining' },
  // Zdrowie i uroda — uwaga: osteop (nie osteopat!) żeby złapać OSTEOPRAKTYKA
  { re: /fryzjer|kosmetyczk|salon\s*pi|gabinet|drogeria|rossmann|super.?pharm|spa\b|masa[zż]|osteop|fizjoter|apteka|szpital|klinika|medic|dental|dent|okulary|okulista|laryngol|ortoped/i, slug: 'health' },
  // Subskrypcje
  { re: /google\s*(one|play|storage)|netflix|spotify|apple\s*(one|tv|music)|youtube\s*premium|hbo|disney|amazon\s*prime|tidal|deezer|orange|t-mobile|\bplay\b|plus\s*gsm|cyfrow|nc\+|iptv|multiroom/i, slug: 'subs' },
  // Dzieci — warianty z i bez polskich znaków (encoding)
  { re: /przedszkole|[zż][lł]obek|opiekunka|niania|alimenty|czesne\b/i,                 slug: 'kids' },
  // Spłaty rat — warianty z i bez polskich znaków
  { re: /credit\s*agricole|pko\s*bp|mbank|bnp\s*paribas|santander|ing\s*bank|pekao|leasing|rata\b|kredyt\b|po[zż]yczk/i, slug: 'loans' },
  // Transport
  { re: /\borlen\b|\bbp[\s-]|shell|lotos|\bcircle\s*k\b|stacja\s*paliw|mpsa|jakdojade/i, slug: 'transport' },
  // Podróże
  { re: /pkp|intercity|flixbus|\blot\b|wizzair|ryanair|bilet.*kol|bilet.*lot/i,          slug: 'travel' },
  // Sklepy spożywcze i lokalne — babci/babci eli = lokalny sklep/delikatesy
  { re: /biedronka|lidl|auchan|carrefour|kaufland|netto|stokrotka|dino|spar|makro|frisco|delikatesy|sklep\s*spo[zż]|warzywa|babci|kerner|darko.pol/i, slug: 'food' },
  // Inne / opłaty bankowe
  { re: /pakiet\s*bezpieczna|ubezpieczeni/i,                                              slug: 'other' },
];

export async function importCSV(file) {
  let overlay = null;
  try {
    overlay = createOverlay('Wczytuję plik…');
    const text = await readFileText(file);

    const transactions = parseCSV(text);
    if (transactions.length === 0) {
      throw new Error('Nie znaleziono wydatków w pliku. Sprawdź czy to wyciąg z mBanku.');
    }

    overlay.setText(`Kategoryzuję ${transactions.length} transakcji…`);
    await assignCategories(transactions);

    overlay.setText('Sprawdzam duplikaty…');
    // Snapshot istniejących rachunków PRZED importem
    const snapshot = [...store.receipts];
    let dupCount = 0;
    for (const tx of transactions) {
      tx.possibleDuplicate = checkDuplicate(tx, snapshot);
      if (tx.possibleDuplicate) dupCount++;
    }

    overlay.setText(`Zapisuję ${transactions.length} transakcji…`);
    let saved = 0;
    for (const tx of transactions) {
      const catObj = getCategory(tx.slug);
      const catId = catObj?.id
        ?? getCategory('other')?.id
        ?? store.categories[0]?.id;

      const importMeta = {
        __meta: true,
        source: 'csv',
        bank_category: tx.bankCategory,
        possible_duplicate: tx.possibleDuplicate,
      };

      await saveReceipt({
        store_name:    tx.description,
        purchase_date: tx.date,
        category_id:   catId,
        amount:        tx.amount,
        description:   null,
        photo_url:     null,
        items:         [importMeta],
      });
      saved++;
    }

    overlay.remove();
    overlay = null;

    const dupMsg = dupCount > 0
      ? ` ${dupCount} może być duplikatem — sprawdź listę.`
      : '';
    toast(`Zaimportowano ${saved} wydatków.${dupMsg}`, 'success', dupCount > 0 ? 6000 : 3000);
  } catch (err) {
    console.error('[importCSV]', err);
    toast('Błąd importu: ' + err.message, 'error', 8000);
  } finally {
    if (overlay) overlay.remove();
  }
}

// Przypisuje slug kategorii do każdej transakcji:
// 1. Tabela mBank → slug
// 2. Keyword scan opisu
// 3. Gemini batch dla pozostałych (jeśli jest klucz)
async function assignCategories(transactions) {
  const needGemini = [];

  for (const tx of transactions) {
    // Keywords mają wyższy priorytet — łapią restauracje z "Wyjścia i wydarzenia" itp.
    const kw = keywordSlug(tx.description);
    if (kw) {
      tx.slug = kw;
      continue;
    }
    const mapped = MBANK_MAP[tx.bankCategory];
    if (mapped) {
      tx.slug = mapped;
      continue;
    }
    tx.slug = null;
    needGemini.push(tx);
  }

  if (needGemini.length === 0) return;

  if (!getGeminiKey()) {
    needGemini.forEach(tx => { tx.slug = 'other'; });
    return;
  }

  try {
    const slugs = await geminiCategorizeBatch(needGemini);
    needGemini.forEach((tx, i) => { tx.slug = slugs[i] || 'other'; });
  } catch (err) {
    console.error('[importCSV] Gemini batch error:', err);
    needGemini.forEach(tx => { tx.slug = 'other'; });
  }
}

function keywordSlug(description) {
  for (const { re, slug } of KEYWORD_RULES) {
    if (re.test(description)) return slug;
  }
  return null;
}

async function geminiCategorizeBatch(transactions) {
  const key = getGeminiKey();
  const model = getGeminiModel();

  const categoryHints = BUILTIN_CATEGORIES
    .map(c => `"${c.slug}" (${c.name}): ${c.hint}`)
    .join('\n');

  const input = transactions.map((tx, i) => ({
    idx: i,
    description: tx.description,
    bank_category: tx.bankCategory,
  }));

  const prompt = `Masz listę transakcji bankowych z polskiego banku. Przypisz każdej kategorię z listy.

Dostępne kategorie:
${categoryHints}

Transakcje (JSON):
${JSON.stringify(input)}

Zwróć WYŁĄCZNIE tablicę JSON, bez żadnego dodatkowego tekstu:
[{"idx": 0, "slug": "food"}, {"idx": 1, "slug": "transport"}, ...]

Jeśli nie jesteś pewny, użyj "other".`;

  const body = {
    contents: [{ role: 'user', parts: [{ text: prompt }] }],
    generationConfig: { temperature: 0.1, responseMimeType: 'application/json' },
  };

  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;
  const res = await fetch(`${endpoint}?key=${encodeURIComponent(key)}`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Gemini ${res.status}: ${errText.slice(0, 200)}`);
  }

  const json = await res.json();
  const text = json?.candidates?.[0]?.content?.parts?.[0]?.text || '[]';

  let parsed;
  try { parsed = JSON.parse(text); }
  catch {
    const m = text.match(/\[[\s\S]*\]/);
    parsed = m ? JSON.parse(m[0]) : [];
  }

  const result = new Array(transactions.length).fill('other');
  for (const item of (Array.isArray(parsed) ? parsed : [])) {
    if (typeof item.idx === 'number' && typeof item.slug === 'string') {
      result[item.idx] = item.slug;
    }
  }
  return result;
}

// Sprawdza czy transakcja pokrywa się z którymś z istniejących rachunków (data + kwota).
function checkDuplicate(tx, existingReceipts) {
  const txAmt = Math.round(tx.amount * 100);
  return existingReceipts.some(r => {
    const rAmt = Math.round(Number(r.amount) * 100);
    return r.purchase_date === tx.date && rAmt === txAmt;
  });
}

// ── Parser CSV ──────────────────────────────────────────────────────────────

// mBank eksportuje dwa różne formaty CSV:
//
// Format A — "Lista operacji" (lista_operacji.csv):
//   5 kolumn: #Data operacji | #Opis operacji | #Rachunek | #Kategoria | #Kwota
//   Kwota: "-283,55 PLN"
//
// Format B — "Elektroniczne zestawienie operacji" (nr_rachunku_....csv):
//   8 kolumn: #Data księg. | #Data operacji | #Opis operacji | #Tytuł | #Nadawca | #Nr konta | #Kwota | #Saldo
//   Kwota: "-61,80" (bez PLN)

function parseCSV(text) {
  const lines = text.split(/\r?\n/);

  let dataStart = -1;
  let headerLine = '';
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes('#Data operacji')) {
      dataStart = i + 1;
      headerLine = lines[i];
      break;
    }
  }
  if (dataStart === -1) {
    throw new Error('Nierozpoznany format pliku. Oczekiwano wyciągu z mBanku (nagłówek #Data operacji).');
  }

  // Detekcja formatu po liczbie kolumn nagłówka: A=5, B=8
  const isFormatB = parseCSVLine(headerLine).length >= 7;

  const results = [];
  for (let i = dataStart; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line || line.startsWith(';;')) continue; // puste i linie podsumowania

    const fields = parseCSVLine(line);

    let date, description, bankCategory, amount;

    if (isFormatB) {
      if (fields.length < 7) continue;
      date         = fields[1].trim();           // kolumna 2: data operacji
      const opType = fields[2].trim();           // kolumna 3: typ operacji
      const title  = fields[3].trim();           // kolumna 4: tytuł/merchant
      const recip  = fields[4].trim();           // kolumna 5: nadawca/odbiorca
      amount       = parseAmount(fields[6]);     // kolumna 7: kwota (bez PLN)
      bankCategory = '';                         // brak kategorii w tym formacie
      description  = cleanDescriptionB(opType, title, recip);
    } else {
      if (fields.length < 5) continue;
      date         = fields[0].trim();
      description  = cleanDescription(fields[1] || '');
      bankCategory = (fields[3] || '').trim();
      amount       = parseAmount(fields[4] || '');
    }

    if (!date.match(/^\d{4}-\d{2}-\d{2}$/)) continue;
    if (amount === null || amount >= 0) continue; // pomijamy wpływy
    if (!description) continue;

    results.push({
      date,
      description,
      bankCategory,
      amount: Math.abs(amount),
      slug: null,
      possibleDuplicate: false,
    });
  }

  return results;
}

// Opis dla Formatu B: dla przelewów używa nazwy odbiorcy, dla kart czyści tytuł transakcji.
function cleanDescriptionB(opType, title, recipient) {
  const op = opType || '';
  let text;

  if (/przelew|elixir/i.test(op)) {
    const rec = (recipient || '').replace(/\s+/g, ' ').trim();
    const tit = (title || '').replace(/\s+/g, ' ').trim();
    // Dla przelewów nazwa odbiorcy jest ważniejsza niż techniczny tytuł
    if (rec && rec.length > 2 && rec !== ' ') {
      text = rec + (tit && tit.length > 2 && !/^\d+$/.test(tit) ? ' – ' + tit : '');
    } else {
      text = tit;
    }
  } else {
    // Karty, BLIK — czyścimy tytuł transakcji
    text = (title || '').trim();
    text = text.replace(/\s+DATA TRANSAKCJI:.*$/gi, ''); // usuń datę transakcji
    text = text.replace(/\s*\/[a-zA-Z].*$/, '');         // usuń /MIASTO na końcu
    text = text.replace(/\b\d{6,}\b/g, '');              // usuń numery placówek (np. "61600147")
  }

  return text.replace(/\s+/g, ' ').trim();
}

function parseCSVLine(line) {
  const fields = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') { current += '"'; i++; }
      else inQuotes = !inQuotes;
    } else if (ch === ';' && !inQuotes) {
      fields.push(current);
      current = '';
    } else {
      current += ch;
    }
  }
  fields.push(current);
  return fields;
}

function parseAmount(str) {
  if (!str) return null;
  // "-283,55 PLN" lub "-20 180,58" (spacja jako separator tysięcy)
  const clean = str
    .replace(/PLN/gi, '')
    .replace(/\s/g, '')
    .replace(',', '.');
  const n = parseFloat(clean);
  return isNaN(n) ? null : n;
}

function cleanDescription(raw) {
  return raw
    .replace(/ZAKUP PRZY UŻYCIU KARTY W KRAJU/gi, '')
    .replace(/ZAKUP PRZY UŻYCIU KARTY - INTERNET/gi, '')
    .replace(/transakcja nierozliczona/gi, '')
    .replace(/PRZELEW EXPRESS ELIXIR WYCH\./gi, '')
    .replace(/PRZELEW ZEWNĘTRZNY WYCHODZĄCY/gi, '')
    .replace(/PRZELEW WEWNĘTRZNY WYCHODZĄCY/gi, '')
    .replace(/BLIK P2P-WYCHODZĄCY/gi, 'BLIK')
    .replace(/BLIK ZAKUP E-COMMERCE/gi, 'BLIK')
    .replace(/\d{16,}/g, '')   // numery kont, długie ciągi cyfr
    .replace(/\s+/g, ' ')
    .trim();
}

// ── Encoding ────────────────────────────────────────────────────────────────

// mBank eksportuje różne pliki w różnych kodowaniach:
// "Lista operacji" zazwyczaj UTF-8, "Zestawienie operacji" często Windows-1250.
// Próbujemy UTF-8 i jeśli widzimy znak zastępczy � (invalid UTF-8 bytes) →
// ponownie czytamy jako Windows-1250.
function readFileText(file) {
  return file.text().then(utf8 => {
    if (utf8.includes('�')) {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = e => resolve(e.target.result);
        reader.onerror = () => reject(new Error('Nie można odczytać pliku CSV'));
        reader.readAsText(file, 'windows-1250');
      });
    }
    return utf8;
  });
}

// ── Overlay ─────────────────────────────────────────────────────────────────

function createOverlay(initialText) {
  const textEl = document.createElement('div');
  textEl.style.cssText = 'font-size:15px;color:white;font-weight:500;text-align:center;padding:0 24px';
  textEl.textContent = initialText;

  const spinner = document.createElement('div');
  spinner.className = 'spinner-lg spinner';

  const node = document.createElement('div');
  node.style.cssText = [
    'position:fixed', 'inset:0',
    'background:rgba(8,7,20,0.88)',
    'display:flex', 'flex-direction:column',
    'align-items:center', 'justify-content:center',
    'gap:16px', 'z-index:9999',
  ].join(';');
  node.appendChild(spinner);
  node.appendChild(textEl);
  document.body.appendChild(node);

  return {
    setText: (t) => { textEl.textContent = t; },
    remove: () => node.remove(),
  };
}
