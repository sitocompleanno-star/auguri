# Prompt per la Fase 4 · Diario

Incolla questo testo in una nuova chat insieme a:
- il link del sito;
- il link al repository GitHub (o lo zip del progetto);
- i PDF del mockup (`ALI.pdf`, `Diario.pdf`, `Francobolli_e_luna_park.pdf`);
- se ci sono, gli SVG definitivi (francobolli, sfondo del Diario, icona del fiore).

---

Sto costruendo il sito "minuscole – L'universo delle cose" con Astro (mobile-first), pubblicato su GitHub Pages. È un regalo di compleanno per la mia ragazza, che sarà l'unica utente. Il progetto è diviso in fasi (vedi `ROADMAP.md` nel repo). Abbiamo chiuso la **Fase 3 (emozioni, stato e francobolli)**; ora lavoriamo sulla **Fase 4: Diario**.

**Link del sito:** https://sitocompleanno-star.github.io/auguri/
**Repository:** [INCOLLA QUI]

**Contesto:** leggi `ROADMAP.md`, `fasi/fase-3/REPORT.md` e `fasi/fase-3/STATO_SITO.md`. In breve:
- `src/data/emozioni.ts` ha la ruota a 3 livelli: 6 famiglie → 36 intermedie → 72 emozioni di ultimo livello. Le 6 famiglie e le intermedie di Felice vengono dal mockup; il resto è provvisorio. Ogni emozione ha simbolo, iniziale, sfumatura e colore.
- `src/data/simboli.ts` contiene i 6 simboli SVG delle famiglie.
- `src/lib/stato.ts` gestisce lo stato in localStorage: `impostaGiorno`, `sbloccati`, `dataDiOggi` (Europe/Rome), `aggiorna`, `osserva`, …
- La pagina `/francobolli/` mostra i francobolli sbloccati; la striscia della home mostra i preferiti.

Il mockup è `Diario.pdf` (pagine da 940 x 1200 punti, come la home):
- pagine 2-6: flusso "Come ti senti oggi?". È un riquadro grigio con un fiore-pomello in alto e pulsanti a pillola: famiglie, poi intermedie, poi emozioni di ultimo livello. La scelta fatta resta in alto e sotto compaiono le opzioni del livello successivo. Alla fine compare il francobollo.
- pagina 7: calendario annuale (es. "2026") con 12 mesi in griglia 3 x 4; ogni mese è una griglia di giorni e il giorno compilato si colora.
- Sfondo: carta antica con scritte.

**Obiettivo della Fase 4:**
1. Pagina `/diario/` con la stessa identità grafica e transizione delle altre pagine. Oggi il Diario è generato dalla rotta `[sezione]`: crea una pagina dedicata e decidi come gestire la zampa (vedi il problema aperto della Fase 2 sulla zampa nelle pagine lunghe).
2. Flusso "Come ti senti oggi?" a 3 livelli, fedele al mockup.
   - Si può tornare indietro di un livello.
   - Alla fine si salva con `impostaGiorno` e compare il francobollo sbloccato, con una piccola animazione che rispetti `prefers-reduced-motion`.
   - Se è il primo sblocco di quell'emozione, dillo ("Nuovo francobollo!").
3. Calendario annuale dell'anno corrente, con cambio anno.
   - Le caselle dei giorni compilati hanno la sfumatura dell'emozione e il simbolo o l'iniziale, non solo il colore.
   - Toccando un giorno passato si può cambiare (o cancellare, con `emozione: null`) la sua emozione.
   - Per default i giorni futuri non si compilano (dimmi se sei d'accordo).
   - Il giorno di oggi è evidenziato.
4. Accessibilità: i pulsanti del flusso e i giorni sono leggibili dagli screen reader (es. "12 novembre: Realizzata"); focus visibile; navigazione da tastiera nel calendario.
5. Togli il pannello di prova da `/francobolli/` (solo dev) se il Diario lo rende inutile, oppure lascialo solo in dev.

**Vincoli:**
- Mantieni il sistema di misura in punti mockup (`--u`) e i componenti esistenti: estendili, non riscriverli.
- Link e asset sempre con `import.meta.env.BASE_URL`. Il repository è pubblico: nessun segreto nel codice.
- Nessuna dipendenza nuova senza motivo.
- Date sempre nel fuso Europe/Rome (`dataDiOggi`).
- Verifica con `npm run build`, controlla l'aspetto a 390px e il peso di `dist/`.

**Già deciso:**
- Niente login; la sincronizzazione è la Fase 6.
- Si può cambiare l'emozione di un giorno passato.
- Gli `id` delle emozioni non si cambiano più dopo l'uso.
- Le cartoline sono la Fase 5.

**Da fare a fine fase:** crea `fasi/fase-4/REPORT.md`, `fasi/fase-4/STATO_SITO.md` e `fasi/fase-4/PROMPT_FASE_5.md` (Fase 5: cartoline e PDF), con lo stesso formato delle fasi precedenti.

**Prima di iniziare**, dimmi se hai dubbi: in particolare su come mostrare le emozioni intermedie quando sono 8 (Felice, Arrabbiata), sulla misura delle caselle del calendario a 390px e sui giorni futuri.
