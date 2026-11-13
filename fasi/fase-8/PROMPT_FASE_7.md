# Prompt per la Fase 7 · Foto e frase del giorno

Da usare quando foto e frasi sono pronte. Sostituisce il vecchio `fasi/fase-2/PROMPT_FOTO_FRASE.md`, che è stato scritto prima delle Fasi 3-8.

Incolla il testo qui sotto in una nuova chat insieme a:
- il link del sito;
- il link al repository GitHub (o lo zip del progetto);
- il PDF del mockup (`ALI.pdf`);
- le **foto** (meglio se già compresse, vedi sotto) e le **frasi** (un file di testo, una per riga, o un foglio con eventuali colonne extra: autore, data speciale, foto abbinata…).

---

Sto costruendo il sito "minuscole – L'universo delle cose" con Astro (mobile-first), pubblicato su GitHub Pages. È un regalo di compleanno per la mia ragazza, che sarà l'unica utente. Il progetto è diviso in fasi (vedi `ROADMAP.md` nel repo). Abbiamo chiuso le Fasi 0-6 e la **Fase 8 (primo gioco, il Memory)**, anticipata perché mancavano i contenuti. Ora che ci sono foto e frasi lavoriamo sulla **Fase 7: foto e frase del giorno**.

**Link del sito:** https://sitocompleanno-star.github.io/auguri/
**Repository:** [INCOLLA QUI]

**Contesto:** leggi `ROADMAP.md`, `fasi/fase-8/REPORT.md` e `fasi/fase-8/STATO_SITO.md` (e, se serve, `fasi/fase-1/` e `fasi/fase-2/` per la home e la cornice). In breve:
- **Home** (`src/pages/index.astro`): titolo, foglia, 5 zampe animate (Fase 2, non toccarle), **cornice** al centro, 4 pulsanti dei giochi (il cuore porta al Memory), striscia dei francobolli preferiti.
- **Cornice** (`src/components/Cornice.astro`): SVG definitivo 528,77 x 560,52 punti mockup, con due slot.
  - `foto`: area 488,2 x 370 a (20,3; 30), angoli arrotondati 20;
  - `frase`: area 488,2 x 100 a (20,3; 430).
  - Senza slot si vedono i segnaposto "FOTO/FRASE RANDOM DEL GIORNO".
- Note del mockup (pagina 2 di `ALI.pdf`): "visualizzazione di un'immagine random dalle librerie di foto che si troveranno in diverse parti del sito" e "una frase random tra quelle che si troveranno in diverse parti del sito". Le foto potranno servire anche ad altre pagine (Archivio, Fase 10) e a giochi futuri (Fase 9: puzzle o memory con foto).
- Misure in punti mockup: `--u` = 1/940 della larghezza del foglio (max 430 px). Sul telefono, più alto del mockup, crescono solo gli spazi (quota `k` in `src/data/home.ts`).
- **Stato** (`src/lib/stato.ts`): un unico JSON in `localStorage` (`minuscole:stato`, versione 1) con funzioni pure, sincronizzato e cifrato tra dispositivi (Fase 6, `src/lib/sincronizza.ts`). Se questa fase aggiunge dati dello stato (per esempio foto o frasi preferite):
  - vanno gestiti da `migra` **e** da `unisci`, senza perdite;
  - `unisci` deve restare indipendente dall'ordine e dalle ripetizioni: aggiungi i casi a `scripts/prova-sincronizzazione.mjs` (`npm run prova-sync`).
- "Oggi" si calcola sempre con `dataDiOggi()` (fuso Europe/Rome). Le date sono stringhe "AAAA-MM-GG" (`src/lib/calendario.ts`).
- Il repository è **pubblico** e il sito è pubblico (chi ha il link lo vede).

**Obiettivo della Fase 7** (dalla roadmap):
- dati in `src/data/foto.json` e `src/data/frasi.json` (o in `.ts`, se serve controllarli al build), con `alt` per ogni foto;
- scelta **deterministica dalla data**: stessa foto e stessa frase per tutta la giornata (Europe/Rome), senza backend. Valuta:
  - **al build** (serve un rebuild giornaliero con un workflow schedulato di GitHub Actions);
  - **nel browser** (piccolo script, funziona anche se il sito non viene ricostruito).
  - Dimmi pro e contro e cosa consigli;
- evitare ripetizioni ravvicinate (per esempio un ordine mescolato in modo fisso che si ripete solo dopo averle mostrate tutte), anche quando aggiungo foto o frasi nuove;
- foto che riempie l'area (`object-fit: cover`, angoli come nel mockup); frase che va a capo e si riduce bene anche se lunga (o un limite di lunghezza controllato al build);
- **niente salti di layout** al caricamento (`width`/`height`, spazio riservato, `decoding`/`fetchpriority` adatti alla prima schermata); con dati vuoti, un segnaposto pulito senza errori;
- **"Fatto quando":** foto e frase cambiano ogni giorno senza backend e il peso di `dist/` è sotto controllo.

**Prima di iniziare, fammi tutte le domande e dimmi tutti i dubbi che hai, e aspetta le mie risposte prima di scrivere codice.** In particolare:
- **Privacy:** il repository e il sito sono pubblici, quindi chiunque abbia il link o trovi il repo vede le foto e le frasi. Va bene così, servono accorgimenti (`noindex`, nomi file anonimi), o va valutata un'alternativa (repo privato con Pages, foto cifrate come i dati della Fase 6)? Ricordami anche di togliere i **metadati EXIF** (posizione GPS, data, telefono) dalle foto.
- **Quante** foto e frasi ci sono, e se ne aggiungerò altre nel tempo (influisce sul peso e sulla scelta build/browser).
- **Formato e compressione:** le comprimi tu (WebP/AVIF, lato lungo ~1600 px, miniature ~800 px) con uno script nel repo, o arrivano già pronte? Proporzioni delle foto (l'area è circa 4:3 orizzontale): come gestire le verticali (taglio, punto focale nel JSON)?
- **Foto e frase abbinate o indipendenti?** Ogni giorno una coppia fissa, o due sequenze separate?
- **Date speciali:** compleanno, anniversari, feste con una foto o frase scelta apposta?
- **Interazione:** tocco sulla foto per vederla in grande? Pulsante per "un'altra foto" (e quindi non più una sola al giorno)? Foto e frasi dei giorni passati da qualche parte (Archivio, Fase 10)?
- **Stato:** serve salvare qualcosa (foto o frasi preferite, già viste) e sincronizzarlo, o la scelta resta solo calcolata dalla data?
- **Frasi:** lunghezza massima, autore o fonte da mostrare, caratteri speciali (emoji, a capo voluti), stile del testo (font del titolo in corsivo o quello del Diario).
- **Peso:** quanto spazio dare ai media (la roadmap dice `public/media/` sotto ~500 MB; oggi `dist/` è 874 KB di dati) e se le foto vanno caricate tutte o solo quella del giorno.

**Vincoli:**
- Mantieni il sistema di misura in punti mockup (`--u`) e i componenti esistenti: `Cornice` ha già gli slot `foto` e `frase`, usali ed estendila, non riscriverla.
- Link e asset sempre con `import.meta.env.BASE_URL`; nei file dati solo nomi file relativi a `public/media/`.
- Media solo su GitHub, foto in `public/media/foto/`, **mai originali da fotocamera** (vedi "Gestione dei media" in `ROADMAP.md`).
- Nessuna dipendenza nuova senza motivo; uno script di compressione può usare strumenti solo di sviluppo, spiegandomi come lanciarlo su Windows.
- Ogni animazione (per esempio la dissolvenza della foto) rispetta `prefers-reduced-motion`.
- Accessibilità: `alt` significativo per ogni foto, frase leggibile (contrasto, minimo in px), niente testo dentro le immagini.
- Verifica con `npm run build`:
  - aspetto della home a 390 px con foto orizzontali, verticali e frasi lunghe;
  - cambio di giorno (simulato) e passaggio della mezzanotte Europe/Rome;
  - nessun salto di layout;
  - `npm run prova-sync` se cambia lo stato;
  - peso di `dist/` riportato in `STATO_SITO.md`.

**Già deciso:**
- Una sola utente, niente login, dati sincronizzati con la Fase 6.
- Solo GitHub per i file, video su YouTube (non in elenco) caricati al clic.
- Sul telefono crescono gli spazi, non gli elementi. Le zampe non si toccano.

**Da fare a fine fase:** crea `fasi/fase-7/REPORT.md`, `fasi/fase-7/STATO_SITO.md` e il prompt per la fase successiva (Fase 9, secondo gioco: puoi partire da `fasi/fase-8/PROMPT_FASE_9.md`, aggiornandolo con quello che è cambiato), con lo stesso formato delle fasi precedenti, e aggiorna `ROADMAP.md`.

**Promemoria (dalla Fase 6):** se il Worker di Cloudflare non è ancora pubblicato, ricordamelo: la guida è in `worker/LEGGIMI.md`, poi va messo l'indirizzo in `src/data/sincronizzazione.ts`.
