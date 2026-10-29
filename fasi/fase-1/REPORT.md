# Report · Fase 1 · Home statica (mobile)

Data: 2026-10-28 (aggiornato 2026-10-29)

## Obiettivo
Realizzare la home fedele al mockup (`ALI.pdf`, pagina 1) a larghezza telefono (~390px), senza animazioni, usando gli SVG definitivi forniti (cartella "pagina iniziale").

## Fatto
- Home composta come nel mockup: titolo "L'UNIVERSO DELLE COSE / minuscole" in alto a destra, foglia di sfondo, 5 zampe a sinistra che escono dal bordo (senza scritte), cornice con area foto e area frase (segnaposto), 4 pulsanti dei giochi, striscia "COLLEZIONE DI FRANCOBOLLI" con 9 slot (2 pieni, 7 vuoti).
- **SVG definitivi integrati** in `public/grafica/` (nomi puliti, senza spazi): `titolo`, `sfondo-foglia`, `cornice`, `collezione-francobolli`, `francobollo-vuoto`, 4 pulsanti (`gioco-cuore`, `gioco-fiori`, `gioco-arcobaleno`, `gioco-sole`) e 5 zampe (`zampa-diario`, `zampa-archivio`, `zampa-luna-park`, `zampa-club-amici`, `zampa-caos`).
- Corrispondenza con i file originali: `pulsante 4`=cuore, `3`=fiori, `2`=arcobaleno, `1`=sole (come nell'ordine del mockup); `sfondo 1`=foglia, `sfondo 2`=cornice; `ombra francobollo`=slot vuoto.
- Il titolo e "COLLEZIONE DI FRANCOBOLLI" sono ora immagini SVG: il problema dei font della Fase 0 non riguarda più la home. Restano in HTML solo i segnaposto "FOTO/FRASE RANDOM DEL GIORNO" (Arial grassetto).
- **Zampe:** gli SVG sono il braccio lungo con la scritta (serviranno in Fase 2). Nella home se ne mostra solo la parte destra (152 punti di larghezza, quella che esce dal bordo), senza scritta, tagliando via CSS: il file resta intero. L'ombra è già nell'SVG.
- **Foglia:** lo SVG originale è più grande della pagina; il ritaglio visibile (x 58,39–401,54; y 11,45–1211,45) coincide col bordo verticale netto del mockup. Ho portato il `viewBox` di `sfondo-foglia.svg` a quel ritaglio (`58.39 11.45 343.15 1200`).
- Componenti in `src/components/`: `Zampa`, `Cornice` (slot `foto` e `frase`, pronti per la Fase 3), `PulsanteGioco`, `StripFrancobolli` (props `totale` e `ottenuti`, pronta per la Fase 4). Dati in `src/data/home.ts`.
- **Scala esatta:** la pagina del PDF è 940 x 1200 punti e gli SVG sono nella stessa scala. `--u = larghezza foglio / 940` (prima usavo una stima di 960 che non era corretta). Tutte le posizioni sono state misurate sul mockup renderizzato a 72 dpi e confrontate automaticamente con gli SVG (zampe e foglia combaciano al punto).
- Palette aggiornata con i colori veri degli SVG (es. bordeaux `#6f211c`, grigi della cornice come `#afa3a2` al 20%).
- Placeholder rimasti: solo `public/placeholders/francobollo-1.svg` e `francobollo-2.svg` (i francobolli pieni non sono stati forniti), con la stessa forma dello slot vuoto. Gli altri placeholder sono stati eliminati.

## Verifiche
- `npm run build` con `BASE=/auguri`: 6 pagine, percorsi corretti (`/auguri/grafica/...`).
- Controllo visivo con Chromium (Playwright) a 390x498 (proporzione del mockup) e 390x844 (telefono alto): nessuno scroll orizzontale; a 390x498 la home è sovrapponibile al mockup.
- Peso di `dist/`: 268 KB.
- Non verificato: rendering su telefono reale.

## Decisioni prese
- Misure in punti mockup (`--u`), non in pixel né breakpoint.
- Telefono più alto del mockup: le dimensioni restano quelle del mockup e a crescere sono solo gli spazi (ogni blocco scende di una quota `k` dello spazio in più, definita in `home.ts`/`index.astro`); la foglia si ingrandisce restando ritagliata alla stessa larghezza.
- Le zampe sono decorative in questa fase (nessun link, `alt=""`, nome sezione solo per screen reader); diventano link in Fase 2.

## Problemi aperti
- ~~Altezza dello schermo~~ **Deciso (2026-10-29):** sul telefono, più alto del mockup, le dimensioni restano quelle del mockup e a crescere sono solo gli spazi tra gli elementi (soluzione già in uso e approvata). Da rivedere solo in Fase 8 (desktop e rifinitura).
- Mancano gli SVG dei francobolli pieni (ora placeholder) e quelli di eventuali altri francobolli.
- Il testo "FOTO/FRASE RANDOM DEL GIORNO" è un segnaposto temporaneo: sparisce in Fase 3.
- Repository e deploy: il sito pubblicato si aggiorna con il push di questa fase.
