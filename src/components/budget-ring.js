// SVG pierścień: ile % budżetu wydane. Czerwony >90%.

const SVG_NS = 'http://www.w3.org/2000/svg';

export function budgetRing({ spent, limit, size = 200, stroke = 18 }) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const ratio = limit > 0 ? Math.min(spent / limit, 1.1) : 0;
  const dash = c * Math.min(ratio, 1);
  const dashArr = `${dash} ${c - dash}`;
  const overLimit = limit > 0 && spent > limit;
  const nearLimit = limit > 0 && spent >= limit * 0.9;
  const color = overLimit ? 'var(--danger)' : nearLimit ? 'var(--danger)' : 'var(--accent)';

  const svg = document.createElementNS(SVG_NS, 'svg');
  svg.setAttribute('viewBox', `0 0 ${size} ${size}`);
  svg.setAttribute('width', size);
  svg.setAttribute('height', size);

  // Tło pierścienia
  const bg = document.createElementNS(SVG_NS, 'circle');
  bg.setAttribute('cx', size / 2);
  bg.setAttribute('cy', size / 2);
  bg.setAttribute('r', r);
  bg.setAttribute('fill', 'none');
  bg.setAttribute('stroke', 'var(--surface-2)');
  bg.setAttribute('stroke-width', stroke);
  svg.appendChild(bg);

  // Wartość
  if (limit > 0) {
    const fg = document.createElementNS(SVG_NS, 'circle');
    fg.setAttribute('cx', size / 2);
    fg.setAttribute('cy', size / 2);
    fg.setAttribute('r', r);
    fg.setAttribute('fill', 'none');
    fg.setAttribute('stroke', color);
    fg.setAttribute('stroke-width', stroke);
    fg.setAttribute('stroke-linecap', 'round');
    fg.setAttribute('stroke-dasharray', dashArr);
    fg.setAttribute('stroke-dashoffset', c / 4);
    fg.setAttribute('transform', `rotate(-90 ${size / 2} ${size / 2})`);
    fg.style.transition = 'stroke-dasharray 0.6s ease';
    svg.appendChild(fg);
  }

  return svg;
}
