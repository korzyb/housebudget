import { h, toast } from '../dom.js';
import { icon } from '../icons.js';
import { store } from '../store.js';
import { updateProfile, signOut, changePassword, createCategory, deleteCategory } from '../supabase.js';
import { bottomNav } from '../components/bottom-nav.js';
import { categoryIconBox } from '../components/category-chip.js';
import { formatPLN, parsePLN } from '../format.js';
import { GEMINI_MODELS, getGeminiModel, setGeminiModel } from '../gemini.js';

const GEMINI_KEY = 'gemini_api_key';

export function renderSettings() {
  const root = h('div', {});

  function rerender() {
    root.replaceChildren();

    root.appendChild(h('div', { class: 'view-header' }, [
      h('h1', {}, 'Ustawienia'),
    ]));

    const cont = h('div', { class: 'view stack', style: { '--gap': '20px' } });
    root.appendChild(cont);

    // Budżet
    const budgetInput = h('input', {
      class: 'input',
      type: 'text',
      inputmode: 'decimal',
      placeholder: '0',
      value: store.profile?.monthly_budget || '',
      style: { textAlign: 'right' },
      onBlur: async (e) => {
        const val = parsePLN(e.target.value);
        try {
          await updateProfile({ monthly_budget: val });
          toast('Limit zapisany', 'success');
        } catch (err) { toast(err.message, 'error'); }
      },
    });
    cont.appendChild(group('Budżet', [
      h('div', { class: 'settings-row' }, [
        h('div', { class: 'label' }, 'Miesięczny limit'),
        h('div', { class: 'input-group', style: { maxWidth: '160px' } }, [
          budgetInput,
          h('div', { class: 'addon' }, 'zł'),
        ]),
      ]),
    ]));

    // Kategorie (custom)
    const customCats = store.categories.filter(c => !c.is_builtin);
    const customSection = h('div', { class: 'stack', style: { '--gap': '8px' } }, [
      ...customCats.map(c => h('div', { class: 'settings-row' }, [
        h('div', { class: 'row' }, [
          categoryIconBox(c, { size: 36 }),
          h('div', { class: 'label' }, c.name),
        ]),
        h('button', {
          class: 'btn btn-icon btn-danger',
          type: 'button',
          'aria-label': 'Usuń',
          onClick: async () => {
            if (!confirm(`Usunąć kategorię "${c.name}"? Rachunki w tej kategorii pozostaną, ale stracą przypisanie.`)) return;
            try {
              await deleteCategory(c.id);
              toast('Usunięto kategorię', 'success');
            } catch (err) { toast(err.message, 'error'); }
          },
        }, icon('trash', { size: 18 })),
      ])),
      h('button', {
        class: 'btn btn-block',
        type: 'button',
        onClick: () => openCategoryEditor(),
      }, [icon('plus', { size: 18 }), 'Dodaj kategorię']),
    ]);
    cont.appendChild(group('Własne kategorie', [customSection]));

    // Klucz Gemini
    const apiKey = localStorage.getItem(GEMINI_KEY) || '';
    const apiInput = h('input', {
      class: 'input',
      type: 'password',
      placeholder: 'AIza…',
      value: apiKey,
      onBlur: (e) => {
        const v = e.target.value.trim();
        if (v) localStorage.setItem(GEMINI_KEY, v);
        else localStorage.removeItem(GEMINI_KEY);
        toast(v ? 'Klucz zapisany' : 'Klucz usunięty', 'success');
      },
    });
    // Dropdown modelu AI
    const currentModel = getGeminiModel();
    const currentModelDef = GEMINI_MODELS.find(m => m.id === currentModel) || GEMINI_MODELS[0];
    const modelSelect = h('select', {
      class: 'select input',
      onChange: (e) => {
        setGeminiModel(e.target.value);
        toast('Model AI ustawiony', 'success');
        rerender();
      },
    }, GEMINI_MODELS.map(m => h('option', {
      value: m.id,
      selected: m.id === currentModel ? 'selected' : null,
    }, m.label)));

    cont.appendChild(group('Skanowanie paragonów (AI)', [
      h('div', { class: 'settings-row', style: { flexDirection: 'column', alignItems: 'stretch', padding: '14px 16px' } }, [
        h('div', { class: 'row', style: { gap: '10px', marginBottom: '8px' } }, [
          icon('key'),
          h('div', { class: 'label' }, 'Klucz Google Gemini API'),
        ]),
        apiInput,
        h('div', { class: 'muted', style: { fontSize: '12px', marginTop: '6px' } }, [
          'Wygeneruj klucz na ',
          h('a', { href: 'https://aistudio.google.com/apikey', target: '_blank', rel: 'noopener' }, 'aistudio.google.com/apikey'),
          '. Klucz trzymany lokalnie w tej przeglądarce, nigdy nie wysyłany do Supabase.',
        ]),
      ]),
      h('div', { class: 'settings-row', style: { flexDirection: 'column', alignItems: 'stretch', padding: '14px 16px' } }, [
        h('div', { class: 'label', style: { marginBottom: '6px' } }, 'Model AI'),
        modelSelect,
        h('div', { class: 'muted', style: { fontSize: '12px', marginTop: '6px' } }, currentModelDef.hint),
      ]),
    ]));

    // Konto
    cont.appendChild(group('Konto', [
      h('div', { class: 'settings-row' }, [
        h('div', { class: 'label' }, 'Imię'),
        h('div', { class: 'value' }, store.profile?.name || '—'),
      ]),
      h('div', { class: 'settings-row' }, [
        h('div', { class: 'label' }, 'E-mail'),
        h('div', { class: 'value' }, store.user?.email || '—'),
      ]),
      h('button', {
        class: 'settings-row button-row',
        type: 'button',
        onClick: () => openPasswordEditor(),
      }, [
        h('div', { class: 'label' }, 'Zmień hasło'),
        icon('chevron-right'),
      ]),
      h('button', {
        class: 'settings-row button-row',
        type: 'button',
        style: { color: 'var(--danger)' },
        onClick: async () => {
          if (!confirm('Wylogować się?')) return;
          await signOut();
        },
      }, [
        h('div', { class: 'row' }, [icon('log-out'), h('div', {}, 'Wyloguj się')]),
      ]),
    ]));

    // Build info
    cont.appendChild(h('div', {
      class: 'center muted',
      style: { fontSize: '11px', padding: '24px 16px' },
    }, 'Home Budget v0.1 · Twój wspólny budżet'));
  }

  function group(title, rows) {
    return h('div', { class: 'settings-group' }, [
      h('h3', {}, title),
      ...rows,
    ]);
  }

  function openCategoryEditor() {
    const palette = ['#34d399', '#6366f1', '#8b5cf6', '#f59e0b', '#f87171', '#f472b6', '#22d3ee', '#a78bfa', '#94a3b8'];
    const iconOptions = ['shopping-cart', 'car', 'gamepad-2', 'home', 'heart-pulse', 'baby', 'plane', 'smartphone', 'package', 'wallet'];
    let chosenColor = palette[0];
    let chosenIcon = iconOptions[0];

    const nameInput = h('input', { class: 'input', placeholder: 'Nazwa kategorii', required: true });

    const colorRow = h('div', { class: 'row', style: { flexWrap: 'wrap', gap: '8px', marginTop: '8px' } });
    palette.forEach(col => {
      const btn = h('button', {
        type: 'button',
        style: {
          width: '32px', height: '32px', borderRadius: '50%',
          background: col, border: chosenColor === col ? '3px solid var(--text)' : '3px solid transparent',
          cursor: 'pointer',
        },
        onClick: () => {
          chosenColor = col;
          [...colorRow.children].forEach((c, i) => c.style.border = palette[i] === col ? '3px solid var(--text)' : '3px solid transparent');
        },
      });
      colorRow.appendChild(btn);
    });

    const iconRow = h('div', { class: 'row', style: { flexWrap: 'wrap', gap: '8px', marginTop: '8px' } });
    iconOptions.forEach(name => {
      const btn = h('button', {
        type: 'button',
        style: {
          width: '40px', height: '40px', borderRadius: '12px',
          background: chosenIcon === name ? 'var(--primary)' : 'var(--surface-2)',
          color: chosenIcon === name ? 'var(--primary-ink)' : 'var(--text)',
          border: 'none', cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        },
        onClick: () => {
          chosenIcon = name;
          [...iconRow.children].forEach((c, i) => {
            c.style.background = iconOptions[i] === name ? 'var(--primary)' : 'var(--surface-2)';
            c.style.color = iconOptions[i] === name ? 'var(--primary-ink)' : 'var(--text)';
          });
        },
      }, icon(name, { size: 20 }));
      iconRow.appendChild(btn);
    });

    openModal('Nowa kategoria', [
      h('div', { class: 'field' }, [h('label', {}, 'Nazwa'), nameInput]),
      h('div', { class: 'field' }, [h('label', {}, 'Kolor'), colorRow]),
      h('div', { class: 'field' }, [h('label', {}, 'Ikona'), iconRow]),
    ], async () => {
      const name = nameInput.value.trim();
      if (!name) { toast('Podaj nazwę', 'error'); return false; }
      try {
        await createCategory({ name, color: chosenColor, icon: chosenIcon });
        toast('Dodano kategorię', 'success');
        return true;
      } catch (err) { toast(err.message, 'error'); return false; }
    });
  }

  function openPasswordEditor() {
    const p1 = h('input', { class: 'input', type: 'password', placeholder: 'Nowe hasło (min. 6 znaków)' });
    const p2 = h('input', { class: 'input', type: 'password', placeholder: 'Powtórz hasło' });
    openModal('Zmiana hasła', [
      h('div', { class: 'field' }, [h('label', {}, 'Nowe hasło'), p1]),
      h('div', { class: 'field' }, [h('label', {}, 'Powtórz hasło'), p2]),
    ], async () => {
      if (p1.value.length < 6) { toast('Hasło min. 6 znaków', 'error'); return false; }
      if (p1.value !== p2.value) { toast('Hasła nie są identyczne', 'error'); return false; }
      try {
        await changePassword(p1.value);
        toast('Hasło zmienione', 'success');
        return true;
      } catch (err) { toast(err.message, 'error'); return false; }
    });
  }

  const unsub = store.on(() => rerender());
  window.addEventListener('hashchange', () => unsub(), { once: true });
  rerender();

  return h('div', {}, [root, bottomNav()]);
}

function openModal(title, bodyChildren, onSubmit) {
  const close = () => { backdrop.remove(); sheet.remove(); };
  const backdrop = h('div', { class: 'sheet-backdrop', onClick: close });
  const sheet = h('div', { class: 'sheet' }, [
    h('div', { class: 'sheet-handle' }),
    h('div', { class: 't-section', style: { marginBottom: '12px', padding: '0 8px' } }, title),
    h('div', { class: 'stack', style: { '--gap': '12px' } }, bodyChildren),
    h('div', { class: 'row', style: { marginTop: '16px', gap: '8px' } }, [
      h('button', { class: 'btn btn-ghost', type: 'button', onClick: close, style: { flex: 1 } }, 'Anuluj'),
      h('button', {
        class: 'btn btn-primary',
        type: 'button',
        style: { flex: 1 },
        onClick: async () => {
          const ok = await onSubmit();
          if (ok) close();
        },
      }, 'Zapisz'),
    ]),
  ]);
  document.body.appendChild(backdrop);
  document.body.appendChild(sheet);
}
