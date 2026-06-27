/**
 * Capa de SERVICIOS (infraestructura) — integración con la API pública de ESPN.
 * Aísla el acceso a datos externos del resto de la app.
 */
import type { CardType, CardEvent } from '../domain/types';
import { GROUPS } from '../data/groups';
import { R32_SEED, R16, QF, SF, THIRD, FINAL } from '../data/knockout';
import { ALIAS } from '../data/aliases';
import { store } from '../state/store';
import { norm } from '../core/util';
import { matchTeams } from '../core/bracket';

const WC_API =
  'https://site.api.espn.com/apis/site/v2/sports/soccer/fifa.world/scoreboard?lang=en&region=us&limit=400&dates=20260611-20260719';

interface EspnTeam {
  abbreviation?: string;
  displayName?: string;
  shortDisplayName?: string;
  name?: string;
  location?: string;
}

function codeFromEspn(team: EspnTeam | undefined): string | null {
  if (!team) return null;
  for (const c of [team.abbreviation, team.displayName, team.shortDisplayName, team.name, team.location]) {
    const k = norm(c);
    if (k && ALIAS[k]) return ALIAS[k];
  }
  return null;
}

function codeFromText(s: string): string | null {
  return ALIAS[norm(s)] || null;
}

function pairKey(a: string, b: string): string {
  return [a, b].sort().join('|');
}

interface RealResult {
  byCode: Record<string, number>;
  shoot: Record<string, number> | null;
  state: 'in' | 'post';
  winner: string | null;
  detail: string;
  /** Tarjetas del partido atribuidas por código de selección (si ESPN las entrega). */
  cards: { code: string; player: string; type: CardType }[];
}

/** Mapea el texto de ESPN a un tipo de tarjeta; null si no es tarjeta. */
function cardType(text: string): CardType | null {
  const t = (text || '').toLowerCase();
  if (!t.includes('card')) return null;
  if (t.includes('yellow red') || t.includes('second yellow')) return 'yellow2';
  if (t.includes('red')) return 'red';
  if (t.includes('yellow')) return 'yellow';
  return null;
}

export interface SyncSummary {
  updated: number;
  finished: number;
  live: number;
  withResult: number;
}

/**
 * Descarga los resultados reales y los aplica al estado.
 * @param clearFirst si true, vacía todo y deja solo lo real (tras descargar con éxito).
 */
export async function fetchAndApply(clearFirst = false): Promise<SyncSummary> {
  const res = await fetch(WC_API, { cache: 'no-store' });
  if (!res.ok) throw new Error('HTTP ' + res.status);
  const data = await res.json();
  const events: any[] = (data && data.events) || [];

  const real: Record<string, RealResult> = {};
  let withResult = 0;
  for (const ev of events) {
    const comp = ev.competitions && ev.competitions[0];
    if (!comp) continue;
    const stt: string = comp.status?.type?.state ?? '';
    const sdetail: string = comp.status?.type?.shortDetail || comp.status?.type?.detail || '';
    if (stt !== 'post' && stt !== 'in') continue;
    const cs = comp.competitors || [];
    if (cs.length !== 2) continue;
    const m: Record<string, number> = {};
    const shoot: Record<string, number> = {};
    const idToCode: Record<string, string> = {};
    let winner: string | null = null;
    let ok = true;
    let hasShoot = false;
    for (const c of cs) {
      const code = codeFromEspn(c.team);
      const sc = parseInt(c.score, 10);
      const ps = parseInt(c.shootoutScore, 10);
      if (code == null) {
        ok = false;
      } else {
        if (c.team?.id != null) idToCode[String(c.team.id)] = code;
        if (!isNaN(sc)) m[code] = sc;
        if (!isNaN(ps)) {
          shoot[code] = ps;
          hasShoot = true;
        }
        if (c.winner === true) winner = code;
      }
    }
    const codes = Object.keys(m);
    if (!ok || codes.length !== 2) continue;
    // Tarjetas (best-effort: solo si ESPN incluye comp.details)
    const cards: RealResult['cards'] = [];
    if (Array.isArray(comp.details)) {
      for (const d of comp.details) {
        const type = cardType(d?.type?.text || d?.type?.name || '');
        if (!type) continue;
        const code = d?.team?.id != null ? idToCode[String(d.team.id)] : undefined;
        if (!code) continue;
        const ath = Array.isArray(d.athletesInvolved) ? d.athletesInvolved[0] : null;
        const player = String(ath?.id || ath?.displayName || Math.random());
        cards.push({ code, player, type });
      }
    }
    real[pairKey(codes[0], codes[1])] = {
      byCode: m,
      shoot: hasShoot ? shoot : null,
      state: stt as 'in' | 'post',
      winner,
      detail: sdetail,
      cards,
    };
    withResult++;
  }

  if (clearFirst) store.clearAll();

  const collectedCards: CardEvent[] = [];
  let updated = 0;
  let finished = 0;
  let live = 0;

  // Fase de grupos: el par de equipos identifica el partido sin ambigüedad.
  for (const g of GROUPS) {
    for (const mm of g.m) {
      const [mid, , , h, a] = mm;
      const r = real[pairKey(h, a)];
      if (r && r.byCode[h] != null && r.byCode[a] != null) {
        store.applyResult(mid, r.byCode[h], r.byCode[a], r.state, r.detail);
        for (const c of r.cards) collectedCards.push({ team: c.code, player: c.player, matchId: mid, type: c.type });
        updated++;
        r.state === 'in' ? live++ : finished++;
      }
    }
  }

  // Eliminatorias: solo si ambos equipos del cruce ya están resueltos.
  const koIds = [
    ...Object.keys(R32_SEED).map(Number),
    ...R16.map((x) => x[0]),
    ...QF.map((x) => x[0]),
    ...SF.map((x) => x[0]),
    ...THIRD.map((x) => x[0]),
    ...FINAL.map((x) => x[0]),
  ];
  for (const id of koIds) {
    const [h, a] = matchTeams(id);
    const ch = codeFromText(h);
    const ca = codeFromText(a);
    if (!ch || !ca) continue;
    const r = real[pairKey(ch, ca)];
    if (r && r.byCode[ch] != null && r.byCode[ca] != null) {
      store.applyResult(String(id), r.byCode[ch], r.byCode[ca], r.state, r.detail);
      if (r.byCode[ch] === r.byCode[ca] && r.winner) {
        store.setPenWinner(String(id), r.winner === ch ? 'h' : 'a');
      }
      if (r.shoot && r.shoot[ch] != null && r.shoot[ca] != null) {
        store.applyPenScore(String(id), r.shoot[ch], r.shoot[ca]);
      }
      for (const c of r.cards) collectedCards.push({ team: c.code, player: c.player, matchId: String(id), type: c.type });
      updated++;
      r.state === 'in' ? live++ : finished++;
    }
  }

  store.cardEvents = collectedCards;
  store.state.champ = '';
  store.save();
  store.emit();

  return { updated, finished, live, withResult };
}
