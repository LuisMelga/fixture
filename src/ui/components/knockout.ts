/** UI — cuadro de eliminatorias (markup original: secciones por ronda). */
import {
  R32_SEED, R32_DATE, R16, R16_DATE, QF, QF_DATE, SF, SF_DATE, THIRD, THIRD_DATE, FINAL, FINAL_DATE,
} from '../../data/knockout';
import { SCHEDULE } from '../../data/schedule';
import { store } from '../../state/store';
import { num } from '../../core/util';
import { teamName } from '../../core/teamInfo';
import { matchTeams, feederTokens, seedHint, decided } from '../../core/bracket';
import { bracketHTML } from './bracketView';
import { chip } from '../dom';

function koMatchHTML(id: number, date: string): string {
  const [h, a] = matchTeams(id);
  const tk = feederTokens(id);
  const sch = SCHEDULE[id] || { dt: '', stad: '' };
  const when = sch.dt || date || '';
  const sc = store.scoreOf(String(id));
  const hv = sc.h ?? '';
  const av = sc.a ?? '';
  const d = decided(id);
  const hwin = d === 'h' ? 'winner' : '';
  const awin = d === 'a' ? 'winner' : '';
  const tie = num(hv) !== null && num(av) !== null && num(hv) === num(av);
  const pen = store.penOf(String(id)) || '';
  const ps = store.penScoreOf(String(id));
  const cell = (code: string, token: string): string =>
    code
      ? `<span class="derived clickable" data-team="${code}" title="Ver recorrido de ${teamName(code)}">${chip(code)} ${teamName(code)}</span>`
      : `<span class="derived empty">${seedHint(token)}</span>`;
  return `<div class="ko">
    <div class="ko-head"><span class="ko-num">Partido ${id}</span><span class="ko-date">${when}</span></div>
    <div class="ko-row ${hwin}">
      <div class="ko-team">${cell(h, tk[0])}</div>
      <div class="ko-sc"><input type="text" inputmode="numeric" pattern="[0-9]*" maxlength="2" data-ko="${id}" data-side="h" value="${hv}"></div>
    </div>
    <div class="ko-row ${awin}">
      <div class="ko-team">${cell(a, tk[1])}</div>
      <div class="ko-sc"><input type="text" inputmode="numeric" pattern="[0-9]*" maxlength="2" data-ko="${id}" data-side="a" value="${av}"></div>
    </div>
    ${sch.stad ? `<div class="ko-stad">📍 ${sch.stad}</div>` : ''}
    <div class="pens ${tie ? 'show' : ''}">
      <span class="lbl"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>Empate · gana por penales:</span>
      <label><input type="radio" name="pen-${id}" value="h" data-pen="${id}" ${pen === 'h' ? 'checked' : ''}><span>${h ? teamName(h) : 'Local'}</span></label>
      <label><input type="radio" name="pen-${id}" value="a" data-pen="${id}" ${pen === 'a' ? 'checked' : ''}><span>${a ? teamName(a) : 'Visitante'}</span></label>
      <div class="pen-sc">
        <span class="pen-sc-lbl">Penales</span>
        <input type="text" inputmode="numeric" pattern="[0-9]*" maxlength="2" data-penh="${id}" value="${ps.h ?? ''}" aria-label="Penales local">
        <span class="pen-sc-x">–</span>
        <input type="text" inputmode="numeric" pattern="[0-9]*" maxlength="2" data-pena="${id}" value="${ps.a ?? ''}" aria-label="Penales visitante">
      </div>
    </div>
  </div>`;
}

export interface KoRound {
  id: string;
  title: string;
  body: string;
}

function roundBody(roundClass: string, html: string, startLevel?: number): string {
  const bracket =
    startLevel !== undefined
      ? `<div class="round-bracket">${bracketHTML(false, startLevel)}<div class="rb-hint">Toca el cuadro para verlo en grande</div></div>`
      : '';
  return `${bracket}<div class="round ${roundClass}"><div class="round-grid">${html}</div></div>`;
}

export function knockoutRounds(): KoRound[] {
  const r32 = Object.keys(R32_SEED).map((id) => koMatchHTML(+id, R32_DATE[+id])).join('');
  const r16 = R16.map((x) => koMatchHTML(x[0], R16_DATE[x[0]])).join('');
  const qf = QF.map((x) => koMatchHTML(x[0], QF_DATE[x[0]])).join('');
  const sf = SF.map((x) => koMatchHTML(x[0], SF_DATE[x[0]])).join('');
  const th = THIRD.map((x) => koMatchHTML(x[0], THIRD_DATE[x[0]])).join('');
  const fin = FINAL.map((x) => koMatchHTML(x[0], FINAL_DATE[x[0]])).join('');
  return [
    { id: 'r32', title: 'Dieciseisavos de final', body: roundBody('r32', r32, 0) },
    { id: 'r16', title: 'Octavos de final', body: roundBody('r16', r16, 1) },
    { id: 'qf', title: 'Cuartos de final', body: roundBody('qf', qf, 2) },
    { id: 'sf', title: 'Semifinales', body: roundBody('sf', sf, 3) },
    { id: 'third', title: 'Tercer y cuarto puesto', body: roundBody('third', th) },
    { id: 'final', title: 'Final', body: roundBody('final', fin) },
  ];
}
