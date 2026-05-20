import { h, toast } from '../dom.js';
import { icon } from '../icons.js';
import { store } from '../store.js';
import { saveReceipt, deleteReceipt } from '../supabase.js';
import { navigate } from '../router.js';
import { bottomNav } from '../components/bottom-nav.js';
import { categoryIconBox } from '../components/category-chip.js';
import { getCategory } from '../categories.js';
import { formatPLN, formatDate, parsePLN, toISODate } from '../format.js';

export function renderReceiptDetail({ id }) {
  // Stan formularza
  let model;
  let existing = null;
  let isManualEntry = false;

  if (id) {
    existing = store.receipts.find(r => r.id === id);
    if (!existing) {
      toast('Nie znaleziono rachunku', 'error');
      navigate('/receipts');
      return h('div');
    }
    model = clone(existing);
  } else if (store.draftReceipt) {
    model = clone(store.draftReceipt);
    model.photo_url = model.photo_url || null;
    store.clearDraftReceipt();
  } else {
    isManualEntry = true;
    model = {
      store_name: '',
      purchase_date: toISODate(new Date()),
      category_id: defaultCategoryId(),
      amount: 0,
      description: '',
      photo_url: null,
      items: [],
    };
  }

  // Wyciągamy metadane importu CSV (przechowywane jako specjalny wpis __meta w tablicy items).
  // Filtrujemy go z model.items żeby nie psuć wyświetlania pozycji i obliczeń kwoty.
  const importMeta = Array.isArray(model.items)
    ? (model.items.find(i => i.__meta) ?? null)
    : null;
  model.items = Array.isArray(model.items) ? model.items.filter(i => !i.__meta) : [];

  const root = h('div', { class: 'view detail-view' });
  let saving = false;
  let storeNameInput = null;

  function rerender() {
    root.replaceChildren();
    const total = model.items.length
      ? model.items.reduce((s, x) => s + (Number(x.price) || 0), 0)
      : Number(model.amount) || 0;

    const cat = getCategory(model.category_id);

    root.appendChild(h('div', { class: 'view-header' }, [
      h('button', { class: 'back-link', type: 'button', onClick: () => history.back() }, [icon('arrow-left'), 'Wróć']),
      h('h1', {}, existing ? 'Edytuj rachunek' : 'Nowy rachunek'),
      h('div', { style: { width: '60px' } }),
    ]));

    // Baner duplikatu (tylko dla rachunków z importu CSV oznaczonych jako możliwy duplikat)
    if (importMeta?.possible_duplicate) {
      const clearBtn = h('button', {
        class: 'btn btn-block',
        type: 'button',
        style: { background: 'var(--surface-2)', gap: '8px' },
        onClick: async () => {
          try {
            const updatedItems = [...model.items.filter(it => it.name || it.price), { ...importMeta, possible_duplicate: false }];
            await saveReceipt({ id: existing.id, items: updatedItems });
            toast('Oznaczono jako zweryfikowany', 'success');
            history.back();
          } catch (err) {
            toast(err.message || 'Błąd', 'error');
          }
        },
      }, [icon('shield-check', { size: 16 }), 'Nie jest duplikatem']);

      root.appendChild(h('div', { class: 'dup-banner' }, [
        h('div', { class: 'dup-banner-head' }, [
          icon('alert-triangle', { size: 16, strokeWidth: 2 }),
          h('span', { class: 'dup-banner-title' }, 'Możliwy duplikat'),
        ]),
        h('div', { class: 'dup-banner-text' }, 'Ten wydatek może być tym samym co inny rachunek w budżecie (ta sama data i kwota). Zweryfikuj lub usuń jeden z nich.'),
        clearBtn,
      ]));
    }

    // Photo (jeśli jest)
    if (model.photo_url) {
      root.appendChild(h('div', {
        class: 'detail-photo',
        style: { backgroundImage: `url(${model.photo_url})` },
      }));
    }

    // Sklep
    storeNameInput = h('input', {
      class: 'input',
      type: 'text',
      value: model.store_name || '',
      placeholder: 'np. Biedronka',
      onInput: (e) => { model.store_name = e.target.value; },
    });
    root.appendChild(h('div', { class: 'field', style: { marginBottom: '12px' } }, [
      h('label', {}, 'Nazwa sklepu'),
      storeNameInput,
    ]));

    // Data
    root.appendChild(h('div', { class: 'field', style: { marginBottom: '12px' } }, [
      h('label', {}, 'Data zakupu'),
      h('input', {
        class: 'input',
        type: 'date',
        value: model.purchase_date,
        onInput: (e) => { model.purchase_date = e.target.value; },
      }),
    ]));

    // Kategoria — siatka chipów
    root.appendChild(h('div', { class: 'field', style: { marginBottom: '12px' } }, [
      h('label', {}, 'Kategoria'),
      categoryGrid(model.category_id, (id) => {
        model.category_id = id;
        rerender();
      }),
    ]));

    // Kwota (lub łączna z pozycji)
    const amountField = h('div', { class: 'field', style: { marginBottom: '12px' } }, [
      h('label', {}, model.items.length ? 'Łączna kwota (z pozycji)' : 'Kwota'),
      h('div', { class: 'input-group' }, [
        h('input', {
          class: 'input',
          type: 'text',
          inputmode: 'decimal',
          value: model.items.length ? formatPLN(total).replace(/\s*zł\s*/, '') : (model.amount || ''),
          disabled: !!model.items.length,
          onInput: (e) => { model.amount = parsePLN(e.target.value); },
        }),
        h('div', { class: 'addon' }, 'zł'),
      ]),
    ]);
    root.appendChild(amountField);

    // Pozycje (opcjonalnie)
    const itemsSection = h('div', { style: { marginBottom: '16px' } }, [
      h('div', { class: 'row', style: { justifyContent: 'space-between', marginBottom: '8px' } }, [
        h('div', { class: 't-section' }, `Pozycje (${model.items.length})`),
        h('button', {
          class: 'btn btn-ghost',
          type: 'button',
          style: { minHeight: '36px', padding: '8px 12px' },
          onClick: () => {
            model.items.push({ name: '', price: 0 });
            rerender();
          },
        }, [icon('plus', { size: 16 }), 'Dodaj']),
      ]),
      h('div', { class: 'items-list' },
        model.items.map((it, i) => h('div', { class: 'item-row' }, [
          h('input', {
            class: 'input',
            type: 'text',
            placeholder: 'Nazwa pozycji',
            value: it.name || '',
            onInput: (e) => { model.items[i].name = e.target.value; },
          }),
          h('div', { class: 'input-group' }, [
            h('input', {
              class: 'input',
              type: 'text',
              inputmode: 'decimal',
              placeholder: '0,00',
              value: it.price || '',
              onInput: (e) => { model.items[i].price = parsePLN(e.target.value); },
              onBlur: () => rerender(),
            }),
            h('div', { class: 'addon' }, 'zł'),
          ]),
          h('button', {
            class: 'btn btn-icon btn-danger',
            type: 'button',
            onClick: () => { model.items.splice(i, 1); rerender(); },
          }, icon('x', { size: 18 })),
        ])),
      ),
    ]);
    root.appendChild(itemsSection);

    // Opis
    root.appendChild(h('div', { class: 'field', style: { marginBottom: '20px' } }, [
      h('label', {}, 'Opis (opcjonalny)'),
      h('textarea', {
        class: 'input',
        rows: '2',
        placeholder: 'Notatka',
        onInput: (e) => { model.description = e.target.value; },
      }, model.description || ''),
    ]));

    // Akcje
    const saveBtn = h('button', {
      class: 'btn btn-primary btn-block',
      type: 'button',
      onClick: async () => {
        if (saving) return;
        if (!model.category_id) { toast('Wybierz kategorię', 'error'); return; }
        if (!model.purchase_date) { toast('Wybierz datę', 'error'); return; }
        const total = model.items.length
          ? model.items.reduce((s, x) => s + (Number(x.price) || 0), 0)
          : Number(model.amount) || 0;
        if (!total || total <= 0) { toast('Wpisz kwotę większą od zera', 'error'); return; }

        const payload = {
          id: existing?.id,
          store_name: model.store_name?.trim() || null,
          purchase_date: model.purchase_date,
          category_id: model.category_id,
          amount: total,
          description: model.description?.trim() || null,
          photo_url: model.photo_url || null,
          // importMeta jest przepisywany z powrotem żeby przetrwał edycje rachunku
          items: [
            ...model.items.filter(it => it.name || it.price),
            ...(importMeta ? [importMeta] : []),
          ],
        };

        // Sprawdzenie duplikatu (sklep + data + kwota) — pomijamy gdy edytujemy ten sam rachunek
        const dup = findDuplicate(payload, store.receipts);
        if (dup) {
          const dupLabel = `${dup.store_name || '(bez nazwy)'} — ${dup.purchase_date} — ${formatPLN(dup.amount)}`;
          if (!confirm(`Istnieje już rachunek o tych samych danych:\n\n${dupLabel}\n\nZapisać mimo to?`)) {
            return;
          }
        }

        saving = true;
        saveBtn.disabled = true;
        saveBtn.textContent = 'Zapisuję…';
        try {
          await saveReceipt(payload);
          toast(existing ? 'Zaktualizowano' : 'Zapisano', 'success');
          history.back();
        } catch (err) {
          toast(err.message || 'Błąd zapisu', 'error');
          saveBtn.disabled = false;
          saveBtn.textContent = 'Zapisz';
        } finally {
          saving = false;
        }
      },
    }, 'Zapisz');

    // Sticky kontener z akcjami — zawsze widoczny nad bottom-nav
    const actions = h('div', { class: 'detail-actions' }, [saveBtn]);
    if (existing) {
      actions.appendChild(h('button', {
        class: 'btn btn-danger btn-block',
        type: 'button',
        onClick: async () => {
          if (!confirm('Usunąć ten rachunek?')) return;
          try {
            const deletedDate = existing.purchase_date;
            const deletedAmt  = Math.round(Number(existing.amount) * 100);

            await deleteReceipt(existing.id);

            // Jeśli usunięty rachunek miał bliźniaka z flagą duplikatu (ta sama data + kwota),
            // czyścimy jego flagę — sytuacja duplikatu jest już rozwiązana.
            const twins = store.receipts.filter(r =>
              r.purchase_date === deletedDate &&
              Math.round(Number(r.amount) * 100) === deletedAmt &&
              Array.isArray(r.items) && r.items.some(i => i.__meta && i.possible_duplicate)
            );
            for (const twin of twins) {
              const newItems = twin.items.map(i => i.__meta ? { ...i, possible_duplicate: false } : i);
              await saveReceipt({ id: twin.id, items: newItems }).catch(console.error);
            }

            toast('Usunięto', 'success');
            history.back();
          } catch (err) {
            toast(err.message || 'Błąd usuwania', 'error');
          }
        },
      }, 'Usuń rachunek'));
    }
    root.appendChild(actions);
  }

  rerender();

  // Auto-focus pole "Nazwa sklepu" przy ręcznym wpisywaniu — po mount w DOM
  if (isManualEntry && storeNameInput) {
    requestAnimationFrame(() => storeNameInput.focus());
  }

  return h('div', {}, [root, bottomNav()]);
}

function categoryGrid(selectedId, onPick) {
  return h('div', {
    style: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' },
  }, store.categories.map(c => {
    const active = c.id === selectedId;
    return h('button', {
      class: 'tap',
      type: 'button',
      style: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '4px',
        padding: '10px 6px',
        background: active ? 'var(--surface-2)' : 'var(--surface)',
        border: active ? '2px solid var(--primary)' : '2px solid transparent',
        borderRadius: '14px',
        cursor: 'pointer',
        color: 'var(--text)',
      },
      onClick: () => onPick(c.id),
    }, [
      categoryIconBox(c, { size: 36 }),
      h('span', { style: { fontSize: '11px', fontWeight: '500' } }, c.name),
    ]);
  }));
}

function defaultCategoryId() {
  const food = store.categories.find(c => c.slug === 'food');
  return food?.id || store.categories[0]?.id || null;
}

function clone(o) { return JSON.parse(JSON.stringify(o)); }

// Szuka rachunku o tej samej kombinacji (store_name, purchase_date, amount).
// Pomija rachunek o tym samym id (case'em edycji — wtedy nie traktuj samego siebie jako duplikat).
function findDuplicate(payload, allReceipts) {
  const name = (payload.store_name || '').trim().toLowerCase();
  const date = payload.purchase_date;
  const amt = Math.round(Number(payload.amount) * 100); // grosze — bez floating point edge cases
  return allReceipts.find(r => {
    if (payload.id && r.id === payload.id) return false;
    const rName = (r.store_name || '').trim().toLowerCase();
    const rAmt = Math.round(Number(r.amount) * 100);
    return rName === name && r.purchase_date === date && rAmt === amt;
  });
}
