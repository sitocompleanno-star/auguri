# Report · Fase 4 · Diario

Data: 2026-11-11

## Obiettivo
Pagina `/diario/` con il flusso "Come ti senti oggi?" a 3 livelli, salvataggio del giorno e sblocco del francobollo, calendario annuale con cambio anno, possibilità di cambiare o cancellare un giorno passato, accessibilità.

## Fatto
- **Pagina dedicata** `src/pages/diario/index.astro`. La rotta `[sezione]` ora salta il Diario (`filter`), quindi non ci sono conflitti né avvisi al build. Due "schermate" una sotto l'altra, come le tavole del mockup:
  1. **Come ti senti oggi?** (tavole 2-6): pomello a fiore, riquadro grigio con titolo, data di oggi ("Mercoledì 11 novembre") e pillole.
  2. **Calendario** (tavola 7): anno in grande con frecce ‹ ›, riquadro con i 12 mesi in griglia 3 x 4.
- **Grafica estratta dal mockup** (il PDF è tutto vettoriale, nessuna immagine incorporata):
  - `public/grafica/diario-fiore.svg`: il pomello, ripreso dai tracciati originali. Pesa 88 KB, 24 KB compresso da GitHub Pages.
  - `public/grafica/diario-carta-destra.webp` e `diario-carta-sinistra.webp`: i due pezzi di carta con scritte, rasterizzati (114 KB in tutto). In SVG pesavano 2,4 MB per pagina, per via di maschere e fusioni.
  - Lo sfondo è un componente (`CartaDiario.astro`) e si ripete in ogni schermata da 1200 punti.
- **Zampa** (problema aperto della Fase 2): il mockup del Diario non la mostra. L'ho messa **in alto a sinistra** (top 24 punti, `k = 0`), estesa con la scritta "Diario", in una zona dove il mockup non ha nulla. Scorre con la pagina, quindi non finisce più a metà di una pagina lunga. `Zampa.astro` non è cambiato: basta passare `top` e `k`.
- **Flusso a 3 livelli** (`src/lib/flusso.ts` + `src/components/FlussoEmozioni.astro`). È fedele al mockup: pillole 300 x 58,3 punti (#ae9c9d, bordo #864f4f) una sotto l'altra. La scelta fatta resta in alto e sotto compaiono le opzioni del livello successivo. Alla fine compaiono le 3 scelte e il francobollo.
  - Indietro di un livello: con "← indietro" oppure toccando una pillola già scelta (che ha l'icona ↺ e torna a quel livello).
  - Al terzo passo si salva con `impostaGiorno(dataDiOggi(), id)`. Il francobollo "cade e si attacca" (620 ms, solo `transform`/`opacity`); con `prefers-reduced-motion` non c'è animazione.
  - Se è il primo sblocco di quell'emozione: **"Nuovo francobollo!"** e "Hai sbloccato «Realizzata»"; altrimenti "Salvato.". Sotto c'è il link "Vedi la collezione →".
  - Se oggi è già compilato, alla riapertura si vedono le scelte e il francobollo, con "Cambia".
  - Lo stesso componente si usa due volte: oggi e nella finestra di un giorno passato.
- **Calendario annuale**: 12 pulsanti-mese con la mini-griglia del mockup (7 colonne, sempre **6 righe**: nel 2026 marzo, agosto e novembre ne hanno bisogno con la settimana da lunedì). Ogni giorno compilato ha la sfumatura dell'emozione e l'**iniziale**. Oggi ha un riquadro bordeaux, il mese corrente ha l'intestazione più scura, le caselle fuori dal mese sono più chiare.
  - Cambio anno: da 5 anni fa (o dal primo anno con dati, se è prima) fino all'anno corrente.
- **Mese in grande** (finestra `<dialog>`, aperta toccando un mese). Ha caselle di ~48 px con numero, **simbolo** della famiglia (nel suo colore) e **iniziale** sulla sfumatura; "oggi" è scritto e cerchiato. Le frecce ‹ › cambiano mese, fino al mese corrente.
  - Toccando un giorno passato (o oggi) si apre il flusso "Come ti sentivi il 3 novembre?", con "Cancella questo giorno" (salva `emozione: null`) e "← torna al mese".
  - I **giorni futuri** non si compilano: restano grigi e `aria-disabled`, e un tocco fa una piccola vibrazione con un messaggio per gli screen reader.
- **Accessibilità**:
  - Ogni giorno ha un nome come "12 novembre: Realizzata", "3 novembre: nessuna emozione, oggi" o "20 novembre: non ancora", con `aria-current="date"` su oggi. Ogni mese si legge come "Novembre 2026: 5 giorni compilati, c'è oggi".
  - Le opzioni del flusso sono in un gruppo con l'istruzione ("Felice: scegli tra 8"). A ogni passo il focus va alla prima opzione; alla fine va al messaggio del francobollo; una regione `aria-live` annuncia il passo.
  - La griglia del mese è `role="grid"` con tabindex mobile: frecce (±1 giorno, ±1 settimana), Home/Fine (inizio/fine settimana), Pagina su/giù (mese; con Maiusc l'anno). Si passa da un mese all'altro senza uscire dalla griglia.
  - Esc o un tocco fuori chiudono la finestra, e il focus torna al mese.
  - Il focus è visibile ovunque (bordeaux).
- **Aggiornamento in tempo reale**: con `osserva()` tutto si ridisegna quando cambia lo stato (anche da un'altra scheda). A mezzanotte (Europe/Rome), con la pagina aperta, "oggi" passa al giorno nuovo (controllo ogni minuto e al ritorno sulla scheda).
- **`localStorage` bloccato**: tutto funziona in memoria e compare l'avviso, come nella pagina Francobolli.
- **Pannello di prova** su `/francobolli/`: l'ho lasciato **solo in dev**, come prima. Il Diario lo rende inutile per l'uso normale, ma "5 a caso" e "Azzera tutto" restano comodi per provare. Non è nella build (verificato).
- `src/lib/calendario.ts`: funzioni pure sulle date (`caselleMese`, `aggiungiGiorni`, `aggiungiMesi`, `giornoSettimana`, `dataLeggibile`…), tutte in UTC, così il fuso del dispositivo non sposta i giorni. "Oggi" arriva sempre da `dataDiOggi()`.
- Font del Diario: `--font-diario` (serif "da libro" come nel mockup: Minion Pro se c'è, altrimenti Palatino/Iowan/Georgia).

## Verifiche
- `npm run build` con `BASE=/auguri`: 7 pagine, nessun avviso; `/auguri/diario/` generata dalla nuova pagina.
- Peso `dist/`: **680 KB** di dati (920 KB su disco); prima era 401 KB. Il Diario aggiunge ~280 KB: carta 114 KB, fiore 88 KB, JS e CSS ~25 KB.
- Playwright/Chromium a 390 x 844 (2x), fuso Europe/Rome:
  - nessuno scroll orizzontale (`scrollWidth` 390);
  - Felice (8 intermedie) → Orgogliosa → Realizzata: "Nuovo francobollo!", focus sul messaggio, persiste al ricaricamento (senza "Nuovo");
  - Tab: zampa → Felice → Triste…; Invio su una famiglia porta il focus alla prima intermedia; "indietro" torna alle 6 famiglie;
  - finestra di novembre: focus su "11 novembre: Realizzata, oggi"; frecce, Pagina su (ottobre), Pagina giù limitata al mese corrente;
  - 9 novembre → Triste › Sola › Isolata: salvato, nuovo francobollo, la casella si colora con goccia + I;
  - un giorno futuro non si apre; "Cancella questo giorno" salva `emozione: null` e annuncia "3 novembre: cancellato.";
  - Esc riporta il focus al pulsante del mese;
  - anno precedente/successivo (successivo disabilitato sull'anno corrente);
  - home → zampa Diario → `/diario/`; `/archivio/` e `/francobolli/` invariate;
  - `reducedMotion: reduce`: nessuna animazione del francobollo;
  - `localStorage` bloccato: avviso visibile, giorno colorato in memoria, nessun errore;
  - nessun errore JS. In un contesto il browser ha chiesto una risorsa inesistente, probabilmente `/favicon.ico`: il sito non ha favicon.
- **Non verificato:** telefono reale, Safari iOS, Firefox, lettura reale con VoiceOver/TalkBack.

## Decisioni prese
- **8 emozioni intermedie** (Felice, Arrabbiata): come nel mockup, una colonna di pillole attaccate. A 390 px sono alte 36 px (minimo), quindi 8 occupano ~290 px: si scorre poco e non serve una seconda colonna. Il riquadro cresce invece di tagliare.
- **Caselle del calendario a 390 px**: nel mockup sono ~15 x 14,5 px, troppo piccole per il dito. Quindi l'anno resta fedele al mockup e mostra colore + iniziale; per toccare i giorni si apre il mese in grande (caselle ~48 px con numero, simbolo e iniziale).
- **Giorni futuri: non si compilano** (era il default proposto). Si possono raggiungere con la tastiera, ma sono `aria-disabled`.
- Settimana da **lunedì**; griglia sempre da 6 righe, così i 12 mesi restano allineati.
- Pillole e testi con un minimo in px (pillole 36 px, testo 15 px). Rispetto al mockup crescono un po' sul telefono, ma restano comode da toccare.
- Cambiare il giorno che aveva sbloccato un francobollo (l'unico con quell'emozione) toglie quel francobollo dalla collezione. È coerente con la Fase 3: i francobolli si calcolano dai giorni.

## Problemi aperti
- La zampa passa da y≈328 (home) a y≈24 (Diario): con la dissolvenza di pagina non si nota uno "scatto", ma non è un movimento continuo come nelle altre sezioni.
- Lo sfondo carta e il fiore sono estratti dal mockup: se l'artista fornisce file propri, basta sostituire i 3 file in `public/grafica/` con lo stesso nome (o cambiare il nome in `CartaDiario.astro` / nella pagina se il formato è diverso).
- Il font del mockup (tipo Minion) non è incluso: si usano font di sistema simili. Si può aggiungere un webfont in Fase 11.
- La ruota delle emozioni è ancora provvisoria (Fase 3).
- Manca una favicon.
