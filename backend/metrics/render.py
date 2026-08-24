"""Armado del HTML del panel.

Una sola página, oscura, sin JS. El orden de las secciones es el mismo del
reporte semanal (docs/reports/FORMATO.md) a propósito: la idea es que armar el
reporte del domingo sea leer el panel de arriba a abajo, no rearmar el hilo.

La numeración de secciones no es decorativa — mapea 1:1 contra las del PDF.
"""
from __future__ import annotations

from datetime import date, timedelta

from . import charts as ch
from .charts import esc, num

CSS = """
:root{
  --bg:#131324; --surface:#1b1b34; --surface-2:#24243f; --border:#2f2f4c;
  --fg:#eef1f7; --muted:#8b97ad; --grid:#26263f;
  --indigo:#5457e5; --indigo-soft:#7e80f7; --violet:#9b2fc9; --blue:#1b63d6;
  --brown:#b4652a;
  --ok:#22c55e; --warn:#f59e0b; --bad:#f97316;
}
*{box-sizing:border-box}
body{margin:0;background:var(--bg);color:var(--fg);
  font-family:ui-sans-serif,system-ui,-apple-system,"Segoe UI",sans-serif;
  font-size:15px;line-height:1.55;-webkit-text-size-adjust:100%}
.wrap{max-width:1100px;margin:0 auto;padding:0 18px 72px}
a{color:var(--indigo-soft);text-decoration:none}
a:hover{text-decoration:underline}
:focus-visible{outline:2px solid var(--indigo-soft);outline-offset:2px;border-radius:4px}

header.top{position:sticky;top:0;z-index:5;background:rgba(19,19,36,.94);
  backdrop-filter:blur(8px);border-bottom:1px solid var(--border);margin-bottom:26px}
.top .wrap{padding-top:14px;padding-bottom:12px;display:flex;flex-wrap:wrap;
  gap:12px;align-items:baseline;justify-content:space-between}
.brand{font-weight:800;font-size:17px;letter-spacing:-.02em}
.weeknav{display:flex;gap:6px;align-items:center;font-size:13px}
.weeknav a,.weeknav .cur{padding:4px 10px;border-radius:999px;border:1px solid var(--border)}
.weeknav .cur{background:var(--indigo);color:#fff;border-color:var(--indigo);font-weight:600}
nav.jump{display:flex;gap:14px;flex-wrap:wrap;font-size:12.5px;padding:0 0 12px}
nav.jump a{color:var(--muted)}

h2{font-size:13px;letter-spacing:.09em;text-transform:uppercase;color:var(--muted);
  font-weight:700;margin:38px 0 14px;display:flex;gap:10px;align-items:baseline}
h2 b{color:var(--indigo-soft);font-variant-numeric:tabular-nums}
h3{font-size:15px;margin:0 0 4px;font-weight:650}

.card{background:var(--surface);border:1px solid var(--border);border-radius:14px;
  padding:18px 20px;margin-bottom:14px}
.grid{display:grid;gap:14px}
/* min(Npx,100%) y no Npx pelado: con auto-fit, un minmax fijo mantiene el track
   en N aunque el contenedor sea más angosto, y en un celular de 375px la
   tarjeta se sale de la pantalla y hace scrollear la página entera. */
.g2{grid-template-columns:repeat(auto-fit,minmax(min(400px,100%),1fr))}
.g4{grid-template-columns:repeat(auto-fit,minmax(min(210px,100%),1fr))}

.kpi .label{color:var(--muted);font-size:12.5px}
.kpi .row{display:flex;align-items:flex-end;justify-content:space-between;gap:10px;margin-top:2px}
.kpi .val{font-size:33px;font-weight:750;letter-spacing:-.03em;
  font-variant-numeric:tabular-nums;line-height:1.05}
.kpi .hint{color:var(--muted);font-size:11.5px;margin-top:6px}
.chip{font-size:11.5px;font-weight:650;padding:2px 8px;border-radius:999px;
  font-variant-numeric:tabular-nums;white-space:nowrap}
.chip.up{background:rgba(34,197,94,.16);color:#5ee08a}
.chip.down{background:rgba(249,115,22,.16);color:#fb9a5c}
.chip.flat{background:var(--surface-2);color:var(--muted)}

.note{color:var(--muted);font-size:12.5px;margin:12px 0 0;
  border-left:2px solid var(--border);padding-left:11px}
.sub{color:var(--muted);font-size:13px;margin:0 0 14px}

.scroll{overflow-x:auto}
table{border-collapse:collapse;width:100%;font-size:13px;
  font-variant-numeric:tabular-nums}
th,td{text-align:right;padding:7px 7px;border-bottom:1px solid var(--border);white-space:nowrap}
th:first-child,td:first-child{padding-left:0}
th:last-child,td:last-child{padding-right:0}
th{color:var(--muted);font-weight:600;font-size:11.5px;letter-spacing:.04em;
  text-transform:uppercase}
th:first-child,td:first-child{text-align:left}
tbody tr:last-child td{border-bottom:0}
td.dim{color:var(--muted)}

/* Tablas de cohorte: más aire y números más grandes, porque son el corte que
   más se mira y ocupan el ancho completo. */
table.big{font-size:14px}
table.big th,table.big td{padding:11px 10px}
table.big td{border-radius:4px}
table.big td.ent{font-size:14px;color:var(--fg)}
.emo{margin-right:7px;font-size:15px}

/* Chip de universidad: el mismo del ranking (ver web/src/components/university-tag.tsx),
   color de marca sobre su propio fondo translúcido. */
.tag{display:inline-flex;align-items:center;border:1px solid;border-radius:6px;
  padding:2px 7px;font-size:11.5px;font-weight:700;letter-spacing:.02em}
.tag-plain{border-color:transparent;background:rgba(255,255,255,.1);
  color:rgba(238,241,247,.7);font-weight:600}

.pill{display:inline-block;font-size:11px;padding:1px 7px;border-radius:999px;
  background:var(--surface-2);color:var(--muted);margin-left:6px}
.empty{color:var(--muted);font-style:italic;font-size:13px;margin:10px 0}
/* Descripción y ejemplo del copy dentro de la celda: la fila necesita respirar
   en varias líneas, así que acá sí se permite el salto. */
td .sub2{color:var(--muted);font-size:11.5px;font-weight:400}
td .ej{color:var(--indigo-soft);font-size:11.5px;font-style:italic}
td:has(.ej){white-space:normal;max-width:420px;line-height:1.45;padding:10px 7px}
footer{color:var(--muted);font-size:12px;margin-top:44px;padding-top:18px;
  border-top:1px solid var(--border)}
footer b{color:var(--fg)}
@media print{header.top{position:static}body{background:#fff;color:#111}}
"""


def _delta_chip(d, suffix: str = "") -> str:
    if d is None:
        return '<span class="chip flat">sin base</span>'
    cls = "up" if d > 0 else ("down" if d < 0 else "flat")
    sign = "+" if d > 0 else ""
    # La diferencia entre dos porcentajes son puntos porcentuales, no un
    # porcentaje: "-2,2%" sobre un 7,1% se lee como una caída del 2% cuando en
    # realidad cayó de 9,3 a 7,1.
    unit = " pp" if suffix == "%" else suffix
    return f'<span class="chip {cls}">{sign}{num(d, unit)}</span>'


def _kpi(c: dict) -> str:
    sfx = c["suffix"]
    return (
        f'<div class="card kpi">'
        f'<div class="label">{esc(c["label"])}</div>'
        f'<div class="row"><div class="val">{num(c["value"], sfx)}</div>'
        f'{ch.spark(c["series"])}</div>'
        f'<div class="row" style="margin-top:8px">'
        f'{_delta_chip(c["delta"], sfx)}'
        f'<span class="hint">vs. semana anterior</span></div>'
        f'<div class="hint">{esc(c["hint"])}</div></div>')


def _table(cols: list[str], rows: list[list], empty: str = "sin datos") -> str:
    if not rows:
        return f'<p class="empty">{esc(empty)}</p>'
    head = "".join(f"<th>{esc(c)}</th>" for c in cols)
    body = "".join(
        "<tr>" + "".join(f"<td>{c if isinstance(c, str) and c.startswith('<') else esc(c)}</td>"
                         for c in r) + "</tr>"
        for r in rows)
    return f'<div class="scroll"><table><thead><tr>{head}</tr></thead><tbody>{body}</tbody></table></div>'


# Colores de marca de las universidades, espejo de UNIVERSITY_TAGS del front
# (web/src/lib/university-tags.ts). Es la TERCERA copia de esta lista — el
# docstring de backend/universities.py ya advierte de las otras dos. Acá van
# solo las que tienen tag propia; el resto cae en el chip gris genérico, igual
# que hace <UniTag/>.
UNIVERSITY_COLOR = {
    "UBA": "#4F76E0", "UTN": "#EC4869", "UNSAM": "#4D90F2", "UNLP": "#21B8AE",
    "UNC": "#4A63D6", "UNR": "#D742A0", "UNL": "#29CBD9", "UNT": "#9AA7B8",
    "UNS": "#2E8FE0", "UADE": "#E3A73C", "ITBA": "#2C7DBE", "UNLaM": "#3FAE5C",
}

# Los mismos emojis que ve el usuario, para que el panel y la app nombren las
# cosas igual: carreras de onboarding-wizard.tsx (CAREERS) y cursos de COURSES.
CAREER_LABEL = {
    "E": ("⚙️", "Ingeniería"), "S": ("🔬", "Ciencia"),
    "T": ("🤖", "Tecnología"), "M": ("📐", "Matemática"),
    "Otra": ("✦", "Otra"),
}
COURSE_LABEL = {
    "analisis": ("📈", "Análisis"), "algebra": ("🧮", "Álgebra"),
    "probabilidad": ("🎲", "Probabilidad"),
}

# Los mismos emojis que el usuario toca al responder la micro-encuesta
# (web/.../survey-pane.tsx, SURVEY_QUESTIONS). Repetirlos acá hace que el
# gráfico se lea sin traducir: la barra 🥱 es la misma cara que vio en la app.
SURVEY_EMOJI = {
    "aburrido": "🥱", "justo": "🙂", "interesante": "💡",
    "muy_facil": "😴", "muy_dificil": "🤯",
}
SURVEY_TEXT = {
    "aburrido": "Aburrido", "justo": "Justo", "interesante": "Interesante",
    "muy_facil": "Muy fácil", "muy_dificil": "Muy difícil",
}
D_ORDER = ["aburrido", "justo", "interesante"]
A_ORDER = ["muy_facil", "justo", "muy_dificil"]

# `justo` aparece en los dos canales con distinto significado, así que el emoji
# del medio se resuelve por canal: 🙂 en D (ni aburrido ni interesante) y 👌 en A
# (la dificultad estuvo bien). Ver el comentario de models.ExerciseFeedback.
SURVEY_EMOJI_A = dict(SURVEY_EMOJI, justo="👌")

# Qué dice cada copy de push. Los nombres de categoría son internos
# ("personal_best", "podium") y no significan nada de un vistazo, así que la
# tabla muestra para qué sirve cada uno y un ejemplo real del texto.
#
# Los ejemplos están copiados de backend/notification_copy.py; las llaves marcan
# lo que se rellena por usuario. El peso nominal es CATEGORY_WEIGHTS del mismo
# archivo, para poder contrastar la mezcla real contra la esperada.
PUSH_COPY = {
    "practice": ("Recordatorio de repasar, sin gancho particular",
                 "¡Vení a repasar! Tus ejercicios te esperan 🦾", 15),
    "university": ("Cuánto XP le aportó a su facultad",
                   "Sumaste {xp} XP para la {uni} esta semana ¿Seguimos? 🎓", 20),
    "social": ("Cuántos compañeros de su facultad ya repasaron hoy",
               "{n} compañeros de la {uni} ya repasaron hoy. ¿Vos? 🎓", 15),
    "ranking": ("Alguien lo pasó en el ranking",
                "Alguien te pasó en el ranking. ¿Lo dejás así? 🤼", 15),
    "podium": ("Qué tan cerca está de entrar al podio",
               "Estás a {xp} XP del top {n} del ranking. ¡Dale que se puede! 🏅", 15),
    "reactivation": ("Hace días que no entra",
                     "Hace {n} días que no practicás. ¿Volvemos? 👀", 10),
    "personal_best": ("Su récord de ejercicios en un día",
                      "Tu mejor racha de ejercicios en un día fue {n}. ¿La superás hoy? 🚀", 10),
}


def curso_label(slug: str) -> str:
    emo, name = COURSE_LABEL.get(slug, ("", slug))
    return f"{emo} {name}".strip()


def _uni_chip(sigla: str) -> str:
    """El chip de universidad del ranking: color de marca sobre su propio fondo
    translúcido, o gris si la universidad entró por «Otra»."""
    color = UNIVERSITY_COLOR.get(sigla)
    if not color:
        return (f'<span class="tag tag-plain">{esc(sigla)}</span>')
    return (f'<span class="tag" style="color:{color};border-color:{color}99;'
            f'background:{color}33">{esc(sigla)}</span>')


def _emoji_label(pair: tuple[str, str] | None, fallback: str) -> str:
    if not pair:
        return esc(fallback)
    return f'<span class="emo">{pair[0]}</span>{esc(pair[1])}'


# Escala de calor para las celdas de porcentaje. La intensidad es relativa a la
# COLUMNA, no absoluta: lo que interesa es cuál origen rinde mejor que cuál, y
# una escala fija de 0 a 100 dejaría todas las celdas casi iguales cuando los
# valores viven apretados en una banda angosta.
def _heat_cell(v, lo: float, hi: float, dim: bool) -> str:
    if v is None:
        return '<td class="dim">—</td>'
    if dim:
        # Denominador chico: el porcentaje es ruido y pintarlo lo haría pasar
        # por señal. Se muestra el número, sin color.
        return f'<td class="dim">{num(v, "%")}</td>'
    t = 0.0 if hi <= lo else (v - lo) / (hi - lo)
    alpha = round(0.10 + 0.42 * t, 3)
    return (f'<td style="background:rgba(126,128,247,{alpha});'
            f'border-radius:4px">{num(v, "%")}</td>')


# Por debajo de esta base, una tasa de vuelta no es señal. Las filas con menos
# quedan sin color y con el número atenuado.
HEAT_MIN_BASE = 8


def _cohort_table(rows: list[dict], head: str, kind: str) -> str:
    """Tabla de cohorte a ancho completo, con chips/emojis y calor por columna."""
    if not rows:
        return '<p class="empty">todavía no hay usuarios con este dato</p>'

    def label(r: dict) -> str:
        if kind == "uni":
            return _uni_chip(r["label"])
        if kind == "carrera":
            return _emoji_label(CAREER_LABEL.get(r["label"]), r["label"])
        if kind == "curso":
            return _emoji_label(COURSE_LABEL.get(r["label"]), r["label"])
        return esc(r["label"])

    cols = ["estudio", "volvio", "dos_dias"]
    rango = {}
    for c in cols:
        vals = [r[c] for r in rows if r[c] is not None and r["base"] >= HEAT_MIN_BASE]
        rango[c] = (min(vals), max(vals)) if vals else (0.0, 0.0)

    body = []
    for r in rows:
        dim = r["base"] < HEAT_MIN_BASE
        celdas = "".join(_heat_cell(r[c], *rango[c], dim=dim) for c in cols)
        body.append(
            f'<tr><td class="ent">{label(r)}</td>'
            f'<td>{r["n"]}</td><td>{r["base"]}</td>{celdas}</tr>')

    head_html = "".join(f"<th>{esc(c)}</th>" for c in
                        [head, "n", "base", "estudió", "volvió", "2+ días"])
    nota = ("" if all(r["base"] >= HEAT_MIN_BASE for r in rows) else
            f'<p class="note">Las filas atenuadas tienen menos de {HEAT_MIN_BASE} '
            f'personas en la base: el porcentaje es ruido, no señal.</p>')
    return (f'<div class="scroll"><table class="big"><thead><tr>{head_html}</tr></thead>'
            f'<tbody>{"".join(body)}</tbody></table></div>{nota}')


_COHORT_NOTE = (
    '<p class="note">«estudió» es sobre el total del corte —conversión—; '
    '<b>«volvió» y «2+ días» son sobre la base</b>, los que llegaron a terminar '
    'una sesión. El usuario a retener es el que ya usó el producto: medir la '
    'vuelta sobre el total mezcla dos problemas distintos y no deja distinguir '
    'un origen que trae gente que no arranca de uno que trae gente que arranca '
    'y no vuelve.</p>')


def _section(n: int, title: str, body: str, sub: str = "", anchor: str = "") -> str:
    a = f' id="{esc(anchor)}"' if anchor else ""
    s = f'<p class="sub">{sub}</p>' if sub else ""
    return f'<section{a}><h2><b>{n}</b>{esc(title)}</h2>{s}{body}</section>'


# ── Página ───────────────────────────────────────────────────────────────────

def page(p: dict, *, token: str) -> str:
    m = p["meta"]
    week = date.fromisoformat(m["week"])
    labels = m["labels"]

    # Navegación de semanas: la actual y las cuatro anteriores. No hay "siguiente"
    # más allá de hoy — una semana futura solo puede mostrar ceros y se lee como
    # una caída.
    today_week = week_of_today()
    nav = []
    for i in range(4, -1, -1):
        w = today_week - timedelta(weeks=i)
        lab = f"{w.strftime('%d/%m')}"
        if w == week:
            nav.append(f'<span class="cur">{lab}</span>')
        else:
            nav.append(f'<a href="/panel/{esc(token)}?w={w.isoformat()}">{lab}</a>')

    jump = "".join(
        f'<a href="#{a}">{esc(t)}</a>'
        for a, t in [("embudo", "Embudo"), ("cohortes", "Cohortes"), ("producto", "Producto"),
                     ("encuestas", "Encuestas"), ("push", "Push"),
                     ("mails", "Mails")])

    out = [
        "<header class='top'><div class='wrap'>",
        "<div class='brand'>intervalo</div>",
        f"<div class='weeknav'>{''.join(nav)}</div>",
        "</div></header><div class='wrap'>",
        f"<nav class='jump'>{jump}</nav>",
    ]

    # 0 · Titulares
    out.append(_section(
        0, f"Titulares · semana del {labels[-1]}",
        f'<div class="grid g4">{"".join(_kpi(c) for c in p["headline"])}</div>',
        sub="Cada tarjeta es sobre la <b>cohorte de alta de esa semana</b>, seguida hasta hoy. "
            "El sparkline son las tres semanas visibles."))

    # 1 · Embudo
    f = p["funnel"]
    rows = [{"label": s["label"], "value": s["n"],
             "note": "" if s["pct_prev"] is None else f'{num(s["pct_prev"], "%")} del paso anterior'}
            for s in f["steps"]]
    out.append(_section(
        1, "Embudo de la cohorte", ch.hbars(rows, colors=["var(--indigo)"] * 5) +
        '<p class="note"><b>Altas</b> son las cuentas que vio esta base. Las crea Clerk, y el '
        'escalón Clerk → backend (273 → 233 en la semana del 18/08) no es medible desde acá, así '
        'que el embudo arranca un paso más adelante.</p>'
        '<p class="note"><b>Llegó al home</b> es el escalón que separa dos fallas distintas: '
        'trabarse en la autenticación, y llegar a la app y no tocar «empezar». Lo marca el '
        'endpoint que el home llama en cada carga. Para las cohortes anteriores al 24/08 es una '
        '<b>cota inferior</b>: se reconstruyó de quien tiene sesiones o zona horaria guardada, y '
        'el resto no dejó rastro.</p>'
        '<p class="note">Los dos últimos van del más ancho al más angosto —volver otro día '
        'cualquiera contiene a volver justo al día siguiente— y se miden contra el <b>primer día '
        'que estudió</b> cada uno, no contra su alta.  A diferencia del PDF, que cortaba las '
        'sesiones al domingo, la cohorte se sigue <b>hasta hoy</b>.</p>',
        anchor="embudo"))

    # 2 · Cohortes
    r = p["retencion"]
    def tip(label: str, pt: dict) -> str:
        """Tooltip de un punto, escrito como frase.

        El eje dice «D+3» y eso no significa nada solo, así que cada tooltip
        traduce el k, da el numerador y el denominador con nombre, y aclara por
        qué el denominador no es toda la cohorte."""
        k, n, obs = pt["k"], pt["n"], pt["obs"]
        cuando = ("el mismo día que arrancaron" if k == 0 else
                  "un día después de su primera sesión" if k == 1 else
                  f"{k} días después de su primera sesión")
        cab = f'Cohorte del {label}  ·  D+{k}'
        if k == 0:
            return (
                f'{cab}\n\n'
                f'Las {obs} personas de esta cohorte que llegaron a estudiar lo hicieron, '
                f'por definición, su primer día.\n'
                f'Por eso D+0 siempre da 100%: es el día en que arrancaron.')
        if pt["pct"] is None:
            return (
                f'{cab}\n\n'
                f'Todavía no hay a quién medir: nadie de esta cohorte llegó a cumplir '
                f'{k} días desde su primera sesión.')
        return (
            f'{cab}\n\n'
            f'{n} de {obs} personas volvieron a estudiar {cuando}  ({num(pt["pct"], "%")}).\n\n'
            f'El denominador son las {obs} que ya llegaron a ese día, no toda la cohorte: '
            f'quien arrancó anteayer todavía no puede tener un D+{k}.')

    ret_series = [{
        "label": f'{c["label"]} (n={c["n"]})',
        "values": [pt["pct"] for pt in c["points"]],
        "tips": [tip(c["label"], pt) for pt in c["points"]],
    } for c in r["cohortes"]]
    co = p["cohortes"]
    atr = co["atribucion"]
    body = [
        '<div class="card"><h3>Retención diaria por cohorte semanal</h3>',
        # mono: son la misma métrica en semanas distintas, no categorías. Un
        # solo tono con la más vieja apagada ordena la lectura.
        # Más alto que el resto: con 14 puntos y la curva pegada al piso a
        # partir de D+2, en 220px las series se superponen y no se distinguen.
        ch.lines(ret_series, [f"D+{k}" for k in range(r["horizon"] + 1)], mono=True,
                 height=330, y_max=100),
        '<p class="note"><b>D+0 es el día de la primera sesión de cada uno, no el del alta</b>, así '
        'que arranca en 100% por construcción. Con el alta como ancla no arrancaba ahí: quien se '
        'registraba el lunes y estudiaba recién el miércoles contaba en la base pero no en D+0, y '
        'ese escalón inicial mezclaba «tardó en arrancar» con «no volvió». Anclado en la '
        'activación, cada k mide una sola cosa: cuántos siguen volviendo k días después de haber '
        'empezado.</p>'
        '<p class="note">El 100% son <b>los que terminaron alguna sesión</b>, no los que se dieron '
        'de alta: quien se registró y nunca estudió no tiene nada que repetir, y cuánta gente '
        'llega a estudiar ya se mide en el embudo. La cohorte sigue siendo la semana de alta, así '
        'que se comparan tandas de usuarios aunque el reloj de cada uno arranque cuando se activó. '
        'El denominador de cada k son solo los que ya vivieron ese día. <b>Pasá el mouse por un '
        'punto</b> para ver el detalle.</p>'
        '</div>',
        # A ancho completo y una debajo de la otra: son el corte principal de la
        # semana y en media pantalla no entraban sin scrollear.
        f'<div class="card"><h3>Por universidad</h3>'
        f'{_cohort_table(co["universidad"], "Universidad", "uni")}</div>',
        f'<div class="card"><h3>Por carrera</h3>'
        f'{_cohort_table(co["carrera"], "Carrera", "carrera")}</div>',
        f'<div class="card"><h3>Por curso</h3>'
        f'{_cohort_table(co["curso"], "Curso", "curso")}</div>',
    ]
    if co["grupos"]:
        body.append(f'<div class="card"><h3>Grupos con volumen</h3>'
                    f'{_cohort_table(co["grupos"], "Grupo", "plain")}'
                    f'<p class="note">Atribución nativa (<code>users.first_group_id</code>), '
                    f'capturada al aterrizar y guardada al completar el onboarding: cubre '
                    f'<b>{atr["con"]} de {atr["total"]}</b> usuarios del rango '
                    f'({num(atr["pct"], "%")}). Solo grupos con 5 o más usuarios.</p></div>')
    else:
        body.append(
            f'<p class="note">El corte <b>por grupo de WhatsApp</b> todavía no tiene volumen: '
            f'la atribución nativa (<code>users.first_group_id</code>) se guarda desde el 24/08, '
            f'así que cubre {atr["con"]} de {atr["total"]} usuarios del rango. Aparece solo cuando '
            f'algún grupo llegue a 5 usuarios; hasta entonces el origen vive en PostHog.</p>')
    body.append(f'<div class="card"><h3>Unidades declaradas en el onboarding</h3>'
                f'{_cohort_table(co["unidades"], "Marcó", "plain")}'
                f'<p class="note">Dato declarativo de la slide nueva. No toca SM-2 — está acá para '
                f'ver si predice algo antes de darle cualquier efecto.</p></div>')
    body.append(_COHORT_NOTE)
    out.append(_section(2, "Cohortes", "".join(body),
                        sub="El corte que más importa esta semana: quién vuelve, partido por de "
                            "dónde vino.", anchor="cohortes"))

    # 3 · Producto
    pr = p["producto"]
    cur = pr["cursos"]

    # Accuracy y abandono lado a lado, por curso. Son las dos caras de lo mismo
    # —si un curso cuesta más, se abandona más— y el gráfico existe para poder
    # cruzarlas de un vistazo.
    grupos = [curso_label(c["curso"]) for c in cur]
    series = [
        {"label": "Accuracy (P1)", "values": [c["p1"] for c in cur]},
        {"label": "Abandono repaso", "values": [c["main_abandono"] for c in cur]},
        {"label": "Abandono práctica", "values": [c["practice_abandono"] for c in cur]},
    ]
    ses_rows = [[f'{curso_label(r["curso"])} · {r["modo"]}', r["iniciadas"],
                 r["terminadas"], num(r["pct"], "%")] for r in pr["sesiones"]]
    p1_rows = [{"label": r["label"], "value": r["p1"], "note": f'n={r["n"]}'} for r in pr["p1_skill"]]
    sr = pr["sin_respuesta"]

    out.append(_section(
        3, "Producto",
        f'<div class="card"><h3>Accuracy y abandono por curso</h3>'
        + ch.vbars(grupos, series, suffix="%", height=250, width=900)
        + f'<p class="note"><b>Accuracy</b> = P1, aciertos al primer intento '
          f'(<code>quality_score = 5</code>); global {num(pr["p1_global"], "%")} sobre '
          f'{pr["respuestas"]} respuestas. <code>is_correct</code> no sirve para esto: cuenta hasta '
          f'el tercer intento y da ~93% en todos lados. <b>Abandono</b> = sesiones iniciadas que '
          f'nunca se terminaron. Se leen juntas: un curso con accuracy baja y abandono alto tiene '
          f'un problema de dificultad; uno con accuracy alta y abandono alto lo tiene en otro '
          f'lado.</p>'
          f'<p class="note">Aparte quedan las sesiones que se abren y no resuelven <b>ningún</b> '
          f'ejercicio — {sr.get("main", 0)} en repaso y {sr.get("practice", 0)} en práctica. No '
          f'están en el abandono de arriba a propósito: quien corta en el sexto ejercicio se cansó, '
          f'quien corta en el cero nunca arrancó, y son dos problemas distintos.</p></div>'
        '<div class="grid g2">'
        f'<div class="card"><h3>Sesiones por curso y modo</h3>'
        f'{_table(["Curso · modo", "Iniciadas", "Terminadas", "%"], ses_rows)}'
        f'<p class="note">Duración mediana de las terminadas: '
        + " · ".join(f'{k} {num(v)} min' for k, v in pr["duracion"].items())
        + '. <code>duration_seconds</code> está muerta; esto es '
          '<code>finished_at − started_at</code>.</p></div>'
        f'<div class="card"><h3>Accuracy por habilidad</h3>'
        + ch.hbars(p1_rows, suffix="%", label_w=70, width=520)
        + f'<p class="note">La banda de calibración es {pr["banda"][0]}–{pr["banda"][1]}%: sale de '
          f'cruzar los votos de la encuesta de dificultad contra el comportamiento real. Por '
          f'encima, el ítem está blando; por debajo, duro.</p></div>'
        '</div>',
        anchor="producto"))

    # 4 · Encuestas
    e = p["encuestas"]
    mix_rows = [[r["canal"], r["shown"], r["answered"], num(r["tasa"], "%"),
                 num(r["real"], "%"), f'{r["nominal"]}%'] for r in e["mix"]]

    def encuesta_chart(rows: list[dict], order: list[str], emoji: dict, vacio: str) -> str:
        """Barras agrupadas por curso, una serie por respuesta posible."""
        if not rows:
            return f'<p class="empty">{esc(vacio)}</p>'
        grupos = [curso_label(r["curso"]) for r in rows]
        series = [{"label": f'{emoji[v]} {SURVEY_TEXT[v]}',
                   "values": [r["valores"][v] for r in rows]} for v in order]
        return ch.vbars(grupos, series, height=230, width=900)

    out.append(_section(
        4, "Micro-encuestas",
        f'<div class="card"><h3>Mezcla de canales</h3>'
        f'{_table(["Canal", "Mostradas", "Respondidas", "Tasa", "Real", "Nominal"], mix_rows)}'
        '<p class="note">D (interés) es el canal norte, A (dificultad) queda como calibración y B '
        '(explicación) es el más chico. La mezcla real va a estar siempre más cargada a D/A: B '
        'solo loguea impresión si la persona abre «¿Por qué?». <b>No compensar subiendo el peso '
        'de B.</b></p></div>'
        f'<div class="card"><h3>💡 Interés (canal D) por curso</h3>'
        + encuesta_chart(e["d_por_curso"], D_ORDER, SURVEY_EMOJI,
                         "Todavía sin respuestas: el canal D se desplegó el 24/08 y las reglas "
                         "anti-fatiga lo muestran como máximo una vez por sesión.")
        + '<p class="note">Si un curso concentra los 🥱, el problema es de ese contenido y no del '
          'mazo entero — que es justo lo que el total escondía.</p></div>'
        f'<div class="card"><h3>👌 Dificultad (canal A) por curso</h3>'
        + encuesta_chart(e["a_por_curso"], A_ORDER, SURVEY_EMOJI_A,
                         "sin respuestas en la ventana")
        + '<p class="note">Ojo: «justo» existe en los dos canales y significa cosas distintas —acá '
          'la dificultad estuvo bien, en D ni aburrido ni interesante—. Cualquier corte por valor '
          'tiene que filtrar el canal.</p></div>'
        + f'<p class="note">{e["reportes"]} reporte(s) de contenido (canal C) en la ventana.</p>',
        anchor="encuestas"))

    # 5 · Re-enganche: push
    rg = p["reenganche"]
    enviadas_tot = sum(r["enviadas"] for r in rg["por_categoria"]) or 1
    cat_rows = []
    for r in rg["por_categoria"]:
        desc, ejemplo, peso = PUSH_COPY.get(r["categoria"], ("—", "—", 0))
        cat_rows.append([
            f'<b>{esc(r["categoria"])}</b><br><span class="sub2">{esc(desc)}</span>'
            f'<br><span class="ej">{esc(ejemplo)}</span>',
            r["enviadas"], num(100 * r["enviadas"] / enviadas_tot, "%"), f"{peso}%",
            r["abiertas"], num(r["ctr"], "%")])
    out.append(_section(
        5, "Re-enganche · push",
        '<div class="grid g4">'
        + "".join(f'<div class="card kpi"><div class="label">{esc(l)}</div>'
                  f'<div class="val">{num(v)}</div></div>'
                  for l, v in [("Suscripciones push", rg["subs"]),
                               ("Con notificación activa", rg["activos"]),
                               ("Enviadas", rg["enviadas"]),
                               ("Abiertas", rg["abiertas"])])
        + '</div>'
        f'<div class="card"><h3>Por categoría de copy</h3>'
        f'{_table(["Copy", "Enviadas", "Real", "Nominal", "Abiertas", "CTR"], cat_rows, empty="sin envíos en la ventana")}'
        f'<p class="note">CTR global {num(rg["ctr"], "%")}. <b>Real</b> es qué porción de los '
        f'envíos se llevó cada copy y <b>nominal</b> el peso que tiene asignado en '
        f'<code>notification_copy.py</code>: si se separan mucho, hay variantes que casi nunca '
        f'aplican y el reparto efectivo no es el que se configuró. Si «con notificación activa» '
        f'queda muy por debajo de «suscripciones push», volvió el bug de persistencia de '
        f'<code>notify_enabled</code>.</p></div>',
        anchor="push"))

    # 6 · Re-enganche: email
    em = p["emails"]
    mail_rows = [[f'{r["tipo"]}', r["desc"], r["enviados"], r["activados"],
                  num(r["pct"], "%")] for r in em["tipos"]]
    out.append(_section(
        6, "Re-enganche · mails de ciclo de vida",
        '<div class="grid g4">'
        + "".join(f'<div class="card kpi"><div class="label">{esc(l)}</div>'
                  f'<div class="val">{num(v, sfx)}</div><div class="hint">{esc(h)}</div></div>'
                  for l, v, sfx, h in [
                      ("Enviados", em["enviados"], "", "en la ventana visible"),
                      ("Activaron", em["activados"], "",
                       f'estudiaron dentro de {em["ventana_dias"]} días'),
                      ("Tasa de activación", em["pct"], "%", "sobre los enviados"),
                      ("Bajas", em["bajas"], "", f'de {em["usuarios"]} usuarios')])
        + '</div>'
        f'<div class="card"><h3>Por copy</h3>'
        f'{_table(["Copy", "A quién va", "Enviados", "Activaron", "Tasa"], mail_rows, empty="sin envíos en la ventana")}'
        '<p class="note"><b>Activar</b> = terminar una sesión dentro de los '
        f'{em["ventana_dias"]} días siguientes al envío. Es lo más cerca de «el mail funcionó» que '
        'se puede medir con lo que hay. Dos salvedades al leerlo: <b>«streak» no se compara con '
        'los otros</b> —va a alguien que viene de una racha activa, así que su tasa arranca alta '
        'por selección y esa gente volvía igual—, y <b>no hay grupo de control</b>: todo el que '
        'califica recibe el mail, así que esto es una tasa bruta, no un efecto causal. Para saber '
        'cuánto aporta el mail habría que dejar un holdout sin mandar.</p>'
        '<p class="note"><b>Aperturas: no están.</b> Resend las conoce pero no llegan a esta base; '
        'necesitan un webhook (<code>email.opened</code>) contra un endpoint nuevo. Lo que sí '
        'quedó instrumentado hoy son los <b>clicks</b>: los botones ahora llevan '
        '<code>?utm_source=email&amp;utm_campaign=&lt;copy&gt;</code>, así que PostHog los separa '
        'por copy a partir de los envíos de esta semana.</p></div>',
        anchor="mails"))

    out.append(
        '<footer>'
        f'<p>Generado {esc(m["generated_at"])} · zona horaria {esc(m["tz"])} · '
        f'{m["usuarios"]} usuarios en la base · semanas de lunes a domingo.</p>'
        '<p><b>Definiciones.</b> Sesión = modo <code>main</code> o <code>practice</code>; las de '
        '<code>onboarding</code> (el ejercicio de prueba del alta) y <code>test</code> (QA) no '
        'cuentan — contarlas fue lo que infló el «97% completó una sesión» durante dos semanas. '
        'Terminada = <code>finished_at</code> no nulo. P1 = <code>quality_score = 5</code>. '
        'Cohorte = semana de alta del usuario. Volver = terminó más de una sesión.</p>'
        '<p>Este panel es de solo lectura y no expone datos personales. El link es secreto: '
        'rotarlo es cambiar <code>DASHBOARD_TOKEN</code> en Railway.</p>'
        '</footer></div>')

    return (
        "<!doctype html><html lang='es'><head><meta charset='utf-8'>"
        "<meta name='viewport' content='width=device-width, initial-scale=1'>"
        "<meta name='robots' content='noindex, nofollow'>"
        f"<title>Panel · intervalo</title><style>{CSS}</style></head>"
        f"<body>{''.join(out)}</body></html>")


def week_of_today() -> date:
    from datetime import datetime

    from .queries import AR_OFFSET, week_start
    return week_start((datetime.utcnow() + AR_OFFSET).date())
