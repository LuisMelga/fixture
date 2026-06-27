/** UI — recorrido de una selección por todo el torneo. */
import { GROUPS } from '../../data/groups';
import { SCHEDULE } from '../../data/schedule';
import { store } from '../../state/store';
import { num } from '../../core/util';
import { teamName } from '../../core/teamInfo';
import { standingsArray, groupDone } from '../../core/standings';
import { matchTeams, feederTokens, decided, seedHint, KO_ROUNDS } from '../../core/bracket';
import { chip } from '../dom';

function bdg(t: string, c: string): string {
  return `<span class="rt-bdg ${c}">${t}</span>`;
}

function rtTeam(c: string, isMe: boolean): string {
  return `<div class="rt-team ${isMe ? 'me' : 'opp'} clickable" data-team="${c}" title="Ver recorrido de ${teamName(c)}">${chip(c)}<span>${teamName(c)}</span></div>`;
}

function rtSeed(tok: string): string {
  return `<div class="rt-team opp"><span class="rt-seed">${seedHint(tok)}</span></div>`;
}

function rtCard(cls: string, when: string, badge: string, meCode: string, oppCode: string, oppTok: string | null, score: string): string {
  const oppHTML = oppCode ? rtTeam(oppCode, false) : rtSeed(oppTok || '');
  return `<div class="rt-card ${cls}">
    <div class="rt-card-top"><span class="rt-when">${when}</span>${badge}</div>
    <div class="rt-vs">${rtTeam(meCode, true)}<div class="rt-score">${score}</div>${oppHTML}</div></div>`;
}

function routeGroupTableHTML(g: (typeof GROUPS)[number], code: string): string {
  const arr = standingsArray(g);
  const rows = arr
    .map((r, i) => {
      const cls = i < 2 ? 'q1' : i === 2 ? 'q3' : '';
      const me = r.t === code ? ' rt-me-row' : '';
      return `<tr class="${cls}${me}">
      <td class="team clickable" data-team="${r.t}" title="Ver recorrido de ${teamName(r.t)}"><span class="pos">${i + 1}</span>${chip(r.t)} <span class="tname">${teamName(r.t)}</span></td>
      <td>${r.pj}</td><td class="hide-sm">${r.g}</td><td class="hide-sm">${r.e}</td><td class="hide-sm">${r.p}</td>
      <td class="hide-sm">${r.gf}</td><td class="hide-sm">${r.gc}</td><td>${r.dg > 0 ? '+' + r.dg : r.dg}</td><td class="pts">${r.pts}</td>
    </tr>`;
    })
    .join('');
  return `<table class="stand"><thead><tr>
      <th class="team">Equipo</th><th>PJ</th><th class="hide-sm">G</th><th class="hide-sm">E</th><th class="hide-sm">P</th><th class="hide-sm">GF</th><th class="hide-sm">GC</th><th>DG</th><th>Pts</th>
    </tr></thead><tbody>${rows}</tbody></table>`;
}

export function teamTrackHTML(code: string): string {
  const g = GROUPS.find((x) => x.teams.includes(code))!;
  const arr = standingsArray(g);
  const pos = arr.findIndex((r) => r.t === code) + 1;
  const me = arr[pos - 1];
  const posTxt = ['', '1.º', '2.º', '3.º', '4.º'][pos];
  const posBadge =
    pos <= 2 ? bdg('Clasifica', 'b-q') : pos === 3 ? bdg('3.º · repechaje', 'b-draw') : bdg('Eliminado', 'b-loss');

  let gm = '';
  g.m
    .filter((m) => m[3] === code || m[4] === code)
    .forEach((m) => {
      const [mid, , , h, a] = m;
      const sch = SCHEDULE[mid] || { dt: '', stad: '' };
      const opp = h === code ? a : h;
      const sc = store.scoreOf(mid);
      const hn = num(sc.h);
      const an = num(sc.a);
      let cls = 'soon';
      let badge = bdg('Por jugar', 'b-soon');
      let score = `<span class="vs">vs</span>`;
      if (hn !== null && an !== null) {
        const my = h === code ? hn : an;
        const ot = h === code ? an : hn;
        score = `${my}<i>-</i>${ot}`;
        if (my > ot) {
          cls = 'win';
          badge = bdg('Ganó', 'b-win');
        } else if (my < ot) {
          cls = 'loss';
          badge = bdg('Perdió', 'b-loss');
        } else {
          cls = 'draw';
          badge = bdg('Empate', 'b-draw');
        }
      }
      gm += rtCard(cls, sch.dt || m[1] || '—', badge, code, opp, null, score);
    });

  let ko = '';
  let champ = false;
  for (const r of KO_ROUNDS) {
    for (const id of r.ids) {
      const [h, a] = matchTeams(id);
      if (h !== code && a !== code) continue;
      const mySide = h === code ? 'h' : 'a';
      const tk = feederTokens(id);
      const oppTok = mySide === 'h' ? tk[1] : tk[0];
      const opp = mySide === 'h' ? a : h;
      const sch = SCHEDULE[id] || { dt: '', stad: '' };
      const sc = store.scoreOf(String(id));
      const hn = num(sc.h);
      const an = num(sc.a);
      let cls = 'soon';
      let badge = bdg('Por jugar', 'b-soon');
      let score = `<span class="vs">vs</span>`;
      const when = r.label + (sch.dt ? ' · ' + sch.dt : '');
      if (hn !== null && an !== null) {
        const my = mySide === 'h' ? hn : an;
        const ot = mySide === 'h' ? an : hn;
        const d = decided(id);
        const ps = store.penScoreOf(String(id));
        const psMy = mySide === 'h' ? ps.h : ps.a;
        const psOt = mySide === 'h' ? ps.a : ps.h;
        const penTxt =
          hn === an
            ? psMy != null && psOt != null
              ? ` <small>(pen ${psMy}-${psOt})</small>`
              : ' <small>(pen)</small>'
            : '';
        score = `${my}<i>-</i>${ot}` + penTxt;
        if (d === mySide) {
          cls = 'win';
          badge = bdg('Ganó', 'b-win');
          if (id === 104) champ = true;
        } else if (d) {
          cls = 'loss';
          badge = bdg('Perdió', 'b-loss');
        } else {
          cls = 'draw';
          badge = bdg('Definir penales', 'b-draw');
        }
      }
      ko += rtCard(cls, when, badge, code, opp, oppTok, score);
    }
  }

  let koNote = '';
  if (!ko)
    koNote = groupDone(g)
      ? `<div class="rt-note">No clasificó a la fase final (terminó ${posTxt} en el Grupo ${g.id}).</div>`
      : `<div class="rt-note">Su clasificación a eliminatorias se define cuando termine el Grupo ${g.id}.</div>`;
  const champHTML = champ
    ? `<div class="rt-champ"><div class="l">Campeón del Mundo</div><div class="n">${chip(code)} ${teamName(code)}</div></div>`
    : '';

  return `<div class="rt-head">${chip(code)}
      <div class="rt-id"><div class="rt-name">${teamName(code)}</div><div class="rt-meta">Grupo ${g.id} · ${posTxt} lugar · ${me.pts} pts · ${me.dg > 0 ? '+' : ''}${me.dg} DG</div></div>${posBadge}</div>
    <details class="rt-group" open>
      <summary>Posiciones del Grupo ${g.id}</summary>
      <div class="rt-group-table">${routeGroupTableHTML(g, code)}</div>
    </details>
    <div class="rt-sec">Fase de grupos</div>${gm}
    <div class="rt-sec">Recorrido en eliminatorias</div>${ko || koNote}${champHTML}`;
}
