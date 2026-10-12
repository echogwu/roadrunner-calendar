export function calendarWeeks(year, month) {
  const start = new Date(Date.UTC(year, month, 1)).getUTCDay();
  const count = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
  const cells = Array.from({length: Math.ceil((start + count) / 7) * 7}, (_, i) => i >= start && i < start + count ? i - start + 1 : null);
  return Array.from({length: cells.length / 7}, (_, i) => cells.slice(i * 7, i * 7 + 7));
}
