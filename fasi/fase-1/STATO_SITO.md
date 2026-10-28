# Stato del sito · fine Fase 1

Aggiornato: 2026-10-28

## Stack
- Astro 7.4.1, output statico, nessun framework JS aggiuntivo
- Hosting: GitHub Pages via GitHub Actions (https://sitocompleanno-star.github.io/auguri/, quindi `BASE=/auguri`)
- Target: mobile-first (foglio centrato max 430px; desktop in Fase 8)
- Peso `dist/`: 268 KB

## Struttura
```
minuscole/
├─ ROADMAP.md, README.md
├─ astro.config.mjs        (site/base da env SITE, BASE)
├─ .github/workflows/deploy.yml
├─ fasi/fase-0/, fasi/fase-1/   (REPORT, STATO_SITO, PROMPT_FASE_N+1)
├─ public/
│  ├─ grafica/             SVG DEFINITIVI
│  │   titolo, sfondo-foglia, cornice, collezione-francobolli, francobollo-vuoto,
│  │   gioco-cuore, gioco-fiori, gioco-arcobaleno, gioco-sole,
│  │   zampa-diario, zampa-archivio, zampa-luna-park, zampa-club-amici, zampa-caos
│  └─ placeholders/        francobollo-1, francobollo-2 (provvisori)
└─ src/
   ├─ layouts/Base.astro
   ├─ styles/global.css    (palette, font, .foglio come container, --u)
   ├─ components/
   │  ├─ Zampa.astro            (props: file, nome, w, h, top, k, visibile)
   │  ├─ Cornice.astro          (slot: foto, frase)
   │  ├─ PulsanteGioco.astro    (props: file, nome, w, h)
   │  └─ StripFrancobolli.astro (props: totale, ottenuti)
   ├─ data/home.ts        (zampe, giochi, francobolli, con misure e posizioni)
   └─ pages/
      ├─ index.astro      (home fedele al mockup)
      └─ diario, archivio, luna-park, club-amici, caos (pagine vuote)
```

## Sistema di misura
- La pagina del mockup è **940 x 1200 punti**; gli SVG sono nella stessa scala (es. titolo 626,78 x 116,61).
- `.foglio` ha `container-type: inline-size` e definisce `--u: calc(100cqw / 940)`: 1 punto del mockup = `var(--u)`.
- Posizioni e dimensioni nella home: `calc(N * var(--u))` con N letto dal mockup.
- Home: `min-height: max(100dvh, calc(1200 * var(--u)))`. Per ogni blocco assoluto: `top: calc(T * var(--u) + (100% - 1200 * var(--u)) * k)`, con `k` tra 0 (resta fermo) e 1 (scende di tutto lo spazio extra).

## Posizioni nel mockup (punti)
- Titolo: x 263,2 · y 100
- Zampe (top): Diario 328 · Archivio 505 · Luna Park 630 · Club degli Amici 783 · Caos 950; si vedono gli ultimi 152 punti di ciascun SVG
- Cornice: x 380,5 · y 284 (528,77 x 560,52); area foto y +30, altezza 370; area frase y +430, altezza 100; margine laterale 20,3
- Pulsanti: y 896, da x 380,5 a 909 (spaziati in modo uniforme)
- Striscia francobolli: x 380,5 · y 1037 (528,97 x 132,88); slot 45,44 x 58,1 a passo 55,4, da x +20,3 e y +54,5
- Foglia: ritaglio 343,15 x 1200 in alto a sinistra

## Palette
In `global.css`, ricavata dagli SVG (bordeaux `#6f211c`, mauve `#9b6f67`, rosso `#9f382d`, pesca `#e49a77`, arancio `#f0b77f`, crema `#e7c5a4`, rosa chiaro `#f7dcce`, beige `#eae1ce`, senape `#b58441`, verde salvia `#95a5a2`, verde scuro `#3d4c36`; grigi e inchiostro).

## Font
Titolo e "COLLEZIONE DI FRANCOBOLLI" sono SVG. In HTML: Arial/Helvetica per i testi di servizio; `--font-titolo` (serif corsivo di sistema) è usato solo dalle pagine interne vuote, provvisorio.

## Cosa funziona
- Home fedele al mockup a 390px (verificata con Chromium a 390x498 e 390x844).
- Cornice con segnaposto sostituibili tramite slot; striscia francobolli con 9 slot guidata da dati.
- Build statica completa (6 pagine), percorsi corretti con `base`.

## Cosa NON c'è ancora
- Zampe cliccabili e animate, nomi delle sezioni visibili (Fase 2)
- Foto e frase del giorno (Fase 3)
- Francobolli sbloccabili e stato in localStorage; SVG dei francobolli pieni (Fase 4)
- Giochi collegati ai pulsanti (Fasi 5-6)
- Contenuti delle pagine interne (Fase 7)
- Layout desktop, accessibilità completa (Fase 8)
- Test su telefono reale

## Convenzioni
- Link interni e asset sempre con `import.meta.env.BASE_URL`.
- SVG definitivi in `public/grafica/` con nomi in minuscolo, trattini, senza spazi; i provvisori in `public/placeholders/` con la stessa misura (`viewBox`) di quelli che sostituiscono.
- Misure della home in punti mockup (`--u`), non in pixel.
- Rispettare `prefers-reduced-motion` in ogni animazione.
