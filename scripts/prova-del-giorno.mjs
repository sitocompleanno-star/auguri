// Prove della foto e della frase del giorno (Fase 7), senza browser: npm run prova-giorno
import assert from 'node:assert/strict';
import { INIZIO, delGiorno, oggiRoma, sequenza } from '../src/lib/del-giorno.js';
import { validaFoto, validaFrasi } from '../src/lib/valida-contenuti.ts';

const voci = (n, aggiunta = '2026-11-01', prefisso = 'v') =>
  Array.from({ length: n }, (_, i) => ({ id: `${prefisso}${String(i).padStart(3, '0')}`, aggiunta }));
const ids = (seq) => seq.map((x) => x.voce?.id ?? null);
const piu = (data, giorni) => new Date(Date.parse(data) + giorni * 86400000).toISOString().slice(0, 10);

// ---- casi limite ----
assert.equal(delGiorno([], '2026-11-13', 'foto'), null, 'nessuna voce');
assert.equal(delGiorno(voci(3, '2026-12-01'), '2026-11-13', 'foto'), null, 'voci aggiunte nel futuro');
assert.equal(delGiorno(voci(1), '2026-11-13', 'foto').id, 'v000', 'una sola voce: sempre quella');
assert.ok(delGiorno(voci(5, '2026-01-01'), '2026-10-01', 'foto'), 'data prima di INIZIO: comunque una voce');
console.log('✓ casi limite');

// ---- stessa data, stessa voce; sequenze indipendenti per foto e frasi ----
const v30 = voci(30);
assert.equal(delGiorno(v30, '2026-12-25', 'foto').id, delGiorno(v30, '2026-12-25', 'foto').id);
assert.equal(delGiorno(v30.slice().reverse(), '2026-12-25', 'foto').id, delGiorno(v30, '2026-12-25', 'foto').id, 'l\'ordine nel JSON non conta');
const fotoSeq = ids(sequenza(v30, INIZIO, '2027-11-01', 'foto'));
const frasiSeq = ids(sequenza(v30, INIZIO, '2027-11-01', 'frasi'));
assert.notDeepEqual(fotoSeq, frasiSeq, 'foto e frasi hanno ordini diversi');
console.log('✓ deterministica');

// ---- giri: in ogni giro escono tutte, nessun doppione a cavallo tra due giri ----
for (const n of [2, 3, 7, 30, 101]) {
  const seq = ids(sequenza(voci(n), INIZIO, piu(INIZIO, n * 12 - 1), 'foto'));
  for (let g = 0; g < 12; g++) {
    assert.equal(new Set(seq.slice(g * n, (g + 1) * n)).size, n, `giro ${g + 1} con ${n} voci: tutte diverse`);
  }
  for (let i = 1; i < seq.length; i++) assert.notEqual(seq[i], seq[i - 1], `${n} voci: due giorni di fila uguali`);
  if (n > 6) assert.notDeepEqual(seq.slice(0, n), seq.slice(n, 2 * n), 'ogni giro ha un ordine diverso');
}
console.log('✓ giri senza ripetizioni');

// ---- voci aggiunte dopo: il giro in corso non cambia, le nuove entrano dal giro successivo ----
{
  const vecchie = voci(10);
  const nuove = voci(5, '2026-11-05', 'n');
  const prima = ids(sequenza(vecchie, INIZIO, piu(INIZIO, 9), 'foto'));
  const dopo = ids(sequenza([...vecchie, ...nuove], INIZIO, piu(INIZIO, 9), 'foto'));
  assert.deepEqual(dopo, prima, 'i primi 10 giorni (giro in corso) restano uguali');
  const giro2 = ids(sequenza([...vecchie, ...nuove], piu(INIZIO, 10), piu(INIZIO, 24), 'foto'));
  assert.equal(new Set(giro2).size, 15, 'il secondo giro ha tutte e 15');
  // aggiunta "oggi": i giorni passati non cambiano
  const oggi = '2027-03-10';
  const senza = sequenza(v30, INIZIO, oggi, 'foto');
  const con = sequenza([...v30, ...voci(20, oggi, 'x')], INIZIO, piu(oggi, -1), 'foto');
  assert.deepEqual(ids(con), ids(senza).slice(0, -1), 'aggiungere oggi non cambia il passato');
}
console.log('✓ aggiunte senza scombinare');

// ---- giorni speciali ----
{
  const base = voci(8);
  const sp = [{ id: 'natale', aggiunta: '2026-11-01', giorno: '12-25' }, { id: 'una-volta', aggiunta: '2026-11-01', giorno: '2027-02-14' }];
  const tutte = [...base, ...sp];
  assert.equal(delGiorno(tutte, '2026-12-25', 'foto').id, 'natale');
  assert.equal(delGiorno(tutte, '2027-12-25', 'foto').id, 'natale', 'ogni anno');
  assert.equal(delGiorno(tutte, '2027-02-14', 'foto').id, 'una-volta');
  assert.notEqual(delGiorno(tutte, '2028-02-14', 'foto')?.id, 'una-volta', 'solo quell\'anno');
  // il giro si ferma il giorno speciale e riprende dopo: togliendo i giorni speciali la sequenza è la stessa
  const con = sequenza(tutte, INIZIO, '2027-03-31', 'foto').filter((x) => !['natale', 'una-volta'].includes(x.voce.id));
  const senza = sequenza(base, INIZIO, piu('2027-03-31', -(2)), 'foto');
  assert.deepEqual(ids(con), ids(senza));
  const conAnno = [...tutte, { id: 'natale-2026', aggiunta: '2026-11-01', giorno: '2026-12-25' }];
  assert.equal(delGiorno(conAnno, '2026-12-25', 'foto').id, 'natale-2026', 'la data con l\'anno vince');
  assert.equal(delGiorno(conAnno, '2027-12-25', 'foto').id, 'natale');
}
console.log('✓ giorni speciali');

// ---- mezzanotte a Roma (ora solare e legale) ----
assert.equal(oggiRoma(new Date('2026-11-13T22:59:59Z')), '2026-11-13');
assert.equal(oggiRoma(new Date('2026-11-13T23:00:00Z')), '2026-11-14');
assert.equal(oggiRoma(new Date('2027-07-01T21:59:59Z')), '2027-07-01');
assert.equal(oggiRoma(new Date('2027-07-01T22:00:00Z')), '2027-07-02');
assert.equal(oggiRoma(new Date('2027-03-28T00:30:00Z')), '2027-03-28', 'cambio ora di marzo');
assert.equal(oggiRoma(new Date('2027-10-30T22:30:00Z')), '2027-10-31', 'cambio ora di ottobre');
console.log('✓ mezzanotte Europe/Rome');

// ---- velocità: 10 anni con 300 voci ----
{
  const t = performance.now();
  for (let i = 0; i < 20; i++) delGiorno(voci(300), '2036-11-01', 'foto');
  const ms = (performance.now() - t) / 20;
  assert.ok(ms < 20, `troppo lento: ${ms.toFixed(1)} ms`);
  console.log(`✓ velocità (${ms.toFixed(2)} ms per 10 anni con 300 voci)`);
}

// ---- controlli dei dati ----
const ok = { id: 'abcd1234', w: 1600, h: 1200, alt: 'Una foto', aggiunta: '2026-11-13' };
assert.deepEqual(validaFoto([ok]), []);
assert.equal(validaFoto([{ ...ok, alt: '' }]).length, 1);
assert.equal(validaFoto([ok, ok]).length, 1, 'id ripetuto');
assert.equal(validaFoto([{ ...ok, fuoco: 'alto' }]).length, 1);
assert.equal(validaFoto([{ ...ok, giorno: '12-25' }, { ...ok, id: 'altra1', giorno: '12-25' }]).length, 1, 'due voci lo stesso giorno');
assert.equal(validaFoto({}).length, 1);
const fr = { id: 'f12345', testo: 'Ciao', autore: 'Marta', aggiunta: '2026-11-13' };
assert.deepEqual(validaFrasi([fr]), []);
assert.deepEqual(validaFrasi([{ ...fr, testo: '🎂'.repeat(60) }]), [], 'le emoji contano 1');
assert.equal(validaFrasi([{ ...fr, testo: 'x'.repeat(61) }]).length, 1);
assert.equal(validaFrasi([{ ...fr, testo: 'a\nb' }]).length, 1);
assert.equal(validaFrasi([{ ...fr, aggiunta: undefined }]).length, 1);
assert.equal(validaFrasi([{ ...fr, autore: 'x'.repeat(25) }]).length, 1);
console.log('✓ controlli dei dati');
console.log('\nTutte le prove della Fase 7 sono passate.');
