// Genera i francobolli SEGNAPOSTO (uno per emozione di ultimo livello, più gli speciali dei giochi, Fase 8) in public/placeholders/francobolli/.
// Stesso viewBox dello slot vuoto (45.44 x 58.1) e stesso nome file dei definitivi: quando arriva l'SVG vero
// basta metterlo in public/grafica/francobolli/ con lo stesso nome (il sito usa quello al posto del segnaposto).
//
// Uso:  npm run francobolli      (da rilanciare se cambi src/data/emozioni.ts)
import { mkdirSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { tuttiFrancobolli as emozioni, INCHIOSTRO, verificaRuota } from '../src/data/emozioni.ts';
import { simboli } from '../src/data/simboli.ts';

const W = 45.44;
const H = 58.1;
const R = 1.55; // raggio dei "buchi" della dentellatura

// Dentellatura: cerchi con centro sul bordo, distribuiti in modo uniforme (agli angoli niente buco)
function buchi() {
  const c = [];
  const lato = (n, x0, y0, dx, dy) => {
    for (let i = 1; i <= n; i++) c.push([x0 + (dx * i) / (n + 1), y0 + (dy * i) / (n + 1)]);
  };
  lato(8, 0, 0, W, 0);
  lato(8, 0, H, W, 0);
  lato(10, 0, 0, 0, H);
  lato(10, W, 0, 0, H);
  return c.map(([x, y]) => `<circle cx="${x.toFixed(2)}" cy="${y.toFixed(2)}" r="${R}"/>`).join('');
}
const dentellatura = buchi();

function svg(e) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" data-segnaposto="${e.id}">
<defs><mask id="m"><rect width="${W}" height="${H}" fill="#fff"/><g fill="#000">${dentellatura}</g></mask></defs>
<rect width="${W}" height="${H}" fill="${e.colore}" mask="url(#m)"/>
<rect x="4.25" y="3.67" width="36.94" height="50.76" fill="${e.sfumatura}"/>
<g transform="translate(22.72 21.2) scale(1.05)" color="${e.colore}">${simboli[e.simbolo]}</g>
<text x="22.72" y="47.6" text-anchor="middle" font-family="Georgia,'Times New Roman',serif" font-size="15.5" font-weight="700" fill="${INCHIOSTRO}">${e.iniziale}</text>
</svg>
`;
}

const problemi = verificaRuota();
if (problemi.length) {
  console.error('Problemi nella ruota delle emozioni:\n - ' + problemi.join('\n - '));
  process.exit(1);
}

const cartella = join(import.meta.dirname, '..', 'public', 'placeholders', 'francobolli');
mkdirSync(cartella, { recursive: true });
// via i segnaposto di emozioni che non esistono più
const attesi = new Set(emozioni.map((e) => e.francobollo));
for (const f of readdirSync(cartella)) if (f.endsWith('.svg') && !attesi.has(f)) rmSync(join(cartella, f));
for (const e of emozioni) writeFileSync(join(cartella, e.francobollo), svg(e));
console.log(`${emozioni.length} francobolli segnaposto in public/placeholders/francobolli/`);
