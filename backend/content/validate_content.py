"""Validador determinista de contenido de ejercicios.

Corre los checks automatizables de `authoring-context.md` sobre los JSON de un
curso. Dos niveles de hallazgo:

- ERROR:   violación inequívoca de una regla. Exit code 1. Se corrige siempre.
- WARNING: heurística. Se revisa con criterio; si se deja, se justifica en el
           mensaje de commit.

Uso (desde `backend/`):

    python content/validate_content.py --course analisis
    python content/validate_content.py --course analisis --topic brown/integrals/definite
    python content/validate_content.py --course analisis --check options,structure
    python content/validate_content.py --course analisis --json

Reglas citadas por número de `authoring-context.md`. Los checks NO cubiertos acá
(quedan en el checklist manual del topic-context): regla 25 (porqué vs qué),
regla 30 (aligned de datos vs derivación), regla 31 (reintroducir definición),
reglas duras por topic (+C, frontera matemática, límites actualizados).
"""

from __future__ import annotations

import argparse
import json
import re
import sys
import unicodedata
from collections import Counter
from fractions import Fraction
from pathlib import Path
from statistics import median

CONTENT_DIR = Path(__file__).resolve().parent

# La consola de Windows arranca en cp1252 y el contenido es español con acentos
# (y, desde las tablas, con emoji). Sin esto los mensajes salen con mojibake y un
# emoji en un hallazgo directamente tira UnicodeEncodeError a mitad del reporte.
for _stream in (sys.stdout, sys.stderr):
    if hasattr(_stream, "reconfigure"):
        _stream.reconfigure(encoding="utf-8", errors="replace")

ALL_CHECKS = ["options", "explanations", "questions", "feedbacks", "structure", "tables", "ids", "duplicates", "graphs"]

# --- Umbrales calibrables -----------------------------------------------------

LONGEST_RATIO = 1.2      # correcta más larga: > ratio x mediana de distractores
SHORTEST_RATIO = 0.8     # correcta más corta: < ratio x mediana de distractores
MIN_ABS_GAP = 5          # y la diferencia absoluta (render) supera este piso
OPENER_REPEAT_FRACTION = 0.3   # misma apertura en >=30% de los ítems del archivo
OPENER_REPEAT_MIN = 3
PARAGRAPH_PROSE_MAX = 200      # regla: párrafo de prosa <=200 chars (warning)
QUESTION_PROSE_MAX = 130       # regla 36: en question el umbral es más estricto (~3 renglones en móvil)
INLINE_FRAGMENTS_WARN = 3      # regla 21 dice 2+; se marca desde 3 para bajar ruido
EXPLANATION_MIN = 300
FEEDBACK_CORRECT_MAX = 160
CORRECT_INDEX_SKEW = 0.5
INLINE_EQUATION_MAX = 18       # regla 35: ecuación inline más ancha que esto → display
DISPLAY_RENDER_MAX = 36        # regla 38: fila display más ancha que esto → verticalizar/partir
OPTION_RENDER_MAX = 35         # regla 39: opción más ancha que la grilla 2×2
CHAIN_FACTORS_MIN = 3          # regla 41: 3+ factores P(...) multiplicados sin "+" → verticalizar
DUPLICATE_MIN_NUMBERS = 4      # regla 65: firma numérica mínima para comparar dos enunciados
DUPLICATE_MIN_DISTINCT = 3     # regla 65: y variedad mínima, para no comparar firmas triviales

# Regla 45: última palabra de una opción que casi nunca cierra legítimamente
# una frase en español (preposición, artículo, conjunción). Señal fuerte de
# texto truncado a mitad de frase (ej. "Es una constante irracional con").
TRUNCATION_STOPWORDS = {
    "de", "del", "al", "con", "en", "a", "por", "para", "sin", "sobre",
    "entre", "hacia", "desde", "hasta", "según", "durante", "mediante",
    "y", "o", "u", "e", "ni", "que", "si", "como", "cuando",
    "el", "la", "los", "las", "un", "una", "unos", "unas", "su", "sus",
    "es", "son", "más", "menos", "muy", "tan", "no",
}

ACCUSATORY_STARTS = [
    "Confunde", "Confundís", "Invierte", "Invertís", "Olvida", "Olvidás",
    "Ignora", "Ignorás", "Interpreta", "Falla en", "Se olvidó", "Falta",
]

# Regla 34: el cierre de `explanation` no se anuncia como advertencia de
# diagnóstico ("La confusión típica es...", "Un error común es...", "Es un
# error frecuente...", "X es la trampa habitual"), va en voz narrativa
# directa. Busca en todo el último párrafo (no solo al inicio) porque el
# rótulo puede aparecer como segunda oración o como predicado al final.
DIAGNOSTIC_CLOSE_RE = re.compile(
    r"(?:"
    r"\b(el|la|los|las|una?|este|esta|estos|estas)\s+(confusi[oó]n(es)?|error(es)?|trampa(s)?)\b"
    r"(?:\s+(?:m[aá]s\s+)?(?:t[ií]pic[oa]s?|com[uú]n(?:es)?|frecuente(?:s)?|cl[aá]sico(?:a)?s?|habitual(?:es)?|grave(?:s)?))?"
    r"\s+(?:es|son)\b"
    r"|"
    r"(?<!no )es\s+(?:un|una|la|el|los|las)\s+(?:m[aá]s\s+)?(?:t[ií]pic[oa]s?|com[uú]n(?:es)?|frecuente(?:s)?|cl[aá]sico(?:a)?s?|habitual(?:es)?|grave(?:s)?)?\s*(confusi[oó]n(es)?|error(es)?|trampa(s)?)\b"
    r")",
    re.IGNORECASE,
)
# Regla 34 (cont.): filler genérico que reemplaza la rotulación sin cambiar
# el problema de fondo, marcador breve tipo "Ojo:"/"Cuidado con..." (regla
# 34 solo admite las 4 familias: consecuencia directa, segunda persona,
# gerundio/infinitivo al frente, u otros caso a caso), y comparación/
# contraste tipo "A diferencia de X, acá...".
FILLER_CLOSE_RE = re.compile(r"^es\s+(f[aá]cil|tentador)\b", re.IGNORECASE)
MARKER_CLOSE_RE = re.compile(r"^(ojo|atenci[oó]n|cuidado)\b", re.IGNORECASE)
CONTRAST_CLOSE_RE = re.compile(r"^a\s+diferencia\s+de\b", re.IGNORECASE)

EMDASH = "—"
ENDASH = "–"
CHECKMARKS = ("✓", "✗", "✘")

# --- Reglas 47-51: filosofía pedagógica (ver authoring-context.md) ------------
# Intervalo pregunta, no ordena: el estudiante lee el enunciado y piensa antes
# de abrir las opciones, así que el enunciado debe ser autosuficiente.

# Regla 48: imperativos de cálculo. Las formas de voseo (acentuadas) son
# inequívocas y se buscan en cualquier posición. Las de tuteo colisionan con
# la 3ª persona ("la fórmula se deriva de..."), así que solo se marcan
# arrancando oración.
CALC_IMP_VOSEO_RE = re.compile(
    r"\b(?:calculá|hallá|determiná|resolvé|encontrá|obtené|derivá|integrá"
    r"|evaluá|expandí|simplificá|planteá|aplicá)\b",
    re.IGNORECASE,
)
CALC_IMP_TUTEO_RE = re.compile(
    r"(?:^|[.:!?]\s+|\n)(?:calcula|halla|determina|resuelve|encuentra|obtén"
    r"|deriva|integra|evalúa|expande|simplifica|plantea|aplica)\b",
    re.IGNORECASE,
)

# Regla 49: imperativos de atención vacíos como primera palabra del enunciado
# ("Analizá la integral:"). No sitúan nada; son plantilla rotada.
ATTN_IMPERATIVE_RE = re.compile(
    r"^(?:considerá|considera|analizá|analiza|observá|observa|examiná|examina"
    r"|estudiá|estudia|verificá|verifica|investigá|investiga|reconocé|reconoce"
    r"|identificá|identifica|categorizá|categoriza|decidí|decide|retomá|retoma"
    r"|trabajá|trabaja|preparate|prepárate|mirá|mira)\b",
    re.IGNORECASE,
)

# Regla 50: jerga técnica que no puede aparecer en `question` sin glosa. La
# heurística de "glosado" es que al término lo siga inmediatamente una coma o
# dos puntos (aposición); sin eso se marca para revisión manual.
JARGON_TERMS = [
    "cociente incremental", "ILATE", "LIATE", "primitiva", "antiderivada",
    "factor oculto", "aproximación lineal", "recta secante",
]

# Regla 47: cierre `$$?` colgado (el bloque display envuelto por la pregunta).
DANGLING_QMARK_RE = re.compile(r"\$\$\s{0,2}\?")

# --- Utilidades de texto ------------------------------------------------------

DISPLAY_RE = re.compile(r"\$\$.*?\$\$", re.DOTALL)
INLINE_RE = re.compile(r"(?<!\$)\$(?!\$)([^$\n]+)\$(?!\$)")
TEXTCMD_RE = re.compile(r"\\text\{([^{}]*)\}")
LATEX_CMD_RE = re.compile(r"\\[a-zA-Z]+")
# Opción que es enteramente una fórmula LaTeX (un solo $...$, sin prosa
# alrededor salvo un punto final opcional). Distingue "$15/24$" (aplica
# regla 39) de "Regla de la suma: son alternativas excluyentes." (no aplica).
PURE_FORMULA_OPTION_RE = re.compile(r"\$[^$]+\$\.?")
# Regla 40: rama nombrada/subindicada de partición dentro de un condicional,
# ej. "P(B\mid A_1)". Cuenta cuántas ramas distintas se suman explícitamente
# en vez de usar \sum_i.
PARTITION_TERM_RE = re.compile(r"P\([^()]*\\mid[^()]*\)")
# Regla 44: línea que consiste únicamente en un "." suelto (sin ninguna otra
# palabra), típicamente el resto de una oración cuya fórmula intermedia se
# movió a un bloque display sin eliminar el punto que había quedado colgado
# antes o después. Pasa desapercibido para el chequeo de "todo párrafo cierra
# en puntuación" porque, tomado aisladamente, ese "." sí "termina en punto".
ORPHAN_PERIOD_RE = re.compile(r"(?:^|\n)[ \t]*\.[ \t]*(?:\n|$)")
# Regla 42: \frac{...}{...} / \dfrac{...}{...} con un nivel de anidado (para
# poder capturar \binom{n}{k} completo dentro del numerador/denominador).
FRAC_RE = re.compile(r"\\d?frac\{((?:[^{}]|\{[^{}]*\})*)\}\{((?:[^{}]|\{[^{}]*\})*)\}")


# Comandos que KaTeX renderiza como símbolo con espaciado de relación/operador
# a ambos lados (p.ej. "\mid" → "∣" con medspace, "\cdot"/"\times" → "·"/"×"
# con espaciado de operador binario). LATEX_CMD_RE los borraba a longitud 0,
# que subestimaba sistemáticamente el ancho real de cadenas con varios
# "P(...\mid...)" encadenados (regla 38/39 no disparaban en casos que sí
# desbordaban en pantalla). "int"/"sum"/"prod"/"oint"/"iint" se suman acá: son
# glifos anchos con espaciado de operador propio, igual de subestimados por
# LATEX_CMD_RE, y son justamente los que dominan `explanation` en `integrales`
# (ver regla 38, nota de calibración).
# "sqrt"/"infty" y los símbolos de relación se suman en la ronda 8 (testeo 467):
# un alumno reportó una fila que desbordaba en pantalla y medía 35 contra el
# umbral de 36, o sea que pasaba por un carácter. La causa era que LATEX_CMD_RE
# los borraba a 0: el radical de "\sqrt{...}" es decoración que ocupa ancho
# además de su contenido, "\infty" es un glifo ancho, y "\neq"/"\leq"/"\geq"/
# "\approx"/"\pm" renderizan como un símbolo con espaciado de relación a ambos
# lados. Los tres aparecen justo en `rationalization` e `infinite_limits`, que
# son los archivos donde el desborde se ve.
RENDER_WEIGHT_CMDS = {
    "mid": 3, "cdot": 2, "times": 2,
    "int": 2, "iint": 2, "oint": 2, "sum": 2, "prod": 2,
    "sqrt": 2, "infty": 2,
    "pm": 2, "mp": 2, "neq": 2, "leq": 2, "geq": 2, "approx": 2,
}
WEIGHTED_CMD_RE = re.compile(r"\\(" + "|".join(RENDER_WEIGHT_CMDS) + r")\b")

# Funciones que KaTeX renderiza como palabra completa (ej. "\cos x" -> "cos x"),
# a diferencia de comandos como "\times" o "\pi" que renderizan como un solo
# símbolo. Espejo de LATEX_NAMED_FUNCTIONS en
# `web/src/lib/latex-visual-length.ts` para que las dos métricas (la que decide
# la grilla 2×2 en el frontend y la que audita ancho acá) no diverjan.
NAMED_FUNCTIONS = {
    "sin", "cos", "tan", "cot", "sec", "csc", "ln", "log", "lim", "exp",
    "min", "max", "gcd", "lcm", "det", "dim", "ker",
    "sinh", "cosh", "tanh", "arcsin", "arccos", "arctan",
}
NAMED_FUNCTIONS_RE = re.compile(r"\\(" + "|".join(NAMED_FUNCTIONS) + r")\b")


MATRIX_ENV_RE = re.compile(
    r"\\begin\{([bBpvV]?matrix|smallmatrix)\}(.*?)\\end\{\1\}", re.DOTALL
)


def matrix_render_len(body: str) -> int:
    r"""Ancho de render de un entorno de matriz.

    Lo que ocupa en pantalla lo fija la fila más ancha, no la cantidad total de
    caracteres del código: cada columna pesa lo que su entrada más larga, más
    un espacio de separación entre columnas y los dos delimitadores. Una matriz
    de 2x2 con dígitos sueltos mide unos 5, aunque su fuente pase de 30.
    """
    rows = [[cell.strip() for cell in row.split("&")] for row in re.split(r"\\\\", body)]
    columns = max(len(row) for row in rows)
    width = sum(
        max(len(row[col]) if col < len(row) else 0 for row in rows) for col in range(columns)
    )
    return width + (columns - 1) + 2


def render_len(s: str) -> int:
    """Longitud de render estimada: descuenta sintaxis LaTeX y delimitadores."""
    t = s
    t = t.replace("$$", "").replace("$", "")
    t = MATRIX_ENV_RE.sub(lambda m: "x" * matrix_render_len(m.group(2)), t)
    t = TEXTCMD_RE.sub(lambda m: m.group(1), t)
    t = NAMED_FUNCTIONS_RE.sub(lambda m: "x" * len(m.group(1)), t)
    t = WEIGHTED_CMD_RE.sub(lambda m: "x" * RENDER_WEIGHT_CMDS[m.group(1)], t)
    t = LATEX_CMD_RE.sub("", t)
    t = re.sub(r"[{}^_&]|\\\\|\\[,;!:]", "", t)
    t = re.sub(r"\s+", " ", t).strip()
    return len(t)


def strip_math(s: str) -> str:
    """Texto con las zonas matemáticas ($...$ y $$...$$) removidas."""
    return INLINE_RE.sub(" ", DISPLAY_RE.sub(" ", s))


def paragraphs(s: str) -> list[str]:
    return [p for p in s.split("\n\n") if p.strip()]


def prose_segments(p: str) -> list[str]:
    r"""Tramos de prosa de un párrafo, separados por las fórmulas centradas.

    Una fórmula `$$...$$` es un corte de lectura: KaTeX displayMode le agrega
    margen vertical, así que el ojo ve bloques separados. Como el formato
    obliga a un solo `\n` junto a `$$` (nunca `\n\n`), sin este corte la prosa
    de antes y la de después se medirían como un único párrafo, y el remedio
    que la regla 21 propone ("sacá la fórmula central a un bloque `$$...$$`")
    nunca bajaría el conteo.
    """
    return [s for s in DISPLAY_RE.split(p) if s.strip()]


def word_count(s: str) -> int:
    return len([w for w in re.split(r"\s+", s.strip()) if w])


# --- Motor de hallazgos -------------------------------------------------------

class Findings:
    def __init__(self) -> None:
        self.rows: list[dict] = []

    def add(self, level: str, check: str, rule: str, file: str, item: str, msg: str) -> None:
        self.rows.append({
            "level": level, "check": check, "rule": rule,
            "file": file, "item": item, "message": msg,
        })

    def errors(self) -> int:
        return sum(1 for r in self.rows if r["level"] == "ERROR")

    def warnings(self) -> int:
        return sum(1 for r in self.rows if r["level"] == "WARNING")


# --- Checks por familia -------------------------------------------------------

_FRACCION_RE = re.compile(
    r"^\$\s*(?:\\[dt]?frac\{\s*(\d+)\s*\}\{\s*(\d+)\s*\}|(\d+)\s*/\s*(\d+))\s*\$$"
)


def _valor_fraccion(opt: str) -> Fraction | None:
    """Valor de una opción que es una fracción sola, en cualquiera de las dos
    notaciones que usa el corpus. Devuelve None si la opción es otra cosa."""
    m = _FRACCION_RE.match(opt.strip())
    if not m:
        return None
    num, den = (m.group(1), m.group(2)) if m.group(1) else (m.group(3), m.group(4))
    if int(den) == 0:
        return None
    return Fraction(int(num), int(den))


_ASIGNACION_RE = re.compile(r"([A-Za-z](?:_\{?[0-9]+\}?)?)\s*=\s*(-?[0-9]+(?:[.,][0-9]+)?)")


def _conjunto_misma_variable(opt: str):
    """Firma de una opción que enumera soluciones de una sola variable.

    Devuelve `(variable, valores ordenados, texto restante)` cuando la opción
    tiene dos o más asignaciones y todas son de la misma variable; None en
    cualquier otro caso. El texto restante se conserva casi entero a propósito
    (solo se le sacan los delimitadores de LaTeX y los espacios) para que una
    anotación que distinga las dos opciones —una multiplicidad, un conector
    "y"/"o"— impida el match.
    """
    # El corpus escribe los decimales como `0{,}5`, con la coma entre llaves para
    # que KaTeX no le meta espacio. Sin normalizar eso, la llave corta el número
    # al medio y la opción parece no tener asignaciones.
    opt = opt.replace("{,}", ",").replace("{.}", ".")
    pares = _ASIGNACION_RE.findall(opt)
    if len(pares) < 2:
        return None
    variables = {v for v, _ in pares}
    if len(variables) != 1:
        return None
    resto = _ASIGNACION_RE.sub("", opt)
    resto = re.sub(r"[$\\{}\s,]+", "", resto)
    valores = tuple(sorted(Fraction(n.replace(",", ".")) for _, n in pares))
    return (variables.pop(), valores, resto)


def check_options(items, file, F: Findings) -> None:
    for idx, it in enumerate(items):
        opts = it.get("options") or []
        ci = it.get("correct_index")
        label = f"#{idx}"
        if not isinstance(ci, int) or not (0 <= ci < len(opts)):
            continue  # structure lo reporta
        if len(opts) < 2:
            continue

        # Regla 79: dos opciones que valen lo mismo son dos respuestas correctas.
        # Pasa cuando una es la versión simplificada de la otra ($1/6$ conviviendo
        # con $6/36$), que es fácil de escribir sin darse cuenta. Caso real:
        # blue/laplace/RESL, donde además la correcta alternaba entre las dos
        # formas de un ejercicio a otro.
        #
        # Solo se aplica cuando LAS CUATRO opciones son fracciones de enteros: ahí
        # la pregunta es por un número y dos iguales son dos correctas. Si alguna
        # opción trae radicales o variables, la pregunta es por la forma y la
        # equivalencia numérica puede ser deliberada — en `radicals/FORM` las
        # opciones son todas versiones de 1 y elegir cuál racionaliza ES el ítem.
        valores = [_valor_fraccion(o) for o in opts]
        if all(v is not None for v in valores):
            por_valor: dict[Fraction, int] = {}
            for i, v in enumerate(valores):
                if v in por_valor:
                    F.add("ERROR", "options", "77", file, label,
                          f"opciones equivalentes: {opts[por_valor[v]]!r} y "
                          f"{opts[i]!r} valen lo mismo")
                else:
                    por_valor[v] = i

        # Regla 79, segunda forma: una opción que enumera varias soluciones de la
        # MISMA variable denota un conjunto, y en un conjunto el orden no
        # significa nada. "$x = 6$ y $x = -2$" y "$x = -2$ y $x = 6$" son la
        # misma respuesta escrita distinto. Caso real: white_quadratic_FORM_14,
        # que medía 12 % de acierto con 37 % de intentos agotados porque la mitad
        # de la gente elegía la versión marcada como error.
        #
        # El chequeo de fracciones de arriba no lo agarra: estas opciones no son
        # fracciones sueltas. Y hay que ser estricto para no marcar distractores
        # legítimos, que son la mayoría de los casos parecidos en el banco:
        #
        #   - Si las asignaciones son de variables DISTINTAS, la posición sí
        #     significa: "$n=25$, $p=0{,}04$" contra "$n=0{,}04$, $p=25$" es
        #     exactamente la confusión que el ítem quiere provocar.
        #   - Si queda texto que las distinga, tampoco son iguales: "$x = 2$
        #     (doble) y $x = -1$ (simple)" contra la misma pareja con las
        #     multiplicidades cambiadas son dos respuestas distintas, y
        #     "$2x+1=9$ **o** ..." contra "$2x+1=9$ **y** ..." difieren en el
        #     conector, que es justo lo que se evalúa.
        conjuntos = [_conjunto_misma_variable(o) for o in opts]
        vistos: dict[tuple, int] = {}
        for i, c in enumerate(conjuntos):
            if c is None:
                continue
            if c in vistos:
                F.add("ERROR", "options", "79", file, label,
                      f"opciones equivalentes: {opts[vistos[c]]!r} y {opts[i]!r} "
                      f"enumeran las mismas soluciones de la misma variable, y "
                      f"el orden en un conjunto no significa nada")
            else:
                vistos[c] = i

        raws = [len(o) for o in opts]
        rends = [render_len(o) for o in opts]
        d_raw = [v for i, v in enumerate(raws) if i != ci]
        d_rend = [v for i, v in enumerate(rends) if i != ci]
        med_raw, med_rend = median(d_raw), median(d_rend)

        # Correcta única más larga, en ambas métricas.
        if (raws[ci] > max(d_raw) and rends[ci] > max(d_rend)
                and med_raw > 0 and med_rend > 0
                and raws[ci] > LONGEST_RATIO * med_raw
                and rends[ci] > LONGEST_RATIO * med_rend
                and rends[ci] - max(d_rend) >= MIN_ABS_GAP):
            F.add("WARNING", "options", "4", file, label,
                  f"la correcta es la única notablemente más larga "
                  f"(render {rends[ci]} vs mediana {med_rend:.0f}): {opts[ci]!r}")

        # Correcta única más corta, en ambas métricas.
        if (raws[ci] < min(d_raw) and rends[ci] < min(d_rend)
                and raws[ci] < SHORTEST_RATIO * med_raw
                and rends[ci] < SHORTEST_RATIO * med_rend
                and med_rend - rends[ci] >= MIN_ABS_GAP):
            F.add("WARNING", "options", "15", file, label,
                  f"la correcta es la única notablemente más corta "
                  f"(render {rends[ci]} vs mediana {med_rend:.0f}): {opts[ci]!r}")

        # Regla 39: ancho absoluto de opciones que son una fórmula LaTeX pura
        # (grilla 2x2 / lectura compacta ≤35 chars de render). No aplica a
        # opciones de prosa conceptual, que legítimamente son más largas.
        for j, o in enumerate(opts):
            if not PURE_FORMULA_OPTION_RE.fullmatch(o.strip()):
                continue
            rl_opt = render_len(o)
            if rl_opt > OPTION_RENDER_MAX:
                F.add("WARNING", "options", "39", file, label,
                      f"opción #{j} de {rl_opt} chars de render (máx {OPTION_RENDER_MAX} para una fórmula pura): {o!r}")

        # Regla 42: combinatoria (\binom/\dbinom) en ambos lados de una
        # fracción dentro de una opción. Apilada con \dfrac queda una caja
        # muy alta que domina la grilla 2x2; conviene notación horizontal
        # (ej. "$\binom{5}{3}/\binom{8}{3}$").
        for j, o in enumerate(opts):
            for m in FRAC_RE.finditer(o):
                num, den = m.group(1), m.group(2)
                if "binom" in num and "binom" in den:
                    F.add("WARNING", "options", "42", file, label,
                          f"opción #{j} con combinatoria en ambos lados de una fracción apilada, "
                          f"usar notación horizontal: {o!r}")

        # Glosa entre paréntesis fuera de zona math, en una sola opción.
        has_paren = [("(" in strip_math(o)) for o in opts]
        if sum(has_paren) == 1:
            which = has_paren.index(True)
            role = "la correcta" if which == ci else f"un distractor (#{which})"
            F.add("WARNING", "options", "4", file, label,
                  f"paréntesis aclaratorio solo en {role}: {opts[which]!r}")

        # Relleno "solamente" asimétrico.
        has_only = ["solamente" in o.lower() for o in opts]
        if 0 < sum(has_only) < len(opts):
            F.add("WARNING", "options", "4/15", file, label,
                  "relleno 'solamente' en algunas opciones y no en todas")

        # Regla 45: opción con pinta de texto truncado (termina en preposición,
        # artículo o conjunción, sin punto final). No aplica a opciones que son
        # puramente una fórmula LaTeX (ahí la "última palabra" no es prosa).
        for j, o in enumerate(opts):
            stripped = o.strip()
            if not stripped or PURE_FORMULA_OPTION_RE.fullmatch(stripped):
                continue
            if stripped.endswith((".", "?", "!", "$")):
                continue
            tokens = stripped.split()
            if len(tokens) < 2:
                continue  # opción de una sola palabra: "No"/"Una" pueden ser respuestas completas
            last_tok = tokens[-1]
            # Solo dispara si el último token es puramente alfabético: un token
            # como "20", "\$300" o "64" después de una preposición ("al 20",
            # "de \$300") es una opción completa, no truncada.
            if not re.fullmatch(r"[A-Za-zÁÉÍÓÚÑáéíóúñ]+", last_tok):
                continue
            if last_tok.lower() in TRUNCATION_STOPWORDS:
                F.add("WARNING", "options", "45", file, label,
                      f"opción #{j} termina en {last_tok!r}, pinta de texto truncado a mitad de frase: {o!r}")


ALIGNED_ENV_RE = re.compile(r"\\(begin|end)\{(aligned|cases)\}")


def _display_rows(inner: str) -> list[str]:
    """Parte un bloque display en las filas que efectivamente se ven en
    pantalla: con `aligned`/`cases`, una fila por salto `\\`; si no, el
    bloque entero es la única fila."""
    if "aligned" in inner or "cases" in inner:
        stripped = ALIGNED_ENV_RE.sub("", inner)
        return [r for r in stripped.split("\\\\") if r.strip()]
    return [inner]


def _check_display_width(text, field, file, label, F: Findings) -> None:
    """Regla 38: cada fila visible de un bloque display (con o sin
    `aligned`/`cases`) que queda demasiado ancha se marca para partir o
    acortar, y un bloque sin `aligned` nunca encadena 3+ igualdades en una
    sola línea.

    Antes, cualquier bloque con `aligned`/`cases` se saltaba entero (líneas
    353-354 de versiones previas): nunca medía la fila de planteo que junta
    la integral original y su desarrollo completo por linealidad en un solo
    renglón, que es exactamente el patrón que desborda en `integrales`. Ahora
    mide cada fila por separado con el mismo umbral."""
    for m in DISPLAY_RE.finditer(text):
        inner = m.group(0)[2:-2]
        has_env = "aligned" in inner or "cases" in inner
        for row in _display_rows(inner):
            rl = render_len(row)
            if rl > DISPLAY_RENDER_MAX:
                where = "fila de un aligned/cases" if has_env else "bloque display sin aligned"
                F.add("WARNING", field, "38", file, label,
                      f"{where} de {rl} chars, conviene partir en un paso más o acortar: {row.strip()[:50]!r}...")
        if has_env:
            continue
        if inner.count("=") >= 3:
            F.add("WARNING", field, "38", file, label,
                  "bloque display con 3+ igualdades encadenadas en una sola línea, "
                  "partir en pasos (varios $$...$$) o usar aligned")
        # Regla 41: cadena de 3+ factores P(...) multiplicados por \cdot, sin
        # "+" ni fracción ni sumatoria, ej. P(C_1)\cdot P(C_2)\cdot P(C_3).
        # No es un problema de ancho (puede medir bien por debajo de
        # DISPLAY_RENDER_MAX) sino de lectura: la cadena de multiplicaciones
        # se lee mejor verticalizada. Requiere \cdot explícito para no
        # confundirse con una fracción simple tipo P(A\mid B)=P(A\cap B)/P(B),
        # que también menciona 3 "P(" pero no es una cadena de factores.
        #
        # Dos acotaciones de la ronda de algebra (ago-2026), que quitaron 3
        # falsos positivos sin perder ninguna detección real en los tres
        # cursos: (a) los \cdot se cuentan **por lado de la igualdad**, porque
        # "\sqrt{ab}=\sqrt{a}\cdot\sqrt{b}" tiene dos factores por lado y se
        # leía como una cadena de tres; (b) los factores tienen que ser
        # expresiones aplicadas del tipo "P(...)", que es lo que la regla dice
        # y lo que justifica verticalizar — "a^5 = a\cdot a\cdot a\cdot a\cdot a"
        # es una cadena de cinco factores que se lee perfecto en una línea.
        sides = inner.split("=")
        cdot_count = max(s.count("\\cdot") for s in sides)
        factores_aplicados = max(s.count("(") for s in sides) >= CHAIN_FACTORS_MIN
        if (cdot_count >= CHAIN_FACTORS_MIN - 1 and factores_aplicados
                and "+" not in inner
                and "\\sum" not in inner and "frac" not in inner):
            F.add("WARNING", field, "41", file, label,
                  f"cadena de {cdot_count + 1} factores P(...) multiplicados "
                  "en una sola línea, conviene verticalizar (varios $$...$$) o usar aligned")


def _check_missing_sumatoria(text, field, file, label, F: Findings) -> None:
    """Regla 40: la fórmula abstracta de una partición (probabilidad total o
    Bayes) que suma 2+ ramas nombradas/subindicadas explícitamente (ej.
    P(B\\mid A_1)P(A_1) + P(B\\mid A_2)P(A_2)) debería usar notación de
    sumatoria (\\sum_i), sin importar cuántos escenarios tenga el problema
    concreto. Solo aplica a `explanation`: en `options`, comparar variantes
    con nombres es a menudo el punto del ejercicio (identificar la fórmula
    correcta entre términos cruzados/invertidos)."""
    if field != "explanations":
        return
    if "\\sum" in text or "+" not in text:
        return
    if len(PARTITION_TERM_RE.findall(text)) >= 2:
        F.add("WARNING", field, "40", file, label,
              "fórmula de partición con ramas nombradas sumadas explícitamente, "
              "considerar notación de sumatoria (\\sum_i) en vez de nombrarlas todas")


def _check_duplicate_formula(text, field, file, label, F: Findings) -> None:
    """Regla 35: una fórmula no trivial no debería tejerse inline y repetirse
    también en un bloque display dentro del mismo campo (redundancia)."""
    displays = [re.sub(r"\s+", "", m.group(0)[2:-2]) for m in DISPLAY_RE.finditer(text)]
    if not displays:
        return
    for m in INLINE_RE.finditer(text):
        frag_norm = re.sub(r"\s+", "", m.group(1))
        if len(frag_norm) < 8:
            continue  # evita falsos positivos con fragmentos triviales como "P(A)"
        if any(frag_norm in d for d in displays):
            F.add("WARNING", field, "35", file, label,
                  f"la fórmula ${m.group(1)[:40]}$ aparece tejida inline y repetida en un bloque display")
            break


def _check_prose_parens(text, field, file, label, F: Findings, level: str = "WARNING") -> None:
    """Regla 37: sin paréntesis aclaratorios en la prosa (fuera de zona
    matemática). ERROR en question (regla dura authoring-context.md:419),
    WARNING en explanation/feedbacks (extensión de los topic-contexts)."""
    if "(" in strip_math(text):
        F.add(level, field, "37", file, label,
              "paréntesis aclaratorio en la prosa, fuera de zona matemática")


def _check_inline_equation(text, field, file, label, F: Findings) -> None:
    """Regla 35: ecuación con `=` tejida inline que ya es lo bastante ancha
    como para merecer un bloque display propio."""
    for m in INLINE_RE.finditer(text):
        frag = m.group(1)
        if "=" not in frag:
            continue
        rl = render_len(frag)
        if rl > INLINE_EQUATION_MAX:
            F.add("WARNING", field, "35", file, label,
                  f"ecuación tejida inline (render {rl} > {INLINE_EQUATION_MAX}), "
                  f"mover a bloque display: ${frag[:40]}$")


def _check_text_common(text, field, file, label, F: Findings) -> None:
    """Checks compartidos entre explanation / question / feedbacks."""
    if "\n\n$$" in text or "$$\n\n" in text:
        F.add("ERROR", field, "2", file, label, r"\n\n pegado a un bloque $$...$$")
    if ORPHAN_PERIOD_RE.search(text):
        F.add("ERROR", field, "44", file, label,
              r"punto suelto en su propia línea, resto de una oración cortada por un bloque $$ movido sin recomponer la prosa")
    _check_display_width(text, field, file, label, F)
    _check_duplicate_formula(text, field, file, label, F)
    _check_missing_sumatoria(text, field, file, label, F)
    if field != "feedbacks":
        # feedback_correct/incorrect son por diseño una sola oración corta e
        # inline (nunca llevan bloques $$...$$ propios); su ancho ya lo cubre
        # el chequeo específico de "3+ igualdades" en check_feedbacks.
        _check_inline_equation(text, field, file, label, F)
    if EMDASH in text:
        F.add("ERROR", field, "6", file, label, "em-dash (—) en el texto")
    if ENDASH in text and not re.search(r"\d" + ENDASH + r"\d", text):
        F.add("ERROR", field, "6", file, label, "en-dash (–) fuera de un rango numérico")
    for c in CHECKMARKS:
        if c in text:
            F.add("ERROR", field, "14", file, label, f"símbolo {c!r} prohibido")
    if re.search(r"(?<!\$)\$\\begin\{aligned\}", text):
        F.add("ERROR", field, "17b", file, label,
              r"\begin{aligned} envuelto en $ simple (debe ser $$)")
    if "\\begin{aligned}" in text and "\\\\\\\\" in text:
        F.add("ERROR", field, "17b", file, label,
              r"\\\\ duplicado dentro de un aligned")
    for m in TEXTCMD_RE.finditer(text):
        content = m.group(1)
        wc = word_count(content)
        if "(" in content or ")" in content or wc > 4:
            F.add("ERROR", field, "26", file, label,
                  f"\\text{{}} con cláusula larga o paréntesis: {content!r}")
        elif wc >= 3:
            F.add("WARNING", field, "26", file, label,
                  f"\\text{{}} de {wc} palabras, preferible moverlo a la prosa: {content!r}")
    # 0/0 apilada en zona inline.
    for m in INLINE_RE.finditer(text):
        if re.search(r"\\[dt]?frac\{0\}\{0\}", m.group(1)):
            F.add("ERROR", field, "28", file, label,
                  "fracción 0/0 apilada tejida inline en prosa")
            break


def _check_display_flow(text, field, file, label, F: Findings) -> None:
    """Regla 9/10/32: cierre antes de $$ y mayúscula después."""
    lines = text.split("\n")
    for i, line in enumerate(lines):
        nxt = lines[i + 1].strip() if i + 1 < len(lines) else ""
        cur = line.strip()
        if nxt.startswith("$$") and cur and not cur.startswith("$$"):
            if not cur.endswith((".", ":", "?", "!")):
                F.add("ERROR", field, "9/32", file, label,
                      f"la línea previa a un bloque $$ no cierra en puntuación: {cur[:60]!r}")
        if cur.endswith("$$") and nxt and not nxt.startswith("$$"):
            first = nxt[0]
            if first.isalpha() and first.islower():
                F.add("ERROR", field, "10", file, label,
                      f"texto tras un bloque $$ arranca en minúscula: {nxt[:60]!r}")
            elif first in "¿¡" and len(nxt) > 1 and nxt[1].isalpha() and nxt[1].islower():
                F.add("ERROR", field, "10", file, label,
                      f"pregunta/exclamación tras un bloque $$ arranca en minúscula "
                      f"después de {first!r}: {nxt[:60]!r}")


def check_explanations(items, file, F: Findings) -> None:
    for idx, it in enumerate(items):
        text = it.get("explanation")
        label = f"#{idx}"
        if not isinstance(text, str) or not text.strip():
            F.add("ERROR", "explanations", "-", file, label, "explanation ausente o vacía")
            continue
        if len(text) < EXPLANATION_MIN:
            F.add("ERROR", "explanations", "-", file, label,
                  f"explanation de {len(text)} chars (mínimo {EXPLANATION_MIN})")
        _check_text_common(text, "explanations", file, label, F)
        _check_display_flow(text, "explanations", file, label, F)
        _check_prose_parens(text, "explanations", file, label, F, level="WARNING")
        for m in INLINE_RE.finditer(text):
            if re.search(r"\\[dt]?frac", m.group(1)):
                F.add("WARNING", "explanations", "18", file, label,
                      f"fracción tejida inline en la explicación: ${m.group(1)[:40]}$")
                break
        paras = paragraphs(text)
        for p in paras:
            stripped = p.rstrip()
            if not stripped.endswith((".", ":", "?", "!", "$")):
                F.add("ERROR", "explanations", "17", file, label,
                      f"párrafo sin puntuación terminal: ...{stripped[-40:]!r}")
            # El largo de prosa y la densidad de inline se miden por tramo
            # entre fórmulas centradas, no sobre el párrafo entero (ver
            # prose_segments).
            for prose in prose_segments(p):
                prose_flat = re.sub(r"\s+", " ", prose).strip()
                if len(prose_flat) > PARAGRAPH_PROSE_MAX:
                    F.add("WARNING", "explanations", "párrafos", file, label,
                          f"tramo de prosa de {len(prose_flat)} chars (máx {PARAGRAPH_PROSE_MAX}): "
                          f"{prose_flat[:60]!r}...")
                inline_count = len(INLINE_RE.findall(prose))
                if inline_count >= INLINE_FRAGMENTS_WARN:
                    F.add("WARNING", "explanations", "21", file, label,
                          f"{inline_count} fragmentos LaTeX inline en el mismo tramo de prosa")
        if paras:
            last = re.sub(r"^\*\*([^*]+)\*\*", r"\1", paras[-1].strip())
            if DIAGNOSTIC_CLOSE_RE.search(last):
                F.add("WARNING", "explanations", "34", file, label,
                      f"cierre anunciado como advertencia de diagnóstico: {last[:70]!r}...")
            elif FILLER_CLOSE_RE.match(last):
                F.add("WARNING", "explanations", "34", file, label,
                      f"cierre con filler genérico 'Es fácil/tentador' (no es una de las 4 familias permitidas): {last[:70]!r}...")
            elif MARKER_CLOSE_RE.match(last):
                F.add("WARNING", "explanations", "34", file, label,
                      f"cierre con marcador breve tipo 'Ojo/Cuidado/Atención' (prohibido explícito): {last[:70]!r}...")
            elif CONTRAST_CLOSE_RE.match(last):
                F.add("WARNING", "explanations", "34", file, label,
                      f"cierre por comparación/contraste 'A diferencia de...' (prohibido explícito): {last[:70]!r}...")


def check_questions(items, file, F: Findings) -> None:
    openers: Counter[str] = Counter()
    for idx, it in enumerate(items):
        text = it.get("question")
        label = f"#{idx}"
        if not isinstance(text, str) or not text.strip():
            F.add("ERROR", "questions", "-", file, label, "question ausente o vacía")
            continue
        _check_text_common(text, "questions", file, label, F)
        _check_display_flow(text, "questions", file, label, F)
        _check_prose_parens(text, "questions", file, label, F, level="ERROR")
        lines = text.split("\n")
        if len(lines) > 1 and lines[1].strip().startswith("$$"):
            openers[lines[0].strip()] += 1
        # Fórmula central tejida inline (regla 18).
        for m in INLINE_RE.finditer(text):
            if re.search(r"\\[dt]?frac", m.group(1)):
                F.add("WARNING", "questions", "18", file, label,
                      f"fracción tejida inline en el enunciado: ${m.group(1)[:40]}$")
                break
        # Reglas 47-51: filosofía pedagógica del enunciado.
        stripped = text.lstrip()
        if stripped.startswith("$$"):
            F.add("WARNING", "questions", "47", file, label,
                  "el enunciado arranca directo con un bloque $$ sin ninguna apertura")
        elif stripped.startswith("¿"):
            F.add("WARNING", "questions", "47", file, label,
                  "el enunciado arranca directo con '¿' sin ninguna oración de apertura")
        if DANGLING_QMARK_RE.search(text):
            F.add("WARNING", "questions", "47", file, label,
                  "la pregunta envuelve al bloque display y el '?' queda colgado tras el $$")
        m_imp = CALC_IMP_VOSEO_RE.search(text) or CALC_IMP_TUTEO_RE.search(text)
        if m_imp:
            F.add("WARNING", "questions", "48", file, label,
                  f"imperativo de cálculo en el enunciado (la consigna se formula como "
                  f"pregunta, no como orden): {m_imp.group(0).strip()!r}")
        m_attn = ATTN_IMPERATIVE_RE.match(stripped)
        if m_attn:
            F.add("WARNING", "questions", "49", file, label,
                  f"imperativo de atención vacío como apertura: {m_attn.group(0)!r}")
        low = text.lower()
        for term in JARGON_TERMS:
            # \b en ambos extremos: sin esto "ILATE" matchea dentro de
            # "bilateral". El sufijo s? admite el plural ("primitivas").
            t_re = r"\b" + re.escape(term.lower()) + r"s?\b"
            m_term = re.search(t_re, low)
            if m_term and not re.search(t_re + r"\s*[,:]", low):
                F.add("WARNING", "questions", "50", file, label,
                      f"término técnico sin glosa en el enunciado: {term!r} "
                      f"(evitarlo, glosarlo, o es un LEXI de ese vocabulario)")
        if "?" not in text:
            F.add("WARNING", "questions", "51", file, label,
                  "enunciado sin ninguna pregunta (orden pura); todo question "
                  "contiene al menos un ¿...?")
        # Regla 36: largo de párrafo/densidad inline en el enunciado, y la
        # pregunta "¿...?" mezclada dentro del párrafo del enunciado en vez
        # de ir en su propio párrafo final.
        for p in paragraphs(text):
            # Ojo: se mide por tramo de prosa (separado por bloques $$...$$),
            # no por párrafo entero. Un párrafo de "intro: $$fórmula$$
            # ¿pregunta?" es el patrón correcto (la fórmula ya corta la
            # lectura); lo que viola la regla es "¿" apareciendo a mitad de
            # un tramo de prosa continuo, sin ningún corte antes.
            for prose in prose_segments(p):
                prose_stripped = prose.strip()
                if "¿" in prose_stripped and not prose_stripped.startswith("¿"):
                    F.add("WARNING", "questions", "36", file, label,
                          f"la pregunta '¿...?' está mezclada con el enunciado en el mismo tramo de prosa: "
                          f"{prose_stripped[:60]!r}...")
            for prose in prose_segments(p):
                prose_flat = re.sub(r"\s+", " ", prose).strip()
                if len(prose_flat) > QUESTION_PROSE_MAX:
                    F.add("WARNING", "questions", "36", file, label,
                          f"párrafo del enunciado de {len(prose_flat)} chars (máx {QUESTION_PROSE_MAX}): "
                          f"{prose_flat[:60]!r}...")
                inline_count = len(INLINE_RE.findall(prose))
                if inline_count >= INLINE_FRAGMENTS_WARN:
                    F.add("WARNING", "questions", "21", file, label,
                          f"{inline_count} fragmentos LaTeX inline en el mismo tramo del enunciado")
    total = len(items)
    threshold = max(OPENER_REPEAT_MIN, int(total * OPENER_REPEAT_FRACTION))
    for opener, count in openers.items():
        if count >= threshold:
            F.add("WARNING", "questions", "32", file, "ALL",
                  f"misma apertura en {count}/{total} ítems (plantilla repetida): {opener[:60]!r}")


def check_feedbacks(items, file, F: Findings) -> None:
    for idx, it in enumerate(items):
        label = f"#{idx}"
        opts = it.get("options") or []
        ci = it.get("correct_index")
        fc = it.get("feedback_correct")
        if isinstance(fc, str) and fc.strip():
            _check_text_common(fc, "feedbacks", file, label, F)
            _check_prose_parens(fc, "feedbacks", file, label, F, level="WARNING")
            if not fc.rstrip().endswith((".", "?", "!", "$")):
                F.add("ERROR", "feedbacks", "17", file, label,
                      "feedback_correct sin puntuación terminal")
            if len(fc) > FEEDBACK_CORRECT_MAX:
                F.add("WARNING", "feedbacks", "-", file, label,
                      f"feedback_correct de {len(fc)} chars (ideal 1 oración corta)")
            if fc.count("=") >= 3:
                F.add("WARNING", "feedbacks", "fórmulas anchas", file, label,
                      "feedback_correct con 3+ igualdades, mover la derivación a explanation")
        fi = it.get("feedback_incorrect")
        if not isinstance(fi, list):
            F.add("ERROR", "feedbacks", "-", file, label, "feedback_incorrect ausente o no-lista")
            continue
        if len(fi) != len(opts):
            F.add("ERROR", "feedbacks", "-", file, label,
                  f"feedback_incorrect de largo {len(fi)} vs {len(opts)} opciones")
            continue
        for j, entry in enumerate(fi):
            if j == ci:
                if entry is not None:
                    F.add("ERROR", "feedbacks", "-", file, label,
                          "feedback_incorrect no es null en el índice correcto")
                continue
            if not isinstance(entry, str) or not entry.strip():
                F.add("ERROR", "feedbacks", "-", file, label,
                      f"feedback_incorrect[{j}] vacío o null fuera del índice correcto")
                continue
            _check_text_common(entry, "feedbacks", file, label, F)
            _check_prose_parens(entry, "feedbacks", file, label, F, level="WARNING")
            if not entry.rstrip().endswith((".", "?", "!", "$")):
                F.add("ERROR", "feedbacks", "17", file, label,
                      f"feedback_incorrect[{j}] sin puntuación terminal")
            first_words = entry.strip()
            for start in ACCUSATORY_STARTS:
                if first_words.startswith(start + " ") or first_words == start:
                    F.add("WARNING", "feedbacks", "anti-acusación", file, label,
                          f"feedback_incorrect[{j}] arranca acusatorio: {entry[:50]!r}")
                    break


# --- Structure: tags contra la tabla del topic-context ------------------------

SLUG_CELL_RE = re.compile(r"`([a-z0-9]+(?:-[a-z0-9]+)*)`")
# Encabezado de la seccion de un skill dentro del topic-context. Los docs usan
# varias formas: "**LEXI (30):**", "**LEXI** (30 ejercicios):", "## LEXI, 30
# ejercicios", "**CLSF** (archivado...)".
SKILL_SECTION_RE = re.compile(
    r"(?:\*\*\s*|^#{1,6}\s+`?)(LEXI|CLSF|FORM|GRAF|ESTR|RESL)\b")
# Sub-familias declaradas en prosa en vez de con una fila de tabla. Hay dos
# redacciones en uso en los docs:
#   "*Tipo B — ... (6 ejercicios):* slug único `formula-desde-grafico-trig`."
#   "*Tipo B — ... (9):* todos bajo `grafico-a-formula` (...)"
INLINE_SUBFAMILY_RES = (
    re.compile(r"\((\d+)\s+ejercicios[^`]*slug\s+único\s+`([a-z0-9]+(?:-[a-z0-9]+)*)`"),
    re.compile(r"\((\d+)\)\s*:\**\s*todos bajo\s+`([a-z0-9]+(?:-[a-z0-9]+)*)`"),
)


def _add(targets: dict[str, int], por_skill: dict[str, dict[str, int]],
         seccion: str | None, slug: str, count: int) -> None:
    """Suma un objetivo a la unión del topic y, si se conoce, al skill."""
    targets[slug] = targets.get(slug, 0) + count
    if seccion:
        d = por_skill.setdefault(seccion, {})
        d[slug] = d.get(slug, 0) + count


def parse_distribution(topic_context: Path) -> tuple[dict[str, dict[str, int]], dict[str, int]]:
    """Extrae los objetivos de distribución del topic-context.

    Devuelve `(por_skill, union)`:

    - `por_skill[SKILL][slug]` es el objetivo de esa sub-familia **en ese
      skill**. Es contra esto que se compara cada archivo.
    - `union[slug]` junta todos los slugs válidos del topic, y sirve solo para
      decidir si un tag es conocido.

    Antes se devolvía una sola tabla con los conteos **sumados entre skills**,
    y cada archivo se comparaba contra ese total. Cuando una sub-familia vive
    en dos skills (ej. `propiedades-algebraicas-potencias`, 2 en LEXI y 6 en
    FORM de `exponential`), el objetivo quedaba en 8 y los dos archivos
    reportaban desvío estando ambos exactos. Ese solo bug generaba la mayoría
    de los ~196 warnings de tags de agosto 2026.
    """
    por_skill: dict[str, dict[str, int]] = {}
    targets: dict[str, int] = {}
    if not topic_context.exists():
        return por_skill, targets
    text = topic_context.read_text(encoding="utf-8")

    # Parse tablas markdown.
    # Las secciones de un skill archivado (ej. "**CLSF** (archivado, no se
    # recorta)") se saltean: la tabla queda en el doc como registro historico
    # pero sus sub-familias no son objetivo de generacion, y contarlas hacia
    # los targets inventa huecos que nadie va a llenar. Detectado en ago-2026,
    # donde `white/functions` reportaba ~270 ejercicios faltantes que en
    # realidad eran las tablas de CLSF, un skill podado del curso en jul-2026.
    skip_section = False
    seccion: str | None = None
    for line in text.splitlines():
        m_head = SKILL_SECTION_RE.search(line)
        if m_head:
            skip_section = "archivad" in line.lower()
            seccion = None if skip_section else m_head.group(1)
        if skip_section:
            continue
        if not line.strip().startswith("|"):
            continue
        cells = [c.strip() for c in line.strip().strip("|").split("|")]
        slug = None
        count = None
        for c in cells:
            m = SLUG_CELL_RE.fullmatch(c)
            if m:
                slug = m.group(1)
        # la celda de cantidad es la última numérica de la fila (puede tener ~ al inicio)
        for c in reversed(cells):
            m = re.fullmatch(r"~?(\d+)", c)
            if m:
                count = int(m.group(1))
                break
        if slug and count is not None:
            _add(targets, por_skill, seccion, slug, count)

    # Parse menciones inline: "(NN ejercicios):* ... slug único `slug`".
    # Va dentro del mismo recorrido por líneas, no en una pasada aparte, para
    # que la sub-familia quede atribuida a su skill. Algunas sub-familias se
    # declaran así en vez de con una fila de tabla (ej. los "Tipo B/Tipo C" de
    # los GRAF de `functions`); cuando esta parte no registraba el skill, esos
    # slugs no entraban en el diccionario de su skill y sus ítems no se
    # comparaban contra nada: pasaban en silencio.
    for line in text.splitlines():
        h = SKILL_SECTION_RE.search(line)
        if h:
            skip_section = "archivad" in line.lower()
            seccion = None if skip_section else h.group(1)
        if skip_section:
            continue
        for rx in INLINE_SUBFAMILY_RES:
            for m in rx.finditer(line):
                count = int(m.group(1))
                if count:
                    _add(targets, por_skill, seccion, m.group(2), count)

    return por_skill, targets


def check_structure(items, file, F: Findings, targets: dict[str, int],
                    known: dict[str, int] | None = None) -> None:
    """`targets` son los objetivos del skill de este archivo; `known` es la
    unión de slugs válidos del topic, que se usa solo para decidir si un tag
    existe en la spec."""
    known = known if known is not None else targets
    ci_counter: Counter[int] = Counter()
    tag_counter: Counter[str] = Counter()
    for idx, it in enumerate(items):
        label = f"#{idx}"
        opts = it.get("options") or []
        ci = it.get("correct_index")
        if len(opts) not in (2, 3, 4):
            F.add("ERROR", "structure", "cardinalidad", file, label,
                  f"{len(opts)} opciones (esperado 2-4)")
        if not isinstance(ci, int) or not (0 <= ci < len(opts)):
            F.add("ERROR", "structure", "-", file, label,
                  f"correct_index inválido: {ci!r}")
        else:
            ci_counter[ci] += 1
        tags = it.get("tags")
        if known:
            if not isinstance(tags, list) or not tags:
                F.add("ERROR", "structure", "tags", file, label,
                      "sin campo tags (la tabla de distribución del topic lo exige)")
            else:
                for t in tags:
                    if t not in known:
                        F.add("ERROR", "structure", "tags", file, label,
                              f"slug desconocido {t!r} (no está en la tabla del topic-context)")
                    else:
                        tag_counter[t] += 1
    total = sum(ci_counter.values())
    if total >= 6:
        top_idx, top_count = ci_counter.most_common(1)[0]
        if top_count / total > CORRECT_INDEX_SKEW:
            F.add("ERROR", "structure", "correct_index", file, "ALL",
                  f"{top_count}/{total} ítems con correct_index={top_idx} (máx 50%)")
    for slug, count in tag_counter.items():
        if targets.get(slug) is not None and count != targets[slug]:
            F.add("WARNING", "structure", "tags", file, "ALL",
                  f"slug {slug!r}: {count} ítems vs {targets[slug]} de la tabla "
                  "(esperable durante generación parcial; al cierre debe coincidir)")


# --- Tablas (reglas 68-75) ----------------------------------------------------

TABLE_ROWS_MIN = 3
TABLE_ROWS_MAX = 5
TABLE_CELL_RENDER_MAX = 5      # regla 74: celda numérica en una tabla de 2 columnas

# Regla 69: el emoji vive SOLO en columns[].icon. Se detecta por rango Unicode y
# no por lista blanca, porque la lista de emoji crece con cada versión del
# estándar y una lista se queda corta en silencio.
EMOJI_RANGES = (
    (0x1F300, 0x1FAFF),   # pictogramas, símbolos suplementarios, extendidos-A
    (0x1F000, 0x1F0FF),   # fichas de mahjong/dominó/naipes
    (0x2600, 0x27BF),     # misceláneos y dingbats
    (0x2B00, 0x2BFF),     # flechas y formas geométricas suplementarias
)

# U+FE0F es el selector de variación que fuerza la presentación emoji; viene
# pegado a muchos íconos comunes (🏷️, 🍽️) y NO es un emoji en sí. Contarlo
# como uno hacía que cualquier ícono con selector se leyera como dos emoji y,
# peor, que el propio selector cayera en el set de veredicto de abajo.
VARIATION_SELECTOR = "️"

# Regla 69: emoji que leen como veredicto. Son la regla 14 (✓/✗) con otra
# tipografía, así que quedan prohibidos incluso en el encabezado. Se listan por
# separado y no como un string suelto: un `set("✔️")` mete el selector adentro.
VERDICT_EMOJI = {"✅", "❌", "✔", "✖", "❎", "🔴", "🟢", "🟥", "🟩", "⭕"}


def _emoji_chars(s: str) -> list[str]:
    out = []
    for ch in (s or "").replace(VARIATION_SELECTOR, ""):
        cp = ord(ch)
        if any(lo <= cp <= hi for lo, hi in EMOJI_RANGES):
            out.append(ch)
    return out


def _cells_for_option(reveal: dict, i: int) -> list | None:
    """Los valores que la opción `i` pinta, normalizados a lista.

    En modo `column` es la columna entera; en modo `cell`, la única celda que
    llena. Devolver siempre una lista deja que las comparaciones de abajo no se
    tengan que ramificar por modo.
    """
    by_option = reveal.get("by_option")
    if not isinstance(by_option, list) or i >= len(by_option):
        return None
    entry = by_option[i]
    if reveal.get("mode") == "cell":
        return [entry]
    if isinstance(entry, dict) and isinstance(entry.get("cells"), list):
        return entry["cells"]
    return None


def check_ids(items, file, F: Findings) -> None:
    """Regla 76: todo ejercicio lleva un `id` estable y propio.

    Sin `id`, `seed_content.py` cae al id posicional, y ahí basta con borrar un
    ejercicio del medio para que todos los que siguen se renumeren y las
    respuestas ya guardadas pasen a describir otro contenido. El arreglo no es
    escribir el id a mano: es correr `content/stamp_ids.py`, que lo asigna sin
    reusar nunca uno dado de baja.
    """
    vistos: dict[str, int] = {}
    for idx, it in enumerate(items):
        label = f"#{idx}"
        raw = it.get("id")
        if raw is None:
            F.add("ERROR", "ids", "76", file, label,
                  "sin `id` estable — correr `python content/stamp_ids.py`")
            continue
        if not isinstance(raw, str) or not raw.strip():
            F.add("ERROR", "ids", "76", file, label, "`id` vacío o no es un string")
            continue
        if len(raw) > 100:
            F.add("ERROR", "ids", "76", file, label,
                  f"`id` de {len(raw)} caracteres, la columna admite 100")
        if raw in vistos:
            F.add("ERROR", "ids", "76", file, label,
                  f"`id` {raw!r} repetido (ya está en #{vistos[raw]})")
        else:
            vistos[raw] = idx


def check_tables(items, file, F: Findings) -> None:
    """Reglas 68-75: forma de la tabla, coherencia con la correcta y distractores.

    A diferencia de la regla 60 (coherencia entre la prosa y `graph_fn`, que el
    validador no puede ver porque hay que evaluar una función), acá los dos lados
    son strings literales: la coherencia SÍ se chequea mecánicamente.
    """
    for idx, it in enumerate(items):
        table = it.get("table")
        if table is None:
            continue
        label = f"#{idx}"
        if not isinstance(table, dict):
            F.add("ERROR", "tables", "68", file, label, "`table` no es un objeto")
            continue

        columns = table.get("columns")
        rows = table.get("rows")
        if not isinstance(columns, list) or len(columns) != 2:
            F.add("ERROR", "tables", "74", file, label,
                  f"`columns` debe tener exactamente 2 entradas (tiene {len(columns) if isinstance(columns, list) else '?'})")
            continue
        if not isinstance(rows, list) or not (TABLE_ROWS_MIN <= len(rows) <= TABLE_ROWS_MAX):
            F.add("ERROR", "tables", "74", file, label,
                  f"`rows` debe tener {TABLE_ROWS_MIN}-{TABLE_ROWS_MAX} filas "
                  f"(tiene {len(rows) if isinstance(rows, list) else '?'})")
            continue
        for r, row in enumerate(rows):
            if not isinstance(row, list) or len(row) != len(columns):
                F.add("ERROR", "tables", "74", file, label,
                      f"fila {r}: {len(row) if isinstance(row, list) else '?'} celdas para {len(columns)} columnas")

        # Regla 69: emoji solo en columns[].icon, y nunca uno de veredicto.
        for c, col in enumerate(columns):
            icon = ((col or {}).get("icon") or "").replace(VARIATION_SELECTOR, "")
            bad = VERDICT_EMOJI.intersection(icon)
            if bad:
                F.add("ERROR", "tables", "69", file, label,
                      f"columna {c}: emoji de veredicto {''.join(sorted(bad))!r} (regla 14 con otra tipografía)")
            if len(_emoji_chars(icon)) > 1:
                F.add("WARNING", "tables", "69", file, label,
                      f"columna {c}: más de un emoji en el ícono")
            label_text = (col or {}).get("label") or ""
            if _emoji_chars(label_text):
                F.add("ERROR", "tables", "69", file, label,
                      f"columna {c}: emoji en `label` (va solo en `icon`)")
            # El emoji ilustra una cosa; una columna cuyo encabezado es notación
            # matemática no tiene cosa que ilustrar y el ícono compite con la
            # fórmula.
            if icon and "$" in label_text:
                F.add("ERROR", "tables", "69", file, label,
                      f"columna {c}: ícono en una columna de notación matemática ({label_text!r})")

        stray = []
        for field in ("question", "explanation", "feedback_correct"):
            stray += _emoji_chars(it.get(field) or "")
        for opt in (it.get("options") or []):
            stray += _emoji_chars(opt or "")
        for row in rows:
            for cell in (row if isinstance(row, list) else []):
                stray += _emoji_chars(cell or "")
        if stray:
            F.add("ERROR", "tables", "69", file, label,
                  f"emoji fuera de columns[].icon: {''.join(sorted(set(stray)))!r} "
                  "(en una opción es fruit-salad algebra)")

        reveal = table.get("reveal")
        if reveal is None:
            continue
        if not isinstance(reveal, dict):
            F.add("ERROR", "tables", "68", file, label, "`reveal` no es un objeto")
            continue
        mode = reveal.get("mode")
        if mode not in ("column", "cell"):
            F.add("ERROR", "tables", "68", file, label,
                  f"`reveal.mode` inválido: {mode!r} (esperado 'column' o 'cell')")
            continue

        opts = it.get("options") or []
        by_option = reveal.get("by_option")
        if not isinstance(by_option, list) or len(by_option) != len(opts):
            F.add("ERROR", "tables", "70", file, label,
                  f"`by_option` tiene {len(by_option) if isinstance(by_option, list) else '?'} "
                  f"entradas para {len(opts)} opciones (tienen que ser paralelas)")
            continue

        ci = it.get("correct_index")
        if not isinstance(ci, int) or not (0 <= ci < len(opts)):
            continue  # ya lo reporta check_structure
        correct = _cells_for_option(reveal, ci)
        if correct is None:
            F.add("ERROR", "tables", "70", file, label,
                  "la opción correcta no trae los valores que pinta")
            continue

        # Regla 70: la tabla y el enunciado dicen lo mismo. Toda celda ya visible
        # tiene que coincidir con lo que pinta la correcta en esa misma posición.
        col = reveal.get("col", 1)
        if mode == "column":
            if len(correct) != len(rows):
                F.add("ERROR", "tables", "70", file, label,
                      f"la correcta pinta {len(correct)} celdas para {len(rows)} filas")
                continue
            for r, row in enumerate(rows):
                given = row[col] if isinstance(row, list) and col < len(row) else None
                if given is not None and given != correct[r]:
                    F.add("ERROR", "tables", "70", file, label,
                          f"fila {r}: la tabla muestra {given!r} pero la correcta pinta {correct[r]!r}")
        else:
            at = reveal.get("at")
            if not (isinstance(at, list) and len(at) == 2):
                F.add("ERROR", "tables", "68", file, label,
                      "modo 'cell' sin `at: [fila, col]` válido")
                continue
            r, c = at
            if not (isinstance(r, int) and isinstance(c, int) and 0 <= r < len(rows)
                    and isinstance(rows[r], list) and 0 <= c < len(rows[r])):
                F.add("ERROR", "tables", "68", file, label, f"`at` fuera de rango: {at!r}")
                continue
            if rows[r][c] is not None:
                F.add("ERROR", "tables", "70", file, label,
                      f"la celda {at!r} ya está completa: no queda nada que revelar")

        # A3 (ERROR): cada distractor difiere de la correcta en alguna fila
        # visible, o el ítem no es decidible con lo que se muestra.
        # A2 (WARNING): cada distractor coincide en alguna fila visible, o se
        # descarta de un vistazo. Es WARNING y no ERROR porque en la familia de
        # explosión combinatoria (factoriales, potencias) es insatisfacible:
        # nada se parece a un factorial en dos puntos seguidos.
        visible = [r for r, row in enumerate(rows)
                   if isinstance(row, list) and col < len(row) and row[col] is not None] \
            if mode == "column" else []
        for i, opt in enumerate(opts):
            if i == ci:
                continue
            cells = _cells_for_option(reveal, i)
            if cells is None:
                F.add("ERROR", "tables", "70", file, label,
                      f"opción {i} sin valores que pintar")
                continue
            if mode == "cell":
                if cells == correct:
                    F.add("ERROR", "tables", "71", file, label,
                          f"opción {i} pinta el mismo valor que la correcta")
                continue
            if not any(cells[r] != correct[r] for r in range(len(correct))):
                F.add("ERROR", "tables", "71", file, label,
                      f"opción {i} pinta una columna idéntica a la correcta")
                continue
            if visible:
                if not any(cells[r] != correct[r] for r in visible):
                    F.add("ERROR", "tables", "71", file, label,
                          f"opción {i} (A3): no difiere en ninguna fila visible, "
                          "el ítem no se puede decidir con lo que se muestra")
                if not any(cells[r] == correct[r] for r in visible):
                    F.add("WARNING", "tables", "71", file, label,
                          f"opción {i} (A2): difiere en TODAS las filas visibles, "
                          "se descarta de un vistazo (esperable en factoriales)")

        # Regla 74: ancho de celda. Solo se miden las celdas NUMÉRICAS: la fila
        # simbólica lleva la expresión entera ($n(n-1)(n-2)$) y ahí el ancho es
        # el que es, igual que en una opción.
        every_cell = [(r, c, cell)
                      for r, row in enumerate(rows) if isinstance(row, list)
                      for c, cell in enumerate(row)]
        for entry in _cells_for_option(reveal, ci) or []:
            every_cell.append((-1, col, entry))
        for r, c, cell in every_cell:
            if not cell:
                continue
            rendered = render_len(cell)
            if rendered > TABLE_CELL_RENDER_MAX and re.fullmatch(r"[\d.,]+", cell.strip("$")):
                F.add("WARNING", "tables", "74", file, label,
                      f"celda numérica [{r},{c}] mide {rendered} de render "
                      f"(máx {TABLE_CELL_RENDER_MAX})")


NUMBER_RE = re.compile(r"-?\d+")


# Funciones que mathjs (el motor de `web/src/components/math-graph.tsx`) sabe
# evaluar. Fuera de esta lista el gráfico NO se dibuja: toRealFn atrapa la
# excepción y devuelve NaN para todo x, así que la curva sale en blanco, sin
# ningún error visible en consola ni en los logs.
#
# `Piecewise` no es de mathjs: lo desarma parsePiecewise antes de compilar cada
# rama. `None` es el hueco deliberado de una discontinuidad evitable (da NaN a
# propósito, ver el comentario de toRealFn).
MATHJS_FNS = {
    "abs", "cos", "exp", "log", "log10", "log2", "pow", "sign", "sin", "sqrt",
    "tan", "Piecewise",
}
MATHJS_SYMS = {"x", "e", "pi", "None"}
# Errores clásicos de traducción desde SymPy/LaTeX, con su equivalente real.
GRAPH_FN_ALIAS = {"ln": "log(x) (en mathjs log es el natural)",
                  "Abs": "abs", "Exp": "exp", "Sqrt": "sqrt", "Log": "log"}
GRAPH_IDENT_RE = re.compile(r"[A-Za-z_][A-Za-z0-9_]*")


def check_graphs(items, file, F: Findings) -> None:
    """Cada nombre que aparece en `graph_fn` tiene que existir en mathjs.

    Detectado en agosto 2026 por el reporte de un alumno ("no ando el
    grafico"): tres ítems de logarítmicas usaban `ln(x)`, que en mathjs no
    existe —el logaritmo natural es `log`— y salían con el gráfico vacío."""
    for idx, it in enumerate(items):
        fn = it.get("graph_fn")
        if not isinstance(fn, str) or not fn.strip():
            continue
        label = f"#{idx}"
        for name in set(GRAPH_IDENT_RE.findall(fn)):
            if name in MATHJS_FNS or name in MATHJS_SYMS:
                continue
            sugerencia = GRAPH_FN_ALIAS.get(name)
            detalle = f"; usar {sugerencia}" if sugerencia else ""
            F.add("ERROR", "graphs", "-", file, label,
                  f"graph_fn usa '{name}', que mathjs no conoce: el gráfico "
                  f"queda en blanco{detalle} ({fn})")


def check_unit_duplicates(unit: str, entries: list[tuple[str, int, str]], F: Findings) -> None:
    """Regla 65: dos ítems de la misma unidad que reutilizan los mismos números.

    El repaso mezcla topics de una misma unidad en la misma sesión, así que dos
    enunciados con los mismos datos se leen como el mismo ejercicio repetido,
    aunque pregunten cosas distintas.

    Se compara la secuencia de enteros del `question`, que es lo que el alumno
    ve. Solo se miran enunciados con al menos `DUPLICATE_MIN_NUMBERS` números,
    para no marcar preguntas conceptuales que casi no tienen datos.

    Es WARNING y no ERROR porque el formato "paso troceado" (regla 56) reparte a
    propósito un mismo objeto entre varios ítems, y ahí la repetición es el
    diseño, no un descuido.
    """
    by_signature: dict[tuple[str, ...], list[str]] = {}
    for file, idx, question in entries:
        numbers = tuple(NUMBER_RE.findall(question))
        # Se piden varios números y además variedad entre ellos: una firma como
        # (1,1,1,1) o (0,0,1,1) coincide entre ítems que no tienen nada que ver.
        if len(numbers) < DUPLICATE_MIN_NUMBERS or len(set(numbers)) < DUPLICATE_MIN_DISTINCT:
            continue
        by_signature.setdefault(numbers, []).append(f"{file}#{idx}")
    for numbers, labels in sorted(by_signature.items()):
        if len(labels) > 1:
            F.add("WARNING", "duplicates", "65", unit, "ALL",
                  f"mismos {len(numbers)} números en {len(labels)} ítems de la unidad: "
                  f"{', '.join(labels)} (legítimo solo en paso troceado, regla 56)")


# --- Runner -------------------------------------------------------------------

def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__.split("\n")[0])
    ap.add_argument("--course", default="analisis")
    ap.add_argument("--topic", default=None,
                    help="ruta belt/unit/topic (ej. brown/integrals/definite)")
    ap.add_argument("--check", default=",".join(ALL_CHECKS),
                    help=f"lista separada por comas de: {','.join(ALL_CHECKS)}")
    ap.add_argument("--json", action="store_true", dest="as_json")
    args = ap.parse_args()

    checks = [c.strip() for c in args.check.split(",") if c.strip()]
    bad = [c for c in checks if c not in ALL_CHECKS]
    if bad:
        print(f"checks desconocidos: {bad} (válidos: {ALL_CHECKS})", file=sys.stderr)
        return 2

    course_dir = CONTENT_DIR / args.course
    if not course_dir.is_dir():
        print(f"no existe el curso: {course_dir}", file=sys.stderr)
        return 2

    if args.topic:
        topic_dirs = [course_dir / args.topic.replace("\\", "/")]
        if not topic_dirs[0].is_dir():
            print(f"no existe el topic: {topic_dirs[0]}", file=sys.stderr)
            return 2
    else:
        topic_dirs = sorted(
            {p.parent for p in course_dir.glob("*/*/*/[A-Z]*.json")}
        )

    F = Findings()
    files_scanned = 0
    items_scanned = 0
    # regla 65: los duplicados se comparan dentro de la unidad (belt/unit), que
    # es el alcance con el que el repaso arma una sesión.
    unit_entries: dict[str, list[tuple[str, int, str]]] = {}
    for topic_dir in topic_dirs:
        targets_by_skill, known_slugs = parse_distribution(topic_dir / "topic-context.md")
        for jf in sorted(topic_dir.glob("[A-Z]*.json")):
            rel = jf.relative_to(course_dir).as_posix()
            try:
                items = json.loads(jf.read_text(encoding="utf-8"))
            except json.JSONDecodeError as e:
                F.add("ERROR", "structure", "-", rel, "-", f"JSON inválido: {e}")
                continue
            if not isinstance(items, list):
                F.add("ERROR", "structure", "-", rel, "-", "el archivo no es un array de ítems")
                continue
            files_scanned += 1
            items_scanned += len(items)
            if "options" in checks:
                check_options(items, rel, F)
            if "explanations" in checks:
                check_explanations(items, rel, F)
            if "questions" in checks:
                check_questions(items, rel, F)
            if "feedbacks" in checks:
                check_feedbacks(items, rel, F)
            if "structure" in checks:
                # Cada archivo se compara contra los objetivos de SU skill. Si
                # el doc no separa por skill, se cae a la unión del topic.
                skill_targets = targets_by_skill.get(jf.stem) or known_slugs
                check_structure(items, rel, F, skill_targets, known_slugs)
            if "tables" in checks:
                check_tables(items, rel, F)
            if "ids" in checks:
                check_ids(items, rel, F)
            if "graphs" in checks:
                check_graphs(items, rel, F)
            if "duplicates" in checks:
                unit = "/".join(rel.split("/")[:2])
                unit_entries.setdefault(unit, []).extend(
                    (rel, idx, it.get("question") or "")
                    for idx, it in enumerate(items)
                )

    for unit, entries in sorted(unit_entries.items()):
        check_unit_duplicates(unit, entries, F)

    if args.as_json:
        print(json.dumps({
            "course": args.course,
            "files": files_scanned,
            "items": items_scanned,
            "errors": F.errors(),
            "warnings": F.warnings(),
            "findings": F.rows,
        }, ensure_ascii=False, indent=2))
    else:
        current_file = None
        for r in F.rows:
            if r["file"] != current_file:
                current_file = r["file"]
                print(f"\n== {current_file} ==")
            print(f"  [{r['level']}] {r['item']:>5} | {r['check']} (regla {r['rule']}): {r['message']}")
        print(f"\n{'-'*70}")
        print(f"Archivos: {files_scanned} | Ítems: {items_scanned} | "
              f"ERRORS: {F.errors()} | WARNINGS: {F.warnings()}")
        by_check = Counter((r["check"], r["level"]) for r in F.rows)
        for (check, level), n in sorted(by_check.items()):
            print(f"  {check:<14} {level:<8} {n}")

    return 1 if F.errors() else 0


if __name__ == "__main__":
    sys.exit(main())
