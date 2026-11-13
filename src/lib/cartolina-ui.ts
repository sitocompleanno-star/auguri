// Portafoglio e cartoline nella pagina /francobolli/ (Fase 5). Solo browser.
//
// Scena in punti mockup (tavole 4-7 di Francobolli_e_luna_park.pdf): x 0-940, y 160-700 della tavola.
// Stati della scena (data-stato):
//   chiuso    tavola 4: busta chiusa con il cuore, cartellina con la mappa che spunta appena
//   aperto    tavola 5: la busta si apre e le due cartoline spuntano (primo tocco su un'icona, nota della tavola 12)
//   cartolina tavole 6-7: la cartolina toccata esce dalla tasca e si allarga (secondo tocco)
// Ogni cartolina è disegnata sempre in grande (782 x 521,3 punti, 3:2 come il 10 x 15) e quando è nel
// portafoglio la si rimpicciolisce con transform (translate in % + scale): niente misure in px.
//
// Francobolli: si trascinano dal vassoio (nella fascia) sulla cartolina con pointer events (dito o mouse), si
// spostano trascinandoli e si tolgono trascinandoli fuori. Da tastiera: Invio sul vassoio li attacca, poi
// frecce (Maiusc = passo lungo), Q/E per ruotare, Canc per togliere. Lo stato è in frazioni della cartolina.
// Il numero massimo di francobolli (uno) è applicato da attaccaFrancobollo in stato.ts: il nuovo sostituisce il vecchio.
import {
  aggiorna, attaccaFrancobollo, cartolina as cartolinaDi, dataDiOggi, leggi,
  normalizzaRotazione, osserva, pulisciCartoline, sbloccati, scrivi, togliFrancobollo,
  type FrancobolloAttaccato, type Stato,
} from './stato.ts';
import { cartolinaDati, FRANCOBOLLO_LARGHEZZA, FRANCOBOLLO_RAPPORTO } from '../data/cartoline.ts';
import { emozione } from '../data/emozioni.ts';
import { percorsoFrancobollo } from './francobolli.ts';

type Posizione = 'dentro' | 'fuori' | 'uscita' | 'grande';

// ---- Geometria (punti mockup, origine della scena = y 160 della tavola) ----
const GRANDE = { x: 79, y: 10, w: 782, h: 782 * (2 / 3) };
const PICCOLA = 321; // larghezza della cartolina dentro le icone (tavola 5)
const POSIZIONI: Record<string, { x: number; dentro: number; fuori: number; uscita: number }> = {
  // fiore: nascosta nella busta chiusa → spunta sopra la tasca (top 230) → appena sopra la tasca
  fiore: { x: 120.5, dentro: 216, fuori: 104, uscita: 8 },
  // mappa: spunta poco (tavola 4) → di più (tavola 5) → sopra la tasca verde (top 182,5)
  mappa: { x: 498.5, dentro: 164, fuori: 104, uscita: -40 },
};

function trasformazione(id: string, pos: Posizione): string {
  const p = POSIZIONI[id] ?? POSIZIONI.fiore;
  if (pos === 'grande') return 'translate(0%, 0%) scale(1)';
  const y = p[pos];
  const tx = ((p.x - GRANDE.x) / GRANDE.w) * 100;
  const ty = ((y - GRANDE.y) / GRANDE.h) * 100;
  return `translate(${tx.toFixed(3)}%, ${ty.toFixed(3)}%) scale(${(PICCOLA / GRANDE.w).toFixed(5)})`;
}

// Limiti per il centro del francobollo: resta tutto sulla cartolina (anche in stampa)
const MEZZO_L = FRANCOBOLLO_LARGHEZZA / 2;
const MEZZO_A = (FRANCOBOLLO_LARGHEZZA * FRANCOBOLLO_RAPPORTO * 1.5) / 2; // altezza in frazioni (3:2)
const limita = (v: number, m: number) => Math.min(1 - m, Math.max(m, v));
const POSTO_TASTIERA = { x: 0.84, y: 0.22 }; // dove va un francobollo aggiunto da tastiera (in alto a destra)
const PASSO = 0.01;
const PASSO_LUNGO = 0.05;
const ROTAZIONE = 15;
const SOGLIA = 6; // px prima che un tocco diventi un trascinamento

export function avviaCartoline(radice: HTMLElement, base: string, definitivi: ReadonlySet<string>): void {
  const $ = <T extends Element = HTMLElement>(sel: string, el: ParentNode = radice) => el.querySelector<T>(sel)!;
  const scena = $('[data-scena]');
  const comandi = $('[data-comandi]');
  const titolo = $('[data-titolo-cartolina]');
  const messaggio = $('[data-messaggio]');
  const vassoio = $('[data-vassoio]');
  const lista = $<HTMLUListElement>('[data-vassoio-lista]');
  const vuoto = $('[data-vassoio-vuoto]');
  const btnGira = $<HTMLButtonElement>('[data-gira]');
  const btnPdf = $<HTMLButtonElement>('[data-pdf]');
  const btnTogli = $<HTMLButtonElement>('[data-togli]');
  const btnRuota = [...radice.querySelectorAll<HTMLButtonElement>('[data-ruota]')];
  const icone = [...radice.querySelectorAll<HTMLButtonElement>('[data-icona]')];
  const carte = new Map<string, HTMLElement>();
  for (const el of radice.querySelectorAll<HTMLElement>('[data-cartolina]')) carte.set(el.dataset.cartolina!, el);

  const riduci = window.matchMedia('(prefers-reduced-motion: reduce)');
  let stato: Stato = leggi();
  let aperta: string | null = null; // id della cartolina in grande
  let occupato = false;              // durante un'animazione si ignorano i tocchi
  let selezionato: string | null = null;
  let timerMsg = 0;

  const annuncia = (t: string, resta = false) => {
    messaggio.textContent = t;
    window.clearTimeout(timerMsg);
    if (!resta) timerMsg = window.setTimeout(() => (messaggio.textContent = ''), 4500);
  };
  const percorso = (id: string) => {
    const e = emozione(id);
    return e ? percorsoFrancobollo(e, definitivi) : undefined;
  };
  const nome = (id: string) => emozione(id)?.nome ?? id;
  const gradi = (r: number) => (r === 0 ? 'dritto' : `ruotato di ${Math.abs(r)} gradi ${r > 0 ? 'a destra' : 'a sinistra'}`);
  /** Francobolli da mostrare: solo quelli ancora sbloccati e di emozioni esistenti. */
  const attaccati = (id: string) => cartolinaDi(stato, id).francobolli.filter((f) => emozione(f.id));

  // ---------------------------------------------------------------------------------------------------
  // Animazioni (Web Animations: si può aspettare la fine di ogni passo)
  // ---------------------------------------------------------------------------------------------------
  function muovi(el: HTMLElement, pos: Posizione, durata: number): Promise<void> {
    const a = el.style.transform || getComputedStyle(el).transform;
    const b = trasformazione(el.dataset.cartolina!, pos);
    el.dataset.pos = pos;
    el.style.transform = b;
    if (riduci.matches || durata <= 0 || typeof el.animate !== 'function') return Promise.resolve();
    const anim = el.animate([{ transform: a }, { transform: b }], { duration: durata, easing: 'cubic-bezier(.25,.75,.25,1)' });
    return anim.finished.then(() => undefined, () => undefined);
  }
  const pausa = (ms: number) => new Promise((ok) => setTimeout(ok, riduci.matches ? 0 : ms));

  for (const [id, el] of carte) el.style.transform = trasformazione(id, 'dentro');

  function etichetteIcone() {
    const st = scena.dataset.stato;
    for (const b of icone) {
      const n = (b.dataset.nome ?? '').toLowerCase();
      $('[data-icona-nome]', b).textContent = st === 'chiuso' ? `Apri il portafoglio: ${n}` : `Apri la ${n}`;
    }
  }

  async function apriPortafoglio() {
    occupato = true;
    scena.dataset.stato = 'aperto';
    etichetteIcone();
    await Promise.all([...carte].map(([, el]) => muovi(el, 'fuori', 520)));
    occupato = false;
    annuncia('Il portafoglio è aperto: tocca di nuovo una cartolina per prenderla.');
  }

  async function apriCartolina(id: string, daStoria = false) {
    const el = carte.get(id);
    if (!el || aperta) return;
    occupato = true;
    aperta = id;
    // la cartolina esce dalla tasca, poi passa davanti e si allarga mentre il portafoglio sparisce
    await muovi(el, 'uscita', 340);
    el.classList.add('is-davanti');
    scena.dataset.stato = 'cartolina';
    scena.dataset.aperta = id;
    radice.classList.add('is-cartolina');
    for (const b of icone) b.inert = true;
    await muovi(el, 'grande', 520);
    el.tabIndex = -1;
    titolo.textContent = cartolinaDati(id)?.nome ?? 'Cartolina';
    comandi.hidden = false;
    vassoio.hidden = false;
    disegnaTutto();
    occupato = false;
    if (!daStoria) history.pushState({ minuscoleCartolina: id }, '');
    titolo.focus();
    annuncia(`${cartolinaDati(id)?.nome}: trascina un francobollo dal vassoio in basso sulla cartolina.`);
  }

  async function chiudiCartolina(daStoria = false) {
    const id = aperta;
    if (!id || occupato) return;
    const el = carte.get(id)!;
    occupato = true;
    gira(false);
    comandi.hidden = true;
    vassoio.hidden = true;
    radice.classList.remove('is-cartolina');
    scena.dataset.stato = 'aperto';
    delete scena.dataset.aperta;
    await muovi(el, 'uscita', 460);
    el.classList.remove('is-davanti');
    await muovi(el, 'fuori', 320);
    for (const b of icone) b.inert = false;
    aperta = null;
    occupato = false;
    if (!daStoria && history.state?.minuscoleCartolina) history.back();
    icone.find((b) => b.dataset.icona === id)?.focus();
  }

  for (const b of icone) {
    b.addEventListener('click', () => {
      if (occupato) return;
      if (scena.dataset.stato === 'chiuso') void apriPortafoglio();
      else if (scena.dataset.stato === 'aperto') void apriCartolina(b.dataset.icona!);
    });
  }
  $('[data-chiudi]').addEventListener('click', () => void chiudiCartolina());
  window.addEventListener('popstate', () => {
    // "indietro" del telefono con la cartolina aperta: si torna al portafoglio, non alla home
    if (aperta) void chiudiCartolina(true);
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && aperta && !trascinamento && !document.querySelector('dialog[open]')) {
      e.preventDefault();
      void chiudiCartolina();
    }
  });
  // se si ricarica con lo stato della storia "cartolina aperta", si riparte dal portafoglio
  if (history.state?.minuscoleCartolina) history.replaceState(null, '');

  // ---- Fronte / retro ----
  function gira(retro: boolean) {
    if (!aperta) return;
    const el = carte.get(aperta)!;
    el.classList.toggle('is-retro', retro);
    btnGira.setAttribute('aria-pressed', String(retro));
    btnGira.textContent = retro ? 'Gira sul fronte' : 'Gira';
    $('[data-fronte]', el).inert = retro;
    disegnaComandi();
  }
  btnGira.addEventListener('click', () => {
    const retro = !carte.get(aperta!)?.classList.contains('is-retro');
    gira(retro);
    annuncia(retro ? 'Retro della cartolina: si scrive a mano dopo la stampa.' : 'Fronte della cartolina.');
  });

  // ---------------------------------------------------------------------------------------------------
  // Disegno dei francobolli (sulle cartoline e nel vassoio), aggiornando gli elementi senza ricrearli
  // ---------------------------------------------------------------------------------------------------
  function disegnaCartolina(id: string) {
    const area = $('[data-area]', carte.get(id)!);
    const fs = attaccati(id);
    const presenti = new Map([...area.querySelectorAll<HTMLElement>('[data-f]')].map((el) => [el.dataset.f!, el]));
    for (const [fid, el] of presenti) if (!fs.some((f) => f.id === fid)) el.remove();
    fs.forEach((f, i) => {
      let el = presenti.get(f.id);
      if (!el) {
        el = document.createElement('span');
        el.setAttribute('role', 'listitem');
        el.className = 'attaccato';
        el.dataset.f = f.id;
        el.innerHTML = '<button type="button" class="attaccato__btn" aria-describedby="aiuto-francobollo"><img alt="" draggable="false" /></button>';
        area.append(el);
      }
      el.style.left = `${f.x * 100}%`;
      el.style.top = `${f.y * 100}%`;
      el.style.setProperty('--r', `${f.r}deg`);
      el.style.zIndex = String(i + 1);
      const btn = el.firstElementChild as HTMLButtonElement;
      // nella busta la cartolina è piccola: i francobolli si vedono ma non si toccano
      btn.tabIndex = aperta === id ? 0 : -1;
      btn.setAttribute('aria-label', `${nome(f.id)}, sulla cartolina, ${gradi(f.r)}`);
      const img = btn.querySelector('img')!;
      const src = base + (percorso(f.id) ?? '');
      if (img.getAttribute('src') !== src) img.setAttribute('src', src);
    });
  }

  function disegnaVassoio() {
    const ids = [...sbloccati(stato).keys()].filter((id) => emozione(id));
    const sulla = new Set(aperta ? attaccati(aperta).map((f) => f.id) : []);
    vuoto.hidden = ids.length > 0;
    const presenti = new Map([...lista.querySelectorAll<HTMLButtonElement>('[data-v]')].map((b) => [b.dataset.v!, b]));
    for (const [id, b] of presenti) if (!ids.includes(id)) b.parentElement!.remove();
    ids.forEach((id, i) => {
      let b = presenti.get(id);
      if (!b) {
        const li = document.createElement('li');
        b = document.createElement('button');
        b.type = 'button';
        b.className = 'vassoio__francobollo';
        b.dataset.v = id;
        b.innerHTML = '<img alt="" draggable="false" />';
        li.append(b);
        b.querySelector('img')!.src = base + (percorso(id) ?? '');
      }
      const li = b.parentElement!;
      if (lista.children[i] !== li) lista.insertBefore(li, lista.children[i] ?? null);
      const su = sulla.has(id);
      b.classList.toggle('is-sulla', su);
      b.setAttribute('aria-label', su ? `${nome(id)}, sulla cartolina` : `${nome(id)}: attacca alla cartolina`);
    });
  }

  function disegnaComandi() {
    const fs = aperta ? attaccati(aperta) : [];
    if (selezionato && !fs.some((f) => f.id === selezionato)) selezionato = null;
    const retro = !!aperta && carte.get(aperta)!.classList.contains('is-retro');
    const nessuno = fs.length === 0 || retro; // sul retro non ci sono francobolli da modificare
    btnTogli.disabled = nessuno;
    for (const b of btnRuota) b.disabled = nessuno;
  }

  function disegnaTutto() {
    for (const id of carte.keys()) disegnaCartolina(id);
    if (aperta) {
      disegnaVassoio();
      disegnaComandi();
    }
  }

  osserva((s) => {
    // decisione: un francobollo che non è più sbloccato si toglie dalla cartolina
    const pulito = pulisciCartoline(s, new Date().toISOString());
    if (pulito !== s) {
      scrivi(pulito);
      return; // scrivi() fa ripartire osserva con lo stato pulito
    }
    stato = s;
    disegnaTutto();
  });

  // ---------------------------------------------------------------------------------------------------
  // Modifiche
  // ---------------------------------------------------------------------------------------------------
  function attacca(id: string, x: number, y: number, r: number, focus = false) {
    if (!aperta) return;
    const c = aperta;
    const prima = attaccati(c);
    const gia = prima.some((f) => f.id === id);
    stato = aggiorna((s) => attaccaFrancobollo(s, c, { id, x: limita(x, MEZZO_L), y: limita(y, MEZZO_A), r }));
    selezionato = id;
    const sostituiti = prima.filter((f) => f.id !== id && !attaccati(c).some((g) => g.id === f.id));
    if (!gia) {
      const sost = sostituiti.length ? ` al posto di ${sostituiti.map((f) => nome(f.id)).join(', ')}` : '';
      annuncia(`Francobollo «${nome(id)}» attaccato alla cartolina${sost}.`);
    }
    if (focus) focusFrancobollo(id);
  }
  function togli(id: string) {
    if (!aperta) return;
    const c = aperta;
    stato = aggiorna((s) => togliFrancobollo(s, c, id));
    annuncia(`Francobollo «${nome(id)}» tolto dalla cartolina.`);
  }
  const focusFrancobollo = (id: string) =>
    requestAnimationFrame(() => carte.get(aperta ?? '')?.querySelector<HTMLButtonElement>(`[data-f="${id}"] button`)?.focus());
  const daModificare = () => {
    const fs = aperta ? attaccati(aperta) : [];
    return fs.find((f) => f.id === selezionato) ?? fs[fs.length - 1];
  };

  btnTogli.addEventListener('click', () => {
    const f = daModificare();
    if (f) togli(f.id);
    lista.querySelector<HTMLButtonElement>('[data-v]')?.focus();
  });
  for (const b of btnRuota) {
    b.addEventListener('click', () => {
      const f = daModificare();
      if (!f) return;
      const r = normalizzaRotazione(f.r + Number(b.dataset.ruota));
      attacca(f.id, f.x, f.y, r);
      annuncia(`${nome(f.id)}: ${gradi(r)}.`);
    });
  }

  btnPdf.addEventListener('click', async () => {
    if (!aperta || btnPdf.disabled) return;
    const dati = cartolinaDati(aperta)!;
    const testo = btnPdf.textContent;
    btnPdf.disabled = true;
    btnPdf.textContent = 'Preparo il PDF…';
    annuncia('Preparo il PDF…', true);
    try {
      const { scaricaPdf } = await import('./pdf-cartolina.ts'); // libreria caricata solo ora
      await scaricaPdf(dati, attaccati(aperta), base, percorso, `cartolina-${dati.id}-${dataDiOggi()}.pdf`);
      annuncia('PDF pronto: fronte e retro, 10 x 15 cm.');
    } catch (err) {
      console.error(err);
      annuncia('Non è stato possibile creare il PDF. Riprova.');
    } finally {
      btnPdf.disabled = false;
      btnPdf.textContent = testo;
    }
  });

  // Tastiera sul vassoio: Invio/Spazio (click con detail 0) attacca il francobollo; con il dito o il mouse
  // un tocco senza trascinamento mostra solo l'istruzione.
  lista.addEventListener('click', (e) => {
    const b = (e.target as Element).closest<HTMLButtonElement>('[data-v]');
    if (!b || !aperta) return;
    if (e.detail === 0) {
      gira(false);
      const f = attaccati(aperta).find((x) => x.id === b.dataset.v);
      if (f) focusFrancobollo(f.id);
      else attacca(b.dataset.v!, POSTO_TASTIERA.x, POSTO_TASTIERA.y, 0, true);
    } else if (!ultimoTrascinamento) {
      annuncia(`Trascina ${nome(b.dataset.v!)} sulla cartolina.`);
    }
  });

  // Tastiera sul francobollo attaccato
  scena.addEventListener('keydown', (e) => {
    const el = (e.target as Element).closest<HTMLElement>('.attaccato');
    if (!el || !aperta) return;
    const f = attaccati(aperta).find((x) => x.id === el.dataset.f);
    if (!f) return;
    const p = e.shiftKey ? PASSO_LUNGO : PASSO;
    const mosse: Record<string, [number, number, number]> = {
      ArrowLeft: [-p, 0, 0], ArrowRight: [p, 0, 0], ArrowUp: [0, -p * 1.5, 0], ArrowDown: [0, p * 1.5, 0],
      q: [0, 0, -ROTAZIONE], Q: [0, 0, -ROTAZIONE], e: [0, 0, ROTAZIONE], E: [0, 0, ROTAZIONE],
    };
    if (e.key === 'Delete' || e.key === 'Backspace') {
      e.preventDefault();
      togli(f.id);
      lista.querySelector<HTMLButtonElement>(`[data-v="${f.id}"]`)?.focus();
      return;
    }
    const m = mosse[e.key];
    if (!m) return;
    e.preventDefault();
    const r = normalizzaRotazione(f.r + m[2]);
    attacca(f.id, f.x + m[0], f.y + m[1], r);
    if (m[2]) annuncia(`${gradi(r)}.`);
  });
  scena.addEventListener('focusin', (e) => {
    const el = (e.target as Element).closest<HTMLElement>('.attaccato');
    if (el) selezionato = el.dataset.f!;
  });

  // ---------------------------------------------------------------------------------------------------
  // Trascinamento (pointer events: dito, mouse, penna)
  // ---------------------------------------------------------------------------------------------------
  interface Trascinamento {
    id: string;
    da: 'vassoio' | 'cartolina';
    pid: number;
    x0: number;
    y0: number;
    dx: number; // distanza tra il punto toccato e il centro del francobollo (px)
    dy: number;
    r: number;
    attivo: boolean;
    sorgente: HTMLElement;
    fantasma?: HTMLElement;
  }
  let trascinamento: Trascinamento | null = null;
  let ultimoTrascinamento = false; // per ignorare il "click" che segue un trascinamento

  const fronteRect = () => $('[data-fronte]', carte.get(aperta!)!).getBoundingClientRect();
  const dentro = (r: DOMRect, x: number, y: number, margine = 0) =>
    x >= r.left - margine && x <= r.right + margine && y >= r.top - margine && y <= r.bottom + margine;

  function inizia(e: PointerEvent, t: Omit<Trascinamento, 'pid' | 'x0' | 'y0' | 'attivo'>) {
    if (e.button !== 0 || !aperta || occupato) return;
    trascinamento = { ...t, pid: e.pointerId, x0: e.clientX, y0: e.clientY, attivo: false };
    ultimoTrascinamento = false;
    t.sorgente.setPointerCapture?.(e.pointerId);
  }

  lista.addEventListener('pointerdown', (e) => {
    const b = (e.target as Element).closest<HTMLButtonElement>('[data-v]');
    if (!b) return;
    const r = b.getBoundingClientRect();
    // il fantasma ha la misura del francobollo sulla cartolina; lo si tiene un po' sopra il dito per vederlo
    inizia(e, { id: b.dataset.v!, da: 'vassoio', dx: 0, dy: e.pointerType === 'touch' ? r.height * 0.9 : 0, r: 0, sorgente: b });
  });
  scena.addEventListener('pointerdown', (e) => {
    const el = (e.target as Element).closest<HTMLElement>('.attaccato');
    if (!el || !aperta) return;
    const f = attaccati(aperta).find((x) => x.id === el.dataset.f);
    if (!f) return;
    e.preventDefault(); // niente selezione di testo / immagine
    const fr = fronteRect();
    inizia(e, {
      id: f.id, da: 'cartolina', r: f.r, sorgente: el,
      dx: e.clientX - (fr.left + f.x * fr.width), dy: e.clientY - (fr.top + f.y * fr.height),
    });
    selezionato = f.id;
  });

  function fantasma(t: Trascinamento): HTMLElement {
    const w = fronteRect().width * FRANCOBOLLO_LARGHEZZA;
    const el = document.createElement('div');
    el.className = 'fantasma';
    el.setAttribute('aria-hidden', 'true');
    el.style.width = `${w}px`;
    el.style.setProperty('--r', `${t.r}deg`);
    el.innerHTML = `<img alt="" src="${base}${percorso(t.id) ?? ''}" />`;
    document.body.append(el);
    return el;
  }

  window.addEventListener('pointermove', (e) => {
    const t = trascinamento;
    if (!t || e.pointerId !== t.pid) return;
    if (!t.attivo) {
      if (Math.hypot(e.clientX - t.x0, e.clientY - t.y0) < SOGLIA) return;
      t.attivo = true;
      gira(false);
      carte.get(aperta!)?.classList.add('is-bersaglio');
      if (t.da === 'vassoio') t.fantasma = fantasma(t);
      else t.sorgente.classList.add('is-trascinato');
    }
    e.preventDefault();
    const cx = e.clientX - t.dx;
    const cy = e.clientY - t.dy;
    const fr = fronteRect();
    const fuori = !dentro(fr, cx, cy, 8);
    if (t.fantasma) {
      t.fantasma.style.transform = `translate(${cx}px, ${cy}px) translate(-50%, -50%) rotate(var(--r))`;
      t.fantasma.classList.toggle('is-fuori', fuori);
    } else {
      // francobollo già attaccato: lo si sposta "dal vivo" (lo stato si salva al rilascio)
      t.sorgente.style.left = `${((cx - fr.left) / fr.width) * 100}%`;
      t.sorgente.style.top = `${((cy - fr.top) / fr.height) * 100}%`;
      t.sorgente.classList.toggle('is-fuori', fuori);
    }
  }, { passive: false });

  function finisci(e: PointerEvent, annulla: boolean) {
    const t = trascinamento;
    if (!t || e.pointerId !== t.pid) return;
    trascinamento = null;
    t.fantasma?.remove();
    t.sorgente.classList.remove('is-trascinato', 'is-fuori');
    carte.get(aperta ?? '')?.classList.remove('is-bersaglio');
    if (!t.attivo) return;
    ultimoTrascinamento = true;
    setTimeout(() => (ultimoTrascinamento = false), 0);
    const cx = e.clientX - t.dx;
    const cy = e.clientY - t.dy;
    const fr = fronteRect();
    const sulla = dentro(fr, cx, cy, 8);
    if (!annulla && sulla) {
      attacca(t.id, (cx - fr.left) / fr.width, (cy - fr.top) / fr.height, t.r);
    } else if (!annulla && t.da === 'cartolina') {
      togli(t.id); // trascinato fuori dalla cartolina = tolto
    } else {
      disegnaTutto(); // annullato: torna dov'era
      if (t.da === 'vassoio' && !annulla) annuncia('Lascia il francobollo sopra la cartolina per attaccarlo.');
    }
  }
  window.addEventListener('pointerup', (e) => finisci(e, false));
  window.addEventListener('pointercancel', (e) => finisci(e, true));
  // su iOS il tocco lungo sulle immagini apre il menu: lo si evita sui francobolli trascinabili
  radice.addEventListener('contextmenu', (e) => {
    if ((e.target as Element).closest('.attaccato, [data-v]')) e.preventDefault();
  });

}
