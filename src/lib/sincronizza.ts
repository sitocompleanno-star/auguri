// Sincronizzazione tra dispositivi (Fase 6). Solo browser. Si avvia da Base.astro su ogni pagina (`avvia()`).
//
// Come funziona, in breve:
//  - Il CODICE (vedi cifra.ts) sta in localStorage sotto `minuscole:sync`, separato dallo stato: così non finisce
//    mai nella copia di sicurezza. Si genera da solo la prima volta che ci sono dati da salvare.
//  - Una sincronizzazione è sempre la stessa: scarica la busta, la apre, `unisci(locale, remoto)`, salva in locale
//    se è cambiato qualcosa, e invia l'unione se il servizio non l'ha già. `unisci` è "senza perdite" (per ogni
//    giorno/cartolina vince il più recente), quindi l'ordine e le ripetizioni non contano: se due dispositivi
//    scrivono insieme e uno sovrascrive l'altro, alla sincronizzazione successiva l'altro rimanda i suoi dati.
//  - Quando: all'apertura della pagina, 3 s dopo una modifica (le modifiche ravvicinate diventano un invio),
//    al ritorno sulla scheda, quando torna la rete; e subito se si lascia la pagina con una modifica non inviata.
//    Dopo ogni invio si ricontrolla una volta (10 s): se un altro dispositivo ha scritto insieme, si rimanda l'unione.
//  - Senza rete o con il servizio giù il sito funziona come prima (tutto è in locale) e si riprova più tardi.
//  - Una sola sincronizzazione alla volta, anche tra schede (Web Locks, dove c'è).
//
// Fasi mostrate all'utente (evento `minuscole:sync` su window, vedi `osservaSync`):
//   non-attiva     servizio non configurato (URL vuoto) o browser che non salva
//   non-collegato  nessun codice su questo dispositivo (ancora nessun dato, oppure scollegato a mano)
//   in-corso | sincronizzato | offline | errore
//   ritirato       il codice è stato cambiato da un altro dispositivo: questo va ricollegato
import {
  EVENTO, dataDiOggi, leggi, migra, persistente, scrivi, senzaDati, unisci, uguali, canonico, type Stato,
} from './stato.ts';
import { chiavi, cifra, decifra, leggiCodice, nuovoCodice, type Chiavi } from './cifra.ts';
import { creaCopia, importa, leggiCopia, nomeCopia, type EsitoImportazione } from './copia.ts';
import { INTERVALLO_MINIMO_MS, RIPROVA_MS, RITARDO_MODIFICA_MS, URL_SERVIZIO, VERIFICA_MS } from '../data/sincronizzazione.ts';

export const CHIAVE_SYNC = 'minuscole:sync';
export const EVENTO_SYNC = 'minuscole:sync';

export type Fase = 'non-attiva' | 'non-collegato' | 'in-corso' | 'sincronizzato' | 'offline' | 'errore' | 'ritirato';

export interface InfoSync {
  fase: Fase;
  messaggio: string;
  ultima: string | null; // ISO dell'ultima sincronizzazione riuscita
}

interface Config {
  codice?: string;
  spento?: boolean;    // scollegato a mano: non generare un codice nuovo da solo
  ritirato?: boolean;  // il servizio ha risposto 410: il codice è stato cambiato altrove
  ultima?: string;
  inviato?: { impronta: string; quando: number }; // ultimo invio (per non rimandare la stessa cosa)
  allineato?: string; // impronta dello stato dopo l'ultima sincronizzazione riuscita: se il locale è diverso, c'è da inviare
}

// Senza "https://" il browser lo prenderebbe per un percorso dentro il sito: lo si aggiunge se manca.
const URL_BASE = ((import.meta.env.PUBLIC_SYNC_URL as string | undefined) || URL_SERVIZIO)
  .trim()
  .replace(/\/+$/, '')
  .replace(/^(?!https?:\/\/)(?=.)/, 'https://');
const BASE = import.meta.env.BASE_URL;

let info: InfoSync = { fase: 'non-attiva', messaggio: '', ultima: null };
let avviato = false;
let inCorso: Promise<void> | null = null;
let ancora = false;
let applicando = false;   // true mentre si salva lo stato unito (non è una modifica dell'utente)
let inSospeso = false;    // c'è una modifica locale non ancora inviata
let modifiche = 0;        // contatore: una modifica arrivata durante la sincronizzazione resta "in sospeso"
let timerModifica = 0;
let timerRiprova = 0;
let timerVerifica = 0;
let tentativi = 0;
let chiaviCache: { codice: string; k: Chiavi } | null = null;

// ---------------------------------------------------------------------------------------------------------
// Configurazione (codice) in localStorage
// ---------------------------------------------------------------------------------------------------------
function leggiConfig(): Config | null {
  try {
    const t = localStorage.getItem(CHIAVE_SYNC);
    const c = t ? (JSON.parse(t) as Config) : null;
    if (c && c.codice && !leggiCodice(c.codice)) return null; // codice rovinato
    return c;
  } catch {
    return null;
  }
}

function salvaConfig(c: Config | null): void {
  try {
    if (c) localStorage.setItem(CHIAVE_SYNC, JSON.stringify(c));
    else localStorage.removeItem(CHIAVE_SYNC);
  } catch {
    /* localStorage bloccato: la sincronizzazione è comunque spenta (vedi `passo`) */
  }
}

async function chiaviDi(codice: string): Promise<Chiavi> {
  if (chiaviCache?.codice !== codice) chiaviCache = { codice, k: await chiavi(codice) };
  return chiaviCache.k;
}

async function impronta(s: Stato): Promise<string> {
  const b = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(canonico(s)));
  return Array.from(new Uint8Array(b).slice(0, 16), (x) => x.toString(16).padStart(2, '0')).join('');
}

// ---------------------------------------------------------------------------------------------------------
// Stato visibile
// ---------------------------------------------------------------------------------------------------------
function imposta(fase: Fase, messaggio = ''): void {
  const ultima = leggiConfig()?.ultima ?? null;
  const cambiato = fase !== info.fase || messaggio !== info.messaggio || ultima !== info.ultima;
  info = { fase, messaggio, ultima };
  if (cambiato) window.dispatchEvent(new CustomEvent(EVENTO_SYNC, { detail: info }));
}

export function statoSync(): InfoSync {
  return info;
}

/** Chiama `f` ora e a ogni cambio di fase della sincronizzazione. */
export function osservaSync(f: (i: InfoSync) => void): void {
  f(info);
  window.addEventListener(EVENTO_SYNC, () => f(info));
}

export const servizioConfigurato = () => URL_BASE !== '';

// ---------------------------------------------------------------------------------------------------------
// Rete
// ---------------------------------------------------------------------------------------------------------
class ErroreRete extends Error {}

async function richiesta(k: Chiavi, metodo: 'GET' | 'PUT' | 'DELETE', corpo?: string, inUscita = false): Promise<Response> {
  try {
    return await fetch(`${URL_BASE}/v1/${k.id}`, {
      method: metodo,
      headers: { Authorization: `Bearer ${k.token}`, ...(corpo ? { 'Content-Type': 'application/json' } : {}) },
      body: corpo,
      cache: 'no-store',
      // lasciando la pagina la richiesta deve sopravvivere (keepalive accetta corpi fino a 64 KB)
      keepalive: inUscita && (corpo?.length ?? 0) < 60_000,
      signal: typeof AbortSignal.timeout === 'function' ? AbortSignal.timeout(15_000) : undefined,
    });
  } catch {
    throw new ErroreRete();
  }
}

type Remoto = { tipo: 'dati'; stato: Stato } | { tipo: 'vuoto' } | { tipo: 'ritirato' } | { tipo: 'negato' };

/** Scarica e apre la busta. Lancia ErroreRete senza rete, Error se la busta non si apre o il servizio sbaglia. */
async function scarica(k: Chiavi): Promise<Remoto> {
  const r = await richiesta(k, 'GET');
  if (r.status === 204 || r.status === 404) return { tipo: 'vuoto' };
  if (r.status === 410) return { tipo: 'ritirato' };
  if (r.status === 403 || r.status === 401) return { tipo: 'negato' };
  if (!r.ok) throw new Error(`Il servizio ha risposto con un errore (${r.status}).`);
  let busta: unknown;
  try {
    busta = await r.json();
  } catch {
    throw new ErroreRete(); // risposta troncata
  }
  try {
    return { tipo: 'dati', stato: migra(await decifra(k, busta)) };
  } catch {
    throw new Error('Non riesco ad aprire i dati sul servizio: il codice non corrisponde.');
  }
}

async function invia(k: Chiavi, s: Stato, inUscita = false): Promise<Response> {
  return richiesta(k, 'PUT', JSON.stringify(await cifra(k, s)), inUscita);
}

/** Salva in locale lo stato unito senza che conti come "modifica dell'utente". */
function applica(s: Stato): void {
  applicando = true;
  try {
    scrivi(s);
  } finally {
    applicando = false;
  }
}

function conBlocco<T>(f: () => Promise<T>): Promise<T> {
  const locks = (navigator as Navigator & { locks?: LockManager }).locks;
  return locks ? (locks.request('minuscole-sync', f) as Promise<T>) : f();
}

// ---------------------------------------------------------------------------------------------------------
// Una sincronizzazione
// ---------------------------------------------------------------------------------------------------------
function riprovaPiuTardi(): void {
  clearTimeout(timerRiprova);
  const attesa = RIPROVA_MS[Math.min(tentativi, RIPROVA_MS.length - 1)];
  tentativi++;
  timerRiprova = window.setTimeout(() => void sincronizza(), attesa);
}

async function passo(inUscita: boolean): Promise<void> {
  if (!URL_BASE) return imposta('non-attiva', 'La sincronizzazione non è ancora attiva su questo sito.');
  if (!persistente()) return imposta('non-attiva', 'Questo browser non permette di salvare: niente sincronizzazione.');

  let cfg = leggiConfig();
  if (!cfg) {
    // primo salvataggio: si crea il codice, ma solo se c'è qualcosa da salvare
    if (senzaDati(leggi())) return imposta('non-collegato');
    cfg = { codice: nuovoCodice() };
    salvaConfig(cfg);
  }
  if (!cfg.codice) return imposta('non-collegato', 'Questo dispositivo è scollegato.');
  if (cfg.ritirato) return imposta('ritirato', 'Il codice è stato cambiato su un altro dispositivo.');
  if (navigator.onLine === false) {
    imposta('offline', 'Senza rete: riprovo quando torna.');
    return riprovaPiuTardi();
  }

  const k = await chiaviDi(cfg.codice);
  const contate = modifiche;
  imposta('in-corso');
  try {
    const remoto = await scarica(k);
    if (remoto.tipo === 'ritirato') {
      salvaConfig({ ...cfg, ritirato: true });
      return imposta('ritirato', 'Il codice è stato cambiato su un altro dispositivo.');
    }
    if (remoto.tipo === 'negato') return imposta('errore', 'Il servizio non accetta questo codice.');

    const attuale = leggi(); // riletto adesso: durante lo scaricamento potrebbe essere cambiato
    const unito = remoto.tipo === 'dati' ? unisci(attuale, remoto.stato) : attuale;
    if (!uguali(unito, attuale)) applica(unito);

    const imp = await impronta(unito);
    if (remoto.tipo === 'vuoto' || !uguali(unito, remoto.stato)) {
      // KV può restituire per qualche secondo la versione precedente: non si rimanda ciò che si è appena inviato
      const recente = cfg.inviato?.impronta === imp && Date.now() - cfg.inviato.quando < 120_000;
      if (!recente) {
        const r = await invia(k, unito, inUscita);
        if (r.status === 410) {
          salvaConfig({ ...cfg, ritirato: true });
          return imposta('ritirato', 'Il codice è stato cambiato su un altro dispositivo.');
        }
        if (!r.ok) throw new Error(`Il servizio non ha salvato i dati (${r.status}).`);
        cfg = { ...(leggiConfig() ?? cfg), inviato: { impronta: imp, quando: Date.now() } };
        // un altro dispositivo potrebbe aver scritto nello stesso istante: si ricontrolla tra poco
        clearTimeout(timerVerifica);
        if (!inUscita) timerVerifica = window.setTimeout(() => void sincronizza(), VERIFICA_MS);
      }
    }
    if (modifiche === contate) inSospeso = false;
    salvaConfig({ ...(leggiConfig() ?? cfg), inviato: cfg.inviato, allineato: imp, ultima: new Date().toISOString() });
    tentativi = 0;
    clearTimeout(timerRiprova);
    imposta('sincronizzato');
  } catch (e) {
    if (e instanceof ErroreRete) imposta('offline', 'Il servizio non risponde: riprovo più tardi.');
    else imposta('errore', (e as Error).message || 'Errore sconosciuto.');
    riprovaPiuTardi();
  }
}

/** Sincronizza ora (o subito dopo quella in corso). Non lancia mai errori. */
export function sincronizza(inUscita = false): Promise<void> {
  clearTimeout(timerModifica);
  if (inCorso) {
    ancora = true;
    return inCorso;
  }
  inCorso = (async () => {
    do {
      ancora = false;
      try {
        await conBlocco(() => passo(inUscita));
      } catch {
        imposta('errore', 'Errore inatteso durante la sincronizzazione.');
      }
    } while (ancora);
  })().finally(() => {
    inCorso = null;
  });
  return inCorso;
}

/**
 * All'apertura e al ritorno sulla scheda: si sincronizza, a meno che l'ultimo controllo sia di pochi secondi fa
 * E lo stato locale sia ancora quello di allora (una modifica fatta offline o in un'altra scheda va inviata).
 */
async function seServe(): Promise<void> {
  const c = leggiConfig();
  const recente = Date.now() - Date.parse(c?.ultima ?? '') < INTERVALLO_MINIMO_MS;
  const fermo = recente && !inSospeso && info.fase !== 'errore' && info.fase !== 'offline'
    && !!c?.allineato && c.allineato === (await impronta(leggi()));
  if (fermo) imposta('sincronizzato');
  else void sincronizza();
}

/** Avvia la sincronizzazione automatica (una volta per pagina). */
export function avvia(): void {
  if (avviato) return;
  avviato = true;
  if (!URL_BASE) {
    imposta('non-attiva', 'La sincronizzazione non è ancora attiva su questo sito.');
    return;
  }
  window.addEventListener(EVENTO, () => {
    if (applicando) return;
    inSospeso = true;
    modifiche++;
    clearTimeout(timerModifica);
    timerModifica = window.setTimeout(() => void sincronizza(), RITARDO_MODIFICA_MS);
  });
  // un'altra scheda ha cambiato il codice (collegato, scollegato, cambiato)
  window.addEventListener('storage', (e) => {
    if (e.key === CHIAVE_SYNC) {
      chiaviCache = null;
      void sincronizza();
    }
  });
  window.addEventListener('online', () => {
    tentativi = 0;
    void sincronizza();
  });
  window.addEventListener('offline', () => imposta('offline', 'Senza rete: riprovo quando torna.'));
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') void seServe();
    else if (inSospeso) void sincronizza(true); // si lascia la scheda con una modifica non inviata
  });
  window.addEventListener('pagehide', () => {
    if (inSospeso) void sincronizza(true);
  });
  window.addEventListener('pageshow', (e) => {
    if (e.persisted) void seServe();
  });
  void seServe();
}

// ---------------------------------------------------------------------------------------------------------
// Azioni della pagina /dispositivi/
// ---------------------------------------------------------------------------------------------------------
export interface Esito {
  ok: boolean;
  messaggio: string;
}

/** Codice di questo dispositivo (solo per mostrarlo a chi lo usa: QR, link, cartolina di recupero). */
export function codiceAttuale(): string | null {
  const c = leggiConfig();
  return c?.codice && !c.ritirato ? c.codice : null;
}

/** Link per collegare un altro dispositivo. Il codice sta dopo il # e non arriva a nessun server. */
export function linkCollegamento(codice: string): string {
  return `${location.origin}${BASE}dispositivi/#collega=${codice}`;
}

/** Crea subito un codice (es. per collegare un altro dispositivo prima di aver scritto qualcosa). */
export async function attiva(): Promise<Esito> {
  if (!URL_BASE) return { ok: false, messaggio: 'La sincronizzazione non è ancora attiva su questo sito.' };
  if (!persistente()) return { ok: false, messaggio: 'Questo browser non permette di salvare.' };
  await conBlocco(async () => {
    const c = leggiConfig();
    if (!c?.codice || c.ritirato) salvaConfig({ codice: nuovoCodice() });
  });
  inSospeso = true; // anche uno stato vuoto va inviato, così l'altro dispositivo lo trova
  await sincronizza();
  return info.fase === 'sincronizzato'
    ? { ok: true, messaggio: 'Sincronizzazione attiva.' }
    : { ok: false, messaggio: info.messaggio || 'Il servizio non risponde. Riprovo più tardi.' };
}

/**
 * Collega questo dispositivo a un codice (dal QR, dal link o scritto a mano): scarica i dati, li unisce con
 * quelli del dispositivo e da allora sincronizza. I dati di questo dispositivo non si perdono.
 */
export async function collega(testo: string): Promise<Esito> {
  const codice = leggiCodice(testo);
  if (!codice) return { ok: false, messaggio: 'Il codice non è valido: controlla di averlo scritto tutto e senza errori.' };
  if (!URL_BASE) return { ok: false, messaggio: 'La sincronizzazione non è ancora attiva su questo sito.' };
  if (!persistente()) return { ok: false, messaggio: 'Questo browser non permette di salvare.' };
  const c = leggiConfig();
  if (c?.codice === codice && !c.ritirato) return { ok: true, messaggio: 'Questo dispositivo è già collegato con questo codice.' };
  if (navigator.onLine === false) return { ok: false, messaggio: 'Serve la rete per collegare il dispositivo.' };

  return conBlocco(async (): Promise<Esito> => {
    const k = await chiavi(codice);
    let remoto: Remoto;
    try {
      remoto = await scarica(k);
    } catch (e) {
      return { ok: false, messaggio: e instanceof ErroreRete ? 'Il servizio non risponde: riprova tra poco.' : (e as Error).message };
    }
    if (remoto.tipo === 'vuoto') return { ok: false, messaggio: 'Non ho trovato dati con questo codice. Controlla di averlo scritto giusto.' };
    if (remoto.tipo === 'ritirato') return { ok: false, messaggio: 'Questo codice è stato cambiato: usa il codice nuovo.' };
    if (remoto.tipo === 'negato') return { ok: false, messaggio: 'Il servizio non accetta questo codice.' };
    const prima = leggi();
    const unito = unisci(prima, remoto.stato);
    if (!uguali(unito, prima)) applica(unito);
    salvaConfig({ codice });
    chiaviCache = { codice, k };
    inSospeso = !uguali(unito, remoto.stato); // i dati di questo dispositivo vanno aggiunti a quelli del servizio
    tentativi = 0;
    const giorni = Object.values(unito.giorni).filter((g) => g.emozione).length;
    return { ok: true, messaggio: `Dispositivo collegato: ${giorni === 1 ? '1 giorno' : `${giorni} giorni`} nel Diario.` };
  }).then(async (esito) => {
    if (esito.ok) await sincronizza();
    return esito;
  });
}

/** Questo dispositivo smette di sincronizzare e dimentica il codice. I dati restano qui. */
export async function scollega(): Promise<Esito> {
  await conBlocco(async () => salvaConfig({ spento: true }));
  chiaviCache = null;
  inSospeso = false;
  clearTimeout(timerRiprova);
  imposta('non-collegato', 'Questo dispositivo è scollegato.');
  return { ok: true, messaggio: 'Dispositivo scollegato. I dati restano su questo dispositivo.' };
}

/**
 * Codice nuovo: i dati (uniti con quelli del servizio) si cifrano con il codice nuovo, e quelli col vecchio
 * codice si cancellano. Gli altri dispositivi restano fuori finché non si ricollegano col nuovo codice.
 */
export async function cambiaCodice(): Promise<Esito> {
  if (!URL_BASE) return { ok: false, messaggio: 'La sincronizzazione non è ancora attiva su questo sito.' };
  if (navigator.onLine === false) return { ok: false, messaggio: 'Serve la rete per cambiare il codice.' };
  await sincronizza(); // prima si raccoglie tutto
  if (info.fase !== 'sincronizzato' && info.fase !== 'non-collegato' && info.fase !== 'ritirato') {
    return { ok: false, messaggio: 'Non riesco a raggiungere il servizio: il codice non è cambiato.' };
  }
  return conBlocco(async (): Promise<Esito> => {
    const vecchio = leggiConfig();
    const nuovo = nuovoCodice();
    const k = await chiavi(nuovo);
    try {
      const r = await invia(k, leggi());
      if (!r.ok) return { ok: false, messaggio: `Il servizio non ha salvato i dati (${r.status}): il codice non è cambiato.` };
    } catch {
      return { ok: false, messaggio: 'Il servizio non risponde: il codice non è cambiato.' };
    }
    salvaConfig({ codice: nuovo, ultima: new Date().toISOString() });
    chiaviCache = { codice: nuovo, k };
    let avviso = '';
    if (vecchio?.codice && !vecchio.ritirato) {
      try {
        const r = await richiesta(await chiavi(vecchio.codice), 'DELETE');
        if (!r.ok && r.status !== 404 && r.status !== 410) avviso = ' (I dati col vecchio codice non si sono cancellati.)';
      } catch {
        avviso = ' (I dati col vecchio codice non si sono cancellati: manca la rete.)';
      }
    }
    imposta('sincronizzato');
    return { ok: true, messaggio: `Codice cambiato. Gli altri dispositivi vanno ricollegati.${avviso}` };
  });
}

// ---- copia di sicurezza ----

/** Scarica il file con i dati di questo dispositivo (senza il codice). */
export function esporta(): void {
  const blob = new Blob([JSON.stringify(creaCopia(leggi()), null, 1)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = nomeCopia(dataDiOggi());
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 60_000);
}

/** Unisce un file di copia con i dati del dispositivo (non li sostituisce). Lancia un errore se il file non va. */
export async function importaFile(file: File): Promise<EsitoImportazione> {
  if (file.size > 5_000_000) throw new Error('Il file è troppo grande per essere una copia di minuscole.');
  const esito = importa(leggi(), leggiCopia(await file.text()));
  if (!esito.invariato) scrivi(esito.stato); // conta come modifica: parte la sincronizzazione
  return esito;
}
