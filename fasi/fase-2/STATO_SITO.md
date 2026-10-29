# Stato del sito · fine Fase 2

Aggiornato: 2026-10-29

## Stack
- Astro 7.4.1, output statico, nessun framework JS aggiuntivo (nessuna dipendenza nuova in Fase 2)
- Hosting: GitHub Pages via GitHub Actions (https://sitocompleanno-star.github.io/auguri/, quindi `BASE=/auguri`)
- Target: mobile-first (foglio centrato max 430px; desktop in Fase 8)
- Peso `dist/`: 288 KB

## Struttura
```
minuscole/
├─ ROADMAP.md, README.md
├─ astro.config.mjs        (site/base da env SITE, BASE)
├─ .github/workflows/deploy.yml
├─ fasi/fase-0/, fase-1/, fase-2/   (REPORT, STATO_SITO, PROMPT_FASE_N+1)
├─ public/
│  ├─ grafica/             SVG DEFINITIVI (titolo, sfondo-foglia, cornice, collezione-francobolli,
│  │                        francobollo-vuoto, 4 giochi, 5 zampe lunghe con scritta)
│  └─ placeholders/        francobollo-1, francobollo-2 (provvisori)
└─ src/
   ├─ layouts/Base.astro          (+ script delle zampe: anima e poi naviga)
   ├─ styles/global.css           (palette, font, .foglio come container, --u, View Transitions)
   ├─ components/
   │  ├─ Zampa.astro              (props: file, nome, href, w, h, top, k, visibile, estesa)
   │  ├─ Cornice.astro            (slot: foto, frase)
   │  ├─ PulsanteGioco.astro      (props: file, nome, w, h)
   │  └─ StripFrancobolli.astro   (props: totale, ottenuti)
   ├─ data/home.ts                (zampe con slug, giochi, francobolli, misure e posizioni)
   └─ pages/
      ├─ index.astro              (home)
      └─ [sezione]/index.astro    (rotta dinamica: diario, archivio, luna-park, club-amici, caos)
```

## Sistema di misura
Invariato rispetto alla Fase 1: pagina del mockup 940 x 1200 punti, `--u = 100cqw / 940` su `.foglio`; elementi assoluti con `top: calc(T * var(--u) + (100% - 1200 * var(--u)) * k)`, `k` in `data/home.ts`. Le pagine interne usano la stessa formula per la zampa.

## Zampe (Fase 2)
- A riposo: `img` (SVG completo, 352 punti) con `transform: translateX((152 - w) * u)`; il `.foglio` (`overflow: hidden`) ritaglia la parte fuori dal bordo sinistro. Il blocco cliccabile è largo 152 punti.
- Attiva (`.is-moving`, aggiunta dallo script): `transform: none`, 480 ms `cubic-bezier(.3,.7,.2,1)`; z-index 3.
- Modo `estesa` (pagina interna): braccio già esteso; `data-zampa="chiudi"` fa il percorso inverso e poi torna alla home. Anche il link "← torna alla home" ha `data-zampa="chiudi"`.
- Attributi: `data-zampa="apri"` (home) / `"chiudi"` (interna). Lo script in `Base.astro` gestisce entrambi.
- `prefers-reduced-motion`: nessuna transizione, lo script non interviene, il link naviga subito.
- Focus: contorno bordeaux interno + alone `rgb(247 220 206 / .55)`; "sbirciata" di 14 punti con hover (solo `hover: hover`) e `:focus-visible`.

## Navigazione
- Link: `${BASE_URL}<slug>/` (BASE_URL termina sempre con `/`).
- Transizioni: `@view-transition { navigation: auto }` in `global.css` (solo dissolvenza `root`, 280 ms; disattivata con reduced-motion). Browser senza supporto: cambio pagina diretto.
- `pageshow` con `persisted` ripulisce lo stato `is-moving` (bfcache).

## Palette e font
Invariati (vedi Fase 1). Le pagine interne usano `--font-titolo` (serif corsivo di sistema, provvisorio) per il titolo.

## Cosa funziona
- Home identica alla Fase 1 con le 5 zampe cliccabili e animate.
- 5 pagine interne con titolo, "pagina in costruzione" e ritorno alla home (con animazione inversa).
- Tastiera, focus visibile, nomi accessibili, reduced-motion.
- Build statica completa (6 pagine), percorsi corretti con `base`.

## Cosa NON c'è ancora
- Foto e frase del giorno (Fase 3)
- Francobolli sbloccabili e stato in localStorage; SVG dei francobolli pieni (Fase 4)
- Giochi collegati ai pulsanti (Fasi 5-6)
- Contenuti delle pagine interne (Fase 7)
- Layout desktop, accessibilità completa (Fase 8)
- Test su telefono reale e su Firefox

## Convenzioni
- Link interni e asset sempre con `import.meta.env.BASE_URL`.
- SVG definitivi in `public/grafica/` (minuscolo, trattini, senza spazi); provvisori in `public/placeholders/` con stesso `viewBox`.
- Misure in punti mockup (`--u`), non in pixel.
- Ogni animazione rispetta `prefers-reduced-motion`.
- Nuova zampa/sezione: aggiungere una voce in `zampe` (con `slug`) in `data/home.ts` e l'SVG in `public/grafica/`; la pagina interna si genera da sola.
