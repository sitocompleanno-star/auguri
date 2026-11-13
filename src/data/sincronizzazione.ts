// Sincronizzazione tra dispositivi (Fase 6).
//
// Indirizzo del Worker di Cloudflare (vedi worker/LEGGIMI.md), es. 'https://minuscole-sync.tuonome.workers.dev'.
// NON è un segreto: è solo l'indirizzo del servizio, che vede soltanto dati cifrati.
// Vuoto = sincronizzazione spenta: il sito funziona come prima ed esportazione/importazione restano attive.
// In locale si può sovrascrivere con la variabile PUBLIC_SYNC_URL (es. PUBLIC_SYNC_URL=http://localhost:8787).
export const URL_SERVIZIO = '';

/** Attesa dopo una modifica prima di sincronizzare: più modifiche ravvicinate diventano un solo invio. */
export const RITARDO_MODIFICA_MS = 3000;
/** All'apertura di una pagina o al ritorno sulla scheda non si ricontrolla se l'ultimo controllo è più recente di così. */
export const INTERVALLO_MINIMO_MS = 20_000;
/**
 * Dopo ogni invio si ricontrolla una volta dopo questo tempo: se un altro dispositivo ha scritto nello stesso
 * momento (e ha sovrascritto il nostro invio), così ce ne accorgiamo subito e rimandiamo l'unione.
 */
export const VERIFICA_MS = 10_000;
/** Attese tra un tentativo e l'altro quando non c'è rete o il servizio non risponde. */
export const RIPROVA_MS = [15_000, 30_000, 60_000, 120_000, 300_000];
