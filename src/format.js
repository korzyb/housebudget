// Formatowanie i parsowanie wartości

const pln = new Intl.NumberFormat('pl-PL', {
  style: 'currency',
  currency: 'PLN',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const plnCompact = new Intl.NumberFormat('pl-PL', {
  style: 'currency',
  currency: 'PLN',
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

const dateLong = new Intl.DateTimeFormat('pl-PL', { day: 'numeric', month: 'long', year: 'numeric' });
const dateShort = new Intl.DateTimeFormat('pl-PL', { day: '2-digit', month: '2-digit', year: 'numeric' });
const dateWeekday = new Intl.DateTimeFormat('pl-PL', { weekday: 'long', day: 'numeric', month: 'long' });
const monthLong = new Intl.DateTimeFormat('pl-PL', { month: 'long', year: 'numeric' });

export function formatPLN(value, { compact = false } = {}) {
  const n = Number(value) || 0;
  return compact ? plnCompact.format(n) : pln.format(n);
}

export function formatDate(d, kind = 'short') {
  const date = toDate(d);
  if (!date) return '';
  if (kind === 'long') return dateLong.format(date);
  if (kind === 'weekday') return dateWeekday.format(date);
  if (kind === 'month') return monthLong.format(date);
  return dateShort.format(date);
}

export function toDate(input) {
  if (!input) return null;
  if (input instanceof Date) return isNaN(input) ? null : input;
  if (typeof input === 'string') {
    // ISO yyyy-mm-dd lub pełen ISO
    const d = new Date(input.length === 10 ? input + 'T00:00:00' : input);
    return isNaN(d) ? null : d;
  }
  return null;
}

export function toISODate(d) {
  const date = toDate(d) || new Date();
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

// Parsuje string typu "12,50" / "12.50" / "1 234,56" → number
export function parsePLN(str) {
  if (typeof str === 'number') return str;
  if (!str) return 0;
  const cleaned = String(str).replace(/\s/g, '').replace(',', '.');
  const n = parseFloat(cleaned);
  return isNaN(n) ? 0 : n;
}

// Helpery dat
export function startOfDay(d) {
  const x = toDate(d) || new Date();
  x.setHours(0, 0, 0, 0);
  return x;
}
export function startOfWeek(d) {
  const x = startOfDay(d);
  const day = x.getDay() || 7; // niedziela = 7 (tydzień zaczyna się w poniedziałek)
  if (day !== 1) x.setDate(x.getDate() - (day - 1));
  return x;
}
export function startOfMonth(d) {
  const x = startOfDay(d);
  x.setDate(1);
  return x;
}
export function addMonths(d, n) {
  const x = new Date(d);
  x.setMonth(x.getMonth() + n);
  return x;
}
export function addDays(d, n) {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
}
export function isSameDay(a, b) {
  const x = toDate(a), y = toDate(b);
  if (!x || !y) return false;
  return x.getFullYear() === y.getFullYear()
    && x.getMonth() === y.getMonth()
    && x.getDate() === y.getDate();
}
