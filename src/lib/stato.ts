// Stato dell'utente (Fase 3), salvato in localStorage come UN unico oggetto JSON.
//
//   {
//     versione: 1,
//     giorni: { "AAAA-MM-GG": { emozione: "realizzata" | null, modificato: "2026-11-11T18:00:00.000Z" } },
//     preferiti: ["realizzata", ...],          // max 9, francobolli mostrati nella striscia della home
//     preferitiModificato: "2026-...Z",        // serve all'unione tra dispositivi (Fase 6)
//     cartoline: {                             // Fase 5
//       fiore: { francobolli: [{ id: "realizzata", x: 0.8, y: 0.2, r: -6 }], modificato: "2026-...Z" }
//     }
//   }
//
// - `emozione: null` = giorno cancellato. Si tiene la voce (con la sua data di modifica) invece di toglierla,
//   così in Fase 6, unendo due dispositivi, la cancellazione "vince" se è più recente.
// - I francobolli sbloccati NON si salvano: si calcolano dai giorni (`sbloccati`).
// - Le funzioni sul dato sono pure (prendono uno stato e ne restituiscono uno nuovo); solo `leggi`/`scrivi`
//   toccano localStorage, sempre dentro try/catch (può essere bloccato, es. Safari in privato o cookie off).
//   Se non si può salvare, il sito continua a funzionare con una copia in memoria (`persistente()` = false).
// - Cartoline (Fase 5): la chiave è l'id della cartolina (`src/data/cartoline.ts`), così se ne possono aggiungere
//   altre. Ogni francobollo attaccato ha il centro (x, y) in FRAZIONI della cartolina (0-1, indipendenti dallo
//   schermo e dalla stampa) e la rotazione r in gradi. Un francobollo che non è più sbloccato (giorno cambiato
//   nel Diario) viene tolto dalla cartolina (`pulisciCartoline`, chiamata da `impostaGiorno` e `unisci`).

export const VERSIONE = 1;
export const CHIAVE = 'minuscole:stato';
export const MAX_PREFERITI = 9;
/** Francobolli al massimo su una cartolina (deciso: uno solo). Se cambia, gli stati salvati restano validi. */
export const MAX_FRANCOBOLLI_CARTOLINA = 1;
/** Evento lanciato su window quando lo stato cambia (anche da un'altra scheda). */
export const EVENTO = 'minuscole:stato';

export interface Giorno {
  emozione: string | null;
  modificato: string; // ISO 8601 (UTC)
}

export interface FrancobolloAttaccato {
  id: string; // id dell'emozione
  x: number;  // centro, frazione della larghezza della cartolina (0-1)
  y: number;  // centro, frazione dell'altezza (0-1)
  r: number;  // rotazione in gradi (-180, 180]
}

export interface Cartolina {
  francobolli: FrancobolloAttaccato[]; // in ordine di aggiunta (l'ultimo è disegnato sopra)
  modificato: string;                  // ISO: vince la più recente nell'unione (Fase 6)
}

export interface Stato {
  versione: number;
  giorni: Record<string, Giorno>;
  preferiti: string[];
  preferitiModificato: string;
  cartoline: Record<string, Cartolina>;
}

const DATA = /^\d{4}-\d{2}-\d{2}$/;
const ID_CARTOLINA = /^[a-z0-9-]{1,40}$/;
const ZERO = '1970-01-01T00:00:00.000Z';

export function statoVuoto(): Stato {
  return { versione: VERSIONE, giorni: {}, preferiti: [], preferitiModificato: ZERO, cartoline: {} };
}

function isoValida(v: unknown): v is string {
  return typeof v === 'string' && !Number.isNaN(Date.parse(v));
}

/**
 * Porta qualunque valore letto (anche rovinato o di una versione vecchia) a uno `Stato` valido.
 * Non butta via emozioni sconosciute: se la ruota cambia, i giorni salvati restano.
 */
export function migra(grezzo: unknown): Stato {
  const s = statoVuoto();
  if (!grezzo || typeof grezzo !== 'object') return s;
  const g = grezzo as Record<string, unknown>;
  // (versione 1 è la prima: qui andranno i passaggi da una versione alla successiva)

  if (g.giorni && typeof g.giorni === 'object') {
    for (const [data, v] of Object.entries(g.giorni as Record<string, unknown>)) {
      if (!DATA.test(data) || !v || typeof v !== 'object') continue;
      const { emozione, modificato } = v as Record<string, unknown>;
      if (emozione !== null && typeof emozione !== 'string') continue;
      s.giorni[data] = { emozione, modificato: isoValida(modificato) ? modificato : ZERO };
    }
  }
  if (Array.isArray(g.preferiti)) {
    s.preferiti = [...new Set(g.preferiti.filter((x): x is string => typeof x === 'string'))].slice(0, MAX_PREFERITI);
  }
  if (isoValida(g.preferitiModificato)) s.preferitiModificato = g.preferitiModificato;
  // Fase 3-4 salvavano `cartoline: {}`: è compatibile, quindi la versione resta 1.
  if (g.cartoline && typeof g.cartoline === 'object' && !Array.isArray(g.cartoline)) {
    for (const [id, v] of Object.entries(g.cartoline as Record<string, unknown>)) {
      const c = cartolinaValida(v);
      if (ID_CARTOLINA.test(id) && c) s.cartoline[id] = c;
    }
  }
  return s;
}

const numero = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v);
const tra01 = (v: number) => Math.min(1, Math.max(0, v));
/** Rotazione in (-180, 180], arrotondata al decimo di grado. */
export function normalizzaRotazione(r: number): number {
  let x = ((r % 360) + 360) % 360;
  if (x > 180) x -= 360;
  return Math.round(x * 10) / 10;
}

function cartolinaValida(v: unknown): Cartolina | null {
  if (!v || typeof v !== 'object') return null;
  const { francobolli, modificato } = v as Record<string, unknown>;
  const lista: FrancobolloAttaccato[] = [];
  if (Array.isArray(francobolli)) {
    for (const f of francobolli) {
      if (!f || typeof f !== 'object') continue;
      const { id, x, y, r } = f as Record<string, unknown>;
      if (typeof id !== 'string' || !numero(x) || !numero(y)) continue;
      const pulito = { id, x: tra01(x), y: tra01(y), r: normalizzaRotazione(numero(r) ? r : 0) };
      const i = lista.findIndex((a) => a.id === id); // un francobollo compare una volta sola
      if (i >= 0) lista.splice(i, 1);
      lista.push(pulito);
    }
  }
  return { francobolli: lista.slice(-MAX_FRANCOBOLLI_CARTOLINA), modificato: isoValida(modificato) ? modificato : ZERO };
}

// ---------------------------------------------------------------------------------------------------------
// Funzioni pure sullo stato
// ---------------------------------------------------------------------------------------------------------
const adesso = () => new Date().toISOString();

/** Imposta (o cambia) l'emozione di un giorno. `emozione: null` lo cancella. */
export function impostaGiorno(s: Stato, data: string, emozione: string | null, quando = adesso()): Stato {
  if (!DATA.test(data)) throw new Error(`Data non valida: ${data}`);
  // se il cambio fa "sparire" un francobollo, lo si toglie anche dalle cartoline
  return pulisciCartoline({ ...s, giorni: { ...s.giorni, [data]: { emozione, modificato: quando } } }, quando);
}

/** Emozioni sbloccate (id), con il primo giorno in cui sono comparse. Ordine: dalla più vecchia. */
export function sbloccati(s: Stato): Map<string, string> {
  const m = new Map<string, string>();
  for (const data of Object.keys(s.giorni).sort()) {
    const e = s.giorni[data].emozione;
    if (e && !m.has(e)) m.set(e, data);
  }
  return m;
}

/** Quante volte è stata scelta ogni emozione. */
export function conteggi(s: Stato): Map<string, number> {
  const m = new Map<string, number>();
  for (const { emozione } of Object.values(s.giorni)) if (emozione) m.set(emozione, (m.get(emozione) ?? 0) + 1);
  return m;
}

/** Preferiti validi: solo francobolli ancora sbloccati (se un giorno cambia, un preferito può "sparire"). */
export function preferitiValidi(s: Stato): string[] {
  const ok = sbloccati(s);
  return s.preferiti.filter((id) => ok.has(id)).slice(0, MAX_PREFERITI);
}

/** Aggiunge o toglie un preferito. Se sono già 9 (validi) non aggiunge e restituisce lo stato invariato. */
export function alternaPreferito(s: Stato, id: string, quando = adesso()): Stato {
  const attuali = preferitiValidi(s);
  let nuovi: string[];
  if (attuali.includes(id)) nuovi = attuali.filter((x) => x !== id);
  else if (attuali.length >= MAX_PREFERITI || !sbloccati(s).has(id)) return s;
  else nuovi = [...attuali, id];
  return { ...s, preferiti: nuovi, preferitiModificato: quando };
}

// ---- Cartoline (Fase 5) ----

/** Cartolina salvata, o una vuota se non è mai stata toccata. */
export function cartolina(s: Stato, id: string): Cartolina {
  return s.cartoline[id] ?? { francobolli: [], modificato: ZERO };
}

function conCartolina(s: Stato, id: string, francobolli: FrancobolloAttaccato[], quando: string): Stato {
  if (!ID_CARTOLINA.test(id)) throw new Error(`Cartolina non valida: ${id}`);
  return { ...s, cartoline: { ...s.cartoline, [id]: { francobolli, modificato: quando } } };
}

/**
 * Attacca un francobollo sbloccato (o lo sposta/ruota se è già sulla cartolina). Se la cartolina è piena,
 * il nuovo prende il posto del più vecchio. Restituisce lo stato invariato se il francobollo non è sbloccato.
 */
export function attaccaFrancobollo(s: Stato, idCartolina: string, f: FrancobolloAttaccato, quando = adesso()): Stato {
  if (!sbloccati(s).has(f.id)) return s;
  const nuovo = { id: f.id, x: tra01(f.x), y: tra01(f.y), r: normalizzaRotazione(f.r) };
  const lista = [...cartolina(s, idCartolina).francobolli];
  const i = lista.findIndex((a) => a.id === f.id);
  if (i >= 0) lista[i] = nuovo; // spostato: resta al suo posto nell'ordine
  else lista.push(nuovo);
  return conCartolina(s, idCartolina, lista.slice(-MAX_FRANCOBOLLI_CARTOLINA), quando);
}

/** Toglie un francobollo dalla cartolina. */
export function togliFrancobollo(s: Stato, idCartolina: string, id: string, quando = adesso()): Stato {
  const lista = cartolina(s, idCartolina).francobolli;
  if (!lista.some((a) => a.id === id)) return s;
  return conCartolina(s, idCartolina, lista.filter((a) => a.id !== id), quando);
}

/**
 * Toglie dalle cartoline i francobolli non più sbloccati. Le cartoline cambiate prendono `quando` come data di
 * modifica; con `quando` = null la data resta quella vecchia (pulizia "tecnica", es. dopo un'unione).
 */
export function pulisciCartoline(s: Stato, quando: string | null = null): Stato {
  const ok = sbloccati(s);
  let cambiato = false;
  const cartoline: Record<string, Cartolina> = {};
  for (const [id, c] of Object.entries(s.cartoline)) {
    const tenuti = c.francobolli.filter((f) => ok.has(f.id));
    if (tenuti.length === c.francobolli.length) cartoline[id] = c;
    else {
      cambiato = true;
      cartoline[id] = { francobolli: tenuti, modificato: quando ?? c.modificato };
    }
  }
  return cambiato ? { ...s, cartoline } : s;
}

/**
 * Unisce due stati (Fase 6, sincronizzazione): giorno per giorno vince la modifica più recente;
 * per i preferiti vince la lista modificata più di recente; per ogni cartolina vince quella modificata più di
 * recente (a parità, quella di `a`). Alla fine si tolgono i francobolli non più sbloccati con i giorni uniti.
 */
export function unisci(a: Stato, b: Stato): Stato {
  const giorni: Record<string, Giorno> = { ...a.giorni };
  for (const [data, g] of Object.entries(b.giorni)) {
    const x = giorni[data];
    if (!x || Date.parse(g.modificato) > Date.parse(x.modificato)) giorni[data] = g;
  }
  const recente = Date.parse(b.preferitiModificato) > Date.parse(a.preferitiModificato) ? b : a;
  const cartoline: Record<string, Cartolina> = { ...a.cartoline };
  for (const [id, c] of Object.entries(b.cartoline)) {
    const x = cartoline[id];
    if (!x || Date.parse(c.modificato) > Date.parse(x.modificato)) cartoline[id] = c;
  }
  return pulisciCartoline({
    versione: VERSIONE,
    giorni,
    preferiti: [...recente.preferiti],
    preferitiModificato: recente.preferitiModificato,
    cartoline,
  });
}

/** Data di oggi "AAAA-MM-GG" nel fuso Europe/Rome (non quello del dispositivo). */
export function dataDiOggi(d = new Date()): string {
  // en-CA formatta come AAAA-MM-GG
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Rome', year: 'numeric', month: '2-digit', day: '2-digit' }).format(d);
}

// ---------------------------------------------------------------------------------------------------------
// Lettura e scrittura (solo nel browser)
// ---------------------------------------------------------------------------------------------------------
let memoria: Stato | null = null; // copia di riserva se localStorage non è disponibile
let salvabile = true;

function archivio(): Storage | null {
  try {
    const s = window.localStorage;
    const prova = '__minuscole__';
    s.setItem(prova, '1');
    s.removeItem(prova);
    return s;
  } catch {
    return null;
  }
}

/** Legge lo stato. Non lancia mai errori: se qualcosa non va, restituisce uno stato vuoto (o quello in memoria). */
export function leggi(): Stato {
  const s = archivio();
  if (!s) {
    salvabile = false;
    return memoria ?? statoVuoto();
  }
  try {
    const testo = s.getItem(CHIAVE);
    return testo ? migra(JSON.parse(testo)) : statoVuoto();
  } catch {
    return memoria ?? statoVuoto();
  }
}

/** Salva lo stato e avvisa la pagina. Restituisce false se non è stato possibile salvarlo in modo permanente. */
export function scrivi(stato: Stato): boolean {
  memoria = stato;
  let ok = false;
  const s = archivio();
  if (s) {
    try {
      s.setItem(CHIAVE, JSON.stringify(stato));
      ok = true;
    } catch {
      ok = false; // es. spazio esaurito
    }
  }
  salvabile = ok;
  window.dispatchEvent(new CustomEvent(EVENTO, { detail: stato }));
  return ok;
}

/** Legge, applica una modifica pura e salva. */
export function aggiorna(f: (s: Stato) => Stato): Stato {
  const nuovo = f(leggi());
  scrivi(nuovo);
  return nuovo;
}

/** false se il browser non permette di salvare (le scelte si perderanno chiudendo la pagina). */
export function persistente(): boolean {
  if (!archivio()) salvabile = false;
  return salvabile;
}

/** Chiama `f` ora e a ogni cambio dello stato (in questa scheda o in un'altra). */
export function osserva(f: (s: Stato) => void): void {
  f(leggi());
  window.addEventListener(EVENTO, () => f(leggi()));
  window.addEventListener('storage', (e) => {
    if (e.key === CHIAVE || e.key === null) f(leggi());
  });
  // tornando indietro dalla cache del browser la pagina potrebbe essere vecchia
  window.addEventListener('pageshow', (e) => {
    if (e.persisted) f(leggi());
  });
}
