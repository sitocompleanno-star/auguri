# Prompt per la Fase 3 · Emozioni, stato e francobolli

Incolla questo testo in una nuova chat, insieme a: il link del sito, il link al repository GitHub (o lo zip del progetto), i PDF del mockup (`ALI.pdf`, `Diario.pdf`, `Francobolli_e_luna_park.pdf`) e, se ci sono, la lista delle emozioni e gli SVG dei francobolli.

---

Sto costruendo il sito "minuscole – L'universo delle cose" con Astro (mobile-first), pubblicato su GitHub Pages: è un regalo di compleanno per la mia ragazza (un'unica utente). Il progetto è diviso in fasi (vedi `ROADMAP.md` nel repo). Abbiamo chiuso la **Fase 2 (zampe animate e navigazione)**; ora lavoriamo sulla **Fase 3: emozioni, stato e francobolli**.

**Link del sito:** https://sitocompleanno-star.github.io/auguri/
**Repository:** [INCOLLA QUI]

**Contesto:** leggi `ROADMAP.md` (fasi 3-6 e "Decisioni prese per Diario e Francobolli"), `fasi/fase-2/REPORT.md` e `fasi/fase-2/STATO_SITO.md`. I mockup:
- `Diario.pdf`: flusso "Come ti senti oggi?" a 3 livelli (es. Felice → Orgogliosa → Realizzata/Fiduciosa), poi il francobollo; calendario annuale con 12 mesi. È la Fase 4, ma i dati delle emozioni nascono qui.
- `Francobolli_e_luna_park.pdf`: pagina Francobolli con portafoglio (busta con cuore + cartellina verde "TRAVEL") e griglia di slot (circa 70); le cartoline sono la Fase 5; Luna Park è molto più avanti, non toccarlo.

**Obiettivo della Fase 3:**
1. `src/data/emozioni.ts`: ruota a 3 livelli (6 famiglie → emozioni → emozioni di ultimo livello, circa 70). Ogni emozione di ultimo livello: `id`, `nome`, `famiglia`, `iniziale`, `simbolo`, nome file del francobollo. Colore per famiglia, con sfumatura diversa per le emozioni interne; palette ispirata alle ruote delle emozioni (proponimela, con i contrasti verificati). Ogni francobollo deve distinguersi anche senza colore (segno/simbolo + lettera iniziale). Se non ti do la lista delle emozioni, proponi tu una ruota a 3 livelli in italiano (stile "ruota delle emozioni" di Willcox) e dimmi che è provvisoria.
2. Stato in `localStorage` (modulo `src/lib/stato.ts`): un unico oggetto JSON con `versione`, `giorni` (`"AAAA-MM-GG"` → `{ emozione, modificato }`), `preferiti` (max 9), `cartoline` (vuoto per ora). Accesso protetto da `try/catch` (può essere bloccato), con funzioni piccole e pure (leggi, scrivi, migra) pensate per essere sincronizzate in Fase 6: unione giorno per giorno, vince la modifica più recente. I francobolli sbloccati si calcolano dai giorni, non si salvano.
3. Home: la striscia mostra i francobolli **preferiti** (fino a 9; slot vuoti per il resto) usando `StripFrancobolli`; i francobolli senza SVG usano placeholder in `public/placeholders/` con lo stesso `viewBox` e nome dei definitivi.
4. Click su "Collezione di francobolli" → `/francobolli/` (link con `import.meta.env.BASE_URL`, stessa identità grafica e transizione delle altre pagine): portafoglio con le due icone, griglia con francobolli sbloccati e slot vuoti, scelta dei preferiti. Le icone del portafoglio si cliccano ma le cartoline vere arrivano in Fase 5 (ora solo stato "in arrivo" o niente).
5. Uno sblocco di prova (es. un pulsante provvisorio, rimosso a fine fase) per verificare che il francobollo compaia nella griglia e tra i preferiti e persista al ricaricamento.

**Vincoli:**
- Mantieni il sistema di misura in punti mockup (`--u`) e i componenti esistenti (`StripFrancobolli`, `Zampa`, ecc.): estendili, non riscriverli.
- Link e asset sempre con `import.meta.env.BASE_URL`. Il repository è pubblico: nessun segreto nel codice.
- Nessuna dipendenza nuova senza motivo.
- Accessibilità: stato dei francobolli (sbloccato/bloccato) leggibile da screen reader, focus visibile, `prefers-reduced-motion` rispettato.
- Verifica con `npm run build` e controlla l'aspetto a 390px; ricontrolla anche il peso di `dist/`.

**Già deciso:** niente login; la sincronizzazione tra dispositivi è la Fase 6. Foto e frase del giorno sono rimandate alla Fase 7 (mancano i contenuti): lascia i segnaposto nella cornice. Si può cambiare l'emozione di un giorno passato. Le dimensioni nella home restano quelle del mockup e a crescere sono gli spazi (quota `k`).

**Da fare a fine fase:** crea `fasi/fase-3/REPORT.md`, `fasi/fase-3/STATO_SITO.md` e `fasi/fase-3/PROMPT_FASE_4.md` (Fase 4: Diario), con lo stesso formato delle fasi precedenti.

**Prima di iniziare**, dimmi se hai dubbi (in particolare sull'elenco delle emozioni, sulla palette e sui simboli dei francobolli).
