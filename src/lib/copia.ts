// Copia di sicurezza (Fase 6): esportazione e importazione di un file JSON. Funzioni pure (testabili in Node).
//
// Il file contiene SOLO i dati (lo stato), MAI il codice della sincronizzazione: chi trova il file non può
// collegarsi al servizio. L'importazione UNISCE il file con i dati del dispositivo (`unisci`), non li sostituisce.
import { migra, unisci, uguali, type Stato } from './stato.ts';

export interface FileCopia {
  app: 'minuscole';
  tipo: 'copia-di-sicurezza';
  esportato: string; // ISO
  stato: Stato;
}

export function creaCopia(stato: Stato, quando = new Date()): FileCopia {
  return { app: 'minuscole', tipo: 'copia-di-sicurezza', esportato: quando.toISOString(), stato };
}

/** Nome del file, con la data del fuso Europe/Rome: "minuscole-copia-2026-11-13.json". */
export function nomeCopia(data: string): string {
  return `minuscole-copia-${data}.json`;
}

/**
 * Legge il testo di un file di copia. Accetta anche lo stato "nudo" (quello di localStorage).
 * Lancia un errore con un messaggio leggibile se il file non è una copia di minuscole.
 */
export function leggiCopia(testo: string): Stato {
  let v: unknown;
  try {
    v = JSON.parse(testo);
  } catch {
    throw new Error('Il file non è una copia di minuscole (non è un file JSON).');
  }
  const o = v as Record<string, unknown> | null;
  const grezzo = o && o.app === 'minuscole' && 'stato' in o ? o.stato : o;
  if (!grezzo || typeof grezzo !== 'object' || !('giorni' in grezzo)) {
    throw new Error('Il file non sembra una copia di minuscole.');
  }
  return migra(grezzo);
}

export interface EsitoImportazione {
  stato: Stato;
  cambiati: number;  // giorni aggiunti o cambiati rispetto al dispositivo
  nelFile: number;   // giorni con un'emozione nel file
  invariato: boolean;
}

/** Unisce il file con lo stato del dispositivo e conta cosa cambia. */
export function importa(locale: Stato, dalFile: Stato): EsitoImportazione {
  const stato = unisci(locale, dalFile);
  let cambiati = 0;
  for (const [data, g] of Object.entries(stato.giorni)) {
    const prima = locale.giorni[data];
    if (!prima || prima.emozione !== g.emozione) cambiati++;
  }
  const nelFile = Object.values(dalFile.giorni).filter((g) => g.emozione).length;
  return { stato, cambiati, nelFile, invariato: uguali(stato, locale) };
}
