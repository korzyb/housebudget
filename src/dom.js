// Minimalistyczny helper do tworzenia DOM bez JSX.
// Użycie: h('div', { class: 'card' }, [h('h2', {}, 'Tytuł'), child2])

export function h(tag, attrs = {}, children = []) {
  const el = document.createElement(tag);
  for (const [key, val] of Object.entries(attrs || {})) {
    if (val == null || val === false) continue;
    if (key === 'class') el.className = val;
    else if (key === 'style' && typeof val === 'object') Object.assign(el.style, val);
    else if (key === 'dataset' && typeof val === 'object') Object.assign(el.dataset, val);
    else if (key.startsWith('on') && typeof val === 'function') {
      el.addEventListener(key.slice(2).toLowerCase(), val);
    } else if (key === 'html') {
      el.innerHTML = val;
    } else if (key in el && typeof el[key] !== 'function' && !['type', 'autocomplete', 'name'].includes(key)) {
      try { el[key] = val; } catch { el.setAttribute(key, val); }
    } else {
      el.setAttribute(key, val);
    }
  }
  appendChildren(el, children);
  return el;
}

function appendChildren(el, children) {
  if (children == null || children === false) return;
  if (Array.isArray(children)) {
    for (const c of children) appendChildren(el, c);
    return;
  }
  if (children instanceof Node) {
    el.appendChild(children);
    return;
  }
  if (typeof children === 'string' || typeof children === 'number') {
    el.appendChild(document.createTextNode(String(children)));
  }
}

// Czyści zawartość i wstawia nowe dziecko/dzieci
export function mount(parent, ...children) {
  parent.replaceChildren();
  for (const c of children) appendChildren(parent, c);
  return parent;
}

// Toast
export function toast(message, kind = 'info', ms = 3000) {
  const host = document.getElementById('toast-host');
  if (!host) return;
  const el = h('div', { class: `toast ${kind}` }, message);
  host.appendChild(el);
  setTimeout(() => {
    el.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
    el.style.opacity = '0';
    el.style.transform = 'translateY(-8px)';
    setTimeout(() => el.remove(), 300);
  }, ms);
}
