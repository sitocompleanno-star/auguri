// Aggiunge le foto nuove al sito (Fase 7): npm run foto
//
// 1. Metti le foto (JPG, PNG, WebP, TIFF; anche originali da telefono o fotocamera) nella cartella
//    `foto-da-aggiungere/` (nella cartella principale del progetto; non va su GitHub).
// 2. Lancia `npm run foto` (su Windows: doppio clic su `aggiungi-contenuti.bat`, oppure da PowerShell).
// 3. Per ogni foto scrivi una breve descrizione (testo alternativo, per chi non può vederla).
//
// Per ogni foto lo script:
// - la raddrizza (orientamento del telefono) e TOGLIE TUTTI I METADATI (posizione GPS, data, modello…);
// - crea tre WebP con un nome anonimo casuale in public/media/foto/: <id>-400 (Archivio), -800 (home),
//   -1600 (foto in grande);
// - aggiunge una voce a src/data/foto.json con misure, descrizione e data di oggi (`aggiunta`);
// - sposta l'originale in foto-da-aggiungere/fatte/ (cancellalo tu quando vuoi).
// Usa `sharp`, già installato con Astro (solo per lo sviluppo, non finisce nel sito).
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import readline from 'node:readline/promises';
import sharp from 'sharp';
import { MISURE_FOTO, validaFoto } from '../src/lib/valida-contenuti.ts';
import { oggiRoma } from '../src/lib/del-giorno.js';

const radice = path.resolve(import.meta.dirname, '..');
const ingresso = path.join(radice, 'foto-da-aggiungere');
const fatte = path.join(ingresso, 'fatte');
const uscita = path.join(radice, 'public/media/foto');
const json = path.join(radice, 'src/data/foto.json');
const QUALITA = { 400: 72, 800: 76, 1600: 78 };
const ESTENSIONI = /\.(jpe?g|png|webp|tiff?|avif|heic|heif)$/i;

fs.mkdirSync(ingresso, { recursive: true });
fs.mkdirSync(uscita, { recursive: true });
const file = fs.readdirSync(ingresso).filter((f) => ESTENSIONI.test(f)).sort();
if (!file.length) {
  console.log('Nessuna foto in foto-da-aggiungere/. Mettile lì e rilancia npm run foto.');
  process.exit(0);
}

const foto = JSON.parse(fs.readFileSync(json, 'utf8'));
const usati = new Set(foto.map((f) => f.id));
const nuovoId = () => {
  let id;
  do id = crypto.randomBytes(4).toString('hex'); while (usati.has(id));
  usati.add(id);
  return id;
};

const interattivo = process.stdin.isTTY;
const rl = interattivo ? readline.createInterface({ input: process.stdin, output: process.stdout }) : null;
const oggi = oggiRoma();
let aggiunte = 0;
let senzaAlt = 0;
console.log(`Trovate ${file.length} foto.${interattivo ? ' Per ognuna scrivi una breve descrizione (es. "Noi due al mare al tramonto").' : ''}\n`);

for (const nome of file) {
  const sorgente = path.join(ingresso, nome);
  const id = nuovoId();
  let grande;
  try {
    const base = sharp(sorgente, { failOn: 'none' }).rotate(); // rotate() senza argomenti = orientamento EXIF
    for (const m of MISURE_FOTO) {
      const info = await base
        .clone()
        .resize({ width: m, height: m, fit: 'inside', withoutEnlargement: true })
        .webp({ quality: QUALITA[m], effort: 5 }) // sharp non copia i metadati se non glielo si chiede
        .toFile(path.join(uscita, `${id}-${m}.webp`));
      if (m === 1600) grande = info;
    }
  } catch (e) {
    for (const m of MISURE_FOTO) fs.rmSync(path.join(uscita, `${id}-${m}.webp`), { force: true });
    const heic = /\.hei[cf]$/i.test(nome);
    console.log(`✗ ${nome}: non riesco a leggerla${heic ? ' (le HEIC di iPhone vanno prima esportate in JPG)' : ''}. ${e.message}`);
    continue;
  }

  let alt = '';
  if (rl) {
    while (alt.trim().length < 3) alt = await rl.question(`${nome} → descrizione: `);
  }
  if (!alt.trim()) senzaAlt++;
  foto.push({ id, w: grande.width, h: grande.height, alt: alt.trim(), aggiunta: oggi });
  fs.mkdirSync(fatte, { recursive: true });
  fs.renameSync(sorgente, path.join(fatte, nome));
  fs.writeFileSync(json, JSON.stringify(foto, null, 2) + '\n'); // salvato a ogni foto: se ti fermi non perdi niente
  aggiunte++;
  const kb = MISURE_FOTO.map((m) => Math.round(fs.statSync(path.join(uscita, `${id}-${m}.webp`)).size / 1024));
  console.log(`  ✓ ${id} (${grande.width} x ${grande.height}, ${kb.join(' + ')} KB)${grande.height > grande.width ? ' · verticale: in home si vede la parte centrale, vedi "fuoco"' : ''}`);
}
rl?.close();

console.log(`\nAggiunte ${aggiunte} foto (in tutto ${foto.length}).`);
if (senzaAlt) console.log(`⚠ ${senzaAlt} foto senza descrizione: scrivila nel campo "alt" di src/data/foto.json, altrimenti il sito non si pubblica.`);
const errori = validaFoto(foto).filter((e) => !e.includes('"alt"'));
if (errori.length) console.log(`⚠ Da controllare:\n - ${errori.join('\n - ')}`);
console.log('Gli originali sono in foto-da-aggiungere/fatte/. Ora: npm run contenuti per controllare, poi invia-su-github.bat.');
