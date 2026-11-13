// Cifratura per la sincronizzazione (Fase 6). Solo Web Crypto: niente librerie, gira nel browser e in Node 22.
//
// Il CODICE è l'unico segreto: 120 bit casuali generati sul dispositivo (crypto.getRandomValues), scritti in
// base32 "Crockford" (niente I, L, O, U: non si confondono) + 1 lettera di controllo, in 5 gruppi da 5:
//   "7KQ2M-XW9PA-0HT4C-NB3RD-Y6FGE"
// Dal codice si ricavano con HKDF-SHA256 tre cose indipendenti:
//   - id     (32 caratteri esadecimali): il nome dei dati sul servizio. Dall'id non si torna al codice;
//   - token  (base64url): la "password" per leggere e scrivere sul servizio, che ne salva solo l'hash;
//   - chiave AES-GCM a 256 bit: cifra i dati nel browser. Non lascia mai il dispositivo.
// Il servizio vede quindi: id, hash del token, e una busta { v, iv, dati } con dati cifrati e autenticati
// (l'id è usato come "dati associati": una busta copiata sotto un altro id non si apre).

const ALFABETO = '0123456789ABCDEFGHJKMNPQRSTVWXYZ';
const BYTE_CODICE = 15; // 120 bit = 24 caratteri base32
const SALE = new TextEncoder().encode('minuscole-sync-v1');
const enc = new TextEncoder();
const dec = new TextDecoder();

export interface Chiavi {
  id: string;
  token: string;
  chiave: CryptoKey;
}

export interface Busta {
  v: 1;
  iv: string;
  dati: string;
}

// ---- base32 / base64url ----

function base32(b: Uint8Array): string {
  let bit = 0;
  let val = 0;
  let out = '';
  for (const x of b) {
    val = (val << 8) | x;
    bit += 8;
    while (bit >= 5) {
      out += ALFABETO[(val >>> (bit - 5)) & 31];
      bit -= 5;
    }
  }
  if (bit > 0) out += ALFABETO[(val << (5 - bit)) & 31];
  return out;
}

function daBase32(s: string): Uint8Array {
  const out: number[] = [];
  let bit = 0;
  let val = 0;
  for (const c of s) {
    val = (val << 5) | ALFABETO.indexOf(c);
    bit += 5;
    if (bit >= 8) {
      out.push((val >>> (bit - 8)) & 255);
      bit -= 8;
    }
  }
  return new Uint8Array(out);
}

/** Lettera di controllo: somma pesata dei 24 caratteri, modulo 31 (scopre un carattere sbagliato o due scambiati). */
function controllo(dati: string): string {
  let somma = 0;
  for (let i = 0; i < dati.length; i++) somma += (i + 1) * ALFABETO.indexOf(dati[i]);
  return ALFABETO[somma % 31]; // 31 è primo: due caratteri vicini scambiati cambiano la somma
}

export function base64url(b: Uint8Array): string {
  let s = '';
  for (const x of b) s += String.fromCharCode(x);
  return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

export function daBase64url(s: string): Uint8Array {
  const b = atob(s.replace(/-/g, '+').replace(/_/g, '/') + '==='.slice((s.length + 3) % 4));
  return Uint8Array.from(b, (c) => c.charCodeAt(0));
}

const esadecimale = (b: Uint8Array) => Array.from(b, (x) => x.toString(16).padStart(2, '0')).join('');

// ---- codice ----

/** Nuovo codice casuale, già nella forma con i trattini. */
export function nuovoCodice(): string {
  const dati = base32(crypto.getRandomValues(new Uint8Array(BYTE_CODICE)));
  return formatta(dati + controllo(dati));
}

/** "7KQ2MXW9PA..." → "7KQ2M-XW9PA-..." */
export function formatta(compatto: string): string {
  return compatto.match(/.{1,5}/g)!.join('-');
}

/**
 * Legge un codice scritto a mano o incollato (anche dentro un link `…#collega=…`).
 * Accetta minuscole, spazi e trattini; corregge O→0 e I/L→1. Restituisce il codice formattato o null.
 */
export function leggiCodice(testo: string): string | null {
  const dalLink = testo.match(/collega=([0-9A-Za-z-]+)/);
  const s = (dalLink ? dalLink[1] : testo)
    .toUpperCase()
    .replace(/[\s-]/g, '')
    .replace(/O/g, '0')
    .replace(/[IL]/g, '1');
  if (s.length !== 25 || [...s].some((c) => !ALFABETO.includes(c))) return null;
  const dati = s.slice(0, 24);
  return controllo(dati) === s[24] ? formatta(s) : null;
}

/** Ricava id, token e chiave dal codice (formattato o compatto). */
export async function chiavi(codice: string): Promise<Chiavi> {
  const s = codice.replace(/-/g, '');
  const grezzo = daBase32(s.slice(0, 24));
  const base = await crypto.subtle.importKey('raw', grezzo as BufferSource, 'HKDF', false, ['deriveBits', 'deriveKey']);
  const bit = (info: string, n: number) =>
    crypto.subtle.deriveBits({ name: 'HKDF', hash: 'SHA-256', salt: SALE, info: enc.encode(info) }, base, n * 8);
  const [id, token, chiave] = await Promise.all([
    bit('minuscole:id', 16),
    bit('minuscole:token', 32),
    crypto.subtle.deriveKey(
      { name: 'HKDF', hash: 'SHA-256', salt: SALE, info: enc.encode('minuscole:chiave') },
      base, { name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt'],
    ),
  ]);
  return { id: esadecimale(new Uint8Array(id)), token: base64url(new Uint8Array(token)), chiave };
}

// ---- cifratura ----

/** Cifra un oggetto (JSON) in una busta. IV nuovo e casuale a ogni chiamata. */
export async function cifra(k: Chiavi, valore: unknown): Promise<Busta> {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const dati = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv, additionalData: enc.encode(k.id) }, k.chiave, enc.encode(JSON.stringify(valore)),
  );
  return { v: 1, iv: base64url(iv), dati: base64url(new Uint8Array(dati)) };
}

/** Apre una busta. Lancia un errore se la chiave è sbagliata o i dati sono stati alterati. */
export async function decifra(k: Chiavi, busta: unknown): Promise<unknown> {
  const b = busta as Partial<Busta> | null;
  if (!b || b.v !== 1 || typeof b.iv !== 'string' || typeof b.dati !== 'string') throw new Error('Busta non valida');
  const chiaro = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: daBase64url(b.iv) as BufferSource, additionalData: enc.encode(k.id) },
    k.chiave, daBase64url(b.dati) as BufferSource,
  );
  return JSON.parse(dec.decode(chiaro));
}
