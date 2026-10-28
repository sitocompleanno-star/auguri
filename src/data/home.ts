// Dati della home (Fase 1). Le misure sono in "punti mockup": la pagina del PDF e 940 x 1200
// e gli SVG sono disegnati nella stessa scala (vedi --u in global.css).
//
// Altezza extra: su un telefono lo schermo e piu alto del mockup. Ogni elemento ha un `k` (0..1):
// e la quota dello spazio in piu che scende sotto di lui (0 = resta dov'e nel mockup, 1 = scende tutto).

export const zampe = [
  // file: SVG completo (braccio lungo con scritta, servira in Fase 2). w/h: dimensioni del viewBox.
  // top: posizione verticale nel mockup. Nella home si vede solo la parte a destra (152 di larghezza).
  { nome: 'Diario',           file: 'zampa-diario.svg',     w: 352.77, h: 132.48, top: 328, k: 0.08 },
  { nome: 'Archivio',         file: 'zampa-archivio.svg',   w: 352.76, h: 105.12, top: 505, k: 0.3 },
  { nome: 'Luna Park',        file: 'zampa-luna-park.svg',  w: 352.76, h: 134.2,  top: 630, k: 0.52 },
  { nome: 'Club degli Amici', file: 'zampa-club-amici.svg', w: 352.76, h: 132.97, top: 783, k: 0.76 },
  { nome: 'Caos',             file: 'zampa-caos.svg',       w: 351.78, h: 110.79, top: 950, k: 1 },
];
export const zampaVisibile = 152; // larghezza della parte che esce dal bordo sinistro

// Ordine come nel mockup: cuore, fiori, arcobaleno, sole
export const giochi = [
  { file: 'gioco-cuore.svg',      nome: 'Cuore',      w: 107.06, h: 107.35 },
  { file: 'gioco-fiori.svg',      nome: 'Fiori',      w: 107.45, h: 107.76 },
  { file: 'gioco-arcobaleno.svg', nome: 'Arcobaleno', w: 107.55, h: 106.67 },
  { file: 'gioco-sole.svg',       nome: 'Sole',       w: 108.06, h: 107.93 },
];

export const francobolli = {
  totale: 9,
  // Francobolli ottenuti: per ora placeholder in public/placeholders/ (stessa misura dello slot vuoto).
  // In Fase 4 verranno dallo stato in localStorage.
  ottenuti: ['francobollo-1.svg', 'francobollo-2.svg'],
};
