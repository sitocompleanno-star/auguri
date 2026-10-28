# Stato del sito · fine Fase 1

Aggiornato: 2026-10-26

## Stack
- Astro 7.4.1, output statico, nessun framework JS aggiuntivo
- Hosting: GitHub Pages via GitHub Actions (URL pubblicato: https://sitocompleanno-star.github.io/auguri/, quindi `BASE=/auguri`)
- Target: mobile-first (foglio centrato max 430px; desktop in Fase 8)
- Peso `dist/`: 116 KB

## Struttura
```
minuscole/
├─ ROADMAP.md, README.md
├─ astro.config.mjs        (site/base da env SITE, BASE)
├─ .github/workflows/deploy.yml
├─ fasi/fase-0/, fasi/fase-1/   (REPORT, STATO_SITO, PROMPT_FASE_N+1)
├─ public/placeholders/    (zampa-1..5, foglia-sfondo, cornice, gioco-1..4-*, francobollo-vuoto, francobollo-1..2)
└─ src/
   ├─ layouts/Base.astro
   ├─ styles/global.css    (palette, font stack, .foglio come container, --u)
   ├─ components/
   │  ├─ Zampa.astro            (prop: file)
   │  ├─ Cornice.astro          (slot: foto, frase)
   │  ├─ PulsanteGioco.astro    (props: file, nome)
   │  └─ StripFrancobolli.astro (props: totale, ottenuti)
   ├─ data/home.ts        (zampe, giochi, francobolli)
   └─ pages/
      ├─ index.astro      (home fedele al mockup)
      ├─ diario/index.astro
      ├─ archivio/index.astro
      ├─ luna-park/index.astro
      ├─ club-amici/index.astro
      └─ caos/index.astro
```

## Sistema di misura
- `.foglio` ha `container-type: inline-size` e definisce `--u: calc(100cqw / 960)`.
- 1 unità = 1/960 della larghezza del foglio = 1 pixel della pagina del mockup (PDF 960x1232).
- Nei componenti e nella home: `calc(N * var(--u))`, con N preso dal mockup.
- `.home` ha `min-height: max(100dvh, calc(1232 * var(--u)))`; gli spazi tra gli elementi (flex) assorbono l'altezza extra.

## Palette
Invariata (vedi `global.css`). Valori approssimati dal mockup.

## Font
Provvisori, come in Fase 0: titolo serif corsivo (`Playfair Display`/Georgia/Times), UI sans bold (`Archivo`/Arial). Non caricati da nessuna fonte.

## Cosa funziona
- Home fedele al mockup a 390px (verificata con Chromium a 390x500 e 390x844).
- Cornice con segnaposto sostituibili tramite slot; striscia francobolli con 9 slot guidata da dati.
- Build statica completa (6 pagine), percorsi corretti con `base`.

## Cosa NON c'è ancora
- Zampe cliccabili e animate, nomi delle sezioni (Fase 2)
- Foto e frase del giorno (Fase 3)
- Francobolli sbloccabili e stato in localStorage (Fase 4)
- Giochi collegati ai pulsanti (Fasi 5-6)
- Contenuti delle pagine interne (Fase 7)
- Layout desktop, accessibilità completa, SVG definitivi (Fase 8)
- Test su telefono reale

## Convenzioni
- Link interni e asset sempre con `import.meta.env.BASE_URL`.
- Placeholder SVG sostituibili mantenendo nome file e viewBox (zampe: 160x110 dalla Fase 1).
- Misure della home in unità mockup (`--u`), non in pixel.
- Rispettare `prefers-reduced-motion` in ogni animazione.
