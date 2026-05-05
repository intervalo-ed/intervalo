"""
Agrega 23 ejercicios de crecimiento y decrecimiento al cinturon blanco.
- 3 CLSF texto por cada uno de los 7 temas
- 1 GRAF adicional para rational y trigonometric
"""

import json
import os
import glob

BASE = r'C:\Users\Administrator\intervalo\backend\content\analisis-1\exercises'


def load(filename):
    path = os.path.join(BASE, filename)
    with open(path, encoding='utf-8') as f:
        return json.load(f)


def save(filename, data):
    path = os.path.join(BASE, filename)
    with open(path, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    print(f"  OK {filename}: {len(data)} ejercicios totales")


def append_exercises(filename, new_exercises):
    data = load(filename)
    existing_ids = {ex['external_id'] for ex in data}
    for ex in new_exercises:
        eid = ex['external_id']
        assert eid not in existing_ids, f"ID duplicado: {eid}"
    data.extend(new_exercises)
    save(filename, data)


# ==============================================================================
# WHITE_LINEAR — 3 CLSF texto
# ==============================================================================
linear_new = [
    {
        "external_id": "white_linear_clsf_12",
        "belt": "white",
        "topic": "linear",
        "skill": "CLSF",
        "subtype": "text",
        "question": "¿En qué intervalo es creciente $f(x) = 3x - 7$?",
        "options": [
            "$(-\\infty,\\ 7/3)$",
            "$(7/3,\\ +\\infty)$",
            "$\\mathbb{R}$ (siempre creciente)",
            "$(0,\\ +\\infty)$"
        ],
        "correct_index": 2,
        "has_math": True,
        "feedback_correct": "¡Correcto! Como $a = 3 > 0$, la función $f(x) = 3x - 7$ es creciente en todo $\\mathbb{R}$.",
        "feedback_incorrect": "Para $f(x) = ax + b$, si $a > 0$ la función es creciente en todo $\\mathbb{R}$. Aquí $a = 3 > 0$, así que crece en $\\mathbb{R}$.",
        "graph_fn": None,
        "graph_view": None,
        "explanation": "Una función lineal $f(x) = ax + b$ es **creciente** cuando su coeficiente $a$ (la pendiente) es positivo.\n\nPara $f(x) = 3x - 7$: $a = 3 > 0$, así que la función siempre crece. Por cada unidad que aumenta $x$, $f(x)$ aumenta $3$ unidades.\n\nNo hay un intervalo parcial: la función es creciente en **todo** $\\mathbb{R}$.\n\nContraste: si $a < 0$, la función sería decreciente en todo $\\mathbb{R}$. Si $a = 0$, sería constante (ni creciente ni decreciente)."
    },
    {
        "external_id": "white_linear_clsf_13",
        "belt": "white",
        "topic": "linear",
        "skill": "CLSF",
        "subtype": "text",
        "question": "¿Cuál de estas afirmaciones describe correctamente el comportamiento de $f(x) = -2x + 5$?",
        "options": [
            "Decreciente en $\\mathbb{R}$",
            "Creciente en $\\mathbb{R}$",
            "Creciente en $(-\\infty,\\ 5)$ y decreciente en $(5,\\ +\\infty)$",
            "Constante en $\\mathbb{R}$"
        ],
        "correct_index": 0,
        "has_math": True,
        "feedback_correct": "¡Correcto! El coeficiente $a = -2 < 0$ indica que la función es decreciente en todo $\\mathbb{R}$.",
        "feedback_incorrect": "El comportamiento de una función lineal depende del signo de $a$. Como $a = -2 < 0$, la función es decreciente en todo $\\mathbb{R}$, no solo en un intervalo.",
        "graph_fn": None,
        "graph_view": None,
        "explanation": "Para la función lineal $f(x) = -2x + 5$, la pendiente es $a = -2$.\n\nComo $a < 0$, la función es **decreciente**: cuando $x$ aumenta, $f(x)$ disminuye. Por cada unidad que sube $x$, $f(x)$ baja $2$ unidades.\n\nEsta propiedad vale para todo $x \\in \\mathbb{R}$, sin excepción.\n\nEl valor $x = 5/2$ (donde $f(x) = 0$) es el cero de la función, no un punto de cambio de comportamiento."
    },
    {
        "external_id": "white_linear_clsf_14",
        "belt": "white",
        "topic": "linear",
        "skill": "CLSF",
        "subtype": "text",
        "question": "¿Para qué valores del coeficiente $a$ la función $f(x) = ax + b$ es decreciente en $\\mathbb{R}$?",
        "options": [
            "$a > 0$",
            "$a < 0$",
            "$a = 0$",
            "$a \\geq 0$"
        ],
        "correct_index": 1,
        "has_math": True,
        "feedback_correct": "¡Correcto! Si $a < 0$, cada aumento de $x$ produce una disminución de $f(x)$: la función es decreciente.",
        "feedback_incorrect": "La pendiente $a$ determina el comportamiento: si $a > 0$ la función crece, si $a < 0$ decrece, si $a = 0$ es constante.",
        "graph_fn": None,
        "graph_view": None,
        "explanation": "El signo de la **pendiente** $a$ determina si $f(x) = ax + b$ crece o decrece:\n\n- $a > 0$: la función es creciente en $\\mathbb{R}$.\n- $a < 0$: la función es decreciente en $\\mathbb{R}$.\n- $a = 0$: la función es constante (no crece ni decrece).\n\nCuando $a < 0$, cada vez que $x$ aumenta $1$ unidad, $f(x)$ disminuye $|a|$ unidades. La recta tiene inclinación negativa.\n\nEjemplo: $f(x) = -5x + 3$ es decreciente porque $a = -5 < 0$."
    }
]

# ==============================================================================
# WHITE_QUADRATIC — 3 CLSF texto
# ==============================================================================
quadratic_new = [
    {
        "external_id": "white_quadratic_clsf_12",
        "belt": "white",
        "topic": "quadratic",
        "skill": "CLSF",
        "subtype": "text",
        "question": "¿En qué intervalo es decreciente $f(x) = x^2 - 4x + 1$?",
        "options": [
            "$(0,\\ 4)$",
            "$(-\\infty,\\ 2]$",
            "$[2,\\ +\\infty)$",
            "$(4,\\ +\\infty)$"
        ],
        "correct_index": 1,
        "has_math": True,
        "feedback_correct": "¡Correcto! El vértice está en $x = 2$. Como la parábola abre hacia arriba ($a > 0$), decrece en $(-\\infty, 2]$.",
        "feedback_incorrect": "El vértice de $f(x) = x^2 - 4x + 1$ está en $x = -\\frac{-4}{2 \\cdot 1} = 2$. Como abre hacia arriba, la función decrece antes del vértice: en $(-\\infty, 2]$.",
        "graph_fn": None,
        "graph_view": None,
        "explanation": "Para $f(x) = x^2 - 4x + 1$ (parábola con $a = 1 > 0$, abre hacia arriba), el vértice se calcula como:\n\n$$x_v = -\\frac{b}{2a} = -\\frac{-4}{2 \\cdot 1} = 2$$\n\nEl vértice es el **punto mínimo**. La función:\n- **Decrece** en $(-\\infty, 2]$: la parábola baja hacia el vértice.\n- **Crece** en $[2, +\\infty)$: la parábola sube a partir del vértice.\n\nRegla general: si $a > 0$, la parábola decrece a la izquierda del vértice y crece a la derecha."
    },
    {
        "external_id": "white_quadratic_clsf_13",
        "belt": "white",
        "topic": "quadratic",
        "skill": "CLSF",
        "subtype": "text",
        "question": "¿En qué intervalo es creciente $f(x) = -x^2 + 6x$?",
        "options": [
            "$(-\\infty,\\ 0)$",
            "$(0,\\ 3)$",
            "$(3,\\ +\\infty)$",
            "$(-\\infty,\\ 3]$"
        ],
        "correct_index": 3,
        "has_math": True,
        "feedback_correct": "¡Correcto! El vértice está en $x = 3$. Como la parábola abre hacia abajo ($a < 0$), crece en $(-\\infty, 3]$.",
        "feedback_incorrect": "El vértice de $f(x) = -x^2 + 6x$ está en $x = 3$. Como $a = -1 < 0$ (abre hacia abajo), la función crece antes del vértice: en $(-\\infty, 3]$.",
        "graph_fn": None,
        "graph_view": None,
        "explanation": "Para $f(x) = -x^2 + 6x$ (parábola con $a = -1 < 0$, abre hacia abajo), el vértice es:\n\n$$x_v = -\\frac{b}{2a} = -\\frac{6}{2 \\cdot (-1)} = 3$$\n\nEl vértice es el **punto máximo**. La función:\n- **Crece** en $(-\\infty, 3]$: la parábola sube hacia el vértice.\n- **Decrece** en $[3, +\\infty)$: la parábola baja a partir del vértice.\n\nRegla general: si $a < 0$, la parábola crece a la izquierda del vértice y decrece a la derecha."
    },
    {
        "external_id": "white_quadratic_clsf_14",
        "belt": "white",
        "topic": "quadratic",
        "skill": "CLSF",
        "subtype": "text",
        "question": "Para $f(x) = (x - 1)^2 + 2$, ¿en qué intervalo es creciente?",
        "options": [
            "$[1,\\ +\\infty)$",
            "$(-\\infty,\\ 1]$",
            "$(-\\infty,\\ 2]$",
            "$[2,\\ +\\infty)$"
        ],
        "correct_index": 0,
        "has_math": True,
        "feedback_correct": "¡Correcto! En forma canónica $f(x) = (x-1)^2 + 2$, el vértice es $(1, 2)$. Como abre hacia arriba, crece en $[1, +\\infty)$.",
        "feedback_incorrect": "La función está en forma canónica $f(x) = (x-h)^2 + k$ con $h = 1, k = 2$. El vértice es $(1, 2)$. Como $a = 1 > 0$ (abre hacia arriba), crece para $x \\geq 1$.",
        "graph_fn": None,
        "graph_view": None,
        "explanation": "La función $f(x) = (x-1)^2 + 2$ está en **forma canónica** $f(x) = a(x-h)^2 + k$, con $a = 1 > 0$, $h = 1$, $k = 2$.\n\nEl vértice es el punto $(h, k) = (1, 2)$: el mínimo de la parábola.\n\nComo $a > 0$ (abre hacia arriba):\n- La función **decrece** en $(-\\infty, 1]$.\n- La función **crece** en $[1, +\\infty)$.\n\nLeer el intervalo de crecimiento directamente de la forma canónica: crece para $x \\geq h$."
    }
]

# ==============================================================================
# WHITE_POLYNOMIAL — 3 CLSF texto
# ==============================================================================
polynomial_new = [
    {
        "external_id": "white_polynomial_clsf_12",
        "belt": "white",
        "topic": "polynomial",
        "skill": "CLSF",
        "subtype": "text",
        "question": "¿Es $f(x) = x^3$ siempre creciente en $\\mathbb{R}$?",
        "options": [
            "Sí, es estrictamente creciente en todo $\\mathbb{R}$",
            "No; solo crece para $x > 0$",
            "No; decrece para $x < 0$",
            "Solo crece en $(-\\infty,\\ 0)$"
        ],
        "correct_index": 0,
        "has_math": True,
        "feedback_correct": "¡Correcto! $f(x) = x^3$ es estrictamente creciente en todo $\\mathbb{R}$: si $x_1 < x_2$ entonces $x_1^3 < x_2^3$.",
        "feedback_incorrect": "Aunque $f'(0) = 0$, la función $f(x) = x^3$ nunca decrece. Si $x_1 < x_2$, siempre se tiene $x_1^3 < x_2^3$. Es estrictamente creciente en $\\mathbb{R}$.",
        "graph_fn": None,
        "graph_view": None,
        "explanation": "La función $f(x) = x^3$ es **estrictamente creciente** en todo $\\mathbb{R}$.\n\nPodés verificarlo directamente: si $x_1 < x_2$, entonces $x_1^3 < x_2^3$ (elevar al cubo preserva el orden).\n\nAlgunos se confunden porque la curva es 'casi plana' cerca de $x = 0$ (el punto de inflexión), pero eso no implica decrecimiento: la función nunca retrocede.\n\nEsto contrasta con $f(x) = x^2$, que sí decrece en $(-\\infty, 0]$ y crece en $[0, +\\infty)$."
    },
    {
        "external_id": "white_polynomial_clsf_13",
        "belt": "white",
        "topic": "polynomial",
        "skill": "CLSF",
        "subtype": "text",
        "question": "¿Cuál de estas afirmaciones describe correctamente a $f(x) = -x^3$?",
        "options": [
            "Creciente en $\\mathbb{R}$",
            "Creciente en $(-\\infty,\\ 0)$ y decreciente en $(0,\\ +\\infty)$",
            "Decreciente en $\\mathbb{R}$",
            "Decreciente en $(-\\infty,\\ 0)$ y creciente en $(0,\\ +\\infty)$"
        ],
        "correct_index": 2,
        "has_math": True,
        "feedback_correct": "¡Correcto! $f(x) = -x^3$ es decreciente en todo $\\mathbb{R}$: multiplicar por $-1$ invierte el comportamiento de $x^3$.",
        "feedback_incorrect": "Como $f(x) = -x^3$, el signo negativo invierte el comportamiento de $x^3$ (que era creciente). El resultado es decreciente en todo $\\mathbb{R}$.",
        "graph_fn": None,
        "graph_view": None,
        "explanation": "Dado que $f(x) = x^3$ es estrictamente creciente en $\\mathbb{R}$, la función $f(x) = -x^3$ (multiplicada por $-1$) es **estrictamente decreciente** en $\\mathbb{R}$.\n\nLa lógica: si $x_1 < x_2$, entonces $x_1^3 < x_2^3$, y multiplicando por $-1$ se invierte la desigualdad: $-x_1^3 > -x_2^3$.\n\nEso significa que $f(x_1) > f(x_2)$, es decir, la función asigna valores menores a los $x$ más grandes: **decreciente**.\n\nEl punto $x = 0$ es un punto de inflexión, no un extremo."
    },
    {
        "external_id": "white_polynomial_clsf_14",
        "belt": "white",
        "topic": "polynomial",
        "skill": "CLSF",
        "subtype": "text",
        "question": "¿Puede un polinomio de grado par ser siempre creciente en $\\mathbb{R}$?",
        "options": [
            "Sí, siempre que el coeficiente principal sea positivo",
            "Sí, si el grado es 2",
            "Sí, cualquier polinomio de grado par puede serlo",
            "No; todo polinomio de grado par tiene al menos un extremo local"
        ],
        "correct_index": 3,
        "has_math": True,
        "feedback_correct": "¡Correcto! Todo polinomio de grado par $\\geq 2$ tiene al menos un extremo local (un máximo o mínimo), por lo que no puede ser siempre creciente.",
        "feedback_incorrect": "Un polinomio de grado par (como $x^2$, $x^4$, etc.) siempre tiene un extremo local: decrece en una parte de $\\mathbb{R}$ y crece en otra. No puede ser siempre creciente.",
        "graph_fn": None,
        "graph_view": None,
        "explanation": "Los polinomios de **grado par** tienen ambos extremos en la misma dirección: ambos van a $+\\infty$ o ambos a $-\\infty$ según el signo del coeficiente principal.\n\nEsto implica que la función debe 'cambiar de dirección' al menos una vez: tiene al menos un **extremo local** (mínimo o máximo).\n\nPor ejemplo, $f(x) = x^2$ decrece en $(-\\infty, 0]$ y crece en $[0, +\\infty)$. Ningún polinomio de grado par puede ser monótono en todo $\\mathbb{R}$.\n\nEn contraste, polinomios de grado impar como $x^3$ o $x^5$ sí pueden ser siempre crecientes o siempre decrecientes."
    }
]

# ==============================================================================
# WHITE_EXPONENTIAL — 3 CLSF texto
# ==============================================================================
exponential_new = [
    {
        "external_id": "white_exponential_clsf_12",
        "belt": "white",
        "topic": "exponential",
        "skill": "CLSF",
        "subtype": "text",
        "question": "¿Para qué valores de la base $a$ es $f(x) = a^x$ una función decreciente?",
        "options": [
            "Para $a > 1$",
            "Para $a = 1$",
            "Para $a > 0$",
            "Para $0 < a < 1$"
        ],
        "correct_index": 3,
        "has_math": True,
        "feedback_correct": "¡Correcto! Cuando la base $0 < a < 1$, la función exponencial es decreciente: a medida que $x$ crece, $a^x$ se acerca a cero.",
        "feedback_incorrect": "La exponencial $a^x$ crece cuando $a > 1$ y decrece cuando $0 < a < 1$. Si $a = 1$, la función es constante ($f(x) = 1$).",
        "graph_fn": None,
        "graph_view": None,
        "explanation": "El comportamiento de $f(x) = a^x$ depende completamente de la **base** $a$:\n\n- $a > 1$: la función es **creciente**. Ejemplo: $2^x$ crece a medida que $x$ aumenta.\n- $0 < a < 1$: la función es **decreciente**. Ejemplo: $(1/2)^x$ decrece porque cada multiplicación por $a$ reduce el valor.\n- $a = 1$: la función es **constante** ($1^x = 1$ para todo $x$).\n\nFísicamente: base mayor que 1 modela crecimiento; base menor que 1 modela decaimiento (ej: desintegración radiactiva)."
    },
    {
        "external_id": "white_exponential_clsf_13",
        "belt": "white",
        "topic": "exponential",
        "skill": "CLSF",
        "subtype": "text",
        "question": "¿En qué intervalo es creciente $f(x) = 2^x$?",
        "options": [
            "$(0,\\ +\\infty)$",
            "$\\mathbb{R}$ (siempre creciente)",
            "$(-\\infty,\\ 0)$",
            "Solo para $x > 1$"
        ],
        "correct_index": 1,
        "has_math": True,
        "feedback_correct": "¡Correcto! $f(x) = 2^x$ es creciente en todo $\\mathbb{R}$: cuanto mayor sea $x$, mayor es $2^x$.",
        "feedback_incorrect": "$2^x$ crece para todo $x$ real, no solo para $x > 0$. Por ejemplo, $2^{-3} = 1/8 < 2^{-1} = 1/2 < 2^0 = 1 < 2^2 = 4$: siempre crece.",
        "graph_fn": None,
        "graph_view": None,
        "explanation": "La función $f(x) = 2^x$ tiene base $a = 2 > 1$, así que es **estrictamente creciente en todo $\\mathbb{R}$**.\n\nAlgunos creen que solo crece para $x > 0$, pero eso confunde el dominio con el comportamiento. La función está definida y es creciente para todos los reales:\n\n$$2^{-2} = 0.25 < 2^{-1} = 0.5 < 2^0 = 1 < 2^1 = 2 < 2^2 = 4$$\n\nSiempre que $x$ aumenta, $2^x$ también aumenta. El intervalo de crecimiento es $\\mathbb{R}$."
    },
    {
        "external_id": "white_exponential_clsf_14",
        "belt": "white",
        "topic": "exponential",
        "skill": "CLSF",
        "subtype": "text",
        "question": "¿Cuál de estas funciones exponenciales es decreciente?",
        "options": [
            "$(1/3)^x$",
            "$3^x$",
            "$e^x$",
            "Ninguna es decreciente"
        ],
        "correct_index": 0,
        "has_math": True,
        "feedback_correct": "¡Correcto! $(1/3)^x$ tiene base $1/3 < 1$, así que es decreciente.",
        "feedback_incorrect": "$(1/3)^x$ tiene base $a = 1/3$, con $0 < 1/3 < 1$. Una base menor que $1$ hace que la exponencial sea decreciente.",
        "graph_fn": None,
        "graph_view": None,
        "explanation": "Para identificar si $a^x$ es creciente o decreciente, fijate en la base:\n\n- $(1/3)^x$: base $a = 1/3$, con $0 < 1/3 < 1$ → **decreciente**.\n- $3^x$: base $a = 3 > 1$ → creciente.\n- $e^x$: base $a = e \\approx 2.718 > 1$ → creciente.\n\nNota: $(1/3)^x = 3^{-x}$. Podés reescribir cualquier exponencial decreciente como una creciente con exponente negativo.\n\nMnemotecnia: base mayor que 1 → crece; base entre 0 y 1 → decrece."
    }
]

# ==============================================================================
# WHITE_LOGARITHMIC — 3 CLSF texto
# ==============================================================================
logarithmic_new = [
    {
        "external_id": "white_logarithmic_clsf_12",
        "belt": "white",
        "topic": "logarithmic",
        "skill": "CLSF",
        "subtype": "text",
        "question": "¿Es $f(x) = \\ln(x)$ siempre creciente en su dominio $(0, +\\infty)$?",
        "options": [
            "Sí, es estrictamente creciente en $(0, +\\infty)$",
            "No; tiene un máximo en $x = 1$ donde $\\ln(1) = 0$",
            "No; decrece para $x > e$",
            "Solo crece para $x > 1$"
        ],
        "correct_index": 0,
        "has_math": True,
        "feedback_correct": "¡Correcto! $\\ln(x)$ es estrictamente creciente en todo su dominio $(0, +\\infty)$: si $x_1 < x_2$ entonces $\\ln(x_1) < \\ln(x_2)$.",
        "feedback_incorrect": "El hecho de que $\\ln(1) = 0$ no significa que ahí haya un máximo. $\\ln(x)$ sigue creciendo después de $x=1$ (aunque más lento). Es estrictamente creciente en $(0, +\\infty)$.",
        "graph_fn": None,
        "graph_view": None,
        "explanation": "La función $f(x) = \\ln(x)$ es **estrictamente creciente** en todo su dominio $(0, +\\infty)$.\n\nAlgunos se confunden porque $\\ln(1) = 0$: piensan que ahí hay un máximo, pero no. El logaritmo sigue creciendo:\n\n$$\\ln(1) = 0 < \\ln(e) = 1 < \\ln(e^2) = 2 < \\ln(e^3) = 3 \\ldots$$\n\nSolo se aplana (crece más lentamente) pero nunca deja de crecer ni retrocede.\n\nEsto es coherente con que $\\ln$ y $e^x$ son funciones inversas: una es el espejo de la otra, y $e^x$ es creciente."
    },
    {
        "external_id": "white_logarithmic_clsf_13",
        "belt": "white",
        "topic": "logarithmic",
        "skill": "CLSF",
        "subtype": "text",
        "question": "¿Para qué valores de la base $b$ es $f(x) = \\log_b(x)$ una función decreciente?",
        "options": [
            "Para $b > 1$",
            "Para $b = e$",
            "Para $0 < b < 1$",
            "Para $b = 1$"
        ],
        "correct_index": 2,
        "has_math": True,
        "feedback_correct": "¡Correcto! Cuando $0 < b < 1$, $\\log_b(x)$ es decreciente: valores mayores de $x$ producen logaritmos menores.",
        "feedback_incorrect": "El logaritmo $\\log_b(x)$ crece cuando $b > 1$ (como $\\log_2$, $\\ln$) y decrece cuando $0 < b < 1$ (como $\\log_{0.5}$).",
        "graph_fn": None,
        "graph_view": None,
        "explanation": "El comportamiento de $f(x) = \\log_b(x)$ depende de la **base** $b$, igual que en las exponenciales:\n\n- $b > 1$: logaritmo **creciente**. Ejemplo: $\\log_2(1) = 0 < \\log_2(4) = 2$.\n- $0 < b < 1$: logaritmo **decreciente**. Ejemplo: $\\log_{0.5}(1) = 0 > \\log_{0.5}(2) = -1$.\n- $b = 1$: no está definido como logaritmo.\n\nEsta regla es el espejo exacto de la regla para las exponenciales: $\\log_b$ y $b^x$ son inversas, y comparten el mismo tipo de comportamiento (creciente o decreciente)."
    },
    {
        "external_id": "white_logarithmic_clsf_14",
        "belt": "white",
        "topic": "logarithmic",
        "skill": "CLSF",
        "subtype": "text",
        "question": "¿Cuál de estas funciones logarítmicas es decreciente?",
        "options": [
            "$\\log_2(x)$",
            "$\\log_{0.5}(x)$",
            "$\\ln(x)$",
            "Ninguna es decreciente"
        ],
        "correct_index": 1,
        "has_math": True,
        "feedback_correct": "¡Correcto! $\\log_{0.5}(x)$ tiene base $0.5 < 1$, así que es decreciente.",
        "feedback_incorrect": "$\\log_{0.5}(x)$ tiene base $b = 0.5$, con $0 < 0.5 < 1$. Un base logarítmica menor que $1$ hace que la función sea decreciente.",
        "graph_fn": None,
        "graph_view": None,
        "explanation": "Para identificar si $\\log_b(x)$ es creciente o decreciente, revisá la base:\n\n- $\\log_2(x)$: base $b = 2 > 1$ → **creciente**.\n- $\\log_{0.5}(x)$: base $b = 0.5$, con $0 < 0.5 < 1$ → **decreciente**.\n- $\\ln(x)$: base $b = e \\approx 2.718 > 1$ → creciente.\n\nNota útil: $\\log_{0.5}(x) = -\\log_2(x)$. Podés reescribir logaritmos decrecientes como el opuesto de uno creciente.\n\nEsto es coherente con las exponenciales: $0.5^x$ es decreciente, y $\\log_{0.5}$ (su inversa) también lo es."
    }
]

# ==============================================================================
# WHITE_RATIONAL — 3 CLSF texto + 1 GRAF
# ==============================================================================
rational_new = [
    {
        "external_id": "white_rational_clsf_12",
        "belt": "white",
        "topic": "rational",
        "skill": "CLSF",
        "subtype": "text",
        "question": "¿En qué intervalos es decreciente $f(x) = \\dfrac{1}{x}$?",
        "options": [
            "Solo en $(-\\infty,\\ 0)$",
            "En $(-\\infty,\\ 0)$ y en $(0,\\ +\\infty)$ — en cada tramo por separado",
            "Solo en $(0,\\ +\\infty)$",
            "En ningún intervalo; la función no es monótona"
        ],
        "correct_index": 1,
        "has_math": True,
        "feedback_correct": "¡Correcto! $f(x)=1/x$ es decreciente tanto en $(-\\infty,0)$ como en $(0,+\\infty)$, en cada tramo por separado.",
        "feedback_incorrect": "$f(x) = 1/x$ es decreciente en $(-\\infty, 0)$ y también en $(0, +\\infty)$. Pero ojo: esto no significa que sea decreciente en $\\mathbb{R} \\setminus \\{0\\}$ completo, ya que $f(-1) = -1 < f(1) = 1$.",
        "graph_fn": None,
        "graph_view": None,
        "explanation": "Para $f(x) = 1/x$, en cualquier intervalo que no cruce el cero, la función es **decreciente**:\n\n- En $(-\\infty, 0)$: si tomás $x_1 < x_2 < 0$, se cumple $1/x_1 > 1/x_2$ (decrece).\n- En $(0, +\\infty)$: si tomás $0 < x_1 < x_2$, se cumple $1/x_1 > 1/x_2$ (decrece).\n\nImportante: esto **no** significa que $f$ sea decreciente en todo su dominio $\\mathbb{R} \\setminus \\{0\\}$. Comparar $f(-1) = -1$ con $f(1) = 1$ muestra que entre los dos tramos el valor sube."
    },
    {
        "external_id": "white_rational_clsf_13",
        "belt": "white",
        "topic": "rational",
        "skill": "CLSF",
        "subtype": "text",
        "question": "¿En cuál de los siguientes intervalos es decreciente $f(x) = \\dfrac{x + 1}{x - 1}$?",
        "options": [
            "Solo en $(1,\\ +\\infty)$",
            "Solo en $(-\\infty,\\ 1)$",
            "En $(-\\infty,\\ 1)$ y en $(1,\\ +\\infty)$ — en cada tramo",
            "En ninguno; la función no es monótona"
        ],
        "correct_index": 2,
        "has_math": True,
        "feedback_correct": "¡Correcto! $f(x) = (x+1)/(x-1)$ es decreciente en $(-\\infty, 1)$ y también en $(1, +\\infty)$.",
        "feedback_incorrect": "Podés reescribir $f(x) = 1 + \\frac{2}{x-1}$. El término $2/(x-1)$ se comporta como $1/x$ trasladado: decrece en cada tramo del dominio.",
        "graph_fn": None,
        "graph_view": None,
        "explanation": "Reescribiendo la función:\n\n$$f(x) = \\frac{x+1}{x-1} = \\frac{(x-1)+2}{x-1} = 1 + \\frac{2}{x-1}$$\n\nEl término $\\frac{2}{x-1}$ es proporcional a $\\frac{1}{x-1}$, que es decreciente en cada tramo de su dominio.\n\nPor eso $f$ es **decreciente en $(-\\infty, 1)$** y **decreciente en $(1, +\\infty)$**.\n\nLa asíntota vertical en $x = 1$ divide el dominio en dos tramos, y en cada uno la función decrece."
    },
    {
        "external_id": "white_rational_clsf_14",
        "belt": "white",
        "topic": "rational",
        "skill": "CLSF",
        "subtype": "text",
        "question": "¿En qué intervalo crece $f(x) = \\dfrac{1}{x - 2}$ para $x > 2$?",
        "options": [
            "En ninguno; es decreciente en $(2,\\ +\\infty)$",
            "En $(2,\\ 3)$",
            "En $(2,\\ +\\infty)$",
            "Solo para $x > 3$"
        ],
        "correct_index": 0,
        "has_math": True,
        "feedback_correct": "¡Correcto! $f(x) = 1/(x-2)$ es decreciente en $(2, +\\infty)$: a medida que $x$ aumenta, el denominador crece y la fracción disminuye.",
        "feedback_incorrect": "Para $x > 2$, el denominador $x - 2 > 0$ crece a medida que $x$ crece. Como el numerador es constante ($1$), la fracción $1/(x-2)$ decrece. No hay ningún intervalo donde crezca.",
        "graph_fn": None,
        "graph_view": None,
        "explanation": "Para $x > 2$, el denominador $x - 2$ es positivo y crece a medida que $x$ aumenta.\n\nComo el numerador es constante ($1$), la fracción:\n\n$$f(x) = \\frac{1}{x-2}$$\n\ndisminuye cuando $x$ aumenta: si el denominador crece, la fracción se hace más pequeña.\n\nPor ejemplo: $f(3) = 1$, $f(4) = 1/2$, $f(6) = 1/4$. La función es **decreciente en $(2, +\\infty)$**.\n\nEsta lógica aplica a cualquier $\\frac{c}{x-a}$ con $c > 0$ y $x > a$: siempre decreciente."
    },
    {
        "external_id": "white_rational_graf_11",
        "belt": "white",
        "topic": "rational",
        "skill": "GRAF",
        "subtype": "graph",
        "question": "Observá la gráfica de $f(x) = \\dfrac{1}{x}$. ¿En cuál de los siguientes intervalos la función es decreciente?",
        "options": [
            "Solo en $(-\\infty,\\ 0)$",
            "Solo en $(0,\\ +\\infty)$",
            "En ningún intervalo",
            "En $(-\\infty,\\ 0)$ y en $(0,\\ +\\infty)$ — en cada rama por separado"
        ],
        "correct_index": 3,
        "has_math": True,
        "feedback_correct": "¡Correcto! En la gráfica se ve claramente que ambas ramas bajan de izquierda a derecha: la función decrece en cada tramo de su dominio.",
        "feedback_incorrect": "Mirá cada rama de la hipérbola por separado: en $(-\\infty,0)$ la curva baja al avanzar hacia la derecha, y lo mismo en $(0,+\\infty)$. La función decrece en ambos tramos.",
        "graph_fn": "1/x",
        "graph_view": {"xMin": -4, "xMax": 4, "yMin": -4, "yMax": 4},
        "explanation": "La gráfica de $f(x) = 1/x$ tiene dos ramas separadas por la asíntota vertical $x = 0$.\n\nEn **cada rama**, la curva desciende de izquierda a derecha:\n- Rama izquierda $(-\\infty, 0)$: la función va de valores cercanos a $0^-$ hacia $-\\infty$.\n- Rama derecha $(0, +\\infty)$: la función va de $+\\infty$ hacia valores cercanos a $0^+$.\n\nEn ambos casos la tendencia es **decreciente**.\n\nNota visual: no confundas 'la curva sube entre las dos ramas' con comportamiento creciente; eso es una discontinuidad, no crecimiento."
    }
]

# ==============================================================================
# WHITE_TRIGONOMETRIC — 3 CLSF texto + 1 GRAF
# ==============================================================================
trigonometric_new = [
    {
        "external_id": "white_trigonometric_clsf_12",
        "belt": "white",
        "topic": "trigonometric",
        "skill": "CLSF",
        "subtype": "text",
        "question": "¿En qué subintervalo de $[0,\\ 2\\pi]$ es decreciente $f(x) = \\sin(x)$?",
        "options": [
            "$[0,\\ \\pi/2]$",
            "$[\\pi/2,\\ \\pi]$",
            "$[0,\\ \\pi]$",
            "$[\\pi/2,\\ 3\\pi/2]$"
        ],
        "correct_index": 3,
        "has_math": True,
        "feedback_correct": "¡Correcto! $\\sin(x)$ alcanza su máximo en $\\pi/2$ y su mínimo en $3\\pi/2$. Decrece en $[\\pi/2, 3\\pi/2]$.",
        "feedback_incorrect": "$\\sin(\\pi/2) = 1$ es el máximo y $\\sin(3\\pi/2) = -1$ es el mínimo en $[0, 2\\pi]$. La función desciende de uno al otro: decrece en $[\\pi/2, 3\\pi/2]$.",
        "graph_fn": None,
        "graph_view": None,
        "explanation": "En el intervalo $[0, 2\\pi]$, $f(x) = \\sin(x)$ tiene la siguiente evolución:\n\n- Crece de $0$ a $1$ en $[0, \\pi/2]$ (sube al máximo).\n- **Decrece** de $1$ a $-1$ en $[\\pi/2, 3\\pi/2]$ (baja del máximo al mínimo).\n- Crece de $-1$ a $0$ en $[3\\pi/2, 2\\pi]$ (sube de vuelta).\n\nEl intervalo de decrecimiento es $[\\pi/2, 3\\pi/2]$.\n\nEn cada período de $2\\pi$, el seno tiene un único intervalo de crecimiento y uno de decrecimiento, cada uno de longitud $\\pi$."
    },
    {
        "external_id": "white_trigonometric_clsf_13",
        "belt": "white",
        "topic": "trigonometric",
        "skill": "CLSF",
        "subtype": "text",
        "question": "¿En qué subintervalo de $[0,\\ 2\\pi]$ es creciente $f(x) = \\cos(x)$?",
        "options": [
            "$[\\pi,\\ 2\\pi]$",
            "$[0,\\ \\pi]$",
            "$[0,\\ \\pi/2]$",
            "$[3\\pi/2,\\ 2\\pi]$"
        ],
        "correct_index": 0,
        "has_math": True,
        "feedback_correct": "¡Correcto! $\\cos(x)$ tiene su mínimo en $\\pi$ ($\\cos(\\pi)=-1$) y sube hasta $\\cos(2\\pi)=1$. Crece en $[\\pi, 2\\pi]$.",
        "feedback_incorrect": "$\\cos(\\pi) = -1$ es el mínimo y $\\cos(2\\pi) = 1$ es el valor final. La función asciende de $\\pi$ a $2\\pi$: crece en $[\\pi, 2\\pi]$.",
        "graph_fn": None,
        "graph_view": None,
        "explanation": "En el intervalo $[0, 2\\pi]$, $f(x) = \\cos(x)$ evoluciona así:\n\n- **Decrece** de $1$ a $-1$ en $[0, \\pi]$ (baja del máximo al mínimo).\n- **Crece** de $-1$ a $1$ en $[\\pi, 2\\pi]$ (sube del mínimo al máximo).\n\nEl intervalo de crecimiento es $[\\pi, 2\\pi]$.\n\nComparación con $\\sin$: el coseno va 'medio período adelantado' respecto al seno. $\\cos(x) = \\sin(x + \\pi/2)$, lo que desplaza todos los intervalos de crecimiento/decrecimiento $\\pi/2$ unidades."
    },
    {
        "external_id": "white_trigonometric_clsf_14",
        "belt": "white",
        "topic": "trigonometric",
        "skill": "CLSF",
        "subtype": "text",
        "question": "¿Cuántas veces cambia $f(x) = \\sin(x)$ de creciente a decreciente en el intervalo $[0,\\ 4\\pi]$?",
        "options": [
            "1 vez",
            "3 veces",
            "2 veces",
            "4 veces"
        ],
        "correct_index": 2,
        "has_math": True,
        "feedback_correct": "¡Correcto! En $[0, 4\\pi]$ hay dos períodos completos. El seno cambia de creciente a decreciente una vez por período: en $x = \\pi/2$ y en $x = 5\\pi/2$. Total: 2 veces.",
        "feedback_incorrect": "En cada período $[0,2\\pi]$ el seno cambia de creciente a decreciente exactamente una vez (en $x=\\pi/2$). Como $[0,4\\pi]$ tiene dos períodos, el cambio ocurre 2 veces: en $x=\\pi/2$ y en $x=5\\pi/2$.",
        "graph_fn": None,
        "graph_view": None,
        "explanation": "El seno tiene **período $2\\pi$**: cada $2\\pi$ unidades repite su comportamiento.\n\nEn cada período, $\\sin(x)$ cambia de creciente a decreciente exactamente **una vez** (en el máximo $x = \\pi/2 + 2k\\pi$).\n\nEn $[0, 4\\pi]$ caben exactamente **dos períodos completos**: $[0, 2\\pi]$ y $[2\\pi, 4\\pi]$.\n\nEn el primero, el cambio ocurre en $x = \\pi/2$.\nEn el segundo, en $x = \\pi/2 + 2\\pi = 5\\pi/2$.\n\nTotal: **2 veces**."
    },
    {
        "external_id": "white_trigonometric_graf_11",
        "belt": "white",
        "topic": "trigonometric",
        "skill": "GRAF",
        "subtype": "graph",
        "question": "Observá la gráfica de $f(x) = \\sin(x)$. ¿En cuál de los siguientes intervalos la función es creciente?",
        "options": [
            "$[-\\pi,\\ 0]$",
            "$[-\\pi/2,\\ \\pi/2]$",
            "$[\\pi/2,\\ 3\\pi/2]$",
            "$[\\pi,\\ 2\\pi]$"
        ],
        "correct_index": 1,
        "has_math": True,
        "feedback_correct": "¡Correcto! En la gráfica se ve que la curva sube desde $-\\pi/2$ hasta $\\pi/2$, pasando por el máximo $\\sin(\\pi/2)=1$.",
        "feedback_incorrect": "Buscá el tramo donde la curva sube de izquierda a derecha. El seno sube desde su mínimo ($x=-\\pi/2$) hasta su máximo ($x=\\pi/2$). Ese tramo es $[-\\pi/2, \\pi/2]$.",
        "graph_fn": "sin(x)",
        "graph_view": {"xMin": -6.5, "xMax": 6.5, "yMin": -2, "yMax": 2},
        "explanation": "En la gráfica de $f(x) = \\sin(x)$, un tramo **creciente** es aquel donde la curva sube de izquierda a derecha.\n\nLos tramos crecientes de $\\sin$ son $[-\\pi/2 + 2k\\pi,\\ \\pi/2 + 2k\\pi]$ para $k \\in \\mathbb{Z}$.\n\nDe las opciones:\n- $[-\\pi/2, \\pi/2]$: la curva sube desde $-1$ hasta $1$ pasando por el cero. **Creciente**.\n- $[-\\pi, 0]$: la curva baja de $0$ a $-1$ y luego sube de $-1$ a $0$. No es monótona en ese intervalo.\n- $[\\pi/2, 3\\pi/2]$: la curva baja desde $1$ hasta $-1$. **Decreciente**.\n- $[\\pi, 2\\pi]$: la curva baja y luego sube. No es monótona."
    }
]

# ==============================================================================
# Aplicar todo
# ==============================================================================
print("Agregando ejercicios de crecimiento y decrecimiento al cinturon blanco...\n")

append_exercises('white_linear.json', linear_new)
append_exercises('white_quadratic.json', quadratic_new)
append_exercises('white_polynomial.json', polynomial_new)
append_exercises('white_exponential.json', exponential_new)
append_exercises('white_logarithmic.json', logarithmic_new)
append_exercises('white_rational.json', rational_new)
append_exercises('white_trigonometric.json', trigonometric_new)

print("\nVerificando JSON valido y contando nuevos ejercicios...")
for fname in sorted(glob.glob(os.path.join(BASE, 'white_*.json'))):
    with open(fname, encoding='utf-8') as f:
        data = json.load(f)
    nuevos = [e for e in data if e['external_id'].endswith(('_12', '_13', '_14'))
              or (e['skill'] == 'GRAF' and e['external_id'].endswith('_11')
                  and e['topic'] in ('rational', 'trigonometric'))]
    name = os.path.basename(fname)
    print(f"  {name}: {len(data)} total, {len(nuevos)} nuevos crecimiento")

print("\nListo!")
