# Report · Fase 6 · Sincronizzazione tra dispositivi

Data: 2026-11-13

## Obiettivo
Stessi giorni, francobolli, preferiti e cartoline su più dispositivi, senza login. Il codice segreto nasce sul dispositivo e i dati si cifrano nel browser; un piccolo servizio gratuito conserva solo dati cifrati. Si collega un altro dispositivo con QR o link. C'è una copia di sicurezza in un file, e l'importazione unisce.

## Decisioni prese con William (prima di iniziare)
1. **Cloudflare Workers + KV, pubblicato dal pannello web** (nessun programma da installare). Il codice del Worker è nel repo (`worker/sincronizza.js`) e la guida passo passo è in `worker/LEGGIMI.md`.
2. **Codice perso → cartolina di recupero + file.** Un PDF 10 x 15 da stampare con QR e codice leggibile (stesso generatore PDF delle cartoline), più l'esportazione del file.
3. **Scollegare: questo dispositivo + tutti gli altri.** "Scollega questo dispositivo" dimentica il codice e lascia i dati sul dispositivo. "Cambia codice" crea un codice nuovo con una cifratura nuova e ritira il vecchio: gli altri dispositivi restano fuori finché non li ricolleghi.
4. **Pagina dedicata `/dispositivi/`**, raggiunta da un piccolo link in fondo alla pagina Francobolli. L'Archivio resta libero per la Fase 10.

## Fatto

### Cifratura (`src/lib/cifra.ts`, solo Web Crypto)
- **Codice**: 120 bit casuali (`crypto.getRandomValues`), in base32 Crockford (niente I, L, O, U) più 1 lettera di controllo, in 5 gruppi da 5: `7KQ2M-XW9PA-0HT4C-NB3RD-Y6FGE`.
  - `leggiCodice()` accetta minuscole, spazi, trattini e un link intero, e corregge O→0 e I/L→1.
  - La lettera di controllo scopre quasi tutti gli errori di battitura (in prova: 2 casi non scoperti su ~750, solo lo scambio 0↔Z). Un codice sbagliato che sfugge al controllo non trova dati sul servizio, e il collegamento si ferma con un messaggio.
- Dal codice, con **HKDF-SHA256** (sale fisso, tre "info" diverse), si ricavano tre cose indipendenti:
  - `id` (32 esadecimali): il nome dei dati sul servizio;
  - `token`: la password per il servizio, che ne salva solo l'hash SHA-256;
  - **chiave AES-GCM 256**: non lascia mai il browser.
  - Dall'id e dal token non si risale né al codice né alla chiave.
- **Busta** `{ v: 1, iv, dati }`: AES-GCM con IV casuale a ogni invio. L'id è usato come *dati associati*: una busta spostata sotto un altro id non si apre.

### Servizio (`worker/sincronizza.js`, ~100 righe, da incollare nel pannello)
- `GET /v1/<id>` → 200 busta | 204 ancora niente | 403 token sbagliato | 410 codice ritirato.
- `PUT /v1/<id>` → salva. La prima volta il token "prende" l'id; dopo serve lo stesso token. Accetta **solo** una busta `{ v, iv, dati }` (un JSON in chiaro viene rifiutato con 400), al massimo 1 MB.
- `DELETE /v1/<id>` → **ritira**: i dati si cancellano e l'id resta segnato, così i dispositivi col vecchio codice ricevono 410 e sanno di essere stati scollegati. Se si cancellasse e basta, riscriverebbero i dati alla prima sincronizzazione.
- Tutte le richieste vogliono `Authorization: Bearer <token>`.
- KV: valore = busta, metadati = `{ h: hash del token, t: data, r: ritirato }`.
- Variabili facoltative (solo nel pannello):
  - `ORIGINI`: accetta solo il sito, anche per CORS;
  - `ID_AMMESSI`: chiude il servizio a qualunque altro id.
- `scripts/servizio-locale.mjs` (`npm run servizio`): fa girare **lo stesso Worker** in Node con un KV finto, più `GET /__tutto` per vedere cosa è stato salvato. Serve a provare senza Cloudflare.

### Motore (`src/lib/sincronizza.ts`, avviato da `Base.astro` su ogni pagina, chunk da 11 KB)
- Il codice sta in `localStorage` sotto **`minuscole:sync`**, separato da `minuscole:stato`: non finisce mai nella copia di sicurezza.
- **Primo salvataggio**: il codice si crea da solo quando c'è qualcosa da salvare. Se lo stato è vuoto non si crea niente e non parte nessuna richiesta.
- **Una sincronizzazione**:
  1. scarica e apre la busta;
  2. fa `unisci(locale, remoto)`;
  3. salva in locale se cambia qualcosa (senza contarlo come modifica dell'utente);
  4. invia l'unione se il servizio non l'ha già.
  - `unisci` non perde dati e non dipende dall'ordine né dalle ripetizioni: lo provano le funzioni pure. Per questo i conflitti tra dispositivi si risolvono da soli.
- **Quando si sincronizza**:
  - all'apertura della pagina e al ritorno sulla scheda. Si salta se l'ultimo controllo è di meno di 20 s fa **e** lo stato locale è uguale a quello allineato (impronta SHA-256 salvata);
  - 3 s dopo una modifica: più modifiche ravvicinate diventano un invio;
  - quando torna la rete (evento `online`);
  - subito, se si lascia la pagina con una modifica non inviata (`keepalive`);
  - **10 s dopo ogni invio, un controllo**: se un altro dispositivo ha scritto nello stesso istante e ci ha sovrascritto, si rimanda l'unione.
- **Senza rete o con il servizio giù** il sito funziona come prima: tutto è in locale e si riprova dopo 15 s, 30 s, 1, 2 e poi ogni 5 minuti.
- KV può restituire per qualche secondo la versione precedente: per 2 minuti non si rimanda la stessa unione appena inviata.
- Una sola sincronizzazione alla volta, anche tra schede (Web Locks). Un cambio di codice in un'altra scheda viene notato (evento `storage`).
- **Fasi**: `non-attiva`, `non-collegato`, `in-corso`, `sincronizzato`, `offline`, `errore`, `ritirato`. Si annunciano con l'evento `minuscole:sync`; `osservaSync(f)` le segue.
- **Azioni**:
  - `attiva()`: crea il codice subito, anche senza dati;
  - `collega(testo)`: scarica, unisce i dati di qui con quelli del servizio, poi sincronizza. Si rifiuta se con quel codice non c'è niente;
  - `scollega()`;
  - `cambiaCodice()`: prima sincronizza, poi invia col codice nuovo, poi ritira il vecchio;
  - `esporta()`, `importaFile()`.
- Se l'indirizzo del servizio è vuoto (oggi) il motore non fa niente: nessuna richiesta, il sito è identico alla Fase 5.

### Copia di sicurezza (`src/lib/copia.ts`, funzioni pure)
- File `minuscole-copia-AAAA-MM-GG.json` = `{ app, tipo, esportato, stato }`, **senza codice**.
- L'importazione accetta anche lo stato "nudo" di localStorage. **Unisce** con `unisci` e dice quanti giorni sono cambiati. Un file sbagliato dà un messaggio chiaro.

### QR (`src/lib/qr.ts`, 4 KB, caricato con `import()` solo al clic)
- Scritto a mano: modo byte (UTF-8), correzione M, versioni 1-10, scelta della maschera con le penalità della norma.
- Il link di collegamento (~95 caratteri) diventa un QR versione 6 (41 x 41).
- `qrSvg()` per lo schermo, `disegnaQr()` per il canvas (moduli arrotondati ai pixel).

### Cartolina di recupero (`src/lib/cartolina-recupero.ts`, caricata al clic)
- Canvas 1772 x 1181 (150 x 100 mm a 300 dpi): titolo, istruzioni, QR, codice grande in un riquadro, data e avviso "tienila in un posto sicuro".
- Diventa un JPEG, poi `pdfDaJpeg` della Fase 5: un PDF di 1 pagina.

### Pagina `/dispositivi/` (`src/pages/dispositivi/index.astro`)
- **Stato** in alto: spia + parola (non solo colore) + dettaglio ("Ultimo controllo oggi alle 16:51") + "Sincronizza ora". La spia pulsa in sincronizzazione, ferma con reduced-motion.
- **Arrivo dal QR o dal link** (`/dispositivi/#collega=<codice>`):
  - il codice sta dopo il `#`, quindi non arriva a GitHub Pages né al servizio;
  - viene tolto subito dall'indirizzo e dalla cronologia (`history.replaceState`);
  - si chiede conferma ("Collegare questo dispositivo?") con il focus sul riquadro.
- **Collega un altro dispositivo**: "Mostra il QR" apre QR, codice, "Copia il link", "Condividi" (dove c'è) e "Nascondi". C'è un avviso: chi ha il QR può leggere il diario.
- **Collega questo dispositivo**: campo per il codice (o un link incollato). Dopo un "Cambia codice" altrove compare anche "Usa un codice nuovo".
- **Cartolina di recupero** · **Copia di sicurezza** (Esporta / Importa) · **Scollega** (due pulsanti, ognuno con conferma in `<dialog>`).
- Le sezioni appaiono solo quando servono: senza servizio restano lo stato e la copia di sicurezza.
- **Annunci** in `role="status"`: offline, errore, codice ritirato, esito delle azioni, e "Sincronizzato" solo dopo "Sincronizza ora" (non a ogni controllo automatico).
- Pulsanti alti almeno 44 px, focus visibile (2 px bordeaux), misure in punti mockup con minimi in px.
- **Link** in fondo alla pagina Francobolli: "Dispositivi e copia di sicurezza", con accanto lo stato breve (spia + "sincronizzato" / "offline" / "errore" / "da ricollegare"), solo se la sincronizzazione è attiva.

### Altro
- `stato.ts`: due funzioni pure in più, `canonico`/`uguali` (JSON con le chiavi in ordine) e `senzaDati`. Nessuna modifica a quelle esistenti, `versione` resta 1.
- `src/data/sincronizzazione.ts`: indirizzo del servizio (`URL_SERVIZIO`, vuoto) e tempi.
- `package.json`: `npm run servizio` e `npm run prova-sync` (prove senza browser).

## Verifiche
- `npm run build` (`BASE=/auguri`): 8 pagine, nessun avviso.
- `npm run prova-sync`: codice (formato, errori, link), cifratura (chiave sbagliata, busta alterata, busta spostata sotto un altro id), Worker (204/403/410, niente testo in chiaro, token non salvato), copia e unione (ordine e ripetizioni non contano).
- **Due contesti di Chrome** (Playwright, 390 x 844, Europe/Rome) contro il servizio locale, con una build che lo usa (`PUBLIC_SYNC_URL`). Due giri completi senza errori:
  - A senza dati: nessun codice e **0 richieste**. Primo salvataggio **dal Diario vero** (Felice → Orgogliosa → Realizzata): codice creato e 1 scrittura;
  - due modifiche a 0,8 s di distanza → **1 sola scrittura**;
  - QR a schermo letto con zxing → link giusto;
  - B aveva già dati suoi (e un suo codice). Col link: conferma, collegamento, unione. **Conflitti sullo stesso giorno**: vince il più recente in entrambe le direzioni;
  - cancellazione di un giorno (`null` più recente) e preferiti arrivano sull'altro dispositivo;
  - **modifiche contemporanee** su A e B: uno sovrascrive l'altro, il controllo a 10 s ripara, nessuna perdita;
  - cartolina con francobollo (posizione e rotazione) arriva sull'altro;
  - **offline**: stato "Offline" annunciato, modifica tenuta in locale; tornata la rete arriva su A (con ricarica, e senza ricarica tramite evento `online`);
  - **il servizio non vede testo in chiaro**: nelle voci salvate non ci sono nomi di emozioni, date, "giorni", "preferiti", "fiore", né il codice; solo `{ v, iv, dati }` e metadati `h, t`;
  - esportazione senza codice; importazione in un terzo contesto che **unisce** (il giorno che c'era resta); file sbagliato → messaggio;
  - cartolina di recupero: `pdfinfo` 425,197 x 283,465 punti (150 x 100 mm), QR **stampato** letto da zxing a 120 dpi;
  - **Cambia codice**: B passa a "Codice cambiato altrove" (i suoi dati restano) e si ricollega scrivendo il codice nuovo a mano, in minuscolo e con spazi; un codice sbagliato dà un messaggio;
  - **Scollega**: B non crea un codice nuovo e non contatta più il servizio;
  - Tab: primo focus su "← torna alla home", outline 2 px.
- Build di **produzione** (indirizzo vuoto): sito come prima, 0 richieste esterne, nessun errore JS. La pagina Dispositivi mostra "Sincronizzazione non attiva" e la copia di sicurezza. `qr.ts` e la cartolina di recupero non vengono scaricati finché non servono.
- QR: 61 testi da 1 a 213 byte (versioni 1-10) letti tutti da zxing. OpenCV ne manca uno da 213 byte: è un limite del suo rilevatore, zxing lo legge.
- **Peso `dist/`: 847 KB** di dati (prima 803; +44 KB: motore 11 KB, pagina ~10 KB, QR 4 KB, CSS e HTML).
- **Non verificato**: il Worker vero su Cloudflare (va pubblicato da William), telefoni reali (iOS/Android, fotocamera che apre il QR), Firefox e Safari, VoiceOver e TalkBack, stampa della cartolina di recupero.

### Scritture e richieste con l'uso reale (piano gratuito)
| Evento | Richieste Worker | Letture KV | Scritture KV |
|---|---|---|---|
| Apertura di una pagina (se serve) | 1 | 1 | 0 |
| Modifica (o gruppo di modifiche entro 3 s) | 3 (scarica, invia, controllo) | 3 | 1 |
| Preflight CORS | ~1 ogni 2 ore per dispositivo | 0 | 0 |

Giornata tipo con due dispositivi (~40 pagine aperte, ~8 gruppi di modifiche): ~90 richieste, ~65 letture, **~8 scritture**. Una giornata intensa con le cartoline (~50 gruppi) fa ~50 scritture. I limiti sono 100.000 richieste, 100.000 letture e **1.000 scritture** al giorno: si usa al massimo il 5% delle scritture. Spazio: ~80 byte per giorno di diario, cioè ~40 KB cifrati all'anno (limite del Worker 1 MB, KV 1 GB).

## Decisioni prese da me
- **HKDF e non PBKDF2**: il codice ha già 120 bit casuali, quindi non serve rallentare chi prova a indovinarlo.
- **Token separato dalla chiave**: il servizio rifiuta lettura e scrittura a chi non ha il codice, anche se conosce l'id. Così nessuno può cancellare o sovrascrivere i dati di lei.
- **Codice nel `#` del link**, tolto subito dall'indirizzo; **conferma esplicita** prima di collegare (un link aperto per sbaglio non fa niente).
- **Collegare richiede dati già presenti** col codice (niente "codice nuovo vuoto" per un errore di battitura).
- **Ritiro invece di cancellazione** con "Cambia codice" (410 per i dispositivi vecchi).
- **204 e non 404** per "ancora niente": è normale al primo salvataggio e il browser non lo segna come errore in console.
- **Ultimo che scrive vince sul servizio, unione nei dispositivi**. KV non ha scritture condizionali; siccome ogni dispositivo tiene tutto in locale e `unisci` non perde nulla, chi viene sovrascritto rimanda la sua parte (controllo a 10 s, o la volta dopo). Così niente Durable Objects o database.
- **Nessuna compressione** della busta: un anno è ~40 KB, non vale il codice in più.
- **Stato breve solo accanto al link in Francobolli** (spia + parola), non su tutte le pagine: la grafica della home resta intatta.
- Indirizzo del servizio in un file del repo (`src/data/sincronizzazione.ts`), con `PUBLIC_SYNC_URL` per le prove locali. Non è un segreto.

## Problemi aperti
- **Il servizio va pubblicato da William** (`worker/LEGGIMI.md`, ~10 minuti) e poi va messo l'indirizzo in `src/data/sincronizzazione.ts`. Fino ad allora la sincronizzazione è spenta, mentre la copia di sicurezza funziona già.
- Con `ID_AMMESSI` impostato, un "Cambia codice" crea un id nuovo che il servizio rifiuta finché non si aggiorna la variabile (scritto nella guida).
- Due dispositivi che scrivono nello stesso secondo: per ~10 s uno dei due vede una versione vecchia (poi si ripara). Nessuna perdita.
- Se lei cancella i dati del browser su **tutti** i dispositivi e non ha né la cartolina di recupero né il file, i dati sul servizio restano illeggibili per sempre. È il prezzo di "nessuno vede il codice". La pagina invita a scaricare la cartolina.
- Il sito non funziona offline da zero (niente service worker): offline funziona una pagina già aperta, e le modifiche partono al ritorno della rete.
- Manca ancora la favicon (dalla Fase 4).
