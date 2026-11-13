// Memory (Fase 8): logica della partita, con funzioni pure (nessun DOM), usabili nel browser e nelle prove.
//
// Una partita è un mazzo di 2 x `coppie` carte mescolate. Si girano due carte alla volta:
//  - uguali → restano scoperte ("trovate");
//  - diverse → restano scoperte finché si chiama `copri` (dopo un'attesa, o subito se si tocca un'altra carta).
// Una "mossa" = una coppia di carte girate (giusta o sbagliata). Vittoria = tutte le coppie trovate.

export interface Partita {
  carte: string[];        // id del simbolo di ogni carta, in ordine di griglia (riga per riga)
  trovate: boolean[];
  scoperte: number[];     // indici delle carte girate e non ancora trovate (0, 1 o 2)
  mosse: number;
  coppieTrovate: number;
  coppie: number;
}

export type Esito =
  | { tipo: 'niente' }                                  // tocco ignorato (carta già scoperta o trovata)
  | { tipo: 'prima'; carta: number }                     // prima carta di una coppia
  | { tipo: 'coppia'; carte: [number, number]; vinto: boolean }
  | { tipo: 'sbagliata'; carte: [number, number] };

/** Numero casuale in [0, 1): crittografico se possibile (mescolata imprevedibile), altrimenti Math.random. */
export function casuale(): number {
  try {
    const a = new Uint32Array(1);
    crypto.getRandomValues(a);
    return a[0] / 2 ** 32;
  } catch {
    return Math.random();
  }
}

/** Mescola (Fisher-Yates) restituendo un array nuovo. */
export function mescola<T>(lista: readonly T[], rnd: () => number = casuale): T[] {
  const a = [...lista];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** Nuova partita: sceglie a caso `coppie` simboli tra quelli dati e li mette due volte in ordine casuale. */
export function nuovaPartita(simboli: readonly string[], coppie: number, rnd: () => number = casuale): Partita {
  if (coppie < 1 || coppie > simboli.length) throw new Error(`Coppie non valide: ${coppie}`);
  const scelti = mescola(simboli, rnd).slice(0, coppie);
  const carte = mescola([...scelti, ...scelti], rnd);
  return { carte, trovate: carte.map(() => false), scoperte: [], mosse: 0, coppieTrovate: 0, coppie };
}

/** Rigira le due carte sbagliate rimaste scoperte (se ci sono). */
export function copri(p: Partita): Partita {
  return p.scoperte.length === 2 ? { ...p, scoperte: [] } : p;
}

/**
 * Gira la carta `i`. Se ci sono ancora due carte sbagliate scoperte, prima si rigirano (così un tocco veloce
 * non deve aspettare). Restituisce la partita nuova e cosa è successo.
 */
export function gira(partita: Partita, i: number): { partita: Partita; esito: Esito } {
  let p = copri(partita);
  if (i < 0 || i >= p.carte.length || p.trovate[i] || p.scoperte.includes(i)) return { partita: p, esito: { tipo: 'niente' } };
  if (p.scoperte.length === 0) {
    p = { ...p, scoperte: [i] };
    return { partita: p, esito: { tipo: 'prima', carta: i } };
  }
  const j = p.scoperte[0];
  const mosse = p.mosse + 1;
  if (p.carte[j] === p.carte[i]) {
    const trovate = [...p.trovate];
    trovate[i] = trovate[j] = true;
    const coppieTrovate = p.coppieTrovate + 1;
    p = { ...p, trovate, scoperte: [], mosse, coppieTrovate };
    return { partita: p, esito: { tipo: 'coppia', carte: [j, i], vinto: coppieTrovate === p.coppie } };
  }
  p = { ...p, scoperte: [j, i], mosse };
  return { partita: p, esito: { tipo: 'sbagliata', carte: [j, i] } };
}

/** Stato di una carta per il disegno. */
export function statoCarta(p: Partita, i: number): 'coperta' | 'scoperta' | 'trovata' {
  if (p.trovate[i]) return 'trovata';
  return p.scoperte.includes(i) ? 'scoperta' : 'coperta';
}

export const vinta = (p: Partita) => p.coppieTrovate === p.coppie;

/**
 * Spostamento con le frecce in una griglia di `n` celle e `colonne` colonne (l'ultima riga può essere più corta).
 * Restituisce il nuovo indice (o lo stesso se si è al bordo).
 */
export function muovi(i: number, tasto: string, n: number, colonne: number, ctrl = false): number {
  const riga = Math.floor(i / colonne);
  const inizioRiga = riga * colonne;
  const fineRiga = Math.min(n - 1, inizioRiga + colonne - 1);
  switch (tasto) {
    case 'ArrowRight': return Math.min(fineRiga, i + 1);
    case 'ArrowLeft': return Math.max(inizioRiga, i - 1);
    case 'ArrowDown': return i + colonne < n ? i + colonne : i;
    case 'ArrowUp': return i - colonne >= 0 ? i - colonne : i;
    case 'Home': return ctrl ? 0 : inizioRiga;
    case 'End': return ctrl ? n - 1 : fineRiga;
    default: return i;
  }
}
