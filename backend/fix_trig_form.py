import json

new_explanations = {
    "white_trigonometric_form_12": (
        "En $f(x)=A\\,\\operatorname{sen}(x)$, la **amplitud** es $|A|$: la distancia del eje central al máximo o mínimo. "
        "El coeficiente $A$ estira o comprime la onda verticalmente.\n\n"
        "Para $f(x)=3\\,\\operatorname{sen}(x)$: $|A|=3$. La función oscila entre $-3$ y $3$. "
        "La opción $1$ es la amplitud del seno sin escalar. $6$ sería la amplitud si $A=6$. $\\pi$ no es amplitud sino período.\n\n"
        "Amplitud $= |A| = 3$: tan fácil como leer el coeficiente delante del seno. No hay trampa."
    ),
    "white_trigonometric_form_13": (
        "El **período** de $f(x)=\\operatorname{sen}(Bx)$ es $T=2\\pi/|B|$. Con $B=4$:\n\n"
        "$\\begin{aligned}\nT &= \\frac{2\\pi}{B} \\\\\\\\\n&= \\frac{2\\pi}{4} \\\\\\\\\n&= \\frac{\\pi}{2}\n\\end{aligned}$\n\n"
        "Los distractores $8\\pi$ y $4\\pi$ son múltiplos de $\\pi$, no el cociente. $\\pi$ correspondería a $B=2$. Con $B=4$ el ciclo se comprime a $\\pi/2$ unidades."
    ),
    "white_trigonometric_form_14": (
        "En $g(x)=A\\,\\operatorname{sen}(x)+D$, el **máximo** ocurre cuando $\\operatorname{sen}(x)=1$: $g_{\\max}=A\\cdot1+D=A+D$.\n\n"
        "$\\begin{aligned}\ng_{\\max} &= A + D \\\\\\\\\n&= 2 + 3 \\\\\\\\\n&= 5\n\\end{aligned}$\n\n"
        "La opción $3$ es solo el desplazamiento $D$. La opción $2$ es solo la amplitud $A$. La opción $1$ confunde el mínimo del seno ($-1$) con el resultado. El máximo suma $A$ y $D$."
    ),
    "white_trigonometric_form_15": (
        "En $h(x)=\\cos(x)+D$, el **mínimo** ocurre cuando $\\cos(x)=-1$: $h_{\\min}=-1+D$.\n\n"
        "$\\begin{aligned}\nh_{\\min} &= -1 + D \\\\\\\\\n&= -1 + (-2) \\\\\\\\\n&= -3\n\\end{aligned}$\n\n"
        "La opción $-1$ es el mínimo del coseno sin desplazamiento. La opción $-2$ es solo $D$. El mínimo real agrega el desplazamiento vertical al mínimo base."
    ),
    "white_trigonometric_form_16": (
        "El ángulo $\\pi/6=30°$ pertenece al triángulo $30°$-$60°$-$90°$ con proporciones $1:\\sqrt{3}:2$. "
        "El seno es cateto opuesto sobre hipotenusa: $\\operatorname{sen}(30°)=1/2$.\n\n"
        "Tabla de valores clave:\n"
        "$\\operatorname{sen}(\\pi/6)=1/2$, $\\operatorname{sen}(\\pi/4)=\\sqrt{2}/2$, $\\operatorname{sen}(\\pi/3)=\\sqrt{3}/2$, $\\operatorname{sen}(\\pi/2)=1$.\n\n"
        "$\\operatorname{sen}(30°)=1/2$: el resultado más fácil de la tabla trigonométrica. Empezá memorizando este."
    ),
    "white_trigonometric_form_17": (
        "El ángulo $\\pi/3=60°$ pertenece al triángulo $30°$-$60°$-$90°$ con proporciones $1:\\sqrt{3}:2$. "
        "El coseno es cateto adyacente sobre hipotenusa: $\\cos(60°)=1/2$.\n\n"
        "Nótese la simetría: $\\cos(\\pi/3)=\\operatorname{sen}(\\pi/6)=1/2$, porque $60°$ y $30°$ son complementarios. "
        "El distractor $\\sqrt{3}/2$ es $\\cos(\\pi/6)=\\operatorname{sen}(\\pi/3)$: el ángulo opuesto del mismo triángulo.\n\n"
        "$\\cos(60°)=1/2$: el mismo valor que $\\operatorname{sen}(30°)$. La tabla trigonométrica tiene más simetrías que un copo de nieve."
    ),
    "white_trigonometric_form_18": (
        "El **período** de $f(x)=\\cos(x/3)$ se calcula con $B=1/3$ en $T=2\\pi/|B|$:\n\n"
        "$\\begin{aligned}\nT &= \\frac{2\\pi}{B} \\\\\\\\\n&= \\frac{2\\pi}{1/3} \\\\\\\\\n&= 6\\pi\n\\end{aligned}$\n\n"
        "La opción $2\\pi/3$ sería con $B=3$ (no $1/3$). La opción $2\\pi$ es el período del coseno sin modificar. La opción $3\\pi$ sería con $B=2/3$. Con $B=1/3$ el ciclo se estira a $6\\pi\\approx18{,}85$ unidades."
    ),
    "white_trigonometric_form_19": (
        "La **amplitud** de $f(x)=A\\,\\operatorname{sen}(x)$ es siempre $|A|$: el valor absoluto del coeficiente. "
        "El signo de $A$ indica si la onda está reflejada verticalmente, pero no afecta la amplitud.\n\n"
        "Para $f(x)=-4\\,\\operatorname{sen}(x)$: $|A|=|-4|=4$. La onda oscila entre $-4$ y $4$, igual que $4\\,\\operatorname{sen}(x)$, pero invertida. "
        "La opción $-4$ es el coeficiente con signo, no la amplitud. $8$ sería el rango total, no la amplitud.\n\n"
        "Amplitud $= |-4| = 4$: el signo negativo voltea la onda pero no la aplana ni la estira."
    ),
    "white_trigonometric_form_20": (
        "La **imagen** de $f(x)=\\operatorname{sen}(x)-1$ se obtiene desplazando $[-1,1]$ exactamente $1$ unidad hacia abajo:\n\n"
        "$\\begin{aligned}\n\\text{imagen} &= [-1-1,\\; 1-1] \\\\\\\\\n&= [-2,\\; 0]\n\\end{aligned}$\n\n"
        "La opción $[-1,1]$ es el rango del seno sin desplazamiento. $[-2,1]$ confunde la amplitud. $[0,2]$ sería el resultado de $+1$, no $-1$. Restar $1$ baja todo el rango $1$ unidad."
    ),
    "white_trigonometric_form_21": (
        "La función es $f(x)=2\\,\\operatorname{sen}(x)$. El seno alcanza su **máximo** cuando el argumento es $\\pi/2$: $\\operatorname{sen}(\\pi/2)=1$. Multiplicado por $2$:\n\n"
        "$\\begin{aligned}\nf\\!\\left(\\frac{\\pi}{2}\\right) &= 2\\,\\operatorname{sen}\\!\\left(\\frac{\\pi}{2}\\right) \\\\\\\\\n&= 2 \\cdot 1 \\\\\\\\\n&= 2\n\\end{aligned}$\n\n"
        "Este es el valor máximo de $f$. La opción $0$ sería $f(0)$ o $f(\\pi)$. La opción $1$ es el máximo del seno sin escalar."
    ),
    "white_trigonometric_form_22": (
        "La función $f(x)=\\operatorname{sen}(x-\\pi)$ tiene su primer cero positivo cuando el argumento vale $0$: $x-\\pi=0\\Rightarrow x=\\pi$.\n\n"
        "El desfase $-\\pi$ desplaza toda la curva $\\pi$ unidades a la derecha. El cero que $\\operatorname{sen}(x)$ tiene en $x=0$ se mueve a $x=\\pi$. "
        "Verificación: $\\operatorname{sen}(\\pi-\\pi)=\\operatorname{sen}(0)=0$ ✓.\n\n"
        "La onda se corrió $\\pi$ a la derecha: llegó tarde al origen, pero llegó justo a tiempo en $x=\\pi$."
    ),
    "white_trigonometric_form_23": (
        "El **período** de $f(x)=\\operatorname{sen}(Bx)$ es $T=2\\pi/B$. Despejando $B$ a partir de $T=\\pi/3$:\n\n"
        "$\\begin{aligned}\nB &= \\frac{2\\pi}{T} \\\\\\\\\n&= \\frac{2\\pi}{\\pi/3} \\\\\\\\\n&= 2\\pi \\cdot \\frac{3}{\\pi} \\\\\\\\\n&= 6\n\\end{aligned}$\n\n"
        "La opción $3$ es el inverso del período (no es $B$). Las opciones $1/6$ y $1/3$ son demasiado pequeñas. Un período corto $\\pi/3$ exige un $B$ grande ($6$): la onda completa 6 ciclos en $2\\pi$."
    ),
    "white_trigonometric_form_24": (
        "En $h(x)=3\\cos(x)-1$, el **máximo** ocurre cuando $\\cos(x)=1$:\n\n"
        "$\\begin{aligned}\nh_{\\max} &= 3\\cdot1 - 1 \\\\\\\\\n&= 3 - 1 \\\\\\\\\n&= 2\n\\end{aligned}$\n\n"
        "La opción $3$ es el valor de $3\\cos(x)$ cuando $\\cos=1$, olvidando el $-1$. La opción $4$ usaría $+1$ en vez de $-1$. La opción $-4$ es el mínimo ($3\\cdot(-1)-1=-4$). El máximo correcto es $2$."
    ),
    "white_trigonometric_form_25": (
        "La **imagen** de $g(x)=2\\cos(x)+1$ se construye en pasos:\n\n"
        "$\\begin{aligned}\n\\cos(x) &\\in [-1,1] \\\\\\\\\n2\\cos(x) &\\in [-2,2] \\\\\\\\\n2\\cos(x)+1 &\\in [-1,3]\n\\end{aligned}$\n\n"
        "La opción $[0,4]$ se obtiene si se suma $2$ en vez de $1$. La opción $[-2,2]$ olvida el desplazamiento vertical. La opción $[1,3]$ toma $[0,2]+1$ en vez de $[-2,2]+1$. El rango final es $[-1,3]$."
    ),
    "white_trigonometric_form_26": (
        "La función es $f(x)=\\cos(x)$. Evaluar en $x=0$:\n\n"
        "$\\begin{aligned}\nf(0) &= \\cos(0) \\\\\\\\\n&= 1\n\\end{aligned}$\n\n"
        "El coseno arranca en su **máximo** ($1$) cuando $x=0$: esa es la diferencia visual clave entre coseno y seno. El seno vale $0$ en $x=0$; el coseno vale $1$. La gráfica confirma el pico inicial."
    ),
    "white_trigonometric_form_27": (
        "El **período** de $f(x)=2\\,\\operatorname{sen}(3x)$ depende solo del coeficiente $B=3$ del argumento, no de la amplitud $A=2$:\n\n"
        "$\\begin{aligned}\nT &= \\frac{2\\pi}{B} \\\\\\\\\n&= \\frac{2\\pi}{3}\n\\end{aligned}$\n\n"
        "La opción $6\\pi$ invierte el cociente. La opción $2\\pi$ ignora $B=3$. La opción $3\\pi$ usa $B=2/3$ en vez de $3$. La amplitud $A=2$ no afecta al período."
    ),
    "white_trigonometric_form_28": (
        "La función $f(x)=\\operatorname{sen}(x)$ está definida para **todo** $x\\in\\mathbb{R}$: no hay valores de $x$ que la hagan indefinida ni que creen asíntotas verticales.\n\n"
        "Contraste con $\\tan(x)=\\operatorname{sen}(x)/\\cos(x)$: la tangente tiene asíntotas en $x=\\pi/2+k\\pi$ porque el denominador $\\cos(x)$ se anula. "
        "El seno y el coseno **no** tienen denominador; son continuas y definidas en todo $\\mathbb{R}$ sin interrupciones.\n\n"
        "El seno no tiene asíntotas. Es la función más honesta: nunca se va al infinito ni desaparece."
    ),
    "white_trigonometric_form_29": (
        "Una onda con máximo $M$ y mínimo $m$ tiene **amplitud** $A$ igual a la mitad de la diferencia:\n\n"
        "$\\begin{aligned}\nA &= \\frac{M - m}{2} \\\\\\\\\n&= \\frac{3 - (-3)}{2} \\\\\\\\\n&= \\frac{6}{2} \\\\\\\\\n&= 3\n\\end{aligned}$\n\n"
        "La opción $6$ es el rango total (de mínimo a máximo), no la amplitud. La amplitud es la **mitad** del rango total: la distancia del eje central al pico."
    ),
    "white_trigonometric_form_30": (
        "En $f(x)=-2\\,\\operatorname{sen}(x)+1$, el **mínimo** se alcanza cuando $-2\\,\\operatorname{sen}(x)$ es mínimo, lo que ocurre cuando $\\operatorname{sen}(x)=1$:\n\n"
        "$\\begin{aligned}\nf_{\\min} &= D - |A| \\\\\\\\\n&= 1 - 2 \\\\\\\\\n&= -1\n\\end{aligned}$\n\n"
        "La fórmula $D-|A|$ funciona independientemente del signo de $A$: siempre restamos $|A|$ del desplazamiento. La opción $-2$ ignora el desplazamiento $D=1$. La opción $3$ es el máximo, no el mínimo."
    ),
    "white_trigonometric_form_31": (
        "Para evaluar $f(\\pi)=3\\cos(\\pi)$, se usa el valor estándar $\\cos(\\pi)=-1$:\n\n"
        "$\\begin{aligned}\nf(\\pi) &= 3\\cos(\\pi) \\\\\\\\\n&= 3 \\cdot (-1) \\\\\\\\\n&= -3\n\\end{aligned}$\n\n"
        "$\\pi$ radianes ($=180°$) lleva al punto $(-1,0)$ del círculo unitario: coordenada $x=-1$, luego $\\cos(\\pi)=-1$. El factor $3$ da el resultado final $-3$."
    ),
    "white_trigonometric_form_32": (
        "Para $f(x)=A\\,\\operatorname{sen}(Bx)$ con amplitud $4$ y período $\\pi$, se determinan $A$ y $B$:\n\n"
        "$\\begin{aligned}\nA &= 4 \\\\\\\\\nB &= \\frac{2\\pi}{T} = \\frac{2\\pi}{\\pi} = 2\n\\end{aligned}$\n\n"
        "Luego $f(x)=4\\,\\operatorname{sen}(2x)$. La opción $\\pi\\,\\operatorname{sen}(4x)$ tiene $A=\\pi$ y $B=4$: ni la amplitud ni el período coinciden. La opción $4\\,\\operatorname{sen}(\\pi x)$ tendría período $2$, no $\\pi$."
    ),
    "white_trigonometric_form_33": (
        "La **imagen** de $f(x)=\\operatorname{sen}(2x)$ no depende del coeficiente $B=2$ en el argumento: ese solo cambia el período. "
        "La amplitud sigue siendo $|A|=1$ y la imagen sigue siendo $[-1,1]$.\n\n"
        "Resumen: el coeficiente del argumento ($B$) afecta el **período** ($T=2\\pi/B$); el coeficiente delante del seno ($A$) afecta la **amplitud** y la imagen. "
        "En $\\operatorname{sen}(2x)$, $A=1$ y la imagen es $[-1,1]$, igual que $\\operatorname{sen}(x)$.\n\n"
        "$B$ comprime el período, pero no aplasta ni estira la onda verticalmente. La imagen $[-1,1]$ es inamovible si $A=1$."
    ),
    "white_trigonometric_form_34": (
        "El ángulo $\\pi/4=45°$ corresponde al triángulo isósceles rectángulo con catetos $1$ e hipotenusa $\\sqrt{2}$. "
        "El coseno es cateto adyacente sobre hipotenusa:\n\n"
        "$\\begin{aligned}\n\\cos\\!\\left(\\frac{\\pi}{4}\\right) &= \\frac{1}{\\sqrt{2}} \\\\\\\\\n&= \\frac{\\sqrt{2}}{2}\n\\end{aligned}$\n\n"
        "La opción $1/2$ corresponde a $\\cos(60°)=\\cos(\\pi/3)$. La opción $\\sqrt{3}/2$ corresponde a $\\cos(30°)=\\cos(\\pi/6)$. A $45°$, seno y coseno son iguales: ambos $\\sqrt{2}/2$."
    ),
    "white_trigonometric_form_35": (
        "El **eje de oscilación** (desplazamiento vertical $D$) es el valor alrededor del cual la función oscila simétricamente. "
        "En $f(x)=\\operatorname{sen}(x)+1$, la curva oscila entre $0$ y $2$ centrada en $y=1$.\n\n"
        "$D=1$ porque la función suma $1$ al seno estándar: el mínimo pasa de $-1$ a $0$ y el máximo de $1$ a $2$. El promedio entre $0$ y $2$ es $1 = D$. "
        "La opción $D=0$ sería el seno sin desplazamiento.\n\n"
        "El eje de oscilación es el valor medio entre el máximo y el mínimo: $(0+2)/2=1$. Simple."
    ),
    "white_trigonometric_form_36": (
        "El **período** de $f(x)=\\cos(\\pi x)$ se calcula con $B=\\pi$:\n\n"
        "$\\begin{aligned}\nT &= \\frac{2\\pi}{B} \\\\\\\\\n&= \\frac{2\\pi}{\\pi} \\\\\\\\\n&= 2\n\\end{aligned}$\n\n"
        "El resultado $T=2$ (dos unidades en el eje $x$, no $2\\pi$). La opción $\\pi$ confunde el numerador con el resultado. La opción $2\\pi$ ignora el $B=\\pi$. La opción $1/\\pi$ invierte el cociente. Con $B=\\pi$, el período es simplemente $2$."
    ),
    "white_trigonometric_form_37": (
        "Para una onda con máximo $M=5$ y mínimo $m=-5$, la **amplitud** es:\n\n"
        "$\\begin{aligned}\nA &= \\frac{M - m}{2} \\\\\\\\\n&= \\frac{5 - (-5)}{2} \\\\\\\\\n&= \\frac{10}{2} \\\\\\\\\n&= 5\n\\end{aligned}$\n\n"
        "La opción $10$ es el rango total (de $-5$ a $5$). La opción $2{,}5$ dividiría por $4$ en vez de $2$. La amplitud siempre es la **mitad** del rango total: la distancia del eje central al pico."
    ),
    "white_trigonometric_form_38": (
        "El ángulo $3\\pi/2=270°$ corresponde al punto $(0,-1)$ en el círculo unitario: el extremo inferior. "
        "El seno es la coordenada $y$:\n\n"
        "$\\begin{aligned}\n\\operatorname{sen}\\!\\left(\\frac{3\\pi}{2}\\right) &= -1\n\\end{aligned}$\n\n"
        "Este es el **mínimo global** del seno. La opción $0$ sería $\\operatorname{sen}(0)$, $\\operatorname{sen}(\\pi)$ o $\\operatorname{sen}(2\\pi)$. La opción $1$ sería $\\operatorname{sen}(\\pi/2)$. A $270°$ la curva está en el fondo."
    ),
    "white_trigonometric_form_39": (
        "Dada onda con máximo $6$, mínimo $2$ y período $2\\pi$, se calculan $A$, $D$ y $B$:\n\n"
        "$\\begin{aligned}\nA &= \\frac{6-2}{2} = 2 \\\\\\\\\nD &= \\frac{6+2}{2} = 4 \\\\\\\\\nB &= \\frac{2\\pi}{2\\pi} = 1\n\\end{aligned}$\n\n"
        "Luego $f(x)=2\\,\\operatorname{sen}(x)+4$. La opción $6\\,\\operatorname{sen}(x)+2$ tiene amplitud $6$ y mínimo $-4$, no $2$. La opción $4\\,\\operatorname{sen}(x)+4$ tiene amplitud $4$, no $2$."
    ),
    "white_trigonometric_form_40": (
        "La **imagen** de $f(x)=3\\,\\operatorname{sen}(x)-1$ se obtiene escalando y desplazando:\n\n"
        "$\\begin{aligned}\n\\operatorname{sen}(x) &\\in [-1,1] \\\\\\\\\n3\\,\\operatorname{sen}(x) &\\in [-3,3] \\\\\\\\\n3\\,\\operatorname{sen}(x)-1 &\\in [-4,2]\n\\end{aligned}$\n\n"
        "La opción $[-1,3]$ usa $A=1$ en vez de $A=3$. La opción $[-3,3]$ olvida el desplazamiento $-1$. La imagen correcta $[-4,2]$ suma el desplazamiento al rango escalado."
    ),
    "white_trigonometric_form_41": (
        "Para $I(t)=\\operatorname{sen}(200\\pi t)$, el coeficiente del argumento es $B=200\\pi$. El **período** es:\n\n"
        "$\\begin{aligned}\nT &= \\frac{2\\pi}{B} \\\\\\\\\n&= \\frac{2\\pi}{200\\pi} \\\\\\\\\n&= \\frac{1}{100}\\,\\text{s}\n\\end{aligned}$\n\n"
        "Período $T=1/100$ s corresponde a frecuencia $f=100\\,Hz$: cien ciclos por segundo. La opción $200\\pi$ s es el valor de $B$, no el período. La opción $100\\pi$ invierte el cociente. $1/100$ s es la respuesta."
    ),
    "white_trigonometric_form_42": (
        "La función es $f(x)=2\\,\\operatorname{sen}(x)+1$. El **máximo** ocurre cuando $\\operatorname{sen}(x)=1$:\n\n"
        "$\\begin{aligned}\nf_{\\max} &= 2\\cdot1 + 1 \\\\\\\\\n&= 2 + 1 \\\\\\\\\n&= 3\n\\end{aligned}$\n\n"
        "La opción $1$ es solo el desplazamiento $D$. La opción $2$ es solo la amplitud $A$. La opción $4$ usaría $2+2$ en vez de $2+1$. El máximo es siempre $A+D=2+1=3$."
    ),
    "white_trigonometric_form_43": (
        "Para $f(x)=\\cos(Bx)$ con amplitud $1$, eje $y=0$ y período $4\\pi$, se determina $B$:\n\n"
        "$\\begin{aligned}\nB &= \\frac{2\\pi}{T} \\\\\\\\\n&= \\frac{2\\pi}{4\\pi} \\\\\\\\\n&= \\frac{1}{2}\n\\end{aligned}$\n\n"
        "Luego $f(x)=\\cos(x/2)$. La opción $\\cos(4\\pi x)$ tendría período $2\\pi/(4\\pi)=1/2$: demasiado corto. La opción $\\cos(2x)$ tendría período $\\pi$. Solo $\\cos(x/2)$ tiene período $4\\pi$."
    ),
    "white_trigonometric_form_44": (
        "La **imagen** de $f(x)=-\\cos(x)$ se obtiene negando el coseno. Como $\\cos(x)\\in[-1,1]$, su negación $-\\cos(x)$ también está en $[-1,1]$ (los extremos se intercambian pero el conjunto es el mismo).\n\n"
        "$-\\cos(x)\\in[-1,1]$: cuando $\\cos=1$, $-\\cos=-1$ (mínimo); cuando $\\cos=-1$, $-\\cos=1$ (máximo). "
        "La imagen de $-\\cos(x)$ es exactamente $[-1,1]$, igual que la de $\\cos(x)$.\n\n"
        "Negar el coseno invierte sus extremos pero no cambia el rango: $[-1,1]$ sigue siendo $[-1,1]$, al revés."
    ),
    "white_trigonometric_form_45": (
        "El ángulo $\\pi/4=45°$ corresponde al triángulo isósceles rectángulo ($1, 1, \\sqrt{2}$). "
        "El seno es cateto opuesto sobre hipotenusa:\n\n"
        "$\\begin{aligned}\n\\operatorname{sen}\\!\\left(\\frac{\\pi}{4}\\right) &= \\frac{1}{\\sqrt{2}} \\\\\\\\\n&= \\frac{\\sqrt{2}}{2}\n\\end{aligned}$\n\n"
        "A $45°$, seno y coseno son iguales: $\\sqrt{2}/2\\approx0{,}707$. La opción $1/2$ es $\\operatorname{sen}(30°)$; la opción $\\sqrt{3}/2$ es $\\operatorname{sen}(60°)$."
    ),
    "white_trigonometric_form_46": (
        "El **período** de $f(x)=\\cos(2x/3)$ tiene $B=2/3$:\n\n"
        "$\\begin{aligned}\nT &= \\frac{2\\pi}{B} \\\\\\\\\n&= \\frac{2\\pi}{2/3} \\\\\\\\\n&= 2\\pi \\cdot \\frac{3}{2} \\\\\\\\\n&= 3\\pi\n\\end{aligned}$\n\n"
        "La opción $4\\pi/3$ invertiría el cociente. La opción $2\\pi/3$ confundiría $B=3/2$ con $B=2/3$. La opción $6\\pi$ usaría $B=1/3$. Con $B=2/3$ el período es $3\\pi$."
    ),
    "white_trigonometric_form_47": (
        "La función $f(x)=\\operatorname{sen}(x-\\pi/2)$ alcanza su máximo cuando el argumento es $\\pi/2$:\n\n"
        "$\\begin{aligned}\nx - \\frac{\\pi}{2} &= \\frac{\\pi}{2} \\\\\\\\\nx &= \\frac{\\pi}{2} + \\frac{\\pi}{2} \\\\\\\\\nx &= \\pi\n\\end{aligned}$\n\n"
        "Verificación: $f(\\pi)=\\operatorname{sen}(\\pi-\\pi/2)=\\operatorname{sen}(\\pi/2)=1$ ✓. El máximo del seno se desplazó de $x=\\pi/2$ a $x=\\pi$ por el desfase $-\\pi/2$."
    ),
    "white_trigonometric_form_48": (
        "La **amplitud** de $f(x)=\\tfrac{1}{2}\\,\\operatorname{sen}(x)$ es $|A|=|1/2|=1/2$. "
        "El coeficiente $1/2$ comprime la oscilación verticalmente a la mitad:\n\n"
        "Máximo $=1/2$, mínimo $=-1/2$, imagen $=[-1/2,1/2]$. "
        "La opción $1/4$ dividiría por $4$; la opción $2$ invertiría el coeficiente; la opción $1$ ignoraría el factor $1/2$. "
        "La amplitud es siempre el coeficiente delante del seno en valor absoluto.\n\n"
        "Amplitud $1/2$: el seno en modo ahorro de energía. Misma melodía, volumen reducido a la mitad."
    ),
    "white_trigonometric_form_49": (
        "La **imagen** de $f(x)=\\operatorname{sen}(x/2)$ no depende del coeficiente $B=1/2$ del argumento: ese solo cambia el período. "
        "La amplitud sigue siendo $|A|=1$ (no hay coeficiente delante del seno).\n\n"
        "Imagen $=[-1,1]$, igual que $\\operatorname{sen}(x)$. El período cambia a $4\\pi$, pero el rango vertical permanece inalterado. "
        "La opción $[-2,2]$ sería si $A=2$; la opción $\\mathbb{R}$ sería el dominio.\n\n"
        "$\\operatorname{sen}(x/2)$: misma altura que el seno, solo que va más despacio. La imagen $[-1,1]$ no se negocia."
    ),
    "white_trigonometric_form_50": (
        "Para $T(h)=10\\,\\operatorname{sen}\\!\\left(\\tfrac{\\pi}{12}(h-6)\\right)+20$, el **máximo** ocurre cuando $\\operatorname{sen}=1$:\n\n"
        "$\\begin{aligned}\nT_{\\max} &= 10 \\cdot 1 + 20 \\\\\\\\\n&= 10 + 20 \\\\\\\\\n&= 30\\,°C\n\\end{aligned}$\n\n"
        "El desfase $(h-6)$ desplaza el horario del máximo (ocurre a $h=12$), pero no cambia el valor máximo. La opción $10°C$ es solo la amplitud. La opción $20°C$ es el eje de oscilación."
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

print(f"Done. Updated {count} FORM explanations.")
