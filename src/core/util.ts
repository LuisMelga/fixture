/** Capa CORE — utilidades puras. */

/** Normaliza: minúsculas, sin acentos ni símbolos. */
export function norm(s: unknown): string {
  return (s ?? '')
    .toString()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]/g, '');
}

/** Parsea un valor de gol; null si vacío/no numérico. */
export function num(v: unknown): number | null {
  if (v === '' || v === null || v === undefined) return null;
  const n = typeof v === 'number' ? v : parseInt(String(v), 10);
  return isNaN(n) ? null : n;
}

/** Sanea un string de goles: solo dígitos, máx 2 (0–99). */
export function clampGoalsStr(raw: string): { value: string; num: number | undefined } {
  const value = (raw || '').replace(/\D/g, '').slice(0, 2);
  return { value, num: value === '' ? undefined : parseInt(value, 10) };
}

/** Luminancia relativa de un color hex. */
export function lum(hex: string): number {
  const c = hex.replace('#', '');
  const r = parseInt(c.substr(0, 2), 16);
  const g = parseInt(c.substr(2, 2), 16);
  const b = parseInt(c.substr(4, 2), 16);
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255;
}

/** Color de texto legible sobre un fondo. */
export function txtOn(hex: string): string {
  return lum(hex) > 0.62 ? '#15233a' : '#ffffff';
}
