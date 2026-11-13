// PDF della cartolina (Fase 5). Caricato SOLO al clic su "Scarica il PDF" (import dinamico in pages/francobolli):
// non pesa sulla pagina finché non serve, e non usa librerie esterne.
//  1. fronte e retro si disegnano su due canvas a 300 dpi (1772 x 1181 px = 150 x 100 mm);
//  2. ogni canvas diventa un JPEG;
//  3. i due JPEG si mettono in un PDF a due pagine da 150 x 100 mm (425,2 x 283,5 punti), scritto qui sotto a
//     mano: un PDF con sole immagini JPEG ha bisogno solo di pochi oggetti (catalogo, pagine, immagini).
import {
  ALTEZZA_MM, ALTEZZA_PX, FRANCOBOLLO_LARGHEZZA, FRANCOBOLLO_RAPPORTO, LARGHEZZA_MM, LARGHEZZA_PX,
  retroSvg, type Cartolina,
} from '../data/cartoline.ts';
import type { FrancobolloAttaccato } from './stato.ts';

const MM_IN_PUNTI = 72 / 25.4;

/** Carica un'immagine. Agli SVG si danno larghezza e altezza esplicite (senza, Firefox non li disegna su canvas). */
async function immagine(url: string, svgTesto?: string): Promise<HTMLImageElement> {
  let src = url;
  let revoca = '';
  if (svgTesto !== undefined || url.endsWith('.svg')) {
    let testo = svgTesto ?? (await (await fetch(url)).text());
    if (!/<svg[^>]*\swidth=/.test(testo)) {
      const vb = testo.match(/viewBox="([^"]+)"/)?.[1].split(/[\s,]+/).map(Number) ?? [0, 0, 100, 100];
      testo = testo.replace('<svg', `<svg width="${vb[2] * 20}" height="${vb[3] * 20}"`);
    }
    src = revoca = URL.createObjectURL(new Blob([testo], { type: 'image/svg+xml' }));
  }
  const img = new Image();
  img.decoding = 'async';
  img.src = src;
  try {
    await img.decode();
  } finally {
    if (revoca) setTimeout(() => URL.revokeObjectURL(revoca), 0);
  }
  return img;
}

function tela(): [HTMLCanvasElement, CanvasRenderingContext2D] {
  const c = document.createElement('canvas');
  c.width = LARGHEZZA_PX;
  c.height = ALTEZZA_PX;
  return [c, c.getContext('2d')!];
}

/** Fronte: grafica a pieno formato + francobolli (centro e rotazione in frazioni, come a schermo). */
export async function disegnaFronte(
  cartolina: Cartolina, francobolli: FrancobolloAttaccato[], base: string, percorso: (id: string) => string | undefined,
): Promise<HTMLCanvasElement> {
  const [c, ctx] = tela();
  ctx.drawImage(await immagine(base + cartolina.fronte), 0, 0, LARGHEZZA_PX, ALTEZZA_PX);
  const w = FRANCOBOLLO_LARGHEZZA * LARGHEZZA_PX;
  const h = w * FRANCOBOLLO_RAPPORTO;
  for (const f of francobolli) {
    const p = percorso(f.id);
    if (!p) continue;
    const img = await immagine(base + p);
    ctx.save();
    ctx.translate(f.x * LARGHEZZA_PX, f.y * ALTEZZA_PX);
    ctx.rotate((f.r * Math.PI) / 180);
    // stessa ombra leggera dello schermo
    ctx.shadowColor = 'rgba(60, 35, 30, 0.28)';
    ctx.shadowBlur = 10;
    ctx.shadowOffsetY = 4;
    ctx.drawImage(img, -w / 2, -h / 2, w, h);
    ctx.restore();
  }
  return c;
}

export async function disegnaRetro(cartolina: Cartolina): Promise<HTMLCanvasElement> {
  const [c, ctx] = tela();
  ctx.drawImage(await immagine('', retroSvg(cartolina, true)), 0, 0, LARGHEZZA_PX, ALTEZZA_PX);
  return c;
}

async function jpeg(c: HTMLCanvasElement): Promise<Uint8Array> {
  const blob = await new Promise<Blob | null>((ok) => c.toBlob(ok, 'image/jpeg', 0.92));
  if (!blob) throw new Error('Impossibile creare l’immagine della cartolina');
  return new Uint8Array(await blob.arrayBuffer());
}

/**
 * PDF con una pagina per immagine (JPEG RGB), ogni pagina `mmL` x `mmA` millimetri e l'immagine a pagina intera.
 * Esportata per i test.
 */
export function pdfDaJpeg(pagine: { dati: Uint8Array; px: number; py: number }[], mmL: number, mmA: number, titolo = ''): Blob {
  const W = (mmL * MM_IN_PUNTI).toFixed(3);
  const H = (mmA * MM_IN_PUNTI).toFixed(3);
  const enc = new TextEncoder();
  const parti: Uint8Array[] = [];
  const offset: number[] = [];
  let pos = 0;
  const scrivi = (x: string | Uint8Array) => {
    const b = typeof x === 'string' ? enc.encode(x) : x;
    parti.push(b);
    pos += b.length;
  };
  // oggetti: 1 catalogo, 2 pagine, 3 info, poi per ogni pagina: pagina, immagine, contenuto
  const n = pagine.length;
  const idPagina = (i: number) => 4 + i * 3;
  const oggetto = (num: number, corpo: string) => {
    offset[num] = pos;
    scrivi(`${num} 0 obj\n${corpo}\nendobj\n`);
  };
  // la seconda riga con caratteri non ASCII dice ai programmi che il file è binario
  scrivi('%PDF-1.4\n%âãÏÓ\n');
  oggetto(1, '<< /Type /Catalog /Pages 2 0 R >>');
  oggetto(2, `<< /Type /Pages /Count ${n} /Kids [${pagine.map((_, i) => `${idPagina(i)} 0 R`).join(' ')}] >>`);
  const titoloPdf = titolo.replace(/[\\()]/g, '\\$&').replace(/[^\x20-\x7e]/g, '');
  oggetto(3, `<< /Title (${titoloPdf}) /Producer (minuscole) >>`);
  pagine.forEach((p, i) => {
    const pg = idPagina(i);
    oggetto(pg, `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${W} ${H}] /TrimBox [0 0 ${W} ${H}]`
      + ` /Resources << /XObject << /Im${i} ${pg + 1} 0 R >> >> /Contents ${pg + 2} 0 R >>`);
    offset[pg + 1] = pos;
    scrivi(`${pg + 1} 0 obj\n<< /Type /XObject /Subtype /Image /Width ${p.px} /Height ${p.py} /ColorSpace /DeviceRGB`
      + ` /BitsPerComponent 8 /Filter /DCTDecode /Length ${p.dati.length} >>\nstream\n`);
    scrivi(p.dati);
    scrivi('\nendstream\nendobj\n');
    const cont = `q ${W} 0 0 ${H} 0 0 cm /Im${i} Do Q`;
    offset[pg + 2] = pos;
    scrivi(`${pg + 2} 0 obj\n<< /Length ${cont.length} >>\nstream\n${cont}\nendstream\nendobj\n`);
  });
  const tot = 4 + n * 3;
  const xref = pos;
  let tab = `xref\n0 ${tot}\n0000000000 65535 f \n`;
  for (let i = 1; i < tot; i++) tab += `${String(offset[i]).padStart(10, '0')} 00000 n \n`;
  scrivi(tab + `trailer\n<< /Size ${tot} /Root 1 0 R /Info 3 0 R >>\nstartxref\n${xref}\n%%EOF\n`);
  return new Blob(parti as BlobPart[], { type: 'application/pdf' });
}

/** Disegna fronte e retro, crea il PDF e lo fa scaricare con il nome indicato. */
export async function scaricaPdf(
  cartolina: Cartolina, francobolli: FrancobolloAttaccato[], base: string,
  percorso: (id: string) => string | undefined, nomeFile: string,
): Promise<void> {
  const [fronte, retro] = await Promise.all([disegnaFronte(cartolina, francobolli, base, percorso), disegnaRetro(cartolina)]);
  const pagine = await Promise.all([fronte, retro].map(async (c) => ({ dati: await jpeg(c), px: c.width, py: c.height })));
  const blob = pdfDaJpeg(pagine, LARGHEZZA_MM, ALTEZZA_MM, `${cartolina.nome} - minuscole`);
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = nomeFile;
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 60_000);
}
