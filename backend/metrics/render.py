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
  --bg:#0f0f1e; --surface:#171730; --surface-2:#1f1f3a; --border:#2b2b46;
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

header.top{position:sticky;top:0;z-index:5;background:rgba(15,15,30,.94);
  backdrop-filter:blur(8px);border-bottom:1px solid var(--border);margin-bottom:26px}
.top .wrap{padding-top:14px;padding-bottom:12px;display:flex;flex-wrap:wrap;
  gap:12px;align-items:baseline;justify-content:space-between}
.brand{font-weight:800;font-size:17px;letter-spacing:-.02em}
.brand span{color:var(--muted);font-weight:500;margin-left:8px;font-size:13px}
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

.pill{display:inline-block;font-size:11px;padding:1px 7px;border-radius:999px;
  background:var(--surface-2);color:var(--muted);margin-left:6px}
.empty{color:var(--muted);font-style:italic;font-size:13px;margin:10px 0}
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


def _cohort_table(rows: list[dict], head: str) -> str:
    # Encabezados cortos a propósito: son seis columnas en media pantalla y con
    # títulos largos la tabla se va de ancho y hay que scrollearla.
    #
    # «base» es la columna bisagra: los que estudiaron. «estudió» se mide sobre
    # el total (conversión) y las dos últimas sobre la base (retención).
    return _table(
        [head, "n", "estudió", "base", "volvió", "2+ días"],
        [[r["label"], r["n"], num(r["estudio"], "%"), r["base"],
          num(r["volvio"], "%"), num(r["dos_dias"], "%")] for r in rows],
        empty="todavía no hay usuarios con este dato")


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
                     ("encuestas", "Encuestas"), ("tablas", "Tablas"), ("push", "Push"),
                     ("mails", "Mails")])

    out = [
        "<header class='top'><div class='wrap'>",
        f"<div class='brand'>intervalo <span>panel de métricas</span></div>",
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
        '<p class="note">Arranca en <b>llegó a la app</b>: las cuentas las crea Clerk y no están '
        'en esta base, así que el escalón Clerk → app (273 → 233 en la semana del 18/08) no es '
        'medible desde acá. A diferencia del PDF, que cortaba las sesiones al domingo, la cohorte '
        'se sigue <b>hasta hoy</b>, así que los últimos escalones dan un poco más altos.</p>',
        anchor="embudo"))

    # 2 · Cohortes
    r = p["retencion"]
    ret_series = [{"label": f'{c["label"]} (n={c["n"]})',
                   "values": [pt["pct"] for pt in c["points"]]} for c in r["cohortes"]]
    co = p["cohortes"]
    atr = co["atribucion"]
    body = [
        '<div class="card"><h3>Retención diaria por cohorte semanal</h3>',
        # mono: son la misma métrica en semanas distintas, no categorías. Un
        # solo tono con la más vieja apagada ordena la lectura.
        ch.lines(ret_series, [f"D+{k}" for k in range(r["horizon"] + 1)], mono=True),
        '<p class="note">El 100% de cada cohorte son <b>los que terminaron alguna sesión</b>, no '
        'los que se dieron de alta: retener es traer de vuelta a quien ya usó el producto, y quien '
        'se registró y nunca estudió no tiene nada que repetir. Cuánta gente llega a estudiar se '
        'mide en el embudo. El denominador de cada k son además solo los que ya vivieron ese día: '
        'alguien que se anotó ayer no puede tener D+5 todavía.</p>'
        '</div>',
        '<div class="grid g2">',
        f'<div class="card"><h3>Por origen</h3>{_cohort_table(co["origen"], "Facultad")}'
        f'<p class="note">Atribución nativa (<code>users.first_group_id</code>), capturada al '
        f'aterrizar y guardada al completar el onboarding. Cubre '
        f'<b>{atr["con"]} de {atr["total"]}</b> usuarios del rango ({num(atr["pct"], "%")}). '
        f'Los usuarios anteriores al 24/08 quedan sin atribuir: su origen sigue estando solo en '
        f'PostHog.</p></div>',
        f'<div class="card"><h3>Por universidad</h3>{_cohort_table(co["universidad"], "Universidad")}</div>',
        f'<div class="card"><h3>Por carrera</h3>{_cohort_table(co["carrera"], "Carrera")}</div>',
        f'<div class="card"><h3>Por curso</h3>{_cohort_table(co["curso"], "Curso")}</div>',
        '</div>',
    ]
    if co["grupos"]:
        body.append(f'<div class="card"><h3>Grupos con volumen</h3>'
                    f'{_cohort_table(co["grupos"], "Grupo")}'
                    f'<p class="note">Solo grupos con 5 o más usuarios: por debajo de eso una tasa '
                    f'de vuelta es ruido, no señal.</p></div>')
    body.append(f'<div class="card"><h3>Unidades declaradas en el onboarding</h3>'
                f'{_cohort_table(co["unidades"], "Marcó")}'
                f'<p class="note">Dato declarativo de la slide nueva. No toca SM-2 — está acá para '
                f'ver si predice algo antes de darle cualquier efecto.</p></div>')
    body.append(_COHORT_NOTE)
    out.append(_section(2, "Cohortes", "".join(body),
                        sub="El corte que más importa esta semana: quién vuelve, partido por de "
                            "dónde vino.", anchor="cohortes"))

    # 3 · Producto
    pr = p["producto"]
    ses_rows = [[f'{r["curso"]} · {r["modo"]}', r["iniciadas"], r["terminadas"],
                 num(r["pct"], "%")] for r in pr["sesiones"]]
    aband = []
    for modo, d in pr["abandono"].items():
        curva = [{"label": "", "values": [k["pct"] for k in d["curva"]]}]
        aband.append(
            f'<div class="card"><h3>Abandono · {esc(modo)}</h3>'
            + ch.lines(curva, [str(k["k"]) for k in d["curva"]], legend=False, y_max=100)
            + f'<p class="note">De las sesiones que <b>tenían</b> al menos k ejercicios asignados, '
              f'qué % llegó a resolver el k-ésimo. El denominador baja con k (en k=1 son '
              f'{d["curva"][0]["de"] if d["curva"] else 0}) porque el largo de sesión es '
              f'configurable: dividir siempre por el total haría parecer abandono a una sesión '
              f'corta terminada bien. Aparte quedan <b>{d["cero"]}</b> sesiones que se abrieron y '
              f'no resolvieron nada — el abandono más grande, y el que no aparece en la curva.</p>'
              f'</div>')

    p1_rows = [{"label": r["label"], "value": r["p1"], "note": f'n={r["n"]}'} for r in pr["p1_skill"]]
    out.append(_section(
        3, "Producto",
        '<div class="grid g2">'
        f'<div class="card"><h3>Sesiones por curso y modo</h3>'
        f'{_table(["Curso · modo", "Iniciadas", "Terminadas", "%"], ses_rows)}'
        f'<p class="note">Duración mediana de las terminadas: '
        + " · ".join(f'{k} {num(v)} min' for k, v in pr["duracion"].items())
        + '. <code>duration_seconds</code> está muerta; esto es '
          '<code>finished_at − started_at</code>.</p></div>'
        f'<div class="card"><h3>P1 por habilidad</h3>'
        + ch.hbars(p1_rows, suffix="%", label_w=70, width=520)
        + f'<p class="note">P1 = % de aciertos <b>al primer intento</b> '
          f'(<code>quality_score = 5</code>). Global {num(pr["p1_global"], "%")} sobre '
          f'{pr["respuestas"]} respuestas. <code>is_correct</code> no sirve acá: cuenta hasta el '
          f'tercer intento y da ~93% en todos lados. Banda de calibración: '
          f'{pr["banda"][0]}–{pr["banda"][1]}%.</p></div>'
        '</div>'
        f'<div class="grid g2">{"".join(aband)}</div>',
        anchor="producto"))

    # 4 · Encuestas
    e = p["encuestas"]
    mix_rows = [[r["canal"], r["shown"], r["answered"], num(r["tasa"], "%"),
                 num(r["real"], "%"), f'{r["nominal"]}%'] for r in e["mix"]]
    d_total = sum(s["n"] for s in e["d"])
    item_rows = [[r["item"], r["n"], num(r["score"]), num(r["p1"], "%"), r["respuestas"]]
                 for r in e["items"][:12]]
    ejes_rows = [[r["eje"], r["pos"], r["neg"]] for r in e["ejes"]]
    out.append(_section(
        4, "Micro-encuestas",
        '<div class="grid g2">'
        f'<div class="card"><h3>Mezcla de canales</h3>'
        f'{_table(["Canal", "Mostradas", "Respondidas", "Tasa", "Real", "Nominal"], mix_rows)}'
        '<p class="note">D (interés) es el canal norte, A (dificultad) queda como calibración y B '
        '(explicación) es el más chico. La mezcla real va a estar siempre más cargada a D/A: B '
        'solo loguea impresión si la persona abre «¿Por qué?». <b>No compensar subiendo el peso '
        'de B.</b></p></div>'
        f'<div class="card"><h3>Canal D · ¿fue interesante?</h3>'
        + (ch.stack(e["d"], colors=["var(--brown)", "var(--muted)", "var(--indigo)"])
           if d_total else '<p class="empty">Todavía sin respuestas: el canal D se desplegó el '
                           '24/08 y las reglas anti-fatiga lo muestran como máximo una vez por '
                           'sesión.</p>')
        + f'{_table(["Eje", "Positivo", "Negativo"], ejes_rows, empty="sin razones todavía") if ejes_rows else ""}'
        '<p class="note">Ojo: «justo» existe en el canal A (la dificultad estuvo bien) y en el D '
        '(ni aburrido ni interesante). Son cosas distintas; cualquier corte por valor tiene que '
        'filtrar el canal.</p></div>'
        '</div>'
        f'<div class="card"><h3>Ejercicios peor puntuados</h3>'
        f'{_table(["Ítem", "Votos", "Score", "P1", "Respuestas"], item_rows, empty="el canal D todavía no juntó votos")}'
        '<p class="note">Score: interesante +1, justo 0, aburrido −1; ordenado de peor a mejor — '
        'la cola de arriba es la lista de trabajo editorial. La columna <b>P1</b> es el control '
        'obligatorio: el interés reportado correlaciona fortísimo con «me salió», así que un ítem '
        'mal puntuado <i>con P1 alto</i> es un problema aburrido de verdad, y uno con P1 bajo '
        'puede ser solo frustración.</p></div>'
        + f'<p class="note">{e["reportes"]} reporte(s) de contenido (canal C) en la ventana.</p>',
        anchor="encuestas"))

    # 5 · Tablas
    t = p["tablas"]
    al = t["alcance"]
    out.append(_section(
        5, "Formato tabla",
        '<div class="grid g2">'
        f'<div class="card"><h3>Alcance del contrapeso</h3>'
        f'<div class="kpi"><div class="val">{num(al["pct"], "%")}</div>'
        f'<div class="hint">{al["con_tabla"]} de {al["primeras"]} primeras sesiones de repaso '
        f'de <b>esta semana</b> incluyeron al menos un ejercicio con tabla</div></div>'
        '<p class="note">El empuje (<code>TABLE_BOOST_MAX = 6.0</code>) multiplica x6 el peso del '
        'sorteo en la primera sesión y decae a x1 en la décima, con garantía en la primera. Es '
        'sesgo de <b>orden</b>, no cuota: el ciclo por ítem sigue sirviendo cada ejercicio una vez '
        'por vuelta.</p></div>'
        f'<div class="card"><h3>Con tabla vs. sin tabla</h3>'
        f'{_table(["", "n", "P1"], [["Con tabla", t["p1"]["con_tabla"]["n"], num(t["p1"]["con_tabla"]["p1"], "%")], ["Sin tabla", t["p1"]["sin_tabla"]["n"], num(t["p1"]["sin_tabla"]["p1"], "%")]])}'
        f'{_table(["", "Votos D", "Score interés"], [["Con tabla", t["interes"]["con_tabla"]["n"], num(t["interes"]["con_tabla"]["score"])], ["Sin tabla", t["interes"]["sin_tabla"]["n"], num(t["interes"]["sin_tabla"]["score"])]])}'
        f'<p class="note">{t["items"]} ítems con tabla en el banco. La comparación de interés es '
        f'la pregunta que motivó el formato; necesita varias semanas de canal D para decir algo.</p>'
        '</div></div>',
        anchor="tablas"))

    # 6 · Re-enganche: push
    rg = p["reenganche"]
    cat_rows = [[r["categoria"], r["enviadas"], r["abiertas"], num(r["ctr"], "%")]
                for r in rg["por_categoria"]]
    out.append(_section(
        6, "Re-enganche · push",
        '<div class="grid g4">'
        + "".join(f'<div class="card kpi"><div class="label">{esc(l)}</div>'
                  f'<div class="val">{num(v)}</div></div>'
                  for l, v in [("Suscripciones push", rg["subs"]),
                               ("Con notificación activa", rg["activos"]),
                               ("Enviadas", rg["enviadas"]),
                               ("Abiertas", rg["abiertas"])])
        + '</div>'
        f'<div class="card"><h3>Por categoría de copy</h3>'
        f'{_table(["Categoría", "Enviadas", "Abiertas", "CTR"], cat_rows, empty="sin envíos en la ventana")}'
        f'<p class="note">CTR global {num(rg["ctr"], "%")}. Si «con notificación activa» queda muy '
        f'por debajo de «suscripciones push», volvió el bug de persistencia de '
        f'<code>notify_enabled</code>.</p></div>',
        anchor="push"))

    # 7 · Re-enganche: email
    em = p["emails"]
    mail_rows = [[f'{r["tipo"]}', r["desc"], r["enviados"], r["activados"],
                  num(r["pct"], "%")] for r in em["tipos"]]
    out.append(_section(
        7, "Re-enganche · mails de ciclo de vida",
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
