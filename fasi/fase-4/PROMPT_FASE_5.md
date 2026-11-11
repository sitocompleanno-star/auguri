# Prompt per la Fase 5 · Cartoline e PDF

Incolla questo testo in una nuova chat insieme a:
- il link del sito;
- il link al repository GitHub (o lo zip del progetto);
- i PDF del mockup (`ALI.pdf`, `Diario.pdf`, `Francobolli_e_luna_park.pdf`);
- se ci sono, gli SVG definitivi (cartolina fiore, cartolina mappa, retro della cartolina, icone del portafoglio, francobolli).

---

Sto costruendo il sito "minuscole – L'universo delle cose" con Astro (mobile-first), pubblicato su GitHub Pages. È un regalo di compleanno per la mia ragazza, che sarà l'unica utente. Il progetto è diviso in fasi (vedi `ROADMAP.md` nel repo). Abbiamo chiuso la **Fase 4 (Diario)**; ora lavoriamo sulla **Fase 5: cartoline e PDF**.

**Link del sito:** https://sitocompleanno-star.github.io/auguri/
**Repository:** [INCOLLA QUI]

**Contesto:** leggi `ROADMAP.md`, `fasi/fase-4/REPORT.md` e `fasi/fase-4/STATO_SITO.md`. In breve:
- `src/lib/stato.ts` gestisce lo stato in `localStorage`: `{ versione: 1, giorni, preferiti, preferitiModificato, cartoline: {} }`. Le funzioni sono pure (`impostaGiorno`, `sbloccati`, `unisci`…), più `leggi`/`scrivi`/`aggiorna`/`osserva`. Il campo `cartoline` esiste già ma è vuoto. `unisci` (per la Fase 6) per ora copia le cartoline dallo stato con i preferiti più recenti.
- I francobolli sbloccati si calcolano dai giorni del Diario (`sbloccati`). Ognuno è un SVG con viewBox 45.44 x 58.1: un segnaposto in `public/placeholders/francobolli/<id>.svg` oppure il definitivo in `public/grafica/francobolli/` (`percorsoFrancobollo`).
- La pagina `/francobolli/` (tavola 4 di `Francobolli_e_luna_park.pdf`) ha il portafoglio con due icone: la busta con il cuore (cartolina fiore) e la cartellina verde TRAVEL (cartolina mappa). Oggi rispondono solo "è in arrivo". Sotto c'è la fascia FRANCOBOLLI (16 per riga) con il dettaglio in `<dialog>` e i preferiti per la home.
- Il Diario (`/diario/`) usa `<dialog>` per il mese in grande e un componente riusabile (`FlussoEmozioni`); il francobollo "cade e si attacca" con un'animazione che rispetta `prefers-reduced-motion`.

Il mockup è `Francobolli_e_luna_park.pdf` (pagine da 940 x 1200 punti):
- tavola 4: portafoglio chiuso;
- tavola 5: la cartolina esce dalla busta;
- tavola 6: cartolina con il fiore (girasole) in grande, la fascia FRANCOBOLLI resta sotto;
- tavola 7: cartolina con la mappa (fronte con planisfero e righe per l'indirizzo);
- tavola 12: note dell'artista sulle tavole.

**Obiettivo della Fase 5:**
1. Un tocco sulla prima o sulla seconda icona del portafoglio apre la cartolina corrispondente, con un'animazione che segua il mockup (la cartolina esce dalla busta). Si chiude e si torna al portafoglio.
2. Si attaccano i francobolli sbloccati sulla cartolina trascinandoli dalla fascia, con posizione e rotazione. Si possono spostare e togliere. Sul telefono deve funzionare col dito (pointer events), da tastiera con un'alternativa (es. "aggiungi" + frecce per spostare) e con lo screen reader (nomi tipo "Realizzata, sulla cartolina").
3. Stato: definisci `cartoline` in `stato.ts` (es. `{ fiore: { francobolli: [{ id, x, y, r }], modificato } }`), con coordinate in frazioni della cartolina, così sono indipendenti dalla misura dello schermo. Aggiorna `migra` e `unisci` (vince la cartolina modificata più di recente) senza rompere gli stati salvati. Aumenta `versione` solo se serve. Il modello deve permettere altre cartoline in futuro.
4. Retro della cartolina: decidi con me cosa c'è (testo libero? data? indirizzo?).
5. PDF a due facciate (fronte e retro), 10 x 15 cm (150 x 100 mm in orizzontale, come nelle tavole), generato nel browser: disegno su canvas a 300 dpi e inserimento in un PDF con una libreria caricata **solo in questa pagina e solo al clic** (es. `pdf-lib` con import dinamico). Nome del file con la data.
6. Se un francobollo attaccato non è più sbloccato (giorno cambiato nel Diario), decidi cosa fare (mostrarlo comunque? toglierlo?) e dimmelo.

**Vincoli:**
- Mantieni il sistema di misura in punti mockup (`--u`) e i componenti esistenti: estendili, non riscriverli.
- Link e asset sempre con `import.meta.env.BASE_URL`. Il repository è pubblico: nessun segreto nel codice.
- Nessuna dipendenza nuova senza motivo (la libreria PDF è prevista: caricala solo quando serve e controllane il peso).
- Accessibilità: focus visibile, alternativa da tastiera al trascinamento, `prefers-reduced-motion`.
- Verifica con `npm run build`, controlla l'aspetto a 390px e il peso di `dist/` (oggi 680 KB di dati), stampa di prova del PDF (o almeno controllo delle misure: 150 x 100 mm per pagina).

**Già deciso:**
- Niente login; la sincronizzazione è la Fase 6.
- Due cartoline (fiore e mappa), predisposte per altre in futuro.
- Formato 10 x 15 cm, PDF a due facciate.

**Da fare a fine fase:** crea `fasi/fase-5/REPORT.md`, `fasi/fase-5/STATO_SITO.md` e `fasi/fase-5/PROMPT_FASE_6.md` (Fase 6: sincronizzazione tra dispositivi), con lo stesso formato delle fasi precedenti.

**Prima di iniziare**, dimmi se hai dubbi. In particolare:
- cosa mettere sul retro;
- quanti francobolli al massimo per cartolina;
- se le cartoline del mockup vanno estratte dal PDF (come il fiore e la carta del Diario) o se arrivano SVG definitivi;
- come gestire il trascinamento su schermi piccoli, dove la cartolina è larga ~360px.
