# Prompt per la prossima fase · Fase 7 (foto e frase) oppure Fase 9 (secondo gioco)

La **Fase 7 · Foto e frase del giorno** è rimandata finché mancano foto e frasi.
- **Se foto e frasi sono pronte:** usa il prompt già scritto in `fasi/fase-2/PROMPT_FOTO_FRASE.md`, con le foto (già compresse) e le frasi. Aggiungi questa riga al contesto: "leggi anche `fasi/fase-8/REPORT.md` e `fasi/fase-8/STATO_SITO.md`".
- **Se mancano ancora:** si va avanti con la **Fase 9 · secondo gioco** (pulsante dei fiori), che non dipende da contenuti esterni. Il prompt è qui sotto.

Incolla il testo qui sotto in una nuova chat insieme a:
- il link del sito;
- il link al repository GitHub (o lo zip del progetto);
- il PDF del mockup (`ALI.pdf`) e, se ci sono, idee o disegni per il gioco.

---

Sto costruendo il sito "minuscole – L'universo delle cose" con Astro (mobile-first), pubblicato su GitHub Pages. È un regalo di compleanno per la mia ragazza, che sarà l'unica utente. Il progetto è diviso in fasi (vedi `ROADMAP.md` nel repo). Abbiamo chiuso la **Fase 8 (primo gioco, il Memory)**. La Fase 7 (foto e frase del giorno) è ancora rimandata perché mancano i contenuti, quindi passiamo alla **Fase 9: secondo gioco**, sul **secondo pulsante** della home (fiori).

**Link del sito:** https://sitocompleanno-star.github.io/auguri/
**Repository:** [INCOLLA QUI]

**Contesto:** leggi `ROADMAP.md`, `fasi/fase-8/REPORT.md` e `fasi/fase-8/STATO_SITO.md`. In breve:
- **Home**: 4 pulsanti dei giochi (`src/data/home.ts`, componente `PulsanteGioco.astro`). Con `href` e `gioco` il pulsante diventa un link. Il cuore porta già a `/giochi/memory/`; i fiori, l'arcobaleno e il sole sono ancora solo immagini.
- **Memory** (`src/pages/giochi/memory/index.astro`, logica pura in `src/lib/memory.ts`, dati in `src/data/memory.ts`):
  - livelli Facile/Difficile, mosse e record;
  - la prima vittoria sblocca il francobollo speciale "Memory";
  - è il modello da seguire per pagina, accessibilità (griglia, annunci in `role="status"`, focus) e reduced motion.
- **Francobolli speciali**: in `src/data/emozioni.ts`, array `speciali` (stessa forma di un'emozione + `gioco`).
  - `tuttiFrancobolli` = ruota + speciali (griglia di 73 posti) e `emozione(id)` trova anche gli speciali;
  - dopo averne aggiunto uno: `npm run francobolli`.
- **Stato** (`src/lib/stato.ts`, un unico JSON in `localStorage`, versione 1):
  - `premi: { [id]: { quando } }` e `record: { "<gioco>-<livello>": { mosse, quando } }`;
  - `registraVittoria(s, premio, chiave, mosse)`;
  - `sbloccati(s)` include i premi;
  - in `unisci` per i premi vince la data più vecchia, per i record meno mosse.
  - Se il nuovo gioco misura il punteggio in modo diverso (tempo, punti più alti = meglio), va deciso come salvarlo **senza rompere** `unisci`.
- **Sincronizzazione (Fase 6)**: dopo ogni `scrivi()` lo stato parte da solo, cifrato. Quindi:
  - ogni campo nuovo va gestito da `migra` **e** da `unisci`, senza perdite;
  - `unisci` deve restare indipendente dall'ordine e dalle ripetizioni: aggiungi i casi nuovi a `scripts/prova-sincronizzazione.mjs` (`npm run prova-sync`).
- Il repository è **pubblico**: nessun segreto nel codice.

**Obiettivo della Fase 9** (dalla roadmap: "Quiz, puzzle, ecc., uno per volta"):
- un secondo gioco semplice, collegato al pulsante dei fiori, in `/giochi/<nome>/`;
- vittoria che sblocca un secondo francobollo speciale (aggiunto a `speciali`);
- "Fatto quando": si gioca, si vince, si ottiene il francobollo, e compare anche sull'altro dispositivo.

**Prima di iniziare, dimmi se hai dubbi.** In particolare:
- quale gioco: puzzle a tessere scorrevoli (15-puzzle con un disegno), quiz con domande su di noi (servono le domande: le scrivo io?), "trova le differenze", altro;
- difficoltà e punteggio (mosse, tempo, risposte giuste) e come si confronta un record;
- il francobollo: simbolo e iniziale (diversi da Memory: M e cuore), colori;
- se in futuro arcobaleno e sole avranno altri giochi, o uno dei due porta al Luna Park.

**Vincoli:**
- Mantieni il sistema di misura in punti mockup (`--u`) e i componenti esistenti: estendili, non riscriverli.
- Link e asset sempre con `import.meta.env.BASE_URL`.
- Nessuna dipendenza nuova senza motivo; grafica con SVG/CSS; ogni animazione rispetta `prefers-reduced-motion`.
- Accessibilità come nel Memory:
  - controlli con nomi chiari;
  - si gioca anche da tastiera, focus visibile;
  - annunci in `role="status"`;
  - pulsanti ≥ 44 px a 390 px.
- Verifica con `npm run build`:
  - partita completa (anche da tastiera);
  - francobollo in `/francobolli/` e tra i possibili preferiti;
  - `npm run prova-sync` con i casi nuovi;
  - peso di `dist/` (oggi 874 KB di dati).

**Già deciso:**
- Una sola utente, niente login, dati sincronizzati con la Fase 6.
- Francobolli sempre riconoscibili anche senza colore (simbolo + iniziale).
- Ogni gioco dà il suo francobollo speciale **una volta sola** (alla prima vittoria); dopo resta il record.

**Da fare a fine fase:** crea `fasi/fase-9/REPORT.md`, `fasi/fase-9/STATO_SITO.md` e il prompt per la fase successiva (Fase 7, se nel frattempo ci sono foto e frasi, altrimenti il gioco successivo o la Fase 10), con lo stesso formato delle fasi precedenti, e aggiorna `ROADMAP.md`.

**Promemoria (dalla Fase 6):** se il Worker di Cloudflare non è ancora pubblicato, ricordamelo: la guida è in `worker/LEGGIMI.md`, poi va messo l'indirizzo in `src/data/sincronizzazione.ts`.
