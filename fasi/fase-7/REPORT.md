# Report · Fase 7 · Foto e frase del giorno (+ Archivio)

Data: 2026-11-13

## Obiettivo
Nella cornice della home, una foto e una frase che cambiano ogni giorno (fuso Europe/Rome), senza backend. Più un sistema con cui William aggiunge da solo foto e frasi (ne arriveranno circa 100 + 100) e un **Archivio** dove si vedono tutte, anche quelle non ancora uscite.
Foto e frasi vere **non ci sono ancora**: il sito è pronto e, con i dati vuoti, mostra i segnaposto come prima. Tutto è stato provato con 16 foto e 7 frasi di prova, poi tolte.

## Decisioni prese con William (prima di iniziare)
1. **Privacy:** va bene il sito pubblico, con `noindex`, nomi dei file anonimi e metadati tolti.
2. **Quantità:** circa 100 foto e 100 frasi, aggiunte nel tempo da William, che vuole un sistema per farlo da solo.
3. **Formato:** non si sa se le foto arriveranno da telefono o da fotocamera, quindi la compressione la fa uno script.
4. **Foto e frase indipendenti**, nessun abbinamento.
5. **Date speciali possibili**, ma per ora nessuna.
6. **Foto in grande** al tocco. **Tutte** le foto e le frasi si vedono nell'**Archivio**, anche quelle non ancora uscite.
7. **Stato:** basta la data, niente da salvare né sincronizzare.
8. **Frasi:** massimo **60 caratteri**, con **autore** (chi l'ha scritta).
9. **Peso:** nessun problema (vedi sotto), niente zip.

## Fatto

### Scelta del giorno (`src/lib/del-giorno.js`)
JavaScript puro, **senza import**: la home lo incolla in uno script inline, e lo usano anche l'Archivio, il build, gli script e le prove.
- **Giri.** All'inizio di un giro si prendono le voci con `aggiunta` ≤ quel giorno, si mescolano in un ordine fisso (Fisher-Yates con mulberry32, seme `foto:<giro>` o `frasi:<giro>`) e ne esce una al giorno. Una voce torna solo dopo che sono uscite tutte le altre.
- **Voci nuove:** entrano dal giro successivo, così il giro in corso non cambia. Aggiungerne oggi non cambia nessun giorno passato.
- **Niente doppioni** a cavallo tra due giri (la stessa voce due giorni di fila).
- **Giorni speciali:** campo `giorno` (`"MM-GG"` ogni anno, `"AAAA-MM-GG"` una volta). Quel giorno esce la voce riservata, il giro si ferma e riprende il giorno dopo. Le voci riservate non entrano nei giri.
- **Calcolo:** si ripercorrono i giorni da `INIZIO` (2026-11-01) a oggi. Con 300 voci e 10 anni ci vogliono circa 2 ms. L'ordine nel JSON non conta (si parte dall'ordine per `id`).
- `oggiRoma()` è uguale a `dataDiOggi()` di `stato.ts`.

### Dati e controlli
- `src/data/foto.json`: `[{ id, w, h, alt, aggiunta, fuoco?, giorno? }]`.
  - `id` è anonimo (8 caratteri esadecimali casuali);
  - i file sono `public/media/foto/<id>-400.webp`, `-800.webp` e `-1600.webp`.
- `src/data/frasi.json`: `[{ id, testo, autore?, aggiunta, giorno? }]`.
- `src/lib/valida-contenuti.ts`: controlli puri.
  - Foto: `id` valido e unico, `aggiunta`, `alt` obbligatorio, `fuoco` come `"50% 30%"`, un solo contenuto per giorno speciale.
  - Frasi: testo ≤ 60 caratteri (un'emoji conta 1), niente "a capo", autore ≤ 24 caratteri.
- `src/lib/contenuti.ts` (solo build): controlla anche che esistano i tre file di ogni foto. **Se qualcosa non va, il build si ferma** con un elenco di cosa correggere.

### Sistema per aggiungere i contenuti (Windows)
- **`npm run foto`**. Le foto si mettono in `foto-da-aggiungere/` (esclusa da git). Lo script:
  - le raddrizza secondo l'EXIF e **toglie tutti i metadati** (GPS, data, modello);
  - crea tre WebP con nome anonimo;
  - chiede una descrizione per ogni foto, e la richiede se è troppo corta;
  - salva `foto.json` dopo ogni foto, quindi interrompendo non si perde niente;
  - sposta gli originali in `foto-da-aggiungere/fatte/` e segnala le foto verticali.
  - Usa `sharp`, già installato con Astro: è stato aggiunto in `devDependencies` (stessa versione 0.35.5), quindi nessun pacchetto nuovo e niente che finisca nel sito.
- **`npm run frasi`**. Le frasi si scrivono in `frasi-da-aggiungere.txt`, una per riga: `testo | autore | giorno facoltativo`. Lo script:
  - aggiunge quelle valide con `id` e data;
  - salta i doppioni;
  - lascia nel file solo le righe da correggere, spiegando perché;
  - completa `id` e `aggiunta` delle frasi scritte a mano in `frasi.json`.
- **`npm run contenuti`**: gli stessi controlli del build, più il peso di `public/media/foto`, i file avanzati e la foto e frase di oggi. In caso di errore esce con codice 1.
- **`aggiungi-contenuti.bat`**: doppio clic, esegue foto → frasi → controllo.
- **`invia-su-github.bat`**: ora lancia `npm run contenuti` prima del commit e si ferma se c'è un errore, così il sito online non si blocca su un build fallito. Se Node non c'è, salta il controllo.

### Home (`src/pages/index.astro`, `Cornice` invariata)
- Gli slot `foto` e `frase` si riempiono solo se c'è almeno una voce. Con i JSON vuoti la home è identica a prima.
- **Script inline** subito dopo la cornice: codice di `del-giorno.js` più `mostraDelGiorno()` (compattati, ~8 KB con 16 foto e 7 frasi, circa 25-30 KB con 100 + 100, 6-8 KB compressi). Così foto e frase sono a posto prima che la pagina compaia, senza il lampo dei segnaposto né di quella di ieri.
- **Foto:**
  - `<button>` che riempie l'area, `<img>` 800 px, `object-fit: cover`, `object-position` da `fuoco`, angoli 20 punti;
  - `fetchpriority="high"`, `decoding="async"`, `width`/`height` calcolati;
  - dissolvenza 0,35 s, assente con reduced motion;
  - nome accessibile: l'`alt` + "(apri la foto in grande)".
- **Frase:** `<figure><blockquote>…</blockquote><figcaption>autore</figcaption></figure>` in un'unica riga di testo, font del Diario, virgolette tipografiche.
  - Il testo si riduce da 16 a 12 px finché entra.
  - Se non basta (solo con casi limite, come 60 "W" senza spazi), restano 3 righe con i puntini.
  - Contrasto: frase 8:1, autore 6,3:1.
- **Mezzanotte:** la data si ricontrolla ogni minuto e al ritorno sulla scheda, quindi la foto cambia anche se la pagina è rimasta aperta.

### Foto in grande (`src/components/FotoGrande.astro`)
- `<dialog>` modale, foto a 1600 px (`srcset` 800/1600).
- Si chiude con la ×, Esc o un tocco fuori; il focus torna a chi l'ha aperta.
- Nell'Archivio si scorre tra tutte: frecce, tasti ← →, scorrimento col dito, "3 di 16" annunciato.
- Dissolvenza assente con reduced motion.

### Archivio (`/archivio/`, prima parte della Fase 10)
- Zampa estesa in alto (come nel Diario), titolo "Archivio", schede **Foto (N)** / **Frasi (N)**.
- Le schede seguono il modello ARIA (frecce); `#frasi` nell'indirizzo apre direttamente le frasi.
- Foto: griglia 3 colonne di miniature quadrate (400 px, `loading="lazy"`), le più recenti per prime; un tocco apre la foto in grande.
- Frasi: schede con testo e autore.
- Etichetta **"Oggi"** sulla foto e sulla frase del giorno, calcolata come in home.
- Con i dati vuoti: "Ancora nessuna foto/frase".
- `[sezione]` non genera più l'archivio.

### Privacy
- `<meta name="robots" content="noindex, nofollow, noimageindex">` su tutte le pagine (`Base.astro`). `robots.txt` non serve: su `…github.io/auguri/` non verrebbe letto.
- Nomi dei file casuali, metadati tolti dallo script, originali mai nel repo (`.gitignore`).

## Verifiche
- **`npm run prova-giorno`** (nuovo), tutte superate:
  - casi limite;
  - stessa data, stessa voce; l'ordine del JSON non conta; foto e frasi hanno sequenze diverse;
  - 12 giri con 2, 3, 7, 30 e 101 voci: in ogni giro tutte diverse, mai due giorni uguali di fila;
  - voci aggiunte a metà giro: il giro in corso resta uguale; aggiunte oggi: il passato resta uguale;
  - giorni speciali: ogni anno o una volta, la data con l'anno vince, il giro si ferma e riprende;
  - mezzanotte Europe/Rome con ora solare e legale, compresi i due cambi d'ora;
  - velocità;
  - tutti i controlli dei dati.
- **`npm run prova-sync`**: invariato e superato (lo stato non cambia).
- **Script:**
  - 15 foto generate con GPS, modello e data nell'EXIF, tra cui 3 salvate girate con `Orientation=6`: escono raddrizzate e senza nessun metadato (controllato byte per byte);
  - domanda interattiva della descrizione provata in un terminale simulato;
  - frasi: valide, troppo lunghe, autore lungo, doppione, data sbagliata, emoji;
  - `npm run contenuti` esce con 1 se manca una descrizione.
- **Chrome (Playwright) a 390 x 844, Europe/Rome**, sulla build di produzione (`BASE=/auguri`), 18 giorni simulati:
  - foto sempre 202,5 x 153,5 px, uguale all'area;
  - **CLS = 0** in tutti i giorni;
  - verticali tagliate al centro (o secondo `fuoco`), panoramiche e quadrate corrette;
  - giorni speciali rispettati;
  - frasi a 16 px (12 px la più lunga reale, 56 caratteri + autore).
  - **Mezzanotte con la pagina aperta** (23:59:30 → +61 s): foto e frase cambiano.
  - **Foto in grande** dalla home: si apre, Esc chiude, il focus torna alla foto.
  - **Archivio:** "Oggi" uguale alla home, 16 miniature, foto in grande "3 di 16" → "4 di 16" con →, schede con le frecce, `#frasi`.
  - Corretto un difetto: una frase senza spazi allargava la colonna delle frasi.
  - Reduced motion: transizioni azzerate.
  - 320 px: frase a 13,5 px; 430 px: 16 px.
  - Nessun errore JS (l'unico 404 è la favicon, che manca dalla Fase 4).
- **Peso `dist/`:** 906 KB di dati senza foto (Fase 8: 874; +32 KB tra Archivio e componenti).
  - Le foto di prova pesavano 5 + 13 + 31 KB, ma sono disegni piatti.
  - **Stima per foto vere:** circa 20-30 + 60-90 + 150-250 KB, quindi circa 0,25-0,35 MB a foto e **25-35 MB per 100 foto**, molto sotto il tetto di 500 MB. `npm run contenuti` riporta il peso reale.
- **Non verificato:** foto vere (peso e resa reali), telefoni reali, Safari/Firefox, VoiceOver/TalkBack, HEIC di iPhone (vedi sotto).

## Decisioni prese da me
- **Scelta nel browser, non al build:** niente workflow giornaliero (GitHub lo sospende dopo 60 giorni senza attività), funziona anche se il sito non viene ricostruito. Lo script inline evita il lampo.
- **Giri basati su `aggiunta`:** è il modo, senza salvare niente, per evitare ripetizioni anche quando arrivano voci nuove. Se si **cancella** una voce, l'ordine dei giorni seguenti può cambiare: per togliere una foto è meglio cancellarla e accettarlo (succede solo da quel giorno in poi).
- **Voci con giorno speciale riservate** a quel giorno (non escono negli altri giorni), ma **visibili nell'Archivio** come tutte. Se servisse una sorpresa nascosta fino al giorno, va aggiunto un campo per nasconderle.
- **Tre misure** (400 Archivio, 800 home, 1600 in grande): la home a 3x usa circa 600 px. WebP (qualità 72/76/78), non AVIF: si codifica più in fretta e la differenza su queste misure è piccola.
- **Testo e autore nella stessa riga di testo**, con riduzione automatica del carattere: due righe da 60 caratteri più l'autore non stanno in 41 px a dimensione fissa.
- **Descrizione obbligatoria e controllata al build**, ma `invia-su-github.bat` la controlla prima, così online non si rompe niente.
- **Archivio anticipato** (era Fase 10): la richiesta era che foto e frasi stessero lì. Le altre parti dell'Archivio (se ce ne saranno) restano per la Fase 10.
- **Lo stato non cambia:** niente preferite o già viste, come deciso.

## Problemi aperti
- **Worker di Cloudflare pubblicato** da William (2026-11-13): `URL_SERVIZIO = 'https://minuscole-sync.sitocompleanno.workers.dev'` in `src/data/sincronizzazione.ts`. Nel file arrivato mancava `https://`: aggiunto, e ora `sincronizza.ts` lo aggiunge da solo se manca. **Da provare dal vivo** (da qui il servizio non era raggiungibile): due dispositivi collegati col QR in `/dispositivi/`, e che la variabile `ORIGINI` del Worker sia `https://sitocompleanno-star.github.io`.
- **Foto e frasi vere da aggiungere** con `aggiungi-contenuti.bat`.
- **HEIC (iPhone):** `sharp` di solito non le legge (manca il decoder HEVC). Lo script le salta con un messaggio: vanno esportate in JPG, oppure si imposta l'iPhone su "Più compatibile".
- Favicon ancora mancante (dalla Fase 4).
