// Percorsi dei francobolli (Fase 3). Funzioni pure, usabili sia al build sia nel browser.
// Il definitivo sta in public/grafica/francobolli/<file>; finché manca si usa il segnaposto con lo stesso nome
// in public/placeholders/francobolli/<file> (vedi scripts/genera-francobolli.mjs).
import type { Emozione } from '../data/emozioni.ts';

export const FRANCOBOLLO_VUOTO = 'grafica/francobollo-vuoto.svg';

/** Percorso relativo a BASE_URL. `definitivi` = id delle emozioni che hanno già l'SVG definitivo. */
export function percorsoFrancobollo(e: Emozione, definitivi: ReadonlySet<string>): string {
  return definitivi.has(e.id) ? `grafica/francobolli/${e.francobollo}` : `placeholders/francobolli/${e.francobollo}`;
}
