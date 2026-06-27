/** Capa CORE — mejores terceros y asignación del Anexo C (FIFA oficial). */
import type { GroupId, ThirdRow } from '../domain/types';
import { GROUPS } from '../data/groups';
import { ANNEX_ORDER, THIRD_SLOT_MATCH, THIRD_MAP } from '../data/annexC';
import { standingsArray, groupStarted } from './standings';
import { fairPlayScore, fifaRank } from './fairplay';

/**
 * Ranking de los 12 terceros (mejor primero) — Art. 13:
 * 1) puntos · 2) diferencia de gol · 3) goles a favor.
 * (Fair play y ranking FIFA no son calculables: letra de grupo como desempate determinista.)
 */
export function thirdsRanking(): ThirdRow[] {
  const list: ThirdRow[] = GROUPS.map((g) => {
    const a = standingsArray(g)[2];
    return {
      group: g.id as GroupId,
      t: a.t,
      pj: a.pj,
      pts: a.pts,
      dg: a.dg,
      gf: a.gf,
      gc: a.gc,
      started: groupStarted(g),
    };
  });
  list.sort(
    (x, y) =>
      y.pts - x.pts ||
      y.dg - x.dg ||
      y.gf - x.gf ||
      fairPlayScore(y.t) - fairPlayScore(x.t) || // 4) fair play
      fifaRank(x.t) - fifaRank(y.t) || // 5) ranking FIFA
      x.group.localeCompare(y.group),
  );
  return list;
}

/** Alias explícito del requerimiento: ranking de mejores terceros (Art. 13: pts → DG → GF → fair play → ranking FIFA). */
export function rankBestThirdsFifa(): ThirdRow[] {
  return thirdsRanking();
}

/**
 * Asigna los 8 mejores terceros a cada llave de 16avos según el Anexo C.
 * Devuelve { idPartido: letraGrupo } o null si aún no hay combinación válida.
 */
export function thirdAssignments(): Record<number, string> | null {
  const key = thirdsRanking()
    .slice(0, 8)
    .map((x) => x.group)
    .sort()
    .join('');
  const letters = THIRD_MAP[key];
  if (!letters) return null;
  const map: Record<number, string> = {};
  ANNEX_ORDER.forEach((slot, i) => {
    map[THIRD_SLOT_MATCH[slot]] = letters[i];
  });
  return map;
}
