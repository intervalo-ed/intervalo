"""Genera white_trigonometric LEXI lexi_12..50 (+39)."""
import json, pathlib
from collections import Counter

FILE = pathlib.Path("content/analisis-1/exercises/white_trigonometric.json")
data = json.loads(FILE.read_text(encoding="utf-8"))

def e(n, q, opts, ci, fc, exp):
    return {
        "external_id": f"white_trigonometric_lexi_{n:02d}",
        "belt": "white", "topic": "trigonometric", "exercise_type": "LEXI",
        "question": q, "options": opts, "correct_index": ci,
        "has_math": True, "feedback_correct": fc, "feedback_incorrect": "",
        "graph_fn": None, "graph_view": None,
        "explanation": exp, "reviewed": False,
    }

new = [
# 12 - imagen de sen/cos
e(12,
"¿Cuál es la imagen (recorrido) de la función $f(x) = \\operatorname{sen}(x)$?",
["$(0, +\\infty)$", "$[-1, 1]$", "$\\mathbb{R}$", "$[0, 1]$"], 1,
"Correcto. El seno oscila entre $-1$ y $1$.",
"El seno y el coseno tienen imagen $[-1, 1]$: todos sus valores están en ese intervalo cerrado."),

# 13 - período del seno
e(13,
"¿Cuál es el período de $f(x) = \\operatorname{sen}(x)$?",
["$\\pi$", "$4\\pi$", "$2\\pi$", "$\\dfrac{\\pi}{2}$"], 2,
"Correcto. El período base del seno es $2\\pi$.",
"El período es la longitud mínima de un ciclo completo. Para $\\operatorname{sen}(x)$ ese valor es $2\\pi \\approx 6{,}28$."),

# 14 - amplitud
e(14,
"En la función $f(x) = A\\,\\operatorname{sen}(x)$, ¿qué determina el parámetro $|A|$?",
["El período de la oscilación", "La amplitud (valor máximo)", "El desplazamiento horizontal", "El desplazamiento vertical"], 1,
"Correcto. $|A|$ es la amplitud: la distancia del eje al máximo.",
"La amplitud es la mitad del rango total de la función. Si $A = 3$, la función oscila entre $-3$ y $3$."),

# 15 - sen(0)
e(15,
"¿Cuánto vale $\\operatorname{sen}(0)$?",
["$1$", "$-1$", "$0$", "No está definido"], 2,
"Correcto. $\\operatorname{sen}(0) = 0$.",
"En el círculo unitario, el ángulo $0$ corresponde al punto $(1, 0)$; la coordenada $y$ es $0$."),

# 16 - cos(0)
e(16,
"¿Cuánto vale $\\cos(0)$?",
["$0$", "$-1$", "$\\dfrac{1}{2}$", "$1$"], 3,
"Correcto. $\\cos(0) = 1$.",
"En el círculo unitario, el ángulo $0$ corresponde al punto $(1, 0)$; la coordenada $x$ es $1$."),

# 17 - sen(π/2)
e(17,
"¿Cuánto vale $\\operatorname{sen}\\!\\left(\\dfrac{\\pi}{2}\\right)$?",
["$0$", "$\\dfrac{\\sqrt{2}}{2}$", "$-1$", "$1$"], 3,
"Correcto. $\\operatorname{sen}(\\pi/2) = 1$.",
"$\\pi/2$ es el ángulo de $90°$, que lleva al punto $(0, 1)$ en el círculo unitario; coordenada $y = 1$."),

# 18 - cos(π/2)
e(18,
"¿Cuánto vale $\\cos\\!\\left(\\dfrac{\\pi}{2}\\right)$?",
["$1$", "$0$", "$-1$", "$\\dfrac{\\sqrt{2}}{2}$"], 1,
"Correcto. $\\cos(\\pi/2) = 0$.",
"$\\pi/2$ lleva al punto $(0,1)$ en el círculo unitario; coordenada $x = 0$."),

# 19 - sen(π)
e(19,
"¿Cuánto vale $\\operatorname{sen}(\\pi)$?",
["$1$", "$-1$", "$0$", "Indefinido"], 2,
"Correcto. $\\operatorname{sen}(\\pi) = 0$.",
"$\\pi = 180°$ lleva al punto $(-1, 0)$; coordenada $y = 0$."),

# 20 - función par/impar
e(20,
"¿Cuál de estas afirmaciones es correcta respecto a la paridad de $\\operatorname{sen}(x)$ y $\\cos(x)$?",
["Ambas son funciones pares", "Ambas son funciones impares",
 "$\\operatorname{sen}(x)$ es impar y $\\cos(x)$ es par", "$\\operatorname{sen}(x)$ es par y $\\cos(x)$ es impar"], 2,
"Correcto. El seno es impar y el coseno es par.",
"Impar: $\\operatorname{sen}(-x) = -\\operatorname{sen}(x)$. Par: $\\cos(-x) = \\cos(x)$."),

# 21 - dominio
e(21,
"¿Cuál es el dominio de $f(x) = \\operatorname{sen}(x)$?",
["$(0, +\\infty)$", "$[-\\pi, \\pi]$", "$\\mathbb{R}$", "$[-1, 1]$"], 2,
"Correcto. El dominio del seno es todos los reales.",
"El seno está definido para cualquier ángulo real, positivo, negativo o cero."),

# 22 - período con B
e(22,
"Si $f(x) = \\operatorname{sen}(Bx)$ con $B > 0$, ¿cuál es el período de $f$?",
["$2\\pi \\cdot B$", "$\\dfrac{\\pi}{B}$", "$\\dfrac{2\\pi}{B}$", "$B \\cdot \\pi$"], 2,
"Correcto. El período es $\\dfrac{2\\pi}{B}$.",
"Al multiplicar el argumento por $B$, el ciclo se comprime: en vez de recorrer $2\\pi$, basta con $2\\pi/B$."),

# 23 - frecuencia
e(23,
"En $f(x) = \\operatorname{sen}(2x)$, ¿cuántos ciclos completos ocurren en el intervalo $[0, 2\\pi]$?",
["$1$", "$4$", "$3$", "$2$"], 3,
"Correcto. El período es $\\pi$, así que en $[0, 2\\pi]$ caben $2$ ciclos.",
"$B = 2 \\Rightarrow$ período $= \\pi$. En $2\\pi$ caben $2\\pi/\\pi = 2$ ciclos."),

# 24 - desplazamiento vertical
e(24,
"En $f(x) = \\operatorname{sen}(x) + D$, ¿qué efecto produce el parámetro $D$?",
["Cambia la amplitud", "Comprime el período", "Desplaza la gráfica verticalmente", "Refleja la curva"], 2,
"Correcto. $D$ traslada la gráfica hacia arriba o abajo.",
"La función sigue oscilando con la misma amplitud y período, pero el eje de oscilación pasa a ser $y = D$."),

# 25 - desplazamiento horizontal
e(25,
"En $f(x) = \\operatorname{sen}(x - C)$, ¿qué produce el parámetro $C > 0$?",
["Desplazamiento hacia la izquierda", "Compresión horizontal", "Desplazamiento hacia la derecha", "Reflexión"], 2,
"Correcto. $C > 0$ desplaza la gráfica hacia la derecha.",
"Restar $C$ al argumento retrasa la curva: el cero que antes estaba en $x = 0$ ahora está en $x = C$."),

# 26 - valor máximo
e(26,
"¿Cuál es el valor máximo de $f(x) = 3\\,\\operatorname{sen}(x) + 1$?",
["$3$", "$4$", "$1$", "$2$"], 1,
"Correcto. El máximo es $3 \\cdot 1 + 1 = 4$.",
"Máximo = $D + |A| = 1 + 3 = 4$."),

# 27 - valor mínimo
e(27,
"¿Cuál es el valor mínimo de $g(x) = 2\\cos(x) - 1$?",
["$-3$", "$-1$", "$1$", "$-2$"], 0,
"Correcto. El mínimo es $2 \\cdot (-1) - 1 = -3$.",
"Mínimo = $D - |A| = -1 - 2 = -3$."),

# 28 - identidad fundamental
e(28,
"¿Cuál es la identidad pitagórica fundamental de las funciones trigonométricas?",
["$\\operatorname{sen}^2(x) - \\cos^2(x) = 1$", "$\\operatorname{sen}(x) \\cdot \\cos(x) = 1$",
 "$\\operatorname{sen}^2(x) + \\cos^2(x) = 1$", "$\\operatorname{sen}(x) + \\cos(x) = 1$"], 2,
"Correcto. $\\operatorname{sen}^2(x) + \\cos^2(x) = 1$ para todo $x$.",
"Esta identidad proviene del teorema de Pitágoras aplicado al círculo unitario."),

# 29 - monotonía en [0, π/2]
e(29,
"En el intervalo $\\left[0, \\dfrac{\\pi}{2}\\right]$, $\\operatorname{sen}(x)$ es:",
["Decreciente de $1$ a $0$", "Constante en $0$", "Creciente de $0$ a $1$", "Creciente de $-1$ a $0$"], 2,
"Correcto. En ese cuadrante el seno crece de $0$ a $1$.",
"El seno sube del punto $(0,0)$ al pico $(\\pi/2, 1)$."),

# 30 - reflejo vertical
e(30,
"¿Qué diferencia hay entre $f(x) = \\operatorname{sen}(x)$ y $g(x) = -\\operatorname{sen}(x)$?",
["$g$ tiene mayor amplitud", "$g$ tiene período doble",
 "$g$ es la reflexión de $f$ respecto al eje $X$", "$g$ está desplazada hacia la derecha"], 2,
"Correcto. Multiplicar por $-1$ refleja la curva respecto al eje $X$.",
"Cada valor $y$ de $f$ se convierte en $-y$ en $g$, invirtiendo la curva verticalmente."),

# 31 - sen(π/6)
e(31,
"¿Cuánto vale $\\operatorname{sen}\\!\\left(\\dfrac{\\pi}{6}\\right)$?",
["$\\dfrac{\\sqrt{3}}{2}$", "$\\dfrac{1}{2}$", "$\\dfrac{\\sqrt{2}}{2}$", "$1$"], 1,
"Correcto. $\\operatorname{sen}(\\pi/6) = \\dfrac{1}{2}$.",
"$\\pi/6 = 30°$. El triángulo $30$-$60$-$90$ da seno = $1/2$."),

# 32 - cos(π/3)
e(32,
"¿Cuánto vale $\\cos\\!\\left(\\dfrac{\\pi}{3}\\right)$?",
["$\\dfrac{\\sqrt{3}}{2}$", "$1$", "$\\dfrac{1}{2}$", "$\\dfrac{\\sqrt{2}}{2}$"], 2,
"Correcto. $\\cos(\\pi/3) = \\dfrac{1}{2}$.",
"$\\pi/3 = 60°$. El triángulo $30$-$60$-$90$ da coseno = $1/2$."),

# 33 - periodicidad general
e(33,
"Una función $f$ es periódica con período $T$ si, para todo $x$:",
["$f(x + T) = f(x) - T$", "$f(x \\cdot T) = f(x)$", "$f(x + T) = f(x)$", "$f(x) = T$"], 2,
"Correcto. Periodicidad significa que el patrón se repite exactamente cada $T$ unidades.",
"Por definición: $f(x + T) = f(x)$ para todo $x$ en el dominio."),

# 34 - tangente
e(34,
"¿Cómo se define $\\tan(x)$ en términos de seno y coseno?",
["$\\tan(x) = \\operatorname{sen}(x) + \\cos(x)$", "$\\tan(x) = \\dfrac{\\cos(x)}{\\operatorname{sen}(x)}$",
 "$\\tan(x) = \\operatorname{sen}(x) \\cdot \\cos(x)$", "$\\tan(x) = \\dfrac{\\operatorname{sen}(x)}{\\cos(x)}$"], 3,
"Correcto. $\\tan(x) = \\dfrac{\\operatorname{sen}(x)}{\\cos(x)}$.",
"La tangente no está definida cuando $\\cos(x) = 0$, es decir en $x = \\pi/2 + k\\pi$."),

# 35 - período de cos
e(35,
"¿Cuál es el período de $f(x) = \\cos(x)$?",
["$\\pi$", "$2\\pi$", "$4\\pi$", "$\\dfrac{\\pi}{2}$"], 1,
"Correcto. El período del coseno es $2\\pi$, igual que el seno.",
"Ambas funciones completan un ciclo cada $2\\pi$ unidades en el eje $x$."),

# 36 - imagen de 2sin(x)
e(36,
"¿Cuál es la imagen de $f(x) = 2\\,\\operatorname{sen}(x)$?",
["$[-1, 1]$", "$[0, 2]$", "$[-2, 2]$", "$\\mathbb{R}$"], 2,
"Correcto. La amplitud $2$ extiende el rango a $[-2, 2]$.",
"Al multiplicar por $2$, el máximo pasa de $1$ a $2$ y el mínimo de $-1$ a $-2$."),

# 37 - función par: coseno
e(37,
"¿Por qué se dice que $\\cos(x)$ es una función par?",
["Porque su período es un número par", "Porque $\\cos(-x) = \\cos(x)$ para todo $x$",
 "Porque solo toma valores positivos", "Porque $\\cos(-x) = -\\cos(x)$"], 1,
"Correcto. La simetría respecto al eje $Y$ define la paridad.",
"Una función es par si $f(-x) = f(x)$. El coseno cumple esto porque es simétrico respecto al eje vertical."),

# 38 - intersección con eje X de sen
e(38,
"¿En qué valores de $x$ la función $f(x) = \\operatorname{sen}(x)$ cruza el eje $X$?",
["$x = \\dfrac{\\pi}{2} + k\\pi$, $k \\in \\mathbb{Z}$", "$x = k\\pi$, $k \\in \\mathbb{Z}$",
 "$x = 2k\\pi$, $k \\in \\mathbb{Z}$", "$x = \\dfrac{\\pi}{4} + k\\pi$, $k \\in \\mathbb{Z}$"], 1,
"Correcto. El seno vale $0$ en los múltiplos enteros de $\\pi$.",
"$\\operatorname{sen}(k\\pi) = 0$ para $k = 0, \\pm 1, \\pm 2, \\ldots$"),

# 39 - max de cos
e(39,
"¿En qué valores de $x$ el coseno alcanza su máximo $1$?",
["$x = \\dfrac{\\pi}{2} + 2k\\pi$, $k \\in \\mathbb{Z}$", "$x = 2k\\pi$, $k \\in \\mathbb{Z}$",
 "$x = k\\pi$, $k \\in \\mathbb{Z}$", "$x = \\dfrac{\\pi}{4} + 2k\\pi$, $k \\in \\mathbb{Z}$"], 1,
"Correcto. El coseno vale $1$ en $x = 0, \\pm 2\\pi, \\pm 4\\pi, \\ldots$",
"$\\cos(2k\\pi) = 1$ porque esos ángulos corresponden al punto $(1, 0)$ en el círculo unitario."),

# 40 - período de sin(2x)
e(40,
"¿Cuál es el período de $f(x) = \\operatorname{sen}(2x)$?",
["$4\\pi$", "$\\pi$", "$2\\pi$", "$\\dfrac{\\pi}{2}$"], 1,
"Correcto. Período $= 2\\pi / 2 = \\pi$.",
"El coeficiente $B = 2$ comprime el período a la mitad."),

# 41 - período de sin(x/2)
e(41,
"¿Cuál es el período de $g(x) = \\operatorname{sen}\\!\\left(\\dfrac{x}{2}\\right)$?",
["$\\pi$", "$2\\pi$", "$4\\pi$", "$8\\pi$"], 2,
"Correcto. $B = 1/2$, por lo tanto período $= 2\\pi / (1/2) = 4\\pi$.",
"Un $B < 1$ estira el período: el ciclo se alarga."),

# 42 - cotidiano: temperatura
e(42,
"La temperatura de una ciudad oscila entre $10°C$ y $30°C$ a lo largo del día de forma periódica. ¿Qué tipo de función describe mejor este comportamiento?",
["Lineal", "Exponencial", "Trigonométrica (seno o coseno)", "Logarítmica"], 2,
"Correcto. Las oscilaciones cíclicas son el dominio de las trigonométricas.",
"El patrón sube y baja regularmente, igual que $\\operatorname{sen}$ o $\\cos$: amplitud $= 10$, desplazamiento vertical $= 20$."),

# 43 - cotidiano: mareas
e(43,
"El nivel del mar sube y baja con las mareas cada $\\approx 12$ horas. ¿Qué función modela mejor el nivel $h(t)$?",
["$h(t) = 12t + k$", "$h(t) = A\\,\\operatorname{sen}(Bt + C) + D$", "$h(t) = e^{kt}$", "$h(t) = \\log(t)$"], 1,
"Correcto. Las mareas son periódicas con período $\\approx 12\\,\\text{h}$.",
"Una función trigonométrica con período $T = 12$ captura el sube y baja regular del nivel del mar."),

# 44 - reflexión horizontal
e(44,
"¿Qué transformación convierte $f(x) = \\operatorname{sen}(x)$ en $g(x) = \\operatorname{sen}(-x)$?",
["Desplazamiento vertical hacia abajo", "Compresión horizontal",
 "Reflexión respecto al eje $Y$", "Aumento de amplitud"], 2,
"Correcto. Reemplazar $x$ por $-x$ refleja la gráfica respecto al eje $Y$.",
"Como el seno es impar, $\\operatorname{sen}(-x) = -\\operatorname{sen}(x)$, que equivale a una reflexión respecto al eje $X$."),

# 45 - imagen de cos con desplazamiento
e(45,
"¿Cuál es la imagen de $f(x) = \\cos(x) + 3$?",
["$[-1, 1]$", "$[2, 4]$", "$[3, 4]$", "$\\mathbb{R}$"], 1,
"Correcto. El coseno va de $-1$ a $1$; sumarle $3$ da $[2, 4]$.",
"El desplazamiento vertical $+3$ traslada todo el rango: $[-1+3, 1+3] = [2, 4]$."),

# 46 - comparación periodo sen vs cos
e(46,
"Comparando $\\operatorname{sen}(x)$ y $\\cos(x)$, ¿cuál de estas afirmaciones es verdadera?",
["El coseno tiene mayor amplitud que el seno", "El seno tiene período $2\\pi$ y el coseno período $\\pi$",
 "Ambas tienen el mismo período $2\\pi$ y la misma amplitud $1$", "Son la misma función"], 2,
"Correcto. Difieren solo en el desfase: $\\cos(x) = \\operatorname{sen}(x + \\pi/2)$.",
"Ambas oscilan entre $-1$ y $1$ con período $2\\pi$; el coseno equivale al seno adelantado $\\pi/2$."),

# 47 - monotonía cos en [0, π]
e(47,
"En el intervalo $[0, \\pi]$, $\\cos(x)$ es:",
["Creciente de $-1$ a $1$", "Constante en $0$", "Creciente de $0$ a $1$", "Decreciente de $1$ a $-1$"], 3,
"Correcto. En $[0, \\pi]$ el coseno baja de $1$ a $-1$.",
"El coseno empieza en su máximo $\\cos(0) = 1$ y decrece continuamente hasta $\\cos(\\pi) = -1$."),

# 48 - sin vs cos desfase
e(48,
"¿Cuál es la relación entre $\\operatorname{sen}(x)$ y $\\cos(x)$ como desfase?",
["$\\cos(x) = \\operatorname{sen}\\!\\left(x - \\dfrac{\\pi}{2}\\right)$",
 "$\\cos(x) = \\operatorname{sen}\\!\\left(x + \\dfrac{\\pi}{2}\\right)$",
 "$\\cos(x) = 2\\,\\operatorname{sen}(x)$",
 "$\\cos(x) = \\operatorname{sen}(x + \\pi)$"], 1,
"Correcto. $\\cos(x) = \\operatorname{sen}(x + \\pi/2)$.",
"El coseno es el seno adelantado $\\pi/2$ unidades: su máximo ocurre en $x = 0$, mientras que el del seno ocurre en $x = \\pi/2$."),

# 49 - función sin raíces
e(49,
"¿La función $f(x) = \\operatorname{sen}(x) + 2$ tiene raíces reales?",
["Sí, en $x = k\\pi$", "Sí, en $x = \\pi/2 + 2k\\pi$", "No, porque su imagen es $[1, 3]$", "Sí, en $x = -\\pi/2 + 2k\\pi$"], 2,
"Correcto. Si la imagen no incluye $0$, la función no tiene raíces.",
"$\\operatorname{sen}(x) + 2 \\geq 1 > 0$ para todo $x$: la curva nunca toca el eje $X$."),

# 50 - amplitud negativa
e(50,
"En $f(x) = -3\\,\\cos(x)$, ¿cuál es la amplitud de la función?",
["$-3$", "$3$", "$6$", "$\\dfrac{1}{3}$"], 1,
"Correcto. La amplitud es $|{-3}| = 3$.",
"La amplitud siempre es el valor absoluto del coeficiente: $|A| = 3$. El signo negativo solo refleja la curva."),
]

assert len(new) == 39, f"Esperados 39, obtenidos {len(new)}"

ids_existing = {e["external_id"] for e in data}
for ex in new:
    assert ex["external_id"] not in ids_existing, f"Duplicado: {ex['external_id']}"

data.extend(new)
FILE.write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding="utf-8")
print(f"Total: {len(data)}")
print("Por skill:", dict(Counter(e["exercise_type"] for e in data)))
assert all(e["feedback_incorrect"] == "" for e in data)
lexi = [e for e in data if e["exercise_type"] == "LEXI"]
assert len(lexi) == 50, f"LEXI={len(lexi)}"
print("LEXI OK. gen_trig_lexi.py completo.")
