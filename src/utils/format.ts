/** Pure helpers shared across features. */

export const clamp = (n: number, min: number, max: number): number =>
  Math.max(min, Math.min(max, n));

export const pct = (n: number): string =>
  `${Math.round(clamp(n, 0, 1) * 100)}%`;

export const titleCase = (s: string): string =>
  s.replace(/\b\p{L}/gu, (c) => c.toLocaleUpperCase("tr-TR"));

export const startOfWeek = (d = new Date()): Date => {
  const date = new Date(d);
  const day = (date.getDay() + 6) % 7; // Monday = 0
  date.setHours(0, 0, 0, 0);
  date.setDate(date.getDate() - day);
  return date;
};

export const addDays = (d: Date, days: number): Date => {
  const r = new Date(d);
  r.setDate(r.getDate() + days);
  return r;
};

export const formatDayKey = (d: Date): string => d.toISOString().slice(0, 10);
