/** Capa CORE — tabla de posiciones y desempates oficiales (FIFA Art. 13). */
import type { GroupId, MatchTuple, StandingRow } from '../domain/types';
import { GROUPS, type GroupData } from '../data/groups';
import { store } from '../state/store';
import { num } from './util';
import { teamName } from './teamInfo';
import { fairPlayScore, fifaRank } from './fairplay';

export function groupById(id: GroupId): GroupData | undefined {
  return GROUPS.find((x) => x.id === id);
}

export function standingsArray(g: GroupData): StandingRow[] {
  const row: Record<string, StandingRow> = {};
  g.teams.forEach((t) => {
    row[t] = { t, pj: 0, g: 0, e: 0, p: 0, gf: 0, gc: 0, dg: 0, pts: 0 };
  });
  g.m.forEach((m) => {
    const [mid, , , h, a] = m;
    const sc = store.scoreOf(mid);
    const hn = num(sc.h);
    const an = num(sc.a);
    if (hn === null || an === null) return;
    row[h].pj++;
    row[a].pj++;
    row[h].gf += hn;
    row[h].gc += an;
    row[a].gf += an;
    row[a].gc += hn;
    if (hn > an) {
      row[h].g++;
      row[a].p++;
    } else if (an > hn) {
      row[a].g++;
      row[h].p++;
    } else {
      row[h].e++;
      row[a].e++;
    }
  });
  const arr = Object.values(row).map((r) => ({ ...r, dg: r.gf - r.gc, pts: r.g * 3 + r.e }));
  return orderGroupFIFA(arr, g.m);
}

/**
 * Desempate oficial FIFA 2026 (Art. 13):
 * 1) Puntos · 2) pts entre empatados · 3) DG entre empatados · 4) GF entre empatados
 * 5) DG general · 6) GF general · 7) fair play · 8) ranking FIFA.
 * (7 y 8 no son calculables: orden alfabético estable como último recurso.)
 */
function orderGroupFIFA(arr: StandingRow[], matches: MatchTuple[]): StandingRow[] {
  const sorted = arr.slice().sort((x, y) => y.pts - x.pts);
  const out: StandingRow[] = [];
  let i = 0;
  while (i < sorted.length) {
    let j = i + 1;
    while (j < sorted.length && sorted[j].pts === sorted[i].pts) j++;
    const run = sorted.slice(i, j);
    (run.length > 1 ? breakTieH2H(run, matches) : run).forEach((t) => out.push(t));
    i = j;
  }
  return out;
}

function breakTieH2H(group: StandingRow[], matches: MatchTuple[]): StandingRow[] {
  if (group.length <= 1) return group.slice();
  const codes = new Set(group.map((t) => t.t));
  const mini: Record<string, { pts: number; dg: number; gf: number }> = {};
  group.forEach((t) => (mini[t.t] = { pts: 0, dg: 0, gf: 0 }));
  matches.forEach((m) => {
    const [mid, , , h, a] = m;
    if (!codes.has(h) || !codes.has(a)) return;
    const sc = store.scoreOf(mid);
    const hn = num(sc.h);
    const an = num(sc.a);
    if (hn === null || an === null) return;
    mini[h].gf += hn;
    mini[h].dg += hn - an;
    mini[a].gf += an;
    mini[a].dg += an - hn;
    if (hn > an) mini[h].pts += 3;
    else if (an > hn) mini[a].pts += 3;
    else {
      mini[h].pts++;
      mini[a].pts++;
    }
  });
  const sorted = group
    .slice()
    .sort(
      (x, y) =>
        mini[y.t].pts - mini[x.t].pts || mini[y.t].dg - mini[x.t].dg || mini[y.t].gf - mini[x.t].gf,
    );
  const out: StandingRow[] = [];
  let i = 0;
  while (i < sorted.length) {
    let j = i + 1;
    while (
      j < sorted.length &&
      mini[sorted[j].t].pts === mini[sorted[i].t].pts &&
      mini[sorted[j].t].dg === mini[sorted[i].t].dg &&
      mini[sorted[j].t].gf === mini[sorted[i].t].gf
    )
      j++;
    const sub = sorted.slice(i, j);
    if (sub.length === 1) out.push(sub[0]);
    else if (sub.length === group.length) breakTieOverall(sub).forEach((t) => out.push(t));
    else breakTieH2H(sub, matches).forEach((t) => out.push(t));
    i = j;
  }
  return out;
}

/**
 * Desempate general (cuando ni puntos ni enfrentamiento directo separan):
 * 3) DG general · 4) GF general · 5) fair play · 6) ranking FIFA · 7) determinista (nombre).
 */
function breakTieOverall(group: StandingRow[]): StandingRow[] {
  return group
    .slice()
    .sort(
      (x, y) =>
        y.dg - x.dg ||
        y.gf - x.gf ||
        fairPlayScore(y.t) - fairPlayScore(x.t) || // mayor (≤0) = mejor conducta
        fifaRank(x.t) - fifaRank(y.t) || // menor posición = mejor
        teamName(x.t).localeCompare(teamName(y.t)),
    );
}

export function groupDone(g: GroupData): boolean {
  return g.m.every((m) => {
    const sc = store.scoreOf(m[0]);
    return num(sc.h) !== null && num(sc.a) !== null;
  });
}

export function groupStarted(g: GroupData): boolean {
  return g.m.some((m) => {
    const sc = store.scoreOf(m[0]);
    return num(sc.h) !== null && num(sc.a) !== null;
  });
}

export function allGroupsDone(): boolean {
  return GROUPS.every(groupDone);
}

// ---------------------------------------------------------------------------
// API explícita del Article 13 (nombres del requerimiento)
// ---------------------------------------------------------------------------

/**
 * Ordena un grupo según el Article 13 del reglamento oficial FIFA WC 2026:
 *  1) puntos → 2) entre empatados: pts/DG/GF directos → 3) DG general → 4) GF general
 *  → 5) fair play (team conduct) → 6) ranking FIFA.
 * El fair play sale de tarjetas reales (si ESPN las entrega) o del manual (FIFA Match Centre);
 * el ranking, de data/fairplay.ts. Evita cualquier orden arbitrario.
 */
export function rankGroupFifa(g: GroupData): StandingRow[] {
  return standingsArray(g);
}

/** Enfrentamiento directo entre dos selecciones dentro del grupo. */
function headToHead(g: GroupData, a: string, b: string): { pts: number; dg: number; gf: number }[] {
  const acc: Record<string, { pts: number; dg: number; gf: number }> = {
    [a]: { pts: 0, dg: 0, gf: 0 },
    [b]: { pts: 0, dg: 0, gf: 0 },
  };
  g.m.forEach((m) => {
    const [mid, , , h, aw] = m;
    if (!((h === a && aw === b) || (h === b && aw === a))) return;
    const sc = store.scoreOf(mid);
    const hn = num(sc.h);
    const an = num(sc.a);
    if (hn === null || an === null) return;
    acc[h].gf += hn;
    acc[h].dg += hn - an;
    acc[aw].gf += an;
    acc[aw].dg += an - hn;
    if (hn > an) acc[h].pts += 3;
    else if (an > hn) acc[aw].pts += 3;
    else {
      acc[h].pts++;
      acc[aw].pts++;
    }
  });
  return [acc[a], acc[b]];
}

/**
 * Explica, en lenguaje claro para el frontend, por qué una selección queda por
 * encima de otra (o si están totalmente empatadas). Devuelve también el criterio aplicado.
 */
export function explainTiebreak(
  g: GroupData,
  aCode: string,
  bCode: string,
): { criterio: string; texto: string; ganador: string | null } {
  const rows = standingsArray(g);
  const ra = rows.find((r) => r.t === aCode)!;
  const rb = rows.find((r) => r.t === bCode)!;
  const A = teamName(aCode);
  const B = teamName(bCode);
  const better = (x: string): string => (x === aCode ? A : B);

  if (ra.pts !== rb.pts) {
    const w = ra.pts > rb.pts ? aCode : bCode;
    return { criterio: 'puntos', texto: `${better(w)} queda por encima por mayor cantidad de puntos.`, ganador: w };
  }
  const [ha, hb] = headToHead(g, aCode, bCode);
  if (ha.pts !== hb.pts) {
    const w = ha.pts > hb.pts ? aCode : bCode;
    return { criterio: 'duelo directo (puntos)', texto: `${A} y ${B} empatan en puntos; ${better(w)} queda por encima por el enfrentamiento directo.`, ganador: w };
  }
  if (ha.dg !== hb.dg) {
    const w = ha.dg > hb.dg ? aCode : bCode;
    return { criterio: 'duelo directo (DG)', texto: `${A} y ${B} empatan en puntos y en el duelo directo; ${better(w)} queda por encima por diferencia de gol en el enfrentamiento directo.`, ganador: w };
  }
  if (ha.gf !== hb.gf) {
    const w = ha.gf > hb.gf ? aCode : bCode;
    return { criterio: 'duelo directo (GF)', texto: `${A} y ${B} empatan en el duelo directo; ${better(w)} queda por encima por goles a favor en el enfrentamiento directo.`, ganador: w };
  }
  if (ra.dg !== rb.dg) {
    const w = ra.dg > rb.dg ? aCode : bCode;
    return { criterio: 'DG general', texto: `Empate en el duelo directo; ${better(w)} queda por encima por diferencia de goles del grupo.`, ganador: w };
  }
  if (ra.gf !== rb.gf) {
    const w = ra.gf > rb.gf ? aCode : bCode;
    return { criterio: 'GF general', texto: `Empate en diferencia de gol; ${better(w)} queda por encima por goles a favor del grupo.`, ganador: w };
  }
  const fpA = fairPlayScore(aCode);
  const fpB = fairPlayScore(bCode);
  if (fpA !== fpB) {
    const w = fpA > fpB ? aCode : bCode;
    return {
      criterio: 'fair play',
      texto: `${A} y ${B} están empatados en puntos, diferencia de goles, goles a favor y duelo directo. Como el empate continúa, se aplica el criterio FIFA de fair play. ${B} tiene fairPlayScore ${fpB} y ${A} ${fpA}; por eso ${better(w)} queda por encima. Si el fair play también estuviera empatado, se aplicaría el ranking FIFA oficial.`,
      ganador: w,
    };
  }
  const rkA = fifaRank(aCode);
  const rkB = fifaRank(bCode);
  if (rkA !== rkB) {
    const w = rkA < rkB ? aCode : bCode;
    return { criterio: 'ranking FIFA', texto: `${A} y ${B} están empatados incluso en fair play; se aplica el ranking FIFA: ${better(w)} está mejor ubicado y queda por encima.`, ganador: w };
  }
  return { criterio: 'empate total', texto: `${A} y ${B} están empatados en todos los criterios oficiales (incluido fair play y ranking FIFA).`, ganador: null };
}
