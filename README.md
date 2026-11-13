# minuscole – L'universo delle cose

Sito mobile-first in Astro, pubblicato su GitHub Pages. Piano di lavoro in `ROADMAP.md`.

## Sviluppo in locale

```bash
npm install
npm run dev        # http://localhost:4321
npm run build      # genera dist/
```

## Pubblicazione su GitHub Pages

1. Crea un repository su GitHub (il nome diventa il percorso del sito: `https://<utente>.github.io/<repo>/`).
2. Carica il progetto sul branch `main`.
3. Su GitHub: **Settings → Pages → Source: GitHub Actions**.
4. Ogni push su `main` esegue `.github/workflows/deploy.yml`, che passa `SITE` e `BASE` ad Astro in automatico.

Nota: se usi un dominio personalizzato o un repo chiamato `<utente>.github.io`, il `BASE` va impostato a `/` nel workflow.

## Grafica

Gli SVG definitivi sono in `public/grafica/` (nomi in minuscolo con trattini). In `public/placeholders/` restano solo quelli provvisori (francobolli delle emozioni): per sostituirli basta mettere in `public/grafica/` un file con lo stesso nome e lo stesso `viewBox` (es. `grafica/francobolli/realizzata.svg`); il sito lo usa al posto del segnaposto al build successivo. La grafica del Diario (`diario-fiore.svg`, `diario-carta-destra.webp`, `diario-carta-sinistra.webp`) è estratta dal mockup `Diario.pdf` e si sostituisce allo stesso modo. Anche le cartoline e il portafoglio (Fase 5, `public/grafica/cartoline/`) sono estratti dal mockup `Francobolli_e_luna_park.pdf` con `scripts/estrai-cartoline.py` (serve Python con `pymupdf` e `pillow`): si sostituiscono con file con lo stesso nome e le stesse proporzioni. I francobolli segnaposto si rigenerano con `npm run francobolli` (dopo aver cambiato `src/data/emozioni.ts`). La pagina del mockup è 940 x 1200 punti e gli SVG sono nella stessa scala (vedi `fasi/fase-1/STATO_SITO.md`).

## Foto e frasi del giorno (Fase 7)

1. **Foto:** mettile (JPG, PNG, WebP, anche originali dal telefono) nella cartella `foto-da-aggiungere/`. Le HEIC di iPhone vanno prima esportate in JPG.
2. **Frasi:** scrivile in `frasi-da-aggiungere.txt`, una per riga: `testo | autore` (massimo 60 caratteri per il testo e 24 per l'autore; con `| 12-25` in fondo escono solo quel giorno).
3. Doppio clic su **`aggiungi-contenuti.bat`** (oppure `npm run foto`, `npm run frasi`, `npm run contenuti`). Per ogni foto ti chiede una breve descrizione: serve a chi non può vederla ed è obbligatoria.
4. Doppio clic su **`invia-su-github.bat`**: prima di inviare ricontrolla tutto.

Lo script delle foto toglie i metadati (posizione, data, telefono), crea tre versioni WebP con un nome anonimo in `public/media/foto/` e aggiorna `src/data/foto.json`. Gli originali finiscono in `foto-da-aggiungere/fatte/` e non vanno mai su GitHub. In `foto.json` si può aggiungere `"fuoco": "50% 20%"` per decidere quale parte di una foto verticale si vede in home, e `"giorno": "MM-GG"` per una data speciale. Per togliere una foto: cancella la sua voce dal JSON e i tre file; `npm run contenuti` segnala i file avanzati.

## Foto e video

Tutto su GitHub, con un tetto di 1 GB per il sito pubblicato (obiettivo ~500 MB). I video vanno su YouTube (non in elenco) e si incorporano. Dettagli in `ROADMAP.md`, sezione "Gestione dei media".

## Sincronizzazione tra dispositivi (Fase 6)

I dati si sincronizzano cifrati tramite un piccolo Cloudflare Worker gratuito. Per attivarla: segui `worker/LEGGIMI.md` e metti l'indirizzo del Worker in `src/data/sincronizzazione.ts`. Per provarla in locale: `npm run servizio` e, in un altro terminale, `PUBLIC_SYNC_URL=http://localhost:8787 npm run dev`. Prove senza browser: `npm run prova-sync`.

## Fasi

Ogni fase chiusa ha la sua cartella in `fasi/fase-N/` con `REPORT.md`, `STATO_SITO.md` e il prompt per la fase successiva.
