// Cartoline (Fase 5), dalle tavole 4-7 di Francobolli_e_luna_park.pdf. Per aggiungerne una:
//  1. una voce qui sotto (l'`id` è la chiave salvata nello stato: non cambiarlo dopo l'uso);
//  2. il fronte in public/grafica/cartoline/fronte-<id>.webp (3:2, meglio 1772 x 1181 = 15 x 10 cm a 300 dpi);
//  3. un'icona nel portafoglio di pages/francobolli (oggi ce ne sono due: busta e cartellina).
// Formato: 10 x 15 cm in orizzontale (150 x 100 mm), come nelle tavole.

export interface Cartolina {
  id: string;
  nome: string;        // per i nomi accessibili: "Cartolina con il fiore"
  fronte: string;      // relativo a BASE_URL
  retro: { carta: string; righe: string }; // colori del retro (carta e righe), abbinati al fronte
}

export const LARGHEZZA_MM = 150;
export const ALTEZZA_MM = 100;
/** Pixel del disegno a 300 dpi (150 mm = 1771,65 px). */
export const LARGHEZZA_PX = 1772;
export const ALTEZZA_PX = 1181;

/** Francobollo sulla cartolina: larghezza in frazione della cartolina (~20 mm come un francobollo vero). */
export const FRANCOBOLLO_LARGHEZZA = 0.135;
/** Proporzioni dei francobolli (viewBox 45.44 x 58.1). */
export const FRANCOBOLLO_RAPPORTO = 58.1 / 45.44;

export const cartoline: Cartolina[] = [
  {
    id: 'fiore',
    nome: 'Cartolina con il fiore',
    fronte: 'grafica/cartoline/fronte-fiore.webp',
    retro: { carta: '#f7ede6', righe: '#b9978c' },
  },
  {
    id: 'mappa',
    nome: 'Cartolina con la mappa',
    fronte: 'grafica/cartoline/fronte-mappa.webp',
    retro: { carta: '#f1e7cc', righe: '#a48c63' },
  },
];

export const cartolinaDati = (id: string) => cartoline.find((c) => c.id === id);

/**
 * Retro della cartolina come SVG (viewBox in decimi di millimetro: 1500 x 1000). Nessuna scritta: riga
 * divisoria al centro, righe per l'indirizzo e riquadro per il francobollo postale, da compilare a mano dopo
 * la stampa. Lo stesso disegno si usa a schermo e nel PDF.
 */
export function retroSvg(c: Cartolina, dimensioni = false): string {
  const { carta, righe } = c.retro;
  const misure = dimensioni ? ` width="${LARGHEZZA_PX}" height="${ALTEZZA_PX}"` : '';
  const indirizzo = [560, 680, 800].map((y) => `<line x1="810" y1="${y}" x2="1400" y2="${y}"/>`).join('');
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1500 1000"${misure} preserveAspectRatio="none" aria-hidden="true">`
    + `<rect width="1500" height="1000" fill="${carta}"/>`
    + `<g stroke="${righe}" stroke-width="3" fill="none" stroke-linecap="round">`
    + `<line x1="750" y1="110" x2="750" y2="890"/>${indirizzo}`
    + `<rect x="1170" y="90" width="230" height="290" rx="6" stroke-dasharray="14 10"/>`
    + `</g></svg>`;
}
