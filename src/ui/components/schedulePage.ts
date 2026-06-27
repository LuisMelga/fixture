/** UI — Vista "Partidos" dentro del SPA: lista por día (filtros estado/fecha) + detalle con tabla y recorrido. */
import { allScheduledMatches, liveMatchInfo, peruDayKey, matchClass, type ScheduledMatch } from '../../core/schedule';
import { SCHEDULE } from '../../data/schedule';
import { store } from '../../state/store';
import { num } from '../../core/util';
import { teamName } from '../../core/teamInfo';
import { feederTokens, seedHint, matchTeams, decided } from '../../core/bracket';
import { teamTrackHTML } from './route';
import { chip } from '../dom';

const TZ = 'America/Lima';
export type SpStatus = 'all' | 'played' | 'upcoming';
export type SpDate = 'all' | 'today' | 'tomorrow' | 'week';

function dayLabel(ts: number): string {
  const s = new Date(ts).toLocaleDateString('es-PE', { weekday: 'long', day: 'numeric', month: 'long', timeZone: TZ });
  return s.charAt(0).toUpperCase() + s.slice(1);
}
function timeLabel(ts: number): string {
  return new Date(ts).toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit', hour12: false, timeZone: TZ });
}
/** UTC ts de las 00:00 (hora de Perú) del día que contiene a ts. */
function peruMidnight(ts: number): number {
  const d = new Date(ts - 5 * 3600000);
  return Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()) + 5 * 3600000;
}

function passStatus(key: string, ts: number, status: SpStatus): boolean {
  if (status === 'all') return true;
  const sc = store.scoreOf(key);
  const hasResult = num(sc.h) !== null && num(sc.a) !== null;
  const live = store.espn[key]?.st === 'in' || matchClass({ key, ts } as ScheduledMatch) === 'live';
  if (status === 'played') return hasResult && !live;
  return !hasResult || live; // upcoming: en vivo o pendiente
}
function passDate(ts: number, dateF: SpDate): boolean {
  if (dateF === 'all') return true;
  const now = Date.now();
  const todayMid = peruMidnight(now);
  const mid = peruMidnight(ts);
  if (dateF === 'today') return mid === todayMid;
  if (dateF === 'tomorrow') return mid === todayMid + 86400000;
  // esta semana: lunes a domingo de la semana actual (hora de Perú)
  const dow = new Date(todayMid - 5 * 3600000).getUTCDay(); // 0=Dom..6=Sáb
  const weekStart = todayMid - ((dow + 6) % 7) * 86400000;
  return mid >= weekStart && mid < weekStart + 7 * 86400000;
}

function side(code: string, label: string): string {
  return code
    ? `${chip(code)}<span class="sp-name">${teamName(code)}</span>`
    : `<span class="sp-seed">${label}</span>`;
}

function matchRow(key: string, ts: number): string {
  const inf = liveMatchInfo(key);
  const sch = SCHEDULE[key] || { dt: '', stad: '' };
  const sc = store.scoreOf(key);
  const hn = num(sc.h);
  const an = num(sc.a);
  const played = hn !== null && an !== null;
  const live = store.espn[key]?.st === 'in' || matchClass({ key, ts } as ScheduledMatch) === 'live';
  const status = live
    ? `<span class="sp-badge live">● ${store.espn[key]?.detail || 'EN VIVO'}</span>`
    : played
      ? `<span class="sp-badge fin">Final</span>`
      : `<span class="sp-badge soon">${timeLabel(ts)}</span>`;
  const hw = played && hn! > an! ? 'win' : '';
  const aw = played && an! > hn! ? 'win' : '';
  const mid = played ? `<span class="sp-sc">${hn}<i>-</i>${an}</span>` : `<span class="sp-vs">vs</span>`;
  return `<div class="sp-match ${live ? 'live' : ''}" data-mkey="${key}" title="Ver detalle, tabla y recorrido">
    <div class="sp-top"><span class="sp-time">${timeLabel(ts)}</span><span class="sp-round">${inf.round}</span>${status}</div>
    <div class="sp-body">
      <div class="sp-side ${hw}">${side(inf.h, inf.hLabel)}</div>
      ${mid}
      <div class="sp-side away ${aw}">${side(inf.a, inf.aLabel)}</div>
    </div>
    ${sch.stad ? `<div class="sp-stad">📍 ${sch.stad}</div>` : ''}
  </div>`;
}

export interface DaySection {
  ts: number;
  items: ScheduledMatch[];
}

export function filteredDays(status: SpStatus, dateF: SpDate): DaySection[] {
  const filtered = allScheduledMatches().filter((m) => passStatus(m.key, m.ts, status) && passDate(m.ts, dateF));
  const days: DaySection[] = [];
  let curKey = '';
  for (const m of filtered) {
    const dk = peruDayKey(m.ts);
    if (dk !== curKey) {
      curKey = dk;
      days.push({ ts: m.ts, items: [] });
    }
    days[days.length - 1].items.push(m);
  }
  return days;
}

export function dayHTML(d: DaySection): string {
  return `<section class="sp-day"><h3 class="sp-day-h">${dayLabel(d.ts)}<span>${d.items.length} ${d.items.length === 1 ? 'partido' : 'partidos'}</span></h3><div class="sp-list-grid">${d.items.map((m) => matchRow(m.key, m.ts)).join('')}</div></section>`;
}

export function matchesByDayHTML(status: SpStatus, dateF: SpDate): string {
  const days = filteredDays(status, dateF);
  if (!days.length) return `<div class="sp-empty">No hay partidos con ese filtro.</div>`;
  return days.map(dayHTML).join('');
}

// ---------- Detalle de un partido ----------
function feederBlock(key: string): string {
  const id = +key;
  const tk = feederTokens(id);
  const [h, a] = matchTeams(id);
  const one = (code: string, tok: string): string => {
    const origin = code
      ? `${chip(code)} <b>${teamName(code)}</b>`
      : `<span class="sp-seed">${seedHint(tok)}</span>`;
    let from = '';
    if (tok[0] === 'W') {
      const fid = +tok.slice(1);
      const ft = matchTeams(fid);
      const fsc = store.scoreOf(String(fid));
      const d = decided(fid);
      const res =
        num(fsc.h) !== null && num(fsc.a) !== null ? ` (${fsc.h}-${fsc.a}${d ? ', def.' : ''})` : '';
      from = `<div class="sp-from">Viene del Partido ${fid}: ${ft[0] ? teamName(ft[0]) : seedHint(feederTokens(fid)[0])} vs ${ft[1] ? teamName(ft[1]) : seedHint(feederTokens(fid)[1])}${res}</div>`;
    }
    return `<div class="sp-feeder">${origin}${from}</div>`;
  };
  return `<div class="sp-trace-box"><div class="sp-trace-h">¿De dónde viene?</div>${one(h, tk[0])}${one(a, tk[1])}</div>`;
}

/** Detalle: cabecera + (tabla de grupo o traza de llaves) + recorrido del equipo enfocado. */
export function matchDetailHTML(key: string, focusCode: string | null): string {
  const isGroup = /^[A-L]\d$/.test(key);
  const inf = liveMatchInfo(key);
  const sch = SCHEDULE[key] || { dt: '', stad: '' };
  const sc = store.scoreOf(key);
  const ps = store.penScoreOf(key);
  const hn = num(sc.h);
  const an = num(sc.a);
  const played = hn !== null && an !== null;
  const tie = played && hn === an;
  const penTxt = tie && ps.h != null && ps.a != null ? ` <small>(pen ${ps.h}-${ps.a})</small>` : '';
  const scoreTxt = played ? `${hn} - ${an}${penTxt}` : 'vs';

  const teams = [inf.h, inf.a].filter(Boolean) as string[];
  const focus = focusCode && teams.includes(focusCode) ? focusCode : teams[0] || null;

  const tabs = teams
    .map((c) => `<button class="sp-tbtn ${c === focus ? 'on' : ''}" data-team="${c}">Recorrido de ${teamName(c)}</button>`)
    .join('');

  let context = '';
  if (focus) {
    // teamTrackHTML ya incluye la tabla del grupo y el recorrido completo en el cuadro.
    context = `<div class="sp-track">${teamTrackHTML(focus)}</div>`;
  } else {
    // Ningún equipo definido aún: mostrar la traza de llaves (de dónde viene).
    context = feederBlock(key);
  }

  return `<div class="sp-detail-head">
      <button class="sp-back" id="spBack">← Volver a la lista</button>
      <div class="sp-dh-round">${inf.round}${sch.dt ? ' · ' + sch.dt : ''}${sch.stad ? ' · ' + sch.stad : ''}</div>
      <div class="sp-dh-vs">
        <div class="sp-dh-side">${side(inf.h, inf.hLabel)}</div>
        <div class="sp-dh-sc">${scoreTxt}</div>
        <div class="sp-dh-side away">${side(inf.a, inf.aLabel)}</div>
      </div>
    </div>
    ${!isGroup ? feederBlock(key) : ''}
    ${teams.length ? `<div class="sp-tabs">${tabs}</div>` : ''}
    ${context}`;
}
