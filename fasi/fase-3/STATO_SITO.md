# Stato del sito · fine Fase 3

Aggiornato: 2026-11-11

## Stack
- Astro 7.4.1, output statico, nessuna dipendenza nuova (anche in Fase 3)
- Hosting: GitHub Pages via GitHub Actions (https://sitocompleanno-star.github.io/auguri/, quindi `BASE=/auguri`)
- Target: mobile-first (foglio centrato max 430px; desktop in Fase 11)
- Peso `dist/`: 401 KB di dati (644 KB su disco)

## Struttura
```
minuscole/
├─ ROADMAP.md, README.md
├─ package.json            (script: dev, build, preview, francobolli)
├─ scripts/genera-francobolli.mjs   genera i francobolli segnaposto dai dati delle emozioni
├─ fasi/fase-0 … fase-3/
├─ public/
│  ├─ grafica/             SVG DEFINITIVI (home, zampe, slot vuoto…); qui andranno anche
│  │                        francobolli/<id>.svg e portafoglio-busta.svg / portafoglio-travel.svg
│  └─ placeholders/
│     ├─ francobolli/<id>.svg       72 segnaposto (generati, viewBox 45.44 x 58.1)
│     ├─ portafoglio-busta.svg      busta con cuore (viewBox 351 x 265)
│     └─ portafoglio-travel.svg     cartellina TRAVEL (viewBox 351 x 265)
└─ src/
   ├─ layouts/Base.astro
   ├─ styles/global.css
   ├─ components/
   │  ├─ Zampa.astro, Cornice.astro, PulsanteGioco.astro
   │  └─ StripFrancobolli.astro   (props: totale, ottenuti | preferiti, href, titolo)
   ├─ data/
   │  ├─ home.ts               (zampe, giochi, francobolli.totale = 9)
   │  ├─ emozioni.ts           ruota a 3 livelli (provvisoria), palette, verificaRuota()
   │  └─ simboli.ts            6 simboli SVG (centrati in 0,0, 18x18, currentColor)
   ├─ lib/
   │  ├─ stato.ts              stato in localStorage (funzioni pure + leggi/scrivi/osserva)
   │  ├─ francobolli.ts        percorsoFrancobollo() (build e browser)
   │  └─ francobolli-definitivi.ts  SOLO build (fs): definitivi presenti, controllaRuota(), graficaOSegnaposto()
   └─ pages/
      ├─ index.astro              home
      ├─ [sezione]/index.astro    diario, archivio, luna-park, club-amici, caos (in costruzione)
      └─ francobolli/index.astro  portafoglio + fascia FRANCOBOLLI + dettaglio
```

## Emozioni (`src/data/emozioni.ts`)
- `famiglie` (6) → `emozioni` intermedie (36) → `emozioni` di ultimo livello (72). Esportati anche `emozioni` (lista piatta in ordine di ruota), `emozione(id)`, `famiglia(id)`, `intermedia(id)`, `contrasto()`, `verificaRuota()`, `INCHIOSTRO`.
- Si modifica solo l'array `RUOTA` (nomi, colore, sfumature, simbolo). Dopo una modifica: `npm run francobolli`, poi `npm run build`.
- Gli `id` (slug del nome, es. `realizzata`) sono la chiave salvata nello stato: non vanno cambiati dopo l'uso.

| Famiglia | Intermedie → ultimo livello |
|---|---|
| **Felice** (sole, `#5f4202`) | Orgogliosa → Realizzata, Fiduciosa · Potente → Coraggiosa, Energica · Tranquilla → Amorevole, Grata · Ottimista → Speranzosa, Ispirata · Gioiosa → Libera, Divertita · Intima → Tenera, Vicina · Interessata → Partecipe, Motivata · Accettata → Onorata, Benvenuta |
| **Triste** (goccia, `#234877`) | Sola → Isolata, Abbandonata · Vulnerabile → Fragile, Esposta · Disperata → Sconfortata, Persa · In colpa → Vergognosa, Rammaricata · Abbattuta → Grigia, Mogia · Ferita → Delusa, Umiliata |
| **Sorpresa** (stella, `#553b68`) | Colpita → Scioccata, Turbata · Confusa → Disorientata, Perplessa · Stupita → Meravigliata, Incantata · Emozionata → Entusiasta, Carica |
| **Arrabbiata** (fulmine, `#7c271c`) | Delusa → Tradita, Risentita · Mortificata → Sminuita, Calpestata · Amareggiata → Indignata, Violata · Furiosa → Furente, Gelosa · Aggressiva → Provocata, Ostile · Frustrata → Esasperata, Nervosa · Distante → Assente, Muta · Critica → Diffidente, Beffarda |
| **Disgustata** (spirale, `#235430`) | Contrariata → Giudicante, Imbarazzata · Sconcertata → Allibita, Ripugnata · Nauseata → Schifata, Odiosa · Respinta → Esitante, Pietrificata |
| **Impaurita** (nuvola, `#015259`) | Spaventata → Atterrita, Terrorizzata · Ansiosa → Sopraffatta, Preoccupata · Insicura → Inadeguata, Dubbiosa · Debole → Fiacca, Bloccata · Rifiutata → Esclusa, Vessata · Minacciata → Guardinga, Circospetta |

## Francobolli
- Segnaposto: tono scuro della famiglia come cornice dentellata, sfumatura dell'emozione intermedia come fondo, simbolo della famiglia in alto, iniziale (Georgia grassetto, inchiostro) in basso.
- Percorso: `percorsoFrancobollo(e, definitivi)` → `grafica/francobolli/<file>` se il definitivo esiste al build, altrimenti `placeholders/francobolli/<file>`. La lista dei definitivi arriva al browser in `data-definitivi`.
- Slot vuoto: `grafica/francobollo-vuoto.svg` (`FRANCOBOLLO_VUOTO`).

## Stato (`src/lib/stato.ts`)
- Chiave `minuscole:stato`, `VERSIONE = 1`:
  `{ versione, giorni: { "AAAA-MM-GG": { emozione: id | null, modificato: ISO } }, preferiti: id[] (max 9), preferitiModificato: ISO, cartoline: {} }`
- Pure: `statoVuoto`, `migra(grezzo)`, `impostaGiorno(s, data, id|null)`, `sbloccati(s)` (Map id → primo giorno), `conteggi(s)`, `preferitiValidi(s)`, `alternaPreferito(s, id)`, `unisci(a, b)`, `dataDiOggi()` (Europe/Rome).
- Browser: `leggi()`, `scrivi(s)`, `aggiorna(f)`, `persistente()`, `osserva(f)`. L'evento `minuscole:stato` parte a ogni scrittura; `osserva` ascolta anche `storage` (altre schede) e `pageshow` (bfcache).
- Se `localStorage` non è disponibile: copia in memoria, nessun errore, `persistente()` = false.

## Pagina `/francobolli/`
- Misure in punti mockup (tavola 4): busta x 106-457 e cartellina x 483-834, alte 265; fascia con titolo "FRANCOBOLLI" e griglia di 16 colonne da 45,44 (passo 55,4 x 72), margine 31,8.
- Colonna flessibile: lo spazio in più va intorno al portafoglio, la fascia resta in basso.
- Slot pieni = pulsanti (nome accessibile = nome dell'emozione, ", nella home" se preferito); slot vuoti `disabled` e `aria-hidden`, con un riassunto per screen reader ("6 francobolli sbloccati su 72…").
- Dettaglio in `<dialog>` modale: Esc o tocco fuori per chiudere, focus restituito al francobollo.
- Pannello di prova solo con `npm run dev` (`import.meta.env.DEV`).

## Cosa funziona
- Home come in Fase 2, con la striscia che mostra i preferiti e porta a `/francobolli/`.
- Pagina Francobolli: sblocchi (dallo stato), dettaglio, preferiti (max 9), persistenza, avviso se non si può salvare.
- Tastiera, focus visibile, nomi accessibili, reduced-motion.
- Build statica (7 pagine) senza avvisi.

## Cosa NON c'è ancora
- Diario (Fase 4): oggi i giorni si creano solo con il pannello di prova in dev.
- Cartoline e PDF (Fase 5): le icone del portafoglio rispondono "in arrivo".
- Sincronizzazione (Fase 6), foto e frase del giorno (Fase 7), giochi, Luna Park, altre pagine, desktop.
- SVG definitivi dei francobolli e del portafoglio.

## Convenzioni
- Link e asset sempre con `import.meta.env.BASE_URL`.
- Misure in punti mockup (`--u`); testi piccoli con un minimo in px (`max(13px, …)`).
- Gli import fra file `.ts` usano l'estensione `.ts`: così lo script dei segnaposto gira con Node senza dipendenze.
- Il codice che usa `node:fs` sta solo in `src/lib/francobolli-definitivi.ts` e nel frontmatter: mai negli script client.
- Ogni animazione rispetta `prefers-reduced-motion`.
