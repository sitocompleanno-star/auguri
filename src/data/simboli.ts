// Simboli delle famiglie di emozioni (Fase 3), come frammenti SVG centrati in (0, 0) e contenuti in un
// quadrato 18 x 18 (da -9 a 9). Si usano con `fill`/`stroke` = currentColor, quindi prendono il colore da fuori.
// Servono ai francobolli segnaposto (scripts/genera-francobolli.mjs) e, in Fase 4, alle caselle del Diario.
// Forme scelte perché si distinguano anche piccolissime e senza colore.
import type { SimboloId } from './emozioni.ts';

function stella(punte: number, rEsterno: number, rInterno: number, dy = 0): string {
  const p: string[] = [];
  for (let i = 0; i < punte * 2; i++) {
    const r = i % 2 === 0 ? rEsterno : rInterno;
    const a = (Math.PI / punte) * i - Math.PI / 2;
    p.push(`${(r * Math.cos(a)).toFixed(2)},${(r * Math.sin(a) + dy).toFixed(2)}`);
  }
  return `<polygon points="${p.join(' ')}" fill="currentColor"/>`;
}

function raggi(n: number, r1: number, r2: number): string {
  const d: string[] = [];
  for (let i = 0; i < n; i++) {
    const a = ((Math.PI * 2) / n) * i;
    const c = Math.cos(a), s = Math.sin(a);
    d.push(`M${(r1 * c).toFixed(2)} ${(r1 * s).toFixed(2)}L${(r2 * c).toFixed(2)} ${(r2 * s).toFixed(2)}`);
  }
  return `<path d="${d.join('')}" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" fill="none"/>`;
}

export const simboli: Record<SimboloId, string> = {
  // sole: disco con 8 raggi
  sole: `<circle r="4.3" fill="currentColor"/>${raggi(8, 6.3, 8.6)}`,
  // stella a 5 punte
  stella: stella(5, 8.8, 3.7, 0.8),
  // goccia
  goccia: `<path d="M0 -8.6C1.8 -5.4 6.2 -0.4 6.2 3.2A6.2 6.2 0 0 1 -6.2 3.2C-6.2 -0.4 -1.8 -5.4 0 -8.6Z" fill="currentColor"/>`,
  // nuvola: tre cerchi su una base arrotondata
  nuvola: `<g fill="currentColor"><circle cx="-3.6" cy="1.2" r="3.9"/><circle cx="1.4" cy="-1.6" r="5"/><circle cx="5.2" cy="2" r="3.3"/><rect x="-8" y="1.4" width="16.4" height="4.6" rx="2.3"/></g>`,
  // spirale (giramento di testa, nausea)
  spirale: `<path d="M0.4 0.2C0.4 -1.2 -1.6 -1.3 -2 0C-2.6 1.9 -0.4 3.5 1.6 2.9C4.2 2.1 4.6 -1.4 3 -3.4C0.9 -6 -3.4 -5.6 -5.2 -2.8C-7.3 0.5 -5.8 5.2 -2.2 6.5C1.6 7.9 6.1 6.1 7.5 2.3" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" fill="none"/>`,
  // fulmine
  fulmine: `<polygon points="2.2,-9 -6,1.4 -0.6,1.4 -2.4,9 6,-2 0.6,-2" fill="currentColor"/>`,
};
