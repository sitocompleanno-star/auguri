// Generatore di QR code minimo (Fase 6), scritto a mano per non aggiungere dipendenze. Caricato con import()
// solo quando serve (QR per collegare un dispositivo, cartolina di recupero).
// Copre ciò che serve al link di collegamento (~95 caratteri): modo "byte" (UTF-8), correzione d'errore M
// (~15%), versioni 1-10 (fino a 213 byte). Segue la norma ISO/IEC 18004 (stessa struttura del generatore di
// Project Nayuki): dati → blocchi Reed-Solomon → disposizione a zig-zag → maschera con la penalità minore.

const ECC_PER_BLOCCO = [0, 10, 16, 26, 18, 24, 16, 18, 22, 22, 26]; // livello M, versioni 1-10
const BLOCCHI = [0, 1, 1, 1, 2, 2, 4, 4, 4, 5, 5];
const BIT_FORMATO_M = 0; // livello M nei bit di formato

/** Moduli "grezzi" di una versione (tutto tranne i motivi fissi), come in Nayuki. */
function moduliDati(v: number): number {
  let n = (16 * v + 128) * v + 64;
  if (v >= 2) {
    const a = Math.floor(v / 7) + 2;
    n -= (25 * a - 10) * a - 55;
    if (v >= 7) n -= 36;
  }
  return n;
}
const byteDati = (v: number) => Math.floor(moduliDati(v) / 8) - ECC_PER_BLOCCO[v] * BLOCCHI[v];

// ---- Reed-Solomon su GF(256), polinomio 0x11D ----
function molt(x: number, y: number): number {
  let z = 0;
  for (let i = 7; i >= 0; i--) {
    z = (z << 1) ^ ((z >>> 7) * 0x11d);
    z ^= ((y >>> i) & 1) * x;
  }
  return z;
}
function divisore(grado: number): number[] {
  const r = new Array(grado).fill(0);
  r[grado - 1] = 1;
  let radice = 1;
  for (let i = 0; i < grado; i++) {
    for (let j = 0; j < r.length; j++) {
      r[j] = molt(r[j], radice);
      if (j + 1 < r.length) r[j] ^= r[j + 1];
    }
    radice = molt(radice, 0x02);
  }
  return r;
}
function resto(dati: number[], div: number[]): number[] {
  const r = div.map(() => 0);
  for (const b of dati) {
    const f = b ^ (r.shift() as number);
    r.push(0);
    div.forEach((c, i) => (r[i] ^= molt(c, f)));
  }
  return r;
}

/** Matrice del QR: true = modulo scuro. Lancia un errore se il testo è troppo lungo. */
export function qr(testo: string): boolean[][] {
  const byte = [...new TextEncoder().encode(testo)];
  let v = 1;
  const bitServono = (ver: number) => 4 + (ver < 10 ? 8 : 16) + byte.length * 8;
  while (v <= 10 && bitServono(v) > byteDati(v) * 8) v++;
  if (v > 10) throw new Error('Testo troppo lungo per il QR');

  // ---- flusso di bit: modo byte, lunghezza, dati, terminatore, riempimento ----
  const bit: number[] = [];
  const metti = (val: number, n: number) => {
    for (let i = n - 1; i >= 0; i--) bit.push((val >>> i) & 1);
  };
  metti(0b0100, 4);
  metti(byte.length, v < 10 ? 8 : 16);
  byte.forEach((b) => metti(b, 8));
  const capacita = byteDati(v) * 8;
  metti(0, Math.min(4, capacita - bit.length));
  metti(0, (8 - (bit.length % 8)) % 8);
  for (let p = 0xec; bit.length < capacita; p ^= 0xec ^ 0x11) metti(p, 8);
  const dati: number[] = [];
  for (let i = 0; i < bit.length; i += 8) dati.push(parseInt(bit.slice(i, i + 8).join(''), 2));

  // ---- blocchi con correzione d'errore, poi intercalati ----
  const nBlocchi = BLOCCHI[v];
  const ecc = ECC_PER_BLOCCO[v];
  const grezzi = Math.floor(moduliDati(v) / 8);
  const corti = nBlocchi - (grezzi % nBlocchi);
  const lungCorto = Math.floor(grezzi / nBlocchi);
  const div = divisore(ecc);
  const blocchi: number[][] = [];
  for (let i = 0, k = 0; i < nBlocchi; i++) {
    const d = dati.slice(k, k + lungCorto - ecc + (i < corti ? 0 : 1));
    k += d.length;
    const e = resto(d, div);
    if (i < corti) d.push(0); // segnaposto: i blocchi corti hanno un byte in meno
    blocchi.push([...d, ...e]);
  }
  const finale: number[] = [];
  for (let i = 0; i < blocchi[0].length; i++) {
    blocchi.forEach((b, j) => {
      if (i !== lungCorto - ecc || j >= corti) finale.push(b[i]);
    });
  }

  // ---- matrice: motivi fissi ----
  const n = v * 4 + 17;
  const m: boolean[][] = Array.from({ length: n }, () => new Array(n).fill(false));
  const fisso: boolean[][] = Array.from({ length: n }, () => new Array(n).fill(false));
  const imp = (x: number, y: number, s: boolean) => {
    m[y][x] = s;
    fisso[y][x] = true;
  };
  for (let i = 0; i < n; i++) {
    imp(6, i, i % 2 === 0);
    imp(i, 6, i % 2 === 0);
  }
  const finder = (cx: number, cy: number) => {
    for (let dy = -4; dy <= 4; dy++) {
      for (let dx = -4; dx <= 4; dx++) {
        const d = Math.max(Math.abs(dx), Math.abs(dy));
        const x = cx + dx;
        const y = cy + dy;
        if (x >= 0 && x < n && y >= 0 && y < n) imp(x, y, d !== 2 && d !== 4);
      }
    }
  };
  finder(3, 3);
  finder(n - 4, 3);
  finder(3, n - 4);
  if (v >= 2) {
    const a = Math.floor(v / 7) + 2;
    const passo = Math.floor((v * 8 + a * 3 + 5) / (a * 4 - 4)) * 2;
    const pos = [6];
    for (let p = n - 7; pos.length < a; p -= passo) pos.splice(1, 0, p);
    for (let i = 0; i < a; i++) {
      for (let j = 0; j < a; j++) {
        if ((i === 0 && j === 0) || (i === 0 && j === a - 1) || (i === a - 1 && j === 0)) continue;
        for (let dy = -2; dy <= 2; dy++) {
          for (let dx = -2; dx <= 2; dx++) imp(pos[i] + dx, pos[j] + dy, Math.max(Math.abs(dx), Math.abs(dy)) !== 1);
        }
      }
    }
  }
  const formato = (maschera: number) => {
    const d = (BIT_FORMATO_M << 3) | maschera;
    let r = d;
    for (let i = 0; i < 10; i++) r = (r << 1) ^ ((r >>> 9) * 0x537);
    const b = ((d << 10) | r) ^ 0x5412;
    const bitF = (i: number) => ((b >>> i) & 1) === 1;
    for (let i = 0; i <= 5; i++) imp(8, i, bitF(i));
    imp(8, 7, bitF(6));
    imp(8, 8, bitF(7));
    imp(7, 8, bitF(8));
    for (let i = 9; i < 15; i++) imp(14 - i, 8, bitF(i));
    for (let i = 0; i < 8; i++) imp(n - 1 - i, 8, bitF(i));
    for (let i = 8; i < 15; i++) imp(8, n - 15 + i, bitF(i));
    imp(8, n - 8, true); // modulo scuro
  };
  formato(0); // riserva le posizioni
  if (v >= 7) {
    let r = v;
    for (let i = 0; i < 12; i++) r = (r << 1) ^ ((r >>> 11) * 0x1f25);
    const b = (v << 12) | r;
    for (let i = 0; i < 18; i++) {
      const s = ((b >>> i) & 1) === 1;
      const a = n - 11 + (i % 3);
      const c = Math.floor(i / 3);
      imp(a, c, s);
      imp(c, a, s);
    }
  }

  // ---- dati a zig-zag ----
  let i = 0;
  for (let destra = n - 1; destra >= 1; destra -= 2) {
    if (destra === 6) destra = 5;
    for (let vert = 0; vert < n; vert++) {
      for (let j = 0; j < 2; j++) {
        const x = destra - j;
        const suL = ((destra + 1) & 2) === 0;
        const y = suL ? n - 1 - vert : vert;
        if (!fisso[y][x] && i < finale.length * 8) {
          m[y][x] = ((finale[i >>> 3] >>> (7 - (i & 7))) & 1) === 1;
          i++;
        }
      }
    }
  }

  // ---- maschera: si prova ognuna e si tiene quella con la penalità minore ----
  const condizione = (k: number, x: number, y: number): boolean => {
    switch (k) {
      case 0: return (x + y) % 2 === 0;
      case 1: return y % 2 === 0;
      case 2: return x % 3 === 0;
      case 3: return (x + y) % 3 === 0;
      case 4: return (Math.floor(x / 3) + Math.floor(y / 2)) % 2 === 0;
      case 5: return ((x * y) % 2) + ((x * y) % 3) === 0;
      case 6: return (((x * y) % 2) + ((x * y) % 3)) % 2 === 0;
      default: return (((x + y) % 2) + ((x * y) % 3)) % 2 === 0;
    }
  };
  const applicaMaschera = (k: number) => {
    for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) if (!fisso[y][x] && condizione(k, x, y)) m[y][x] = !m[y][x];
  };
  let migliore = 0;
  let minimo = Infinity;
  for (let k = 0; k < 8; k++) {
    applicaMaschera(k);
    formato(k);
    const p = penalita(m);
    if (p < minimo) {
      minimo = p;
      migliore = k;
    }
    applicaMaschera(k); // la maschera è uno XOR: riapplicata si toglie
  }
  applicaMaschera(migliore);
  formato(migliore);
  return m;
}

/** Penalità della norma (regole 1-4), per scegliere la maschera più facile da leggere. */
function penalita(m: boolean[][]): number {
  const n = m.length;
  let p = 0;
  const righe = (leggi: (a: number, b: number) => boolean) => {
    for (let a = 0; a < n; a++) {
      let corsa = 1;
      let riga = '';
      for (let b = 0; b < n; b++) {
        const s = leggi(a, b);
        riga += s ? '1' : '0';
        if (b > 0 && s === leggi(a, b - 1)) {
          corsa++;
          if (corsa === 5) p += 3;
          else if (corsa > 5) p++;
        } else corsa = 1;
      }
      // regola 3: motivi simili ai quadrati agli angoli
      const bordo = `0000${riga}0000`;
      for (let k = bordo.indexOf('1011101'); k >= 0; k = bordo.indexOf('1011101', k + 1)) {
        if (bordo.slice(k - 4, k) === '0000' || bordo.slice(k + 7, k + 11) === '0000') p += 40;
      }
    }
  };
  righe((a, b) => m[a][b]);
  righe((a, b) => m[b][a]);
  let scuri = 0;
  for (let y = 0; y < n; y++) {
    for (let x = 0; x < n; x++) {
      if (m[y][x]) scuri++;
      if (x < n - 1 && y < n - 1 && m[y][x] === m[y][x + 1] && m[y][x] === m[y + 1][x] && m[y][x] === m[y + 1][x + 1]) p += 3;
    }
  }
  p += Math.floor(Math.abs(scuri * 20 - n * n * 10) / (n * n)) * 10;
  return p;
}

/** SVG del QR (moduli scuri in un unico path), con margine bianco di 4 moduli come chiede la norma. */
export function qrSvg(testo: string, colore = '#221f20'): string {
  const m = qr(testo);
  const n = m.length;
  let d = '';
  m.forEach((riga, y) => riga.forEach((s, x) => {
    if (s) d += `M${x + 4} ${y + 4}h1v1h-1z`;
  }));
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${n + 8} ${n + 8}" shape-rendering="crispEdges">`
    + `<rect width="100%" height="100%" fill="#fff"/><path fill="${colore}" d="${d}"/></svg>`;
}

/** Disegna il QR su un canvas: quadrato di lato `lato` con l'angolo in alto a sinistra in (x, y), margine incluso. */
export function disegnaQr(ctx: CanvasRenderingContext2D, testo: string, x: number, y: number, lato: number, colore = '#221f20'): void {
  const m = qr(testo);
  const n = m.length + 8;
  const u = lato / n;
  ctx.fillStyle = '#fff';
  ctx.fillRect(x, y, lato, lato);
  ctx.fillStyle = colore;
  m.forEach((riga, j) => riga.forEach((s, i) => {
    // arrotondati ai pixel: niente righe sottili tra un modulo e l'altro
    if (s) {
      const x0 = Math.round(x + (i + 4) * u);
      const y0 = Math.round(y + (j + 4) * u);
      ctx.fillRect(x0, y0, Math.round(x + (i + 5) * u) - x0, Math.round(y + (j + 5) * u) - y0);
    }
  }));
}
