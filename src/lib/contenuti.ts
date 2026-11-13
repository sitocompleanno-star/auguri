// Foto e frasi (Fase 7), SOLO build: legge i JSON, li controlla e verifica che i file delle foto esistano.
// Se qualcosa non va il build si ferma con un messaggio che dice cosa correggere.
import fs from 'node:fs';
import path from 'node:path';
import fotoJson from '../data/foto.json';
import frasiJson from '../data/frasi.json';
import { MISURE_FOTO, validaFoto, validaFrasi, type Foto, type Frase } from './valida-contenuti.ts';

export type { Foto, Frase };

function controlla(): { foto: Foto[]; frasi: Frase[] } {
  const errori = [...validaFoto(fotoJson), ...validaFrasi(frasiJson)];
  const cartella = path.resolve('public/media/foto');
  for (const f of fotoJson as Foto[]) {
    for (const m of MISURE_FOTO) {
      if (!fs.existsSync(path.join(cartella, `${f.id}-${m}.webp`))) errori.push(`Foto "${f.id}": manca il file public/media/foto/${f.id}-${m}.webp`);
    }
  }
  if (errori.length) {
    throw new Error(`Foto e frasi (src/data/foto.json, frasi.json):\n - ${errori.join('\n - ')}`);
  }
  return { foto: fotoJson as Foto[], frasi: frasiJson as Frase[] };
}

export const { foto, frasi } = controlla();

/** Più recenti prima (per l'Archivio). */
export const perAggiunta = <T extends { aggiunta: string; id: string }>(voci: T[]) =>
  voci.slice().sort((a, b) => (a.aggiunta === b.aggiunta ? (a.id < b.id ? -1 : 1) : a.aggiunta < b.aggiunta ? 1 : -1));
