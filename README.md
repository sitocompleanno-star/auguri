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

Gli SVG definitivi sono in `public/grafica/` (nomi in minuscolo con trattini). In `public/placeholders/` restano solo quelli provvisori (per ora i due francobolli pieni): per sostituirli basta mantenere lo stesso nome file e lo stesso `viewBox`. La pagina del mockup è 940 x 1200 punti e gli SVG sono nella stessa scala (vedi `fasi/fase-1/STATO_SITO.md`).

## Foto e video

Tutto su GitHub, con un tetto di 1 GB per il sito pubblicato (obiettivo ~500 MB). Le foto vanno compresse prima del caricamento e messe in `public/media/`; i video vanno su YouTube (non in elenco) e si incorporano. Dettagli in `ROADMAP.md`, sezione "Gestione dei media".

## Fasi

Ogni fase chiusa ha la sua cartella in `fasi/fase-N/` con `REPORT.md`, `STATO_SITO.md` e il prompt per la fase successiva.
