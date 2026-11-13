# Estrae dal mockup Francobolli_e_luna_park.pdf la grafica della Fase 5 (cartoline e portafoglio).
#
#   pip install pymupdf pillow
#   python scripts/estrai-cartoline.py percorso/Francobolli_e_luna_park.pdf
#
# Il PDF è tutto vettoriale (Illustrator). Ogni tavola è una sequenza di blocchi "q ... Q" di primo livello:
# si disegnano solo i blocchi di un oggetto, su fondo trasparente, e si salvano come WebP.
# - Fronti delle cartoline (tavole 6 e 7): ritagliate in 3:2 (il mockup è 784 x 606 punti, la cartolina
#   10 x 15 cm è 3:2) a 1772 x 1181 px = 150 x 100 mm a 300 dpi. Servono sia allo schermo sia al PDF.
# - Portafoglio a livelli (tavole 4 e 5), a 2x (144 dpi): busta chiusa, busta aperta (fondo + linguetta),
#   tasca davanti della busta, cartellina (tasca verde). Le cartoline dentro le icone sono le stesse fronti.
# Lo script stampa il riquadro di ogni livello in punti mockup: sono i numeri usati in pages/francobolli.
# Se l'artista fornisce file propri, basta sostituire i file in public/grafica/cartoline/ con lo stesso nome
# (stesse proporzioni; per i livelli anche lo stesso riquadro).
import json
import re
import sys
from pathlib import Path

import pymupdf
from PIL import Image

PDF = sys.argv[1] if len(sys.argv) > 1 else 'Francobolli_e_luna_park.pdf'
OUT = Path(__file__).resolve().parent.parent / 'public' / 'grafica' / 'cartoline'
OUT.mkdir(parents=True, exist_ok=True)


def blocchi(doc, pn):
    cs = b''.join(doc.xref_stream(x) for x in doc[pn - 1].get_contents())
    toks = re.finditer(rb'(?<![^\s\]\)>])[qQ](?=\s|$)', cs)
    out, depth, start = [], 0, 0
    for m in toks:
        if m.group() == b'q':
            if depth == 0:
                start = m.start()
            depth += 1
        else:
            depth -= 1
            if depth == 0:
                out.append(cs[start:m.end()])
    return out


def disegna(pn, scelti, clip, scala, alpha=True):
    """Pixmap dei soli blocchi `scelti` (indici, o None = tutta la pagina) nel riquadro `clip` (punti)."""
    d = pymupdf.open(PDF)
    d.select([pn - 1])
    pg = d[0]
    if scelti is not None:
        bl = blocchi(pymupdf.open(PDF), pn)
        cont = pg.get_contents()
        for x in cont[1:]:
            d.update_stream(x, b'')
        d.update_stream(cont[0], b'\n'.join(bl[i] for i in scelti))
    pix = pg.get_pixmap(matrix=pymupdf.Matrix(scala, scala), alpha=alpha, clip=pymupdf.Rect(*clip))
    mode = 'RGBA' if alpha else 'RGB'
    return Image.frombytes(mode, (pix.width, pix.height), pix.samples)


riquadri = {}

# ---- Fronti 3:2 (1772 x 1181) ----
# La cartolina del mockup occupa x 78-862, y 123-729: si tiene tutta la larghezza (1 punto di margine per
# evitare il bordo arrotondato) e si taglia in altezza al centro.
x0, x1 = 79.0, 861.0
h = (x1 - x0) * 2 / 3
yc = (123 + 729) / 2
for nome, pn in (('fiore', 6), ('mappa', 7)):
    scala = 1772 / (x1 - x0)
    im = disegna(pn, None, (x0, yc - h / 2, x1, yc + h / 2), scala, alpha=False)
    im = im.resize((1772, 1181), Image.LANCZOS)
    im.save(OUT / f'fronte-{nome}.webp', quality=86, method=6)
    print(f'fronte-{nome}.webp', im.size)

# ---- Portafoglio a livelli (2x) ----
LIVELLI = {
    # nome: (tavola, blocchi, riquadro di ricerca in punti)
    'busta-chiusa': (4, [3, 4, 5, 6, 7, 8, 9, 10], (100, 300, 465, 600)),
    'busta-aperta': (5, [3, 4, 5], (100, 165, 465, 600)),
    'busta-tasca': (5, [77, 78, 79], (100, 165, 465, 600)),
    'cartellina-tasca': (5, [9, 10], (478, 165, 840, 600)),
}
S = 2
for nome, (pn, scelti, clip) in LIVELLI.items():
    im = disegna(pn, scelti, clip, S)
    bb = im.getchannel('A').point(lambda a: 255 if a > 4 else 0).getbbox()
    im = im.crop(bb)
    x, y = clip[0] + bb[0] / S, clip[1] + bb[1] / S
    w, hh = (bb[2] - bb[0]) / S, (bb[3] - bb[1]) / S
    riquadri[nome] = [round(x, 1), round(y, 1), round(w, 1), round(hh, 1)]
    im.save(OUT / f'{nome}.webp', quality=88, method=6)
    print(f'{nome}.webp', im.size, 'punti x y w h =', riquadri[nome])

(Path(__file__).resolve().parent / 'riquadri-cartoline.json').write_text(json.dumps(riquadri, indent=2))
