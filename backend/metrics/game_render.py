"""Armado del HTML del panel del minijuego.

Misma cocina que `metrics/render.py` —una sola página, oscura, sin JS, con los
SVG generados en el server— y **otra piel**: acá el formato de contenedores es el
de la versión de escritorio de `/derivemos`. Eso significa cosas concretas y no
un parecido de familia:

  - el papel cuadriculado de fondo (`GRID_BG_STYLE` del front, 40 px, blanco al
    3%), que es lo que hace que las cajas floten en vez de estar pegadas;
  - las cajas con el mismo radio, borde y superficie que las del juego
    (`rounded-lg border border-border bg-card`, o sea 8 px, `#38385a`, `#1a1a2a`);
  - la cabecera partida en dos, ancha a la izquierda y angosta a la derecha,
    igual que el bloque de marca + identidad del juego;
  - `gap` de 12 px entre cajas, que es el `gap-3` de Tailwind que usa el layout.

Es deliberado: el panel se mira inmediatamente después de jugar, y que las dos
pantallas compartan la caja hace que se lean como el mismo producto. Lo que NO se
copia es el ancho —el juego vive en 61,8rem porque tiene una sola columna de
contenido y acá hay tablas— ni la altura fija: un panel scrollea.

Las secciones están numeradas y en el orden en que conviene leerlas: primero
cuánta gente hay, después cuánto aguanta, después por qué. El motor está en el
medio y no al final a propósito — es la palanca que mueve todo lo demás.
"""
from __future__ import annotations

from datetime import date, datetime, timedelta

from . import charts as ch
from .charts import esc, num
from .game_queries import FIRST_WEEK, PHAT_LABELS

# Los tokens salen del tema del front (web/src/app/globals.css) para que el
# panel y el juego sean literalmente el mismo color y no dos azules parecidos.
# `--surface` existe además de `--card` porque charts.py lo usa para el relleno
# de los puntos huecos; apuntan al mismo valor a propósito.
CSS = """
:root{
  --bg:#131324; --card:#1a1a2a; --surface:#1a1a2a; --surface-2:#22223a;
  --border:#38385a; --fg:#f6f8fc; --muted:#a4b3c6; --grid:#26263f;
  --indigo:#5457e5; --indigo-soft:#8b8df0; --violet:#9b2fc9; --blue:#1b63d6;
  --brown:#b4652a;
  --ok:#22c55e; --warn:#f59e0b; --bad:#f97316;
}
*{box-sizing:border-box}
body{margin:0;color:var(--fg);
  background-color:var(--bg);
  /* Papel cuadriculado: el mismo GRID_BG_STYLE del juego, traducido a CSS. */
  background-image:linear-gradient(rgba(255,255,255,0.03) 1px,transparent 1px),
                   linear-gradient(90deg,rgba(255,255,255,0.03) 1px,transparent 1px);
  background-size:40px 40px;
  font-family:ui-sans-serif,system-ui,-apple-system,"Segoe UI",sans-serif;
  font-size:15px;line-height:1.55;-webkit-text-size-adjust:100%}
.wrap{max-width:1180px;margin:0 auto;padding:20px 24px 72px;
  display:flex;flex-direction:column;gap:12px}
a{color:var(--indigo-soft);text-decoration:none}
a:hover{text-decoration:underline}
:focus-visible{outline:2px solid var(--indigo-soft);outline-offset:2px;border-radius:6px}

/* La caja. Es LA pieza que se copia del juego: radio 8, borde #38385a,
   superficie #1a1a2a. Todo lo demás del panel vive adentro de una de estas. */
.box{border:1px solid var(--border);background:var(--card);border-radius:8px;padding:18px 20px}

/* Cabecera: 1fr + 400px, el mismo reparto que el header del juego (marca a la
   izquierda, identidad a la derecha). Debajo de 900px se apila. */
header.top{display:grid;gap:12px;grid-template-columns:minmax(0,1fr) 400px}
header.top .box{padding:10px 16px;display:flex;align-items:center;
  justify-content:space-between;gap:12px}
.brand{font-weight:700;font-size:17px;letter-spacing:-.02em}
.brand span{color:var(--muted);font-weight:500}
.weeknav{display:flex;gap:6px;align-items:center;font-size:13px;flex-wrap:wrap}
.weeknav a,.weeknav .cur{padding:3px 9px;border-radius:6px;border:1px solid var(--border)}
.weeknav .cur{background:var(--indigo);color:#fff;border-color:var(--indigo);font-weight:600}
nav.jump{display:flex;gap:6px;flex-wrap:wrap;font-size:12px}
nav.jump a{color:var(--muted);border:1px solid var(--border);border-radius:6px;
  padding:3px 9px;background:var(--card)}
nav.jump a:hover{color:var(--fg);text-decoration:none;border-color:var(--indigo)}

h2{font-size:12.5px;letter-spacing:.09em;text-transform:uppercase;color:var(--muted);
  font-weight:700;margin:26px 0 10px;display:flex;gap:10px;align-items:baseline}
h2 b{color:var(--indigo-soft);font-variant-numeric:tabular-nums}
h3{font-size:14.5px;margin:0 0 10px;font-weight:650}
section{display:flex;flex-direction:column;gap:12px}

.grid{display:grid;gap:12px}
/* min(Npx,100%): con auto-fit un minmax fijo mantiene el track aunque el
   contenedor sea más angosto, y la caja se sale de la pantalla en un celular. */
.g2{grid-template-columns:repeat(auto-fit,minmax(min(420px,100%),1fr))}
.g3{grid-template-columns:repeat(auto-fit,minmax(min(300px,100%),1fr))}
.g4{grid-template-columns:repeat(auto-fit,minmax(min(220px,100%),1fr))}

.kpi .label{color:var(--muted);font-size:12.5px}
.kpi .row{display:flex;align-items:flex-end;justify-content:space-between;gap:10px;margin-top:2px}
.kpi .val{font-size:31px;font-weight:750;letter-spacing:-.03em;
  font-variant-numeric:tabular-nums;line-height:1.05}
.kpi .hint{color:var(--muted);font-size:11.5px;margin-top:6px}
.chip{font-size:11.5px;font-weight:650;padding:2px 8px;border-radius:6px;
  font-variant-numeric:tabular-nums;white-space:nowrap}
.chip.up{background:rgba(34,197,94,.16);color:#5ee08a}
.chip.down{background:rgba(249,115,22,.16);color:#fb9a5c}
.chip.flat{background:var(--surface-2);color:var(--muted)}

.note{color:var(--muted);font-size:12.5px;margin:10px 0 0;
  border-left:2px solid var(--border);padding-left:11px}
.note b{color:var(--fg);font-weight:600}
.sub{color:var(--muted);font-size:13px;margin:0}
.big{font-size:26px;font-weight:750;letter-spacing:-.03em;
  font-variant-numeric:tabular-nums;line-height:1.1}

.scroll{overflow-x:auto}
table{border-collapse:collapse;width:100%;font-size:13px;
  font-variant-numeric:tabular-nums}
th,td{text-align:right;padding:7px;border-bottom:1px solid var(--border);white-space:nowrap}
th:first-child,td:first-child{padding-left:0;text-align:left}
th:last-child,td:last-child{padding-right:0}
th{color:var(--muted);font-weight:600;font-size:11px;letter-spacing:.04em;
  text-transform:uppercase}
tbody tr:last-child td{border-bottom:0}
td.dim{color:var(--muted)}
td.key{font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:12px}
/* Ejemplo de lo que genera cada plantilla. MathML nativo: lo dibuja el
   navegador, sin una línea de JS (ver _ejemplo_mathml en game_queries.py). */
math.ej{font-size:15px;color:var(--fg)}

/* Chip de universidad: el mismo del ranking del juego
   (web/src/components/university-tag.tsx). */
.tag{display:inline-flex;align-items:center;border:1px solid;border-radius:6px;
  padding:1px 7px;font-size:11.5px;font-weight:700}
.tag-plain{border-color:transparent;background:rgba(255,255,255,.1);
  color:rgba(246,248,252,.72);font-weight:600}
.pill{display:inline-block;font-size:11px;padding:1px 7px;border-radius:6px;
  background:var(--surface-2);color:var(--muted);margin-left:6px}
.empty{color:var(--muted);font-style:italic;font-size:13px;margin:8px 0}
.warn{color:#fb9a5c}
.ok{color:#5ee08a}
footer{color:var(--muted);font-size:12px;margin-top:28px;padding-top:16px;
  border-top:1px solid var(--border)}
footer b{color:var(--fg)}
@media (max-width:900px){header.top{grid-template-columns:1fr}}
@media print{body{background:#fff;color:#111}}
"""

# El chip de universidad se reusa de metrics/render.py en vez de copiar la
# lista de colores: backend/universities.py ya advierte de las tres copias que
# hay dando vueltas, y una cuarta sería la que se olvida de actualizarse.
from .render import _uni_chip  # noqa: E402

# Carreras: se reusa el mapa del panel de Intervalo, que es el que está al día
# con `CAREERS` de web/src/components/onboarding-fields.tsx. Copiarlo acá fue el
# error que hizo que el panel dijera «Salud» y «Sociales» durante un día: son
# «Ciencia» y «Tecnología», y el mapa viejo venía de un onboarding anterior.
from .render import CAREER_LABEL as _CARRERA_EMOJI  # noqa: E402

CAREER_LABEL = {k: v[1] for k, v in _CARRERA_EMOJI.items()}
CAREER_LABEL["Otra"] = "Otra / sin cargar"

# Cómo se llama cada disparador del cartel de cafecito en el código
# (desktop-layout.tsx) y qué significa en castellano.
TRIGGER_LABEL = {
    "record": "Récord personal",
    "big_climb": "Escalada de 3+ puestos",
    "milestone": "Cada 25 derivadas",
    "header_desktop": "Botón de la cabecera",
    "settings": "Panel de configuración",
    "card": "Tarjeta del CTA",
}

EVENT_LABEL = {
    "boost": "Cafecito invitado",
    "register": "Alguien se registró",
    "climb": "Escalada grande",
    "combo": "Hito de racha",
    "lead": "Cambio de puntero",
    "uni": "Sobrepaso entre universidades",
}


def _chip(d, suffix: str = "") -> str:
    if d is None:
        return '<span class="chip flat">sin base</span>'
    cls = "up" if d > 0 else ("down" if d < 0 else "flat")
    sign = "+" if d > 0 else ""
    # La diferencia entre dos porcentajes son puntos porcentuales: "-2,2%" sobre
    # un 7,1% se lee como una caída del 2% cuando cayó de 9,3 a 7,1.
    unit = " pp" if suffix == "%" else suffix
    return f'<span class="chip {cls}">{sign}{num(d, unit)}</span>'


def _kpi(c: dict) -> str:
    sfx = c["suffix"]
    return (
        f'<div class="box kpi">'
        f'<div class="label">{esc(c["label"])}</div>'
        f'<div class="row"><div class="val">{num(c["value"], sfx)}</div>'
        f'{ch.spark(c["series"])}</div>'
        f'<div class="row" style="margin-top:8px">{_chip(c["delta"], sfx)}'
        f'<span class="hint">vs. semana anterior</span></div>'
        f'<div class="hint">{esc(c["hint"])}</div></div>')


def _table(cols: list[str], rows: list[list], empty: str = "sin datos") -> str:
    if not rows:
        return f'<p class="empty">{esc(empty)}</p>'
    head = "".join(f"<th>{esc(c)}</th>" for c in cols)
    body = "".join(
        "<tr>" + "".join(
            f"<td>{c if isinstance(c, str) and c.startswith('<') else esc(c)}</td>" for c in r)
        + "</tr>" for r in rows)
    return (f'<div class="scroll"><table><thead><tr>{head}</tr></thead>'
            f'<tbody>{body}</tbody></table></div>')


def _box(title: str, body: str, note: str = "") -> str:
    h = f"<h3>{esc(title)}</h3>" if title else ""
    n = f'<p class="note">{note}</p>' if note else ""
    return f'<div class="box">{h}{body}{n}</div>'


def _section(n: int, title: str, body: str, sub: str = "", anchor: str = "") -> str:
    a = f' id="{esc(anchor)}"' if anchor else ""
    s = f'<p class="sub">{sub}</p>' if sub else ""
    return f'<section{a}><h2><b>{n}</b>{esc(title)}</h2>{s}{body}</section>'


def _pct_txt(v) -> str:
    return "—" if v is None else num(v, "%")


def _origen_chip(source: str | None) -> str:
    """Etiqueta de dónde salió un empuje.

    El grant a mano se pinta apagado y no de color: la fila entera existe para
    que se note que ese lift lo provocamos nosotros, y un chip vistoso lo haría
    competir visualmente con una donación de verdad."""
    if source == "cafecito":
        return '<span class="tag" style="border-color:#5ee08a;color:#5ee08a">donado</span>'
    return '<span class="tag tag-plain">a mano</span>'


def week_of_today() -> date:
    from .queries import local_date, week_start
    return week_start(local_date(datetime.utcnow()))


# ── Página ───────────────────────────────────────────────────────────────────

def page(p: dict, *, token: str) -> str:
    m = p["meta"]
    week = date.fromisoformat(m["week"])
    labels = m["labels"]
    semanas = [date.fromisoformat(w) for w in m["weeks"]]

    out: list[str] = ["<div class='wrap'>"]

    # Cabecera: dos cajas, ancha + angosta, igual que el header del juego.
    today = week_of_today()
    nav = []
    for i in range(4, -1, -1):
        # Sin bajar del piso del panel: ofrecer semanas anteriores a la difusión
        # es ofrecer ceros estructurales con forma de historia.
        w = today - timedelta(weeks=i)
        if w < FIRST_WEEK:
            continue
        lab = w.strftime("%d/%m")
        nav.append(f'<span class="cur">{lab}</span>' if w == week else
                   f'<a href="/panel/{esc(token)}/derivemos?w={w.isoformat()}">{lab}</a>')
    out.append(
        "<header class='top'>"
        "<div class='box'><div class='brand'>Derivemos <span>· panel</span></div>"
        f"<div class='weeknav'>{''.join(nav)}</div></div>"
        f"<div class='box'><span class='sub'>{num(m['estudiantes'])} estudiantes · "
        f"{num(m['respuestas'])} respuestas</span>"
        f"<a href='/panel/{esc(token)}'>Panel de Intervalo →</a></div>"
        "</header>")

    jump = "".join(
        f'<a href="#{a}">{esc(t)}</a>' for a, t in [
            ("embudo", "Embudo"), ("profundidad", "Profundidad"), ("motor", "Motor"),
            ("plantillas", "Plantillas"), ("sesiones", "Sesiones"), ("cafecito", "Cafecito"),
            ("rivalidad", "Rivalidad"), ("difusion", "Difusión"),
            ("dispositivo", "Dispositivo"), ("entrada", "Entrada")])
    out.append(f"<nav class='jump'>{jump}</nav>")

    # ── 0 · Titulares ────────────────────────────────────────────────────────
    out.append(_section(
        0, f"Titulares · semana del {labels[-1]}",
        f'<div class="grid g4">{"".join(_kpi(c) for c in p["headline"])}</div>',
        sub="El sparkline son las semanas visibles. Los estudiantes sembrados "
            f"({num(m['bots_excluidos'])} filas) están excluidos de todo el panel."))

    # ── 1 · Embudo ───────────────────────────────────────────────────────────
    f = p["funnel"]
    def nota(s: dict) -> str:
        if s["pct_prev"] is not None:
            return f'{num(s["pct_prev"], "%")} del paso anterior'
        # Los pasos que no están anidados se leen contra la cohorte: es el único
        # denominador que significa algo para ellos.
        if not s["cadena"] and s["pct_base"] is not None:
            return f'{num(s["pct_base"], "%")} de la cohorte'
        return ""

    rows = [{"label": s["label"], "value": s["n"], "note": nota(s)} for s in f["steps"]]
    out.append(_section(
        1, "Embudo de la partida",
        _box("", ch.hbars(rows, colors=["var(--indigo)"]),
             note="<b>Arranca en «abrió el juego»</b> y no en «vio el link»: la fila del estudiante "
                  "se crea en la primera carga de la página, así que todo lo anterior —cuánta "
                  "gente vio el mensaje de WhatsApp, cuánta tocó y no llegó a cargar— solo lo "
                  "sabe PostHog. Preferimos que el embudo empiece tarde y sea cierto."
                  "<br><br>Los pasos <b>no son excluyentes ni están ordenados en el tiempo</b>: "
                  "«cargó universidad» pasa alrededor de la quinta derivada y «se registró» "
                  "alrededor de la doceava, pero alguien que llega registrado desde Intervalo "
                  "cuenta en los dos desde el minuto cero."),
        sub=f"Cohorte de los {num(f['base'])} estudiantes que abrieron el juego en la semana del "
            f"{labels[-1]}, seguida hasta hoy.",
        anchor="embudo"))

    # ── 2 · Profundidad ──────────────────────────────────────────────────────
    pr = p["profundidad"]
    curva = pr["curva"]
    serie_surv = [{
        "label": "Siguen jugando",
        "values": [c["pct"] for c in curva],
        "tips": [f'{c["vivos"]} de {pr["base"]} llegaron a responder {c["k"]} derivadas '
                 f'({_pct_txt(c["pct"])}).\n'
                 f'De los que llegaron a la {c["k"]}, {_pct_txt(c["abandono"])} no hizo la '
                 f'siguiente.' for c in curva],
        # Menos de 10 partidas vivas: el porcentaje se mueve entero con una
        # persona y se dibuja punteado para que no se lea como tendencia.
        "weak": [c["vivos"] < 10 for c in curva],
    }]
    hitos_rows = [[f'#{h["k"]}', num(h["vivos"]), _pct_txt(h["pct"]),
                   {5: "se pide la universidad", 12: "se pide el registro",
                    25: "aparece el cafecito"}.get(h["k"], "")]
                  for h in pr["hitos"]]
    peor = pr["peor_escalon"]
    peor_txt = (f'El escalón más grande del tramo 1–20 está en la derivada '
                f'<b>#{peor["k"]}</b>: de los {peor["vivos"]} que llegaron ahí, '
                f'{_pct_txt(peor["abandono"])} no hizo la siguiente.'
                if peor else "Todavía no hay base para señalar un escalón.")
    out.append(_section(
        2, "Profundidad de partida",
        '<div class="grid g2">'
        + _box("Cuántos siguen jugando en la derivada k",
               ch.lines(serie_surv, [str(c["k"]) for c in curva], suffix="%", height=280,
                        y_max=100, legend=False),
               note=peor_txt + "<br><br>Solo entran <b>partidas cerradas</b> (nadie que haya "
                    "respondido en las últimas 24 h): quien está jugando ahora todavía puede "
                    f"sumar derivadas, y contarlo hundiría la cola por reloj y no por "
                    f'comportamiento. Quedaron afuera {num(pr["abiertos"])} partidas abiertas.')
        + _box("Los hitos", _table(["Derivada", "Llegaron", "% de la base", ""], hitos_rows)
               + '<p class="note">'
               + (f'Mediana <b>{num(pr["mediana"])}</b> derivadas · p90 <b>{num(pr["p90"])}</b>. '
                  if pr["base"] else
                  'Todavía no hay ninguna partida cerrada en esta ventana. ')
               + 'Los tres hitos marcados son los que el producto usa para interrumpir la '
                 'partida: si el escalón de abandono coincide con uno, el juego se está '
                 'pinchando solo.</p>')
        + "</div>",
        sub="Es la métrica del juego. El Elo, el ranking y el cafecito existen para mover esta "
            "curva, así que conviene mirarla antes que a ellos.",
        anchor="profundidad"))

    # ── 3 · El motor ─────────────────────────────────────────────────────────
    mo = p["motor"]
    cal = mo["calibracion"]
    cal_series = [
        {"label": "Predicho por el modelo", "values": [c["predicho"] for c in cal]},
        {"label": "Acierto real", "values": [c["observado"] for c in cal],
         "tips": [f'{c["label"]}: {c["n"]} respuestas.\nEl modelo esperaba '
                  f'{_pct_txt(c["predicho"])} y salió {_pct_txt(c["observado"])}.' for c in cal],
         "weak": [c["n"] < 30 for c in cal]},
    ]
    cont = mo["continuidad"]
    cont_series = [
        {"label": "Después de acertar", "values": [c["ok"] for c in cont],
         "weak": [c["ok_n"] < 30 for c in cont]},
        {"label": "Después de errar", "values": [c["mal"] for c in cont],
         "weak": [c["mal_n"] < 30 for c in cont]},
    ]
    esc_series = [{"label": "θ mediano", "values": [e["theta"] for e in mo["escalera"]],
                   "weak": [e["estudiantes"] < 10 for e in mo["escalera"]]}]

    peor = max(cal, key=lambda c: abs((c["observado"] or 0) - (c["predicho"] or 0))
               if c["n"] else -1)
    out.append(_section(
        3, "El motor de dificultad",
        _box("¿Está calibrado? — lo que el modelo promete contra lo que pasa",
             ch.lines(cal_series, list(PHAT_LABELS), suffix="%", height=330, y_max=100),
             note='<b>Cómo se lee.</b> Cada punto del eje horizontal es un grupo de derivadas '
                  'servidas, agrupadas por lo que el modelo predijo. La línea de abajo es esa '
                  'promesa; la de arriba, lo que realmente pasó. <b>Si el modelo estuviera '
                  'perfecto, las dos líneas serían la misma.</b>'
                  '<br><br>La distancia entre ellas es el error: si la de arriba va por encima, '
                  'el modelo <b>subestima</b> a la gente — cree que una derivada es más difícil '
                  'de lo que es, y termina sirviendo más fácil de lo que quería. Al revés, la '
                  'sobreestima y sirve más difícil.'
                  f'<br><br>Hoy el error medio es <b>{_pct_txt(mo["ece"])}</b> (diferencia '
                  f'absoluta promedio, pesada por cuántas derivadas hay en cada grupo). '
                  + (f'Donde más se separa es en «{esc(peor["label"])}»: prometía '
                     f'{_pct_txt(peor["predicho"])} y salió {_pct_txt(peor["observado"])}. '
                     if peor["n"] else "")
                  + '<b>Es lo primero a mirar de toda la sección</b>: si el modelo no sabe '
                    'predecir, la banda objetivo no significa nada y el resto mide otra cosa.')
        + _box("¿Le pega a la banda? — qué tan difícil salió lo que se sirvió",
               ch.stack([{"label": h["label"], "n": h["n"]} for h in mo["histograma"]]),
               note=f'<b>Cómo se lee.</b> Cada franja es una porción de las '
                    f'{num(mo["servidos"])} derivadas servidas, agrupadas por dificultad. La '
                    f'franja «70–80%» es la que el generador estaba buscando; todo lo demás es '
                    f'lo que sirvió cuando no encontró nada mejor.'
                    f'<br><br>Hoy le pega al <b>{_pct_txt(mo["en_banda"])}</b>. Errarle con el '
                    f'modelo bien calibrado <b>no es culpa del Elo sino del banco</b>: con 26 '
                    f'plantillas y la regla de no repetir las últimas 3, a veces no hay nada en '
                    f'banda para servir y hay que dar lo más cercano. Si esta franja no crece al '
                    f'sumar plantillas, entonces sí es el motor.')
        + _box("¿La banda es la correcta? — qué dificultad hace que sigan jugando",
               ch.lines(cont_series, list(PHAT_LABELS), suffix="%", height=330, y_max=100),
               note="<b>Cómo se lee.</b> De todas las derivadas de cada dificultad, qué fracción "
                    "fue <b>seguida por otra derivada</b>. O sea: cuántos siguieron jugando "
                    "después de esa. Alto es bueno."
                    "<br><br><b>Es la única pregunta que el modelo no puede contestarse solo.</b> "
                    "El Elo predice acierto; nosotros queremos retención, y que la derivada que "
                    "retiene sea la que se saca 3 de cada 4 veces es una <b>hipótesis</b> que "
                    "está escrita a mano en el código. Este gráfico es lo que la puede refutar: "
                    "<b>donde esté el pico, ahí va la banda.</b> Si cae más a la derecha, "
                    "conviene servir más fácil de lo que creemos."
                    "<br><br>Las dos líneas separan por resultado a propósito. Si errar una fácil "
                    "espanta más que errar una difícil, el problema no es la dificultad sino la "
                    "expectativa rota — y eso se arregla con copy, no moviendo el motor.")
        + _box("La escalera — cuánto aprende la gente a medida que juega",
               ch.lines(esc_series, [str(e["n"]) for e in mo["escalera"]], suffix="",
                        height=330, legend=False),
               note=f'<b>Cómo se lee.</b> El eje horizontal es cuántas derivadas lleva '
                    f'respondidas alguien, y la línea es el θ —la habilidad que el modelo le '
                    f'atribuye— de la persona mediana en ese punto. No es una persona siguiendo '
                    f'su camino: es una foto de todos, ordenada por experiencia.'
                    f'<br><br>La escala se lee contra los cortes de nivel del ranking: '
                    f'<b>0,3</b> es «las sumas ya salen cómodas», <b>1,6</b> «los productos» y '
                    f'<b>2,2</b> «los cocientes». Que suba significa que el motor está '
                    f'aprendiendo quién es cada uno; <b>si quedara plana en 0, no estaría '
                    f'aprendiendo nada</b> y todos recibirían el mismo juego.'
                    f'<br><br>Hoy el θ mediano de los {num(mo["con_elo"])} estudiantes con '
                    f'historial es <b>{num(mo["theta_mediano"])}</b>. El tramo punteado es donde '
                    f'quedan menos de diez personas: ahí la mediana se mueve con cada respuesta '
                    f'y conviene no leer la forma.')
        + _box("Los escapes — qué hacen cuando no les sale",
               _table(["Dificultad", "Servidas", "Salteos", "% salteo"],
                      [[b["label"], num(h["n"]), num(b["n"]), _pct_txt(b["pct"])]
                       for b, h in zip(mo["salteo_por_bin"], mo["histograma"])]),
               note=f'El juego tiene dos salidas para cuando una derivada no sale: saltearla, '
                    f'y abrir la tabla de derivadas. Se saltea el '
                    f'<b>{_pct_txt(mo["salteo_pct"])}</b> de lo servido y se mira la tabla en el '
                    f'<b>{_pct_txt(mo["peek_pct"])}</b>.'
                    f'<br><br><b>Cómo se lee.</b> Si el salteo se concentra en una dificultad, '
                    f'ese grupo está mal servido y hay que mirar qué plantillas cayeron ahí. Si '
                    f'crece parejo en todas, el problema no son las plantillas sino la banda: se '
                    f'está sirviendo difícil en general.'
                    f'<br><br>Ninguna de las dos ensucia el Elo —saltear baja θ sin tocar β, y '
                    f'mirar la tabla no actualiza nada— pero las dos son señal, y la más honesta '
                    f'que hay: es la persona diciendo «esta no» sin tener que preguntarle.'),
        sub="p̂ es la probabilidad que el modelo le asigna a que este estudiante acierte esta "
            "derivada al primer intento. El generador apunta a servir siempre entre 70% y 80%.",
        anchor="motor"))

    # ── 4 · Plantillas ───────────────────────────────────────────────────────
    pl = p["plantillas"]
    # El acierto real de una plantilla con tres respuestas es ruido con formato
    # de dato: se dibuja apagado para que no se lea como un hallazgo.
    def p1_cell(r: dict) -> str:
        """El acierto real, teñido por cuánto se aparta de lo que el modelo cree.

        El heatmap va acá y no en el valor absoluto porque un 92% no es bueno ni
        malo por sí solo: lo que importa es si el modelo lo vio venir. Verde =
        el motor le acertó a esta plantilla; naranja = todavía no la entiende.

        Suave a propósito (alfa 0.10–0.22): es una guía para el ojo, no una
        alarma. Y solo se pinta con base suficiente — teñir una fila de tres
        respuestas sería darle color a ruido."""
        txt = _pct_txt(r["p1"])
        if r["n"] < 20:
            return f'<span style="color:var(--muted)">{txt}</span>'
        if r["p1"] is None or r["p_hat"] is None:
            return txt
        brecha = abs(r["p1"] - r["p_hat"])
        # 0 pt → sin color; 20 pt o más → tope. Lineal en el medio.
        fuerza = min(brecha / 20.0, 1.0)
        rgb = "249,115,22" if brecha >= 10 else "34,197,94"
        alfa = 0.10 + 0.12 * fuerza
        return (f'<span title="el modelo esperaba {_pct_txt(r["p_hat"])}" '
                f'style="background:rgba({rgb},{alfa:.2f});border-radius:4px;'
                f'padding:2px 6px">{txt}</span>')

    def ejemplo_cell(r: dict) -> str:
        if not r["ejemplo"]:
            return '<span class="dim">—</span>'
        return f'<math class="ej" xmlns="http://www.w3.org/1998/Math/MathML">{r["ejemplo"]}</math>'

    filas = [[f'<span class="key">{esc(r["key"])}</span>',
              ejemplo_cell(r),
              f'T{r["tier"]}' if r["tier"] is not None else "—",
              num(r["servidos"]), _pct_txt(r["p_hat"]), num(r["n"]), p1_cell(r),
              num(r["beta"]), _pct_txt(r["salteo"]),
              "—" if r["seg"] is None else num(r["seg"], " s")]
             for r in pl["filas"]]
    desvios = pl["desvios"]
    desv_txt = ("Ninguna plantilla con base suficiente se aparta más de 10 puntos de lo que el "
                "modelo cree." if not desvios else
                "Se apartan más de 10 puntos: " + ", ".join(
                    f'<b>{esc(d["key"])}</b> (cree {_pct_txt(d["p_hat"])}, sale '
                    f'{_pct_txt(d["p1"])})' for d in desvios) + ".")
    out.append(_section(
        4, "Plantillas",
        _box("", _table(
            ["Plantilla", "Ejemplo", "Tier", "Servidas", "p̂ medio", "Respuestas",
             "Acierto real", "β", "% salteo", "Mediana"], filas),
            note=f'<b>La columna «acierto real» está teñida por cuánto se aparta de lo que el '
                 f'modelo esperaba</b>, no por su valor: un 92% no es bueno ni malo solo, lo que '
                 f'importa es si el motor lo vio venir. Verde, le acertó; naranja, todavía no '
                 f'entiende esa plantilla. Las filas con poca base van en gris y sin teñir.'
                 f'<br><br>{desv_txt}<br><br><b>β es el estado del modelo</b> y «acierto real» son los '
                 f'hechos: ponerlos al lado es lo que deja ver dónde el motor todavía no aprendió. '
                 f'Las plantillas con menos de 20 respuestas ({num(len(pl["verdes"]))} de '
                 f'{num(pl["total"])}) siguen casi con la β semilla de su tier, así que su p̂ es '
                 f'una creencia y no una medición: no vale la pena tocarlas a mano todavía. '
                 f'Cubiertas hasta ahora: {num(pl["cubiertas"])} de {num(pl["total"])}.'),
        sub="Una fila por plantilla generadora. El acierto real excluye los ejercicios "
            "respondidos con la tabla abierta.",
        anchor="plantillas"))

    # ── 5 · Sesiones ─────────────────────────────────────────────────────────
    se = p["sesiones"]
    ses_rows = [[lab, num(r["sesiones"]), num(r["estudiantes"]), num(r["por_estudiante"]),
                 num(r["derivadas_mediana"]), num(r["minutos_mediana"], " min"),
                 num(r["minutos_p90"], " min"), _pct_txt(r["rebote"])]
                for lab, r in zip(labels, se["filas"])]
    vue_rows = [[lab, num(r["n"]), _pct_txt(r["otro_dia"]), _pct_txt(r["otra_semana"])]
                for lab, r in zip(labels, se["vuelta"])]
    out.append(_section(
        5, "Sesiones y vuelta",
        '<div class="grid g2">'
        + _box("Sesiones reconstruidas",
               _table(["Semana", "Sesiones", "Estudiantes", "Por estudiante", "Derivadas (med.)",
                       "Duración (med.)", "p90", "Rebote"], ses_rows),
               note="El juego no persiste sesiones: se entra por un link y se juega hasta que "
                    "uno se cansa. Acá una <b>sesión es una tanda de respuestas separadas por "
                    "menos de 30 minutos</b>, y eso hay que leerlo sabiendo qué es: una pausa "
                    "de cuarenta minutos con la pestaña abierta cuenta como dos sesiones. "
                    "<b>Rebote</b> es la sesión de una sola respuesta — abrió, contestó, se fue.")
        + _box("Vuelta",
               _table(["Cohorte", "Jugaron", "Volvió otro día", "Volvió otra semana"], vue_rows),
               note="Sobre los que llegaron a jugar, no sobre los que abrieron: quien nunca "
                    "respondió nada no tiene nada que repetir, y cuánta gente llega a jugar ya "
                    "lo mide el embudo.")
        + "</div>",
        anchor="sesiones"))

    # ── 6 · Cafecito ─────────────────────────────────────────────────────────
    ca = p["cafecito"]
    caf_rows = [[lab, num(r["impresiones"]), num(r["vieron"]), num(r["clicks"]),
                 _pct_txt(r["ctr"]), num(r["empujes"]), num(r["cafecitos"]),
                 num(r["por_click"]),
                 # Apagada: es contabilidad nuestra, no del producto. Está en la
                 # tabla para que el cero de una semana sin pruebas se vea, no
                 # para leerla al lado de los donados.
                 f'<span class="dim">{num(r["manuales"])}</span>']
                for lab, r in zip(labels, ca["filas"])]
    trig_rows = [[esc(TRIGGER_LABEL.get(t["trigger"], t["trigger"])), num(t["impresiones"]),
                  num(t["clicks"]), _pct_txt(t["ctr"]), num(t["solved_mediana"])]
                 for t in ca["por_trigger"]]
    ven_rows = [[_uni_chip(v["university"]),
                 (v["inicio"].strftime("%d/%m %H:%M") if v["inicio"] else "—"),
                 _origen_chip(v["source"]),
                 esc(v["donante"] or "—"),
                 num(v["cafecitos"]), num(v["estudiantes"]), num(v["respuestas"]),
                 num(v["ritmo"]), num(v["basal"]),
                 ("—" if v["lift"] is None else
                  f'<span class="{"ok" if v["lift"] > 0 else "warn"}">{num(v["lift"], "%")}</span>')]
                for v in ca["ventanas"]]
    sh = ca["share"]
    out.append(_section(
        6, "Cafecito",
        _box("El embudo, semana a semana",
             _table(["Semana", "Impresiones", "Lo vieron", "Clicks", "CTR", "Empujes",
                     "Cafecitos", "Cafecitos/click", "A mano"], caf_rows),
             note="<b>«Cafecitos» son solo los donados de verdad</b> — los que entraron por el "
                  "oyente del stream de Cafecito (<code>source = \"cafecito\"</code>). La última "
                  "columna son los <b>grants que insertamos nosotros</b> con "
                  "<code>scripts/grant_game_boost.py</code> para probar la mecánica, y no entran "
                  "en ningún otro número de esta caja. En el primer día de producción eran 20 de "
                  "35, y mezclados daban un «cafecitos por click» de 1,67 — más cafecitos que "
                  "clicks, que no puede pasar."
                  "<br><br><b>Lo que esto no puede separar:</b> la alerta de prueba de Cafecito "
                  "llega por el mismo canal y con el mismo origen que una donación real. Se "
                  "reconoce por el nombre —la plataforma la manda como «Juan Carlos»— y por eso "
                  "el donante aparece en la tabla de empujes de más abajo."
                  "<br><br>El CTR se calcula sobre <b>personas</b> y no sobre impresiones: el "
                  "cartel se le muestra varias veces a la misma persona y contar impresiones "
                  "haría bajar el número por mostrarlo más, que es lo contrario de lo que se "
                  "quiere medir.")
        + '<div class="grid g2">'
        + _box("Qué disparador convierte",
               _table(["Disparador", "Impresiones", "Clicks", "CTR", "Derivadas (med.)"],
                      trig_rows, empty="todavía no se mostró ningún cartel"),
               note="El cartel sale por récord personal, por escalada de 3+ puestos o cada 25 "
                    "derivadas. «Derivadas (med.)» es en qué momento de la partida se mostró: "
                    "un disparador que convierte bien pero aparece tardísimo está dejando plata "
                    "sobre la mesa.")
        + _box("Compartir",
               f'<div class="big">{_pct_txt(sh["ctr"])}</div>'
               f'<p class="sub">{num(sh["clicks"])} clicks sobre {num(sh["impresiones"])} '
               f'impresiones del botón de compartir.</p>',
               note="Es el otro CTA y el que mueve el crecimiento. Va acá y no en Difusión "
                    "porque compite por el mismo lugar de la pantalla que el cafecito: si uno "
                    "sube a costa del otro, se ve en estos dos números juntos.")
        + "</div>"
        + _box("¿Sirve el empuje?",
               _table(["Universidad", "Arrancó", "Origen", "Donante", "Cafecitos", "Estudiantes",
                       "Respuestas", "Ritmo", "Basal", "Diferencia"], ven_rows,
                      empty="todavía no hubo ningún empuje"),
               note="<b>Acá los grants a mano SÍ conviven con las donaciones</b>, y a propósito: "
                    "la pregunta de esta tabla es si la universidad impulsada juega más, y para "
                    "eso un grant a mano es un experimento perfectamente válido — de hecho es el "
                    "único que podemos provocar cuando queremos. El origen va al lado para que "
                    "nadie lea el lift de una prueba nuestra como si fuera el de una donación."
                    "<br><br><b>Ritmo</b> = respuestas por estudiante activo por hora durante la ventana de "
                    "30 minutos. <b>Basal</b> = la mediana de ese mismo ritmo para la MISMA "
                    "universidad fuera de toda ventana. Se compara contra sí misma y no contra las "
                    "otras universidades porque los tamaños son muy distintos y la comparación "
                    "cruzada terminaría midiendo sobre todo el tamaño."
                    "<br><br>Con pocos empujes esto <b>no es un experimento</b>: el empuje se "
                    "dispara justo cuando alguien estaba jugando lo suficiente como para querer "
                    "donar, así que la diferencia mezcla el efecto con el momento. Para separarlo "
                    "hace falta programar empujes en horarios al azar, y eso recién vale la pena "
                    "con volumen."),
        sub=f"{num(ca['total_cafecitos'])} cafecitos donados en {num(ca['empujes'])} empujes desde "
            f"que existe la mecánica"
            + (f", más {num(ca['total_manuales'])} en {num(ca['empujes_manuales'])} grants a mano "
               f"que no cuentan como ingreso." if ca["total_manuales"] else "."),
        anchor="cafecito"))

    # ── 7 · Rivalidad ────────────────────────────────────────────────────────
    ri = p["rivalidad"]
    uni_rows = [[_uni_chip(u["university"]), num(u["estudiantes"]), num(u["xp_per_player"]),
                 num(u["xp"]), num(u["derivadas"]), _pct_txt(u["p1"]),
                 _pct_txt(u["registrados"])]
                for u in ri["universidades"]]
    ev_rows = [[esc(EVENT_LABEL.get(e["kind"], e["kind"])), num(e["n"])] for e in ri["eventos"]]
    car_rows = [[esc(CAREER_LABEL.get(c["label"], c["label"])), num(c["n"])]
                for c in ri["carreras"]]
    out.append(_section(
        7, "Rivalidad",
        _box("Universidades",
             _table(["Universidad", "Estudiantes", "XP por estudiante", "XP total", "Derivadas",
                     "Acierto", "Registrados"], uni_rows,
                    empty="nadie cargó su universidad todavía"),
             note="Ordenado por <b>XP por estudiante</b>, que es exactamente el número que muestra "
                  "el ranking del juego. Ordenar por uno y mostrar otro se lee como un bug, y "
                  "ordenar por XP total haría ganar siempre a la universidad más grande.")
        + '<div class="grid g2">'
        + _box("¿Está vivo el ranking?",
               f'<div class="big">{_pct_txt(ri["top10"])}</div>'
               f'<p class="sub">del XP está en el top 10, sobre '
               f'{num(ri["estudiantes_con_xp"])} estudiantes con XP.</p>'
               + _table(["Evento del feed", "Veces"], ev_rows,
                        empty="el feed todavía no registró nada"),
               note="Un ranking muy concentrado deja de motivar: el número 200 no tiene a quién "
                    "alcanzar. Los eventos del feed son la evidencia directa de que el orden se "
                    "mueve — si los sobrepasos se apagan, el marcador dejó de ser un motivo "
                    "para volver aunque el XP siga subiendo.")
        + _box("Carreras", _table(["Carrera", "Estudiantes"], car_rows))
        + "</div>",
        anchor="rivalidad"))

    # ── 8 · Difusión ─────────────────────────────────────────────────────────
    di = p["difusion"]
    ori_rows = [[esc(r["label"]), num(r["n"]), _pct_txt(r["jugaron"]), _pct_txt(r["llegan_10"]),
                 _pct_txt(r["registrados"]), _pct_txt(r.get("fuera"))] for r in di["origen"]]
    utm_rows = [[esc(r["label"]), num(r["n"]), _pct_txt(r["jugaron"]),
                 _pct_txt(r["llegan_10"]), _pct_txt(r["registrados"])] for r in di["utm"]]
    out.append(_section(
        8, "Difusión",
        '<div class="grid g2">'
        + _box("Por grupo de origen",
               _table(["Origen del link", "Estudiantes", "Jugaron", "Llegan a 10", "Registrados",
                       "Otra universidad"], ori_rows),
               note="El prefijo del id de grupo es <b>dónde se plantó el link</b>, no la universidad "
                    "de la persona. «Otra universidad» son los que declaran una distinta de la del "
                    "grupo: eso es el link viajando por fuera del grupo original, que es la "
                    "señal de viralidad más barata que tenemos.")
        + _box("Por utm_source",
               _table(["Fuente", "Estudiantes", "Jugaron", "Llegan a 10", "Registrados"], utm_rows))
        + "</div>",
        sub=f"{num(di['nuevos'])} estudiantes nuevos en las semanas visibles.",
        anchor="difusion"))

    # ── 9 · Dispositivo ──────────────────────────────────────────────────────
    de = p["dispositivo"]
    sem_rows = [[lab, num(r["n"]), num(r["android"]), num(r["ios"]), num(r["desktop"]),
                 num(r["sin_dato"]), _pct_txt(r["pct_telefono"])]
                for lab, r in zip(labels, de["por_semana"])]
    comp_rows = [[esc(r["label"]), num(r["estudiantes"]), num(r["derivadas_mediana"]),
                  _pct_txt(r["p1"]), _pct_txt(r["llegan_10"]),
                  "—" if r["seg"] is None else num(r["seg"], " s"),
                  _pct_txt(r["salteo"]), _pct_txt(r["peek"]),
                  # El parseo es la columna que puede mandar a rehacer el input
                  # del teléfono, así que se resalta cuando se dispara.
                  ("—" if r["parse"] is None else
                   f'<span class="warn">{num(r["parse"], "%")}</span>' if r["parse"] >= 5
                   else num(r["parse"], "%")),
                  _pct_txt(r["rebote"]), _pct_txt(r["registrados"])]
                 for r in de["filas"]]
    curvas = de["curvas"]
    curva_series = [{
        "label": f'{c["label"]} (n={c["base"]})',
        "values": [pt["pct"] for pt in c["puntos"]],
        "tips": [f'{c["label"]}: {pt["vivos"]} de {c["base"]} llegaron a la derivada {pt["k"]}.'
                 for pt in c["puntos"]],
        "weak": [pt["vivos"] < 10 for pt in c["puntos"]],
    } for c in curvas]
    cta_rows = [[esc(c["label"]), num(c["vieron"]), num(c["clickearon"]), _pct_txt(c["ctr"])]
                for c in de["cta"]]
    medianas = " · ".join(f'{esc(c["label"])} <b>{num(c["mediana"])}</b>' for c in curvas)

    out.append(_section(
        9, "Dispositivo",
        _box("Con qué aparato aparecen",
             _table(["Semana", "Altas", "Android", "iOS", "Escritorio", "Sin dato",
                     "% teléfono"], sem_rows)
             + (ch.stack([{"label": r["label"], "n": r["n"]} for r in de["reparto"]])
                if de["reparto"] else ""),
             note="Lo manda el cliente en un header y no se deduce del <code>User-Agent</code>: "
                  "el layout lo elige <code>getPlatform()</code>, que además del UA mira "
                  "<code>maxTouchPoints</code> porque un iPad se reporta como Macintosh y juega "
                  "el flujo de teléfono. Deducirlo en el server diría «escritorio» para alguien "
                  "que está jugando con el dedo. El cliente es la autoridad porque es el que "
                  "decidió."
                  "<br><br><b>«% teléfono» se calcula sobre los que tienen dato</b>, no sobre la "
                  f'cohorte: hay {num(de["sin_dato"])} altas anteriores a la columna y meterlas '
                  "en el denominador haría bajar el porcentaje por una razón de calendario.")
        + _box("¿Se comportan distinto?",
               _table(["Aparato", "Estudiantes", "Derivadas (med.)", "Acierto", "Llegan a 10",
                       "Mediana", "% salteo", "% tabla", "% ilegible", "Rebote", "Registrados"],
                      comp_rows),
               note="<b>Hay dos unidades en esta tabla y no se pueden mezclar.</b> «Estudiantes», "
                    "«llegan a 10», «rebote» y «registrados» se cuentan por <b>persona</b>, con "
                    "el aparato del primer contacto: son hechos de alguien, no de una respuesta. "
                    "«Acierto», «mediana», «% salteo», «% tabla» y «% ilegible» se cuentan por "
                    "<b>ejercicio</b>, con el aparato desde el que se pidió — quien arranca en el "
                    "colectivo y sigue en la compu suma en los dos lados. Son dos preguntas "
                    "distintas y por eso conviven."
                    "<br><br><b>«% ilegible» es la columna a mirar primero.</b> El teclado "
                    "matemático sobre una pantalla táctil es otro producto: si el teléfono se "
                    "despega del escritorio acá, lo que pierde gente no es la dificultad sino el "
                    "input, y eso se arregla en otro lado. La «mediana» es de segundos por "
                    "respuesta y en el teléfono va a ser más alta por escribir, no por pensar — "
                    "lo que importa es la brecha, no el valor.")
        + '<div class="grid g2">'
        + _box("Cuántos aguantan, por aparato",
               ch.lines(curva_series, [str(k) for k in range(1, len(curvas[0]["puntos"]) + 1)],
                        suffix="%", height=270, y_max=100)
               if curva_series else '<p class="empty">todavía no hay partidas cerradas con '
                                    'aparato registrado</p>',
               note=(f'Mediana de derivadas por partida: {medianas}. ' if medianas else "")
                    + "Misma definición que la sección 2 —solo partidas cerradas— cortada por el "
                      "aparato de primer contacto. Es la respuesta más directa a la pregunta: "
                      "aguantar más o menos derivadas es de lo que se trata el juego. Si el "
                      "teléfono cae antes y el «% ilegible» de la tabla de arriba también está "
                      "alto, las dos cosas son la misma cosa.")
        + _box("Cafecito por aparato",
               _table(["Aparato", "Lo vieron", "Lo tocaron", "CTR"], cta_rows,
                      empty="todavía no se mostró el cartel")
               + f'<p class="sub" style="margin-top:10px">{num(de["cambiaron"])} de '
                 f'{num(de["con_aparato"])} estudiantes jugaron desde más de un aparato.</p>',
               note="Donar desde el teléfono es abrir otra app y volver; desde la compu es una "
                    "pestaña más. <b>Si el CTR se parte fuerte acá, lo que le falta al cafecito "
                    "es menos fricción y no mejor copy.</b>"
                    "<br><br>Cambiar de aparato es la señal más fuerte de que alguien volvió a "
                    "propósito: nadie cambia de dispositivo por accidente.")
        + "</div>",
        sub=f"Sobre los {num(de['nuevos'])} estudiantes nuevos de las semanas visibles.",
        anchor="dispositivo"))

    # ── 10 · Entrada ─────────────────────────────────────────────────────────
    en = p["entrada"]
    ileg_rows = [[f'<code>{esc(i["texto"])}</code>', num(i["n"])] for i in en["ilegibles"]]
    t_rows = [[t["label"], num(t["n"]),
               "—" if t["seg"] is None else num(t["seg"], " s")]
              for t in en["tiempo_por_dificultad"] if t["n"]]
    out.append(_section(
        10, "Entrada",
        '<div class="grid g2">'
        + _box("Fricción del teclado matemático",
               f'<div class="big">{_pct_txt(en["pct_fallos"])}</div>'
               f'<p class="sub">de los {num(en["intentos"])} envíos no los entendió el parser '
               f'({num(en["fallos"])} en total). Le pasó al '
               f'{_pct_txt(en["estudiantes_con_fallo"])} de los que jugaron.</p>',
               note="Una respuesta que no parsea se ve, del otro lado de la pantalla, igual que "
                    "una equivocada: la persona escribió algo, el juego le dijo que no, y se "
                    "fue. <b>Es la única parte del juego donde el que pierde no es el "
                    "estudiante</b>, y por eso tiene sección propia. No consume intento ni "
                    "mueve el Elo."
                    "<br><br>La tasa sobre envíos y sobre personas dicen cosas distintas: si la "
                    "primera es baja y la segunda alta, es poca gente chocando muchas veces "
                    "contra el mismo símbolo — y eso se arregla mirando la tabla de al lado.")
        + _box("Qué escribieron que no se entendió",
               _table(["Lo que se envió", "Veces"], ileg_rows,
                      empty="nada quedó sin entender en esta ventana"),
               note="<b>Es la lista de arreglos pendientes del parser, escrita por los "
                    "usuarios.</b> Cada fila es o una notación válida que no aceptamos, o una "
                    "tecla que falta, o un símbolo que el teclado deja escribir y el parser no "
                    "sabe leer — los tres son bugs nuestros, no errores de nadie."
                    "<br><br>Se agrupa por texto porque el mismo símbolo imposible se reintenta "
                    "varias veces antes de abandonar: un texto con muchas repeticiones es una "
                    "persona peleando, no un error suelto.")
        + "</div>"
        + '<div class="grid g2">'
        + _box("Ritmo",
               _table(["", ""],
                      [["Rápido (p25)", num(en["seg_p25"], " s")],
                       ["Mediana", num(en["seg_mediana"], " s")],
                       ["Lento (p90)", num(en["seg_p90"], " s")],
                       ["Menos de 3 s", _pct_txt(en["relampago"])],
                       ["Van a un segundo intento", _pct_txt(en["segundo_intento"])],
                       ["…y lo aciertan",
                        f'{_pct_txt(en["rescate"])} <span class="dim">de {num(en["rescate_n"])}</span>']]),
               note=f'<b>«Menos de 3 s» no da para leer la derivada y escribirla</b>: o la sabía '
                    f'de memoria —las de tier bajo salen así— o tiró cualquier cosa. Si ese '
                    f'número crece junto con el salteo, hay gente pasando de largo.'
                    f'<br><br><b>El rescate es el que decide si dar dos intentos sirve.</b> Si '
                    f'el segundo casi nunca salva, dar dos es una cortesía vacía; si salva mucho, '
                    f'el primer error suele ser de tipeo y no de matemática — y entonces el '
                    f'problema está en la entrada, no en la dificultad.')
        + _box("¿Pensar tarda más que escribir?",
               _table(["Dificultad", "Respuestas", "Mediana"], t_rows,
                      empty="todavía no hay respuestas cronometradas"),
               note="<b>Cómo se lee.</b> Si el tiempo <b>sube</b> a medida que la derivada se "
                    "pone difícil, lo que se está midiendo es a la gente pensando, y el número "
                    "es una señal de dificultad percibida — la más honesta que hay, porque nadie "
                    "la puede falsear."
                    "<br><br>Si queda <b>plano</b>, lo que domina no es pensar sino tipear: el "
                    "cuello está en el teclado matemático y no en el banco de ejercicios. Es el "
                    "mismo diagnóstico que la tabla de arriba, por otra vía.")
        + "</div>"
        + _box("Vocabulario desbloqueado",
               ch.stack([{"label": f'{t["label"]} teclas', "n": t["n"]}
                         for t in en["teclas"]] or [{"label": "sin datos", "n": 0}]),
               note="El inventario del teclado es acumulativo: una tecla que apareció una vez no "
                    "se va más. Su tamaño mide cuán lejos llegó cada uno en el vocabulario del "
                    "juego — el bloque fijo son 0 teclas desbloqueadas y el techo son 11."
                    "<br><br>Es una <b>medida de progresión disfrazada de teclado</b>: alguien "
                    "con 7 teclas vio exponenciales, logaritmos y trigonométricas; alguien con 1 "
                    "no salió de las potencias. Si la mayoría se amontona en el extremo bajo, la "
                    "gente se está yendo antes de que el juego muestre lo que tiene."),
        anchor="entrada"))

    out.append(
        f"<footer>Generado {esc(m['generated_at'])} · zona {esc(m['tz'])} · "
        f"semana del {esc(labels[-1])}. Los <b>{num(m['bots_excluidos'])} estudiantes sembrados</b> "
        f"están excluidos de todas las métricas. "
        f"<a href='/panel/{esc(token)}/derivemos/data.json?w={week.isoformat()}'>data.json</a>"
        f"</footer></div>")

    return (
        "<!doctype html><html lang='es'><head><meta charset='utf-8'>"
        "<meta name='viewport' content='width=device-width,initial-scale=1'>"
        "<meta name='robots' content='noindex,nofollow'>"
        "<title>Derivemos · panel</title>"
        f"<style>{CSS}</style></head><body>{''.join(out)}</body></html>")
