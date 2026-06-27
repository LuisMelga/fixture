/** Capa UI — helpers de DOM y presentación. */
import { teamColor, txtOn } from '../core/teamInfo';

export const $ = <T extends HTMLElement = HTMLElement>(id: string): T | null =>
  document.getElementById(id) as T | null;

export function chip(code: string): string {
  const bg = teamColor(code);
  const fg = txtOn(bg);
  return `<span class="chip" style="background:${bg};color:${fg}">${code}</span>`;
}

/** Delegación de eventos: un solo listener por contenedor. */
export function delegate(
  root: HTMLElement | null,
  selector: string,
  type: string,
  handler: (el: HTMLElement, ev: Event) => void,
): void {
  if (!root) return;
  root.addEventListener(type, (ev) => {
    const target = ev.target as HTMLElement | null;
    const el = target?.closest(selector) as HTMLElement | null;
    if (el && root.contains(el)) handler(el, ev);
  });
}

export function esc(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
