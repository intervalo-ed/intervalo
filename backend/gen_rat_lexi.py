# gen_rat_lexi.py — agrega lexi_12..50 a white_rational.json
import json, pathlib

FILE = pathlib.Path("content/analisis-1/exercises/white_rational.json")
data = json.loads(FILE.read_text(encoding="utf-8"))

new_exercises = [
  {
    "external_id": "white_rational_lexi_12",
    "belt": "white", "topic": "rational", "exercise_type": "LEXI",
    "question": "Si en $f(x) = \\dfrac{1}{x-3}$ el denominador se anula en $x = 3$, ¿qué pasa en ese punto?",
    "options": [
      "La función no está definida en $x = 3$",
      "La función vale cero en $x = 3$",
      "La función alcanza su máximo en $x = 3$",
      "La función es continua en $x = 3$"
    ],
    "correct_index": 0,
    "has_math": True,
    "feedback_correct": "Donde el denominador vale cero, la función no está definida: hay una asíntota vertical.",
    "feedback_incorrect": "",
    "graph_fn": None, "graph_view": None,
    "explanation": "En $f(x)=\\frac{1}{x-3}$, cuando $x=3$ el denominador vale cero. No se puede dividir por cero, así que la función **no está definida** en $x=3$. En la gráfica aparece una asíntota vertical en ese punto.",
    "reviewed": False
  },
  {
    "external_id": "white_rational_lexi_13",
    "belt": "white", "topic": "rational", "exercise_type": "LEXI",
    "question": "¿Cuál es la imagen (rango) de $f(x) = \\dfrac{1}{x}$?",
    "options": [
      "$\\mathbb{R} \\setminus \\{0\\}$ (todos los reales salvo el cero)",
      "$(0, +\\infty)$ (solo positivos)",
      "$\\mathbb{R}$ (todos los reales)",
      "$[-1, 1]$"
    ],
    "correct_index": 0,
    "has_math": True,
    "feedback_correct": "$\\frac{1}{x}$ puede tomar cualquier valor real excepto cero: nunca llega a cero pero sí es positiva o negativa.",
    "feedback_incorrect": "",
    "graph_fn": None, "graph_view": None,
    "explanation": "$f(x)=\\frac{1}{x}$ toma valores positivos cuando $x>0$ y negativos cuando $x<0$, pero nunca vale $0$ porque $\\frac{1}{x}=0$ no tiene solución. La imagen es $\\mathbb{R}\\setminus\\{0\\}$.",
    "reviewed": False
  },
  {
    "external_id": "white_rational_lexi_14",
    "belt": "white", "topic": "rational", "exercise_type": "LEXI",
    "question": "¿Qué determina la asíntota horizontal de $f(x) = \\dfrac{P(x)}{Q(x)}$ cuando el grado de $P$ es igual al grado de $Q$?",
    "options": [
      "El cociente de los coeficientes principales de $P$ y $Q$",
      "La raíz del denominador",
      "Siempre es $y = 0$",
      "Siempre es $y = 1$"
    ],
    "correct_index": 0,
    "has_math": True,
    "feedback_correct": "Cuando los grados son iguales, la asíntota horizontal es el cociente de los coeficientes principales.",
    "feedback_incorrect": "",
    "graph_fn": None, "graph_view": None,
    "explanation": "Cuando $\\deg(P)=\\deg(Q)$, al dividir entre los términos de mayor grado, el cociente tiende al cociente de los coeficientes principales: $f(x)\\to\\frac{a_n}{b_n}$ cuando $x\\to\\pm\\infty$. Esa es la AH.",
    "reviewed": False
  },
  {
    "external_id": "white_rational_lexi_15",
    "belt": "white", "topic": "rational", "exercise_type": "LEXI",
    "question": "¿Qué es la asíntota horizontal de $f(x) = \\dfrac{2x + 1}{x - 3}$?",
    "options": [
      "$y = 2$",
      "$y = 1$",
      "$y = 3$",
      "$y = 0$"
    ],
    "correct_index": 0,
    "has_math": True,
    "feedback_correct": "Los coeficientes principales son $2$ (numerador) y $1$ (denominador): AH en $y = 2$.",
    "feedback_incorrect": "",
    "graph_fn": None, "graph_view": None,
    "explanation": "Numerador y denominador tienen el mismo grado (grado 1). La AH es el cociente de coeficientes principales: $\\frac{2}{1}=2$. Cuando $x$ crece mucho, $\\frac{2x+1}{x-3}\\approx\\frac{2x}{x}=2$.",
    "reviewed": False
  },
  {
    "external_id": "white_rational_lexi_16",
    "belt": "white", "topic": "rational", "exercise_type": "LEXI",
    "question": "Si el grado del numerador es **menor** que el grado del denominador en $f(x) = \\dfrac{P(x)}{Q(x)}$, ¿cuál es la asíntota horizontal?",
    "options": [
      "$y = 0$",
      "$y = 1$",
      "No tiene asíntota horizontal",
      "$y = \\infty$"
    ],
    "correct_index": 0,
    "has_math": True,
    "feedback_correct": "Cuando el grado del numerador es menor, la función tiende a cero al alejarse: AH en $y = 0$.",
    "feedback_incorrect": "",
    "graph_fn": None, "graph_view": None,
    "explanation": "Si $\\deg(P)<\\deg(Q)$, para $x$ muy grande el denominador 'domina': la fracción se hace cada vez más pequeña y tiende a $0$. La AH es $y=0$. Ejemplo: $\\frac{1}{x}\\to0$, $\\frac{x}{x^2}=\\frac{1}{x}\\to0$.",
    "reviewed": False
  },
  {
    "external_id": "white_rational_lexi_17",
    "belt": "white", "topic": "rational", "exercise_type": "LEXI",
    "question": "¿Puede una función racional NO tener asíntota vertical?",
    "options": [
      "Sí, si el denominador no tiene raíces reales",
      "No, toda racional tiene al menos una asíntota vertical",
      "Solo si el numerador es constante",
      "Solo si el denominador tiene grado mayor que 2"
    ],
    "correct_index": 0,
    "has_math": True,
    "feedback_correct": "Si el denominador no tiene raíces reales, no hay valores excluidos del dominio y no hay asíntotas verticales.",
    "feedback_incorrect": "",
    "graph_fn": None, "graph_view": None,
    "explanation": "Ejemplo: $f(x)=\\frac{1}{x^2+1}$. El denominador $x^2+1\\geq1>0$ nunca vale cero. No hay valores excluidos del dominio y **no hay asíntota vertical**. La imagen queda acotada en $(0,1]$.",
    "reviewed": False
  },
  {
    "external_id": "white_rational_lexi_18",
    "belt": "white", "topic": "rational", "exercise_type": "LEXI",
    "question": "¿Qué es un 'agujero' (hole) en una función racional?",
    "options": [
      "Un punto donde la función no está definida pero el límite existe",
      "Una asíntota vertical",
      "Un punto donde la función vale cero",
      "Una asíntota horizontal"
    ],
    "correct_index": 0,
    "has_math": True,
    "feedback_correct": "Un agujero es una discontinuidad evitable: hay un factor que se cancela, así que el límite existe pero el punto no.",
    "feedback_incorrect": "",
    "graph_fn": None, "graph_view": None,
    "explanation": "En $\\frac{(x-2)(x+1)}{x-2}$ el factor $(x-2)$ se cancela. El resultado es $x+1$ **salvo en $x=2$**, donde la función no está definida. En la gráfica aparece un pequeño hueco (agujero) en $x=2$ en vez de una asíntota.",
    "reviewed": False
  },
  {
    "external_id": "white_rational_lexi_19",
    "belt": "white", "topic": "rational", "exercise_type": "LEXI",
    "question": "¿Cuál es el intercepto con el eje $Y$ de $f(x) = \\dfrac{x + 3}{x - 1}$?",
    "options": [
      "$f(0) = -3$",
      "$f(0) = 3$",
      "No existe porque el denominador es cero en $x = 0$",
      "$f(0) = 1$"
    ],
    "correct_index": 0,
    "has_math": True,
    "feedback_correct": "$f(0) = \\frac{0+3}{0-1} = \\frac{3}{-1} = -3$.",
    "feedback_incorrect": "",
    "graph_fn": None, "graph_view": None,
    "explanation": "El intercepto con el eje $Y$ se calcula evaluando $f(0)$: $\\frac{0+3}{0-1}=\\frac{3}{-1}=-3$. Solo no existe si $x=0$ excluye el dominio (denominador=0 en $x=0$).",
    "reviewed": False
  },
  {
    "external_id": "white_rational_lexi_20",
    "belt": "white", "topic": "rational", "exercise_type": "LEXI",
    "question": "¿Cuándo existe el intercepto con el eje $Y$ de una función racional?",
    "options": [
      "Cuando $x = 0$ pertenece al dominio (el denominador no se anula en $x = 0$)",
      "Siempre existe para cualquier racional",
      "Solo si el numerador es constante",
      "Nunca, porque el eje $Y$ es una asíntota"
    ],
    "correct_index": 0,
    "has_math": True,
    "feedback_correct": "El intercepto con el eje $Y$ es $f(0)$, que existe solo si $0$ está en el dominio.",
    "feedback_incorrect": "",
    "graph_fn": None, "graph_view": None,
    "explanation": "Si el denominador se anula en $x=0$, entonces $f(0)$ no existe: no hay intercepto con el eje $Y$. Ejemplo: $f(x)=\\frac{1}{x}$ no cruza el eje $Y$ (tiene AV ahí). Pero $f(x)=\\frac{x+1}{x-2}$ sí lo hace: $f(0)=\\frac{1}{-2}=-\\frac{1}{2}$.",
    "reviewed": False
  },
  {
    "external_id": "white_rational_lexi_21",
    "belt": "white", "topic": "rational", "exercise_type": "LEXI",
    "question": "¿Cómo se encuentran los interceptos con el eje $X$ de $f(x) = \\dfrac{P(x)}{Q(x)}$?",
    "options": [
      "Resolviendo $P(x) = 0$ con $Q(x) \\neq 0$",
      "Resolviendo $Q(x) = 0$",
      "Evaluando $f(0)$",
      "No existen en funciones racionales"
    ],
    "correct_index": 0,
    "has_math": True,
    "feedback_correct": "Los ceros de la función son donde el numerador vale cero (y el denominador no).",
    "feedback_incorrect": "",
    "graph_fn": None, "graph_view": None,
    "explanation": "Una fracción vale cero cuando el **numerador** es cero (y el denominador no). En $f(x)=\\frac{P(x)}{Q(x)}$, los ceros son las raíces de $P(x)=0$ que no sean también raíces de $Q(x)$.",
    "reviewed": False
  },
  {
    "external_id": "white_rational_lexi_22",
    "belt": "white", "topic": "rational", "exercise_type": "LEXI",
    "question": "¿Cuál es el intercepto con el eje $X$ de $f(x) = \\dfrac{x - 4}{x + 2}$?",
    "options": [
      "$x = 4$",
      "$x = -2$",
      "$x = 2$",
      "No tiene intercepto con el eje $X$"
    ],
    "correct_index": 0,
    "has_math": True,
    "feedback_correct": "$f(x)=0$ cuando $x-4=0$, es decir $x=4$ (y el denominador $4+2=6\\neq0$).",
    "feedback_incorrect": "",
    "graph_fn": None, "graph_view": None,
    "explanation": "Igualamos el numerador a cero: $x-4=0\\Rightarrow x=4$. Verificamos que el denominador no sea cero ahí: $4+2=6\\neq0$. Por lo tanto, $x=4$ es el único cero de $f$.",
    "reviewed": False
  },
  {
    "external_id": "white_rational_lexi_23",
    "belt": "white", "topic": "rational", "exercise_type": "LEXI",
    "question": "¿Es $f(x) = \\dfrac{1}{x}$ una función par, impar o ninguna?",
    "options": [
      "Impar, porque $f(-x) = -f(x)$",
      "Par, porque $f(-x) = f(x)$",
      "Ninguna de las dos",
      "Depende del intervalo"
    ],
    "correct_index": 0,
    "has_math": True,
    "feedback_correct": "$f(-x) = \\frac{1}{-x} = -\\frac{1}{x} = -f(x)$: la función es impar.",
    "feedback_incorrect": "",
    "graph_fn": None, "graph_view": None,
    "explanation": "$f(-x)=\\frac{1}{-x}=-\\frac{1}{x}=-f(x)$. Como $f(-x)=-f(x)$, la función es **impar**. Esto se refleja en la simetría de la hipérbola respecto al origen.",
    "reviewed": False
  },
  {
    "external_id": "white_rational_lexi_24",
    "belt": "white", "topic": "rational", "exercise_type": "LEXI",
    "question": "¿Puede una función racional cruzar su propia asíntota horizontal?",
    "options": [
      "Sí, la asíntota horizontal puede cruzarse (a diferencia de la vertical)",
      "No, las asíntotas nunca se cruzan con la función",
      "Solo si la función tiene dos asíntotas verticales",
      "Solo si el numerador tiene grado mayor que el denominador"
    ],
    "correct_index": 0,
    "has_math": True,
    "feedback_correct": "La asíntota horizontal describe el comportamiento en el infinito, pero cerca del origen la función puede cruzarla.",
    "feedback_incorrect": "",
    "graph_fn": None, "graph_view": None,
    "explanation": "La **asíntota horizontal** solo describe el comportamiento cuando $x\\to\\pm\\infty$: la función puede cruzar la AH para valores finitos de $x$. La **asíntota vertical**, en cambio, nunca puede cruzarse porque la función no está definida allí.",
    "reviewed": False
  },
  {
    "external_id": "white_rational_lexi_25",
    "belt": "white", "topic": "rational", "exercise_type": "LEXI",
    "question": "¿Qué diferencia hay entre una asíntota vertical y un agujero?",
    "options": [
      "En la AV el factor del denominador no se cancela; en el agujero sí se cancela con el numerador",
      "Son lo mismo: ambos excluyen un punto del dominio",
      "La AV aparece en $x = 0$ y el agujero en otro punto",
      "Solo las funciones cuadráticas tienen agujeros"
    ],
    "correct_index": 0,
    "has_math": True,
    "feedback_correct": "Si el factor se cancela → agujero (discontinuidad evitable). Si no se cancela → asíntota vertical.",
    "feedback_incorrect": "",
    "graph_fn": None, "graph_view": None,
    "explanation": "Ambos excluyen un punto del dominio, pero tienen naturaleza distinta. En un **agujero** (p.ej. $\\frac{(x-2)(x+1)}{x-2}$), el factor problemático se cancela y la función se puede 'reparar'. En una **AV** (p.ej. $\\frac{1}{x-2}$), el factor no se cancela y la función explota en ese punto.",
    "reviewed": False
  },
  {
    "external_id": "white_rational_lexi_26",
    "belt": "white", "topic": "rational", "exercise_type": "LEXI",
    "question": "¿Qué le pasa a $f(x) = \\dfrac{1}{x-2}$ cuando $x$ se acerca a $2$ desde la derecha ($x \\to 2^+$)?",
    "options": [
      "La función tiende a $+\\infty$",
      "La función tiende a $-\\infty$",
      "La función tiende a $0$",
      "La función tiende a $2$"
    ],
    "correct_index": 0,
    "has_math": True,
    "feedback_correct": "Cuando $x>2$ y se acerca a $2$, el denominador $x-2>0$ tiende a $0^+$, así que la fracción tiende a $+\\infty$.",
    "feedback_incorrect": "",
    "graph_fn": None, "graph_view": None,
    "explanation": "Si $x\\to2^+$ (desde la derecha), $x-2\\to0^+$ (positivo y muy pequeño). La fracción $\\frac{1}{x-2}\\to+\\infty$. Esto explica la rama que sube en la gráfica a la derecha de la asíntota vertical.",
    "reviewed": False
  },
  {
    "external_id": "white_rational_lexi_27",
    "belt": "white", "topic": "rational", "exercise_type": "LEXI",
    "question": "¿Qué le pasa a $f(x) = \\dfrac{1}{x-2}$ cuando $x$ se acerca a $2$ desde la izquierda ($x \\to 2^-$)?",
    "options": [
      "La función tiende a $-\\infty$",
      "La función tiende a $+\\infty$",
      "La función tiende a $0$",
      "La función tiende a $1$"
    ],
    "correct_index": 0,
    "has_math": True,
    "feedback_correct": "Cuando $x<2$ y se acerca a $2$, el denominador $x-2<0$ tiende a $0^-$, así que la fracción tiende a $-\\infty$.",
    "feedback_incorrect": "",
    "graph_fn": None, "graph_view": None,
    "explanation": "Si $x\\to2^-$ (desde la izquierda), $x-2\\to0^-$ (negativo y muy pequeño en valor absoluto). La fracción $\\frac{1}{x-2}\\to-\\infty$. La rama izquierda de la gráfica baja sin límite.",
    "reviewed": False
  },
  {
    "external_id": "white_rational_lexi_28",
    "belt": "white", "topic": "rational", "exercise_type": "LEXI",
    "question": "¿Tiene extremos locales $f(x) = \\dfrac{1}{x}$?",
    "options": [
      "No, la función decrece estrictamente en cada rama sin alcanzar máximos ni mínimos",
      "Sí, tiene un mínimo en $x = 1$",
      "Sí, tiene un máximo en $x = -1$",
      "Sí, tiene un máximo global en $y = 1$"
    ],
    "correct_index": 0,
    "has_math": True,
    "feedback_correct": "$f(x) = 1/x$ es estrictamente decreciente en cada rama: no tiene máximos ni mínimos locales.",
    "feedback_incorrect": "",
    "graph_fn": None, "graph_view": None,
    "explanation": "$f(x)=\\frac{1}{x}$ decrece en cada uno de los dos tramos de su dominio. No alcanza ningún valor máximo ni mínimo: en $(0,+\\infty)$ los valores van de $+\\infty$ hasta $0^+$, y en $(-\\infty,0)$ de $0^-$ hasta $-\\infty$. No hay extremos locales.",
    "reviewed": False
  },
  {
    "external_id": "white_rational_lexi_29",
    "belt": "white", "topic": "rational", "exercise_type": "LEXI",
    "question": "¿Cuál es el dominio de $f(x) = \\dfrac{x^2 - 1}{(x-1)(x+3)}$?",
    "options": [
      "$\\mathbb{R} \\setminus \\{-3,\\, 1\\}$",
      "$\\mathbb{R} \\setminus \\{1\\}$",
      "$\\mathbb{R} \\setminus \\{-3\\}$",
      "$\\mathbb{R}$"
    ],
    "correct_index": 0,
    "has_math": True,
    "feedback_correct": "El denominador $(x-1)(x+3)$ se anula en $x=1$ y $x=-3$: ambos quedan excluidos.",
    "feedback_incorrect": "",
    "graph_fn": None, "graph_view": None,
    "explanation": "El dominio excluye los ceros del denominador: $(x-1)(x+3)=0$ cuando $x=1$ o $x=-3$. Aunque el numerador $x^2-1=(x-1)(x+1)$ también se anule en $x=1$, eso solo crea un agujero, no amplía el dominio. Ambos valores siguen excluidos.",
    "reviewed": False
  },
  {
    "external_id": "white_rational_lexi_30",
    "belt": "white", "topic": "rational", "exercise_type": "LEXI",
    "question": "¿Qué transformación produce $f(x) = \\dfrac{1}{x-3}$ respecto a $g(x) = \\dfrac{1}{x}$?",
    "options": [
      "Desplazamiento horizontal de 3 unidades a la derecha",
      "Desplazamiento vertical de 3 unidades hacia arriba",
      "Reflexión respecto al eje $Y$",
      "Estiramiento vertical por factor 3"
    ],
    "correct_index": 0,
    "has_math": True,
    "feedback_correct": "Reemplazar $x$ por $x-3$ desplaza la curva 3 unidades a la derecha.",
    "feedback_incorrect": "",
    "graph_fn": None, "graph_view": None,
    "explanation": "Pasar de $g(x)=\\frac{1}{x}$ a $f(x)=\\frac{1}{x-3}$ es un **desplazamiento horizontal de 3 unidades a la derecha**: la asíntota vertical se mueve de $x=0$ a $x=3$, y toda la curva se traslada 3 unidades.",
    "reviewed": False
  },
  {
    "external_id": "white_rational_lexi_31",
    "belt": "white", "topic": "rational", "exercise_type": "LEXI",
    "question": "¿Qué transformación produce $f(x) = \\dfrac{1}{x} + 2$ respecto a $g(x) = \\dfrac{1}{x}$?",
    "options": [
      "Desplazamiento vertical de 2 unidades hacia arriba",
      "Desplazamiento horizontal de 2 unidades a la derecha",
      "Estiramiento vertical por factor 2",
      "Reflexión respecto al eje $X$"
    ],
    "correct_index": 0,
    "has_math": True,
    "feedback_correct": "Sumar 2 al valor de la función desplaza toda la curva 2 unidades hacia arriba.",
    "feedback_incorrect": "",
    "graph_fn": None, "graph_view": None,
    "explanation": "Agregar $+2$ fuera de la fracción desplaza la gráfica **2 unidades hacia arriba**: la asíntota horizontal pasa de $y=0$ a $y=2$, y la asíntota vertical sigue en $x=0$.",
    "reviewed": False
  },
  {
    "external_id": "white_rational_lexi_32",
    "belt": "white", "topic": "rational", "exercise_type": "LEXI",
    "question": "¿Qué produce el signo negativo en $f(x) = -\\dfrac{1}{x}$ respecto a $g(x) = \\dfrac{1}{x}$?",
    "options": [
      "Reflexión respecto al eje $X$: la curva queda invertida",
      "Reflexión respecto al eje $Y$",
      "Desplazamiento vertical de $-1$",
      "Ningún cambio visible"
    ],
    "correct_index": 0,
    "has_math": True,
    "feedback_correct": "Multiplicar por $-1$ refleja la curva respecto al eje $X$: las ramas pasan al 2.° y 4.° cuadrantes.",
    "feedback_incorrect": "",
    "graph_fn": None, "graph_view": None,
    "explanation": "En $g(x)=\\frac{1}{x}$ las ramas están en el 1.° y 3.° cuadrante. En $f(x)=-\\frac{1}{x}$, el signo negativo refleja la curva respecto al eje $X$: las ramas pasan al 2.° y 4.° cuadrante.",
    "reviewed": False
  },
  {
    "external_id": "white_rational_lexi_33",
    "belt": "white", "topic": "rational", "exercise_type": "LEXI",
    "question": "¿Cuántas asíntotas verticales tiene $f(x) = \\dfrac{x^2 + 1}{x^3 - x}$?",
    "options": [
      "3 (en $x = 0$, $x = 1$ y $x = -1$)",
      "1 (en $x = 0$)",
      "2 (en $x = 1$ y $x = -1$)",
      "Ninguna"
    ],
    "correct_index": 0,
    "has_math": True,
    "feedback_correct": "$x^3 - x = x(x-1)(x+1)$ tiene 3 raíces: $x=0$, $x=1$ y $x=-1$.",
    "feedback_incorrect": "",
    "graph_fn": None, "graph_view": None,
    "explanation": "Factorizamos el denominador: $x^3-x=x(x^2-1)=x(x-1)(x+1)$. Hay tres raíces: $x=0$, $x=1$, $x=-1$. El numerador $x^2+1$ no se anula en esos puntos. Resultado: **3 asíntotas verticales**.",
    "reviewed": False
  },
  {
    "external_id": "white_rational_lexi_34",
    "belt": "white", "topic": "rational", "exercise_type": "LEXI",
    "question": "¿Cuándo NO tiene asíntota horizontal $f(x) = \\dfrac{P(x)}{Q(x)}$?",
    "options": [
      "Cuando el grado del numerador es mayor que el del denominador",
      "Cuando el grado del numerador es menor que el del denominador",
      "Cuando los grados son iguales",
      "Siempre tiene asíntota horizontal"
    ],
    "correct_index": 0,
    "has_math": True,
    "feedback_correct": "Si $\\deg(P) > \\deg(Q)$, la función crece sin límite y no hay AH (puede haber asíntota oblicua).",
    "feedback_incorrect": "",
    "graph_fn": None, "graph_view": None,
    "explanation": "Si el numerador tiene mayor grado, la función crece (o decrece) sin cota cuando $x\\to\\pm\\infty$: **no hay AH**. En cambio, puede existir una asíntota **oblicua** cuando $\\deg(P)=\\deg(Q)+1$.",
    "reviewed": False
  },
  {
    "external_id": "white_rational_lexi_35",
    "belt": "white", "topic": "rational", "exercise_type": "LEXI",
    "question": "¿Cuál es la asíntota oblicua de $f(x) = \\dfrac{x^2 + 1}{x}$?",
    "options": [
      "$y = x$",
      "$y = x + 1$",
      "$y = 0$",
      "No tiene asíntota oblicua"
    ],
    "correct_index": 0,
    "has_math": True,
    "feedback_correct": "$\\frac{x^2+1}{x} = x + \\frac{1}{x}$: para $x$ grande, el término $\\frac{1}{x}\\to0$ y la función se acerca a $y=x$.",
    "feedback_incorrect": "",
    "graph_fn": None, "graph_view": None,
    "explanation": "Dividiendo: $\\frac{x^2+1}{x}=x+\\frac{1}{x}$. Cuando $x\\to\\pm\\infty$, el resto $\\frac{1}{x}\\to0$, y la función se acerca a la recta $y=x$. Esa recta es la **asíntota oblicua**.",
    "reviewed": False
  },
  {
    "external_id": "white_rational_lexi_36",
    "belt": "white", "topic": "rational", "exercise_type": "LEXI",
    "question": "En $f(x) = \\dfrac{k}{x-a} + b$, ¿cuáles son la asíntota vertical y la asíntota horizontal?",
    "options": [
      "AV: $x = a$ y AH: $y = b$",
      "AV: $x = b$ y AH: $y = a$",
      "AV: $x = k$ y AH: $y = 0$",
      "AV: $x = -a$ y AH: $y = -b$"
    ],
    "correct_index": 0,
    "has_math": True,
    "feedback_correct": "El denominador se anula en $x=a$ y la función tiende a $b$ cuando $x\\to\\pm\\infty$.",
    "feedback_incorrect": "",
    "graph_fn": None, "graph_view": None,
    "explanation": "En $f(x)=\\frac{k}{x-a}+b$: el denominador $x-a=0$ cuando $x=a$ → **AV en $x=a$**. Cuando $x\\to\\pm\\infty$, $\\frac{k}{x-a}\\to0$ y $f\\to b$ → **AH en $y=b$**.",
    "reviewed": False
  },
  {
    "external_id": "white_rational_lexi_37",
    "belt": "white", "topic": "rational", "exercise_type": "LEXI",
    "question": "¿Es $f(x) = \\dfrac{1}{x^2}$ una función par, impar, o ninguna?",
    "options": [
      "Par, porque $f(-x) = f(x)$",
      "Impar, porque $f(-x) = -f(x)$",
      "Ninguna de las dos",
      "Depende del intervalo"
    ],
    "correct_index": 0,
    "has_math": True,
    "feedback_correct": "$f(-x) = \\frac{1}{(-x)^2} = \\frac{1}{x^2} = f(x)$: la función es par.",
    "feedback_incorrect": "",
    "graph_fn": None, "graph_view": None,
    "explanation": "$f(-x)=\\frac{1}{(-x)^2}=\\frac{1}{x^2}=f(x)$. Como $f(-x)=f(x)$, la función es **par**: la gráfica es simétrica respecto al eje $Y$. A diferencia de $\\frac{1}{x}$ (impar), $\\frac{1}{x^2}$ solo tiene valores positivos.",
    "reviewed": False
  },
  {
    "external_id": "white_rational_lexi_38",
    "belt": "white", "topic": "rational", "exercise_type": "LEXI",
    "question": "¿Cuál es la imagen de $f(x) = \\dfrac{k}{x-a} + b$ con $k \\neq 0$?",
    "options": [
      "$\\mathbb{R} \\setminus \\{b\\}$",
      "$\\mathbb{R}$",
      "$(b, +\\infty)$",
      "$\\mathbb{R} \\setminus \\{a\\}$"
    ],
    "correct_index": 0,
    "has_math": True,
    "feedback_correct": "La función puede tomar cualquier valor real salvo $b$, que es la asíntota horizontal.",
    "feedback_incorrect": "",
    "graph_fn": None, "graph_view": None,
    "explanation": "$f(x)=\\frac{k}{x-a}+b$ puede tomar cualquier valor real: para $y\\neq b$, existe siempre un $x$ tal que $f(x)=y$. Pero $f(x)=b$ requeriría $\\frac{k}{x-a}=0$, lo que no tiene solución con $k\\neq0$. La imagen es $\\mathbb{R}\\setminus\\{b\\}$.",
    "reviewed": False
  },
  {
    "external_id": "white_rational_lexi_39",
    "belt": "white", "topic": "rational", "exercise_type": "LEXI",
    "question": "¿Cuál es la diferencia entre el dominio de $f(x) = \\dfrac{1}{x}$ y el de $g(x) = \\dfrac{x-1}{x(x-1)}$?",
    "options": [
      "$g$ tiene dominio $\\mathbb{R}\\setminus\\{0,1\\}$ aunque se simplifique a $\\frac{1}{x}$",
      "Son idénticos: $\\mathbb{R}\\setminus\\{0\\}$",
      "$f$ tiene dominio $\\mathbb{R}\\setminus\\{0,1\\}$ y $g$ tiene $\\mathbb{R}\\setminus\\{0\\}$",
      "$g$ tiene dominio $\\mathbb{R}$ porque el factor se cancela"
    ],
    "correct_index": 0,
    "has_math": True,
    "feedback_correct": "El dominio se determina sobre la expresión original, no la simplificada: $g$ excluye también $x=1$.",
    "feedback_incorrect": "",
    "graph_fn": None, "graph_view": None,
    "explanation": "$g(x)=\\frac{x-1}{x(x-1)}$ tiene denominador $x(x-1)$, que se anula en $x=0$ y $x=1$. Aunque se simplifique a $\\frac{1}{x}$ para $x\\neq1$, el dominio **original** excluye ambos: $\\mathbb{R}\\setminus\\{0,1\\}$. En $x=1$ hay un agujero (no AV).",
    "reviewed": False
  },
  {
    "external_id": "white_rational_lexi_40",
    "belt": "white", "topic": "rational", "exercise_type": "LEXI",
    "question": "¿Cuántas asíntotas verticales puede tener una función racional $f(x) = \\dfrac{P(x)}{Q(x)}$ a lo sumo?",
    "options": [
      "Tantas como el grado de $Q(x)$",
      "Siempre exactamente una",
      "A lo sumo dos",
      "Ninguna: nunca tiene asíntotas verticales"
    ],
    "correct_index": 0,
    "has_math": True,
    "feedback_correct": "El denominador $Q(x)$ puede tener hasta $\\deg(Q)$ raíces reales, cada una generando una asíntota vertical.",
    "feedback_incorrect": "",
    "graph_fn": None, "graph_view": None,
    "explanation": "Cada raíz real del denominador (que no sea cancelada por el numerador) genera una asíntota vertical. Un denominador de grado $n$ puede tener hasta $n$ raíces reales, así que la función puede tener hasta $\\deg(Q)$ asíntotas verticales.",
    "reviewed": False
  },
  {
    "external_id": "white_rational_lexi_41",
    "belt": "white", "topic": "rational", "exercise_type": "LEXI",
    "question": "¿Es una función racional siempre continua en su dominio?",
    "options": [
      "Sí, es continua en todo punto de su dominio (donde está definida)",
      "No, puede tener saltos dentro del dominio",
      "Solo es continua si el numerador es constante",
      "Depende de si la base es racional"
    ],
    "correct_index": 0,
    "has_math": True,
    "feedback_correct": "Las funciones racionales son cocientes de polinomios y son continuas en todos los puntos donde están definidas.",
    "feedback_incorrect": "",
    "graph_fn": None, "graph_view": None,
    "explanation": "Los polinomios son continuos en $\\mathbb{R}$. Un cociente de funciones continuas es continuo siempre que el denominador no sea cero. Por lo tanto, $f(x)=P(x)/Q(x)$ es **continua en todo su dominio**.",
    "reviewed": False
  },
  {
    "external_id": "white_rational_lexi_42",
    "belt": "white", "topic": "rational", "exercise_type": "LEXI",
    "question": "¿Cuándo una función racional tiene asíntota oblicua en vez de horizontal?",
    "options": [
      "Cuando el grado del numerador es exactamente uno más que el grado del denominador",
      "Cuando el grado del denominador es mayor que el del numerador",
      "Cuando los grados del numerador y denominador son iguales",
      "Siempre que tenga más de una asíntota vertical"
    ],
    "correct_index": 0,
    "has_math": True,
    "feedback_correct": "Si $\\deg(P) = \\deg(Q) + 1$, la división da un cociente lineal más un resto: la recta del cociente es la asíntota oblicua.",
    "feedback_incorrect": "",
    "graph_fn": None, "graph_view": None,
    "explanation": "Cuando $\\deg(P)=\\deg(Q)+1$, el resultado de la división polinomial es una expresión lineal $ax+b$ más un residuo que tiende a cero. La función se aproxima a $y=ax+b$: esa es la **asíntota oblicua**.",
    "reviewed": False
  },
  {
    "external_id": "white_rational_lexi_43",
    "belt": "white", "topic": "rational", "exercise_type": "LEXI",
    "question": "¿Qué le pasa a $f(x) = \\dfrac{5}{x}$ cuando $x \\to +\\infty$?",
    "options": [
      "Tiende a $0$ por arriba ($0^+$)",
      "Tiende a $5$",
      "Tiende a $+\\infty$",
      "Tiende a $-\\infty$"
    ],
    "correct_index": 0,
    "has_math": True,
    "feedback_correct": "A medida que $x$ crece, $\\frac{5}{x}$ se hace cada vez más pequeño y positivo: tiende a $0^+$.",
    "feedback_incorrect": "",
    "graph_fn": None, "graph_view": None,
    "explanation": "Cuando $x\\to+\\infty$, el denominador crece sin límite y la fracción $\\frac{5}{x}\\to0^+$ (tiende a cero por valores positivos). En la gráfica, la curva se aplana hacia el eje $X$ a medida que avanza hacia la derecha.",
    "reviewed": False
  },
  {
    "external_id": "white_rational_lexi_44",
    "belt": "white", "topic": "rational", "exercise_type": "LEXI",
    "question": "¿Cuál de estas racionales tiene asíntota horizontal en $y = -2$?",
    "options": [
      "$f(x) = \\dfrac{-2x + 1}{x + 5}$",
      "$f(x) = \\dfrac{1}{x + 2}$",
      "$f(x) = \\dfrac{x - 2}{x}$",
      "$f(x) = \\dfrac{2}{x}$"
    ],
    "correct_index": 0,
    "has_math": True,
    "feedback_correct": "Coeficientes principales: $-2$ (numerador) y $1$ (denominador). AH en $y=-2$.",
    "feedback_incorrect": "",
    "graph_fn": None, "graph_view": None,
    "explanation": "En $f(x)=\\frac{-2x+1}{x+5}$, el cociente de coeficientes principales es $\\frac{-2}{1}=-2$: **AH en $y=-2$**. Los demás: $\\frac{1}{x+2}$ tiene AH en $y=0$; $\\frac{x-2}{x}$ tiene AH en $y=1$; $\\frac{2}{x}$ tiene AH en $y=0$.",
    "reviewed": False
  },
  {
    "external_id": "white_rational_lexi_45",
    "belt": "white", "topic": "rational", "exercise_type": "LEXI",
    "question": "Para $f(x) = \\dfrac{1}{x}$, ¿cuál de estos enunciados es correcto?",
    "options": [
      "Su dominio y su imagen son ambos $\\mathbb{R} \\setminus \\{0\\}$",
      "Su dominio es $\\mathbb{R}$ y su imagen es $\\mathbb{R} \\setminus \\{0\\}$",
      "Su dominio es $\\mathbb{R} \\setminus \\{0\\}$ y su imagen es $\\mathbb{R}$",
      "Su dominio y su imagen son ambos $\\mathbb{R}$"
    ],
    "correct_index": 0,
    "has_math": True,
    "feedback_correct": "$f(x) = 1/x$ no está definida en $x=0$ (dominio) y nunca vale $0$ (imagen).",
    "feedback_incorrect": "",
    "graph_fn": None, "graph_view": None,
    "explanation": "Dominio: excluye $x=0$ (denominador). Imagen: la fracción $\\frac{1}{x}$ no puede ser $0$ (no tiene solución). Tanto el **dominio** como la **imagen** son $\\mathbb{R}\\setminus\\{0\\}$.",
    "reviewed": False
  },
  {
    "external_id": "white_rational_lexi_46",
    "belt": "white", "topic": "rational", "exercise_type": "LEXI",
    "question": "¿Qué efecto tiene multiplicar por $k>1$ en $f(x) = \\dfrac{k}{x}$ respecto a $g(x) = \\dfrac{1}{x}$?",
    "options": [
      "Estira la curva verticalmente: los valores de la función se multiplican por $k$",
      "Desplaza la curva $k$ unidades a la derecha",
      "Refleja la curva respecto al eje $X$",
      "Achica la curva verticalmente"
    ],
    "correct_index": 0,
    "has_math": True,
    "feedback_correct": "Multiplicar por $k$ escala verticalmente: la curva se 'aleja' de las asíntotas en proporción $k$.",
    "feedback_incorrect": "",
    "graph_fn": None, "graph_view": None,
    "explanation": "$f(x)=\\frac{k}{x}=k\\cdot\\frac{1}{x}$: todos los valores de $g(x)$ se multiplican por $k$. Si $k=3$, el punto $(1,1)$ de $g$ pasa a ser $(1,3)$ en $f$. La curva se **estira verticalmente** por factor $k$.",
    "reviewed": False
  },
  {
    "external_id": "white_rational_lexi_47",
    "belt": "white", "topic": "rational", "exercise_type": "LEXI",
    "question": "¿Cuántas raíces reales tiene $f(x) = \\dfrac{x^2 - 4}{x + 1}$?",
    "options": [
      "Dos ($x = 2$ y $x = -2$)",
      "Una sola ($x = 2$)",
      "Ninguna",
      "Tres"
    ],
    "correct_index": 0,
    "has_math": True,
    "feedback_correct": "$x^2-4=0$ da $x=2$ y $x=-2$. Ninguna de las dos anula el denominador $x+1$.",
    "feedback_incorrect": "",
    "graph_fn": None, "graph_view": None,
    "explanation": "Los ceros de $f$ son las raíces del numerador: $x^2-4=(x-2)(x+2)=0\\Rightarrow x=2$ o $x=-2$. El denominador $x+1$ no se anula en ninguno de esos puntos ($2+1=3$ y $-2+1=-1$, ambos $\\neq0$). Hay **dos raíces reales**.",
    "reviewed": False
  },
  {
    "external_id": "white_rational_lexi_48",
    "belt": "white", "topic": "rational", "exercise_type": "LEXI",
    "question": "¿Qué dice el signo del coeficiente principal del numerador sobre las ramas de una racional?",
    "options": [
      "Determina si las ramas van hacia $+\\infty$ o $-\\infty$ cuando $x \\to +\\infty$",
      "Determina la posición de la asíntota vertical",
      "No tiene ningún efecto sobre la gráfica",
      "Determina si tiene asíntota horizontal o no"
    ],
    "correct_index": 0,
    "has_math": True,
    "feedback_correct": "El signo del cociente de coeficientes principales determina hacia dónde se acercan las ramas.",
    "feedback_incorrect": "",
    "graph_fn": None, "graph_view": None,
    "explanation": "La AH (o el comportamiento asintótico) viene del cociente de los coeficientes principales. Si ese cociente es positivo, la función tiende a valores positivos cuando $x\\to+\\infty$; si es negativo, tiende a valores negativos.",
    "reviewed": False
  },
  {
    "external_id": "white_rational_lexi_49",
    "belt": "white", "topic": "rational", "exercise_type": "LEXI",
    "question": "¿Qué ocurre si tanto el numerador como el denominador se anulan en el mismo punto $x = c$?",
    "options": [
      "Se crea un agujero (hole) en $x = c$, no una asíntota",
      "La función es cero en $x = c$",
      "La función está definida y el valor es 1",
      "Se crea una asíntota vertical en $x = c$"
    ],
    "correct_index": 0,
    "has_math": True,
    "feedback_correct": "Si el factor $(x-c)$ está en numerador y denominador, se cancela y queda un agujero.",
    "feedback_incorrect": "",
    "graph_fn": None, "graph_view": None,
    "explanation": "Cuando $P(c)=0$ y $Q(c)=0$, el factor $(x-c)$ aparece en ambos. Tras cancelarlo, la función está definida cerca de $c$ pero no en $c$ mismo: hay un **agujero** (discontinuidad evitable). Ejemplo: $\\frac{x-c}{x-c}=1$ para $x\\neq c$, pero no está definida en $c$.",
    "reviewed": False
  },
  {
    "external_id": "white_rational_lexi_50",
    "belt": "white", "topic": "rational", "exercise_type": "LEXI",
    "question": "¿Cuál de estas afirmaciones sobre funciones racionales es VERDADERA?",
    "options": [
      "Son continuas en todo punto de su dominio",
      "Siempre tienen exactamente una asíntota vertical",
      "Su imagen siempre es $\\mathbb{R}$",
      "Nunca pueden cruzar el eje $X$"
    ],
    "correct_index": 0,
    "has_math": True,
    "feedback_correct": "Al ser cociente de polinomios (continuos), la función racional es continua en todo su dominio.",
    "feedback_incorrect": "",
    "graph_fn": None, "graph_view": None,
    "explanation": "Afirmaciones falsas: pueden tener 0, 1, 2, ... AV (no siempre exactamente 1). La imagen no siempre es $\\mathbb{R}$ (ej. $\\frac{1}{x^2+1}$ tiene imagen $(0,1]$). Sí pueden cruzar el eje $X$ (cuando el numerador tiene raíces). Lo verdadero es que son **continuas en su dominio**.",
    "reviewed": False
  },
]

# Verificar que no haya IDs duplicados
existing_ids = {e["external_id"] for e in data}
for e in new_exercises:
    assert e["external_id"] not in existing_ids, f"Duplicado: {e['external_id']}"
    existing_ids.add(e["external_id"])

data.extend(new_exercises)

from collections import Counter
skills = Counter(e["exercise_type"] for e in data)
print(f"Total: {len(data)} | Por skill: {dict(skills)}")
assert all(e["feedback_incorrect"] == "" for e in data), "feedback_incorrect no vacio!"

FILE.write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding="utf-8")
print("LEXI generados OK.")
