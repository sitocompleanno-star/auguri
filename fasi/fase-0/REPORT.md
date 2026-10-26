# Report · Fase 0 · Fondamenta

Data: 2026-10-21

## Obiettivo
Avere un progetto Astro funzionante, pronto per GitHub Pages, con placeholder al posto della grafica definitiva.

## Fatto
- Creato il progetto Astro (v7.4.1, output statico, `trailingSlash: 'always'`).
- Configurazione `site`/`base` tramite variabili d'ambiente `SITE` e `BASE` (default locale `/`).
- Workflow GitHub Actions `deploy.yml` per il deploy su GitHub Pages (build con `SITE`/`BASE` derivati dal repo).
- Layout base `Base.astro` con il "foglio" mobile (max 430px, centrato) e meta tag per mobile.
- Palette (variabili CSS) ricavata dal mockup e stack di font provvisori.
- 14 placeholder SVG in `public/placeholders/` (5 zampe, foglia, cornice, 4 pulsanti giochi, 3 francobolli).
- Home minima e 5 pagine vuote: Diario, Archivio, Luna Park, Club degli Amici, Caos.
- `ROADMAP.md` con le fasi 0-8 e `README.md` con istruzioni di deploy.

## Verifiche
- `npm install` senza vulnerabilità.
- `npm run build` con `BASE=/minuscole`: 6 pagine generate; i percorsi dei placeholder usano correttamente il base (`/minuscole/placeholders/...`).
- Non verificato: il deploy reale su GitHub (il repository non esiste ancora) e il rendering su telefono.

## Decisioni prese
- Astro, mobile-first, GitHub Pages, placeholder finché la grafica non è pronta.
- Un solo URL per pagina (cartelle con `index.astro`), nomi in minuscolo senza accenti: `/diario/`, `/archivio/`, `/luna-park/`, `/club-amici/`, `/caos/`.
- I link interni usano sempre `import.meta.env.BASE_URL`.

## Problemi aperti
- Il nome del repository non è ancora deciso (determina l'URL finale).
- Font definitivi da concordare con chi fa la grafica (il titolo sembra un serif corsivo, il resto un sans bold); colori da confermare perché approssimati dal PDF.
- I placeholder sono forme semplici: le proporzioni reali delle zampe (che escono dal bordo sinistro e hanno versioni allungate con scritta) vanno definite con la grafica.

## Da fare per chiudere la fase
1. Creare il repo su GitHub e caricare il progetto.
2. Attivare Pages con sorgente "GitHub Actions".
3. Incollare il link del sito nel prompt della Fase 1.
