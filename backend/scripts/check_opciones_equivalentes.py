"""Verifica el chequeo de opciones equivalentes de la regla 79 del validador.

Contexto: la regla 79 dice que dos opciones que valen lo mismo son dos
respuestas correctas. El validador ya lo chequeaba cuando las cuatro opciones
son fracciones de enteros, pero se le escapaba la otra forma del mismo defecto:
una opción que enumera varias soluciones de la misma variable denota un
CONJUNTO, y en un conjunto el orden no significa nada.

Caso real que motivó el chequeo: `white_quadratic_FORM_14` tenía
"$x = 6$ y $x = -2$" como correcta y "$x = -2$ y $x = 6$" como distractor. Quien
elegía el distractor respondía bien y el sistema lo marcaba mal. Medía 12 % de
acierto al primer intento con 37 % de intentos agotados, y un usuario lo reportó
antes de que el validador lo viera.

Lo difícil del chequeo no es encontrar el caso sino no marcar los que se le
parecen, que son mayoría en el banco. Este script fija los cuatro patrones que
NO son el defecto, para que una versión futura más agresiva no los rompa.

Uso:
    python backend/scripts/check_opciones_equivalentes.py

Determinístico, sin base de datos. Sale con código 1 si algo falla.
"""
import sys
from pathlib import Path

BACKEND = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(BACKEND / "content"))

from validate_content import _conjunto_misma_variable as firma  # noqa: E402

fallos = 0


def check(nombre: str, ok: bool, extra: str = "") -> None:
    global fallos
    print(f"  {'ok  ' if ok else 'FALLA'} {nombre} {extra}")
    if not ok:
        fallos += 1


def equivalentes(a: str, b: str) -> bool:
    fa = firma(a)
    return fa is not None and fa == firma(b)


print("marca el defecto:")
check("el caso real: el mismo conjunto de raíces permutado",
      equivalentes("$x = 6$ y $x = -2$", "$x = -2$ y $x = 6$"))
check("también con las soluciones separadas por coma",
      equivalentes("$t = 1$, $t = 4$", "$t = 4$, $t = 1$"))
check("y con decimales escritos a la argentina",
      equivalentes("$x = 0{,}5$ y $x = 2$", "$x = 2$ y $x = 0{,}5$"))

print()
print("no marca lo que sólo se le parece:")
check("variables distintas: ahí la posición ES la confusión evaluada",
      not equivalentes("$n=25$, $p=0{,}04$", "$n=0{,}04$, $p=25$"))
check("subíndices distintos: alpha_1 y alpha_2 son parámetros con papel propio",
      not equivalentes("$\\alpha_1 = 2, \\alpha_2 = 1$", "$\\alpha_1 = 1, \\alpha_2 = 2$"))
check("una anotación que las distingue (la multiplicidad de cada raíz)",
      not equivalentes("$x = 2$ (doble) y $x = -1$ (simple)",
                       "$x = 2$ (simple) y $x = -1$ (doble)"))
check("el conector, cuando disyunción y conjunción son la respuesta",
      not equivalentes("$2x+1=9$ o $2x+1=-9$", "$2x+1=9$ y $2x+1=-9$"))
check("conjuntos que de verdad son distintos (el arreglo del FORM_14)",
      not equivalentes("$x = -6$ y $x = 2$", "$x = 6$ y $x = -2$"))
check("una sola asignación no denota un conjunto",
      firma("$x = 6$") is None)
check("una opción sin asignaciones tampoco",
      firma("Ninguna de las anteriores") is None)

print()
print("todo ok" if not fallos else f"FALLARON: {fallos}")
sys.exit(1 if fallos else 0)
