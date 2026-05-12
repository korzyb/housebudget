import { h, toast } from '../dom.js';
import { icon } from '../icons.js';
import { store } from '../store.js';
import { navigate } from '../router.js';
import { uploadReceiptPhoto } from '../supabase.js';
import { analyzeReceipt, hasGeminiKey } from '../gemini.js';
import { toISODate } from '../format.js';
import { getCategory } from '../categories.js';

export function renderCamera() {
  // ?source=gallery → omiń getUserMedia
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
    // Fallback: file input
    const input = h('input', {
      type: 'file',
      accept: 'image/*,application/pdf',
      style: { display: 'none' },
      onChange: async (e) => {
        const file = e.target.files?.[0];
        if (!file) { history.back(); return; }
        await processBlob(file);
      },
    });
    setTimeout(() => input.click(), 50);
    root.appendChild(input);
    root.appendChild(h('div', { class: 'camera-loading' }, [
      h('div', { class: 'spinner-lg spinner' }),
      h('div', {}, 'Wybierz zdjęcie z galerii…'),
    ]));
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
      await processBlob(blob);
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

  async function processBlob(blob) {
    if (!blob) { history.back(); return; }
    const overlay = h('div', { class: 'camera-loading' }, [
      h('div', { class: 'spinner-lg spinner' }),
      h('div', { id: 'cam-status' }, 'Wysyłanie zdjęcia…'),
    ]);
    root.appendChild(overlay);

    const setStatus = (txt) => { const s = overlay.querySelector('#cam-status'); if (s) s.textContent = txt; };

    try {
      // 1) upload
      let photoUrl = null;
      try {
        photoUrl = await uploadReceiptPhoto(blob, blobExt(blob));
      } catch (err) {
        console.warn('Upload failed:', err);
        toast('Nie udało się wgrać zdjęcia (zachowam dane lokalnie)', 'error');
      }

      // 2) Gemini
      let aiResult = null;
      if (hasGeminiKey()) {
        setStatus('AI czyta paragon…');
        try {
          aiResult = await analyzeReceipt(blob);
        } catch (err) {
          toast('AI: ' + err.message, 'error', 5000);
        }
      } else {
        toast('Wpisz klucz Gemini w ustawieniach, żeby AI czytało paragony.', 'error', 5000);
      }

      // 3) Draft → przejście do receipt-detail
      const draft = buildDraft(aiResult, photoUrl);
      store.setDraftReceipt(draft);
      navigate('/receipt/new');
    } finally {
      overlay.remove();
    }
  }

  return root;
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
