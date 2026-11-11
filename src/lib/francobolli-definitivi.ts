// SOLO AL BUILD (usa il file system): quali francobolli hanno già l'SVG definitivo in public/grafica/francobolli/.
// Il risultato si passa al browser in un attributo data-definitivi. Non importare questo file negli script client.
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { emozioni, verificaRuota } from '../data/emozioni.ts';

export function francobolliDefinitivi(): string[] {
  const cartella = join(process.cwd(), 'public', 'grafica', 'francobolli');
  return emozioni.filter((e) => existsSync(join(cartella, e.francobollo))).map((e) => e.id);
}

/** Ferma la build se la ruota delle emozioni ha problemi (id ripetuti, iniziali uguali, contrasti bassi). */
export function controllaRuota(): void {
  const problemi = verificaRuota();
  if (problemi.length) throw new Error('Ruota delle emozioni non valida:\n - ' + problemi.join('\n - '));
}

/** Percorso (relativo a BASE_URL) di un elemento grafico: il definitivo in public/grafica/ se c'è, altrimenti
 *  il segnaposto con lo stesso nome in public/placeholders/. */
export function graficaOSegnaposto(file: string): string {
  return existsSync(join(process.cwd(), 'public', 'grafica', file)) ? `grafica/${file}` : `placeholders/${file}`;
}
