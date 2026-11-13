// Prove della sincronizzazione (Fase 6), senza dipendenze: npm run prova-sync
// Cifratura e codice (src/lib/cifra.ts), Worker con un finto KV (worker/sincronizza.js), copia di sicurezza
// (src/lib/copia.ts) e unione (src/lib/stato.ts). Le prove nel browser (due dispositivi, offline, QR) sono
// descritte in fasi/fase-6/REPORT.md.
import assert from 'node:assert/strict';
import { nuovoCodice, leggiCodice, chiavi, cifra, decifra } from '../src/lib/cifra.ts';
import { creaCopia, leggiCopia, importa } from '../src/lib/copia.ts';
import {
  statoVuoto, impostaGiorno, unisci, uguali, senzaDati, migra, registraVittoria, sbloccati, attaccaFrancobollo,
  alternaPreferito, preferitiValidi, cartolina, chiaveRecord,
} from '../src/lib/stato.ts';
import { gira, muovi, nuovaPartita, vinta } from '../src/lib/memory.ts';
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

// ---- Fase 8: premi e record dei giochi ----
{
  const T = (m) => `2026-11-${String(m).padStart(2, '0')}T10:00:00.000Z`;
  const facile = chiaveRecord('memory', 'facile');
  // stato vecchio (Fase 6, senza premi/record) → migra li crea vuoti
  const vecchio = migra({ versione: 1, giorni: { '2026-11-01': { emozione: 'tenera', modificato: T(1) } } });
  assert.deepEqual(vecchio.premi, {});
  assert.deepEqual(vecchio.record, {});
  assert.deepEqual(migra({ premi: { memory: { quando: 'x' } }, record: { [facile]: { mosse: 0 } } }).record, {});

  // vittoria: premio sbloccato, record; seconda vittoria peggiore non cambia niente, migliore aggiorna il record
  const v1 = registraVittoria(vecchio, 'memory', facile, 12, T(5));
  assert.ok(sbloccati(v1).has('memory'));
  assert.equal(sbloccati(v1).get('memory'), '2026-11-05');
  assert.deepEqual([...sbloccati(v1).keys()], ['tenera', 'memory'], 'ordine di sblocco');
  assert.equal(registraVittoria(v1, 'memory', facile, 15, T(6)), v1);
  const v2 = registraVittoria(v1, 'memory', facile, 9, T(7));
  assert.equal(v2.premi.memory.quando, T(5), 'la prima vittoria resta');
  assert.equal(v2.record[facile].mosse, 9);
  assert.ok(!senzaDati(registraVittoria(statoVuoto(), 'memory', facile, 9)));

  // il premio non dipende dal Diario: cancellando tutti i giorni resta, anche su cartolina e tra i preferiti
  let p = alternaPreferito(v1, 'memory', T(5));
  p = attaccaFrancobollo(p, 'fiore', { id: 'memory', x: 0.8, y: 0.2, r: 0 }, T(5));
  p = impostaGiorno(p, '2026-11-01', null, T(8));
  assert.ok(sbloccati(p).has('memory') && !sbloccati(p).has('tenera'));
  assert.deepEqual(preferitiValidi(p), ['memory']);
  assert.equal(cartolina(p, 'fiore').francobolli[0]?.id, 'memory');

  // unione tra dispositivi: A ha vinto prima (record peggiore), B dopo (record migliore), C pari mosse ma più tardi
  const A = registraVittoria(statoVuoto(), 'memory', facile, 14, T(2));
  const B = registraVittoria(impostaGiorno(statoVuoto(), '2026-11-03', 'grata', T(3)), 'memory', facile, 10, T(4));
  const C = registraVittoria(statoVuoto(), 'memory', facile, 10, T(9));
  const D = registraVittoria(statoVuoto(), 'memory', chiaveRecord('memory', 'difficile'), 20, T(9));
  const ab = unisci(A, B);
  assert.equal(ab.premi.memory.quando, T(2), 'premio: vince la prima vittoria');
  assert.equal(ab.record[facile].mosse, 10, 'record: meno mosse');
  assert.equal(ab.record[facile].quando, T(4));
  assert.equal(unisci(B, C).record[facile].quando, T(4), 'a parità di mosse vince il più vecchio');
  assert.equal(unisci(C, B).record[facile].quando, T(4));
  assert.ok(unisci(A, D).record[chiaveRecord('memory', 'difficile')] && unisci(A, D).record[facile]);
  for (const [x, y] of [[A, B], [B, C], [A, C], [A, D], [v2, B], [p, A], [vecchio, A]]) {
    assert.ok(uguali(unisci(x, y), unisci(y, x)), 'premi: l\'ordine non conta');
    assert.ok(uguali(unisci(unisci(x, y), y), unisci(x, y)), 'premi: ripetere non cambia');
    assert.ok(uguali(unisci(x, x), unisci(x, statoVuoto())), 'premi: unire con se stesso non cambia');
  }
  // associatività su tre dispositivi
  assert.ok(uguali(unisci(unisci(A, B), C), unisci(A, unisci(B, C))));
  // un premio arrivato da un altro dispositivo non viene tolto da un giorno cambiato qui
  const q = unisci(impostaGiorno(A, '2026-11-03', null, T(10)), B);
  assert.ok(sbloccati(q).has('memory'));
  // un dispositivo vecchio (stato senza premi, letto con migra) non fa perdere il premio
  assert.ok(unisci(migra({ giorni: {} }), A).premi.memory);
  // la copia di sicurezza porta anche premi e record
  const imp = importa(statoVuoto(), leggiCopia(JSON.stringify(creaCopia(v2))));
  assert.ok(imp.stato.premi.memory && imp.stato.record[facile].mosse === 9);
  console.log('✓ premi e record dei giochi (Fase 8)');
}

// ---- Fase 8: logica del memory ----
{
  const simboli = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
  for (const coppie of [6, 8]) {
    let p = nuovaPartita(simboli, coppie);
    assert.equal(p.carte.length, coppie * 2);
    for (const s of new Set(p.carte)) assert.equal(p.carte.filter((x) => x === s).length, 2);
    // gioco perfetto: ogni coppia al primo colpo
    const fatti = new Set();
    for (let i = 0; i < p.carte.length; i++) {
      if (fatti.has(i)) continue;
      const j = p.carte.findIndex((x, k) => k !== i && x === p.carte[i]);
      assert.equal(gira(p, i).esito.tipo, 'prima');
      p = gira(p, i).partita;
      const r = gira(p, j);
      assert.equal(r.esito.tipo, 'coppia');
      p = r.partita;
      fatti.add(i); fatti.add(j);
    }
    assert.ok(vinta(p) && p.mosse === coppie);
  }
  // errore: due diverse restano scoperte, una terza carta le rigira; carte trovate non si rigirano
  let p = nuovaPartita(simboli, 6, () => 0.5);
  const i = 0, j = p.carte.findIndex((x) => x !== p.carte[0]);
  p = gira(gira(p, i).partita, j).partita;
  assert.deepEqual(p.scoperte, [i, j]);
  assert.equal(p.mosse, 1);
  const k = p.carte.findIndex((x, n) => n !== i && n !== j);
  p = gira(p, k).partita;
  assert.deepEqual(p.scoperte, [k]);
  assert.equal(gira(p, k).esito.tipo, 'niente', 'la stessa carta due volte non conta');
  // frecce: griglia 3 x 4
  assert.equal(muovi(0, 'ArrowLeft', 12, 3), 0);
  assert.equal(muovi(2, 'ArrowRight', 12, 3), 2);
  assert.equal(muovi(1, 'ArrowDown', 12, 3), 4);
  assert.equal(muovi(10, 'ArrowDown', 12, 3), 10);
  assert.equal(muovi(4, 'End', 12, 3), 5);
  assert.equal(muovi(4, 'Home', 12, 3, true), 0);
  console.log('✓ logica del memory (Fase 8)');
}
