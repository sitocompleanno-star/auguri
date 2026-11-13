// Foto e frase del giorno (Fase 7): scelta deterministica dalla data, senza backend e senza stato.
//
// JavaScript puro e SENZA import: la home lo incolla così com'è in uno script inline (src/pages/index.astro),
// così la foto e la frase sono al loro posto prima che la pagina compaia. Lo usano anche l'Archivio, il build
// (src/lib/contenuti.ts) e le prove (npm run prova-giorno).
//
// Come si sceglie:
// - Le voci (foto o frasi) si mostrano a "giri": all'inizio di un giro si prendono tutte le voci già aggiunte
//   (campo `aggiunta` ≤ quel giorno), si mescolano in un ordine fisso (seme + numero del giro) e se ne mostra
//   una al giorno. Una voce torna solo quando sono uscite tutte le altre.
// - Le voci aggiunte a metà giro aspettano il giro successivo: il giro in corso non cambia.
// - Tra la fine di un giro e l'inizio del successivo non esce mai la stessa voce due giorni di fila.
// - Una voce con `giorno` ("MM-GG" ogni anno, oppure "AAAA-MM-GG" una volta) esce solo quel giorno e non
//   entra nei giri; quel giorno il giro si ferma (riprende il giorno dopo da dove era).
// - Si ripercorrono i giorni da INIZIO a oggi (~365 passi l'anno, pochi decimi di millisecondo).

/** Primo giorno del calcolo. Non cambiarlo: cambierebbe tutta la sequenza. */
export const INIZIO = '2026-11-01';

/** Oggi nel fuso Europe/Rome, "AAAA-MM-GG" (come dataDiOggi() in src/lib/stato.ts). */
export function oggiRoma(d = new Date()) {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Rome', year: 'numeric', month: '2-digit', day: '2-digit' }).format(d);
}

const GIORNO_MS = 86400000;
function numero(data) {
  const [a, m, g] = data.split('-').map(Number);
  return Math.round(Date.UTC(a, m - 1, g) / GIORNO_MS);
}
function data(numeroGiorno) {
  return new Date(numeroGiorno * GIORNO_MS).toISOString().slice(0, 10);
}

/** Hash FNV-1a a 32 bit di una stringa. */
function hash(testo) {
  let h = 0x811c9dc5;
  for (let i = 0; i < testo.length; i++) {
    h ^= testo.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

/** Generatore pseudo-casuale mulberry32: stesso seme, stessa sequenza (su ogni browser). */
function generatore(seme) {
  let t = seme >>> 0;
  return () => {
    t = (t + 0x6d2b79f5) >>> 0;
    let x = t;
    x = Math.imul(x ^ (x >>> 15), x | 1);
    x ^= x + Math.imul(x ^ (x >>> 7), x | 61);
    return ((x ^ (x >>> 14)) >>> 0) / 4294967296;
  };
}

/** Mescolata Fisher-Yates con un ordine fisso dato dal seme. */
function mescola(lista, seme) {
  const a = lista.slice();
  const r = generatore(hash(seme));
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(r() * (i + 1));
    const t = a[i]; a[i] = a[j]; a[j] = t;
  }
  return a;
}

/** La voce riservata a `giorno` ("AAAA-MM-GG"), se c'è: prima quella con l'anno, poi quella che torna ogni anno. */
export function speciale(voci, giorno) {
  return voci.find((v) => v.giorno === giorno) || voci.find((v) => v.giorno === giorno.slice(5)) || null;
}

/**
 * La voce del giorno, oppure null (nessuna voce disponibile quel giorno).
 * @param {{ id: string, aggiunta: string, giorno?: string }[]} voci
 * @param {string} giorno "AAAA-MM-GG" (fuso Europe/Rome)
 * @param {string} seme  diverso per foto e frasi, così le due sequenze sono indipendenti
 */
export function delGiorno(voci, giorno, seme) {
  return sequenza(voci, giorno, giorno, seme)[0]?.voce ?? null;
}

/**
 * Le voci di ogni giorno da `dal` ad `al` (compresi): [{ giorno, voce }] (voce null se non c'era niente).
 * Serve alle prove e, in futuro, a mostrare "uscita il …".
 */
export function sequenza(voci, dal, al, seme) {
  const fine = numero(al);
  const da = numero(dal);
  const risultato = [];
  if (fine < da) return risultato;

  const riservate = new Map();
  for (const v of voci) if (v.giorno && !riservate.has(v.giorno)) riservate.set(v.giorno, v);
  // Ordine di partenza fisso (per id): l'ordine nel file JSON non conta
  const normali = voci.filter((v) => !v.giorno).sort((x, y) => (x.id < y.id ? -1 : x.id > y.id ? 1 : 0));
  const aggiunte = normali.map((v) => numero(v.aggiunta));

  let coda = [];
  let pos = 0;
  let giro = 0;
  let ultima = null;
  for (let n = Math.min(numero(INIZIO), da); n <= fine; n++) {
    const g = data(n);
    const sp = riservate.get(g) || riservate.get(g.slice(5));
    let voce = null;
    if (sp) {
      voce = sp; // il giro si ferma
    } else {
      if (pos >= coda.length) {
        const pronte = normali.filter((_, i) => aggiunte[i] <= n);
        if (pronte.length) {
          giro++;
          coda = mescola(pronte, `${seme}:${giro}`);
          pos = 0;
          // niente doppione a cavallo tra due giri
          if (coda.length > 1 && coda[0] === ultima) {
            const t = coda[0]; coda[0] = coda[coda.length - 1]; coda[coda.length - 1] = t;
          }
        }
      }
      if (pos < coda.length) {
        voce = coda[pos++];
        ultima = voce;
      }
    }
    if (n >= da) risultato.push({ giorno: g, voce });
  }
  return risultato;
}
