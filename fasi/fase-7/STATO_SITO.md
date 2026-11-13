# Stato del sito · fine Fase 7

Aggiornato: 2026-11-13 (fine Fase 7 · foto e frase del giorno + Archivio; la Fase 8, Memory, era già chiusa)

## Stack
- Astro 7.4.1, output statico, nessuna dipendenza nuova nel sito (Fase 5: PDF senza librerie; Fase 6: cifratura con Web Crypto, QR scritto a mano). Fase 7: `sharp` (già installato con Astro) dichiarato in `devDependencies` per `npm run foto`; non finisce nel sito
- Sincronizzazione (Fase 6): Cloudflare Worker + KV gratuito, **pubblicato** (2026-11-13): `https://minuscole-sync.sitocompleanno.workers.dev` in `src/data/sincronizzazione.ts` (se manca `https://`, `sincronizza.ts` lo aggiunge); prova dal vivo tra due dispositivi ancora da fare
- Hosting: GitHub Pages via GitHub Actions (https://sitocompleanno-star.github.io/auguri/, quindi `BASE=/auguri`)
- Target: mobile-first (foglio centrato max 430px; desktop in Fase 11)
- Peso `dist/`: **906 KB** di dati **senza foto** (Fase 8: 874; Fase 7 +32 KB: pagina Archivio, foto in grande, script del giorno). Con le foto: stima ~0,25-0,35 MB a foto (tre misure), 100 foto ≈ 25-35 MB (`npm run contenuti` dà il peso reale di `public/media/foto`). Lo script inline della home pesa ~25-30 KB con 100 foto + 100 frasi (6-8 KB compresso)

## Struttura
```
minuscole/
├─ ROADMAP.md, README.md
├─ package.json            (script: dev, build, preview, francobolli, servizio, prova-sync; Fase 7: foto, frasi, contenuti, prova-giorno)
├─ aggiungi-contenuti.bat  (Fase 7) doppio clic: npm run foto → frasi → contenuti
├─ invia-su-github.bat     (Fase 7: prima del commit lancia npm run contenuti e si ferma se c'è un errore)
├─ foto-da-aggiungere/     (Fase 7, NON nel repo) originali da importare; dopo l'import in fatte/
├─ frasi-da-aggiungere.txt (Fase 7, NON nel repo) frasi da importare: "testo | autore | giorno?"
├─ scripts/genera-francobolli.mjs   genera i francobolli segnaposto dai dati delle emozioni
├─ scripts/estrai-cartoline.py      estrae fronti e portafoglio dal mockup (Python: pymupdf, pillow)
├─ scripts/riquadri-cartoline.json riquadri dei livelli del portafoglio in punti mockup (usati nel CSS)
├─ scripts/servizio-locale.mjs      (Fase 6) lo stesso Worker in Node con KV finto: npm run servizio (porta 8787, GET /__tutto)
├─ scripts/prova-sincronizzazione.mjs (Fase 6) prove senza browser: npm run prova-sync
├─ scripts/aggiungi-foto.mjs        (Fase 7) npm run foto: raddrizza, toglie i metadati, 3 WebP anonimi, chiede l'alt, aggiorna foto.json
├─ scripts/aggiungi-frasi.mjs       (Fase 7) npm run frasi: importa frasi-da-aggiungere.txt in frasi.json, completa id/aggiunta
├─ scripts/controlla-contenuti.mjs  (Fase 7) npm run contenuti: stessi controlli del build + peso + file avanzati
├─ scripts/prova-del-giorno.mjs     (Fase 7) npm run prova-giorno: giri, aggiunte, giorni speciali, mezzanotte, controlli
├─ worker/sincronizza.js            (Fase 6) Cloudflare Worker da incollare nel pannello
├─ worker/LEGGIMI.md                (Fase 6) guida: KV, Worker, binding DATI, variabili ORIGINI / ID_AMMESSI
├─ fasi/fase-0 … fase-8/
├─ public/
│  ├─ grafica/             SVG DEFINITIVI (home, zampe, slot vuoto…) e grafica del Diario estratta dal mockup:
│  │                        diario-fiore.svg, diario-carta-destra.webp, diario-carta-sinistra.webp; qui andranno anche
│  │                        francobolli/<id>.svg
│  │  └─ cartoline/         (Fase 5, estratti dal mockup) fronte-fiore.webp, fronte-mappa.webp (1772 x 1181, 3:2,
│  │                        300 dpi), busta-chiusa.webp, busta-aperta.webp, busta-tasca.webp, cartellina-tasca.webp (2x)
│  ├─ media/foto/          (Fase 7) <id>-400.webp (Archivio), <id>-800.webp (home), <id>-1600.webp (in grande); id anonimi
│  └─ placeholders/
│     └─ francobolli/<id>.svg       73 segnaposto (72 emozioni + `memory.svg`, Fase 8; generati, viewBox 45.44 x 58.1)
└─ src/
   ├─ layouts/Base.astro
   ├─ styles/global.css
   ├─ components/
   │  ├─ Zampa.astro, Cornice.astro (slot foto/frase riempiti dalla home dalla Fase 7)
   │  ├─ FotoGrande.astro         (Fase 7) <dialog> della foto in grande, condiviso; si apre su [data-foto-grande], scorre con data-gruppo
   │  ├─ PulsanteGioco.astro      (Fase 8) con `href` diventa un link al gioco (nome "Gioca a …", ≥ 44 px); senza resta immagine
   │  ├─ FlussoEmozioni.astro     riquadro "Come ti senti oggi?" (markup + stile; props id, titolo; slot sottotitolo, azioni)
   │  ├─ CartaDiario.astro        sfondo carta del Diario (due pezzi, posizionati in una schermata da 1200 punti)
   │  └─ StripFrancobolli.astro   (props: totale, ottenuti | preferiti, href, titolo)
   ├─ data/
   │  ├─ home.ts               (zampe, giochi con `href`/`gioco` facoltativi: cuore → giochi/memory/, francobolli.totale = 9)
   │  ├─ foto.json, frasi.json (Fase 7) contenuti del giorno e dell'Archivio (vedi sotto)
   │  ├─ memory.ts             (Fase 8) 8 simboli delle carte (SVG 20x20, forme diverse), livelli Facile 6 / Difficile 8, PREMIO_MEMORY, attese
   │  ├─ cartoline.ts          cartoline (fiore, mappa), misure 150 x 100 mm / 1772 x 1181 px, retroSvg()
   │  ├─ sincronizzazione.ts   (Fase 6) URL_SERVIZIO (vuoto = spenta), ritardo 3 s, intervallo minimo 20 s, verifica 10 s, attese tra i tentativi
   │  ├─ emozioni.ts           ruota a 3 livelli (provvisoria), palette, verificaRuota(); (Fase 8) `speciali` (francobollo Memory), `tuttiFrancobolli`, `emozione(id)` trova anche gli speciali
   │  └─ simboli.ts            7 simboli SVG (6 famiglie + `cuore` per il Memory; centrati in 0,0, 18x18, currentColor)
   ├─ lib/
   │  ├─ stato.ts              stato in localStorage (funzioni pure + leggi/scrivi/osserva); (Fase 8) premi e record
   │  ├─ del-giorno.js         (Fase 7) scelta del giorno, JS puro senza import (incollato inline nella home): delGiorno, sequenza, speciale, oggiRoma, INIZIO
   │  ├─ valida-contenuti.ts   (Fase 7) controlli puri di foto.json/frasi.json, MISURE_FOTO, MAX_TESTO 60, MAX_AUTORE 24
   │  ├─ contenuti.ts          (Fase 7) SOLO build: legge e controlla i JSON e i file, ferma il build se c'è un errore; perAggiunta
   │  ├─ memory.ts             (Fase 8) logica pura della partita: nuovaPartita, gira, copri, statoCarta, muovi (frecce)
   │  ├─ calendario.ts         date pure "AAAA-MM-GG" (caselleMese, aggiungiGiorni/Mesi, dataLeggibile…), in UTC
   │  ├─ flusso.ts             classe Flusso: scelta a 3 livelli, salvataggio, francobollo (solo browser)
   │  ├─ francobolli.ts        percorsoFrancobollo() (build e browser)
   │  ├─ cartolina-ui.ts       portafoglio, cartolina, vassoio, trascinamento, tastiera (solo browser)
   │  ├─ pdf-cartolina.ts      disegno su canvas + PDF a due pagine (import dinamico, solo al clic)
   │  ├─ francobolli-definitivi.ts  SOLO build (fs): definitivi presenti, controllaRuota(), graficaOSegnaposto()
   │  ├─ cifra.ts              (Fase 6) codice, HKDF → id/token/chiave, AES-GCM (puro, Web Crypto; gira anche in Node)
   │  ├─ sincronizza.ts        (Fase 6) motore (solo browser, avviato da Base.astro) + azioni della pagina Dispositivi
   │  ├─ copia.ts              (Fase 6) file di copia di sicurezza: crea, leggi, importa (puro)
   │  ├─ qr.ts                 (Fase 6) generatore QR (byte, livello M, versioni 1-10), import() al clic
   │  └─ cartolina-recupero.ts (Fase 6) PDF 10 x 15 con QR e codice, import() al clic (usa pdfDaJpeg)
   └─ pages/
      ├─ index.astro              home (Fase 7: foto e frase del giorno con script inline)
      ├─ diario/index.astro       Diario (Fase 4): flusso di oggi + calendario annuale + finestra del mese
      ├─ archivio/index.astro     (Fase 7) tutte le foto e le frasi, schede Foto/Frasi, "Oggi", foto in grande
      ├─ [sezione]/index.astro    luna-park, club-amici, caos (in costruzione; diario e archivio esclusi)
      ├─ giochi/memory/index.astro  (Fase 8) il gioco Memory
      ├─ francobolli/index.astro  portafoglio a livelli + cartolina + fascia FRANCOBOLLI (griglia o vassoio) + dettaglio + link Dispositivi
      └─ dispositivi/index.astro  (Fase 6) stato sincronizzazione, QR/link, codice, cartolina di recupero, copia, scollega
```

## Foto e frase del giorno (Fase 7)
- **Dati**:
  - `src/data/foto.json`: `[{ id, w, h, alt, aggiunta: "AAAA-MM-GG", fuoco?: "50% 30%", giorno?: "MM-GG" | "AAAA-MM-GG" }]`;
  - `src/data/frasi.json`: `[{ id, testo (≤ 60 caratteri, niente a capo), autore? (≤ 24), aggiunta, giorno? }]`;
  - controlli in `valida-contenuti.ts`: con un errore **il build si ferma**.
- **Come si aggiungono** (William, su Windows):
  - foto in `foto-da-aggiungere/`;
  - frasi in `frasi-da-aggiungere.txt` (`testo | autore | giorno?`);
  - doppio clic su `aggiungi-contenuti.bat`, poi `invia-su-github.bat`.
  - Si possono anche modificare a mano i JSON (alt, `fuoco`, `giorno`); `npm run frasi` completa `id` e `aggiunta` mancanti.
- **Scelta** (`del-giorno.js`):
  - giri mescolati con seme fisso (`foto:<n>`, `frasi:<n>`) a partire da `INIZIO = 2026-11-01`;
  - una voce torna solo dopo tutte le altre, mai due giorni uguali di fila;
  - voci nuove dal giro successivo;
  - voci con `giorno` solo quel giorno (il giro si ferma).
  - **Non cambiare `INIZIO` né i semi.** Cancellare una voce può cambiare l'ordine da quel giorno in poi.
- **Home**:
  - slot riempiti solo se c'è almeno una voce (altrimenti i segnaposto);
  - script inline dopo la cornice (codice compattato + dati: solo i campi necessari), che ricontrolla la data ogni minuto e al ritorno sulla scheda;
  - foto: `<button data-foto-grande>` + `<img>` 800 px, `object-fit: cover`, angoli 20 punti, `fetchpriority="high"`, dissolvenza (niente con reduced motion);
  - frase: font del Diario, bordeaux (8:1), autore dopo " — " (6,3:1), da 16 a 12 px finché entra, poi 3 righe con i puntini.
- **Foto in grande**: `FotoGrande.astro`.
  - Attributi `data-id`, `data-w`, `data-h`, `data-alt`, `data-gruppo`; `srcset` 800/1600.
  - Si chiude con ×, Esc o tocco fuori; il focus torna all'elemento.
  - Frecce, tasti ← → e scorrimento col dito.
- **Archivio** `/archivio/`:
  - zampa estesa in alto (`top 40`, `k 0`), titolo, schede Foto (N) / Frasi (N) (`#frasi`);
  - miniature 400 px in 3 colonne (`loading="lazy"`), più recenti per prime;
  - frasi in schede;
  - "Oggi" sulla voce del giorno; segnaposto "Ancora nessuna …".
- **Privacy**: `noindex, nofollow, noimageindex` in `Base.astro`; nomi casuali; metadati tolti da `npm run foto`; originali esclusi da git.

## Emozioni (`src/data/emozioni.ts`)
- `famiglie` (6) → `emozioni` intermedie (36) → `emozioni` di ultimo livello (72). Esportati anche `emozioni` (lista piatta in ordine di ruota), `emozione(id)`, `famiglia(id)`, `intermedia(id)`, `contrasto()`, `verificaRuota()`, `INCHIOSTRO`.
- Si modifica solo l'array `RUOTA` (nomi, colore, sfumature, simbolo). Dopo una modifica: `npm run francobolli`, poi `npm run build`.
- Gli `id` (slug del nome, es. `realizzata`) sono la chiave salvata nello stato: non vanno cambiati dopo l'uso.

| Famiglia | Intermedie → ultimo livello |
|---|---|
| **Felice** (sole, `#5f4202`) | Orgogliosa → Realizzata, Fiduciosa · Potente → Coraggiosa, Energica · Tranquilla → Amorevole, Grata · Ottimista → Speranzosa, Ispirata · Gioiosa → Libera, Divertita · Intima → Tenera, Vicina · Interessata → Partecipe, Motivata · Accettata → Onorata, Benvenuta |
| **Triste** (goccia, `#234877`) | Sola → Isolata, Abbandonata · Vulnerabile → Fragile, Esposta · Disperata → Sconfortata, Persa · In colpa → Vergognosa, Rammaricata · Abbattuta → Grigia, Mogia · Ferita → Delusa, Umiliata |
| **Sorpresa** (stella, `#553b68`) | Colpita → Scioccata, Turbata · Confusa → Disorientata, Perplessa · Stupita → Meravigliata, Incantata · Emozionata → Entusiasta, Carica |
| **Arrabbiata** (fulmine, `#7c271c`) | Delusa → Tradita, Risentita · Mortificata → Sminuita, Calpestata · Amareggiata → Indignata, Violata · Furiosa → Furente, Gelosa · Aggressiva → Provocata, Ostile · Frustrata → Esasperata, Nervosa · Distante → Assente, Muta · Critica → Diffidente, Beffarda |
| **Disgustata** (spirale, `#235430`) | Contrariata → Giudicante, Imbarazzata · Sconcertata → Allibita, Ripugnata · Nauseata → Schifata, Odiosa · Respinta → Esitante, Pietrificata |
| **Impaurita** (nuvola, `#015259`) | Spaventata → Atterrita, Terrorizzata · Ansiosa → Sopraffatta, Preoccupata · Insicura → Inadeguata, Dubbiosa · Debole → Fiacca, Bloccata · Rifiutata → Esclusa, Vessata · Minacciata → Guardinga, Circospetta |

## Francobolli
- Segnaposto: tono scuro della famiglia come cornice dentellata, sfumatura dell'emozione intermedia come fondo, simbolo della famiglia in alto, iniziale (Georgia grassetto, inchiostro) in basso.
- Percorso: `percorsoFrancobollo(e, definitivi)` → `grafica/francobolli/<file>` se il definitivo esiste al build, altrimenti `placeholders/francobolli/<file>`. La lista dei definitivi arriva al browser in `data-definitivi`.
- Slot vuoto: `grafica/francobollo-vuoto.svg` (`FRANCOBOLLO_VUOTO`).

## Stato (`src/lib/stato.ts`)
- Chiave `minuscole:stato`, `VERSIONE = 1` (invariata in Fase 5 e in Fase 8: i campi nuovi mancanti valgono vuoti):
  `{ versione, giorni: { "AAAA-MM-GG": { emozione: id | null, modificato: ISO } }, preferiti: id[] (max 9), preferitiModificato: ISO,
     cartoline: { [idCartolina]: { francobolli: [{ id, x, y, r }], modificato: ISO } },
     premi: { [idFrancobolloSpeciale]: { quando: ISO } },            // Fase 8
     record: { ["<gioco>-<livello>"]: { mosse: intero >= 1, quando: ISO } } }`  // Fase 8, es. "memory-facile"
  con `x`, `y` = centro in frazioni della cartolina (0-1) e `r` in gradi (-180, 180]; al massimo `MAX_FRANCOBOLLI_CARTOLINA` (= 1) per cartolina.
- Pure: `statoVuoto`, `migra(grezzo)`, `canonico(s)` / `uguali(a, b)` (JSON con chiavi in ordine, Fase 6), `senzaDati(s)` (Fase 6), `impostaGiorno(s, data, id|null)` (toglie dalle cartoline i francobolli non più sbloccati), `sbloccati(s)` (Map id → primo giorno: giorni del Diario **più i premi**, Fase 8, in ordine di data), `registraVittoria(s, premio, chiave, mosse)` e `chiaveRecord(gioco, livello)` (Fase 8), `conteggi(s)`, `preferitiValidi(s)`, `alternaPreferito(s, id)`, `cartolina(s, id)`, `attaccaFrancobollo(s, idCartolina, {id,x,y,r})` (attacca/sposta; se piena sostituisce il più vecchio), `togliFrancobollo`, `pulisciCartoline(s, quando?)`, `normalizzaRotazione`, `unisci(a, b)` (giorni per giorno, preferiti e ogni cartolina: vince il più recente; premi: vince la data più vecchia; record: meno mosse, a parità il più vecchio; poi pulizia), `dataDiOggi()` (Europe/Rome).
- Browser: `leggi()`, `scrivi(s)`, `aggiorna(f)`, `persistente()`, `osserva(f)`. L'evento `minuscole:stato` parte a ogni scrittura; `osserva` ascolta anche `storage` (altre schede) e `pageshow` (bfcache).
- Se `localStorage` non è disponibile: copia in memoria, nessun errore, `persistente()` = false.

## Sincronizzazione (Fase 6)
- **Codice**: 120 bit casuali, base32 Crockford + 1 lettera di controllo, `XXXXX-XXXXX-XXXXX-XXXXX-XXXXX`. Sta in `localStorage` sotto `minuscole:sync` (MAI nello stato né nella copia): `{ codice?, spento?, ritirato?, ultima?, inviato?: { impronta, quando }, allineato? }`.
- Dal codice (HKDF-SHA256): `id` (32 hex, nome sul servizio), `token` (Bearer; il servizio salva solo l'hash), chiave AES-GCM 256 (resta nel browser). Busta `{ v: 1, iv, dati }`, id come dati associati.
- **Servizio** `worker/sincronizza.js`: `GET|PUT|DELETE /v1/<id>`; 200 / 204 (niente) / 403 (token) / 410 (ritirato) / 400 (non è una busta) / 413 (> 1 MB) / 503 (KV). Binding KV `DATI`; variabili facoltative `ORIGINI`, `ID_AMMESSI`.
- **Motore**: scarica → `unisci(locale, remoto)` → salva se cambia → invia se il servizio non l'ha. Quando: apertura e ritorno sulla scheda (salvo controllo < 20 s fa e stato locale = `allineato`), 3 s dopo una modifica, evento `online`, uscita dalla pagina con modifiche in sospeso (keepalive), verifica 10 s dopo ogni invio. Errori: riprova a 15 s, 30 s, 1, 2, 5 min. Web Locks tra schede.
- Codice creato da solo al primo salvataggio (mai con stato vuoto). `scollega` → `{ spento: true }` (non ne crea uno nuovo da solo). `cambiaCodice` → invia col nuovo, `DELETE` del vecchio (ritiro); gli altri dispositivi vedono 410 → fase `ritirato`.
- Fasi: `non-attiva | non-collegato | in-corso | sincronizzato | offline | errore | ritirato`; evento `minuscole:sync`, `osservaSync(f)`, `statoSync()`.
- Link di collegamento: `<origin><BASE>dispositivi/#collega=<codice>` (il `#` non arriva ai server; tolto dall'indirizzo all'arrivo).
- Prove locali: `npm run servizio` + `PUBLIC_SYNC_URL=http://localhost:8787 npm run dev`.

## Pagina `/dispositivi/` (Fase 6)
- Stessa colonna e sfondo della pagina Francobolli; misure in punti mockup, testi `max(14px, 30u)`, pulsanti ≥ 44 px.
- Carte, nell'ordine: Stato (spia + parola + dettaglio + "Sincronizza ora") · conferma "Collegare questo dispositivo?" (solo arrivando da `#collega=`) · Collega un altro dispositivo (QR, codice, Copia il link, Condividi, Nascondi) · Collega questo dispositivo (campo codice; "Usa un codice nuovo" se scollegato o ritirato) · Cartolina di recupero · Copia di sicurezza (Esporta / Importa, unisce) · Scollega (questo / Cambia codice, con `<dialog>` di conferma).
- Visibilità per fase: senza servizio solo Stato e Copia; senza codice niente Recupero e Scollega.
- Annunci `role="status"`: offline, errore, ritirato, esiti; "Sincronizzato" solo dopo "Sincronizza ora".
- In Francobolli, in fondo alla fascia: link "Dispositivi e copia di sicurezza" + stato breve (spia + parola), nascosto se la sincronizzazione non è attiva.

## Gioco Memory (Fase 8) · `/giochi/memory/`
- Raggiunto dal **primo pulsante della home** (cuore). Stessa colonna e sfondo della pagina Francobolli; misure in punti mockup.
- **Livelli**: Facile (6 coppie, 3 colonne, carte ~107 x 129 px a 390 px) e Difficile (8 coppie, 4 colonne, ~78 x 94 px). Il livello scelto resta in `localStorage` sotto `minuscole:memory-livello` (preferenza locale, non sincronizzata). Cambiare livello o "Nuova partita" = partita nuova.
- **Carte**: dorso bordeaux con cornice tratteggiata crema e zampina; fronte crema con bordo e simbolo del colore del simbolo. 8 simboli: Cuore, Fiore, Sole, Luna, Stella, Foglia, Goccia, Fungo (forme diverse; contrasto ≥ 3:1 controllato al build). Mescolata con `crypto.getRandomValues`.
- **Regole**: si girano due carte; uguali = restano scoperte con ✓; diverse = scuotono e si rigirano dopo 1,1 s (un tocco su un'altra carta le rigira subito). Una mossa = una coppia girata. Contatori: mosse, coppie, record del livello.
- **Vittoria**: `registraVittoria(s, 'memory', 'memory-<livello>', mosse)` → la **prima** vittoria (a qualunque livello) sblocca il francobollo speciale **Memory**; dopo si aggiorna solo il record. Finestra `<dialog>` "Hai vinto!" con mosse, "Nuovo record!", il francobollo (solo la prima volta), "Gioca ancora" e "Vai ai francobolli". Sotto la griglia, "Francobollo Memory già vinto" quando c'è.
- **Accessibilità**: griglia `role="grid"` con righe e celle (le righe hanno `display: contents`); carte = pulsanti con nome "Carta 3, coperta" / "Carta 3, Luna" / "Carta 3, Luna, trovata"; focus itinerante (un solo `tabindex=0`), frecce, Home/Fine (Ctrl = prima/ultima); le trovate restano raggiungibili ma `aria-disabled`. Annunci in un `role="status"` visibile: carta girata, coppia trovata ("2 su 6"), coppia sbagliata, vittoria. Focus visibile 3 px; pulsanti ≥ 44 px.
- **Reduced motion**: niente rotazione 3D (cambio di faccia immediato), niente scossa, finestra senza animazione.

## Francobolli speciali (Fase 8)
- In `src/data/emozioni.ts`, array `speciali`: stessa forma di un'emozione (`id`, `nome`, `iniziale`, `simbolo`, colori, `francobollo`) più `gioco` (nome del gioco). Oggi uno: **Memory** (`memory`, cuore + M, bordeaux su rosa chiaro, file `memory.svg`).
- `tuttiFrancobolli` = ruota + speciali: totale della griglia (**73**), segnaposto e definitivi. `emozione(id)` trova anche gli speciali, quindi griglia, vassoio delle cartoline, preferiti e striscia della home li mostrano senza codice in più.
- Nello stato stanno in `premi` (non dipendono dai giorni del Diario: non spariscono cancellando un giorno).
- Dettaglio in `/francobolli/`: "Francobollo speciale" · "Vinto giocando a Memory" (link al gioco) · "Vinto il …". Striscia della home: alt "Francobollo Memory (vinto al gioco)".

## Pagina `/francobolli/`
- Misure in punti mockup (tavola 4): fascia con titolo "FRANCOBOLLI" e griglia di 16 colonne da 45,44 (passo 55,4 x 72), margine 31,8.
- Colonna flessibile: lo spazio in più va intorno al portafoglio, la fascia resta in basso.
- Slot pieni = pulsanti (nome accessibile = nome dell'emozione, ", nella home" se preferito); slot vuoti `disabled` e `aria-hidden`, con un riassunto per screen reader ("6 francobolli sbloccati su 72…").
- Dettaglio in `<dialog>` modale: Esc o tocco fuori per chiudere, focus restituito al francobollo.
- Pannello di prova solo con `npm run dev` ("5 a caso", "Vinci Memory" (Fase 8), "Azzera tutto").

### Portafoglio e cartoline (Fase 5)
- Scena in punti mockup = x 0-940, y 160-700 della tavola (alta 540). Livelli (riquadri da `scripts/riquadri-cartoline.json`): busta aperta (105,5; 14,5; 352), cartoline, busta-tasca (106; 230; 351), cartellina-tasca (483; 182,5; 351), busta chiusa (106; 163,5; 351).
- `data-stato` della scena: `chiuso` (tavola 4) → primo tocco → `aperto` (tavola 5) → secondo tocco → `cartolina` (tavole 6-7). Le cartoline sono in grande (x 79, y 10, 782 x 521,3) e rimpicciolite con transform (larghe 321 nel portafoglio); posizioni `dentro`/`fuori`/`uscita`/`grande` in `cartolina-ui.ts`.
- Con la cartolina aperta: comandi (↺ ↻ Togli · ← Portafoglio · Gira · Scarica il PDF), il vassoio al posto della griglia, una voce nella cronologia ("indietro" chiude la cartolina), Esc chiude.
- Francobollo sulla cartolina: largo 13,5% (~20 mm), centro tenuto dentro la cartolina. Trascinamento con pointer events (fantasma dal vassoio; `touch-action: pan-x` sul vassoio, `none` sui francobolli attaccati); trascinato fuori = tolto.
- Tastiera: Invio sul vassoio = attacca in alto a destra; sul francobollo frecce (Maiusc = 5%), Q/E ±15°, Canc toglie.
- Retro: `retroSvg()` (riga divisoria, 3 righe indirizzo, riquadro francobollo postale; nessuna scritta).
- PDF: `pdf-cartolina.ts` (3 KB) caricato al clic; 2 pagine 425,197 x 283,465 punti con JPEG 1772 x 1181 (300 dpi); nome `cartolina-<id>-AAAA-MM-GG.pdf`.

## Pagina `/diario/` (Fase 4)
- Misure in punti mockup (Diario.pdf, 940 x 1200): pomello 135 x 163 a y 164; riquadro 700 punti (x 120-820) da y 301, sfondo `rgb(175 156 157 / 0.2)`; pillole 300 x 58,3 (#ae9c9d, bordo #864f4f, minimo 36px di altezza e testo 15px); anno ~97 punti; riquadro calendario x 36-904; mesi 249 x (43,4 + 6 x 34,88), spazi 39,9 x 38,4.
- Zampa estesa in alto a sinistra (`top 24`, `k 0`): scorre con la pagina.
- Flusso: famiglia → intermedia → emozione; indietro di un livello ("← indietro" o tocco su una scelta fatta); al terzo passo `impostaGiorno(dataDiOggi(), id)` e francobollo con animazione (niente con reduced-motion); "Nuovo francobollo!" al primo sblocco (`!sbloccati(prima).has(id)`).
- Calendario annuale: dall'anno corrente − 5 (o dal primo anno con dati) all'anno corrente; caselle con sfumatura + iniziale, oggi con riquadro bordeaux. Ogni mese è un pulsante che apre la finestra.
- Finestra del mese (`<dialog>`): caselle ~48px con numero, simbolo e iniziale; mesi fino al corrente; giorni futuri `aria-disabled`; giorno passato/oggi → flusso del giorno con "Cancella questo giorno" (`emozione: null`).
- Tastiera nella griglia: frecce, Home/Fine, Pagina su/giù (Maiusc = anno). Nomi: "12 novembre: Realizzata".
- Si ridisegna con `osserva()` e al cambio di giorno (mezzanotte Europe/Rome).

## Cosa funziona
- Home come in Fase 2, con la striscia che mostra i preferiti e porta a `/francobolli/`.
- Diario: scelta dell'emozione di oggi, sblocco dei francobolli, calendario annuale, modifica e cancellazione dei giorni passati.
- Pagina Francobolli: sblocchi (dallo stato), dettaglio, preferiti (max 9), persistenza, avviso se non si può salvare.
- Cartoline: portafoglio a due tocchi con animazione, francobollo trascinato (dito/mouse) o da tastiera, rotazione, fronte/retro, PDF 10 x 15 fronte-retro.
- Sincronizzazione completa (provata con due browser e un servizio locale): primo salvataggio, QR/link, unione, conflitti, offline, cambio codice, scollegamento. **Attiva col Worker pubblicato** (da provare dal vivo).
- Copia di sicurezza (esporta / importa con unione) e cartolina di recupero (PDF con QR).
- Tastiera, focus visibile, nomi accessibili, reduced-motion.
- Memory (Fase 8): due livelli, partita completa con mouse, dito o tastiera, record per livello, francobollo speciale alla prima vittoria, sincronizzato sugli altri dispositivi.
- Foto e frase del giorno (Fase 7): cambiano ogni giorno nel browser, senza salti di layout, anche a mezzanotte con la pagina aperta; foto in grande; Archivio con tutte le foto e le frasi. Strumenti per aggiungerle (`aggiungi-contenuti.bat`).
- Build statica (9 pagine) senza avvisi.

## Cosa NON c'è ancora
- Prova dal vivo della sincronizzazione col Worker vero (due telefoni, QR da `/dispositivi/`).
- **Foto e frasi vere** (il sistema è pronto, i JSON sono vuoti). Altri giochi (fiori, arcobaleno, sole: Fase 9), Luna Park, altre pagine, desktop, funzionamento offline da zero (service worker).
- SVG definitivi dei francobolli; grafica definitiva di cartoline e portafoglio (oggi estratta dal mockup).
- Favicon.

## Convenzioni
- Link e asset sempre con `import.meta.env.BASE_URL`.
- Misure in punti mockup (`--u`); testi piccoli con un minimo in px (`max(13px, …)`).
- Gli import fra file `.ts` usano l'estensione `.ts`: così lo script dei segnaposto gira con Node senza dipendenze.
- Il codice che usa `node:fs` sta solo in `src/lib/francobolli-definitivi.ts`, `src/lib/contenuti.ts` e nel frontmatter: mai negli script client.
- Ogni animazione rispetta `prefers-reduced-motion`.
- Elementi creati da script dentro un componente: gli stili vanno scritti con `:global(...)` sotto una classe del componente (es. `.flusso :global(.pillola)`), perché non hanno l'attributo di scope di Astro. Vale anche per i pulsanti passati negli slot.
- Date di calendario sempre come stringhe "AAAA-MM-GG" e calcoli in UTC (`calendario.ts`); "oggi" solo da `dataDiOggi()`.
- Elementi aggiunti a `<body>` da script (es. il fantasma del trascinamento) vanno stilati con `:global(.classe)`.
- Le librerie o i moduli pesanti che servono a un solo gesto si caricano con `import()` al clic (es. `pdf-cartolina.ts`).
- Fase 6: i segreti (codice) stanno solo in `localStorage` (`minuscole:sync`) e nel `#` del link; mai nel repo, nello stato, nella copia, negli URL inviati ai server o nei log. Il repo contiene solo l'indirizzo del servizio.
- Fase 6: ogni scrittura dello stato fatta dal motore passa da `applica()` (non conta come modifica dell'utente); le pagine continuano a usare `scrivi()`/`aggiorna()` come prima e la sincronizzazione parte da sola.
- Fase 7: "oggi" per foto e frase da `oggiRoma()` in `del-giorno.js` (uguale a `dataDiOggi()`); quel file resta senza import e senza stringhe su più righe (viene incollato e compattato inline). Nei JSON solo nomi relativi (`id`); i percorsi si costruiscono con `BASE_URL` + `media/foto/<id>-<misura>.webp`.
- Fase 8: un gioco nuovo con premio usa `registraVittoria` (premio + record) e aggiunge il suo francobollo a `speciali`; poi `npm run francobolli`. I record hanno chiave `<gioco>-<livello>`.
