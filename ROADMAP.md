# minuscole – L'universo delle cose · Roadmap

Sito web mobile-first basato sul mockup `ALI.pdf`. Stack: **Astro** + piccole isole JS/TS. Hosting: **GitHub Pages**.

## Regole di lavoro

- Mobile-first: si progetta per ~390px di larghezza; il desktop viene dopo (Fase 8).
- Gli SVG finali non sono ancora pronti: si usano **placeholder** con gli stessi nomi file e dimensioni degli SVG definitivi, così basta sostituirli.
- A fine di ogni fase si crea una cartella `fasi/fase-N/` con:
  - `REPORT.md`: cosa è stato fatto, decisioni, problemi aperti
  - `STATO_SITO.md`: stato attuale del sito (struttura, componenti, dati, cosa funziona / non funziona)
  - `PROMPT_FASE_N+1.md`: prompt da incollare in una nuova chat, insieme al link del sito, per ripartire

## Fasi

### Fase 0 · Fondamenta
Setup Astro, configurazione GitHub Pages (`base`, workflow di deploy), palette e font, struttura cartelle, placeholder SVG, pagine vuote.
**Fatto quando:** `npm run build` passa e il deploy automatico è pronto; esiste una home minima online.

### Fase 1 · Home statica (mobile) ✅
Layout fedele al mockup: titolo, sfondo con foglia, 5 zampe a sinistra, cornice con foto e frase (segnaposto), 4 pulsanti giochi, striscia francobolli.
**Fatto quando:** la home a 390px è riconoscibile rispetto al mockup.

### Fase 2 · Zampe animate e navigazione
Zampa che scivola fuori al tap, mostrando il nome della sezione; navigazione verso le pagine (Diario, Archivio, Luna Park, Club degli Amici, Caos); transizioni tra pagine; pagine interne vuote con titolo.
**Fatto quando:** si naviga tra tutte le pagine con animazione fluida su telefono.

### Fase 3 · Foto e frase del giorno
Dati in `src/data/foto.json` e `frasi.json`; scelta deterministica dalla data (stessa foto/frase per tutto il giorno). Foto in `public/media/foto/`, già compresse (vedi "Gestione dei media").
**Fatto quando:** foto e frase cambiano ogni giorno senza backend e il peso di `dist/` è sotto controllo.

### Fase 4 · Francobolli collezionabili
Modello dati dei francobolli (id, titolo, immagine, condizione di sblocco), stato in `localStorage`, visualizzazione degli slot vuoti/pieni.
**Fatto quando:** uno sblocco di prova compare nella striscia e persiste al ricaricamento.

### Fase 5 · Primo gioco (memory)
Gioco memory a carte, collegato al primo pulsante; vittoria che sblocca un francobollo.
**Fatto quando:** si gioca, si vince, si ottiene il francobollo.

### Fase 6 · Altri giochi
Quiz, puzzle, ecc., uno per volta, ciascuno con la propria mini-fase.

### Fase 7 · Pagine interne
Contenuti di Diario, Archivio, Luna Park, Club degli Amici, Caos, nell'ordine da decidere.

### Fase 8 · Desktop e rifinitura
Layout desktop, performance, accessibilità (contrasto, focus, `prefers-reduced-motion`), test su dispositivi reali, sostituzione definitiva dei placeholder con gli SVG finali (se non già fatto prima).

## Gestione dei media

Decisione: **solo GitHub**, nessun servizio esterno per i file; i video vanno su YouTube.

- Limiti GitHub Pages da rispettare: sito pubblicato max **1 GB**, banda ~100 GB/mese (soft). Per stare larghi, obiettivo interno: **cartella `public/media/` sotto ~500 MB** in totale.
- Foto: comprimerle prima di caricarle (WebP o AVIF, lato lungo ~1600 px per le foto grandi, ~800 px per miniature). Mai originali da fotocamera.
- Video: **non nel repo**. Si caricano su YouTube (non in elenco) e si incorporano con `youtube-nocookie.com`, caricando il player solo al click (anteprima statica + iframe al tocco) per non appesantire la home.
- Animazioni brevi e decorative: preferire SVG/CSS; se serve un video corto in loop, MP4 H.264 sotto 2-3 MB.
- Nei file dati (`foto.json`, ecc.) si salvano solo i nomi file relativi a `public/media/`; i link si costruiscono con `import.meta.env.BASE_URL`.
- Ogni fine fase: controllare il peso di `dist/` (`du -sh dist`) e riportarlo in `STATO_SITO.md`.
- Se in futuro 1 GB non bastasse, il sito resta portabile: i percorsi dei media passano da un unico punto e si può spostare su un altro servizio.

## Decisioni prese

- Stack: Astro (confermato)
- Hosting: GitHub Pages (solo GitHub, 1 GB basta)
- Video: YouTube (non in elenco), non nel repo
- Target: mobile-first
- SVG: placeholder finché la grafica non è pronta

## Da decidere

- Nome del repository GitHub (influisce sul `base` di Astro)
- Ordine delle pagine interne (Fase 7)
- Quando sostituire i placeholder con gli SVG definitivi
