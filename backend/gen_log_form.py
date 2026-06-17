import json

PATH = "content/analisis-1/exercises/white_logarithmic.json"
with open(PATH, encoding="utf-8") as f:
    exercises = json.load(f)

new_form = [
  # form_12: asíntota de log₃(x-4)
  {
    "external_id": "white_logarithmic_form_12",
    "belt": "white", "topic": "logarithmic", "exercise_type": "FORM",
    "question": "¿Cuál es la asíntota vertical de $f(x) = \\log_3(x - 4)$?",
    "options": ["$x = 3$", "$x = 0$", "$x = -4$", "$x = 4$"],
    "correct_index": 3, "has_math": True,
    "feedback_correct": "El argumento $x - 4$ se anula en $x = 4$: la asíntota vertical es $x = 4$.",
    "feedback_incorrect": "", "graph_fn": None, "graph_view": None,
    "explanation": "La asíntota vertical está donde el argumento del logaritmo se anula:\n$$x - 4 = 0 \\implies x = 4$$\n\nDominio: $(4, +\\infty)$. Intercepto con el eje $X$: $\\log_3(x - 4) = 0 \\implies x - 4 = 1 \\implies x = 5$.",
    "reviewed": False
  },
  # form_13: dominio de log₂(3x-6)
  {
    "external_id": "white_logarithmic_form_13",
    "belt": "white", "topic": "logarithmic", "exercise_type": "FORM",
    "question": "¿Cuál es el dominio de $f(x) = \\log_2(3x - 6)$?",
    "options": ["$x > 6$", "$x > 0$", "$x > 3$", "$x > 2$"],
    "correct_index": 3, "has_math": True,
    "feedback_correct": "Se necesita $3x - 6 > 0 \\implies 3x > 6 \\implies x > 2$. Dominio: $(2, +\\infty)$.",
    "feedback_incorrect": "", "graph_fn": None, "graph_view": None,
    "explanation": "El argumento debe ser positivo:\n$$3x - 6 > 0 \\implies 3x > 6 \\implies x > 2$$\n\nDominio: $(2, +\\infty)$. Asíntota vertical: $x = 2$.\n\nNota: no confundir el coeficiente $3$ con la asíntota — la asíntota es donde el argumento es cero, es decir $3x = 6 \\implies x = 2$, no $x = 3$ ni $x = 6$.",
    "reviewed": False
  },
  # form_14: evaluar f(9) = log₃(9) = 2
  {
    "external_id": "white_logarithmic_form_14",
    "belt": "white", "topic": "logarithmic", "exercise_type": "FORM",
    "question": "¿Cuánto vale $f(9)$ para $f(x) = \\log_3(x)$?",
    "options": ["$3$", "$9$", "$2$", "$1$"],
    "correct_index": 2, "has_math": True,
    "feedback_correct": "$f(9) = \\log_3(9) = 2$ porque $3^2 = 9$.",
    "feedback_incorrect": "", "graph_fn": None, "graph_view": None,
    "explanation": "$f(9) = \\log_3(9) = y \\iff 3^y = 9 = 3^2 \\implies y = 2$.\n\nEl punto $(9,\\, 2)$ pertenece a la gráfica de $f(x) = \\log_3(x)$.",
    "reviewed": False
  },
  # form_15: evaluar f(e³) = ln(e³) = 3
  {
    "external_id": "white_logarithmic_form_15",
    "belt": "white", "topic": "logarithmic", "exercise_type": "FORM",
    "question": "¿Cuánto vale $f(e^3)$ para $f(x) = \\ln(x)$?",
    "options": ["$e^3$", "$3e$", "$1$", "$3$"],
    "correct_index": 3, "has_math": True,
    "feedback_correct": "$f(e^3) = \\ln(e^3) = 3$ por la propiedad $\\ln(e^n) = n$.",
    "feedback_incorrect": "", "graph_fn": None, "graph_view": None,
    "explanation": "$\\ln(e^3) = 3 \\cdot \\ln(e) = 3 \\cdot 1 = 3$.\n\nO usando la definición: $\\ln(e^3) = y \\iff e^y = e^3 \\implies y = 3$.\n\nEl punto $(e^3,\\, 3)$ pertenece a la gráfica de $\\ln(x)$.",
    "reviewed": False
  },
  # form_16: evaluar f(100) = log(100) = 2
  {
    "external_id": "white_logarithmic_form_16",
    "belt": "white", "topic": "logarithmic", "exercise_type": "FORM",
    "question": "¿Cuánto vale $f(100)$ para $f(x) = \\log(x)$?",
    "options": ["$10$", "$100$", "$1$", "$2$"],
    "correct_index": 3, "has_math": True,
    "feedback_correct": "$f(100) = \\log(100) = 2$ porque $10^2 = 100$.",
    "feedback_incorrect": "", "graph_fn": None, "graph_view": None,
    "explanation": "$\\log(100) = \\log_{10}(100) = 2$ porque $10^2 = 100$.\n\nPatrón: $\\log(10^n) = n$, por lo que $\\log(100) = \\log(10^2) = 2$.",
    "reviewed": False
  },
  # form_17: asíntota de ln(x+4)
  {
    "external_id": "white_logarithmic_form_17",
    "belt": "white", "topic": "logarithmic", "exercise_type": "FORM",
    "question": "¿Cuál es la asíntota vertical de $f(x) = \\ln(x + 4)$?",
    "options": ["$x = 0$", "$x = 4$", "$x = -4$", "$y = 4$"],
    "correct_index": 2, "has_math": True,
    "feedback_correct": "El argumento $x + 4$ se anula en $x = -4$: la asíntota vertical es $x = -4$.",
    "feedback_incorrect": "", "graph_fn": None, "graph_view": None,
    "explanation": "$x + 4 = 0 \\implies x = -4$ → asíntota vertical en $x = -4$.\n\nDominio: $(-4, +\\infty)$. Intercepto con eje $X$: $\\ln(x+4) = 0 \\implies x + 4 = 1 \\implies x = -3$.",
    "reviewed": False
  },
  # form_18: desde gráfico — log₂(x) identificar fórmula
  {
    "external_id": "white_logarithmic_form_18",
    "belt": "white", "topic": "logarithmic", "exercise_type": "FORM",
    "question": "¿Cuál de estas expresiones corresponde a la curva del gráfico?",
    "options": [
      "$f(x) = \\log_2(x) + 1$",
      "$f(x) = \\log_2(x)$",
      "$f(x) = -\\log_2(x)$",
      "$f(x) = 2^x$"
    ],
    "correct_index": 1, "has_math": True,
    "feedback_correct": "La curva pasa por $(1, 0)$ y tiene asíntota en $x = 0$: $f(x) = \\log_2(x)$.",
    "feedback_incorrect": "", "graph_fn": "log2(x)", "graph_view": [-0.5, 8.5, -3, 5],
    "explanation": "Claves para leer el gráfico:\n1. Asíntota vertical en $x = 0$ → argumento es $x$ sin desplazamiento.\n2. Pasa por $(1, 0)$ → $f(1) = 0$ → no hay desplazamiento vertical.\n3. Es creciente → base $b > 1$.\n4. Pasa por $(2, 1)$ → $f(2) = 1$ → base $b = 2$.\n\nConclusión: $f(x) = \\log_2(x)$.",
    "reviewed": False
  },
  # form_19: desde gráfico — log₂(x)+1
  {
    "external_id": "white_logarithmic_form_19",
    "belt": "white", "topic": "logarithmic", "exercise_type": "FORM",
    "question": "¿Cuál de estas expresiones corresponde a la curva del gráfico?",
    "options": [
      "$f(x) = \\log_2(x)$",
      "$f(x) = \\log_2(x) + 1$",
      "$f(x) = \\log_2(x) - 1$",
      "$f(x) = 2 \\cdot \\log_2(x)$"
    ],
    "correct_index": 1, "has_math": True,
    "feedback_correct": "La curva pasa por $(1, 1)$ y tiene asíntota en $x = 0$: $f(x) = \\log_2(x) + 1$.",
    "feedback_incorrect": "", "graph_fn": "log2(x)+1", "graph_view": [-0.5, 8.5, -2, 6],
    "explanation": "Claves:\n1. Asíntota vertical en $x = 0$ → argumento sin desplazamiento.\n2. En $x = 1$: $f(1) = 1$ (no $0$) → hay desplazamiento vertical de $+1$.\n3. Creciente con base $b = 2$ (el punto $(2, 2)$ confirma).\n\nConclusión: $f(x) = \\log_2(x) + 1$.",
    "reviewed": False
  },
  # form_20: desde gráfico — -log₂(x) decreciente
  {
    "external_id": "white_logarithmic_form_20",
    "belt": "white", "topic": "logarithmic", "exercise_type": "FORM",
    "question": "¿Cuál de estas expresiones corresponde a la curva del gráfico?",
    "options": [
      "$f(x) = \\log_2(x)$",
      "$f(x) = \\log_2(-x)$",
      "$f(x) = -\\log_2(x)$",
      "$f(x) = \\log_2(x) - 1$"
    ],
    "correct_index": 2, "has_math": True,
    "feedback_correct": "La curva decrece para $x > 0$, pasa por $(1, 0)$: $f(x) = -\\log_2(x)$.",
    "feedback_incorrect": "", "graph_fn": "-log2(x)", "graph_view": [-0.5, 8.5, -4, 4],
    "explanation": "Claves:\n1. Dominio $x > 0$, asíntota en $x = 0$.\n2. Es **decreciente** → se trata de un logaritmo negado o con base $< 1$.\n3. Pasa por $(1, 0)$: $f(1) = -\\log_2(1) = 0$ ✓.\n4. Para $x > 1$, la curva baja → confirma que es $-\\log_2(x)$.",
    "reviewed": False
  },
  # form_21: simplificar log₂(4x)
  {
    "external_id": "white_logarithmic_form_21",
    "belt": "white", "topic": "logarithmic", "exercise_type": "FORM",
    "question": "¿Cuánto vale $\\log_2(4x)$?",
    "options": [
      "$4 \\cdot \\log_2(x)$",
      "$2 + \\log_2(x)$",
      "$4 + \\log_2(x)$",
      "$\\log_2(4) \\cdot \\log_2(x)$"
    ],
    "correct_index": 1, "has_math": True,
    "feedback_correct": "$\\log_2(4x) = \\log_2(4) + \\log_2(x) = 2 + \\log_2(x)$.",
    "feedback_incorrect": "", "graph_fn": None, "graph_view": None,
    "explanation": "Por la propiedad del producto:\n$$\\log_2(4x) = \\log_2(4) + \\log_2(x) = 2 + \\log_2(x)$$\n\nUsar $\\log_2(4) = 2$ porque $2^2 = 4$.",
    "reviewed": False
  },
  # form_22: simplificar log(x³)
  {
    "external_id": "white_logarithmic_form_22",
    "belt": "white", "topic": "logarithmic", "exercise_type": "FORM",
    "question": "¿Cuánto vale $\\log(x^3)$?",
    "options": ["$\\log(3x)$", "$3 + \\log(x)$", "$3 \\cdot \\log(x)$", "$\\log(x)^3$"],
    "correct_index": 2, "has_math": True,
    "feedback_correct": "Por la propiedad de la potencia: $\\log(x^3) = 3 \\cdot \\log(x)$.",
    "feedback_incorrect": "", "graph_fn": None, "graph_view": None,
    "explanation": "La propiedad de la potencia:\n$$\\log(x^3) = 3 \\cdot \\log(x)$$\n\nVerificación con $x = 100$: $\\log(100^3) = \\log(10^6) = 6$ y $3 \\cdot \\log(100) = 3 \\cdot 2 = 6$ ✓.",
    "reviewed": False
  },
  # form_23: simplificar ln(e^(2x))
  {
    "external_id": "white_logarithmic_form_23",
    "belt": "white", "topic": "logarithmic", "exercise_type": "FORM",
    "question": "¿A cuál expresión es equivalente $\\ln(e^{2x})$?",
    "options": ["$2e^x$", "$e^{2x}$", "$2x$", "$2 + x$"],
    "correct_index": 2, "has_math": True,
    "feedback_correct": "$\\ln(e^{2x}) = 2x$ porque $\\ln$ y $e^{(\\ )}$ se cancelan.",
    "feedback_incorrect": "", "graph_fn": None, "graph_view": None,
    "explanation": "Usando la propiedad de la potencia: $\\ln(e^{2x}) = 2x \\cdot \\ln(e) = 2x \\cdot 1 = 2x$.\n\nO por funciones inversas: $\\ln(e^u) = u$ con $u = 2x$.",
    "reviewed": False
  },
  # form_24: inversa de f(x) = log₂(x) es f⁻¹(x) = 2^x
  {
    "external_id": "white_logarithmic_form_24",
    "belt": "white", "topic": "logarithmic", "exercise_type": "FORM",
    "question": "¿Cuál es la función inversa de $f(x) = \\log_2(x)$?",
    "options": [
      "$f^{-1}(x) = \\dfrac{x}{2}$",
      "$f^{-1}(x) = 2x$",
      "$f^{-1}(x) = 2^x$",
      "$f^{-1}(x) = x^2$"
    ],
    "correct_index": 2, "has_math": True,
    "feedback_correct": "La inversa de $\\log_2(x)$ es $2^x$: $2^{\\log_2(x)} = x$ y $\\log_2(2^x) = x$.",
    "feedback_incorrect": "", "graph_fn": None, "graph_view": None,
    "explanation": "Para encontrar la inversa de $y = \\log_2(x)$, se intercambian $x$ e $y$ y se despeja:\n$$x = \\log_2(y) \\implies y = 2^x$$\n\nVerificación: $\\log_2(2^x) = x$ ✓ y $2^{\\log_2(x)} = x$ ✓.",
    "reviewed": False
  },
  # form_25: intercepto de log₂(x+1) con eje X
  {
    "external_id": "white_logarithmic_form_25",
    "belt": "white", "topic": "logarithmic", "exercise_type": "FORM",
    "question": "¿En qué valor de $x$ la función $f(x) = \\log_2(x + 1)$ cruza el eje $X$?",
    "options": ["$x = -1$", "$x = 0$", "$x = 1$", "$x = 2$"],
    "correct_index": 1, "has_math": True,
    "feedback_correct": "$\\log_2(x + 1) = 0 \\implies x + 1 = 1 \\implies x = 0$.",
    "feedback_incorrect": "", "graph_fn": None, "graph_view": None,
    "explanation": "El intercepto con el eje $X$ se da cuando $f(x) = 0$:\n$$\\log_2(x + 1) = 0 \\implies x + 1 = 2^0 = 1 \\implies x = 0$$\n\nLa curva pasa por el origen $(0, 0)$.",
    "reviewed": False
  },
  # form_26: evaluar f(27) = log₃(27-0) = 3
  {
    "external_id": "white_logarithmic_form_26",
    "belt": "white", "topic": "logarithmic", "exercise_type": "FORM",
    "question": "¿Cuánto vale $f(28)$ para $f(x) = \\log_3(x - 1)$?",
    "options": ["$3$", "$27$", "$4$", "$2$"],
    "correct_index": 0, "has_math": True,
    "feedback_correct": "$f(28) = \\log_3(28 - 1) = \\log_3(27) = 3$ porque $3^3 = 27$.",
    "feedback_incorrect": "", "graph_fn": None, "graph_view": None,
    "explanation": "$f(28) = \\log_3(28 - 1) = \\log_3(27)$.\n\nComo $3^3 = 27$, se tiene $\\log_3(27) = 3$.",
    "reviewed": False
  },
  # form_27: dominio de log(x²-4) → tricky
  {
    "external_id": "white_logarithmic_form_27",
    "belt": "white", "topic": "logarithmic", "exercise_type": "FORM",
    "question": "¿Cuál es el dominio de $f(x) = \\log(x - 2) + \\log(x + 2)$?",
    "options": ["$x > 2$", "$x > -2$", "$x > 0$", "$x > 4$"],
    "correct_index": 0, "has_math": True,
    "feedback_correct": "Ambos argumentos deben ser positivos: $x - 2 > 0$ y $x + 2 > 0$, lo que da $x > 2$.",
    "feedback_incorrect": "", "graph_fn": None, "graph_view": None,
    "explanation": "Cada logaritmo requiere su argumento positivo:\n- $x - 2 > 0 \\implies x > 2$\n- $x + 2 > 0 \\implies x > -2$\n\nSe necesitan **ambas** condiciones simultáneamente. La más restrictiva es $x > 2$. Dominio: $(2, +\\infty)$.",
    "reviewed": False
  },
  # form_28: escribir fórmula dada asíntota x=3 y pasa por (4,0)
  {
    "external_id": "white_logarithmic_form_28",
    "belt": "white", "topic": "logarithmic", "exercise_type": "FORM",
    "question": "Una función logarítmica tiene asíntota vertical en $x = 3$, es creciente y pasa por el punto $(4,\\, 0)$.\n\n¿Cuál de estas fórmulas la describe?",
    "options": [
      "$f(x) = \\log_2(x + 3)$",
      "$f(x) = \\log_3(x - 3)$",
      "$f(x) = \\log_2(x - 3)$",
      "$f(x) = \\log_2(x) - 3$"
    ],
    "correct_index": 2, "has_math": True,
    "feedback_correct": "Asíntota en $x = 3$ → argumento $(x-3)$. Pasa por $(4,0)$: $\\log_2(4-3) = \\log_2(1) = 0$ ✓.",
    "feedback_incorrect": "", "graph_fn": None, "graph_view": None,
    "explanation": "Asíntota vertical en $x = 3$ → el argumento se anula en $x = 3$, o sea argumento $= (x - 3)$.\n\nVerificamos el punto $(4, 0)$: $\\log_2(4 - 3) = \\log_2(1) = 0$ ✓.\n\nLa base $2$ se confirma porque para $x = 5$: $\\log_2(5 - 3) = \\log_2(2) = 1$, es decir el punto $(5, 1)$.",
    "reviewed": False
  },
  # form_29: evaluar log₂(x+1) en x = 7
  {
    "external_id": "white_logarithmic_form_29",
    "belt": "white", "topic": "logarithmic", "exercise_type": "FORM",
    "question": "¿Cuánto vale $f(7)$ para $f(x) = \\log_2(x + 1)$?",
    "options": ["$4$", "$3$", "$7$", "$2$"],
    "correct_index": 1, "has_math": True,
    "feedback_correct": "$f(7) = \\log_2(7 + 1) = \\log_2(8) = 3$ porque $2^3 = 8$.",
    "feedback_incorrect": "", "graph_fn": None, "graph_view": None,
    "explanation": "$f(7) = \\log_2(7 + 1) = \\log_2(8)$.\n\n$2^3 = 8$, entonces $\\log_2(8) = 3$.",
    "reviewed": False
  },
  # form_30: inversa cotidiana — ¿cuántos años para llegar a $2000?
  {
    "external_id": "white_logarithmic_form_30",
    "belt": "white", "topic": "logarithmic", "exercise_type": "FORM",
    "question": "Una inversión crece según $M(t) = 1000 \\cdot (1{,}1)^t$.\n\n¿Cuál es la fórmula que calcula los años $t$ necesarios para llegar a un monto $M$?",
    "options": [
      "$t = 1000 \\cdot (1{,}1)^M$",
      "$t = \\dfrac{M}{1000 \\cdot 1{,}1}$",
      "$t = \\log_{1{,}1}\\!\\left(\\dfrac{M}{1000}\\right)$",
      "$t = \\dfrac{\\ln(M)}{1000}$"
    ],
    "correct_index": 2, "has_math": True,
    "feedback_correct": "Despejando $t$: $(1{,}1)^t = M/1000 \\implies t = \\log_{1{,}1}(M/1000)$.",
    "feedback_incorrect": "", "graph_fn": None, "graph_view": None,
    "explanation": "Partiendo de $M = 1000 \\cdot (1{,}1)^t$:\n$$\\frac{M}{1000} = (1{,}1)^t \\implies t = \\log_{1{,}1}\\!\\left(\\frac{M}{1000}\\right)$$\n\nEsta función $t(M)$ es logarítmica en $M$. Ejemplo: para $M = 2000$, $t = \\log_{1{,}1}(2) \\approx 7{,}3$ años.",
    "reviewed": False
  },
  # form_31: evaluar f(e) = ln(e) + 2 = 3
  {
    "external_id": "white_logarithmic_form_31",
    "belt": "white", "topic": "logarithmic", "exercise_type": "FORM",
    "question": "¿Cuánto vale $f(e)$ para $f(x) = \\ln(x) + 2$?",
    "options": ["$e + 2$", "$2e$", "$3$", "$1$"],
    "correct_index": 2, "has_math": True,
    "feedback_correct": "$f(e) = \\ln(e) + 2 = 1 + 2 = 3$.",
    "feedback_incorrect": "", "graph_fn": None, "graph_view": None,
    "explanation": "$f(e) = \\ln(e) + 2 = 1 + 2 = 3$.\n\nUsando $\\ln(e) = 1$ (propiedad fundamental).",
    "reviewed": False
  },
  # form_32: dominio de ln(4-x) — argumento decreciente
  {
    "external_id": "white_logarithmic_form_32",
    "belt": "white", "topic": "logarithmic", "exercise_type": "FORM",
    "question": "¿Cuál es el dominio de $f(x) = \\ln(4 - x)$?",
    "options": ["$x > 4$", "$x < 4$", "$x > -4$", "$x < -4$"],
    "correct_index": 1, "has_math": True,
    "feedback_correct": "Se necesita $4 - x > 0 \\implies -x > -4 \\implies x < 4$. Dominio: $(-\\infty, 4)$.",
    "feedback_incorrect": "", "graph_fn": None, "graph_view": None,
    "explanation": "El argumento debe ser positivo:\n$$4 - x > 0 \\implies -x > -4 \\implies x < 4$$\n\nDominio: $(-\\infty, 4)$. Asíntota vertical: $x = 4$.\n\nEsta función es la imagen especular de $\\ln(x - 4)$: la curva se refleja horizontalmente y queda en el semiplano $x < 4$.",
    "reviewed": False
  },
  # form_33: simplificar log₃(9x²)
  {
    "external_id": "white_logarithmic_form_33",
    "belt": "white", "topic": "logarithmic", "exercise_type": "FORM",
    "question": "¿Cuánto vale $\\log_3(9x^2)$?",
    "options": [
      "$9 + 2\\log_3(x)$",
      "$2 + \\log_3(x)$",
      "$2 + 2\\log_3(x)$",
      "$2\\log_3(9x)$"
    ],
    "correct_index": 2, "has_math": True,
    "feedback_correct": "$\\log_3(9x^2) = \\log_3(9) + \\log_3(x^2) = 2 + 2\\log_3(x)$.",
    "feedback_incorrect": "", "graph_fn": None, "graph_view": None,
    "explanation": "Aplicando propiedades paso a paso:\n$$\\log_3(9x^2) = \\log_3(9) + \\log_3(x^2) = 2 + 2\\log_3(x)$$\n\nUsando: $\\log_3(9) = 2$ (pues $3^2 = 9$) y $\\log_3(x^2) = 2\\log_3(x)$.",
    "reviewed": False
  },
  # form_34: asíntota de log₂(x)-3 (desplazamiento vertical, asíntota no cambia)
  {
    "external_id": "white_logarithmic_form_34",
    "belt": "white", "topic": "logarithmic", "exercise_type": "FORM",
    "question": "¿Cuál es la asíntota vertical de $f(x) = \\log_2(x) - 3$?",
    "options": ["$x = 3$", "$x = -3$", "$y = -3$", "$x = 0$"],
    "correct_index": 3, "has_math": True,
    "feedback_correct": "Restar $3$ es un desplazamiento vertical: la asíntota vertical sigue en $x = 0$.",
    "feedback_incorrect": "", "graph_fn": None, "graph_view": None,
    "explanation": "La asíntota vertical depende del argumento del logaritmo. Para $f(x) = \\log_2(x) - 3$, el argumento es $x$:\n$$x = 0 \\text{ → asíntota vertical}$$\n\nEl $-3$ es un desplazamiento vertical que baja la curva, pero no mueve la asíntota.",
    "reviewed": False
  },
  # form_35: intercepto de log₂(x-1) con eje X en x=2
  {
    "external_id": "white_logarithmic_form_35",
    "belt": "white", "topic": "logarithmic", "exercise_type": "FORM",
    "question": "¿En qué valor de $x$ la función $f(x) = \\log_2(x - 1)$ cruza el eje $X$?",
    "options": ["$x = 0$", "$x = 1$", "$x = 2$", "$x = 3$"],
    "correct_index": 2, "has_math": True,
    "feedback_correct": "$\\log_2(x - 1) = 0 \\implies x - 1 = 1 \\implies x = 2$.",
    "feedback_incorrect": "", "graph_fn": None, "graph_view": None,
    "explanation": "El intercepto con el eje $X$ ocurre cuando $f(x) = 0$:\n$$\\log_2(x - 1) = 0 \\implies x - 1 = 2^0 = 1 \\implies x = 2$$\n\nLa curva pasa por el punto $(2,\\, 0)$.",
    "reviewed": False
  },
  # form_36: ¿cuántas horas para llegar a 1600 bacterias desde 50?
  {
    "external_id": "white_logarithmic_form_36",
    "belt": "white", "topic": "logarithmic", "exercise_type": "FORM",
    "question": "Una colonia de bacterias parte de 50 y se duplica cada hora: $B(t) = 50 \\cdot 2^t$.\n\n¿Cuántas horas hacen falta para llegar a 1600 bacterias?",
    "options": ["$4$", "$5$", "$32$", "$6$"],
    "correct_index": 3, "has_math": True,
    "feedback_correct": "$1600 = 50 \\cdot 2^t \\implies 2^t = 32 = 2^5 \\implies t = 5$ horas.",
    "feedback_incorrect": "", "graph_fn": None, "graph_view": None,
    "explanation": "Despejamos $t$:\n$$1600 = 50 \\cdot 2^t \\implies 2^t = \\frac{1600}{50} = 32 = 2^5 \\implies t = 5$$\n\nSon $5$ horas. El proceso de despejar el tiempo usa un logaritmo: $t = \\log_2(32) = 5$.",
    "reviewed": False
  },
  # form_37: evaluar log₂(x-3) en x=11
  {
    "external_id": "white_logarithmic_form_37",
    "belt": "white", "topic": "logarithmic", "exercise_type": "FORM",
    "question": "¿Cuánto vale $f(11)$ para $f(x) = \\log_2(x - 3)$?",
    "options": ["$2$", "$3$", "$4$", "$8$"],
    "correct_index": 1, "has_math": True,
    "feedback_correct": "$f(11) = \\log_2(11 - 3) = \\log_2(8) = 3$ porque $2^3 = 8$.",
    "feedback_incorrect": "", "graph_fn": None, "graph_view": None,
    "explanation": "$f(11) = \\log_2(11 - 3) = \\log_2(8)$.\n\n$2^3 = 8$, entonces $\\log_2(8) = 3$.",
    "reviewed": False
  },
  # form_38: simplificar ln(x/e²)
  {
    "external_id": "white_logarithmic_form_38",
    "belt": "white", "topic": "logarithmic", "exercise_type": "FORM",
    "question": "¿Cuánto vale $\\ln\\!\\left(\\dfrac{x}{e^2}\\right)$?",
    "options": ["$\\ln(x) + 2$", "$\\ln(x) - 2$", "$\\dfrac{\\ln(x)}{2}$", "$\\ln(x) \\cdot e^{-2}$"],
    "correct_index": 1, "has_math": True,
    "feedback_correct": "$\\ln(x/e^2) = \\ln(x) - \\ln(e^2) = \\ln(x) - 2$.",
    "feedback_incorrect": "", "graph_fn": None, "graph_view": None,
    "explanation": "Propiedad del cociente y de la potencia:\n$$\\ln\\!\\left(\\frac{x}{e^2}\\right) = \\ln(x) - \\ln(e^2) = \\ln(x) - 2 \\cdot \\ln(e) = \\ln(x) - 2$$",
    "reviewed": False
  },
  # form_39: ¿cuántos años para duplicar inversión al 10%?
  {
    "external_id": "white_logarithmic_form_39",
    "belt": "white", "topic": "logarithmic", "exercise_type": "FORM",
    "question": "Una inversión crece un 10% anual: $M(t) = M_0 \\cdot (1{,}1)^t$.\n\nUsando $\\log_{1{,}1}(2) \\approx 7{,}3$, ¿cuántos años aproximados son necesarios para duplicar el capital?",
    "options": ["$5$", "$10$", "$7$", "$14$"],
    "correct_index": 2, "has_math": True,
    "feedback_correct": "Duplicar: $(1{,}1)^t = 2 \\implies t = \\log_{1{,}1}(2) \\approx 7{,}3$, es decir unos $7$ años.",
    "feedback_incorrect": "", "graph_fn": None, "graph_view": None,
    "explanation": "Para duplicar el capital: $M = 2M_0$:\n$$2M_0 = M_0 \\cdot (1{,}1)^t \\implies (1{,}1)^t = 2 \\implies t = \\log_{1{,}1}(2) \\approx 7{,}3 \\text{ años}$$",
    "reviewed": False
  },
  # form_40: dominio de log₂(x²) — tricky: x²>0 para x≠0
  {
    "external_id": "white_logarithmic_form_40",
    "belt": "white", "topic": "logarithmic", "exercise_type": "FORM",
    "question": "¿Cuál es el dominio de $f(x) = \\log_2(x^2)$?",
    "options": ["$x > 0$", "$x \\geq 0$", "$x \\neq 0$", "$\\mathbb{R}$"],
    "correct_index": 2, "has_math": True,
    "feedback_correct": "$x^2 > 0$ para todo $x \\neq 0$: el dominio es $\\mathbb{R} \\setminus \\{0\\}$, es decir $x \\neq 0$.",
    "feedback_incorrect": "", "graph_fn": None, "graph_view": None,
    "explanation": "El argumento $x^2 > 0$ cuando $x \\neq 0$ (para $x = 0$, $x^2 = 0$ y el logaritmo no existe).\n\nDominio: $\\mathbb{R} \\setminus \\{0\\} = (-\\infty, 0) \\cup (0, +\\infty)$, o sea todos los reales excepto cero.\n\nNota: $\\log_2(x^2) = 2\\log_2|x|$, lo que confirma que existe para $x$ positivo y negativo.",
    "reviewed": False
  },
  # form_41: escribir fórmula — asíntota en x=-1, pasa por (0,0), base 2
  {
    "external_id": "white_logarithmic_form_41",
    "belt": "white", "topic": "logarithmic", "exercise_type": "FORM",
    "question": "Una función logarítmica (base $2$) tiene asíntota vertical en $x = -1$ y pasa por el punto $(0,\\, 0)$.\n\n¿Cuál de estas fórmulas la describe?",
    "options": [
      "$f(x) = \\log_2(x - 1)$",
      "$f(x) = \\log_2(x) - 1$",
      "$f(x) = \\log_2(x + 1)$",
      "$f(x) = \\log_2(x + 2)$"
    ],
    "correct_index": 2, "has_math": True,
    "feedback_correct": "Asíntota en $x = -1$ → argumento $(x+1)$. Pasa por $(0,0)$: $\\log_2(0+1)=0$ ✓.",
    "feedback_incorrect": "", "graph_fn": None, "graph_view": None,
    "explanation": "Asíntota en $x = -1$ → el argumento se anula en $x = -1$, entonces argumento $= x + 1$.\n\nVerificación con el punto $(0, 0)$: $\\log_2(0 + 1) = \\log_2(1) = 0$ ✓.",
    "reviewed": False
  },
  # form_42: evaluar 2·log₂(4)
  {
    "external_id": "white_logarithmic_form_42",
    "belt": "white", "topic": "logarithmic", "exercise_type": "FORM",
    "question": "¿Cuánto vale $f(4)$ para $f(x) = 2 \\cdot \\log_2(x)$?",
    "options": ["$8$", "$4$", "$3$", "$2$"],
    "correct_index": 1, "has_math": True,
    "feedback_correct": "$f(4) = 2 \\cdot \\log_2(4) = 2 \\cdot 2 = 4$.",
    "feedback_incorrect": "", "graph_fn": None, "graph_view": None,
    "explanation": "$f(4) = 2 \\cdot \\log_2(4) = 2 \\cdot 2 = 4$.\n\nUsando $\\log_2(4) = 2$ (pues $2^2 = 4$).",
    "reviewed": False
  },
  # form_43: simplificar log₂(16/x)
  {
    "external_id": "white_logarithmic_form_43",
    "belt": "white", "topic": "logarithmic", "exercise_type": "FORM",
    "question": "¿Cuánto vale $\\log_2\\!\\left(\\dfrac{16}{x}\\right)$?",
    "options": [
      "$16 - \\log_2(x)$",
      "$\\dfrac{4}{\\log_2(x)}$",
      "$4 - \\log_2(x)$",
      "$4 + \\log_2(x)$"
    ],
    "correct_index": 2, "has_math": True,
    "feedback_correct": "$\\log_2(16/x) = \\log_2(16) - \\log_2(x) = 4 - \\log_2(x)$.",
    "feedback_incorrect": "", "graph_fn": None, "graph_view": None,
    "explanation": "Propiedad del cociente:\n$$\\log_2\\!\\left(\\frac{16}{x}\\right) = \\log_2(16) - \\log_2(x) = 4 - \\log_2(x)$$\n\nUsando $\\log_2(16) = 4$ (pues $2^4 = 16$).",
    "reviewed": False
  },
  # form_44: ¿cuántos períodos para llegar a 3·P₀ al 5% mensual?
  {
    "external_id": "white_logarithmic_form_44",
    "belt": "white", "topic": "logarithmic", "exercise_type": "FORM",
    "question": "Una deuda crece un 5% mensual: $D(t) = D_0 \\cdot (1{,}05)^t$.\n\nUsando $\\log_{1{,}05}(3) \\approx 22{,}5$, ¿cuántos meses aproximados hacen falta para que la deuda se triplique?",
    "options": ["$5$", "$15$", "$22$", "$30$"],
    "correct_index": 2, "has_math": True,
    "feedback_correct": "$(1{,}05)^t = 3 \\implies t = \\log_{1{,}05}(3) \\approx 22{,}5$, es decir unos $22$ meses.",
    "feedback_incorrect": "", "graph_fn": None, "graph_view": None,
    "explanation": "$3D_0 = D_0 \\cdot (1{,}05)^t \\implies (1{,}05)^t = 3 \\implies t = \\log_{1{,}05}(3) \\approx 22{,}5$ meses.\n\nEso da algo más de $22$ meses completos.",
    "reviewed": False
  },
  # form_45: desde gráfico — log(x)/log(3), asíntota x=0, pasa por (3,1)
  {
    "external_id": "white_logarithmic_form_45",
    "belt": "white", "topic": "logarithmic", "exercise_type": "FORM",
    "question": "¿Cuál de estas expresiones corresponde a la curva del gráfico?",
    "options": [
      "$f(x) = \\log_2(x)$",
      "$f(x) = \\log_3(x)$",
      "$f(x) = \\log_3(x) + 1$",
      "$f(x) = 3^x$"
    ],
    "correct_index": 1, "has_math": True,
    "feedback_correct": "La curva pasa por $(3, 1)$ con asíntota en $x = 0$: $f(x) = \\log_3(x)$.",
    "feedback_incorrect": "", "graph_fn": "log(x)/log(3)", "graph_view": [-0.5, 8.5, -3, 5],
    "explanation": "Claves:\n1. Asíntota vertical en $x = 0$ → argumento sin desplazamiento.\n2. Pasa por $(1, 0)$ → no hay desplazamiento vertical.\n3. Pasa por $(3, 1)$ → $f(3) = 1$, es decir la base es $3$.\n\nConclusión: $f(x) = \\log_3(x)$.",
    "reviewed": False
  },
  # form_46: intercepto de log₂(x)-1 con eje X
  {
    "external_id": "white_logarithmic_form_46",
    "belt": "white", "topic": "logarithmic", "exercise_type": "FORM",
    "question": "¿En qué valor de $x$ la función $f(x) = \\log_2(x) - 1$ cruza el eje $X$?",
    "options": ["$x = 1$", "$x = 2$", "$x = 3$", "$x = 4$"],
    "correct_index": 1, "has_math": True,
    "feedback_correct": "$\\log_2(x) - 1 = 0 \\implies \\log_2(x) = 1 \\implies x = 2^1 = 2$.",
    "feedback_incorrect": "", "graph_fn": None, "graph_view": None,
    "explanation": "El intercepto con el eje $X$ ocurre cuando $f(x) = 0$:\n$$\\log_2(x) - 1 = 0 \\implies \\log_2(x) = 1 \\implies x = 2^1 = 2$$\n\nLa curva pasa por el punto $(2,\\, 0)$.",
    "reviewed": False
  },
  # form_47: evaluar ln(x+1) en x = e²-1
  {
    "external_id": "white_logarithmic_form_47",
    "belt": "white", "topic": "logarithmic", "exercise_type": "FORM",
    "question": "¿Cuánto vale $f(e^2 - 1)$ para $f(x) = \\ln(x + 1)$?",
    "options": ["$e^2$", "$1$", "$2$", "$e$"],
    "correct_index": 2, "has_math": True,
    "feedback_correct": "$f(e^2 - 1) = \\ln(e^2 - 1 + 1) = \\ln(e^2) = 2$.",
    "feedback_incorrect": "", "graph_fn": None, "graph_view": None,
    "explanation": "$f(e^2 - 1) = \\ln((e^2 - 1) + 1) = \\ln(e^2) = 2 \\cdot \\ln(e) = 2 \\cdot 1 = 2$.",
    "reviewed": False
  },
  # form_48: asíntota de log₂(2x+6)
  {
    "external_id": "white_logarithmic_form_48",
    "belt": "white", "topic": "logarithmic", "exercise_type": "FORM",
    "question": "¿Cuál es la asíntota vertical de $f(x) = \\log_2(2x + 6)$?",
    "options": ["$x = 6$", "$x = -6$", "$x = -3$", "$x = 3$"],
    "correct_index": 2, "has_math": True,
    "feedback_correct": "El argumento se anula cuando $2x + 6 = 0 \\implies x = -3$. Asíntota en $x = -3$.",
    "feedback_incorrect": "", "graph_fn": None, "graph_view": None,
    "explanation": "$2x + 6 = 0 \\implies 2x = -6 \\implies x = -3$.\n\nAsíntota vertical: $x = -3$. Dominio: $(-3, +\\infty)$.",
    "reviewed": False
  },
  # form_49: simplificar log₂(8/4) = 1
  {
    "external_id": "white_logarithmic_form_49",
    "belt": "white", "topic": "logarithmic", "exercise_type": "FORM",
    "question": "¿Cuánto vale $\\log_2(8) - \\log_2(4)$?",
    "options": ["$2$", "$4$", "$1$", "$0$"],
    "correct_index": 2, "has_math": True,
    "feedback_correct": "$\\log_2(8) - \\log_2(4) = \\log_2(8/4) = \\log_2(2) = 1$.",
    "feedback_incorrect": "", "graph_fn": None, "graph_view": None,
    "explanation": "Propiedad del cociente:\n$$\\log_2(8) - \\log_2(4) = \\log_2\\!\\left(\\frac{8}{4}\\right) = \\log_2(2) = 1$$\n\nO directo: $\\log_2(8) = 3$ y $\\log_2(4) = 2$, entonces $3 - 2 = 1$.",
    "reviewed": False
  },
  # form_50: ¿cuántos años para que el auto valga la mitad? (depreciación 20%)
  {
    "external_id": "white_logarithmic_form_50",
    "belt": "white", "topic": "logarithmic", "exercise_type": "FORM",
    "question": "Un auto se deprecia un 20% anual: $V(t) = V_0 \\cdot (0{,}8)^t$.\n\nUsando $\\log_{0{,}8}(0{,}5) \\approx 3{,}1$, ¿cuántos años aproximados hacen falta para que el auto valga la mitad?",
    "options": ["$2$", "$3$", "$4$", "$8$"],
    "correct_index": 1, "has_math": True,
    "feedback_correct": "$(0{,}8)^t = 0{,}5 \\implies t = \\log_{0{,}8}(0{,}5) \\approx 3{,}1$, es decir unos $3$ años.",
    "feedback_incorrect": "", "graph_fn": None, "graph_view": None,
    "explanation": "Para que el auto valga la mitad: $V_0/2 = V_0 \\cdot (0{,}8)^t$, es decir $(0{,}8)^t = 0{,}5$. Despejando:\n$$t = \\log_{0{,}8}(0{,}5) = \\frac{\\ln(0{,}5)}{\\ln(0{,}8)} \\approx \\frac{-0{,}693}{-0{,}223} \\approx 3{,}1$$\n\nSon unos $3$ años.",
    "reviewed": False
  },
]

exercises.extend(new_form)
print(f"FORM added: {len(new_form)} (total: {len(exercises)})")

with open(PATH, "w", encoding="utf-8") as f:
    json.dump(exercises, f, ensure_ascii=False, indent=2)
    f.write("\n")
print("OK")
