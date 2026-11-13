// Ruota delle emozioni (Fase 3) · PROVVISORIA, da confermare.
// Famiglie ed emozioni intermedie dal mockup Diario.pdf (Felice, Triste, Sorpresa, Arrabbiata, Disgustata,
// Impaurita; Felice → Orgogliosa → Realizzata/Fiduciosa), completate seguendo la ruota delle emozioni di
// G. Roberts: 6 famiglie → 36 emozioni intermedie (da 4 a 8 per famiglia) → 2 emozioni di ultimo livello
// ciascuna (72 in tutto). Nel Diario (Fase 4) si sceglie in 3 passi, ma nello stato si salva
// solo l'emozione di ultimo livello; ognuna ha il suo francobollo.
//
// Regole (controllate al build da `verificaRuota()`, che blocca la build se qualcosa non torna):
//  - gli `id` delle emozioni di ultimo livello sono unici e NON vanno cambiati dopo l'uso: sono salvati nello
//    stato (localStorage). Per rinominare un'emozione si cambia `nome`, non `id`.
//  - dentro una famiglia le iniziali sono tutte diverse: simbolo (famiglia) + iniziale (emozione) bastano a
//    riconoscere un francobollo anche senza colore.
//  - contrasti: inchiostro su sfumatura >= 4,5:1 (testo), colore della famiglia su sfumatura e su bianco >= 3:1.
//
// Colori: `colore` (tono scuro della famiglia: bordo del francobollo e simbolo) e una `sfumatura` per ogni
// emozione intermedia, dalla più chiara alla più scura. Le emozioni di ultimo livello prendono la sfumatura
// della loro emozione intermedia. Valori calcolati in OKLCH (stessa luminosità per tutte le famiglie).

export type SimboloId = 'sole' | 'goccia' | 'stella' | 'fulmine' | 'spirale' | 'nuvola' | 'cuore';

/** Colore del testo e delle iniziali sui francobolli (come --inchiostro in global.css). */
export const INCHIOSTRO = '#221f20';

export interface Emozione {
  id: string;           // es. "realizzata"
  nome: string;         // es. "Realizzata"
  famiglia: string;     // id della famiglia, es. "felice"
  intermedia: string;   // id dell'emozione intermedia, es. "felice-orgogliosa"
  iniziale: string;     // es. "R"
  simbolo: SimboloId;   // per ora quello della famiglia; si può dare un simbolo proprio a ogni emozione
  sfumatura: string;    // colore di fondo del francobollo
  colore: string;       // colore della famiglia (bordo e simbolo)
  francobollo: string;  // nome file dell'SVG, uguale per placeholder e definitivo
  gioco?: string;       // (Fase 8) solo per i francobolli speciali: nome del gioco che lo fa vincere
}

export interface EmozioneIntermedia {
  id: string;
  nome: string;
  famiglia: string;
  sfumatura: string;
  emozioni: Emozione[];
}

export interface Famiglia {
  id: string;
  nome: string;
  simbolo: SimboloId;
  colore: string;
  emozioni: EmozioneIntermedia[];
}

// ---------------------------------------------------------------------------------------------------------
// Dati da modificare: [nome intermedia, [nome ultimo livello, nome ultimo livello]]
// ---------------------------------------------------------------------------------------------------------
interface FamigliaGrezza {
  id: string;
  nome: string;
  simbolo: SimboloId;
  colore: string;
  sfumature: string[];
  emozioni: [string, [string, string]][];
}
// (le sfumature devono essere tante quante le emozioni intermedie)

const RUOTA: FamigliaGrezza[] = [
  {
    // famiglie ed emozioni intermedie come nel mockup Diario.pdf
    id: 'felice', nome: 'Felice', simbolo: 'sole',
    colore: '#5f4202',
    sfumature: ['#fae1b7', '#f3d7a9', '#eccd9a', '#e5c38b', '#deba7d', '#d7b06e', '#d0a65f', '#c89d4f'],
    emozioni: [
      ['Orgogliosa', ['Realizzata', 'Fiduciosa']],
      ['Potente', ['Coraggiosa', 'Energica']],
      ['Tranquilla', ['Amorevole', 'Grata']],
      ['Ottimista', ['Speranzosa', 'Ispirata']],
      ['Gioiosa', ['Libera', 'Divertita']],
      ['Intima', ['Tenera', 'Vicina']],
      ['Interessata', ['Partecipe', 'Motivata']],
      ['Accettata', ['Onorata', 'Benvenuta']],
    ],
  },
  {
    id: 'triste', nome: 'Triste', simbolo: 'goccia',
    colore: '#234877',
    sfumature: ['#d4e6fe', '#c1dafb', '#b1cdf2', '#a1c0e9', '#91b4e0', '#82a7d8'],
    emozioni: [
      ['Sola', ['Isolata', 'Abbandonata']],
      ['Vulnerabile', ['Fragile', 'Esposta']],
      ['Disperata', ['Sconfortata', 'Persa']],
      ['In colpa', ['Vergognosa', 'Rammaricata']],
      ['Abbattuta', ['Grigia', 'Mogia']],
      ['Ferita', ['Delusa', 'Umiliata']],
    ],
  },
  {
    id: 'sorpresa', nome: 'Sorpresa', simbolo: 'stella',
    colore: '#553b68',
    sfumature: ['#eddefa', '#d9c6e9', '#c6afd8', '#b398c7'],
    emozioni: [
      ['Colpita', ['Scioccata', 'Turbata']],
      ['Confusa', ['Disorientata', 'Perplessa']],
      ['Stupita', ['Meravigliata', 'Incantata']],
      ['Emozionata', ['Entusiasta', 'Carica']],
    ],
  },
  {
    id: 'arrabbiata', nome: 'Arrabbiata', simbolo: 'fulmine',
    colore: '#7c271c',
    sfumature: ['#fedcd5', '#fecec6', '#fec1b6', '#f9b5a9', '#f3aa9e', '#ed9f92', '#e79587', '#e18a7b'],
    emozioni: [
      ['Delusa', ['Tradita', 'Risentita']],
      ['Mortificata', ['Sminuita', 'Calpestata']],
      ['Amareggiata', ['Indignata', 'Violata']],
      ['Furiosa', ['Furente', 'Gelosa']],
      ['Aggressiva', ['Provocata', 'Ostile']],
      ['Frustrata', ['Esasperata', 'Nervosa']],
      ['Distante', ['Assente', 'Muta']],
      ['Critica', ['Diffidente', 'Beffarda']],
    ],
  },
  {
    id: 'disgustata', nome: 'Disgustata', simbolo: 'spirale',
    colore: '#235430',
    sfumature: ['#d2edd7', '#b8d9bd', '#9ec5a5', '#84b28d'],
    emozioni: [
      ['Contrariata', ['Giudicante', 'Imbarazzata']],
      ['Sconcertata', ['Allibita', 'Ripugnata']],
      ['Nauseata', ['Schifata', 'Odiosa']],
      ['Respinta', ['Esitante', 'Pietrificata']],
    ],
  },
  {
    id: 'impaurita', nome: 'Impaurita', simbolo: 'nuvola',
    colore: '#015259',
    sfumature: ['#c6edf2', '#b4e1e6', '#a2d5db', '#90c9d0', '#7dbec5', '#6bb2ba'],
    emozioni: [
      ['Spaventata', ['Atterrita', 'Terrorizzata']],
      ['Ansiosa', ['Sopraffatta', 'Preoccupata']],
      ['Insicura', ['Inadeguata', 'Dubbiosa']],
      ['Debole', ['Fiacca', 'Bloccata']],
      ['Rifiutata', ['Esclusa', 'Vessata']],
      ['Minacciata', ['Guardinga', 'Circospetta']],
    ],
  },
];

// ---------------------------------------------------------------------------------------------------------
// Struttura derivata (non modificare a mano)
// ---------------------------------------------------------------------------------------------------------
export function slug(testo: string): string {
  return testo
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

export const famiglie: Famiglia[] = RUOTA.map((f) => ({
  id: f.id,
  nome: f.nome,
  simbolo: f.simbolo,
  colore: f.colore,
  emozioni: f.emozioni.map(([nomeIntermedia, foglie], i) => {
    const idIntermedia = `${f.id}-${slug(nomeIntermedia)}`;
    const sfumatura = f.sfumature[i] ?? f.sfumature[f.sfumature.length - 1];
    return {
      id: idIntermedia,
      nome: nomeIntermedia,
      famiglia: f.id,
      sfumatura,
      emozioni: foglie.map((nome) => {
        const id = slug(nome);
        return {
          id,
          nome,
          famiglia: f.id,
          intermedia: idIntermedia,
          iniziale: nome.charAt(0).toUpperCase(),
          simbolo: f.simbolo,
          sfumatura,
          colore: f.colore,
          francobollo: `${id}.svg`,
        };
      }),
    };
  }),
}));

/** Tutte le emozioni di ultimo livello, nell'ordine della ruota (è anche l'ordine della griglia dei francobolli). */
export const emozioni: Emozione[] = famiglie.flatMap((f) => f.emozioni.flatMap((m) => m.emozioni));

// ---------------------------------------------------------------------------------------------------------
// Francobolli speciali (Fase 8): si vincono nei giochi, non stanno nella ruota e non si scelgono nel Diario.
// Hanno la stessa forma delle emozioni (simbolo + iniziale, riconoscibili anche senza colore), così griglia,
// preferiti, cartoline e striscia della home li trattano come gli altri. Nello stato stanno in `premi`.
// Come per le emozioni, l'`id` è salvato nello stato: non va cambiato dopo l'uso.
// ---------------------------------------------------------------------------------------------------------
export const FAMIGLIA_GIOCHI = 'giochi';
export const speciali: Emozione[] = [
  {
    id: 'memory', nome: 'Memory', famiglia: FAMIGLIA_GIOCHI, intermedia: '', iniziale: 'M', simbolo: 'cuore',
    sfumatura: '#f7dcce', colore: '#6f211c', francobollo: 'memory.svg', gioco: 'Memory',
  },
];

/** Tutti i francobolli: prima la ruota, poi gli speciali (è l'ordine dei segnaposto e il totale della griglia). */
export const tuttiFrancobolli: Emozione[] = [...emozioni, ...speciali];

const perId = new Map(tuttiFrancobolli.map((e) => [e.id, e]));
/** Emozione della ruota o francobollo speciale (Fase 8) con questo id. */
export function emozione(id: string): Emozione | undefined {
  return perId.get(id);
}
export const speciale = (id: string): boolean => !!perId.get(id)?.gioco;
export function famiglia(id: string): Famiglia | undefined {
  return famiglie.find((f) => f.id === id);
}
export function intermedia(id: string): EmozioneIntermedia | undefined {
  for (const f of famiglie) for (const m of f.emozioni) if (m.id === id) return m;
  return undefined;
}

// ---------------------------------------------------------------------------------------------------------
// Controlli (usati al build)
// ---------------------------------------------------------------------------------------------------------
function luminanza(hex: string): number {
  const [r, g, b] = [1, 3, 5]
    .map((i) => parseInt(hex.slice(i, i + 2), 16) / 255)
    .map((c) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}
export function contrasto(a: string, b: string): number {
  const [x, y] = [luminanza(a), luminanza(b)].sort((p, q) => q - p);
  return (x + 0.05) / (y + 0.05);
}

/** Restituisce l'elenco dei problemi (vuoto se è tutto a posto). */
export function verificaRuota(): string[] {
  const problemi: string[] = [];
  const visti = new Set<string>();
  for (const f of famiglie) {
    const iniziali = new Map<string, string>();
    const grezza = RUOTA.find((r) => r.id === f.id)!;
    if (grezza.sfumature.length !== f.emozioni.length) problemi.push(`${f.nome}: servono ${f.emozioni.length} sfumature`);
    if (contrasto(f.colore, '#ffffff') < 3) problemi.push(`${f.nome}: colore poco contrastato sul bianco`);
    for (const m of f.emozioni) {
      if (contrasto(INCHIOSTRO, m.sfumatura) < 4.5) problemi.push(`${m.nome}: iniziale poco leggibile sulla sfumatura`);
      if (contrasto(f.colore, m.sfumatura) < 3) problemi.push(`${m.nome}: simbolo poco contrastato sulla sfumatura`);
      for (const e of m.emozioni) {
        if (visti.has(e.id)) problemi.push(`id ripetuto: ${e.id}`);
        visti.add(e.id);
        const altra = iniziali.get(e.iniziale);
        if (altra) problemi.push(`${f.nome}: ${altra} e ${e.nome} hanno la stessa iniziale (${e.iniziale})`);
        iniziali.set(e.iniziale, e.nome);
      }
    }
  }
  const iniziali = new Set<string>();
  for (const e of speciali) {
    if (visti.has(e.id)) problemi.push(`id ripetuto: ${e.id}`);
    visti.add(e.id);
    if (iniziali.has(e.iniziale)) problemi.push(`francobolli speciali: iniziale ripetuta (${e.iniziale})`);
    iniziali.add(e.iniziale);
    if (contrasto(INCHIOSTRO, e.sfumatura) < 4.5) problemi.push(`${e.nome}: iniziale poco leggibile`);
    if (contrasto(e.colore, e.sfumatura) < 3) problemi.push(`${e.nome}: simbolo poco contrastato`);
  }
  return problemi;
}
