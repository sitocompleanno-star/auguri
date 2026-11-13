// Servizio di sincronizzazione IN LOCALE (Fase 6), per provare senza Cloudflare:
//   npm run servizio            → http://localhost:8787 (dati in memoria, si perdono alla chiusura)
// e in un altro terminale:
//   PUBLIC_SYNC_URL=http://localhost:8787 npm run dev
// Fa girare lo stesso worker/sincronizza.js con un finto KV. In più c'è GET /__tutto, che mostra tutto quello
// che il servizio ha salvato: serve a controllare che non ci sia niente in chiaro. (Su Cloudflare non esiste.)
import { createServer } from 'node:http';
import worker from '../worker/sincronizza.js';

const porta = Number(process.env.PORT || 8787);
const archivio = new Map(); // id → { value, metadata }

const kv = {
  async getWithMetadata(id) {
    const x = archivio.get(id);
    return x ? { value: x.value, metadata: x.metadata } : { value: null, metadata: null };
  },
  async put(id, value, opz = {}) {
    archivio.set(id, { value, metadata: opz.metadata ?? null });
  },
};
const env = { DATI: kv, ORIGINI: process.env.ORIGINI || '' };
let richieste = 0;
let scritture = 0;

createServer(async (req, res) => {
  const corpo = await new Promise((ok) => {
    const parti = [];
    req.on('data', (p) => parti.push(p));
    req.on('end', () => ok(Buffer.concat(parti)));
  });
  if (req.url === '/__tutto') {
    res.writeHead(200, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
    res.end(JSON.stringify({ richieste, scritture, dati: Object.fromEntries(archivio) }, null, 2));
    return;
  }
  richieste++;
  if (req.method === 'PUT' || req.method === 'DELETE') scritture++;
  const r = await worker.fetch(
    new Request(`http://localhost:${porta}${req.url}`, {
      method: req.method,
      headers: req.headers,
      body: ['GET', 'HEAD', 'OPTIONS'].includes(req.method) ? undefined : corpo,
    }),
    env,
  );
  res.writeHead(r.status, Object.fromEntries(r.headers));
  res.end(Buffer.from(await r.arrayBuffer()));
  if (!process.env.SILENZIO) console.log(req.method, req.url, r.status);
}).listen(porta, () => console.log(`Servizio locale su http://localhost:${porta}  (GET /__tutto per vedere cosa c'è salvato)`));
