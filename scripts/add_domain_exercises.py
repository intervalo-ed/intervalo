"""
Agrega 20 ejercicios de dominio, codominio e imagen al cinturón blanco.
3 ejercicios por tema (linear, quadratic, exponential, logarithmic, rational, trigonometric)
2 ejercicios para polynomial.
"""

import json
import os

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
# WHITE_LINEAR — 3 ejercicios nuevos
# ==============================================================================
linear_new = [
    {
        "external_id": "white_linear_lexi_11",
        "belt": "white",
        "topic": "linear",
        "skill": "LEXI",
        "subtype": "text",
        "question": "¿Cuál es el dominio natural de cualquier función lineal $f(x) = ax + b$ (con $a, b \\in \\mathbb{R}$)?",
        "options": [
            "$(0, +\\infty)$",
            "$[-a, +\\infty)$",
            "$\\mathbb{R}$ (todos los reales)",
            "$\\mathbb{R} \\setminus \\{0\\}$"
        ],
        "correct_index": 2,
        "has_math": True,
        "feedback_correct": "¡Correcto! Las funciones lineales están definidas para todo $x \\in \\mathbb{R}$, ya que solo involucran suma y multiplicación.",
        "feedback_incorrect": "El dominio natural es el conjunto más grande de reales donde la función está definida. Como $f(x) = ax + b$ solo usa multiplicación y suma (operaciones siempre válidas), el dominio es $\\mathbb{R}$.",
        "graph_fn": None,
        "graph_view": None,
        "explanation": "El **dominio natural** de una función es el conjunto más grande de valores reales para los que la función está definida.\n\nPara $f(x) = ax + b$, las únicas operaciones son multiplicar $x$ por $a$ y sumar $b$. Esas operaciones siempre tienen resultado, sin importar el valor de $x$.\n\nPor eso el dominio de toda función lineal es $\\mathbb{R}$, es decir, todos los números reales.\n\nEjemplo concreto: $f(x) = 3x - 7$ tiene dominio $\\mathbb{R}$, y la función constante $f(x) = 5$ también, aunque su **imagen** sea solo $\\{5\\}$."
    },
    {
        "external_id": "white_linear_clsf_11",
        "belt": "white",
        "topic": "linear",
        "skill": "CLSF",
        "subtype": "text",
        "question": "¿Cuál es la imagen de la función constante $f(x) = 5$?",
        "options": [
            "$\\{5\\}$",
            "$\\mathbb{R}$",
            "$[0, 5]$",
            "$(0, +\\infty)$"
        ],
        "correct_index": 0,
        "has_math": True,
        "feedback_correct": "¡Correcto! La función siempre devuelve $5$, sin importar el valor de $x$. La imagen es el conjunto unitario $\\{5\\}$.",
        "feedback_incorrect": "La imagen de una función es el conjunto de valores que realmente toma. Como $f(x) = 5$ para todo $x$, el único valor producido es $5$. La imagen es $\\{5\\}$, no $\\mathbb{R}$.",
        "graph_fn": None,
        "graph_view": None,
        "explanation": "La **imagen** (o recorrido) de una función es el conjunto de todos los valores que efectivamente toma $f(x)$.\n\nEn $f(x) = 5$, sin importar qué $x$ uses, la función siempre devuelve $5$. Por eso la imagen es el conjunto unitario $\\{5\\}$.\n\nEsto contrasta con el **dominio**, que sigue siendo $\\mathbb{R}$: la función acepta cualquier $x$ como entrada, pero siempre produce la misma salida.\n\nEl **codominio** podría declararse como $\\mathbb{R}$, pero la imagen (los valores realmente alcanzados) es solo $\\{5\\}$. Esta distinción entre codominio e imagen es fundamental en teoría de funciones."
    },
    {
        "external_id": "white_linear_form_11",
        "belt": "white",
        "topic": "linear",
        "skill": "FORM",
        "subtype": "text",
        "question": "Si restringís el dominio de $f(x) = 2x$ al intervalo $[1, 4]$, ¿cuál es la imagen resultante?",
        "options": [
            "$[1, 4]$",
            "$[2, 8]$",
            "$[0, 8]$",
            "$(2, 8)$"
        ],
        "correct_index": 1,
        "has_math": True,
        "feedback_correct": "¡Correcto! $f(1) = 2$ y $f(4) = 8$. Como $f$ es creciente y continua, la imagen de $[1, 4]$ es $[2, 8]$.",
        "feedback_incorrect": "Calculá los extremos: $f(1) = 2 \\cdot 1 = 2$ y $f(4) = 2 \\cdot 4 = 8$. Como $f$ es continua y creciente, la imagen del intervalo $[1, 4]$ es $[2, 8]$, no $[1, 4]$.",
        "graph_fn": None,
        "graph_view": None,
        "explanation": "Para encontrar la imagen de una función lineal sobre un **dominio restringido**, evaluá los extremos del intervalo, ya que $f$ es continua y monótona.\n\n$$f(1) = 2 \\cdot 1 = 2, \\qquad f(4) = 2 \\cdot 4 = 8$$\n\nComo $f(x) = 2x$ es creciente ($a = 2 > 0$), la imagen del intervalo $[1, 4]$ es $[2, 8]$.\n\nSi la función fuera decreciente (coeficiente $a < 0$), los extremos se invertirían: el menor valor del dominio produciría el mayor valor de la imagen."
    }
]

# ==============================================================================
# WHITE_QUADRATIC — 3 ejercicios nuevos
# ==============================================================================
quadratic_new = [
    {
        "external_id": "white_quadratic_lexi_11",
        "belt": "white",
        "topic": "quadratic",
        "skill": "LEXI",
        "subtype": "text",
        "question": "¿Por qué la imagen de $f(x) = x^2$ no incluye números negativos?",
        "options": [
            "Porque $f$ solo está definida para $x \\geq 0$",
            "Porque el dominio de $f$ es $[0, +\\infty)$",
            "Porque $x^2$ crece más rápido que $x$",
            "Porque elevar al cuadrado cualquier número real siempre da un resultado mayor o igual a cero"
        ],
        "correct_index": 3,
        "has_math": True,
        "feedback_correct": "¡Correcto! Para todo $x \\in \\mathbb{R}$, se cumple $x^2 \\geq 0$. Por eso la imagen de $f(x) = x^2$ es $[0, +\\infty)$.",
        "feedback_incorrect": "El dominio de $f(x) = x^2$ sí es $\\mathbb{R}$ (acepta cualquier $x$). Lo que se restringe es la imagen: como $x^2 \\geq 0$ para todo real, la imagen es $[0, +\\infty)$.",
        "graph_fn": None,
        "graph_view": None,
        "explanation": "Cuando calculás $x^2$, el resultado siempre es no negativo, sin importar el signo de $x$:\n\n$$(-3)^2 = 9 \\geq 0, \\quad 0^2 = 0, \\quad 5^2 = 25 \\geq 0$$\n\nEl dominio de $f(x) = x^2$ es $\\mathbb{R}$ (acepta cualquier $x$), pero la **imagen** es $[0, +\\infty)$: el valor $x^2 = 0$ se alcanza solo en $x = 0$, y para todo $x \\neq 0$ se tiene $x^2 > 0$.\n\nEsto ilustra una distinción clave: el dominio dice qué valores de $x$ acepta $f$; la imagen dice qué valores efectivamente produce."
    },
    {
        "external_id": "white_quadratic_clsf_11",
        "belt": "white",
        "topic": "quadratic",
        "skill": "CLSF",
        "subtype": "text",
        "question": "¿Cuál es la imagen de $f(x) = -(x - 2)^2 + 3$?",
        "options": [
            "$[3, +\\infty)$",
            "$(-\\infty, 3]$",
            "$\\mathbb{R}$",
            "$\\{3\\}$"
        ],
        "correct_index": 1,
        "has_math": True,
        "feedback_correct": "¡Correcto! La parábola abre hacia abajo con vértice en $(2, 3)$. El valor máximo es $3$, por lo que la imagen es $(-\\infty, 3]$.",
        "feedback_incorrect": "La función $-(x-2)^2 + 3$ abre hacia abajo: el término $-(x-2)^2 \\leq 0$, así que $f(x) \\leq 3$. El máximo es $f(2) = 3$. La imagen es $(-\\infty, 3]$.",
        "graph_fn": None,
        "graph_view": None,
        "explanation": "La función $f(x) = -(x-2)^2 + 3$ es una parábola en **forma canónica** con vértice en $(2, 3)$ y coeficiente negativo (abre hacia abajo).\n\nComo $(x-2)^2 \\geq 0$ para todo $x$, se tiene:\n\n$$f(x) = \\underbrace{-(x-2)^2}_{\\leq\\, 0} + 3 \\leq 3$$\n\nEl valor máximo $f(2) = 3$ se alcanza en el vértice. Además, como la parábola baja sin límite, la imagen es $(-\\infty, 3]$.\n\nRegla general: si la parábola abre hacia abajo con vértice $(h, k)$, la imagen es $(-\\infty, k]$. Si abre hacia arriba, la imagen es $[k, +\\infty)$."
    },
    {
        "external_id": "white_quadratic_form_11",
        "belt": "white",
        "topic": "quadratic",
        "skill": "FORM",
        "subtype": "text",
        "question": "¿Cuál es el dominio de $f(x) = x^2 - 4$?",
        "options": [
            "$\\mathbb{R}$",
            "$[-2, 2]$",
            "$[0, +\\infty)$",
            "$\\mathbb{R} \\setminus \\{-2, 2\\}$"
        ],
        "correct_index": 0,
        "has_math": True,
        "feedback_correct": "¡Correcto! $f(x) = x^2 - 4$ es un polinomio. Todo polinomio tiene dominio $\\mathbb{R}$.",
        "feedback_incorrect": "El dominio pregunta: ¿para qué $x$ puede calcularse $f(x)$? Como $f(x) = x^2 - 4$ es un polinomio, no hay restricciones. El dominio es $\\mathbb{R}$. Los valores $x = \\pm 2$ son los ceros de $f$, no restricciones del dominio.",
        "graph_fn": None,
        "graph_view": None,
        "explanation": "Es fácil confundir el dominio de $f(x) = x^2 - 4$ con sus ceros o su imagen.\n\nEl **dominio** pregunta: ¿para qué $x$ puedo calcular $f(x)$? Como $f$ solo usa potencia y resta, siempre podés calcularlo. El dominio es $\\mathbb{R}$.\n\nLos valores $x = -2$ y $x = 2$ son los **ceros** de $f$ (donde $f(x) = 0$), no restricciones del dominio.\n\nLa **imagen** de $f$ sí es $[-4, +\\infty)$, ya que el mínimo se alcanza en $x = 0$: $f(0) = -4$."
    }
]

# ==============================================================================
# WHITE_POLYNOMIAL — 2 ejercicios nuevos
# ==============================================================================
polynomial_new = [
    {
        "external_id": "white_polynomial_lexi_11",
        "belt": "white",
        "topic": "polynomial",
        "skill": "LEXI",
        "subtype": "text",
        "question": "¿Cuál es el dominio natural de todo polinomio $p(x) = a_n x^n + \\cdots + a_1 x + a_0$?",
        "options": [
            "$(0, +\\infty)$",
            "$\\mathbb{R} \\setminus \\{0\\}$",
            "$\\mathbb{R}$ (todos los reales)",
            "Depende del grado del polinomio"
        ],
        "correct_index": 2,
        "has_math": True,
        "feedback_correct": "¡Correcto! Todo polinomio está definido para todo real, ya que solo usa suma, producto y potencias enteras no negativas.",
        "feedback_incorrect": "Los polinomios solo usan suma, producto y potencias con exponentes enteros no negativos: operaciones definidas para todo real. El dominio de cualquier polinomio es siempre $\\mathbb{R}$, sin importar su grado.",
        "graph_fn": None,
        "graph_view": None,
        "explanation": "Un **polinomio** combina únicamente sumas, restas, multiplicaciones y potencias con exponentes enteros no negativos. Ninguna de esas operaciones genera una indeterminación o restricción.\n\nNo importa el valor de $x$ que uses: siempre podés calcular $p(x)$. Por eso el dominio de todo polinomio es $\\mathbb{R}$.\n\nEsto contrasta con funciones que sí tienen restricciones:\n- Racionales: el denominador no puede ser $0$.\n- Logarítmicas: el argumento debe ser positivo.\n- Raíces de índice par: el radicando debe ser no negativo.\n\nEjemplo: $p(x) = x^{100} - 7x^{50} + 3$ tiene dominio $\\mathbb{R}$."
    },
    {
        "external_id": "white_polynomial_clsf_11",
        "belt": "white",
        "topic": "polynomial",
        "skill": "CLSF",
        "subtype": "text",
        "question": "¿Cuál es el dominio de $p(x) = x^5 - 3x^2 + 7$?",
        "options": [
            "$(0, +\\infty)$",
            "$(-\\infty, 0) \\cup (0, +\\infty)$",
            "$[-7^{1/5},\\, 7^{1/5}]$",
            "$\\mathbb{R}$"
        ],
        "correct_index": 3,
        "has_math": True,
        "feedback_correct": "¡Correcto! $p(x)$ es un polinomio, así que su dominio es $\\mathbb{R}$.",
        "feedback_incorrect": "$p(x) = x^5 - 3x^2 + 7$ es un polinomio. No hay denominadores, raíces ni logaritmos. El dominio es $\\mathbb{R}$.",
        "graph_fn": None,
        "graph_view": None,
        "explanation": "Para determinar el dominio de $p(x) = x^5 - 3x^2 + 7$, buscamos restricciones: divisiones por cero, raíces de negativos, logaritmos de no positivos.\n\nNo hay ninguna de esas operaciones. Solo hay potencias enteras y sumas, definidas para todo $x \\in \\mathbb{R}$.\n\nEl dominio es $\\mathbb{R}$.\n\nNota: el intervalo $[-7^{1/5}, 7^{1/5}]$ no tiene ningún significado especial aquí. El dominio de un polinomio no depende de sus raíces ni de los valores que toma, sino solo de las operaciones involucradas."
    }
]

# ==============================================================================
# WHITE_EXPONENTIAL — 3 ejercicios nuevos
# ==============================================================================
exponential_new = [
    {
        "external_id": "white_exponential_lexi_11",
        "belt": "white",
        "topic": "exponential",
        "skill": "LEXI",
        "subtype": "text",
        "question": "¿Cuál es la imagen de $f(x) = a^x$, con $a > 0$ y $a \\neq 1$?",
        "options": [
            "$(0, +\\infty)$",
            "$\\mathbb{R}$",
            "$[0, +\\infty)$",
            "$(-\\infty, 0)$"
        ],
        "correct_index": 0,
        "has_math": True,
        "feedback_correct": "¡Correcto! La función exponencial siempre toma valores positivos: $a^x > 0$ para todo $x \\in \\mathbb{R}$, pero nunca alcanza el cero.",
        "feedback_incorrect": "La exponencial $a^x$ nunca es negativa ni cero: $a^x > 0$ para todo $x$. Cuando $x \\to -\\infty$ (si $a > 1$), $a^x \\to 0^+$, pero sin llegar a $0$. La imagen es $(0, +\\infty)$.",
        "graph_fn": None,
        "graph_view": None,
        "explanation": "Para la función exponencial $f(x) = a^x$ (con $a > 0, a \\neq 1$):\n\n- $a^x > 0$ para todo $x \\in \\mathbb{R}$, ya que una base positiva elevada a cualquier exponente real siempre es positiva.\n- Cuando $x \\to -\\infty$ (y $a > 1$), $a^x \\to 0^+$: se acerca al cero pero nunca llega.\n- Cuando $x \\to +\\infty$ (y $a > 1$), $a^x \\to +\\infty$.\n\nLa imagen es $(0, +\\infty)$: el cero no se incluye (es un límite asintótico), y los negativos tampoco son alcanzables."
    },
    {
        "external_id": "white_exponential_clsf_11",
        "belt": "white",
        "topic": "exponential",
        "skill": "CLSF",
        "subtype": "text",
        "question": "¿Puede $f(x) = 2^x$ tomar el valor $0$ para algún $x \\in \\mathbb{R}$?",
        "options": [
            "Sí, cuando $x = 0$",
            "Sí, cuando $x \\to -\\infty$",
            "No, porque $2^x > 0$ para todo $x \\in \\mathbb{R}$",
            "Sí, cuando $x$ es un número negativo muy grande en valor absoluto"
        ],
        "correct_index": 2,
        "has_math": True,
        "feedback_correct": "¡Correcto! $2^x > 0$ para todo real $x$. Aunque $2^x \\to 0$ cuando $x \\to -\\infty$, nunca llega exactamente a cero.",
        "feedback_incorrect": "$2^0 = 1 \\neq 0$. Y aunque $2^x$ se acerca a $0$ cuando $x \\to -\\infty$, nunca lo alcanza. La ecuación $2^x = 0$ no tiene solución real.",
        "graph_fn": None,
        "graph_view": None,
        "explanation": "La función $f(x) = 2^x$ tiene imagen $(0, +\\infty)$: siempre positiva, nunca nula.\n\nCuando $x \\to -\\infty$, $2^x \\to 0$, pero es un **límite asintótico**: la función se acerca al eje $x$ sin tocarlo nunca.\n\nLa ecuación $2^x = 0$ no tiene solución porque:\n\n$$2^x = 0 \\iff x = \\log_2(0)$$\n\ny el logaritmo de cero no existe.\n\nConclución: el valor $0$ no pertenece a la imagen de ninguna exponencial $a^x$ con $a > 0$."
    },
    {
        "external_id": "white_exponential_form_11",
        "belt": "white",
        "topic": "exponential",
        "skill": "FORM",
        "subtype": "text",
        "question": "¿Cuál es el dominio de $f(x) = 3^{x-2} + 1$?",
        "options": [
            "$(2, +\\infty)$",
            "$\\mathbb{R}$",
            "$(-\\infty, 2)$",
            "$\\mathbb{R} \\setminus \\{2\\}$"
        ],
        "correct_index": 1,
        "has_math": True,
        "feedback_correct": "¡Correcto! La traslación horizontal no afecta el dominio. $f(x) = 3^{x-2} + 1$ está definida para todo $x \\in \\mathbb{R}$.",
        "feedback_incorrect": "La exponencial $3^u$ está definida para todo $u$ real. El exponente $u = x - 2$ es real para cualquier $x$, sin restricciones. El dominio es $\\mathbb{R}$.",
        "graph_fn": None,
        "graph_view": None,
        "explanation": "Para hallar el dominio de $f(x) = 3^{x-2} + 1$, analizamos si hay algún $x$ para el que la función no esté definida.\n\nEl exponente es $u = x - 2$: una traslación que toma valores en $\\mathbb{R}$ sin restricción.\n\nComo $3^u$ está definida para todo $u \\in \\mathbb{R}$, el dominio de $f$ es $\\mathbb{R}$.\n\nImportante: las traslaciones como $3^{x-2}$ o los escalados como $3^{2x}$ **no restringen el dominio**. Lo que sí restringiría el dominio sería, por ejemplo, $\\log(x-2)$, que exige $x > 2$."
    }
]

# ==============================================================================
# WHITE_LOGARITHMIC — 3 ejercicios nuevos
# ==============================================================================
logarithmic_new = [
    {
        "external_id": "white_logarithmic_lexi_11",
        "belt": "white",
        "topic": "logarithmic",
        "skill": "LEXI",
        "subtype": "text",
        "question": "¿Por qué $\\ln(x)$ no está definido para $x \\leq 0$?",
        "options": [
            "Porque la función logarítmica siempre toma valores negativos",
            "Porque no existe ningún número real $t$ tal que $e^t = x$ cuando $x \\leq 0$",
            "Porque $e$ es mayor que $1$ y no puede producir valores no positivos como potencia",
            "Porque el logaritmo solo acepta enteros positivos como argumento"
        ],
        "correct_index": 1,
        "has_math": True,
        "feedback_correct": "¡Correcto! Por definición, $\\ln(x) = t$ significa $e^t = x$. Como $e^t > 0$ siempre, no puede igualarse a un número $\\leq 0$.",
        "feedback_incorrect": "$\\ln(x) = t$ se define como 'el $t$ tal que $e^t = x$'. Como $e^t > 0$ para todo real $t$, no existe tal $t$ si $x \\leq 0$. Por eso $\\ln$ no está definido ahí.",
        "graph_fn": None,
        "graph_view": None,
        "explanation": "El **logaritmo natural** $\\ln(x)$ se define como la función inversa de $e^x$: decir $\\ln(x) = t$ equivale a decir $e^t = x$.\n\nAhora bien, $e^t > 0$ para todo $t \\in \\mathbb{R}$. Entonces:\n\n- Si $x \\leq 0$, no existe ningún real $t$ que satisfaga $e^t = x$.\n- Por eso $\\ln(x)$ no está definido para $x \\leq 0$.\n\nEl dominio de $\\ln(x)$ es $(0, +\\infty)$: solo argumentos estrictamente positivos.\n\nEsta restricción aplica a cualquier logaritmo: $\\log_b(x)$ con $b > 0, b \\neq 1$ requiere $x > 0$."
    },
    {
        "external_id": "white_logarithmic_clsf_11",
        "belt": "white",
        "topic": "logarithmic",
        "skill": "CLSF",
        "subtype": "text",
        "question": "¿Cuál es el dominio de $f(x) = \\ln(x - 3)$?",
        "options": [
            "$\\mathbb{R} \\setminus \\{3\\}$",
            "$(-3, +\\infty)$",
            "$[3, +\\infty)$",
            "$(3, +\\infty)$"
        ],
        "correct_index": 3,
        "has_math": True,
        "feedback_correct": "¡Correcto! El argumento del logaritmo debe ser positivo: $x - 3 > 0 \\Rightarrow x > 3$. El dominio es $(3, +\\infty)$.",
        "feedback_incorrect": "Para que $\\ln(x - 3)$ esté definido, imponés $x - 3 > 0$, es decir $x > 3$. El $3$ no se incluye porque $\\ln(0)$ no existe. El dominio es $(3, +\\infty)$.",
        "graph_fn": None,
        "graph_view": None,
        "explanation": "Para que $f(x) = \\ln(x - 3)$ esté definida, el argumento del logaritmo debe ser **estrictamente positivo**:\n\n$$x - 3 > 0 \\iff x > 3$$\n\nEl dominio es $(3, +\\infty)$.\n\nNotas importantes:\n- $x = 3$ no pertenece al dominio porque $\\ln(0)$ no existe.\n- El intervalo es **abierto** en $3$: $(3, +\\infty)$, no $[3, +\\infty)$.\n- La traslación $x - 3$ desplaza el dominio del logaritmo estándar $(0, +\\infty)$ tres unidades a la derecha."
    },
    {
        "external_id": "white_logarithmic_form_11",
        "belt": "white",
        "topic": "logarithmic",
        "skill": "FORM",
        "subtype": "text",
        "question": "¿Cuál es el dominio de $f(x) = \\log_2(2x - 6)$?",
        "options": [
            "$(-3, +\\infty)$",
            "$(6, +\\infty)$",
            "$(3, +\\infty)$",
            "$[3, +\\infty)$"
        ],
        "correct_index": 2,
        "has_math": True,
        "feedback_correct": "¡Correcto! Se necesita $2x - 6 > 0$, o sea $x > 3$. El dominio es $(3, +\\infty)$.",
        "feedback_incorrect": "El argumento debe ser positivo: $2x - 6 > 0 \\Rightarrow 2x > 6 \\Rightarrow x > 3$. El dominio es $(3, +\\infty)$, no $(6, +\\infty)$.",
        "graph_fn": None,
        "graph_view": None,
        "explanation": "Para que $f(x) = \\log_2(2x - 6)$ esté definida, imponemos que el argumento sea positivo y despejamos $x$:\n\n$$2x - 6 > 0 \\implies 2x > 6 \\implies x > 3$$\n\nEl dominio es $(3, +\\infty)$.\n\nEl proceso es el mismo para cualquier logaritmo con argumento compuesto: planteás la inecuación 'argumento $> 0$' y la resolvés algebraicamente.\n\nEjemplo adicional: si fuera $\\ln(3x + 9)$, harías $3x + 9 > 0 \\Rightarrow x > -3$, dominio $(-3, +\\infty)$."
    }
]

# ==============================================================================
# WHITE_RATIONAL — 3 ejercicios nuevos
# ==============================================================================
rational_new = [
    {
        "external_id": "white_rational_lexi_11",
        "belt": "white",
        "topic": "rational",
        "skill": "LEXI",
        "subtype": "text",
        "question": "¿Por qué las funciones racionales $f(x) = \\dfrac{p(x)}{q(x)}$ tienen restricciones en su dominio?",
        "options": [
            "Porque la división por cero no está definida, y $q(x)$ puede valer cero para ciertos $x$",
            "Porque el numerador $p(x)$ puede ser cero",
            "Porque el denominador siempre es negativo",
            "Porque las funciones racionales solo están definidas para $x$ entero"
        ],
        "correct_index": 0,
        "has_math": True,
        "feedback_correct": "¡Correcto! El dominio excluye los valores de $x$ donde el denominador $q(x) = 0$, ya que la división por cero no está definida.",
        "feedback_incorrect": "La restricción viene del denominador, no del numerador. Si $q(x_0) = 0$, entonces $\\dfrac{p(x_0)}{q(x_0)}$ no está definido. El dominio excluye esos valores $x_0$.",
        "graph_fn": None,
        "graph_view": None,
        "explanation": "En una función racional $f(x) = \\dfrac{p(x)}{q(x)}$, la operación problemática es la **división**: no está definida cuando el divisor es cero.\n\nEl dominio de $f$ es $\\mathbb{R}$ menos los ceros del denominador:\n\n$$\\text{Dom}(f) = \\{x \\in \\mathbb{R} : q(x) \\neq 0\\}$$\n\nEl numerador puede valer cero sin problema (produce $f(x) = 0$, no una indeterminación).\n\nEjemplo: $f(x) = \\dfrac{x^2}{x - 1}$ tiene dominio $\\mathbb{R} \\setminus \\{1\\}$, porque $q(1) = 0$."
    },
    {
        "external_id": "white_rational_clsf_11",
        "belt": "white",
        "topic": "rational",
        "skill": "CLSF",
        "subtype": "text",
        "question": "¿Cuál es el dominio de $f(x) = \\dfrac{1}{x^2 - 4}$?",
        "options": [
            "$\\mathbb{R} \\setminus \\{4\\}$",
            "$(-2, 2)$",
            "$\\mathbb{R} \\setminus \\{-2,\\, 2\\}$",
            "$\\mathbb{R}$"
        ],
        "correct_index": 2,
        "has_math": True,
        "feedback_correct": "¡Correcto! El denominador $x^2 - 4 = (x-2)(x+2)$ se anula en $x = 2$ y $x = -2$. El dominio excluye ambos valores.",
        "feedback_incorrect": "El denominador es $x^2 - 4 = (x-2)(x+2)$, que se anula en $x = 2$ y $x = -2$. El dominio es $\\mathbb{R} \\setminus \\{-2, 2\\}$, no $\\mathbb{R} \\setminus \\{4\\}$ ni el intervalo $(-2, 2)$.",
        "graph_fn": None,
        "graph_view": None,
        "explanation": "Para hallar el dominio de $f(x) = \\dfrac{1}{x^2 - 4}$, buscamos los ceros del denominador:\n\n$$x^2 - 4 = 0 \\iff x^2 = 4 \\iff x = \\pm 2$$\n\nHay dos valores excluidos: $x = -2$ y $x = 2$.\n\nEl dominio es $\\mathbb{R} \\setminus \\{-2,\\, 2\\}$, o en notación de intervalos: $(-\\infty, -2) \\cup (-2, 2) \\cup (2, +\\infty)$.\n\nError común: ver '$x^2 - 4$' y pensar que hay que excluir solo $x = 4$. Siempre factorizá el denominador para encontrar todos sus ceros."
    },
    {
        "external_id": "white_rational_form_11",
        "belt": "white",
        "topic": "rational",
        "skill": "FORM",
        "subtype": "text",
        "question": "¿Cuál es el dominio de $f(x) = \\dfrac{x + 1}{x - 3}$ expresado en notación de intervalos?",
        "options": [
            "$(-\\infty, 3]$",
            "$(-\\infty, 3) \\cup (3, +\\infty)$",
            "$(3, +\\infty)$",
            "$(-3, +\\infty)$"
        ],
        "correct_index": 1,
        "has_math": True,
        "feedback_correct": "¡Correcto! El denominador se anula en $x = 3$, que queda excluido. El dominio es $(-\\infty, 3) \\cup (3, +\\infty)$.",
        "feedback_incorrect": "El denominador $x - 3$ se anula solo en $x = 3$. El dominio excluye ese punto: $(-\\infty, 3) \\cup (3, +\\infty)$. Usá paréntesis abiertos en $3$, porque ese punto no pertenece al dominio.",
        "graph_fn": None,
        "graph_view": None,
        "explanation": "El denominador de $f(x) = \\dfrac{x+1}{x-3}$ es $x - 3$, que se anula en $x = 3$.\n\nEl dominio excluye ese punto:\n\n$$\\text{Dom}(f) = \\mathbb{R} \\setminus \\{3\\} = (-\\infty,\\, 3) \\cup (3,\\, +\\infty)$$\n\nObservá que los paréntesis en $3$ son abiertos: el punto $3$ no está incluido en ninguno de los dos intervalos.\n\nEn la gráfica, esto aparece como una **asíntota vertical** en $x = 3$: la función crece o decrece sin límite a medida que $x$ se acerca a $3$."
    }
]

# ==============================================================================
# WHITE_TRIGONOMETRIC — 3 ejercicios nuevos
# ==============================================================================
trigonometric_new = [
    {
        "external_id": "white_trigonometric_lexi_11",
        "belt": "white",
        "topic": "trigonometric",
        "skill": "LEXI",
        "subtype": "text",
        "question": "¿Cuál es la imagen de $f(x) = \\sin(x)$?",
        "options": [
            "$\\mathbb{R}$",
            "$[0, 1]$",
            "$(0, 2\\pi)$",
            "$[-1, 1]$"
        ],
        "correct_index": 3,
        "has_math": True,
        "feedback_correct": "¡Correcto! El seno oscila entre $-1$ y $1$ inclusive. La imagen de $\\sin(x)$ es $[-1, 1]$.",
        "feedback_incorrect": "$\\sin(x)$ alcanza el valor $1$ (en $x = \\pi/2$), el valor $-1$ (en $x = 3\\pi/2$) y todos los valores intermedios. La imagen es $[-1, 1]$, no $[0, 1]$ ni $\\mathbb{R}$.",
        "graph_fn": None,
        "graph_view": None,
        "explanation": "La función seno es **periódica** y oscila continuamente entre dos valores extremos:\n\n- Máximo: $\\sin(\\pi/2) = 1$\n- Mínimo: $\\sin(3\\pi/2) = -1$\n\nComo $\\sin$ es continua, toma todos los valores intermedios entre $-1$ y $1$. La imagen es el intervalo cerrado $[-1, 1]$.\n\nLo mismo aplica al coseno: $\\text{Im}(\\cos) = [-1, 1]$. Esto contrasta con $\\tan$, cuya imagen es $\\mathbb{R}$ (sin acotación)."
    },
    {
        "external_id": "white_trigonometric_clsf_11",
        "belt": "white",
        "topic": "trigonometric",
        "skill": "CLSF",
        "subtype": "text",
        "question": "¿Para qué valores de $x$ la función $f(x) = \\tan(x)$ **no** está definida?",
        "options": [
            "$x = n\\pi,\\ n \\in \\mathbb{Z}$",
            "$x = \\dfrac{\\pi}{2} + n\\pi,\\ n \\in \\mathbb{Z}$",
            "$x = 2n\\pi,\\ n \\in \\mathbb{Z}$",
            "Para ningún valor; $\\tan(x)$ está definida en $\\mathbb{R}$"
        ],
        "correct_index": 1,
        "has_math": True,
        "feedback_correct": "¡Correcto! $\\tan(x) = \\sin(x)/\\cos(x)$ no está definida donde $\\cos(x) = 0$, es decir en $x = \\pi/2 + n\\pi$.",
        "feedback_incorrect": "$\\tan(x) = \\dfrac{\\sin(x)}{\\cos(x)}$. La función no está definida donde $\\cos(x) = 0$, que ocurre en $x = \\pi/2, 3\\pi/2, -\\pi/2, \\ldots$, resumidos como $x = \\pi/2 + n\\pi$.",
        "graph_fn": None,
        "graph_view": None,
        "explanation": "La tangente se define como el cociente:\n\n$$\\tan(x) = \\frac{\\sin(x)}{\\cos(x)}$$\n\nEl denominador $\\cos(x)$ se anula en $x = \\dfrac{\\pi}{2} + n\\pi$ para $n \\in \\mathbb{Z}$:\n\n$$\\ldots,\\ -\\frac{3\\pi}{2},\\ -\\frac{\\pi}{2},\\ \\frac{\\pi}{2},\\ \\frac{3\\pi}{2},\\ \\ldots$$\n\nEn esos puntos, $\\tan(x)$ no está definida (asíntotas verticales). El dominio de $\\tan$ es $\\mathbb{R} \\setminus \\{\\pi/2 + n\\pi : n \\in \\mathbb{Z}\\}$.\n\nContraste: $\\sin$ y $\\cos$ sí tienen dominio $\\mathbb{R}$ completo, ya que no llevan denominador."
    },
    {
        "external_id": "white_trigonometric_form_11",
        "belt": "white",
        "topic": "trigonometric",
        "skill": "FORM",
        "subtype": "text",
        "question": "¿Cuál es el dominio de $f(x) = \\cos(x)$?",
        "options": [
            "$\\mathbb{R}$",
            "$[-1, 1]$",
            "$[0, \\pi]$",
            "$\\mathbb{R} \\setminus \\{\\pi/2 + n\\pi : n \\in \\mathbb{Z}\\}$"
        ],
        "correct_index": 0,
        "has_math": True,
        "feedback_correct": "¡Correcto! $\\cos(x)$ está definido para todo real $x$. Su dominio es $\\mathbb{R}$.",
        "feedback_incorrect": "$\\cos(x)$ está definido para todo $x \\in \\mathbb{R}$. El intervalo $[-1, 1]$ es la **imagen**, no el dominio. Y $\\mathbb{R} \\setminus \\{\\pi/2 + n\\pi\\}$ es el dominio de la tangente, no del coseno.",
        "graph_fn": None,
        "graph_view": None,
        "explanation": "El coseno es una función definida para **todo** $x \\in \\mathbb{R}$. No hay denominador, logaritmo ni raíz que genere restricciones.\n\n- **Dominio** de $\\cos$: $\\mathbb{R}$\n- **Imagen** de $\\cos$: $[-1, 1]$\n\nEs un error frecuente confundir ambos. La imagen ($[-1, 1]$) es el rango de valores que produce $\\cos$, no el conjunto de entradas válidas.\n\nContraste con $f(x) = \\tan(x)$: su dominio sí excluye $x = \\pi/2 + n\\pi$, porque $\\tan$ lleva $\\cos(x)$ en el denominador."
    }
]

# ==============================================================================
# Aplicar todo
# ==============================================================================
print("Agregando ejercicios de dominio, imagen y codominio al cinturon blanco...\n")

# white_linear ya fue procesado (33 ejercicios)
append_exercises('white_quadratic.json', quadratic_new)
append_exercises('white_polynomial.json', polynomial_new)
append_exercises('white_exponential.json', exponential_new)
append_exercises('white_logarithmic.json', logarithmic_new)
append_exercises('white_rational.json', rational_new)
append_exercises('white_trigonometric.json', trigonometric_new)

print("\nVerificando JSON válido...")
import glob
for fpath in sorted(glob.glob(os.path.join(BASE, 'white_*.json'))):
    with open(fpath, encoding='utf-8') as f:
        data = json.load(f)
    nuevos = [e for e in data if e['external_id'].endswith('_11')]
    fname = os.path.basename(fpath)
    print(f"  {fname}: {len(data)} total, {len(nuevos)} nuevos (_11)")

print("\n¡Listo!")
