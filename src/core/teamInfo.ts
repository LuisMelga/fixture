/** Capa CORE — información de selecciones. */
import { TEAMS } from '../data/teams';
import { txtOn, lum } from './util';

export function teamName(code: string): string {
  return TEAMS[code] ? TEAMS[code][0] : code;
}

export function teamColor(code: string): string {
  return TEAMS[code] ? TEAMS[code][1] : '#8aa0b8';
}

export { txtOn, lum };
