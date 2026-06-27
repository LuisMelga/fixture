/** UI — Exportación: lámina ilustrada PNG (original), impresión y respaldo JSON. */
import { GROUPS, type GroupData } from '../../data/groups';
import { R32_SEED, R16, QF, SF, THIRD, FINAL } from '../../data/knockout';
import { SCHEDULE } from '../../data/schedule';
import { ART_TROPHY, ART_PLAYERS } from '../../assets/art';
import { store } from '../../state/store';
import { bracketHTML } from './bracketView';
import { num } from '../../core/util';
import { teamName, teamColor, txtOn } from '../../core/teamInfo';
import { matchTeams, feederTokens, decided, seedHint, winnerOf } from '../../core/bracket';

type Flash = (msg: string) => void;

function xcChip(code: string): string {
  const bg = teamColor(code);
  const fg = txtOn(bg);
  return `<span class="xc" style="background:${bg};color:${fg}">${code}</span>`;
}

function xgGroupHTML(g: GroupData): string {
  const names = g.teams.map(teamName).join(' · ');
  const rows = g.m
    .map((m) => {
      const [mid, , , h, a] = m;
      const sch = SCHEDULE[mid] || { dt: '', stad: '' };
      const when = sch.dt || m[1] || '';
      const stad = (sch.stad || m[2] || '').split(' · ')[0];
      const sc = store.scoreOf(mid);
      const hn = num(sc.h);
      const an = num(sc.a);
      let hw = '';
      let aw = '';
      if (hn !== null && an !== null) {
        if (hn > an) hw = 'win';
        else if (an > hn) aw = 'win';
      }
      return `<div class="xg-m">
      <div class="xg-info"><b>${when}</b><br>${stad}</div>
      <div class="xg-vs">
        <div class="xside h">${xcChip(h)}</div>
        <span class="xbox ${hw}">${sc.h ?? ''}</span><span class="xbox ${aw}">${sc.a ?? ''}</span>
        <div class="xside a">${xcChip(a)}</div>
      </div>
    </div>`;
    })
    .join('');
  return `<div class="xg"><div class="xg-h"><span class="L">${g.id}</span>GRUPO ${g.id}<span class="nm">${names}</span></div>${rows}</div>`;
}

function xkCardHTML(id: number): string {
  const [h, a] = matchTeams(id);
  const tk = feederTokens(id);
  const sch = SCHEDULE[id] || { dt: '', stad: '' };
  const sc = store.scoreOf(String(id));
  const d = decided(id);
  const cell = (side: 'h' | 'a', code: string, token: string, val: number | undefined): string => {
    const who = code ? `${xcChip(code)} ${teamName(code)}` : `<span class="seed">${seedHint(token)}</span>`;
    return `<div class="xk-row ${d === side ? 'win' : ''}"><div class="who">${who}</div><span class="xbox ${d === side ? 'win' : ''}">${val ?? ''}</span></div>`;
  };
  return `<div class="xk">
    <div class="xk-top"><b>P${id}</b><span>${sch.dt || ''}</span></div>
    ${cell('h', h, tk[0], sc.h)}
    ${cell('a', a, tk[1], sc.a)}
    ${sch.stad ? `<div class="xk-st">📍 ${sch.stad}</div>` : ''}
  </div>`;
}

function buildFixtureSheet(): HTMLElement {
  const col1 = GROUPS.slice(0, 6).map(xgGroupHTML).join('');
  const col2 = GROUPS.slice(6, 12).map(xgGroupHTML).join('');
  const r32 = Object.keys(R32_SEED).map((id) => xkCardHTML(+id)).join('');
  const r16 = R16.map((x) => xkCardHTML(x[0])).join('');
  const qf = QF.map((x) => xkCardHTML(x[0])).join('');
  const sf = SF.map((x) => xkCardHTML(x[0])).join('');
  const th = THIRD.map((x) => xkCardHTML(x[0])).join('');
  const fin = FINAL.map((x) => xkCardHTML(x[0])).join('');
  const champ = winnerOf(104);
  const champHTML = `<div class="xchamp"><div class="lab">CAMPEÓN DEL MUNDO</div><div class="who">${champ ? teamName(champ) : ''}</div></div>`;
  const sheet = document.getElementById('exportSheet')!;
  sheet.innerHTML = `
    <div class="xs-head">
      <img class="xs-trophy" src="${ART_TROPHY}" alt="">
      <div class="xs-title">
        <div class="t1">FIXTURE · COPA MUNDIAL <b>CANADÁ · MÉXICO · EE.UU. 2026</b></div>
        <div class="t2">48 selecciones · 12 grupos · Round of 32</div>
        <div class="xs-when2"><b>Horario de Perú (UTC−5)</b> · cada partido con su sede oficial</div>
      </div>
      <img class="xs-players" src="${ART_PLAYERS}" alt="">
    </div>
    <div class="xs-grid">
      <div class="xs-col">${col1}</div>
      <div class="xs-col">${col2}</div>
      <div class="xs-col"><div class="xr-h">Dieciseisavos de final</div>${r32}</div>
      <div class="xs-col">
        <div class="xr-h">Octavos de final</div>${r16}
        <div class="xr-h">Cuartos de final</div>${qf}
        <div class="xr-h">Semifinales</div>${sf}
        <div class="xr-h">Final</div>${fin}
        <div class="xr-h">Tercer puesto</div>${th}
        ${champHTML}
      </div>
    </div>`;
  return sheet;
}

function showProc(msg: string): void {
  const o = document.getElementById('procOverlay');
  if (o) {
    const m = document.getElementById('procMsg');
    if (m) m.textContent = msg || 'Procesando…';
    o.hidden = false;
  }
}
function hideProc(): void {
  const o = document.getElementById('procOverlay');
  if (o) o.hidden = true;
}

export async function exportPNG(flash: Flash): Promise<void> {
  const btn = document.getElementById('btnExport') as HTMLButtonElement | null;
  if (btn) btn.disabled = true;
  showProc('Generando imagen…');
  try {
    const sheet = buildFixtureSheet();
    const html2canvas = (await import('html2canvas')).default;
    sheet.style.left = '0';
    sheet.style.top = '0';
    sheet.style.zIndex = '-9999';
    await new Promise((r) => setTimeout(r, 80));
    let canvas: HTMLCanvasElement;
    try {
      canvas = await html2canvas(sheet, {
        scale: 2,
        backgroundColor: '#ffffff',
        useCORS: true,
        logging: false,
        width: 1480,
        windowWidth: 1480,
      });
    } finally {
      sheet.style.left = '-99999px';
      sheet.style.zIndex = '';
    }
    await new Promise<void>((res) =>
      canvas.toBlob((b) => {
        if (b) {
          const url = URL.createObjectURL(b);
          const a = document.createElement('a');
          a.href = url;
          a.download = 'Fixture-Mundial-2026.png';
          a.click();
          setTimeout(() => URL.revokeObjectURL(url), 1000);
          flash('Imagen exportada ✓');
        }
        res();
      }, 'image/png'),
    );
  } catch (err) {
    console.error(err);
    flash('No se pudo crear la imagen — abriendo impresión');
    printSheet();
  } finally {
    hideProc();
    if (btn) btn.disabled = false;
  }
}

export async function exportBracketPNG(flash: Flash, startLevel = 0): Promise<void> {
  const btn = document.getElementById('btnExportKO') as HTMLButtonElement | null;
  if (btn) btn.disabled = true;
  showProc('Generando cuadro…');
  // Render fuera de pantalla la versión COMPLETA (con nombres), nunca la compacta de móvil.
  const holder = document.createElement('div');
  holder.style.cssText = 'position:fixed;left:-99999px;top:0;z-index:-1;background:#0c1b30';
  holder.innerHTML = bracketHTML(true, startLevel);
  document.body.appendChild(holder);
  try {
    const board = holder.querySelector('.bk-board') as HTMLElement | null;
    if (!board) throw new Error('no board');
    await new Promise((r) => setTimeout(r, 80));
    const html2canvas = (await import('html2canvas')).default;
    const canvas = await html2canvas(board, {
      scale: 2,
      backgroundColor: '#0c1b30',
      useCORS: true,
      logging: false,
      width: board.scrollWidth,
      height: board.scrollHeight,
      windowWidth: board.scrollWidth,
    });
    await new Promise<void>((res) =>
      canvas.toBlob((b) => {
        if (b) {
          const url = URL.createObjectURL(b);
          const a = document.createElement('a');
          a.href = url;
          a.download = 'Fase-eliminatoria-Mundial-2026.png';
          a.click();
          setTimeout(() => URL.revokeObjectURL(url), 1000);
          flash('Cuadro exportado ✓');
        }
        res();
      }, 'image/png'),
    );
  } catch (err) {
    console.error(err);
    flash('No se pudo crear la imagen del cuadro');
  } finally {
    holder.remove();
    hideProc();
    if (btn) btn.disabled = false;
  }
}

export function printSheet(): void {
  buildFixtureSheet();
  document.body.classList.add('printing-sheet');
  const after = (): void => {
    document.body.classList.remove('printing-sheet');
    window.removeEventListener('afterprint', after);
  };
  window.addEventListener('afterprint', after);
  setTimeout(() => window.print(), 80);
}

export function downloadJSON(flash: Flash): void {
  const blob = new Blob([JSON.stringify(store.state, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'mundial-2026-resultados.json';
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  flash('Copia .json descargada');
}
