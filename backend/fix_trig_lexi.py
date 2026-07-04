import json

new_explanations = {
    "white_trigonometric_lexi_12": (
        "La **imagen** (recorrido) de $f(x)=\\operatorname{sen}(x)$ es el conjunto de todos los valores posibles de $f$. "
        "Como el seno proviene de la coordenada $y$ en el círculo unitario, esa coordenada oscila entre $-1$ y $1$: la imagen es $[-1,1]$.\n\n"
        "Las opciones $(0,+\\infty)$ y $[0,1]$ solo cubren la mitad superior. $\\mathbb{R}$ sería el **dominio**, no la imagen. "
        "Ningún valor de $\\operatorname{sen}(x)$ puede superar $1$ ni caer debajo de $-1$.\n\n"
        "El seno: el único termómetro del universo que nunca llega a $2$."
    ),
    "white_trigonometric_lexi_13": (
        "El **período** es la longitud del intervalo mínimo en que la función completa un ciclo exacto: $f(x+T)=f(x)$ para todo $x$. "
        "Para $\\operatorname{sen}(x)$, la onda completa un ciclo cada $2\\pi$ radianes.\n\n"
        "$\\pi$ sería el período de $\\operatorname{sen}(2x)$ (ciclo comprimido). $4\\pi$ sería el de $\\operatorname{sen}(x/2)$ (ciclo estirado). "
        "$\\pi/2$ correspondería a $B=4$. Solo con $B=1$ el período es el estándar $2\\pi$.\n\n"
        "$2\\pi\\approx6{,}28$: no es redondo, pero el seno no eligió el sistema métrico."
    ),
    "white_trigonometric_lexi_14": (
        "En $f(x)=A\\,\\operatorname{sen}(x)$, el parámetro $|A|$ es la **amplitud**: la distancia desde el eje de simetría $y=0$ hasta el máximo o el mínimo. "
        "La función oscila entre $-|A|$ y $|A|$.\n\n"
        "Si $A=3$: máximo $=3$, mínimo $=-3$, amplitud $=3$. El coeficiente $A$ estira la onda **verticalmente** sin modificar el período ni la posición horizontal. "
        "El período depende de $B$ (en el argumento), no de $A$.\n\n"
        "Mayor $|A|$ = onda más dramática. Pequeño $|A|$ = onda que ni se nota en el gráfico."
    ),
    "white_trigonometric_lexi_15": (
        "El **círculo unitario** asocia cada ángulo $\\theta$ con el punto $P=(\\cos\\theta,\\,\\operatorname{sen}\\theta)$ sobre la circunferencia de radio $1$. "
        "El ángulo $\\theta=0$ corresponde al punto $(1,0)$, cuya coordenada $y$ es $0$.\n\n"
        "Por lo tanto $\\operatorname{sen}(0)=0$. Nótese que $\\cos(0)=1$ (coordenada $x$). "
        "Los valores $1$ y $-1$ son los extremos del seno, que ocurren en $\\pi/2$ y $3\\pi/2$ respectivamente.\n\n"
        "$\\operatorname{sen}(0)=0$: el seno arranca con humildad antes de dispararse al techo."
    ),
    "white_trigonometric_lexi_16": (
        "En el **círculo unitario**, el ángulo $\\theta=0$ corresponde al punto $P=(1,0)$. "
        "El coseno es la coordenada $x$ de ese punto: $\\cos(0)=1$.\n\n"
        "El coseno arranca en su **máximo** ($1$) cuando $\\theta=0$, a diferencia del seno que arranca en $0$. "
        "Por eso la gráfica del coseno tiene un pico en el origen, mientras que la del seno tiene un cruce por cero.\n\n"
        "$\\cos(0)=1$: el coseno llega al primer día con toda la energía. El seno prefiere arrancar despacio."
    ),
    "white_trigonometric_lexi_17": (
        "En el círculo unitario, $\\theta=\\pi/2$ corresponde al punto $P=(0,1)$: el extremo superior de la circunferencia. "
        "El seno es la coordenada $y$, por lo que $\\operatorname{sen}(\\pi/2)=1$.\n\n"
        "$\\pi/2$ radianes $=90°$. El triángulo rectángulo estándar de $30°$-$60°$-$90°$ da $\\operatorname{sen}(90°)=\\text{cateto opuesto}/\\text{hipotenusa}=1/1=1$. "
        "Este es el **máximo global** del seno.\n\n"
        "$\\operatorname{sen}(\\pi/2)=1$: el seno en su cima, feliz de haber llegado hasta arriba."
    ),
    "white_trigonometric_lexi_18": (
        "En el círculo unitario, $\\theta=\\pi/2$ corresponde al punto $P=(0,1)$: el tope de la circunferencia. "
        "El coseno es la coordenada $x$, y en ese punto $x=0$: luego $\\cos(\\pi/2)=0$.\n\n"
        "Este resultado puede sorprender: cuando el seno está en su máximo ($1$), el coseno vale $0$. "
        "Es la esencia de la identidad pitagórica: $\\operatorname{sen}^2+\\cos^2=1$ implica que si uno vale $1$, el otro vale $0$.\n\n"
        "Seno y coseno en $\\pi/2$: uno arriba, el otro a nivel del suelo. Turnan los protagonismos."
    ),
    "white_trigonometric_lexi_19": (
        "En el círculo unitario, $\\theta=\\pi$ ($=180°$) corresponde al punto $P=(-1,0)$: el extremo izquierdo de la circunferencia. "
        "El seno es la coordenada $y=0$, por lo que $\\operatorname{sen}(\\pi)=0$.\n\n"
        "Los cruces por cero del seno ocurren en $x=k\\pi$ con $k\\in\\mathbb{Z}$ (los múltiplos de $\\pi$). "
        "En $\\pi$ la curva ya bajó de su máximo ($\\pi/2$) y regresa al eje $X$ antes de seguir hacia el mínimo.\n\n"
        "$\\operatorname{sen}(\\pi)=0$: el seno hizo el ciclo completo de subir y volvió a cero. ¡Qué disciplina!"
    ),
    "white_trigonometric_lexi_20": (
        "Una función es **par** si $f(-x)=f(x)$ (simétrica respecto al eje $Y$) e **impar** si $f(-x)=-f(x)$ (simétrica respecto al origen). "
        "Ambas propiedades se verifican desde la definición del círculo unitario.\n\n"
        "El seno es impar: $\\operatorname{sen}(-x)=-\\operatorname{sen}(x)$. El coseno es par: $\\cos(-x)=\\cos(x)$. "
        "Visualmente, la gráfica del coseno es un espejo respecto al eje vertical, mientras que la del seno rota $180°$ respecto al origen.\n\n"
        "Impar, par… el seno y coseno eligieron sus géneros matemáticos desde el principio y nunca los cambiaron."
    ),
    "white_trigonometric_lexi_21": (
        "El **dominio** es el conjunto de valores de $x$ para los cuales la función está definida. "
        "La función $f(x)=\\operatorname{sen}(x)$ está definida para **cualquier** ángulo real: positivo, negativo, cero, o irracional.\n\n"
        "No hay restricción porque el círculo unitario acepta cualquier ángulo. "
        "Contraste: $\\ln(x)$ exige $x>0$; $1/x$ excluye $x=0$. El seno no pone condiciones: dominio $=\\mathbb{R}$.\n\n"
        "El seno: la función más inclusiva del análisis. Todos los ángulos son bienvenidos, sin excepciones."
    ),
    "white_trigonometric_lexi_22": (
        "El **período** de $f(x)=\\operatorname{sen}(Bx)$ es $T=2\\pi/|B|$. Al multiplicar el argumento por $B$, la onda se comprime (si $|B|>1$) o se estira (si $|B|<1$) horizontalmente.\n\n"
        "Razonamiento: el ciclo completo del seno ocurre cuando el argumento recorre $[0,2\\pi]$. "
        "Si el argumento es $Bx$, eso pasa cuando $x$ recorre $[0,2\\pi/B]$. Luego $T=2\\pi/B$.\n\n"
        "Mayor $B$ = ciclos más cortos y frecuentes. El seno acelera sin perder el ritmo."
    ),
    "white_trigonometric_lexi_23": (
        "En $f(x)=\\operatorname{sen}(2x)$, el parámetro $B=2$ duplica la frecuencia: el período es $T=2\\pi/2=\\pi$. "
        "En el intervalo $[0,2\\pi]$ caben exactamente $2\\pi/\\pi=2$ períodos completos.\n\n"
        "$\\begin{aligned}\nT &= \\frac{2\\pi}{B} \\\\\\\\\n&= \\frac{2\\pi}{2} \\\\\\\\\n&= \\pi\n\\end{aligned}$\n\n"
        "Ciclos en $[0,2\\pi]$: $2\\pi/\\pi=2$. La función completa dos oscilaciones donde $\\operatorname{sen}(x)$ solo completa una. Velocidad doble, energía doble."
    ),
    "white_trigonometric_lexi_24": (
        "En $f(x)=\\operatorname{sen}(x)+D$, el parámetro $D$ es el **desplazamiento vertical**: traslada todo el gráfico hacia arriba (si $D>0$) o hacia abajo (si $D<0$). "
        "El eje de oscilación pasa a ser la recta $y=D$.\n\n"
        "La amplitud sigue siendo $1$, el período sigue siendo $2\\pi$, y la forma de la onda no cambia. "
        "Solo se mueve el piso: máximo $=1+D$, mínimo $=-1+D$.\n\n"
        "$D$ es el ascensor de la onda: no cambia su forma, solo el piso en que vive."
    ),
    "white_trigonometric_lexi_25": (
        "En $f(x)=\\operatorname{sen}(x-C)$ con $C>0$, el gráfico se **desplaza hacia la derecha** $C$ unidades. "
        "El cruce por cero que en $\\operatorname{sen}(x)$ ocurre en $x=0$ ahora ocurre en $x=C$.\n\n"
        "Regla: restar $C$ al argumento $\\Rightarrow$ desplazamiento **hacia la derecha**. Sumar $C$ $\\Rightarrow$ desplazamiento **hacia la izquierda**. "
        "Es contraintuitivo pero se comprueba: $\\operatorname{sen}(0-C)<0$ para $C>0$ si en $0$ la función todavía no llegó a su cero.\n\n"
        "El seno llega tarde a la fiesta en $x=C$, no en $x=0$. La invitación decía desplazamiento derecho."
    ),
    "white_trigonometric_lexi_26": (
        "En $f(x)=A\\,\\operatorname{sen}(x)+D$, el **máximo** se alcanza cuando $\\operatorname{sen}(x)=1$: en ese punto $f=D+|A|$.\n\n"
        "$\\begin{aligned}\n\\text{máx} &= D + |A| \\\\\\\\\n&= 1 + 3 \\\\\\\\\n&= 4\n\\end{aligned}$\n\n"
        "La opción $3$ es la amplitud ($|A|$), no el máximo. La opción $1$ es el desplazamiento ($D$). El máximo siempre suma ambos. Para la función $3\\,\\operatorname{sen}(x)+1$, la cima está en $y=4$."
    ),
    "white_trigonometric_lexi_27": (
        "En $g(x)=A\\cos(x)+D$, el **mínimo** se alcanza cuando $\\cos(x)=-1$: en ese punto $g=D-|A|$.\n\n"
        "$\\begin{aligned}\n\\text{mín} &= D - |A| \\\\\\\\\n&= -1 - 2 \\\\\\\\\n&= -3\n\\end{aligned}$\n\n"
        "Tanto si $A>0$ como si $A<0$, siempre se resta $|A|$ del desplazamiento $D$. La opción $-1$ es solo $D$; la $-2$ es $-|A|$ sin el desplazamiento. El mínimo real es $-3$."
    ),
    "white_trigonometric_lexi_28": (
        "La **identidad pitagórica fundamental** es $\\operatorname{sen}^2(x)+\\cos^2(x)=1$. "
        "Proviene del teorema de Pitágoras aplicado al punto $(\\cos x,\\operatorname{sen}x)$ sobre el círculo unitario: ese punto siempre está a distancia $1$ del origen.\n\n"
        "Todas las demás identidades trigonométricas se derivan de esta. Por ejemplo, dividiendo por $\\cos^2(x)$: $\\tan^2(x)+1=\\sec^2(x)$. "
        "La opción $\\operatorname{sen}^2-\\cos^2=1$ es incorrecta; la diferencia no es constante.\n\n"
        "Pitágoras inventó una sola identidad, y los trigonómetros llevan milenios exprimiéndola."
    ),
    "white_trigonometric_lexi_29": (
        "En el intervalo $[0,\\pi/2]$ el ángulo avanza desde el eje positivo $x$ hasta el eje positivo $y$ en el círculo unitario. "
        "La coordenada $y$ (el seno) **sube** de $0$ a $1$ sin interrupciones: la función es **creciente**.\n\n"
        "Puntos clave: $\\operatorname{sen}(0)=0$, $\\operatorname{sen}(\\pi/6)=1/2$, $\\operatorname{sen}(\\pi/4)=\\sqrt{2}/2$, $\\operatorname{sen}(\\pi/2)=1$. "
        "Cada uno mayor que el anterior: creciente estricto.\n\n"
        "El seno en $[0,\\pi/2]$: subida constante hacia la cima, sin pausas ni retrocesos."
    ),
    "white_trigonometric_lexi_30": (
        "Si $f(x)=\\operatorname{sen}(x)$, entonces $g(x)=-\\operatorname{sen}(x)$ refleja cada valor de $f$ respecto al eje $X$: donde $f$ valía $y$, $g$ vale $-y$. "
        "Los máximos de $f$ se convierten en mínimos de $g$ y viceversa.\n\n"
        "Propiedades conservadas: mismo período ($2\\pi$), misma amplitud ($1$), mismo dominio ($\\mathbb{R}$), misma imagen ($[-1,1]$). "
        "Propiedad cambiada: la monotonía se invierte — donde $f$ crecía, $g$ decrece.\n\n"
        "Multiplicar por $-1$: la curva se mira al espejo y sale con todo al revés."
    ),
    "white_trigonometric_lexi_31": (
        "El ángulo $\\pi/6=30°$ pertenece al triángulo rectángulo estándar $30°$-$60°$-$90°$, cuyas proporciones son $1:\\sqrt{3}:2$. "
        "El seno es cateto opuesto sobre hipotenusa: $\\operatorname{sen}(30°)=1/2$.\n\n"
        "Los tres valores clásicos a memorizar son:\n"
        "$\\operatorname{sen}(\\pi/6)=1/2$, $\\operatorname{sen}(\\pi/4)=\\sqrt{2}/2$, $\\operatorname{sen}(\\pi/3)=\\sqrt{3}/2$.\n\n"
        "El $30°$ es el ángulo más modesto del triángulo especial. Su seno, $1/2$, también es el más fácil de recordar."
    ),
    "white_trigonometric_lexi_32": (
        "El ángulo $\\pi/3=60°$ pertenece al triángulo $30°$-$60°$-$90°$ con proporciones $1:\\sqrt{3}:2$. "
        "El coseno es cateto adyacente sobre hipotenusa: $\\cos(60°)=1/2$.\n\n"
        "Observá la simetría: $\\cos(\\pi/3)=\\operatorname{sen}(\\pi/6)=1/2$. Esto se debe a que $\\cos(\\theta)=\\operatorname{sen}(\\pi/2-\\theta)$: son ángulos complementarios.\n\n"
        "El coseno de $60°$ y el seno de $30°$ son gemelos idénticos: ambos valen $1/2$. La trigonometría tiene favoritos."
    ),
    "white_trigonometric_lexi_33": (
        "Una función $f$ es **periódica** si existe un número $T>0$ tal que $f(x+T)=f(x)$ para todo $x$ en el dominio. "
        "Al período mínimo que cumple esto se lo llama el período fundamental.\n\n"
        "Las opciones incorrectas confunden la condición: $f(x \\cdot T)=f(x)$ es escala, no traslación; $f(x+T)=f(x)-T$ no es periódica; $f(x)=T$ es constante. "
        "Solo $f(x+T)=f(x)$ captura la repetición exacta por traslación horizontal.\n\n"
        "Periódica = misma película, pero el proyector avanza $T$ unidades cada vez."
    ),
    "white_trigonometric_lexi_34": (
        "La **tangente** se define como el cociente $\\tan(x)=\\dfrac{\\operatorname{sen}(x)}{\\cos(x)}$. "
        "No está definida cuando el denominador es cero: $\\cos(x)=0$ en $x=\\pi/2+k\\pi$, lo que genera asíntotas verticales.\n\n"
        "La opción $\\tan=\\operatorname{sen}\\cdot\\cos$ es incorrecta (es un producto, no un cociente). "
        "La opción $\\cos/\\operatorname{sen}$ da la **cotangente**, no la tangente.\n\n"
        "$\\tan(x)=\\operatorname{sen}(x)/\\cos(x)$: la tangente es el seno dividido por el coseno, no al revés. Fácil de confundir en el examen."
    ),
    "white_trigonometric_lexi_35": (
        "El **período** de $f(x)=\\cos(x)$ es $2\\pi$, igual que el del seno. Ambas funciones completan un ciclo exacto cada $2\\pi$ radianes.\n\n"
        "El coseno y el seno comparten período porque son la misma onda desplazada: $\\cos(x)=\\operatorname{sen}(x+\\pi/2)$. "
        "Por eso sus propiedades globales (período, amplitud, imagen) son idénticas; solo difieren en la fase.\n\n"
        "Seno y coseno: hermanos gemelos con el mismo período. Uno arranca arriba, el otro desde cero. Rivales de gráfico, idénticos de período."
    ),
    "white_trigonometric_lexi_36": (
        "La **imagen** de $f(x)=2\\,\\operatorname{sen}(x)$ se obtiene escalando la imagen de $\\operatorname{sen}(x)$. "
        "Como $\\operatorname{sen}(x)\\in[-1,1]$, multiplicar por $2$ da $2\\,\\operatorname{sen}(x)\\in[-2,2]$.\n\n"
        "La imagen $[-1,1]$ corresponde al seno sin escala ($A=1$). $[0,2]$ sería el rango si la función nunca fuera negativa, lo que no es el caso. "
        "La amplitud $2$ significa que el rango se extiende $2$ unidades hacia arriba y $2$ hacia abajo desde el eje.\n\n"
        "Doblar la amplitud: la onda tiene más drama, pero sigue siendo simétrica."
    ),
    "white_trigonometric_lexi_37": (
        "Una función es **par** si $f(-x)=f(x)$ para todo $x$: su gráfica es simétrica respecto al eje $Y$. "
        "El coseno cumple esto porque $\\cos(-x)=\\cos(x)$, lo que se verifica directamente del círculo unitario.\n\n"
        "En el círculo unitario, los ángulos $\\theta$ y $-\\theta$ comparten la misma coordenada $x$ (coseno) pero tienen coordenadas $y$ opuestas (senos). "
        "Por eso el coseno es par y el seno es impar.\n\n"
        "$\\cos(-x)=\\cos(x)$: el coseno no distingue el pasado del futuro. Simétrico en el tiempo, disciplinado en la gráfica."
    ),
    "white_trigonometric_lexi_38": (
        "$\\operatorname{sen}(x)=0$ cuando el punto en el círculo unitario tiene coordenada $y=0$: eso ocurre en $\\theta=0$ y $\\theta=\\pi$ (y sus repeticiones periódicas). "
        "La solución general es $x=k\\pi$ con $k\\in\\mathbb{Z}$.\n\n"
        "La opción $x=\\pi/2+k\\pi$ da los **extremos** (máximo y mínimo), no los ceros. "
        "$x=2k\\pi$ solo captura los ceros pares, omite los impares ($\\pi,3\\pi,\\ldots$). "
        "$x=\\pi/4+k\\pi$ no es correcto: $\\operatorname{sen}(\\pi/4)=\\sqrt{2}/2\\neq0$.\n\n"
        "El seno cruza el eje $X$ en todos los múltiplos de $\\pi$. Hace escala en cada entero de $\\pi$."
    ),
    "white_trigonometric_lexi_39": (
        "$\\cos(x)=1$ cuando el punto en el círculo unitario es $(1,0)$: eso ocurre en $\\theta=0$ y se repite cada $2\\pi$. "
        "La solución general es $x=2k\\pi$ con $k\\in\\mathbb{Z}$.\n\n"
        "La opción $x=\\pi/2+2k\\pi$ da los ceros del coseno (máximos del seno). "
        "$x=k\\pi$ da tanto los máximos ($+1$ en $x=2k\\pi$) como los mínimos ($-1$ en $x=(2k+1)\\pi$): demasiado amplio. "
        "Solo $x=2k\\pi$ garantiza $\\cos(x)=+1$.\n\n"
        "El coseno alcanza el techo ($1$) en $x=0, 2\\pi, 4\\pi, \\ldots$: vuelta completa al punto de partida."
    ),
    "white_trigonometric_lexi_40": (
        "En $f(x)=\\operatorname{sen}(2x)$, el coeficiente $B=2$ **comprime** el período a la mitad: $T=2\\pi/B=2\\pi/2=\\pi$.\n\n"
        "$\\begin{aligned}\nT &= \\frac{2\\pi}{B} \\\\\\\\\n&= \\frac{2\\pi}{2} \\\\\\\\\n&= \\pi\n\\end{aligned}$\n\n"
        "Los distractores $2\\pi$ (sin modificar $B$) y $4\\pi$ (como si $B=1/2$) son errores frecuentes. $\\pi/2$ correspondería a $B=4$. Con $B=2$, la respuesta correcta es $\\pi$."
    ),
    "white_trigonometric_lexi_41": (
        "En $g(x)=\\operatorname{sen}(x/2)$, el coeficiente $B=1/2$ **estira** el período al doble: $T=2\\pi/B=2\\pi/(1/2)=4\\pi$.\n\n"
        "$\\begin{aligned}\nT &= \\frac{2\\pi}{B} \\\\\\\\\n&= \\frac{2\\pi}{1/2} \\\\\\\\\n&= 4\\pi\n\\end{aligned}$\n\n"
        "Un $B$ menor que $1$ hace que la onda tarde más en completar un ciclo. Con $B=1/2$, la onda va a paso de tortuga: $4\\pi\\approx12{,}57$ unidades por ciclo."
    ),
    "white_trigonometric_lexi_42": (
        "Una oscilación regular que sube y baja periódicamente se modela con funciones trigonométricas. "
        "Si la temperatura oscila entre $10°C$ y $30°C$ cada $24$ horas, la función es $T(t)=10\\,\\operatorname{sen}(Bt)+20$.\n\n"
        "Aquí $|A|=10$ (amplitud = mitad del rango $=20/2$), $D=20$ (valor medio), y $B=2\\pi/24=\\pi/12$ (período de $24$ horas). "
        "Ninguna función lineal, exponencial o logarítmica produce un comportamiento que sube y baja de modo cíclico.\n\n"
        "Si la temperatura hace olas, el seno es el modelo. Las funciones lineales no saben de mareas."
    ),
    "white_trigonometric_lexi_43": (
        "Las **mareas** siguen un ciclo de subida y bajada aproximadamente cada $12{,}4$ horas. "
        "Ese comportamiento oscilatorio periódico es exactamente lo que captura la función $h(t)=A\\,\\operatorname{sen}(Bt+C)+D$.\n\n"
        "El parámetro $B=2\\pi/12{,}4$ fija el período; $A$ es la amplitud de la marea; $D$ es el nivel medio; $C$ ajusta la fase inicial. "
        "Las funciones $e^{kt}$ solo crecen o decaen; $\\log(t)$ solo crece; una lineal no oscila.\n\n"
        "Las mareas eligieron el seno como modelo hace millones de años antes de que existieran los matemáticos."
    ),
    "white_trigonometric_lexi_44": (
        "La transformación $x\\mapsto -x$ en el argumento de $\\operatorname{sen}$ usa la paridad impar: $\\operatorname{sen}(-x)=-\\operatorname{sen}(x)$. "
        "Eso equivale a una **reflexión respecto al eje $Y$** combinada con la imparidad del seno, que produce una reflexión respecto al eje $X$.\n\n"
        "En la práctica: $g(x)=\\operatorname{sen}(-x)=-\\operatorname{sen}(x)$. Es como reflejar la curva verticalmente (eje $X$), no horizontalmente (eje $Y$). "
        "La reflexión respecto al eje $Y$ de una función impar es idéntica a multiplicar por $-1$.\n\n"
        "El seno es tan impar que voltear su eje $Y$ es lo mismo que darle vuelta entera."
    ),
    "white_trigonometric_lexi_45": (
        "La **imagen** de $f(x)=\\cos(x)+3$ se obtiene desplazando el rango de $\\cos(x)=[-1,1]$ exactamente $3$ unidades hacia arriba.\n\n"
        "$\\begin{aligned}\n\\text{imagen} &= [-1+3,\\; 1+3] \\\\\\\\\n&= [2,\\; 4]\n\\end{aligned}$\n\n"
        "La opción $[-1,1]$ es el rango sin el desplazamiento. $[3,4]$ sería si la amplitud fuera $0{,}5$. $\\mathbb{R}$ es el dominio. La clave es sumar $D$ a ambos extremos del rango base."
    ),
    "white_trigonometric_lexi_46": (
        "Las funciones $\\operatorname{sen}(x)$ y $\\cos(x)$ tienen exactamente las mismas propiedades globales: período $2\\pi$, amplitud $1$, dominio $\\mathbb{R}$, imagen $[-1,1]$. "
        "Se diferencian solo en la **fase inicial**: $\\cos(x)=\\operatorname{sen}(x+\\pi/2)$.\n\n"
        "Las afirmaciones incorrectas son: que tienen diferente amplitud (ambas tienen $1$), que tienen diferente período (ambas tienen $2\\pi$), y que son la misma función (están desfasadas $\\pi/2$). "
        "Son gemelas con distinta hora de partida.\n\n"
        "Seno y coseno: mismo cuerpo, mismo período, misma amplitud. El coseno solo llegó antes a la fiesta por $\\pi/2$."
    ),
    "white_trigonometric_lexi_47": (
        "En el intervalo $[0,\\pi]$, el ángulo parte del extremo derecho del círculo unitario $(\\cos(0)=1)$ y avanza hasta el extremo izquierdo $(\\cos(\\pi)=-1)$. "
        "La coordenada $x$ (coseno) disminuye continuamente: la función es **decreciente**.\n\n"
        "Valores intermedios: $\\cos(\\pi/2)=0$, $\\cos(2\\pi/3)=-1/2$. Todos decrecientes. "
        "La función de coseno luego crece en $[\\pi, 2\\pi]$ (de $-1$ a $1$).\n\n"
        "El coseno en $[0,\\pi]$: una bajada digna desde el techo hasta el sótano, sin pausas."
    ),
    "white_trigonometric_lexi_48": (
        "La relación entre coseno y seno como desfase se establece con la identidad $\\cos(x)=\\operatorname{sen}\\!\\left(x+\\dfrac{\\pi}{2}\\right)$. "
        "Esto significa que el coseno está **adelantado** $\\pi/2$ respecto al seno.\n\n"
        "Verificación: $\\cos(0)=1$ y $\\operatorname{sen}(0+\\pi/2)=\\operatorname{sen}(\\pi/2)=1$ ✓. "
        "La opción $\\cos(x)=\\operatorname{sen}(x-\\pi/2)$ tiene el signo del desfase invertido: eso da $\\cos(0)=\\operatorname{sen}(-\\pi/2)=-1$ ✗.\n\n"
        "El coseno llegó $\\pi/2$ antes al máximo. El seno siempre llega tarde, pero llega."
    ),
    "white_trigonometric_lexi_49": (
        "Para que $f(x)=\\operatorname{sen}(x)+2$ tenga raíces, necesitaría que $\\operatorname{sen}(x)+2=0$, es decir $\\operatorname{sen}(x)=-2$. "
        "Pero la imagen del seno es $[-1,1]$: el valor $-2$ es imposible.\n\n"
        "La imagen de $f$ es $[-1+2,1+2]=[1,3]$: todos los valores son positivos (mínimo $=1>0$). "
        "La curva nunca toca ni cruza el eje $X$. No hay raíces reales.\n\n"
        "$\\operatorname{sen}(x)+2\\geq1>0$ para todo $x$: la curva vive en el primer y segundo cuadrante, sin drama con el eje $X$."
    ),
    "white_trigonometric_lexi_50": (
        "La **amplitud** de $f(x)=A\\cos(x)$ es siempre $|A|$: el valor absoluto del coeficiente. "
        "El signo de $A$ solo determina si la función está reflejada respecto al eje $X$ o no; no afecta la amplitud.\n\n"
        "Para $f(x)=-3\\cos(x)$: amplitud $=|-3|=3$. La curva oscila entre $-3$ y $3$, igual que $3\\cos(x)$, pero invertida (el máximo de $3\\cos$ es mínimo de $-3\\cos$). "
        "La amplitud siempre es no negativa.\n\n"
        "El signo negativo le da vuelta a la onda, pero no la aplasta ni la estira. Amplitud: siempre positiva, sin excepciones."
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

print(f"Done. Updated {count} LEXI explanations.")
