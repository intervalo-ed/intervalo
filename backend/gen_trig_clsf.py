"""Genera white_trigonometric CLSF clsf_15..50 (+36)."""
import json, pathlib
from collections import Counter

FILE = pathlib.Path("content/analisis-1/exercises/white_trigonometric.json")
data = json.loads(FILE.read_text(encoding="utf-8"))

def e(n, q, opts, ci, fc, exp, gfn=None, gview=None):
    return {
        "external_id": f"white_trigonometric_clsf_{n:02d}",
        "belt": "white", "topic": "trigonometric", "exercise_type": "CLSF",
        "question": q, "options": opts, "correct_index": ci,
        "has_math": True, "feedback_correct": fc, "feedback_incorrect": "",
        "graph_fn": gfn, "graph_view": gview,
        "explanation": exp, "reviewed": False,
    }

new = [
# 15 - desde fórmula 2sin(x)
e(15,
"¿A qué familia pertenece $f(x) = 2\\,\\operatorname{sen}(x)$?",
["Lineal", "Cuadrática", "Trigonométrica", "Exponencial"], 2,
"Correcto. Es una función seno con amplitud $2$.",
"Cualquier múltiplo de $\\operatorname{sen}$ o $\\cos$ sigue siendo una función trigonométrica periódica."),

# 16 - desde fórmula cos con desfase
e(16,
"¿A qué familia pertenece $g(x) = \\cos\\!\\left(x - \\dfrac{\\pi}{2}\\right)$?",
["Trigonométrica", "Logarítmica", "Racional", "Polinomial"], 0,
"Correcto. Es una función coseno con desfase horizontal.",
"El desfase no cambia la familia: sigue siendo periódica y trigonométrica."),

# 17 - cotidiano mareas
e(17,
"El nivel del mar en un puerto sube y baja de manera repetida cada $12{,}4$ horas. ¿Qué función modela mejor el nivel $h(t)$?",
["$h(t) = 12{,}4\\,t + k$", "$h(t) = A\\,\\operatorname{sen}(Bt) + D$", "$h(t) = e^{kt}$", "$h(t) = \\log(t)$"], 1,
"Correcto. El comportamiento cíclico con período fijo se modela con trigonométricas.",
"Las mareas tienen período $\\approx 12{,}4$ horas: amplitud, período y desplazamiento quedan determinados por $A$, $B$ y $D$."),

# 18 - cotidiano temperatura diaria
e(18,
"La temperatura de una ciudad varía entre $10\\,°C$ y $30\\,°C$ siguiendo un ciclo de $24$ horas. ¿Qué tipo de función describe mejor esta variación?",
["Lineal", "Cuadrática", "Exponencial", "Trigonométrica"], 3,
"Correcto. La variación periódica con ciclo fijo es característica de las trigonométricas.",
"El patrón sube y baja regularmente: amplitud $= 10$, eje $y = 20$, período $= 24\\,\\text{h}$."),

# 19 - desde fórmula sin(2x)
e(19,
"¿A qué familia pertenece $h(x) = \\operatorname{sen}(2x)$?",
["Exponencial", "Trigonométrica", "Logarítmica", "Lineal"], 1,
"Correcto. Es una función seno con período $\\pi$ (comprimida al doble).",
"Multiplicar el argumento por $2$ comprime el período, pero la función sigue siendo trigonométrica."),

# 20 - desde gráfico: onda creciente/decreciente sin(x)+1 (con graph_fn)
e(20,
"La gráfica muestra una onda periódica centrada en $y = 1$ que oscila entre $0$ y $2$.\n\n¿A qué familia pertenece?",
["Cuadrática", "Exponencial", "Racional", "Trigonométrica"], 3,
"Correcto. La periodicidad y la oscilación acotada indican una función trigonométrica.",
"La curva sube y baja con amplitud $1$ alrededor de $y = 1$: esto es $\\operatorname{sen}(x) + 1$.",
"sin(x)+1", [-7, 7, -1, 3]),

# 21 - desde gráfico: 2sin(x) (con graph_fn)
e(21,
"La gráfica muestra una onda simétrica respecto al eje $X$, con máximo $2$ y mínimo $-2$.\n\n¿A qué familia pertenece?",
["Trigonométrica", "Lineal", "Cuadrática", "Logarítmica"], 0,
"Correcto. La onda periódica con imagen $[-2, 2]$ es una función trigonométrica.",
"La amplitud $2$ sugiere $f(x) = 2\\,\\operatorname{sen}(x)$.",
"2*sin(x)", [-7, 7, -3, 3]),

# 22 - desde fórmula -cos(x)
e(22,
"¿A qué familia pertenece $p(x) = -\\cos(x)$?",
["Racional", "Exponencial", "Trigonométrica", "Logarítmica"], 2,
"Correcto. El signo negativo solo refleja la curva; sigue siendo trigonométrica.",
"$-\\cos(x)$ tiene la misma amplitud y período que $\\cos(x)$, pero invertida verticalmente."),

# 23 - desde fórmula sin(x/2)
e(23,
"¿A qué familia pertenece $q(x) = \\operatorname{sen}\\!\\left(\\dfrac{x}{2}\\right)$?",
["Lineal", "Cuadrática", "Exponencial", "Trigonométrica"], 3,
"Correcto. El argumento $x/2$ estira el período a $4\\pi$, pero la familia es trigonométrica.",
"Dividir el argumento alarga el período; la función sigue oscilando periódicamente."),

# 24 - cotidiano población cíclica
e(24,
"La cantidad de turistas en una ciudad sube en verano y baja en invierno, con un ciclo anual muy regular. ¿Qué familia de funciones modela mejor este comportamiento?",
["Lineal (crece a ritmo constante)", "Exponencial (crece sin cota)", "Trigonométrica (oscilación periódica)", "Logarítmica (crece cada vez más lento)"], 2,
"Correcto. Un ciclo anual regular corresponde a una función periódica trigonométrica.",
"El patrón estacional que sube y baja cada $12$ meses puede modelarse con $A\\,\\operatorname{sen}(Bt) + D$."),

# 25 - desde gráfico: cos(2x) (con graph_fn)
e(25,
"La gráfica muestra una onda que completa dos ciclos completos en el intervalo $[-\\pi, \\pi]$.\n\n¿A qué familia pertenece?",
["Lineal", "Trigonométrica", "Cuadrática", "Exponencial"], 1,
"Correcto. Dos ciclos en $2\\pi$ equivalen a período $\\pi$, que es una trigonométrica comprimida.",
"Un período de $\\pi$ corresponde a $\\cos(2x)$ o $\\operatorname{sen}(2x)$.",
"cos(2*x)", [-5, 5, -2, 2]),

# 26 - distractor exponencial
e(26,
"¿Cuál de las siguientes funciones pertenece a la familia trigonométrica?",
["$f(x) = 2^x$", "$f(x) = \\log(x)$", "$f(x) = x^2 + 1$", "$f(x) = \\operatorname{sen}(x) + 1$"], 3,
"Correcto. Solo $\\operatorname{sen}(x) + 1$ es periódica y trigonométrica.",
"Las otras son exponencial, logarítmica y cuadrática. La clave es la periodicidad."),

# 27 - desde fórmula 3cos(x)
e(27,
"¿A qué familia pertenece $r(x) = 3\\cos(x)$?",
["Cuadrática", "Exponencial", "Trigonométrica", "Racional"], 2,
"Correcto. El coeficiente $3$ cambia la amplitud, no la familia.",
"$3\\cos(x)$ es una función coseno con amplitud $3$."),

# 28 - desde descripción: asíntota vertical
e(28,
"Una función tiene asíntota vertical en $x = 0$ y dominio $(0, +\\infty)$. ¿A qué familia pertenece más probablemente?",
["Trigonométrica", "Logarítmica", "Cuadrática", "Seno"], 1,
"Correcto. La asíntota vertical junto al dominio acotado por debajo apunta a una logarítmica.",
"Las trigonométricas están definidas en $\\mathbb{R}$ y no tienen asíntota vertical."),

# 29 - desde gráfico: -sin(x) (con graph_fn)
e(29,
"La gráfica muestra una onda que en $x = 0$ vale $0$ y luego desciende a su mínimo antes de volver a subir.\n\n¿A qué familia pertenece?",
["Logarítmica", "Cuadrática", "Trigonométrica", "Racional"], 2,
"Correcto. Una onda periódica que comienza en $0$ y baja es $-\\operatorname{sen}(x)$.",
"La onda comienza en cero y va hacia abajo primero: corresponde a $-\\operatorname{sen}(x)$.",
"-sin(x)", [-7, 7, -2, 2]),

# 30 - desde fórmula 2sin(x)+1
e(30,
"¿A qué familia pertenece $f(x) = 2\\,\\operatorname{sen}(x) + 1$?",
["Lineal", "Cuadrática", "Trigonométrica", "Exponencial"], 2,
"Correcto. Es una función seno con amplitud $2$ y desplazamiento vertical $+1$.",
"Los parámetros $A$ y $D$ no cambian la familia: sigue siendo periódica trigonométrica."),

# 31 - cotidiano: horas de luz solar
e(31,
"La cantidad de horas de luz solar en una ciudad varía entre $9$ y $15$ horas con un ciclo anual de $365$ días. ¿Qué familia de funciones modela mejor este fenómeno?",
["Lineal", "Trigonométrica", "Logarítmica", "Exponencial"], 1,
"Correcto. El ciclo anual regular con amplitud fija es propio de las trigonométricas.",
"Amplitud $= 3$, eje $= 12$, período $= 365$: todo encaja con $f(t) = 3\\,\\operatorname{sen}(Bt) + 12$."),

# 32 - distinguir de cuadrática
e(32,
"Una función tiene un único mínimo global en $x = 0$ y crece indefinidamente hacia ambos lados. ¿A qué familia pertenece?",
["Trigonométrica (tiene muchos mínimos)", "Cuadrática (parábola con mínimo global)", "Logarítmica", "Seno"], 1,
"Correcto. Un único mínimo global y crecimiento ilimitado corresponde a una parábola.",
"Las trigonométricas tienen infinitos mínimos locales (el patrón se repite) y la imagen es acotada."),

# 33 - desde gráfico: 3*sin(x) (con graph_fn)
e(33,
"La gráfica muestra una onda periódica con máximo $3$ y mínimo $-3$ y período $2\\pi$.\n\n¿A qué familia pertenece?",
["Racional", "Cuadrática", "Trigonométrica", "Logarítmica"], 2,
"Correcto. La amplitud $3$ y el período $2\\pi$ indican $3\\,\\operatorname{sen}(x)$ o $3\\cos(x)$.",
"Ambas son funciones trigonométricas con amplitud $3$.",
"3*sin(x)", [-7, 7, -4, 4]),

# 34 - desde fórmula sin(x)-1
e(34,
"¿A qué familia pertenece $f(x) = \\operatorname{sen}(x) - 1$?",
["Cuadrática", "Trigonométrica", "Logarítmica", "Exponencial"], 1,
"Correcto. Restar $1$ desplaza la curva verticalmente, sin cambiar la familia.",
"La imagen pasa a $[-2, 0]$, pero la función sigue siendo periódica y trigonométrica."),

# 35 - desde fórmula cos(x/2)
e(35,
"¿A qué familia pertenece $g(x) = \\cos\\!\\left(\\dfrac{x}{2}\\right)$?",
["Exponencial", "Trigonométrica", "Racional", "Lineal"], 1,
"Correcto. El argumento $x/2$ estira el período a $4\\pi$; la familia es trigonométrica.",
"Cualquier transformación del argumento conserva la periodicidad y la familia."),

# 36 - cotidiano: consumo eléctrico estacional
e(36,
"El consumo eléctrico de un edificio es mayor en verano (aire acondicionado) y en invierno (calefacción), siguiendo un patrón semestral repetitivo. ¿Qué función modela mejor el consumo $C(t)$?",
["$C(t) = at + b$ (lineal)", "$C(t) = A\\cos(Bt) + D$ (trigonométrica)", "$C(t) = e^{kt}$ (exponencial)", "$C(t) = \\log(t)$ (logarítmica)"], 1,
"Correcto. El patrón que tiene dos picos por año (verano e invierno) es periódico y trigonométrico.",
"Un ciclo de $12$ meses con dos picos se modela con $\\cos$ o $\\operatorname{sen}$, con período $= 6$ meses ajustado."),

# 37 - desde gráfico: sin(x/2) (con graph_fn)
e(37,
"La gráfica muestra una onda que completa exactamente un ciclo en el intervalo $[0, 4\\pi]$.\n\n¿A qué familia pertenece?",
["Exponencial", "Cuadrática", "Trigonométrica", "Logarítmica"], 2,
"Correcto. Un período de $4\\pi$ es propio de $\\operatorname{sen}(x/2)$ o $\\cos(x/2)$.",
"Período $= 4\\pi$ implica $B = 1/2$ en la fórmula $2\\pi/B$.",
"sin(x/2)", [-10, 10, -2, 2]),

# 38 - distinguir de racional
e(38,
"Una función tiene asíntotas verticales en $x = \\pm\\pi/2, \\pm 3\\pi/2, \\ldots$ y no está acotada. ¿A qué familia pertenece?",
["Racional (pocos polos aislados)", "Trigonométrica (tangente)", "Logarítmica", "Cuadrática"], 1,
"Correcto. La tangente tiene infinitas asíntotas verticales periódicamente espaciadas.",
"$\\tan(x)$ tiene asíntotas en $x = \\pi/2 + k\\pi$, a diferencia de las racionales que tienen pocas."),

# 39 - desde fórmula 2cos(x)+1
e(39,
"¿A qué familia pertenece $h(x) = 2\\cos(x) + 1$?",
["Lineal", "Cuadrática", "Trigonométrica", "Racional"], 2,
"Correcto. Es coseno con amplitud $2$ y desplazamiento $+1$: imagen $[-1, 3]$.",
"El desplazamiento vertical no cambia la periodicidad ni la familia."),

# 40 - desde descripción: función con imagen acotada
e(40,
"Una función está definida para todo $x \\in \\mathbb{R}$, su imagen es $[-1, 1]$ y se repite con período $2\\pi$. ¿A qué familia pertenece?",
["Lineal", "Exponencial", "Logarítmica", "Trigonométrica"], 3,
"Correcto. Imagen acotada en $[-1, 1]$ + periodicidad $2\\pi$ define seno o coseno básico.",
"Ninguna función lineal, exponencial o logarítmica tiene imagen acotada y es periódica."),

# 41 - desde fórmula -2sin(x)
e(41,
"¿A qué familia pertenece $f(x) = -2\\,\\operatorname{sen}(x)$?",
["Cuadrática", "Exponencial", "Logarítmica", "Trigonométrica"], 3,
"Correcto. El signo negativo y el coeficiente $2$ son transformaciones; la familia es trigonométrica.",
"La reflexión y el cambio de amplitud conservan la periodicidad."),

# 42 - cotidiano: ondas de sonido
e(42,
"El desplazamiento de una membrana al vibrar con sonido sigue un patrón que sube y baja miles de veces por segundo de forma regular. ¿Qué familia de funciones modela mejor este comportamiento?",
["Cuadrática", "Trigonométrica", "Lineal", "Exponencial"], 1,
"Correcto. Las ondas sonoras son funciones periódicas, modeladas con seno o coseno.",
"Frecuencia alta = período pequeño, pero el tipo de función es el mismo: $A\\,\\operatorname{sen}(2\\pi f \\cdot t)$."),

# 43 - desde gráfico: 2*cos(x) (con graph_fn)
e(43,
"La gráfica muestra una onda que en $x = 0$ alcanza su máximo $2$, luego desciende cruzando el eje en $x = \\pi/2$.\n\n¿A qué familia pertenece?",
["Logarítmica", "Cuadrática", "Trigonométrica", "Exponencial"], 2,
"Correcto. Inicia en su máximo en $x = 0$: es coseno. Amplitud $2$.",
"El máximo en $x = 0$ es la firma del coseno; la amplitud $2$ indica $2\\cos(x)$.",
"2*cos(x)", [-7, 7, -3, 3]),

# 44 - distractor: función no periódica
e(44,
"¿Cuál de las siguientes funciones NO es trigonométrica?",
["$f(x) = \\operatorname{sen}(x) + \\cos(x)$", "$g(x) = 2\\,\\operatorname{sen}(3x)$",
 "$h(x) = e^{\\operatorname{sen}(x)}$", "$p(x) = \\operatorname{sen}^2(x) + \\cos^2(x)$"], 2,
"Correcto. $e^{\\operatorname{sen}(x)}$ es una exponencial compuesta, no una función trigonométrica simple.",
"Aunque usa $\\operatorname{sen}$, la función exponencial envuelve el resultado y altera la clasificación. $p(x) = 1$ es constante."),

# 45 - desde fórmula 3*cos(x)
e(45,
"¿A qué familia pertenece $f(x) = 3\\cos(x) - 2$?",
["Racional", "Trigonométrica", "Logarítmica", "Cuadrática"], 1,
"Correcto. Amplitud $3$, eje $y = -2$: función coseno transformada.",
"La imagen es $[-5, 1]$, pero la función sigue siendo periódica y trigonométrica."),

# 46 - desde descripción: período no estándar
e(46,
"Una función es periódica con período $\\pi$ y su imagen es $[-1, 1]$. ¿A qué familia pertenece?",
["Lineal", "Trigonométrica", "Exponencial", "Cuadrática"], 1,
"Correcto. Período $\\pi$ e imagen $[-1, 1]$ corresponden a $\\operatorname{sen}(2x)$ o $\\cos(2x)$.",
"El período $\\pi$ se obtiene con $B = 2$: $2\\pi/2 = \\pi$."),

# 47 - desde gráfico: sin(2x)+1 (con graph_fn)
e(47,
"La gráfica muestra una onda periódica centrada en $y = 1$, con máximo $2$, mínimo $0$ y período $\\pi$.\n\n¿A qué familia pertenece?",
["Cuadrática", "Logarítmica", "Trigonométrica", "Racional"], 2,
"Correcto. Período $\\pi$, amplitud $1$, eje $y = 1$: función trigonométrica transformada.",
"Esto corresponde a $\\operatorname{sen}(2x) + 1$.",
"sin(2*x)+1", [-5, 5, -1, 3]),

# 48 - distractor: imagen no acotada
e(48,
"Una función crece sin límite cuando $x \\to +\\infty$ y su imagen es $(0, +\\infty)$. ¿A qué familia pertenece más probablemente?",
["Trigonométrica (imagen acotada)", "Cuadrática (crece sin límite)", "Logarítmica (imagen $\\mathbb{R}$)", "Exponencial (imagen $(0,+\\infty)$)"], 3,
"Correcto. Imagen $(0, +\\infty)$ que crece sin límite es característica de la exponencial.",
"Las trigonométricas siempre tienen imagen acotada. La exponencial $b^x$ con $b>1$ tiene imagen $(0, +\\infty)$."),

# 49 - desde fórmula -cos(x)+2
e(49,
"¿A qué familia pertenece $f(x) = -\\cos(x) + 2$?",
["Cuadrática", "Racional", "Exponencial", "Trigonométrica"], 3,
"Correcto. Coseno reflejado y desplazado verticalmente: imagen $[1, 3]$, familia trigonométrica.",
"La reflexión y el desplazamiento son transformaciones que conservan la familia."),

# 50 - cotidiano: señal eléctrica alterna
e(50,
"La corriente alterna en un tomacorriente doméstico oscila entre $-311\\,V$ y $+311\\,V$ exactamente $50$ veces por segundo. ¿Qué función modela esta corriente $I(t)$?",
["$I(t) = 311 \\cdot t$", "$I(t) = 311\\,\\operatorname{sen}(100\\pi t)$", "$I(t) = e^{311t}$", "$I(t) = \\log(311t)$"], 1,
"Correcto. La corriente alterna es una función seno con amplitud $311\\,V$ y frecuencia $50\\,Hz$.",
"Frecuencia $50\\,Hz$ implica período $T = 1/50 = 0{,}02\\,s$ y $B = 2\\pi/T = 100\\pi$."),
]

assert len(new) == 36, f"Esperados 36, obtenidos {len(new)}"

ids_existing = {ex["external_id"] for ex in data}
for ex in new:
    assert ex["external_id"] not in ids_existing, f"Duplicado: {ex['external_id']}"

data.extend(new)
FILE.write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding="utf-8")
print(f"Total: {len(data)}")
print("Por skill:", dict(Counter(ex["exercise_type"] for ex in data)))
assert all(ex["feedback_incorrect"] == "" for ex in data)
clsf = [ex for ex in data if ex["exercise_type"] == "CLSF"]
assert len(clsf) == 50, f"CLSF={len(clsf)}"
print("CLSF OK. gen_trig_clsf.py completo.")
