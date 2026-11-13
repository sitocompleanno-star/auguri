# Prompt per la Fase 6 · Sincronizzazione tra dispositivi

Incolla questo testo in una nuova chat insieme a:
- il link del sito;
- il link al repository GitHub (o lo zip del progetto);
- se li hai già: account Cloudflare (solo il nome, mai chiavi o token nella chat se il repo è pubblico) o il servizio che preferisci.

---

Sto costruendo il sito "minuscole – L'universo delle cose" con Astro (mobile-first), pubblicato su GitHub Pages. È un regalo di compleanno per la mia ragazza, che sarà l'unica utente. Il progetto è diviso in fasi (vedi `ROADMAP.md` nel repo). Abbiamo chiuso la **Fase 5 (Cartoline e PDF)**; ora lavoriamo sulla **Fase 6: sincronizzazione tra dispositivi, senza login**.

**Link del sito:** https://sitocompleanno-star.github.io/auguri/
**Repository:** [INCOLLA QUI]

**Contesto:** leggi `ROADMAP.md`, `fasi/fase-5/REPORT.md` e `fasi/fase-5/STATO_SITO.md`. In breve:
- Tutto lo stato è un unico oggetto JSON in `localStorage` (chiave `minuscole:stato`), gestito da `src/lib/stato.ts`:
  `{ versione: 1, giorni: { "AAAA-MM-GG": { emozione, modificato } }, preferiti, preferitiModificato, cartoline: { fiore: { francobolli: [{ id, x, y, r }], modificato } } }`.
- Le funzioni sono pure. `migra(grezzo)` porta qualunque valore a uno stato valido; `unisci(a, b)` unisce due stati già pronti per la sincronizzazione:
  - giorni: vince la modifica più recente; una cancellazione è `emozione: null` con la sua data, quindi "vince" se è più recente;
  - preferiti: vince la lista modificata più di recente;
  - cartoline: vince, cartolina per cartolina, quella modificata più di recente;
  - alla fine si tolgono dalle cartoline i francobolli non più sbloccati.
- `scrivi()` lancia l'evento `minuscole:stato` e tutte le pagine si ridisegnano con `osserva()`, anche quando lo stato cambia da un'altra scheda. Se `localStorage` è bloccato, lo stato vive in memoria e `persistente()` restituisce false.
- I francobolli sbloccati non si salvano: si calcolano dai giorni (`sbloccati`).
- Il repository è **pubblico**: nessun segreto nel codice.

**Obiettivo della Fase 6** (dalla roadmap):
1. Al primo salvataggio, sul dispositivo dell'utente si genera un **codice segreto** casuale (Web Crypto). Nessuno lo vede, nemmeno chi ha costruito il sito.
2. I dati si **cifrano nel browser** (es. AES-GCM con una chiave derivata dal codice) e si salvano su un piccolo servizio gratuito (previsto **Cloudflare Workers + KV**). Il servizio vede solo dati cifrati, con un identificativo derivato dal codice (non il codice stesso).
3. **"Collega un altro dispositivo"** con QR e link: l'altro dispositivo riceve il codice, scarica, unisce con `unisci` e da allora sincronizza.
4. Quando sincronizzare: all'apertura, dopo ogni modifica (con un piccolo ritardo per raggruppare) e al ritorno sulla scheda. Senza rete il sito deve funzionare come oggi e riprovare dopo.
5. **Esportazione/importazione** di un file come rete di sicurezza: l'importazione unisce, non sostituisce.
6. Dove mettere i comandi (una pagina o un pannello? la zampa "Archivio"?) e come mostrare lo stato ("sincronizzato", "offline", "errore") senza rovinare la grafica.

**Vincoli:**
- Mantieni il sistema di misura in punti mockup (`--u`) e i componenti esistenti: estendili, non riscriverli.
- Link e asset sempre con `import.meta.env.BASE_URL`.
- Nessun segreto nel repo. Il codice del Worker può stare nel repo; eventuali variabili e chiavi stanno solo nel pannello di Cloudflare.
- Nessuna dipendenza nuova senza motivo. Per il QR valuta un generatore piccolo o scritto a mano, caricato solo quando serve, come il PDF della Fase 5.
- Limiti del piano gratuito (richieste e scritture KV al giorno): calcola quante scritture servono con l'uso reale.
- Accessibilità: focus visibile, annunci per lo stato della sincronizzazione, `prefers-reduced-motion`.
- Verifica con `npm run build`: unione tra due contesti di browser, conflitti sullo stesso giorno, offline e poi online, cifratura (il servizio non deve vedere testo in chiaro). Controlla anche il peso di `dist/` (oggi 803 KB di dati).

**Già deciso:**
- Niente login, una sola utente.
- Unione per giorno e per cartolina: vince la modifica più recente (`unisci` esiste già).
- Codice generato sul dispositivo, dati cifrati nel browser.

**Da fare a fine fase:** crea `fasi/fase-6/REPORT.md`, `fasi/fase-6/STATO_SITO.md` e `fasi/fase-6/PROMPT_FASE_7.md`, con lo stesso formato delle fasi precedenti. La Fase 7 è "Foto e frase del giorno", ma è rimandata finché mancano i contenuti: se lo sono ancora, proponi quale fase anticipare (es. Fase 8, il gioco memory).

**Prima di iniziare**, dimmi se hai dubbi. In particolare:
- Cloudflare Workers + KV o un'alternativa gratuita più semplice da gestire per me;
- cosa succede se si perde il codice (solo il file esportato? un codice di recupero da stampare?);
- se e come scollegare un dispositivo;
- dove mettere i comandi nel sito.
