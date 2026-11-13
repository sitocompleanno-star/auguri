# Prompt per la prossima fase · Fase 7 (foto e frase) oppure Fase 8 anticipata (memory)

La **Fase 7 · Foto e frase del giorno** è rimandata finché mancano foto e frasi.
- **Se foto e frasi sono pronte:** usa il prompt già scritto in `fasi/fase-2/PROMPT_FOTO_FRASE.md`, con le foto (già compresse) e le frasi. Aggiungi questa riga al contesto: "leggi anche `fasi/fase-6/REPORT.md` e `fasi/fase-6/STATO_SITO.md`".
- **Se mancano ancora (consigliato):** si anticipa la **Fase 8 · primo gioco (memory)**, che non dipende da contenuti esterni. Il prompt è qui sotto.

Incolla il testo qui sotto in una nuova chat insieme a:
- il link del sito;
- il link al repository GitHub (o lo zip del progetto);
- il PDF del mockup (`ALI.pdf`) e, se ci sono, disegni o idee per le carte del memory.

---

Sto costruendo il sito "minuscole – L'universo delle cose" con Astro (mobile-first), pubblicato su GitHub Pages. È un regalo di compleanno per la mia ragazza, che sarà l'unica utente. Il progetto è diviso in fasi (vedi `ROADMAP.md` nel repo). Abbiamo chiuso la **Fase 6 (Sincronizzazione tra dispositivi)**. La Fase 7 (foto e frase del giorno) è rimandata perché mancano i contenuti, quindi anticipiamo la **Fase 8: primo gioco, il memory**.

**Link del sito:** https://sitocompleanno-star.github.io/auguri/
**Repository:** [INCOLLA QUI]

**Contesto:** leggi `ROADMAP.md`, `fasi/fase-6/REPORT.md` e `fasi/fase-6/STATO_SITO.md`. In breve:
- La home ha 4 pulsanti dei giochi (cuore, fiori, arcobaleno, sole: `src/data/home.ts`, componente `PulsanteGioco.astro`). Oggi non portano da nessuna parte. Il memory va sul **primo pulsante** (cuore).
- Tutto lo stato è un unico JSON in `localStorage` (`minuscole:stato`), gestito da `src/lib/stato.ts` con funzioni pure:
  - `migra` porta qualunque valore a uno stato valido;
  - `unisci(a, b)` unisce due dispositivi (per giorno e per cartolina vince il più recente);
  - `scrivi()` lancia l'evento `minuscole:stato` e `osserva()` ridisegna.
- Oggi i francobolli sbloccati si **calcolano** dai giorni del Diario (`sbloccati(s)`).
- **Sincronizzazione (Fase 6):** dopo ogni `scrivi()` lo stato parte da solo, cifrato, verso gli altri dispositivi (`src/lib/sincronizza.ts`). Quindi:
  - ogni campo nuovo dello stato deve essere gestito da `migra` **e** da `unisci`, senza perdite tra dispositivi (con una data di modifica, come `giorni` e `cartoline`);
  - `unisci` deve restare indipendente dall'ordine e dalle ripetizioni (`unisci(a,b)` ≡ `unisci(b,a)`, `unisci(unisci(a,b),b)` ≡ `unisci(a,b)`): aggiungi i casi nuovi a `scripts/prova-sincronizzazione.mjs` (`npm run prova-sync`).
- Il repository è **pubblico**: nessun segreto nel codice.

**Obiettivo della Fase 8** (dalla roadmap):
- pagina del gioco memory a carte, collegata al primo pulsante della home;
- vittoria che **sblocca un francobollo**, che si aggiunge a quelli del Diario (griglia di `/francobolli/`, preferiti, cartoline);
- "Fatto quando": si gioca, si vince, si ottiene il francobollo, e il francobollo compare anche sull'altro dispositivo collegato.

**Prima di iniziare, dimmi se hai dubbi.** In particolare:
- quali immagini sulle carte: i francobolli delle emozioni già sbloccati? simboli? foto (che però mancano)?
- quante coppie (difficoltà) e se c'è un tempo o un numero di mosse;
- quale francobollo si vince: uno speciale "del gioco" (nuovo, fuori dalla ruota delle emozioni) o uno della ruota non ancora sbloccato? Una volta sola o a ogni vittoria?
- come salvarlo nello stato: per esempio `premi: { [idFrancobollo]: { quando } }` (versione 1 compatibile, o versione 2 con il passaggio in `migra`), e come cambiano `sbloccati`, `pulisciCartoline` e `unisci`. Un premio non va tolto se cambia un giorno del Diario;
- dove si vede che un francobollo viene da un gioco (dettaglio del francobollo?).

**Vincoli:**
- Mantieni il sistema di misura in punti mockup (`--u`) e i componenti esistenti: estendili, non riscriverli.
- Link e asset sempre con `import.meta.env.BASE_URL`.
- Nessuna dipendenza nuova senza motivo. Le carte con SVG/CSS; animazione di rotazione delle carte con `prefers-reduced-motion` (niente rotazione, solo cambio immediato).
- Accessibilità:
  - carte come pulsanti con nome ("Carta 3, coperta" / "Carta 3, Realizzata");
  - si gioca anche da tastiera (frecce nella griglia), focus visibile;
  - annunci in `role="status"` per coppia trovata, coppia sbagliata e vittoria;
  - pulsanti ≥ 44 px a 390 px.
- Verifica con `npm run build`:
  - partita completa (anche da tastiera);
  - francobollo sbloccato che compare in `/francobolli/` e tra i possibili preferiti;
  - `npm run prova-sync` con i casi nuovi di `unisci`;
  - peso di `dist/` (oggi 847 KB di dati).

**Già deciso:**
- Una sola utente, niente login, dati sincronizzati con la Fase 6.
- Francobolli sempre riconoscibili anche senza colore (simbolo + iniziale).

**Da fare a fine fase:** crea `fasi/fase-8/REPORT.md`, `fasi/fase-8/STATO_SITO.md` e il prompt per la fase successiva (Fase 7, se nel frattempo ci sono foto e frasi, altrimenti Fase 9), con lo stesso formato delle fasi precedenti, e aggiorna `ROADMAP.md`.

**Promemoria (dalla Fase 6):** se il Worker di Cloudflare non è ancora pubblicato, ricordamelo: la guida è in `worker/LEGGIMI.md`, poi va messo l'indirizzo in `src/data/sincronizzazione.ts`.
