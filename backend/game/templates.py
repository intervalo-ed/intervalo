"""Catálogo de plantillas generadoras de derivadas (v1: solo la tabla básica).

Cada plantilla produce un f(x) aleatorio dentro de su familia, junto con los
errores predecibles de esa familia (derivadas erróneas típicas + feedback).
La derivada esperada NO vive acá: la computa sympy.diff en el generador.

v1 no incluye regla de la cadena ni anidamientos: los argumentos de las
funciones son siempre `x` pelada. La cadena entra en v2 como tiers 6-8
agregando entradas a TEMPLATES — sin tocar esquema ni migraciones (las filas
de game_template_stats se crean lazy con beta seed por tier).
"""

from __future__ import annotations

import random
from dataclasses import dataclass
from typing import Callable

import sympy
from sympy import Integer, Rational, Symbol, cos, exp, log, sin

x = Symbol("x")

GENERIC_FEEDBACK = "Revisá la tabla de derivadas y probá de nuevo."


@dataclass(frozen=True)
class Generated:
    f: sympy.Expr
    # Derivadas erróneas predecibles + feedback específico (MathText, $ inline).
    common_errors: tuple[tuple[sympy.Expr, str], ...] = ()
    # Override cuando sympy.latex no produce la notación que queremos (log_a).
    prompt_latex: str | None = None


@dataclass(frozen=True)
class GameTemplate:
    key: str
    tier: int
    build: Callable[[random.Random], Generated]
    # Feedback cuando el error no matchea ninguno predecible.
    generic_feedback: str = GENERIC_FEEDBACK


# ── Errores predecibles compartidos ──────────────────────────────────────────

_FB_POW_NO_DROP = "Al derivar una potencia, el exponente baja multiplicando: revisá $\\left(x^n\\right)'$ en la tabla."
_FB_POW_KEEP_EXP = "El exponente tiene que bajar uno al derivar la potencia."
_FB_LOST_K = "La constante que multiplica se conserva: $(k \\cdot u)' = k \\cdot u'$."
_FB_CONST_STAYS = "Una constante suelta desaparece al derivar: su derivada es $0$."
_FB_PRODUCT_SPLIT = "Derivaste cada factor por separado: la regla del producto es $u'v + uv'$."
_FB_PRODUCT_HALF = "Falta un término: la regla del producto suma $u'v$ y $uv'$."
_FB_QUOTIENT_ORDER = "El orden del numerador importa: arriba va $u'v - uv'$."
_FB_QUOTIENT_SPLIT = "En un cociente no se deriva arriba y abajo por separado: usá la regla del cociente."
_FB_SIN_SIGN = "El signo negativo aparece al derivar $\\cos x$, no $\\operatorname{sen}\\,x$."
_FB_COS_SIGN = "A la derivada de $\\cos x$ le falta el signo negativo."
_FB_EXP_AS_POW = "$e^x$ no es una potencia de $x$: no bajes el exponente."
_FB_AX_NO_LN = "Te falta un factor: la derivada de $a^x$ lleva un $\\ln a$."
_FB_LN_WRONG = "Revisá la tabla: esa no es la derivada de $\\ln x$."
_FB_LOG_NO_LN = "Te falta el $\\ln a$: revisá la derivada de $\\log_a x$ en la tabla."


def _product_errors(u: sympy.Expr, v: sympy.Expr) -> tuple[tuple[sympy.Expr, str], ...]:
    du, dv = sympy.diff(u, x), sympy.diff(v, x)
    return (
        (du * dv, _FB_PRODUCT_SPLIT),
        (du * v, _FB_PRODUCT_HALF),
    )


def _quotient_errors(u: sympy.Expr, v: sympy.Expr) -> tuple[tuple[sympy.Expr, str], ...]:
    du, dv = sympy.diff(u, x), sympy.diff(v, x)
    return (
        ((u * dv - du * v) / v**2, _FB_QUOTIENT_ORDER),
        (du / dv, _FB_QUOTIENT_SPLIT),
    )


# ── Builders por tier ────────────────────────────────────────────────────────

def _t0_const(rng: random.Random) -> Generated:
    k = rng.randint(2, 9)
    return Generated(
        f=Integer(k),
        common_errors=((Integer(k), _FB_CONST_STAYS), (Integer(1), _FB_CONST_STAYS)),
    )


def _t0_x(rng: random.Random) -> Generated:
    return Generated(
        f=x,
        common_errors=((Integer(0), "$x$ no es constante: mirá la segunda fila de la tabla."),),
    )


def _t1_pow(rng: random.Random) -> Generated:
    n = rng.randint(2, 5)
    return Generated(
        f=x**n,
        common_errors=(
            (x ** (n - 1), _FB_POW_NO_DROP),
            (Integer(n) * x**n, _FB_POW_KEEP_EXP),
        ),
    )


def _t1_kx(rng: random.Random) -> Generated:
    k = rng.randint(2, 9)
    return Generated(
        f=Integer(k) * x,
        common_errors=(
            (Integer(0), "Ojo: $kx$ no es una constante."),
            (Integer(k) * x, "Falta derivar: $kx$ cambia cuando cambia $x$."),
        ),
    )


def _t1_kpow(rng: random.Random) -> Generated:
    k = rng.randint(2, 9)
    n = rng.randint(2, 5)
    return Generated(
        f=Integer(k) * x**n,
        common_errors=(
            (Integer(k) * x ** (n - 1), _FB_POW_NO_DROP),
            (Integer(k * n) * x**n, _FB_POW_KEEP_EXP),
            (Integer(n) * x ** (n - 1), _FB_LOST_K),
        ),
    )


def _t2_sum2(rng: random.Random) -> Generated:
    a = rng.randint(2, 9)
    b = rng.randint(2, 9)
    n = rng.randint(2, 5)
    f = Integer(a) * x**n + Integer(b) * x
    return Generated(
        f=f,
        common_errors=(
            (Integer(a) * x ** (n - 1) + Integer(b), _FB_POW_NO_DROP),
            (Integer(a * n) * x**n + Integer(b) * x, _FB_POW_KEEP_EXP),
        ),
    )


def _t2_sum3(rng: random.Random) -> Generated:
    a = rng.randint(2, 9)
    b = rng.randint(2, 9)
    c = rng.randint(2, 9)
    n = rng.randint(3, 5)
    m = rng.randint(2, n - 1)
    f = Integer(a) * x**n - Integer(b) * x**m + Integer(c)
    return Generated(
        f=f,
        common_errors=(
            (sympy.diff(f, x) + Integer(c), _FB_CONST_STAYS),
            (Integer(a) * x ** (n - 1) - Integer(b) * x ** (m - 1), _FB_POW_NO_DROP),
        ),
    )


def _t2_pow_plus_const(rng: random.Random) -> Generated:
    n = rng.randint(2, 5)
    k = rng.randint(2, 9)
    f = x**n + Integer(k)
    return Generated(
        f=f,
        common_errors=(
            (sympy.diff(f, x) + Integer(k), _FB_CONST_STAYS),
            (x ** (n - 1), _FB_POW_NO_DROP),
        ),
    )


def _t3_exp(rng: random.Random) -> Generated:
    k = rng.choice([1, 1, 2, 3, 4, 5])
    f = Integer(k) * exp(x)
    return Generated(
        f=f,
        common_errors=(
            (Integer(k) * x * exp(x - 1), _FB_EXP_AS_POW),
            (Integer(0), "$e^x$ no es una constante."),
        ),
    )


def _t3_ln(rng: random.Random) -> Generated:
    k = rng.choice([1, 1, 2, 3, 5])
    f = Integer(k) * log(x)
    return Generated(
        f=f,
        common_errors=(
            (Integer(k) / x**2, _FB_LN_WRONG),
            (Integer(k) * x * log(x), _FB_LN_WRONG),
        ),
    )


def _t3_sin(rng: random.Random) -> Generated:
    k = rng.choice([1, 1, 2, 3, 4])
    f = Integer(k) * sin(x)
    return Generated(f=f, common_errors=((Integer(-k) * cos(x), _FB_SIN_SIGN),))


def _t3_cos(rng: random.Random) -> Generated:
    k = rng.choice([1, 1, 2, 3, 4])
    f = Integer(k) * cos(x)
    return Generated(f=f, common_errors=((Integer(k) * sin(x), _FB_COS_SIGN),))


def _t3_ax(rng: random.Random) -> Generated:
    a = rng.choice([2, 3, 5])
    f = Integer(a) ** x
    return Generated(
        f=f,
        common_errors=(
            (Integer(a) ** x, _FB_AX_NO_LN),
            (x * Integer(a) ** (x - 1), _FB_EXP_AS_POW),
        ),
    )


def _t3_loga(rng: random.Random) -> Generated:
    a = rng.choice([2, 3, 5, 10])
    # log(x, a) queda internamente como log(x)/log(a); la derivada 1/(x·ln a)
    # sale sola. El latex de sympy para esa forma es ilegible: se escribe a mano.
    f = log(x, a)
    return Generated(
        f=f,
        prompt_latex=rf"\log_{{{a}}}\left(x\right)",
        common_errors=(
            (Rational(1, 1) / x, _FB_LOG_NO_LN),
        ),
    )


def _t3_trig_sum(rng: random.Random) -> Generated:
    a = rng.randint(2, 6)
    b = rng.randint(2, 6)
    f = Integer(a) * sin(x) + Integer(b) * cos(x)
    return Generated(
        f=f,
        common_errors=(
            (Integer(a) * cos(x) + Integer(b) * sin(x), _FB_COS_SIGN),
            (Integer(-a) * cos(x) - Integer(b) * sin(x), _FB_SIN_SIGN),
        ),
    )


def _t3_mix_sum(rng: random.Random) -> Generated:
    k = rng.randint(2, 6)
    n = rng.randint(2, 4)
    f = exp(x) + Integer(k) * x**n
    return Generated(
        f=f,
        common_errors=(
            (x * exp(x - 1) + Integer(k * n) * x ** (n - 1), _FB_EXP_AS_POW),
            (exp(x) + Integer(k) * x ** (n - 1), _FB_POW_NO_DROP),
        ),
    )


def _t4_pow_sin(rng: random.Random) -> Generated:
    n = rng.randint(2, 4)
    u, v = x**n, sin(x)
    return Generated(f=u * v, common_errors=_product_errors(u, v))


def _t4_pow_exp(rng: random.Random) -> Generated:
    n = rng.randint(2, 4)
    u, v = x**n, exp(x)
    return Generated(f=u * v, common_errors=_product_errors(u, v))


def _t4_exp_cos(rng: random.Random) -> Generated:
    u, v = exp(x), cos(x)
    return Generated(f=u * v, common_errors=_product_errors(u, v))


def _t4_pow_ln(rng: random.Random) -> Generated:
    n = rng.randint(2, 4)
    u, v = x**n, log(x)
    return Generated(f=u * v, common_errors=_product_errors(u, v))


def _t4_exp_sin(rng: random.Random) -> Generated:
    u, v = exp(x), sin(x)
    return Generated(f=u * v, common_errors=_product_errors(u, v))


def _t5_sin_over_x(rng: random.Random) -> Generated:
    u, v = sin(x), x
    return Generated(f=u / v, common_errors=_quotient_errors(u, v))


def _t5_pow_over_linear(rng: random.Random) -> Generated:
    n = rng.randint(2, 3)
    k = rng.randint(1, 9)
    u, v = x**n, x + Integer(k)
    return Generated(f=u / v, common_errors=_quotient_errors(u, v))


def _t5_exp_over_pow(rng: random.Random) -> Generated:
    n = rng.randint(1, 3)
    u, v = exp(x), x**n
    return Generated(f=u / v, common_errors=_quotient_errors(u, v))


def _t5_ln_over_x(rng: random.Random) -> Generated:
    u, v = log(x), x
    return Generated(f=u / v, common_errors=_quotient_errors(u, v))


def _t5_linear_over_linear(rng: random.Random) -> Generated:
    a = rng.randint(1, 9)
    k = rng.randint(1, 9)
    if a == k:
        k += 1
    u, v = x + Integer(a), x + Integer(k)
    return Generated(f=u / v, common_errors=_quotient_errors(u, v))


TEMPLATES: tuple[GameTemplate, ...] = (
    GameTemplate("t0_const", 0, _t0_const),
    GameTemplate("t0_x", 0, _t0_x),
    GameTemplate("t1_pow", 1, _t1_pow),
    GameTemplate("t1_kx", 1, _t1_kx),
    GameTemplate("t1_kpow", 1, _t1_kpow),
    GameTemplate("t2_sum2", 2, _t2_sum2),
    GameTemplate("t2_sum3", 2, _t2_sum3),
    GameTemplate("t2_pow_plus_const", 2, _t2_pow_plus_const),
    GameTemplate("t3_exp", 3, _t3_exp),
    GameTemplate("t3_ln", 3, _t3_ln),
    GameTemplate("t3_sin", 3, _t3_sin),
    GameTemplate("t3_cos", 3, _t3_cos),
    GameTemplate("t3_ax", 3, _t3_ax),
    GameTemplate("t3_loga", 3, _t3_loga),
    GameTemplate("t3_trig_sum", 3, _t3_trig_sum),
    GameTemplate("t3_mix_sum", 3, _t3_mix_sum),
    GameTemplate("t4_pow_sin", 4, _t4_pow_sin, "Revisá la regla del producto: $\\left(u \\cdot v\\right)' = u'v + uv'$."),
    GameTemplate("t4_pow_exp", 4, _t4_pow_exp, "Revisá la regla del producto: $\\left(u \\cdot v\\right)' = u'v + uv'$."),
    GameTemplate("t4_exp_cos", 4, _t4_exp_cos, "Revisá la regla del producto: $\\left(u \\cdot v\\right)' = u'v + uv'$."),
    GameTemplate("t4_pow_ln", 4, _t4_pow_ln, "Revisá la regla del producto: $\\left(u \\cdot v\\right)' = u'v + uv'$."),
    GameTemplate("t4_exp_sin", 4, _t4_exp_sin, "Revisá la regla del producto: $\\left(u \\cdot v\\right)' = u'v + uv'$."),
    GameTemplate("t5_sin_over_x", 5, _t5_sin_over_x, "Revisá la regla del cociente."),
    GameTemplate("t5_pow_over_linear", 5, _t5_pow_over_linear, "Revisá la regla del cociente."),
    GameTemplate("t5_exp_over_pow", 5, _t5_exp_over_pow, "Revisá la regla del cociente."),
    GameTemplate("t5_ln_over_x", 5, _t5_ln_over_x, "Revisá la regla del cociente."),
    GameTemplate("t5_linear_over_linear", 5, _t5_linear_over_linear, "Revisá la regla del cociente."),
)

TEMPLATE_BY_KEY: dict[str, GameTemplate] = {t.key: t for t in TEMPLATES}


def latex_es(expr: sympy.Expr) -> str:
    """LaTeX de sympy en notación española (sen/tg, ln)."""
    out = sympy.latex(expr, ln_notation=True)
    out = out.replace(r"\sin", r"\operatorname{sen}")
    out = out.replace(r"\tan", r"\operatorname{tg}")
    return out
