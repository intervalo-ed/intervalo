"""La explicación del «¿Por qué?»: de dónde sale la derivada que se pedía.

Los ejercicios del juego no los escribió nadie. Los arma `templates.py` con
parámetros al azar, así que no hay un campo `explanation` que rellenar como en
el banco de Intervalo: la explicación hay que CONSTRUIRLA a partir de la
expresión concreta que se sirvió.

El criterio de escritura, decidido y no negociable acá adentro:

  1. **Porqué → reconocer → cuenta.** Arranca por la imagen —el rectángulo del
     producto, el cubo de la potencia—, la regla cae como consecuencia, y la
     cuenta con ESTOS números va al final. Es el orden de 3Blue1Brown en
     *Essence of calculus*: primero el dibujo, después la fórmula. Que la
     respuesta quede última también sirve para el otro lector, el que vino a
     buscarla: scrollea al fondo y está.

  2. **Todo explicado.** Cada regla que hace falta trae su imagen, incluidas
     las chiquitas: un $x^3 \\operatorname{sen} x$ muestra el rectángulo, el
     cubo y el círculo unitario, y un $x^4 + 4$ dice también por qué el $4$ no
     aporta nada. Se probó ahorrarse las atómicas —la constante suelta, la $x$
     pelada, con el argumento de que nadie se pregunta dos veces cuánto vale
     $7'$— y el resultado era peor de lo que suena: un `d/dx[7]` quedaba sin
     una sola línea de explicación, o sea justo el ejercicio donde quien lo
     falló más la necesita.

  3. **Voz `vos`**, como el resto del juego ("Revisá", "Saltear"), y no la voz
     impersonal del banco ("Identificamos…"). Allá lee alguien que está
     estudiando; acá, alguien que está jugando y quiere volver.

El riesgo de este formato no es la longitud, es la REPETICIÓN: quien hace
treinta derivadas lee la imagen del cubo veinte veces. Por eso cada imagen es
corta y —esto es lo importante— **no tiene parámetros**: es igual palabra por
palabra para todo producto, así que a la tercera vez ya no se lee, se saltea, y
eso está bien. Los números de este ejercicio viven solo en los dos últimos
bloques.

Se chequea con: python backend/scripts/check_game_explain.py
"""

from __future__ import annotations

import json
import math
from dataclasses import dataclass

import sympy

from .templates import TEMPLATE_BY_KEY, latex_es, x
from .validator import expr_from_stored


@dataclass(frozen=True)
class Explanation:
    """Lo que devuelve `build`: el texto y los datos del gráfico de cierre
    (lo pintan las dos vistas, ver web/src/app/derivadas/mobile-flow.tsx y
    desktop-layout.tsx).

    El gráfico no es opcional ni depende de la plantilla: acá TODO ejercicio
    es literalmente "derivá esta f(x)", así que f y f' siempre tienen algo
    para dibujar — a diferencia del banco de Intervalo, donde `graph_fn` es
    opt-in porque la mayoría de los ítems son algebraicos y no describen
    ninguna curva.

    `graph_fn_latex`/`graph_fn2_latex` son la MISMA f y f' que `graph_fn`/
    `graph_fn2`, pasadas por `latex_es` en vez de `str`: existen solo para
    que la leyenda del gráfico muestre la fórmula matemática y no un genérico
    "f(x)"/"f'(x)" que no dice cuál curva es cuál.
    """

    text: str
    graph_fn: str
    graph_fn2: str
    graph_fn_latex: str
    graph_fn2_latex: str
    graph_view: tuple[float, float, float, float]


@dataclass(frozen=True)
class Regla:
    """Una regla de derivación, con la imagen que la explica.

    `imagen` no lleva parámetros a propósito (ver el docstring del módulo).
    `formula` es la regla en símbolos genéricos; None en las atómicas, donde la
    fórmula y la imagen dirían lo mismo.
    """

    imagen: str
    formula: str | None = None


# Las trece imágenes. Este es el archivo que se edita cuando se quiere cambiar
# cómo suena el juego al explicar; nada de acá abajo depende de la plantilla que
# se sirvió.
REGLAS: dict[str, Regla] = {
    "constante": Regla(
        "Una constante no se mueve: su gráfico es una recta horizontal, y una "
        "recta horizontal no sube.",
        r"c' = 0",
    ),
    "x": Regla(
        "La $x$ cambia exactamente a la par de sí misma: la movés uno y sube uno.",
        r"x' = 1",
    ),
    "potencia": Regla(
        "Pensá $x^{n}$ como el volumen de un cubo de $n$ dimensiones y lado $x$.\n\n"
        "Estirás el lado un poquito y lo que se agrega son sus $n$ caras, cada una "
        "de tamaño $x^{n-1}$: por eso el exponente baja multiplicando y el que "
        "queda es uno menos.",
        r"\left(x^{n}\right)' = n\,x^{n-1}",
    ),
    "constante_por": Regla(
        "Multiplicar por una constante estira el resultado, y estira igual cuánto "
        "cambia. El factor sale afuera y espera.",
        r"\left(k\,u\right)' = k\,u'",
    ),
    "suma": Regla(
        "Cuando hay cosas sumadas, cada una crece por su cuenta y el total crece "
        "lo que crecen todas juntas. Se derivan por separado y se vuelven a sumar.",
        r"\left(u + v\right)' = u' + v'",
    ),
    "exp": Regla(
        "$e^{x}$ es la única función cuya velocidad es igual a su propio valor: "
        "cuanto más alto está, más rápido sube. Por eso derivarla la deja igual.",
        r"\left(e^{x}\right)' = e^{x}",
    ),
    "ax": Regla(
        "$a^{x}$ es $e^{x\\ln a}$ disfrazada: también crece proporcional a sí "
        "misma, pero con otra constante de proporcionalidad, y esa constante es "
        "$\\ln a$.",
        r"\left(a^{x}\right)' = a^{x}\ln a",
    ),
    "ln": Regla(
        "$\\ln x$ es $e^{x}$ dada vuelta, y espejar un gráfico da vuelta la "
        "pendiente. Donde la exponencial vale $x$ su pendiente también vale $x$, "
        "así que de este lado la pendiente es $1/x$.",
        r"\left(\ln x\right)' = \frac{1}{x}",
    ),
    "loga": Regla(
        "$\\log_a x$ es el revés de $a^{x}$, que subía $\\ln a$ veces más rápido "
        "que $e^{x}$. Al darlo vuelta, ese factor pasa a dividir.",
        r"\left(\log_a x\right)' = \frac{1}{x\ln a}",
    ),
    "sen": Regla(
        "$\\operatorname{sen} x$ es la altura de un punto que gira por el círculo "
        "unitario. Cuánto sube por cada pedacito de ángulo es justo el ancho de "
        "ese punto, que es el coseno.",
        r"\left(\operatorname{sen} x\right)' = \cos x",
    ),
    "cos": Regla(
        "$\\cos x$ es el ancho del mismo punto que gira. Al girar, el ancho se "
        "achica mientras la altura crece: de ahí el signo menos.",
        r"\left(\cos x\right)' = -\operatorname{sen} x",
    ),
    "producto": Regla(
        "Un producto es el área de un rectángulo, y acá los dos lados se mueven "
        "cuando movés $x$.\n\n"
        "Un empujoncito y el área gana dos tiras finas —una por cada lado que "
        "creció—; la esquinita que queda entre las dos es tan chica que no cuenta.",
        r"\left(u \cdot v\right)' = u'v + uv'",
    ),
    "cociente": Regla(
        "Un cociente es el producto de $u$ por $1/v$: cuando el de abajo crece, el "
        "resultado se achica. De ahí salen las dos cosas raras de la regla, el "
        "signo menos del segundo término y el $v^{2}$ de abajo.",
        r"\left(\frac{u}{v}\right)' = \frac{u'v - uv'}{v^{2}}",
    ),
    "tan": Regla(
        "$\\tan x$ es el cociente entre el seno y el coseno del mismo punto que "
        "gira. Los dos cambian a la vez, y al repartir ese cambio con la regla "
        "del cociente lo que queda es $1/\\cos^{2}x$.",
        r"\left(\tan x\right)' = \frac{1}{\cos^{2} x}",
    ),
}

# La forma de cada plantilla, explícita y no inferida de la expresión. Es por un
# caso concreto: `log(x, a)` sympy lo guarda como `log(x)/log(a)`, así que
# `as_numer_denom()` lo devuelve como un cociente y la explicación saldría
# hablando de la regla del cociente sobre una función que es un logaritmo. Es la
# misma razón por la que `_t3_loga` ya trae un `prompt_latex` escrito a mano.
FORMA_POR_PLANTILLA: dict[str, str] = {
    "t0_const": "termino",
    "t0_x": "termino",
    "t1_pow": "termino",
    "t1_kx": "termino",
    "t1_kpow": "termino",
    "t2_sum2": "suma",
    "t2_sum3": "suma",
    "t2_pow_plus_const": "suma",
    "t3_exp": "termino",
    "t3_ln": "termino",
    "t3_sin": "termino",
    "t3_cos": "termino",
    "t3_ax": "termino",
    "t3_loga": "loga",
    "t3_trig_sum": "suma",
    "t3_mix_sum": "suma",
    "t4_pow_sin": "producto",
    "t4_pow_exp": "producto",
    "t4_exp_cos": "producto",
    "t4_pow_ln": "producto",
    "t4_exp_sin": "producto",
    "t5_sin_over_x": "cociente",
    "t5_pow_over_linear": "cociente",
    "t5_exp_over_pow": "cociente",
    "t5_ln_over_x": "cociente",
    "t5_linear_over_linear": "cociente",
    "t1_recip": "termino",
    "t1_sqrt": "termino",
    "t3_tan": "tan",
}


def _reglas_de(expr: sympy.Expr) -> tuple[str, ...]:
    """Qué reglas hacen falta para derivar `expr`, de afuera hacia adentro.

    Estructural y recursiva. No reconoce productos ni cocientes: esos son la
    forma DE ARRIBA, la decide `build` con la plantilla, y acá solo llegan
    piezas.
    """
    if expr.is_Number:
        return ("constante",)
    if expr == x:
        return ("x",)
    if expr.is_Add:
        return ("suma",) + tuple(
            regla for t in expr.as_ordered_terms() for regla in _reglas_de(t)
        )
    if expr.is_Mul:
        coef, resto = expr.as_coeff_Mul()
        if coef != 1 and resto != 1:
            return ("constante_por",) + _reglas_de(resto)
    if expr.is_Pow:
        base, exponente = expr.as_base_exp()
        if base == x and exponente.is_Number:
            return ("potencia",)
        if exponente == x and base.is_Number:
            return ("ax",)
    if expr.func is sympy.exp:
        return ("exp",)
    if expr.func is sympy.log:
        return ("ln",)
    if expr.func is sympy.sin:
        return ("sen",)
    if expr.func is sympy.cos:
        return ("cos",)
    if expr.func is sympy.tan:
        return ("tan",)
    # Una forma que este catálogo no conoce. Devolver vacío deja la explicación
    # con la cuenta y sin imagen: feo, pero cierto. Inventar la imagen
    # equivocada sería peor, y el check recorre las 29 plantillas justamente
    # para que esto no llegue a producción.
    return ()


def _display(latex: str) -> str:
    return f"$${latex}$$"


def _unir(trozos: list[str]) -> str:
    """Pega los bloques con la separación del banco de Intervalo: línea en
    blanco entre párrafos de prosa, un solo salto pegado a los `$$`."""
    salida = trozos[0]
    for anterior, actual in zip(trozos, trozos[1:]):
        display = anterior.startswith("$$") or actual.startswith("$$")
        salida += ("\n" if display else "\n\n") + actual
    return salida


def _f_de(exercise) -> sympy.Expr:
    """La f(x) que se sirvió. Sale de `params_json`, que el generador ya
    persiste como `{"f": str(expr)}` — no hace falta ninguna columna nueva."""
    return expr_from_stored(json.loads(exercise.params_json or "{}")["f"])


def _renglon(izq: str, der: str) -> str:
    return f"{izq} &= {der}"


def _to_mathjs(expr: sympy.Expr) -> str:
    """`str(expr)` alcanza: sympy imprime `sin`, `cos`, `exp`, `log`, `sqrt`
    con los mismos nombres que mathjs conoce (ver authoring-context.md,
    sección Gráficos), y el `**` de por medio lo normaliza a `^` el propio
    `math-graph.tsx` (`normalize()`) antes de compilar — es el mismo truco que
    ya usa `params_json` para guardar la f(x) servida. Nuestras plantillas
    nunca generan `Abs`/`sign` ni constantes simbólicas sueltas (`E`, `pi`):
    son expresiones ya instanciadas con números concretos."""
    return str(expr)


def _muestras(fn, xs: list[float]) -> list[float]:
    """Evalúa `fn` (una `lambdify`) en cada punto de `xs` y descarta lo que no
    dé un real finito: fuera de dominio (`log` de negativo), polos de un
    cociente (`ZeroDivisionError`), overflow de una potencia grande."""
    valores: list[float] = []
    for punto in xs:
        try:
            y = float(fn(punto))
        except (TypeError, ValueError, ZeroDivisionError, OverflowError):
            continue
        if math.isfinite(y):
            valores.append(y)
    return valores


def _percentil(valores: list[float], p: float) -> float:
    ordenados = sorted(valores)
    i = min(len(ordenados) - 1, max(0, round(p * (len(ordenados) - 1))))
    return ordenados[i]


def _auto_view(f: sympy.Expr, fprime: sympy.Expr) -> tuple[float, float, float, float]:
    """Encuadre numérico para el gráfico del cierre: sin curar a mano, porque
    la f(x) es distinta en cada ejercicio.

    Se `lambdify`ea con el módulo `math` y se samplea en una grilla pareja; el
    5.º y 95.º percentil de los valores —no el mínimo y el máximo— arman el
    alto de la vista, porque un cociente como $x^2/(x+3)$ tiene un polo
    adentro del dominio y ahí el máximo real es infinito (un par de muestras
    gigantes al lado de la asíntota, que el percentil deja afuera).

    Aspecto libre, no 1:1: a diferencia del banco de Intervalo
    (`graph_free_aspect`, reservado a `probabilidad`), acá f y f' comparten
    los mismos ejes y casi nunca comparten escala — $x^4$ y su derivada
    $4x^3$ difieren en un orden de magnitud dentro de la misma ventana.
    """
    # `log(x)` en cualquier parte de f fija el dominio a x>0. La derivada de
    # nuestras plantillas nunca REINTRODUCE un log que f no tuviera, así que
    # alcanza con mirar f.
    necesita_positivo = f.has(sympy.log)
    x_lo, x_hi = (0.1, 8.0) if necesita_positivo else (-6.0, 6.0)

    f_num = sympy.lambdify(x, f, modules=["math"])
    fp_num = sympy.lambdify(x, fprime, modules=["math"])

    N = 400
    paso = (x_hi - x_lo) / (N - 1)
    xs = [x_lo + i * paso for i in range(N)]
    valores = _muestras(f_num, xs) + _muestras(fp_num, xs)

    if not valores:
        # No debería pasar con las 29 plantillas (el check las recorre todas),
        # pero una vista de emergencia es preferible a que el endpoint reviente.
        return (x_lo, x_hi, -6.0, 6.0)

    y_lo, y_hi = _percentil(valores, 0.05), _percentil(valores, 0.95)
    rango = y_hi - y_lo
    if rango < 1e-6:
        # f y f' casi constantes en la ventana (ej. f'(x) = 0 del término
        # constante): sin esto la vista sale de alto ~0 y Mafs la infla mal.
        rango = max(abs(y_lo), 1.0) * 2
        y_lo -= rango / 2
        y_hi += rango / 2
    margen = rango * 0.15
    return (x_lo, x_hi, y_lo - margen, y_hi + margen)


def build(exercise) -> Explanation:
    """El texto entero del ¿Por qué? (en MathText) más los datos del gráfico
    de cierre — ver `Explanation`."""
    f = _f_de(exercise)
    fprime = sympy.diff(f, x)
    forma = FORMA_POR_PLANTILLA.get(exercise.template_key) or "termino"
    # Un paso intermedio antes del resultado, cuando hace falta (ver el cociente).
    sustitucion: str | None = None

    # Arranca directo en la fórmula: repetir el enunciado en prosa antes
    # ("Lo que hay que derivar:") era redundante con lo que ya se ve arriba
    # —en escritorio, del otro lado de la card; en el teléfono, en la pantalla
    # de la que se vino— y la fórmula sola alcanza para orientar sin relleno.
    trozos: list[str] = [
        _display(rf"\frac{{d}}{{dx}}\left[\,{exercise.prompt_latex}\,\right]"),
    ]

    # Cada regla se explica UNA vez. Que el producto y una de sus piezas
    # compartan la potencia no es motivo para escribirla dos veces.
    explicadas: set[str] = set()

    def imagen(clave: str) -> None:
        if clave in explicadas or clave not in REGLAS:
            return
        explicadas.add(clave)
        regla = REGLAS[clave]
        trozos.append(regla.imagen)
        if regla.formula:
            trozos.append(_display(regla.formula))

    def imagenes(expr: sympy.Expr) -> None:
        for clave in _reglas_de(expr):
            imagen(clave)

    if forma in ("producto", "cociente"):
        if forma == "producto":
            factores = f.as_ordered_factors()
            u, v = factores[0], sympy.Mul(*factores[1:])
        else:
            u, v = f.as_numer_denom()
        du, dv = sympy.diff(u, x), sympy.diff(v, x)

        imagen(forma)
        trozos.append("Acá las dos piezas son:")
        trozos.append(
            _display(
                r"\begin{aligned} "
                + _renglon("u", latex_es(u))
                + " & "
                + _renglon("u'", latex_es(du))
                + r" \\ "
                + _renglon("v", latex_es(v))
                + " & "
                + _renglon("v'", latex_es(dv))
                + r" \end{aligned}"
            )
        )
        imagenes(u)
        imagenes(v)
        # La cuenta se arma con la REGLA y no con `sympy.diff` sobre f: diff de
        # un cociente devuelve la suma ya repartida (`cos(x)/x - sen(x)/x²`),
        # que es correcta y no se parece en nada a lo que la persona escribió
        # aplicando la regla. Las dos formas son la misma derivada —el check lo
        # comprueba numéricamente contra `expected_derivative`— pero solo una
        # es la que cierra el paso a paso que se acaba de leer.
        if forma == "producto":
            resultado = du * v + u * dv
        else:
            resultado = (du * v - u * dv) / v**2
            # El cociente lleva un renglón de más, con las piezas puestas en la
            # regla antes de tocar nada. Sin él la explicación salta de "u, u',
            # v, v'" a un resultado que sympy ya simplificó —$(x+6)/(x+3)$
            # termina en $-3/(x+3)^2$, donde no queda ni rastro de las piezas—,
            # y ese salto es exactamente el que la persona no pudo dar sola.
            # El producto no lo necesita: ahí la sustitución YA es el resultado.
            sustitucion = (
                rf"\frac{{\left({latex_es(du)}\right)\left({latex_es(v)}\right)"
                rf" - \left({latex_es(u)}\right)\left({latex_es(dv)}\right)}}"
                rf"{{\left({latex_es(v)}\right)^{{2}}}}"
            )

    elif forma == "suma":
        terminos = f.as_ordered_terms()
        imagen("suma")
        trozos.append("Acá cada término por su lado:")
        trozos.append(
            _display(
                r"\begin{aligned} "
                + r" \\ ".join(
                    _renglon(rf"\left({latex_es(t)}\right)'", latex_es(sympy.diff(t, x)))
                    for t in terminos
                )
                + r" \end{aligned}"
            )
        )
        for t in terminos:
            imagenes(t)
        resultado = sympy.Add(*(sympy.diff(t, x) for t in terminos))

    elif forma == "loga":
        # La base sale del denominador: sympy guarda log(x, a) como
        # log(x)/log(a), y eso es exactamente lo que el `prompt_latex` escrito a
        # mano de la plantilla existe para tapar.
        _, den = f.as_numer_denom()
        base = den.args[0] if den.func is sympy.log else None
        imagen("loga")
        if base is not None:
            trozos.append(f"Acá la base es ${latex_es(base)}$.")
        resultado = sympy.diff(f, x)

    elif forma == "tan":
        # sympy.diff(tan(x)) da tan(x)**2 + 1: correcto, pero es una forma
        # distinta a la que la propia REGLA acaba de enseñar (1/cos²x), y ver
        # las dos seguidas sin explicación lee como una contradicción. Se
        # arma el resultado a mano en la forma de la regla en vez de confiar
        # en la que eligió sympy.
        coef, _resto = f.as_coeff_Mul()
        imagen("tan")
        resultado = coef / sympy.cos(x) ** 2

    else:
        imagenes(f)
        resultado = sympy.diff(f, x)

    trozos.append("Por lo tanto:")
    if sustitucion is None:
        trozos.append(_display(rf"f'(x) = {latex_es(resultado)}"))
    else:
        trozos.append(
            _display(
                r"\begin{aligned} "
                + _renglon("f'(x)", sustitucion)
                + r" \\ "
                + _renglon("", latex_es(resultado))
                + r" \end{aligned}"
            )
        )
    return Explanation(
        text=_unir(trozos),
        graph_fn=_to_mathjs(f),
        graph_fn2=_to_mathjs(fprime),
        graph_fn_latex=latex_es(f),
        graph_fn2_latex=latex_es(fprime),
        graph_view=_auto_view(f, fprime),
    )


def plantillas_sin_forma() -> list[str]:
    """Claves de `TEMPLATES` que nadie mapeó. Vacío es lo correcto; el día que
    entren los tiers de la regla de la cadena, esto las nombra."""
    return sorted(set(TEMPLATE_BY_KEY) - set(FORMA_POR_PLANTILLA))
