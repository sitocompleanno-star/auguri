# minuscole – L'universo delle cose · Roadmap

Sito web mobile-first basato sul mockup `ALI.pdf`. Stack: **Astro** + piccole isole JS/TS. Hosting: **GitHub Pages**.

## Regole di lavoro

- Mobile-first: si progetta per ~390px di larghezza; il desktop viene dopo (Fase 8).
- Gli SVG definitivi della home sono in `public/grafica/` (dalla Fase 1). Per la grafica non ancora pronta si usano **placeholder** in `public/placeholders/`, con stessa misura (`viewBox`) di quelli definitivi, così basta sostituirli.
- A fine di ogni fase si crea una cartella `fasi/fase-N/` con:
  - `REPORT.md`: cosa è stato fatto, decisioni, problemi aperti
  - `STATO_SITO.md`: stato attuale del sito (struttura, componenti, dati, cosa funziona / non funziona)
  - `PROMPT_FASE_N+1.md`: prompt da incollare in una nuova chat, insieme al link del sito, per ripartire

## Fasi

### Fase 0 · Fondamenta
Setup Astro, configurazione GitHub Pages (`base`, workflow di deploy), palette e font, struttura cartelle, placeholder SVG, pagine vuote.
**Fatto quando:** `npm run build` passa e il deploy automatico è pronto; esiste una home minima online.

### Fase 1 · Home statica (mobile) ✅
Layout fedele al mockup: titolo, sfondo con foglia, 5 zampe a sinistra, cornice con foto e frase (segnaposto), 4 pulsanti giochi, striscia francobolli. Con gli SVG definitivi.
**Fatto quando:** la home a 390px è riconoscibile rispetto al mockup. ✅ (2026-10-28)

### Fase 2 · Zampe animate e navigazione ✅
Zampa che scivola fuori al tap, mostrando il nome della sezione; navigazione verso le pagine (Diario, Archivio, Luna Park, Club degli Amici, Caos); transizioni tra pagine; pagine interne vuote con titolo.
**Fatto quando:** si naviga tra tutte le pagine con animazione fluida su telefono. ✅ (2026-10-29; da provare su telefono reale)

### Fase 3 · Emozioni, stato e francobolli ✅
Modello dati delle emozioni e dei francobolli, stato salvato in `localStorage`, striscia della home con francobolli veri e "preferiti", pagina Francobolli (portafoglio + griglia, senza cartoline).
- `src/data/emozioni.ts`: ruota a 3 livelli (6 famiglie del mockup Diario → 36 emozioni intermedie → 72 di ultimo livello). Ogni emozione di ultimo livello ha `id`, `nome`, `famiglia`, `iniziale` e `simbolo` e un francobollo. Il colore è per famiglia (palette ispirata alle ruote delle emozioni), con sfumatura diversa per le emozioni interne.
- Ogni francobollo si distingue anche senza il colore: segno/simbolo + lettera iniziale dell'emozione.
- Stato (un unico oggetto JSON con `versione`): `giorni` (`"AAAA-MM-GG"` → emozione, con data di modifica), `preferiti` (max 9, scelti per la home), `cartoline` (vedi Fase 5). I francobolli sbloccati si **calcolano** dai giorni, non si salvano.
- Home: la striscia mostra i preferiti (se ce ne sono meno di 9, gli altri slot restano vuoti); i francobolli senza SVG usano placeholder in `public/placeholders/`, con lo stesso `viewBox` e nome dei definitivi.
- Click su "Collezione di francobolli" → `/francobolli/`: portafoglio con le due icone (cuore e Travel, come nel mockup), griglia con francobolli sbloccati e vuoti, scelta dei preferiti.
**Fatto quando:** uno sblocco di prova compare nella griglia e tra i preferiti in home e persiste al ricaricamento. ✅ (2026-11-11; ruota provvisoria, da confermare)

### Fase 4 · Diario ✅
Pagina `/diario/`: flusso "Come ti senti oggi?" a 3 livelli, calendario annuale (anno corrente, con cambio anno), giorni che si colorano, sblocco del francobollo.
- Si può cambiare (o cancellare) l'emozione di un giorno passato; i giorni futuri non si compilano.
- La casella del giorno ha il colore della famiglia e il simbolo/iniziale dell'emozione (non solo il colore).
- Le date seguono il fuso Europe/Rome.
- L'anno resta fedele al mockup (3 x 4, colore + iniziale); toccando un mese si apre il mese in grande, dove si cambiano i giorni (caselle con numero, simbolo e iniziale).
- Zampa estesa in alto a sinistra, scorre con la pagina.
**Fatto quando:** si sceglie un'emozione, il giorno si dipinge, il francobollo si sblocca e tutto resta dopo il ricaricamento. ✅ (2026-11-11)

### Fase 5 · Cartoline e PDF ✅
Dentro `/francobolli/`: due cartoline (fiore e mappa, dalle tavole del mockup; predisposto per altre in futuro) a cui si attaccano i francobolli sbloccati, con posizione e rotazione salvate nello stato.
- Un clic sulla prima o sulla seconda icona del portafoglio apre la cartolina corrispondente.
- PDF a due facciate (fronte e retro), formato 10 x 15 cm (150 x 100 mm in orizzontale come nelle tavole), generato nel browser: disegno su canvas a 300 dpi e inserimento con una libreria PDF caricata solo in questa pagina (es. `pdf-lib`).
**Fatto quando:** si compone una cartolina, si scarica il PDF e si stampa fronte-retro a 10 x 15 cm con i francobolli al posto giusto. ✅ (2026-11-13; misure del PDF verificate, stampa reale da provare)
- Due tocchi come nella tavola 12: il primo apre il portafoglio (tavola 5), il secondo fa uscire e allargare la cartolina (tavole 6-7).
- Un francobollo per cartolina (`MAX_FRANCOBOLLI_CARTOLINA`), trascinato dal vassoio; retro senza scritte; PDF scritto senza librerie.

### Fase 6 · Sincronizzazione tra dispositivi (senza login)
Il codice segreto viene generato sul dispositivo dell'utente al primo salvataggio (nessuno lo vede, nemmeno chi ha costruito il sito). Dati cifrati nel browser (chiave derivata dal codice) e salvati su un piccolo servizio gratuito (previsto Cloudflare Workers + KV). "Collega un altro dispositivo" con QR/link; unione per giorno (vince la modifica più recente); esportazione/importazione del file come rete di sicurezza. Il repository è pubblico: nessun segreto nel codice.
**Fatto quando:** un secondo dispositivo, collegato col QR, vede gli stessi giorni e francobolli e le modifiche si uniscono senza perdite.

### Fase 7 · Foto e frase del giorno (rimandata)
Rimandata: mancano foto e frasi. Dati in `src/data/foto.json` e `frasi.json`; scelta deterministica dalla data (stessa foto/frase per tutto il giorno). Foto in `public/media/foto/`, già compresse (vedi "Gestione dei media"). Prompt già pronto in `fasi/fase-2/PROMPT_FOTO_FRASE.md`.
**Fatto quando:** foto e frase cambiano ogni giorno senza backend e il peso di `dist/` è sotto controllo.

### Fase 8 · Primo gioco (memory)
Gioco memory a carte, collegato al primo pulsante; vittoria che sblocca un francobollo (si aggiunge ai francobolli del Diario).
**Fatto quando:** si gioca, si vince, si ottiene il francobollo.

### Fase 9 · Altri giochi e Luna Park
Quiz, puzzle, ecc., uno per volta. Luna Park (ruota della fortuna con tre pulsanti CASO / LOVE / COSE, dal PDF `Francobolli_e_luna_park.pdf`) si sviluppa più avanti, quando le fasi precedenti sono chiuse.

### Fase 10 · Altre pagine interne
Archivio, Club degli Amici, Caos: contenuti, nell'ordine da decidere.

### Fase 11 · Desktop e rifinitura
Layout desktop, performance, accessibilità (contrasto, focus, `prefers-reduced-motion`), test su dispositivi reali, sostituzione definitiva dei placeholder con gli SVG finali (se non già fatto prima).

## Gestione dei media

Decisione: **solo GitHub**, nessun servizio esterno per i file; i video vanno su YouTube.

- Limiti GitHub Pages da rispettare: sito pubblicato max **1 GB**, banda ~100 GB/mese (soft). Per stare larghi, obiettivo interno: **cartella `public/media/` sotto ~500 MB** in totale.
- Foto: comprimerle prima di caricarle (WebP o AVIF, lato lungo ~1600 px per le foto grandi, ~800 px per miniature). Mai originali da fotocamera.
- Video: **non nel repo**. Si caricano su YouTube (non in elenco) e si incorporano con `youtube-nocookie.com`, caricando il player solo al click (anteprima statica + iframe al tocco) per non appesantire la home.
- Animazioni brevi e decorative: preferire SVG/CSS; se serve un video corto in loop, MP4 H.264 sotto 2-3 MB.
- Nei file dati (`foto.json`, ecc.) si salvano solo i nomi file relativi a `public/media/`; i link si costruiscono con `import.meta.env.BASE_URL`.
- Ogni fine fase: controllare il peso di `dist/` (`du -sh dist`) e riportarlo in `STATO_SITO.md`.
- Se in futuro 1 GB non bastasse, il sito resta portabile: i percorsi dei media passano da un unico punto e si può spostare su un altro servizio.

## Decisioni prese

- Stack: Astro (confermato)
- Hosting: GitHub Pages (solo GitHub, 1 GB basta)
- Video: YouTube (non in elenco), non nel repo
- Target: mobile-first
- SVG: definitivi per la home (Fase 1); placeholder per ciò che manca (francobolli pieni)

## Decisioni prese per Diario e Francobolli (2026-11-11)

- Il sito è un regalo per una sola persona: nessun login; i dati restano su più dispositivi con un codice generato sul suo dispositivo (Fase 6).
- Un colore per famiglia di emozioni; ogni emozione di ultimo livello ha un proprio francobollo con simbolo e iniziale, tutti distinguibili anche senza colore. Palette ispirata alle ruote delle emozioni.
- Si può cambiare un giorno passato.
- Francobolli: numero non deciso (probabilmente > 9); in home si mostrano i "preferiti" scelti dall'utente.
- Cartoline in formato 10 x 15 cm, PDF a due facciate.
- Foto e frase del giorno rimandate (mancano i contenuti).

## Decisioni prese per il Diario (Fase 4)

- I giorni futuri non si compilano.
- Settimana da lunedì; ogni mese ha una griglia da 6 righe.
- Sfondo carta e pomello a fiore estratti dal mockup (`public/grafica/diario-*`): si sostituiscono con file con lo stesso nome.

## Decisioni prese per le cartoline (Fase 5)

- Interazione della tavola 12: primo tocco = il portafoglio si apre, secondo tocco = la cartolina.
- Proporzioni 10 x 15 (3:2) a schermo e in stampa: la grafica del mockup (1,29:1) è tagliata in alto e in basso.
- Grafica estratta dalle tavole 4-7 (`scripts/estrai-cartoline.py`).
- Le righe sul fronte della mappa sono decorative: si scrive a mano dopo la stampa.
- Retro senza scritte: riga divisoria, righe per l'indirizzo, riquadro per il francobollo postale.
- Al massimo un francobollo per cartolina; se se ne trascina un altro, prende il suo posto.
- Si attacca trascinando (dito o mouse); da tastiera c'è l'alternativa.
- Un francobollo non più sbloccato si toglie dalla cartolina.
- PDF generato senza librerie (generatore minimo in `src/lib/pdf-cartolina.ts`, ~3 KB, caricato al clic).

## Da decidere
- Conferma dell'elenco delle emozioni (3 livelli, proposta provvisoria in `src/data/emozioni.ts`) e della palette per famiglia
- Grafica dei francobolli (placeholder fino ad allora); cartoline e portafoglio definitivi dall'artista (oggi estratti dal mockup)
- Se la griglia dei francobolli resta "in ordine di sblocco" (come il mockup) o per famiglia
- Nome del repository GitHub (influisce sul `base` di Astro)
- Ordine delle pagine interne (Fase 10)
- Quando sostituire i placeholder con gli SVG definitivi
