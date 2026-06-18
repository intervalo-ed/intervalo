"""Genera white_trigonometric FORM form_12..50 (+39)."""
import json, pathlib
from collections import Counter

FILE = pathlib.Path("content/analisis-1/exercises/white_trigonometric.json")
data = json.loads(FILE.read_text(encoding="utf-8"))

def e(n, q, opts, ci, fc, exp, gfn=None, gview=None):
    return {
        "external_id": f"white_trigonometric_form_{n:02d}",
        "belt": "white", "topic": "trigonometric", "exercise_type": "FORM",
        "question": q, "options": opts, "correct_index": ci,
        "has_math": True, "feedback_correct": fc, "feedback_incorrect": "",
        "graph_fn": gfn, "graph_view": gview,
        "explanation": exp, "reviewed": False,
    }

new = [
# 12 - amplitud de 3sin(x)
e(12,
"¿Cuál es la amplitud de $f(x) = 3\\,\\operatorname{sen}(x)$?",
["$1$", "$3$", "$6$", "$\\pi$"], 1,
"Correcto. La amplitud es $|A| = 3$.",
"En $f(x) = A\\,\\operatorname{sen}(x)$, la amplitud es $|A|$. Aquí $A = 3$."),

# 13 - período de sin(4x)
e(13,
"¿Cuál es el período de $f(x) = \\operatorname{sen}(4x)$?",
["$8\\pi$", "$4\\pi$", "$\\dfrac{\\pi}{2}$", "$\\pi$"], 2,
"Correcto. Período $= \\dfrac{2\\pi}{4} = \\dfrac{\\pi}{2}$.",
"La fórmula del período es $T = 2\\pi/B$. Con $B = 4$: $T = \\pi/2$."),

# 14 - máximo de 2sin(x)+3
e(14,
"¿Cuál es el valor máximo de $g(x) = 2\\,\\operatorname{sen}(x) + 3$?",
["$2$", "$3$", "$5$", "$1$"], 2,
"Correcto. Máximo $= D + |A| = 3 + 2 = 5$.",
"El máximo del seno es $1$, multiplicado por $A = 2$ da $2$; sumando $D = 3$ resulta $5$."),

# 15 - mínimo de cos(x)-2
e(15,
"¿Cuál es el valor mínimo de $h(x) = \\cos(x) - 2$?",
["$-3$", "$-1$", "$-2$", "$1$"], 0,
"Correcto. Mínimo $= D - |A| = -2 - 1 = -3$.",
"El mínimo del coseno es $-1$; restándole $2$: $-1 - 2 = -3$."),

# 16 - evaluar sin(π/6)
e(16,
"Si $f(x) = \\operatorname{sen}(x)$, ¿cuánto vale $f\\!\\left(\\dfrac{\\pi}{6}\\right)$?",
["$\\dfrac{\\sqrt{3}}{2}$", "$1$", "$\\dfrac{\\sqrt{2}}{2}$", "$\\dfrac{1}{2}$"], 3,
"Correcto. $\\operatorname{sen}(\\pi/6) = \\dfrac{1}{2}$.",
"$\\pi/6 = 30°$. Por el triángulo $30$-$60$-$90$: seno de $30° = 1/2$."),

# 17 - evaluar cos(π/3)
e(17,
"Si $g(x) = \\cos(x)$, ¿cuánto vale $g\\!\\left(\\dfrac{\\pi}{3}\\right)$?",
["$\\dfrac{\\sqrt{3}}{2}$", "$\\dfrac{1}{2}$", "$1$", "$0$"], 1,
"Correcto. $\\cos(\\pi/3) = \\dfrac{1}{2}$.",
"$\\pi/3 = 60°$. Por el triángulo $30$-$60$-$90$: coseno de $60° = 1/2$."),

# 18 - período de cos(x/3)
e(18,
"¿Cuál es el período de $f(x) = \\cos\\!\\left(\\dfrac{x}{3}\\right)$?",
["$\\dfrac{2\\pi}{3}$", "$2\\pi$", "$6\\pi$", "$3\\pi$"], 2,
"Correcto. $B = 1/3$, período $= 2\\pi / (1/3) = 6\\pi$.",
"Cuando $B < 1$ el período se alarga: con $B = 1/3$, el ciclo mide $6\\pi$."),

# 19 - amplitud de -4sin(x)
e(19,
"¿Cuál es la amplitud de $f(x) = -4\\,\\operatorname{sen}(x)$?",
["$-4$", "$2$", "$4$", "$8$"], 2,
"Correcto. La amplitud es $|{-4}| = 4$.",
"El signo negativo refleja la curva pero no cambia la amplitud; siempre se toma el valor absoluto."),

# 20 - imagen de sin(x)-1
e(20,
"¿Cuál es la imagen de $f(x) = \\operatorname{sen}(x) - 1$?",
["$[-2, 1]$", "$[-1, 1]$", "$[-2, 0]$", "$[0, 2]$"], 2,
"Correcto. $[-1 - 1,\\, 1 - 1] = [-2, 0]$.",
"El rango del seno $[-1, 1]$ se desplaza $-1$ unidad: $[-2, 0]$."),

# 21 - evaluar desde gráfico (con graph_fn): valor en x=π/2
e(21,
"La gráfica muestra $f(x) = 2\\,\\operatorname{sen}(x)$.\n\n¿Cuánto vale $f\\!\\left(\\dfrac{\\pi}{2}\\right)$?",
["$0$", "$1$", "$2$", "$-2$"], 2,
"Correcto. $f(\\pi/2) = 2 \\cdot \\operatorname{sen}(\\pi/2) = 2 \\cdot 1 = 2$.",
"El máximo de $2\\,\\operatorname{sen}(x)$ ocurre en $x = \\pi/2$ y vale $2$.",
"2*sin(x)", [-7, 7, -3, 3]),

# 22 - desfase: dónde cruza el eje X
e(22,
"¿En qué valor de $x$ en $[0, 2\\pi]$ la función $f(x) = \\operatorname{sen}(x - \\pi)$ cruza el eje $X$ por primera vez (desde $x = 0$)?",
["$x = 0$", "$x = \\pi$", "$x = \\pi/2$", "$x = 2\\pi$"], 1,
"Correcto. $\\operatorname{sen}(\\pi - \\pi) = \\operatorname{sen}(0) = 0$.",
"El desfase $-\\pi$ desplaza la raíz de $x = 0$ a $x = \\pi$."),

# 23 - leer B desde período
e(23,
"Una función $f(x) = \\operatorname{sen}(Bx)$ tiene período $T = \\dfrac{\\pi}{3}$. ¿Cuál es el valor de $B$?",
["$3$", "$6$", "$\\dfrac{1}{6}$", "$\\dfrac{1}{3}$"], 1,
"Correcto. $B = 2\\pi / T = 2\\pi / (\\pi/3) = 6$.",
"Despejando: $B = 2\\pi / T = 2\\pi \\cdot 3/\\pi = 6$."),

# 24 - máximo de 3cos(x)-1
e(24,
"¿Cuál es el valor máximo de $h(x) = 3\\cos(x) - 1$?",
["$2$", "$4$", "$3$", "$-4$"], 0,
"Correcto. Máximo $= D + |A| = -1 + 3 = 2$.",
"El coseno vale como máximo $1$; multiplicado por $3$ da $3$; restando $1$: $3 - 1 = 2$."),

# 25 - imagen de 2cos(x)+1
e(25,
"¿Cuál es la imagen de $g(x) = 2\\cos(x) + 1$?",
["$[0, 4]$", "$[-1, 3]$", "$[-2, 2]$", "$[1, 3]$"], 1,
"Correcto. $[1 - 2,\\, 1 + 2] = [-1, 3]$.",
"Rango base $[-1, 1]$, amplificado a $[-2, 2]$ y desplazado $+1$: $[-1, 3]$."),

# 26 - evaluar desde gráfico (con graph_fn): valor en x=0 de cos(x)
e(26,
"La gráfica muestra $f(x) = \\cos(x)$.\n\n¿Cuánto vale $f(0)$?",
["$0$", "$-1$", "$\\dfrac{1}{2}$", "$1$"], 3,
"Correcto. El coseno en $x = 0$ vale $1$ (su máximo).",
"$\\cos(0) = 1$. La gráfica del coseno parte de su máximo en el origen.",
"cos(x)", [-7, 7, -2, 2]),

# 27 - período de 2sin(3x)
e(27,
"¿Cuál es el período de $f(x) = 2\\,\\operatorname{sen}(3x)$?",
["$\\dfrac{2\\pi}{3}$", "$6\\pi$", "$2\\pi$", "$3\\pi$"], 0,
"Correcto. El coeficiente $A = 2$ no afecta el período; $B = 3$ da $T = 2\\pi/3$.",
"El período depende solo de $B$, no de $A$: $T = 2\\pi/3$."),

# 28 - asíntota o raíz de sin(x)
e(28,
"¿La función $f(x) = \\operatorname{sen}(x)$ tiene asíntotas verticales?",
["Sí, en $x = 0$", "Sí, en $x = \\pi/2 + k\\pi$", "No, el seno está definido para todo $x$", "Sí, en $x = k\\pi$"], 2,
"Correcto. El seno está definido para todo real; no tiene asíntotas verticales.",
"A diferencia de la tangente, $\\operatorname{sen}(x)$ no tiene discontinuidades."),

# 29 - leer amplitud desde gráfico (con graph_fn): 3*sin(x)
e(29,
"La gráfica muestra una onda con máximo $3$ y mínimo $-3$.\n\n¿Cuál es la amplitud de la función?",
["$6$", "$1$", "$3$", "$\\dfrac{3}{2}$"], 2,
"Correcto. Amplitud $= (\\text{máximo} - \\text{mínimo}) / 2 = (3 - (-3)) / 2 = 3$.",
"La amplitud es la mitad del rango total de la función.",
"3*sin(x)", [-7, 7, -4, 4]),

# 30 - mínimo de -2sin(x)+1
e(30,
"¿Cuál es el valor mínimo de $f(x) = -2\\,\\operatorname{sen}(x) + 1$?",
["$3$", "$-1$", "$-2$", "$1$"], 1,
"Correcto. Con $A = -2$ y $D = 1$: mínimo $= 1 - |-2| = 1 - 2 = -1$.",
"El mínimo siempre es $D - |A|$, independientemente del signo de $A$."),

# 31 - evaluar f(π) de 3cos(x)
e(31,
"Si $f(x) = 3\\cos(x)$, ¿cuánto vale $f(\\pi)$?",
["$3$", "$0$", "$-3$", "$1$"], 2,
"Correcto. $f(\\pi) = 3 \\cdot \\cos(\\pi) = 3 \\cdot (-1) = -3$.",
"$\\cos(\\pi) = -1$, luego multiplicado por $3$ da $-3$."),

# 32 - escribir fórmula desde amplitud y período
e(32,
"Una onda tipo seno tiene amplitud $4$ y período $\\pi$. ¿Cuál es su fórmula?",
["$f(x) = \\pi\\,\\operatorname{sen}(4x)$", "$f(x) = 4\\,\\operatorname{sen}(\\pi x)$",
 "$f(x) = 4\\,\\operatorname{sen}(2x)$", "$f(x) = 2\\,\\operatorname{sen}(4x)$"], 2,
"Correcto. Amplitud $4$ da $A = 4$; período $\\pi$ da $B = 2\\pi/\\pi = 2$.",
"$f(x) = 4\\,\\operatorname{sen}(2x)$."),

# 33 - imagen de sin(2x)
e(33,
"¿Cuál es la imagen de $f(x) = \\operatorname{sen}(2x)$?",
["$[-2, 2]$", "$\\mathbb{R}$", "$[0, 1]$", "$[-1, 1]$"], 3,
"Correcto. Cambiar la frecuencia no cambia la imagen: sigue siendo $[-1, 1]$.",
"El coeficiente del argumento solo afecta el período, no la amplitud ni el rango."),

# 34 - evaluar cos(π/4)
e(34,
"¿Cuánto vale $\\cos\\!\\left(\\dfrac{\\pi}{4}\\right)$?",
["$\\dfrac{1}{2}$", "$\\dfrac{\\sqrt{3}}{2}$", "$1$", "$\\dfrac{\\sqrt{2}}{2}$"], 3,
"Correcto. $\\cos(\\pi/4) = \\dfrac{\\sqrt{2}}{2} \\approx 0{,}707$.",
"$\\pi/4 = 45°$. En el triángulo isósceles rectángulo, cateto/hipotenusa $= 1/\\sqrt{2} = \\sqrt{2}/2$."),

# 35 - leer desfase desde gráfico (con graph_fn): sin(x)+1
e(35,
"La gráfica muestra $f(x) = \\operatorname{sen}(x) + 1$.\n\n¿Cuál es el eje de oscilación (valor de $D$)?",
["$D = 0$", "$D = -1$", "$D = 2$", "$D = 1$"], 3,
"Correcto. El eje de oscilación es $y = D = 1$.",
"La curva oscila simétricamente alrededor de $y = 1$; ese es el desplazamiento vertical $D$.",
"sin(x)+1", [-7, 7, -1, 3]),

# 36 - período de cos(πx)
e(36,
"¿Cuál es el período de $f(x) = \\cos(\\pi x)$?",
["$\\pi$", "$\\dfrac{1}{\\pi}$", "$2\\pi$", "$2$"], 3,
"Correcto. $B = \\pi$, período $= 2\\pi / \\pi = 2$.",
"Cuando el coeficiente de $x$ es $\\pi$, el período resulta $2$ (en unidades de $x$)."),

# 37 - amplitud desde descripción gráfica
e(37,
"El gráfico de $f$ muestra que la curva oscila entre $-5$ y $5$. ¿Cuál es la amplitud de $f$?",
["$10$", "$2{,}5$", "$5$", "$1$"], 2,
"Correcto. Amplitud $= (\\text{máx} - \\text{mín}) / 2 = (5 - (-5)) / 2 = 5$.",
"La amplitud es la mitad de la distancia total entre el máximo y el mínimo."),

# 38 - evaluar f(3π/2) de sin(x)
e(38,
"Si $f(x) = \\operatorname{sen}(x)$, ¿cuánto vale $f\\!\\left(\\dfrac{3\\pi}{2}\\right)$?",
["$0$", "$1$", "$-1$", "$\\dfrac{1}{2}$"], 2,
"Correcto. $\\operatorname{sen}(3\\pi/2) = -1$.",
"$3\\pi/2 = 270°$ corresponde al punto $(0, -1)$ en el círculo unitario: coordenada $y = -1$."),

# 39 - escribir fórmula desde máximo y mínimo
e(39,
"Una onda tiene máximo $6$ y mínimo $2$. Si su período es $2\\pi$, ¿cuál es la fórmula?",
["$f(x) = 2\\,\\operatorname{sen}(x)$", "$f(x) = 6\\,\\operatorname{sen}(x) + 2$",
 "$f(x) = 4\\,\\operatorname{sen}(x) + 4$", "$f(x) = 2\\,\\operatorname{sen}(x) + 4$"], 3,
"Correcto. Amplitud $= (6-2)/2 = 2$; eje $D = (6+2)/2 = 4$.",
"$A = 2$, $D = 4$, período $= 2\\pi$ $\\Rightarrow$ $B = 1$: $f(x) = 2\\,\\operatorname{sen}(x) + 4$."),

# 40 - imagen de 3sin(x)-1
e(40,
"¿Cuál es la imagen de $f(x) = 3\\,\\operatorname{sen}(x) - 1$?",
["$[-1, 3]$", "$[-3, 3]$", "$[-4, 2]$", "$[0, 4]$"], 2,
"Correcto. Amplitud $3$ desplazada $-1$: $[-3 - 1,\\, 3 - 1] = [-4, 2]$.",
"Imagen $= [D - |A|,\\, D + |A|] = [-1-3, -1+3] = [-4, 2]$."),

# 41 - período de sin(x) en segundos (cotidiano)
e(41,
"Una señal de radio tiene la forma $I(t) = \\operatorname{sen}(200\\pi t)$, donde $t$ se mide en segundos. ¿Cuál es el período de la señal?",
["$200\\pi$ s", "$\\dfrac{1}{100}$ s", "$100\\pi$ s", "$200$ s"], 1,
"Correcto. $B = 200\\pi$, período $= 2\\pi / (200\\pi) = 1/100$ s.",
"Frecuencia $= 100\\,Hz$: cien ciclos por segundo, período $= 0{,}01$ s."),

# 42 - leer máximo desde gráfico (con graph_fn): 2*sin(x)+1
e(42,
"La gráfica muestra $f(x) = 2\\,\\operatorname{sen}(x) + 1$.\n\n¿Cuál es el valor máximo de $f$?",
["$1$", "$3$", "$2$", "$4$"], 1,
"Correcto. Máximo $= D + A = 1 + 2 = 3$.",
"El máximo del seno es $1$; multiplicado por $2$ da $2$; más el desplazamiento $+1$ da $3$.",
"2*sin(x)+1", [-7, 7, -2, 4]),

# 43 - escribir fórmula desde gráfico con asíntota nula
e(43,
"Una onda tipo coseno tiene amplitud $1$, eje $y = 0$ y período $4\\pi$. ¿Cuál es su fórmula?",
["$f(x) = \\cos(4\\pi x)$", "$f(x) = \\cos\\!\\left(\\dfrac{x}{2}\\right)$",
 "$f(x) = 4\\pi \\cos(x)$", "$f(x) = \\cos(2x)$"], 1,
"Correcto. Período $4\\pi \\Rightarrow B = 2\\pi / (4\\pi) = 1/2$.",
"$f(x) = \\cos(x/2)$ tiene período $4\\pi$ y amplitud $1$."),

# 44 - imagen de -cos(x)
e(44,
"¿Cuál es la imagen de $f(x) = -\\cos(x)$?",
["$[0, 1]$", "$[-1, 0]$", "$[-1, 1]$", "$\\mathbb{R}$"], 2,
"Correcto. La imagen de $-\\cos(x)$ es $[-1, 1]$: el signo solo refleja, no cambia el rango.",
"$\\cos(x) \\in [-1,1]$; $-\\cos(x) \\in [-1,1]$ también (los extremos se intercambian, no el rango)."),

# 45 - evaluar sin(π/4)
e(45,
"¿Cuánto vale $\\operatorname{sen}\\!\\left(\\dfrac{\\pi}{4}\\right)$?",
["$\\dfrac{1}{2}$", "$\\dfrac{\\sqrt{3}}{2}$", "$\\dfrac{\\sqrt{2}}{2}$", "$1$"], 2,
"Correcto. $\\operatorname{sen}(\\pi/4) = \\dfrac{\\sqrt{2}}{2} \\approx 0{,}707$.",
"$45°$: cateto/hipotenusa $= 1/\\sqrt{2}$."),

# 46 - período de cos(2x/3)
e(46,
"¿Cuál es el período de $f(x) = \\cos\\!\\left(\\dfrac{2x}{3}\\right)$?",
["$\\dfrac{4\\pi}{3}$", "$3\\pi$", "$\\dfrac{2\\pi}{3}$", "$6\\pi$"], 1,
"Correcto. $B = 2/3$, período $= 2\\pi / (2/3) = 3\\pi$.",
"$T = 2\\pi \\cdot 3/2 = 3\\pi$."),

# 47 - desfase: nueva raíz
e(47,
"¿En qué valor de $x$ la función $f(x) = \\operatorname{sen}\\!\\left(x - \\dfrac{\\pi}{2}\\right)$ alcanza su primer máximo positivo (para $x > 0$)?",
["$x = \\dfrac{\\pi}{4}$", "$x = \\pi$", "$x = \\dfrac{\\pi}{2}$", "$x = \\dfrac{3\\pi}{2}$"], 1,
"Correcto. El máximo de $\\operatorname{sen}(u)$ ocurre en $u = \\pi/2$; con $u = x - \\pi/2$: $x = \\pi$.",
"Igualando el argumento a $\\pi/2$: $x - \\pi/2 = \\pi/2 \\Rightarrow x = \\pi$."),

# 48 - amplitud desde fórmula con escalado
e(48,
"La función $f(x) = \\dfrac{1}{2}\\,\\operatorname{sen}(x)$ tiene amplitud:",
["$\\dfrac{1}{4}$", "$2$", "$1$", "$\\dfrac{1}{2}$"], 3,
"Correcto. Amplitud $= |A| = 1/2$.",
"El coeficiente $1/2$ reduce la oscilación: el máximo es $1/2$ y el mínimo es $-1/2$."),

# 49 - imagen de sin(x/2)
e(49,
"¿Cuál es la imagen de $f(x) = \\operatorname{sen}\\!\\left(\\dfrac{x}{2}\\right)$?",
["$[-2, 2]$", "$[-1, 1]$", "$[0, 1]$", "$\\mathbb{R}$"], 1,
"Correcto. La imagen del seno siempre es $[-1, 1]$ sin importar el período.",
"El coeficiente $1/2$ en el argumento cambia el período, no la amplitud."),

# 50 - cotidiano: temperatura
e(50,
"La temperatura en una ciudad sigue el modelo $T(h) = 10\\,\\operatorname{sen}\\!\\left(\\dfrac{\\pi}{12}(h - 6)\\right) + 20$, donde $h$ es la hora del día ($0 \\leq h < 24$). ¿Cuál es la temperatura máxima?",
["$10\\,°C$", "$30\\,°C$", "$20\\,°C$", "$26\\,°C$"], 1,
"Correcto. Máximo $= D + A = 20 + 10 = 30\\,°C$.",
"El seno vale máximo $1$; multiplicado por $10$ y sumado $20$: $30\\,°C$."),
]

assert len(new) == 39, f"Esperados 39, obtenidos {len(new)}"

ids_existing = {ex["external_id"] for ex in data}
for ex in new:
    assert ex["external_id"] not in ids_existing, f"Duplicado: {ex['external_id']}"

data.extend(new)
FILE.write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding="utf-8")
print(f"Total: {len(data)}")
print("Por skill:", dict(Counter(ex["exercise_type"] for ex in data)))
assert all(ex["feedback_incorrect"] == "" for ex in data)
form = [ex for ex in data if ex["exercise_type"] == "FORM"]
assert len(form) == 50, f"FORM={len(form)}"
print("FORM OK. gen_trig_form.py completo.")
