#!/usr/bin/env python3
"""Extrai os contornos reais do wordmark "Able Development" da Switzer.

Regra da marca: o logo é um asset, não texto dependente de fonte carregada.
Este script modela o texto com HarfBuzz (kerning real da fonte, feature
`kern`), converte cada glifo em path SVG via fontTools e grava
scripts/wordmark-dados.json — consumido por scripts/geometria.mjs para
montar assets/logo*.svg.

Dependências (fora do repo, rodar uma vez):
    pip install fonttools uharfbuzz
Uso:
    python3 scripts/wordmark.py

Fonte: fonts/Switzer-Semibold.otf (Fontshare, licença ITF FFL — cópia em
fonts/FFL.txt; self-host e embedding permitidos expressamente).
"""

import json
from pathlib import Path

import uharfbuzz as hb
from fontTools.misc.transform import Transform
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.transformPen import TransformPen
from fontTools.ttLib import TTFont

RAIZ = Path(__file__).resolve().parent.parent
FONTE = RAIZ / "fonts" / "Switzer-Semibold.otf"
TEXTO = "Able Development"
TRACKING_EM = -0.015  # regra do lockup: tracking fixo, o logo escala como desenho

blob = hb.Blob.from_file_path(str(FONTE))
face = hb.Face(blob)
fonte_hb = hb.Font(face)  # escala padrão = unitsPerEm (posições em unidades da fonte)

buf = hb.Buffer()
buf.add_str(TEXTO)
buf.guess_segment_properties()
hb.shape(fonte_hb, buf, {"kern": True, "liga": True})

tt = TTFont(str(FONTE))
upm = tt["head"].unitsPerEm
cap = tt["OS/2"].sCapHeight
glyph_set = tt.getGlyphSet()
ordem = tt.getGlyphOrder()
tracking = TRACKING_EM * upm

partes = []
x = 0.0
pares = list(zip(buf.glyph_infos, buf.glyph_positions))
for i, (info, pos) in enumerate(pares):
    nome = ordem[info.codepoint]
    pen = SVGPathPen(glyph_set, ntos=lambda v: f"{v:.1f}")
    # y da fonte cresce para cima; SVG cresce para baixo → espelha em y.
    # Baseline fica em y = 0 no path resultante.
    tpen = TransformPen(
        pen, Transform(1, 0, 0, -1, x + pos.x_offset, -pos.y_offset)
    )
    glyph_set[nome].draw(tpen)
    d = pen.getCommands()
    if d:
        partes.append(d)
    x += pos.x_advance
    if i < len(pares) - 1:  # tracking entre glifos, não depois do último
        x += tracking

dados = {
    "texto": TEXTO,
    "fonte": FONTE.name,
    "peso": "Semibold (600)",
    "tracking_em": TRACKING_EM,
    "unitsPerEm": upm,
    "capHeight": cap,
    "largura": round(x, 1),  # unidades da fonte, baseline em y = 0
    "path": " ".join(partes),
}
saida = RAIZ / "scripts" / "wordmark-dados.json"
saida.write_text(json.dumps(dados, ensure_ascii=False, indent=1))
print(f"{TEXTO!r} em {FONTE.name}: upm {upm} · cap {cap} "
      f"({cap / upm:.3f} em) · largura {dados['largura']} unidades")
print(f"gravado: {saida.relative_to(RAIZ)} ({saida.stat().st_size} bytes)")
