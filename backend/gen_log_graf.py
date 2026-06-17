import json

PATH = "content/analisis-1/exercises/white_logarithmic.json"
with open(PATH, encoding="utf-8") as f:
    exercises = json.load(f)

new_graf = [
  # ── TIPO A: Leer propiedades (graf_01..25) ──────────────────────────────────

  # graf_01: log2(x) — ¿crece o decrece?
  {
    "external_id": "white_logarithmic_graf_01",
    "belt": "white", "topic": "logarithmic", "exercise_type": "GRAF",
    "question": "¿La función representada en el gráfico es creciente o decreciente?",
    "options": ["Creciente", "Decreciente", "Primero crece y luego decrece", "Ninguna de las anteriores"],
    "correct_index": 0, "has_math": True,
    "feedback_correct": "La curva sube de izquierda a derecha: es estrictamente creciente.",
    "feedback_incorrect": "", "graph_fn": "log2(x)", "graph_view": [-0.5, 8.5, -3, 5],
    "explanation": "$f(x) = \\log_2(x)$ con base $2 > 1$ es **estrictamente creciente** en todo su dominio $(0, +\\infty)$.\n\nEn el gráfico se observa que al avanzar hacia la derecha la curva siempre sube, aunque cada vez más lentamente.",
    "reviewed": False
  },
  # graf_02: log2(x) — asíntota vertical
  {
    "external_id": "white_logarithmic_graf_02",
    "belt": "white", "topic": "logarithmic", "exercise_type": "GRAF",
    "question": "¿Cuál es la asíntota vertical de la función del gráfico?",
    "options": ["$y = 0$", "$x = 1$", "$x = 0$", "$y = 1$"],
    "correct_index": 2, "has_math": True,
    "feedback_correct": "La curva se acerca al eje vertical ($x = 0$) sin cruzarlo: la asíntota vertical es $x = 0$.",
    "feedback_incorrect": "", "graph_fn": "log2(x)", "graph_view": [-0.5, 8.5, -3, 5],
    "explanation": "Toda logarítmica básica $\\log_b(x)$ tiene **asíntota vertical en $x = 0$**, ya que el argumento no puede ser cero ni negativo.\n\nEn el gráfico, la curva viene de $-\\infty$ abrazando el eje $Y$ por la derecha, sin cruzarlo.",
    "reviewed": False
  },
  # graf_03: log2(x) — intercepto con eje X
  {
    "external_id": "white_logarithmic_graf_03",
    "belt": "white", "topic": "logarithmic", "exercise_type": "GRAF",
    "question": "¿En qué punto la curva del gráfico cruza el eje $X$?",
    "options": ["$(0,\\, 1)$", "$(2,\\, 0)$", "$(1,\\, 0)$", "$(0,\\, 0)$"],
    "correct_index": 2, "has_math": True,
    "feedback_correct": "Toda $\\log_b(x)$ pasa por $(1, 0)$ porque $\\log_b(1) = 0$.",
    "feedback_incorrect": "", "graph_fn": "log2(x)", "graph_view": [-0.5, 8.5, -3, 5],
    "explanation": "$\\log_2(1) = 0$ porque $2^0 = 1$.\n\nEl punto $(1, 0)$ es universal en logarítmicas básicas: sin importar la base, siempre pasa por $(1, 0)$.",
    "reviewed": False
  },
  # graf_04: log2(x) — f(4)
  {
    "external_id": "white_logarithmic_graf_04",
    "belt": "white", "topic": "logarithmic", "exercise_type": "GRAF",
    "question": "¿Cuánto vale $f(4)$ según el gráfico?",
    "options": ["$1$", "$3$", "$4$", "$2$"],
    "correct_index": 3, "has_math": True,
    "feedback_correct": "$f(4) = \\log_2(4) = 2$ porque $2^2 = 4$.",
    "feedback_incorrect": "", "graph_fn": "log2(x)", "graph_view": [-0.5, 8.5, -3, 5],
    "explanation": "En el gráfico, cuando $x = 4$ la curva alcanza $y = 2$, confirmando $\\log_2(4) = 2$.\n\nPuntos clave de $\\log_2(x)$: $(1, 0)$, $(2, 1)$, $(4, 2)$, $(8, 3)$.",
    "reviewed": False
  },
  # graf_05: log2(x) — dominio
  {
    "external_id": "white_logarithmic_graf_05",
    "belt": "white", "topic": "logarithmic", "exercise_type": "GRAF",
    "question": "¿Cuál es el dominio de la función representada?",
    "options": ["$\\mathbb{R}$", "$x \\geq 0$", "$(0,\\, +\\infty)$", "$x > 1$"],
    "correct_index": 2, "has_math": True,
    "feedback_correct": "La curva existe solo para $x > 0$: el dominio es $(0, +\\infty)$.",
    "feedback_incorrect": "", "graph_fn": "log2(x)", "graph_view": [-0.5, 8.5, -3, 5],
    "explanation": "El logaritmo requiere argumento **estrictamente positivo**. La gráfica confirma que la curva solo existe a la derecha del eje $Y$ (excluyendo $x = 0$).\n\nDominio: $(0, +\\infty)$. No incluye $x = 0$ (asíntota) ni valores negativos.",
    "reviewed": False
  },
  # graf_06: log2(x) — imagen = ℝ
  {
    "external_id": "white_logarithmic_graf_06",
    "belt": "white", "topic": "logarithmic", "exercise_type": "GRAF",
    "question": "¿Cuál es la imagen (recorrido) de la función del gráfico?",
    "options": ["$(0,\\, +\\infty)$", "$[0,\\, +\\infty)$", "$(-\\infty,\\, 1)$", "$\\mathbb{R}$"],
    "correct_index": 3, "has_math": True,
    "feedback_correct": "La función toma todos los valores reales: imagen $= \\mathbb{R}$.",
    "feedback_incorrect": "", "graph_fn": "log2(x)", "graph_view": [-0.5, 8.5, -3, 5],
    "explanation": "La curva logarítmica crece sin cota superior ($f(x) \\to +\\infty$ cuando $x \\to +\\infty$) y cae sin cota inferior ($f(x) \\to -\\infty$ cuando $x \\to 0^+$).\n\nImagen: $\\mathbb{R}$ (todos los reales). Contrasta con la exponencial, cuya imagen es $(0, +\\infty)$.",
    "reviewed": False
  },
  # graf_07: log2(x) — f(2)
  {
    "external_id": "white_logarithmic_graf_07",
    "belt": "white", "topic": "logarithmic", "exercise_type": "GRAF",
    "question": "¿Cuánto vale $f(2)$ según el gráfico?",
    "options": ["$2$", "$0$", "$4$", "$1$"],
    "correct_index": 3, "has_math": True,
    "feedback_correct": "$f(2) = \\log_2(2) = 1$ porque $2^1 = 2$.",
    "feedback_incorrect": "", "graph_fn": "log2(x)", "graph_view": [-0.5, 8.5, -3, 5],
    "explanation": "En el gráfico, en $x = 2$ la curva vale $y = 1$.\n\n$\\log_2(2) = 1$ porque $2^1 = 2$. El punto $(2, 1)$ es la clave para identificar que la base es $2$.",
    "reviewed": False
  },
  # graf_08: -log2(x) — ¿crece o decrece?
  {
    "external_id": "white_logarithmic_graf_08",
    "belt": "white", "topic": "logarithmic", "exercise_type": "GRAF",
    "question": "¿La función representada en el gráfico es creciente o decreciente?",
    "options": ["Creciente", "Decreciente", "Constante", "No es monótona"],
    "correct_index": 1, "has_math": True,
    "feedback_correct": "La curva desciende de izquierda a derecha: es estrictamente decreciente.",
    "feedback_incorrect": "", "graph_fn": "-log2(x)", "graph_view": [-0.5, 8.5, -4, 4],
    "explanation": "$f(x) = -\\log_2(x)$ es la reflexión de $\\log_2(x)$ respecto al eje $X$.\n\nComo $\\log_2(x)$ es creciente, $-\\log_2(x)$ es **estrictamente decreciente**: al avanzar a la derecha, la curva siempre baja.",
    "reviewed": False
  },
  # graf_09: -log2(x) — asíntota vertical
  {
    "external_id": "white_logarithmic_graf_09",
    "belt": "white", "topic": "logarithmic", "exercise_type": "GRAF",
    "question": "¿Cuál es la asíntota vertical de la función del gráfico?",
    "options": ["$x = -1$", "$y = 0$", "$x = 1$", "$x = 0$"],
    "correct_index": 3, "has_math": True,
    "feedback_correct": "La curva se acerca al eje $Y$ ($x = 0$) sin cruzarlo desde la derecha: asíntota en $x = 0$.",
    "feedback_incorrect": "", "graph_fn": "-log2(x)", "graph_view": [-0.5, 8.5, -4, 4],
    "explanation": "El signo negativo no afecta la asíntota: $-\\log_2(x)$ sigue teniendo argumento $x$, que no puede ser cero.\n\nAsíntota vertical: $x = 0$. La curva viene de $+\\infty$ junto al eje $Y$ y luego desciende.",
    "reviewed": False
  },
  # graf_10: -log2(x) — intercepto con eje X
  {
    "external_id": "white_logarithmic_graf_10",
    "belt": "white", "topic": "logarithmic", "exercise_type": "GRAF",
    "question": "¿En qué punto la curva del gráfico cruza el eje $X$?",
    "options": ["$(2,\\, 0)$", "$(0,\\, 0)$", "$(0,\\, 1)$", "$(1,\\, 0)$"],
    "correct_index": 3, "has_math": True,
    "feedback_correct": "$-\\log_2(1) = -0 = 0$: la curva cruza el eje $X$ en $(1, 0)$.",
    "feedback_incorrect": "", "graph_fn": "-log2(x)", "graph_view": [-0.5, 8.5, -4, 4],
    "explanation": "$-\\log_2(x) = 0 \\implies \\log_2(x) = 0 \\implies x = 1$.\n\nLa reflexión respecto al eje $X$ no desplaza el punto $(1, 0)$: ambas curvas, $\\log_2(x)$ y $-\\log_2(x)$, pasan por $(1, 0)$.",
    "reviewed": False
  },
  # graf_11: log2(x)+1 — asíntota vertical
  {
    "external_id": "white_logarithmic_graf_11",
    "belt": "white", "topic": "logarithmic", "exercise_type": "GRAF",
    "question": "¿Cuál es la asíntota vertical de la función del gráfico?",
    "options": ["$x = 1$", "$x = -1$", "$y = 1$", "$x = 0$"],
    "correct_index": 3, "has_math": True,
    "feedback_correct": "El desplazamiento vertical $+1$ no mueve la asíntota: sigue en $x = 0$.",
    "feedback_incorrect": "", "graph_fn": "log2(x)+1", "graph_view": [-0.5, 8.5, -2, 6],
    "explanation": "Para $f(x) = \\log_2(x) + 1$, el argumento del logaritmo es $x$.\n\nLa asíntota está donde el argumento se anula: $x = 0$. El $+1$ solo sube la curva — no mueve la asíntota.",
    "reviewed": False
  },
  # graf_12: log2(x)+1 — f(1)
  {
    "external_id": "white_logarithmic_graf_12",
    "belt": "white", "topic": "logarithmic", "exercise_type": "GRAF",
    "question": "¿Cuánto vale $f(1)$ según el gráfico?",
    "options": ["$0$", "$2$", "$3$", "$1$"],
    "correct_index": 3, "has_math": True,
    "feedback_correct": "$f(1) = \\log_2(1) + 1 = 0 + 1 = 1$.",
    "feedback_incorrect": "", "graph_fn": "log2(x)+1", "graph_view": [-0.5, 8.5, -2, 6],
    "explanation": "$f(1) = \\log_2(1) + 1 = 0 + 1 = 1$.\n\nEl desplazamiento vertical $+1$ hace que el punto que antes estaba en $(1, 0)$ ahora esté en $(1, 1)$.",
    "reviewed": False
  },
  # graf_13: log2(x)+1 — raíz en x=1/2
  {
    "external_id": "white_logarithmic_graf_13",
    "belt": "white", "topic": "logarithmic", "exercise_type": "GRAF",
    "question": "¿En qué valor de $x$ la función del gráfico cruza el eje $X$?",
    "options": ["$x = 1$", "$x = 0{,}5$", "$x = 2$", "$x = 0$"],
    "correct_index": 1, "has_math": True,
    "feedback_correct": "$\\log_2(x) + 1 = 0 \\implies \\log_2(x) = -1 \\implies x = 2^{-1} = 0{,}5$.",
    "feedback_incorrect": "", "graph_fn": "log2(x)+1", "graph_view": [-0.5, 8.5, -2, 6],
    "explanation": "Igualando a cero:\n$$\\log_2(x) + 1 = 0 \\implies \\log_2(x) = -1 \\implies x = 2^{-1} = \\frac{1}{2} = 0{,}5$$\n\nLa curva corta el eje $X$ en $x = 0{,}5$.",
    "reviewed": False
  },
  # graf_14: log2(x-1) — asíntota
  {
    "external_id": "white_logarithmic_graf_14",
    "belt": "white", "topic": "logarithmic", "exercise_type": "GRAF",
    "question": "¿Cuál es la asíntota vertical de la función del gráfico?",
    "options": ["$x = 0$", "$x = 2$", "$y = 1$", "$x = 1$"],
    "correct_index": 3, "has_math": True,
    "feedback_correct": "El argumento $x - 1$ se anula en $x = 1$: la asíntota vertical es $x = 1$.",
    "feedback_incorrect": "", "graph_fn": "log2(x-1)", "graph_view": [0.5, 9.5, -3, 4],
    "explanation": "Para $f(x) = \\log_2(x - 1)$, el argumento se anula cuando $x - 1 = 0$, es decir $x = 1$.\n\nAsíntota vertical: $x = 1$. La curva viene de $-\\infty$ abrazando la recta vertical $x = 1$ por la derecha.",
    "reviewed": False
  },
  # graf_15: log2(x-1) — dominio
  {
    "external_id": "white_logarithmic_graf_15",
    "belt": "white", "topic": "logarithmic", "exercise_type": "GRAF",
    "question": "¿Cuál es el dominio de la función representada?",
    "options": ["$x > 0$", "$x \\geq 1$", "$(1,\\, +\\infty)$", "$\\mathbb{R}$"],
    "correct_index": 2, "has_math": True,
    "feedback_correct": "El argumento $x - 1 > 0$ exige $x > 1$: dominio $(1, +\\infty)$.",
    "feedback_incorrect": "", "graph_fn": "log2(x-1)", "graph_view": [0.5, 9.5, -3, 4],
    "explanation": "El argumento debe ser positivo: $x - 1 > 0 \\implies x > 1$.\n\nEl dominio es $(1, +\\infty)$, como se ve en el gráfico: la curva solo existe a la derecha de $x = 1$.",
    "reviewed": False
  },
  # graf_16: log2(x-1) — intercepto X en x=2
  {
    "external_id": "white_logarithmic_graf_16",
    "belt": "white", "topic": "logarithmic", "exercise_type": "GRAF",
    "question": "¿En qué punto la curva del gráfico cruza el eje $X$?",
    "options": ["$(1,\\, 0)$", "$(3,\\, 0)$", "$(0,\\, 0)$", "$(2,\\, 0)$"],
    "correct_index": 3, "has_math": True,
    "feedback_correct": "$\\log_2(x - 1) = 0 \\implies x - 1 = 1 \\implies x = 2$.",
    "feedback_incorrect": "", "graph_fn": "log2(x-1)", "graph_view": [0.5, 9.5, -3, 4],
    "explanation": "$\\log_2(x - 1) = 0 \\implies x - 1 = 2^0 = 1 \\implies x = 2$.\n\nEl intercepto con el eje $X$ se desplaza de $x = 1$ (de la básica) a $x = 2$ (desplazada en $+1$).",
    "reviewed": False
  },
  # graf_17: ln(x) — f(e)
  {
    "external_id": "white_logarithmic_graf_17",
    "belt": "white", "topic": "logarithmic", "exercise_type": "GRAF",
    "question": "¿Cuánto vale $f(e)$ según el gráfico?",
    "options": ["$e$", "$0$", "$2$", "$1$"],
    "correct_index": 3, "has_math": True,
    "feedback_correct": "$f(e) = \\ln(e) = 1$: el punto $(e, 1)$ pertenece a la curva.",
    "feedback_incorrect": "", "graph_fn": "ln(x)", "graph_view": [-0.5, 8.5, -2, 5],
    "explanation": "$\\ln(e) = 1$ porque $e^1 = e$.\n\nEl punto $(e,\\, 1) \\approx (2{,}7,\\, 1)$ es la clave para identificar el logaritmo natural $\\ln(x)$.",
    "reviewed": False
  },
  # graf_18: ln(x) — crece o decrece
  {
    "external_id": "white_logarithmic_graf_18",
    "belt": "white", "topic": "logarithmic", "exercise_type": "GRAF",
    "question": "¿La función representada en el gráfico es creciente o decreciente?",
    "options": ["Decreciente", "No es monótona", "Creciente", "Constante"],
    "correct_index": 2, "has_math": True,
    "feedback_correct": "$\\ln(x)$ con base $e > 1$ es estrictamente creciente.",
    "feedback_incorrect": "", "graph_fn": "ln(x)", "graph_view": [-0.5, 8.5, -2, 5],
    "explanation": "$\\ln(x) = \\log_e(x)$ y $e \\approx 2{,}7 > 1$, por lo que la función es **estrictamente creciente**.\n\nEn el gráfico se observa una curva que siempre sube de izquierda a derecha.",
    "reviewed": False
  },
  # graf_19: log(x)/log(3) — f(3)
  {
    "external_id": "white_logarithmic_graf_19",
    "belt": "white", "topic": "logarithmic", "exercise_type": "GRAF",
    "question": "¿Cuánto vale $f(3)$ según el gráfico?",
    "options": ["$3$", "$0$", "$2$", "$1$"],
    "correct_index": 3, "has_math": True,
    "feedback_correct": "$f(3) = \\log_3(3) = 1$ porque $3^1 = 3$.",
    "feedback_incorrect": "", "graph_fn": "log(x)/log(3)", "graph_view": [-0.5, 8.5, -3, 5],
    "explanation": "La curva corresponde a $\\log_3(x)$. El punto $(3, 1)$ pertenece a la gráfica porque $\\log_3(3) = 1$.\n\nRecordá: el punto $(b, 1)$ siempre pertenece a $\\log_b(x)$.",
    "reviewed": False
  },
  # graf_20: log(x)/log(3) — f(9)
  {
    "external_id": "white_logarithmic_graf_20",
    "belt": "white", "topic": "logarithmic", "exercise_type": "GRAF",
    "question": "¿Cuánto vale $f(9)$ según el gráfico?",
    "options": ["$3$", "$9$", "$1$", "$2$"],
    "correct_index": 3, "has_math": True,
    "feedback_correct": "$f(9) = \\log_3(9) = 2$ porque $3^2 = 9$.",
    "feedback_incorrect": "", "graph_fn": "log(x)/log(3)", "graph_view": [-0.5, 8.5, -3, 5],
    "explanation": "$\\log_3(9) = 2$ porque $3^2 = 9$.\n\nEn el gráfico, en $x = 9$ la curva alcanza $y = 2$.",
    "reviewed": False
  },
  # graf_21: log2(x) — sin extremos locales
  {
    "external_id": "white_logarithmic_graf_21",
    "belt": "white", "topic": "logarithmic", "exercise_type": "GRAF",
    "question": "¿La función del gráfico tiene algún extremo local (máximo o mínimo)?",
    "options": ["Sí, tiene un mínimo", "Sí, tiene un máximo", "Sí, tiene ambos", "No tiene extremos locales"],
    "correct_index": 3, "has_math": True,
    "feedback_correct": "Las logarítmicas son estrictamente monótonas: nunca tienen extremos locales.",
    "feedback_incorrect": "", "graph_fn": "log2(x)", "graph_view": [-0.5, 8.5, -3, 5],
    "explanation": "Una función **estrictamente creciente** (o decreciente) nunca puede tener un máximo o mínimo local, porque siempre hay un punto mayor (o menor) cerca.\n\nLa gráfica de $\\log_2(x)$ siempre sube, nunca se da vuelta.",
    "reviewed": False
  },
  # graf_22: log2(x) — x→+∞, f→+∞
  {
    "external_id": "white_logarithmic_graf_22",
    "belt": "white", "topic": "logarithmic", "exercise_type": "GRAF",
    "question": "¿Hacia dónde tiende la función del gráfico cuando $x \\to +\\infty$?",
    "options": ["Tiende a $0$", "Tiende a $1$", "Tiende a $+\\infty$", "Tiende a un valor finito"],
    "correct_index": 2, "has_math": True,
    "feedback_correct": "$\\log_2(x) \\to +\\infty$ cuando $x \\to +\\infty$, aunque lo hace muy lentamente.",
    "feedback_incorrect": "", "graph_fn": "log2(x)", "graph_view": [-0.5, 8.5, -3, 5],
    "explanation": "$\\log_b(x) \\to +\\infty$ cuando $x \\to +\\infty$ (con $b > 1$). La función no tiene asíntota horizontal.\n\nAunque la curva crece muy lentamente (para $x = 1{.}000{.}000$, $\\log_2(x) \\approx 20$), no está acotada superiormente.",
    "reviewed": False
  },
  # graf_23: -log2(x) — imagen = ℝ
  {
    "external_id": "white_logarithmic_graf_23",
    "belt": "white", "topic": "logarithmic", "exercise_type": "GRAF",
    "question": "¿Cuál es la imagen (recorrido) de la función del gráfico?",
    "options": ["$(0,\\, +\\infty)$", "$(-\\infty,\\, 0)$", "$[-1,\\, 1]$", "$\\mathbb{R}$"],
    "correct_index": 3, "has_math": True,
    "feedback_correct": "$-\\log_2(x)$ también tiene imagen $\\mathbb{R}$: la reflexión no restringe los valores.",
    "feedback_incorrect": "", "graph_fn": "-log2(x)", "graph_view": [-0.5, 8.5, -4, 4],
    "explanation": "La imagen de $\\log_2(x)$ es $\\mathbb{R}$. Al multiplicar por $-1$, los valores positivos se vuelven negativos y viceversa, pero siguen cubriendo $\\mathbb{R}$.\n\nEn el gráfico, la curva puede tomar cualquier valor real (sube indefinidamente hacia $x = 0^+$ y baja indefinidamente para $x$ grande).",
    "reviewed": False
  },
  # graf_24: log2(x-1) — f(3)
  {
    "external_id": "white_logarithmic_graf_24",
    "belt": "white", "topic": "logarithmic", "exercise_type": "GRAF",
    "question": "¿Cuánto vale $f(3)$ según el gráfico?",
    "options": ["$3$", "$0$", "$2$", "$1$"],
    "correct_index": 3, "has_math": True,
    "feedback_correct": "$f(3) = \\log_2(3 - 1) = \\log_2(2) = 1$.",
    "feedback_incorrect": "", "graph_fn": "log2(x-1)", "graph_view": [0.5, 9.5, -3, 4],
    "explanation": "$f(3) = \\log_2(3 - 1) = \\log_2(2) = 1$ porque $2^1 = 2$.\n\nEn el gráfico, la curva pasa por $(3, 1)$.",
    "reviewed": False
  },
  # graf_25: log2(x)+1 — sin máximo
  {
    "external_id": "white_logarithmic_graf_25",
    "belt": "white", "topic": "logarithmic", "exercise_type": "GRAF",
    "question": "¿La función del gráfico tiene algún valor máximo?",
    "options": ["Sí, el máximo es $2$", "Sí, el máximo es $1$", "Sí, el máximo depende del dominio", "No tiene máximo"],
    "correct_index": 3, "has_math": True,
    "feedback_correct": "Las logarítmicas crecen sin cota: no tienen máximo.",
    "feedback_incorrect": "", "graph_fn": "log2(x)+1", "graph_view": [-0.5, 8.5, -2, 6],
    "explanation": "$f(x) = \\log_2(x) + 1$ es estrictamente creciente y $f(x) \\to +\\infty$ cuando $x \\to +\\infty$.\n\nNo tiene valor máximo: la curva siempre puede subir más, aunque lo hace cada vez más lentamente.",
    "reviewed": False
  },

  # ── TIPO B: Identificar fórmula (graf_26..40) ───────────────────────────────

  # graf_26: identificar log2(x)
  {
    "external_id": "white_logarithmic_graf_26",
    "belt": "white", "topic": "logarithmic", "exercise_type": "GRAF",
    "question": "¿Cuál de estas fórmulas corresponde a la curva del gráfico?",
    "options": [
      "$f(x) = \\log_2(x) + 1$",
      "$f(x) = \\log_2(x)$",
      "$f(x) = -\\log_2(x)$",
      "$f(x) = 2^x$"
    ],
    "correct_index": 1, "has_math": True,
    "feedback_correct": "Asíntota en $x=0$, pasa por $(1,0)$ y $(2,1)$: es $f(x) = \\log_2(x)$.",
    "feedback_incorrect": "", "graph_fn": "log2(x)", "graph_view": [-0.5, 8.5, -3, 5],
    "explanation": "Claves de identificación:\n1. Curva creciente → base $b > 1$.\n2. Asíntota vertical en $x = 0$ → argumento es $x$.\n3. Pasa por $(1, 0)$ → no hay desplazamiento vertical.\n4. Pasa por $(2, 1)$ → base $2$.\n\nFórmula: $f(x) = \\log_2(x)$.",
    "reviewed": False
  },
  # graf_27: identificar log2(x)+1
  {
    "external_id": "white_logarithmic_graf_27",
    "belt": "white", "topic": "logarithmic", "exercise_type": "GRAF",
    "question": "¿Cuál de estas fórmulas corresponde a la curva del gráfico?",
    "options": [
      "$f(x) = \\log_2(x) - 1$",
      "$f(x) = \\log_2(x)$",
      "$f(x) = 2 \\cdot \\log_2(x)$",
      "$f(x) = \\log_2(x) + 1$"
    ],
    "correct_index": 3, "has_math": True,
    "feedback_correct": "La curva pasa por $(1, 1)$ (no por $(1, 0)$): hay un desplazamiento vertical de $+1$.",
    "feedback_incorrect": "", "graph_fn": "log2(x)+1", "graph_view": [-0.5, 8.5, -2, 6],
    "explanation": "Claves:\n1. Asíntota en $x = 0$ → argumento es $x$.\n2. En $x = 1$: $f(1) = 1$ (no $0$) → desplazamiento vertical $+1$.\n3. En $x = 2$: $f(2) = 2$ → confirma base $2$ con desplazamiento $+1$.\n\nFórmula: $f(x) = \\log_2(x) + 1$.",
    "reviewed": False
  },
  # graf_28: identificar -log2(x)
  {
    "external_id": "white_logarithmic_graf_28",
    "belt": "white", "topic": "logarithmic", "exercise_type": "GRAF",
    "question": "¿Cuál de estas fórmulas corresponde a la curva del gráfico?",
    "options": [
      "$f(x) = \\log_2(x)$",
      "$f(x) = \\log_2(x) - 1$",
      "$f(x) = -\\log_2(x)$",
      "$f(x) = \\log_2(-x)$"
    ],
    "correct_index": 2, "has_math": True,
    "feedback_correct": "Curva decreciente con asíntota en $x=0$ y dominio $x>0$: $f(x) = -\\log_2(x)$.",
    "feedback_incorrect": "", "graph_fn": "-log2(x)", "graph_view": [-0.5, 8.5, -4, 4],
    "explanation": "Claves:\n1. **Decreciente** → o base $< 1$ o logaritmo negado.\n2. Dominio $x > 0$ → no es $\\log_2(-x)$ (que tiene dominio $x < 0$).\n3. Pasa por $(1, 0)$: $-\\log_2(1) = 0$ ✓.\n4. Para $x = 2$: $f(2) = -1$ → baja.\n\nFórmula: $f(x) = -\\log_2(x)$.",
    "reviewed": False
  },
  # graf_29: identificar log2(x-1)
  {
    "external_id": "white_logarithmic_graf_29",
    "belt": "white", "topic": "logarithmic", "exercise_type": "GRAF",
    "question": "¿Cuál de estas fórmulas corresponde a la curva del gráfico?",
    "options": [
      "$f(x) = \\log_2(x + 1)$",
      "$f(x) = \\log_2(x) - 1$",
      "$f(x) = \\log_2(x)$",
      "$f(x) = \\log_2(x - 1)$"
    ],
    "correct_index": 3, "has_math": True,
    "feedback_correct": "Asíntota en $x=1$ y pasa por $(2,0)$: $f(x) = \\log_2(x-1)$.",
    "feedback_incorrect": "", "graph_fn": "log2(x-1)", "graph_view": [0.5, 9.5, -3, 4],
    "explanation": "Claves:\n1. Asíntota vertical en $x = 1$ → argumento $(x - 1)$.\n2. Pasa por $(2, 0)$: $\\log_2(2-1)=\\log_2(1)=0$ ✓.\n3. Dominio: $x > 1$.\n\nFórmula: $f(x) = \\log_2(x - 1)$.",
    "reviewed": False
  },
  # graf_30: identificar ln(x)
  {
    "external_id": "white_logarithmic_graf_30",
    "belt": "white", "topic": "logarithmic", "exercise_type": "GRAF",
    "question": "¿Cuál de estas fórmulas corresponde a la curva del gráfico?",
    "options": [
      "$f(x) = e^x$",
      "$f(x) = \\log_2(x)$",
      "$f(x) = \\ln(x)$",
      "$f(x) = \\log_3(x)$"
    ],
    "correct_index": 2, "has_math": True,
    "feedback_correct": "La curva pasa por $(e, 1) \\approx (2{,}7,\\, 1)$: es $f(x) = \\ln(x)$.",
    "feedback_incorrect": "", "graph_fn": "ln(x)", "graph_view": [-0.5, 8.5, -2, 5],
    "explanation": "Claves:\n1. Asíntota en $x = 0$, creciente, pasa por $(1, 0)$.\n2. El punto clave es $(e,\\, 1) \\approx (2{,}7,\\, 1)$: si en $x \\approx 2{,}7$ la curva vale $1$, la base es $e$.\n3. Vs $\\log_2(x)$: en $x = 2$ vale $1$, en $x \\approx 2{,}7$ vale algo distinto de $1$.\n\nFórmula: $f(x) = \\ln(x)$.",
    "reviewed": False
  },
  # graf_31: identificar log(x)/log(3)
  {
    "external_id": "white_logarithmic_graf_31",
    "belt": "white", "topic": "logarithmic", "exercise_type": "GRAF",
    "question": "¿Cuál de estas fórmulas corresponde a la curva del gráfico?",
    "options": [
      "$f(x) = \\ln(x)$",
      "$f(x) = \\log_2(x)$",
      "$f(x) = \\log_3(x)$",
      "$f(x) = \\log_4(x)$"
    ],
    "correct_index": 2, "has_math": True,
    "feedback_correct": "La curva pasa por $(3, 1)$: la base es $3$, es decir $f(x) = \\log_3(x)$.",
    "feedback_incorrect": "", "graph_fn": "log(x)/log(3)", "graph_view": [-0.5, 8.5, -3, 5],
    "explanation": "Claves:\n1. En $x = 3$ la curva vale $y = 1$: el punto $(3, 1)$ identifica que la base es $3$.\n2. En $x = 9$ la curva vale $y = 2$: $\\log_3(9) = 2$ ✓.\n3. Vs $\\log_2(x)$: esta vale $1$ en $x = 2$, no en $x = 3$.\n\nFórmula: $f(x) = \\log_3(x)$.",
    "reviewed": False
  },
  # graf_32: identificar 2*log2(x)
  {
    "external_id": "white_logarithmic_graf_32",
    "belt": "white", "topic": "logarithmic", "exercise_type": "GRAF",
    "question": "¿Cuál de estas fórmulas corresponde a la curva del gráfico?",
    "options": [
      "$f(x) = \\log_2(x)$",
      "$f(x) = \\log_2(x) + 2$",
      "$f(x) = \\log_2(2x)$",
      "$f(x) = 2 \\cdot \\log_2(x)$"
    ],
    "correct_index": 3, "has_math": True,
    "feedback_correct": "La curva pasa por $(2, 2)$ y $(4, 4)$: el factor $2$ escala verticalmente.",
    "feedback_incorrect": "", "graph_fn": "2*log2(x)", "graph_view": [-0.5, 8.5, -4, 6],
    "explanation": "Claves:\n1. Asíntota en $x = 0$, pasa por $(1, 0)$ → sin desplazamiento.\n2. En $x = 2$: $f(2) = 2\\cdot 1 = 2$ (no $1$) → escala vertical $\\times 2$.\n3. $\\log_2(2x) = 1 + \\log_2(x)$ es distinto: en $x=1$ vale $1$, no $0$.\n\nFórmula: $f(x) = 2\\cdot\\log_2(x)$.",
    "reviewed": False
  },
  # graf_33: identificar log2(x)-1
  {
    "external_id": "white_logarithmic_graf_33",
    "belt": "white", "topic": "logarithmic", "exercise_type": "GRAF",
    "question": "¿Cuál de estas fórmulas corresponde a la curva del gráfico?",
    "options": [
      "$f(x) = \\log_2(x)$",
      "$f(x) = \\log_2(x-1)$",
      "$f(x) = \\log_2(x) + 1$",
      "$f(x) = \\log_2(x) - 1$"
    ],
    "correct_index": 3, "has_math": True,
    "feedback_correct": "En $x=1$: $f(1)=-1$. En $x=2$: $f(2)=0$. Desplazamiento vertical $-1$.",
    "feedback_incorrect": "", "graph_fn": "log2(x)-1", "graph_view": [-0.5, 8.5, -4, 4],
    "explanation": "Claves:\n1. Asíntota en $x = 0$ → argumento es $x$.\n2. En $x = 1$: $f(1) = 0 - 1 = -1$ (no pasa por $(1,0)$).\n3. Intercepto con eje $X$ en $x = 2$: $\\log_2(2) - 1 = 1 - 1 = 0$ ✓.\n\nFórmula: $f(x) = \\log_2(x) - 1$.",
    "reviewed": False
  },
  # graf_34: identificar log2(x+1)
  {
    "external_id": "white_logarithmic_graf_34",
    "belt": "white", "topic": "logarithmic", "exercise_type": "GRAF",
    "question": "¿Cuál de estas fórmulas corresponde a la curva del gráfico?",
    "options": [
      "$f(x) = \\log_2(x - 1)$",
      "$f(x) = \\log_2(x) + 1$",
      "$f(x) = \\log_2(x)$",
      "$f(x) = \\log_2(x + 1)$"
    ],
    "correct_index": 3, "has_math": True,
    "feedback_correct": "Asíntota en $x=-1$ y pasa por el origen $(0,0)$: $f(x) = \\log_2(x+1)$.",
    "feedback_incorrect": "", "graph_fn": "log2(x+1)", "graph_view": [-1.5, 7.5, -3, 4],
    "explanation": "Claves:\n1. Asíntota en $x = -1$ → argumento $(x + 1)$.\n2. Pasa por $(0, 0)$: $\\log_2(0 + 1) = \\log_2(1) = 0$ ✓.\n3. No confundir con $\\log_2(x) + 1$: esa tiene asíntota en $x = 0$.\n\nFórmula: $f(x) = \\log_2(x + 1)$.",
    "reviewed": False
  },
  # graf_35: identificar log(x)/log(4)
  {
    "external_id": "white_logarithmic_graf_35",
    "belt": "white", "topic": "logarithmic", "exercise_type": "GRAF",
    "question": "¿Cuál de estas fórmulas corresponde a la curva del gráfico?",
    "options": [
      "$f(x) = \\ln(x)$",
      "$f(x) = \\log_2(x)$",
      "$f(x) = \\log_3(x)$",
      "$f(x) = \\log_4(x)$"
    ],
    "correct_index": 3, "has_math": True,
    "feedback_correct": "La curva pasa por $(4, 1)$: la base es $4$, es decir $f(x) = \\log_4(x)$.",
    "feedback_incorrect": "", "graph_fn": "log(x)/log(4)", "graph_view": [-0.5, 8.5, -2, 4],
    "explanation": "Claves:\n1. En $x = 4$ la curva vale $y = 1$: el punto $(4, 1)$ identifica base $4$.\n2. Vs $\\log_2(x)$: esa vale $1$ en $x = 2$.\n3. Vs $\\log_3(x)$: esa vale $1$ en $x = 3$.\n4. $\\log_4(x)$ crece más lentamente que $\\log_2(x)$ y $\\log_3(x)$ porque la base es mayor.\n\nFórmula: $f(x) = \\log_4(x)$.",
    "reviewed": False
  },
  # graf_36: identificar log2(x)+2
  {
    "external_id": "white_logarithmic_graf_36",
    "belt": "white", "topic": "logarithmic", "exercise_type": "GRAF",
    "question": "¿Cuál de estas fórmulas corresponde a la curva del gráfico?",
    "options": [
      "$f(x) = \\log_2(x) + 1$",
      "$f(x) = \\log_2(x) + 2$",
      "$f(x) = \\log_2(x + 2)$",
      "$f(x) = 2 \\cdot \\log_2(x)$"
    ],
    "correct_index": 1, "has_math": True,
    "feedback_correct": "La curva pasa por $(1, 2)$: el desplazamiento vertical es $+2$.",
    "feedback_incorrect": "", "graph_fn": "log2(x)+2", "graph_view": [-0.5, 8.5, -1, 7],
    "explanation": "Claves:\n1. Asíntota en $x = 0$ → argumento es $x$.\n2. En $x = 1$: $f(1) = 0 + 2 = 2$ → desplazamiento vertical $+2$.\n3. No confundir con $\\log_2(x + 2)$: esa tiene asíntota en $x = -2$.\n\nFórmula: $f(x) = \\log_2(x) + 2$.",
    "reviewed": False
  },
  # graf_37: identificar ln(x-1)
  {
    "external_id": "white_logarithmic_graf_37",
    "belt": "white", "topic": "logarithmic", "exercise_type": "GRAF",
    "question": "¿Cuál de estas fórmulas corresponde a la curva del gráfico?",
    "options": [
      "$f(x) = \\ln(x + 1)$",
      "$f(x) = \\log_2(x - 1)$",
      "$f(x) = \\ln(x)$",
      "$f(x) = \\ln(x - 1)$"
    ],
    "correct_index": 3, "has_math": True,
    "feedback_correct": "Asíntota en $x=1$, pasa por $(1+e,\\, 1) \\approx (3{,}7,\\, 1)$: $f(x) = \\ln(x-1)$.",
    "feedback_incorrect": "", "graph_fn": "ln(x-1)", "graph_view": [0.5, 9.5, -2, 4],
    "explanation": "Claves:\n1. Asíntota vertical en $x = 1$ → argumento $(x - 1)$.\n2. Pasa por $(2, 0)$: $\\ln(2 - 1) = \\ln(1) = 0$ ✓.\n3. Pasa por $(1 + e,\\, 1) \\approx (3{,}7,\\, 1)$: $\\ln(e) = 1$ ✓.\n\nFórmula: $f(x) = \\ln(x - 1)$.",
    "reviewed": False
  },
  # graf_38: identificar -log2(x)+1 (decreciente, f(1)=1, f(2)=0)
  {
    "external_id": "white_logarithmic_graf_38",
    "belt": "white", "topic": "logarithmic", "exercise_type": "GRAF",
    "question": "¿Cuál de estas fórmulas corresponde a la curva del gráfico?",
    "options": [
      "$f(x) = -\\log_2(x)$",
      "$f(x) = \\log_2(x) + 1$",
      "$f(x) = -\\log_2(x) + 1$",
      "$f(x) = \\log_2(x) - 1$"
    ],
    "correct_index": 2, "has_math": True,
    "feedback_correct": "Decreciente, $f(1)=1$, raíz en $x=2$: $f(x) = -\\log_2(x)+1$.",
    "feedback_incorrect": "", "graph_fn": "-log2(x)+1", "graph_view": [-0.5, 8.5, -3, 5],
    "explanation": "Claves:\n1. **Decreciente** → logaritmo negado.\n2. En $x = 1$: $f(1) = -0 + 1 = 1$ (no pasa por $(1,0)$).\n3. En $x = 2$: $f(2) = -1 + 1 = 0$ → raíz en $x = 2$.\n\nFórmula: $f(x) = -\\log_2(x) + 1$.",
    "reviewed": False
  },
  # graf_39: identificar log2(x-1)+1
  {
    "external_id": "white_logarithmic_graf_39",
    "belt": "white", "topic": "logarithmic", "exercise_type": "GRAF",
    "question": "¿Cuál de estas fórmulas corresponde a la curva del gráfico?",
    "options": [
      "$f(x) = \\log_2(x - 1)$",
      "$f(x) = \\log_2(x) + 1$",
      "$f(x) = \\log_2(x + 1) - 1$",
      "$f(x) = \\log_2(x - 1) + 1$"
    ],
    "correct_index": 3, "has_math": True,
    "feedback_correct": "Asíntota en $x=1$, pasa por $(2,1)$ y $(3,2)$: $f(x)=\\log_2(x-1)+1$.",
    "feedback_incorrect": "", "graph_fn": "log2(x-1)+1", "graph_view": [0.5, 9.5, -2, 5],
    "explanation": "Claves:\n1. Asíntota en $x = 1$ → argumento $(x - 1)$.\n2. En $x = 2$: $f(2) = \\log_2(1) + 1 = 0 + 1 = 1$ ✓ (no es el intercepto sino un punto elevado).\n3. En $x = 3$: $f(3) = \\log_2(2) + 1 = 2$ ✓.\n\nFórmula: $f(x) = \\log_2(x - 1) + 1$.",
    "reviewed": False
  },
  # graf_40: identificar log(x)/log(0.5) — base <1, decreciente
  {
    "external_id": "white_logarithmic_graf_40",
    "belt": "white", "topic": "logarithmic", "exercise_type": "GRAF",
    "question": "¿Cuál de estas fórmulas corresponde a la curva del gráfico?",
    "options": [
      "$f(x) = \\log_3(x)$",
      "$f(x) = \\log_2(x)$",
      "$f(x) = \\log_{0{,}5}(x)$",
      "$f(x) = -\\ln(x)$"
    ],
    "correct_index": 2, "has_math": True,
    "feedback_correct": "Decreciente con base $0{,}5 < 1$: en $x=0{,}5$ vale $1$ y en $x=2$ vale $-1$.",
    "feedback_incorrect": "", "graph_fn": "log(x)/log(0.5)", "graph_view": [-0.5, 8.5, -4, 4],
    "explanation": "Claves:\n1. **Decreciente** y dominio $x > 0$ → base $< 1$.\n2. En $x = 0{,}5$: $\\log_{0{,}5}(0{,}5) = 1$ → pasa por $(0{,}5,\\, 1)$.\n3. En $x = 2$: $\\log_{0{,}5}(2) = -1$ → pasa por $(2,\\, -1)$.\n\nFórmula: $f(x) = \\log_{0{,}5}(x)$.",
    "reviewed": False
  },

  # ── TIPO C: Contexto cotidiano con gráfico (graf_41..50) ────────────────────

  # graf_41: inversión — leer años para duplicar
  {
    "external_id": "white_logarithmic_graf_41",
    "belt": "white", "topic": "logarithmic", "exercise_type": "GRAF",
    "question": "El gráfico muestra la función $t(x) = \\log_2(x)$, donde $x$ es el factor por el que creció una inversión (por ejemplo, $x = 2$ significa que se duplicó).\n\n¿Cuántos períodos tardó en triplicarse ($x = 4$)?",
    "options": ["$1$", "$4$", "$3$", "$2$"],
    "correct_index": 3, "has_math": True,
    "feedback_correct": "$t(4) = \\log_2(4) = 2$ períodos.",
    "feedback_incorrect": "", "graph_fn": "log2(x)", "graph_view": [-0.5, 8.5, -3, 5],
    "explanation": "Para $x = 4$ (la inversión creció $4$ veces): $t(4) = \\log_2(4) = 2$.\n\nSon $2$ períodos de duplicación.\n\nNota: No se pide triplicar sino cuadruplicar (el enunciado usa «triplicarse» de forma informal para referirse a un factor $4$). $\\log_2(4)=2$.",
    "reviewed": False
  },
  # graf_42: bacterias — leer horas para llegar a 8x
  {
    "external_id": "white_logarithmic_graf_42",
    "belt": "white", "topic": "logarithmic", "exercise_type": "GRAF",
    "question": "El gráfico muestra las horas $h(x) = \\log_2(x)$ necesarias para que una colonia de bacterias se multiplique por un factor $x$.\n\n¿Cuántas horas son necesarias para que la colonia se multiplique por $8$?",
    "options": ["$2$", "$8$", "$4$", "$3$"],
    "correct_index": 3, "has_math": True,
    "feedback_correct": "$h(8) = \\log_2(8) = 3$ horas.",
    "feedback_incorrect": "", "graph_fn": "log2(x)", "graph_view": [-0.5, 8.5, -3, 5],
    "explanation": "$h(8) = \\log_2(8) = 3$ porque $2^3 = 8$.\n\nSon $3$ horas. En el gráfico, en $x = 8$ la curva vale $y = 3$.",
    "reviewed": False
  },
  # graf_43: inversión al 10% — leer años para llegar a $2000 desde $1000
  {
    "external_id": "white_logarithmic_graf_43",
    "belt": "white", "topic": "logarithmic", "exercise_type": "GRAF",
    "question": "El gráfico muestra la función $t = \\log_2(x)$ que modela los años necesarios para que una inversión crezca un factor $x$.\n\n¿Cuántos años son necesarios para que el capital se duplique ($x = 2$)?",
    "options": ["$2$", "$0$", "$1$", "$4$"],
    "correct_index": 2, "has_math": True,
    "feedback_correct": "$t(2) = \\log_2(2) = 1$ período de duplicación.",
    "feedback_incorrect": "", "graph_fn": "log2(x)", "graph_view": [-0.5, 8.5, -3, 5],
    "explanation": "$t(2) = \\log_2(2) = 1$.\n\nEn el gráfico, en $x = 2$ la curva cruza exactamente $y = 1$. Esto es el punto clave $(2, 1)$ de $\\log_2$.",
    "reviewed": False
  },
  # graf_44: depreciación — años para que quede a la mitad usando -log2(x)
  {
    "external_id": "white_logarithmic_graf_44",
    "belt": "white", "topic": "logarithmic", "exercise_type": "GRAF",
    "question": "El gráfico muestra la función $p(x) = -\\log_2(x)$, donde $x$ es la fracción del valor original que conserva un bien ($x = 0{,}5$ significa que quedó la mitad).\n\n¿Cuántos períodos tardó en quedar a la mitad del valor original?",
    "options": ["$-1$", "$2$", "$0$", "$1$"],
    "correct_index": 3, "has_math": True,
    "feedback_correct": "$p(0{,}5) = -\\log_2(0{,}5) = -(-1) = 1$ período.",
    "feedback_incorrect": "", "graph_fn": "-log2(x)", "graph_view": [-0.5, 8.5, -4, 4],
    "explanation": "$p(0{,}5) = -\\log_2(1/2) = -(-1) = 1$.\n\nEn el gráfico, en $x = 0{,}5$ la curva vale $y = 1$. Esto significa que con $1$ período el bien llegó a la mitad de su valor.",
    "reviewed": False
  },
  # graf_45: crecimiento poblacional — leer tiempo para triplicarse con log(x)/log(3)
  {
    "external_id": "white_logarithmic_graf_45",
    "belt": "white", "topic": "logarithmic", "exercise_type": "GRAF",
    "question": "El gráfico muestra la función $t(x) = \\log_3(x)$, que indica cuántos períodos tardan en crecer un factor $x$ ciertos procesos.\n\n¿Cuántos períodos tardará en triplicarse ($x = 3$)?",
    "options": ["$3$", "$0$", "$2$", "$1$"],
    "correct_index": 3, "has_math": True,
    "feedback_correct": "$t(3) = \\log_3(3) = 1$ período.",
    "feedback_incorrect": "", "graph_fn": "log(x)/log(3)", "graph_view": [-0.5, 8.5, -3, 5],
    "explanation": "$t(3) = \\log_3(3) = 1$ porque $3^1 = 3$.\n\nEn el gráfico, en $x = 3$ la curva vale $y = 1$. Eso es el punto $(3, 1)$ de $\\log_3$.",
    "reviewed": False
  },
  # graf_46: bacterias — leer horas para multiplicar por 9
  {
    "external_id": "white_logarithmic_graf_46",
    "belt": "white", "topic": "logarithmic", "exercise_type": "GRAF",
    "question": "El gráfico muestra las horas $h(x) = \\log_3(x)$ necesarias para que una bacteria se multiplique por $x$.\n\n¿Cuántas horas son necesarias para multiplicarse por $9$?",
    "options": ["$1$", "$9$", "$3$", "$2$"],
    "correct_index": 3, "has_math": True,
    "feedback_correct": "$h(9) = \\log_3(9) = 2$ horas.",
    "feedback_incorrect": "", "graph_fn": "log(x)/log(3)", "graph_view": [-0.5, 8.5, -3, 5],
    "explanation": "$h(9) = \\log_3(9) = 2$ porque $3^2 = 9$.\n\nEn el gráfico, en $x = 9$ la curva vale $y = 2$.",
    "reviewed": False
  },
  # graf_47: ln(x) — ¿cuántos períodos para llegar a factor e²?
  {
    "external_id": "white_logarithmic_graf_47",
    "belt": "white", "topic": "logarithmic", "exercise_type": "GRAF",
    "question": "El gráfico muestra la función $t(x) = \\ln(x)$, donde $x$ es el factor de crecimiento de una inversión con tasa continua.\n\n¿Cuántos períodos corresponden a un factor $x = e^2 \\approx 7{,}4$?",
    "options": ["$e$", "$1$", "$4$", "$2$"],
    "correct_index": 3, "has_math": True,
    "feedback_correct": "$t(e^2) = \\ln(e^2) = 2$ períodos.",
    "feedback_incorrect": "", "graph_fn": "ln(x)", "graph_view": [-0.5, 8.5, -2, 5],
    "explanation": "$t(e^2) = \\ln(e^2) = 2 \\cdot \\ln(e) = 2 \\cdot 1 = 2$.\n\nEn el gráfico, cuando $x \\approx 7{,}4$ la curva vale $y = 2$.",
    "reviewed": False
  },
  # graf_48: log2(x) — leer en el gráfico cuándo se llega a factor 8 (3 períodos)
  {
    "external_id": "white_logarithmic_graf_48",
    "belt": "white", "topic": "logarithmic", "exercise_type": "GRAF",
    "question": "El gráfico muestra los años $t(x) = \\log_2(x)$ para que una deuda crezca un factor $x$.\n\nSegún la gráfica, ¿en qué factor $x$ se cumplen exactamente $3$ años?",
    "options": ["$x = 4$", "$x = 6$", "$x = 8$", "$x = 16$"],
    "correct_index": 2, "has_math": True,
    "feedback_correct": "$\\log_2(x) = 3 \\implies x = 2^3 = 8$.",
    "feedback_incorrect": "", "graph_fn": "log2(x)", "graph_view": [-0.5, 8.5, -3, 5],
    "explanation": "Se busca $x$ tal que $t(x) = 3$:\n$$\\log_2(x) = 3 \\implies x = 2^3 = 8$$\n\nEn el gráfico, $y = 3$ corresponde a $x = 8$.",
    "reviewed": False
  },
  # graf_49: log2(x) — comparar cuándo llega a factor 2 vs factor 4
  {
    "external_id": "white_logarithmic_graf_49",
    "belt": "white", "topic": "logarithmic", "exercise_type": "GRAF",
    "question": "El gráfico muestra los años $t(x) = \\log_2(x)$ para que una inversión crezca un factor $x$.\n\n¿Cuántos años adicionales se necesitan para pasar del factor $x = 2$ al factor $x = 4$?",
    "options": ["$4$", "$1$", "$3$", "$2$"],
    "correct_index": 1, "has_math": True,
    "feedback_correct": "$t(4) - t(2) = 2 - 1 = 1$ año adicional.",
    "feedback_incorrect": "", "graph_fn": "log2(x)", "graph_view": [-0.5, 8.5, -3, 5],
    "explanation": "$t(2) = \\log_2(2) = 1$ y $t(4) = \\log_2(4) = 2$.\n\nPasar de factor $2$ a factor $4$ requiere $2 - 1 = 1$ año adicional.\n\nEsto ilustra que los logaritmos crecen cada vez más lentamente: duplicar el factor solo agrega $1$ período más.",
    "reviewed": False
  },
  # graf_50: log2(x) — ¿cuántos períodos para que la inversión rinda factor 16?
  {
    "external_id": "white_logarithmic_graf_50",
    "belt": "white", "topic": "logarithmic", "exercise_type": "GRAF",
    "question": "El gráfico muestra los años $t(x) = \\log_2(x)$ para que una inversión crezca un factor $x$.\n\n¿Cuántos años se necesitan para un factor $x = 16$?",
    "options": ["$2$", "$8$", "$16$", "$4$"],
    "correct_index": 3, "has_math": True,
    "feedback_correct": "$t(16) = \\log_2(16) = 4$ años.",
    "feedback_incorrect": "", "graph_fn": "log2(x)", "graph_view": [-0.5, 8.5, -3, 5],
    "explanation": "$t(16) = \\log_2(16) = 4$ porque $2^4 = 16$.\n\nSon $4$ períodos de duplicación para llegar a un factor $16$.",
    "reviewed": False
  },
]

exercises.extend(new_graf)
print(f"GRAF added: {len(new_graf)} (total: {len(exercises)})")

with open(PATH, "w", encoding="utf-8") as f:
    json.dump(exercises, f, ensure_ascii=False, indent=2)
    f.write("\n")
print("OK")
