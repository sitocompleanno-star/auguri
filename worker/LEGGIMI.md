# Servizio di sincronizzazione · come pubblicarlo su Cloudflare (dal pannello)

Serve una volta sola, ~10 minuti. Tutto gratuito, nessun programma da installare.
Il servizio vede **solo dati cifrati**: niente da proteggere qui dentro, nessuna chiave da copiare nel repo.

## 1. Account
Crea un account gratuito su https://dash.cloudflare.com (basta l'email). Non serve un dominio.

## 2. Spazio per i dati (KV)
1. Nel menu a sinistra: **Storage & Databases → Workers KV** (in alcune versioni del pannello: *Workers & Pages → KV*).
2. **Create** (o *Create namespace*), nome: `minuscole-dati` → crea.

## 3. Il Worker
1. Menu a sinistra: **Compute (Workers) → Workers & Pages** → **Create** → *Worker* → *Start with Hello World*.
2. Nome: `minuscole-sync` → **Deploy**.
3. Apri il Worker → **Edit code**. Cancella tutto, incolla il contenuto di `worker/sincronizza.js` → **Deploy**.

## 4. Collegare il KV al Worker
1. Nel Worker: **Settings → Bindings → Add → KV namespace**.
2. *Variable name*: `DATI` (proprio così, maiuscolo). *KV namespace*: `minuscole-dati`. Salva (**Deploy**).

## 5. Solo il sito può usarlo (consigliato)
Nel Worker: **Settings → Variables and Secrets → Add** → tipo *Text*:
- nome `ORIGINI`, valore `https://sitocompleanno-star.github.io` (senza `/auguri` e senza `/` finale) → Deploy.

## 6. Prova
Apri l'indirizzo del Worker (è scritto nella sua pagina, tipo `https://minuscole-sync.<tuonome>.workers.dev`).
Deve comparire: `minuscole: servizio di sincronizzazione attivo`.

## 7. Dire al sito dove si trova
In `src/data/sincronizzazione.ts` metti l'indirizzo:
```ts
export const URL_SERVIZIO = 'https://minuscole-sync.<tuonome>.workers.dev';
```
Poi commit e push (`invia-su-github.bat`). Non è un segreto: è solo l'indirizzo del servizio.
Da quel momento, al primo salvataggio, il telefono crea il suo codice e comincia a sincronizzare.

## 8. (Facoltativo, dopo) Solo il suo codice
Quando lei ha collegato i suoi dispositivi, puoi chiudere del tutto il servizio a chiunque altro.
Nel pannello: **Storage & Databases → Workers KV → minuscole-dati**: vedi le chiavi (32 caratteri esadecimali,
di solito una sola). Aggiungi al Worker la variabile `ID_AMMESSI` con quella chiave (più chiavi separate da virgola).
⚠️ Se poi lei usa "Cambia codice", la chiave cambia: o togli `ID_AMMESSI`, o aggiorni il valore.

## Limiti del piano gratuito (si azzerano ogni giorno a mezzanotte UTC)
| | Limite | Uso stimato (2 dispositivi) |
|---|---|---|
| Richieste al Worker | 100.000 / giorno | ~100 |
| Letture KV | 100.000 / giorno | ~70 |
| Scritture KV | 1.000 / giorno | ~10 (giornata intensa con le cartoline: ~50) |
| Spazio KV | 1 GB | ~40 KB per anno di diario |

Se un limite si superasse, quel giorno la sincronizzazione segna "errore" e riprova; il sito continua a funzionare
in locale e il giorno dopo si rimette in pari da sola.

## Provare in locale senza Cloudflare
```
npm run servizio                                  # servizio finto su http://localhost:8787
PUBLIC_SYNC_URL=http://localhost:8787 npm run dev # sito che lo usa (su Windows: set PUBLIC_SYNC_URL=... poi npm run dev)
```
`http://localhost:8787/__tutto` mostra cosa ha salvato il servizio (solo buste cifrate).
