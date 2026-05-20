// Import operacji bankowych z wklejonego tekstu (np. skopiowanego z PDF wyciągu).
// Używa Gemini do ekstrakcji transakcji i kategoryzacji w jednym wywołaniu.

import { getGeminiKey, getGeminiModel } from './gemini.js';
import { store } from './store.js';
import { saveReceipt } from './supabase.js';
import { toast } from './dom.js';
import { BUILTIN_CATEGORIES, getCategory, autoDescription } from './categories.js';

const CATEGORY_HINTS = BUILTIN_CATEGORIES
  .map(c => `"${c.slug}" (${c.name}): ${c.hint}`)
  .join('\n');

export function openTextImportModal() {
  const backdrop = document.createElement('div');
  backdrop.className = 'sheet-backdrop';

  const sheet = document.createElement('div');
  sheet.className = 'sheet';
  sheet.setAttribute('role', 'dialog');

  const close = () => { backdrop.remove(); sheet.remove(); };
  backdrop.addEventListener('click', close);

  const handle = document.createElement('div');
  handle.className = 'sheet-handle';

  const title = document.createElement('div');
  title.className = 't-section';
  title.style.cssText = 'margin-bottom:8px;padding:0 8px';
  title.textContent = 'Wklej zestawienie';

  const hint = document.createElement('p');
  hint.style.cssText = 'font-size:13px;color:var(--text-muted);margin:0 8px 8px;line-height:1.4';
  hint.textContent = 'Wklej tekst operacji skopiowany z wyciągu bankowego. AI wyodrębni wydatki i przypisze kategorie.';

  const textarea = document.createElement('textarea');
  textarea.placeholder = 'Wklej tutaj tekst z wyciągu bankowego…';
  textarea.maxLength = 50000;
  textarea.style.cssText = [
    'width:100%',
    'height:220px',
    'resize:vertical',
    'font-size:12px',
    'line-height:1.5',
    'padding:12px',
    'background:var(--surface-2)',
    'color:var(--text-primary)',
    'border:1px solid var(--border)',
    'border-radius:var(--radius-md)',
    'box-sizing:border-box',
    'margin-bottom:12px',
  ].join(';');

  const submitBtn = document.createElement('button');
  submitBtn.className = 'btn btn-primary btn-block';
  submitBtn.type = 'button';
  submitBtn.textContent = 'Importuj';
  submitBtn.addEventListener('click', async () => {
    const text = textarea.value.trim();
    if (!text) { toast('Wklej tekst wyciągu.', 'error', 3000); return; }
    if (!getGeminiKey()) {
      toast('Wpisz klucz Gemini w ustawieniach — ta funkcja wymaga analizy AI.', 'error', 5000);
      return;
    }
    close();
    await importText(text);
  });

  const cancelBtn = document.createElement('button');
  cancelBtn.className = 'btn btn-ghost btn-block';
  cancelBtn.type = 'button';
  cancelBtn.style.marginTop = '8px';
  cancelBtn.textContent = 'Anuluj';
  cancelBtn.addEventListener('click', close);

  sheet.appendChild(handle);
  sheet.appendChild(title);
  sheet.appendChild(hint);
  sheet.appendChild(textarea);
  sheet.appendChild(submitBtn);
  sheet.appendChild(cancelBtn);

  document.body.appendChild(backdrop);
  document.body.appendChild(sheet);
  requestAnimationFrame(() => textarea.focus());

  const onKey = (e) => {
    if (e.key === 'Escape') { close(); document.removeEventListener('keydown', onKey); }
  };
  document.addEventListener('keydown', onKey);
}

async function importText(text) {
  let overlay = null;
  let pendingToast = null;
  try {
    overlay = createOverlay('Analizuję tekst…');
    const transactions = await geminiExtract(text);

    if (transactions.length === 0) {
      pendingToast = () => toast('Nie znaleziono wydatków w tekście.', 'error', 4000);
      return;
    }

    overlay.setText('Sprawdzam duplikaty…');
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
      const catId = catObj?.id ?? getCategory('other')?.id ?? store.categories[0]?.id;

      await saveReceipt({
        store_name:    tx.description,
        purchase_date: tx.date,
        category_id:   catId,
        amount:        tx.amount,
        description:   autoDescription(tx.slug),
        photo_url:     null,
        items:         [{ __meta: true, source: 'text', possible_duplicate: tx.possibleDuplicate }],
      });
      saved++;
    }

    const dupMsg = dupCount > 0 ? ` ${dupCount} może być duplikatem — sprawdź listę.` : '';
    pendingToast = () => toast(`Zaimportowano ${saved} wydatków.${dupMsg}`, 'success', dupCount > 0 ? 6000 : 3000);
  } catch (err) {
    console.error('[importText]', err);
    pendingToast = () => toast('Błąd importu: ' + err.message, 'error', 8000);
  } finally {
    if (overlay) overlay.remove();
    pendingToast?.();
  }
}

async function geminiExtract(text) {
  const key = getGeminiKey();
  const model = getGeminiModel();

  const prompt = `Masz fragment historii operacji bankowych w postaci tekstu (np. skopiowanego z PDF wyciągu bankowego).

Wyodrębnij transakcje i zwróć tablicę JSON:
[{"date":"YYYY-MM-DD","description":"nazwa sklepu lub krótki opis","amount":148.46,"slug":"health"}]

Dostępne kategorie (slug: co tam pakować):
${CATEGORY_HINTS}

Reguły:
- Uwzględniaj TYLKO wydatki. Pomiń wpływy i przelewy przychodzące.
- Pomiń transakcje z "Korzybszczak" w opisie lub tytule.
- Pomiń transakcje z "me BLIK" w opisie lub tytule.
- amount: liczba dodatnia (np. 148.46), kropka jako separator dziesiętny.
- date: format YYYY-MM-DD.
- description: nazwa sklepu lub usługodawcy, max 80 znaków.
- Zwróć WYŁĄCZNIE poprawny JSON bez dodatkowego tekstu, bez backticków.

Tekst:
${text}`;

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
  const candidate = json?.candidates?.[0];
  if (!candidate) throw new Error('Gemini: pusta odpowiedź');
  if (candidate.finishReason && candidate.finishReason !== 'STOP') {
    throw new Error(`Gemini przerwał: ${candidate.finishReason}`);
  }

  const rawText = candidate?.content?.parts?.[0]?.text || '[]';
  let parsed;
  try { parsed = JSON.parse(rawText); }
  catch {
    const m = rawText.match(/\[[\s\S]*\]/);
    parsed = m ? JSON.parse(m[0]) : [];
  }

  return (Array.isArray(parsed) ? parsed : [])
    .filter(tx => tx && typeof tx.date === 'string' && typeof tx.amount === 'number' && tx.amount > 0)
    .map(tx => ({
      date: tx.date,
      description: String(tx.description || '').slice(0, 100).trim(),
      amount: tx.amount,
      slug: typeof tx.slug === 'string' ? tx.slug : 'other',
      possibleDuplicate: false,
    }));
}

function checkDuplicate(tx, existingReceipts) {
  const txAmt = Math.round(tx.amount * 100);
  return existingReceipts.some(r => {
    const rAmt = Math.round(Number(r.amount) * 100);
    return r.purchase_date === tx.date && rAmt === txAmt;
  });
}

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
