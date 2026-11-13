# Report · Fase 5 · Cartoline e PDF

Data: 2026-11-13

## Obiettivo
Nella pagina `/francobolli/`: due cartoline (fiore e mappa) che si aprono dal portafoglio con l'animazione del mockup. Si attaccano i francobolli sbloccati trascinandoli, con posizione e rotazione salvate nello stato. Poi si scarica un PDF fronte-retro da 10 x 15 cm generato nel browser.

## Decisioni prese con William (prima di iniziare)
1. **Due tocchi** come nella nota della tavola 12: il primo apre il portafoglio (tavola 5, le cartoline spuntano), il secondo fa uscire la cartolina.
2. **Proporzioni 10 x 15** (3:2) a schermo e in stampa. La cartolina del mockup è 784 x 606 punti (1,29:1): la grafica è tagliata in alto e in basso.
3. **Grafica estratta dalle tavole** (nessun SVG definitivo).
4. **Righe sul fronte della mappa decorative**: si scrive a mano dopo la stampa.
5. **Retro senza scritte.**
6. **Un solo francobollo per cartolina.** Se se ne trascina un altro, prende il posto del primo.
7. **Si attacca trascinando** (dito sul telefono, mouse sul computer). Da tastiera c'è l'alternativa.
8. **Francobollo non più sbloccato: si toglie** dalla cartolina.
9. **PDF senza librerie** (scelta lasciata a me, vedi sotto).

## Fatto
- **Grafica** (`public/grafica/cartoline/`, 116 KB in tutto), estratta con `scripts/estrai-cartoline.py` (Python + PyMuPDF + Pillow).
  - Il PDF del mockup è vettoriale. Ogni tavola è una sequenza di blocchi `q … Q`: lo script disegna solo i blocchi di un oggetto, su fondo trasparente.
  - `fronte-fiore.webp` (30 KB) e `fronte-mappa.webp` (51 KB): dalle tavole 6-7, ritagliate in 3:2 a **1772 x 1181 px** (150 x 100 mm a 300 dpi). Le stesse immagini servono allo schermo e al PDF.
  - Portafoglio a livelli, a 2x: `busta-chiusa.webp` (tavola 4, con il cuore), `busta-aperta.webp` (fondo + linguetta aperta, tavola 5), `busta-tasca.webp` (tasca davanti) e `cartellina-tasca.webp` (tasca verde con TRAVEL).
  - Lo script stampa il riquadro di ogni livello in punti mockup (`scripts/riquadri-cartoline.json`): sono i numeri nel CSS della pagina.
  - Tolti i segnaposto `public/placeholders/portafoglio-*.svg`, non più usati.
- **Dati** `src/data/cartoline.ts`: elenco delle cartoline (id, nome, fronte, colori del retro), misure (150 x 100 mm, 1772 x 1181 px) e misura del francobollo sulla cartolina. Il francobollo è largo il 13,5% della cartolina (~20 mm, come uno vero). Contiene anche `retroSvg()`, lo stesso disegno per schermo e PDF. Per aggiungere una cartolina servono una voce qui, un fronte e un'icona.
- **Stato** (`src/lib/stato.ts`, `versione` resta **1**):
  - `cartoline: { [id]: { francobolli: [{ id, x, y, r }], modificato } }`, con `x`/`y` del centro in frazioni della cartolina (0-1) e `r` in gradi (-180, 180].
  - `migra` accetta il vecchio `cartoline: {}` e scarta le voci rovinate. Tiene un francobollo una volta sola e al massimo `MAX_FRANCOBOLLI_CARTOLINA` (= 1).
  - Nuove funzioni pure: `cartolina`, `attaccaFrancobollo` (attacca, sposta o ruota; se la cartolina è piena il nuovo sostituisce il più vecchio; ignora i francobolli non sbloccati), `togliFrancobollo`, `pulisciCartoline`, `normalizzaRotazione`.
  - `impostaGiorno` chiama `pulisciCartoline`: se un giorno cambia e un francobollo non è più sbloccato, sparisce anche dalle cartoline, con la data di modifica della cartolina aggiornata. Funziona anche se il cambio avviene nel Diario.
  - `unisci`: per ogni cartolina vince quella modificata più di recente (a parità, `a`). Poi si puliscono i francobolli non più sbloccati con i giorni uniti.
- **Pagina** `src/pages/francobolli/index.astro` (estesa, non riscritta) + logica in `src/lib/cartolina-ui.ts`:
  - **Scena** in punti mockup (x 0-940, y 160-700 della tavola) con i livelli: fondo della busta aperta, cartoline, tasche, busta chiusa, pulsanti trasparenti sopra le icone.
  - Ogni cartolina è disegnata sempre in grande (782 x 521,3 punti). Nel portafoglio la si rimpicciolisce con `transform` (translate in % + scale): nessuna misura in px.
  - **Primo tocco** (chiuso → aperto): la busta chiusa sfuma in quella aperta e le due cartoline salgono e spuntano dalle tasche (520 ms).
  - **Secondo tocco** sulla busta o sulla cartellina: la cartolina sale fuori dalla tasca (340 ms), passa davanti e si allarga fino alla posizione delle tavole 6-7 (520 ms), mentre il resto del portafoglio sfuma.
  - Le animazioni usano le Web Animations, così si aspetta la fine di ogni passo. Con `prefers-reduced-motion` i passi sono immediati.
  - **Chiusura**: "← Portafoglio", Esc o il tasto "indietro" del telefono (la cartolina aperta mette una voce nella cronologia). Animazione al contrario, poi si torna al portafoglio aperto con il focus sull'icona.
  - **Comandi** sotto la cartolina (in px, almeno 44 px): ↺ ↻ (±15°), Togli, ← Portafoglio, Gira, Scarica il PDF, e una nota di stampa. Lo spazio dei comandi è riservato anche a portafoglio chiuso, così la colonna centrata non scatta.
  - **Vassoio**: con la cartolina aperta prende il posto della griglia nella fascia FRANCOBOLLI. È una riga a scorrimento orizzontale con i francobolli sbloccati a 48 px; quello già attaccato è sbiadito con ✓. Se non ci sono francobolli, c'è un link al Diario.
  - **Trascinamento** (pointer events, dito e mouse):
    - dal vassoio parte un "fantasma" grande come il francobollo sulla cartolina. Col dito sta un po' sopra il polpastrello, per vederlo;
    - sul vassoio `touch-action: pan-x`: in orizzontale si scorre il vassoio, in verticale si trascina;
    - lasciato sulla cartolina, si attacca lì. Il centro resta dentro la cartolina, anche in stampa;
    - un francobollo attaccato si sposta trascinandolo; trascinato fuori dalla cartolina si toglie;
    - durante il trascinamento la cartolina ha un bordo tratteggiato e, se si è fuori, il francobollo diventa semitrasparente;
    - un tocco senza trascinamento sul vassoio mostra solo l'istruzione;
    - con il tocco lungo non si apre il menu delle immagini (iOS).
  - **Fronte/retro**: "Gira" ruota la cartolina in 3D (600 ms, niente con reduced-motion). Sul retro i comandi del francobollo sono disattivati. Il retro è lo stesso SVG del PDF.
  - **Tastiera**: Invio o Spazio su un francobollo del vassoio lo attacca in alto a destra e porta lì il focus. Sul francobollo attaccato: frecce per spostarlo dell'1% (con Maiusc del 5%), Q/E per ruotarlo di ±15°, Canc o Backspace per toglierlo (il focus torna al vassoio).
  - **Screen reader**:
    - icone: "Apri il portafoglio: cartolina con il fiore", poi "Apri la cartolina con il fiore";
    - cartolina: `role="group"` con `aria-roledescription="cartolina"`, e i francobolli in una lista;
    - francobolli: "Isolata, sulla cartolina, ruotato di 15 gradi a sinistra", istruzioni in `aria-describedby`;
    - vassoio: "Realizzata: attacca alla cartolina" oppure "Realizzata, sulla cartolina";
    - annunci in `role="status"` ("Francobollo «Grata» attaccato alla cartolina al posto di Realizzata.", "PDF pronto…").
  - **Pulizia**: se lo stato letto contiene francobolli non più sbloccati (per esempio da un'altra scheda), la pagina li toglie e salva.
- **PDF** (`src/lib/pdf-cartolina.ts`, chunk separato da **3 KB**, importato solo al clic su "Scarica il PDF"):
  - fronte (grafica + francobolli con la stessa posizione, rotazione e ombra leggera) e retro su due canvas da **1772 x 1181**;
  - i due canvas diventano JPEG al 92%;
  - il PDF 1.4 è scritto a mano: catalogo, 2 pagine da **425,197 x 283,465 punti** (= 150 x 100 mm), un'immagine `DCTDecode` per pagina, tabella xref;
  - agli SVG dei francobolli si aggiungono larghezza e altezza prima di disegnarli: senza, Firefox non li disegna su canvas;
  - nome del file: `cartolina-fiore-2026-11-13.pdf` (data Europe/Rome);
  - scaricato con un link `download` su un blob.

## Verifiche
- `npm run build` con `BASE=/auguri`: 7 pagine, nessun avviso.
- Test delle funzioni pure (Node): attacco, limiti, rotazione, sostituzione, spostamento, pulizia dopo il cambio di un giorno, `migra` di stati vecchi e rovinati, `unisci` in entrambi i sensi.
- Chrome (Playwright) a 390 x 844 (2x), fuso Europe/Rome:
  - nessuno scroll orizzontale su home, Diario, Francobolli e Archivio; nessun errore JS (l'unico 404 è la favicon, che manca dalla Fase 4);
  - primo tocco: stato `aperto` e nomi delle icone aggiornati; secondo tocco: cartolina in grande e focus sul titolo nascosto;
  - frame dell'animazione controllati: corrispondono alle tavole 4 → 5 → 6;
  - mouse: trascinamento dal vassoio (salvato x 0,80 / y 0,25), spostamento, rotazione ×2, secondo francobollo che sostituisce il primo (con annuncio);
  - **dito** (eventi touch via CDP): trascinamento dal vassoio verso l'alto → attaccato;
  - tastiera: Invio sul vassoio → attaccato con il focus sul francobollo; Maiusc+← / ↓ / Q aggiornano lo stato e il nome accessibile;
  - "Gira" mostra il retro; il PDF si scarica e il chunk `pdf-cartolina` viene richiesto **solo al clic**;
  - "indietro" del browser chiude la cartolina (resta su `/francobolli/`, portafoglio aperto, focus sull'icona); Esc chiude la mappa;
  - un giorno cambiato nel Diario → al ricaricamento la cartolina è vuota;
  - `reducedMotion: reduce`: la cartolina si apre subito.
- **PDF**:
  - `pdfinfo`: 2 pagine da 425,197 x 283,465 punti (150,0 x 100,0 mm), titolo "Cartolina con il fiore - minuscole";
  - `pdfimages`: due JPEG da 1772 x 1181 a **300 ppi**;
  - `qpdf --check`: nessun errore;
  - pagine visualizzate: il francobollo è dove era sulla cartolina. Peso: 113 KB.
- Peso `dist/`: **803 KB** di dati (prima 680; +116 KB di grafica, il resto JS e CSS). La pagina Francobolli carica 116 KB di immagini; il PDF solo al clic.
- **Non verificato:** stampa reale fronte-retro, telefono reale (iOS/Android), Firefox e Safari, VoiceOver e TalkBack.

## Decisioni prese da me
- **PDF senza `pdf-lib`**: servono solo due pagine con un'immagine ciascuna, quindi il generatore da 3 KB basta. `pdf-lib` sarebbe stato ~500 KB per la stessa cosa.
- **Stampa a pieno formato**, con angoli dritti: gli angoli arrotondati restano solo a schermo.
- **Francobollo largo il 13,5%** della cartolina (~20 x 26 mm), centro tenuto dentro la cartolina. Rotazione iniziale 0°, passi da 15°.
- **Vassoio al posto della griglia** con la cartolina aperta: a 390 px le caselle della griglia sono larghe ~19 px, troppo piccole per il dito.
- **Retro**: riga divisoria al centro, 3 righe per l'indirizzo, riquadro tratteggiato per il francobollo postale; colori abbinati al fronte (rosa per il fiore, carta per la mappa).
- La cartellina della mappa non cambia tra chiuso e aperto (come nelle tavole 4-5): la mappa sale solo un po' di più.
- **Indietro del telefono** = chiude la cartolina (più naturale di uscire dalla pagina).

## Problemi aperti
- **Stampa fronte-retro**: per le pagine orizzontali di solito si sceglie "lato corto", ma dipende dalla stampante. Va fatta una prova su carta normale prima della carta fotografica, ed è da stampare al 100% ("dimensione reale").
- Con un solo francobollo per cartolina i comandi ↺ ↻ Togli agiscono sempre su quello. Il codice è già pronto per di più francobolli: basta cambiare `MAX_FRANCOBOLLI_CARTOLINA` in `stato.ts`.
- Non c'è rotazione con due dita: si ruota con i pulsanti o con Q/E.
- La grafica è estratta dal mockup: se l'artista fornisce file propri, si sostituiscono quelli in `public/grafica/cartoline/`. I fronti devono essere 3:2; i livelli del portafoglio devono avere lo stesso riquadro, altrimenti vanno aggiornati i numeri nel CSS.
- Manca ancora la favicon.
