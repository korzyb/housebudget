// Wykres słupkowy: 6 ostatnich miesięcy.
// data: [{ label: 'Sty', value: 1234 }, ...]

const SVG_NS = 'http://www.w3.org/2000/svg';

export function barChart(data, { height = 140 } = {}) {
  const w = 320;
  const padL = 8, padR = 8, padTop = 10, padBot = 26;
  const innerH = height - padTop - padBot;
  const max = Math.max(...data.map(d => d.value), 1);
  const barW = (w - padL - padR) / data.length * 0.6;
  const slot = (w - padL - padR) / data.length;

  const svg = document.createElementNS(SVG_NS, 'svg');
  svg.setAttribute('viewBox', `0 0 ${w} ${height}`);
  svg.setAttribute('preserveAspectRatio', 'none');
  svg.setAttribute('width', '100%');
  svg.setAttribute('height', height);

  data.forEach((d, i) => {
    const x = padL + i * slot + (slot - barW) / 2;
    const h = Math.max((d.value / max) * innerH, 2);
    const y = padTop + (innerH - h);

    const bar = document.createElementNS(SVG_NS, 'rect');
    bar.setAttribute('x', x);
    bar.setAttribute('y', y);
    bar.setAttribute('width', barW);
    bar.setAttribute('height', h);
    bar.setAttribute('rx', 6);
    bar.setAttribute('fill', d.highlight ? 'var(--accent)' : 'var(--primary)');
    bar.setAttribute('opacity', d.highlight ? '1' : '0.8');
    svg.appendChild(bar);

    const label = document.createElementNS(SVG_NS, 'text');
    label.setAttribute('x', x + barW / 2);
    label.setAttribute('y', height - 8);
    label.setAttribute('text-anchor', 'middle');
    label.setAttribute('fill', 'var(--text-muted)');
    label.setAttribute('font-size', '11');
    label.setAttribute('font-family', 'inherit');
    label.textContent = d.label;
    svg.appendChild(label);
  });

  return svg;
}
