import json

new_explanations = {
    "white_trigonometric_clsf_15": (
        "Una función es **trigonométrica** si su expresión fundamental es $\\operatorname{sen}$, $\\cos$ o $\\tan$ (con sus transformaciones). "
        "Multiplicar por una constante no cambia la familia: sigue siendo periódica con la misma estructura.\n\n"
        "$f(x)=2\\,\\operatorname{sen}(x)$ es trigonométrica con amplitud $2$ y período $2\\pi$. "
        "El factor $2$ es solo la amplitud; no convierte la función en polinómica ni en exponencial.\n\n"
        "Escalar el seno es como subir el volumen: la canción sigue siendo la misma, solo suena más fuerte."
    ),
    "white_trigonometric_clsf_16": (
        "Un **desfase** en el argumento no cambia la familia de la función. $g(x)=\\cos(x-\\pi/2)$ sigue siendo trigonométrica: periódica, acotada, con la misma amplitud y período.\n\n"
        "De hecho, $\\cos(x-\\pi/2)=\\operatorname{sen}(x)$: el desfase convierte el coseno en seno, pero la familia es la misma. "
        "El desfase $C$ en $\\cos(x-C)$ solo corre horizontalmente la curva; no la transforma en una parábola ni en una exponencial.\n\n"
        "Restar $\\pi/2$ al argumento del coseno es como adelantar el reloj: misma canción, distinto horario."
    ),
    "white_trigonometric_clsf_17": (
        "Las **mareas** suben y bajan de forma periódica aproximadamente cada $12{,}4$ horas (período lunar). "
        "Ese comportamiento oscilatorio regular corresponde exactamente a una función trigonométrica: $h(t)=A\\,\\operatorname{sen}(Bt)+D$.\n\n"
        "Con período $T=12{,}4$: $B=2\\pi/12{,}4\\approx0{,}507$. "
        "Una función lineal solo sube o baja; una exponencial no regresa; una logarítmica tampoco oscila. Solo la trigonométrica modela el vaivén.\n\n"
        "Las mareas: el fenómeno natural que más claramente es trigonométrico. El océano aprendió el seno antes que nosotros."
    ),
    "white_trigonometric_clsf_18": (
        "Una temperatura que oscila entre $10°C$ y $30°C$ de manera **cíclica** a lo largo del día es el patrón clásico de una función trigonométrica. "
        "La amplitud es la mitad del rango: $A=(30-10)/2=10$. El eje es el valor medio: $D=(30+10)/2=20$.\n\n"
        "La función modelo es $T(t)=10\\,\\operatorname{sen}(Bt)+20$ con período $24$ horas ($B=2\\pi/24=\\pi/12$). "
        "Ninguna función lineal, exponencial ni logarítmica produce el patrón de subida y bajada diaria.\n\n"
        "El día tiene seno: la temperatura sube, baja, y se repite. El termómetro confirma la trigonometría."
    ),
    "white_trigonometric_clsf_19": (
        "La función $h(x)=\\operatorname{sen}(2x)$ es **trigonométrica**: es el seno estándar con el período comprimido a la mitad ($T=\\pi$), pero la familia no cambia.\n\n"
        "Multiplicar el argumento por $2$ cambia el período ($T=2\\pi/2=\\pi$), no la familia. La función sigue siendo periódica, con imagen $[-1,1]$ y dominio $\\mathbb{R}$. "
        "Las otras familias (exponencial, logarítmica, lineal) no producen oscilaciones acotadas.\n\n"
        "Doblar $B$ duplica la velocidad de la onda, pero la onda sigue siendo trigonométrica. Como una canción en velocidad $2\\times$."
    ),
    "white_trigonometric_clsf_20": (
        "Una curva que **sube y baja periódicamente** alrededor de un eje central es la firma visual de una función trigonométrica. "
        "En este gráfico la onda oscila entre $0$ y $2$ centrada en $y=1$: eso corresponde a $\\operatorname{sen}(x)+1$.\n\n"
        "Amplitud $=1$ (la mitad del rango $[0,2]$), desplazamiento vertical $D=1$. El período es $2\\pi$. "
        "Una función cuadrática formaría una parábola; una exponencial no regresa; ninguna otra familia produce este patrón cíclico acotado.\n\n"
        "Onda centrada en $y=1$: el seno tomó clases de natación y ahora nada entre $0$ y $2$."
    ),
    "white_trigonometric_clsf_21": (
        "Una onda simétrica respecto al eje $X$ con máximo $2$ y mínimo $-2$ y con comportamiento periódico es una **función trigonométrica** de amplitud $2$. "
        "El gráfico corresponde a $f(x)=2\\,\\operatorname{sen}(x)$.\n\n"
        "Las señales distintivas son: periodicidad, imagen acotada $[-2,2]$, dominio $\\mathbb{R}$, y la curva en forma de ola. "
        "Una parábola no es acotada ni periódica. Una exponencial crece sin límite. Solo el seno/coseno oscila de este modo.\n\n"
        "Amplitud $2$, simetría perfecta: el seno musculoso que llega a $\\pm2$ sin esfuerzo."
    ),
    "white_trigonometric_clsf_22": (
        "La función $p(x)=-\\cos(x)$ es **trigonométrica**: es el coseno reflejado verticalmente. "
        "La reflexión no cambia la familia; solo invierte máximos y mínimos.\n\n"
        "Propiedades: período $=2\\pi$, amplitud $=1$, imagen $=[-1,1]$, dominio $=\\mathbb{R}$. Todo idéntico al coseno, salvo que el máximo de $\\cos$ ($x=0$) se convierte en el mínimo de $-\\cos$. "
        "Ningún signo negativo fuera del seno/coseno puede cambiar la familia.\n\n"
        "Poner un $-$ adelante del coseno es como ver el gráfico en un espejo horizontal: misma familia, distinta orientación."
    ),
    "white_trigonometric_clsf_23": (
        "La función $q(x)=\\operatorname{sen}(x/2)$ es **trigonométrica**: el argumento $x/2$ estira el período al doble ($T=4\\pi$), pero la función sigue siendo periódica y acotada.\n\n"
        "Con $B=1/2$: período $=2\\pi/(1/2)=4\\pi$. La imagen sigue siendo $[-1,1]$. El dominio sigue siendo $\\mathbb{R}$. "
        "Cualquier transformación del argumento de $\\operatorname{sen}$ que sea de la forma $Bx$ conserva la periodicidad.\n\n"
        "Dividir el argumento por $2$ es como poner la canción en cámara lenta: el ritmo baja, pero sigue siendo la misma melodía."
    ),
    "white_trigonometric_clsf_24": (
        "El turismo estacional que **sube en verano y baja en invierno** y se repite cada $12$ meses sigue un patrón **periódico**: la función correcta es trigonométrica.\n\n"
        "Modelo: $C(m)=A\\,\\operatorname{sen}(Bt+D_0)+D$ con período $T=12$ meses, amplitud $A$ proporcional a la variación, y $D$ = promedio anual. "
        "Una función lineal no regresa; una exponencial no oscila; una logarítmica crece sin cota. "
        "Solo la trigonométrica modela el sube-y-baja que se repite año tras año.\n\n"
        "El turismo tiene seno: verano arriba, invierno abajo, y vuelta a empezar. La hoja de cálculo del tour-operador es una sinusoide."
    ),
    "white_trigonometric_clsf_25": (
        "Una onda que completa **dos ciclos** en el intervalo $[0,2\\pi]$ tiene período $\\pi$, lo que corresponde a $B=2$ en $T=2\\pi/B$. "
        "El gráfico muestra $\\cos(2x)$: función trigonométrica.\n\n"
        "$\\begin{aligned}\nT &= \\frac{2\\pi}{B} \\\\\\\\\n\\pi &= \\frac{2\\pi}{2}\n\\end{aligned}$\n\n"
        "La familia es trigonométrica porque la curva es periódica, acotada, y oscila simétricamente. Una función lineal, exponencial o cuadrática no produce este comportamiento."
    ),
    "white_trigonometric_clsf_26": (
        "Las familias de las opciones: $2^x$ es **exponencial**, $\\log(x)$ es **logarítmica**, $x^2+1$ es **polinómica** (cuadrática). "
        "Solo $\\operatorname{sen}(x)+1$ es **trigonométrica**: periódica, acotada, con imagen $[0,2]$.\n\n"
        "La clave para identificar una trigonométrica es la **periodicidad** y la **imagen acotada**. "
        "Ninguna de las otras tres familias produce un comportamiento que oscile entre dos valores fijos de modo indefinido.\n\n"
        "Cuatro familias, una sola trigonométrica. Las otras hacen cosas distintas: crecer, decrecer, o tener vértice. Solo el seno oscila."
    ),
    "white_trigonometric_clsf_27": (
        "La función $r(x)=3\\cos(x)$ es **trigonométrica**: es el coseno con amplitud $3$. "
        "Multiplicar por $3$ estira la onda verticalmente pero no cambia la familia.\n\n"
        "Propiedades: período $=2\\pi$, amplitud $=3$, imagen $=[-3,3]$, dominio $=\\mathbb{R}$, periódica. "
        "Una función cuadrática ($ax^2+bx+c$) tiene un vértice único y no es periódica. "
        "Una exponencial crece sin cota. Una trigonométrica es la única que oscila periódicamente.\n\n"
        "$3\\cos(x)$: el coseno con esteroides. Mismo ritmo, mayor amplitud, misma familia."
    ),
    "white_trigonometric_clsf_28": (
        "Una función con **asíntota vertical en $x=0$** y **dominio $(0,+\\infty)$** no puede ser trigonométrica: el seno y coseno están definidos para todo $\\mathbb{R}$ y no tienen asíntotas verticales.\n\n"
        "El perfil descrito (asíntota vertical, dominio semirecto) es característico de la familia **logarítmica**: $\\ln(x)$, $\\log_2(x)$, etc. "
        "La tangente $\\tan(x)$ tiene asíntotas, pero en infinitos valores de $x$, no en uno solo.\n\n"
        "Asíntota vertical única + dominio semipositivo = logarítmica. El seno ni siquiera sabe lo que es una asíntota."
    ),
    "white_trigonometric_clsf_29": (
        "Una onda que en $x=0$ vale $0$ y **desciende primero** hacia su mínimo es la función $-\\operatorname{sen}(x)$: la reflexión vertical del seno. "
        "El seno estándar sube de $0$; el $-\\operatorname{sen}(x)$ baja de $0$.\n\n"
        "La familia es **trigonométrica**: la curva es periódica, acotada en $[-1,1]$, con período $2\\pi$. "
        "El signo negativo invierte la dirección inicial pero no cambia la familia. "
        "Una curva cuadrática no regresa; una logarítmica no oscila.\n\n"
        "$-\\operatorname{sen}(x)$: el seno pesimista que en vez de subir, decide bajar primero."
    ),
    "white_trigonometric_clsf_30": (
        "La función $f(x)=2\\,\\operatorname{sen}(x)+1$ es **trigonométrica**: el seno con amplitud $2$ y desplazamiento vertical $D=1$. "
        "Los parámetros $A$ y $D$ modifican la escala y posición, pero no cambian la familia.\n\n"
        "Propiedades: período $=2\\pi$, amplitud $=2$, imagen $=[-1,3]$, dominio $=\\mathbb{R}$, periódica. "
        "Ninguna transformación vertical (multiplicar por $A$, sumar $D$) convierte al seno en una parábola o en una exponencial.\n\n"
        "Estirá y desplazá el seno cuanto quieras: seguirá siendo trigonométrico. Es terco así."
    ),
    "white_trigonometric_clsf_31": (
        "Las horas de luz solar varían **periódicamente** a lo largo del año: máximo en el solsticio de verano, mínimo en el de invierno, y vuelta a empezar. "
        "Con un rango de $9$ a $15$ horas y período $T=365$ días, la función modelo es $f(t)=3\\,\\operatorname{sen}(Bt)+12$.\n\n"
        "Amplitud $=(15-9)/2=3$, eje $=(15+9)/2=12$, $B=2\\pi/365$. "
        "Una función lineal no regresa cada año; una exponencial no oscila. Solo la trigonométrica captura el ciclo solar.\n\n"
        "La Tierra gira y el seno lo sigue: cada año, el mismo ciclo de luz calculado con $3\\,\\operatorname{sen}(2\\pi t/365)+12$."
    ),
    "white_trigonometric_clsf_32": (
        "Una función con **único mínimo global** en $x=0$ que **crece indefinidamente** hacia ambos lados es una **parábola**: $f(x)=ax^2+c$ con $a>0$. "
        "Esto es una función **cuadrática**, no trigonométrica.\n\n"
        "Las trigonométricas tienen **infinitos** mínimos locales (el patrón oscilatorio se repite), imagen acotada, y no crecen indefinidamente. "
        "La cuadrática tiene exactamente un vértice y su imagen es $[\\text{mín},+\\infty)$.\n\n"
        "Un único mínimo y crecimiento infinito: las parabólicas son las campeones de 'toco fondo y vuelo'. Las trig nunca vuelan tan alto."
    ),
    "white_trigonometric_clsf_33": (
        "Una onda periódica con máximo $3$, mínimo $-3$ y período $2\\pi$ es la firma de una función **trigonométrica** de amplitud $3$. "
        "El gráfico corresponde a $f(x)=3\\,\\operatorname{sen}(x)$ o $3\\cos(x)$.\n\n"
        "Las señales: imagen acotada $[-3,3]$, periodicidad con $T=2\\pi$, curva en forma de ola. "
        "Ninguna función racional, cuadrática ni logarítmica produce este perfil. "
        "La amplitud $3$ la da el coeficiente $A=3$ frente al seno o coseno.\n\n"
        "Onda con amplitud $3$ y período $2\\pi$: el seno no necesita más descripción. Ya sabe quién es."
    ),
    "white_trigonometric_clsf_34": (
        "La función $f(x)=\\operatorname{sen}(x)-1$ es **trigonométrica**: el seno desplazado $1$ unidad hacia abajo. "
        "El desplazamiento vertical cambia la imagen ($[-2,0]$) pero no la familia.\n\n"
        "Sigue siendo periódica (período $2\\pi$), acotada (imagen $[-2,0]$), definida en todo $\\mathbb{R}$, y oscilante. "
        "Ninguna de esas propiedades cambia por restar una constante. "
        "La opción cuadrática no es periódica; la logarítmica no es acotada ni periódica.\n\n"
        "Bajar la onda un escalón: el seno ahora duerme entre $-2$ y $0$, pero sigue soñando en trigonométrico."
    ),
    "white_trigonometric_clsf_35": (
        "La función $g(x)=\\cos(x/2)$ es **trigonométrica**: el coseno con argumento escalado por $1/2$, que estira el período a $4\\pi$. "
        "Cualquier transformación del argumento de $\\cos$ de la forma $Bx$ conserva la periodicidad.\n\n"
        "Con $B=1/2$: período $=2\\pi/(1/2)=4\\pi$. Imagen $=[-1,1]$. Dominio $=\\mathbb{R}$. "
        "El coseno sigue siendo periódico; simplemente tarda más en completar un ciclo.\n\n"
        "Dividir el argumento por $2$: el coseno en modo relajado, mismo recorrido pero con el doble de tiempo."
    ),
    "white_trigonometric_clsf_36": (
        "El consumo eléctrico con **dos picos al año** (verano e invierno) y un ciclo de $12$ meses sigue un patrón periódico de período $6$ meses (dos picos por año). "
        "Eso corresponde a una función **trigonométrica**: $C(t)=A\\cos(Bt)+D$ con $T=6$ meses.\n\n"
        "$B=2\\pi/6=\\pi/3$. La función $A\\cos(\\pi t/3)+D$ tiene picos cada $6$ meses. "
        "Una lineal no oscila; una exponencial no regresa; una logarítmica no sube y baja. Solo la trigonométrica modela dos picos anuales.\n\n"
        "Verano: aire acondicionado. Invierno: calefacción. El seno lo canta todo con la misma función."
    ),
    "white_trigonometric_clsf_37": (
        "Una onda que completa exactamente **un ciclo** en el intervalo $[0,4\\pi]$ tiene período $T=4\\pi$. "
        "Usando $T=2\\pi/B$: $B=2\\pi/(4\\pi)=1/2$. La función es $\\operatorname{sen}(x/2)$: trigonométrica.\n\n"
        "$\\begin{aligned}\nB &= \\frac{2\\pi}{T} \\\\\\\\\n&= \\frac{2\\pi}{4\\pi} \\\\\\\\\n&= \\frac{1}{2}\n\\end{aligned}$\n\n"
        "La familia es trigonométrica porque la curva oscila periódicamente. Un período largo ($4\\pi$) solo significa que la onda es más lenta, no que sea de otra familia."
    ),
    "white_trigonometric_clsf_38": (
        "Asíntotas verticales en $x=\\pi/2+k\\pi$ para todo $k\\in\\mathbb{Z}$ son la firma de la función **tangente**: $\\tan(x)=\\operatorname{sen}(x)/\\cos(x)$, indefinida cuando $\\cos(x)=0$.\n\n"
        "La tangente es **trigonométrica**, no racional. Una función racional tiene finitos polos; la tangente tiene infinitos. "
        "Una cuadrática no tiene asíntotas. Una logarítmica tiene asíntota en un solo punto.\n\n"
        "Infinitas asíntotas equiespaciadas en $\\pi/2+k\\pi$: solo la tangente se comporta así. Las racionales no llegan a tanto."
    ),
    "white_trigonometric_clsf_39": (
        "La función $h(x)=2\\cos(x)+1$ es **trigonométrica**: el coseno con amplitud $2$ y desplazamiento vertical $D=1$. "
        "Los parámetros $A$ y $D$ no cambian la familia.\n\n"
        "Propiedades: período $=2\\pi$, amplitud $=2$, imagen $=[-1,3]$, dominio $=\\mathbb{R}$, periódica. "
        "Una función lineal tiene la forma $ax+b$ y no oscila. La clave es el coseno en la expresión, que garantiza la periodicidad.\n\n"
        "Coseno con +1 arriba: la familia no cambia. Amplitud y desplazamiento son accesorios; el coseno es el apellido."
    ),
    "white_trigonometric_clsf_40": (
        "Las propiedades listadas —dominio $\\mathbb{R}$, imagen acotada $[-1,1]$, **periódica**— son exactamente las de la familia **trigonométrica**. "
        "Ninguna otra familia cumple los tres requisitos simultáneamente.\n\n"
        "Exponencial: imagen $(0,+\\infty)$, no acotada superiormente, no periódica. "
        "Lineal: no acotada, no periódica. "
        "Logarítmica: dominio $(0,+\\infty)$, no acotada, no periódica. "
        "Solo $\\operatorname{sen}$ y $\\cos$ son periódicos y acotados en toda la recta real.\n\n"
        "Periódica + acotada + definida en $\\mathbb{R}$: ese trío solo existe en la familia trigonométrica."
    ),
    "white_trigonometric_clsf_41": (
        "La función $f(x)=-2\\,\\operatorname{sen}(x)$ es **trigonométrica**: el seno con amplitud $2$ y reflejado verticalmente. "
        "Ni la reflexión ($A<0$) ni el cambio de amplitud ($|A|=2$) modifican la familia.\n\n"
        "Propiedades: período $=2\\pi$, amplitud $=2$, imagen $=[-2,2]$, dominio $=\\mathbb{R}$, periódica. "
        "La curva oscila igual que $2\\,\\operatorname{sen}(x)$ pero invertida: lo que era máximo es ahora mínimo.\n\n"
        "$-2\\,\\operatorname{sen}(x)$: la versión pesimista del seno escalado. Baja primero, sube después, siempre trigonométrica."
    ),
    "white_trigonometric_clsf_42": (
        "Las vibraciones mecánicas de una membrana producen un desplazamiento que **sube y baja periódicamente** a una frecuencia fija. "
        "Ese patrón es la definición de una función **trigonométrica**: $d(t)=A\\,\\operatorname{sen}(2\\pi f\\cdot t)$.\n\n"
        "Para un sonido de frecuencia $f$ Hz: período $T=1/f$ segundos, amplitud $A$ proporcional al volumen. "
        "Una función cuadrática no oscila indefinidamente; una exponencial no vuelve al equilibrio; solo la trigonométrica modela la vibración periódica.\n\n"
        "El sonido es seno: cada nota musical es una frecuencia, y el desplazamiento de la membrana es su gráfica trigonométrica."
    ),
    "white_trigonometric_clsf_43": (
        "Una onda que **en $x=0$ alcanza su máximo** es un coseno (o $-\\operatorname{sen}$). "
        "En este gráfico el máximo es $2$ y el período es $2\\pi$: la función es $f(x)=2\\cos(x)$. La familia es **trigonométrica**.\n\n"
        "La firma del coseno es arrancar en el máximo: $\\cos(0)=1$, $2\\cos(0)=2$ ✓. "
        "El seno estándar arranca en $0$. La familia trigonométrica incluye tanto seno como coseno.\n\n"
        "Máximo en el origen: el coseno siempre empieza con lo mejor. El seno prefiere arrancar desde cero y ganarlo."
    ),
    "white_trigonometric_clsf_44": (
        "Las funciones $\\operatorname{sen}(x)+\\cos(x)$, $2\\,\\operatorname{sen}(3x)$ y $\\operatorname{sen}^2(x)+\\cos^2(x)=1$ son trigonométricas (la última es constante). "
        "La función $h(x)=e^{\\operatorname{sen}(x)}$ **no es trigonométrica**: es una exponencial cuya base es $e$ y cuyo exponente es $\\operatorname{sen}(x)$.\n\n"
        "La familia de $h$ es **exponencial** (o mixta). La imagen de $h$ es $(e^{-1}, e^1)=(1/e, e)\\approx(0{,}37, 2{,}72)$: acotada, pero la función no es periódica de la misma forma que un seno puro.\n\n"
        "$e^{\\operatorname{sen}(x)}$: el seno como invitado en casa de la exponencial. La anfitriona determina la familia."
    ),
    "white_trigonometric_clsf_45": (
        "La función $f(x)=3\\cos(x)-2$ es **trigonométrica**: el coseno con amplitud $3$ y desplazamiento vertical $D=-2$. "
        "Los parámetros no cambian la familia.\n\n"
        "Propiedades: período $=2\\pi$, amplitud $=3$, imagen $=[-5,1]$, dominio $=\\mathbb{R}$, periódica. "
        "La imagen $[-5,1]$ se obtiene como $[-3-2, 3-2]=[-5,1]$. "
        "Aunque la imagen no es centrada en $0$, la función sigue siendo periódica y trigonométrica.\n\n"
        "Coseno trasladado $2$ hacia abajo: la onda se mudó a una planta inferior, pero sigue siendo del mismo edificio."
    ),
    "white_trigonometric_clsf_46": (
        "Una función **periódica** con período $\\pi$ e imagen $[-1,1]$ es trigonométrica. "
        "El período $\\pi$ requiere $B=2$ en la fórmula $T=2\\pi/B$: la función es $\\operatorname{sen}(2x)$ o $\\cos(2x)$.\n\n"
        "$\\begin{aligned}\nB &= \\frac{2\\pi}{T} \\\\\\\\\n&= \\frac{2\\pi}{\\pi} \\\\\\\\\n&= 2\n\\end{aligned}$\n\n"
        "La imagen $[-1,1]$ confirma amplitud $1$. No hay desplazamiento vertical. La función es trigonométrica con $A=1$, $B=2$, $D=0$."
    ),
    "white_trigonometric_clsf_47": (
        "Una onda centrada en $y=1$ con máximo $2$, mínimo $0$ y período $\\pi$ es **trigonométrica**. "
        "El gráfico corresponde a $\\operatorname{sen}(2x)+1$: amplitud $1$, $B=2$, desplazamiento $D=1$.\n\n"
        "Período $\\pi$ $\\Rightarrow$ $B=2\\pi/\\pi=2$. Imagen $[0,2]$ $\\Rightarrow$ $A=1$, $D=1$. "
        "La familia es trigonométrica porque la curva oscila periódicamente entre dos cotas fijas.\n\n"
        "Onda entre $0$ y $2$ con período $\\pi$: el seno acelerado que además tomó vitaminas (desplazamiento $+1$)."
    ),
    "white_trigonometric_clsf_48": (
        "Una función que **crece sin límite** cuando $x\\to+\\infty$ con imagen $(0,+\\infty)$ es **exponencial**: $f(x)=b^x$ con $b>1$.\n\n"
        "Las trigonométricas siempre tienen imagen acotada ($[-A,A]$ o similar): nunca crecen indefinidamente. "
        "Una cuadrática crece sin cota pero tiene imagen $[\\text{mín},+\\infty)$, no $(0,+\\infty)$. "
        "Una logarítmica tiene imagen $\\mathbb{R}$ (todos los reales), no solo positivos.\n\n"
        "Imagen $(0,+\\infty)$ + crecimiento ilimitado = exponencial. El seno nunca llega a $+\\infty$; se queda en su $[-1,1]$ sin quejarse."
    ),
    "white_trigonometric_clsf_49": (
        "La función $f(x)=-\\cos(x)+2$ es **trigonométrica**: el coseno reflejado y desplazado hacia arriba $2$ unidades. "
        "La reflexión ($-\\cos$) y el desplazamiento ($+2$) son transformaciones que conservan la familia.\n\n"
        "Propiedades: período $=2\\pi$, amplitud $=1$, imagen $=[1,3]$, dominio $=\\mathbb{R}$, periódica. "
        "El mínimo de $\\cos$ ($=-1$) se convierte en el mínimo de $-\\cos$ ($=1$) y luego se desplaza a $1+2=3$... "
        "espera: mínimo de $-\\cos(x)+2 = -1+2 = 1$; máximo $= 1+2 = 3$. Imagen $[1,3]$.\n\n"
        "El coseno al revés y empujado hacia arriba: sigue siendo trigonométrico, solo que mira hacia el otro lado."
    ),
    "white_trigonometric_clsf_50": (
        "La corriente alterna doméstica oscila sinusoidalmente entre $-311\\,V$ y $+311\\,V$ con frecuencia $50\\,Hz$. "
        "Ese comportamiento periódico acotado es la definición de función **trigonométrica**: $I(t)=311\\,\\operatorname{sen}(100\\pi t)$.\n\n"
        "Frecuencia $50\\,Hz$ $\\Rightarrow$ período $T=1/50=0{,}02\\,s$ $\\Rightarrow$ $B=2\\pi/T=100\\pi$. "
        "Amplitud $=311\\,V$ (el pico de la corriente). La función lineal, exponencial y logarítmica no producen oscilaciones periódicas.\n\n"
        "El tomacorriente: la prueba más cotidiana de que el seno existe y está vivo en $100\\pi$ radianes por segundo."
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

print(f"Done. Updated {count} CLSF explanations.")
