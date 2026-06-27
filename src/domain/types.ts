/**
 * Capa de DOMINIO — tipos puros del modelo. Sin dependencias de UI, datos ni estado.
 */
export type GroupId = 'A' | 'B' | 'C' | 'D' | 'E' | 'F' | 'G' | 'H' | 'I' | 'J' | 'K' | 'L';

/** Partido de grupo: [id, fecha, sede, local, visitante]. */
export type MatchTuple = [id: string, dt: string, stad: string, home: string, away: string];

export type Side = 'h' | 'a';

/** Marcador de un partido (grupo o eliminatoria). */
export interface Score {
  h?: number;
  a?: number;
}

/** Estado en vivo capturado de la web por partido. */
export interface EspnState {
  st: 'in' | 'post';
  detail: string;
}

/** Estado persistible de la app. */
export interface AppState {
  scores: Record<string, Score>;
  /** Ganador por penales en empates de eliminatoria: id -> 'h' | 'a'. */
  pens: Record<string, Side>;
  /** Marcador de la tanda de penales (separado del marcador). */
  penScore: Record<string, Score>;
  r32: Record<string, unknown>;
  champ: string;
  auto: boolean;
  bracketHome: boolean;
  v: number;
}

/** Fila de tabla de posiciones calculada. */
export interface StandingRow {
  t: string;
  pj: number;
  g: number;
  e: number;
  p: number;
  gf: number;
  gc: number;
  dg: number;
  pts: number;
}

/** Fila del ranking de terceros. */
export interface ThirdRow {
  group: GroupId;
  t: string;
  pj: number;
  pts: number;
  dg: number;
  gf: number;
  gc: number;
  started: boolean;
}

export type MatchOutcome = 'win' | 'loss' | 'draw' | 'soon';
export type LiveClass = 'live' | 'done' | 'soon';

/** Tarjeta para el cálculo de fair play (FIFA Art. 13). */
export type CardType = 'yellow' | 'yellow2' | 'red'; // yellow2 = 2.ª amarilla → roja; red = roja directa
export interface CardEvent {
  team: string;
  player: string;
  matchId: string;
  type: CardType;
}
