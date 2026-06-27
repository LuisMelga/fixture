/** UI — Cuadro visual (bracket) con líneas conectoras, copa realista y modo banderas en móvil. */
import { R32_SEED, R16, QF, SF, FINAL, THIRD } from '../../data/knockout';
import { SCHEDULE } from '../../data/schedule';
import { store } from '../../state/store';
import { num } from '../../core/util';
import { teamName } from '../../core/teamInfo';
import { matchTeams, feederTokens, decided, winnerOf } from '../../core/bracket';
import { chip } from '../dom';

const ROUND_SHORT: Record<number, string> = {};
Object.keys(R32_SEED).forEach((id) => (ROUND_SHORT[+id] = '16avos'));
R16.forEach((x) => (ROUND_SHORT[x[0]] = 'Octavos'));
QF.forEach((x) => (ROUND_SHORT[x[0]] = 'Cuartos'));
SF.forEach((x) => (ROUND_SHORT[x[0]] = 'Semifinal'));
FINAL.forEach((x) => (ROUND_SHORT[x[0]] = 'Final'));
THIRD.forEach((x) => (ROUND_SHORT[x[0]] = '3.º puesto'));

function childMatchIds(id: number): number[] {
  return feederTokens(id)
    .filter((t) => t[0] === 'W')
    .map((t) => +t.slice(1));
}

function compactSeed(tok: string): string {
  if (!tok) return '';
  if (tok[0] === 'W') return 'G.' + tok.slice(1);
  if (tok[0] === 'L') return 'P.' + tok.slice(1);
  if (tok === '3°' || tok.startsWith('3')) return '3.º';
  return tok;
}

function slot(id: number, side: 'h' | 'a'): string {
  const [h, a] = matchTeams(id);
  const tk = feederTokens(id);
  const code = side === 'h' ? h : a;
  const tok = side === 'h' ? tk[0] : tk[1];
  const sc = store.scoreOf(String(id));
  const ps = store.penScoreOf(String(id));
  const val = side === 'h' ? sc.h : sc.a;
  const hn = num(sc.h);
  const an = num(sc.a);
  const tie = hn !== null && an !== null && hn === an;
  const penVal = side === 'h' ? ps.h : ps.a;
  const penSup = tie && penVal != null ? `<sup class="bk-pen">${penVal}</sup>` : '';
  const win = decided(id) === side ? 'win' : '';
  const inner = code
    ? `${chip(code)}<span class="bk-name clickable" data-team="${code}" title="Ver recorrido de ${teamName(code)}">${teamName(code)}</span>`
    : `<span class="bk-chip-empty">·</span><span class="bk-seed">${compactSeed(tok)}</span>`;
  return `<div class="bk-slot ${win}">${inner}<span class="bk-sc">${val ?? ''}${penSup}</span></div>`;
}

function matchCell(id: number): string {
  const sch = SCHEDULE[id] || { dt: '', stad: '' };
  const sc = store.scoreOf(String(id));
  const played = num(sc.h) !== null && num(sc.a) !== null;
  const rnd = ROUND_SHORT[id] || '';
  return `<div class="bk-match ${played ? 'played' : ''}">
    ${rnd ? `<div class="bk-rnd">${rnd}</div>` : ''}
    <div class="bk-mt"><span class="bk-pnum">P${id}</span><span>${sch.dt || ''}</span></div>
    ${slot(id, 'h')}
    ${slot(id, 'a')}
  </div>`;
}

/** Nivel de ronda: 0=16avos, 1=octavos, 2=cuartos, 3=semis, 4=final. */
function level(id: number): number {
  if (R32_SEED[id]) return 0;
  if (R16.some((x) => x[0] === id)) return 1;
  if (QF.some((x) => x[0] === id)) return 2;
  if (SF.some((x) => x[0] === id)) return 3;
  return 4;
}

/** Nodo recursivo. Se detiene (hoja) cuando el partido está en la fase inicial elegida. */
function node(id: number, side: 'left' | 'right', startLevel: number): string {
  const kids = level(id) > startLevel ? childMatchIds(id) : [];
  const leaf = kids.length === 0;
  const children = leaf ? '' : `<div class="bk-children">${kids.map((k) => node(k, side, startLevel)).join('')}</div>`;
  const self = `<div class="bk-self">${matchCell(id)}</div>`;
  const cls = `bk-node${leaf ? ' bk-leaf' : ''}`;
  return side === 'left' ? `<div class="${cls}">${children}${self}</div>` : `<div class="${cls}">${self}${children}</div>`;
}

export const PHASES: { level: number; label: string }[] = [
  { level: 0, label: 'Desde 16avos' },
  { level: 1, label: 'Desde octavos' },
  { level: 2, label: 'Desde cuartos' },
  { level: 3, label: 'Desde semis' },
];

export function bracketHTML(full = false, startLevel = 0): string {
  const finalT = FINAL[0];
  const sfLeft = +finalT[1].slice(1);
  const sfRight = +finalT[2].slice(1);
  const finalId = finalT[0];
  const thirdId = THIRD[0][0];
  const champ = winnerOf(finalId);

  const center = `<div class="bk-center">
    <div class="bk-trophy">
      <img class="bk-trophy-img" src="${import.meta.env.BASE_URL}trofeo.png" alt="Copa del Mundo" onerror="this.closest('.bk-trophy').classList.add('missing')" />
    </div>
    <div class="bk-final">
      <div class="bk-final-h">Final</div>
      ${matchCell(finalId)}
      <div class="bk-champ ${champ ? 'on' : ''}">${champ ? chip(champ) + '<span>' + teamName(champ) + '</span>' : '<span>Campeón por definir</span>'}</div>
    </div>
    <div class="bk-third">
      <div class="bk-third-h">Tercer puesto</div>
      ${matchCell(thirdId)}
    </div>
  </div>`;

  const board = `<div class="bk-board">
    <div class="bk-side left">${node(sfLeft, 'left', startLevel)}</div>
    ${center}
    <div class="bk-side right">${node(sfRight, 'right', startLevel)}</div>
  </div>`;

  return full
    ? `<div class="bracket bk-full">${board}</div>`
    : `<div class="bracket bk-mini" data-lvl="${startLevel}"><div class="bk-fit">${board}</div></div>`;
}
