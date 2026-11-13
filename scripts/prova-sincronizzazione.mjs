// Prove della sincronizzazione (Fase 6), senza dipendenze: npm run prova-sync
// Cifratura e codice (src/lib/cifra.ts), Worker con un finto KV (worker/sincronizza.js), copia di sicurezza
// (src/lib/copia.ts) e unione (src/lib/stato.ts). Le prove nel browser (due dispositivi, offline, QR) sono
// descritte in fasi/fase-6/REPORT.md.
import assert from 'node:assert/strict';
import { nuovoCodice, leggiCodice, chiavi, cifra, decifra } from '../src/lib/cifra.ts';
import { creaCopia, leggiCopia, importa } from '../src/lib/copia.ts';
import { statoVuoto, impostaGiorno, unisci, uguali, senzaDati } from '../src/lib/stato.ts';
import worker from '../worker/sincronizza.js';

// ---- codice e cifratura ----
const c = nuovoCodice();
assert.match(c, /^[0-9A-Z]{5}(-[0-9A-Z]{5}){4}$/);
assert.equal(leggiCodice(c.toLowerCase().replace(/-/g, ' ')), c);
assert.equal(leggiCodice(`https://x/auguri/dispositivi/#collega=${c}`), c);
assert.equal(leggiCodice(c.slice(0, -1) + (c.endsWith('0') ? '1' : '0')), null);
const k = await chiavi(c);
assert.match(k.id, /^[0-9a-f]{32}$/);
const s = impostaGiorno(statoVuoto(), '2026-11-13', 'realizzata', '2026-11-13T10:00:00.000Z');
const busta = await cifra(k, s);
assert.ok(!JSON.stringify(busta).includes('realizzata'));
assert.deepEqual(await decifra(k, busta), s);
await assert.rejects(decifra(await chiavi(nuovoCodice()), busta));
await assert.rejects(decifra({ ...k, id: 'f'.repeat(32) }, busta));
console.log('✓ codice e cifratura');

// ---- worker ----
const m = new Map();
const DATI = {
  async getWithMetadata(id) { return m.get(id) ?? { value: null, metadata: null }; },
  async put(id, value, o) { m.set(id, { value, metadata: o?.metadata ?? null }); },
};
const f = (metodo, corpo, token = k.token) => worker.fetch(new Request(`https://w.dev/v1/${k.id}`, {
  method: metodo, body: corpo, headers: { Authorization: `Bearer ${token}` },
}), { DATI });
assert.equal((await f('GET')).status, 204);
assert.equal((await f('PUT', JSON.stringify(s))).status, 400, 'niente testo in chiaro');
assert.equal((await f('PUT', JSON.stringify(busta))).status, 200);
assert.equal((await f('GET', undefined, 'x'.repeat(43))).status, 403);
assert.deepEqual(await decifra(k, await (await f('GET')).json()), s);
assert.ok(!JSON.stringify([...m]).includes(k.token));
assert.equal((await f('DELETE')).status, 200);
assert.equal((await f('GET')).status, 410);
console.log('✓ worker');

// ---- copia di sicurezza e unione ----
const a = impostaGiorno(statoVuoto(), '2026-11-10', 'grata', '2026-11-12T10:00:00.000Z');
const b = impostaGiorno(impostaGiorno(statoVuoto(), '2026-11-10', 'tenera', '2026-11-12T12:00:00.000Z'), '2026-11-09', 'libera', '2026-11-12T12:00:00.000Z');
const testo = JSON.stringify(creaCopia(b));
const e = importa(a, leggiCopia(testo));
assert.equal(e.stato.giorni['2026-11-10'].emozione, 'tenera');
assert.equal(e.cambiati, 2);
assert.ok(uguali(unisci(a, b), unisci(b, a)), 'l\'ordine non conta');
assert.ok(uguali(unisci(unisci(a, b), b), unisci(a, b)), 'ripetere non cambia');
assert.throws(() => leggiCopia('{"ciao":1}'));
assert.ok(senzaDati(statoVuoto()) && !senzaDati(a));
console.log('✓ copia di sicurezza e unione');
