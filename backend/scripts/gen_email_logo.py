"""
gen_email_logo.py — Genera backend/assets/email-logo.png, el wordmark que va
en los mails de ciclo de vida (ver lifecycle_emails.py).

Por qué una imagen y no HTML: la app de Gmail en modo oscuro (iOS/Android)
fuerza su propia inversión de colores e ignora meta color-scheme y
[data-ogsc]/[data-ogsb], así que cualquier logo hecho con HTML/CSS termina
transformado. Las imágenes no las toca: horneando la card #131324 y los bordes
redondeados dentro del PNG, el logo se ve idéntico en claro y en oscuro.

Espeja components/wordmark.tsx: Noto Serif 600, barra de cinturones del mismo
ancho que la palabra (w-full), gap de 5px, esquinas de 2px en la barra.
Colores = BELT_LEGEND_BAR_COLORS (BELT_ONDARK_VIVID mezclado al 90% con el
fondo #131324, ver lib/catalog/index.ts).

Uso:
    python scripts/gen_email_logo.py [ruta-a-NotoSerif.woff2|.ttf]

Sin argumento busca el subset latino que Next ya cacheó en web/.next. La fuente
es variable (wght 100-900) y se instancia en 600.
"""

from __future__ import annotations

import glob
import io
import sys
from pathlib import Path

from fontTools import ttLib
from fontTools.varLib import instancer
from PIL import Image, ImageDraw, ImageFont

BACKEND_DIR = Path(__file__).resolve().parent.parent
OUT_PATH = BACKEND_DIR / "assets" / "email-logo.png"

SCALE = 3          # render a 3x para pantallas retina
FONT_PX = 26
WEIGHT = 600       # font-semibold, igual que wordmark.tsx
GAP = 5            # gap-[5px] entre palabra y barra
BAR_H = 4
BAR_RADIUS = 2     # rounded-[2px]
PAD_X = 22
PAD_Y = 16
CARD_RADIUS = 14
BG = (19, 19, 36)          # #131324, el fondo de la app
FG = (246, 248, 252)       # #F6F8FC
BAR_COLORS = [
    (231, 231, 233),  # white
    (26, 91, 196),    # blue
    (141, 44, 185),   # violet
    (127, 69, 32),    # brown
]


def _find_font() -> Path:
    """Subset latino de Noto Serif cacheado por next/font (el sufijo `.p.` es
    el subset preload/latin). Se elige el que cubra las letras del wordmark."""
    media = BACKEND_DIR.parent / "web" / ".next" / "dev" / "static" / "media"
    for path in sorted(media.glob("*.woff2")):
        try:
            font = ttLib.TTFont(path, lazy=True)
            if (font["name"].getDebugName(1) or "") != "Noto Serif":
                font.close()
                continue
            covered = set()
            for table in font["cmap"].tables:
                covered |= {chr(c) for c in table.cmap}
            font.close()
            if set("intervalo") <= covered:
                return path
        except Exception:
            continue
    raise SystemExit(
        "No encontré Noto Serif en web/.next (corré el dev server una vez, "
        "o pasá la ruta de la fuente como argumento)."
    )


def _load_font(path: Path) -> ImageFont.FreeTypeFont:
    """Instancia la fuente variable en WEIGHT y la devuelve lista para PIL."""
    font = ttLib.TTFont(path)
    if "fvar" in font:
        font = instancer.instantiateVariableFont(font, {"wght": WEIGHT})
    buf = io.BytesIO()
    font.save(buf)
    buf.seek(0)
    return ImageFont.truetype(buf, FONT_PX * SCALE)


def main() -> None:
    font_path = Path(sys.argv[1]) if len(sys.argv) > 1 else _find_font()
    font = _load_font(font_path)
    text = "intervalo"

    # Caja real de la tinta: PIL incluye side bearings en getlength, y acá
    # necesitamos el ancho visible exacto para que la barra calce con la
    # palabra (en el front eso lo resuelve `w-full`).
    left, top, right, bottom = font.getbbox(text)
    text_w = right - left
    text_h = bottom - top

    card_w = text_w + 2 * PAD_X * SCALE
    card_h = text_h + (GAP + BAR_H) * SCALE + 2 * PAD_Y * SCALE

    img = Image.new("RGBA", (card_w, card_h), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    draw.rounded_rectangle(
        [(0, 0), (card_w - 1, card_h - 1)], radius=CARD_RADIUS * SCALE, fill=BG + (255,)
    )

    text_x = (card_w - text_w) // 2
    text_y = PAD_Y * SCALE
    draw.text((text_x - left, text_y - top), text, font=font, fill=FG + (255,))

    # Barra: mismo ancho que la palabra, segmentos iguales, esquinas redondeadas.
    bar_y = text_y + text_h + GAP * SCALE
    bar_h = BAR_H * SCALE
    bar = Image.new("RGBA", (text_w, bar_h), (0, 0, 0, 0))
    bar_draw = ImageDraw.Draw(bar)
    seg = text_w / len(BAR_COLORS)
    for i, color in enumerate(BAR_COLORS):
        x0 = round(i * seg)
        x1 = text_w if i == len(BAR_COLORS) - 1 else round((i + 1) * seg)
        bar_draw.rectangle([(x0, 0), (x1 - 1, bar_h - 1)], fill=color + (255,))

    mask = Image.new("L", (text_w, bar_h), 0)
    ImageDraw.Draw(mask).rounded_rectangle(
        [(0, 0), (text_w - 1, bar_h - 1)], radius=BAR_RADIUS * SCALE, fill=255
    )
    img.paste(bar, (text_x, bar_y), mask)

    OUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    img.save(OUT_PATH, "PNG", optimize=True)
    print(f"wrote {OUT_PATH} ({card_w}x{card_h}px @{SCALE}x, {OUT_PATH.stat().st_size} bytes)")
    print(f"css size: {round(card_w / SCALE)}x{round(card_h / SCALE)}")


if __name__ == "__main__":
    main()
