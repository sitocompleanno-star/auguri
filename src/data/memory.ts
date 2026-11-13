// Memory (Fase 8): simboli delle carte e livelli.
//
// Le carte usano simboli semplici disegnati qui (non i francobolli): frammenti SVG centrati in (0, 0) dentro
// un quadrato 20 x 20 (da -10 a 10), con fill/stroke = currentColor. Ogni simbolo ha una FORMA diversa, così
// le coppie si riconoscono anche senza colore; il colore aiuta soltanto.
// Per cambiare un simbolo basta cambiare `svg` (e `nome`, che è il nome letto dagli screen reader).

export interface SimboloMemory {
  id: string;
  nome: string;   // "Carta 3, Cuore"
  colore: string; // colore del simbolo (contrasto >= 3:1 sul fondo della carta, controllato al build)
  svg: string;
}

/** Fondo del lato scoperto delle carte (come il fondo della pagina Francobolli). */
export const FONDO_CARTA = '#fbf4f0';

function petali(n: number, r: number, rp: number): string {
  let c = '';
  for (let i = 0; i < n; i++) {
    const a = ((Math.PI * 2) / n) * i - Math.PI / 2;
    c += `<circle cx="${(r * Math.cos(a)).toFixed(2)}" cy="${(r * Math.sin(a)).toFixed(2)}" r="${rp}"/>`;
  }
  return c;
}

function raggi(n: number, r1: number, r2: number): string {
  let d = '';
  for (let i = 0; i < n; i++) {
    const a = ((Math.PI * 2) / n) * i;
    const c = Math.cos(a), s = Math.sin(a);
    d += `M${(r1 * c).toFixed(2)} ${(r1 * s).toFixed(2)}L${(r2 * c).toFixed(2)} ${(r2 * s).toFixed(2)}`;
  }
  return d;
}

function stella(punte: number, re: number, ri: number, dy: number): string {
  const p: string[] = [];
  for (let i = 0; i < punte * 2; i++) {
    const r = i % 2 === 0 ? re : ri;
    const a = (Math.PI / punte) * i - Math.PI / 2;
    p.push(`${(r * Math.cos(a)).toFixed(2)},${(r * Math.sin(a) + dy).toFixed(2)}`);
  }
  return p.join(' ');
}

export const simboliMemory: SimboloMemory[] = [
  {
    id: 'cuore', nome: 'Cuore', colore: '#9f382d',
    svg: `<path fill="currentColor" d="M0 8.6C-6.2 4.6-9.2 1.1-9.2-2.8-9.2-6-6.8-8.2-4-8.2-2.2-8.2-0.8-7.2 0-5.7 0.8-7.2 2.2-8.2 4-8.2 6.8-8.2 9.2-6 9.2-2.8 9.2 1.1 6.2 4.6 0 8.6Z"/>`,
  },
  {
    id: 'fiore', nome: 'Fiore', colore: '#a8456b',
    svg: `<g fill="currentColor">${petali(5, 5.2, 3.9)}</g><circle r="3" fill="${FONDO_CARTA}"/><circle r="1.6" fill="currentColor"/>`,
  },
  {
    id: 'sole', nome: 'Sole', colore: '#9a6410',
    svg: `<circle r="4.4" fill="currentColor"/><path d="${raggi(8, 6.4, 9.2)}" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" fill="none"/>`,
  },
  {
    id: 'luna', nome: 'Luna', colore: '#34557f',
    svg: `<path fill="currentColor" d="M3.2-8.6A9 9 0 1 0 8.4 4.2 7 7 0 0 1 3.2-8.6Z"/>`,
  },
  {
    id: 'stella', nome: 'Stella', colore: '#674a86',
    svg: `<polygon fill="currentColor" points="${stella(5, 9.6, 4, 0.9)}"/>`,
  },
  {
    id: 'foglia', nome: 'Foglia', colore: '#3d6b45',
    svg: `<path fill="currentColor" d="M-7.6 7.6C-8.6-1.6-3.4-8.4 8.2-8.2 8.6 3.2 1.4 8.8-7.6 7.6Z"/><path d="M-8.4 8.4 3.6-3.6" stroke="${FONDO_CARTA}" stroke-width="1.3" stroke-linecap="round"/>`,
  },
  {
    id: 'goccia', nome: 'Goccia', colore: '#1f6f7a',
    svg: `<path fill="currentColor" d="M0-9.4C2 -6 6.8-0.6 6.8 3.2A6.8 6.8 0 0 1-6.8 3.2C-6.8-0.6-2-6 0-9.4Z"/>`,
  },
  {
    id: 'fungo', nome: 'Fungo', colore: '#7c3a26',
    svg: `<path fill="currentColor" d="M-9 0.6C-9-5-4.6-8.6 0-8.6S9-5 9 0.6Z"/><path fill="currentColor" d="M-3.2 1.6H3.2L3.8 7.6A1.4 1.4 0 0 1 2.4 9H-2.4A1.4 1.4 0 0 1-3.8 7.6Z"/><g fill="${FONDO_CARTA}"><circle cx="-4" cy="-3" r="1.5"/><circle cx="2.4" cy="-5.2" r="1.2"/><circle cx="4.6" cy="-1.4" r="1.1"/></g>`,
  },
];

export interface LivelloMemory {
  id: 'facile' | 'difficile';
  nome: string;
  coppie: number;
  colonne: number; // a 390 px: 3 colonne = carte da ~107 px, 4 colonne = ~78 px (sempre >= 44 px)
}

export const livelliMemory: LivelloMemory[] = [
  { id: 'facile', nome: 'Facile', coppie: 6, colonne: 3 },
  { id: 'difficile', nome: 'Difficile', coppie: 8, colonne: 4 },
];

/** Francobollo speciale vinto alla prima vittoria (id in `speciali` di src/data/emozioni.ts). */
export const PREMIO_MEMORY = 'memory';
/** Nome del gioco nelle chiavi dei record ("memory-facile", "memory-difficile"). */
export const GIOCO_MEMORY = 'memory';
/** Quanto restano scoperte due carte diverse prima di rigirarsi (ms). Un tocco su un'altra carta le rigira subito. */
export const ATTESA_ERRORE_MS = 1100;
