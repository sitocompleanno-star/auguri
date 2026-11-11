// Calendario del Diario (Fase 4). Funzioni pure sulle date "AAAA-MM-GG", usabili al build e nel browser.
// Le date sono stringhe di calendario, senza ora: si calcolano in UTC così il fuso del dispositivo non sposta
// mai un giorno. "Oggi" arriva sempre da `dataDiOggi()` (Europe/Rome, in stato.ts).

export const MESI = [
  'gennaio', 'febbraio', 'marzo', 'aprile', 'maggio', 'giugno',
  'luglio', 'agosto', 'settembre', 'ottobre', 'novembre', 'dicembre',
];
/** Iniziali dei giorni (settimana che inizia di lunedì) e nomi completi per gli screen reader. */
export const GIORNI_BREVI = ['L', 'M', 'M', 'G', 'V', 'S', 'D'];
export const GIORNI = ['lunedì', 'martedì', 'mercoledì', 'giovedì', 'venerdì', 'sabato', 'domenica'];

/** Righe fisse della griglia di un mese: con la settimana da lunedì alcuni mesi ne occupano 6. */
export const RIGHE = 6;

const due = (n: number) => String(n).padStart(2, '0');

export function data(anno: number, mese: number, giorno: number): string {
  // mese: 1..12
  return `${anno}-${due(mese)}-${due(giorno)}`;
}

export function parti(d: string): { anno: number; mese: number; giorno: number } {
  const [anno, mese, giorno] = d.split('-').map(Number);
  return { anno, mese, giorno };
}

export function giorniNelMese(anno: number, mese: number): number {
  return new Date(Date.UTC(anno, mese, 0)).getUTCDate();
}

/** 0 = lunedì … 6 = domenica */
export function giornoSettimana(d: string): number {
  const { anno, mese, giorno } = parti(d);
  return (new Date(Date.UTC(anno, mese - 1, giorno)).getUTCDay() + 6) % 7;
}

/** Sposta una data di `n` giorni (anche negativi). */
export function aggiungiGiorni(d: string, n: number): string {
  const { anno, mese, giorno } = parti(d);
  const x = new Date(Date.UTC(anno, mese - 1, giorno + n));
  return data(x.getUTCFullYear(), x.getUTCMonth() + 1, x.getUTCDate());
}

/** Stesso giorno nel mese precedente/successivo (se non esiste, l'ultimo giorno di quel mese). */
export function aggiungiMesi(d: string, n: number): string {
  const { anno, mese, giorno } = parti(d);
  const t = anno * 12 + (mese - 1) + n;
  const a = Math.floor(t / 12), m = (t % 12) + 1;
  return data(a, m, Math.min(giorno, giorniNelMese(a, m)));
}

/**
 * Le 42 caselle (6 righe x 7) di un mese: la data, oppure null per le caselle fuori dal mese.
 */
export function caselleMese(anno: number, mese: number): (string | null)[] {
  const primo = giornoSettimana(data(anno, mese, 1));
  const n = giorniNelMese(anno, mese);
  return Array.from({ length: RIGHE * 7 }, (_, i) => {
    const g = i - primo + 1;
    return g >= 1 && g <= n ? data(anno, mese, g) : null;
  });
}

/** "12 novembre" (con l'anno se `conAnno`). Il primo del mese: "1º novembre". */
export function dataLeggibile(d: string, conAnno = false): string {
  const { anno, mese, giorno } = parti(d);
  return `${giorno === 1 ? '1º' : giorno} ${MESI[mese - 1]}${conAnno ? ` ${anno}` : ''}`;
}

export const maiuscola = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
