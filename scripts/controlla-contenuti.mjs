// Controlla foto e frasi prima di inviarle (Fase 7): npm run contenuti
// Stessi controlli del build (se qui va tutto bene, il sito si pubblica), più il peso dei media e i file avanzati.
// Esce con errore se qualcosa va corretto (lo usa anche invia-su-github.bat).
import fs from 'node:fs';
import path from 'node:path';
import { MISURE_FOTO, validaFoto, validaFrasi } from '../src/lib/valida-contenuti.ts';
import { delGiorno, oggiRoma } from '../src/lib/del-giorno.js';

const radice = path.resolve(import.meta.dirname, '..');
const leggi = (f) => JSON.parse(fs.readFileSync(path.join(radice, 'src/data', f), 'utf8'));
let foto, frasi;
try {
  foto = leggi('foto.json');
  frasi = leggi('frasi.json');
} catch (e) {
  console.log(`✗ Un file JSON non si legge (virgola o virgolette mancanti?): ${e.message}`);
  process.exit(1);
}

const cartella = path.join(radice, 'public/media/foto');
const errori = [...validaFoto(foto), ...validaFrasi(frasi)];
const attesi = new Set();
for (const f of Array.isArray(foto) ? foto : []) {
  for (const m of MISURE_FOTO) {
    attesi.add(`${f.id}-${m}.webp`);
    if (!fs.existsSync(path.join(cartella, `${f.id}-${m}.webp`))) errori.push(`Foto "${f.id}": manca public/media/foto/${f.id}-${m}.webp`);
  }
}
const presenti = fs.existsSync(cartella) ? fs.readdirSync(cartella).filter((f) => f.endsWith('.webp')) : [];
const avanzati = presenti.filter((f) => !attesi.has(f));
const byte = presenti.reduce((s, f) => s + fs.statSync(path.join(cartella, f)).size, 0);

console.log(`Foto: ${foto.length} · Frasi: ${frasi.length} · public/media/foto: ${(byte / 1048576).toFixed(1)} MB (obiettivo: sotto 500 MB)`);
if (avanzati.length) console.log(`· File non usati in public/media/foto (si possono cancellare): ${avanzati.join(', ')}`);
if (errori.length) {
  console.log(`✗ Da correggere:\n - ${errori.join('\n - ')}`);
  process.exit(1);
}
const oggi = oggiRoma();
const f = delGiorno(foto, oggi, 'foto');
const fr = delGiorno(frasi, oggi, 'frasi');
console.log(`✓ Tutto a posto. Oggi (${oggi}): foto ${f ? `"${f.alt}"` : '—'} · frase ${fr ? `"${fr.testo}"` : '—'}`);
