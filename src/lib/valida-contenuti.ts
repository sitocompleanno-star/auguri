// Controlli su foto.json e frasi.json (Fase 7). Funzioni pure: le usano il build (src/lib/contenuti.ts),
// gli script `npm run foto` / `npm run frasi` / `npm run contenuti` e le prove.

export interface Foto {
  id: string;        // nome anonimo dei file: public/media/foto/<id>-400.webp, -800.webp, -1600.webp
  w: number;         // misure della versione grande (servono a riservare lo spazio)
  h: number;
  alt: string;       // descrizione per chi non vede la foto (obbligatoria)
  aggiunta: string;  // "AAAA-MM-GG": entra nei giri dal primo giro che inizia da quel giorno
  fuoco?: string;    // facoltativo, punto da tenere quando la foto è tagliata (es. "50% 30%"; default al centro)
  giorno?: string;   // facoltativo, "MM-GG" (ogni anno) o "AAAA-MM-GG": esce solo quel giorno
}

export interface Frase {
  id: string;
  testo: string;
  autore?: string;
  aggiunta: string;
  giorno?: string;
}

/** Misure dei file generati da `npm run foto` (lato lungo, px). */
export const MISURE_FOTO = [400, 800, 1600] as const;
/** Lunghezze massime: con questi limiti la frase sta in 3 righe a 12 px anche a 390 px di larghezza. */
export const MAX_TESTO = 60;
export const MAX_AUTORE = 24;

const DATA = /^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/;
const GIORNO = /^((\d{4})-)?(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/;
const FUOCO = /^\d{1,3}% \d{1,3}%$/;
const ID = /^[a-z0-9-]{4,40}$/;

/** Numero di caratteri "visibili" (un'emoji conta 1). */
export const lunghezza = (s: string) => [...s].length;

function comuni(tipo: string, v: Record<string, unknown>, i: number, errori: string[], visti: Set<string>) {
  const dove = `${tipo} n. ${i + 1}${typeof v.id === 'string' ? ` (id "${v.id}")` : ''}`;
  if (typeof v.id !== 'string' || !ID.test(v.id)) errori.push(`${dove}: manca "id" o non è valido (lettere minuscole, numeri, trattini)`);
  else if (visti.has(v.id)) errori.push(`${dove}: "id" ripetuto`);
  else visti.add(v.id);
  if (typeof v.aggiunta !== 'string' || !DATA.test(v.aggiunta)) errori.push(`${dove}: manca "aggiunta" ("AAAA-MM-GG"); lancia npm run frasi o npm run foto per completarla`);
  if (v.giorno !== undefined && (typeof v.giorno !== 'string' || !GIORNO.test(v.giorno))) errori.push(`${dove}: "giorno" deve essere "MM-GG" o "AAAA-MM-GG"`);
  return dove;
}

function giorniDoppi(tipo: string, voci: { giorno?: string }[], errori: string[]) {
  const visti = new Set<string>();
  for (const v of voci) {
    if (!v.giorno) continue;
    if (visti.has(v.giorno)) errori.push(`${tipo}: due voci per il giorno speciale ${v.giorno}`);
    visti.add(v.giorno);
  }
}

export function validaFoto(dati: unknown): string[] {
  const errori: string[] = [];
  if (!Array.isArray(dati)) return ['foto.json deve essere un elenco [ … ]'];
  const visti = new Set<string>();
  dati.forEach((v, i) => {
    const dove = comuni('Foto', v, i, errori, visti);
    if (!(Number.isInteger(v.w) && v.w > 0 && Number.isInteger(v.h) && v.h > 0)) errori.push(`${dove}: "w" e "h" devono essere le misure in pixel`);
    if (typeof v.alt !== 'string' || v.alt.trim().length < 3) errori.push(`${dove}: manca la descrizione "alt"`);
    if (v.fuoco !== undefined && (typeof v.fuoco !== 'string' || !FUOCO.test(v.fuoco))) errori.push(`${dove}: "fuoco" deve essere come "50% 30%"`);
  });
  giorniDoppi('Foto', dati, errori);
  return errori;
}

export function validaFrasi(dati: unknown): string[] {
  const errori: string[] = [];
  if (!Array.isArray(dati)) return ['frasi.json deve essere un elenco [ … ]'];
  const visti = new Set<string>();
  dati.forEach((v, i) => {
    const dove = comuni('Frase', v, i, errori, visti);
    if (typeof v.testo !== 'string' || !v.testo.trim()) errori.push(`${dove}: manca "testo"`);
    else {
      if (lunghezza(v.testo) > MAX_TESTO) errori.push(`${dove}: troppo lunga (${lunghezza(v.testo)} caratteri, massimo ${MAX_TESTO}): "${v.testo}"`);
      if (/[\r\n]/.test(v.testo)) errori.push(`${dove}: niente "a capo" nel testo`);
    }
    if (v.autore !== undefined && (typeof v.autore !== 'string' || lunghezza(v.autore) > MAX_AUTORE)) errori.push(`${dove}: "autore" al massimo ${MAX_AUTORE} caratteri`);
  });
  giorniDoppi('Frasi', dati, errori);
  return errori;
}
