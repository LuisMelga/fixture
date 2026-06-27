/** Capa CORE — calendario, parsing de fechas y estado de partidos en vivo. */
import type { LiveClass } from '../domain/types';
import { GROUPS } from '../data/groups';
import { SCHEDULE } from '../data/schedule';
import { store } from '../state/store';
import { matchTeams, feederTokens, seedHint, KO_ROUNDS } from './bracket';

const MON_ES: Record<string, number> = {
  Ene: 0, Feb: 1, Mar: 2, Abr: 3, May: 4, Jun: 5,
  Jul: 6, Ago: 7, Sep: 8, Oct: 9, Nov: 10, Dic: 11,
};

/** "Jue 11 Jun · 14:00" (hora de Perú, UTC-5) -> timestamp UTC. */
export function parseDtTs(dt: string): number | null {
  const m = (dt || '').match(/(\d{1,2})\s+([A-Za-zÁÉÍÓÚáéíóú]+)\s+·\s+(\d{1,2}):(\d{2})/);
  if (!m) return null;
  const mon = MON_ES[m[2].slice(0, 3)];
  if (mon == null) return null;
  return Date.UTC(2026, mon, +m[1], +m[3] + 5, +m[4]);
}

export function peruDayKey(ts: number): string {
  const d = new Date(ts - 5 * 3600000);
  return d.getUTCFullYear() + '-' + d.getUTCMonth() + '-' + d.getUTCDate();
}

export function timePart(dt: string): string {
  const p = (dt || '').split(' · ');
  return p[1] || '';
}

export interface ScheduledMatch {
  key: string;
  ts: number;
}

let cache: ScheduledMatch[] | null = null;
export function allScheduledMatches(): ScheduledMatch[] {
  if (cache) return cache;
  const out: ScheduledMatch[] = [];
  for (const key of Object.keys(SCHEDULE)) {
    const ts = parseDtTs(SCHEDULE[key].dt);
    if (ts == null) continue;
    out.push({ key, ts });
  }
  out.sort((a, b) => a.ts - b.ts);
  return (cache = out);
}

export interface LiveInfo {
  h: string;
  a: string;
  hLabel: string;
  aLabel: string;
  round: string;
}

export function liveMatchInfo(key: string): LiveInfo {
  if (/^[A-L]\d$/.test(key)) {
    const g = GROUPS.find((x) => x.m.some((m) => m[0] === key))!;
    const m = g.m.find((m) => m[0] === key)!;
    return { h: m[3], a: m[4], hLabel: '', aLabel: '', round: 'Grupo ' + g.id };
  }
  const id = +key;
  const t = matchTeams(id);
  const tk = feederTokens(id);
  const lbl = KO_ROUNDS.find((r) => r.ids.includes(id));
  return {
    h: t[0],
    a: t[1],
    hLabel: t[0] ? '' : seedHint(tk[0]),
    aLabel: t[1] ? '' : seedHint(tk[1]),
    round: lbl ? lbl.label : 'Eliminatoria',
  };
}

export function matchClass(mm: ScheduledMatch): LiveClass {
  const es = store.espn[mm.key];
  if (es && es.st === 'in') return 'live';
  if (es && es.st === 'post') return 'done';
  const now = Date.now();
  if (now >= mm.ts && now < mm.ts + 125 * 60000) return 'live';
  if (now >= mm.ts + 125 * 60000) return 'done';
  return 'soon';
}

export function anyMatchLiveNow(): boolean {
  for (const k in store.espn) {
    if (store.espn[k] && store.espn[k].st === 'in') return true;
  }
  const now = Date.now();
  return allScheduledMatches().some((mm) => now >= mm.ts && now < mm.ts + 125 * 60000);
}
