import { h, toast } from '../dom.js';
import { icon } from '../icons.js';
import { store } from '../store.js';
import { navigate } from '../router.js';
import { uploadReceiptPhoto } from '../supabase.js';
import { analyzeReceipt, hasGeminiKey } from '../gemini.js';
import { toISODate } from '../format.js';
import { getCategory } from '../categories.js';

// Wspólna procedura przetwarzania zdjęcia paragonu — używana z aparatu live i z galerii (add-sheet).
// Pokazuje overlay w body, uploaduje, woła Gemini, ustawia draft i nawiguje do receipt-detail.
export async function processReceiptBlob(blob) {
  if (!blob) return;
  console.log('[process] start', { size: blob.size, type: blob.type });

  const overlay = createBodyOverlay('Wysyłanie zdjęcia…');
  try {
    // 1) upload
    let photoUrl = null;
    try {
      photoUrl = await uploadReceiptPhoto(blob, blobExt(blob));
      console.log('[process] upload OK', photoUrl);
    } catch (err) {
      console.error('[process] Upload failed:', err);
      toast('Upload zdjęcia: ' + err.message, 'error', 8000);
    }

    // 2) Gemini
    let aiResult = null;
    if (hasGeminiKey()) {
      overlay.setText('AI czyta paragon…');
      try {
        aiResult = await analyzeReceipt(blob);
        console.log('[process] AI result', aiResult);
      } catch (err) {
        console.error('[process] Gemini error:', err);
        toast('AI: ' + err.message, 'error', 10000);
      }
    } else {
      toast('Wpisz klucz Gemini w ustawieniach, żeby AI czytało paragony.', 'error', 6000);
    }

    // 3) Draft → przejście do receipt-detail
    const draft = buildDraft(aiResult, photoUrl);
    console.log('[process] draft', draft);
    store.setDraftReceipt(draft);
    navigate('/receipt/new');
  } finally {
    overlay.remove();
  }
}

export function renderCamera() {
  // ?source=gallery → fallback gdy aparat zawiódł (live capture); otwieramy file input
  const params = new URLSearchParams((location.hash.split('?')[1] || ''));
  const source = params.get('source');

  let stream = null;
  let videoEl = null;
  let canceled = false;

  const root = h('div', { class: 'camera-view' });

  const stopStream = () => {
    if (stream) {
      stream.getTracks().forEach(t => t.stop());
      stream = null;
    }
  };

  window.addEventListener('hashchange', () => { canceled = true; stopStream(); }, { once: true });

  if (source === 'gallery' || !navigator.mediaDevices?.getUserMedia) {
    // Fallback: file input (gdy aparat zawiódł — rzadko używany)
    const input = h('input', {
      type: 'file',
      accept: 'image/*,application/pdf',
      style: { position: 'fixed', left: '-9999px', top: '-9999px' },
      onChange: async (e) => {
        const file = e.target.files?.[0];
        if (!file) { history.back(); return; }
        await processReceiptBlob(file);
      },
    });
    root.appendChild(input);
    root.appendChild(h('div', { class: 'camera-loading' }, [
      h('div', { class: 'spinner-lg spinner' }),
      h('div', {}, 'Wybierz zdjęcie z galerii…'),
    ]));
    requestAnimationFrame(() => requestAnimationFrame(() => input.click()));
    return root;
  }

  // Kamera live
  videoEl = h('video', { autoplay: true, playsinline: true, muted: true });
  root.appendChild(videoEl);

  const shutter = h('button', {
    class: 'shutter',
    type: 'button',
    'aria-label': 'Zrób zdjęcie',
    onClick: async () => {
      if (!videoEl.videoWidth) return;
      const canvas = document.createElement('canvas');
      canvas.width = videoEl.videoWidth;
      canvas.height = videoEl.videoHeight;
      canvas.getContext('2d').drawImage(videoEl, 0, 0);
      const blob = await new Promise(r => canvas.toBlob(r, 'image/jpeg', 0.85));
      stopStream();
      await processReceiptBlob(blob);
    },
  });

  const closeBtn = h('button', {
    class: 'side-btn',
    type: 'button',
    'aria-label': 'Zamknij',
    onClick: () => { stopStream(); history.back(); },
  }, icon('x'));

  const galleryBtn = h('button', {
    class: 'side-btn',
    type: 'button',
    'aria-label': 'Galeria',
    onClick: () => navigate('/camera?source=gallery'),
  }, icon('image'));

  root.appendChild(h('div', { class: 'camera-controls' }, [
    closeBtn, shutter, galleryBtn,
  ]));

  // Start stream
  (async () => {
    try {
      stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: 'environment' } },
        audio: false,
      });
      if (canceled) { stopStream(); return; }
      videoEl.srcObject = stream;
    } catch (err) {
      toast('Brak dostępu do aparatu: ' + (err.message || err.name), 'error', 4500);
      navigate('/camera?source=gallery');
    }
  })();

  return root;
}

// Globalny overlay w body — niezależny od mounting/unmounting widoków
function createBodyOverlay(initialText) {
  const text = h('div', {
    style: { fontSize: '15px', color: 'white', fontWeight: '500' },
  }, initialText);
  const node = h('div', {
    style: {
      position: 'fixed',
      inset: '0',
      background: 'rgba(8, 7, 20, 0.85)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '16px',
      zIndex: '9999',
    },
  }, [
    h('div', { class: 'spinner-lg spinner' }),
    text,
  ]);
  document.body.appendChild(node);
  return {
    setText: (t) => { text.textContent = t; },
    remove: () => node.remove(),
  };
}

function blobExt(blob) {
  const t = blob.type || '';
  if (t.includes('png')) return 'png';
  if (t.includes('webp')) return 'webp';
  if (t.includes('pdf')) return 'pdf';
  return 'jpg';
}

function buildDraft(ai, photoUrl) {
  let catId = null;
  if (ai?.suggested_category_slug) {
    const c = getCategory(ai.suggested_category_slug);
    if (c) catId = c.id;
  }
  if (!catId) {
    const food = store.categories.find(c => c.slug === 'food');
    catId = food?.id || store.categories[0]?.id || null;
  }
  return {
    store_name: ai?.store_name || '',
    purchase_date: ai?.purchase_date || toISODate(new Date()),
    category_id: catId,
    amount: ai?.total_amount || 0,
    description: '',
    photo_url: photoUrl,
    items: ai?.items || [],
  };
}
