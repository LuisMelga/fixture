/** Capa CORE — resolución del cuadro de eliminatorias. */
import type { GroupId, Side } from '../domain/types';
import {
  R32_SEED,
  R16,
  QF,
  SF,
  THIRD,
  FINAL,
  type KoTuple,
} from '../data/knockout';
import { store } from '../state/store';
import { num } from './util';
import { standingsArray, groupById, groupStarted } from './standings';
import { thirdAssignments } from './thirds';

const KO_DEFS: KoTuple[] = [...R16, ...QF, ...SF, ...THIRD, ...FINAL];

export interface KoRound {
  ids: number[];
  label: string;
}
export const KO_ROUNDS: KoRound[] = [
  { ids: Object.keys(R32_SEED).map(Number), label: '16avos de final' },
  { ids: R16.map((x) => x[0]), label: 'Octavos de final' },
  { ids: QF.map((x) => x[0]), label: 'Cuartos de final' },
  { ids: SF.map((x) => x[0]), label: 'Semifinal' },
  { ids: THIRD.map((x) => x[0]), label: 'Tercer puesto' },
  { ids: FINAL.map((x) => x[0]), label: 'Final' },
];

function resolvePos(pos: number, gId: GroupId): string {
  const g = groupById(gId);
  if (!g || !groupStarted(g)) return '';
  const a = standingsArray(g)[pos - 1];
  return a ? a.t : '';
}

function resolveThird(matchId: number): string {
  const map = thirdAssignments();
  if (!map) return '';
  const gl = map[matchId];
  if (!gl) return '';
  const g = groupById(gl as GroupId);
  if (!g || !groupStarted(g)) return '';
  const a = standingsArray(g)[2];
  return a ? a.t : '';
}

function resolveSeed(token: string, matchId: number): string {
  if (token === '3°') return resolveThird(matchId);
  return resolvePos(+token[0], token[1] as GroupId);
}

function resolveTeam(feeder: string): string {
  if (feeder == null) return '';
  if (feeder[0] === 'W') return winnerOf(+feeder.slice(1));
  if (feeder[0] === 'L') return loserOf(+feeder.slice(1));
  return '';
}

/** Códigos de los dos equipos de un partido ('' si aún no se define). */
export function matchTeams(id: number): [string, string] {
  if (R32_SEED[id]) {
    return [resolveSeed(R32_SEED[id][0], id), resolveSeed(R32_SEED[id][1], id)];
  }
  const def = KO_DEFS.find((x) => x[0] === id)!;
  return [resolveTeam(def[1]), resolveTeam(def[2])];
}

export function decided(id: number): Side | null {
  const sc = store.scoreOf(String(id));
  const hn = num(sc.h);
  const an = num(sc.a);
  if (hn === null || an === null) return null;
  if (hn > an) return 'h';
  if (an > hn) return 'a';
  return store.penOf(String(id)) || null;
}

export function winnerOf(id: number): string {
  const d = decided(id);
  if (!d) return '';
  const [h, a] = matchTeams(id);
  return d === 'h' ? h : a;
}

export function loserOf(id: number): string {
  const d = decided(id);
  if (!d) return '';
  const [h, a] = matchTeams(id);
  return d === 'h' ? a : h;
}

/** Etiqueta cuando el equipo aún no está definido. */
export function seedHint(token: string): string {
  if (token === '3°') return '3.º (mejor tercero)';
  if (token[0] === 'W') return 'Ganador P' + token.slice(1);
  if (token[0] === 'L') return 'Perdedor P' + token.slice(1);
  return token[0] + '.º grupo ' + token[1];
}

export function feederTokens(id: number): [string, string] {
  if (R32_SEED[id]) return R32_SEED[id];
  const def = KO_DEFS.find((x) => x[0] === id)!;
  return [def[1], def[2]];
}
