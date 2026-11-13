// Servizio di sincronizzazione di "minuscole" (Fase 6): Cloudflare Worker + KV, piano gratuito.
// Si incolla così com'è nel pannello di Cloudflare (vedi worker/LEGGIMI.md). Nessun segreto qui dentro.
//
// Il servizio NON vede mai i dati in chiaro né il codice: riceve dal browser
//   - un id (32 caratteri esadecimali, ricavato dal codice; dall'id non si torna al codice),
//   - un token (Authorization: Bearer …, ricavato dal codice) di cui salva solo l'hash SHA-256,
//   - una busta cifrata { v: 1, iv, dati } (AES-GCM, la chiave resta nel browser).
//
//   GET    /v1/<id>   → 200 busta | 204 ancora niente | 403 token sbagliato | 410 codice ritirato
//   PUT    /v1/<id>   → 200 salvata (la prima volta il token "prende" l'id; poi serve lo stesso token)
//   DELETE /v1/<id>   → 200 ritirato: i dati si cancellano e l'id resta segnato come ritirato (410),
//                       così i dispositivi col vecchio codice si accorgono di essere stati scollegati
//
// Collegamento KV: variabile "DATI". Variabili facoltative (Impostazioni → Variabili):
//   ORIGINI    = https://sitocompleanno-star.github.io   (siti ammessi, separati da virgola; vuoto = tutti)
//   ID_AMMESSI = id1,id2                                  (se impostata, accetta solo questi id)

const MAX_BYTE = 1024 * 1024; // un anno di diario è ~40 KB cifrato: 1 MB basta per decenni
const ID = /^\/v1\/([0-9a-f]{32})$/;

async function hash(testo) {
  const b = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(testo));
  return Array.from(new Uint8Array(b), (x) => x.toString(16).padStart(2, '0')).join('');
}

function bustaValida(testo) {
  try {
    const b = JSON.parse(testo);
    return b && b.v === 1 && typeof b.iv === 'string' && typeof b.dati === 'string' && Object.keys(b).length === 3;
  } catch {
    return false;
  }
}

export default {
  async fetch(richiesta, env) {
    const origine = richiesta.headers.get('Origin');
    const ammesse = (env.ORIGINI || '').split(',').map((s) => s.trim()).filter(Boolean);
    const intestazioni = {
      'Access-Control-Allow-Origin': ammesse.length ? (ammesse.includes(origine) ? origine : ammesse[0]) : '*',
      'Access-Control-Allow-Methods': 'GET, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Authorization, Content-Type',
      'Access-Control-Max-Age': '86400',
      'Cache-Control': 'no-store',
      Vary: 'Origin',
    };
    const risposta = (stato, corpo = null, tipo = 'application/json') =>
      new Response(corpo, { status: stato, headers: corpo ? { ...intestazioni, 'Content-Type': tipo } : intestazioni });
    const errore = (stato, msg) => risposta(stato, JSON.stringify({ errore: msg }));

    if (richiesta.method === 'OPTIONS') return risposta(204);
    if (origine && ammesse.length && !ammesse.includes(origine)) return errore(403, 'origine non ammessa');

    const url = new URL(richiesta.url);
    if (url.pathname === '/' && richiesta.method === 'GET') {
      return risposta(200, 'minuscole: servizio di sincronizzazione attivo', 'text/plain; charset=utf-8');
    }
    const m = url.pathname.match(ID);
    if (!m) return errore(404, 'percorso sconosciuto');
    const id = m[1];
    if (!env.DATI) return errore(500, 'collegamento KV "DATI" mancante');
    const elenco = (env.ID_AMMESSI || '').split(',').map((s) => s.trim()).filter(Boolean);
    if (elenco.length && !elenco.includes(id)) return errore(403, 'id non ammesso');

    const token = (richiesta.headers.get('Authorization') || '').replace(/^Bearer\s+/i, '');
    if (token.length < 20) return errore(401, 'token mancante');
    const h = await hash(token);

    try {
      const { value, metadata } = await env.DATI.getWithMetadata(id);
      const esiste = value !== null || metadata !== null;
      if (esiste && (!metadata || metadata.h !== h)) return errore(403, 'token sbagliato');
      if (esiste && metadata.r) return errore(410, 'codice ritirato');

      if (richiesta.method === 'GET') {
        // 204 e non 404: "ancora niente" è normale al primo salvataggio, e il browser non lo segna come errore
        return esiste ? risposta(200, value) : risposta(204);
      }
      if (richiesta.method === 'PUT') {
        const corpo = await richiesta.text();
        if (corpo.length > MAX_BYTE) return errore(413, 'troppo grande');
        if (!bustaValida(corpo)) return errore(400, 'serve una busta cifrata { v, iv, dati }');
        await env.DATI.put(id, corpo, { metadata: { h, t: Date.now() } });
        return risposta(200, JSON.stringify({ ok: true }));
      }
      if (richiesta.method === 'DELETE') {
        if (!esiste) return errore(404, 'nessun dato');
        await env.DATI.put(id, '', { metadata: { h, r: 1, t: Date.now() } });
        return risposta(200, JSON.stringify({ ok: true }));
      }
      return errore(405, 'metodo non ammesso');
    } catch (e) {
      // es. più di una scrittura al secondo sulla stessa chiave, o limite giornaliero raggiunto
      return errore(503, String(e && e.message ? e.message : e).slice(0, 200));
    }
  },
};
