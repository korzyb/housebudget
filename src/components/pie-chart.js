// Donut pie chart components dla dashboardu.
// categoryPieChart — podział wydatków po kategoriach z ikonkami na zewnątrz.
// extraPieChart    — podział "Dodatkowych wydatków" z etykietami, kolory różowy→fioletowy.

const SVG_NS = 'http://www.w3.org/2000/svg';

function segPath(cx, cy, ri, ro, a0, a1) {
  const lg = (a1 - a0 > Math.PI) ? 1 : 0;
  const x0o = cx + ro * Math.cos(a0), y0o = cy + ro * Math.sin(a0);
  const x1o = cx + ro * Math.cos(a1), y1o = cy + ro * Math.sin(a1);
  const x1i = cx + ri * Math.cos(a1), y1i = cy + ri * Math.sin(a1);
  const x0i = cx + ri * Math.cos(a0), y0i = cy + ri * Math.sin(a0);
  return `M ${x0o} ${y0o} A ${ro} ${ro} 0 ${lg} 1 ${x1o} ${y1o} L ${x1i} ${y1i} A ${ri} ${ri} 0 ${lg} 0 ${x0i} ${y0i} Z`;
}

function makeSvg(size) {
  const svg = document.createElementNS(SVG_NS, 'svg');
  svg.setAttribute('viewBox', `0 0 ${size} ${size}`);
  svg.setAttribute('width', size);
  svg.setAttribute('height', size);
  svg.style.cssText = 'position:absolute;inset:0;overflow:visible';
  return svg;
}

function addBgRing(svg, cx, cy, ro, ri) {
  const c = document.createElementNS(SVG_NS, 'circle');
  c.setAttribute('cx', cx); c.setAttribute('cy', cy);
  c.setAttribute('r', (ro + ri) / 2);
  c.setAttribute('fill', 'none');
  c.setAttribute('stroke', 'var(--surface-2)');
  c.setAttribute('stroke-width', ro - ri);
  svg.appendChild(c);
}

function makeCenterText(label, sub) {
  const el = document.createElement('div');
  el.style.cssText = 'position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:2px;pointer-events:none';
  const a = document.createElement('div');
  a.className = 'ring-amount';
  a.textContent = label;
  el.appendChild(a);
  if (sub) {
    const s = document.createElement('div');
    s.className = 'ring-sub';
    s.textContent = sub;
    el.appendChild(s);
  }
  return el;
}

// Podział miesięcznych wydatków per kategoria.
// segments: [{ color, pct, iconEl }] — iconEl to element DOM (np. z categoryIconBox)
export function categoryPieChart({ segments, centerLabel, centerSub = '', size = 200 }) {
  const ro = 91, ri = 73;
  const cx = size / 2, cy = size / 2;
  const gap = segments.length > 1 ? 0.05 : 0;
  const iconDist = ro + 18, iconSize = 22;

  const wrapper = document.createElement('div');
  wrapper.style.cssText = `position:relative;width:${size}px;height:${size}px;overflow:visible;flex-shrink:0`;

  const svg = makeSvg(size);
  addBgRing(svg, cx, cy, ro, ri);

  let angle = -Math.PI / 2;
  const iconsToDraw = [];

  for (const seg of segments) {
    const sweep = Math.max(0, (seg.pct / 100) * 2 * Math.PI - gap);
    if (sweep < 0.02) { angle += sweep + gap; continue; }
    const a0 = angle + gap / 2, a1 = a0 + sweep;
    const path = document.createElementNS(SVG_NS, 'path');
    path.setAttribute('d', segPath(cx, cy, ri, ro, a0, a1));
    path.setAttribute('fill', seg.color);
    svg.appendChild(path);
    if (seg.pct >= 5 && seg.iconEl) {
      iconsToDraw.push({ mid: a0 + sweep / 2, iconEl: seg.iconEl });
    }
    angle += sweep + gap;
  }

  wrapper.appendChild(svg);
  wrapper.appendChild(makeCenterText(centerLabel, centerSub));

  for (const { mid, iconEl } of iconsToDraw) {
    const x = Math.round(cx + iconDist * Math.cos(mid) - iconSize / 2);
    const y = Math.round(cy + iconDist * Math.sin(mid) - iconSize / 2);
    iconEl.style.position = 'absolute';
    iconEl.style.left = `${x}px`;
    iconEl.style.top = `${y}px`;
    iconEl.style.width = `${iconSize}px`;
    iconEl.style.height = `${iconSize}px`;
    iconEl.style.borderRadius = '6px';
    iconEl.style.flexShrink = '0';
    wrapper.appendChild(iconEl);
  }

  return wrapper;
}

// Podział "Dodatkowych wydatków" — kolory od jasnego różowego do ciemnego fioletu.
// segments: [{ pct, label }] — posortowane ROSNĄCO po kwocie (najmniejszy = najjaśniejszy kolor)
export function extraPieChart({ segments, centerLabel, centerSub = '', size = 200 }) {
  const ro = 91, ri = 73;
  const cx = size / 2, cy = size / 2;
  const gap = segments.length > 1 ? 0.05 : 0;
  const labelDist = ro + 16;

  // jasny różowy → ciemny fiolet
  function gradColor(t) {
    const r = Math.round(251 + (107 - 251) * t);
    const g = Math.round(182 + (33 - 182)  * t);
    const b = Math.round(206 + (168 - 206) * t);
    return `rgb(${r},${g},${b})`;
  }

  const wrapper = document.createElement('div');
  wrapper.style.cssText = `position:relative;width:${size}px;height:${size}px;overflow:visible;flex-shrink:0`;

  const svg = makeSvg(size);
  addBgRing(svg, cx, cy, ro, ri);

  let angle = -Math.PI / 2;
  const labelsToDraw = [];
  const n = segments.length;

  for (let i = 0; i < n; i++) {
    const seg = segments[i];
    const sweep = Math.max(0, (seg.pct / 100) * 2 * Math.PI - gap);
    if (sweep < 0.02) { angle += sweep + gap; continue; }
    const a0 = angle + gap / 2, a1 = a0 + sweep;
    const t = n > 1 ? i / (n - 1) : 0.5;
    const col = gradColor(t);
    const path = document.createElementNS(SVG_NS, 'path');
    path.setAttribute('d', segPath(cx, cy, ri, ro, a0, a1));
    path.setAttribute('fill', col);
    svg.appendChild(path);
    if (seg.pct >= 4) {
      labelsToDraw.push({ mid: a0 + sweep / 2, label: seg.label, col });
    }
    angle += sweep + gap;
  }

  wrapper.appendChild(svg);
  wrapper.appendChild(makeCenterText(centerLabel, centerSub));

  for (const { mid, label, col } of labelsToDraw) {
    const x = Math.round(cx + labelDist * Math.cos(mid));
    const y = Math.round(cy + labelDist * Math.sin(mid));
    const onRight = Math.cos(mid) >= 0;
    const el = document.createElement('div');
    el.title = label;
    el.style.cssText = [
      'position:absolute',
      `left:${x}px`,
      `top:${y}px`,
      `color:${col}`,
      'font-size:10px',
      'font-weight:700',
      'line-height:1',
      'max-width:64px',
      'white-space:nowrap',
      'overflow:hidden',
      'text-overflow:ellipsis',
      onRight ? 'transform:translateY(-50%)' : 'transform:translate(-100%,-50%)',
    ].join(';');
    el.textContent = label.length > 11 ? label.slice(0, 10) + '…' : label;
    wrapper.appendChild(el);
  }

  return wrapper;
}
