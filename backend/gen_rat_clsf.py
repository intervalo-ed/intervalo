# gen_rat_clsf.py — agrega clsf_15..50 a white_rational.json
import json, pathlib

FILE = pathlib.Path("content/analisis-1/exercises/white_rational.json")
data = json.loads(FILE.read_text(encoding="utf-8"))

new_exercises = [
  # ── Desde gráfico (8 ejercicios con graph_fn) ──────────────────────────
  {
    "external_id": "white_rational_clsf_15",
    "belt": "white", "topic": "rational", "exercise_type": "CLSF",
    "question": "La gráfica muestra dos ramas separadas por una línea vertical, "
                "y ambas ramas se aplanan horizontalmente cerca del eje $X$ a medida que $x$ crece.\n\n"
                "¿A qué familia de funciones pertenece esta gráfica?",
    "options": ["Racional", "Polinómica", "Logarítmica", "Exponencial"],
    "correct_index": 0,
    "has_math": True,
    "feedback_correct": "La asíntota vertical y la asíntota horizontal en $y=0$ son propias de una racional.",
    "feedback_incorrect": "",
    "graph_fn": "1 / (x - 2)",
    "graph_view": [-3, 7, -5, 5],
    "explanation": "El gráfico tiene **asíntota vertical** (la función explota en un punto) y **asíntota horizontal** cerca del eje $X$. Esa combinación identifica a una función racional. Una polinómica no tiene asíntotas y una logarítmica solo tiene AV pero no AH finita.",
    "reviewed": False
  },
  {
    "external_id": "white_rational_clsf_16",
    "belt": "white", "topic": "rational", "exercise_type": "CLSF",
    "question": "La gráfica muestra dos ramas simétricas respecto al origen, "
                "sin cruzar ninguno de los dos ejes.\n\n"
                "¿A qué familia de funciones pertenece?",
    "options": ["Racional", "Trigonométrica", "Cuadrática", "Logarítmica"],
    "correct_index": 0,
    "has_math": True,
    "feedback_correct": "La hipérbola con asíntotas en los ejes es la firma de $f(x) = 1/x$: función racional.",
    "feedback_incorrect": "",
    "graph_fn": "1 / x",
    "graph_view": [-5, 5, -5, 5],
    "explanation": "La hipérbola clásica con ramas en el 1.° y 3.° cuadrante, sin cruzar ningún eje, es $f(x)=\\frac{1}{x}$: la **racional más simple**. No es trigonométrica (no oscila), ni cuadrática (no es parábola), ni logarítmica (tiene dos ramas).",
    "reviewed": False
  },
  {
    "external_id": "white_rational_clsf_17",
    "belt": "white", "topic": "rational", "exercise_type": "CLSF",
    "question": "La gráfica tiene dos ramas que se aplanan cerca de $y = 1$ (no cerca de $y = 0$). "
                "Hay una línea vertical que las separa.\n\n"
                "¿A qué familia pertenece?",
    "options": ["Racional con asíntota horizontal desplazada", "Lineal", "Cuadrática", "Exponencial"],
    "correct_index": 0,
    "has_math": True,
    "feedback_correct": "La AH en $y=1$ (no en $y=0$) indica una racional de la forma $\\frac{k}{x-a}+1$.",
    "feedback_incorrect": "",
    "graph_fn": "1 / (x - 3) + 1",
    "graph_view": [-2, 8, -4, 6],
    "explanation": "Cuando la AH no está en $y=0$ sino en $y=b$, la racional tiene la forma $\\frac{k}{x-a}+b$. Aquí $b=1$: la función es $\\frac{1}{x-3}+1$. Sigue siendo **racional**: la AV está en $x=3$ y la AH en $y=1$.",
    "reviewed": False
  },
  {
    "external_id": "white_rational_clsf_18",
    "belt": "white", "topic": "rational", "exercise_type": "CLSF",
    "question": "La gráfica muestra una curva con dos ramas que suben en el lado izquierdo de la AV "
                "y bajan en el lado derecho (o viceversa), aplaniéndose hacia el eje $X$.\n\n"
                "¿A qué familia pertenece?",
    "options": ["Racional", "Exponencial", "Seno", "Cuadrática"],
    "correct_index": 0,
    "has_math": True,
    "feedback_correct": "El comportamiento de dos ramas opuestas en torno a una AV es característico de funciones racionales.",
    "feedback_incorrect": "",
    "graph_fn": "2 / (x + 1)",
    "graph_view": [-5, 5, -6, 6],
    "explanation": "Las dos ramas que van en sentidos opuestos (una sube, la otra baja) cerca de la AV, y ambas se aplanan cerca de $y=0$, son la firma de una **racional** como $f(x)=\\frac{2}{x+1}$. Ni la exponencial ni el seno tienen asíntotas verticales.",
    "reviewed": False
  },
  {
    "external_id": "white_rational_clsf_19",
    "belt": "white", "topic": "rational", "exercise_type": "CLSF",
    "question": "La gráfica muestra una curva con una asíntota vertical y las dos ramas van "
                "en el mismo sentido (ambas hacia arriba o ambas hacia abajo) al acercarse a la AV.\n\n"
                "¿A qué familia pertenece?",
    "options": [
      "Racional con numerador par en el denominador",
      "Exponencial",
      "Logarítmica",
      "Polinómica de grado 2"
    ],
    "correct_index": 0,
    "has_math": True,
    "feedback_correct": "Cuando el factor del denominador aparece con exponente par, ambas ramas van en el mismo sentido hacia la AV.",
    "feedback_incorrect": "",
    "graph_fn": "1 / (x^2)",
    "graph_view": [-4, 4, -1, 8],
    "explanation": "En $f(x)=\\frac{1}{x^2}$, el denominador tiene exponente par: tanto a la izquierda como a la derecha de $x=0$, la función tiende a $+\\infty$. Las dos ramas van hacia arriba. Sigue siendo **racional**: cociente de polinomios.",
    "reviewed": False
  },
  {
    "external_id": "white_rational_clsf_20",
    "belt": "white", "topic": "rational", "exercise_type": "CLSF",
    "question": "La gráfica muestra una curva de dos ramas como las de $f(x)=1/x$ pero desplazada: "
                "la asíntota vertical está en $x = -2$ en vez de en $x = 0$.\n\n"
                "¿A qué familia pertenece?",
    "options": ["Racional", "Lineal", "Logarítmica", "Cuadrática"],
    "correct_index": 0,
    "has_math": True,
    "feedback_correct": "La AV desplazada a $x=-2$ corresponde a $f(x) = 1/(x+2)$: racional.",
    "feedback_incorrect": "",
    "graph_fn": "1 / (x + 2)",
    "graph_view": [-7, 3, -5, 5],
    "explanation": "Desplazar la hipérbola $1/x$ horizontalmente da $\\frac{1}{x+2}$ (AV en $x=-2$). La forma sigue siendo **racional**: cociente de polinomios con AV y AH.",
    "reviewed": False
  },
  {
    "external_id": "white_rational_clsf_21",
    "belt": "white", "topic": "rational", "exercise_type": "CLSF",
    "question": "La gráfica muestra una curva idéntica a la de $f(x)=1/x$ pero reflejada: "
                "las ramas están en el 2.° y 4.° cuadrante en vez del 1.° y 3.°\n\n"
                "¿A qué familia pertenece?",
    "options": ["Racional (con signo negativo)", "Logarítmica", "Exponencial negativa", "Cuadrática"],
    "correct_index": 0,
    "has_math": True,
    "feedback_correct": "El signo negativo en $-1/x$ refleja la hipérbola, pero sigue siendo una función racional.",
    "feedback_incorrect": "",
    "graph_fn": "-1 / x",
    "graph_view": [-5, 5, -5, 5],
    "explanation": "$f(x)=-\\frac{1}{x}$ es la hipérbola $1/x$ reflejada respecto al eje $X$: las ramas están ahora en el 2.° y 4.° cuadrante. Sigue siendo **racional**: es el cociente de $-1$ y $x$.",
    "reviewed": False
  },
  {
    "external_id": "white_rational_clsf_22",
    "belt": "white", "topic": "rational", "exercise_type": "CLSF",
    "question": "La gráfica tiene **tres ramas** separadas por dos asíntotas verticales "
                "y se aplana hacia $y = 0$ en los extremos.\n\n"
                "¿A qué familia pertenece?",
    "options": ["Racional con denominador de grado 2", "Trigonométrica", "Cúbica", "Logarítmica"],
    "correct_index": 0,
    "has_math": True,
    "feedback_correct": "Dos AV (denominador de grado 2 con dos raíces) generan tres ramas: típico de racionales.",
    "feedback_incorrect": "",
    "graph_fn": None, "graph_view": None,
    "explanation": "Una racional con denominador de grado 2 que tiene dos raíces reales distintas genera **dos asíntotas verticales** y por lo tanto **tres ramas**. Ejemplo: $\\frac{1}{(x-1)(x+1)}$ con AV en $x=1$ y $x=-1$.",
    "reviewed": False
  },
  # ── Desde fórmula ─────────────────────────────────────────────────────────
  {
    "external_id": "white_rational_clsf_23",
    "belt": "white", "topic": "rational", "exercise_type": "CLSF",
    "question": "¿A qué familia pertenece $f(x) = \\dfrac{x^2 - 3}{2x + 1}$?",
    "options": ["Racional", "Cuadrática", "Exponencial", "Logarítmica"],
    "correct_index": 0,
    "has_math": True,
    "feedback_correct": "$\\frac{x^2-3}{2x+1}$ es un cociente de polinomios: función racional.",
    "feedback_incorrect": "",
    "graph_fn": None, "graph_view": None,
    "explanation": "$x^2-3$ y $2x+1$ son polinomios. Su cociente es una **función racional**. Tiene AV en $x=-\\frac{1}{2}$ y, como el grado del numerador (2) es mayor que el del denominador (1), hay una asíntota oblicua (no horizontal).",
    "reviewed": False
  },
  {
    "external_id": "white_rational_clsf_24",
    "belt": "white", "topic": "rational", "exercise_type": "CLSF",
    "question": "¿A qué familia pertenece $f(x) = \\dfrac{5}{(x-1)(x+2)}$?",
    "options": ["Racional", "Polinómica", "Logarítmica", "Raíz cuadrada"],
    "correct_index": 0,
    "has_math": True,
    "feedback_correct": "$\\frac{5}{(x-1)(x+2)}$ es el cociente de la constante $5$ sobre un polinomio cuadrático: racional.",
    "feedback_incorrect": "",
    "graph_fn": None, "graph_view": None,
    "explanation": "$(x-1)(x+2)$ es un polinomio de grado 2. La fracción $\\frac{5}{(x-1)(x+2)}$ es un **cociente de polinomios** → racional. Tiene dos asíntotas verticales en $x=1$ y $x=-2$.",
    "reviewed": False
  },
  {
    "external_id": "white_rational_clsf_25",
    "belt": "white", "topic": "rational", "exercise_type": "CLSF",
    "question": "¿Cuál de estas opciones NO es una función racional?",
    "options": [
      "$f(x) = e^x$",
      "$f(x) = \\dfrac{x^2 + 1}{x - 3}$",
      "$f(x) = \\dfrac{7}{x}$",
      "$f(x) = \\dfrac{x + 1}{x^2 - 1}$"
    ],
    "correct_index": 0,
    "has_math": True,
    "feedback_correct": "$e^x$ es una función exponencial, no un cociente de polinomios.",
    "feedback_incorrect": "",
    "graph_fn": None, "graph_view": None,
    "explanation": "$e^x$ no es un polinomio ni se puede escribir como cociente de polinomios: es **exponencial**. Las otras tres opciones son cocientes de polinomios → racionales.",
    "reviewed": False
  },
  {
    "external_id": "white_rational_clsf_26",
    "belt": "white", "topic": "rational", "exercise_type": "CLSF",
    "question": "¿A qué familia pertenece $f(x) = \\dfrac{x^3 - 1}{x^2 + 1}$?",
    "options": ["Racional", "Cúbica", "Cuadrática", "Exponencial"],
    "correct_index": 0,
    "has_math": True,
    "feedback_correct": "Es un cociente de polinomios: $\\frac{x^3-1}{x^2+1}$ es una función racional.",
    "feedback_incorrect": "",
    "graph_fn": None, "graph_view": None,
    "explanation": "$x^3-1$ (polinomio de grado 3) dividido por $x^2+1$ (polinomio de grado 2): el cociente es una **función racional**. Como el numerador tiene grado 3 y el denominador grado 2, hay asíntota oblicua (no horizontal). El denominador $x^2+1>0$ siempre, así que no hay AV.",
    "reviewed": False
  },
  {
    "external_id": "white_rational_clsf_27",
    "belt": "white", "topic": "rational", "exercise_type": "CLSF",
    "question": "¿A qué familia pertenece $h(x) = \\dfrac{\\sqrt{x}}{x - 1}$?",
    "options": [
      "No es racional (tiene raíz en el numerador)",
      "Racional",
      "Logarítmica",
      "Exponencial"
    ],
    "correct_index": 0,
    "has_math": True,
    "feedback_correct": "$\\sqrt{x}$ no es un polinomio: la función no es racional.",
    "feedback_incorrect": "",
    "graph_fn": None, "graph_view": None,
    "explanation": "$\\sqrt{x}=x^{1/2}$ tiene un exponente fraccionario: **no es un polinomio**. Por lo tanto, $\\frac{\\sqrt{x}}{x-1}$ no es un cociente de polinomios y **no pertenece** a la familia racional.",
    "reviewed": False
  },
  {
    "external_id": "white_rational_clsf_28",
    "belt": "white", "topic": "rational", "exercise_type": "CLSF",
    "question": "¿A qué familia pertenece $g(x) = \\dfrac{2x - 3}{x^2 + 4}$?",
    "options": [
      "Racional sin asíntota vertical",
      "Cuadrática",
      "Logarítmica",
      "Exponencial"
    ],
    "correct_index": 0,
    "has_math": True,
    "feedback_correct": "Es un cociente de polinomios. El denominador $x^2+4>0$ siempre, así que no hay AV.",
    "feedback_incorrect": "",
    "graph_fn": None, "graph_view": None,
    "explanation": "$\\frac{2x-3}{x^2+4}$ es un **cociente de polinomios** → racional. Pero $x^2+4\\geq4>0$ para todo $x$: el denominador nunca se anula, así que no hay asíntota vertical. Es una racional **sin AV**, definida para todo $\\mathbb{R}$.",
    "reviewed": False
  },
  {
    "external_id": "white_rational_clsf_29",
    "belt": "white", "topic": "rational", "exercise_type": "CLSF",
    "question": "¿A qué familia pertenece $f(x) = \\dfrac{x+1}{x+1}$ con $x \\neq -1$?",
    "options": [
      "Racional (con agujero en $x = -1$)",
      "Constante (vale 1 para todo $x$)",
      "Lineal",
      "Logarítmica"
    ],
    "correct_index": 0,
    "has_math": True,
    "feedback_correct": "La expresión original es un cociente de polinomios: sigue siendo racional aunque se simplifique a 1.",
    "feedback_incorrect": "",
    "graph_fn": None, "graph_view": None,
    "explanation": "$\\frac{x+1}{x+1}=1$ para $x\\neq-1$, pero la función **no está definida en $x=-1$** (agujero). La clasificación se basa en la forma original: cociente de polinomios → **racional**. La constante $f(x)=1$ sería el resultado solo si incluyera $x=-1$, lo cual no hace.",
    "reviewed": False
  },
  # ── Desde verbal ─────────────────────────────────────────────────────────
  {
    "external_id": "white_rational_clsf_30",
    "belt": "white", "topic": "rational", "exercise_type": "CLSF",
    "question": "Una función tiene una asíntota vertical en $x = 5$ y una asíntota horizontal en $y = 0$. "
                "¿A qué familia es más probable que pertenezca?",
    "options": ["Racional", "Exponencial", "Lineal", "Cuadrática"],
    "correct_index": 0,
    "has_math": True,
    "feedback_correct": "AV + AH en $y=0$ es el patrón clásico de $f(x) = k/(x-5)$: racional.",
    "feedback_incorrect": "",
    "graph_fn": None, "graph_view": None,
    "explanation": "La presencia de una **asíntota vertical** descarta a polinomios, exponenciales y lineales. La **AH en $y=0$** indica que el grado del numerador es menor que el del denominador. Eso corresponde a la familia **racional**.",
    "reviewed": False
  },
  {
    "external_id": "white_rational_clsf_31",
    "belt": "white", "topic": "rational", "exercise_type": "CLSF",
    "question": "Una función tiene imagen $\\mathbb{R} \\setminus \\{3\\}$ (todos los reales excepto $y = 3$). "
                "¿Cuál de estas familias podría corresponder?",
    "options": ["Racional", "Cuadrática", "Logarítmica", "Trigonométrica (seno)"],
    "correct_index": 0,
    "has_math": True,
    "feedback_correct": "Una racional de la forma $k/(x-a) + 3$ tiene imagen $\\mathbb{R}\\setminus\\{3\\}$.",
    "feedback_incorrect": "",
    "graph_fn": None, "graph_view": None,
    "explanation": "La imagen $\\mathbb{R}\\setminus\\{3\\}$ significa que la función puede tomar cualquier valor real salvo $3$: eso corresponde a la AH $y=3$ de una racional del tipo $\\frac{k}{x-a}+3$. La cuadrática tiene imagen de la forma $[\\text{mín},+\\infty)$; el seno tiene imagen $[-1,1]$; la logarítmica tiene imagen $\\mathbb{R}$.",
    "reviewed": False
  },
  {
    "external_id": "white_rational_clsf_32",
    "belt": "white", "topic": "rational", "exercise_type": "CLSF",
    "question": "Una función es decreciente en $(-\\infty, 2)$ y también decreciente en $(2, +\\infty)$, "
                "con asíntota vertical en $x = 2$. ¿A qué familia pertenece?",
    "options": ["Racional", "Polinómica cúbica", "Lineal", "Exponencial"],
    "correct_index": 0,
    "has_math": True,
    "feedback_correct": "Decreciente en cada tramo con AV en $x=2$: patrón de $k/(x-2)$ con $k>0$.",
    "feedback_incorrect": "",
    "graph_fn": None, "graph_view": None,
    "explanation": "La AV en $x=2$ excluye a polinomios y lineales. El comportamiento decreciente a ambos lados de la AV corresponde a una **racional** del tipo $\\frac{k}{x-2}$ (con $k>0$): decrece en $(-\\infty,2)$ y en $(2,+\\infty)$.",
    "reviewed": False
  },
  {
    "external_id": "white_rational_clsf_33",
    "belt": "white", "topic": "rational", "exercise_type": "CLSF",
    "question": "Una función está definida para todo $x$ excepto $x = -1$. En ese punto, "
                "tiende a $\\pm\\infty$. ¿A qué familia pertenece?",
    "options": ["Racional", "Logarítmica", "Cuadrática", "Lineal"],
    "correct_index": 0,
    "has_math": True,
    "feedback_correct": "Una función que explota en $x=-1$ tiene una asíntota vertical ahí: característica de racionales.",
    "feedback_incorrect": "",
    "graph_fn": None, "graph_view": None,
    "explanation": "Que la función 'explote' (tienda a $\\pm\\infty$) en $x=-1$ indica una **asíntota vertical** en ese punto, lo cual es propio de las **funciones racionales**. La logarítmica también tiene AV pero solo en el extremo de su dominio (no explota en el interior).",
    "reviewed": False
  },
  {
    "external_id": "white_rational_clsf_34",
    "belt": "white", "topic": "rational", "exercise_type": "CLSF",
    "question": "Una función cumple: dominio $\\mathbb{R}\\setminus\\{0\\}$, imagen $\\mathbb{R}\\setminus\\{0\\}$, "
                "es impar y decrece en cada rama. ¿A qué familia pertenece?",
    "options": ["Racional ($f(x) = k/x$ con $k > 0$)", "Lineal impar", "Exponencial", "Logarítmica"],
    "correct_index": 0,
    "has_math": True,
    "feedback_correct": "Dominio e imagen $\\mathbb{R}\\setminus\\{0\\}$ + impar + decreciente: perfil exacto de $k/x$.",
    "feedback_incorrect": "",
    "graph_fn": None, "graph_view": None,
    "explanation": "El perfil descrito (dominio e imagen $\\mathbb{R}\\setminus\\{0\\}$, impar, decreciente en cada tramo) corresponde exactamente a $f(x)=\\frac{k}{x}$: **racional**. Ninguna otra familia básica tiene esta combinación de propiedades.",
    "reviewed": False
  },
  {
    "external_id": "white_rational_clsf_35",
    "belt": "white", "topic": "rational", "exercise_type": "CLSF",
    "question": "¿Cuál de estas funciones tiene una asíntota vertical pero NO una asíntota horizontal?",
    "options": [
      "$f(x) = \\dfrac{x^2}{x - 1}$",
      "$f(x) = \\dfrac{1}{x - 1}$",
      "$f(x) = \\dfrac{x + 2}{x - 1}$",
      "$f(x) = \\dfrac{3}{x - 1}$"
    ],
    "correct_index": 0,
    "has_math": True,
    "feedback_correct": "$\\frac{x^2}{x-1}$: grado num (2) > grado denom (1), no hay AH sino asíntota oblicua.",
    "feedback_incorrect": "",
    "graph_fn": None, "graph_view": None,
    "explanation": "En $\\frac{x^2}{x-1}$, el grado del numerador (2) supera al del denominador (1): **no hay AH**. Las otras opciones tienen grados iguales o num < denom, así que sí tienen AH.",
    "reviewed": False
  },
  {
    "external_id": "white_rational_clsf_36",
    "belt": "white", "topic": "rational", "exercise_type": "CLSF",
    "question": "¿Cuál de estas funciones tiene dominio $\\mathbb{R}$ (sin restricciones)?",
    "options": [
      "$f(x) = \\dfrac{x + 1}{x^2 + 1}$",
      "$f(x) = \\dfrac{1}{x}$",
      "$f(x) = \\dfrac{x - 3}{x + 3}$",
      "$f(x) = \\dfrac{x^2}{x^2 - 4}$"
    ],
    "correct_index": 0,
    "has_math": True,
    "feedback_correct": "$x^2+1 \\geq 1 > 0$ siempre: el denominador nunca se anula, el dominio es $\\mathbb{R}$.",
    "feedback_incorrect": "",
    "graph_fn": None, "graph_view": None,
    "explanation": "El denominador $x^2+1\\geq1>0$ para todo $x$ real: nunca se anula. Por lo tanto, $f(x)=\\frac{x+1}{x^2+1}$ tiene dominio $\\mathbb{R}$. Las otras tienen denominadores que se anulan en algún punto.",
    "reviewed": False
  },
  {
    "external_id": "white_rational_clsf_37",
    "belt": "white", "topic": "rational", "exercise_type": "CLSF",
    "question": "¿A qué familia pertenece $f(x) = \\dfrac{(x-1)(x+2)}{(x-1)(x-3)}$?",
    "options": [
      "Racional (con agujero en $x=1$ y AV en $x=3$)",
      "Lineal",
      "Cuadrática",
      "Polinómica de grado 2"
    ],
    "correct_index": 0,
    "has_math": True,
    "feedback_correct": "El factor $(x-1)$ se cancela (agujero) pero $(x-3)$ permanece (AV): sigue siendo racional.",
    "feedback_incorrect": "",
    "graph_fn": None, "graph_view": None,
    "explanation": "El factor $(x-1)$ aparece en numerador y denominador: se cancela, dejando un **agujero en $x=1$**. El factor $(x-3)$ queda en el denominador: **AV en $x=3$**. La función es $\\frac{x+2}{x-3}$ con un agujero en $x=1$: sigue siendo **racional**.",
    "reviewed": False
  },
  {
    "external_id": "white_rational_clsf_38",
    "belt": "white", "topic": "rational", "exercise_type": "CLSF",
    "question": "¿Cuál de estas descripciones corresponde a una función racional?",
    "options": [
      "Tiene AV en $x = 2$ y su imagen es $\\mathbb{R} \\setminus \\{1\\}$",
      "Tiene máximo en $x = 0$ y su imagen es $[0, +\\infty)$",
      "Crece indefinidamente para todo $x$ real",
      "Oscila entre $-1$ y $1$ periódicamente"
    ],
    "correct_index": 0,
    "has_math": True,
    "feedback_correct": "AV + imagen con un valor excluido es el patrón de $k/(x-2)+1$: racional.",
    "feedback_incorrect": "",
    "graph_fn": None, "graph_view": None,
    "explanation": "AV en $x=2$ e imagen $\\mathbb{R}\\setminus\\{1\\}$ (valor excluido = AH) corresponde a $\\frac{k}{x-2}+1$: **racional**. La descripción con máximo es cuadrática, la que crece indefinidamente puede ser exponencial o polinómica, y la oscilación es trigonométrica.",
    "reviewed": False
  },
  {
    "external_id": "white_rational_clsf_39",
    "belt": "white", "topic": "rational", "exercise_type": "CLSF",
    "question": "¿Cuál de estas funciones tiene imagen $\\mathbb{R}$ (todos los reales)?",
    "options": [
      "$f(x) = \\dfrac{x+1}{x-2}$",
      "$f(x) = \\dfrac{1}{x^2+1}$",
      "$f(x) = \\dfrac{1}{x}$",
      "$f(x) = \\dfrac{x^2}{x^2+1}$"
    ],
    "correct_index": 0,
    "has_math": True,
    "feedback_correct": "$\\frac{x+1}{x-2}$ tiene imagen $\\mathbb{R}\\setminus\\{1\\}$, que es el más amplio de los cuatro.",
    "feedback_incorrect": "",
    "graph_fn": None, "graph_view": None,
    "explanation": "$\\frac{x+1}{x-2}$ tiene imagen $\\mathbb{R}\\setminus\\{1\\}$ (excluye solo la AH). $\\frac{1}{x}$ tiene imagen $\\mathbb{R}\\setminus\\{0\\}$. $\\frac{1}{x^2+1}$ tiene imagen $(0,1]$. $\\frac{x^2}{x^2+1}$ tiene imagen $[0,1)$. La más amplia es $\\frac{x+1}{x-2}$, cuya imagen es casi $\\mathbb{R}$.",
    "reviewed": False
  },
  {
    "external_id": "white_rational_clsf_40",
    "belt": "white", "topic": "rational", "exercise_type": "CLSF",
    "question": "¿Cuál de estas funciones tiene exactamente dos asíntotas verticales?",
    "options": [
      "$f(x) = \\dfrac{1}{x^2 - 9}$",
      "$f(x) = \\dfrac{1}{x - 3}$",
      "$f(x) = \\dfrac{1}{x^2 + 9}$",
      "$f(x) = \\dfrac{x}{x - 3}$"
    ],
    "correct_index": 0,
    "has_math": True,
    "feedback_correct": "$x^2-9=(x-3)(x+3)$ tiene dos raíces reales: dos AV en $x=3$ y $x=-3$.",
    "feedback_incorrect": "",
    "graph_fn": None, "graph_view": None,
    "explanation": "$x^2-9=(x-3)(x+3)$: dos raíces reales → dos AV. $\\frac{1}{x-3}$: una raíz → una AV. $\\frac{1}{x^2+9}$: sin raíces reales → sin AV. $\\frac{x}{x-3}$: una raíz → una AV.",
    "reviewed": False
  },
  {
    "external_id": "white_rational_clsf_41",
    "belt": "white", "topic": "rational", "exercise_type": "CLSF",
    "question": "¿Cuál de estas es VERDADERA sobre las funciones racionales?",
    "options": [
      "Pueden no tener asíntota horizontal si el numerador tiene mayor grado",
      "Siempre tienen exactamente una asíntota vertical y una horizontal",
      "Nunca cruzan el eje $X$",
      "Su dominio siempre es todo $\\mathbb{R}$"
    ],
    "correct_index": 0,
    "has_math": True,
    "feedback_correct": "Si $\\deg(P) > \\deg(Q)$, la racional no tiene AH (puede tener asíntota oblicua).",
    "feedback_incorrect": "",
    "graph_fn": None, "graph_view": None,
    "explanation": "La única afirmación verdadera es la primera. Las demás son falsas: pueden tener 0, 1, 2,... AV; sí pueden cruzar el eje $X$ (cuando el numerador tiene raíces); el dominio excluye los ceros del denominador.",
    "reviewed": False
  },
  {
    "external_id": "white_rational_clsf_42",
    "belt": "white", "topic": "rational", "exercise_type": "CLSF",
    "question": "¿Cuál de estas funciones tiene un agujero (no una AV) en $x = 2$?",
    "options": [
      "$f(x) = \\dfrac{(x-2)(x+1)}{x-2}$",
      "$f(x) = \\dfrac{x+1}{x-2}$",
      "$f(x) = \\dfrac{1}{x-2}$",
      "$f(x) = \\dfrac{x^2}{x-2}$"
    ],
    "correct_index": 0,
    "has_math": True,
    "feedback_correct": "El factor $(x-2)$ se cancela entre numerador y denominador: queda un agujero en $x=2$.",
    "feedback_incorrect": "",
    "graph_fn": None, "graph_view": None,
    "explanation": "En $\\frac{(x-2)(x+1)}{x-2}$, el factor $(x-2)$ se cancela, dejando $x+1$ para $x\\neq2$. En $x=2$ hay un **agujero** (discontinuidad evitable). Las otras opciones tienen $(x-2)$ solo en el denominador: generan una **AV**, no agujero.",
    "reviewed": False
  },
  {
    "external_id": "white_rational_clsf_43",
    "belt": "white", "topic": "rational", "exercise_type": "CLSF",
    "question": "¿A qué familia pertenece una función que cumple: monótona decreciente en cada tramo del dominio, "
                "sin máximos ni mínimos, con dominio $\\mathbb{R}\\setminus\\{-3\\}$?",
    "options": ["Racional", "Cuadrática", "Logarítmica", "Lineal"],
    "correct_index": 0,
    "has_math": True,
    "feedback_correct": "Dominio $\\mathbb{R}\\setminus\\{-3\\}$ + decreciente en cada tramo = racional tipo $k/(x+3)$.",
    "feedback_incorrect": "",
    "graph_fn": None, "graph_view": None,
    "explanation": "El dominio $\\mathbb{R}\\setminus\\{-3\\}$ indica AV en $x=-3$, descartando lineales y cuadráticas (que tienen dominio $\\mathbb{R}$). La logarítmica solo excluye un extremo del dominio, no un punto interior. La decreciente en cada tramo sin extremos apunta a **racional** como $\\frac{k}{x+3}$.",
    "reviewed": False
  },
  {
    "external_id": "white_rational_clsf_44",
    "belt": "white", "topic": "rational", "exercise_type": "CLSF",
    "question": "¿Cuál de estas es la única racional con imagen $\\mathbb{R}\\setminus\\{0\\}$?",
    "options": [
      "$f(x) = \\dfrac{1}{x}$",
      "$f(x) = \\dfrac{x+1}{x-1}$",
      "$f(x) = \\dfrac{1}{x^2}$",
      "$f(x) = \\dfrac{x-2}{x+2}$"
    ],
    "correct_index": 0,
    "has_math": True,
    "feedback_correct": "$1/x$: imagen $\\mathbb{R}\\setminus\\{0\\}$. Las otras tienen AH distinta de cero.",
    "feedback_incorrect": "",
    "graph_fn": None, "graph_view": None,
    "explanation": "$f(x)=\\frac{1}{x}$: imagen $\\mathbb{R}\\setminus\\{0\\}$ (AH en $y=0$, ambos signos posibles). $\\frac{x+1}{x-1}$ tiene AH en $y=1$: imagen $\\mathbb{R}\\setminus\\{1\\}$. $\\frac{1}{x^2}$ tiene imagen $(0,+\\infty)$ (siempre positivo). $\\frac{x-2}{x+2}$ tiene AH en $y=1$: imagen $\\mathbb{R}\\setminus\\{1\\}$.",
    "reviewed": False
  },
  {
    "external_id": "white_rational_clsf_45",
    "belt": "white", "topic": "rational", "exercise_type": "CLSF",
    "question": "¿Cuál de estas funciones tiene asíntota horizontal en $y = 0$ y asíntota vertical en $x = 0$?",
    "options": [
      "$f(x) = \\dfrac{3}{x}$",
      "$f(x) = \\dfrac{x}{x+3}$",
      "$f(x) = \\dfrac{1}{x-3}$",
      "$f(x) = \\dfrac{3}{x-3}$"
    ],
    "correct_index": 0,
    "has_math": True,
    "feedback_correct": "$3/x$: AV en $x=0$ y AH en $y=0$ (grado num < denom).",
    "feedback_incorrect": "",
    "graph_fn": None, "graph_view": None,
    "explanation": "$\\frac{3}{x}$: AV donde el denominador $x=0$ y AH en $y=0$ (numerador constante, grado 0 < grado 1). $\\frac{x}{x+3}$ tiene AV en $x=-3$ y AH en $y=1$. $\\frac{1}{x-3}$ tiene AV en $x=3$. $\\frac{3}{x-3}$ tiene AV en $x=3$.",
    "reviewed": False
  },
  {
    "external_id": "white_rational_clsf_46",
    "belt": "white", "topic": "rational", "exercise_type": "CLSF",
    "question": "¿Cuál de estas afirmaciones describe correctamente a $f(x) = \\dfrac{x^2 - 4}{x - 2}$?",
    "options": [
      "Es una racional con agujero en $x = 2$ (no AV)",
      "Es una racional con AV en $x = 2$",
      "Es una función lineal definida para todo $\\mathbb{R}$",
      "Es una cuadrática"
    ],
    "correct_index": 0,
    "has_math": True,
    "feedback_correct": "$x^2-4=(x-2)(x+2)$: el factor $(x-2)$ se cancela → agujero en $x=2$, no AV.",
    "feedback_incorrect": "",
    "graph_fn": None, "graph_view": None,
    "explanation": "$\\frac{x^2-4}{x-2}=\\frac{(x-2)(x+2)}{x-2}$: el factor $(x-2)$ se cancela. Para $x\\neq2$, $f(x)=x+2$. Pero $x=2$ sigue excluido del dominio: hay un **agujero** (no AV). La función es **racional**, no lineal: tiene un punto excluido.",
    "reviewed": False
  },
  {
    "external_id": "white_rational_clsf_47",
    "belt": "white", "topic": "rational", "exercise_type": "CLSF",
    "question": "¿Cuál de estas afirmaciones sobre la imagen de las funciones racionales es FALSA?",
    "options": [
      "La imagen de toda función racional es siempre $\\mathbb{R}$",
      "La imagen puede ser $\\mathbb{R} \\setminus \\{b\\}$ si hay AH en $y = b$",
      "La imagen puede estar acotada si el denominador nunca se anula",
      "La imagen excluye la asíntota horizontal"
    ],
    "correct_index": 0,
    "has_math": True,
    "feedback_correct": "Falso: $\\frac{1}{x^2+1}$ tiene imagen $(0,1]$, que no es $\\mathbb{R}$.",
    "feedback_incorrect": "",
    "graph_fn": None, "graph_view": None,
    "explanation": "La imagen de una racional **no siempre es $\\mathbb{R}$**. Ejemplo: $\\frac{1}{x^2+1}$ tiene imagen $(0,1]$ porque el denominador $\\geq1$ y el numerador es constante 1. Las demás afirmaciones son verdaderas.",
    "reviewed": False
  },
  {
    "external_id": "white_rational_clsf_48",
    "belt": "white", "topic": "rational", "exercise_type": "CLSF",
    "question": "¿Cuál es el dominio de $f(x) = \\dfrac{x^2 + 1}{x^2 - 5x + 6}$?",
    "options": [
      "$\\mathbb{R} \\setminus \\{2,\\, 3\\}$",
      "$\\mathbb{R}$",
      "$\\mathbb{R} \\setminus \\{6\\}$",
      "$\\mathbb{R} \\setminus \\{5\\}$"
    ],
    "correct_index": 0,
    "has_math": True,
    "feedback_correct": "$x^2-5x+6=(x-2)(x-3)=0$ en $x=2$ y $x=3$: esos dos valores se excluyen.",
    "feedback_incorrect": "",
    "graph_fn": None, "graph_view": None,
    "explanation": "Factorizamos el denominador: $x^2-5x+6=(x-2)(x-3)$. Se anula en $x=2$ y $x=3$. El dominio es $\\mathbb{R}\\setminus\\{2,3\\}$. El numerador $x^2+1\\geq1>0$, así que esos puntos son AV (no agujeros).",
    "reviewed": False
  },
  {
    "external_id": "white_rational_clsf_49",
    "belt": "white", "topic": "rational", "exercise_type": "CLSF",
    "question": "¿Cuál de estas familias tiene la misma estructura general 'AV + AH'?",
    "options": [
      "Racional (con grado numerador $\\leq$ grado denominador)",
      "Logarítmica",
      "Polinómica de grado 2",
      "Exponencial"
    ],
    "correct_index": 0,
    "has_math": True,
    "feedback_correct": "AV + AH es el patrón de las racionales con grado numerador $\\leq$ grado denominador.",
    "feedback_incorrect": "",
    "graph_fn": None, "graph_view": None,
    "explanation": "La **logarítmica** solo tiene AV (no AH finita). La **polinómica** y **exponencial** no tienen AV. Solo las **racionales** (con grado num $\\leq$ grado denom) tienen la combinación AV + AH.",
    "reviewed": False
  },
  {
    "external_id": "white_rational_clsf_50",
    "belt": "white", "topic": "rational", "exercise_type": "CLSF",
    "question": "¿A qué familia pertenece $f(x) = \\dfrac{\\ln(x)}{x}$?",
    "options": [
      "No es racional (contiene un logaritmo en el numerador)",
      "Racional",
      "Logarítmica",
      "Mixta entre racional y logarítmica"
    ],
    "correct_index": 0,
    "has_math": True,
    "feedback_correct": "$\\ln(x)$ no es un polinomio: la función no es racional.",
    "feedback_incorrect": "",
    "graph_fn": None, "graph_view": None,
    "explanation": "Para ser racional, tanto numerador como denominador deben ser **polinomios**. $\\ln(x)$ no lo es. Por lo tanto, $\\frac{\\ln(x)}{x}$ **no es una función racional**. Tampoco es pura logarítmica: es una función compuesta que no entra en ninguna familia básica.",
    "reviewed": False
  },
]

existing_ids = {e["external_id"] for e in data}
for e in new_exercises:
    assert e["external_id"] not in existing_ids, f"Duplicado: {e['external_id']}"
    existing_ids.add(e["external_id"])

data.extend(new_exercises)

from collections import Counter
skills = Counter(e["exercise_type"] for e in data)
print(f"Total: {len(data)} | Por skill: {dict(skills)}")
assert all(e["feedback_incorrect"] == "" for e in data)

FILE.write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding="utf-8")
print("CLSF generados OK.")
