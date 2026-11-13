// Cartolina di recupero (Fase 6): PDF da 10 x 15 cm con il QR e il codice della sincronizzazione.
// Se tutti i dispositivi perdono il codice, la si inquadra (o si scrive il codice in /dispositivi/) e i dati
// tornano. Caricata con import() solo al clic; riusa il generatore PDF delle cartoline (pdfDaJpeg).
import { ALTEZZA_MM, ALTEZZA_PX, LARGHEZZA_MM, LARGHEZZA_PX } from '../data/cartoline.ts';
import { pdfDaJpeg } from './pdf-cartolina.ts';
import { disegnaQr } from './qr.ts';

const BORDEAUX = '#6f211c';
const INCHIOSTRO = '#221f20';
const SERIF = "'Playfair Display', Georgia, 'Times New Roman', serif";
const SANS = "Arial, 'Helvetica Neue', Helvetica, sans-serif";

/** Scrive `testo` andando a capo entro `larghezza`; restituisce la y sotto l'ultima riga. */
function paragrafo(ctx: CanvasRenderingContext2D, testo: string, x: number, y: number, larghezza: number, riga: number): number {
  let linea = '';
  for (const parola of testo.split(' ')) {
    const prova = linea ? `${linea} ${parola}` : parola;
    if (ctx.measureText(prova).width > larghezza && linea) {
      ctx.fillText(linea, x, y);
      y += riga;
      linea = parola;
    } else linea = prova;
  }
  if (linea) ctx.fillText(linea, x, y);
  return y + riga;
}

export function disegnaRecupero(codice: string, link: string, data: string): HTMLCanvasElement {
  const c = document.createElement('canvas');
  c.width = LARGHEZZA_PX;
  c.height = ALTEZZA_PX;
  const ctx = c.getContext('2d')!;
  const W = LARGHEZZA_PX;
  const H = ALTEZZA_PX;

  ctx.fillStyle = '#fbf1ea';
  ctx.fillRect(0, 0, W, H);
  ctx.strokeStyle = BORDEAUX;
  ctx.lineWidth = 6;
  ctx.strokeRect(48, 48, W - 96, H - 96);

  // titolo
  ctx.fillStyle = BORDEAUX;
  ctx.textBaseline = 'alphabetic';
  ctx.font = `italic 400 104px ${SERIF}`;
  ctx.fillText('minuscole', 110, 205);
  ctx.font = `400 50px ${SERIF}`;
  ctx.fillText('cartolina di recupero', 112, 275);

  // QR a destra (con il suo margine bianco)
  const lato = 580;
  disegnaQr(ctx, link, W - 110 - lato, 100, lato, INCHIOSTRO);

  // istruzioni a sinistra
  ctx.fillStyle = INCHIOSTRO;
  ctx.font = `400 38px ${SANS}`;
  let y = 375;
  y = paragrafo(ctx, 'Se un telefono o un computer non trova più il diario:', 112, y, 900, 52);
  y += 14;
  y = paragrafo(ctx, '1. inquadra il QR con la fotocamera e apri il link;', 112, y, 900, 52);
  y = paragrafo(ctx, '2. oppure apri il sito, vai su «Dispositivi» e scrivi il codice qui sotto.', 112, y, 900, 52);

  // codice
  const yCod = 800;
  ctx.fillStyle = '#fff';
  ctx.fillRect(110, yCod, W - 220, 150);
  ctx.strokeStyle = BORDEAUX;
  ctx.lineWidth = 3;
  ctx.strokeRect(110, yCod, W - 220, 150);
  ctx.fillStyle = BORDEAUX;
  ctx.font = `700 82px 'Courier New', Courier, monospace`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(codice, W / 2, yCod + 78);

  // nota
  ctx.fillStyle = '#6b6363';
  ctx.font = `400 30px ${SANS}`;
  ctx.textBaseline = 'alphabetic';
  ctx.fillText(`Creata il ${data}. Chi ha questa cartolina può leggere il diario: tienila in un posto sicuro.`, W / 2, 1060);
  ctx.textAlign = 'start';
  return c;
}

export async function scaricaRecupero(codice: string, link: string): Promise<void> {
  const data = new Intl.DateTimeFormat('it-IT', { timeZone: 'Europe/Rome', day: 'numeric', month: 'long', year: 'numeric' }).format(new Date());
  const tela = disegnaRecupero(codice, link, data);
  const blob = await new Promise<Blob | null>((ok) => tela.toBlob(ok, 'image/jpeg', 0.95));
  if (!blob) throw new Error('Impossibile creare l’immagine della cartolina');
  const pdf = pdfDaJpeg([{ dati: new Uint8Array(await blob.arrayBuffer()), px: tela.width, py: tela.height }],
    LARGHEZZA_MM, ALTEZZA_MM, 'Cartolina di recupero - minuscole');
  const url = URL.createObjectURL(pdf);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'minuscole-cartolina-di-recupero.pdf';
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 60_000);
}
