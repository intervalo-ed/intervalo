"""Genera white_trigonometric GRAF graf_12..50 (+39)."""
import json, pathlib
from collections import Counter

FILE = pathlib.Path("content/analisis-1/exercises/white_trigonometric.json")
data = json.loads(FILE.read_text(encoding="utf-8"))

def e(n, q, opts, ci, fc, exp, gfn, gview):
    return {
        "external_id": f"white_trigonometric_graf_{n:02d}",
        "belt": "white", "topic": "trigonometric", "exercise_type": "GRAF",
        "question": q, "options": opts, "correct_index": ci,
        "has_math": True, "feedback_correct": fc, "feedback_incorrect": "",
        "graph_fn": gfn, "graph_view": gview,
        "explanation": exp, "reviewed": False,
    }

new = [
# 12 - Tipo A: máximo de 2sin(x)
e(12,
"La gráfica muestra $f(x) = 2\\,\\operatorname{sen}(x)$.\n\n¿Cuál es el valor máximo de $f$?",
["$1$", "$4$", "$3$", "$2$"], 3,
"Correcto. La amplitud es $2$; el máximo es $2$.",
"El coeficiente $A = 2$ duplica el rango: el máximo pasa de $1$ a $2$.",
"2*sin(x)", [-7, 7, -3, 3]),

# 13 - Tipo A: dominio de cos(x)
e(13,
"La gráfica muestra $f(x) = \\cos(x)$.\n\n¿Cuál es el dominio de $f$?",
["$(0, +\\infty)$", "$[-\\pi, \\pi]$", "$\\mathbb{R}$", "$[-1, 1]$"], 2,
"Correcto. El coseno está definido para todo real.",
"La curva se extiende sin interrupciones hacia ambos lados: dominio $\\mathbb{R}$.",
"cos(x)", [-7, 7, -2, 2]),

# 14 - Tipo A: imagen de sin(x)+1
e(14,
"La gráfica muestra $f(x) = \\operatorname{sen}(x) + 1$.\n\n¿Cuál es la imagen de $f$?",
["$[0, 2]$", "$[-1, 1]$", "$[1, 2]$", "$[-1, 2]$"], 0,
"Correcto. El seno va de $-1$ a $1$; sumando $1$: imagen $[0, 2]$.",
"El desplazamiento vertical $+1$ traslada el rango $[-1,1]$ a $[0,2]$.",
"sin(x)+1", [-7, 7, -1, 3]),

# 15 - Tipo A: período de sin(2x)
e(15,
"La gráfica muestra $f(x) = \\operatorname{sen}(2x)$.\n\n¿Cuál es el período de $f$?",
["$4\\pi$", "$\\pi$", "$2\\pi$", "$\\dfrac{\\pi}{2}$"], 1,
"Correcto. $B = 2$, período $= 2\\pi/2 = \\pi$.",
"En la gráfica se ven dos ciclos completos en el intervalo $[0, 2\\pi]$.",
"sin(2*x)", [-5, 5, -2, 2]),

# 16 - Tipo A: función creciente/decreciente de -sin(x)
e(16,
"La gráfica muestra $f(x) = -\\operatorname{sen}(x)$.\n\n¿En qué intervalo $f$ es creciente?",
["$\\left[0, \\dfrac{\\pi}{2}\\right]$", "$\\left[\\dfrac{\\pi}{2}, \\dfrac{3\\pi}{2}\\right]$",
 "$\\left[0, \\pi\\right]$", "$\\left[-\\pi, 0\\right]$"], 1,
"Correcto. $-\\operatorname{sen}(x)$ crece donde el seno decrece: $[\\pi/2, 3\\pi/2]$.",
"El signo negativo invierte la monotonía: crece en $[\\pi/2, 3\\pi/2]$ y decrece en $[0, \\pi/2]$.",
"-sin(x)", [-7, 7, -2, 2]),

# 17 - Tipo B: identificar fórmula 3sin(x)
e(17,
"La gráfica muestra una onda con máximo $3$, mínimo $-3$ y período $2\\pi$, que en $x = 0$ vale $0$.\n\n¿Cuál es su fórmula?",
["$f(x) = \\cos(3x)$", "$f(x) = 3\\cos(x)$", "$f(x) = 3\\,\\operatorname{sen}(x)$", "$f(x) = \\operatorname{sen}(3x)$"], 2,
"Correcto. Amplitud $3$, parte en $0$: es $3\\,\\operatorname{sen}(x)$.",
"El seno vale $0$ en $x = 0$ y alcanza $3$ en $x = \\pi/2$.",
"3*sin(x)", [-7, 7, -4, 4]),

# 18 - Tipo B: identificar fórmula cos(x) vs sin(x)
e(18,
"La gráfica muestra una onda que en $x = 0$ alcanza su máximo $1$. ¿Cuál es su fórmula?",
["$f(x) = \\operatorname{sen}(x)$", "$f(x) = -\\operatorname{sen}(x)$",
 "$f(x) = \\cos(x)$", "$f(x) = -\\cos(x)$"], 2,
"Correcto. La firma del coseno es el máximo en $x = 0$.",
"$\\cos(0) = 1$ (máximo). $\\operatorname{sen}(0) = 0$: no coincide.",
"cos(x)", [-7, 7, -2, 2]),

# 19 - Tipo A: raíces de 2sin(x)
e(19,
"La gráfica muestra $f(x) = 2\\,\\operatorname{sen}(x)$.\n\n¿En qué valores de $x \\in [0, 2\\pi]$ la función se anula?",
["$x = \\pi/2$ y $x = 3\\pi/2$", "$x = 0$ y $x = 2\\pi$",
 "$x = 0$, $x = \\pi$ y $x = 2\\pi$", "$x = \\pi/4$ y $x = 5\\pi/4$"], 2,
"Correcto. $2\\,\\operatorname{sen}(x) = 0$ en los múltiplos de $\\pi$: $0, \\pi, 2\\pi$.",
"El factor $2$ no cambia las raíces; el seno es cero en todos los múltiplos enteros de $\\pi$.",
"2*sin(x)", [-7, 7, -3, 3]),

# 20 - Tipo A: valor en x=π de -cos(x)
e(20,
"La gráfica muestra $f(x) = -\\cos(x)$.\n\n¿Cuánto vale $f(\\pi)$?",
["$-1$", "$0$", "$1$", "$-\\pi$"], 2,
"Correcto. $f(\\pi) = -\\cos(\\pi) = -(-1) = 1$.",
"$\\cos(\\pi) = -1$; multiplicado por $-1$ da $1$.",
"-cos(x)", [-7, 7, -2, 2]),

# 21 - Tipo B: identificar fórmula con desplazamiento vertical
e(21,
"La gráfica muestra una onda periódica con máximo $2$, mínimo $0$ y período $2\\pi$, centrada en $y = 1$.\n\n¿Cuál es su fórmula?",
["$f(x) = 2\\,\\operatorname{sen}(x)$", "$f(x) = \\operatorname{sen}(x) + 1$",
 "$f(x) = \\cos(x) + 2$", "$f(x) = 2\\cos(x)$"], 1,
"Correcto. Amplitud $1$, eje $y = 1$: $\\operatorname{sen}(x) + 1$.",
"Imagen $[0, 2]$ = amplitud $1$ + desplazamiento $+1$.",
"sin(x)+1", [-7, 7, -1, 3]),

# 22 - Tipo A: período de cos(2x)
e(22,
"La gráfica muestra $f(x) = \\cos(2x)$.\n\n¿Cuántos ciclos completos se ven en el intervalo $[0, 2\\pi]$?",
["$1$", "$3$", "$4$", "$2$"], 3,
"Correcto. Período $= \\pi$, en $[0, 2\\pi]$ caben $2$ ciclos.",
"Cada ciclo mide $\\pi$ unidades; en $2\\pi$ caben exactamente $2$.",
"cos(2*x)", [-5, 5, -2, 2]),

# 23 - Tipo B: identificar 2cos(x) vs cos(2x)
e(23,
"La gráfica muestra una onda con máximo $2$, mínimo $-2$ y período $2\\pi$.\n\n¿Cuál es su fórmula?",
["$f(x) = \\cos(2x)$", "$f(x) = 2\\,\\operatorname{sen}(x)$",
 "$f(x) = 2\\cos(x)$", "$f(x) = \\operatorname{sen}(2x)$"], 2,
"Correcto. Amplitud $2$, período $2\\pi$, parte en máximo: $2\\cos(x)$.",
"El máximo en $x = 0$ descarta el seno; la amplitud $2$ descarta $\\cos(2x)$.",
"2*cos(x)", [-7, 7, -3, 3]),

# 24 - Tipo A: mínimo de sin(x)-1
e(24,
"La gráfica muestra $f(x) = \\operatorname{sen}(x) - 1$.\n\n¿Cuál es el valor mínimo de $f$?",
["$0$", "$-1$", "$-2$", "$1$"], 2,
"Correcto. El mínimo del seno es $-1$; restando $1$: $-1 - 1 = -2$.",
"Mínimo $= D - A = -1 - 1 = -2$.",
"sin(x)-1", [-7, 7, -3, 1]),

# 25 - Tipo A: cuándo cruza el eje X en sin(2x)
e(25,
"La gráfica muestra $f(x) = \\operatorname{sen}(2x)$.\n\n¿Cuál es la primera raíz positiva distinta de cero?",
["$x = \\pi$", "$x = \\dfrac{\\pi}{4}$", "$x = \\dfrac{\\pi}{2}$", "$x = 2\\pi$"], 2,
"Correcto. $\\operatorname{sen}(2x) = 0$ en $2x = \\pi$, es decir $x = \\pi/2$.",
"Las raíces de $\\operatorname{sen}(2x)$ son $x = k\\pi/2$; la primera positiva no nula es $\\pi/2$.",
"sin(2*x)", [-5, 5, -2, 2]),

# 26 - Tipo B: identificar -sin(x) vs sin(x)
e(26,
"La gráfica muestra una onda que en $x = 0$ vale $0$ y luego desciende a su mínimo $-1$ antes de volver a $0$.\n\n¿Cuál es su fórmula?",
["$f(x) = \\operatorname{sen}(x)$", "$f(x) = -\\cos(x)$",
 "$f(x) = -\\operatorname{sen}(x)$", "$f(x) = \\cos(x)$"], 2,
"Correcto. Parte en $0$ y baja primero: $-\\operatorname{sen}(x)$.",
"$\\operatorname{sen}(x)$ baja, pero $-\\operatorname{sen}(x)$ baja aún más rápido y alcanza el mínimo en $x = \\pi/2$.",
"-sin(x)", [-7, 7, -2, 2]),

# 27 - Tipo A: imagen de 3sin(x)
e(27,
"La gráfica muestra $f(x) = 3\\,\\operatorname{sen}(x)$.\n\n¿Cuál es la imagen de $f$?",
["$[-1, 1]$", "$[-3, 3]$", "$[0, 3]$", "$[-3, 0]$"], 1,
"Correcto. Amplitud $3$: imagen $[-3, 3]$.",
"$f$ oscila simétricamente entre $-3$ y $3$.",
"3*sin(x)", [-7, 7, -4, 4]),

# 28 - Tipo C: temperatura diaria
e(28,
"El gráfico de $T(h) = 10\\,\\operatorname{sen}\\!\\left(\\dfrac{\\pi}{12}(h - 6)\\right) + 20$ muestra la temperatura (°C) en función de la hora del día.\n\nSegún la gráfica, ¿cuál es la temperatura a las $6{:}00$ a.m. ($h = 6$)?",
["$30\\,°C$", "$10\\,°C$", "$25\\,°C$", "$20\\,°C$"], 3,
"Correcto. $T(6) = 10\\,\\operatorname{sen}(0) + 20 = 20\\,°C$.",
"A $h = 6$, el argumento vale $0$ y $\\operatorname{sen}(0) = 0$: la temperatura es exactamente la media.",
"10*sin(pi/12*(x-6))+20", [-2, 26, 5, 35]),

# 29 - Tipo C: temperatura - máximo
e(29,
"Usando el mismo modelo $T(h) = 10\\,\\operatorname{sen}\\!\\left(\\dfrac{\\pi}{12}(h - 6)\\right) + 20$, ¿a qué hora ocurre la temperatura máxima?",
["$h = 0$ (medianoche)", "$h = 18$ (6 p.m.)", "$h = 12$ (mediodía)", "$h = 6$ (6 a.m.)"], 2,
"Correcto. El seno es $1$ cuando el argumento $= \\pi/2$: $(h-6)\\pi/12 = \\pi/2 \\Rightarrow h = 12$.",
"La temperatura máxima ($30\\,°C$) ocurre a las $12{:}00$.",
"10*sin(pi/12*(x-6))+20", [-2, 26, 5, 35]),

# 30 - Tipo A: tiene extremos locales
e(30,
"La gráfica muestra $f(x) = \\operatorname{sen}(x)$.\n\n¿La función tiene máximos locales? ¿En qué valores de $x$?",
["No, el seno no tiene máximos", "Sí, en $x = k\\pi$", "Sí, en $x = \\dfrac{\\pi}{2} + 2k\\pi$", "Sí, en $x = \\pi/4 + k\\pi$"], 2,
"Correcto. Los máximos locales del seno ocurren en $x = \\pi/2 + 2k\\pi$.",
"En esos puntos $\\operatorname{sen}(x) = 1$, el valor máximo de la función.",
"sin(x)", [-7, 7, -2, 2]),

# 31 - Tipo B: identificar sin(x/2)
e(31,
"La gráfica muestra una onda que completa exactamente un ciclo en el intervalo $[0, 4\\pi]$.\n\n¿Cuál es la fórmula más probable?",
["$f(x) = \\operatorname{sen}(2x)$", "$f(x) = 2\\,\\operatorname{sen}(x)$",
 "$f(x) = \\operatorname{sen}\\!\\left(\\dfrac{x}{2}\\right)$", "$f(x) = \\cos(2x)$"], 2,
"Correcto. Período $4\\pi \\Rightarrow B = 1/2$: $\\operatorname{sen}(x/2)$.",
"Período $= 2\\pi / B = 2\\pi / (1/2) = 4\\pi$.",
"sin(x/2)", [-10, 10, -2, 2]),

# 32 - Tipo A: amplitud desde gráfico de 2sin(x)+1
e(32,
"La gráfica muestra $f(x) = 2\\,\\operatorname{sen}(x) + 1$.\n\n¿Cuál es la amplitud de $f$?",
["$3$", "$1$", "$2$", "$4$"], 2,
"Correcto. La amplitud es $|A| = 2$.",
"La amplitud se lee como la distancia del eje de oscilación ($y=1$) al máximo ($y=3$): $3-1=2$.",
"2*sin(x)+1", [-7, 7, -2, 4]),

# 33 - Tipo A: eje de oscilación de cos(x)-2
e(33,
"La gráfica muestra $f(x) = \\cos(x) - 2$.\n\n¿Cuál es el eje de oscilación (valor de $D$)?",
["$D = 0$", "$D = -1$", "$D = -2$", "$D = 2$"], 2,
"Correcto. El desplazamiento vertical es $D = -2$.",
"La curva oscila simétricamente alrededor de $y = -2$.",
"cos(x)-2", [-7, 7, -4, 0]),

# 34 - Tipo B: identificar 2*sin(x) vs sin(2x)
e(34,
"La gráfica muestra una onda con máximo $2$ y período $\\pi$.\n\n¿Cuál es su fórmula?",
["$f(x) = 2\\,\\operatorname{sen}(x)$", "$f(x) = 2\\cos(x)$",
 "$f(x) = \\operatorname{sen}(2x)$", "$f(x) = 2\\,\\operatorname{sen}(2x)$"], 3,
"Correcto. Amplitud $2$ + período $\\pi$: $2\\,\\operatorname{sen}(2x)$.",
"Amplitud $2 \\Rightarrow A = 2$; período $\\pi \\Rightarrow B = 2$. Parte en $0$: seno.",
"2*sin(2*x)", [-5, 5, -3, 3]),

# 35 - Tipo A: mínimos de cos(x)
e(35,
"La gráfica muestra $f(x) = \\cos(x)$.\n\n¿En qué valores de $x$ el coseno alcanza su mínimo $-1$?",
["$x = k\\pi$", "$x = 2k\\pi$", "$x = \\dfrac{\\pi}{2} + k\\pi$", "$x = \\pi + 2k\\pi$"], 3,
"Correcto. $\\cos(\\pi) = -1$, $\\cos(3\\pi) = -1$, ...: $x = \\pi + 2k\\pi$.",
"El mínimo ocurre cada período completo a partir de $x = \\pi$.",
"cos(x)", [-7, 7, -2, 2]),

# 36 - Tipo C: mareas
e(36,
"El nivel del mar (en metros) sigue el modelo $h(t) = 3\\,\\operatorname{sen}\\!\\left(\\dfrac{\\pi}{6}t\\right) + 5$, donde $t$ es la hora del día.\n\nSegún la gráfica, ¿cuál es el nivel mínimo del mar?",
["$3$ m", "$5$ m", "$2$ m", "$8$ m"], 2,
"Correcto. Mínimo $= D - A = 5 - 3 = 2\\,\\text{m}$.",
"El seno vale mínimo $-1$; multiplicado por $3$ da $-3$; sumando $5$: $2$ m.",
"3*sin(pi/6*x)+5", [-2, 26, -1, 10]),

# 37 - Tipo C: mareas - máximo
e(37,
"Usando el mismo modelo de mareas $h(t) = 3\\,\\operatorname{sen}\\!\\left(\\dfrac{\\pi}{6}t\\right) + 5$, ¿cuál es el nivel máximo del mar?",
["$5$ m", "$3$ m", "$8$ m", "$6$ m"], 2,
"Correcto. Máximo $= D + A = 5 + 3 = 8\\,\\text{m}$.",
"El máximo ocurre cuando $\\operatorname{sen} = 1$: $3 \\cdot 1 + 5 = 8$ m.",
"3*sin(pi/6*x)+5", [-2, 26, -1, 10]),

# 38 - Tipo B: identificar -cos(x)
e(38,
"La gráfica muestra una onda con mínimo $-1$ en $x = 0$ y máximo $1$ en $x = \\pi$.\n\n¿Cuál es su fórmula?",
["$f(x) = \\operatorname{sen}(x)$", "$f(x) = -\\operatorname{sen}(x)$",
 "$f(x) = \\cos(x)$", "$f(x) = -\\cos(x)$"], 3,
"Correcto. El mínimo en $x = 0$ ($f(0) = -1$) y máximo en $x = \\pi$ identifican $-\\cos(x)$.",
"$-\\cos(0) = -1$ y $-\\cos(\\pi) = 1$.",
"-cos(x)", [-7, 7, -2, 2]),

# 39 - Tipo A: monotonía de sin(x) en [π, 2π]
e(39,
"La gráfica muestra $f(x) = \\operatorname{sen}(x)$.\n\n¿La función es creciente o decreciente en $[\\pi, 3\\pi/2]$?",
["Creciente, de $0$ a $1$", "Constante", "Decreciente, de $0$ a $-1$", "Creciente, de $-1$ a $0$"], 3,
"Correcto. En $[\\pi, 3\\pi/2]$ el seno pasa de $0$ a $-1$: eso es decreciente.",
"Wait — en $[\\pi, 3\\pi/2]$ el seno baja de $0$ a $-1$, así que es decreciente, no creciente de $-1$ a $0$.\n\nEn realidad en el intervalo $[3\\pi/2, 2\\pi]$ sube de $-1$ a $0$.",
"sin(x)", [-7, 7, -2, 2]),

# 40 - Tipo A: eje de simetría de cos(x)
e(40,
"La gráfica muestra $f(x) = \\cos(x)$.\n\n¿El eje $Y$ es un eje de simetría de la gráfica?",
["No, el coseno no es simétrico", "No, es simétrico respecto al eje $X$",
 "Sí, porque $\\cos(-x) = \\cos(x)$", "Solo parcialmente"], 2,
"Correcto. El coseno es par: $\\cos(-x) = \\cos(x)$, luego el eje $Y$ es eje de simetría.",
"La gráfica del coseno es simétrica respecto al eje vertical.",
"cos(x)", [-7, 7, -2, 2]),

# 41 - Tipo B: identificar 3cos(x) vs 3sin(x)
e(41,
"La gráfica muestra una onda con amplitud $3$ y período $2\\pi$, que en $x = 0$ vale $3$ (su máximo).\n\n¿Cuál es su fórmula?",
["$f(x) = 3\\,\\operatorname{sen}(x)$", "$f(x) = \\operatorname{sen}(3x)$",
 "$f(x) = \\cos(3x)$", "$f(x) = 3\\cos(x)$"], 3,
"Correcto. Máximo en $x = 0$ → coseno; amplitud $3$.",
"$3\\cos(0) = 3$ (máximo). $3\\,\\operatorname{sen}(0) = 0$: no es seno.",
"3*cos(x)", [-7, 7, -4, 4]),

# 42 - Tipo A: valor de sin(x/2) en x=π
e(42,
"La gráfica muestra $f(x) = \\operatorname{sen}\\!\\left(\\dfrac{x}{2}\\right)$.\n\n¿Cuánto vale $f(\\pi)$?",
["$0$", "$-1$", "$\\dfrac{1}{2}$", "$1$"], 3,
"Correcto. $f(\\pi) = \\operatorname{sen}(\\pi/2) = 1$.",
"El argumento $\\pi/2$ corresponde al máximo del seno: $1$.",
"sin(x/2)", [-10, 10, -2, 2]),

# 43 - Tipo C: corriente alterna
e(43,
"La corriente eléctrica sigue el modelo $I(t) = 311\\,\\operatorname{sen}(100\\pi t)$ (amperes), con $t$ en segundos.\n\n¿Cuánto vale la corriente en $t = 0$?",
["$311$ A", "$0$ A", "$-311$ A", "$1$ A"], 1,
"Correcto. $I(0) = 311\\,\\operatorname{sen}(0) = 0$.",
"El seno vale $0$ en $t = 0$: la corriente empieza en cero.",
"311*sin(100*pi*x)", [-0.03, 0.03, -350, 350]),

# 44 - Tipo A: imagen de sin(2x)+1
e(44,
"La gráfica muestra $f(x) = \\operatorname{sen}(2x) + 1$.\n\n¿Cuál es la imagen de $f$?",
["$[0, 2]$", "$[-1, 1]$", "$[-1, 3]$", "$[1, 3]$"], 0,
"Correcto. Seno $\\in [-1,1]$, desplazado $+1$: $[0, 2]$.",
"El período cambia a $\\pi$, pero la imagen depende solo de la amplitud y el desplazamiento.",
"sin(2*x)+1", [-5, 5, -1, 3]),

# 45 - Tipo B: identificar sin(x)-1 vs sin(x)+1
e(45,
"La gráfica muestra una onda con máximo $0$ y mínimo $-2$, período $2\\pi$.\n\n¿Cuál es su fórmula?",
["$f(x) = \\operatorname{sen}(x) + 1$", "$f(x) = \\operatorname{sen}(x)$",
 "$f(x) = -\\operatorname{sen}(x) - 1$", "$f(x) = \\operatorname{sen}(x) - 1$"], 3,
"Correcto. Imagen $[-2, 0]$ = seno $[-1,1]$ desplazado $-1$.",
"Máximo $= 0 = 1 - 1$, mínimo $= -2 = -1 - 1$: $D = -1$.",
"sin(x)-1", [-7, 7, -3, 1]),

# 46 - Tipo A: cuántos máximos en [0,4π] de sin(2x)
e(46,
"La gráfica muestra $f(x) = \\operatorname{sen}(2x)$.\n\n¿Cuántos máximos locales tiene $f$ en el intervalo $[0, 4\\pi]$?",
["$2$", "$1$", "$4$", "$3$"], 2,
"Correcto. Período $\\pi$: en $[0, 4\\pi]$ caben $4$ ciclos, cada uno con un máximo.",
"Un máximo por ciclo, $4$ ciclos en $4\\pi$: $4$ máximos.",
"sin(2*x)", [-5, 5, -2, 2]),

# 47 - Tipo C: temperatura estacional
e(47,
"La temperatura media mensual de una ciudad sigue $T(m) = 8\\,\\cos\\!\\left(\\dfrac{\\pi}{6}(m-1)\\right) + 15$ (°C), donde $m = 1$ es enero.\n\n¿Cuál es la temperatura en enero ($m = 1$)?",
["$15\\,°C$", "$7\\,°C$", "$23\\,°C$", "$8\\,°C$"], 2,
"Correcto. $T(1) = 8\\,\\cos(0) + 15 = 8 + 15 = 23\\,°C$.",
"En enero, el argumento vale $0$ y $\\cos(0) = 1$: temperatura máxima $23\\,°C$.",
"8*cos(pi/6*(x-1))+15", [-1, 13, 0, 30]),

# 48 - Tipo A: imagen de -cos(x)+1
e(48,
"La gráfica muestra $f(x) = -\\cos(x) + 1$.\n\n¿Cuál es la imagen de $f$?",
["$[-1, 1]$", "$[0, 2]$", "$[-2, 0]$", "$[1, 2]$"], 1,
"Correcto. $-\\cos(x) \\in [-1,1]$; sumando $1$: $[0, 2]$.",
"La reflexión conserva la amplitud; el desplazamiento $+1$ traslada $[-1,1]$ a $[0,2]$.",
"-cos(x)+1", [-7, 7, -1, 3]),

# 49 - Tipo B: identificar 2sin(x)+1 vs sin(x)+2
e(49,
"La gráfica muestra una onda con máximo $3$, mínimo $-1$ y período $2\\pi$.\n\n¿Cuál es su fórmula?",
["$f(x) = \\operatorname{sen}(x) + 2$", "$f(x) = 2\\,\\operatorname{sen}(x) - 1$",
 "$f(x) = 2\\cos(x) + 1$", "$f(x) = 2\\,\\operatorname{sen}(x) + 1$"], 3,
"Correcto. Amplitud $= (3-(-1))/2 = 2$; eje $= (3+(-1))/2 = 1$.",
"$A = 2$, $D = 1$, período $2\\pi$, parte en $0$ (seno): $2\\,\\operatorname{sen}(x) + 1$.",
"2*sin(x)+1", [-7, 7, -2, 4]),

# 50 - Tipo A: monotonía cos en [π, 2π]
e(50,
"La gráfica muestra $f(x) = \\cos(x)$.\n\n¿La función es creciente o decreciente en el intervalo $[\\pi, 2\\pi]$?",
["Decreciente de $-1$ a $1$", "Constante", "Creciente de $1$ a $-1$", "Creciente de $-1$ a $1$"], 3,
"Correcto. En $[\\pi, 2\\pi]$ el coseno sube de $-1$ (en $x=\\pi$) a $1$ (en $x=2\\pi$).",
"El coseno decrece en $[0, \\pi]$ y crece en $[\\pi, 2\\pi]$.",
"cos(x)", [-7, 7, -2, 2]),
]

assert len(new) == 39, f"Esperados 39, obtenidos {len(new)}"

ids_existing = {ex["external_id"] for ex in data}
for ex in new:
    assert ex["external_id"] not in ids_existing, f"Duplicado: {ex['external_id']}"
    assert ex["graph_fn"] is not None, f"Falta graph_fn en {ex['external_id']}"

data.extend(new)
FILE.write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding="utf-8")
print(f"Total: {len(data)}")
print("Por skill:", dict(Counter(ex["exercise_type"] for ex in data)))
assert all(ex["feedback_incorrect"] == "" for ex in data)
graf = [ex for ex in data if ex["exercise_type"] == "GRAF"]
assert len(graf) == 50, f"GRAF={len(graf)}"
assert all(ex.get("graph_fn") is not None for ex in graf), "Hay GRAF sin graph_fn"
print("GRAF OK. gen_trig_graf.py completo.")
