"""Reporte de difusión Intervalo — formato tech report de Google DeepMind.

Charts con matplotlib + seaborn (la librería del paper LearnLM) y la paleta de
Intervalo (lib/catalog/index.ts + globals.css).
"""
from pathlib import Path

import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
import seaborn as sns
from matplotlib.backends.backend_pdf import PdfPages


# ── Paleta Intervalo ────────────────────────────────────────────────────────
INDIGO      = "#5457e5"   # --primary
INDIGO_SOFT = "#7e80f7"   # --chart-5
BLUE        = "#1B63D6"   # cinturón azul (BELT_ONDARK_VIVID)
VIOLET      = "#9B2FC9"   # cinturón violeta
BROWN       = "#8B4A1F"   # cinturón marrón
INK         = "#131324"   # --background
MUTED       = "#a4b3c6"   # --muted-foreground
GRID        = "#d8dce6"

sns.set_theme(style="whitegrid", font="DejaVu Serif")
plt.rcParams.update({
    "figure.dpi": 200,
    "axes.edgecolor": INK, "axes.labelcolor": INK,
    "axes.labelsize": 8, "axes.titlesize": 8,
    "text.color": INK, "xtick.color": INK, "ytick.color": INK,
    "xtick.labelsize": 7.2, "ytick.labelsize": 7.2,
    "grid.color": GRID, "grid.linewidth": 0.6,
    "legend.fontsize": 7.2, "legend.frameon": False,
})

ROOT = Path(r"C:/Users/Administrator/intervalo")
OUT = ROOT / "docs" / "reports" / "reporte-difusion-2026-08-13.pdf"

# ── Datos ───────────────────────────────────────────────────────────────────
FUNNEL = [
    ("Entraron por el link", 294), ("Abrieron el onboarding", 176),
    ("Completaron el wizard", 74), ("Se registraron", 60),
    ("Instalaron la app", 25), ("Primera sesión", 23),
    ("Activaron notificaciones", 5),
]
UNIS = [("UBA", 132, 98, 35), ("UNC", 47, 23, 8),
        ("UADE", 46, 19, 6), ("UNSAM", 28, 10, 4)]
DIAS = [("11/08", 228, 22), ("12/08", 213, 45), ("13/08", 65, 16)]
GRUPOS = [("11/08", 8), ("12/08", 6), ("13/08", 16)]
CURSOS = [("Análisis", 29), ("Álgebra", 8), ("Probab.", 8)]

# A/B `onboarding-orden-apodo`, en orden de visita de cada brazo.
AB_CONTROL = [70, 43, 41, 39, 38, 38, 30, 30, 30, 30, 30, 30]
AB_TEST    = [94, 68, 60, 55, 54, 43, 42, 42, 42, 39, 39, 38]
AB_APODO   = {"control": 1, "test": 9}   # posición de la slide del apodo

PAGE = (8.27, 11.69)
L, R = 0.115, 0.885
TITLE = "Prueba piloto de difusión"
FECHA = "11–13 de agosto de 2026"
DISPLAY = "Cambria"   # serif de titulos: trazo mas fino que DejaVu Serif Bold
NL = chr(10)
BR = NL + NL   # separador de párrafos

WORD = "intervalo"


def wordmark(fig, x, y, size=13):
    """Wordmark suelto, sin barra y en un solo color. Va como un único texto y no
    letra por letra: así el motor de fuentes aplica el kerning real de la palabra
    en vez de apilar glifos sueltos."""
    fig.text(x, y, WORD, size=size, weight="bold", family="DejaVu Serif",
             color=INK, va="baseline")


def header(fig, page_no, first=False):
    if first:
        wordmark(fig, L, 0.941)
        fig.text(R, 0.947, FECHA, ha="right", size=7.2, style="italic")
        y = 0.936
    else:
        fig.text(0.5, 0.950, TITLE, ha="center", size=7.2)
        y = 0.944
    fig.add_artist(plt.Line2D([L, R], [y, y], transform=fig.transFigure, color=INK, lw=1.1))
    fig.add_artist(plt.Line2D([L, R], [0.052, 0.052], transform=fig.transFigure, color=INK, lw=0.7))
    fig.text(R, 0.032, str(page_no), ha="right", size=8)


def _wrap(fig, text, size, weight, maxw, indent=""):
    """Corta el texto midiendo el ancho real de cada línea. Contar caracteres no
    sirve: el ancho por carácter depende de la fuente y del peso, y dejaba media
    pulgada de margen derecho sin usar."""
    fig.canvas.draw()
    r = fig.canvas.get_renderer()
    inv = fig.transFigure.inverted()

    def width(txt):
        t = fig.text(0, -1, txt, size=size, weight=weight, family="DejaVu Serif")
        w = t.get_window_extent(r).transformed(inv).width
        t.remove()
        return w

    lines = []
    for block in text.split(NL):
        if not block.strip():
            lines.append("")
            continue
        cur = indent
        for word in block.split():
            cand = f"{cur} {word}" if cur.strip() else f"{cur}{word}"
            if cur.strip() and width(cand) > maxw:
                lines.append(cur)
                cur = word
            else:
                cur = cand
        lines.append(cur)
    return lines


def para(fig, y, text, size=9, weight="normal", color=INK, ls=1.55):
    lines = _wrap(fig, text, size, weight, R - L)
    fig.text(L, y, NL.join(lines), size=size, weight=weight, color=color,
             va="top", ha="left", linespacing=ls)
    return y - len(lines) * (size * ls * 1.06) / (PAGE[1] * 72)


def caption(fig, y, num, text):
    prefix = f"Figura {num} |"
    lines = _wrap(fig, text, 7.2, "normal", R - L,
                  indent=" " * int(len(prefix) * 1.9))
    fig.text(L, y, NL.join(lines), size=7.2, va="top", ha="left", linespacing=1.5)
    fig.text(L, y, prefix, size=7.2, weight="bold", va="top", ha="left")


def strip(ax, axis="x"):
    ax.grid(axis=axis, visible=False)
    sns.despine(ax=ax, top=True, right=True)


# ════════════════════════════════════════════════════════════════════════════
with PdfPages(OUT) as pdf:
    # ── PÁGINA 1 ────────────────────────────────────────────────────────────
    fig = plt.figure(figsize=PAGE)
    header(fig, 1, first=True)

    fig.text(L, 0.884, TITLE, size=19.5, weight="bold", family=DISPLAY)
    fig.text(L, 0.860, "30 grupos, 4 universidades, 294 personas", size=13.5, family=DISPLAY)

    para(fig, 0.834, ls=1.45, text=(
         "Se publicó el link de Intervalo en 30 grupos de WhatsApp de cuatro universidades, en tres "
         "tandas: 11/08 (UADE y UNC, 8 grupos), 12/08 (UNC y UBA, 6) y 13/08 (UBA/FIUBA, 16). Las de "
         "UBA fueron de Análisis Matemático II, Física I y Probabilidad." + BR +
         "El embudo combina las tandas del 12 y 13/08; el 11/08 queda fuera porque la instrumentación "
         "se desplegó esa misma noche. En esa ventana entraron 294 personas, 60 se registraron (20%) "
         "y 23 hicieron al menos una sesión de estudio." + BR +
         "UBA concentró el 45% del tráfico y el 58% de los registros, con una entrada al onboarding "
         "de 74% contra 41–49% del resto. El embudo pierde 40% de la gente antes del onboarding y 58% "
         "más dentro del wizard; de los registrados, solo 5 activaron notificaciones."),
         size=9.2, weight="bold")

    fig.text(L, 0.616, "1.  Embudo completo", size=12, weight="bold", family=DISPLAY)

    ax = fig.add_axes([0.30, 0.398, 0.585, 0.190])
    vals = [f[1] for f in FUNNEL]
    bars = ax.barh(range(len(vals)), vals, color=[INDIGO] * 4 + [INDIGO_SOFT] * 3, height=0.62)
    ax.set_yticks(range(len(vals)), [f[0] for f in FUNNEL])
    ax.invert_yaxis(); ax.set_xlabel("Personas"); ax.set_xlim(0, 300)
    strip(ax, "y")
    for i, (b, v) in enumerate(zip(bars, vals)):
        extra = f"  ·  {100*v/vals[i-1]:.0f}% del paso anterior" if i else ""
        ax.text(v + 4, b.get_y() + b.get_height() / 2,
                f"{v}   ({100*v/vals[0]:.0f}%{extra})", va="center", size=7)

    caption(fig, 0.360, 1,
            "Embudo de las tandas del 12 y 13/08. Las cuatro primeras etapas son de adquisición; las "
            "tres últimas (celeste) se miden sobre los 60 registrados.")

    fig.text(L, 0.318, "2.  Rendimiento por universidad", size=12, weight="bold", family=DISPLAY)

    ax2 = fig.add_axes([L + 0.02, 0.148, 0.40, 0.148])
    x = range(len(UNIS)); w = 0.26
    ax2.bar([i - w for i in x], [u[1] for u in UNIS], w, label="Entraron", color=INDIGO)
    ax2.bar(list(x), [u[2] for u in UNIS], w, label="Onboarding", color=BLUE)
    ax2.bar([i + w for i in x], [u[3] for u in UNIS], w, label="Registrados", color=VIOLET)
    ax2.set_xticks(list(x), [u[0] for u in UNIS])
    ax2.set_ylabel("Personas"); ax2.legend(loc="upper right"); strip(ax2)

    ax3 = fig.add_axes([L + 0.53, 0.148, 0.235, 0.148])
    conv = [100 * u[3] / u[1] for u in UNIS]
    ax3.bar([u[0] for u in UNIS], conv, color=[INDIGO, BLUE, VIOLET, BROWN], width=0.58)
    ax3.set_ylabel("Click → registro (%)"); ax3.set_ylim(0, 34); strip(ax3)
    for i, c in enumerate(conv):
        ax3.text(i, c + 1, f"{c:.0f}%", ha="center", size=7)

    caption(fig, 0.120, 2,
            "(Izq.) Volumen por universidad en las tres primeras etapas. (Der.) Conversión de click a "
            "registro. UBA no solo trajo más gente: convierte 27% contra 13–17% del resto, y es la "
            "única donde la mayoría de los que entran abren el onboarding.")

    fig.text(L, 0.072, "Datos: PostHog (eventos de producto) y Postgres (registros, sesiones, "
                       "inscripciones). Ventana 12/08 00:00 – 13/08 20:07 (-03:00).",
             size=7, color=MUTED, va="top")

    pdf.savefig(fig); plt.close(fig)

    # ── PÁGINA 2 ────────────────────────────────────────────────────────────
    fig = plt.figure(figsize=PAGE)
    header(fig, 2)

    fig.text(L, 0.900, "3.  Del registro a las notificaciones", size=12, weight="bold", family=DISPLAY)
    para(fig, 0.880,
         "El tramo posterior al registro es el más angosto. De los 60 registrados, 25 abrieron la app "
         "instalada y 23 hicieron una sesión real, pero solo 5 concedieron el permiso de "
         "notificaciones — el prompt vive en el resumen de sesión, así que quien no estudia nunca lo ve.")

    post = [("Registrados", 60), ("Instalaron", 25), ("Sesión", 23), ("Push", 5)]
    ax = fig.add_axes([L + 0.02, 0.640, 0.30, 0.165])
    ax.bar([p[0] for p in post], [p[1] for p in post],
           color=[INDIGO, INDIGO_SOFT, BLUE, VIOLET], width=0.6)
    ax.set_ylabel("Personas"); strip(ax)
    for i, p in enumerate(post):
        ax.text(i, p[1] + 1.3, str(p[1]), ha="center", size=7)

    perm = [("granted", 5), ("denied", 1), ("default", 1)]
    ax2 = fig.add_axes([L + 0.40, 0.640, 0.16, 0.165])
    ax2.bar([p[0] for p in perm], [p[1] for p in perm],
            color=[INDIGO, BROWN, MUTED], width=0.55)
    ax2.set_ylabel("Personas"); ax2.set_title("Permiso de push"); strip(ax2)

    ax3 = fig.add_axes([L + 0.615, 0.640, 0.155, 0.165])
    ax3.bar([c[0] for c in CURSOS], [c[1] for c in CURSOS],
            color=[INDIGO, BLUE, VIOLET], width=0.55)
    ax3.set_ylabel("Usuarios"); ax3.set_title("Curso elegido"); strip(ax3)

    caption(fig, 0.612, 3,
            "(Izq.) Etapas posteriores al registro, medidas sobre los mismos 60 usuarios. (Centro) "
            "Resultado del prompt de notificaciones: nadie lo rechaza masivamente, casi nadie llega a "
            "verlo. (Der.) Curso elegido: Análisis domina porque 10 de los 16 grupos publicados el "
            "13/08 eran de Análisis Matemático II y Física I.")

    fig.text(L, 0.556, "4.  Volumen por día", size=12, weight="bold", family=DISPLAY)

    ax4 = fig.add_axes([L + 0.02, 0.395, 0.31, 0.140])
    x = range(len(DIAS)); w = 0.32
    ax4.bar([i - w / 2 for i in x], [d[1] for d in DIAS], w, label="Personas nuevas", color=INDIGO)
    ax4.bar([i + w / 2 for i in x], [d[2] for d in DIAS], w, label="Registrados", color=VIOLET)
    ax4.set_xticks(list(x), [d[0] for d in DIAS])
    ax4.set_ylabel("Personas"); ax4.legend(); strip(ax4)

    ax5 = fig.add_axes([L + 0.44, 0.395, 0.31, 0.140])
    ax5.bar([g[0] for g in GRUPOS], [g[1] for g in GRUPOS], color=INDIGO_SOFT, width=0.5)
    ax5.set_ylabel("Grupos publicados"); ax5.set_ylim(0, 19); strip(ax5)
    for i, g in enumerate(GRUPOS):
        ax5.text(i, g[1] + 0.4, str(g[1]), ha="center", size=7)

    caption(fig, 0.368, 4,
            "(Izq.) Personas nuevas y registros por día. Las barras no suman las 294 del embudo: el "
            "11/08 queda fuera de la ventana —la atribución por utm_source y el evento de onboarding "
            "recién se desplegaron esa noche— y a las 213 + 65 personas nuevas del 12 y 13 se agregan "
            "16 del 11/08 que volvieron. (Der.) Grupos publicados por día según el tracker.")

    fig.text(L, 0.306, "5.  Experimento: orden de la slide del apodo", size=12, weight="bold", family=DISPLAY)
    para(fig, 0.288,
         "Desde el 12/08 corre un A/B con feature flag: control abre el wizard pidiendo el apodo, test "
         "lo mueve a la posición 9. Control pierde 39% de la gente en esa slide y test solo 7%, pero "
         "la conversión final es la misma (43% vs 40%, p ≈ 0,75): test pierde repartido lo que control "
         "pierde de golpe.", size=8.8)

    ax6 = fig.add_axes([L + 0.02, 0.122, 0.40, 0.118])
    pos = range(1, 13)
    ax6.plot(pos, [100 * v / AB_CONTROL[0] for v in AB_CONTROL], "-o", ms=3,
             color=INDIGO, label="control", lw=1.4)
    ax6.plot(pos, [100 * v / AB_TEST[0] for v in AB_TEST], "-o", ms=3,
             color=VIOLET, label="test", lw=1.4)
    for arm, col, data in (("control", INDIGO, AB_CONTROL), ("test", VIOLET, AB_TEST)):
        pp = AB_APODO[arm]
        ax6.plot([pp], [100 * data[pp - 1] / data[0]], "o", ms=8, mfc="none", mec=col, mew=1.3)
    ax6.annotate("apodo", (1, 100), textcoords="offset points", xytext=(6, 5), size=6.5, color=INDIGO)
    ax6.annotate("apodo", (9, 100 * AB_TEST[8] / AB_TEST[0]), textcoords="offset points",
                 xytext=(-4, 8), size=6.5, color=VIOLET)
    ax6.set_xlabel("Posición de la slide en el wizard"); ax6.set_ylabel("% del intro")
    ax6.set_ylim(30, 105); ax6.set_xticks(list(pos)); ax6.legend(); strip(ax6)

    ax7 = fig.add_axes([L + 0.54, 0.122, 0.22, 0.118])
    finales = [100 * AB_CONTROL[-1] / AB_CONTROL[0], 100 * AB_TEST[-1] / AB_TEST[0]]
    ax7.bar(["control", "test"], finales, color=[INDIGO, VIOLET], width=0.5)
    ax7.set_ylabel("Intro → registro (%)"); ax7.set_ylim(0, 55); strip(ax7)
    for i, v in enumerate(finales):
        ax7.text(i, v + 1.5, f"{v:.0f}%", ha="center", size=7)
    ax7.text(0.5, 47, "p ≈ 0,75", ha="center", size=6.8, color=MUTED, style="italic")

    caption(fig, 0.078, 5,
            "(Izq.) Retención por posición en el wizard, como % de los que vieron el intro; el círculo "
            "marca la slide del apodo. (Der.) Conversión final: la diferencia no es distinguible del azar.")

    pdf.savefig(fig); plt.close(fig)

print(f"OK -> {OUT}")
