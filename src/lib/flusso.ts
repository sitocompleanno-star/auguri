// Flusso "Come ti senti oggi?" (Fase 4), dal mockup Diario.pdf (pagine 2-6).
// Si sceglie in 3 passi: famiglia → emozione intermedia → emozione di ultimo livello. Le scelte fatte restano in
// alto come pillole (toccandone una si torna a quel livello) e sotto compaiono le opzioni del livello successivo.
// All'ultimo passo si salva il giorno e compare il francobollo.
//
// Solo browser. Il markup di partenza è in components/FlussoEmozioni.astro; questo modulo crea i pulsanti.
// Si usa due volte nella pagina /diario/: nel riquadro di oggi e nella finestra di un giorno del calendario.
import { emozione, famiglia, famiglie, intermedia, type Emozione } from '../data/emozioni.ts';
import { percorsoFrancobollo } from './francobolli.ts';

export interface OpzioniFlusso {
  radice: HTMLElement;
  base: string;
  definitivi: ReadonlySet<string>;
  /** Salva l'emozione scelta e dice se il francobollo è nuovo (primo sblocco). */
  salva: (id: string) => { nuovo: boolean };
}

type Fase = 'famiglia' | 'intermedia' | 'emozione' | 'fatto';

export class Flusso {
  private o: OpzioniFlusso;
  private $ = <T extends HTMLElement = HTMLElement>(sel: string) => this.o.radice.querySelector<T>(sel)!;
  private famiglia: string | null = null;
  private intermedia: string | null = null;
  private emozione: string | null = null;
  /** true mentre si sta scegliendo (non si sovrascrive con lo stato salvato). */
  occupato = false;

  constructor(o: OpzioniFlusso) {
    this.o = o;
    this.$('[data-indietro]').addEventListener('click', () => this.indietro());
    this.$('[data-cambia]').addEventListener('click', () => this.ricomincia(true));
    this.disegna();
  }

  /** Emozione mostrata come scelta finale (null se si sta ancora scegliendo o non c'è). */
  get attuale(): string | null {
    return this.emozione;
  }

  get fase(): Fase {
    if (this.emozione) return 'fatto';
    if (this.intermedia) return 'emozione';
    if (this.famiglia) return 'intermedia';
    return 'famiglia';
  }

  /** Mostra un'emozione già salvata (o nessuna, con `null`) senza animazioni. */
  imposta(id: string | null): void {
    const e = id ? emozione(id) : undefined;
    this.famiglia = e?.famiglia ?? null;
    this.intermedia = e?.intermedia ?? null;
    this.emozione = e?.id ?? null;
    this.occupato = false;
    this.disegna({ nuovo: false, anima: false });
  }

  /** Torna alla scelta della famiglia. */
  ricomincia(focus = false): void {
    this.famiglia = this.intermedia = this.emozione = null;
    this.occupato = focus;
    this.disegna({ focus });
  }

  private indietro(): void {
    if (this.intermedia) this.intermedia = null;
    else if (this.famiglia) this.famiglia = null;
    this.occupato = true;
    this.disegna({ focus: true });
  }

  /** Torna al livello di una scelta già fatta (toccando la sua pillola). */
  private torna(livello: 0 | 1 | 2): void {
    if (livello <= 0) this.famiglia = null;
    if (livello <= 1) this.intermedia = null;
    this.emozione = null;
    this.occupato = true;
    this.disegna({ focus: true });
  }

  private scegli(id: string): void {
    this.occupato = true;
    const f = this.fase;
    if (f === 'famiglia') this.famiglia = id;
    else if (f === 'intermedia') this.intermedia = id;
    else if (f === 'emozione') {
      this.emozione = id;
      const { nuovo } = this.o.salva(id);
      this.occupato = false;
      this.disegna({ nuovo, anima: true, focus: true });
      return;
    }
    this.disegna({ focus: true });
  }

  private pillola(testo: string, etichetta?: string): HTMLButtonElement {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'pillola';
    b.textContent = testo;
    if (etichetta) b.setAttribute('aria-label', etichetta);
    return b;
  }

  private disegna({ nuovo = false, anima = false, focus = false } = {}): void {
    const scelte = this.$('[data-scelte]');
    const opzioni = this.$('[data-opzioni]');
    const istruzione = this.$('[data-istruzione]');
    const risultato = this.$('[data-risultato]');
    const annuncio = this.$('[data-annuncio]');
    const fase = this.fase;

    // Scelte fatte: restano in alto, toccandole si torna a quel livello
    const fatte: [string, 0 | 1 | 2][] = [];
    if (this.famiglia) fatte.push([famiglia(this.famiglia)!.nome, 0]);
    if (this.intermedia) fatte.push([intermedia(this.intermedia)!.nome, 1]);
    if (this.emozione) fatte.push([emozione(this.emozione)!.nome, 2]);
    scelte.replaceChildren(
      ...fatte.map(([nome, livello]) => {
        const li = document.createElement('li');
        const b = this.pillola(nome, `${nome}: scelta. Tocca per cambiarla`);
        b.classList.add('is-scelta');
        b.addEventListener('click', () => this.torna(livello));
        li.append(b);
        return li;
      }),
    );
    scelte.hidden = fatte.length === 0;

    // Opzioni del livello successivo
    let lista: { id: string; nome: string }[] = [];
    let testo = '';
    if (fase === 'famiglia') {
      lista = famiglie;
      testo = 'Scegli come ti senti';
    } else if (fase === 'intermedia') {
      lista = famiglia(this.famiglia!)!.emozioni;
      testo = `${famiglia(this.famiglia!)!.nome}: scegli tra ${lista.length}`;
    } else if (fase === 'emozione') {
      lista = intermedia(this.intermedia!)!.emozioni;
      testo = `${intermedia(this.intermedia!)!.nome}: scegli tra ${lista.length}`;
    }
    istruzione.textContent = testo;
    opzioni.replaceChildren(
      ...lista.map((x) => {
        const li = document.createElement('li');
        const b = this.pillola(x.nome);
        b.addEventListener('click', () => this.scegli(x.id));
        li.append(b);
        return li;
      }),
    );
    opzioni.hidden = fase === 'fatto';
    opzioni.dataset.livello = fase;

    this.$('[data-indietro]').hidden = fase === 'famiglia' || fase === 'fatto';
    this.$('[data-cambia]').hidden = fase !== 'fatto';

    // Francobollo
    risultato.hidden = fase !== 'fatto';
    if (fase === 'fatto') {
      const e = emozione(this.emozione!) as Emozione;
      const img = this.$<HTMLImageElement>('[data-francobollo]');
      img.src = this.o.base + percorsoFrancobollo(e, this.o.definitivi);
      img.alt = `Francobollo ${e.nome}`;
      this.$('[data-nuovo]').hidden = !nuovo;
      this.$('[data-esito]').textContent = nuovo ? `Hai sbloccato “${e.nome}”.` : anima ? 'Salvato.' : '';
      risultato.classList.remove('is-arrivo');
      if (anima) {
        void risultato.offsetWidth; // riavvia l'animazione
        risultato.classList.add('is-arrivo');
      }
    }

    if (focus) {
      annuncio.textContent =
        fase === 'fatto'
          ? `${emozione(this.emozione!)!.nome}: salvato.${nuovo ? ' Nuovo francobollo!' : ''}`
          : testo;
      const primo =
        fase === 'fatto' ? this.$('[data-risultato-titolo]') : opzioni.querySelector<HTMLButtonElement>('button');
      primo?.focus({ preventScroll: false });
    }
  }
}
