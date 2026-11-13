// Aggiunge le frasi nuove al sito (Fase 7): npm run frasi
//
// 1. Scrivi le frasi nel file `frasi-da-aggiungere.txt` (nella cartella principale del progetto), una per riga:
//        testo della frase | autore
//        testo della frase | autore | 12-25        ← facoltativo: esce solo il 25 dicembre (ogni anno)
//        testo senza autore
//    Le righe vuote e quelle che iniziano con # si ignorano. Massimo 60 caratteri per il testo, 24 per l'autore.
// 2. Lancia `npm run frasi` (o `aggiungi-contenuti.bat`).
//
// Lo script aggiunge le frasi valide a src/data/frasi.json (con un id e la data di oggi), salta quelle già
// presenti e lascia nel file .txt solo le righe da correggere. Completa anche `id` e `aggiunta` delle frasi
// scritte a mano direttamente in frasi.json.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { MAX_AUTORE, MAX_TESTO, lunghezza, validaFrasi } from '../src/lib/valida-contenuti.ts';
import { oggiRoma } from '../src/lib/del-giorno.js';

const radice = path.resolve(import.meta.dirname, '..');
const txt = path.join(radice, 'frasi-da-aggiungere.txt');
const json = path.join(radice, 'src/data/frasi.json');
const INTESTAZIONE = `# Frasi da aggiungere al sito: una per riga, poi lancia npm run frasi.
#   testo della frase | autore
#   testo della frase | autore | 12-25    (facoltativo: esce solo quel giorno, ogni anno; oppure 2027-02-14)
# Massimo ${MAX_TESTO} caratteri per il testo e ${MAX_AUTORE} per l'autore. Le righe con # si ignorano.
`;

const frasi = JSON.parse(fs.readFileSync(json, 'utf8'));
const oggi = oggiRoma();
const usati = new Set(frasi.map((f) => f.id));
const nuovoId = () => {
  let id;
  do id = `f${crypto.randomBytes(3).toString('hex')}`; while (usati.has(id));
  usati.add(id);
  return id;
};
const chiave = (s) => s.trim().toLowerCase().replace(/\s+/g, ' ');
const presenti = new Set(frasi.map((f) => chiave(f.testo ?? '')));

// Frasi scritte a mano in frasi.json: completa id e data
let completate = 0;
for (const f of frasi) {
  if (!f.id) { f.id = nuovoId(); completate++; }
  if (!f.aggiunta) { f.aggiunta = oggi; completate++; }
}

let aggiunte = 0;
const daCorreggere = [];
if (!fs.existsSync(txt)) {
  fs.writeFileSync(txt, INTESTAZIONE);
  console.log('Ho creato frasi-da-aggiungere.txt: scrivi lì le frasi e rilancia npm run frasi.');
} else {
  for (const riga of fs.readFileSync(txt, 'utf8').split(/\r?\n/)) {
    if (!riga.trim() || riga.trim().startsWith('#')) continue;
    const [testo = '', autore = '', giorno = ''] = riga.split('|').map((s) => s.trim().replace(/\s+/g, ' '));
    const voce = { id: '', testo, ...(autore && { autore }), aggiunta: oggi, ...(giorno && { giorno }) };
    const errori = validaFrasi([{ ...voce, id: 'prova' }]).map((e) => e.replace(/^Frase n\. 1 \(id "prova"\): /, ''));
    if (errori.length) {
      daCorreggere.push(riga);
      console.log(`✗ "${riga}": ${errori.join('; ')}`);
      continue;
    }
    if (presenti.has(chiave(testo))) { console.log(`· già presente: "${testo}"`); continue; }
    presenti.add(chiave(testo));
    voce.id = nuovoId();
    frasi.push(voce);
    aggiunte++;
    console.log(`✓ "${testo}"${autore ? ` — ${autore}` : ''} (${lunghezza(testo)} caratteri)`);
  }
  fs.writeFileSync(txt, INTESTAZIONE + (daCorreggere.length ? '\n# Da correggere:\n' + daCorreggere.join('\n') + '\n' : ''));
}

fs.writeFileSync(json, JSON.stringify(frasi, null, 2) + '\n');
console.log(`\nAggiunte ${aggiunte} frasi (in tutto ${frasi.length}).${completate ? ` Completati ${completate} campi mancanti in frasi.json.` : ''}`);
if (daCorreggere.length) console.log(`⚠ ${daCorreggere.length} righe da correggere: sono rimaste in frasi-da-aggiungere.txt.`);
const errori = validaFrasi(frasi);
if (errori.length) console.log(`⚠ In frasi.json:\n - ${errori.join('\n - ')}`);
