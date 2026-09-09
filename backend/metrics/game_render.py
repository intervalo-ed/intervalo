"""Armado del HTML del panel del minijuego.

Misma cocina que `metrics/render.py` —una sola página, oscura, sin JS, con los
SVG generados en el server— y **otra piel**: acá el formato de contenedores es el
de la versión de escritorio de `/derivadas`. Eso significa cosas concretas y no
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

Las secciones están numeradas y en el orden en que conviene leerlas: cuánta
gente entra, cuánto aguanta, y recién después de dónde salió y con qué la juega.

El panel llegó a tener once secciones —el diagnóstico del Elo, la tabla de
plantillas, el embudo del cafecito, la fricción del teclado— y se recortó a
seis. Lo que se fue no estaba mal medido: era instrumentación del motor, que se
mira cuando se está tocando el motor y no todos los días. Las consultas se
borraron con la sección, no se dejaron colgadas alimentando un `data.json` que
nadie lee (`git log` las tiene si hacen falta de nuevo).
"""
from __future__ import annotations

from datetime import date, datetime, timedelta

from . import charts as ch
from . import theme
from .charts import esc, num
from .game_queries import (
    FIRST_WEEK, PEDIDO_CAFECITO, PEDIDO_PERFIL, PEDIDO_REGISTRO,
)

# El grueso del CSS es el mismo que Intervalo (ver metrics/theme.py) — es la
# piel de la que se copió en primer lugar. Acá solo quedan las reglas que no
# tienen sentido fuera del juego: la celda monoespaciada de `template_key` y
# el tamaño del MathML de los ejemplos.
CSS = theme.BASE_CSS

# Los colores de marca de cada universidad, reusados del panel de Intervalo en
# vez de copiar la lista: backend/universities.py ya advierte de las tres copias
# que hay dando vueltas, y una cuarta sería la que se olvida de actualizarse.
# Son los mismos del chip que el jugador ve en su ranking, que es lo que hace
# que una línea del desglose se reconozca sin leer la leyenda.
from .render import UNIVERSITY_COLOR, _uni_chip  # noqa: E402

# Los pesos del sorteo se LEEN de donde se deciden, no se copian: la columna
# «nominal» de la tabla de push existe justamente para detectar que el reparto
# real no es el configurado, y una copia vieja de los pesos convertiría a esa
# columna en la que miente.
from game.notification_copy import PESOS as PESOS_DEL_COPY  # noqa: E402

# Helpers de presentación compartidos con el panel de Intervalo — ver
# metrics/theme.py. Los alias locales evitan reescribir las llamadas ya
# existentes en este archivo.
_chip = theme.delta_chip
_kpi = theme.kpi
_table = theme.table
_box = theme.box
_section = theme.section


def _pct_txt(v) -> str:
    return "—" if v is None else num(v, "%")


# Las dos formas de mirar lo mismo: la tasa y el volumen del que sale.
#
# El coeficiente va primero porque es el número que decide —arriba de uno el
# juego crece solo— pero es una división, y una división sin sus dos términos a
# la vista no se puede auditar: un K que salta de 0,02 a 0,12 puede ser mucha
# gente nueva reclutada o poca gente vieja en el denominador, y son dos
# situaciones distintas. La segunda vista muestra justamente eso.
VISTAS_VIRALIDAD: tuple[tuple[str, str], ...] = (
    ("k", "Coeficiente"),
    ("volumen", "Nuevos y reclutados"),
)
VISTA_VIRALIDAD_POR_DEFECTO = VISTAS_VIRALIDAD[0][0]

# Azul para los que entran y verde para los que entran POR ALGUIEN, que es el
# mismo verde con el que el juego pinta reclutar (WhatsApp) en la app.
AZUL_NUEVOS = "#4f7fe0"
VERDE_RECLUTAS = "#2fb673"


def _kpi_chico(label: str, valor, hint: str = "", suffix: str = "", dec: int = 1) -> str:
    """Un número con su etiqueta, sin sparkline ni delta.

    `theme.kpi` es el de los titulares y pide serie y variación semanal: son
    ocho números que se miran comparándolos con la semana anterior. Estos son
    otra cosa —cuántas suscripciones hay, cuántos mails salieron— y no tienen
    contra qué compararse semana a semana sin inventar una serie.
    """
    return (f'<div class="box kpi"><div class="label">{esc(label)}</div>'
            f'<div class="val">{num(valor, suffix, dec)}</div>'
            + (f'<div class="hint">{esc(hint)}</div>' if hint else "")
            + "</div>")


# Qué dice cada copy, para que la tabla de push se pueda leer sin abrir el
# código. La descripción y el ejemplo viven acá —son texto de panel— pero el
# PESO no: se lee de `game/notification_copy.py`, que es donde se decide.
#
# Tenerlo escrito a mano sería la forma segura de que la columna «nominal»
# muestre el reparto de hace tres meses justo en la tabla que existe para
# detectar que el reparto real no es el configurado.
COPY_PROGRAMADO = {
    "social": ("Cuántos compañeros de su universidad ya derivaron hoy",
               "{n} compañeros de la {uni} ya derivaron hoy. ¿Vos? 🎓"),
    "reactivacion": ("Hace días que no entra",
                     "Hace {n} días que no derivás. Te están pasando 👀"),
    "record": ("Su mejor tanda de derivadas seguidas",
               "Tu mejor tanda fueron {n} derivadas seguidas. ¿La superás? 🚀"),
}

COPY_REACTIVO = {
    "empuje": ("Alguien invitó un cafecito para su universidad",
               "Alguien de la {uni} invitó un cafecito. Tenés ×1,4 por 24 h ☕"),
    "recluta": ("Un reclutado suyo empezó a generarle XP",
                "Reclutaste a @{alias} y ya te dio {xp} XP 🪖"),
    "ranking": ("Alguien lo pasó en el ranking",
                "@{alias} te pasó en el ranking. ¿Lo dejás así? 🤼"),
    "universidad": ("Su universidad pasó o está por ser pasada",
                    "La {uni} le pasó a la {rival} en el ranking 🏛️"),
}


# Las pestañas del panel, en el orden en que conviene leerlas: cuánta gente hay,
# dónde se cae, cuánto aguanta la que se queda, y —recién ahí— qué hacemos para
# traerla de vuelta y quién nos trae gente nueva.
#
# Son PESTAÑAS y no una página larga porque las tres se miran de a una: no hay
# ninguna lectura que necesite el embudo y la curva de profundidad a la vez, y
# scrollear entre ellas obligaba a acordarse del número de arriba mientras se
# busca el de abajo.
#
# La pestaña viaja en la URL (`?s=`) y no en un `:target` ni en un radio con
# CSS. Cuesta una recarga, pero deja el estado entero —semana, pestaña y
# desglose— en un link que se puede compartir y que sobrevive al botón de
# atrás. Con el estado del lado del navegador, cambiar el desglose —que sí
# recarga, porque cambia los datos— devolvía a la primera pestaña.
SECCIONES: tuple[tuple[str, str], ...] = (
    ("titulares", "Titulares"),
    ("embudo", "Embudo"),
    ("profundidad", "Profundidad"),
    ("push", "Push"),
    ("mails", "Mails"),
    ("reclutas", "Reclutas"),
)
SECCION_POR_DEFECTO = SECCIONES[0][0]


def week_of_today() -> date:
    from .queries import local_date, week_start
    return week_start(local_date(datetime.utcnow()))


# ── Página ───────────────────────────────────────────────────────────────────

def page(p: dict, *, token: str, seccion: str = SECCION_POR_DEFECTO,
         viral: str = VISTA_VIRALIDAD_POR_DEFECTO) -> str:
    m = p["meta"]
    claves = [c for c, _ in SECCIONES]
    seccion = seccion if seccion in claves else SECCION_POR_DEFECTO
    vistas = [v for v, _ in VISTAS_VIRALIDAD]
    viral = viral if viral in vistas else VISTA_VIRALIDAD_POR_DEFECTO
    week = date.fromisoformat(m["week"])
    labels = m["labels"]
    semanas = [date.fromisoformat(w) for w in m["weeks"]]

    out: list[str] = ["<div class='wrap'>"]

    # Cabecera: dos cajas, ancha + angosta, igual que el header del juego.
    today = week_of_today()
    corte_actual = p["profundidad"]["corte"]
    nav = []
    for i in range(4, -1, -1):
        # Sin bajar del piso del panel: ofrecer semanas anteriores a la difusión
        # es ofrecer ceros estructurales con forma de historia.
        w = today - timedelta(weeks=i)
        if w < FIRST_WEEK:
            continue
        lab = w.strftime("%d/%m")
        if w == week:
            nav.append(f'<span class="cur">{lab}</span>')
            continue
        q = f"?w={w.isoformat()}"
        if seccion != SECCION_POR_DEFECTO:
            q += f"&s={seccion}"
        if corte_actual != "total":
            q += f"&corte={corte_actual}"
        nav.append(f'<a href="/panel/{esc(token)}/dx{q}">{lab}</a>')
    # La marca lleva el link al panel de Intervalo. Antes eso vivía en una
    # segunda caja a la derecha; al sacarla, el logo se queda con el trabajo que
    # hace en cualquier cabecera —volver a la casa— en vez de perderse la única
    # forma de saltar de un panel al otro.
    out.append(
        "<header class='top'><div class='box'>"
        f"<a class='brand' href='/panel/{esc(token)}' title='Panel de Intervalo'>"
        "intervalo"
        "<span class='bar'>" + "".join(
            f"<i style='background:{c}'></i>" for c in theme.BELT_BAR) +
        "</span></a>"
        f"<div class='weeknav'>{''.join(nav)}</div>"
        "</div></header>")

    def link(*, s: str | None = None, corte: str | None = None,
             v: str | None = None) -> str:
        """La URL del panel cambiando UNA cosa y dejando el resto como está.

        Es lo que hace que las barras convivan: elegir semana no pierde la
        pestaña, elegir desglose no devuelve a la primera, y cambiar la vista
        del gráfico de viralidad no pierde ninguna de las dos."""
        s = s if s is not None else seccion
        corte = corte if corte is not None else p["profundidad"]["corte"]
        v = v if v is not None else viral
        q = f"?w={week.isoformat()}"
        if s != SECCION_POR_DEFECTO:
            q += f"&s={s}"
        if corte != "total":
            q += f"&corte={corte}"
        if v != VISTA_VIRALIDAD_POR_DEFECTO:
            q += f"&v={v}"
        return f"/panel/{esc(token)}/dx{q}"

    tabs = "".join(
        f'<span class="cur">{esc(t)}</span>' if c == seccion
        else f'<a href="{link(s=c)}">{esc(t)}</a>'
        for c, t in SECCIONES)
    out.append(f"<nav class='jump'>{tabs}</nav>")

    # Las tres se arman siempre y se muestra una. Armarlas cuesta unos SVG que
    # nadie va a ver, y a cambio el archivo se sigue leyendo en el orden del
    # panel en vez de partirse en tres ramas con el cuerpo de cada sección
    # colgando de un `if`.
    cabecera = "".join(out)
    paneles: dict[str, str] = {}

    # ── 0 · Titulares ────────────────────────────────────────────────────────
    out = []
    out.append(_section(
        0, f"Titulares · semana del {labels[-1]}",
        f'<div class="grid g4">{"".join(_kpi(c) for c in p["headline"])}</div>',
        sub="El sparkline son las semanas visibles."))
    paneles["titulares"] = "".join(out)

    # ── 1 · Embudo ───────────────────────────────────────────────────────────
    out = []
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
        # Barras más finas y más juntas que el default: diez pasos con el aire
        # de siempre pedían media pantalla de scroll para leer una lista que se
        # entiende de un vistazo.
        _box("", ch.hbars(rows, colors=["var(--indigo)"], bar_h=18, gap=6),
             note="<b>Arranca en «abrió el juego»</b> y no en «vio el link»: la fila del estudiante "
                  "se crea en la primera carga de la página, así que todo lo anterior —cuánta "
                  "gente vio el mensaje de WhatsApp, cuánta tocó y no llegó a cargar— solo lo "
                  "sabe PostHog. Preferimos que el embudo empiece tarde y sea cierto."
                  "<br><br><b>«Cargó universidad» y «se registró» no son parte de la "
                  "cadena</b>, y por eso se leen contra la cohorte y no contra el paso de "
                  "arriba. Están puestos donde el juego los pide —carrera y universidad en la "
                  f"derivada <b>{PEDIDO_PERFIL}</b>, el registro en la <b>{PEDIDO_REGISTRO}</b>— "
                  "para poder compararlos con la gente que llegó hasta ahí. Alguien que viene "
                  "de Intervalo cuenta en los dos desde el minuto cero, sin haber derivado "
                  "nada."),
        sub=f"Cohorte de los {num(f['base'])} estudiantes que abrieron el juego en la semana del "
            f"{labels[-1]}, seguida hasta hoy.",
        anchor="embudo"))
    paneles["embudo"] = "".join(out)

    # ── 2 · Profundidad ──────────────────────────────────────────────────────
    out = []
    pr = p["profundidad"]
    corte = pr["corte"]
    # Las cohortes son el MISMO indicador en momentos distintos, así que van en
    # un solo tono con la vieja apagada y la nueva al frente (charts.ramp): un
    # color por semana las haría leer como categorías separadas. Universidad y
    # aparato sí son categorías, y ahí cada una lleva su color —el de marca en
    # el caso de las universidades, que es el del chip del ranking—.
    mono = corte == "cohorte"

    def color_de(serie: dict) -> str | None:
        if corte == "universidad":
            return UNIVERSITY_COLOR.get(serie["clave"] or "")
        return None

    series = [{
        "label": f'{s["label"]} (n={s["base"]})' if corte != "total" else "Siguen jugando",
        "color": color_de(s),
        "values": [c["pct"] for c in s["curva"]],
        "tips": [f'{s["label"]}: {c["vivos"]} de {s["base"]} llegaron a responder '
                 f'{c["k"]} derivadas ({_pct_txt(c["pct"])}).\n'
                 f'De los que llegaron a la {c["k"]}, {_pct_txt(c["abandono"])} no hizo '
                 f'la siguiente.' for c in s["curva"]],
        # Menos de 10 partidas vivas: el porcentaje se mueve entero con una
        # persona y se dibuja punteado para que no se lea como tendencia.
        "weak": [c["vivos"] < 10 for c in s["curva"]],
    } for s in pr["series"]]

    peor = pr["peor_escalon"]
    peor_txt = (f'El escalón más grande del tramo 1–20 está en la derivada '
                f'<b>#{peor["k"]}</b>: de los {peor["vivos"]} que llegaron ahí, '
                f'{_pct_txt(peor["abandono"])} no hizo la siguiente.'
                if peor else "Todavía no hay base para señalar un escalón.")
    resumen = (f'Mediana <b>{num(pr["mediana"])}</b> derivadas · p90 '
               f'<b>{num(pr["p90"])}</b>. ' if pr["base"] else
               'Todavía no hay ninguna partida cerrada en esta ventana. ')
    if corte == "total":
        alcance = ""
    elif not series:
        alcance = ("<br><br><b>El desglose quedó vacío</b>: ningún grupo llega a las cinco "
                   "partidas cerradas que hacen falta para merecer su propia línea, así que "
                   "no hay nada que dibujar sin dibujar ruido.")
    elif corte == "cohorte":
        # Acá las líneas NO parten la cohorte: son otras camadas. Decir «cubren
        # X de Y» sería mentir sobre lo que se está mirando.
        alcance = ('<br><br><b>Cada línea es una camada distinta</b>, no un pedazo de esta: '
                   'la de la semana elegida y las dos anteriores, cada una seguida desde su '
                   'propio día uno. Por eso no suman — se comparan.')
    else:
        afuera = pr["base"] - pr["cubiertos"]
        alcance = (f'<br><br><b>Las líneas parten esta misma cohorte</b>: cubren '
                   f'{num(pr["cubiertos"])} de sus {num(pr["base"])} partidas cerradas'
                   + (f', y quedan {num(afuera)} afuera — quien no cargó ese dato, y los grupos '
                      f'con menos de cinco partidas, que dibujarían el ruido de cuatro personas '
                      f'con la misma tinta que la tendencia de cuarenta.' if afuera else "."))

    if not series:
        grafico = '<p class="empty">todavía no hay partidas cerradas en esta ventana</p>'
    else:
        grafico = ch.lines(series, [str(c["k"]) for c in pr["curva"]], suffix="%",
                           height=340, y_max=100, legend=corte != "total", mono=mono)

    # El selector va pegado al gráfico que gobierna, y no arriba de la página:
    # es lo único que cambia, así que si vive lejos hay que acordarse de que
    # existe. Son links y no un `<select>` porque el panel no tiene JavaScript —
    # y de yapa cada corte queda con URL propia, así que se puede compartir o
    # abrir dos en dos pestañas para compararlos al mismo tiempo.
    selector = "".join(
        f'<span class="cur">{esc(t)}</span>' if c == corte
        else f'<a href="{link(corte=c)}">{esc(t)}</a>'
        for c, t in [("total", "Todos"), ("cohorte", "Por cohorte"),
                     ("universidad", "Por universidad"), ("aparato", "Por aparato")])
    cuerpo = (f"<div class='cortes'><span class='sub'>Desglose</span>{selector}</div>"
              + grafico)

    out.append(_section(
        2, "Profundidad",
        _box("Cuántos siguen jugando en la derivada k", cuerpo,
             note=resumen + peor_txt + alcance
                  + "<br><br>Una partida es la <b>primera tanda</b> de cada uno —lo que hizo "
                    "hasta despegarse media hora— y entra recién cuando esa tanda ya no puede "
                    "crecer: quien está jugando ahora todavía puede sumar derivadas, y "
                    "contarlo hundiría la cola por reloj y no por comportamiento. De esta "
                    f'cohorte quedaron afuera {num(pr["abiertos"])} partidas todavía abiertas.'
                    "<br><br>El tramo punteado es donde quedan menos de diez partidas vivas: "
                    "ahí el porcentaje se mueve entero con una persona y no conviene leer la "
                    "forma."),
        sub=f"La misma cohorte del embudo —los que abrieron el juego en la semana del "
            f"{labels[-1]}—, en su primera sentada. Es la métrica del juego: el Elo, el ranking y "
            f"el cafecito existen para mover esta curva.",
        anchor="profundidad"))
    paneles["profundidad"] = "".join(out)

    # ── 3 · Push ─────────────────────────────────────────────────────────────
    out = []
    pu = p["push"]
    total_enviadas = pu["enviadas"] or 1
    filas_copy = []
    for r in pu["por_categoria"]:
        cat = r["categoria"]
        if cat in COPY_REACTIVO:
            desc, ejemplo = COPY_REACTIVO[cat]
            nominal = "evento"
        else:
            desc, ejemplo = COPY_PROGRAMADO.get(cat, ("—", "—"))
            peso = PESOS_DEL_COPY.get(cat)
            nominal = "—" if peso is None else num(100 * peso, "%", dec=0)
        filas_copy.append([
            f'<b>{esc(cat)}</b><br><span class="sub2">{esc(desc)}</span>'
            f'<br><span class="ej">{esc(ejemplo)}</span>',
            r["enviadas"], num(100 * r["enviadas"] / total_enviadas, "%"), nominal,
            r["abiertas"], _pct_txt(r["ctr"])])

    out.append(_section(
        3, "Re-enganche · push",
        '<div class="grid g4">'
        + "".join(_kpi_chico(l, v, h, dec=0)
                  for l, v, h in [
                      ("Suscripciones push", pu["subs"], "navegadores registrados"),
                      ("Con notificación activa", pu["activos"],
                       f'{pu["alcanzables"]} con navegador suscripto'),
                      ("Enviadas", pu["enviadas"], "en la ventana visible"),
                      ("Abiertas", pu["abiertas"], "clicks en la notificación")])
        + "</div>"
        + _box(
            "Por categoría de copy",
            _table(["Copy", "Enviadas", "Real", "Nominal", "Abiertas", "CTR"],
                   filas_copy, empty="todavía no salió ningún aviso"),
            note=(
                f'CTR global {_pct_txt(pu["ctr"])}. <b>Real</b> es qué porción de los envíos '
                f'se llevó cada copy y <b>nominal</b> el peso que tiene asignado en '
                f'<code>game/notification_copy.py</code>. Si se separan mucho hay variantes '
                f'que casi nunca aplican —piden un hecho que no ocurre— y el reparto '
                f'efectivo no es el que se configuró.'
                f'<br><br><b>«Con notificación activa» no es «va a recibir avisos de dx».</b> '
                f'Para un jugador con cuenta la preferencia vive en <code>users</code>, o sea '
                f'que la puede haber prendido en Intervalo y para otro producto; para un '
                f'invitado vive en <code>game_players</code>. El número mira las dos, y el '
                f'renglón de abajo dice cuántos de esos además tienen un navegador suscripto, '
                f'que es la condición que falta para que le llegue algo. Si ese segundo número '
                f'queda muy por debajo de las suscripciones, alguien se suscribió y la '
                f'preferencia no se guardó.'
                f'<br><br><b>Las cuatro de abajo son avisos de EVENTO</b> y no entran al '
                f'sorteo: salen porque pasó algo —alguien donó, un recluta empezó a rendir, '
                f'te pasaron en el ranking— y tienen cupo propio, así que no compiten por el '
                f'lugar del recordatorio del día. No tienen «nominal» porque la variante la '
                f'decide el hecho.')),
        sub="El canal que existe para que alguien vuelva sin que se lo tengamos que recordar "
            "por WhatsApp. Le llega también a los invitados, que son la mayoría del juego.",
        anchor="push"))
    paneles["push"] = "".join(out)

    # ── 4 · Mails ────────────────────────────────────────────────────────────
    out = []
    ma = p["mails"]
    filas_mail = [[f'<b>{esc(t["tipo"])}</b>', esc(t["desc"]), t["enviados"],
                   t["activados"], _pct_txt(t["pct"])] for t in ma["tipos"]]
    out.append(_section(
        4, "Re-enganche · mails de ciclo de vida",
        '<div class="grid g4">'
        + "".join(_kpi_chico(l, v, h, suffix=sfx, dec=0 if not sfx else 1)
                  for l, v, sfx, h in [
                      ("Enviados", ma["enviados"], "", "en la ventana visible"),
                      ("Activaron", ma["activados"], "",
                       f'volvieron a derivar en {ma["ventana_dias"]} días'),
                      ("Tasa de activación", ma["pct"], "%", "sobre los enviados"),
                      ("Bajas", ma["bajas"], "",
                       f'de {ma["alcanzables"]} jugadores con mail')])
        + "</div>"
        + _box(
            "Por copy",
            _table(["Copy", "A quién va", "Enviados", "Activaron", "Tasa"],
                   filas_mail, empty="todavía no salió ningún mail"),
            note=(
                f'<b>Activar</b> = responder una derivada dentro de los '
                f'{ma["ventana_dias"]} días siguientes al envío. Es lo más cerca de «el mail '
                f'funcionó» que se puede medir sin aperturas: Resend las conoce pero no '
                f'llegan a esta base, y necesitan un webhook '
                f'(<code>email.opened</code>) contra un endpoint nuevo.'
                f'<br><br>Dos salvedades. <b>«reclutas_semanal» no se compara con el otro</b>: '
                f'va a quien tiene reclutas rindiendo esta semana, o sea gente que ya está '
                f'activa, así que su tasa arranca alta por selección y esa gente volvía '
                f'igual. Y <b>no hay grupo de control</b>: todo el que califica recibe el '
                f'mail, así que esto es una tasa bruta y no un efecto causal — para saber '
                f'cuánto aporta habría que dejar un holdout sin mandar.'
                f'<br><br><b>Al invitado no le llega ninguno</b>, y no es un olvido: '
                f'<code>users.email</code> viene de Clerk. A esa persona solo se la puede '
                f'alcanzar por push. El mail del cafecito tampoco está acá: su marcador se '
                f'escribe aunque el mail no salga, así que contarlo sería inventar envíos.')),
        sub="Los dos mails que le llegan a un jugador CON cuenta. Lo que miden es si el mail "
            "lo trajo de vuelta, no si lo abrió.",
        anchor="mails"))
    paneles["mails"] = "".join(out)

    # ── 5 · Reclutas ─────────────────────────────────────────────────────────
    out = []
    rc = p["reclutas"]
    etiquetas = [w["label"] for w in rc["semanas"]]
    if viral == "volumen":
        series_viral = [
            {"label": "Nuevos", "color": AZUL_NUEVOS,
             "values": [w["nuevos"] for w in rc["semanas"]],
             "tips": [f'{w["label"]}: {w["nuevos"]} jugadores nuevos'
                      for w in rc["semanas"]]},
            {"label": "Reclutados", "color": VERDE_RECLUTAS,
             "values": [w["reclutados"] for w in rc["semanas"]],
             "tips": [f'{w["label"]}: {w["reclutados"]} entraron por un link '
                      f'({_pct_txt(w["pct_reclutados"])} de los nuevos)'
                      for w in rc["semanas"]]},
        ]
        sufijo_viral = ""
    else:
        series_viral = [
            {"label": "K", "color": VERDE_RECLUTAS,
             "values": [w["k"] for w in rc["semanas"]],
             "tips": [f'{w["label"]}: {num(w["k"], dec=2)} — {w["reclutados"]} '
                      f'reclutas sobre {w["base"]} que ya estaban'
                      for w in rc["semanas"]]},
        ]
        sufijo_viral = ""

    selector_viral = "".join(
        f'<span class="cur">{esc(t)}</span>' if v == viral
        else f'<a href="{link(v=v)}">{esc(t)}</a>'
        for v, t in VISTAS_VIRALIDAD)
    grafico_viral = (
        f"<div class='cortes'><span class='sub'>Vista</span>{selector_viral}</div>"
        + ch.lines(series_viral, etiquetas, suffix=sufijo_viral, height=240,
                   legend=viral == "volumen"))

    filas_top = [[f'@{esc(t["alias"])}',
                  _uni_chip(t["university"]) if t["university"] else "—",
                  t["reclutas"], t["xp"]] for t in rc["top"]]
    out.append(_section(
        5, "Reclutas",
        # Dos titulares y no cuatro: el K de la última semana y el top
        # reclutador estaban repitiendo, en formato de número grande, el último
        # punto de la curva y la primera fila de la tabla que vienen justo
        # abajo. Un titular que repite lo de al lado gasta el lugar donde
        # debería estar lo que no se ve en ningún otro lado.
        '<div class="grid g2">'
        + "".join(_kpi_chico(l, v, h, suffix=sfx, dec=0 if not sfx else 1)
                  for l, v, sfx, h in [
                      ("Reclutados", rc["total_reclutados"], "",
                       "jugadores que entraron por un link"),
                      ("Del total de jugadores", rc["pct_reclutados"], "%",
                       f'sobre {rc["total_jugadores"]}')])
        + "</div>"
        + _box(
            "Coeficiente de viralidad por semana",
            grafico_viral,
            note=(
                "<b>K</b> = reclutas nuevos de la semana sobre los jugadores que YA EXISTÍAN "
                "antes de esa semana, o sea «cuántos jugadores nuevos trae, en promedio, cada "
                "uno de los que ya estaban». No es la fórmula completa —invitaciones × "
                "conversión—: no sabemos cuántos links se mandaron, solo cuántos prendieron. "
                "<b>K &gt; 1 es crecimiento que se sostiene solo</b>; por debajo, el link "
                "ayuda pero no alcanza como único canal."))
        + _box(
            "Top reclutadores",
            _table(["Reclutador", "Universidad", "Reclutas", "XP ganada"], filas_top,
                   empty="todavía nadie reclutó"),
            note=(
                "De SIEMPRE y no de la ventana visible, como el ranking del juego: no tendría "
                "sentido resetear a quien lleva meses trayendo gente solo porque esta semana "
                "no reclutó a nadie nuevo. Un solo nivel — los reclutas de tus reclutas no "
                "suman acá (ver <code>game/referrals.py</code>). <b>XP ganada</b> es la suma "
                "de lo que cada recluta le generó, que es el 10% de lo que ese recluta hizo.")),
        sub="El único canal de crecimiento que no depende de que difundamos nosotros.",
        anchor="reclutas"))
    paneles["reclutas"] = "".join(out)

    out = [cabecera, paneles[seccion]]
    out.append(
        f"<footer>Generado {esc(m['generated_at'])} · zona {esc(m['tz'])} · "
        f"semana del {esc(labels[-1])}. "
        f"<a href='/panel/{esc(token)}/dx/data.json?w={week.isoformat()}'>data.json</a>"
        f"</footer></div>")

    return (
        "<!doctype html><html lang='es'><head><meta charset='utf-8'>"
        "<meta name='viewport' content='width=device-width,initial-scale=1'>"
        "<meta name='robots' content='noindex,nofollow'>"
        "<title>Intervalo — Dashboard</title>"
        f"{theme.FAVICON_LINK}{theme.FUENTE_MARCA}"
        f"<style>{CSS}</style></head><body>{''.join(out)}</body></html>")
