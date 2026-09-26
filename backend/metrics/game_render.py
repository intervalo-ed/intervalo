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

import re
import unicodedata
from collections import Counter
from datetime import date, datetime, timedelta

from . import charts as ch
from . import theme
from .charts import esc, num
from .game_queries import (
    DEPTH_MAX, DEPTH_MIN, DEPTH_TOPE, FIRST_WEEK, MIN_IMPRESIONES_CTR,
    MIN_IMPRESIONES_SEMANA, PEDIDO_CAFECITO, PLATFORM_LABEL,
)

# El grueso del CSS es el mismo que Intervalo (ver metrics/theme.py) — es la
# piel de la que se copió en primer lugar. Acá solo quedan las reglas que no
# tienen sentido fuera del juego: hoy, la pestaña de Voces, que es la única del
# panel que no es una tabla ni un gráfico.
CSS_DX = """
/* Un segundo título adentro de una caja: el primero lo pone `theme.box` y
   viene sin margen de arriba porque abre la caja; este abre una sección más
   abajo y necesita el aire que el otro no. */
h3.dentro{margin:18px 0 10px}

/* ── El largo de la curva de profundidad ────────────────────────── */
/* Vive en la misma fila que los desgloses y pegado al borde derecho: gobierna
   el gráfico de abajo y nada más, así que lejos de él habría que acordarse de
   que existe. */
.kctrl{margin-left:auto;display:flex;align-items:center;gap:8px;
  color:var(--muted);font-size:12px}
.kctrl label{white-space:nowrap}
.kctrl b{color:var(--fg);font-variant-numeric:tabular-nums;min-width:2ch;
  text-align:right}
.kctrl input[type=range]{-webkit-appearance:none;appearance:none;width:132px;
  height:14px;background:transparent;cursor:pointer}
.kctrl input[type=range]::-webkit-slider-runnable-track{height:3px;
  border-radius:2px;background:var(--border)}
.kctrl input[type=range]::-moz-range-track{height:3px;border-radius:2px;
  background:var(--border)}
.kctrl input[type=range]::-webkit-slider-thumb{-webkit-appearance:none;
  appearance:none;width:13px;height:13px;margin-top:-5px;border-radius:50%;
  background:var(--indigo);border:2px solid var(--card)}
.kctrl input[type=range]::-moz-range-thumb{width:13px;height:13px;
  border-radius:50%;background:var(--indigo);border:2px solid var(--card)}
.kctrl input[type=range]:focus-visible{outline:2px solid var(--indigo-soft);
  outline-offset:3px;border-radius:6px}

/* ── Voces: una tarjeta por respuesta ───────────────────────────── */

/* El único número de la sección, de ancho completo: es el encabezado de lo que
   viene abajo, no una tarjeta más de una fila de cuatro. El cuerpo de letra es
   el de cualquier KPI del panel — lo que hace grande a esta caja es el ancho y
   el aire, no el tamaño de la letra. */
.kpi-ancho{display:flex;align-items:flex-end;justify-content:space-between;
  gap:16px;flex-wrap:wrap;padding:18px 22px;min-height:96px}
.kpi-ancho .izq{display:flex;flex-direction:column;align-items:flex-start;gap:4px}
.kpi-ancho .label{font-size:12.5px;letter-spacing:.06em;text-transform:uppercase;
  font-weight:650}
.kpi-ancho .val{font-size:29px}
.kpi-ancho .hint{margin:0 0 6px;font-size:12.5px}

/* Tres columnas fijas, dos en una tablet y una en el teléfono.
   `align-items:start` es lo que deja que cada tarjeta mida lo que mide: con el
   estiramiento por defecto, una respuesta de 400 caracteres infla a sus dos
   vecinas de la fila hasta su alto, y la mediana son 21 caracteres. */
.voces{display:grid;gap:12px;align-items:start;
  grid-template-columns:repeat(3,minmax(0,1fr))}
@media (max-width:880px){.voces{grid-template-columns:repeat(2,minmax(0,1fr))}}
@media (max-width:560px){.voces{grid-template-columns:1fr}}
.voz{border:1px solid var(--border);background:var(--card);border-radius:8px;
  padding:14px 15px 12px;display:flex;flex-direction:column;gap:10px}
.voz[hidden]{display:none}

/* La respuesta es el contenido: lo único a cuerpo de lectura y en el color del
   texto. Todo lo demás de la tarjeta es aparato y va en gris. */
.dice{margin:0;font-size:14.5px;line-height:1.5;color:var(--fg);
  overflow-wrap:anywhere}
.dice::before{content:"\\201C";color:var(--muted);margin-right:1px}
.dice::after{content:"\\201D";color:var(--muted);margin-left:1px}

.quien{border-top:1px solid var(--border);padding-top:9px;
  display:flex;flex-direction:column;gap:3px}
.quien-top{display:flex;align-items:center;gap:6px;flex-wrap:wrap}
.quien .alias{font-weight:650;font-size:13px}
.quien .carrera{font-size:12.5px;line-height:1}
.quien .meta{color:var(--muted);font-size:11.5px;font-variant-numeric:tabular-nums}
.quien .meta.dim{color:#7f8da1}
.quien .origen{color:#7f8da1;font-size:11.5px;margin-top:2px}
.quien .origen b{color:var(--muted);font-weight:600}
.quien .origen::before{content:"\\21B3 ";color:var(--border)}

/* El buscador. Mismo trato que los cortes de un gráfico: mismo alto, mismo
   borde, mismo redondeo, y el atajo elegido se PINTA. */
.buscador{display:flex;gap:8px;align-items:center;flex-wrap:wrap}
.buscador input{flex:1 1 260px;max-width:360px;background:var(--card);
  color:var(--fg);border:1px solid var(--border);border-radius:6px;
  padding:7px 11px;font:inherit;font-size:13px}
.buscador input::placeholder{color:var(--muted)}
.buscador input:focus{outline:none;border-color:var(--indigo-soft)}
.atajos{display:flex;gap:6px;flex-wrap:wrap;font-size:12px}
.atajos button{border:1px solid var(--border);border-radius:6px;padding:3px 9px;
  color:var(--muted);background:var(--card);font:inherit;font-size:12px;
  cursor:pointer;line-height:1.5}
.atajos button:hover{color:var(--fg);border-color:var(--indigo)}
.atajos button b{font-variant-numeric:tabular-nums;font-weight:600;opacity:.65;
  margin-left:4px}
.atajos button.cur{background:var(--indigo);color:#fff;border-color:var(--indigo);
  font-weight:600}
.atajos button.cur b{opacity:.8}
.conteo{margin-left:auto;color:var(--muted);font-size:12px;
  font-variant-numeric:tabular-nums}
mark{background:rgba(84,87,229,.34);color:var(--fg);border-radius:3px;padding:0 1px}
"""
CSS = theme.BASE_CSS + CSS_DX

# Los colores de marca de cada universidad, reusados del panel de Intervalo en
# vez de copiar la lista: backend/universities.py ya advierte de las tres copias
# que hay dando vueltas, y una cuarta sería la que se olvida de actualizarse.
# Son los mismos del chip que el jugador ve en su ranking, que es lo que hace
# que una línea del desglose se reconozca sin leer la leyenda.
from .render import (  # noqa: E402
    CAREER_LABEL, SURVEY_EMOJI_A, SURVEY_EMOJI_R, SURVEY_TEXT,
    UNIVERSITY_COLOR, _uni_chip,
)

# Los pesos del sorteo se LEEN de donde se deciden, no se copian: la columna
# «nominal» de la tabla de push existe justamente para detectar que el reparto
# real no es el configurado, y una copia vieja de los pesos convertiría a esa
# columna en la que miente.
from game.notification_copy import PESOS as PESOS_DEL_COPY  # noqa: E402
from game.opinion import TOPE as OPINION_TOPE  # noqa: E402

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


def _kpi_camada(label: str, valor, delta, contra: str, hint: str = "",
                suffix: str = "", dec: int = 1) -> str:
    """Un número de la última ola, con cuánto se movió contra la anterior.

    Ni `_kpi_chico` —que no tiene contra qué compararse— ni `theme.kpi`, que
    pide una serie para el sparkline y rotula el chip como «vs. semana
    anterior». Acá la comparación NO es contra la semana anterior sino contra
    la última ola que salió, que puede ser de hace dos o tres semanas, así que
    el rótulo lo escribe quien llama y dice de qué fecha está hablando.
    """
    return (f'<div class="box kpi"><div class="label">{esc(label)}</div>'
            f'<div class="val">{num(valor, suffix, dec)}</div>'
            f'<div class="row" style="margin-top:8px">{_chip(delta, suffix, dec)}'
            f'<span class="hint">{esc(contra)}</span></div>'
            + (f'<div class="hint">{esc(hint)}</div>' if hint else "")
            + "</div>")


# El control del largo de la curva. `change` y no `input`: la barra dispara un
# evento por píxel arrastrado, y cada uno acá es una página entera. El número de
# al lado sí se mueve con `input`, que es lo que hace que el arrastre tenga
# adónde mirar mientras tanto.
DEPTH_JS = """
(function(){
  var r = document.getElementById('kmax');
  if (!r) return;
  var out = document.getElementById('kval');
  r.addEventListener('input', function(){ out.textContent = r.value; });
  r.addEventListener('change', function(){
    var u = new URL(window.location.href);
    u.searchParams.set('k', r.value);
    window.location.href = u.toString();
  });
})();
"""


# ── Voces: la tarjeta, el buscador y sus atajos ──────────────────────────────
#
# Es la única pieza del panel que no es una tabla ni un gráfico, y es a
# propósito: acá se viene a LEER de a una respuesta, no a comparar filas. La
# tabla que había antes ponía el texto en la primera celda y a la persona en
# cinco columnas de al lado, así que la respuesta se leía sin saber quién la
# escribió y la persona se leía sin poder mirarla entera.


def _sin_tildes(s: str) -> str:
    """Minúsculas y sin diacríticos, para que buscar «analisis» encuentre
    «Análisis». Es la misma normalización que hace el buscador en el navegador
    —ver VOCES_JS—, y tiene que seguir siendo la misma: acá se cuentan los
    atajos y allá se filtra con ellos."""
    return "".join(c for c in unicodedata.normalize("NFD", (s or "").lower())
                   if unicodedata.category(c) != "Mn")


# Palabras que no distinguen una respuesta de otra, en tres grupos:
#
# · relleno del castellano;
# · las que SON el producto — «derivadas» aparece en 36 de 190 respuestas y por
#   eso mismo no sirve de atajo: un filtro que deja casi todo no filtra;
# · los verbos de sugerencia y los adjetivos de elogio, que están en todas
#   porque la pregunta PIDE una sugerencia («le pondría», «agregaría»,
#   «buenísimo»). Son la forma de la respuesta, no su tema.
_VOCES_STOP = set("""
algo algun alguna alguno ante antes aqui aunque bien cada como con contra cual
cuando decir desde donde ella ellas ellos entre era eran esta estan este esto
estos fuera gran hace hacer hasta lugar mientras mucha mucho nada otra otro
para pero poco poder porque pues puede pueden quiza quizas seria siempre sino
sobre solo tambien tanto tener tiene todo todos vez veces
ahora capaz forma manera mayor mejor menos mismo momento nose parte tipo
app cosa cosas derivada derivadas ejercicio ejercicios juego jugar
agregar agregaria agregarle cambiar cambiaria deberia estaria gustaria haria
mejorar poner pondria ponerle quitar sacar sumar sumaria
bueno buena buenos buenas buenisimo buenisima copado genial increible lindo
piola perfecto
""".split())


def _voces_atajos(respuestas: list[dict], tope: int = 8, minimo: int = 3
                  ) -> list[tuple[str, int]]:
    """Las palabras más repetidas de estas mismas respuestas, con en cuántas
    aparece cada una.

    No es una lista de temas que suponemos: se cuenta sobre lo que la gente
    escribió, así que el día que el tema cambie los atajos cambian solos. Se
    cuenta por RESPUESTA y no por aparición — quien escribe «integrales» tres
    veces en un renglón es una persona pidiendo integrales, no tres.
    """
    cuenta: Counter = Counter()
    for r in respuestas:
        palabras = {w for w in re.findall(r"[a-zñ]{4,}", _sin_tildes(r["texto"]))
                    if w not in _VOCES_STOP}
        cuenta.update(palabras)
    return [(w, n) for w, n in cuenta.most_common(tope) if n >= minimo]


def _buscador(respuestas: list[dict]) -> str:
    atajos = "".join(
        f'<button type="button" data-q="{esc(w)}">{esc(w)}<b>{n}</b></button>'
        for w, n in _voces_atajos(respuestas))
    return ('<div class="buscador">'
            '<input id="voces-q" type="search" autocomplete="off" '
            'placeholder="Buscar una palabra…">'
            f'<div class="atajos">{atajos}</div>'
            f'<span class="conteo" id="voces-conteo">{num(len(respuestas))} '
            'respuestas</span></div>')


def _voz(r: dict) -> str:
    """Una respuesta y, debajo de una línea fina, quién la escribió."""
    top = [f'<span class="alias">@{esc(r["alias"] or "—")}</span>',
           _uni_chip(r["universidad"]) if r["universidad"]
           else '<span class="tag tag-plain">sin universidad</span>']
    carrera = CAREER_LABEL.get(r["carrera"] or "")
    if carrera:
        top.append(f'<span class="carrera" title="{esc(carrera[1])}">'
                   f'{carrera[0]}</span>')
    if not r["registrado"]:
        top.append('<span class="pill">invitado</span>')

    # Cuánto jugó, en las dos monedas que el juego tiene. El combo solo si
    # existe: un 0 ocupa lo mismo que un 20 y no dice nada.
    meta = [f'{num(r["derivadas"])} derivadas', f'{num(r["xp"])} XP']
    if r["mejor_combo"]:
        meta.append(f'mejor combo {num(r["mejor_combo"])}')
    if r["correctas"] != 18:
        # 18 es donde sale la pregunta, así que decirlo en las 9 de cada 10
        # tarjetas donde vale 18 es ruido; las otras son gente que ya tenía
        # más cuando la pregunta se estrenó, y eso sí se mira.
        meta.append(f'iba por la {num(r["correctas"])}')

    seg = r["segundos"]
    # Día y hora, sin el año: el panel siempre se mira sobre una semana, así que
    # «2026-» en 190 tarjetas es la misma columna repetida 190 veces.
    cuando = [PLATFORM_LABEL.get(r["plataforma"], r["plataforma"] or "Sin dato"),
              datetime.fromisoformat(r["cuando"]).strftime("%d/%m %H:%M"),
              f"tardó {seg} s en escribirlo" if seg < 90
              else f"tardó {seg // 60} min en escribirlo"]

    # De dónde salió esta persona. Es lo que convierte una opinión suelta en
    # «esto lo dice el grupo tal», que es como se decide a quién escribirle.
    origen = []
    if r["reclutador"]:
        origen.append(f'entró por <b>@{esc(r["reclutador"])}</b>')
    if r["grupo"]:
        g = esc(r["grupo"]["universidad"] or "—")
        if r["grupo"]["materia"]:
            g += " — " + esc(_recortar(r["grupo"]["materia"], 34))
        origen.append(("del grupo " if origen else "entró por el grupo ") + g)
    if r["reclutas"]:
        origen.append(f'trajo {num(r["reclutas"])} recluta'
                      + ("s" if r["reclutas"] > 1 else ""))

    # El buscador mira el texto Y esto, así que «UTN», «@fulano» o «invitado»
    # son búsquedas válidas sin necesidad de una fila de filtros aparte.
    quien = " ".join(str(x) for x in [
        "@" + (r["alias"] or ""), r["universidad"] or "",
        carrera[1] if carrera else "",
        PLATFORM_LABEL.get(r["plataforma"], ""),
        (r["grupo"] or {}).get("universidad") or "",
        (r["grupo"] or {}).get("materia") or "",
        ("@" + r["reclutador"]) if r["reclutador"] else "",
        "registrado" if r["registrado"] else "invitado"] if x)

    return (f'<article class="voz" data-quien="{esc(_sin_tildes(quien))}">'
            f'<p class="dice">{esc(r["texto"] or "")}</p>'
            f'<div class="quien"><div class="quien-top">{"".join(top)}</div>'
            f'<div class="meta">{" · ".join(meta)}</div>'
            f'<div class="meta dim">{" · ".join(cuando)}</div>'
            + (f'<div class="origen">{" · ".join(origen)}</div>' if origen else "")
            + "</div></article>")


# El único JavaScript del panel, y vive acá abajo porque solo viaja cuando la
# pestaña abierta es esta. Las respuestas ya están todas en la página —son
# decenas, no millones— así que filtrar es esconder tarjetas y no volver al
# servidor: sin recarga, sin estado en la URL y sin endpoint nuevo que
# mantener.
VOCES_JS = """
(function(){
  var cont = document.getElementById('voces-lista');
  if (!cont) return;
  var input = document.getElementById('voces-q');
  var conteo = document.getElementById('voces-conteo');
  var vacio = document.getElementById('voces-vacio');
  var cajas = [].slice.call(cont.querySelectorAll('.voz'));
  var total = cajas.length;

  // Normalizar SIN perder el alineamiento con el texto original: «á» se vuelve
  // «a» —una unidad donde el original tiene dos— así que el resaltado
  // terminaría marcando la letra de al lado. Por eso se guarda el mapa de
  // vuelta, de índice normalizado a índice original.
  function prep(s){
    var chars = Array.from(s), hay = '', map = [];
    chars.forEach(function(c, i){
      var n = c.normalize('NFD').replace(/[\\u0300-\\u036f]/g, '').toLowerCase();
      if (n === '') n = '\\u0000';
      for (var k = 0; k < n.length; k++){ hay += n[k]; map.push(i); }
    });
    return {chars: chars, hay: hay, map: map};
  }
  function norm(s){
    return s.normalize('NFD').replace(/[\\u0300-\\u036f]/g, '').toLowerCase();
  }

  var datos = cajas.map(function(voz){
    var p = voz.querySelector('.dice');
    return {voz: voz, p: p, texto: p.textContent, idx: prep(p.textContent),
            quien: voz.getAttribute('data-quien') || ''};
  });

  function pintar(d, q){
    if (!q){ d.p.textContent = d.texto; return; }
    var chars = d.idx.chars, hay = d.idx.hay, map = d.idx.map;
    var frag = document.createDocumentFragment(), desde = 0, cursor = 0, i;
    while ((i = hay.indexOf(q, desde)) !== -1){
      var a = map[i], b = map[i + q.length - 1] + 1;
      if (a > cursor) frag.appendChild(
        document.createTextNode(chars.slice(cursor, a).join('')));
      var m = document.createElement('mark');
      m.textContent = chars.slice(a, b).join('');
      frag.appendChild(m);
      cursor = b; desde = i + q.length;
    }
    if (cursor < chars.length) frag.appendChild(
      document.createTextNode(chars.slice(cursor).join('')));
    d.p.innerHTML = '';
    d.p.appendChild(frag);
  }

  function filtrar(){
    var crudo = input.value.trim(), q = norm(crudo), n = 0;
    datos.forEach(function(d){
      var enTexto = d.idx.hay.indexOf(q) !== -1;
      var hit = !q || enTexto || d.quien.indexOf(q) !== -1;
      d.voz.hidden = !hit;
      if (hit){ n++; pintar(d, enTexto ? q : ''); }
    });
    conteo.textContent = q ? n + ' de ' + total : total + ' respuestas';
    vacio.hidden = n > 0;
    vacio.textContent = 'Ninguna respuesta dice «' + crudo + '».';
    [].forEach.call(document.querySelectorAll('.atajos button'), function(b){
      b.className = b.getAttribute('data-q') === q ? 'cur' : '';
    });
  }

  input.addEventListener('input', filtrar);
  input.addEventListener('keydown', function(e){
    if (e.key === 'Escape'){ input.value = ''; filtrar(); }
  });
  [].forEach.call(document.querySelectorAll('.atajos button'), function(b){
    b.addEventListener('click', function(){
      input.value = b.className === 'cur' ? '' : b.getAttribute('data-q');
      filtrar(); input.focus();
    });
  });
})();
"""


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
    # Voces va última y es la única pestaña del panel que no tiene un número
    # arriba: lo que hay adentro es texto que escribió gente, y ponerle un KPI
    # de sombrero sería invitar a mirar el resumen en vez de leer.
    ("voces", "Voces"),
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

    def link(*, s: str | None = None, corte: str | None = None,
             k: int | None = None) -> str:
        """La URL del panel cambiando UNA cosa y dejando el resto como está.

        Es lo que hace que las dos barras convivan: elegir semana no pierde la
        pestaña, elegir desglose no devuelve a la primera, y ninguna de las dos
        pierde hasta dónde se estaba mirando la curva."""
        s = s if s is not None else seccion
        corte = corte if corte is not None else p["profundidad"]["corte"]
        k = k if k is not None else p["profundidad"]["k_max"]
        q = f"?w={week.isoformat()}"
        if s != SECCION_POR_DEFECTO:
            q += f"&s={s}"
        if corte != "total":
            q += f"&corte={corte}"
        if k != DEPTH_MAX:
            q += f"&k={k}"
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
            'más en dos y menos en la tercera.'
            '<br><br>Eso dejó de ser una sospecha: la curva de la hora de la PRIMERA sesión '
            'correlaciona a r = 0,82 con el cronograma de envío de la camada, y la de las '
            'vueltas a r = 0,17, medido sobre los checkpoints de Hermes de la camada del '
            '14/09. El panel tenía una sección entera dibujando eso —«El reloj del día»— y '
            'salió: lo que decía se lee acá, que es donde se está mirando la curva.')

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
    #
    # «Por universidad» no está en la barra: partía la cohorte en doce líneas
    # de las que tres tenían base y el resto era el ruido de cuatro personas
    # dibujado con la misma tinta. Quién estudia dónde se mira en Reclutas y en
    # Difusión, que es donde la universidad decide algo. El corte sigue vivo en
    # `game_queries.CORTES` para el data.json.
    selector = "".join(
        f'<span class="cur">{esc(t)}</span>' if c == corte
        else f'<a href="{link(corte=c)}">{esc(t)}</a>'
        for c, t in [("total", "Todos"), ("sesion", "Por sesión"),
                     ("cohorte", "Por cohorte"), ("aparato", "Por aparato"),
                     ("horario", "Por horario")])

    # Hasta qué derivada se dibuja. Va arriba a la derecha del gráfico —pegado a
    # lo único que gobierna— y es el primer control del panel que no es un link:
    # una barra de 12 a 64 que recarga recién al soltarla, así que arrastrarla
    # no dispara cuarenta consultas. El número se actualiza mientras se mueve
    # para que el arrastre tenga adónde mirar. Sin JavaScript la barra no hace
    # nada y el resto de la sección sigue entera.
    control = (
        '<span class="kctrl">'
        f'<label for="kmax">hasta la derivada</label>'
        f'<input id="kmax" type="range" min="{DEPTH_MIN}" max="{DEPTH_TOPE}" '
        f'step="1" value="{pr["k_max"]}" aria-label="Hasta qué derivada se dibuja">'
        f'<b id="kval">{num(pr["k_max"])}</b></span>')

    cuerpo = (f"<div class='cortes'><span class='sub'>Desglose</span>{selector}"
              f"{control}</div>"
              + grafico
              + f"<script>{DEPTH_JS}</script>")

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

    # El cartel de compartir, que es el primer escalón del canal y por eso abre
    # la sección: nadie recluta sin tocarlo, así que todo lo que viene después
    # —el K, la tabla por universidad, los diez que más trajeron— pasa por acá.
    # Puede no existir si todavía no se mostró ninguno.
    sh = next((c for c in p["carteles"] if c["cta"] == "share"), None)
    cs = p["cartel_share"]

    # El acumulado dice cuánto vale el canal; la curva dice si se está moviendo.
    # Comparten el eje con la curva de camadas de abajo a propósito: lo que se
    # viene a mirar es si las dos se mueven juntas, porque un K que cae con el
    # CTR quieto y uno que cae con el CTR desplomado piden cosas opuestas.
    serie_ctr = [{
        "label": "CTR del cartel", "color": VERDE_RECLUTAS,
        "values": [c["ctr"] for c in cs],
        # Punto hueco y tramo punteado donde la semana no llega al piso de
        # impresiones: el dato existe —cortar la línea haría creer que el
        # cartel no salió— pero un click lo mueve cinco puntos.
        "weak": [c["flojo"] for c in cs],
        "tips": [f'{c["label"]}: {_pct_txt(c["ctr"])} — {num(c["clicks"])} clicks '
                 f'sobre {num(c["impresiones"])} impresiones'
                 + ("" if not c["flojo"] else " · base flojita")
                 for c in cs],
    }]
    grafico_ctr = (
        ch.lines(serie_ctr, [c["label"] for c in cs], suffix="%", height=240,
                 legend=False)
        if sum(c["impresiones"] for c in cs) else
        '<p class="empty">el cartel todavía no se mostró en ninguna semana</p>')

    caja_cartel = _box(
        "El cartel de compartir",
        '<div class="grid g3">'
        + "".join(
            _kpi_chico(l, v, h, suffix=sfx) for l, v, sfx, h in [
                ("Lo vieron", (sh or {}).get("impresiones"), "",
                 "una impresión por partida, no por render"),
                ("Lo tocaron", (sh or {}).get("clicks"), "", "clicks sobre el botón"),
                ("CTR", (sh or {}).get("ctr"), "%", "de siempre, no de la semana"),
            ])
        + "</div>"
        + f'<h3 class="dentro">Semana a semana</h3>{grafico_ctr}',
        note=(
            "La puerta del canal: nadie recluta sin tocar esto primero, así que un CTR "
            "que se cae explica un K que baja sin necesidad de mirar nada más. Por eso "
            "abre la sección, y por eso los tres números de arriba son de SIEMPRE "
            "mientras la curva es por semana — el primero dice cuánto vale el canal y "
            "la segunda si se está moviendo."
            "<br><br><b>Las semanas flojitas van punteadas</b>: debajo de "
            f'{MIN_IMPRESIONES_SEMANA} impresiones un solo click mueve el punto varios '
            "puntos enteros, así que ahí se lee la altura y no la forma. Y el "
            "denominador es la difusión: una semana sin ola tiene menos gente viendo el "
            "cartel, así que un CTR que sube con las impresiones cayendo puede ser "
            "simplemente que quedó la gente más enganchada."
            "<br><br><b>Le falta el momento.</b> Los otros carteles anotan en qué "
            "derivada salen y este no —`solved` viene vacío en las 2.056 impresiones—, "
            "así que un CTR bajo puede ser el copy o puede ser que salga demasiado "
            "temprano, y las dos explicaciones siguen siendo igual de plausibles."),
    )

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
        + caja_cartel
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

        # Las tres medidas de entrada se muestran SIEMPRE las tres, y la que
        # decide lleva el rótulo. Mostrar solo la declarada escondería justo el
        # hallazgo de `dx-puerta-1` —que las tres se mueven distinto, y que ganar
        # la primera no implica nada sobre la tercera— y dejaría al que lee sin
        # forma de darse cuenta de que le pasó de nuevo.
        medidas = [("servida", "Llegó a la 1ª"), ("activado", "Respondió una"),
                   ("engancha", "Llegó a 3")]
        filas = [
            [f'<b>{esc(b["label"])}</b>', num(b["n"])]
            + [_pct_txt(b[f"pct_{k}"]) for k, _ in medidas]
            + [num(b["mediana"]), _pct_txt(b["pct_vuelven"])]
            for b in brazos
        ]
        cabeceras = ["Brazo", "Jugadores"] + [
            f"{t} ▸" if k == e["metrica"] else t for k, t in medidas
        ] + ["Mediana 1ª tanda", "Volvió otro día"]

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
                 + _table(cabeceras, filas, empty="todavía nadie")
                 + '<p class="note"><b>La columna con ▸ es la que decide, y se '
                   'declaró antes de ver un solo dato.</b> Las otras son guardarraíles: '
                   'sirven para VETAR un resultado bueno, nunca para rescatar uno malo. Se '
                   'miran siempre, incluso antes del n — un brazo que hace daño se apaga '
                   'sin esperar.<br><br>Que estén las tres juntas es la lección de '
                   '<code>dx-puerta-1</code>: ganó «llegó a la 1ª» por 25 puntos, empató '
                   'en «llegó a 3» y perdió de la quinta en adelante. Una variante que '
                   'sube la primera columna y deja la tercera quieta no ganó nada: movió '
                   'el lugar donde la gente se va.</p>'
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

    # ── 6-bis · El experimento del MOTOR ─────────────────────────────────────
    # Mismo trato que la de arriba —estado primero, guardarraíles siempre,
    # lectura recién con el n— pero lo que se compara son dos MEDIAS y no dos
    # proporciones, y la población son los veteranos. Ver
    # game_queries.py :: experimento_motor.
    e = p["experimento_motor"]
    brazos = e["brazos"]
    total = sum(b["n"] for b in brazos)
    en_curso = sum(b["en_curso"] for b in brazos)
    falta = max((b["falta"] for b in brazos), default=0)

    if e["sin_arrancar"]:
        estado = _caja_estado(
            "Sin datos todavía",
            f'Nadie llegó a las {num(e["umbral_n"])} respuestas de primer intento, que es '
            f'donde el piso empieza a cambiar algo. Abajo de ese número los dos brazos son '
            f'el mismo motor.', "espera")
    elif falta > 0:
        estado = _caja_estado(
            f'Todavía no se puede leer — faltan {num(falta)} por brazo',
            f'Van {num(total)} ventanas cerradas de las {num(2 * e["n_pedido"])} '
            f'comprometidas ({num(e["n_pedido"])} por brazo), y hay {num(en_curso)} '
            f'personas con la ventana todavía abierta. Un jugador cuenta recién cuando '
            f'pasaron sus {num(e["ventana_dias"])} días: sumar una ventana a medio contar '
            f'sería comparar a alguien medido dos semanas con alguien medido tres días.',
            "espera")
    else:
        L = e["lectura"]
        if L is None:
            estado = _caja_estado("Listo para leer", "Ya hay muestra suficiente.", "listo")
        elif L["rechaza"]:
            signo = "a favor" if L["delta"] > 0 else "EN CONTRA"
            estado = _caja_estado(
                f'Diferencia significativa {signo}: {num(L["delta"], " días", dec=2)}',
                f'z = {num(L["z"], dec=2)}, p-valor {_p_txt(L["p_valor"])}. Intervalo del '
                f'95%: [{num(L["ic"][0], dec=2)} ; {num(L["ic"][1], dec=2)}] días. Antes de '
                f'dejarlo puesto, mirar el salteo y la calibración de la tabla.',
                "gana" if L["delta"] > 0 else "pierde")
        else:
            estado = _caja_estado(
                f'Sin diferencia detectable: {num(L["delta"], " días", dec=2)}',
                f'z = {num(L["z"], dec=2)}, p-valor {_p_txt(L["p_valor"])}. El intervalo del '
                f'95% —[{num(L["ic"][0], dec=2)} ; {num(L["ic"][1], dec=2)}] días— contiene '
                f'al cero. No es «son iguales»: es que un efecto de '
                f'{num(e["mde"], " día", dec=2)} o más habría aparecido, y uno más chico '
                f'este diseño no lo puede ver.', "plano")

    filas_motor = [
        [f'<b>{esc(b["label"])}</b>',
         f'<span>{num(b["n"])} <span class="sub2">+{num(b["en_curso"])} en curso</span></span>',
         f'<span>{num(b["media"], dec=2)} <span class="sub2">± {num(b["sd"], dec=2)}</span></span>',
         num(b["rating"]), num(b["servidas"]), _pct_txt(b["pct_salteo"]),
         "—" if b["sesgo_pp"] is None else num(b["sesgo_pp"], " pp", dec=1)]
        for b in brazos
    ]

    out = [_section(
        1, "El motor: la varianza del Elo",
        _box(esc(e["titulo"]), estado
             + _table(["Brazo", "Jugadores", "Días activos ▸", "Rating mediano",
                       "Derivadas", "% salteo", "Calibración"],
                      filas_motor, empty="todavía nadie")
             + f'<p class="note"><b>Días activos es la columna que decide</b>, declarada '
               f'antes de ver un dato: días distintos con al menos una derivada servida, '
               f'dentro de los {num(e["ventana_dias"])} desde el arranque. Es continua a '
               f'propósito — con {num(e["n_pedido"])} por brazo, cualquier proporción '
               f'pediría diez veces esta gente y no se podría leer nunca.<br><br>'
               f'Las otras tres son guardarraíles y se miran desde el primer día. '
               f'<b>% salteo</b>: el piso le baja el precio al botón de saltear (de 37 '
               f'aciertos a 2,4 para un veterano), así que se espera que suba — lo que '
               f'importa es que no se dispare. <b>Calibración</b> es acierto real menos el '
               f'p̂ que el motor prometió: si el brazo con piso se pasa de largo, ese número '
               f'se va a negativo y hay que apagarlo, porque significa que le está sirviendo '
               f'a la gente cosas más difíciles de lo que cree.</p>'
             + f'<p class="note"><b>Quién entra:</b> cualquiera que llegue a '
               f'{num(e["umbral_n"])} respuestas de primer intento, el día que llega — y su '
               f'ventana de {num(e["ventana_dias"])} días corre desde ahí. No es un recorte '
               f'arbitrario: es exactamente donde el piso de 0,20 empieza a diferir del '
               f'motor de hoy, y sale calculado de los hiperparámetros '
               f'(<code>elo.n_donde_muerde</code>), no escrito a mano.<br><br>'
               f'<b>La inscripción es rodante y no una foto del arranque</b>, y ahí se jugó '
               f'que esto se pueda leer o no. Con la cohorte congelada al '
               f'{e["desde"].strftime("%d/%m")} eran 139 personas que el hash repartía 80/59: '
               f'el brazo chico se quedaba en 59 contra los {num(e["n_pedido"])} '
               f'comprometidos <b>para siempre</b>, porque ninguna espera lo arreglaba. Así '
               f'entran también los 46 que hoy están entre 30 y 42 respuestas, y el '
               f'desbalance se lava con ellos.<br><br>'
               f'<b>El brazo no está guardado en ninguna columna</b>: sale '
               f'de un hash del id del jugador (<code>game/sorteo.py</code>). Tuvo que ser '
               f'así porque <code>game_players.variant</code> se escribe al crear la fila y '
               f'todos los elegibles existen desde hace semanas — con el sorteo de siempre, '
               f'este experimento habría medido a cero personas para siempre.</p>',
             note=f'<b>Hipótesis:</b> {esc(e["hipotesis"])}'
                  f'<br><br>Declarado el {e["desde"].strftime("%d/%m")}: efecto mínimo '
                  f'{num(e["mde"], " día", dec=2)} sobre una base medida de '
                  f'{num(e["base"], " días", dec=2)}, alfa {num(e["alpha"], dec=2)}, '
                  f'potencia {num(100 * e["potencia"], "%", dec=0)} → '
                  f'<b>{num(e["n_pedido"])} por brazo</b>.'
                  f'<br><br><b>Predicción, escrita antes:</b> {esc(e["prediccion"])}'),
        sub="El único experimento que no toca una pantalla: cambia el paso con el que se "
            "mueve el Elo, y solo para los que ya llevan un rato jugando.",
        anchor="experimento-motor")]
    pieza_experimento_motor = "".join(out)

    # ── 6b · Experimentos por grupo de WhatsApp ──────────────────────────────
    # Mismo trato que la sección de arriba —estado primero, guardarraíles
    # siempre, lectura solo con el n comprometido— pero la unidad es el GRUPO,
    # no el jugador: la tabla muestra clickrate medio y desvío ENTRE GRUPOS, no
    # una proporción de jugadores (ver game_queries.py :: experimento_grupos).
    out = []
    bloques = []
    for e in p["experimentos_grupos"]:
        brazos = e["brazos"]
        total = sum(b["n"] for b in brazos)
        falta = max((b["falta"] for b in brazos), default=0)

        if e["sin_arrancar"]:
            estado = _caja_estado(
                "Sin datos todavía",
                "Ningún grupo de ninguno de los dos brazos recibió esta campaña "
                "todavía.", "espera")
        elif falta > 0:
            estado = _caja_estado(
                f'Todavía no se puede leer — faltan {num(falta)} grupo(s) por brazo',
                f'Van {num(total)} de los {num(2 * e["n_pedido"])} grupos comprometidos '
                f'({num(e["n_pedido"])} por brazo, 40+ miembros). El p-valor no se calcula '
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
                    f'Intervalo del 95% para la diferencia de medias: '
                    f'[{num(L["ic_pp"][0])} ; {num(L["ic_pp"][1])}] pp. '
                    f'Antes de implementar, mirar los guardarraíles de la tabla.',
                    "gana" if L["delta_pp"] > 0 else "pierde")
            else:
                estado = _caja_estado(
                    f'Sin diferencia detectable: {num(L["delta_pp"], " pp")}',
                    f'z = {num(L["z"], dec=2)}, p-valor {_p_txt(L["p_valor"])}. El intervalo '
                    f'del 95% —[{num(L["ic_pp"][0])} ; {num(L["ic_pp"][1])}] pp— contiene al '
                    f'cero. No es «son iguales»: es que un efecto de '
                    f'{num(e["mde_pp"], " pp", dec=1)} o más habría aparecido, y uno más '
                    f'chico este diseño no lo puede ver.', "plano")

        filas = [[
            f'<b>{esc(b["label"])}</b>', num(b["n"]),
            "—" if b["clickrate_medio"] is None else num(b["clickrate_medio"], "%", dec=1),
            "—" if b["desvio_pp"] is None else num(b["desvio_pp"], " pp", dec=1),
            _pct_txt(b["pct_activado"]),
            "—" if b["activados_por_grupo"] is None else num(b["activados_por_grupo"], dec=1),
            _pct_txt(b["pct_vuelven"]),
        ] for b in brazos]

        bloques.append(
            _box(esc(e["titulo"]), estado
                 + _table(["Brazo", "Grupos", "Clickrate medio", "Desvío (por universidad)",
                           "Activación", "Activados / grupo", "Volvió otro día"], filas,
                          empty="todavía ningún grupo")
                 + '<p class="note">«Clickrate medio» es el crudo, para leer de un vistazo. '
                   '«Desvío» —y el z-test de arriba— son sobre el RESIDUO de cada grupo '
                   'contra el promedio de su universidad: es el mismo estrato que usó el '
                   'sorteo, y analizarlo así es lo que permite 88 grupos por brazo en vez '
                   'de 101 (ver el docstring de <code>experimento_grupos()</code>).'
                   '<br><br><b>Las tres últimas columnas son guardarraíles, no objetivos.</b> '
                   'Un clickrate que sube sin que suba la activación es gente que tocó el '
                   'link por curiosidad, no jugadores nuevos — se miran siempre, incluso '
                   'antes del n.</p>',
                 note=f'<b>Hipótesis:</b> {esc(e["hipotesis"])}'
                      f'<br><br>Declarado el {e["desde"].strftime("%d/%m")}: efecto mínimo '
                      f'{num(e["mde_pp"], " pp", dec=1)} entre grupos, '
                      f'alfa {num(e["alpha"], dec=2)}, potencia '
                      f'{num(100 * e["potencia"], "%", dec=0)} → '
                      f'<b>{num(e["n_pedido"])} grupos por brazo</b>. '
                      f'{esc(e["prediccion"])}'))

    out.append(_section(
        2, "Experimentos por grupo de WhatsApp",
        "".join(bloques) or '<p class="empty">no hay experimentos de grupo declarados</p>',
        sub="La unidad acá es el GRUPO, no el jugador: todos sus miembros ven el mismo "
            "mensaje, así que lo que se aleatoriza y se cuenta es el grupo — ver "
            "docs/reports/reporte-ab-imagen-ranking-2026-09-14.pdf.",
        anchor="experimentos-grupos"))
    pieza_experimentos_grupos = "".join(out)

    # ── Difusión: el clickrate ───────────────────────────────────────────────
    out = []
    di = p["difusion"]
    if di["vacio"]:
        cuerpo_dif = (
            '<p class="empty">la copia del tracker está vacía — correr '
            '<code>scripts/diag/sync_grupos.py</code></p>')
    else:
        g = di["global"]
        ca, pv = di["camada"], di["previa"]
        contra = f'vs. la ola del {pv["label"]}' if pv else "sin ola anterior"

        # Intercalados y no agrupados: audiencia y clickrate de la misma copia,
        # pegados. Es la única forma de que se lean como una división —el de la
        # izquierda es el denominador del de la derecha— y de que comparar las
        # dos copias sea mirar dos pares y no cruzar cuatro casillas.
        #
        # Y son de la ÚLTIMA OLA, no del acumulado. El acumulado promedia todo
        # lo que se mandó desde el principio: la ola del 14/09 rindió casi la
        # mitad que la del 07/09 y el titular acumulado casi no se movió, porque
        # la vieja pesa el doble en su propio promedio. Un número que tarda un
        # mes en enterarse de una caída a la mitad no sirve de titular.
        def _par(clave, etiqueta):
            d = ca[clave]
            p = pv[clave] if pv else None

            def _delta(campo):
                if p is None or d[campo] is None or p[campo] is None:
                    return None
                return round(d[campo] - p[campo], 2)

            return [
                (f"Audiencia · {etiqueta}", d["miembros"], _delta("miembros"), "",
                 f'en {num(d["grupos"])} grupos', 0),
                (f"Clickrate · {etiqueta}", d["pct"], _delta("pct"), "%",
                 f'{num(d["jugadores"])} jugadores', 1),
            ]

        # Las dos líneas de la curva: una copia cada una, una ola cada punto. El
        # «sin copia» no dibuja una tercera —son grupos de los que no sabemos
        # qué mensaje recibieron, así que su línea no significaría nada— pero el
        # tamaño de la ola ENTERA sí entra en cada tooltip: es lo que deja ver
        # que una copia cubrió media ola, que si no se lee como si hubiera
        # cubierto toda.
        #
        # El tooltip solo existe donde hay punto —`ch.lines` lo cuelga del
        # círculo— así que una semana sin envío no puede explicarse a sí misma y
        # lo explica la nota de abajo. Un tip para un punto que no se dibuja es
        # texto que nadie va a ver nunca.
        def _serie(clave, etiqueta):
            tips = []
            for fila in di["semanal"]:
                d = fila[clave]
                if not d["grupos"]:
                    tips.append(None)
                    continue
                t = (f'Semana del {fila["label"]} · {etiqueta}\n'
                     f'{num(d["jugadores"])} jugadores de {num(d["miembros"])} '
                     f'alcanzados en {num(d["grupos"])} grupos = {_pct_txt(d["pct"])}\n'
                     f'La ola entera de esa semana: {num(fila["global"]["grupos"])} '
                     f'grupos, {num(fila["global"]["miembros"])} alcanzados')
                if not fila["madura"]:
                    t += (f'\nTodavía suma clics: el último envío fue el '
                          f'{fila["ultimo_envio"].strftime("%d/%m")}')
                tips.append(t)
            return {
                "label": etiqueta,
                "values": [f[clave]["pct"] if f[clave]["grupos"] else None
                           for f in di["semanal"]],
                "weak": [not f["madura"] for f in di["semanal"]],
                "tips": tips,
            }

        cuerpo_dif = (
            ('<div class="grid g4">'
             + "".join(_kpi_camada(l, v, dl, contra, h, suffix=sfx, dec=dc)
                       for l, v, dl, sfx, h, dc in
                       _par("analisis", "análisis") + _par("generico", "genérico"))
             + "</div>"
             if ca else
             '<p class="empty">ningún grupo de la copia recibió dx dentro de la '
             'ventana del panel</p>')
            + '<p class="note">'
            + (f'<b>Los cuatro números son de la última ola</b> —la del '
               f'{ca["label"]}, {num(ca["envios"])} grupos— y no del acumulado. A '
               f'los grupos donde las derivadas están en el temario se les habló de '
               f'derivadas; a los demás, del juego. Los dos clickrates se comparan '
               f'directo —son tasas por miembro, así que el tamaño de cada audiencia '
               f'no los mueve— pero no se leen con la misma precisión: son '
               f'{num(ca["analisis"]["miembros"])} personas de un lado y '
               f'{num(ca["generico"]["miembros"])} del otro, y la más chica tiene el '
               f'intervalo más ancho.'
               if ca and ca["analisis"]["miembros"] and ca["generico"]["miembros"] else
               f'<b>La ola del {ca["label"]} no salió con las dos copias.</b> La '
               f'etiqueta la escribe <code>scripts/diag/sync_grupos.py --cluster</code> '
               f'desde los planes de la campaña; sin ella la ola no se puede partir.'
               if ca else
               '<b>Todavía no hay ninguna ola dentro de la ventana.</b>')
            + ("" if not ca or ca["madura"] else
               f'<br><br><b>Esa ola todavía no terminó de llegar.</b> Su último envío '
               f'fue el {ca["ultimo_envio"].strftime("%d/%m")} y el clic tarda: el '
               f'79% entra el mismo día, pero recién a los {di["maduracion_dias"]} '
               f'días está el 96%. Los dos clickrates de arriba son un piso, y el '
               f'delta contra la ola anterior se va a achicar solo.')
            + (f'<br><br>Quedan afuera de las dos copias '
               f'{num(di["sin_copia"]["miembros"])} personas en '
               f'{num(di["sin_copia"]["grupos"])} grupos sin copia anotada, que '
               f'trajeron {num(di["sin_copia"]["jugadores"])} jugadores. La etiqueta '
               f'la escribe <code>scripts/diag/sync_grupos.py --cluster</code> desde '
               f'los planes de la campaña, así que una campaña cuyos planes no la '
               f'declaran deja a todos sus grupos afuera de las dos líneas. No se '
               f'reparten a ojo: «no sabemos con cuál» es información.'
               if di["sin_copia"]["grupos"] else "")
            + f'<br><br>Sumando todas las olas da <b>{_pct_txt(g["pct"])}</b> sobre '
              f'{num(g["miembros"])} personas en {num(g["grupos"])} grupos, '
              f'{num(g["jugadores"])} jugadores — y es el número que miden las tres '
              f'tablas de abajo, que son acumuladas. La cobertura del cruce es '
              f'{_pct_txt(di["pct_cobertura"])} ({num(di["cubiertos"])} de '
              f'{num(di["atribuidos"])} atribuidos).'
            + "</p>"
            + _box("Cómo se movió el clickrate de cada copia",
                   ch.lines([_serie("analisis", "análisis"),
                             _serie("generico", "genérico")],
                            [f["label"] for f in di["semanal"]],
                            suffix="%", height=240),
                   note="Cada punto es una OLA y no una semana de calendario: los "
                        "jugadores se le cuentan a la semana en que se posteó en su "
                        "grupo, aunque entren tres días después. Las semanas sin "
                        "envío no tienen punto y la línea se corta ahí: bajar a cero "
                        "sería dibujar una ola que no salió. Las que "
                        "todavía suman clics van con el punto hueco y la línea "
                        "punteada. <b>Pasando el mouse por encima de un punto sale de "
                        "cuántos grupos y de cuánta gente salió ese porcentaje</b>, "
                        "que es lo que decide si la diferencia entre dos olas es una "
                        "señal o dos grupos chicos.")
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
    def _filas_de(lugares):
        return [[
            f'<b>{esc(l["desc"])}</b><br><span class="sub2">{esc(l["lugar"])}</span>',
            num(l["impresiones"]) if l["impresiones"] else
            '<span class="sub2">no las anota</span>',
            num(l["clicks"]), _pct_txt(l["ctr"]),
        ] for l in lugares]
    # ── El embudo de la plata ────────────────────────────────────────────────
    em = mo["embudo"]
    pieza_embudo = _section(
        2, "De los que ven el pedido, quiénes pagan",
        ch.hbars([
            {"label": "Vieron el pedido", "value": em["vieron"], "note": ""},
            {"label": "Tocaron «Invitar»", "value": em["tocaron"],
             "note": f'{_pct_txt(em["pct_tocaron"])} de los que vieron'},
            {"label": "Pagaron", "value": em["pagaron"],
             "note": f'{_pct_txt(em["pct_pagaron"])} de los que tocaron'},
        ], label_w=150)
        + '<div class="grid g3">'
        + "".join(_kpi_chico(l, v, h, suffix=sfx) for l, v, h, sfx in [
            ("Del pedido al botón", em["pct_tocaron"] or 0,
             "para un pedido de plata, es altísimo", "%"),
            ("Del botón a la plata", em["pct_pagaron"] or 0,
             f'{num(em["tocaron"] - em["pagaron"])} tocaron y no pagaron', "%"),
            ("Donaron sin cuenta", em["invitados"],
             f'de {num(em["pagaron"])} donantes', ""),
        ])
        + "</div>"
        + f'<p class="note"><b>Esto no se podía medir hasta el cobro directo.</b> Con '
          f'Cafecito la donación llegaba anónima y acá se cruzaban agregados —donaciones '
          f'de la semana contra clicks de la semana— con la advertencia de que no era una '
          f'conversión persona a persona y no podía serlo. Ahora la preferencia de Mercado '
          f'Pago viaja con el jugador adentro y el pago vuelve con él.'
          f'<br><br><b>El escalón que importa es el segundo.</b> Del pedido al botón la '
          f'conversión es altísima: el cartel no tiene problema. Lo que se pierde se pierde '
          f'después del click, del otro lado del salto, y ahí el panel no ve —esa parte '
          f'está medida en <a href="https://github.com/intervalo-ed/intervalo">el reporte '
          f'del 17/09</a> por el tiempo que tardan en volver al juego: 28 segundos de '
          f'mediana los que no pagan, 202 los que sí.'
          f'<br><br><b>El piso está subestimado mientras convivan los canales viejos.</b> '
          f'Una donación que entra por el socket de Cafecito o por el mail de Mercado Pago '
          f'no trae jugador, así que suma en el total y no en «pagaron»: hoy '
          f'{num(em["con_dueno"])} de {num(em["donaciones"])} donaciones '
          f'({_pct_txt(em["pct_con_dueno"])}) tienen dueño conocido. Ese número tiene que '
          f'irse a 100% cuando se apaguen.</p>',
        sub="El embudo persona por persona, que hasta el cobro directo era imposible.",
        anchor="embudo")

    pieza_monetizacion = _section(
        1, "Dónde se pide el cafecito",
        _box("El botón que abre el pedido",
             _table(["Lugar", "Impresiones", "Clicks", "Abren la diapo"],
                    _filas_de(mo["abren"]),
                    empty="todavía no se mostró ninguno"),
             note=(
                 "La taza de la barra y sus equivalentes. Su click <b>no dona nada</b>: "
                 "abre la diapo. Por eso la última columna no es una tasa de donación sino "
                 "de apertura."
                 "<br><br><b>En escritorio convierte casi cinco veces más que en el "
                 "teléfono</b>, con el mismo botón. La diferencia más probable es que en "
                 "escritorio lleva la palabra «cafecito» escrita al lado y su atajo de "
                 "teclado, y en el teléfono es solo un ícono — el <code>sm:</code> de "
                 "<code>cafecito-cta.tsx</code> esconde la palabra en pantallas chicas."
                 "<br><br>La impresión de la barra se cuenta <b>una por partida y no por "
                 "render</b>, así que su denominador es «tuvo el cafecito adelante» y no "
                 "«se dibujó el botón»."))
        + _box("El pedido",
               _table(["Lugar", "Impresiones", "Clicks", "Se van a pagar"],
                      _filas_de(mo["piden"]),
                      empty="todavía no se mostró ninguno"),
               note=(
                   "La diapo entera, con el slider y el precio. Acá el click <b>sí</b> es "
                   "la intención de pagar: manda a Mercado Pago y anota la intención."
                   "<br><br><b>Estas dos tablas no se suman</b>, y esa es la razón de que "
                   "sean dos. Quien toca la taza genera un click arriba <i>y</i> una "
                   "impresión de <code>pedido</code> acá abajo: es el mismo acto contado en "
                   "los dos escalones. Antes estaban en una sola tabla y la columna de la "
                   "derecha significaba dos cosas distintas según la fila."
                   f"<br><br>Sin {num(MIN_IMPRESIONES_CTR)} impresiones no se dibuja "
                   f"porcentaje: un 10% que sale de una persona sobre diez es ruido con "
                   f"forma de dato."
                   + (f'<br><br><b>Hay {num(mo["sin_denominador"])} clicks sin '
                      f'denominador.</b> Los lugares marcados «no las anota» disparan el '
                      f'click sin montar el contador de impresiones '
                      f'(<code>settings-panel.tsx</code>), así que su tasa no se puede '
                      f'calcular. Están listados igual: esconderlos haría que el agujero '
                      f'siguiera sin verse otro mes.' if mo["sin_denominador"] else ""))),
        sub="Son dos escalones y no uno: el botón que abre el pedido, y el pedido.",
        anchor="monetizacion") + pieza_embudo

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

    # ── La opinión de la gente ───────────────────────────────────────────────
    op = p["opinion"]
    _rot = lambda v: f'{SURVEY_EMOJI_A.get(v, "")} {SURVEY_TEXT.get(v, v)}'.strip()

    filas_op = [[f'<b>{esc(_rot(f["voto"]))}</b>', num(f["n"]),
                 _pct_txt(f["prometido"]), _pct_txt(f["real"]),
                 _chip(round(f["real"] - f["prometido"], 1), "%")
                 if f["real"] is not None and f["prometido"] is not None else "—",
                 num(f["delta_medio"], dec=2) if f["delta_medio"] is not None else "—",
                 f'{num(f["movidos"])} · {num(f["cambiaron_nivel"])} de color']
                for f in op["filas"]]

    # El titular: a qué tasa de acierto la gente dice que está justo. Es la única
    # manera de saber si la banda del motor está donde tiene que estar, porque
    # ninguna cantidad de respuestas contesta esa pregunta sola.
    if op["comodo_en"] is None:
        titular = ("Todavía nadie contestó «justo», así que no se puede decir a qué "
                   "tasa de acierto la gente se siente cómoda.")
    else:
        distancia = round(op["comodo_en"] - op["objetivo"], 1)
        titular = (
            f'Quien dice que está <b>justo</b> viene acertando el '
            f'<b>{num(op["comodo_en"], "%")}</b>, y el motor apunta al '
            f'{num(op["objetivo"], "%")}: '
            + ("están en el mismo lugar." if abs(distancia) < 3 else
               f'<b>{num(abs(distancia), " pp")}</b> '
               f'{"por encima" if distancia > 0 else "por debajo"}. Si el hueco se '
               f'sostiene, lo que hay que mover no es el θ de nadie sino '
               f'<code>elo.TARGET_LOW/HIGH</code>.'))

    pieza_opinion = _section(
        3, "Lo que dice la gente",
        '<div class="grid g4">'
        + "".join(_kpi_chico(l, v, h, suffix=sfx, dec=d) for l, v, sfx, h, d in [
            ("Contestaron", op["pct_respuesta"], "%",
             f'{num(op["contestadas"])} de {num(op["mostradas"])} preguntas', 1),
            ("Se sienten cómodos en", op["comodo_en"], "%",
             f'el motor apunta al {num(op["objetivo"], "%")}', 1),
            ("Personas", op["jugadores"], "", "que votaron al menos una vez", 0),
            ("θ movido", op["theta_movido"], "",
             "sumando todos los ajustes, en unidades de θ", 1),
        ])
        + "</div>"
        + _box("Cuántos dijeron cada cosa",
               ch.stack([{"label": _rot(f["voto"]), "n": f["n"]} for f in op["filas"]])
               if op["filas"] else '<p class="empty">todavía nadie votó</p>')
        + _box("Lo que el motor prometía contra lo que la persona entregó",
               ch.vbars([_rot(f["voto"]) for f in op["filas"]],
                        [{"label": "Prometido",
                          "values": [f["prometido"] for f in op["filas"]]},
                         {"label": "Real",
                          "values": [f["real"] for f in op["filas"]]}],
                        suffix="%", height=230)
               if op["filas"] else '<p class="empty">todavía nadie votó</p>',
               note=titular +
                    f' En el clásico, cruzar estos mismos tres votos contra el '
                    f'comportamiento medido da la banda '
                    f'{num(op["banda_clasico"][0], "%")}–'
                    f'{num(op["banda_clasico"][1], "%")} '
                    f'(<code>queries.P1_BAND</code>); va como referencia y no como '
                    f'objetivo, porque allá se mide sobre el ítem y acá sobre la '
                    f'persona.'
                    '<br><br><b>Las dos columnas se pesan por respuestas y no por '
                    'persona</b>, y salen de lo que quedó congelado en la fila del '
                    'voto: β se mueve con cada respuesta, así que recalcular hoy '
                    'qué prometía el motor cuando alguien votó daría otro número.')
        + _box("Qué hizo el motor con cada voto",
               _table(["Voto", "Votos", "Prometido", "Real", "Brecha", "Δθ medio",
                       "Movieron"], filas_op,
                      empty="todavía no hay votos"),
               note='El voto solo ajusta θ cuando el registro de la persona va para '
                    'el mismo lado, así que <b>«movieron» es casi siempre menos que '
                    '«votos»</b> — quien dice «muy fácil» sin estarle ganando al '
                    'motor no se mueve. «Justo» nunca ajusta nada por definición. '
                    'El tope de un ajuste es un tier '
                    f'(<code>opinion.TOPE</code> = {num(OPINION_TOPE, dec=2)}), que '
                    'es lo que hace que un voto pueda subir de color pero nunca '
                    'saltear un nivel.')
        + _box("Semana a semana",
               _table(["Semana", "Votos", "Muy fáciles", "Se sienten cómodos en"],
                      [[esc(f["label"]), num(f["n"]),
                        num(f["pct_muy_facil"], "%"), num(f["comodo_en"], "%")]
                       for f in op["por_semana"]],
                      empty="todavía no hay votos"),
               note='La tabla de arriba es de toda la historia y esta es la serie, y '
                    'hace falta tener las dos: el 19/09 salieron los tiers 6-8 y el '
                    'acumulado siguió mostrando el número de un catálogo que ya no '
                    'existía. <b>La columna que hay que mirar es «muy fáciles»</b> — si '
                    'la regla de la cadena hizo lo que tenía que hacer, baja.'),
        sub="El motor decide la dificultad con lo que mide. Esto es lo único que "
            "mide preguntando.",
        anchor="opinion")

    # ── La otra pregunta: si le salen repetidas ───────────────────────────────
    rp = p["repetitividad"]
    _rot_r = lambda v: f'{SURVEY_EMOJI_R.get(v, "")} {SURVEY_TEXT.get(v, v)}'.strip()

    if rp["enunciados_del_quejoso"] is None:
        titular_r = ("Todavía no hay suficientes votos para decir de qué lado está "
                     "el problema.")
    else:
        titular_r = (
            f'Quien dice que se repiten venía viendo '
            f'<b>{num(rp["enunciados_del_quejoso"], dec=1)} enunciados distintos</b> '
            f'en sus últimas {num(rp["ventana"])} derivadas. El selector ya excluye '
            f'las {num(rp["excluidas"])} plantillas más recientes, así que un número '
            f'alto acá quiere decir que el banco es chico y la misma plantilla vuelve '
            f'con otros números; uno bajo, que la exclusión se está quedando corta.'
        )

    pieza_repetitividad = _section(
        4, "Si le salen repetidas",
        '<div class="grid g4">'
        + "".join(_kpi_chico(l, v, h, suffix=sfx, dec=d) for l, v, sfx, h, d in [
            ("Contestaron", rp["pct_respuesta"], "%",
             f'{num(rp["contestadas"])} de {num(rp["mostradas"])} preguntas', 1),
            ("Personas", rp["jugadores"], "", "que votaron al menos una vez", 0),
            ("Ventana", rp["ventana"], "", "sobre cuántas derivadas se mide", 0),
            ("Plantillas excluidas", rp["excluidas"], "",
             "las que el selector no puede repetir", 0)])
        + "</div>"
        + _box("Cuántos dijeron cada cosa",
               ch.stack([{"label": _rot_r(f["voto"]), "n": f["n"]} for f in rp["filas"]])
               if rp["filas"] else '<p class="empty">todavía nadie votó</p>')
        + _box("Lo que decían contra lo que venían viendo",
               _table(["Voto", "Votos", "Plantillas distintas", "Enunciados distintos",
                       "Con datos"],
                      [[f'<b>{esc(_rot_r(f["voto"]))}</b>', num(f["n"]),
                        num(f["plantillas"], dec=1), num(f["enunciados"], dec=1),
                        num(f["con_datos"])]
                       for f in rp["filas"]],
                      empty="todavía no hay votos"),
               note=titular_r + ' Los dos contadores son promedios sobre la ventana y '
                    'se cuentan aparte porque miden cosas distintas: ocho plantillas '
                    'pueden ser ocho veces el mismo enunciado, que es exactamente el '
                    'bug que se arregló el 10/09. «Con datos» son los votos de gente '
                    'que ya había visto lo suficiente para que el promedio signifique '
                    'algo; el resto cuenta para la tasa de respuesta y no para las '
                    'dos columnas de la izquierda.')
        + _box("Semana a semana",
               _table(["Semana", "Votos", "Muy repetidas"],
                      [[esc(f["label"]), num(f["n"]), num(f["pct_repetitivo"], "%")]
                       for f in rp["por_semana"]],
                      empty="todavía no hay votos")),
        sub="Este voto no mueve nada: es dato para decidir cuánto ampliar el banco.",
        anchor="repetitividad")

    # ── Fricción ─────────────────────────────────────────────────────────────
    fr = p["friccion"]
    pieza_friccion = _section(
        5, "Fricción",
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


    # ── 12 · Voces ───────────────────────────────────────
    en = p["encuestas"]
    nota_voces = (
        'La pregunta sale una sola vez en la vida, en la derivada 18, y '
        'la diapo <b>no tiene botón de saltar</b>: la única salida es '
        'escribir algo. Eso es lo que sostiene el número de arriba. Los otros '
        f'dos estados de la pregunta no se dibujan pero se siguen contando y '
        f'viajan en el data.json: {num(en["pct_salto"], "%")} dijo que no con un '
        f'punto o una raya, y {num(en["pct_abandono"], "%")} vio la pregunta y '
        'cerró la pestaña — <b>ese es el que decide si la pregunta se saca</b>, '
        'porque es lo que cuesta.<br><br>'
        'Las respuestas se listan enteras y no se resumen a propósito: un '
        'histograma de respuestas abiertas es una respuesta abierta tirada a la '
        'basura. Las <b>derivadas</b> y el <b>XP</b> de cada tarjeta son los de '
        'hoy, no los del momento en que contestó; «iba por la N» sí es de '
        'entonces.')
    cuerpo_voces = (
        '<p class="empty">todavía no contestó nadie</p>' if not en["respuestas"]
        else (_buscador(en["respuestas"])
              + '<p class="empty" id="voces-vacio" hidden></p>'
              + '<div class="voces" id="voces-lista">'
              + "".join(_voz(r) for r in en["respuestas"])
              + "</div>"
              + f"<script>{VOCES_JS}</script>"))
    pieza_voces = _section(
        1, "Lo que escribieron",
        # Un solo número y de ancho completo. Los otros tres que había acá
        # —salto, abandono, largo medio— no se leían nunca: lo que se viene a
        # hacer a esta pestaña es LEER, y cuatro tarjetas antes de la primera
        # respuesta son cuatro tarjetas de distancia.
        '<div class="box kpi kpi-ancho">'
        '<div class="izq"><span class="label">Contestaron</span>'
        f'<span class="val">{num(en["pct_respuesta"], "%")}</span></div>'
        f'<div class="hint">{num(en["con_texto"])} de {num(en["mostradas"])} '
        'preguntas que salieron</div></div>'
        + cuerpo_voces
        + f'<p class="note">{nota_voces}</p>'
        + (_box("Preguntas en la bolsa",
                "<p>" + ", ".join(f"<code>{esc(q)}</code>" for q in en["preguntas"])
                + "</p>",
                note='Cada respuesta queda atada a la clave de la pregunta que la '
                     'persona leyó (<code>game_survey_answers.pregunta</code>), así '
                     'que cambiar el enunciado no mezcla dos tandas.')
           if len(en["preguntas"]) > 1 else ""),
        sub="La única cosa que el juego sabe y no midió.",
        anchor="voces")

    # ── Las pestañas ──────────────────────────────────────────────────
    # Cada una es un scroll vertical: primero sus números de la semana,
    # después las secciones que los explican. El orden adentro de cada pestaña
    # va de lo más agregado a lo más fino, que es el orden en que se mira cuando
    # algo llama la atención.
    paneles = {
        "activacion": (_fila_kpi(p["headline"]["activacion"])
                       + pieza_difusion + pieza_reclutas),
        "retencion": (_fila_kpi(p["headline"]["retencion"])
                      + pieza_push + pieza_mails),
        "jugabilidad": (_fila_kpi(p["headline"]["jugabilidad"])
                        + pieza_profundidad + pieza_calibracion + pieza_opinion
                        + pieza_repetitividad + pieza_friccion),
        "monetizacion": (_fila_kpi(p["headline"]["monetizacion"])
                         + pieza_monetizacion),
        "experimentacion": (pieza_experimentos + pieza_experimento_motor
                            + pieza_experimentos_grupos),
        "voces": pieza_voces,
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
