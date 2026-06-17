import json

PATH = "content/analisis-1/exercises/white_logarithmic.json"
with open(PATH, encoding="utf-8") as f:
    exercises = json.load(f)

new_clsf = [
  # clsf_15: cotidiano — tiempo de duplicación → logarítmica
  {
    "external_id": "white_logarithmic_clsf_15",
    "belt": "white", "topic": "logarithmic", "exercise_type": "CLSF",
    "question": "Una inversión de \\$1000 crece un 10% anual. Se quiere saber **cuántos años** tardará en llegar a \\$2000.\n\n¿A qué familia de funciones pertenece la regla que calcula los años necesarios en función del monto objetivo?",
    "options": ["Lineal", "Exponencial", "Logarítmica", "Cuadrática"],
    "correct_index": 2, "has_math": True,
    "feedback_correct": "Despejar el tiempo en $M = 1000 \\cdot (1{,}1)^t$ da $t = \\log_{1{,}1}(M/1000)$: una función logarítmica.",
    "feedback_incorrect": "", "graph_fn": None, "graph_view": None,
    "explanation": "La función que da el **monto** después de $t$ años es exponencial: $M(t) = 1000 \\cdot (1{,}1)^t$.\n\nPero si la pregunta es '¿cuántos **años** para llegar a $M$?', se despeja $t$:\n$$t = \\log_{1{,}1}\\!\\left(\\frac{M}{1000}\\right)$$\n\nEsta función $t(M)$ es logarítmica: la variable está dentro del logaritmo. La exponencial y la logarítmica son inversas.",
    "reviewed": False
  },
  # clsf_16: cotidiano — bacterias, horas para llegar a N → logarítmica
  {
    "external_id": "white_logarithmic_clsf_16",
    "belt": "white", "topic": "logarithmic", "exercise_type": "CLSF",
    "question": "Un cultivo de bacterias parte de 50 y se duplica cada hora. Se quiere saber cuántas horas tardan en llegar a $N$ bacterias.\n\n¿A qué familia de funciones pertenece la regla que calcula las horas necesarias en función de $N$?",
    "options": ["Cuadrática", "Exponencial", "Lineal", "Logarítmica"],
    "correct_index": 3, "has_math": True,
    "feedback_correct": "Despejar $t$ de $N = 50 \\cdot 2^t$ da $t = \\log_2(N/50)$: una función logarítmica.",
    "feedback_incorrect": "", "graph_fn": None, "graph_view": None,
    "explanation": "La cantidad de bacterias en función del tiempo es exponencial: $B(t) = 50 \\cdot 2^t$.\n\nPero si se pregunta cuántos **períodos** para llegar a $N$:\n$$N = 50 \\cdot 2^t \\implies 2^t = \\frac{N}{50} \\implies t = \\log_2\\!\\left(\\frac{N}{50}\\right)$$\n\nEsa función $t(N)$ es logarítmica.",
    "reviewed": False
  },
  # clsf_17: cotidiano — deuda que crece un %, cuántos meses para duplicarse
  {
    "external_id": "white_logarithmic_clsf_17",
    "belt": "white", "topic": "logarithmic", "exercise_type": "CLSF",
    "question": "Una deuda de \\$5000 crece un 5% mensual. Se modela la cantidad de meses necesarios para que se duplique en función de la tasa de crecimiento $r$.\n\n¿A qué familia pertenece esa función?",
    "options": ["Exponencial", "Logarítmica", "Lineal", "Racional"],
    "correct_index": 1, "has_math": True,
    "feedback_correct": "Despejar el tiempo de una ecuación exponencial siempre da una función logarítmica.",
    "feedback_incorrect": "", "graph_fn": None, "graph_view": None,
    "explanation": "Para duplicar la deuda: $2 = (1 + r)^t$. Despejando:\n$$t = \\log_{1+r}(2) = \\frac{\\ln(2)}{\\ln(1+r)}$$\n\nEsta función de $r$ es logarítmica. Siempre que se despeje el tiempo de una ecuación exponencial, el resultado es un logaritmo.",
    "reviewed": False
  },
  # clsf_18: desde fórmula — -ln(x) es logarítmica
  {
    "external_id": "white_logarithmic_clsf_18",
    "belt": "white", "topic": "logarithmic", "exercise_type": "CLSF",
    "question": "¿A qué familia de funciones pertenece $f(x) = -\\ln(x)$?",
    "options": ["Exponencial", "Racional", "Logarítmica", "Lineal"],
    "correct_index": 2, "has_math": True,
    "feedback_correct": "El signo negativo refleja la curva, pero la operación central sigue siendo el logaritmo.",
    "feedback_incorrect": "", "graph_fn": None, "graph_view": None,
    "explanation": "Multiplicar por $-1$ produce una reflexión, pero no cambia la familia.\n\n$f(x) = -\\ln(x)$ es logarítmica: la operación principal sobre $x$ es el logaritmo natural.\n\nEsta función es **decreciente** (al revés que $\\ln(x)$), pero comparte el mismo dominio $(0, +\\infty)$, la misma imagen $\\mathbb{R}$ y la misma asíntota vertical $x = 0$.",
    "reviewed": False
  },
  # clsf_19: desde fórmula — 2·log₂(x) es logarítmica
  {
    "external_id": "white_logarithmic_clsf_19",
    "belt": "white", "topic": "logarithmic", "exercise_type": "CLSF",
    "question": "¿A qué familia de funciones pertenece $f(x) = 2 \\cdot \\log_2(x)$?",
    "options": ["Exponencial", "Logarítmica", "Lineal", "Cuadrática"],
    "correct_index": 1, "has_math": True,
    "feedback_correct": "Escalar verticalmente un logaritmo no cambia su familia: sigue siendo logarítmica.",
    "feedback_incorrect": "", "graph_fn": None, "graph_view": None,
    "explanation": "$f(x) = 2 \\cdot \\log_2(x)$ es **logarítmica**: la operación principal sobre $x$ es $\\log_2(x)$. El factor $2$ solo estira la curva verticalmente.\n\nNota: $2 \\cdot \\log_2(x) = \\log_2(x^2)$ por la propiedad de la potencia — otra forma de ver que sigue siendo un logaritmo.",
    "reviewed": False
  },
  # clsf_20: desde fórmula — log₀.₅(x) es logarítmica
  {
    "external_id": "white_logarithmic_clsf_20",
    "belt": "white", "topic": "logarithmic", "exercise_type": "CLSF",
    "question": "¿A qué familia de funciones pertenece $f(x) = \\log_{0{,}5}(x)$?",
    "options": ["Racional", "Exponencial", "Logarítmica", "Lineal"],
    "correct_index": 2, "has_math": True,
    "feedback_correct": "$\\log_{0{,}5}(x)$ es logarítmica con base $0{,}5$, que está en $(0, 1)$, así que es decreciente.",
    "feedback_incorrect": "", "graph_fn": None, "graph_view": None,
    "explanation": "$\\log_{0{,}5}(x)$ es una función **logarítmica** con base $b = 0{,}5$.\n\nComo $0 < 0{,}5 < 1$, la función es **decreciente**: a mayor $x$, menor $f(x)$.\n\nNota útil: $\\log_{0{,}5}(x) = -\\log_2(x)$, es el opuesto del logaritmo en base $2$.",
    "reviewed": False
  },
  # clsf_21: distinguir exponencial de logarítmica (e^x vs ln(x))
  {
    "external_id": "white_logarithmic_clsf_21",
    "belt": "white", "topic": "logarithmic", "exercise_type": "CLSF",
    "question": "¿Cuál de estas dos funciones es logarítmica?\n$$f(x) = e^x \\qquad g(x) = \\ln(x)$$",
    "options": ["$f(x) = e^x$", "$g(x) = \\ln(x)$", "Ambas son logarítmicas", "Ninguna es logarítmica"],
    "correct_index": 1, "has_math": True,
    "feedback_correct": "$g(x) = \\ln(x)$ es logarítmica (base $e$); $f(x) = e^x$ es su inversa, la exponencial.",
    "feedback_incorrect": "", "graph_fn": None, "graph_view": None,
    "explanation": "$g(x) = \\ln(x) = \\log_e(x)$ es una función **logarítmica** con base $e$.\n\n$f(x) = e^x$ es una función **exponencial** — son inversas entre sí.\n\nForma de distinguirlas: en la exponencial, la variable está en el **exponente** ($e^x$); en la logarítmica, la variable está dentro del **logaritmo** ($\\ln(x)$).",
    "reviewed": False
  },
  # clsf_22: distinguir 2^x vs log₂(x)
  {
    "external_id": "white_logarithmic_clsf_22",
    "belt": "white", "topic": "logarithmic", "exercise_type": "CLSF",
    "question": "¿Cuál de estas es una función logarítmica?\n$$f(x) = 2^x \\qquad g(x) = \\log_2(x)$$",
    "options": ["$f(x) = 2^x$", "$g(x) = \\log_2(x)$", "Ambas", "Ninguna"],
    "correct_index": 1, "has_math": True,
    "feedback_correct": "$g(x) = \\log_2(x)$ es logarítmica (base $2$); $f(x) = 2^x$ es su inversa, la exponencial.",
    "feedback_incorrect": "", "graph_fn": None, "graph_view": None,
    "explanation": "Regla clave: en la **exponencial**, la variable va en el exponente → $f(x) = 2^x$.\n\nEn la **logarítmica**, la variable va dentro del logaritmo → $g(x) = \\log_2(x)$.\n\nSon funciones inversas: $\\log_2(2^x) = x$ y $2^{\\log_2(x)} = x$.",
    "reviewed": False
  },
  # clsf_23: desde gráfico — asíntota vertical → logarítmica
  {
    "external_id": "white_logarithmic_clsf_23",
    "belt": "white", "topic": "logarithmic", "exercise_type": "CLSF",
    "question": "La gráfica muestra una función definida solo para $x > 0$, con una curva creciente que tiene asíntota vertical en $x = 0$ y pasa por el punto $(1, 0)$.\n\n¿A qué familia de funciones pertenece esta gráfica?",
    "options": ["Exponencial", "Cuadrática", "Logarítmica", "Lineal"],
    "correct_index": 2, "has_math": True,
    "feedback_correct": "Asíntota vertical en $x = 0$, dominio $(0, +\\infty)$ y punto $(1, 0)$ son sellos de una logarítmica.",
    "feedback_incorrect": "", "graph_fn": "log2(x)", "graph_view": [-0.5, 8.5, -3, 5],
    "explanation": "Las señas distintivas de una función **logarítmica** en su gráfica:\n1. Solo existe para $x > 0$ (o $x > c$ si está desplazada).\n2. Asíntota vertical al borde izquierdo del dominio.\n3. Pasa por $(1,\\, 0)$ (para la forma básica).\n4. Crece (o decrece) cada vez más lentamente — curva cóncava.\n\nEsta gráfica corresponde a $\\log_2(x)$.",
    "reviewed": False
  },
  # clsf_24: dominio de ln(x-2)
  {
    "external_id": "white_logarithmic_clsf_24",
    "belt": "white", "topic": "logarithmic", "exercise_type": "CLSF",
    "question": "¿Cuál es el dominio de $f(x) = \\ln(x - 2)$?",
    "options": ["$(-2, +\\infty)$", "$[2, +\\infty)$", "$(2, +\\infty)$", "$\\mathbb{R}$"],
    "correct_index": 2, "has_math": True,
    "feedback_correct": "Se necesita $x - 2 > 0$, es decir $x > 2$. El dominio es $(2, +\\infty)$.",
    "feedback_incorrect": "", "graph_fn": None, "graph_view": None,
    "explanation": "Para que $\\ln(x - 2)$ esté definido:\n$$x - 2 > 0 \\implies x > 2$$\n\nDominio: $(2, +\\infty)$, con asíntota vertical en $x = 2$.\n\nEl intervalo es **abierto** en $x = 2$ porque $\\ln(0)$ no existe.",
    "reviewed": False
  },
  # clsf_25: imagen de log₂(x) + 3 sigue siendo ℝ
  {
    "external_id": "white_logarithmic_clsf_25",
    "belt": "white", "topic": "logarithmic", "exercise_type": "CLSF",
    "question": "¿Cuál es la imagen de $f(x) = \\log_2(x) + 3$?",
    "options": ["$(3, +\\infty)$", "$[3, +\\infty)$", "$(0, +\\infty)$", "$\\mathbb{R}$"],
    "correct_index": 3, "has_math": True,
    "feedback_correct": "Sumar $3$ desplaza la curva hacia arriba, pero la imagen sigue siendo $\\mathbb{R}$.",
    "feedback_incorrect": "", "graph_fn": None, "graph_view": None,
    "explanation": "$\\log_2(x)$ tiene imagen $\\mathbb{R}$. Sumar $3$ desplaza todos los valores en $+3$:\n\n$$\\text{Imagen de } (\\log_2(x) + 3) = \\mathbb{R} + 3 = \\mathbb{R}$$\n\nUn desplazamiento vertical no acota la imagen de un logaritmo. Contraste con la exponencial $2^x + 3$, cuya imagen es $(3, +\\infty)$.",
    "reviewed": False
  },
  # clsf_26: cotidiano — depreciación inversa (cuántos años para valer la mitad)
  {
    "external_id": "white_logarithmic_clsf_26",
    "belt": "white", "topic": "logarithmic", "exercise_type": "CLSF",
    "question": "Un auto se deprecia un 20% anual. Se quiere saber cuántos años tardará en valer la mitad de su precio original.\n\n¿A qué familia de funciones pertenece la regla que calcula los años necesarios?",
    "options": ["Cuadrática", "Lineal", "Exponencial", "Logarítmica"],
    "correct_index": 3, "has_math": True,
    "feedback_correct": "Despejar el tiempo de $0{,}5 = (0{,}8)^t$ da una función logarítmica.",
    "feedback_incorrect": "", "graph_fn": None, "graph_view": None,
    "explanation": "El valor del auto es $V(t) = V_0 \\cdot (0{,}8)^t$ — función exponencial.\n\nPara saber cuándo vale la mitad: $0{,}5 = (0{,}8)^t$. Despejando:\n$$t = \\log_{0{,}8}(0{,}5) = \\frac{\\ln(0{,}5)}{\\ln(0{,}8)} \\approx 3{,}1 \\text{ años}$$\n\nLa función que calcula el tiempo en función del factor de depreciación es logarítmica.",
    "reviewed": False
  },
  # clsf_27: desde gráfico — curva decreciente con asíntota vertical → logarítmica con base < 1
  {
    "external_id": "white_logarithmic_clsf_27",
    "belt": "white", "topic": "logarithmic", "exercise_type": "CLSF",
    "question": "La gráfica muestra una función definida para $x > 0$, con una curva decreciente que tiene asíntota vertical en $x = 0$ y pasa por el punto $(1, 0)$.\n\n¿A qué familia de funciones pertenece esta gráfica?",
    "options": ["Lineal decreciente", "Exponencial decreciente", "Racional", "Logarítmica"],
    "correct_index": 3, "has_math": True,
    "feedback_correct": "Asíntota vertical en $x = 0$, dominio $(0, +\\infty)$ y paso por $(1, 0)$: es logarítmica con base $< 1$ o negada.",
    "feedback_incorrect": "", "graph_fn": "-log2(x)", "graph_view": [-0.5, 8.5, -4, 4],
    "explanation": "Una curva **decreciente** con asíntota vertical en $x = 0$ y dominio $(0, +\\infty)$ puede ser:\n- $\\log_b(x)$ con $0 < b < 1$ (por ejemplo $\\log_{0{,}5}(x)$)\n- O $-\\log_b(x)$ con $b > 1$ (por ejemplo $-\\log_2(x)$)\n\nAmbas son funciones **logarítmicas**. La diferencia con la exponencial: esta tiene asíntota **vertical**, no horizontal.",
    "reviewed": False
  },
  # clsf_28: cotidiano — lineal vs logarítmica (suma fija vs tiempo de duplicación)
  {
    "external_id": "white_logarithmic_clsf_28",
    "belt": "white", "topic": "logarithmic", "exercise_type": "CLSF",
    "question": "Una empresa deposita \\$200 por semana en una cuenta. Se modela el **tiempo en semanas** necesario para llegar a un cierto saldo $S$.\n\n¿A qué familia pertenece esa función?",
    "options": ["Logarítmica", "Lineal", "Cuadrática", "Exponencial"],
    "correct_index": 1, "has_math": True,
    "feedback_correct": "Si se deposita \\$200 por semana (suma fija), el tiempo necesario crece linealmente con el saldo: $t = S / 200$.",
    "feedback_incorrect": "", "graph_fn": None, "graph_view": None,
    "explanation": "Suma fija por período → crecimiento **lineal**. El saldo es $S(t) = 200t$. Despejando el tiempo:\n$$t = \\frac{S}{200}$$\n\nEsa función es **lineal** en $S$, no logarítmica.\n\nLa logarítmica aparece cuando el crecimiento es **multiplicativo** (porcentual), no aditivo. Si la cuenta creciera un 5% por semana, ahí el tiempo de duplicación sería logarítmico.",
    "reviewed": False
  },
  # clsf_29: imagen de f(x) = log_b(x) con cualquier transformación vertical → ℝ
  {
    "external_id": "white_logarithmic_clsf_29",
    "belt": "white", "topic": "logarithmic", "exercise_type": "CLSF",
    "question": "¿Tiene $f(x) = \\log_2(x) - 5$ extremos locales (máximos o mínimos)?",
    "options": [
      "Sí, un mínimo en $x = 0$",
      "Sí, un máximo en $x = 1$",
      "No, es estrictamente creciente sin extremos locales",
      "Sí, un mínimo en $x = 5$"
    ],
    "correct_index": 2, "has_math": True,
    "feedback_correct": "Una función estrictamente creciente nunca tiene extremos locales.",
    "feedback_incorrect": "", "graph_fn": None, "graph_view": None,
    "explanation": "$f(x) = \\log_2(x) - 5$ es estrictamente creciente en $(0, +\\infty)$. Una función que siempre crece (o siempre decrece) nunca 'da la vuelta', por lo que **no tiene extremos locales**.\n\nRestar $5$ desplaza la curva hacia abajo, pero no cambia el hecho de que es monótona.",
    "reviewed": False
  },
  # clsf_30: desde gráfico — asíntota en x=2 → argumento (x-2)
  {
    "external_id": "white_logarithmic_clsf_30",
    "belt": "white", "topic": "logarithmic", "exercise_type": "CLSF",
    "question": "La gráfica muestra una función creciente definida para $x > 1$, con asíntota vertical en $x = 1$ y que pasa por el punto $(2,\\, 0)$.\n\n¿A qué familia pertenece esta gráfica?",
    "options": ["Racional", "Exponencial", "Lineal", "Logarítmica"],
    "correct_index": 3, "has_math": True,
    "feedback_correct": "Asíntota vertical en $x = 1$ y dominio $(1, +\\infty)$ son propios de una logarítmica desplazada.",
    "feedback_incorrect": "", "graph_fn": "log2(x - 1)", "graph_view": [0.5, 9.5, -3, 4],
    "explanation": "La curva tiene asíntota vertical en $x = 1$ (no en $x = 0$): señal de que el argumento del logaritmo es $(x - 1)$.\n\nCorresponde a $f(x) = \\log_2(x - 1)$: pasa por $(2,\\, 0)$ ya que $\\log_2(2 - 1) = \\log_2(1) = 0$ ✓.",
    "reviewed": False
  },
  # clsf_31: es log(x+2) logarítmica
  {
    "external_id": "white_logarithmic_clsf_31",
    "belt": "white", "topic": "logarithmic", "exercise_type": "CLSF",
    "question": "¿A qué familia pertenece $f(x) = \\log(x + 2) - 1$?",
    "options": ["Lineal", "Exponencial", "Logarítmica", "Racional"],
    "correct_index": 2, "has_math": True,
    "feedback_correct": "La operación principal sobre $x$ es el logaritmo: es una función logarítmica.",
    "feedback_incorrect": "", "graph_fn": None, "graph_view": None,
    "explanation": "Sumar $2$ dentro del argumento y restar $1$ al resultado son transformaciones (desplazamientos), pero la operación central sigue siendo el logaritmo de $x$.\n\nDominio: $x + 2 > 0 \\implies x > -2$. Asíntota vertical: $x = -2$.\n\nLa función sigue siendo **logarítmica**, con dominio $(-2, +\\infty)$.",
    "reviewed": False
  },
  # clsf_32: cotidiano — crecimiento poblacional inverso
  {
    "external_id": "white_logarithmic_clsf_32",
    "belt": "white", "topic": "logarithmic", "exercise_type": "CLSF",
    "question": "La población de una ciudad crece un 3% anual. Una investigadora calcula cuántos años se necesitan para que la población llegue a cada valor $P$.\n\n¿A qué familia pertenece esa función que calcula los años en función de $P$?",
    "options": ["Exponencial", "Cuadrática", "Logarítmica", "Lineal"],
    "correct_index": 2, "has_math": True,
    "feedback_correct": "Despejar $t$ de $P = P_0 \\cdot (1{,}03)^t$ da $t = \\log_{1{,}03}(P/P_0)$: función logarítmica.",
    "feedback_incorrect": "", "graph_fn": None, "graph_view": None,
    "explanation": "La función 'años para llegar a $P$' es la inversa de la función exponencial de crecimiento:\n$$P = P_0 \\cdot (1{,}03)^t \\implies t = \\frac{\\ln(P/P_0)}{\\ln(1{,}03)}$$\n\nEsa función de $P$ es logarítmica.",
    "reviewed": False
  },
  # clsf_33: inyectividad de la logarítmica
  {
    "external_id": "white_logarithmic_clsf_33",
    "belt": "white", "topic": "logarithmic", "exercise_type": "CLSF",
    "question": "¿Es $f(x) = \\log_2(x)$ una función inyectiva en su dominio?",
    "options": [
      "No, porque existen dos valores de $x$ que dan el mismo logaritmo",
      "Sí, porque es estrictamente creciente",
      "No, porque la imagen es $\\mathbb{R}$ y no está acotada",
      "Solo es inyectiva para $x > 1$"
    ],
    "correct_index": 1, "has_math": True,
    "feedback_correct": "Una función estrictamente creciente es inyectiva: a distintos $x$ les corresponden distintos valores.",
    "feedback_incorrect": "", "graph_fn": None, "graph_view": None,
    "explanation": "Una función **inyectiva** nunca repite valores: si $x_1 \\neq x_2$, entonces $f(x_1) \\neq f(x_2)$.\n\n$\\log_2(x)$ es estrictamente creciente en todo su dominio $(0, +\\infty)$: como siempre sube, nunca devuelve el mismo valor dos veces. Es, por lo tanto, inyectiva.\n\nEsta propiedad permite 'cancelar' logaritmos en ambos lados de una ecuación.",
    "reviewed": False
  },
  # clsf_34: dominio de log(x+5)
  {
    "external_id": "white_logarithmic_clsf_34",
    "belt": "white", "topic": "logarithmic", "exercise_type": "CLSF",
    "question": "¿Cuál es el dominio de $f(x) = \\log(x + 5)$?",
    "options": ["$x > 5$", "$x > 0$", "$x > -5$", "$\\mathbb{R}$"],
    "correct_index": 2, "has_math": True,
    "feedback_correct": "Se necesita $x + 5 > 0$, es decir $x > -5$. Dominio: $(-5, +\\infty)$.",
    "feedback_incorrect": "", "graph_fn": None, "graph_view": None,
    "explanation": "El argumento del logaritmo debe ser positivo:\n$$x + 5 > 0 \\implies x > -5$$\n\nDominio: $(-5, +\\infty)$. Asíntota vertical: $x = -5$.\n\nEsta función es $\\log(x)$ desplazada $5$ unidades a la izquierda.",
    "reviewed": False
  },
  # clsf_35: desde gráfico — log₂(x)+1 con asíntota x=0
  {
    "external_id": "white_logarithmic_clsf_35",
    "belt": "white", "topic": "logarithmic", "exercise_type": "CLSF",
    "question": "La gráfica muestra una función creciente definida para $x > 0$, con asíntota vertical en $x = 0$ y que pasa por el punto $(1,\\, 1)$.\n\n¿A qué familia pertenece esta gráfica?",
    "options": ["Lineal", "Exponencial", "Logarítmica", "Cuadrática"],
    "correct_index": 2, "has_math": True,
    "feedback_correct": "Asíntota vertical en $x = 0$ y paso por $(1,1)$ son propios de $\\log_2(x) + 1$: logarítmica.",
    "feedback_incorrect": "", "graph_fn": "log2(x)+1", "graph_view": [-0.5, 8.5, -2, 6],
    "explanation": "La gráfica corresponde a $f(x) = \\log_2(x) + 1$: logarítmica con desplazamiento vertical de $+1$.\n\nVerificación: $f(1) = \\log_2(1) + 1 = 0 + 1 = 1$ ✓. Asíntota vertical en $x = 0$ ✓.",
    "reviewed": False
  },
  # clsf_36: distinguir logarítmica de racional (ambas tienen asíntota vertical)
  {
    "external_id": "white_logarithmic_clsf_36",
    "belt": "white", "topic": "logarithmic", "exercise_type": "CLSF",
    "question": "Dos funciones, $f(x) = \\ln(x)$ y $g(x) = \\dfrac{1}{x}$, tienen asíntota vertical en $x = 0$.\n\n¿En qué se diferencian?",
    "options": [
      "Solo $f(x) = \\ln(x)$ tiene asíntota vertical",
      "$f(x) = \\ln(x)$ está definida para $x \\leq 0$; $g(x)$ no",
      "$f(x) = \\ln(x)$ es logarítmica (solo $x > 0$); $g(x)$ es racional (definida para $x \\neq 0$, ambos lados)",
      "Son la misma familia"
    ],
    "correct_index": 2, "has_math": True,
    "feedback_correct": "$\\ln(x)$ es logarítmica con dominio $(0,+\\infty)$; $1/x$ es racional con dominio $\\mathbb{R} \\setminus \\{0\\}$.",
    "feedback_incorrect": "", "graph_fn": None, "graph_view": None,
    "explanation": "Ambas tienen asíntota vertical en $x = 0$, pero son de familias distintas:\n\n- $\\ln(x)$: **logarítmica**, dominio solo $(0, +\\infty)$ — no está definida para $x < 0$.\n- $\\frac{1}{x}$: **racional**, definida para todo $x \\neq 0$ — existe en ambos lados de la asíntota.\n\nLa forma visual también difiere: $\\ln(x)$ siempre es creciente y tiene intercepto en $(1, 0)$; $\\frac{1}{x}$ tiene dos ramas y no corta el eje $X$.",
    "reviewed": False
  },
  # clsf_37: monto al cabo de t años es exponencial, no logarítmica
  {
    "external_id": "white_logarithmic_clsf_37",
    "belt": "white", "topic": "logarithmic", "exercise_type": "CLSF",
    "question": "Una inversión de \\$1000 crece un 8% anual. Se modela el **monto** $M$ en función de los **años** $t$.\n\n¿A qué familia pertenece esa función $M(t)$?",
    "options": ["Logarítmica", "Lineal", "Cuadrática", "Exponencial"],
    "correct_index": 3, "has_math": True,
    "feedback_correct": "$M(t) = 1000 \\cdot (1{,}08)^t$ es una función exponencial: la variable $t$ está en el exponente.",
    "feedback_incorrect": "", "graph_fn": None, "graph_view": None,
    "explanation": "$M(t) = 1000 \\cdot (1{,}08)^t$ es **exponencial**: la variable $t$ está en el exponente.\n\nContraste: si la pregunta fuera '¿cuántos años para llegar a $M$?', se despeja $t = \\log_{1{,}08}(M/1000)$, que es logarítmica.\n\nMonto en función del tiempo → exponencial. Tiempo en función del monto → logarítmica.",
    "reviewed": False
  },
  # clsf_38: desde fórmula — 3·ln(x+1) es logarítmica
  {
    "external_id": "white_logarithmic_clsf_38",
    "belt": "white", "topic": "logarithmic", "exercise_type": "CLSF",
    "question": "¿A qué familia pertenece $f(x) = 3 \\cdot \\ln(x + 1)$?",
    "options": ["Exponencial", "Lineal", "Racional", "Logarítmica"],
    "correct_index": 3, "has_math": True,
    "feedback_correct": "La operación principal sobre $x$ es $\\ln(x+1)$: es una función logarítmica.",
    "feedback_incorrect": "", "graph_fn": None, "graph_view": None,
    "explanation": "$f(x) = 3 \\cdot \\ln(x + 1)$ es **logarítmica**: la operación central sobre $x$ es el logaritmo natural.\n\nEl factor $3$ escala verticalmente y el $+1$ desplaza horizontalmente, pero no cambian la familia.\n\nDominio: $x + 1 > 0 \\implies x > -1$. Asíntota vertical: $x = -1$.",
    "reviewed": False
  },
  # clsf_39: log₂(x) con base > 1 es creciente
  {
    "external_id": "white_logarithmic_clsf_39",
    "belt": "white", "topic": "logarithmic", "exercise_type": "CLSF",
    "question": "¿Es $f(x) = \\log_5(x)$ creciente o decreciente en su dominio?",
    "options": [
      "Decreciente, porque la base $5 > 1$ hace que el logaritmo baje",
      "Creciente, porque la base $5 > 1$",
      "Ni creciente ni decreciente: tiene un mínimo en $x = 1$",
      "Creciente solo para $x > 1$, decreciente para $0 < x < 1$"
    ],
    "correct_index": 1, "has_math": True,
    "feedback_correct": "Con base $b > 1$, el logaritmo es siempre creciente en todo su dominio.",
    "feedback_incorrect": "", "graph_fn": None, "graph_view": None,
    "explanation": "Regla: para $\\log_b(x)$:\n- $b > 1$ → función **creciente** en $(0, +\\infty)$.\n- $0 < b < 1$ → función **decreciente** en $(0, +\\infty)$.\n\nComo $5 > 1$, $\\log_5(x)$ es estrictamente creciente en todo su dominio. No tiene mínimo ni máximo local.",
    "reviewed": False
  },
  # clsf_40: cotidiano — duplicación de bacterias: lo que se pregunta define la familia
  {
    "external_id": "white_logarithmic_clsf_40",
    "belt": "white", "topic": "logarithmic", "exercise_type": "CLSF",
    "question": "En un experimento, las bacterias se duplican cada hora. Un biólogo calcula cuántas horas hacen falta para que la colonia pase de 100 a 6400 bacterias.\n\n¿A qué familia de funciones pertenece la regla que calcula las horas necesarias?",
    "options": ["Lineal", "Cuadrática", "Exponencial", "Logarítmica"],
    "correct_index": 3, "has_math": True,
    "feedback_correct": "Despejar $t$ de $6400 = 100 \\cdot 2^t$ da $t = \\log_2(64) = 6$ horas: función logarítmica.",
    "feedback_incorrect": "", "graph_fn": None, "graph_view": None,
    "explanation": "$B(t) = 100 \\cdot 2^t$. Para llegar a $6400$:\n$$6400 = 100 \\cdot 2^t \\implies 2^t = 64 = 2^6 \\implies t = 6$$\n\nEl proceso de 'despejar el tiempo' usa un logaritmo. En general, cuántas horas para llegar a $N$ es:\n$$t = \\log_2(N/100)$$\nEsa función de $N$ es logarítmica.",
    "reviewed": False
  },
  # clsf_41: desde gráfico — log₂(x-1) con asíntota x=1
  {
    "external_id": "white_logarithmic_clsf_41",
    "belt": "white", "topic": "logarithmic", "exercise_type": "CLSF",
    "question": "La gráfica muestra una función creciente definida para $x > 1$, con asíntota vertical en $x = 1$.\n\n¿A qué familia pertenece esta gráfica?",
    "options": ["Lineal", "Exponencial", "Logarítmica", "Racional"],
    "correct_index": 2, "has_math": True,
    "feedback_correct": "Asíntota vertical en $x = 1$ y dominio $(1, +\\infty)$: es una logarítmica desplazada.",
    "feedback_incorrect": "", "graph_fn": "log2(x - 1)", "graph_view": [0.5, 9.5, -3, 4],
    "explanation": "La curva tiene asíntota vertical en $x = 1$ y solo existe para $x > 1$.\n\nEsto corresponde a $\\log_b(x - 1)$ para alguna base $b > 1$: la traslación $-1$ en el argumento mueve la asíntota de $x = 0$ a $x = 1$.",
    "reviewed": False
  },
  # clsf_42: distinción exponencial vs logarítmica: asíntota
  {
    "external_id": "white_logarithmic_clsf_42",
    "belt": "white", "topic": "logarithmic", "exercise_type": "CLSF",
    "question": "¿Cuál es la diferencia clave entre una función exponencial y una logarítmica, en cuanto a su asíntota?",
    "options": [
      "La exponencial tiene asíntota vertical; la logarítmica tiene asíntota horizontal",
      "Ambas tienen asíntota horizontal en $y = 0$",
      "La exponencial tiene asíntota horizontal; la logarítmica tiene asíntota vertical",
      "Ninguna tiene asíntota"
    ],
    "correct_index": 2, "has_math": True,
    "feedback_correct": "Exponencial → asíntota horizontal ($y = 0$). Logarítmica → asíntota vertical ($x = 0$).",
    "feedback_incorrect": "", "graph_fn": None, "graph_view": None,
    "explanation": "Son funciones inversas, y sus asíntotas también 'se invierten':\n\n- Exponencial $b^x$: asíntota **horizontal** en $y = 0$ (dominio $\\mathbb{R}$, imagen $(0,+\\infty)$).\n- Logarítmica $\\log_b(x)$: asíntota **vertical** en $x = 0$ (dominio $(0,+\\infty)$, imagen $\\mathbb{R}$).\n\nEsta distinción es la señal visual más rápida para diferenciarlas en una gráfica.",
    "reviewed": False
  },
  # clsf_43: log(3x) es logarítmica
  {
    "external_id": "white_logarithmic_clsf_43",
    "belt": "white", "topic": "logarithmic", "exercise_type": "CLSF",
    "question": "¿A qué familia pertenece $f(x) = \\log(3x)$?",
    "options": ["Lineal", "Exponencial", "Logarítmica", "Racional"],
    "correct_index": 2, "has_math": True,
    "feedback_correct": "$\\log(3x) = \\log(3) + \\log(x)$: sigue siendo una función logarítmica.",
    "feedback_incorrect": "", "graph_fn": None, "graph_view": None,
    "explanation": "$f(x) = \\log(3x)$ es **logarítmica**: la operación central es el logaritmo de $x$.\n\nPor la propiedad del producto: $\\log(3x) = \\log(3) + \\log(x)$. Esto muestra que $f$ es simplemente $\\log(x)$ desplazada verticalmente en $\\log(3)$ — la forma de la curva es idéntica.",
    "reviewed": False
  },
  # clsf_44: desde gráfico decreciente — -log2(x) con ln scale
  {
    "external_id": "white_logarithmic_clsf_44",
    "belt": "white", "topic": "logarithmic", "exercise_type": "CLSF",
    "question": "La gráfica muestra una función definida para $x > 0$, decreciente, con asíntota vertical en $x = 0$ y que pasa por el punto $(1,\\, 0)$.\n\n¿A qué familia pertenece esta gráfica?",
    "options": ["Racional", "Lineal", "Exponencial", "Logarítmica"],
    "correct_index": 3, "has_math": True,
    "feedback_correct": "Una curva decreciente con asíntota vertical en $x = 0$ y paso por $(1,0)$ es una logarítmica negada o con base $< 1$.",
    "feedback_incorrect": "", "graph_fn": "log(x)/log(0.5)", "graph_view": [-0.5, 8.5, -4, 4],
    "explanation": "La curva tiene las características de una función logarítmica:\n- Asíntota vertical en $x = 0$.\n- Dominio $(0, +\\infty)$.\n- Pasa por $(1, 0)$.\n\nEl hecho de que sea **decreciente** indica que la base es $0 < b < 1$ (como $\\log_{0{,}5}(x)$) o que se trata de un logaritmo negado ($-\\log_2(x)$).",
    "reviewed": False
  },
  # clsf_45: cotidiano — cuántos períodos para triplicar la inversión
  {
    "external_id": "white_logarithmic_clsf_45",
    "belt": "white", "topic": "logarithmic", "exercise_type": "CLSF",
    "question": "Una inversión crece un 12% anual. Se calcula cuántos años se necesitan para que el capital se triplique.\n\n¿A qué familia pertenece la función que calcula los años en función de la tasa $r$?",
    "options": ["Exponencial", "Cuadrática", "Logarítmica", "Lineal"],
    "correct_index": 2, "has_math": True,
    "feedback_correct": "Despejar $t$ de $(1+r)^t = 3$ da $t = \\log_{1+r}(3) = \\ln(3)/\\ln(1+r)$: función logarítmica.",
    "feedback_incorrect": "", "graph_fn": None, "graph_view": None,
    "explanation": "Para triplicar: $(1 + r)^t = 3$. Despejando:\n$$t = \\log_{1+r}(3) = \\frac{\\ln(3)}{\\ln(1+r)}$$\n\nEsta función de $r$ es logarítmica. A mayor tasa $r$, menos años se necesitan — la función decrece, lo cual es coherente con que $\\ln(1+r)$ crece.",
    "reviewed": False
  },
  # clsf_46: dominio de log(2x-4)
  {
    "external_id": "white_logarithmic_clsf_46",
    "belt": "white", "topic": "logarithmic", "exercise_type": "CLSF",
    "question": "¿Cuál es el dominio de $f(x) = \\log(2x - 4)$?",
    "options": ["$x > 4$", "$x > 0$", "$x > 2$", "$x > -2$"],
    "correct_index": 2, "has_math": True,
    "feedback_correct": "Se necesita $2x - 4 > 0$, es decir $x > 2$. Dominio: $(2, +\\infty)$.",
    "feedback_incorrect": "", "graph_fn": None, "graph_view": None,
    "explanation": "El argumento debe ser positivo:\n$$2x - 4 > 0 \\implies 2x > 4 \\implies x > 2$$\n\nDominio: $(2, +\\infty)$. Asíntota vertical: $x = 2$.\n\nNo confundir con $x > 4$: ese sería el dominio de $\\log(x - 4)$, no de $\\log(2x - 4)$.",
    "reviewed": False
  },
  # clsf_47: la logarítmica no puede ser la función que da el monto a futuro
  {
    "external_id": "white_logarithmic_clsf_47",
    "belt": "white", "topic": "logarithmic", "exercise_type": "CLSF",
    "question": "¿Cuál de estas situaciones modela una función logarítmica (no exponencial)?",
    "options": [
      "El monto de una deuda que crece un 5% mensual, en función de los meses",
      "La cantidad de bacterias que se duplican por hora, en función de las horas",
      "Los años necesarios para que una colonia de bacterias cuadruplique su tamaño",
      "El precio de un auto que se deprecia un 10% anual, en función de los años"
    ],
    "correct_index": 2, "has_math": True,
    "feedback_correct": "Calcular cuántos años (tiempo) se necesitan es la inversa de la función exponencial: logarítmica.",
    "feedback_incorrect": "", "graph_fn": None, "graph_view": None,
    "explanation": "Las opciones 1, 2 y 4 describen cómo varía una **cantidad** a lo largo del **tiempo** → funciones exponenciales.\n\nLa opción 3 pregunta por el **tiempo** necesario para llegar a cierta **cantidad** → inversa de la exponencial → función **logarítmica**.\n\nClave: cuando la incógnita pasa del tiempo a la cantidad (o viceversa), la familia de función cambia.",
    "reviewed": False
  },
  # clsf_48: imagen de log₂(x-3) sigue siendo ℝ
  {
    "external_id": "white_logarithmic_clsf_48",
    "belt": "white", "topic": "logarithmic", "exercise_type": "CLSF",
    "question": "¿Cuál es la imagen de $f(x) = \\log_2(x - 3)$?",
    "options": ["$(3, +\\infty)$", "$(0, +\\infty)$", "$(−3, +\\infty)$", "$\\mathbb{R}$"],
    "correct_index": 3, "has_math": True,
    "feedback_correct": "Desplazar horizontalmente el argumento no cambia la imagen: sigue siendo $\\mathbb{R}$.",
    "feedback_incorrect": "", "graph_fn": None, "graph_view": None,
    "explanation": "El desplazamiento horizontal $-3$ cambia el **dominio** (que pasa a ser $(3, +\\infty)$), pero no cambia la imagen.\n\nComo $x - 3$ toma cualquier valor positivo cuando $x > 3$, y $\\log_2$ de cualquier positivo da cualquier real, la imagen sigue siendo $\\mathbb{R}$.\n\nNo confundir dominio con imagen: $(3, +\\infty)$ es el dominio, no la imagen.",
    "reviewed": False
  },
  # clsf_49: la logarítmica no tiene máximo ni mínimo global (imagen ilimitada)
  {
    "external_id": "white_logarithmic_clsf_49",
    "belt": "white", "topic": "logarithmic", "exercise_type": "CLSF",
    "question": "¿Tiene $f(x) = \\ln(x)$ un valor máximo en su dominio $(0, +\\infty)$?",
    "options": [
      "Sí, el máximo es $1$ alcanzado en $x = e$",
      "Sí, el máximo es $0$ alcanzado en $x = 1$",
      "No, $\\ln(x)$ crece sin límite: no tiene máximo",
      "Sí, el máximo es $e$ alcanzado en $x = e^e$"
    ],
    "correct_index": 2, "has_math": True,
    "feedback_correct": "$\\ln(x) \\to +\\infty$ cuando $x \\to +\\infty$: la función no tiene máximo.",
    "feedback_incorrect": "", "graph_fn": None, "graph_view": None,
    "explanation": "$\\ln(x)$ es creciente y no está acotada superiormente:\n$$\\lim_{x \\to +\\infty} \\ln(x) = +\\infty$$\n\nPor eso no tiene máximo en su dominio. Tampoco tiene mínimo, porque:\n$$\\lim_{x \\to 0^+} \\ln(x) = -\\infty$$\n\nLa imagen $\\mathbb{R}$ confirma que no hay cota.",
    "reviewed": False
  },
  # clsf_50: identificar logarítmica entre varias opciones de fórmula
  {
    "external_id": "white_logarithmic_clsf_50",
    "belt": "white", "topic": "logarithmic", "exercise_type": "CLSF",
    "question": "¿Cuál de estas funciones es logarítmica?",
    "options": [
      "$f(x) = 5^x + 1$",
      "$f(x) = x^5 - 3x$",
      "$f(x) = \\log_5(x + 1)$",
      "$f(x) = \\dfrac{5}{x + 1}$"
    ],
    "correct_index": 2, "has_math": True,
    "feedback_correct": "$f(x) = \\log_5(x + 1)$ usa el logaritmo de $x$: es una función logarítmica.",
    "feedback_incorrect": "", "graph_fn": None, "graph_view": None,
    "explanation": "Identificamos cada función:\n- $5^x + 1$: la variable está en el **exponente** → exponencial.\n- $x^5 - 3x$: la variable está en la **base** de una potencia con exponente fijo → polinómica.\n- $\\log_5(x + 1)$: la variable está **dentro del logaritmo** → logarítmica ✓\n- $\\frac{5}{x+1}$: la variable está en el **denominador** → racional.",
    "reviewed": False
  },
]

exercises.extend(new_clsf)
print(f"CLSF added: {len(new_clsf)} (total: {len(exercises)})")

with open(PATH, "w", encoding="utf-8") as f:
    json.dump(exercises, f, ensure_ascii=False, indent=2)
    f.write("\n")
print("OK")
