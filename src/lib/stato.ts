// Stato dell'utente (Fase 3), salvato in localStorage come UN unico oggetto JSON.
//
//   {
//     versione: 1,
//     giorni: { "AAAA-MM-GG": { emozione: "realizzata" | null, modificato: "2026-11-11T18:00:00.000Z" } },
//     preferiti: ["realizzata", ...],          // max 9, francobolli mostrati nella striscia della home
//     preferitiModificato: "2026-...Z",        // serve all'unione tra dispositivi (Fase 6)
//     cartoline: {}                            // Fase 5
//   }
//
// - `emozione: null` = giorno cancellato. Si tiene la voce (con la sua data di modifica) invece di toglierla,
//   così in Fase 6, unendo due dispositivi, la cancellazione "vince" se è più recente.
// - I francobolli sbloccati NON si salvano: si calcolano dai giorni (`sbloccati`).
// - Le funzioni sul dato sono pure (prendono uno stato e ne restituiscono uno nuovo); solo `leggi`/`scrivi`
//   toccano localStorage, sempre dentro try/catch (può essere bloccato, es. Safari in privato o cookie off).
//   Se non si può salvare, il sito continua a funzionare con una copia in memoria (`persistente()` = false).

export const VERSIONE = 1;
export const CHIAVE = 'minuscole:stato';
export const MAX_PREFERITI = 9;
/** Evento lanciato su window quando lo stato cambia (anche da un'altra scheda). */
export const EVENTO = 'minuscole:stato';

export interface Giorno {
  emozione: string | null;
  modificato: string; // ISO 8601 (UTC)
}

export interface Stato {
  versione: number;
  giorni: Record<string, Giorno>;
  preferiti: string[];
  preferitiModificato: string;
  cartoline: Record<string, unknown>;
}

const DATA = /^\d{4}-\d{2}-\d{2}$/;
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
  if (g.cartoline && typeof g.cartoline === 'object' && !Array.isArray(g.cartoline)) {
    s.cartoline = { ...(g.cartoline as Record<string, unknown>) };
  }
  return s;
}

// ---------------------------------------------------------------------------------------------------------
// Funzioni pure sullo stato
// ---------------------------------------------------------------------------------------------------------
const adesso = () => new Date().toISOString();

/** Imposta (o cambia) l'emozione di un giorno. `emozione: null` lo cancella. */
export function impostaGiorno(s: Stato, data: string, emozione: string | null, quando = adesso()): Stato {
  if (!DATA.test(data)) throw new Error(`Data non valida: ${data}`);
  return { ...s, giorni: { ...s.giorni, [data]: { emozione, modificato: quando } } };
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

/**
 * Unisce due stati (Fase 6, sincronizzazione): giorno per giorno vince la modifica più recente;
 * per i preferiti vince la lista modificata più di recente; le cartoline per ora si prendono dallo stato
 * con i preferiti più recenti (in Fase 5 avranno anche loro una data di modifica).
 */
export function unisci(a: Stato, b: Stato): Stato {
  const giorni: Record<string, Giorno> = { ...a.giorni };
  for (const [data, g] of Object.entries(b.giorni)) {
    const x = giorni[data];
    if (!x || Date.parse(g.modificato) > Date.parse(x.modificato)) giorni[data] = g;
  }
  const recente = Date.parse(b.preferitiModificato) > Date.parse(a.preferitiModificato) ? b : a;
  return {
    versione: VERSIONE,
    giorni,
    preferiti: [...recente.preferiti],
    preferitiModificato: recente.preferitiModificato,
    cartoline: { ...recente.cartoline },
  };
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
