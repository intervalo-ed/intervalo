import json

new_explanations = {
    "white_trigonometric_graf_12": (
        "La **amplitud** de $f(x)=A\\,\\operatorname{sen}(x)$ es $|A|$: determina el valor máximo y mínimo de la función. "
        "Para $A=2$, la curva alcanza el techo en $y=2$ y el piso en $y=-2$.\n\n"
        "En el gráfico se puede leer directamente: el pico de la onda está en $y=2$. "
        "La opción $1$ sería el máximo del seno sin amplificar. La opción $4$ correspondería a $A=4$. "
        "Con $A=2$, el máximo es $2$ y el mínimo es $-2$.\n\n"
        "El coeficiente $2$ delante del seno: dobla la altura de la ola sin cambiar la velocidad."
    ),
    "white_trigonometric_graf_13": (
        "El **dominio** de $f(x)=\\cos(x)$ es el conjunto de todos los $x$ para los que la función está definida. "
        "El coseno (y el seno) están definidos para **cualquier** número real.\n\n"
        "En el gráfico se confirma: la curva se extiende sin interrupciones hacia la izquierda y la derecha, sin huecos, sin saltos, sin asíntotas. "
        "La opción $(0,+\\infty)$ sería el dominio de una logarítmica. La opción $[-\\pi,\\pi]$ sería una restricción arbitraria. La opción $[-1,1]$ es la **imagen**, no el dominio.\n\n"
        "Dominio $\\mathbb{R}$: el coseno no excluye a nadie. Todo ángulo es bienvenido."
    ),
    "white_trigonometric_graf_14": (
        "La **imagen** de $f(x)=\\operatorname{sen}(x)+1$ se obtiene desplazando el rango base $[-1,1]$ hacia arriba $1$ unidad:\n\n"
        "$\\begin{aligned}\n\\text{imagen} &= [-1+1,\\; 1+1] \\\\\\\\\n&= [0,\\; 2]\n\\end{aligned}$\n\n"
        "En el gráfico: el mínimo de la curva toca $y=0$ y el máximo llega a $y=2$. La opción $[-1,1]$ es el rango sin desplazamiento. La opción $[1,2]$ tendría amplitud $0{,}5$. La imagen correcta es $[0,2]$."
    ),
    "white_trigonometric_graf_15": (
        "En $f(x)=\\operatorname{sen}(2x)$, el coeficiente $B=2$ comprime el período a la mitad. "
        "En el gráfico se cuentan los ciclos: en el intervalo $[0,2\\pi]$ hay exactamente **dos** oscilaciones completas, lo que confirma período $=2\\pi/2=\\pi$.\n\n"
        "$\\begin{aligned}\nT &= \\frac{2\\pi}{B} = \\frac{2\\pi}{2} = \\pi\n\\end{aligned}$\n\n"
        "La opción $4\\pi$ sería con $B=1/2$. La opción $2\\pi$ ignoraría el $B=2$. La opción $\\pi/2$ necesitaría $B=4$. El período correcto es $\\pi$."
    ),
    "white_trigonometric_graf_16": (
        "La función $f(x)=-\\operatorname{sen}(x)$ **invierte la monotonía** respecto a $\\operatorname{sen}(x)$: donde el seno crece, $-\\operatorname{sen}$ decrece, y viceversa.\n\n"
        "El seno estándar **decrece** en $[\\pi/2, 3\\pi/2]$. Por lo tanto $-\\operatorname{sen}(x)$ **crece** en $[\\pi/2, 3\\pi/2]$. "
        "Verificación: $-\\operatorname{sen}(\\pi/2)=-1$ (mínimo) y $-\\operatorname{sen}(3\\pi/2)=1$ (máximo): efectivamente crece.\n\n"
        "Negarle el seno: lo que subía ahora baja, y lo que bajaba ahora sube. La monotonía se voltea."
    ),
    "white_trigonometric_graf_17": (
        "La onda tiene máximo $3$, mínimo $-3$, período $2\\pi$, y en $x=0$ vale $0$. Las señales apuntan a $f(x)=3\\,\\operatorname{sen}(x)$:\n\n"
        "— Amplitud $3$ $\\Rightarrow$ coeficiente $A=3$.\n"
        "— Período $2\\pi$ $\\Rightarrow$ $B=1$.\n"
        "— $f(0)=3\\,\\operatorname{sen}(0)=0$ ✓ (el seno empieza en cero).\n\n"
        "La opción $3\\cos(x)$ tiene $f(0)=3\\neq0$: descartada. La opción $\\operatorname{sen}(3x)$ tiene amplitud $1$, no $3$. La que arranca en $0$ con amplitud $3$ es $3\\,\\operatorname{sen}(x)$."
    ),
    "white_trigonometric_graf_18": (
        "La señal clave es que la curva **alcanza su máximo en $x=0$** (valor $1$). Solo el coseno (o $-\\operatorname{sen}$) arranca en el máximo.\n\n"
        "Verificaciones: $\\cos(0)=1$ ✓; $\\operatorname{sen}(0)=0$ ✗; $-\\operatorname{sen}(0)=0$ ✗; $-\\cos(0)=-1$ ✗. "
        "Solo $f(x)=\\cos(x)$ tiene el máximo en el origen con amplitud $1$.\n\n"
        "Máximo en $x=0$: la firma del coseno. El seno llega al máximo recién en $\\pi/2$; el coseno ya estaba arriba desde el principio."
    ),
    "white_trigonometric_graf_19": (
        "Las **raíces** de $f(x)=2\\,\\operatorname{sen}(x)$ son los valores $x$ donde $f(x)=0$, es decir donde $\\operatorname{sen}(x)=0$. "
        "El factor $2$ no afecta las raíces.\n\n"
        "$\\operatorname{sen}(x)=0$ en $x=k\\pi$. En $[0,2\\pi]$: $x=0$, $x=\\pi$, $x=2\\pi$. "
        "Son tres raíces. La opción $x=\\pi/2$ y $x=3\\pi/2$ da los **extremos**, no las raíces.\n\n"
        "El $2$ delante del seno no mueve las raíces: solo amplifica. El seno sigue cruzando el eje en los mismos múltiplos de $\\pi$."
    ),
    "white_trigonometric_graf_20": (
        "Para evaluar $f(\\pi)=-\\cos(\\pi)$, se usa $\\cos(\\pi)=-1$:\n\n"
        "$\\begin{aligned}\nf(\\pi) &= -\\cos(\\pi) \\\\\\\\\n&= -(-1) \\\\\\\\\n&= 1\n\\end{aligned}$\n\n"
        "El gráfico confirma: en $x=\\pi$, la curva de $-\\cos(x)$ alcanza su máximo $1$ (pues es la reflexión del coseno, cuyo mínimo en $\\pi$ se convierte en máximo). La opción $-1$ sería $\\cos(\\pi)$, sin el signo negativo."
    ),
    "white_trigonometric_graf_21": (
        "Una onda con máximo $2$, mínimo $0$ y período $2\\pi$ tiene amplitud $A=(2-0)/2=1$ y desplazamiento $D=(2+0)/2=1$. "
        "Con $B=1$ la fórmula es $\\operatorname{sen}(x)+1$.\n\n"
        "Verificaciones: $\\operatorname{sen}(0)+1=1$ (valor inicial), máximo $=1+1=2$, mínimo $=-1+1=0$ ✓. "
        "La opción $2\\,\\operatorname{sen}(x)$ tiene mínimo $-2$. La opción $\\cos(x)+2$ tiene mínimo $1$.\n\n"
        "Onda entre $0$ y $2$: amplitud $1$, desplazamiento $+1$. El seno estándar subió de piso."
    ),
    "white_trigonometric_graf_22": (
        "En $f(x)=\\cos(2x)$, el período es $T=2\\pi/2=\\pi$. En el intervalo $[0,2\\pi]$ caben:\n\n"
        "$\\begin{aligned}\n\\text{ciclos} &= \\frac{\\text{largo del intervalo}}{T} \\\\\\\\\n&= \\frac{2\\pi}{\\pi} \\\\\\\\\n&= 2\n\\end{aligned}$\n\n"
        "El gráfico lo confirma: se ven exactamente dos ondas completas en $[0,2\\pi]$. La opción $1$ sería el resultado con $B=1$. La opción $4$ necesitaría $B=4$."
    ),
    "white_trigonometric_graf_23": (
        "La onda tiene máximo $2$, mínimo $-2$ y período $2\\pi$. Se reduce a dos candidatos: $2\\,\\operatorname{sen}(x)$ o $2\\cos(x)$. "
        "La señal decisiva es el **valor en $x=0$**.\n\n"
        "El gráfico muestra el pico en $x=0$: $f(0)=2$. Verificación: $2\\cos(0)=2$ ✓; $2\\,\\operatorname{sen}(0)=0$ ✗. "
        "La función es $f(x)=2\\cos(x)$.\n\n"
        "Máximo en el origen + amplitud $2$: el coseno duplicado. El seno hubiera arrancado en cero, no en el techo."
    ),
    "white_trigonometric_graf_24": (
        "El **mínimo** de $f(x)=\\operatorname{sen}(x)-1$ se alcanza cuando $\\operatorname{sen}(x)=-1$:\n\n"
        "$\\begin{aligned}\nf_{\\min} &= -1 + D \\\\\\\\\n&= -1 + (-1) \\\\\\\\\n&= -2\n\\end{aligned}$\n\n"
        "La opción $-1$ es el mínimo del seno sin desplazamiento, o el valor de $D$. La opción $0$ es el mínimo si $D=1$. El gráfico muestra la curva tocando $y=-2$ en su punto más bajo: ese es el mínimo."
    ),
    "white_trigonometric_graf_25": (
        "Las raíces de $\\operatorname{sen}(2x)=0$ ocurren cuando el argumento $2x=k\\pi$, es decir $x=k\\pi/2$. "
        "La primera raíz positiva **no nula** es:\n\n"
        "$\\begin{aligned}\nx &= \\frac{\\pi}{2}\n\\end{aligned}$\n\n"
        "La raíz $x=0$ existe pero es la raíz en el origen (no la primera positiva no nula). La opción $x=\\pi$ es la segunda raíz positiva no nula. La opción $x=\\pi/4$ no es raíz: $\\operatorname{sen}(2\\cdot\\pi/4)=\\operatorname{sen}(\\pi/2)=1\\neq0$."
    ),
    "white_trigonometric_graf_26": (
        "La curva en $x=0$ vale $0$ y **desciende primero** (hacia el mínimo $-1$ en $x=\\pi/2$). "
        "Esa es la firma de $-\\operatorname{sen}(x)$: el seno negado baja antes de subir.\n\n"
        "Verificaciones: $-\\operatorname{sen}(0)=0$ ✓; mínimo en $x=\\pi/2$: $-\\operatorname{sen}(\\pi/2)=-1$ ✓. "
        "El seno estándar sube en $[0,\\pi/2]$; $-\\cos(x)$ empieza en $-1$ (no en $0$).\n\n"
        "$-\\operatorname{sen}(x)$: el pesimista que en el primer paso baja. Después sube, pero ya estableció el tono."
    ),
    "white_trigonometric_graf_27": (
        "La **imagen** de $f(x)=3\\,\\operatorname{sen}(x)$ es el conjunto de todos los valores posibles. "
        "Como $\\operatorname{sen}(x)\\in[-1,1]$, multiplicar por $3$ da:\n\n"
        "$\\begin{aligned}\n3\\,\\operatorname{sen}(x) &\\in [-3,3]\n\\end{aligned}$\n\n"
        "En el gráfico: la curva toca $y=3$ (máximo) y $y=-3$ (mínimo), y no supera esos valores. La opción $[-1,1]$ es la imagen sin amplificar. La opción $[0,3]$ solo cubriría la mitad positiva."
    ),
    "white_trigonometric_graf_28": (
        "Para $T(h)=10\\,\\operatorname{sen}\\!\\left(\\tfrac{\\pi}{12}(h-6)\\right)+20$, en $h=6$:\n\n"
        "$\\begin{aligned}\nT(6) &= 10\\,\\operatorname{sen}\\!\\left(\\frac{\\pi}{12}(6-6)\\right)+20 \\\\\\\\\n&= 10\\,\\operatorname{sen}(0)+20 \\\\\\\\\n&= 10\\cdot0+20 \\\\\\\\\n&= 20\\,°C\n\\end{aligned}$\n\n"
        "A las 6 a.m. el argumento es $0$, el seno vale $0$, y la temperatura es exactamente la media del ciclo ($20°C$). El modelo indica que a las $6$ el día apenas empieza a calentarse."
    ),
    "white_trigonometric_graf_29": (
        "El **máximo** de $T(h)=10\\,\\operatorname{sen}\\!\\left(\\tfrac{\\pi}{12}(h-6)\\right)+20$ ocurre cuando $\\operatorname{sen}=1$:\n\n"
        "$\\begin{aligned}\n\\frac{\\pi}{12}(h-6) &= \\frac{\\pi}{2} \\\\\\\\\nh - 6 &= 6 \\\\\\\\\nh &= 12\n\\end{aligned}$\n\n"
        "La temperatura máxima ($30°C$) ocurre a las $12{:}00$ del mediodía. El gráfico muestra el pico en $h=12$. La opción $h=18$ daría el valor de vuelta al equilibrio (tarde)."
    ),
    "white_trigonometric_graf_30": (
        "Los **máximos locales** de $f(x)=\\operatorname{sen}(x)$ ocurren donde la función alcanza el valor $1$: eso sucede en $x=\\pi/2$ y luego cada $2\\pi$.\n\n"
        "Solución general: $x=\\pi/2+2k\\pi$, $k\\in\\mathbb{Z}$. "
        "La opción $x=k\\pi$ da los **ceros** del seno (raíces), no los máximos. La opción $x=\\pi/4+k\\pi$ no corresponde a ningún valor especial del seno.\n\n"
        "Máximos del seno en $\\pi/2, 5\\pi/2, 9\\pi/2, \\ldots$: cada $2\\pi$, el seno vuelve a tocar el techo."
    ),
    "white_trigonometric_graf_31": (
        "Una onda que completa exactamente **un ciclo** en $[0,4\\pi]$ tiene período $T=4\\pi$. "
        "Con $T=2\\pi/B$:\n\n"
        "$\\begin{aligned}\nB &= \\frac{2\\pi}{T} = \\frac{2\\pi}{4\\pi} = \\frac{1}{2}\n\\end{aligned}$\n\n"
        "La función es $\\operatorname{sen}(x/2)$. La opción $\\operatorname{sen}(2x)$ tendría período $\\pi$ (cuatro ciclos en $[0,4\\pi]$). La opción $2\\,\\operatorname{sen}(x)$ tendría período $2\\pi$ (dos ciclos). Solo $\\operatorname{sen}(x/2)$ hace un único ciclo en $4\\pi$."
    ),
    "white_trigonometric_graf_32": (
        "La **amplitud** de $f(x)=2\\,\\operatorname{sen}(x)+1$ es la distancia del eje de oscilación ($y=D=1$) al máximo o mínimo. "
        "Como $A=2$, la amplitud es $|A|=2$.\n\n"
        "Verificación desde el gráfico: máximo $=3$, mínimo $=-1$, eje $=1$. Amplitud $= 3-1 = 2$ ✓ (o $1-(-1)=2$). "
        "La opción $3$ es el valor del máximo, no la amplitud. La opción $1$ es el desplazamiento $D$.\n\n"
        "Amplitud $=$ distancia del eje al pico. Aquí $D=1$, máx $=3$: distancia $=2$. Simple."
    ),
    "white_trigonometric_graf_33": (
        "El **eje de oscilación** (desplazamiento vertical $D$) es el valor alrededor del cual la función oscila simétricamente. "
        "En $f(x)=\\cos(x)-2$, el desplazamiento es $D=-2$.\n\n"
        "Verificación: máximo $=1-2=-1$, mínimo $=-1-2=-3$. El eje central es $(-1+(-3))/2=-2=D$ ✓. "
        "En el gráfico la curva oscila simétricamente alrededor de $y=-2$.\n\n"
        "Eje de oscilación $=D=-2$: el coseno se mudó al subsuelo, pero sigue oscilando con la misma elegancia."
    ),
    "white_trigonometric_graf_34": (
        "La onda tiene máximo $2$, mínimo $-2$ y período $\\pi$. Se determinan $A$ y $B$:\n\n"
        "$\\begin{aligned}\nA &= \\frac{2-(-2)}{2} = 2 \\\\\\\\\nB &= \\frac{2\\pi}{\\pi} = 2\n\\end{aligned}$\n\n"
        "La función arranca en $0$ en $x=0$ (seno, no coseno). Luego: $f(x)=2\\,\\operatorname{sen}(2x)$. "
        "La opción $2\\cos(x)$ tiene período $2\\pi$, no $\\pi$. La opción $\\operatorname{sen}(2x)$ tiene amplitud $1$, no $2$."
    ),
    "white_trigonometric_graf_35": (
        "El **mínimo** de $f(x)=\\cos(x)$ (valor $-1$) ocurre cuando el punto en el círculo unitario está en $(-1,0)$: eso es $x=\\pi$ y se repite cada $2\\pi$.\n\n"
        "Solución general: $x=\\pi+2k\\pi=(2k+1)\\pi$, $k\\in\\mathbb{Z}$. "
        "La opción $x=k\\pi$ incluiría también los máximos ($x=2k\\pi$). La opción $x=2k\\pi$ da los **máximos**. La opción $x=\\pi/2+k\\pi$ da los ceros.\n\n"
        "El coseno toca el fondo en $\\pi, 3\\pi, 5\\pi, \\ldots$: cada vuelta completa, empieza por el mismo sótano."
    ),
    "white_trigonometric_graf_36": (
        "Para $h(t)=3\\,\\operatorname{sen}\\!\\left(\\tfrac{\\pi}{6}t\\right)+5$, el **mínimo** ocurre cuando $\\operatorname{sen}=-1$:\n\n"
        "$\\begin{aligned}\nh_{\\min} &= 3\\cdot(-1)+5 \\\\\\\\\n&= -3+5 \\\\\\\\\n&= 2\\,\\text{m}\n\\end{aligned}$\n\n"
        "La opción $3$ m es solo la amplitud. La opción $5$ m es el eje de oscilación. La opción $8$ m es el máximo. El nivel mínimo del mar (marea baja) en este modelo es $2$ m sobre el nivel de referencia."
    ),
    "white_trigonometric_graf_37": (
        "Para $h(t)=3\\,\\operatorname{sen}\\!\\left(\\tfrac{\\pi}{6}t\\right)+5$, el **máximo** ocurre cuando $\\operatorname{sen}=1$:\n\n"
        "$\\begin{aligned}\nh_{\\max} &= 3\\cdot1+5 \\\\\\\\\n&= 3+5 \\\\\\\\\n&= 8\\,\\text{m}\n\\end{aligned}$\n\n"
        "La opción $5$ m es el nivel medio (eje de oscilación). La opción $3$ m es la amplitud. La opción $6$ m no corresponde a ningún valor del modelo. El máximo de la marea es $8$ m."
    ),
    "white_trigonometric_graf_38": (
        "La onda tiene mínimo $-1$ en $x=0$ y máximo $1$ en $x=\\pi$. "
        "Verificando cada opción:\n\n"
        "$-\\cos(0)=-1$ ✓ y $-\\cos(\\pi)=-(-1)=1$ ✓.\n\n"
        "Las otras opciones: $\\operatorname{sen}(0)=0$ ✗; $-\\operatorname{sen}(0)=0$ ✗; $\\cos(0)=1$ ✗ (el máximo debería estar en $x=0$, no el mínimo). "
        "Solo $f(x)=-\\cos(x)$ arranca en $-1$ y llega al máximo en $\\pi$.\n\n"
        "$-\\cos(x)$: el coseno dado vuelta. El mínimo en el origen y el máximo a $\\pi$ de distancia."
    ),
    "white_trigonometric_graf_39": (
        "En el intervalo $[3\\pi/2, 2\\pi]$, el ángulo va del extremo inferior del círculo unitario $(0,-1)$ al punto inicial $(1,0)$. "
        "La coordenada $y$ (el seno) **sube** de $-1$ a $0$: la función es **creciente de $-1$ a $0$**.\n\n"
        "Comparación: en $[\\pi/2, 3\\pi/2]$ el seno baja de $1$ a $-1$ (decreciente). En $[3\\pi/2, 2\\pi]$ sube de $-1$ a $0$: creciente. "
        "La opción correcta describe este tramo final del ciclo.\n\n"
        "$[3\\pi/2, 2\\pi]$: el seno saliendo del sótano hacia la planta baja. Un tramo corto, pero muy creciente."
    ),
    "white_trigonometric_graf_40": (
        "El coseno es una función **par**: $\\cos(-x)=\\cos(x)$ para todo $x$. Esto significa que su gráfica es simétrica respecto al **eje $Y$**.\n\n"
        "En el gráfico: los valores a izquierda y derecha del eje $Y$ son espejo uno del otro. "
        "La opción 'simétrico respecto al eje $X$' no es correcta: $\\cos(-x)=\\cos(x)$ implica simetría vertical (eje $Y$), no horizontal. "
        "La simetría respecto al eje $X$ implicaría $f(x)=-f(x)$, lo que solo es posible si $f=0$.\n\n"
        "Eje $Y$ como espejo del coseno: si doblás el gráfico por el eje vertical, las dos mitades coinciden."
    ),
    "white_trigonometric_graf_41": (
        "La onda tiene amplitud $3$, período $2\\pi$ y **en $x=0$ vale $3$** (el máximo). "
        "El candidato con máximo en el origen es el **coseno**: $f(x)=3\\cos(x)$.\n\n"
        "Verificaciones: $3\\cos(0)=3$ ✓ (máximo). $3\\,\\operatorname{sen}(0)=0$ ✗. "
        "La opción $\\operatorname{sen}(3x)$ tiene amplitud $1$ y período $2\\pi/3$: nada coincide.\n\n"
        "Amplitud $3$ + máximo en el origen: combinación exclusiva del coseno escalado. El seno nunca arranca en el pico."
    ),
    "white_trigonometric_graf_42": (
        "La función es $f(x)=\\operatorname{sen}(x/2)$. En $x=\\pi$:\n\n"
        "$\\begin{aligned}\nf(\\pi) &= \\operatorname{sen}\\!\\left(\\frac{\\pi}{2}\\right) \\\\\\\\\n&= 1\n\\end{aligned}$\n\n"
        "$\\pi/2$ es el ángulo de $90°$: el seno vale $1$ allí (su máximo). En el gráfico, $x=\\pi$ es exactamente el primer pico de $\\operatorname{sen}(x/2)$: el argumento $x/2$ llega a $\\pi/2$ cuando $x=\\pi$."
    ),
    "white_trigonometric_graf_43": (
        "Para $I(t)=311\\,\\operatorname{sen}(100\\pi t)$, en $t=0$:\n\n"
        "$\\begin{aligned}\nI(0) &= 311\\,\\operatorname{sen}(100\\pi\\cdot0) \\\\\\\\\n&= 311\\,\\operatorname{sen}(0) \\\\\\\\\n&= 311\\cdot0 \\\\\\\\\n&= 0\\,\\text{A}\n\\end{aligned}$\n\n"
        "La corriente alterna empieza en $0$ porque el modelo usa el seno (que vale $0$ en $t=0$). El valor $311$ A es la amplitud, no el valor inicial. El gráfico parte del origen."
    ),
    "white_trigonometric_graf_44": (
        "La **imagen** de $f(x)=\\operatorname{sen}(2x)+1$ depende de la amplitud ($A=1$) y el desplazamiento ($D=1$), no del período:\n\n"
        "$\\begin{aligned}\n\\operatorname{sen}(2x) &\\in [-1,1] \\\\\\\\\n\\operatorname{sen}(2x)+1 &\\in [0,2]\n\\end{aligned}$\n\n"
        "El coeficiente $B=2$ comprime el período a $\\pi$ pero no afecta el rango vertical. La imagen es $[0,2]$. La opción $[-1,3]$ tendría desplazamiento $D=1$ con amplitud $2$. La opción $[1,3]$ ignoraría la parte negativa del seno."
    ),
    "white_trigonometric_graf_45": (
        "La onda tiene máximo $0$ y mínimo $-2$. Con estos datos:\n\n"
        "$\\begin{aligned}\nD &= \\frac{0+(-2)}{2} = -1 \\\\\\\\\nA &= \\frac{0-(-2)}{2} = 1\n\\end{aligned}$\n\n"
        "La fórmula es $\\operatorname{sen}(x)-1$. Verificación: máx $= 1-1=0$ ✓, mín $= -1-1=-2$ ✓. "
        "La opción $-\\operatorname{sen}(x)-1$ tendría el mismo rango pero la curva invertida (partiría del mínimo en $x=0$)."
    ),
    "white_trigonometric_graf_46": (
        "En $f(x)=\\operatorname{sen}(2x)$, el período es $\\pi$ y hay un máximo por ciclo. En el intervalo $[0,4\\pi]$:\n\n"
        "$\\begin{aligned}\n\\text{ciclos} &= \\frac{4\\pi}{\\pi} = 4 \\\\\\\\\n\\text{máximos} &= 4 \\times 1 = 4\n\\end{aligned}$\n\n"
        "Los máximos ocurren en $x=\\pi/4, 5\\pi/4, 9\\pi/4, 13\\pi/4$: exactamente $4$ máximos en $[0,4\\pi]$. "
        "La opción $2$ contaría solo un período. La opción $1$ contaría medio período."
    ),
    "white_trigonometric_graf_47": (
        "Para $T(m)=8\\cos\\!\\left(\\tfrac{\\pi}{6}(m-1)\\right)+15$, en enero ($m=1$):\n\n"
        "$\\begin{aligned}\nT(1) &= 8\\cos\\!\\left(\\frac{\\pi}{6}(1-1)\\right)+15 \\\\\\\\\n&= 8\\cos(0)+15 \\\\\\\\\n&= 8\\cdot1+15 \\\\\\\\\n&= 23\\,°C\n\\end{aligned}$\n\n"
        "En enero ($m=1$) el argumento es $0$ y el coseno vale $1$: la temperatura es el máximo del modelo, $23°C$. La opción $15°C$ sería la temperatura media (eje de oscilación). La opción $7°C$ sería el mínimo."
    ),
    "white_trigonometric_graf_48": (
        "La **imagen** de $f(x)=-\\cos(x)+1$ se construye en pasos:\n\n"
        "$\\begin{aligned}\n\\cos(x) &\\in [-1,1] \\\\\\\\\n-\\cos(x) &\\in [-1,1] \\\\\\\\\n-\\cos(x)+1 &\\in [0,2]\n\\end{aligned}$\n\n"
        "La reflexión conserva el rango $[-1,1]$; el desplazamiento $+1$ lo eleva a $[0,2]$. "
        "En el gráfico la curva toca $y=0$ (mínimo, cuando $\\cos=1$) y $y=2$ (máximo, cuando $\\cos=-1$)."
    ),
    "white_trigonometric_graf_49": (
        "La onda tiene máximo $3$, mínimo $-1$ y período $2\\pi$. Se extraen los parámetros:\n\n"
        "$\\begin{aligned}\nA &= \\frac{3-(-1)}{2} = 2 \\\\\\\\\nD &= \\frac{3+(-1)}{2} = 1 \\\\\\\\\nB &= \\frac{2\\pi}{2\\pi} = 1\n\\end{aligned}$\n\n"
        "La curva arranca en $0$ en $x=0$ (patrón del seno). Fórmula: $2\\,\\operatorname{sen}(x)+1$. "
        "La opción $2\\cos(x)+1$ tendría $f(0)=3$ (máximo), no $1$. La opción $\\operatorname{sen}(x)+2$ tendría $A=1$."
    ),
    "white_trigonometric_graf_50": (
        "En el intervalo $[\\pi, 2\\pi]$, el ángulo va del extremo izquierdo del círculo unitario $(-1,0)$ hasta el extremo derecho $(1,0)$. "
        "La coordenada $x$ (el coseno) **sube** de $-1$ a $1$: la función es **creciente de $-1$ a $1$**.\n\n"
        "Valores clave: $\\cos(\\pi)=-1$ (mínimo), $\\cos(3\\pi/2)=0$, $\\cos(2\\pi)=1$ (máximo). Todos crecientes en ese orden. "
        "El coseno decrece en $[0,\\pi]$ y crece en $[\\pi,2\\pi]$.\n\n"
        "$[\\pi, 2\\pi]$: el coseno en modo recuperación. Viene del sótano y llega de vuelta al techo justo a tiempo para el próximo ciclo."
    ),
}

path = "content/analisis-1/exercises/white_trigonometric.json"
with open(path, encoding="utf-8") as f:
    data = json.load(f)

count = 0
for ex in data:
    eid = ex["external_id"]
    if eid in new_explanations:
        ex["explanation"] = new_explanations[eid]
        count += 1

with open(path, "w", encoding="utf-8") as f:
    json.dump(data, f, ensure_ascii=False, indent=2)

print(f"Done. Updated {count} GRAF explanations.")
