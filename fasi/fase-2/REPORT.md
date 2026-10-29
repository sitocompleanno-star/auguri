# Report · Fase 2 · Zampe animate e navigazione

Data: 2026-10-29

## Obiettivo
Rendere cliccabili le 5 zampe della home, con animazione (la zampa scivola fuori dal bordo sinistro mostrando il braccio lungo con il nome della sezione), navigazione verso le pagine interne e transizioni fluide.

## Fatto
- **Zampe come link** verso `/diario/`, `/archivio/`, `/luna-park/`, `/club-amici/`, `/caos/` (sempre con `import.meta.env.BASE_URL`). `Zampa.astro` è stato esteso, non riscritto: ora è un `<a>` con props `href` ed `estesa`.
- **Animazione:** l'SVG completo (braccio + scritta) a riposo è spostato a sinistra con `transform: translateX`, e il foglio (`overflow: hidden`) ritaglia tutto tranne gli ultimi 152 punti, come in Fase 1. Al tap la `transform` torna a 0: il braccio scivola verso destra e compare la scritta (480 ms). Solo `transform`, niente layout.
- **Navigazione:** uno script di ~25 righe in `Base.astro` intercetta il click, aggiunge la classe `is-moving`, aspetta `transitionend` (con rete di sicurezza a 800 ms) e poi naviga. Tasti modificatori e click centrale (nuova scheda) non vengono intercettati.
- **Transizioni tra pagine:** View Transitions "cross-document" in CSS puro (`@view-transition { navigation: auto }`), zero dipendenze e niente `ClientRouter`. Dissolvenza di 280 ms. Dove il browser non le supporta (es. Firefox) si passa da una pagina all'altra senza dissolvenza; l'animazione della zampa funziona comunque.
- **Pagine interne:** le 5 cartelle vuote sono state sostituite da una sola rotta dinamica `src/pages/[sezione]/index.astro` (dati da `src/data/home.ts`, ora con `slug`). Ogni pagina ha foglia di sfondo, titolo SVG (link alla home), la zampa della sezione già estesa **nella stessa posizione della home** (stessa formula con `k`), titolo della sezione, "Pagina in costruzione" e "← torna alla home".
- **Ritorno:** "← torna alla home" e un tap sulla zampa estesa ritraggono il braccio e poi tornano alla home.
- **Accessibilità:** zampe raggiungibili con Tab, nome accessibile dato dal testo nascosto (la scritta), focus visibile (contorno bordeaux + alone chiaro, e la zampa "sbircia" di 14 punti); con `prefers-reduced-motion: reduce` nessuna animazione né dissolvenza, il link naviga subito. Su dispositivi con mouse la zampa sbircia anche al passaggio.
- **bfcache:** tornando indietro col tasto del browser la zampa non resta "aperta" (reset in `pageshow`).

## Verifiche
- `npm run build` con `BASE=/auguri`: 6 pagine, link `/auguri/<sezione>/` corretti; peso `dist/` 288 KB.
- Playwright/Chromium a 390x844 (touch, 2x): nessuno scroll orizzontale (`scrollWidth` 390); Tab porta il focus su "Diario" con contorno visibile; click su Luna Park → braccio esteso con scritta → `/auguri/luna-park/` con la zampa nella stessa posizione; "torna alla home" ritrae il braccio e torna alla home; indietro/avanti del browser senza stati residui.
- Con `reducedMotion: reduce`: navigazione immediata (~100 ms) senza animazione.
- **Non verificato:** telefono reale (Safari iOS, Chrome Android), Firefox, la dissolvenza tra pagine a occhio (gli screenshot non la mostrano), alta densità di tocco.

## Decisioni prese
- View Transitions native del browser invece di `ClientRouter` di Astro: meno JS, nessuna dipendenza, nessun ri-eseguire di script tra pagine.
- Una sola rotta dinamica per le pagine interne (i contenuti diversi arriveranno in Fase 7: potranno tornare cartelle separate se serve).
- La zampa sulla pagina interna sta alla stessa altezza della home, quindi il passaggio è continuo; la dissolvenza cambia solo il resto della pagina.
- Il braccio non cambia le dimensioni del blocco cliccabile a riposo (152 punti, ~63px a 390px), che resta un bersaglio comodo (altezza ~55px).

## Problemi aperti
- Sulle pagine interne la zampa usa la stessa formula della home, con `100%` = altezza della pagina: quando in Fase 7 le pagine saranno più lunghe dello schermo, la zampa scenderà con la pagina. Da decidere (fissarla in alto o lasciarla).
- La scritta nel braccio è piccola (è disegnata nell'SVG, ~11px a 390px): da valutare con te se va ingrandita nell'SVG.
- Le pagine interne usano ancora il font di sistema serif corsivo (provvisorio) e testi generici.
- Mancano ancora gli SVG dei francobolli pieni (placeholder).
- Il sito pubblicato si aggiorna con il push di questa fase.
