import json

PATH = "content/analisis-1/exercises/white_logarithmic.json"
with open(PATH, encoding="utf-8") as f:
    exercises = json.load(f)

new_lexi = [
  {
    "external_id": "white_logarithmic_lexi_12",
    "belt": "white", "topic": "logarithmic", "exercise_type": "LEXI",
    "question": "¿Cuál es la imagen de $f(x) = \\log_2(x)$?",
    "options": ["$(0, +\\infty)$", "$(-\\infty, 0)$", "$\\mathbb{R}$", "$[0, +\\infty)$"],
    "correct_index": 2, "has_math": True,
    "feedback_correct": "La imagen de toda función logarítmica es $\\mathbb{R}$: toma cualquier valor real.",
    "feedback_incorrect": "", "graph_fn": None, "graph_view": None,
    "explanation": "La imagen de $f(x) = \\log_b(x)$ es $\\mathbb{R}$ — todos los números reales.\n\nEsto contrasta con la exponencial $b^x$, cuya imagen es $(0, +\\infty)$ (solo positivos). Son funciones inversas: lo que una tiene como dominio, la otra lo tiene como imagen.\n\nCuando $x \\to 0^+$, $\\log_b(x) \\to -\\infty$. Cuando $x \\to +\\infty$, $\\log_b(x) \\to +\\infty$. De ahí que la imagen abarque todos los reales.",
    "reviewed": False
  },
  {
    "external_id": "white_logarithmic_lexi_13",
    "belt": "white", "topic": "logarithmic", "exercise_type": "LEXI",
    "question": "¿Cuánto vale $\\log_2\\!\\left(\\dfrac{1}{2}\\right)$?",
    "options": ["$2$", "$1$", "$0$", "$-1$"],
    "correct_index": 3, "has_math": True,
    "feedback_correct": "$\\log_2\\!\\left(\\frac{1}{2}\\right) = -1$ porque $2^{-1} = \\frac{1}{2}$.",
    "feedback_incorrect": "", "graph_fn": None, "graph_view": None,
    "explanation": "Para resolver $\\log_2\\!\\left(\\frac{1}{2}\\right)$, buscamos el exponente al que hay que elevar $2$ para obtener $\\frac{1}{2}$:\n$$2^y = \\frac{1}{2} = 2^{-1} \\implies y = -1$$\n\nCuando el argumento está entre $0$ y $1$ (para base $b > 1$), el logaritmo es negativo.",
    "reviewed": False
  },
  {
    "external_id": "white_logarithmic_lexi_14",
    "belt": "white", "topic": "logarithmic", "exercise_type": "LEXI",
    "question": "¿Cuánto vale $\\log(100)$?",
    "options": ["$100$", "$10$", "$2$", "$1$"],
    "correct_index": 2, "has_math": True,
    "feedback_correct": "$\\log(100) = 2$ porque $10^2 = 100$.",
    "feedback_incorrect": "", "graph_fn": None, "graph_view": None,
    "explanation": "Sin subíndice, $\\log$ significa base $10$:\n$$\\log(100) = \\log_{10}(100) = 2 \\iff 10^2 = 100$$\n\nPatrón: $\\log(10) = 1$, $\\log(100) = 2$, $\\log(1000) = 3$, $\\log(10^n) = n$.",
    "reviewed": False
  },
  {
    "external_id": "white_logarithmic_lexi_15",
    "belt": "white", "topic": "logarithmic", "exercise_type": "LEXI",
    "question": "¿Cuánto vale $\\ln(e^2)$?",
    "options": ["$e^2$", "$2e$", "$1$", "$2$"],
    "correct_index": 3, "has_math": True,
    "feedback_correct": "$\\ln(e^2) = 2$ por la propiedad $\\ln(e^n) = n$.",
    "feedback_incorrect": "", "graph_fn": None, "graph_view": None,
    "explanation": "Por la propiedad de la potencia: $\\ln(e^2) = 2 \\cdot \\ln(e) = 2 \\cdot 1 = 2$.\n\nPatrón general: $\\ln(e^n) = n$ para cualquier $n \\in \\mathbb{R}$.\n\nEjemplos: $\\ln(e^3) = 3$, $\\ln(e^{-1}) = -1$, $\\ln(\\sqrt{e}) = \\frac{1}{2}$.",
    "reviewed": False
  },
  {
    "external_id": "white_logarithmic_lexi_16",
    "belt": "white", "topic": "logarithmic", "exercise_type": "LEXI",
    "question": "¿Cuál de estas igualdades es una propiedad válida del logaritmo?",
    "options": [
      "$\\log_b(x + y) = \\log_b(x) \\cdot \\log_b(y)$",
      "$\\log_b(x \\cdot y) = \\log_b(x) + \\log_b(y)$",
      "$\\log_b(x \\cdot y) = \\log_b(x) \\cdot \\log_b(y)$",
      "$\\log_b(x + y) = \\log_b(x) + \\log_b(y)$"
    ],
    "correct_index": 1, "has_math": True,
    "feedback_correct": "El logaritmo del producto es la suma de los logaritmos: $\\log_b(xy) = \\log_b x + \\log_b y$.",
    "feedback_incorrect": "", "graph_fn": None, "graph_view": None,
    "explanation": "La **propiedad del producto** del logaritmo:\n$$\\log_b(x \\cdot y) = \\log_b(x) + \\log_b(y)$$\n\nEjemplo: $\\log_2(4 \\cdot 8) = \\log_2(4) + \\log_2(8) = 2 + 3 = 5 = \\log_2(32)$ ✓\n\nAtención: la propiedad aplica para productos, no para sumas.",
    "reviewed": False
  },
  {
    "external_id": "white_logarithmic_lexi_17",
    "belt": "white", "topic": "logarithmic", "exercise_type": "LEXI",
    "question": "¿Qué simplificación permite la propiedad del cociente del logaritmo?",
    "options": [
      "$\\log_b\\!\\left(\\frac{x}{y}\\right) = \\frac{\\log_b(x)}{\\log_b(y)}$",
      "$\\log_b\\!\\left(\\frac{x}{y}\\right) = \\log_b(x) - \\log_b(y)$",
      "$\\log_b\\!\\left(\\frac{x}{y}\\right) = \\log_b(x) + \\log_b(y)$",
      "$\\log_b\\!\\left(\\frac{x}{y}\\right) = \\log_b(x) \\cdot \\log_b(y)$"
    ],
    "correct_index": 1, "has_math": True,
    "feedback_correct": "El logaritmo del cociente es la resta: $\\log_b(x/y) = \\log_b x - \\log_b y$.",
    "feedback_incorrect": "", "graph_fn": None, "graph_view": None,
    "explanation": "La **propiedad del cociente**:\n$$\\log_b\\!\\left(\\frac{x}{y}\\right) = \\log_b(x) - \\log_b(y)$$\n\nEjemplo: $\\log_2\\!\\left(\\frac{8}{2}\\right) = \\log_2(8) - \\log_2(2) = 3 - 1 = 2 = \\log_2(4)$ ✓\n\nEl logaritmo convierte divisiones en restas, igual que convierte multiplicaciones en sumas.",
    "reviewed": False
  },
  {
    "external_id": "white_logarithmic_lexi_18",
    "belt": "white", "topic": "logarithmic", "exercise_type": "LEXI",
    "question": "¿Cuánto vale $\\log_2(x^3)$ usando las propiedades del logaritmo?",
    "options": ["$3 + \\log_2(x)$", "$\\log_2(3x)$", "$3 \\cdot \\log_2(x)$", "$\\log_2(x)^3$"],
    "correct_index": 2, "has_math": True,
    "feedback_correct": "Por la propiedad de la potencia: $\\log_2(x^3) = 3 \\cdot \\log_2(x)$.",
    "feedback_incorrect": "", "graph_fn": None, "graph_view": None,
    "explanation": "La **propiedad de la potencia**:\n$$\\log_b(x^n) = n \\cdot \\log_b(x)$$\n\nEl exponente baja y multiplica al logaritmo.\n\nEjemplo: $\\log_2(8) = \\log_2(2^3) = 3 \\cdot \\log_2(2) = 3 \\cdot 1 = 3$ ✓",
    "reviewed": False
  },
  {
    "external_id": "white_logarithmic_lexi_19",
    "belt": "white", "topic": "logarithmic", "exercise_type": "LEXI",
    "question": "¿Cuál es la fórmula de cambio de base para $\\log_b(x)$?",
    "options": [
      "$\\log_b(x) = \\frac{\\ln(b)}{\\ln(x)}$",
      "$\\log_b(x) = \\ln(x) \\cdot \\ln(b)$",
      "$\\log_b(x) = \\frac{\\ln(x)}{\\ln(b)}$",
      "$\\log_b(x) = \\ln(x) - \\ln(b)$"
    ],
    "correct_index": 2, "has_math": True,
    "feedback_correct": "La fórmula de cambio de base es $\\log_b(x) = \\dfrac{\\ln(x)}{\\ln(b)}$.",
    "feedback_incorrect": "", "graph_fn": None, "graph_view": None,
    "explanation": "La **fórmula de cambio de base** permite calcular cualquier logaritmo con una calculadora:\n$$\\log_b(x) = \\frac{\\ln(x)}{\\ln(b)}$$\n\nEjemplo: $\\log_2(10) = \\dfrac{\\ln(10)}{\\ln(2)} \\approx \\dfrac{2{,}303}{0{,}693} \\approx 3{,}32$.",
    "reviewed": False
  },
  {
    "external_id": "white_logarithmic_lexi_20",
    "belt": "white", "topic": "logarithmic", "exercise_type": "LEXI",
    "question": "¿Cuánto vale $\\log_3(3)$?",
    "options": ["$3$", "$0$", "$1$", "$\\frac{1}{3}$"],
    "correct_index": 2, "has_math": True,
    "feedback_correct": "$\\log_3(3) = 1$ porque $3^1 = 3$. El logaritmo de la base siempre vale $1$.",
    "feedback_incorrect": "", "graph_fn": None, "graph_view": None,
    "explanation": "Propiedad fundamental: $\\log_b(b) = 1$ para cualquier base válida $b$:\n$$\\log_b(b) = 1 \\iff b^1 = b \\checkmark$$\n\nEl punto $(b,\\, 1)$ siempre pertenece a la gráfica de $\\log_b(x)$.\n\nEjemplos: $\\log_2(2) = 1$, $\\log_3(3) = 1$, $\\log_{10}(10) = 1$, $\\ln(e) = 1$.",
    "reviewed": False
  },
  {
    "external_id": "white_logarithmic_lexi_21",
    "belt": "white", "topic": "logarithmic", "exercise_type": "LEXI",
    "question": "¿Cuánto vale $\\log_{0{,}5}(2)$?",
    "options": ["$2$", "$0{,}5$", "$-1$", "$1$"],
    "correct_index": 2, "has_math": True,
    "feedback_correct": "$\\log_{0{,}5}(2) = -1$ porque $0{,}5^{-1} = 2$.",
    "feedback_incorrect": "", "graph_fn": None, "graph_view": None,
    "explanation": "$\\log_{0{,}5}(2) = y \\iff 0{,}5^y = 2$.\n\nComo $0{,}5 = 2^{-1}$, tenemos $(2^{-1})^y = 2^1$, es decir $2^{-y} = 2^1$, luego $y = -1$.\n\nLos logaritmos con base $0 < b < 1$ son **decrecientes**: valores mayores del argumento dan logaritmos negativos. Nota: $\\log_{0{,}5}(x) = -\\log_2(x)$.",
    "reviewed": False
  },
  {
    "external_id": "white_logarithmic_lexi_22",
    "belt": "white", "topic": "logarithmic", "exercise_type": "LEXI",
    "question": "Si $\\log_2(a) = \\log_2(c)$, ¿qué puede concluirse?",
    "options": ["$a = 2c$", "$a = c + 2$", "$a = c$", "$a^2 = c$"],
    "correct_index": 2, "has_math": True,
    "feedback_correct": "La logarítmica es inyectiva: si $\\log_2(a) = \\log_2(c)$, entonces $a = c$.",
    "feedback_incorrect": "", "graph_fn": None, "graph_view": None,
    "explanation": "Una función **inyectiva** nunca asigna el mismo valor a dos entradas distintas.\n\nLa logarítmica es estrictamente monótona, por lo que es inyectiva. Esto permite cancelar logaritmos en ecuaciones:\n\nSi $\\log_b(a) = \\log_b(c)$ con $a, c > 0$, entonces $a = c$.",
    "reviewed": False
  },
  {
    "external_id": "white_logarithmic_lexi_23",
    "belt": "white", "topic": "logarithmic", "exercise_type": "LEXI",
    "question": "Si $f(x) = 3^x$, ¿cuál es su función inversa $f^{-1}(x)$?",
    "options": [
      "$f^{-1}(x) = \\frac{1}{3^x}$",
      "$f^{-1}(x) = x^3$",
      "$f^{-1}(x) = \\log_3(x)$",
      "$f^{-1}(x) = 3 \\cdot x$"
    ],
    "correct_index": 2, "has_math": True,
    "feedback_correct": "La inversa de $f(x) = 3^x$ es $f^{-1}(x) = \\log_3(x)$.",
    "feedback_incorrect": "", "graph_fn": None, "graph_view": None,
    "explanation": "La inversa de $f(x) = b^x$ es $f^{-1}(x) = \\log_b(x)$. Para $b = 3$:\n$$\\log_3(3^x) = x \\checkmark \\qquad 3^{\\log_3(x)} = x \\checkmark$$\n\nLas gráficas de $f$ y $f^{-1}$ son simétricas respecto a la recta $y = x$.",
    "reviewed": False
  },
  {
    "external_id": "white_logarithmic_lexi_24",
    "belt": "white", "topic": "logarithmic", "exercise_type": "LEXI",
    "question": "¿Dónde está la asíntota vertical de $f(x) = \\log_2(x - 3)$?",
    "options": ["$x = 0$", "$y = 3$", "$x = -3$", "$x = 3$"],
    "correct_index": 3, "has_math": True,
    "feedback_correct": "El argumento $(x-3)$ se anula en $x = 3$: la asíntota vertical es $x = 3$.",
    "feedback_incorrect": "", "graph_fn": None, "graph_view": None,
    "explanation": "La asíntota vertical ocurre donde el argumento del logaritmo se anula:\n$$x - 3 = 0 \\implies x = 3$$\n\nAsíntota vertical: $x = 3$. Dominio: $(3, +\\infty)$.\n\nRegla general: $\\log_b(x - h)$ tiene asíntota en $x = h$.",
    "reviewed": False
  },
  {
    "external_id": "white_logarithmic_lexi_25",
    "belt": "white", "topic": "logarithmic", "exercise_type": "LEXI",
    "question": "¿Dónde está la asíntota vertical de $f(x) = \\log_2(x) + 5$?",
    "options": ["$x = 5$", "$x = 0$", "$y = 5$", "$x = -5$"],
    "correct_index": 1, "has_math": True,
    "feedback_correct": "Sumar $5$ desplaza la curva hacia arriba, pero la asíntota vertical sigue en $x = 0$.",
    "feedback_incorrect": "", "graph_fn": None, "graph_view": None,
    "explanation": "Para $f(x) = \\log_2(x) + 5$, el argumento sigue siendo $x$, entonces la asíntota sigue en $x = 0$.\n\nEl $+5$ es un desplazamiento vertical que sube la curva, pero no modifica la asíntota ni el dominio.\n\nContraste: $\\log_2(x - 5)$ tiene asíntota en $x = 5$ (desplazamiento horizontal del argumento).",
    "reviewed": False
  },
  {
    "external_id": "white_logarithmic_lexi_26",
    "belt": "white", "topic": "logarithmic", "exercise_type": "LEXI",
    "question": "¿Cómo es $f(x) = -\\log_2(x)$ en comparación con $g(x) = \\log_2(x)$?",
    "options": [
      "Es la misma función",
      "Tiene dominio $x < 0$",
      "Es decreciente, reflejo de $g$ sobre el eje $X$",
      "Tiene asíntota vertical en $y = 0$"
    ],
    "correct_index": 2, "has_math": True,
    "feedback_correct": "$f(x) = -\\log_2(x)$ refleja $g$ sobre el eje $X$: es decreciente.",
    "feedback_incorrect": "", "graph_fn": None, "graph_view": None,
    "explanation": "Multiplicar por $-1$ produce una reflexión respecto al eje $X$: los valores se invierten.\n\n$g(x) = \\log_2(x)$ es creciente; $f(x) = -\\log_2(x)$ es decreciente.\n\nAmbas comparten dominio ($x > 0$), imagen ($\\mathbb{R}$), asíntota ($x = 0$) y el punto $(1, 0)$.",
    "reviewed": False
  },
  {
    "external_id": "white_logarithmic_lexi_27",
    "belt": "white", "topic": "logarithmic", "exercise_type": "LEXI",
    "question": "¿Qué ocurre con $\\log_2(x)$ cuando $x$ se acerca a $0$ por la derecha ($x \\to 0^+$)?",
    "options": ["Tiende a $0$", "Tiende a $+\\infty$", "Tiende a $-\\infty$", "Tiende a $1$"],
    "correct_index": 2, "has_math": True,
    "feedback_correct": "Cuando $x \\to 0^+$, $\\log_2(x) \\to -\\infty$: la función cae sin límite junto a la asíntota.",
    "feedback_incorrect": "", "graph_fn": None, "graph_view": None,
    "explanation": "Cuando el argumento se acerca a $0$ por la derecha:\n$$\\lim_{x \\to 0^+} \\log_2(x) = -\\infty$$\n\nEjemplos: $\\log_2(1) = 0$, $\\log_2(0{,}5) = -1$, $\\log_2(0{,}25) = -2$, $\\log_2(0{,}125) = -3$.\n\nLa curva cae verticalmente al acercarse desde la derecha — eso es la asíntota vertical.",
    "reviewed": False
  },
  {
    "external_id": "white_logarithmic_lexi_28",
    "belt": "white", "topic": "logarithmic", "exercise_type": "LEXI",
    "question": "¿Tiene $f(x) = \\ln(x)$ una asíntota horizontal cuando $x \\to +\\infty$?",
    "options": [
      "Sí, en $y = 1$",
      "Sí, en $y = e$",
      "No, crece sin límite aunque muy lentamente",
      "Sí, en $y = 0$"
    ],
    "correct_index": 2, "has_math": True,
    "feedback_correct": "$\\ln(x) \\to +\\infty$ cuando $x \\to +\\infty$: no hay asíntota horizontal.",
    "feedback_incorrect": "", "graph_fn": None, "graph_view": None,
    "explanation": "$\\displaystyle\\lim_{x \\to +\\infty} \\ln(x) = +\\infty$: la función crece sin cota, aunque muy lentamente.\n\nNo tiene asíntota horizontal. Contraste con la exponencial $e^x$: tiene asíntota horizontal en $y = 0$ cuando $x \\to -\\infty$. Son inversas: lo que una tiene como asíntota horizontal, la otra lo tiene como asíntota vertical.",
    "reviewed": False
  },
  {
    "external_id": "white_logarithmic_lexi_29",
    "belt": "white", "topic": "logarithmic", "exercise_type": "LEXI",
    "question": "¿En qué situación cotidiana aparece de forma natural una función logarítmica?",
    "options": [
      "Calcular la distancia recorrida a velocidad constante",
      "Calcular el área de un rectángulo",
      "Calcular cuántos años tardará una inversión en duplicarse",
      "Calcular el monto de una inversión después de $t$ años"
    ],
    "correct_index": 2, "has_math": True,
    "feedback_correct": "Despejar el tiempo en una ecuación exponencial da una función logarítmica.",
    "feedback_incorrect": "", "graph_fn": None, "graph_view": None,
    "explanation": "El logaritmo es la **inversa de la exponencial**. Aparece cuando se despeja el tiempo $t$.\n\nEjemplo: una inversión crece según $M(t) = M_0 \\cdot (1{,}1)^t$. Para saber cuándo llega a $M$:\n$$t = \\log_{1{,}1}\\!\\left(\\frac{M}{M_0}\\right)$$\n\nLa función 'monto después de $t$ años' es exponencial; la función 'cuántos años para llegar a $X$' es logarítmica.",
    "reviewed": False
  },
  {
    "external_id": "white_logarithmic_lexi_30",
    "belt": "white", "topic": "logarithmic", "exercise_type": "LEXI",
    "question": "¿Cuánto vale $\\log_3(27)$?",
    "options": ["$9$", "$27$", "$3$", "$2$"],
    "correct_index": 2, "has_math": True,
    "feedback_correct": "$\\log_3(27) = 3$ porque $3^3 = 27$.",
    "feedback_incorrect": "", "graph_fn": None, "graph_view": None,
    "explanation": "$\\log_3(27) = y \\iff 3^y = 27 = 3^3 \\implies y = 3$.\n\nEsto corresponde al punto $(27,\\, 3)$ en la gráfica de $f(x) = \\log_3(x)$.\n\nMétodo mental: '¿a qué potencia se eleva $3$ para obtener $27$?' Respuesta: $3$.",
    "reviewed": False
  },
  {
    "external_id": "white_logarithmic_lexi_31",
    "belt": "white", "topic": "logarithmic", "exercise_type": "LEXI",
    "question": "¿Cuánto vale $\\ln(1)$?",
    "options": ["$1$", "$e$", "$0$", "No está definido"],
    "correct_index": 2, "has_math": True,
    "feedback_correct": "$\\ln(1) = 0$ porque $e^0 = 1$. El logaritmo de $1$ vale $0$ en cualquier base.",
    "feedback_incorrect": "", "graph_fn": None, "graph_view": None,
    "explanation": "Propiedad universal: $\\log_b(1) = 0$ para cualquier base válida $b$.\n\nPor qué: $b^0 = 1$ siempre, entonces $\\log_b(1) = 0$.\n\nNo confundir con $f(0) = \\ln(0)$, que **no existe** (el dominio es $x > 0$). El logaritmo de $1$ es cero, no el logaritmo de cero.",
    "reviewed": False
  },
  {
    "external_id": "white_logarithmic_lexi_32",
    "belt": "white", "topic": "logarithmic", "exercise_type": "LEXI",
    "question": "¿Cuánto vale $\\log_2(8)$?",
    "options": ["$4$", "$3$", "$2$", "$6$"],
    "correct_index": 1, "has_math": True,
    "feedback_correct": "$\\log_2(8) = 3$ porque $2^3 = 8$.",
    "feedback_incorrect": "", "graph_fn": None, "graph_view": None,
    "explanation": "$\\log_2(8) = y \\iff 2^y = 8 = 2^3 \\implies y = 3$.\n\nSerie: $\\log_2(2) = 1$, $\\log_2(4) = 2$, $\\log_2(8) = 3$, $\\log_2(16) = 4$.",
    "reviewed": False
  },
  {
    "external_id": "white_logarithmic_lexi_33",
    "belt": "white", "topic": "logarithmic", "exercise_type": "LEXI",
    "question": "¿Cuál es el dominio de $f(x) = \\ln(x + 3)$?",
    "options": ["$x > 3$", "$x > 0$", "$x > -3$", "Todo $x \\in \\mathbb{R}$"],
    "correct_index": 2, "has_math": True,
    "feedback_correct": "Para que $\\ln(x+3)$ esté definido, se necesita $x + 3 > 0$, es decir $x > -3$.",
    "feedback_incorrect": "", "graph_fn": None, "graph_view": None,
    "explanation": "El argumento debe ser positivo:\n$$x + 3 > 0 \\implies x > -3$$\n\nDominio: $(-3, +\\infty)$. Asíntota vertical: $x = -3$.\n\nEl intercepto con el eje $X$ está donde $\\ln(x+3) = 0$, es decir $x + 3 = 1$, o sea $x = -2$.",
    "reviewed": False
  },
  {
    "external_id": "white_logarithmic_lexi_34",
    "belt": "white", "topic": "logarithmic", "exercise_type": "LEXI",
    "question": "¿Cuál es la imagen de $f(x) = -\\log_2(x)$?",
    "options": ["$(-\\infty, 0)$", "$(0, +\\infty)$", "$[0, +\\infty)$", "$\\mathbb{R}$"],
    "correct_index": 3, "has_math": True,
    "feedback_correct": "Negar $\\log_2(x)$ refleja la curva, pero la imagen sigue siendo $\\mathbb{R}$.",
    "feedback_incorrect": "", "graph_fn": None, "graph_view": None,
    "explanation": "La imagen de $\\log_2(x)$ es $\\mathbb{R}$. Multiplicar por $-1$ refleja la curva, pero no la acota:\n\nCuando $\\log_2(x) \\to -\\infty$, $-\\log_2(x) \\to +\\infty$. Cuando $\\log_2(x) \\to +\\infty$, $-\\log_2(x) \\to -\\infty$.\n\nLa imagen sigue siendo $\\mathbb{R}$.",
    "reviewed": False
  },
  {
    "external_id": "white_logarithmic_lexi_35",
    "belt": "white", "topic": "logarithmic", "exercise_type": "LEXI",
    "question": "Para $x = 8$, ¿qué relación hay entre $\\log_2(8)$ y $\\log_4(8)$?",
    "options": [
      "$\\log_2(8) < \\log_4(8)$",
      "$\\log_2(8) = \\log_4(8)$",
      "$\\log_2(8) > \\log_4(8)$",
      "No se pueden comparar"
    ],
    "correct_index": 2, "has_math": True,
    "feedback_correct": "$\\log_2(8) = 3$ y $\\log_4(8) = 1{,}5$. Para $x > 1$, mayor base → menor logaritmo.",
    "feedback_incorrect": "", "graph_fn": None, "graph_view": None,
    "explanation": "$\\log_2(8) = 3$ (pues $2^3 = 8$)\n$$\\log_4(8) = \\frac{3}{2} \\quad \\text{(pues } 4^{3/2} = 8\\text{)}$$\n\nEntonces $3 > 1{,}5$.\n\nRegla: para $x > 1$, a mayor base $b$, menor valor del logaritmo.",
    "reviewed": False
  },
  {
    "external_id": "white_logarithmic_lexi_36",
    "belt": "white", "topic": "logarithmic", "exercise_type": "LEXI",
    "question": "¿Cuánto vale $\\log_2(4) + \\log_2(8)$?",
    "options": ["$\\log_2(12)$", "$5$", "$10$", "$\\log_2(32)$"],
    "correct_index": 3, "has_math": True,
    "feedback_correct": "Por la propiedad del producto: $\\log_2(4) + \\log_2(8) = \\log_2(32)$. Y $\\log_2(32) = 5$.",
    "feedback_incorrect": "", "graph_fn": None, "graph_view": None,
    "explanation": "Propiedad del producto:\n$$\\log_2(4) + \\log_2(8) = \\log_2(4 \\cdot 8) = \\log_2(32)$$\n\nComo $2^5 = 32$, eso equivale a $5$. Las opciones '$5$' y '$\\log_2(32)$' son equivalentes; la fórmula de producto es la forma más directa.",
    "reviewed": False
  },
  {
    "external_id": "white_logarithmic_lexi_37",
    "belt": "white", "topic": "logarithmic", "exercise_type": "LEXI",
    "question": "¿Cuál es el dominio de $f(x) = \\log_2(-x)$?",
    "options": ["$x > 0$", "$x \\geq 0$", "$x < 0$", "Todo $x \\in \\mathbb{R}$"],
    "correct_index": 2, "has_math": True,
    "feedback_correct": "El argumento $(-x)$ debe ser positivo: $-x > 0 \\implies x < 0$.",
    "feedback_incorrect": "", "graph_fn": None, "graph_view": None,
    "explanation": "Para que $f(x) = \\log_2(-x)$ esté definida:\n$$-x > 0 \\implies x < 0$$\n\nDominio: $(-\\infty, 0)$. Asíntota vertical en $x = 0$.\n\nEsta función es la reflexión horizontal de $\\log_2(x)$: la curva se 'voltea' y queda en el semiplano negativo.",
    "reviewed": False
  },
  {
    "external_id": "white_logarithmic_lexi_38",
    "belt": "white", "topic": "logarithmic", "exercise_type": "LEXI",
    "question": "¿Cuál es la función inversa de $f(x) = 10^x$?",
    "options": [
      "$f^{-1}(x) = \\frac{x}{10}$",
      "$f^{-1}(x) = x^{10}$",
      "$f^{-1}(x) = \\ln(x)$",
      "$f^{-1}(x) = \\log(x)$"
    ],
    "correct_index": 3, "has_math": True,
    "feedback_correct": "La inversa de $f(x) = 10^x$ es $f^{-1}(x) = \\log(x)$ (logaritmo base $10$).",
    "feedback_incorrect": "", "graph_fn": None, "graph_view": None,
    "explanation": "La inversa de $b^x$ es siempre $\\log_b(x)$. Para $b = 10$:\n$$\\log(10^x) = x \\checkmark \\qquad 10^{\\log(x)} = x \\checkmark$$\n\nNota: $\\ln(x) = \\log_e(x)$ es la inversa de $e^x$, no de $10^x$.",
    "reviewed": False
  },
  {
    "external_id": "white_logarithmic_lexi_39",
    "belt": "white", "topic": "logarithmic", "exercise_type": "LEXI",
    "question": "¿Cuánto vale $\\log_5(1)$?",
    "options": ["$5$", "$1$", "$-1$", "$0$"],
    "correct_index": 3, "has_math": True,
    "feedback_correct": "$\\log_5(1) = 0$ porque $5^0 = 1$. El logaritmo de $1$ siempre es $0$.",
    "feedback_incorrect": "", "graph_fn": None, "graph_view": None,
    "explanation": "Propiedad universal: $\\log_b(1) = 0$ para cualquier base $b > 0$, $b \\neq 1$, porque $b^0 = 1$ siempre.\n\nTodas las funciones logarítmicas básicas pasan por el punto $(1,\\, 0)$.",
    "reviewed": False
  },
  {
    "external_id": "white_logarithmic_lexi_40",
    "belt": "white", "topic": "logarithmic", "exercise_type": "LEXI",
    "question": "¿Cuánto vale $\\log_2\\!\\left(\\dfrac{1}{4}\\right)$?",
    "options": ["$-2$", "$2$", "$-4$", "$\\frac{1}{2}$"],
    "correct_index": 0, "has_math": True,
    "feedback_correct": "$\\log_2\\!\\left(\\frac{1}{4}\\right) = -2$ porque $2^{-2} = \\frac{1}{4}$.",
    "feedback_incorrect": "", "graph_fn": None, "graph_view": None,
    "explanation": "$2^y = \\frac{1}{4} = 2^{-2} \\implies y = -2$.\n\nPatrón: $\\frac{1}{2} = 2^{-1}$, $\\frac{1}{4} = 2^{-2}$, $\\frac{1}{8} = 2^{-3}$.\n\nPara $0 < x < 1$ con base $b > 1$, el logaritmo es siempre negativo.",
    "reviewed": False
  },
  {
    "external_id": "white_logarithmic_lexi_41",
    "belt": "white", "topic": "logarithmic", "exercise_type": "LEXI",
    "question": "¿A cuál de estas expresiones es equivalente $2 \\cdot \\log_2(x)$?",
    "options": ["$\\log_2(2x)$", "$\\log_2(x + 2)$", "$\\log_2(x^2)$", "$\\log_4(x)$"],
    "correct_index": 2, "has_math": True,
    "feedback_correct": "Por la propiedad de la potencia: $2 \\cdot \\log_2(x) = \\log_2(x^2)$.",
    "feedback_incorrect": "", "graph_fn": None, "graph_view": None,
    "explanation": "La propiedad de la potencia dice que el factor multiplicativo 'sube' como exponente:\n$$2 \\cdot \\log_2(x) = \\log_2(x^2)$$\n\nVerificación con $x = 4$: $2 \\cdot \\log_2(4) = 2 \\cdot 2 = 4$ y $\\log_2(4^2) = \\log_2(16) = 4$ ✓.",
    "reviewed": False
  },
  {
    "external_id": "white_logarithmic_lexi_42",
    "belt": "white", "topic": "logarithmic", "exercise_type": "LEXI",
    "question": "¿Tiene $f(x) = \\log_2(x)$ algún máximo o mínimo local?",
    "options": [
      "Sí, un máximo en $(1,\\, 0)$",
      "Sí, un mínimo cuando $x \\to 0^+$",
      "No, la función es estrictamente creciente sin extremos locales",
      "Sí, un mínimo en $(0,\\, -\\infty)$"
    ],
    "correct_index": 2, "has_math": True,
    "feedback_correct": "Una función estrictamente creciente no tiene extremos locales.",
    "feedback_incorrect": "", "graph_fn": None, "graph_view": None,
    "explanation": "Una función estrictamente monótona no puede tener extremos locales: para que haya un máximo o mínimo, la función debe cambiar de dirección.\n\nComo $\\log_2(x)$ es estrictamente creciente en $(0, +\\infty)$, no tiene máximos ni mínimos locales.\n\nNota: $\\lim_{x \\to 0^+} \\log_2(x) = -\\infty$ no es un mínimo — ese límite nunca se alcanza.",
    "reviewed": False
  },
  {
    "external_id": "white_logarithmic_lexi_43",
    "belt": "white", "topic": "logarithmic", "exercise_type": "LEXI",
    "question": "¿En qué punto pasa la gráfica de $f(x) = \\ln(x)$ a altura $y = 1$?",
    "options": ["$(1,\\, 1)$", "$(2,\\, 1)$", "$(e,\\, 1)$", "$(10,\\, 1)$"],
    "correct_index": 2, "has_math": True,
    "feedback_correct": "$\\ln(e) = 1$, entonces la curva pasa por $(e,\\, 1)$ donde $e \\approx 2{,}718$.",
    "feedback_incorrect": "", "graph_fn": None, "graph_view": None,
    "explanation": "$\\ln(x) = 1$ cuando $x = e \\approx 2{,}718$.\n\nPuntos clave de $\\ln(x)$:\n- $(1,\\, 0)$: intercepto con el eje $X$.\n- $(e,\\, 1)$: la curva alcanza la altura $1$.\n\nPara $\\log_2(x)$: el punto análogo es $(2,\\, 1)$. Para $\\log_{10}(x)$: $(10,\\, 1)$.",
    "reviewed": False
  },
  {
    "external_id": "white_logarithmic_lexi_44",
    "belt": "white", "topic": "logarithmic", "exercise_type": "LEXI",
    "question": "¿Cuánto vale $\\log_4(16)$?",
    "options": ["$4$", "$3$", "$2$", "$\\frac{1}{4}$"],
    "correct_index": 2, "has_math": True,
    "feedback_correct": "$\\log_4(16) = 2$ porque $4^2 = 16$.",
    "feedback_incorrect": "", "graph_fn": None, "graph_view": None,
    "explanation": "$4^y = 16 = 4^2 \\implies y = 2$.\n\nOtra vía: $16 = 2^4$ y $4 = 2^2$, entonces $\\log_4(16) = \\frac{4}{2} = 2$ (usando base común $2$).",
    "reviewed": False
  },
  {
    "external_id": "white_logarithmic_lexi_45",
    "belt": "white", "topic": "logarithmic", "exercise_type": "LEXI",
    "question": "Si $\\log_2(x) = 3$, ¿cuánto vale $x$?",
    "options": ["$6$", "$\\frac{3}{2}$", "$8$", "$9$"],
    "correct_index": 2, "has_math": True,
    "feedback_correct": "$\\log_2(x) = 3 \\iff x = 2^3 = 8$.",
    "feedback_incorrect": "", "graph_fn": None, "graph_view": None,
    "explanation": "Para resolver $\\log_b(x) = c$, se usa la definición del logaritmo:\n$$\\log_b(x) = c \\iff x = b^c$$\n\nAquí: $\\log_2(x) = 3 \\implies x = 2^3 = 8$.",
    "reviewed": False
  },
  {
    "external_id": "white_logarithmic_lexi_46",
    "belt": "white", "topic": "logarithmic", "exercise_type": "LEXI",
    "question": "¿Cuál de estas funciones tiene una asíntota vertical?",
    "options": ["$f(x) = 3^x$", "$f(x) = x^3 - 2$", "$f(x) = \\ln(x)$", "$f(x) = 2x + 1$"],
    "correct_index": 2, "has_math": True,
    "feedback_correct": "$f(x) = \\ln(x)$ tiene asíntota vertical en $x = 0$.",
    "feedback_incorrect": "", "graph_fn": None, "graph_view": None,
    "explanation": "$f(x) = \\ln(x)$ tiene asíntota vertical en $x = 0$:\n$$\\lim_{x \\to 0^+} \\ln(x) = -\\infty$$\n\nLas otras opciones no tienen asíntota vertical: $3^x$ (asíntota horizontal en $y=0$), $x^3-2$ y $2x+1$ están definidas en todo $\\mathbb{R}$.",
    "reviewed": False
  },
  {
    "external_id": "white_logarithmic_lexi_47",
    "belt": "white", "topic": "logarithmic", "exercise_type": "LEXI",
    "question": "¿Cuánto vale $\\log_6(6^5)$?",
    "options": ["$6^5$", "$30$", "$5$", "$\\frac{5}{6}$"],
    "correct_index": 2, "has_math": True,
    "feedback_correct": "Por la propiedad de la potencia: $\\log_6(6^5) = 5 \\cdot \\log_6(6) = 5 \\cdot 1 = 5$.",
    "feedback_incorrect": "", "graph_fn": None, "graph_view": None,
    "explanation": "$\\log_6(6^5) = 5 \\cdot \\log_6(6) = 5 \\cdot 1 = 5$.\n\nResultado fundamental: $\\log_b(b^n) = n$ para cualquier base $b$ y exponente $n$. El logaritmo y la exponencial en la misma base se cancelan.",
    "reviewed": False
  },
  {
    "external_id": "white_logarithmic_lexi_48",
    "belt": "white", "topic": "logarithmic", "exercise_type": "LEXI",
    "question": "¿Cuál de estas funciones tiene dominio exactamente $(0, +\\infty)$?",
    "options": ["$f(x) = 2^x$", "$f(x) = \\log(x)$", "$f(x) = x^2$", "$f(x) = \\sqrt{x}$"],
    "correct_index": 1, "has_math": True,
    "feedback_correct": "$f(x) = \\log(x)$ solo está definida para $x > 0$: dominio $(0, +\\infty)$.",
    "feedback_incorrect": "", "graph_fn": None, "graph_view": None,
    "explanation": "$\\log(x)$ requiere $x > 0$: dominio exactamente $(0, +\\infty)$.\n\nLas otras: $2^x$ tiene dominio $\\mathbb{R}$; $x^2$ tiene dominio $\\mathbb{R}$; $\\sqrt{x}$ tiene dominio $[0, +\\infty)$ — incluye $x=0$ (a diferencia del logaritmo, que excluye el cero).",
    "reviewed": False
  },
  {
    "external_id": "white_logarithmic_lexi_49",
    "belt": "white", "topic": "logarithmic", "exercise_type": "LEXI",
    "question": "¿Cuánto vale $\\log_3(9) - \\log_3(3)$?",
    "options": ["$3$", "$0$", "$1$", "$6$"],
    "correct_index": 2, "has_math": True,
    "feedback_correct": "$\\log_3(9) - \\log_3(3) = \\log_3(9/3) = \\log_3(3) = 1$.",
    "feedback_incorrect": "", "graph_fn": None, "graph_view": None,
    "explanation": "Propiedad del cociente:\n$$\\log_3(9) - \\log_3(3) = \\log_3\\!\\left(\\frac{9}{3}\\right) = \\log_3(3) = 1$$\n\nO directo: $\\log_3(9) = 2$ y $\\log_3(3) = 1$, entonces $2 - 1 = 1$.",
    "reviewed": False
  },
  {
    "external_id": "white_logarithmic_lexi_50",
    "belt": "white", "topic": "logarithmic", "exercise_type": "LEXI",
    "question": "¿A cuál expresión es equivalente $\\ln(e^{2x})$?",
    "options": ["$e^{2x}$", "$2x + e$", "$2\\ln(x)$", "$2x$"],
    "correct_index": 3, "has_math": True,
    "feedback_correct": "$\\ln(e^{2x}) = 2x$ porque $\\ln$ y $e^{(\\ )}$ se cancelan mutuamente.",
    "feedback_incorrect": "", "graph_fn": None, "graph_view": None,
    "explanation": "Usando la propiedad de la potencia y $\\ln(e) = 1$:\n$$\\ln(e^{2x}) = 2x \\cdot \\ln(e) = 2x \\cdot 1 = 2x$$\n\nO usando funciones inversas: $\\ln(e^u) = u$ para cualquier $u \\in \\mathbb{R}$. Con $u = 2x$: resultado $2x$.",
    "reviewed": False
  },
]

exercises.extend(new_lexi)
print(f"LEXI added: {len(new_lexi)} (total: {len(exercises)})")

with open(PATH, "w", encoding="utf-8") as f:
    json.dump(exercises, f, ensure_ascii=False, indent=2)
    f.write("\n")
print("OK")
