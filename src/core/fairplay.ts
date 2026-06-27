/**
 * Capa CORE — Fair play (team conduct score) y ranking FIFA.
 * Reglas oficiales FIFA, una sola deducción por jugador y por partido:
 *   amarilla -1 · doble amarilla (roja) -3 · roja directa -4 · amarilla + roja directa -5
 */
import type { CardEvent, CardType } from '../domain/types';
import { fairPlayManual, fifaRanking } from '../data/fairplay';
import { store } from '../state/store';

/** Deducción de un jugador en UN partido según las tarjetas que recibió. */
function deductionForPlayerMatch(types: CardType[]): number {
  const hasRed = types.includes('red');
  const hasY2 = types.includes('yellow2');
  const yellows = types.filter((t) => t === 'yellow').length;
  if (hasRed && yellows > 0) return -5; // amarilla + roja directa
  if (hasRed) return -4; // roja directa
  if (hasY2) return -3; // doble amarilla → roja
  if (yellows > 0) return -1; // amarilla
  return 0;
}

/** Calcula el fair play por selección a partir de tarjetas (equipo → partido → jugador). */
export function computeFairPlayFromCards(events: CardEvent[]): Record<string, number> {
  const byTeam: Record<string, Record<string, Record<string, CardType[]>>> = {};
  for (const e of events) {
    const t = (byTeam[e.team] ||= {});
    const m = (t[e.matchId] ||= {});
    (m[e.player] ||= []).push(e.type);
  }
  const score: Record<string, number> = {};
  for (const team of Object.keys(byTeam)) {
    let s = 0;
    for (const mid of Object.keys(byTeam[team]))
      for (const p of Object.keys(byTeam[team][mid])) s += deductionForPlayerMatch(byTeam[team][mid][p]);
    score[team] = s;
  }
  return score;
}

// Cache: recalcula solo si cambió el arreglo de tarjetas.
let _cacheEv: CardEvent[] | null = null;
let _cacheMap: Record<string, number> = {};

/**
 * Puntaje de fair play de una selección (≤ 0; mayor = mejor conducta).
 * Prioriza tarjetas reales (ESPN/FIFA Match Centre); si no hay, usa el manual.
 */
export function fairPlayScore(code: string): number {
  const ev = store.cardEvents;
  if (ev.length) {
    if (_cacheEv !== ev) {
      _cacheEv = ev;
      _cacheMap = computeFairPlayFromCards(ev);
    }
    if (code in _cacheMap) return _cacheMap[code];
  }
  return fairPlayManual[code] ?? 0;
}

/** Posición en el ranking FIFA (menor = mejor). Sin dato → al fondo. */
export function fifaRank(code: string): number {
  return fifaRanking[code] ?? 999;
}
