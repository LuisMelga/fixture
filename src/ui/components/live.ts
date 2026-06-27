/** UI — panel "En vivo / Hoy / Próximos". */
import type { LiveClass } from '../../domain/types';
import { SCHEDULE } from '../../data/schedule';
import { store } from '../../state/store';
import { num } from '../../core/util';
import { teamName } from '../../core/teamInfo';
import {
  allScheduledMatches,
  liveMatchInfo,
  matchClass,
  peruDayKey,
  timePart,
  type ScheduledMatch,
} from '../../core/schedule';
import { chip } from '../dom';

function liveCardHTML(mm: ScheduledMatch, cls: LiveClass): string {
  const inf = liveMatchInfo(mm.key);
  const sch = SCHEDULE[mm.key] || { dt: '', stad: '' };
  const sc = store.scoreOf(mm.key);
  const hn = num(sc.h);
  const an = num(sc.a);
  const es = store.espn[mm.key];
  const hHTML = inf.h
    ? `${chip(inf.h)} <span class="lv-tm clickable" data-team="${inf.h}" title="Ver recorrido de ${teamName(inf.h)}">${teamName(inf.h)}</span>`
    : `<span class="lv-seed">${inf.hLabel}</span>`;
  const aHTML = inf.a
    ? `${chip(inf.a)} <span class="lv-tm clickable" data-team="${inf.a}" title="Ver recorrido de ${teamName(inf.a)}">${teamName(inf.a)}</span>`
    : `<span class="lv-seed">${inf.aLabel}</span>`;
  const score = hn !== null && an !== null ? `${hn}<i>-</i>${an}` : `<span class="lv-vs">vs</span>`;
  let badge: string;
  if (cls === 'live') badge = `<span class="lv-badge live"><span class="dot"></span>${es?.detail || 'EN VIVO'}</span>`;
  else if (cls === 'done') badge = `<span class="lv-badge done">Final</span>`;
  else badge = `<span class="lv-badge soon">${timePart(sch.dt) || ''}</span>`;
  return `<div class="lv-card ${cls}">
    <div class="lv-meta">${badge}<span class="lv-round">${inf.round}</span></div>
    <div class="lv-row">${hHTML}<div class="lv-sc">${score}</div>${aHTML}</div>
    <div class="lv-stad">${(sch.dt || '').split(' · ')[0]} · ${sch.stad || ''}</div></div>`;
}

/** Devuelve null si no hay nada que mostrar. */
export function liveHTML(): string | null {
  const all = allScheduledMatches();
  if (!all.length) return null;
  const now = Date.now();
  const withCls = all.map((m) => ({ m, cls: matchClass(m) }));
  const live = withCls.filter((x) => x.cls === 'live');
  const todayKey = peruDayKey(now);
  const today = withCls.filter((x) => peruDayKey(x.m.ts) === todayKey);

  let list: typeof withCls;
  let title: string;
  let sub: string;
  if (live.length) {
    list = live.concat(today.filter((x) => x.cls !== 'live'));
    title = 'En vivo ahora';
    sub = live.length + ' en juego';
  } else if (today.length) {
    list = today;
    title = 'Hoy';
    sub = 'Hora de Perú';
  } else {
    list = withCls.filter((x) => x.m.ts > now).slice(0, 3);
    if (!list.length) return null;
    title = 'Próximos partidos';
    sub = 'Hora de Perú';
  }
  return `<div class="lv-head"><h2>${live.length ? '<span class="lv-pulse"></span>' : ''}${title}</h2><span>${sub}</span></div>
    <div class="lv-grid">${list.map((x) => liveCardHTML(x.m, x.cls)).join('')}</div>`;
}
