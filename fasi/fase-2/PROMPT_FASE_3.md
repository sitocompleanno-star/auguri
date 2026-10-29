# Prompt per la Fase 3 · Foto e frase del giorno

Incolla questo testo in una nuova chat, insieme a: il link del sito, il link al repository GitHub (o lo zip del progetto), il PDF del mockup (`ALI.pdf`) e, se ci sono, le foto e le frasi da usare.

---

Sto costruendo il sito "minuscole – L'universo delle cose" con Astro (mobile-first), pubblicato su GitHub Pages. Il progetto è diviso in fasi (vedi `ROADMAP.md` nel repo). Abbiamo chiuso la **Fase 2 (zampe animate e navigazione)**; ora lavoriamo sulla **Fase 3: foto e frase del giorno**.

**Link del sito:** https://sitocompleanno-star.github.io/auguri/
**Repository:** [INCOLLA QUI]

**Contesto:** leggi `ROADMAP.md`, `fasi/fase-2/REPORT.md` e `fasi/fase-2/STATO_SITO.md` nel repo (e, se serve, quelli delle fasi precedenti). Il mockup è nel PDF allegato (pagina 1): la cornice grigia al centro della home ha un'area per la **foto random del giorno** (in alto) e una per la **frase random del giorno** (in basso). Oggi ci sono solo i segnaposto "FOTO/FRASE RANDOM DEL GIORNO" dentro gli slot `foto` e `frase` del componente `Cornice`.

**Obiettivo della Fase 3:**
- dati in `src/data/foto.json` e `src/data/frasi.json`
- scelta **deterministica dalla data**: la stessa foto e la stessa frase per tutta la giornata (fuso Europe/Rome), senza backend; decidere se la scelta avviene al build (e quindi serve un rebuild giornaliero con un workflow schedulato) o nel browser con un piccolo script — valuta pro e contro e dimmi cosa consigli
- la foto riempie l'area foto della cornice (`object-fit: cover`, angoli come nel mockup, dimensioni in punti mockup: area foto 489 x 370 circa, vedi `STATO_SITO.md`); la frase sta nell'area frase (altezza 100 punti) e deve andare a capo e ridursi bene anche con frasi lunghe
- niente salti di layout durante il caricamento (dimensioni riservate, `width`/`height`, eventuale `loading`/`decoding` adeguati)
- testo alternativo per ogni foto nel JSON (`alt`)
- le foto sono in `public/media/foto/`, **già compresse** (WebP o AVIF, lato lungo ~1600 px per le grandi, ~800 px per eventuali miniature); mai originali da fotocamera
- se la data non produce nulla (JSON vuoto), mostra un segnaposto pulito senza errori

**Vincoli:**
- Mantieni il sistema di misura in punti mockup (`--u`) e i componenti esistenti (`Cornice` ha gli slot `foto` e `frase`: usali, non riscriverla).
- Link e percorsi sempre con `import.meta.env.BASE_URL`. Nei JSON solo nomi file relativi a `public/media/`.
- Nessuna dipendenza nuova senza motivo.
- Media: solo GitHub (vedi "Gestione dei media" in `ROADMAP.md`); a fine fase controlla il peso con `du -sh dist` e riportalo in `STATO_SITO.md`.
- Rispetta `prefers-reduced-motion` per qualunque animazione (es. dissolvenza all'apparire della foto).
- Verifica con `npm run build` e controlla l'aspetto a 390px.

**Già deciso:** sul telefono, più alto del mockup, le dimensioni restano quelle del mockup e a crescere sono gli spazi tra gli elementi (quota `k`, vedi `src/data/home.ts`). Le zampe sono link animati (Fase 2): non toccarle.

**Da fare a fine fase:** crea `fasi/fase-3/REPORT.md`, `fasi/fase-3/STATO_SITO.md` e `fasi/fase-3/PROMPT_FASE_4.md` (Fase 4: francobolli collezionabili), con lo stesso formato delle fasi precedenti.

**Prima di iniziare**, dimmi se hai dubbi (in particolare su build giornaliero vs scelta nel browser, e su quante foto/frasi ci sono già).
