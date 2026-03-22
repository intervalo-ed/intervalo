"""
exercise_bank.py — Banco de ejercicios para todas las combinaciones FunctionFamily × SkillType.

Cada ejercicio tiene un campo 'subtype':
  "graph" — muestra un gráfico como estímulo principal
  "text"  — muestra una expresión escrita o pregunta textual

La probabilidad de recibir uno u otro se controla desde SM2Config.graph_exercise_probability.
"""

import random

EXERCISES: dict[tuple[str, str], list[dict]] = {

    # ══════════════════════════════════════════════════════════════════════════
    # LINEAR
    # ══════════════════════════════════════════════════════════════════════════

    ("linear", "vocabulary"): [
        {
            "subtype": "text",
            "question": "¿Cuál de estas expresiones representa una función lineal?",
            "options": ["f(x) = 5x − 2", "f(x) = x²", "f(x) = 3ˣ", "f(x) = log(x)"],
            "correct_index": 0,
            "feedback_correct": "¡Correcto! Una función lineal tiene la forma f(x) = mx + b, donde m y b son constantes.",
            "feedback_incorrect": "Una función lineal tiene la forma f(x) = mx + b. La opción correcta es f(x) = 5x − 2.",
        },
        {
            "subtype": "graph",
            "question": "¿Cómo se llama el punto donde la recta corta el eje Y?",
            "options": ["Ordenada al origen", "Pendiente", "Raíz", "Vértice"],
            "correct_index": 0,
            "feedback_correct": "¡Correcto! El valor de f(0) se llama ordenada al origen (o intercepto en Y).",
            "feedback_incorrect": "El punto donde la recta corta el eje Y se llama ordenada al origen (f(0) = b en f(x) = mx + b).",
            "graph_fn": "3*x + 2",
            "graph_view": [-4, 4, -8, 10],
        },
    ],

    ("linear", "visual_recognition"): [
        {
            "subtype": "graph",
            "question": "¿A qué familia de funciones pertenece esta gráfica?",
            "options": ["Lineal", "Cuadrática", "Exponencial", "Logarítmica"],
            "correct_index": 0,
            "feedback_correct": "¡Correcto! La gráfica es una línea recta: f(x) = 2x − 5, una función lineal.",
            "feedback_incorrect": "La gráfica es una línea recta (f(x) = 2x − 5), característica de una función lineal.",
            "graph_fn": "2*x - 5",
            "graph_view": [-4, 6, -10, 10],
        },
        {
            "subtype": "text",
            "question": "¿A qué familia de funciones pertenece $f(x) = 2x - 5$?",
            "options": ["Lineal", "Cuadrática", "Exponencial", "Logarítmica"],
            "correct_index": 0,
            "feedback_correct": "¡Correcto! $f(x) = 2x - 5$ tiene la forma $f(x) = mx + b$: es una función lineal.",
            "feedback_incorrect": "$f(x) = 2x - 5$ tiene la forma $f(x) = mx + b$, que define una función lineal.",
            "has_math": True,
        },
    ],

    ("linear", "parameter_identification"): [
        {
            "subtype": "text",
            "question": "En $f(x) = -3x + 8$, ¿cuál es la ordenada al origen?",
            "options": ["$8$", "$-3$", "$-3x$", "$x$"],
            "correct_index": 0,
            "feedback_correct": "¡Correcto! En $f(x) = mx + b$, la ordenada al origen es $b = 8$.",
            "feedback_incorrect": "En $f(x) = mx + b$, $b$ es la ordenada al origen. Aquí $b = 8$.",
            "has_math": True,
        },
        {
            "subtype": "graph",
            "question": "¿Cuál de estas expresiones corresponde a la recta del gráfico?",
            "options": ["$y = 2x - 3$", "$y = -2x + 3$", "$y = 3x - 2$", "$y = 2x + 3$"],
            "correct_index": 0,
            "feedback_correct": "¡Correcto! La recta tiene pendiente 2 e intercepto −3: $y = 2x - 3$.",
            "feedback_incorrect": "La recta sube 2 unidades por cada unidad en x y corta el eje Y en −3: $y = 2x - 3$.",
            "has_math": True,
            "graph_fn": "2*x - 3",
            "graph_view": [-3, 5, -8, 8],
        },
    ],

    # ══════════════════════════════════════════════════════════════════════════
    # QUADRATIC
    # ══════════════════════════════════════════════════════════════════════════

    ("quadratic", "vocabulary"): [
        {
            "subtype": "text",
            "question": "¿Cuál de estas expresiones representa una función cuadrática?",
            "options": ["f(x) = 2x² − x + 1", "f(x) = 4x − 7", "f(x) = 2ˣ", "f(x) = √x"],
            "correct_index": 0,
            "feedback_correct": "¡Correcto! Una función cuadrática tiene la forma f(x) = ax² + bx + c con a ≠ 0.",
            "feedback_incorrect": "Una función cuadrática incluye un término de segundo grado (x²). La correcta es f(x) = 2x² − x + 1.",
        },
        {
            "subtype": "graph",
            "question": "¿Cómo se llama el punto más bajo (o más alto) de esta parábola?",
            "options": ["Vértice", "Raíz", "Ordenada al origen", "Asíntota"],
            "correct_index": 0,
            "feedback_correct": "¡Correcto! El punto extremo de una parábola se llama vértice.",
            "feedback_incorrect": "El punto más bajo (mínimo) o más alto (máximo) de una parábola se llama vértice.",
            "graph_fn": "x*x - 4*x + 3",
            "graph_view": [-1, 5, -2, 8],
        },
    ],

    ("quadratic", "visual_recognition"): [
        {
            "subtype": "graph",
            "question": "¿A qué familia de funciones pertenece esta gráfica?",
            "options": ["Cuadrática", "Lineal", "Exponencial", "Racional"],
            "correct_index": 0,
            "feedback_correct": "¡Correcto! La gráfica es una parábola: f(x) = x² − 4x + 3, una función cuadrática.",
            "feedback_incorrect": "La gráfica es una parábola (f(x) = x² − 4x + 3), característica de una función cuadrática.",
            "graph_fn": "x*x - 4*x + 3",
            "graph_view": [-1, 5, -2, 8],
        },
        {
            "subtype": "text",
            "question": "¿A qué familia de funciones pertenece $f(x) = x^2 - 4x + 3$?",
            "options": ["Cuadrática", "Lineal", "Exponencial", "Racional"],
            "correct_index": 0,
            "feedback_correct": "¡Correcto! $f(x) = x^2 - 4x + 3$ tiene la forma $ax^2 + bx + c$: es una función cuadrática.",
            "feedback_incorrect": "$f(x) = x^2 - 4x + 3$ tiene un término $x^2$ como mayor potencia: es una función cuadrática.",
            "has_math": True,
        },
    ],

    ("quadratic", "parameter_identification"): [
        {
            "subtype": "text",
            "question": "En $f(x) = 3x^2 - 6x + 2$, ¿cuál es el coeficiente del término cuadrático?",
            "options": ["$3$", "$-6$", "$2$", "$-3$"],
            "correct_index": 0,
            "feedback_correct": "¡Correcto! En $f(x) = ax^2 + bx + c$, el coeficiente cuadrático es $a = 3$.",
            "feedback_incorrect": "En $f(x) = ax^2 + bx + c$, $a$ es el coeficiente cuadrático. Aquí $a = 3$.",
            "has_math": True,
        },
        {
            "subtype": "graph",
            "question": "¿Cuál de estas expresiones corresponde a la parábola del gráfico?",
            "options": ["$f(x) = (x-2)^2 - 1$", "$f(x) = (x+2)^2 - 1$", "$f(x) = -(x-2)^2 - 1$", "$f(x) = (x-2)^2 + 1$"],
            "correct_index": 0,
            "feedback_correct": "¡Correcto! El vértice está en (2, −1) y la parábola se abre hacia arriba: $f(x) = (x-2)^2 - 1$.",
            "feedback_incorrect": "La parábola tiene vértice en (2, −1) y se abre hacia arriba: $f(x) = (x-2)^2 - 1$.",
            "has_math": True,
            "graph_fn": "pow(x-2, 2) - 1",
            "graph_view": [-1, 5, -2, 8],
        },
    ],

    # ══════════════════════════════════════════════════════════════════════════
    # POLYNOMIAL
    # ══════════════════════════════════════════════════════════════════════════

    ("polynomial", "vocabulary"): [
        {
            "subtype": "text",
            "question": "¿Cuál de estas funciones es un polinomio de grado 3?",
            "options": ["f(x) = x³ − 2x + 5", "f(x) = x² + 1", "f(x) = 4x − 1", "f(x) = x⁴"],
            "correct_index": 0,
            "feedback_correct": "¡Correcto! Un polinomio de grado 3 tiene como término de mayor grado x³.",
            "feedback_incorrect": "Un polinomio de grado 3 tiene x³ como potencia máxima. La correcta es f(x) = x³ − 2x + 5.",
        },
        {
            "subtype": "graph",
            "question": "¿Cuántas raíces reales puede tener como máximo esta función polinómica?",
            "options": ["3", "2", "1", "Infinitas"],
            "correct_index": 0,
            "feedback_correct": "¡Correcto! Un polinomio de grado 3 puede tener hasta 3 raíces reales.",
            "feedback_incorrect": "El número máximo de raíces reales de un polinomio es igual a su grado. Aquí el grado es 3.",
            "graph_fn": "pow(x, 3) - 3*x",
            "graph_view": [-3, 3, -5, 5],
        },
    ],

    ("polynomial", "visual_recognition"): [
        {
            "subtype": "graph",
            "question": "¿A qué familia de funciones pertenece esta gráfica?",
            "options": ["Polinómica", "Cuadrática", "Lineal", "Exponencial"],
            "correct_index": 0,
            "feedback_correct": "¡Correcto! La curva es un polinomio de grado 3: f(x) = x³ − 2x² + x − 1.",
            "feedback_incorrect": "La curva con dos cambios de dirección es f(x) = x³ − 2x² + x − 1, un polinomio de grado 3.",
            "graph_fn": "pow(x, 3) - 2*pow(x, 2) + x - 1",
            "graph_view": [-2, 3, -5, 4],
        },
        {
            "subtype": "text",
            "question": "¿A qué familia de funciones pertenece $f(x) = x^3 - 2x^2 + x - 1$?",
            "options": ["Polinómica", "Cuadrática", "Lineal", "Exponencial"],
            "correct_index": 0,
            "feedback_correct": "¡Correcto! $f(x) = x^3 - 2x^2 + x - 1$ es un polinomio de grado 3.",
            "feedback_incorrect": "$f(x) = x^3 - 2x^2 + x - 1$ tiene $x^3$ como término de mayor grado: es un polinomio de grado 3.",
            "has_math": True,
        },
    ],

    ("polynomial", "parameter_identification"): [
        {
            "subtype": "text",
            "question": "¿Cuál es el grado de $p(x) = 4x^5 - 3x^3 + x - 7$?",
            "options": ["$5$", "$3$", "$1$", "$4$"],
            "correct_index": 0,
            "feedback_correct": "¡Correcto! El grado es la potencia más alta. En $4x^5 - 3x^3 + x - 7$, el grado es $5$.",
            "feedback_incorrect": "El grado es la potencia más alta de $x$. En $4x^5 - 3x^3 + x - 7$, el grado es $5$.",
            "has_math": True,
        },
        {
            "subtype": "graph",
            "question": "¿Cuál de estas expresiones corresponde a la curva del gráfico?",
            "options": ["$f(x) = x^3 - 3x$", "$f(x) = x^3 + 3x$", "$f(x) = -x^3 + 3x$", "$f(x) = x^2 - 3$"],
            "correct_index": 0,
            "feedback_correct": "¡Correcto! La curva tiene raíces en −√3, 0 y √3, consistente con $f(x) = x^3 - 3x$.",
            "feedback_incorrect": "La curva cruza el eje X en −√3, 0 y √3 con pendiente positiva en el origen: $f(x) = x^3 - 3x$.",
            "has_math": True,
            "graph_fn": "pow(x, 3) - 3*x",
            "graph_view": [-3, 3, -5, 5],
        },
    ],

    # ══════════════════════════════════════════════════════════════════════════
    # EXPONENTIAL
    # ══════════════════════════════════════════════════════════════════════════

    ("exponential", "vocabulary"): [
        {
            "subtype": "text",
            "question": "¿Cuál de estas expresiones representa una función exponencial?",
            "options": ["f(x) = 5 · 2ˣ", "f(x) = x⁵", "f(x) = 3x + 1", "f(x) = ln(x)"],
            "correct_index": 0,
            "feedback_correct": "¡Correcto! En una función exponencial, la variable x aparece en el exponente: f(x) = a · bˣ.",
            "feedback_incorrect": "En una función exponencial la variable está en el exponente. La correcta es f(x) = 5 · 2ˣ.",
        },
        {
            "subtype": "graph",
            "question": "¿Cómo se llama la línea horizontal que esta curva se aproxima pero nunca alcanza?",
            "options": ["Asíntota horizontal", "Asíntota vertical", "Eje de simetría", "Tangente"],
            "correct_index": 0,
            "feedback_correct": "¡Correcto! Las funciones exponenciales tienen una asíntota horizontal (y = 0 en su forma básica).",
            "feedback_incorrect": "La línea horizontal que una curva se aproxima infinitamente sin tocarla se llama asíntota horizontal.",
            "graph_fn": "pow(2, x)",
            "graph_view": [-4, 4, -1, 10],
        },
    ],

    ("exponential", "visual_recognition"): [
        {
            "subtype": "graph",
            "question": "¿A qué familia de funciones pertenece esta gráfica?",
            "options": ["Exponencial", "Polinómica", "Logarítmica", "Lineal"],
            "correct_index": 0,
            "feedback_correct": "¡Correcto! La curva crece aceleradamente: f(x) = 3 · 2^x, una función exponencial.",
            "feedback_incorrect": "El crecimiento acelerado con asíntota en y = 0 es propio de una exponencial: f(x) = 3 · 2^x.",
            "graph_fn": "3 * pow(2, x)",
            "graph_view": [-3, 3, -1, 12],
        },
        {
            "subtype": "text",
            "question": "¿A qué familia de funciones pertenece $f(x) = 3 \\cdot 2^x$?",
            "options": ["Exponencial", "Polinómica", "Logarítmica", "Lineal"],
            "correct_index": 0,
            "feedback_correct": "¡Correcto! En $f(x) = 3 \\cdot 2^x$, la variable $x$ está en el exponente: es una función exponencial.",
            "feedback_incorrect": "En $f(x) = 3 \\cdot 2^x$, la variable aparece en el exponente. Eso define una función exponencial.",
            "has_math": True,
        },
    ],

    ("exponential", "parameter_identification"): [
        {
            "subtype": "text",
            "question": "En $f(x) = 3 \\cdot (0{,}5)^x$, ¿cuál es la base de la exponencial?",
            "options": ["$0{,}5$", "$3$", "$x$", "$1{,}5$"],
            "correct_index": 0,
            "feedback_correct": "¡Correcto! En $f(x) = a \\cdot b^x$, la base es $b = 0{,}5$. Como $0 < b < 1$, la función es decreciente.",
            "feedback_incorrect": "En $f(x) = a \\cdot b^x$, $b$ es la base. Aquí $b = 0{,}5$.",
            "has_math": True,
        },
        {
            "subtype": "graph",
            "question": "¿Cuál de estas expresiones corresponde a la curva del gráfico?",
            "options": ["$f(x) = (0{,}5)^x$", "$f(x) = 2^x$", "$f(x) = -2^x$", "$f(x) = 2 \\cdot x$"],
            "correct_index": 0,
            "feedback_correct": "¡Correcto! La curva decrece hacia 0: base menor que 1, $f(x) = (0{,}5)^x$.",
            "feedback_incorrect": "La curva decrece (base $b < 1$) con asíntota en $y = 0$: corresponde a $f(x) = (0{,}5)^x$.",
            "has_math": True,
            "graph_fn": "pow(0.5, x)",
            "graph_view": [-3, 4, -0.5, 6],
        },
    ],

    # ══════════════════════════════════════════════════════════════════════════
    # LOGARITHMIC
    # ══════════════════════════════════════════════════════════════════════════

    ("logarithmic", "vocabulary"): [
        {
            "subtype": "text",
            "question": "¿Cuál de estas expresiones es una función logarítmica?",
            "options": ["f(x) = log₂(x)", "f(x) = 2ˣ", "f(x) = x²", "f(x) = 1/x"],
            "correct_index": 0,
            "feedback_correct": "¡Correcto! Una función logarítmica tiene la forma f(x) = logₐ(x).",
            "feedback_incorrect": "Una función logarítmica usa el logaritmo de la variable. La correcta es f(x) = log₂(x).",
        },
        {
            "subtype": "graph",
            "question": "¿Cómo se llama la línea vertical que actúa como frontera para esta función?",
            "options": ["Asíntota vertical", "Asíntota horizontal", "Eje de simetría", "Tangente"],
            "correct_index": 0,
            "feedback_correct": "¡Correcto! Las funciones logarítmicas tienen una asíntota vertical (x = 0 en su forma básica).",
            "feedback_incorrect": "La línea vertical que la función no puede cruzar se llama asíntota vertical. Aquí está en x = 0.",
            "graph_fn": "log2(x)",
            "graph_view": [-0.5, 6, -4, 5],
        },
    ],

    ("logarithmic", "visual_recognition"): [
        {
            "subtype": "graph",
            "question": "¿A qué familia de funciones pertenece esta gráfica?",
            "options": ["Logarítmica", "Exponencial", "Racional", "Lineal"],
            "correct_index": 0,
            "feedback_correct": "¡Correcto! La curva crece lentamente para x > 0: f(x) = log₂(x) + 1, una función logarítmica.",
            "feedback_incorrect": "La asíntota vertical en x = 0 y el crecimiento lento son propios de una logarítmica: f(x) = log₂(x) + 1.",
            "graph_fn": "log2(x) + 1",
            "graph_view": [-0.5, 6, -4, 5],
        },
        {
            "subtype": "text",
            "question": "¿A qué familia de funciones pertenece $f(x) = \\log_2(x) + 1$?",
            "options": ["Logarítmica", "Exponencial", "Racional", "Lineal"],
            "correct_index": 0,
            "feedback_correct": "¡Correcto! $f(x) = \\log_2(x) + 1$ aplica un logaritmo a $x$: es una función logarítmica.",
            "feedback_incorrect": "$f(x) = \\log_2(x) + 1$ usa el logaritmo de la variable: pertenece a la familia logarítmica.",
            "has_math": True,
        },
    ],

    ("logarithmic", "parameter_identification"): [
        {
            "subtype": "text",
            "question": "En $f(x) = \\log_5(x)$, ¿cuál es la base del logaritmo?",
            "options": ["$5$", "$x$", "$1$", "$0$"],
            "correct_index": 0,
            "feedback_correct": "¡Correcto! En $\\log_5(x)$, el subíndice $5$ es la base.",
            "feedback_incorrect": "En $\\log_a(x)$, $a$ es la base. En $\\log_5(x)$, la base es $5$.",
            "has_math": True,
        },
        {
            "subtype": "graph",
            "question": "¿Cuál de estas expresiones corresponde a la curva del gráfico?",
            "options": ["$f(x) = \\log_2(x+1)$", "$f(x) = \\log_2(x)$", "$f(x) = \\log_2(x-1)$", "$f(x) = -\\log_2(x+1)$"],
            "correct_index": 0,
            "feedback_correct": "¡Correcto! La curva pasa por (0, 0) y tiene asíntota en x = −1: $f(x) = \\log_2(x+1)$.",
            "feedback_incorrect": "La asíntota vertical en x = −1 y el cruce por el origen indican $f(x) = \\log_2(x+1)$.",
            "has_math": True,
            "graph_fn": "log2(x + 1)",
            "graph_view": [-1, 6, -3, 4],
        },
    ],

    # ══════════════════════════════════════════════════════════════════════════
    # TRIGONOMETRIC
    # ══════════════════════════════════════════════════════════════════════════

    ("trigonometric", "vocabulary"): [
        {
            "subtype": "text",
            "question": "¿Cuál de estas es una función trigonométrica?",
            "options": ["f(x) = sen(x)", "f(x) = eˣ", "f(x) = x³", "f(x) = ln(x)"],
            "correct_index": 0,
            "feedback_correct": "¡Correcto! El seno, coseno y tangente son las funciones trigonométricas básicas.",
            "feedback_incorrect": "Las funciones trigonométricas son seno, coseno y tangente. La correcta es f(x) = sen(x).",
        },
        {
            "subtype": "graph",
            "question": "¿Cómo se llama la distancia entre el valor máximo de la curva y su eje de simetría horizontal?",
            "options": ["Amplitud", "Período", "Frecuencia", "Fase"],
            "correct_index": 0,
            "feedback_correct": "¡Correcto! La amplitud es la distancia del máximo (o mínimo) al eje central. Aquí vale 2.",
            "feedback_incorrect": "Esa distancia se llama amplitud. En f(x) = 2·sen(x), la amplitud es 2.",
            "graph_fn": "2 * sin(x)",
            "graph_view": [-7, 7, -3, 3],
        },
    ],

    ("trigonometric", "visual_recognition"): [
        {
            "subtype": "graph",
            "question": "¿A qué familia de funciones pertenece esta gráfica?",
            "options": ["Trigonométrica", "Exponencial", "Polinómica", "Racional"],
            "correct_index": 0,
            "feedback_correct": "¡Correcto! La oscilación periódica corresponde a f(x) = 2·sen(x), una función trigonométrica.",
            "feedback_incorrect": "La forma de onda periódica entre −2 y 2 es propia de una trigonométrica: f(x) = 2·sen(x).",
            "graph_fn": "2 * sin(x)",
            "graph_view": [-7, 7, -3, 3],
        },
        {
            "subtype": "text",
            "question": "¿A qué familia de funciones pertenece $f(x) = 2\\operatorname{sen}(x)$?",
            "options": ["Trigonométrica", "Exponencial", "Polinómica", "Racional"],
            "correct_index": 0,
            "feedback_correct": "¡Correcto! $f(x) = 2\\operatorname{sen}(x)$ usa la función seno: es trigonométrica.",
            "feedback_incorrect": "La función seno pertenece a la familia trigonométrica. $f(x) = 2\\operatorname{sen}(x)$ es trigonométrica.",
            "has_math": True,
        },
    ],

    ("trigonometric", "parameter_identification"): [
        {
            "subtype": "text",
            "question": "En $f(x) = 3\\operatorname{sen}(2x + \\pi/4)$, ¿cuál es la amplitud?",
            "options": ["$3$", "$2$", "$\\pi/4$", "$1$"],
            "correct_index": 0,
            "feedback_correct": "¡Correcto! En $A \\cdot \\operatorname{sen}(Bx + C)$, la amplitud es $A = 3$.",
            "feedback_incorrect": "En $A \\cdot \\operatorname{sen}(Bx + C)$, $A$ es la amplitud. Aquí $A = 3$.",
            "has_math": True,
        },
        {
            "subtype": "graph",
            "question": "¿Cuál de estas expresiones corresponde a la curva del gráfico?",
            "options": ["$f(x) = \\cos(x)$", "$f(x) = \\operatorname{sen}(x)$", "$f(x) = 2\\cos(x)$", "$f(x) = \\cos(2x)$"],
            "correct_index": 0,
            "feedback_correct": "¡Correcto! La curva parte de su máximo en x = 0 con amplitud 1: $f(x) = \\cos(x)$.",
            "feedback_incorrect": "La curva comienza en su valor máximo (1) cuando x = 0: eso es $f(x) = \\cos(x)$, no el seno.",
            "has_math": True,
            "graph_fn": "cos(x)",
            "graph_view": [-7, 7, -3, 3],
        },
    ],

    # ══════════════════════════════════════════════════════════════════════════
    # RATIONAL
    # ══════════════════════════════════════════════════════════════════════════

    ("rational", "vocabulary"): [
        {
            "subtype": "text",
            "question": "¿Cuál de estas es una función racional?",
            "options": ["f(x) = (x + 1) / (x − 2)", "f(x) = x² − 1", "f(x) = 3ˣ", "f(x) = √x"],
            "correct_index": 0,
            "feedback_correct": "¡Correcto! Una función racional es el cociente de dos polinomios.",
            "feedback_incorrect": "Una función racional es un cociente de polinomios. La correcta es f(x) = (x + 1)/(x − 2).",
        },
        {
            "subtype": "graph",
            "question": "¿Cómo se llaman las líneas que esta curva se aproxima pero nunca llega a tocar?",
            "options": ["Asíntotas", "Tangentes", "Ejes de simetría", "Rectas directrices"],
            "correct_index": 0,
            "feedback_correct": "¡Correcto! Las líneas que una curva se acerca indefinidamente sin tocar se llaman asíntotas.",
            "feedback_incorrect": "Esas líneas se llaman asíntotas. Esta función racional tiene una vertical (x = 2) y una horizontal (y = 1).",
            "graph_fn": "(x + 1) / (x - 2)",
            "graph_view": [-5, 7, -8, 8],
        },
    ],

    ("rational", "visual_recognition"): [
        {
            "subtype": "graph",
            "question": "¿A qué familia de funciones pertenece esta gráfica?",
            "options": ["Racional", "Polinómica", "Lineal", "Logarítmica"],
            "correct_index": 0,
            "feedback_correct": "¡Correcto! Las dos ramas con asíntotas corresponden a f(x) = (x+1)/(x−2), una función racional.",
            "feedback_incorrect": "Las asíntotas vertical y horizontal con dos ramas separadas son propias de una racional: f(x) = (x+1)/(x−2).",
            "graph_fn": "(x + 1) / (x - 2)",
            "graph_view": [-5, 7, -8, 8],
        },
        {
            "subtype": "text",
            "question": "¿A qué familia de funciones pertenece $f(x) = \\dfrac{x+1}{x-2}$?",
            "options": ["Racional", "Polinómica", "Lineal", "Logarítmica"],
            "correct_index": 0,
            "feedback_correct": "¡Correcto! $\\dfrac{x+1}{x-2}$ es el cociente de dos polinomios: es una función racional.",
            "feedback_incorrect": "$f(x) = \\dfrac{x+1}{x-2}$ es un cociente de polinomios: pertenece a la familia racional.",
            "has_math": True,
        },
    ],

    ("rational", "parameter_identification"): [
        {
            "subtype": "text",
            "question": "¿Para qué valor de $x$ no está definida $f(x) = \\dfrac{2x + 3}{x - 5}$?",
            "options": ["$x = 5$", "$x = 3$", "$x = -3$", "$x = 2$"],
            "correct_index": 0,
            "feedback_correct": "¡Correcto! La función no está definida cuando el denominador se anula: $x - 5 = 0 \\Rightarrow x = 5$.",
            "feedback_incorrect": "La función no está definida donde el denominador es cero: $x - 5 = 0 \\Rightarrow x = 5$.",
            "has_math": True,
        },
        {
            "subtype": "graph",
            "question": "¿Cuál de estas expresiones corresponde a la curva del gráfico?",
            "options": ["$f(x) = \\dfrac{1}{x-1}$", "$f(x) = \\dfrac{1}{x+1}$", "$f(x) = \\dfrac{x}{x-1}$", "$f(x) = \\dfrac{1}{x^2-1}$"],
            "correct_index": 0,
            "feedback_correct": "¡Correcto! La asíntota vertical en x = 1 y la horizontal en y = 0 corresponden a $f(x) = \\dfrac{1}{x-1}$.",
            "feedback_incorrect": "La asíntota vertical está en x = 1 (denominador = 0) y la horizontal en y = 0: $f(x) = \\dfrac{1}{x-1}$.",
            "has_math": True,
            "graph_fn": "1 / (x - 1)",
            "graph_view": [-4, 6, -6, 6],
        },
    ],
}

# ── Fallback exercise ──────────────────────────────────────────────────────────
_FALLBACK: dict = {
    "subtype": "text",
    "question": "¿Cuál de estas expresiones representa una función lineal?",
    "options": ["f(x) = 5x − 2", "f(x) = x²", "f(x) = 3ˣ", "f(x) = log(x)"],
    "correct_index": 0,
    "feedback_correct": "¡Correcto! Una función lineal tiene la forma f(x) = mx + b.",
    "feedback_incorrect": "La opción correcta es f(x) = 5x − 2, que es una función lineal.",
}


def get_exercise(family_value: str, skill_value: str, graph_probability: float = 0.6) -> dict:
    """Devuelve un ejercicio para la combinación (familia, habilidad).

    Elige el subtipo (graph/text) según graph_probability.
    Si el subtipo preferido no tiene ejercicios en el banco, usa cualquier disponible.
    """
    key = (family_value, skill_value)
    exercises = EXERCISES.get(key)
    if not exercises:
        return _FALLBACK.copy()

    preferred = "graph" if random.random() < graph_probability else "text"
    filtered = [e for e in exercises if e.get("subtype") == preferred]

    if not filtered:
        filtered = exercises

    return random.choice(filtered).copy()
