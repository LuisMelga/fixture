/** UI — App: shell idéntico al original + orquestación de eventos. */
import { GROUPS } from '../data/groups';
import { TEAMS } from '../data/teams';
import { store } from '../state/store';
import { clampGoalsStr, norm } from '../core/util';
import { teamName } from '../core/teamInfo';
import { winnerOf } from '../core/bracket';
import { anyMatchLiveNow } from '../core/schedule';
import { fetchAndApply } from '../services/espn';
import { $, esc } from './dom';
import { groupsHTML } from './components/groups';
import { thirdsHTML } from './components/thirds';
import { knockoutRounds } from './components/knockout';
import { liveHTML } from './components/live';
import { teamTrackHTML } from './components/route';
import { exportPNG, exportBracketPNG, printSheet, downloadJSON } from './components/export';
import { bracketHTML } from './components/bracketView';
import { INITIAL_VIEW } from '../config';
import {
  matchDetailHTML,
  filteredDays,
  dayHTML,
  type DaySection,
  type SpStatus,
  type SpDate,
} from './components/schedulePage';

const TEAM_BY_NAME: Record<string, string> = {};
Object.keys(TEAMS).forEach((c) => {
  TEAM_BY_NAME[norm(teamName(c))] = c;
  TEAM_BY_NAME[norm(c)] = c;
});
function resolveCountry(strv: string): string | null {
  const q = norm(strv);
  if (!q) return null;
  if (TEAM_BY_NAME[q]) return TEAM_BY_NAME[q];
  return Object.keys(TEAMS).find((c) => norm(teamName(c)).startsWith(q)) || null;
}

export class App {
  private root: HTMLElement;
  private filter = new Set<string>();
  private routeTeam: string | null = null;
  private updating = false;
  private autoTimer: number | undefined;
  private pendingFocus: { sel: string; caret: number | null } | null = null;
  private view: 'fixture' | 'partidos' = 'fixture';
  private spStatus: SpStatus = 'upcoming';
  private spDate: SpDate = 'all';
  private spDetailKey: string | null = null;
  private spFocus: string | null = null;
  private spDays: DaySection[] = [];
  private spShown = 0;
  private spObserver: IntersectionObserver | null = null;
  private fxShown = 3;
  private fxTotal = 9;
  private fxObserver: IntersectionObserver | null = null;
  private accCollapsed = new Set<string>();
  private accInit = false;

  constructor(root: HTMLElement) {
    this.root = root;
  }

  mount(): void {
    this.root.innerHTML = this.shell();
    store.onToast = (m) => this.flashSaved(m);
    this.buildChips();
    this.wire();
    store.subscribe(() => this.render());
    this.render();
    this.setAuto(store.state.auto);
    this.applyInitialView();
    void this.update(true, true);
  }

  /** Posición inicial configurada en src/config.ts (INITIAL_VIEW). */
  private applyInitialView(): void {
    const anchor: Record<string, string> = {
      '16avos': 'r32',
      octavos: 'r16',
      cuartos: 'qf',
      semis: 'sf',
      final: 'final',
    };
    const v = INITIAL_VIEW;
    if (v === 'grupos') return;
    const id = anchor[v];
    if (!id) return;
    this.fxShown = this.fxTotal; // cargar todo para poder posicionar
    this.render();
    requestAnimationFrame(() => $(id)?.scrollIntoView({ block: 'start' }));
  }

  private shell(): string {
    const datalist = Object.keys(TEAMS)
      .map(teamName)
      .sort((a, b) => a.localeCompare(b))
      .map((n) => `<option value="${n}">`)
      .join('');
    return `
<header>
  <div class="brand">
    <div class="crest"><span class="yr">26</span><span>FIFA</span></div>
    <div class="titles">
      <h1>Fixture</h1>
      <div class="sub">Copa Mundial · <b>Canadá · México · EE.UU. 2026</b></div>
    </div>
  </div>
  <div class="toolbar">
    <span id="savedTag" class="saved"><span class="dot"></span><span id="savedText">Guardado automático activo</span></span>
    <a class="btn donate" id="btnDonate" href="https://www.paypal.com/paypalme/melgarejozelaya" target="_blank" rel="noopener" title="Apoya este proyecto con una donación (PayPal)">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20.8 8.6a5.5 5.5 0 0 0-9-1.2L12 8l.2-.6a5.5 5.5 0 1 0-9 6c1.7 2.4 5.8 5.6 8.8 7.9 3-2.3 7.1-5.5 8.8-7.9a5.5 5.5 0 0 0 0-4.8z"/></svg>
      Donar
    </a>
    <button class="btn primary" id="btnWeb" title="Limpia todo y vuelve a cargar SOLO los resultados reales del Mundial desde la web (ESPN)">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12a9 9 0 11-3.5-7.1M21 4v5h-5"/></svg>
      <span class="lbl">Actualizar</span>
    </button>
    <div class="menu" id="toolsMenu">
      <button class="btn" id="toolsBtn" aria-haspopup="true" aria-expanded="false" title="Herramientas">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10.3 3.3a1 1 0 011.4 0l1 1a1 1 0 010 1.4L6.4 12l-3 1 1-3 5.9-6.7z"/><path d="M14 6l4 4M3 21h18"/></svg>
        Herramientas
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:14px;height:14px"><path d="M6 9l6 6 6-6"/></svg>
      </button>
      <div class="menu-pop" id="toolsPop" hidden>
        <div class="menu-mini">Imagen e impresión</div>
        <button class="menu-item" id="btnExport" title="Exportar el fixture completo como imagen PNG">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="8.5" cy="9.5" r="1.5"/><path d="M21 16l-5-5L5 20"/></svg>
          Exportar fixture (PNG)
        </button>
        <button class="menu-item" id="btnExportKO" title="Exportar el cuadro de llaves (fase eliminatoria) como imagen PNG">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 5h6v6H4zM4 13h6v6H4zM14 8h6M17 8v8M14 16h6"/></svg>
          Exportar llaves del cuadro (PNG)
        </button>
        <button class="menu-item" id="btnPrint" title="Imprimir el fixture en A4">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 9V3h12v6M6 18H4a2 2 0 01-2-2v-3a2 2 0 012-2h16a2 2 0 012 2v3a2 2 0 01-2 2h-2M6 14h12v7H6z"/></svg>
          Imprimir (A4)
        </button>
        <div class="menu-sep"></div>
        <div class="menu-mini">Datos (resultados)</div>
        <button class="menu-item" id="btnJSON" title="Descargar tus resultados como archivo .json">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 3v12m0 0l-4-4m4 4l4-4M4 17v2a2 2 0 002 2h12a2 2 0 002-2v-2"/></svg>
          Exportar resultados (JSON)
        </button>
        <label class="menu-item" for="fileImport" title="Cargar tus resultados desde un archivo .json">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 21V9m0 0l-4 4m4-4l4 4M4 7V5a2 2 0 012-2h12a2 2 0 012 2v2"/></svg>
          Importar resultados (JSON)
        </label>
        <div class="menu-sep"></div>
        <div class="menu-mini">Preferencias</div>
        <label class="menu-item toggle" id="autoWrap" title="Actualiza los marcadores solo cuando hay un partido en juego">
          <span class="tg-l"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12a9 9 0 11-3.5-7.1M21 4v5h-5"/></svg>Actualización automática (en vivo)</span>
          <input type="checkbox" id="autoChk">
        </label>
        <div class="menu-sep"></div>
        <button class="menu-item danger" id="btnReset" title="Borrar todos los resultados cargados">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2m2 0v14a2 2 0 01-2 2H8a2 2 0 01-2-2V6"/></svg>
          Borrar todos los resultados
        </button>
      </div>
    </div>
    <input type="file" id="fileImport" accept="application/json" hidden>
  </div>
</header>
<div class="proc-overlay" id="procOverlay" hidden><div class="proc-box"><div class="proc-spin"></div><div class="proc-msg" id="procMsg">Procesando…</div></div></div>

<nav class="sticky"><div class="inner">
  <a href="#" data-view="partidos">Partidos</a>
  <a href="#grupos" data-view="fixture">Fase de grupos</a>
  <a href="#terceros" data-view="fixture">Mejores 3.º</a>
  <a href="#r32" data-view="fixture">Dieciseisavos</a>
  <a href="#r16" data-view="fixture">Octavos</a>
  <a href="#qf" data-view="fixture">Cuartos</a>
  <a href="#sf" data-view="fixture">Semifinales</a>
  <a href="#third" data-view="fixture">3.º puesto</a>
  <a href="#final" data-view="fixture">Final</a>
  <a href="#campeon" data-view="fixture">Campeón</a>
</div></nav>

<main>
  <section class="filterbar">
    <div class="fb-groupsel">
      <div class="fb-glabel"><span class="fb-ico"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/></svg></span>Filtrar por grupo · selección múltiple</div>
      <div class="fb-chips" id="groupChips"></div>
    </div>
    <div class="fb-field grow">
      <span class="fb-ico"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="7"/><path d="M21 21l-4-4"/></svg></span>
      <div class="fb-control">
        <label for="teamSearch">Recorrido de un país</label>
        <input id="teamSearch" list="teamList" placeholder="Escribe un país… (ej. Japón)" autocomplete="off">
      </div>
      <datalist id="teamList">${datalist}</datalist>
      <button class="fb-clear" id="teamClear" title="Quitar ruta" hidden>✕</button>
    </div>
  </section>

  <section id="livePanel" class="live-panel" hidden></section>

  <section id="routePanel" class="route-panel" hidden>
    <button class="route-x" id="routeClose" aria-label="Cerrar ruta">✕</button>
    <div id="routeBody"></div>
  </section>

  <div id="fixtureContent"></div>
  <div id="fixtureSentinel" aria-hidden="true"></div>

  <section id="partidosView">
    <div class="section-head"><h2>Partidos</h2><div class="rule"></div></div>
    <div class="sp-filters">
      <div class="sp-fgroup"><span class="sp-flabel">Estado</span>
        <button class="sp-fbtn" data-st="all">Todos</button>
        <button class="sp-fbtn" data-st="played">Jugados</button>
        <button class="sp-fbtn on" data-st="upcoming">Por jugar</button>
      </div>
      <div class="sp-fgroup"><span class="sp-flabel">Fecha</span>
        <button class="sp-fbtn on" data-dt="all">Todas</button>
        <button class="sp-fbtn" data-dt="today">Hoy</button>
        <button class="sp-fbtn" data-dt="tomorrow">Mañana</button>
        <button class="sp-fbtn" data-dt="week">Esta semana</button>
      </div>
    </div>
    <div id="spDetail" hidden></div>
    <div id="spList"></div>
  </section>
</main>

<div id="exportSheet"></div>

<div id="bracketModal" class="bk-modal" hidden>
  <div class="bk-modal-bar">
    <span class="bk-modal-title">Fase eliminatoria — cuadro completo</span>
    <button class="bk-modal-close" id="bkClose">✕ Cerrar</button>
  </div>
  <div class="bk-modal-body" id="bkModalBody"></div>
</div>

<footer>
  <p><b>Todos los horarios están en hora de Perú (UTC−5)</b> y cada partido muestra su <b>sede oficial</b>. Tus resultados se guardan solos en este navegador y dispositivo; para llevarlos a otra computadora usá <b>Importar</b> con tu <a href="#" id="jsonBackup" style="color:#2b7fc4;font-weight:600">copia de seguridad (.json)</a>.</p>
</footer>`;
  }

  /** Desde el menú: abre solo esa sección (cierra las demás), la carga si hacía falta y posiciona. */
  private navigateToSection(id: string): void {
    const order = ['grupos', 'terceros', 'r32', 'r16', 'qf', 'sf', 'third', 'final', 'campeon'];
    if (!order.includes(id)) {
      this.setView('fixture');
      requestAnimationFrame(() => $(id)?.scrollIntoView({ block: 'start' }));
      return;
    }
    this.setView('fixture');
    this.fxShown = this.fxTotal; // asegura que la sección esté renderizada
    this.accCollapsed = new Set(order.filter((x) => x !== id)); // abre solo la elegida
    this.render();
    requestAnimationFrame(() => $(id)?.scrollIntoView({ block: 'start' }));
  }

  /** Bloques de la página como acordeones (para colapsar y para scroll infinito). */
  private fixtureChunks(): string[] {
    const ko = knockoutRounds();
    // Orden de secciones e índice de la fase configurada (las anteriores arrancan colapsadas).
    const order = ['grupos', 'terceros', 'r32', 'r16', 'qf', 'sf', 'third', 'final', 'campeon'];
    const cfgMap: Record<string, string> = { '16avos': 'r32', octavos: 'r16', cuartos: 'qf', semis: 'sf', final: 'final' };
    const cfgId = INITIAL_VIEW === 'grupos' ? 'grupos' : cfgMap[INITIAL_VIEW] || 'grupos';
    const cfgIdx = order.indexOf(cfgId);
    if (!this.accInit) {
      order.forEach((id, i) => {
        if (i < cfgIdx) this.accCollapsed.add(id);
      });
      this.accInit = true;
    }

    const acc = (id: string, title: string, pill: string, body: string): string => {
      const collapsed = this.accCollapsed.has(id) ? ' collapsed' : '';
      return `<section class="acc${collapsed}" data-acc-sec="${id}">
        <div class="section-head acc-head" id="${id}" data-acc="${id}" role="button" tabindex="0" aria-expanded="${collapsed ? 'false' : 'true'}">
          <h2>${title}</h2>${pill ? `<span class="pill">${pill}</span>` : ''}<div class="rule"></div><span class="acc-ico" aria-hidden="true">▾</span>
        </div>
        <div class="acc-body">${body}</div>
      </section>`;
    };

    const groupsBody = `<p class="stand-legend"><b>PJ</b> partidos jugados · <b>G</b> triunfos · <b>E</b> empates · <b>P</b> derrotas · <b>GF</b> goles a favor · <b>GC</b> goles en contra · <b>DG</b> diferencia · <b>Pts</b> puntos.<br>
      Desempate FIFA: puntos → enfrentamiento directo → DG → GF → <b>fair play</b> (tarjetas) → <b>ranking FIFA</b>.</p>
      <div class="groups" id="groupsContainer">${groupsHTML()}</div>`;
    const w = winnerOf(104);
    const champVal = store.state.champ || (w ? teamName(w) : '');
    const champBody = `<div class="champ">
        <div class="trophy"><img class="champ-trophy" src="${import.meta.env.BASE_URL}trofeo.png" alt="Copa del Mundo" onerror="this.replaceWith(document.createTextNode('🏆'))"></div>
        <div class="ctitle">Campeón 2026</div>
        <input id="champInput" type="text" placeholder="—" maxlength="28" autocomplete="off" readonly value="${esc(champVal)}" title="Se completa solo con el ganador de la final">
      </div>`;

    return [
      acc('grupos', 'Fase de grupos', '12 grupos', groupsBody),
      acc('terceros', 'Mejores terceros', '8 de 12 clasifican', `<div id="thirdsContainer">${thirdsHTML()}</div>`),
      ...ko.map((r) => acc(r.id, r.title, '', r.body)),
      acc('campeon', 'Campeón del mundo', '', champBody),
    ];
  }

  private render(): void {
    this.captureFocus();
    const chunks = this.fixtureChunks();
    this.fxTotal = chunks.length;
    const show = Math.min(this.fxShown, chunks.length);
    $('fixtureContent')!.innerHTML = chunks.slice(0, show).join('');
    this.applyGroupFilter();
    const live = liveHTML();
    const panel = $('livePanel')!;
    panel.hidden = false;
    panel.innerHTML = live || '<div class="lv-head"><h2>Partidos de hoy</h2><span>Hora de Perú</span></div><div class="lv-empty">No hay partidos en vivo ni programados para hoy.</div>';
    if (this.routeTeam) $('routeBody')!.innerHTML = teamTrackHTML(this.routeTeam);
    if (this.view === 'partidos') this.renderPartidos();
    this.updateFxSentinel();
    this.restoreFocus();
    this.scheduleFit();
  }

  private updateFxSentinel(): void {
    const s = $('fixtureSentinel');
    if (s) s.style.display = this.fxShown < this.fxTotal ? 'block' : 'none';
  }
  private loadMoreFixture(): void {
    if (this.fxShown >= this.fxTotal) return;
    this.fxShown = Math.min(this.fxShown + 2, this.fxTotal);
    this.render();
  }

  /** Ajusta cada cuadro al ancho disponible y lo centra (PC: achica para entrar; móvil: agranda al máximo sin scroll). */
  private fitRaf: number | undefined;
  private scheduleFit(): void {
    if (this.fitRaf) cancelAnimationFrame(this.fitRaf);
    this.fitRaf = requestAnimationFrame(() => this.fitBrackets());
  }
  private fitBrackets(): void {
    const mobile = window.matchMedia('(max-width:760px)').matches;
    document.querySelectorAll<HTMLElement>('.bracket.bk-mini').forEach((bracket) => {
      const fit = bracket.querySelector('.bk-fit') as HTMLElement | null;
      const board = bracket.querySelector('.bk-board') as HTMLElement | null;
      if (!fit || !board) return;
      fit.style.transform = 'none';
      fit.style.width = '';
      bracket.style.height = '';
      const cs = getComputedStyle(bracket);
      const padX = parseFloat(cs.paddingLeft) + parseFloat(cs.paddingRight);
      const padY = parseFloat(cs.paddingTop) + parseFloat(cs.paddingBottom);
      const avail = bracket.clientWidth - padX;
      const natural = board.scrollWidth;
      const boardH = board.offsetHeight;
      if (!natural || !avail) return;
      let s = avail / natural;
      if (!mobile) s = Math.min(1, s); // en PC no agrandar de más
      fit.style.width = natural + 'px';
      fit.style.transform = `scale(${s})`;
      bracket.style.height = Math.ceil(boardH * s + padY) + 'px';
    });
  }

  // ---------- Cuadro: maximizar (solo móvil) ----------
  private openBracketModal(startLevel: number): void {
    $('bkModalBody')!.innerHTML = bracketHTML(true, startLevel);
    $('bracketModal')!.hidden = false;
    document.body.style.overflow = 'hidden';
  }
  private closeBracketModal(): void {
    $('bracketModal')!.hidden = true;
    document.body.style.overflow = '';
  }

  // ---------- Vista Partidos ----------
  private setView(v: 'fixture' | 'partidos'): void {
    this.view = v;
    document.querySelector('main')?.classList.toggle('view-partidos', v === 'partidos');
    document.querySelectorAll<HTMLElement>('nav.sticky a[data-view]').forEach((a) =>
      a.classList.toggle('active', a.dataset.view === v && (v === 'partidos' || false)),
    );
    if (v === 'partidos') {
      this.renderPartidos();
      window.scrollTo({ top: 0 });
    } else {
      this.scheduleFit();
    }
  }

  private renderPartidos(): void {
    const list = $('spList');
    const detail = $('spDetail');
    if (!list || !detail) return;
    if (this.spDetailKey) {
      detail.innerHTML = matchDetailHTML(this.spDetailKey, this.spFocus);
      detail.hidden = false;
      list.hidden = true;
      this.spObserver?.disconnect();
      return;
    }
    detail.hidden = true;
    list.hidden = false;
    this.spObserver?.disconnect();
    this.spDays = filteredDays(this.spStatus, this.spDate);
    this.spShown = 0;
    if (!this.spDays.length) {
      list.innerHTML = `<div class="sp-empty">No hay partidos con ese filtro.</div>`;
      return;
    }
    list.innerHTML = `<div id="spSentinel"></div>`;
    this.appendDays(6);
    const sentinel = $('spSentinel');
    if (sentinel && 'IntersectionObserver' in window) {
      this.spObserver = new IntersectionObserver(
        (entries) => {
          if (entries.some((e) => e.isIntersecting)) this.appendDays(4);
        },
        { rootMargin: '500px 0px' },
      );
      this.spObserver.observe(sentinel);
    } else {
      // Sin IntersectionObserver: cargar todo.
      this.appendDays(this.spDays.length);
    }
  }

  private appendDays(n: number): void {
    const sentinel = $('spSentinel');
    if (!sentinel) return;
    const slice = this.spDays.slice(this.spShown, this.spShown + n);
    sentinel.insertAdjacentHTML('beforebegin', slice.map(dayHTML).join(''));
    this.spShown += slice.length;
    if (this.spShown >= this.spDays.length) {
      this.spObserver?.disconnect();
      sentinel.remove();
    }
  }

  private openMatchDetail(key: string): void {
    this.spDetailKey = key;
    this.spFocus = null;
    this.renderPartidos();
    $('partidosView')?.scrollIntoView({ block: 'start' });
  }
  private closeMatchDetail(): void {
    this.spDetailKey = null;
    this.spFocus = null;
    this.renderPartidos();
  }

  private captureFocus(): void {
    const a = document.activeElement as HTMLInputElement | null;
    if (!a || a.tagName !== 'INPUT') {
      this.pendingFocus = null;
      return;
    }
    const d = a.dataset;
    let sel: string | null = null;
    if (d.mid !== undefined) sel = `input[data-mid="${d.mid}"][data-side="${d.side}"]`;
    else if (d.ko !== undefined) sel = `input[data-ko="${d.ko}"][data-side="${d.side}"]`;
    else if (d.penh !== undefined) sel = `input[data-penh="${d.penh}"]`;
    else if (d.pena !== undefined) sel = `input[data-pena="${d.pena}"]`;
    this.pendingFocus = sel ? { sel, caret: a.selectionStart } : null;
  }

  private restoreFocus(): void {
    if (!this.pendingFocus) return;
    const el = document.querySelector<HTMLInputElement>(this.pendingFocus.sel);
    if (el) {
      el.focus();
      const c = this.pendingFocus.caret;
      if (c != null) {
        try {
          el.setSelectionRange(c, c);
        } catch {
          /* noop */
        }
      }
    }
    this.pendingFocus = null;
  }

  private buildChips(): void {
    const wrap = $('groupChips')!;
    wrap.innerHTML =
      `<button type="button" class="gchip all on" data-g="all">Todos</button>` +
      GROUPS.map((g) => `<button type="button" class="gchip" data-g="${g.id}">${g.id}</button>`).join('');
    wrap.addEventListener('click', (e) => {
      const btn = (e.target as HTMLElement).closest('.gchip') as HTMLElement | null;
      if (!btn) return;
      const g = btn.dataset.g!;
      if (g === 'all') this.filter.clear();
      else if (this.filter.has(g)) this.filter.delete(g);
      else this.filter.add(g);
      this.syncChips();
      this.applyGroupFilter();
    });
  }
  private syncChips(): void {
    $('groupChips')!
      .querySelectorAll<HTMLElement>('.gchip')
      .forEach((c) => {
        if (c.dataset.g === 'all') c.classList.toggle('on', this.filter.size === 0);
        else c.classList.toggle('on', this.filter.has(c.dataset.g!));
      });
  }
  private applyGroupFilter(): void {
    const all = this.filter.size === 0;
    $('groupsContainer')!
      .querySelectorAll<HTMLElement>('section.group')
      .forEach((s) => {
        s.style.display = all || this.filter.has(s.dataset.g!) ? '' : 'none';
      });
  }

  private wire(): void {
    document.addEventListener('input', (e) => {
      const t = e.target as HTMLInputElement;
      const d = t.dataset;
      if (d.mid !== undefined) {
        const r = clampGoalsStr(t.value);
        t.value = r.value;
        this.pendingFocus = { sel: `input[data-mid="${d.mid}"][data-side="${d.side}"]`, caret: t.selectionStart };
        store.setGoals(d.mid, d.side as 'h' | 'a', r.num);
      } else if (d.ko !== undefined) {
        const r = clampGoalsStr(t.value);
        t.value = r.value;
        this.pendingFocus = { sel: `input[data-ko="${d.ko}"][data-side="${d.side}"]`, caret: t.selectionStart };
        store.setGoals(d.ko, d.side as 'h' | 'a', r.num);
      } else if (d.penh !== undefined || d.pena !== undefined) {
        const id = d.penh ?? d.pena!;
        const side: 'h' | 'a' = d.penh !== undefined ? 'h' : 'a';
        const r = clampGoalsStr(t.value);
        t.value = r.value;
        this.pendingFocus = { sel: d.penh !== undefined ? `input[data-penh="${id}"]` : `input[data-pena="${id}"]`, caret: t.selectionStart };
        store.setPenScore(id, side, r.num);
      }
    });
    document.addEventListener('change', (e) => {
      const t = e.target as HTMLInputElement;
      if (t.dataset.pen !== undefined) store.setPenWinner(t.dataset.pen, t.value as 'h' | 'a');
    });

    // Navegación por pestañas (Partidos = vista interna)
    document.querySelector('nav.sticky')?.addEventListener('click', (e) => {
      const a = (e.target as HTMLElement).closest('a[data-view]') as HTMLAnchorElement | null;
      if (!a) return;
      const v = a.dataset.view as 'fixture' | 'partidos';
      if (v === 'partidos') {
        e.preventDefault();
        this.setView('partidos');
        return;
      }
      const href = a.getAttribute('href') || '';
      if (href.startsWith('#') && href.length > 1) {
        e.preventDefault();
        this.navigateToSection(href.slice(1));
      } else {
        this.setView('fixture');
      }
    });

    document.addEventListener('click', (e) => {
      const tgt = e.target as HTMLElement;
      if (tgt.closest('#bracketModal')) return; // el modal tiene sus propios manejadores
      if (this.view === 'partidos') {
        if (tgt.closest('#spBack')) {
          this.closeMatchDetail();
          return;
        }
        const stB = tgt.closest('.sp-fbtn[data-st]') as HTMLElement | null;
        if (stB) {
          this.spStatus = stB.dataset.st as SpStatus;
          this.spDetailKey = null;
          document.querySelectorAll('.sp-fbtn[data-st]').forEach((b) => b.classList.toggle('on', b === stB));
          this.renderPartidos();
          return;
        }
        const dtB = tgt.closest('.sp-fbtn[data-dt]') as HTMLElement | null;
        if (dtB) {
          this.spDate = dtB.dataset.dt as SpDate;
          this.spDetailKey = null;
          document.querySelectorAll('.sp-fbtn[data-dt]').forEach((b) => b.classList.toggle('on', b === dtB));
          this.renderPartidos();
          return;
        }
        const teamEl = tgt.closest('#spDetail [data-team]') as HTMLElement | null;
        if (teamEl?.dataset.team) {
          this.spFocus = teamEl.dataset.team;
          this.renderPartidos();
          return;
        }
        const m = tgt.closest('.sp-match[data-mkey]') as HTMLElement | null;
        if (m?.dataset.mkey) {
          this.openMatchDetail(m.dataset.mkey);
          return;
        }
        return;
      }
      if (tgt.closest('input,button,a,summary')) return;
      // Acordeón: clic en el encabezado colapsa/expande la sección.
      const head = tgt.closest('.acc-head') as HTMLElement | null;
      if (head?.dataset.acc) {
        const id = head.dataset.acc;
        const sec = head.closest('.acc') as HTMLElement | null;
        const nowCollapsed = !sec?.classList.contains('collapsed');
        sec?.classList.toggle('collapsed', nowCollapsed);
        head.setAttribute('aria-expanded', String(!nowCollapsed));
        if (nowCollapsed) this.accCollapsed.add(id);
        else this.accCollapsed.delete(id);
        this.scheduleFit();
        return;
      }
      // En móvil, tocar cualquier cuadro abre su versión maximizada (a su fase).
      const mini = tgt.closest('.bracket.bk-mini') as HTMLElement | null;
      if (mini && window.matchMedia('(max-width:760px)').matches) {
        this.openBracketModal(+(mini.dataset.lvl || 0));
        return;
      }
      const el = tgt.closest('[data-team]') as HTMLElement | null;
      if (el?.dataset.team) {
        this.showRoute(el.dataset.team);
        return;
      }
    });

    const ts = $('teamSearch') as HTMLInputElement;
    const go = (): void => {
      const c = resolveCountry(ts.value);
      if (c) this.showRoute(c);
      else if (ts.value.trim()) this.flashSaved('No encontré ese país');
    };
    ts.addEventListener('change', go);
    ts.addEventListener('keydown', (e) => {
      if ((e as KeyboardEvent).key === 'Enter') {
        e.preventDefault();
        go();
      }
    });
    $('teamClear')!.addEventListener('click', () => this.hideRoute());
    $('routeClose')!.addEventListener('click', () => this.hideRoute());

    $('btnWeb')!.addEventListener('click', () => void this.update(false, true));
    $('autoChk')!.addEventListener('change', (e) => this.setAuto((e.target as HTMLInputElement).checked));
    $('btnReset')!.addEventListener('click', () => {
      if (confirm('¿Borrar TODOS los resultados cargados? Esta acción no se puede deshacer.\n\nConsejo: usá Exportar antes para tener una copia.')) {
        store.resetToBlank();
        this.flashSaved('Fixture reiniciado');
      }
    });
    $('btnPrint')!.addEventListener('click', () => printSheet());
    $('btnExport')!.addEventListener('click', () => void exportPNG((m) => this.flashSaved(m)));
    $('btnExportKO')!.addEventListener('click', () => void exportBracketPNG((m) => this.flashSaved(m), 0));
    $('btnJSON')!.addEventListener('click', () => downloadJSON((m) => this.flashSaved(m)));
    $('fileImport')!.addEventListener('change', (e) => this.importJSON(e));
    $('jsonBackup')!.addEventListener('click', (e) => {
      e.preventDefault();
      downloadJSON((m) => this.flashSaved(m));
    });

    const tb = $('toolsBtn')!;
    const pop = $('toolsPop')!;
    tb.addEventListener('click', (e) => {
      e.stopPropagation();
      const open = pop.hidden;
      pop.hidden = !open;
      tb.setAttribute('aria-expanded', String(open));
    });
    document.addEventListener('click', (e) => {
      if (!(e.target as HTMLElement).closest('#toolsMenu')) {
        pop.hidden = true;
        tb.setAttribute('aria-expanded', 'false');
      }
    });

    // Cuadro: cerrar modal
    $('bkClose')!.addEventListener('click', () => this.closeBracketModal());
    $('bracketModal')!.addEventListener('click', (e) => {
      if (e.target === $('bracketModal')) this.closeBracketModal();
    });
    document.addEventListener('keydown', (e) => {
      if ((e as KeyboardEvent).key === 'Escape' && !$('bracketModal')!.hidden) this.closeBracketModal();
    });
    window.addEventListener('resize', () => this.scheduleFit());

    // Scroll infinito de la página (carga secciones a medida que bajás).
    this.fxObserver = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) this.loadMoreFixture();
      },
      { rootMargin: '700px 0px' },
    );
    const sentinel = $('fixtureSentinel');
    if (sentinel) this.fxObserver.observe(sentinel);
  }

  private showRoute(code: string): void {
    this.routeTeam = code;
    this.$search().value = teamName(code);
    $('routeBody')!.innerHTML = teamTrackHTML(code);
    $('routePanel')!.hidden = false;
    $('teamClear')!.hidden = false;
    $('routePanel')!.scrollIntoView({ block: 'start' });
  }
  private hideRoute(): void {
    this.routeTeam = null;
    $('routePanel')!.hidden = true;
    $('teamClear')!.hidden = true;
    this.$search().value = '';
  }
  private $search(): HTMLInputElement {
    return $('teamSearch') as HTMLInputElement;
  }

  private async update(silent: boolean, clearFirst: boolean): Promise<void> {
    if (this.updating) return;
    this.updating = true;
    const btn = $('btnWeb');
    btn?.classList.add('loading');
    const lbl = btn?.querySelector('.lbl');
    const prev = lbl?.textContent;
    if (lbl) lbl.textContent = 'Actualizando…';
    this.flashSaved('Buscando resultados en la web…');
    try {
      const s = await fetchAndApply(clearFirst);
      if (s.updated > 0)
        this.flashSaved(`Web: ${s.updated} partidos (${s.finished} finalizados${s.live ? ', ' + s.live + ' en vivo' : ''})`);
      else if (s.withResult === 0) this.flashSaved('Aún no hay partidos jugados publicados.');
      else this.flashSaved('Sin partidos nuevos para actualizar.');
    } catch (err) {
      this.flashSaved('No se pudo conectar con la web');
      if (!silent)
        alert('No se pudieron traer los resultados.\n\nServí el sitio por HTTP (npm run dev) — abrirlo con doble clic (file://) bloquea el acceso.\n\nDetalle: ' + (err as Error).message);
    } finally {
      this.updating = false;
      btn?.classList.remove('loading');
      if (lbl && prev) lbl.textContent = prev;
    }
  }

  private setAuto(on: boolean): void {
    store.setAuto(on);
    const cb = $('autoChk') as HTMLInputElement | null;
    if (cb) cb.checked = on;
    $('autoWrap')?.classList.toggle('live', on);
    if (this.autoTimer) {
      clearInterval(this.autoTimer);
      this.autoTimer = undefined;
    }
    if (on) {
      if (anyMatchLiveNow()) void this.update(true, false);
      this.autoTimer = window.setInterval(() => {
        if (document.hidden) return;
        if (anyMatchLiveNow()) void this.update(true, false);
      }, 60000);
    }
  }

  private importJSON(e: Event): void {
    const f = (e.target as HTMLInputElement).files?.[0];
    if (!f) return;
    const r = new FileReader();
    r.onload = () => {
      try {
        const data = JSON.parse(String(r.result));
        if (data && data.scores) {
          Object.assign(store.state, data);
          store.save();
          store.emit();
          this.flashSaved('Respaldo importado');
        } else this.flashSaved('Archivo no válido');
      } catch {
        this.flashSaved('No se pudo leer el archivo');
      }
    };
    r.readAsText(f);
  }

  private flashSaved(msg: string): void {
    const tag = $('savedTag');
    const txt = $('savedText');
    if (txt) txt.textContent = msg;
    if (tag) {
      tag.classList.remove('flash');
      void tag.offsetWidth;
      tag.classList.add('flash');
    }
  }
}
