/** UI — fase de grupos: tarjetas de partidos + tabla de posiciones (markup original). */
import { GROUPS, type GroupData } from '../../data/groups';
import { SCHEDULE } from '../../data/schedule';
import { store } from '../../state/store';
import { num } from '../../core/util';
import { teamName } from '../../core/teamInfo';
import { standingsArray, explainTiebreak } from '../../core/standings';
import { chip } from '../dom';

function matchRow(m: GroupData['m'][number]): string {
  const [mid, , , h, a] = m;
  const sch = SCHEDULE[mid] || { dt: '', stad: '' };
  const meta = sch.dt || m[1];
  const stad = sch.stad || m[2];
  const sc = store.scoreOf(mid);
  const hv = sc.h ?? '';
  const av = sc.a ?? '';
  const hn = num(hv);
  const an = num(av);
  let hwin = '';
  let awin = '';
  if (hn !== null && an !== null) {
    if (hn > an) hwin = 'win';
    else if (an > hn) awin = 'win';
  }
  const [day, ...rest] = (meta || '').split(' · ');
  return `<div class="match">
        <div class="meta"><span class="day">${day}</span><span>${rest.join(' · ')}</span><span>·&nbsp;${stad}</span></div>
        <div class="side ${hwin} clickable" data-team="${h}" title="Ver recorrido de ${teamName(h)}">${chip(h)}<span class="tname">${teamName(h)}</span></div>
        <div class="score">
          <input type="text" inputmode="numeric" pattern="[0-9]*" maxlength="2" data-mid="${mid}" data-side="h" value="${hv}" aria-label="${teamName(h)} goles">
          <span class="vs">–</span>
          <input type="text" inputmode="numeric" pattern="[0-9]*" maxlength="2" data-mid="${mid}" data-side="a" value="${av}" aria-label="${teamName(a)} goles">
        </div>
        <div class="side away ${awin} clickable" data-team="${a}" title="Ver recorrido de ${teamName(a)}">${chip(a)}<span class="tname">${teamName(a)}</span></div>
      </div>`;
}

export function standingsHTML(g: GroupData): string {
  const arr = standingsArray(g);
  const body = arr
    .map((r, i) => {
      const cls = i < 2 ? 'q1' : i === 2 ? 'q3' : '';
      return `<tr class="${cls}">
      <td class="team clickable" data-team="${r.t}" title="Ver recorrido de ${teamName(r.t)}"><span class="pos">${i + 1}</span>${chip(r.t)} <span class="tname" style="display:inline">${teamName(r.t)}</span></td>
      <td>${r.pj}</td><td class="hide-sm">${r.g}</td><td class="hide-sm">${r.e}</td><td class="hide-sm">${r.p}</td>
      <td class="hide-sm">${r.gf}</td><td class="hide-sm">${r.gc}</td><td>${r.dg > 0 ? '+' + r.dg : r.dg}</td><td class="pts">${r.pts}</td>
    </tr>`;
    })
    .join('');
  const table = `<table class="stand"><thead><tr>
      <th class="team">Equipo</th><th title="Partidos jugados">PJ</th><th class="hide-sm" title="Triunfos">G</th><th class="hide-sm" title="Empates">E</th><th class="hide-sm" title="Derrotas">P</th>
      <th class="hide-sm" title="Goles a favor">GF</th><th class="hide-sm" title="Goles en contra">GC</th><th title="Diferencia de goles">DG</th><th title="Puntos">Pts</th>
    </tr></thead><tbody>${body}</tbody></table>`;

  // Nota visible solo cuando un desempate se resolvió por fair play o ranking FIFA (Art. 13, pasos finales).
  const notes: string[] = [];
  for (let i = 0; i < arr.length - 1; i++) {
    if (arr[i].pts !== arr[i + 1].pts || arr[i].pj === 0) continue;
    const ex = explainTiebreak(g, arr[i].t, arr[i + 1].t);
    if (ex.criterio === 'fair play' || ex.criterio === 'ranking FIFA') {
      notes.push(`<div class="tb-note" title="${ex.texto}">⚖️ Desempate por <b>${ex.criterio}</b>: ${teamName(arr[i].t)} sobre ${teamName(arr[i + 1].t)}.</div>`);
    }
  }
  return table + notes.join('');
}

function groupCardHTML(g: GroupData): string {
  const names = g.teams.map(teamName).join(' · ');
  return `<section class="group" data-g="${g.id}">
      <div class="ghead">
        <div class="gletter">${g.id}</div>
        <div class="gname">Grupo ${g.id}<small>${names}</small></div>
      </div>
      <div>${standingsHTML(g)}</div>
      <div class="legend"><span><i style="background:var(--q1)"></i>Clasifican 1.º y 2.º</span><span><i style="background:var(--q3)"></i>Mejores 3.º</span></div>
      <div class="matches">${g.m.map((m) => matchRow(m)).join('')}</div>
    </section>`;
}

export function groupsHTML(): string {
  return GROUPS.map(groupCardHTML).join('');
}
