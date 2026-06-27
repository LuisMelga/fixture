/** UI — tabla de mejores terceros (Anexo C), markup original. */
import { teamName } from '../../core/teamInfo';
import { thirdsRanking, thirdAssignments } from '../../core/thirds';
import { allGroupsDone, groupStarted } from '../../core/standings';
import { GROUPS } from '../../data/groups';
import { chip } from '../dom';

export function thirdsHTML(): string {
  const ranking = thirdsRanking();
  const assign = thirdAssignments();
  const slotByGroup: Record<string, number> = {};
  if (assign) for (const mid of Object.keys(assign)) slotByGroup[assign[+mid]] = +mid;
  const allDone = allGroupsDone();
  const anyStarted = GROUPS.some(groupStarted);

  const rows = ranking
    .map((r, i) => {
      const qualifies = i < 8;
      const slotMid = slotByGroup[r.group];
      let cls = '';
      let statusHTML = '';
      let slotHTML = '—';
      if (!r.started) {
        cls = 'empty';
        statusHTML = `<span class="th-status p">Por definir</span>`;
      } else if (qualifies) {
        cls = 'qual';
        statusHTML = `<span class="th-status q">Clasifica</span>`;
        slotHTML = slotMid ? `<span class="th-slot">→ P${slotMid}</span>` : '—';
      } else {
        cls = 'out';
        statusHTML = `<span class="th-status o">Eliminado</span>`;
      }
      const teamCell = r.started
        ? `${chip(r.t)} <span>${teamName(r.t)}</span><span class="th-grp">Gr. ${r.group}</span>`
        : `<span class="th-status p">3.º Grupo ${r.group}</span>`;
      const v = (x: number, suf = ''): string =>
        r.started ? (x > 0 && suf === '+' ? '+' + x : String(x)) : '–';
      return `<tr class="${cls}">
      <td class="l"><span class="th-pos">${i + 1}</span></td>
      <td class="hide-sm"><b>${r.group}</b></td>
      <td class="l team${r.started ? ' clickable' : ''}"${r.started ? ` data-team="${r.t}" title="Ver recorrido de ${teamName(r.t)}"` : ''}>${teamCell}</td>
      <td class="hide-sm">${v(r.pj)}</td>
      <td class="pts">${v(r.pts)}</td>
      <td>${v(r.dg, '+')}</td>
      <td class="hide-sm">${v(r.gf)}</td>
      <td class="hide-xs">${slotHTML}</td>
      <td>${statusHTML}</td>
    </tr>`;
    })
    .join('');

  const sub = allDone
    ? 'Clasificación final'
    : anyStarted
      ? 'Provisional · según resultados actuales'
      : 'Aún sin partidos jugados';

  return `<div class="thirds-card">
    <div class="th-head"><h3>Tabla de mejores terceros</h3><span class="th-sub">${sub}</span></div>
    <div class="thirds-legend">
      <span><i style="background:var(--celeste-deep)"></i>Los 8 mejores terceros pasan a 16avos</span>
      <span><i style="background:var(--lose)"></i>Los 4 peores quedan eliminados</span>
    </div>
    <div class="thirds-scroll">
    <table class="thirds"><thead><tr>
      <th class="l">#</th><th class="hide-sm">Gr.</th><th class="l">Equipo</th>
      <th class="hide-sm" title="Partidos jugados">PJ</th><th title="Puntos">Pts</th><th title="Diferencia de goles">DG</th><th class="hide-sm" title="Goles a favor">GF</th>
      <th class="hide-xs" title="Llave de 16avos asignada">16avo</th><th>Estado</th>
    </tr></thead><tbody>${rows}</tbody></table>
    </div>
  </div>`;
}
