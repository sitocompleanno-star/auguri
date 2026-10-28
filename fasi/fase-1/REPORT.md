# Report · Fase 1 · Home statica (mobile)

Data: 2026-10-26

## Obiettivo
Realizzare la home fedele al mockup (`ALI.pdf`, pagina 1) a larghezza telefono (~390px), senza animazioni.

## Fatto
- Home composta come nel mockup: titolo "L'UNIVERSO DELLE COSE / minuscole" in alto a destra, foglia grigia di sfondo, 5 zampe a sinistra che escono dal bordo (senza scritte), cornice con area foto e area frase (segnaposto), 4 pulsanti dei giochi, striscia "COLLEZIONE DI FRANCOBOLLI" con 9 slot (2 pieni, 7 vuoti).
- Componenti in `src/components/`: `Zampa`, `Cornice` (slot `foto` e `frase` pronti per la Fase 3), `PulsanteGioco`, `StripFrancobolli` (props `totale` e `ottenuti`, pronta per la Fase 4).
- Dati della home in `src/data/home.ts` (elenco zampe, giochi, francobolli ottenuti).
- Sistema di misura "unità mockup": `--u = larghezza foglio / 960` (larghezza della pagina del PDF), definita in `global.css` su `.foglio` (che ora è un container). Tutte le misure della home sono `calc(N * var(--u))` con N letto dal mockup, quindi la home scala con il foglio e mantiene le proporzioni.
- Se lo schermo è più alto del mockup, a crescere sono solo gli spazi tra gli elementi (le dimensioni restano fisse).
- Le 5 zampe placeholder sono state ridisegnate (stessi nomi file) con testa più grande e fascia di colore sul bordo, per assomigliare di più al mockup; il viewBox è passato da 160x90 a 160x110.
- Zampe con ombra grigia (CSS `drop-shadow`), come nel mockup.
- Tutti i percorsi degli asset passano da `import.meta.env.BASE_URL`.

## Verifiche
- `npm run build` con `BASE=/auguri`: 6 pagine, percorsi corretti (`/auguri/placeholders/...`).
- Controllo visivo con Chromium (Playwright) a 390x500 (proporzione esatta del mockup) e 390x844 (telefono alto): nessuno scroll orizzontale, elementi allineati al mockup.
- Peso di `dist/`: 116 KB.
- Non verificato: rendering su telefono reale e con i font definitivi.

## Decisioni prese
- Misure in unità mockup invece di pixel fissi o breakpoint.
- Le zampe sono decorative in questa fase (nessun link, `alt=""`); diventeranno link in Fase 2.
- Titolo e testi usano i font di sistema (nessun font caricato da rete).

## Problemi aperti
- **Proporzione del mockup vs telefono.** Il mockup è 960x1232 (rapporto 1,28), un telefono ha circa 2,1: a 390px il mockup è alto solo ~500px. Ora gli spazi si allungano, ma sullo schermo alto restano vuoti vistosi. Opzioni per la Fase 2/8: far crescere solo l'altezza dell'area foto (comoda per foto verticali), oppure ridisegnare la composizione per il formato telefono.
- Font: nel mockup "minuscole" ha metriche leggermente diverse dal serif di sistema (il pallino del titolo piccolo sfiora il puntino della "i"); si risolve con il font definitivo.
- La foglia placeholder è una forma semplice: la silhouette vera va fornita dalla grafica (ora usa `object-fit: cover`, quindi si ritaglia invece di rimpicciolirsi).
- Le zampe lunghe con scritta (Diario, Archivio, ...) servono in Fase 2: servono gli SVG definitivi o una versione lunga dei placeholder.
- Repository e deploy: il sito pubblicato (`/auguri/`) mostra ancora la Fase 0 finché non si fa il push di questa fase.
