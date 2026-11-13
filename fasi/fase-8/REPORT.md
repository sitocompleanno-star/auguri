# Report · Fase 8 · Primo gioco (Memory)

Data: 2026-11-13

## Obiettivo
Un gioco memory a carte sul primo pulsante della home (cuore). La vittoria sblocca un francobollo che si aggiunge a quelli del Diario (griglia di `/francobolli/`, preferiti, cartoline) e arriva agli altri dispositivi collegati (Fase 6).
La **Fase 7 (foto e frase del giorno) resta rimandata**: mancano ancora i contenuti.

## Decisioni prese con William (prima di iniziare)
1. **Carte con simboli semplici**, disegnati apposta in SVG (non i francobolli): Cuore, Fiore, Sole, Luna, Stella, Foglia, Goccia, Fungo.
2. **Due livelli a scelta**: Facile (6 coppie) e Difficile (8 coppie). Nessun tempo: si contano le mosse e si tiene il record per livello.
3. **Premio: un francobollo speciale "Memory", una volta sola** (alla prima vittoria, a qualunque livello). Sta fuori dalla ruota delle emozioni.

## Fatto

### Dati
- `src/data/memory.ts`:
  - 8 simboli (frammenti SVG 20 x 20, `currentColor`), ognuno con nome (letto dagli screen reader) e colore;
  - forme diverse, così le coppie si riconoscono anche senza colore;
  - livelli, id del premio, attesa prima di rigirare le carte sbagliate (1,1 s).
- `src/data/emozioni.ts`:
  - nuovo array `speciali` con il francobollo **Memory**: cuore + iniziale M, bordeaux su rosa chiaro, file `memory.svg`, campo `gioco: 'Memory'`;
  - `tuttiFrancobolli` = 72 della ruota + speciali;
  - `emozione(id)` trova anche gli speciali: così griglia, vassoio delle cartoline, preferiti e striscia della home li mostrano senza toccare il loro codice;
  - `verificaRuota()` controlla anche gli speciali (id unici, iniziali, contrasti).
- `src/data/simboli.ts`: simbolo `cuore` per il francobollo. `npm run francobolli` genera ora 73 segnaposto.

### Stato (`src/lib/stato.ts`, versione 1 compatibile)
- Due campi nuovi; se mancano (stati fino alla Fase 6) valgono vuoti, quindi `migra` li accetta senza cambiare versione:
  - `premi: { [idFrancobollo]: { quando } }`: francobolli vinti nei giochi;
  - `record: { "<gioco>-<livello>": { mosse, quando } }`: miglior partita.
- `sbloccati(s)`: giorni del Diario **più i premi** (giorno della vittoria nel fuso Europe/Rome), sempre dal più vecchio. Quindi preferiti, cartoline e `pulisciCartoline` trattano il premio come gli altri francobolli, ma **cancellare o cambiare un giorno non lo toglie mai**.
- `registraVittoria(s, premio, chiave, mosse)`: sblocca il premio se manca (la prima vittoria resta) e aggiorna il record se le mosse sono meno. `chiaveRecord(gioco, livello)`.
- `unisci(a, b)`:
  - premi: per ogni id vince la data **più vecchia**;
  - record: vincono **meno mosse**, a parità la data più vecchia.
  - Entrambe sono un "minimo" con un ordine totale, quindi l'ordine e le ripetizioni non contano.
- `senzaDati` conta anche premi e record: una vittoria come prima cosa crea il codice di sincronizzazione, come un giorno del Diario.

### Logica del gioco (`src/lib/memory.ts`, funzioni pure)
- `nuovaPartita` (mescolata Fisher-Yates con `crypto.getRandomValues`), `gira`, `copri`, `statoCarta`, `vinta`.
- `muovi` calcola lo spostamento con frecce e Home/Fine in una griglia.
- Se due carte sbagliate sono ancora scoperte, il tocco su una terza le rigira subito: niente attesa obbligata.

### Pagina `/giochi/memory/`
- Titolo "Memory" (stesso font in corsivo del Diario e dei francobolli), scelta del livello (pulsanti a pillola con `aria-pressed`), contatori (mosse, coppie, record), griglia, messaggio, "Nuova partita".
- Carte:
  - dorso bordeaux con cornice tratteggiata e una zampina (richiamo alle zampe della home);
  - fronte crema con il simbolo;
  - trovate con ✓ (non solo il colore).
- Rotazione 3D da 0,45 s. Con `prefers-reduced-motion`: niente rotazione, la faccia cambia subito, niente scossa sull'errore.
- Vittoria: finestra `<dialog>` con mosse, "Nuovo record!", il francobollo con un'animazione di "timbro" (solo la prima volta), "Gioca ancora" / "Vai ai francobolli". Il focus va sul titolo della finestra.
- Il livello scelto resta sul dispositivo (`minuscole:memory-livello`, non sincronizzato).
- Misure in punti mockup (`--u`) con minimi in px, come le altre pagine.

### Accessibilità
- `role="grid"` con righe e celle (le righe hanno `display: contents`, quindi non cambiano il layout).
- Carte = pulsanti con nome: "Carta 3, coperta" / "Carta 3, Luna" / "Carta 3, Luna, trovata".
- **Focus itinerante**: un solo `tabindex=0`; frecce, Home/Fine, Ctrl+Home/Fine; Invio o Spazio per girare. Le carte trovate restano raggiungibili ma `aria-disabled`.
- Annunci in `role="status"` (anche visibili):
  - carta girata ("Luna.");
  - coppia trovata ("Luna: coppia trovata! 2 su 6.");
  - coppia sbagliata ("Luna e Foglia: non sono uguali.");
  - vittoria ("Hai vinto in 9 mosse! Nuovo francobollo: Memory.").
  - Un testo uguale al precedente viene riletto.
- Focus visibile (3 px bordeaux). Tutti i pulsanti misurano almeno 44 px a 390 px; il link del cuore in home misura 44 x 45 px.

### Altre pagine
- **Home**: il cuore è un link "Gioca a Memory". `PulsanteGioco` è esteso con `href`/`gioco` facoltativi; gli altri tre pulsanti restano immagini come prima.
- **Francobolli**:
  - la griglia ha 73 posti;
  - il dettaglio di un francobollo speciale dice "Francobollo speciale", "Vinto giocando a **Memory**" (link al gioco) e "Vinto il …" (al posto di famiglia › intermedia e "scelto N volte");
  - pannello di prova in sviluppo: "Vinci Memory".
- **Striscia della home**: alt "Francobollo Memory (vinto al gioco)".

## Verifiche
- `npm run build` (`BASE=/auguri`): 9 pagine, nessun avviso. Il build si ferma se un simbolo del memory ha poco contrasto o se mancano simboli per un livello.
- `npm run prova-sync`: tutti i casi della Fase 6 più due blocchi nuovi:
  - **premi e record**:
    - stato vecchio → `migra`;
    - prima vittoria che resta, record che migliora solo con meno mosse;
    - premio che resta cancellando il giorno, anche tra i preferiti e su una cartolina;
    - `unisci` su 7 coppie di stati: ordine, ripetizione, unione con se stesso, associatività su tre dispositivi, dispositivo vecchio senza premi;
    - copia di sicurezza;
  - **logica del memory**: mazzi giusti, partita perfetta (mosse = coppie), errore e terza carta, stessa carta due volte, frecce.
- **Chrome (Playwright) a 390 x 844, Europe/Rome**, sulla build di produzione:
  - home → cuore → pagina memory; 12 carte "Carta N, coperta";
  - **partita completa Facile solo da tastiera** (frecce + Invio/Spazio): annunci di carta, coppia, errore e vittoria; finestra con il premio; focus sul titolo; `premi.memory` e `record.memory-facile` salvati;
  - "Gioca ancora", poi **Difficile col mouse** (16 carte): seconda vittoria senza premio ripetuto, record del livello salvato;
  - `/francobolli/`: Memory nella griglia ("1 francobolli sbloccati su 73"), dettaglio, "Metti nella home" → **primo francobollo della striscia in home**, resta dopo il ricaricamento; Memory nel **vassoio della cartolina**;
  - reduced motion: `transform: none`, dorso nascosto e fronte visibile subito; senza: rotazione `matrix3d`;
  - nessun errore JS (l'unico 404 è la favicon, che manca dalla Fase 4).
- **Due dispositivi** (due contesti di Chrome, servizio locale `npm run servizio`, build con `PUBLIC_SYNC_URL`):
  - A vince (nessun altro dato): **codice creato** e invio. Sul servizio solo dati cifrati: niente "memory" né "premi";
  - B ha un suo giorno nel Diario e si collega col link: vede **grata + Memory**;
  - B vince a Difficile senza premio ripetuto (era già arrivato da A); A riceve il record di B e il giorno di B, il suo record Facile resta;
  - A cancella il giorno di B: su B resta **solo Memory** (il premio non si perde).
- **Peso `dist/`: 874 KB** di dati (Fase 6: 847; +28 KB).
- **Non verificato**: telefoni reali (iOS/Android), Firefox e Safari, VoiceOver e TalkBack, Worker vero su Cloudflare.

## Decisioni prese da me
- **Il francobollo speciale ha la forma di un'emozione** (simbolo + iniziale + colori) e vive nello stesso elenco di ricerca (`emozione(id)`). Così griglia, preferiti, cartoline e striscia funzionano senza riscritture; un gioco nuovo aggiunge una riga a `speciali`.
- **Premi separati dai giorni**: nessun giorno finto nel Diario, quindi il premio non si perde cambiando un giorno e non sporca il calendario.
- **Ordine nella griglia**: il premio va al giorno della vittoria, dopo i francobolli del Diario dello stesso giorno (la griglia resta "in ordine di sblocco").
- **Record = meno mosse**: a parità vince il più vecchio, così l'unione resta deterministica.
- **Versione dello stato invariata (1)**: i campi nuovi sono facoltativi e i dispositivi con la Fase 6 li ignorerebbero senza romperli. Un dispositivo ancora alla Fase 6 però non li conserva nella sua unione: l'aggiornamento del sito arriva a tutti insieme (GitHub Pages), quindi non è un problema reale.
- **Errore**: le carte restano scoperte 1,1 s, ma un tocco su un'altra carta le rigira subito.
- **Livello ricordato solo sul dispositivo**: è una preferenza d'uso, non un dato da sincronizzare.
- **Percorso `/giochi/memory/`**: lascia spazio agli altri giochi (`/giochi/<nome>/`) senza scontrarsi con `[sezione]`.

## Problemi aperti
- **Il Worker di Cloudflare non è ancora pubblicato**: `URL_SERVIZIO` in `src/data/sincronizzazione.ts` è vuoto, quindi la sincronizzazione (anche del premio) è spenta. Guida in `worker/LEGGIMI.md` (~10 minuti), poi va messo l'indirizzo in `src/data/sincronizzazione.ts`.
- Grafica definitiva del francobollo Memory e delle carte (oggi segnaposto e SVG semplici): si sostituiscono con file dello stesso nome (`public/grafica/francobolli/memory.svg`).
- Favicon ancora mancante (dalla Fase 4).
- Fase 7 (foto e frase) sempre in attesa dei contenuti.
