# Prompt per la Fase 2 · Zampe animate e navigazione

Incolla questo testo in una nuova chat, insieme a: il link del sito, il link al repository GitHub (o lo zip del progetto), il PDF del mockup (`ALI.pdf`) e, se ci sono, gli SVG nuovi.

---

Sto costruendo il sito "minuscole – L'universo delle cose" con Astro (mobile-first), pubblicato su GitHub Pages. Il progetto è diviso in fasi (vedi `ROADMAP.md` nel repo). Abbiamo chiuso la **Fase 1 (home statica)**; ora lavoriamo sulla **Fase 2: zampe animate e navigazione**.

**Link del sito:** https://sitocompleanno-star.github.io/auguri/
**Repository:** [INCOLLA QUI]

**Contesto:** leggi `ROADMAP.md`, `fasi/fase-1/REPORT.md` e `fasi/fase-1/STATO_SITO.md` nel repo (e, se serve, quelli della Fase 0). Il mockup è nel PDF allegato: le pagine 2-7 mostrano ogni zampa "allungata" con la scritta della sezione (Diario, Archivio, Luna Park, Club degli Amici, Caos). Gli SVG definitivi delle zampe lunghe (con scritta) sono già in `public/grafica/` (`zampa-diario.svg`, ecc.): nella home se ne vede solo la parte destra, ritagliata via CSS.

**Obiettivo della Fase 2:**
- al tap su una zampa, la zampa scivola fuori dal bordo sinistro mostrando il braccio lungo con il nome della sezione, poi si naviga alla pagina corrispondente
- le 5 zampe diventano link verso `/diario/`, `/archivio/`, `/luna-park/`, `/club-amici/`, `/caos/` (usando sempre `import.meta.env.BASE_URL`)
- transizioni fluide tra le pagine (valuta le View Transitions di Astro o un'alternativa leggera, senza dipendenze inutili)
- pagine interne vuote, con titolo, link "torna alla home" e la stessa identità grafica
- accessibilità: zampe raggiungibili da tastiera con nome accessibile (la scritta), focus visibile, `prefers-reduced-motion` rispettato (nessuna animazione, solo cambio pagina)

**Vincoli:**
- Mantieni il sistema di misura in punti mockup (`--u` = larghezza foglio / 940, vedi `STATO_SITO.md`) e i componenti esistenti (`Zampa` va estesa, non riscritta).
- Le zampe lunghe con scritta: usa gli SVG definitivi già presenti in `public/grafica/` (la scritta è già disegnata dentro l'SVG, non serve aggiungere testo; il nome per gli screen reader c'è già nel componente `Zampa`).
- Nessuna dipendenza nuova senza motivo.
- Media: solo GitHub (vedi "Gestione dei media" in `ROADMAP.md`).
- Verifica con `npm run build` e controlla l'aspetto e l'animazione a 390px.

**Già deciso:** sul telefono, più alto del mockup, le dimensioni restano quelle del mockup e a crescere sono gli spazi tra gli elementi (ogni zampa scende di una quota `k` dello spazio extra, vedi `src/data/home.ts`). Le zampe animate devono rispettare questo posizionamento.

**Da fare a fine fase:** crea `fasi/fase-2/REPORT.md`, `fasi/fase-2/STATO_SITO.md` e `fasi/fase-2/PROMPT_FASE_3.md` (Fase 3: foto e frase del giorno), con lo stesso formato delle fasi precedenti.

**Prima di iniziare**, dimmi se hai dubbi sulle animazioni o sulla struttura delle pagine interne.
