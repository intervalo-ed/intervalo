"""
exercise_bank.py — Banco de ejercicios para todas las combinaciones FunctionFamily × SkillType.
Cada entrada es una lista de dicts con estructura estandarizada de pregunta de opción múltiple.
"""

import random
from typing import Optional

EXERCISES: dict[tuple[str, str], list[dict]] = {

    # ── LINEAR ────────────────────────────────────────────────────────────────
    ("linear", "vocabulary"): [
        {
            "question": "¿Cuál de estas expresiones representa una función lineal?",
            "options": ["f(x) = 5x − 2", "f(x) = x²", "f(x) = 3ˣ", "f(x) = log(x)"],
            "correct_index": 0,
            "feedback_correct": "¡Correcto! Una función lineal tiene la forma f(x) = mx + b, donde m y b son constantes.",
            "feedback_incorrect": "Una función lineal tiene la forma f(x) = mx + b. La opción correcta es f(x) = 5x − 2.",
        }
    ],
    ("linear", "visual_recognition"): [
        {
            "question": "¿A qué familia de funciones pertenece esta gráfica?",
            "options": ["Lineal", "Cuadrática", "Exponencial", "Logarítmica"],
            "correct_index": 0,
            "feedback_correct": "¡Correcto! La gráfica es una línea recta: f(x) = 2x − 5, una función lineal.",
            "feedback_incorrect": "La gráfica es una línea recta (f(x) = 2x − 5), característica de una función lineal.",
            "graph_fn": "2*x - 5",
            "graph_view": [-4, 6, -10, 10],
        }
    ],
    ("linear", "parameter_identification"): [
        {
            "question": "En $f(x) = -3x + 8$, ¿cuál es la ordenada al origen?",
            "options": ["$8$", "$-3$", "$-3x$", "$x$"],
            "correct_index": 0,
            "feedback_correct": "¡Correcto! En $f(x) = mx + b$, la ordenada al origen es $b = 8$.",
            "feedback_incorrect": "En $f(x) = mx + b$, $b$ es la ordenada al origen. Aquí $b = 8$.",
            "has_math": True,
        }
    ],

    # ── QUADRATIC ─────────────────────────────────────────────────────────────
    ("quadratic", "vocabulary"): [
        {
            "question": "¿Cuál de estas expresiones representa una función cuadrática?",
            "options": ["f(x) = 2x² − x + 1", "f(x) = 4x − 7", "f(x) = 2ˣ", "f(x) = √x"],
            "correct_index": 0,
            "feedback_correct": "¡Correcto! Una función cuadrática tiene la forma f(x) = ax² + bx + c con a ≠ 0.",
            "feedback_incorrect": "Una función cuadrática incluye un término de segundo grado (x²). La correcta es f(x) = 2x² − x + 1.",
        }
    ],
    ("quadratic", "visual_recognition"): [
        {
            "question": "¿A qué familia de funciones pertenece esta gráfica?",
            "options": ["Cuadrática", "Lineal", "Exponencial", "Racional"],
            "correct_index": 0,
            "feedback_correct": "¡Correcto! La gráfica es una parábola: f(x) = x² − 4x + 3, una función cuadrática.",
            "feedback_incorrect": "La gráfica es una parábola (f(x) = x² − 4x + 3), característica de una función cuadrática.",
            "graph_fn": "x*x - 4*x + 3",
            "graph_view": [-1, 5, -2, 8],
        }
    ],
    ("quadratic", "parameter_identification"): [
        {
            "question": "En $f(x) = 3x^2 - 6x + 2$, ¿cuál es el coeficiente del término cuadrático?",
            "options": ["$3$", "$-6$", "$2$", "$-3$"],
            "correct_index": 0,
            "feedback_correct": "¡Correcto! En $f(x) = ax^2 + bx + c$, el coeficiente cuadrático es $a = 3$.",
            "feedback_incorrect": "En $f(x) = ax^2 + bx + c$, $a$ es el coeficiente cuadrático. Aquí $a = 3$.",
            "has_math": True,
        }
    ],

    # ── POLYNOMIAL ────────────────────────────────────────────────────────────
    ("polynomial", "vocabulary"): [
        {
            "question": "¿Cuál de estas funciones es un polinomio de grado 3?",
            "options": ["f(x) = x³ − 2x + 5", "f(x) = x² + 1", "f(x) = 4x − 1", "f(x) = x⁴"],
            "correct_index": 0,
            "feedback_correct": "¡Correcto! Un polinomio de grado 3 tiene como término de mayor grado x³.",
            "feedback_incorrect": "Un polinomio de grado 3 tiene x³ como potencia máxima. La correcta es f(x) = x³ − 2x + 5.",
        }
    ],
    ("polynomial", "visual_recognition"): [
        {
            "question": "¿A qué familia de funciones pertenece esta gráfica?",
            "options": ["Polinómica", "Cuadrática", "Lineal", "Exponencial"],
            "correct_index": 0,
            "feedback_correct": "¡Correcto! La curva es un polinomio de grado 3: f(x) = x³ − 2x² + x − 1.",
            "feedback_incorrect": "La curva con dos cambios de dirección es f(x) = x³ − 2x² + x − 1, un polinomio de grado 3.",
            "graph_fn": "pow(x, 3) - 2*pow(x, 2) + x - 1",
            "graph_view": [-2, 3, -5, 4],
        }
    ],
    ("polynomial", "parameter_identification"): [
        {
            "question": "¿Cuál es el grado de $p(x) = 4x^5 - 3x^3 + x - 7$?",
            "options": ["$5$", "$3$", "$1$", "$4$"],
            "correct_index": 0,
            "feedback_correct": "¡Correcto! El grado es la potencia más alta. En $4x^5 - 3x^3 + x - 7$, el grado es $5$.",
            "feedback_incorrect": "El grado es la potencia más alta de $x$. En $4x^5 - 3x^3 + x - 7$, el grado es $5$.",
            "has_math": True,
        }
    ],

    # ── EXPONENTIAL ───────────────────────────────────────────────────────────
    ("exponential", "vocabulary"): [
        {
            "question": "¿Cuál de estas expresiones representa una función exponencial?",
            "options": ["f(x) = 5 · 2ˣ", "f(x) = x⁵", "f(x) = 3x + 1", "f(x) = ln(x)"],
            "correct_index": 0,
            "feedback_correct": "¡Correcto! En una función exponencial, la variable x aparece en el exponente: f(x) = a · bˣ.",
            "feedback_incorrect": "En una función exponencial la variable está en el exponente. La correcta es f(x) = 5 · 2ˣ.",
        }
    ],
    ("exponential", "visual_recognition"): [
        {
            "question": "¿A qué familia de funciones pertenece esta gráfica?",
            "options": ["Exponencial", "Polinómica", "Logarítmica", "Lineal"],
            "correct_index": 0,
            "feedback_correct": "¡Correcto! La curva crece aceleradamente: f(x) = 3 · 2^x, una función exponencial.",
            "feedback_incorrect": "El crecimiento acelerado con asíntota en y = 0 es propio de una exponencial: f(x) = 3 · 2^x.",
            "graph_fn": "3 * pow(2, x)",
            "graph_view": [-3, 3, -1, 12],
        }
    ],
    ("exponential", "parameter_identification"): [
        {
            "question": "En $f(x) = 3 \\cdot (0{,}5)^x$, ¿cuál es la base de la exponencial?",
            "options": ["$0{,}5$", "$3$", "$x$", "$1{,}5$"],
            "correct_index": 0,
            "feedback_correct": "¡Correcto! En $f(x) = a \\cdot b^x$, la base es $b = 0{,}5$. Como $0 < b < 1$, la función es decreciente.",
            "feedback_incorrect": "En $f(x) = a \\cdot b^x$, $b$ es la base. Aquí $b = 0{,}5$.",
            "has_math": True,
        }
    ],

    # ── LOGARITHMIC ───────────────────────────────────────────────────────────
    ("logarithmic", "vocabulary"): [
        {
            "question": "¿Cuál de estas expresiones es una función logarítmica?",
            "options": ["f(x) = log₂(x)", "f(x) = 2ˣ", "f(x) = x²", "f(x) = 1/x"],
            "correct_index": 0,
            "feedback_correct": "¡Correcto! Una función logarítmica tiene la forma f(x) = logₐ(x).",
            "feedback_incorrect": "Una función logarítmica usa el logaritmo de la variable. La correcta es f(x) = log₂(x).",
        }
    ],
    ("logarithmic", "visual_recognition"): [
        {
            "question": "¿A qué familia de funciones pertenece esta gráfica?",
            "options": ["Logarítmica", "Exponencial", "Racional", "Lineal"],
            "correct_index": 0,
            "feedback_correct": "¡Correcto! La curva crece lentamente para x > 0: f(x) = log₂(x) + 1, una función logarítmica.",
            "feedback_incorrect": "La asíntota vertical en x = 0 y el crecimiento lento son propios de una logarítmica: f(x) = log₂(x) + 1.",
            "graph_fn": "log2(x) + 1",
            "graph_view": [-0.5, 6, -4, 5],
        }
    ],
    ("logarithmic", "parameter_identification"): [
        {
            "question": "En $f(x) = \\log_5(x)$, ¿cuál es la base del logaritmo?",
            "options": ["$5$", "$x$", "$1$", "$0$"],
            "correct_index": 0,
            "feedback_correct": "¡Correcto! En $\\log_5(x)$, el subíndice $5$ es la base.",
            "feedback_incorrect": "En $\\log_a(x)$, $a$ es la base. En $\\log_5(x)$, la base es $5$.",
            "has_math": True,
        }
    ],

    # ── TRIGONOMETRIC ─────────────────────────────────────────────────────────
    ("trigonometric", "vocabulary"): [
        {
            "question": "¿Cuál de estas es una función trigonométrica?",
            "options": ["f(x) = sen(x)", "f(x) = eˣ", "f(x) = x³", "f(x) = ln(x)"],
            "correct_index": 0,
            "feedback_correct": "¡Correcto! El seno, coseno y tangente son las funciones trigonométricas básicas.",
            "feedback_incorrect": "Las funciones trigonométricas son seno, coseno y tangente. La correcta es f(x) = sen(x).",
        }
    ],
    ("trigonometric", "visual_recognition"): [
        {
            "question": "¿A qué familia de funciones pertenece esta gráfica?",
            "options": ["Trigonométrica", "Exponencial", "Polinómica", "Racional"],
            "correct_index": 0,
            "feedback_correct": "¡Correcto! La oscilación periódica corresponde a f(x) = 2·sen(x), una función trigonométrica.",
            "feedback_incorrect": "La forma de onda periódica entre −2 y 2 es propia de una trigonométrica: f(x) = 2·sen(x).",
            "graph_fn": "2 * sin(x)",
            "graph_view": [-7, 7, -3, 3],
        }
    ],
    ("trigonometric", "parameter_identification"): [
        {
            "question": "En $f(x) = 3\\operatorname{sen}(2x + \\pi/4)$, ¿cuál es la amplitud?",
            "options": ["$3$", "$2$", "$\\pi/4$", "$1$"],
            "correct_index": 0,
            "feedback_correct": "¡Correcto! En $A \\cdot \\operatorname{sen}(Bx + C)$, la amplitud es $A = 3$.",
            "feedback_incorrect": "En $A \\cdot \\operatorname{sen}(Bx + C)$, $A$ es la amplitud. Aquí $A = 3$.",
            "has_math": True,
        }
    ],

    # ── RATIONAL ──────────────────────────────────────────────────────────────
    ("rational", "vocabulary"): [
        {
            "question": "¿Cuál de estas es una función racional?",
            "options": ["f(x) = (x + 1) / (x − 2)", "f(x) = x² − 1", "f(x) = 3ˣ", "f(x) = √x"],
            "correct_index": 0,
            "feedback_correct": "¡Correcto! Una función racional es el cociente de dos polinomios.",
            "feedback_incorrect": "Una función racional es un cociente de polinomios. La correcta es f(x) = (x + 1)/(x − 2).",
        }
    ],
    ("rational", "visual_recognition"): [
        {
            "question": "¿A qué familia de funciones pertenece esta gráfica?",
            "options": ["Racional", "Polinómica", "Lineal", "Logarítmica"],
            "correct_index": 0,
            "feedback_correct": "¡Correcto! Las dos ramas con asíntotas corresponden a f(x) = (x+1)/(x−2), una función racional.",
            "feedback_incorrect": "Las asíntotas vertical y horizontal con dos ramas separadas son propias de una racional: f(x) = (x+1)/(x−2).",
            "graph_fn": "(x + 1) / (x - 2)",
            "graph_view": [-5, 7, -8, 8],
        }
    ],
    ("rational", "parameter_identification"): [
        {
            "question": "¿Para qué valor de $x$ no está definida $f(x) = \\dfrac{2x + 3}{x - 5}$?",
            "options": ["$x = 5$", "$x = 3$", "$x = -3$", "$x = 2$"],
            "correct_index": 0,
            "feedback_correct": "¡Correcto! La función no está definida cuando el denominador se anula: $x - 5 = 0 \\Rightarrow x = 5$.",
            "feedback_incorrect": "La función no está definida donde el denominador es cero: $x - 5 = 0 \\Rightarrow x = 5$.",
            "has_math": True,
        }
    ],
}

# ── Fallback exercise ──────────────────────────────────────────────────────────
_FALLBACK: dict = {
    "question": "¿Cuál de estas expresiones representa una función lineal?",
    "options": ["f(x) = 5x − 2", "f(x) = x²", "f(x) = 3ˣ", "f(x) = log(x)"],
    "correct_index": 0,
    "feedback_correct": "¡Correcto! Una función lineal tiene la forma f(x) = mx + b.",
    "feedback_incorrect": "La opción correcta es f(x) = 5x − 2, que es una función lineal.",
}


def get_exercise(family_value: str, skill_value: str) -> dict:
    """Devuelve un ejercicio aleatorio para la combinación (familia, habilidad).
    Si la clave no existe, retorna el ejercicio de respaldo."""
    key = (family_value, skill_value)
    exercises = EXERCISES.get(key)
    if not exercises:
        return _FALLBACK.copy()
    return random.choice(exercises).copy()
