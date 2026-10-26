# Prompt per la Fase 1 · Home statica (mobile)

Incolla questo testo in una nuova chat, insieme a: il link del sito, il link al repository GitHub, il PDF del mockup (`ALI.pdf`) e, se ci sono, gli SVG definitivi.

---

Sto costruendo il sito "minuscole – L'universo delle cose" con Astro (mobile-first), pubblicato su GitHub Pages. Il progetto è diviso in fasi (vedi `ROADMAP.md` nel repo). Abbiamo chiuso la **Fase 0 (fondamenta)**; ora lavoriamo sulla **Fase 1: home statica**.

**Link del sito:** [INCOLLA QUI]
**Repository:** [INCOLLA QUI]

**Contesto:** leggi `ROADMAP.md`, `fasi/fase-0/REPORT.md` e `fasi/fase-0/STATO_SITO.md` nel repo. Il mockup è nel PDF allegato.

**Obiettivo della Fase 1:** realizzare la home fedele al mockup, a larghezza telefono (~390px), senza animazioni:
- titolo "L'UNIVERSO DELLE COSE / minuscole" in alto a destra
- foglia grigia di sfondo
- 5 zampe a sinistra che escono dal bordo (solo la parte visibile, senza scritte)
- cornice grigia con area foto ("FOTO RANDOM DEL GIORNO") e area frase ("FRASE RANDOM DEL GIORNO") come segnaposto
- 4 pulsanti dei giochi sotto la cornice
- striscia "COLLEZIONE DI FRANCOBOLLI" con 9 slot (2 pieni, 7 vuoti)

**Vincoli:**
- Usa i placeholder in `public/placeholders/` (oppure gli SVG definitivi, se li allego); non cambiare i nomi dei file.
- Componenti Astro riusabili in `src/components/` (Zampa, Cornice, PulsanteGioco, StripFrancobolli).
- Link e asset sempre con `import.meta.env.BASE_URL`.
- Nessuna dipendenza nuova senza motivo.
- Media: solo GitHub (max 1 GB, obiettivo ~500 MB in `public/media/`), foto compresse, video su YouTube non in elenco (vedi "Gestione dei media" in `ROADMAP.md`).
- Verifica con `npm run build` e controlla l'aspetto a 390px.

**Da fare a fine fase:** crea `fasi/fase-1/REPORT.md`, `fasi/fase-1/STATO_SITO.md` e `fasi/fase-1/PROMPT_FASE_2.md` (Fase 2: zampe animate e navigazione), con lo stesso formato della Fase 0.

**Prima di iniziare**, dimmi se hai dubbi sulle proporzioni o sulla posizione degli elementi rispetto al mockup.
