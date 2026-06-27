/**
 * Capa de ESTADO — única fuente de verdad de la app.
 * Patrón Store observable (pub/sub) + persistencia en localStorage con debounce.
 * El resto de capas leen el estado desde aquí y se suscriben a los cambios.
 */
import type { AppState, EspnState, Score, Side, CardEvent } from '../domain/types';

const KEY = 'fixtureMundial2026';

function blank(): AppState {
  return { scores: {}, pens: {}, penScore: {}, r32: {}, champ: '', auto: true, bracketHome: false, v: 2 };
}

function loadState(): AppState {
  try {
    const raw = localStorage.getItem(KEY);
    const s = raw ? (JSON.parse(raw) as Partial<AppState>) : null;
    if (s && s.scores) {
      const st = Object.assign(blank(), s);
      if (!s.v) {
        st.auto = true;
        st.v = 2;
      }
      return st;
    }
  } catch {
    /* almacenamiento corrupto o bloqueado */
  }
  return blank();
}

type Listener = () => void;

class Store {
  state: AppState = loadState();
  /** Estado en vivo (no persistente) capturado de la web. */
  readonly espn: Record<string, EspnState> = {};
  /** Tarjetas capturadas de la web (para fair play). Vacío => se usa el manual. */
  cardEvents: CardEvent[] = [];

  private listeners = new Set<Listener>();
  private saveTimer: number | undefined;
  /** Mensaje efímero (toast) hacia la UI. */
  onToast: (msg: string) => void = () => {};

  subscribe(fn: Listener): () => void {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }

  /** Notifica a los suscriptores que el estado cambió (re-render). */
  emit(): void {
    this.listeners.forEach((fn) => fn());
  }

  toast(msg: string): void {
    this.onToast(msg);
  }

  /** Persiste con debounce para no escribir en cada tecla. */
  save(): void {
    clearTimeout(this.saveTimer);
    this.saveTimer = window.setTimeout(() => {
      try {
        localStorage.setItem(KEY, JSON.stringify(this.state));
        const t = new Date().toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' });
        this.toast('Guardado ' + t);
      } catch {
        this.toast('No se pudo guardar (almacenamiento lleno)');
      }
    }, 250);
  }

  // ---- Mutaciones de marcadores ----
  setGoals(id: string, side: Side, value: number | undefined): void {
    const cur = this.state.scores[id] || (this.state.scores[id] = {});
    cur[side] = value;
    this.state.champ = '';
    this.save();
    this.emit();
  }

  setPenWinner(id: string, side: Side): void {
    this.state.pens[id] = side;
    this.state.champ = '';
    this.save();
    this.emit();
  }

  setPenScore(id: string, side: Side, value: number | undefined): void {
    const cur = this.state.penScore[id] || (this.state.penScore[id] = {});
    cur[side] = value;
    // Deriva el ganador si la tanda ya distingue
    const ps = this.state.penScore[id];
    if (ps.h != null && ps.a != null && ps.h !== ps.a) {
      this.state.pens[id] = ps.h > ps.a ? 'h' : 'a';
    }
    this.state.champ = '';
    this.save();
    this.emit();
  }

  setChampOverride(name: string): void {
    this.state.champ = name;
    this.save();
    this.emit();
  }

  setAuto(on: boolean): void {
    this.state.auto = on;
    this.save();
  }

  setBracketHome(on: boolean): void {
    this.state.bracketHome = on;
    this.save();
  }

  /** Vacía predicciones y marcadores (para "Reiniciar" o "Actualizar" desde cero). */
  clearAll(): void {
    this.state.scores = {};
    this.state.pens = {};
    this.state.penScore = {};
    this.state.r32 = {};
    this.state.champ = '';
    for (const k of Object.keys(this.espn)) delete this.espn[k];
    this.cardEvents = [];
  }

  resetToBlank(): void {
    this.state = blank();
    try {
      localStorage.removeItem(KEY);
    } catch {
      /* noop */
    }
    this.emit();
  }

  /** Aplica un marcador real de la web. */
  applyResult(id: string, h: number, a: number, st: EspnState['st'], detail: string): void {
    this.state.scores[id] = { h, a };
    this.espn[id] = { st, detail: detail || '' };
  }

  applyPenScore(id: string, h: number, a: number): void {
    this.state.penScore[id] = { h, a };
    if (!this.state.pens[id]) this.state.pens[id] = h > a ? 'h' : 'a';
  }

  // ---- Accesores de solo lectura para la capa CORE ----
  scoreOf(id: string): Score {
    return this.state.scores[id] || {};
  }
  penOf(id: string): Side | undefined {
    return this.state.pens[id];
  }
  penScoreOf(id: string): Score {
    return this.state.penScore[id] || {};
  }
}

export const store = new Store();
