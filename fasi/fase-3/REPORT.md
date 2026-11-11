# Report · Fase 3 · Emozioni, stato e francobolli

Data: 2026-11-11

## Obiettivo
Modello dati delle emozioni e dei francobolli, stato salvato in `localStorage`, striscia della home con i francobolli preferiti, pagina `/francobolli/` (portafoglio + griglia), sblocco di prova.

## Fatto
- **Ruota delle emozioni** (`src/data/emozioni.ts`, **provvisoria**). Ho preso le 6 famiglie e le emozioni intermedie di Felice dal mockup `Diario.pdf`. Il resto l'ho completato seguendo la ruota di G. Roberts, quella usata dal mockup (Felice → Orgogliosa → Realizzata/Fiduciosa). Struttura: 6 famiglie → 36 intermedie (8 Felice, 6 Triste, 4 Sorpresa, 8 Arrabbiata, 4 Disgustata, 6 Impaurita) → **72 emozioni di ultimo livello**. Gli aggettivi sono al femminile. Ogni emozione di ultimo livello ha `id`, `nome`, `famiglia`, `intermedia`, `iniziale`, `simbolo`, `sfumatura`, `colore` e `francobollo` (nome file).
- **Palette** calcolata in OKLCH, con la stessa luminosità per tutte le famiglie: un tono scuro per famiglia (bordo e simbolo del francobollo) e una sfumatura per ogni emozione intermedia, dalla più chiara alla più scura. Contrasti verificati: iniziale (inchiostro `#221f20`) sulla sfumatura ≥ 6,3:1; simbolo sulla sfumatura ≥ 3,67:1; tono scuro sul bianco ≥ 8,8:1.
- **Riconoscibili senza colore:** il simbolo indica la famiglia (sole, goccia, stella, fulmine, spirale, nuvola) e l'iniziale l'emozione. Dentro ogni famiglia le iniziali sono tutte diverse, quindi ogni coppia simbolo + lettera è unica.
- **Controllo al build:** `verificaRuota()` (id unici, iniziali diverse per famiglia, contrasti, numero di sfumature) blocca `npm run build` se qualcosa non torna.
- **Francobolli segnaposto:** 72 SVG leggeri (~2,2 KB l'uno) in `public/placeholders/francobolli/<id>.svg`, con lo stesso `viewBox` dello slot vuoto (45.44 x 58.1). Hanno la dentellatura, la sfumatura, il simbolo e l'iniziale. Si generano con `npm run francobolli` (`scripts/genera-francobolli.mjs`, nessuna dipendenza). Quando arriva un definitivo con lo stesso nome in `public/grafica/francobolli/`, il build lo usa al posto del segnaposto, senza toccare il codice. Lo stesso vale per le icone del portafoglio.
- **Stato** (`src/lib/stato.ts`): un unico oggetto JSON `{ versione, giorni, preferiti, preferitiModificato, cartoline }` nella chiave `minuscole:stato`.
  - Funzioni pure: `migra`, `impostaGiorno`, `alternaPreferito`, `sbloccati`, `conteggi`, `preferitiValidi`, `unisci`, `dataDiOggi` (fuso Europe/Rome).
  - Lettura e scrittura (`leggi`, `scrivi`, `aggiorna`, `osserva`) sempre in `try/catch`. Se `localStorage` è bloccato, il sito usa una copia in memoria e la pagina mostra un avviso.
  - I francobolli sbloccati si **calcolano** dai giorni. I preferiti validi sono al massimo 9 e solo tra quelli sbloccati.
  - Già pronto per la Fase 6: `unisci` confronta giorno per giorno e vince la modifica più recente. Un giorno cancellato resta come `emozione: null` con la sua data, così anche la cancellazione si sincronizza.
  - `osserva` aggiorna la pagina anche quando lo stato cambia in un'altra scheda o tornando indietro dalla cache del browser.
- **Home:** `StripFrancobolli` è stato esteso, non riscritto (nuove props `preferiti`, `href`, `titolo`; il modo statico funziona come prima). Mostra i preferiti in ordine di scelta; gli slot liberi restano vuoti. Tutta la striscia "Collezione di francobolli" è un link a `/francobolli/`, con focus visibile; le immagini restano leggibili dagli screen reader.
- **Pagina `/francobolli/`**, fedele alla tavola 4 di `Francobolli_e_luna_park.pdf`:
  - sfondo caldo sfumato;
  - portafoglio con busta con cuore e cartellina verde TRAVEL (segnaposto ridisegnati dal mockup). Si cliccano e rispondono "è in arrivo"; le cartoline sono la Fase 5;
  - in basso la fascia **FRANCOBOLLI** con 72 slot, 16 per riga e della stessa misura della striscia in home. I francobolli sbloccati riempiono gli slot in ordine di sblocco, come nel mockup;
  - un tocco su un francobollo apre una finestra (`<dialog>` nativo) con il francobollo grande, il nome, il percorso (Felice › Orgogliosa › Realizzata), la data di sblocco, quante volte è stato scelto e il pulsante "Metti nella home" / "Togli dalla home". Con 9 francobolli già nella home compare un messaggio;
  - un cuore rosso indica i francobolli presenti nella home (forma, non solo colore).
  - È raggiungibile con "← torna alla home".
- **Sblocco di prova:** un pannello in fondo alla pagina (scegli emozione + giorno, "5 a caso", "Azzera tutto") compare **solo con `npm run dev`**. Nella build pubblicata la sezione e il suo codice non ci sono: verificato nel `dist/`.
- **Pulizia:** nel progetto erano rimaste le vecchie pagine della Fase 0 (`src/pages/diario/`, `archivio/`, `caos/`, `club-amici/`, `luna-park/`). Avevano la precedenza sulla rotta `[sezione]` e la nascondevano: il build dava 5 avvisi e le pagine interne della Fase 2 non venivano generate. Le ho rimosse insieme ai segnaposto non più usati (`zampa-1..5`, `gioco-*`, `cornice`, `foglia-sfondo`, `francobollo-1/2/vuoto`).

## Verifiche
- `npm run build` con `BASE=/auguri`: 7 pagine, nessun avviso, link `/auguri/francobolli/` corretti.
- Peso `dist/`: **401 KB** di dati (644 KB su disco, per via dei blocchi minimi dei file piccoli); prima 288 KB. L'aumento è dovuto quasi tutto ai 72 segnaposto.
- Playwright/Chromium a 390x844 (touch, 2x):
  - nessuno scroll orizzontale;
  - la striscia della home porta a `/francobolli/`;
  - con 7 giorni salvati la griglia mostra 6 francobolli sbloccati (un'emozione ripetuta conta una volta);
  - la finestra di dettaglio è corretta e, alla chiusura, il focus torna al francobollo;
  - 4 francobolli messi nella home restano dopo il ricaricamento e compaiono nella home con alt "Francobollo Realizzata (Felice)";
  - con 10 preferiti salvati se ne mostrano 9;
  - Tab: torna alla home → busta → cartellina → primo francobollo, con focus visibile;
  - `localStorage` bloccato: nessun errore e avviso visibile;
  - con `reducedMotion: reduce` nessuna animazione;
  - nessun errore in console;
  - in dev il pannello di prova sblocca e i dati persistono al ricaricamento.
- **Non verificato:** telefono reale, Safari iOS (`<dialog>` è supportato da iOS 15.4), lettura reale con VoiceOver/TalkBack.

## Decisioni prese
- Famiglie ed emozioni intermedie come nel mockup Diario; il resto della ruota è una mia proposta da confermare.
- Simbolo per **famiglia** + iniziale per emozione. Un simbolo diverso per ognuna delle 72 emozioni sarebbe illeggibile a 19 px; il campo `simbolo` è comunque per emozione, quindi si può cambiare con la grafica definitiva.
- Griglia in **ordine di sblocco** (come il mockup, dove i primi slot sono pieni), non per famiglia.
- I preferiti si scelgono dalla finestra di dettaglio, non con un tocco diretto: così si vede anche il nome.
- `preferitiModificato` è in più rispetto al prompt: serve all'unione della Fase 6.
- Gli `id` delle emozioni non vanno più cambiati dopo l'uso, perché finiscono nello stato. Per rinominare un'emozione si cambia `nome`. `migra` non butta via emozioni sconosciute.

## Problemi aperti
- **Ruota delle emozioni da confermare.** Alcune scelte sono di compromesso per avere iniziali diverse dentro la famiglia (es. Beffarda, Vessata, Circospetta, Pietrificata).
- Gli slot della fascia sono piccoli come in home (~19 x 24 px a 390 px). Ho aggiunto una piccola area di tocco invisibile, ma su telefono va provato.
- Le icone del portafoglio sono segnaposto disegnati da me: servono gli SVG definitivi (`public/grafica/portafoglio-busta.svg` e `portafoglio-travel.svg`, viewBox 351 x 265).
- In questo zip c'erano file che dovevano già essere stati tolti (vedi Pulizia). Va controllato anche sul repository GitHub: se ci sono ancora, le pagine interne online sono quelle vecchie.
