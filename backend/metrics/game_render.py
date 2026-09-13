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

**No hay sección de titulares**: los doce números de la semana viven arriba del
gráfico que los explica, cada uno en su pestaña (ver `game_queries.headline`).
Juntos arriba de todo eran doce marcadores que había que memorizar para bajar a
buscar contra qué leerlos, y cada sección arrancaba con un gráfico al que le
faltaba justo su número.

El panel llegó a tener once secciones —el diagnóstico del Elo, la tabla de
plantillas, el embudo del cafecito, la fricción del teclado— y se recortó a
cinco. Lo que se fue no estaba mal medido: era instrumentación del motor, que se
mira cuando se está tocando el motor y no todos los días. Las consultas se
borraron con la sección, no se dejaron colgadas alimentando un `data.json` que
nadie lee (`git log` las tiene si hacen falta de nuevo).
"""
from __future__ import annotations

from datetime import date, datetime, timedelta

from . import charts as ch
from . import theme
from .charts import esc, num
from .game_queries import FIRST_WEEK, PEDIDO_CAFECITO, PLATFORM_LABEL

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


# Los cuatro estados en que puede estar un experimento, con su color. El estado
# va arriba de todo y en grande porque es lo único que la sección existe para
# decir: cuando todavía no se puede leer, los números de abajo son ruido con
# forma de resultado, y a un número con forma de resultado se le cree.
_ESTADOS = {
    "espera": ("#8a8aa8", "#23233a"),
    "listo": ("#4f7fe0", "#1a2540"),
    "gana": ("#2fb673", "#12301f"),
    "pierde": ("#d4604a", "#341a15"),
    "plano": ("#8a8aa8", "#23233a"),
}


def _caja_estado(titulo: str, cuerpo: str, tono: str) -> str:
    borde, fondo = _ESTADOS.get(tono, _ESTADOS["espera"])
    return (f'<div style="border:1px solid {borde};background:{fondo};border-radius:8px;'
            f'padding:12px 14px;margin-bottom:12px">'
            f'<div style="color:{borde};font-weight:700;font-size:13.5px">{esc(titulo)}</div>'
            f'<div class="hint" style="margin-top:4px">{cuerpo}</div></div>')


def _p_txt(p: float) -> str:
    """El p-valor, con un piso: por debajo de 0,001 el número exacto no dice nada
    que «< 0,001» no diga, y escribirlo con seis decimales invita a leerlo como
    una medida de cuán grande es el efecto, que es justo lo que no es."""
    return "&lt; 0,001" if p < 0.001 else num(p, dec=3)


def _recortar(txt: str, n: int) -> str:
    """Corta en el último espacio antes de `n`, no a mitad de palabra.

    «Análisis Matemático II (FIUB» se lee como un dato roto; «Análisis
    Matemático II…» se lee como un dato recortado, que es lo que es."""
    if len(txt) <= n:
        return txt
    corte = txt[:n].rsplit(" ", 1)[0]
    return (corte or txt[:n]) + "…"


def _pct_txt(v) -> str:
    return "—" if v is None else num(v, "%")


# El gráfico de viralidad tuvo un selector con dos vistas —el coeficiente y el
# volumen del que sale— porque una división sin sus dos términos a la vista no se
# puede auditar: un K que salta de 0,02 a 0,12 puede ser mucha gente nueva
# reclutada o poca gente vieja en el denominador.
#
# Se fue, y el argumento sigue siendo válido: lo que cambió es quién lo contesta.
# Ahora los cuatro números de arriba de la sección traen los dos términos
# —reclutas nuevos y reclutas activados— más las dos versiones del coeficiente,
# así que el selector agregaba un clic para mostrar lo que ya está escrito unas
# líneas más arriba. Lo único que la vista de volumen mostraba y los titulares no
# es la BASE, el denominador; si algún día hace falta auditar un salto de K, es
# eso lo que hay que traer de vuelta y no el selector entero.

# El mismo verde con el que el juego pinta reclutar (WhatsApp) en la app. El azul
# que lo acompañaba se fue con la vista de volumen: era el color de la serie de
# «nuevos», y esa serie ya no se dibuja.
VERDE_RECLUTAS = "#2fb673"


def _fila_kpi(cards: list[dict], clase: str = "g4") -> str:
    """La fila de números de la semana que encabeza una sección.

    Va ARRIBA del gráfico y no debajo: es el resumen de lo que se está por
    mirar, y leerlo después del gráfico es leerlo dos veces. La clase define
    cuántos entran por fila a lo ancho — `g4` para cuatro, `g5` para cinco, `g3`
    para tres— y con `auto-fit` cada una se reacomoda sola al angostarse.
    """
    return f'<div class="grid {clase}">{"".join(_kpi(c) for c in cards)}</div>'


def _kpi_chico(label: str, valor, hint: str = "", suffix: str = "", dec: int = 1) -> str:
    """Un número con su etiqueta, sin sparkline ni delta.

    El otro —`theme.kpi`, el que arma `_fila_kpi`— pide serie y variación
    semanal: son los doce números de la semana, que se leen comparándolos con la
    anterior. Estos son otra cosa —cuántas suscripciones hay, cuántos mails
    salieron, cuántos reclutas hubo DESDE SIEMPRE— y no tienen contra qué
    compararse semana a semana sin inventar una serie.
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
                    "La {uni} superó a la {rival} en el ranking 🏛️"),
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
#
# No hay pestaña de titulares y por eso la primera es el embudo: los números de
# la semana se repartieron entre las secciones que los explican. Un `?s=titulares`
# viejo cae acá solo, como cualquier pestaña que no existe.
# Cinco, y cada una contesta UNA pregunta: quién llega, quién se queda, cómo se
# juega, quién paga, y qué estamos probando. Antes eran seis y estaban
# organizadas por feature —el embudo, la profundidad, los avisos, los reclutas—
# que es el orden en que se construyó el producto y no el orden en que se toman
# decisiones. Con ese reparto, «reclutas» y «embudo» contestaban la misma
# pregunta desde dos pestañas distintas, y la retención no estaba en ninguna.
#
# Monetización se separó de Retención porque son dos preguntas y no una. Poner
# plata cuesta plata y volver a jugar cuesta tiempo, y el cafecito además tiene
# un embudo propio —se muestra, se toca, se paga— que adentro de Retención era
# un número suelto sin nada contra qué leerlo.
SECCIONES: tuple[tuple[str, str], ...] = (
    ("activacion", "Activación"),
    ("retencion", "Retención"),
    ("jugabilidad", "Jugabilidad"),
    ("monetizacion", "Monetización"),
    ("experimentacion", "Experimentación"),
)
SECCION_POR_DEFECTO = SECCIONES[0][0]


def week_of_today() -> date:
    from .queries import local_date, week_start
    return week_start(local_date(datetime.utcnow()))


# ── Página ───────────────────────────────────────────────────────────────────

def page(p: dict, *, token: str, seccion: str = SECCION_POR_DEFECTO) -> str:
    m = p["meta"]
    claves = [c for c, _ in SECCIONES]
    seccion = seccion if seccion in claves else SECCION_POR_DEFECTO
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

    def link(*, s: str | None = None, corte: str | None = None) -> str:
        """La URL del panel cambiando UNA cosa y dejando el resto como está.

        Es lo que hace que las dos barras convivan: elegir semana no pierde la
        pestaña, y elegir desglose no devuelve a la primera."""
        s = s if s is not None else seccion
        corte = corte if corte is not None else p["profundidad"]["corte"]
        q = f"?w={week.isoformat()}"
        if s != SECCION_POR_DEFECTO:
            q += f"&s={s}"
        if corte != "total":
            q += f"&corte={corte}"
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
    elif corte == "sesion":
        # Las dos advertencias van juntas porque sin ellas el gráfico se lee al
        # revés: parece que la segunda vuelta es más fácil, cuando lo que pasa es
        # que a la segunda vuelta llega otra gente.
        alcance = (
            '<br><br><b>Las dos líneas no se reparten nada</b>, y ni siquiera cuentan lo '
            'mismo: la primera es la primera tanda de cada uno —la misma curva que '
            '«Todos»— y la segunda son TODAS las que vinieron después, contadas de a '
            '<b>tanda</b> y no de a persona. Quien volvió cuatro veces aporta una partida a '
            'la primera línea y tres a la segunda, porque la pregunta es cuánto rinde una '
            'vuelta y no cuánto rinde alguien que vuelve.'
            '<br><br><b>Si la segunda aguanta más, no es que el juego se vuelva más fácil.</b> '
            'A la segunda vuelta solo llega el que se enganchó, así que la población ya está '
            'filtrada por lo mismo que se está midiendo. Lo que sí se puede leer es la forma: '
            'si el escalón se corre de lugar entre una línea y la otra, el que vuelve se cae '
            'por otro motivo que el que recién llega.'
            '<br><br>Es además <b>el único corte que no se congela</b>. Los demás miran una '
            'sentada que ya pasó; las vueltas siguen ocurriendo, así que la segunda línea de '
            'una semana vieja se sigue moviendo cada vez que alguien de esa camada vuelve.')
        if len(series) < 2:
            alcance += (
                '<br><br><b>Todavía no hay segunda línea</b>: no llegan a cinco las tandas '
                'cerradas de la segunda vuelta en adelante, y cuatro dibujarían una escalera '
                'de a 25 puntos con la misma tinta que la tendencia de cuarenta.')
    else:
        afuera = pr["base"] - pr["cubiertos"]
        alcance = (f'<br><br><b>Las líneas parten esta misma cohorte</b>: cubren '
                   f'{num(pr["cubiertos"])} de sus {num(pr["base"])} partidas cerradas'
                   + (f', y quedan {num(afuera)} afuera — quien no cargó ese dato, y los grupos '
                      f'con menos de cinco partidas, que dibujarían el ruido de cuatro personas '
                      f'con la misma tinta que la tendencia de cuarenta.' if afuera else "."))


    # Qué son las franjas va SIEMPRE que el corte esté elegido, tenga líneas o
    # no: la definición del corte no depende de que esta semana haya alcanzado
    # para dibujarlo, y quien abre el desglose y encuentra el gráfico vacío es
    # justamente quien más necesita saber qué habría visto.
    if corte == "horario":
        alcance += (
            '<br><br><b>La franja es la hora a la que arrancó la partida</b>, en horario de '
            'Argentina: mañana 06–13, tarde 13–20, noche 20–06. Los bordes salen de la '
            'distribución real y no de la costumbre — el 78% de las partidas arranca entre las '
            '11 y las 16, y de la medianoche a las 7 hay tres en toda la historia del juego, '
            'así que la madrugada va adentro de la noche en vez de ser una cuarta línea de '
            'ruido. El corte de la mañana está en las 13 y no en las 12 porque a las 12 la '
            'mañana pierde un tercio de su masa sin ningún motivo más que la costumbre.'
            '<br><br><b>Ojo con leerlo como un horario bueno y uno malo.</b> El juego se difunde '
            'por WhatsApp en tandas, así que la hora de arranque es en buena parte la hora a la '
            'que salió el mensaje: el corte se parece más a «por qué difusión llegaste» que a '
            '«cuándo rendís mejor». Medido sobre las tres cohortes que hay, la mañana aguanta '
            'más en dos y menos en la tercera.')

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
        for c, t in [("total", "Todos"), ("sesion", "Por sesión"),
                     ("cohorte", "Por cohorte"),
                     ("universidad", "Por universidad"), ("aparato", "Por aparato"),
                     ("horario", "Por horario")])
    cuerpo = (f"<div class='cortes'><span class='sub'>Desglose</span>{selector}</div>"
              + grafico)

    out.append(_section(
        1, "Profundidad",
        _box("Cuántos siguen jugando en la derivada k", cuerpo,
             note=resumen + peor_txt + alcance
                  + "<br><br>Una partida es una <b>tanda</b> —lo que alguien hizo hasta "
                    "despegarse media hora— y, salvo en el desglose por sesión, la que se "
                    "mide es la <b>primera</b> de cada uno. Entra recién cuando ya no puede "
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
    pieza_profundidad = "".join(out)

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
        1, "Re-enganche · push",
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
    pieza_push = "".join(out)

    # ── 4 · Mails ────────────────────────────────────────────────────────────
    out = []
    ma = p["mails"]
    filas_mail = [[f'<b>{esc(t["tipo"])}</b>', esc(t["desc"]), t["enviados"],
                   t["activados"], _pct_txt(t["pct"])] for t in ma["tipos"]]
    out.append(_section(
        2, "Re-enganche · mails de ciclo de vida",
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
    pieza_mails = "".join(out)

    # ── 5 · Reclutas ─────────────────────────────────────────────────────────
    out = []
    rc = p["reclutas"]
    # La curva es la de ACTIVADOS y no la general: es la única de las dos que es
    # una tasa de reproducción —la unidad que se produce es la misma que
    # produce— y por lo tanto la única cuya distancia a 1 significa algo. La
    # general se queda como número en la fila de arriba, para poder auditar.
    #
    # Y va desde la primera camada del panel hasta la elegida, no las últimas
    # cuatro: con cuatro puntos una tendencia no se distingue de un rebote, y
    # esta métrica tiene el numerador en un dígito.
    cm = p["camadas"]["filas"]
    etiquetas_viral = [c["label"] for c in cm]
    series_viral = [
        {"label": "K de activados", "color": VERDE_RECLUTAS,
         "values": [c["k_act"] for c in cm],
         # `weak` dibuja el punto hueco y el tramo punteado. Es exactamente lo
         # que hace falta para una camada que todavía puede sumar reclutas: el
         # dato EXISTE —por eso no es un None, que cortaría la línea— pero está
         # incompleto, y dibujarlo igual de firme que el resto hace leer como
         # caída lo que es una camada a medio terminar. Sin esto, el último
         # punto siempre baja y siempre miente.
         "weak": [not c["madura"] for c in cm],
         "tips": [f'{c["label"]}: {num(c["k_act"], dec=2)} — {c["reclutas_act"]} '
                  f'reclutas activados sobre los {c["n_act"]} de la camada que '
                  f'arrancaron'
                  + ("" if c["madura"] else " · todavía sumando")
                  for c in cm]},
    ]
    # `suffix=""` explícito: `ch.lines` rotula en % por defecto y K NO es un
    # porcentaje sino una razón —cuánta gente trae cada uno—. Sin esto el eje
    # dice «0,6%» donde el número vale 0,6, que es cien veces menos.
    # Con una sola camada no hay curva que dibujar: `ch.lines` pinta un punto
    # suelto y cinco marcas de eje para un número que la tabla de abajo ya trae
    # entero. Vuelve sola en cuanto haya dos, que es cuando empieza a decir algo
    # —una tendencia necesita al menos dos puntos, y para distinguirla de un
    # rebote hacen falta más.
    grafico_viral = (
        ch.lines(series_viral, etiquetas_viral, suffix="", height=240, legend=False)
        if len(cm) > 1 else
        '<p class="empty">una camada sola no hace una curva — vuelve cuando haya dos</p>')

    # El cartel de compartir, que es el primer escalón del canal. Puede no
    # existir si todavía no se mostró ninguno.
    sh = next((c for c in p["carteles"] if c["cta"] == "share"), None)

    # El reclutamiento abierto por universidad. Ordenado por reclutas y no por
    # K: la pregunta que la tabla contesta primero es de dónde sale la gente que
    # entró, y recién después a qué ritmo la trae cada casa.
    filas_uni = [[
        _uni_chip(u["clave"]) if u["chip"] else f'<b>{esc(u["clave"])}</b>',
        num(u["jugadores"]), num(u["reclutas"]), num(u["reclutas_act"]),
        # El número de reclutadores, y debajo cuánto de esa cosecha hizo el
        # primero. Es lo que separa «acá se comparte» de «acá hay UNA persona
        # que comparte», y sin eso las dos filas se leen igual.
        (f'<span>{num(u["reclutadores"])}'
         + (f' <span class="sub2">el 1º trajo {_pct_txt(u["top_pct"])}</span>'
            if u["top_pct"] is not None else "")
         + "</span>"),
        num(u["k"], dec=2), f'<b>{num(u["k_act"], dec=2)}</b>',
    ] for u in p["reclutas_uni"]]
    out.append(_section(
        2, "Reclutas",
        # Lo que aporta la gente que ya está, en las dos monedas que el juego
        # acepta: gente nueva y cafecitos.
        #
        _fila_kpi(p["headline"]["reclutas"])
        + _box(
            "Cuánta gente trae cada camada",
            grafico_viral,
            note=(
                "Una <b>camada</b> es la gente que entró al juego en una misma semana, y se "
                "la sigue toda su vida: si alguien entra el sábado y trae a un amigo el "
                "martes, ese amigo suma para la camada del sábado aunque su propia alta caiga "
                "en la semana siguiente."
                "<br><br><b>K de activados</b> = los reclutas de la camada que llegaron a "
                "responder algo, divididos por los de la camada que llegaron a responder "
                "algo. Es el que se dibuja porque es una tasa de reproducción de verdad: la "
                "unidad que se produce —un jugador activado— es la misma que produce. De los "
                "24 jugadores que alguna vez reclutaron a alguien, los 24 tenían 3 o más "
                "respuestas; nadie sin activar reclutó nunca, porque el cartel de compartir "
                "aparece jugando. El <b>K general</b> hace la misma división sin exigir que "
                "ninguna de las dos puntas haya jugado, y está en la tabla para poder "
                "auditar: si sube y el otro no, llegó gente que no se reproduce."
                "<br><br><b>K &gt; 1 es crecimiento que se sostiene solo</b> —cada camada deja "
                "una más grande atrás—; por debajo, el link ayuda pero no alcanza como único "
                "canal. No es la fórmula completa —invitaciones × conversión—: no sabemos "
                "cuántos links se mandaron, solo cuántos prendieron."
                "<br><br><b>Por qué la camada y no la semana.</b> El K semanal que estaba acá "
                "antes dividía los reclutas que LLEGARON en la semana por toda la base que ya "
                "existía, y ese denominador lo mueve la difusión: una ola lo multiplica de "
                "golpe, así que con la misma gente compartiendo exactamente igual el número se "
                "desplomaba la semana siguiente. Medía reclutas por persona-semana, que es "
                "tráfico. Acá cada camada se mide contra sí misma, así que difundir más no "
                "mueve el número — y eso es justamente lo que se le pide a un K."
                "<br><br><b>Las camadas punteadas todavía están sumando.</b> Una camada cierra "
                "el domingo y le quedan unos días de reclutar: medido sobre los 144 reclutas "
                "con reclutador conocido, la mediana tarda 4,5 h, el 78,5% llega dentro del "
                "día y el último de los 144 tardó 3,6 días. Por eso una camada se da por "
                "cerrada a los cuatro días de terminar la semana, y hasta entonces su punto va "
                "hueco: leerlo como una caída es el error fácil."
                "<br><br>El numerador es de un dígito por camada, así que la curva tiembla "
                "entera con una persona. Lo que se lee acá es la tendencia, nunca un punto."))
        + _box(
            "De dónde sale el reclutamiento",
            _table(["Universidad", "Jugadores", "Reclutas", "Arrancaron",
                    "Reclutadores", "K", "K de activados"],
                   filas_uni, empty="todavía no hay jugadores con universidad"),
            note=(
                "<b>La universidad se pregunta a las 3 correctas</b>, así que tenerla cargada "
                "implica haber jugado. El denominador de esta tabla no es «cuánta gente de esa "
                "casa abrió el juego» sino «cuánta llegó a decir dónde estudia» — un "
                "subconjunto bastante más chico y bastante más enganchado. Por eso las dos K "
                "de acá se parecen mucho más entre sí que las de la camada, donde el "
                "denominador sí incluía a los que no arrancaron."
                "<br><br>Y por eso mismo la fila «sin universidad» no recluta nunca: el cartel "
                "de compartir aparece jugando, o sea del otro lado del mismo hito. No es que "
                "esa gente comparta menos — es que todavía no llegó a donde está el botón."
                "<br><br><b>«Reclutadores» es la columna que hace que esta tabla no mienta.</b> "
                "El reclutamiento está brutalmente concentrado: son 23 personas en todo el "
                "producto, y en cada casa la primera trae cerca de la mitad de las de su casa. "
                "Un K alto puede ser una cultura o puede ser una persona, y sin esta columna "
                "las dos se ven igual. Antes de mandar la próxima ola a la universidad que "
                "encabeza, mirar de cuántas manos salió."))
        + _box(
            "El cartel de compartir",
            '<div class="grid g3">'
            + "".join(
                _kpi_chico(l, v, h, suffix=sfx) for l, v, sfx, h in [
                    ("Lo vieron", (sh or {}).get("impresiones"), "",
                     "una impresión por partida, no por render"),
                    ("Lo tocaron", (sh or {}).get("clicks"), "", "clicks sobre el botón"),
                    ("CTR", (sh or {}).get("ctr"), "%", "de siempre, no de la semana"),
                ])
            + "</div>",
            note=(
                "La puerta del canal de arriba: nadie recluta sin tocar esto primero, así "
                "que un CTR que se cae explica un K que baja sin necesidad de mirar nada "
                "más. Está acá y no en la tabla de carteles que había en Retención porque "
                "compartir no es monetizar — lo que pide es una persona, no plata."
                "<br><br><b>Le falta el momento.</b> Los otros carteles anotan en qué "
                "derivada salen y este no —`solved` viene vacío en las 2.056 impresiones—, "
                "así que un CTR bajo puede ser el copy o puede ser que salga demasiado "
                "temprano, y las dos explicaciones siguen siendo igual de plausibles."),
        )
        + _box(
            "Los diez que más trajeron",
            _table(["Reclutador", "Universidad", "Reclutas", "Arrancaron", "XP ganada"],
                   [[f'@{esc(t["alias"])}',
                     _uni_chip(t["university"]) if t["university"] else "—",
                     num(t["reclutas"]), num(t["activados"]), num(t["xp"])]
                    for t in rc["top"]],
                   empty="todavía nadie reclutó"),
            note=(
                "De SIEMPRE y no de la ventana visible, como el ranking del juego: no tendría "
                "sentido resetear a quien lleva meses trayendo gente solo porque esta semana "
                "no reclutó a nadie."
                "<br><br><b>«Arrancaron» es la columna que hace útil a esta tabla.</b> Traer "
                "diez personas de las que ninguna llega a responder una derivada no es "
                "reclutar, es repartir un link, y sin esa columna las dos cosas se ven igual. "
                "Es también el numerador del K de activados de arriba, abierto por persona."
                "<br><br>Un solo nivel: los reclutas de tus reclutas no suman acá (ver "
                "<code>game/referrals.py</code>). <b>XP ganada</b> es la suma de lo que cada "
                "recluta le generó, que es el 10% de lo que ese recluta hizo."),
        ),
        sub="El único canal de crecimiento que no depende de que difundamos nosotros. Se mide por camada —la gente que entró una misma semana, seguida toda su vida— y no por semana calendario, que es lo único que lo vuelve independiente de cuánto difundamos.",
        anchor="reclutas"))
    pieza_reclutas = "".join(out)

    # ── 6 · Experimentos ─────────────────────────────────────────────────────
    out = []
    bloques = []
    for e in p["experimentos"]:
        brazos = e["brazos"]
        total = sum(b["n"] for b in brazos)
        falta = max((b["falta"] for b in brazos), default=0)

        # El estado va PRIMERO y en grande, antes que cualquier número por brazo.
        # Es lo único que la sección existe para decir: si todavía no se puede
        # leer, todo lo de abajo es ruido con forma de resultado.
        if e["sin_arrancar"]:
            estado = _caja_estado(
                "Sin datos todavía",
                f'Ningún jugador entró al experimento. La variante se escribe al crear la '
                f'fila, así que los que ya existían no cuentan: el reloj arranca con el '
                f'primer jugador nuevo después del despliegue.', "espera")
        elif falta > 0:
            estado = _caja_estado(
                f'Todavía no se puede leer — faltan {num(falta)} por brazo',
                f'Van {num(total)} de los {num(2 * e["n_pedido"])} comprometidos '
                f'({num(e["n_pedido"])} por brazo). El p-valor y el ganador no se calculan '
                f'hasta llegar: mirar todos los días y parar en cuanto cruza '
                f'{num(e["alpha"], dec=2)} no es leer el experimento, es repetir el sorteo '
                f'hasta que salga.', "espera")
        else:
            L = e["lectura"]
            if L is None:
                estado = _caja_estado("Listo para leer", "Ya hay muestra suficiente.", "listo")
            elif L["rechaza"]:
                signo = "a favor" if L["delta_pp"] > 0 else "EN CONTRA"
                estado = _caja_estado(
                    f'Diferencia significativa {signo}: {num(L["delta_pp"], " pp")}',
                    f'z = {num(L["z"], dec=2)}, p-valor {_p_txt(L["p_valor"])}. '
                    f'Intervalo del 95% para la diferencia: '
                    f'[{num(L["ic_pp"][0])} ; {num(L["ic_pp"][1])}] pp. '
                    f'Antes de implementar, mirar los tres guardarraíles de la tabla.',
                    "gana" if L["delta_pp"] > 0 else "pierde")
            else:
                estado = _caja_estado(
                    f'Sin diferencia detectable: {num(L["delta_pp"], " pp")}',
                    f'z = {num(L["z"], dec=2)}, p-valor {_p_txt(L["p_valor"])}. El intervalo '
                    f'del 95% —[{num(L["ic_pp"][0])} ; {num(L["ic_pp"][1])}] pp— contiene al '
                    f'cero. No es «son iguales»: es que un efecto de '
                    f'{num(e["mde_pp"], " pp", dec=0)} o más habría aparecido, y uno más '
                    f'chico este diseño no lo puede ver.', "plano")

        filas = [[
            f'<b>{esc(b["label"])}</b>', num(b["n"]),
            _pct_txt(b["pct_servida"]), _pct_txt(b["pct_activado"]),
            num(b["mediana"]), _pct_txt(b["pct_vuelven"]),
        ] for b in brazos]

        filas_plat = []
        for plat in ("android", "ios", "desktop"):
            celdas = []
            for b in brazos:
                d = b["plataformas"].get(plat)
                # Envuelto en un span porque `_table` solo deja pasar HTML en las
                # celdas que EMPIEZAN con "<": el resto las escapa, y sin esto el
                # marcado se veía escrito en la pantalla.
                celdas.append("—" if not d else
                              f'<span>{_pct_txt(d["pct"])} '
                              f'<span class="sub2">n={d["n"]}</span></span>')
            if any(c != "—" for c in celdas):
                filas_plat.append([f'<b>{esc(PLATFORM_LABEL[plat])}</b>'] + celdas)

        bloques.append(
            _box(esc(e["titulo"]), estado
                 + _table(["Brazo", "Jugadores", "Llegó a la 1ª", "Respondió una",
                           "Mediana 1ª tanda", "Volvió otro día"], filas,
                          empty="todavía nadie")
                 + '<p class="note"><b>Las tres últimas columnas son guardarraíles, no '
                   'objetivos.</b> Sirven para VETAR un resultado bueno, nunca para rescatar '
                   'uno malo: si la variante gana la entrada pero hunde la mediana de la '
                   'primera tanda, entró gente que no entendió y se fue en la segunda '
                   'derivada. Se miran siempre, incluso antes del n — un brazo que hace daño '
                   'se apaga sin esperar.</p>'
                 + _table(["Plataforma"] + [b["label"] for b in brazos], filas_plat,
                          empty="sin plataforma cargada")
                 + f'<p class="note"><b>El desglose por plataforma se declaró ANTES</b>, y es '
                   f'el único: «{esc(e["prediccion"])}» Cortar por universidad, por horario o '
                   f'por lo que sea hasta que algo dé significativo infla el error de tipo I — '
                   f'con veinte cortes y alfa {num(e["alpha"], dec=2)}, uno significativo es '
                   f'lo ESPERADO aunque no haya ningún efecto.</p>',
                 note=f'<b>Hipótesis:</b> {esc(e["hipotesis"])}'
                      f'<br><br>Declarado el {e["desde"].strftime("%d/%m")}: efecto mínimo '
                      f'{num(e["mde_pp"], " pp", dec=0)} sobre una base de referencia, '
                      f'alfa {num(e["alpha"], dec=2)}, potencia '
                      f'{num(100 * e["potencia"], "%", dec=0)} → '
                      f'<b>{num(e["n_pedido"])} por brazo</b>. El n va con el inverso del '
                      f'CUADRADO del efecto, así que pedir la mitad de efecto cuesta cuatro '
                      f'veces la muestra: es lo que obliga a que los experimentos sean audaces '
                      f'y no sutiles.'))

    out.append(_section(
        1, "Experimentos",
        "".join(bloques) or '<p class="empty">no hay experimentos declarados</p>',
        sub="Lo que esta sección hace y ninguna otra hace: negarse a contestar hasta tener "
            "la muestra que se prometió.",
        anchor="experimentos"))
    pieza_experimentos = "".join(out)

    # ── Difusión: el clickrate ───────────────────────────────────────────────
    out = []
    di = p["difusion"]
    if di["vacio"]:
        cuerpo_dif = (
            '<p class="empty">la copia del tracker está vacía — correr '
            '<code>scripts/diag/sync_grupos.py</code></p>')
    else:
        g = di["global"]

        # Intercalados y no agrupados: audiencia y clickrate de la misma copia,
        # pegados. Es la única forma de que se lean como una división —el de la
        # izquierda es el denominador del de la derecha— y de que comparar las
        # dos copias sea mirar dos pares y no cruzar cuatro casillas.
        def _par(clave, etiqueta):
            d = di[clave]
            return [
                (f"Audiencia · {etiqueta}", d["miembros"], "",
                 f'en {num(d["grupos"])} grupos', 0),
                (f"Clickrate · {etiqueta}", d["pct"], "%",
                 f'{num(d["jugadores"])} jugadores', 1),
            ]

        cuerpo_dif = (
            '<div class="grid g4">'
            + "".join(_kpi_chico(l, v, h, suffix=sfx, dec=d) for l, v, sfx, h, d in
                      _par("analisis", "análisis") + _par("generico", "genérico"))
            + "</div>"
            + '<p class="note">'
            + (f'<b>La ola salió con dos copias y no con una.</b> A los grupos donde '
               f'las derivadas están en el temario se les habló de derivadas; a los '
               f'demás, del juego. Los dos clickrates se comparan directo —son tasas '
               f'por miembro, así que el tamaño de cada audiencia no los mueve— pero '
               f'no se leen con la misma precisión: son '
               f'{num(di["analisis"]["miembros"])} personas de un lado y '
               f'{num(di["generico"]["miembros"])} del otro, y la más chica tiene el '
               f'intervalo más ancho.'
               if di["analisis"]["miembros"] and di["generico"]["miembros"] else
               '<b>Todavía no están las dos copias.</b> La etiqueta la escribe '
               '<code>scripts/diag/sync_grupos.py --cluster</code> desde los planes '
               'de la campaña; sin ella la ola no se puede partir.')
            + (f'<br><br>Quedan afuera {num(di["sin_copia"]["miembros"])} personas en '
               f'{num(di["sin_copia"]["grupos"])} grupos sin copia anotada, que '
               f'trajeron {num(di["sin_copia"]["jugadores"])} jugadores. Son de las '
               f'primeras tandas, mandadas antes de que la ola se partiera en dos. No '
               f'se reparten a ojo: «no sabemos con cuál» es información.'
               if di["sin_copia"]["grupos"] else "")
            + f'<br><br>El conjunto da <b>{_pct_txt(g["pct"])}</b> sobre '
              f'{num(g["miembros"])} personas en {num(g["grupos"])} grupos, '
              f'{num(g["jugadores"])} jugadores. La cobertura del cruce es '
              f'{_pct_txt(di["pct_cobertura"])} ({num(di["cubiertos"])} de '
              f'{num(di["atribuidos"])} atribuidos).'
            + "</p>"
            + _box("Por universidad",
                   _table(["Universidad", "Grupos", "Alcanzados", "Jugadores", "Clickrate"],
                          [[f'<b>{esc(f["clave"])}</b>', num(f["grupos"]), num(f["miembros"]),
                            num(f["jugadores"]), _pct_txt(f["pct"])]
                           for f in di["por_universidad"]],
                          empty="sin grupos con dx todavía"))
            + _box("Por campaña",
                   _table(["Campaña", "Grupos", "Alcanzados", "Jugadores", "Clickrate"],
                          [[f'<b>{esc(f["clave"])}</b>', num(f["grupos"]), num(f["miembros"]),
                            num(f["jugadores"]), _pct_txt(f["pct"])]
                           for f in di["por_campana"]],
                          empty="sin campaña anotada"),
                   note="Comparar dos campañas entre sí es lo único que dice si un cambio de "
                        "copy o de horario sirvió. Sale del tracker, así que depende de que "
                        "el envío quede anotado ahí.")
            + _box("Los grupos que más rindieron",
                   _table(["Grupo", "Universidad", "Materia", "Miembros", "Jugadores",
                           "Clickrate"],
                          [[f'<code>{esc(f["id"])}</code>', esc(f["universidad"] or "—"),
                            esc(_recortar(f["materia"] or "—", 30)), num(f["miembros"]),
                            num(f["jugadores"]), _pct_txt(f["pct"])]
                           for f in di["top"]],
                          empty="todavía ninguno"),
                   note="Los grupos chicos convierten mucho mejor por miembro que los "
                        "grandes, así que esta tabla ordenada por clickrate tiende a "
                        "llenarse de grupos chicos. Para elegir a quién mandarle hay que "
                        "mirar las dos columnas: el porcentaje y de cuánta gente sale.")
        )

    aviso = []
    if di["sincronizado"]:
        aviso.append(f'Copia del tracker sincronizada el '
                     f'{di["sincronizado"].strftime("%d/%m a las %H:%M")} UTC.')
    if di["n_sin_fila"]:
        ejemplos = ", ".join(f'<code>{esc(g)}</code>' for g, _ in di["sin_fila"])
        aviso.append(
            f'<b>{num(di["n_sin_fila"])} grupos con jugadores no tienen fila en la copia</b> '
            f'({ejemplos}…), así que su gente queda fuera del clickrate. Casi siempre son de '
            f'la pestaña <i>Comunidades</i>, que se exporta aparte. Es la diferencia entre la '
            f'cobertura de arriba y el 100%.')
    aviso.append(
        '<b>El denominador son los MIEMBROS del grupo, no los que vieron el mensaje.</b> '
        'WhatsApp no dice eso y nadie lo sabe, así que todas estas tasas son cotas '
        'inferiores: sirven para comparar un grupo contra otro —el sesgo es parejo— y no '
        'para afirmar «tal porcentaje de la gente hizo clic».')

    out.append(_section(
        1, "Difusión: a cuánta gente se llegó",
        cuerpo_dif + "".join(f'<p class="note">{a}</p>' for a in aviso),
        sub="Lo único del panel que necesita un dato de afuera: cuánta gente hay en cada "
            "grupo vive en el tracker y llega por una copia. Cuenta solo los grupos a los "
            "que se les mandó dx DESDE la primera camada oficial: uno de agosto aporta sus "
            "miembros al denominador y ningún jugador al numerador, porque los suyos "
            "quedaron del otro lado del corte.",
        anchor="difusion"))
    pieza_difusion = "".join(out)

    # ── Monetización: dónde se pide el cafecito ──────────────────────────────
    mo = p["monetizacion"]
    filas_lugares = [[
        f'<b>{esc(l["desc"])}</b><br><span class="sub2">{esc(l["lugar"])}</span>',
        num(l["impresiones"]) if l["impresiones"] else
        '<span class="sub2">no las anota</span>',
        num(l["clicks"]), _pct_txt(l["ctr"]),
    ] for l in mo["lugares"]]
    pieza_monetizacion = _section(
        1, "Dónde se pide el cafecito",
        _box("", _table(["Lugar", "Impresiones", "Clicks", "CTR"], filas_lugares,
                        empty="todavía no se mostró ninguno"),
             note=(
                 "<b>El mismo pedido convierte cinco veces distinto según dónde salga</b>, "
                 "y en una sola fila eso no se ve: el cartel del cafecito daba 16,8% de CTR "
                 "junto, juntando un botón que vive permanentemente en la barra con una "
                 "interrupción que aparece al cruzar un hito. Es la decisión que esta tabla "
                 "existe para tomar — dónde poner el pedido, no cómo escribirlo."
                 "<br><br>La impresión de la barra se cuenta <b>una por partida y no por "
                 "render</b>, así que su denominador es «tuvo el cafecito adelante» y no "
                 "«se dibujó el botón». Ojo igual al comparar contra los contextuales: la "
                 "barra está siempre a la vista y el hito interrumpe, así que un CTR más "
                 "alto ahí no es solo mejor copy."
                 + (f'<br><br><b>Hay {num(mo["sin_denominador"])} clicks sin denominador.</b> '
                    f'Los lugares marcados «no las anota» disparan el click sin montar el '
                    f'contador de impresiones (<code>settings-panel.tsx</code>), así que su '
                    f'CTR no se puede calcular. Están listados igual y quedan fuera de las '
                    f'dos tasas de arriba: esconderlos haría que el agujero siguiera sin '
                    f'verse otro mes.' if mo["sin_denominador"] else "")),
             ),
        sub="El cafecito no se pide en un lugar: se pide en nueve. Esto es cuál de los "
            "nueve trae la plata.",
        anchor="monetizacion")

    # ── Calibración ──────────────────────────────────────────────────────────
    ca = p["calibracion"]
    filas_cal = [[f'<b>{esc(f["rango"])}</b>', num(f["n"]), _pct_txt(f["prometido"]),
                  _pct_txt(f["real"]),
                  _chip(round(f["real"] - f["prometido"], 1), "%")]
                 for f in ca["filas"]]
    brecha_txt = ("sin respuestas para medir" if ca["brecha"] is None else
                  f'El motor entrega <b>{num(abs(ca["brecha"]), " pp")}</b> '
                  f'{"por encima" if ca["brecha"] > 0 else "por debajo"} de lo que promete, '
                  f'en promedio ponderado.')
    pieza_calibracion = _section(
        2, "Calibración del motor",
        _box("Lo prometido contra lo entregado",
             _table(["p̂ servido", "Respuestas", "Prometido", "Real", "Brecha"], filas_cal,
                    empty="todavía no hay respuestas sin tabla"),
             note=brecha_txt +
                  f' El motor apunta a servir lo que se acierta entre el '
                  f'{num(ca["banda"][0], "%")} y el {num(ca["banda"][1], "%")} de las veces '
                  f'(<code>elo.TARGET_LOW/HIGH</code>). Si estuviera bien calibrado, las dos '
                  f'columnas del medio darían casi lo mismo en cada fila.'
                  '<br><br><b>Se mide sobre primeros intentos y sin tabla abierta.</b> Un '
                  'acierto al tercer intento no es lo que p̂ predice, y uno copiado de la '
                  'tabla tampoco: mezclarlos infla la columna «real» y hace parecer '
                  'calibrado un motor que no lo está.'),
        sub="El motor promete una probabilidad de acierto cada vez que sirve una derivada. "
            "Esto compara esa promesa con lo que pasó.",
        anchor="calibracion")

    # ── Fricción ─────────────────────────────────────────────────────────────
    fr = p["friccion"]
    pieza_friccion = _section(
        3, "Fricción",
        '<div class="grid g4">'
        + "".join(_kpi_chico(l, v, h, suffix=sfx, dec=d) for l, v, sfx, h, d in [
            ("Salteadas", fr["pct_salteados"], "%", "«esta no la sé»", 1),
            ("Con la tabla abierta", fr["pct_con_tabla"], "%", "«la busco» — paga menos XP", 1),
            ("Parseo correcto", fr["pct_parse_ok"], "%",
             f'{num(fr["fallos_parseo"])} respuestas rechazadas', 1),
            ("Intentos hasta acertar", fr["mediana_intentos"], "", "mediana", 1)])
        + "</div>"
        + f'<p class="note">Tres cosas distintas que se confunden si se miran juntas. '
          f'<b>Saltear</b> es «esta no la sé» y es información sobre la dificultad. '
          f'<b>Mirar la tabla</b> es «la busco», y el juego ya lo cobra pagando menos XP. '
          f'<b>Que el parser rechace</b> es «la sé y el juego no me deja» — la única de las '
          f'tres que es un bug, y la más cara: la persona hizo todo bien y el juego le dijo '
          f'que no. Sobre {num(fr["servidos"])} derivadas servidas.</p>',
        sub="Dónde la persona pelea con el juego en vez de con la derivada.",
        anchor="friccion")

    # ── Las cuatro pestañas ──────────────────────────────────────────────────
    # Cada una es un scroll vertical: primero sus cuatro números de la semana,
    # después las secciones que los explican. El orden adentro de cada pestaña
    # va de lo más agregado a lo más fino, que es el orden en que se mira cuando
    # algo llama la atención.
    paneles = {
        "activacion": (_fila_kpi(p["headline"]["activacion"])
                       + pieza_difusion + pieza_reclutas),
        "retencion": (_fila_kpi(p["headline"]["retencion"])
                      + pieza_push + pieza_mails),
        "jugabilidad": (_fila_kpi(p["headline"]["jugabilidad"])
                        + pieza_profundidad + pieza_calibracion + pieza_friccion),
        "monetizacion": (_fila_kpi(p["headline"]["monetizacion"])
                         + pieza_monetizacion),
        "experimentacion": pieza_experimentos,
    }

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
