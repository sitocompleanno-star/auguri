# Stato del sito · fine Fase 0

Aggiornato: 2026-10-21

## Stack
- Astro 7.4.1, output statico, nessun framework JS aggiuntivo (per ora)
- Hosting: GitHub Pages via GitHub Actions
- Target: mobile-first (foglio centrato max 430px; desktop in Fase 8)

## Struttura
```
minuscole/
├─ ROADMAP.md, README.md
├─ astro.config.mjs        (site/base da env SITE, BASE)
├─ .github/workflows/deploy.yml
├─ fasi/fase-0/            (REPORT, STATO_SITO, PROMPT_FASE_1)
├─ public/placeholders/    (zampa-1..5, foglia-sfondo, cornice, gioco-1..4-*, francobollo-vuoto, francobollo-1..2)
└─ src/
   ├─ layouts/Base.astro
   ├─ styles/global.css    (palette, font stack, .foglio)
   ├─ components/          (vuota)
   ├─ data/                (vuota)
   └─ pages/
      ├─ index.astro       (home minima: titolo + una zampa)
      ├─ diario/index.astro
      ├─ archivio/index.astro
      ├─ luna-park/index.astro
      ├─ club-amici/index.astro
      └─ caos/index.astro
```

## Palette (variabili CSS in global.css)
bordeaux `#7a1616`, mauve `#a06a64`, pesca `#f4a07a`, crema `#f0c9a0`, rosa chiaro `#fbd9cc`, grigio chiaro `#ededec`, grigio `#e0dddc`, grigio testo `#8a8584`, inchiostro `#1d1d1d` (valori approssimati dal mockup).

## Font
Provvisori: titolo `Playfair Display` / Georgia (serif corsivo), UI `Archivo` / Arial (sans bold). Non caricati da nessuna fonte: usano i font di sistema.

## Cosa funziona
- Build statica completa (6 pagine), percorsi corretti con `base`.
- Pagine interne raggiungibili con URL diretto e link "torna alla home".

## Cosa NON c'è ancora
- Home fedele al mockup (Fase 1)
- Menu a zampe e animazioni (Fase 2)
- Foto e frase del giorno (Fase 3)
- Francobolli, giochi, contenuti delle pagine (Fasi 4-7)
- Layout desktop, accessibilità completa (Fase 8)
- Repository GitHub e deploy reale (da fare)

## Convenzioni
- Link interni sempre con `import.meta.env.BASE_URL`.
- Placeholder SVG sostituibili mantenendo nome file e viewBox.
- Rispettare `prefers-reduced-motion` in ogni animazione.
