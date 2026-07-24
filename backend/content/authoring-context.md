# Convenciones de autoría de ejercicios

Guía de campos, reglas de formato y convenciones de redacción de los ejercicios de Intervalo. Cada ejercicio es un objeto JSON dentro de un archivo `{SKILL}.json`.

> Tras editar ejercicios: `python seed_content.py --course <curso>` desde `backend/`. Si cambian las skills de un tema, regenerar el catálogo con `bun run scripts/sync-catalog.ts` desde `web/`.

## Vocabulario: Ítem vs. Ejercicio

Dos palabras que no son intercambiables:

- **Ítem**: la combinación de un topic con una de sus skills (ej. `white/conteo/reglas` + `FORM` es un ítem, y corresponde a un archivo `FORM.json`). Un topic tiene tantos ítems como skills declara (ver `Skills en este topic:` en su `topic-context.md`).
- **Ejercicio**: cada objeto individual dentro del array de un ítem (`SKILL.json`). Un ítem contiene varios ejercicios (ej. "el ítem `FORM` de `reglas` tiene 50 ejercicios").

Cualquier mención a "N ítems" refiriéndose a una cantidad de ejercicios (como "FORM, 50 ítems") es un uso incorrecto del término; en ese caso siempre es "N ejercicios".

---

## Reglas críticas, leer antes de escribir un solo ejercicio

Estas reglas son las que más se violan y las que más rompen el render o la coherencia. Ninguna es negociable.

1. **Negrita SOLO en `question` y `explanation`, NUNCA en `options`.** La regla se repite en la sección *Redacción del enunciado* con ejemplos.
2. **Bloques `$$...$$` van pegados con UN solo `\n`**, nunca `\n\n`. Ver sección *Formato de párrafos*.
3. **Primera mención de conceptos clave va en negrita en `question` y en `explanation`.** Aplica a `dominio`, `imagen`, `codominio`, `preimagen`, `unicidad` (y variantes como `único`/`única`). Solo la primera mención por campo.
4. **Si una opción lleva glosa aclaratoria, todas las opciones la llevan.** Si la correcta dice `$\{1,2,3,4\}$, las cantidades de bochas` y otra dice solo `$\{600,1200\}$`, se delata la respuesta. Misma lógica para la **longitud**: si la correcta queda como la única opción notablemente más larga o más completa que el resto, se delata igual aunque no tenga una glosa aclaratoria explícita. No resolver esto alargando los distractores con relleno que no aporta distracción real: igualar longitudes acortando la correcta a su idea esencial, o sumando a los distractores algo que sí compita genuinamente.
    - ❌ `["El valor máximo o mínimo", "La ordenada al origen", "La posición del eje de simetría y del vértice en $x$", "El coeficiente principal"]` (la correcta casi duplica el largo de las demás).
    - ✅ `["El valor máximo o mínimo", "La ordenada al origen", "La posición del vértice en $x$", "El coeficiente principal"]`
    - **También aplica al *formato numérico*, no solo a la longitud del string.** Si 3 opciones comparten un patrón (todas decimales o fraccionarias menores a 1) y la correcta es la única con un formato distinto (entera, mayor a 1), se delata igual aunque el string no sea más largo.
      - ❌ `["$(0{,}9)^x$", "$3^x$", "$(0{,}2)^x$", "$(1/3)^x$"]` para "¿cuál es creciente?" (la correcta es la única base entera y mayor a 1; las otras tres son decimales o fracciones menores a 1, el patrón numérico ya la señala).
      - ✅ variar el formato de forma pareja entre las 4 (ej. dos bases fraccionarias/decimales y dos enteras, mezclando cuáles son mayores y menores a 1), para que el formato no sea la pista.
    - **Reincidencia confirmada en `violet/derivatives/quotient`**: paréntesis aclaratorio solo en la opción correcta (`"Múltiplo escalar (linealidad)"` contra `"Regla del cociente"`, `"Regla del producto"` sin ninguna glosa) y relleno textual asimétrico en opciones numéricas (`"$x=0$ solamente"` contra `"$x=1$ y $x=-2$"`, donde "solamente" no tiene equivalente en la opción de 2 valores). En ambos casos, sacar el agregado en vez de repetirlo en las demás: ni la glosa entre paréntesis ni "solamente" aportan distracción real, son puro relleno de paridad.
5. **Sin adjetivos decorativos en enunciados** ("moderno", "automatizado", "eficiente"). Redacción al grano.
6. **NUNCA usar guion largo `—` (em-dash, U+2014) en ningún campo del ejercicio.** Ni en `question`, `options`, `feedback_correct`, `feedback_incorrect` o `explanation`. Usá `,` (coma), `:` (dos puntos), `;` (punto y coma) o `.` (punto) según corresponda. El guion medio `–` también prohibido en prosa (salvo rangos numéricos "2–4"). Solo el guion `-` común es válido, y solo uniendo palabras compuestas.
7. **El cierre de la `explanation` continúa en voz narrativa directa, nunca se anuncia como advertencia de diagnóstico ni como chiste.** Por defecto, la tercera parte dice la confusión o el consejo práctico **solo cuando aporta** (si no, la explicación cierra en la aplicación), sin rotularse antes de decirse: prohibido abrir con "La confusión típica es...", "Un error común/frecuente/clásico es...", "La trampa es..." (ver regla 33 para el detalle). El humor no es obligatorio: es **excepcional** y solo se admite como **analogía cotidiana exagerada** (una consecuencia práctica o escena burocrática absurda) enunciada en tono formal. Los antropomorfismos ("la raíz cuadrada detesta los negativos", "la función se cansa de emitir respuestas") están **prohibidos en todo el campo**. Ver *Estructura de la explicación* para el detalle de las 3 partes.
8. **"Función", nunca "regla", para nombrar el objeto matemático.** "Regla" se reserva para procedimientos con nombre propio ("regla del producto", "regla de la cadena"). Ver *Vocabulario: términos prohibidos y su reemplazo formal*.
9. **Nunca cortar una oración a la mitad para insertar una fórmula display en el medio.** El fragmento antes de `$$...$$` debe cerrar en un signo de puntuación válido (`.` o `:`), no continuar la misma oración después de la fórmula. Ver *Sin preámbulos colgantes* más abajo.
10. **Toda oración empieza con mayúscula**, incluida la primera palabra después de una fórmula display o de un `\n\n`. Aplica a `question`, `explanation`, `feedback_correct` y `feedback_incorrect`. Una variable en minúscula (`$b$`, `$x$`) al arrancar la oración no exime de la mayúscula: si la oración empieza en prosa, empieza en mayúscula ("Con $b = 300$…" no "con $b = 300$…").
11. **Nunca abrir un párrafo con una palabra o frase corta a modo de rótulo/etiqueta seguida de `:`** ("Verificación:", "Nota:", "Ejemplo:", "Ojo:"). Se siente a encabezado de sección, no a prosa narrativa. **No confundir con la excepción ya permitida** de cerrar en `:` para introducir una fórmula display ("Consideremos la función:" antes de un `$$...$$`) — esa sigue válida. Lo prohibido es el rótulo de una palabra que funciona como título de párrafo. Integrá la idea en una oración completa en su lugar.
    - ❌ `Verificación: $C(0) = 300$ y cada hora agrega \$150 exactos.`
    - ✅ `Para comprobarlo, evaluamos $C(0) = 300$ y notamos que cada hora suma \$150 exactos.`
12. **Nunca invocar conceptos fuera de la frontera matemática del cinturón** (ver `analisis/course-context.md`) para justificar una conclusión, aunque simplifique la explicación. En `white`, eso significa nunca usar derivadas, límites ni integrales, ni en `explanation` ni en `feedback_incorrect`: para justificar monotonía o extremos de un polinomio, usar evaluación en puntos concretos, comportamiento en los extremos según grado/signo del coeficiente principal, o lectura directa del gráfico. **Confirmado como sesgo sistémico de la generación original**: reapareció en `polynomial` (derivada), `exponential` (límite) y `logarithmic` (límite) por igual, tres topics sin relación conceptual entre sí. Auditar el 100% de los ejercicios de cualquier topic todavía no revisado contra esta regla, no confiar en que sea puntual.
    - ❌ `Su derivada: $$f'(x) = \frac{3x^2}{8} \geq 0$$ Como $f'(x) \geq 0$, la función nunca decrece.`
    - ✅ `Al ser un monomio de grado impar con coeficiente positivo, $f$ crece en todo su dominio: a medida que $x$ aumenta, $x^3$ también aumenta, sin excepción.`
13. **Máximo 1 aclaración entre paréntesis o comillas por oración.** Enumerar 2 o más ejemplos entre comillas dentro de un paréntesis se lee como una lista con viñetas camuflada en prosa. Si hay que dar varios ejemplos, narralos dentro de la oración en vez de listarlos entre comillas, y preferí coma sobre dos puntos para unir la aclaración con el resto de la oración (ver también la regla de *Redacción del enunciado* → *Evitá dos puntos en la prosa del cuerpo*, la preferencia global es coma o punto por sobre dos puntos, salvo la excepción de introducir una fórmula display).
    - ❌ `buscá en el enunciado la palabra que indica repetición ("por hora", "por km", "por unidad"): ese monto es siempre la pendiente.`
    - ✅ `buscá en el enunciado la palabra que indica una repetición, como cuánto se cobra por cada hora o unidad extra, y ese monto es siempre la pendiente.`
14. **NUNCA usar los símbolos ✓ (tick/check) o ✗/✘ (X) en ningún campo del ejercicio.** Ni sueltos al final de una fórmula, ni como viñeta, ni en ningún otro lugar. Si hace falta indicar que una verificación cierra correctamente, decilo en prosa ("lo cual confirma el resultado", "coincide con lo esperado"), nunca con el símbolo.
    - ❌ `$\log_2(2-1)=\log_2(1)=0$ ✓`
    - ✅ `$\log_2(2-1)=\log_2(1)=0$, lo que confirma el resultado.`
15. **Paridad de longitud de opciones, también en el sentido inverso: la correcta notablemente más *corta* que el resto también se delata.** La regla crítica 4 ya cubre el caso de la correcta más larga; el mismo razonamiento aplica en espejo. Si 3 distractores tienen una justificación/condición explícita y la correcta es una frase breve sin esa elaboración, iguala hacia el medio: sumale a la correcta el detalle que le falta, o recortá los distractores a la misma brevedad.
    - ❌ `["Creciente solo para $x>1$...", "Ni creciente ni decreciente: tiene un mínimo en $x=1$", "Creciente, porque la base $5>1$", "Decreciente, porque la base $5>1$ hace que el logaritmo baje"]` (la correcta es la única sin ninguna cláusula extra tipo "para..."/"porque...", contrasta contra las 3 más elaboradas).
    - ✅ recortar las 3 distractoras a la misma brevedad, o agregarle a la correcta una cláusula equivalente ("Creciente, porque la base $5>1$ y eso no cambia en ningún tramo del dominio").
16. **En un bloque `\begin{aligned}`, nunca metas una línea de puro texto transicional sin punto de alineación (`&`) cuando el resto de las líneas sí lo tienen.** Columnas desparejas entre líneas de un mismo `aligned` rompen el render de KaTeX. Si hace falta narrar un paso intermedio ("porque", "ya que"), esa frase va en prosa fuera del bloque, no como línea suelta adentro.
    - ❌ `$$\begin{aligned} \ln(e) &= \log_e(e) = 1 \\ \text{porque} \\ e^1 &= e \end{aligned}$$` (la línea `\text{porque}` no tiene `&`, rompe la alineación de las otras dos).
    - ✅ `Aplicando la propiedad $\log_b(b)=1$:\n$$\ln(e) = \log_e(e) = 1$$\nPorque $e^1 = e$.` (la transición queda en prosa, fuera del bloque).
17. **Todo párrafo cierra con puntuación terminal (`.`), incluido el último de cada campo.** No dejar una oración colgando sin punto final, ni siquiera cuando el párrafo termina justo antes de un salto de línea o del final del campo.
17b. **Un bloque `\begin{aligned}...\end{aligned}` va SIEMPRE envuelto en `$$...$$` (display), nunca en `$...$` (inline).** El parser de `MathText` (`web/src/components/math-text.tsx`) usa una regex distinta para inline que **excluye saltos de línea** (`[^$\n]`); como un `aligned` de 2+ líneas siempre tiene `\n` adentro, envolverlo en `$...$` hace que el regex nunca haga match y el campo entero se muestre como texto crudo sin renderizar, un bug de render real encontrado en `trigonometric` (58 ejercicios). Además, cada salto de línea dentro del bloque usa el comando `\\` **una sola vez** (nunca `\\\\`, que en LaTeX son dos saltos de línea consecutivos y también rompe el render).
    - ❌ `"$\begin{aligned}\nT(1) &= 8\cos(0)+15 \\\\\n&= 23\n\end{aligned}$"` (envuelto en `$`, y `\\\\` duplicado en cada línea)
    - ✅ `"$$\begin{aligned}\nT(1) &= 8\cos(0)+15 \\\n&= 23\n\end{aligned}$$"` (envuelto en `$$`, un solo `\\` por línea)
18. **Fórmula central del `question` (enunciado): separada del texto, nunca tejida inline, sobre todo si es una fracción.** Si el enunciado gira en torno a una función puntual (`$f(x) = \dfrac{...}{...}$`), esa fórmula va en su propio bloque `$$...$$` centrado, con el texto acompañándola en oraciones propias antes y/o después, no empotrada dentro de la pregunta como un inciso. Si el enunciado necesita citar dos fórmulas (ej. `g(x)` y `f(x)`), cada una va en su propia oración/bloque, nunca las dos apretadas en la misma línea. Regla general: **siempre preferir las fórmulas separadas de los textos, y los textos acompañándolas**, no al revés.
    - ❌ `En $f(x) = \dfrac{x^2 - 1}{x - 1}$, ¿para qué valor de $x$ no está definida?` (fracción tejida inline dentro de la pregunta)
    - ✅ `Considerá la función:\n$$f(x) = \frac{x^2 - 1}{x - 1}$$\n¿Para qué valor de $x$ no está definida?`
    - ❌ `Si $g(x) = \dfrac{1}{x}$, ¿cómo se obtiene $f(x) = \dfrac{1}{x} - 3$?` (dos fórmulas en la misma línea de la pregunta)
    - ✅ `Partiendo de $g(x) = \frac{1}{x}$.\n\n¿Cómo se obtiene $f(x) = \frac{1}{x} - 3$?`
19. **Opciones compuestas: no repetir la etiqueta de eje/variable si la pregunta ya fija el orden.** Cuando una opción combina dos o más valores relacionados (ej. intercepto en $X$ y en $Y$) y la pregunta ya establece en qué orden se piden, no hace falta prefijar cada valor con su rótulo dentro de la opción.
    - ❌ `"Eje $X$: $x=-\dfrac{1}{2}$; eje $Y$: $y=\dfrac{1}{5}$"` (la pregunta ya pidió "el intercepto con el eje $X$ y el eje $Y$", en ese orden)
    - ✅ `"$x=-\dfrac{1}{2}$, $y=\dfrac{1}{5}$"`
20. **En `options` de 4 fracciones cortas, usar `\dfrac{x}{y}` (apilada, displaystyle) en todas, no notación de barra (`x/y`) ni `\frac` (textstyle, se ve chica).** Cuando las 4 opciones son fracciones cortas (numerador y denominador de 1-2 dígitos, con o sin `\sqrt`), `\dfrac` en las 4 mantiene la altura uniforme entre sí y activa la grilla 2×2 igual (el heurístico de `latexVisualLength` en `session-runner.tsx` pesa `\dfrac` 1.4x por ser más ancho por carácter que `\frac`, pero el límite de 12 sigue sobrando para fracciones de 1-2 dígitos). Si el set **mezcla** fracciones con enteros sueltos (`$-3$`, `$6$`, `$\dfrac{1}{3}$`, `$3$`), ahí sí la fracción apilada desentona en altura contra los enteros: en ese caso puntual, usar `x/y` de barra para los términos fraccionarios, no `\dfrac`.
    - ❌ `["$\frac{1}{2}$", "$\frac{2}{3}$", "$\frac{1}{4}$", "$\frac{3}{4}$"]` (frac textstyle, se ve chico y desparejo con el resto de la UI)
    - ✅ `["$\dfrac{1}{2}$", "$\dfrac{2}{3}$", "$\dfrac{1}{4}$", "$\dfrac{3}{4}$"]`
    - ❌ `["$-3$", "$6$", "$\dfrac{1}{3}$", "$3$"]` (mezcla fracción con enteros sueltos, la fracción apilada desentona en altura)
    - ✅ `["$-3$", "$6$", "$1/3$", "$3$"]` (mezcla: acá sí, barra)
21. **2 o más fragmentos LaTeX inline (`$...$`) en el mismo párrafo de `explanation` es señal de dividir el párrafo.** No es solo una preferencia de estilo, es un umbral concreto: si una oración o párrafo acumula 2+ expresiones `$...$` sueltas tejidas en la prosa, separalo en párrafos más cortos (`\n\n`) o sacá la fórmula central a un bloque `$$...$$`. Párrafos con múltiples inline sueltos leen como una lista de verificaciones (`✓`/`✗`) camuflada en prosa, no como una explicación narrada.
    - ❌ `Verificando cada opción: $-\cos(0)=-1$ y $-\cos(\pi)=1$. Las otras: $\operatorname{sen}(0)=0$; $-\operatorname{sen}(0)=0$; $\cos(0)=1$.` (5 fragmentos inline en un solo párrafo, ilegible)
    - ✅ separar la verificación de la opción correcta (con su fórmula en bloque `$$...$$` si hace falta) del resto en un párrafo aparte, narrando en prosa por qué las demás no cumplen sin encadenar todos los cálculos sueltos.
22. **En opciones tipo clasificación (`CLSF`) que ya muestran una fórmula, no agregar el nombre de familia entre paréntesis al lado.** Si la opción ya es `$C(t) = A\cos(Bt) + D$`, agregar `(trigonométrica)` al lado es una aclaración redundante, la fórmula ya lo dice. Cuantas menos aclaraciones entre paréntesis, mejor.
    - ❌ `["$C(t) = A\cos(Bt) + D$ (trigonométrica)", "$C(t) = at + b$ (lineal)", "$C(t) = e^{kt}$ (exponencial)", "$C(t) = \log(t)$ (logarítmica)"]`
    - ✅ `["$C(t) = A\cos(Bt) + D$", "$C(t) = at + b$", "$C(t) = e^{kt}$", "$C(t) = \log(t)$"]`
24. **Nunca enmarcar un ejercicio en relación a otro ejercicio de la sesión.** Prohibido abrir con lenguaje que implique orden o comparación con otro ejercicio ("un caso más exigente", "a diferencia del anterior", "ahora un ejemplo más difícil"). Los ejercicios se presentan desordenados e independientes en una sesión, no hay garantía de que el alumno haya visto "el anterior". Cada ejercicio se redacta como si fuera el único que ve.
    - ❌ `Un caso más exigente aparece cuando el punto de tendencia ya es negativo, como en\n$$\lim_{x \to (-2)^+} f(x)$$\n¿Qué valores toma $x$ al acercarse de esta manera?` (compara con un ejercicio implícito anterior).
    - ✅ `El punto de tendencia también puede ser negativo, como en\n$$\lim_{x \to (-2)^+} f(x)$$\n¿Qué valores toma $x$ al acercarse de esta manera?` (no se refiere a otro ejercicio).
    - **Nombrar la estructura, no explicarla**: la oración que lleva al planteo técnico menciona con qué objeto se va a trabajar ("la expresión", "la ecuación", "el límite", "la fracción", "la función"), no lo define ni lo explica antes de mostrarlo. Alcanza con un lead-in corto tipo "Al simplificar la expresión:" o "Al resolver la ecuación:" — una oración/párrafo aparte que declara qué *es* el concepto (p. ej. "El logaritmo en base $b$ de un número $x$ es el exponente al que hay que elevar $b$ para obtener $x$.") es una introducción disfrazada de contexto, y le regala al alumno la técnica antes de que la tenga que reconocer.
    - ❌ `El **logaritmo** en base $b$ de un número $x$ es el exponente al que hay que elevar $b$ para obtener $x$.\n$$\log_b(x) = y \iff b^y = x$$\nAl calcular:\n$$\log_3(81)$$\n¿Cuál es su valor?` (define el logaritmo antes de plantear el ejercicio, delata la técnica).
    - ✅ `Al calcular el logaritmo:\n$$\log_3(81)$$\n¿Cuál es su valor?` (nombra "el logaritmo" al pasar, sin explicarlo).
25. **El concepto abstracto de la `explanation` justifica el porqué, no solo declara el qué.** Enunciar una regla o resultado sin razonarlo deja al alumno memorizando en vez de entender. No alcanza con nombrar la propiedad o la clasificación, hay que explicar el mecanismo que la produce. Esto pesa especialmente en resultados que suelen "declararse" sin más: indeterminaciones, condiciones de dominio, por qué una propiedad operatoria exige tal hipótesis, por qué dos objetos coinciden o difieren.
    - ❌ `Cuando el denominador tiende a $0$ y el numerador no, la expresión es una tendencia a $\pm\infty$, no una indeterminación.` (declara la clasificación sin razonarla)
    - ✅ `El numerador queda fijo mientras el denominador se achica cada vez más, y dividir una cantidad fija por algo que tiende a $0$ produce un valor que crece sin cota, sin importar la función. Por eso es una tendencia a $\pm\infty$ y no una indeterminación.`
26. **Un bloque `$$...$$` lleva solo símbolos, números y notación matemática, nunca palabras completas metidas con `\text{...}`.** Escribir una oración entera (o parte de ella) dentro de `\text{}` en un display produce una línea horizontal larguísima que desborda en mobile, literalmente cortada contra el borde de la pantalla. Si hace falta acompañar la fórmula con palabras ("cuando", "aunque tarde", "no se resuelve por cancelación directa"), esas palabras van en la prosa que rodea la fórmula, no adentro del bloque `$$...$$`. Reservar `\text{}` dentro de un display para casos puntuales de notación matemática estándar (unidades, un subíndice descriptivo corto), nunca para una cláusula completa en español.
    - ❌ `$$a^x \succ x^{100} \quad \text{cuando } x \to +\infty \text{, aunque tarde en cruzarse}$$` (mezcla símbolos con una oración completa en español, desborda en mobile)
    - ✅ `Aunque tarde en cruzarse, $a^x \succ x^{100}$ cuando $x \to +\infty$.` (la prosa queda en el texto, la fórmula solo lleva símbolos)
    - ❌ `$$\infty - \infty \text{ no se resuelve por cancelación directa}$$`
    - ✅ `$\infty - \infty$ no se resuelve por cancelación directa.` (fórmula corta inline, el resto es prosa común)
27. **Un límite lateral SIEMPRE lleva el punto de tendencia en el subíndice: `\lim_{x \to a^-}`/`\lim_{x \to a^+}`, nunca `\lim^-`/`\lim^+` sueltos.** Escribir el signo de dirección como superíndice pegado directamente a `\lim` (sin el `_{x \to ...}` debajo) es notación incompleta: no dice a qué valor tiende $x$, solo la dirección. Encontrado como **error generalizado en 10 ejercicios** de `continuity` y `lateral_limits` (corregido en esta ronda, ver *Bugs conocidos*).
    - ❌ `$$\lim^- = 3 = \lim^+ \Rightarrow \lim_{x \to a} f(x) = 3$$`
    - ✅ `$$\lim_{x \to a^-} f(x) = 3 = \lim_{x \to a^+} f(x) \Rightarrow \lim_{x \to a} f(x) = 3$$`
28. **La fracción $\tfrac{0}{0}$ apilada (`\dfrac{0}{0}`/`\frac{0}{0}`) nunca va tejida dentro de un párrafo de prosa.** Una fracción LaTeX apilada inline rompe la altura de línea del párrafo que la rodea. Si hace falta nombrar la indeterminación dentro de una oración, usar la forma horizontal simple `0/0` (sin LaTeX apilado); reservar `\dfrac{0}{0}$` para cuando esté sola en su propio bloque `$$...$$`.
    - ❌ `La sustitución directa da $\dfrac{0}{0}$, así que corresponde factorizar.`
    - ✅ `La sustitución directa da 0/0, así que corresponde factorizar.`
29. **En el desarrollo de un límite (`\begin{aligned}`), el operador `\lim_{x \to a}` se repite en TODAS las líneas, nunca solo en la primera.** Es un error común simplificar la expresión algebraica en las líneas intermedias sin el `\lim` y reservarlo solo para la sustitución final (a veces reemplazándolo directamente por una flecha `\xrightarrow{x \to a}`): eso rompe la idea de que cada línea sigue siendo el mismo límite, no una manipulación algebraica suelta que "después" se evalúa. Cada renglón de la cadena mantiene el `\lim_{x \to a}` explícito hasta la línea final, que ya no lo necesita porque es el resultado numérico.
    - ❌ `$$\begin{aligned} \frac{x^2+3x}{x} &= \frac{x(x+3)}{x} \\ &= x+3 \\ &\xrightarrow{x \to 0} 3 \end{aligned}$$`
    - ✅ `$$\begin{aligned} \lim_{x \to 0}\frac{x^2+3x}{x} &= \lim_{x \to 0}\frac{x(x+3)}{x} \\ &= \lim_{x \to 0}(x+3) \\ &= 3 \end{aligned}$$`
30. **Un bloque `\begin{aligned}` con columna de `=` se reserva para una ecuación que se despeja o una expresión que se transforma paso a paso para simplificar. Nunca para listar valores o datos evaluados de forma independiente.** Evaluar $u(0)=3$, $v'(0)=1$, etc. no es una cadena de transformaciones de una misma expresión, es una lista de datos sueltos: alinearlos por `=` junto con el paso final (que sí es una transformación real) mezcla dos cosas distintas en la misma columna y no aporta nada al lector. Los datos evaluados van en prosa o en líneas simples sin `&`/alineación; el `aligned` con columna de `=` queda solo para cuando cada línea es un paso genuino de la misma derivación.
    - ❌ `$$\begin{aligned} u'(0) &= 0, \quad v(0) = 1 \\ u(0) &= 3, \quad v'(0) = 1 \\ f'(0) &= u'(0)v(0) + u(0)v'(0) = 0 + 3 \end{aligned}$$` (las primeras 2 líneas son datos sueltos, no una transformación de la línea anterior; alinearlas con la tercera no tiene sentido)
    - ✅ `Con $u(0)=3$, $v(0)=1$, $u'(0)=0$ y $v'(0)=1$:\n$$f'(0) = u'(0)v(0) + u(0)v'(0) = 0\cdot 1 + 3\cdot 1 = 3$$` (los datos en prosa, el cálculo real en su propio bloque)
31. **Todo ejercicio reintroduce la definición o fórmula central del concepto que usa, aunque ya haya aparecido en otro ejercicio de la sesión.** Extensión concreta de la regla crítica 24 (independencia entre ejercicios): no alcanza con no compararse contra otro ejercicio, tampoco hay que asumir que el alumno ya vio la fórmula/definición en juego. Cuando la pregunta depende de un objeto que no está explícito en el propio enunciado (la definición de derivada como límite del cociente incremental, una fórmula de regla operatoria, etc.), esa definición se reintroduce, con su LaTeX centrado si hace falta, antes de la pregunta puntual.
    - ❌ `Al factorizar $h$ en el numerador $2xh+h^2$, ¿qué factor común se extrae?` (asume que el alumno ya tiene presente de dónde salió ese numerador, sin reintroducir el cociente incremental que lo originó)
    - ✅ `La derivada de $f$ en $a$ se define como\n$$f'(a) = \lim_{h \to 0} \frac{f(a+h)-f(a)}{h}$$\nAl factorizar $h$ en el numerador $2xh+h^2$ de ese cociente, ¿qué factor común se extrae?`
32. **El fragmento antes de un bloque `$$...$$` tiene que ser una cláusula completa que cierre en `.`/`:` antes de la fórmula, y esa apertura no puede repetirse literalmente ejercicio tras ejercicio.** Es una extensión de las reglas críticas 9 y 24. Dos violaciones distintas, no confundir:
    - **Fragmento incompleto, aunque tenga puntuación.** Un verbo corto que no cierra una idea por sí solo ("Sabiendo que", "Para derivar", "En", "Antes de derivar") no se arregla poniéndole `:` al lado: hay que reescribirlo como cláusula completa. En cambio, un imperativo con objeto concreto ("Considerá la función", "Analizá la función", "Calculá la derivada de la función") **sí es una cláusula completa** (verbo + objeto sustantivo) y **solo le falta el `:`** antes del bloque display; no hace falta reescribirlo desde cero.
      - ❌ `Sabiendo que\n$$f(x) = (x^2+3)e^x$$\ncalculá $f'(0)$.` (fragmento sin objeto propio; agregarle `:` no lo completa)
      - ❌ `Considerá la función\n$$f(x) = (x^2+3)e^x$$\ncalculá $f'(0)$.` (cláusula completa pero sin el `:` que la cierra)
      - ✅ `Considerá la función:\n$$f(x) = (x^2+3)e^x$$\nCalculá $f'(0)$ aplicando la regla del producto.` (mismo opener, con `:` agregado y la pregunta en su propia oración con mayúscula)
    - **Repetición literal de la misma apertura en toda una sub-familia.** Aunque el opener sea válido y esté bien puntuado, repetir el mismo `"Considerá la función:"` en los 50 ejercicios de un skill se lee como plantilla. Variar la redacción ejercicio a ejercicio (regla 24 ya pedía esto para la situación del concepto; acá aplica igual a la apertura).
    - **Confirmado como sesgo sistémico de la generación original**: reapareció en prácticamente todo `ESTR`/`RESL` de las 6 topics de `violet/derivatives` (más de 100 ejercicios), igual que el de la regla 12 en `white/functions`. Auditar el 100% de los ejercicios de cualquier topic todavía no revisado contra esta regla: la mayoría son solo cuestión de agregar el `:` faltante y variar la redacción, no de reescribir el enunciado entero.
33. **El cierre de `explanation` (ver *Estructura de la explicación* → punto 3) nunca se anuncia como advertencia de diagnóstico.** Prohibido que el último párrafo abra con "La confusión típica es...", "Un error común/frecuente/clásico es...", "La trampa (típica) es..." o variantes. La idea se dice en voz narrativa directa, no rotulada.
    - ❌ `Un error clásico es restar directamente los índices ($5-4=1$) sin expandir ningún factorial, tratando al símbolo $!$ como una operación lineal.`
    - ✅ `Restar los índices directo ($5-4=1$) da un número parecido por casualidad: el $!$ no es una operación lineal, hay que expandir cada factorial antes de simplificar.`

---

## Campos del ejercicio

| Campo | Regla |
|-------|-------|
| `question` | enunciado. Ver formato de párrafos abajo. |
| `options` | **2–4 opciones**. Ver *Cardinalidad de opciones por skill* más abajo. |
| `correct_index` | índice (0–N) de la correcta. |
| `feedback_correct` | **corto**, 1 oración. |
| `feedback_incorrect` | **`array<string\|null>` paralelo a `options`**: un texto corto por distractor (índice correcto = `null`). Ver sección *Pistas de feedback_incorrect* más abajo. **Legacy:** en belts no refactorizados todavía es `""` (string vacío). |
| `explanation` | texto del botón "¿Por qué?". Párrafos ≤200 caracteres (ideal ~100), mínimo 300 caracteres en total. Estructura de 3 partes: ver *Estructura de la explicación* más abajo. |
| `has_math` | `true` si hay LaTeX en cualquier campo. |
| `graph_fn`, `graph_view` | ver sección Gráficos. `null` si no hay gráfico. |
| `reviewed` | `false` hasta revisión manual. |
| `tags` | **opcional.** `array<string>` con un slug de sub-familia/arquetipo. Ver sección *Etiquetas (tags)* más abajo. **Legacy:** ausente en ejercicios todavía no tageados. |

El `external_id` se infiere de la ruta del archivo (`{belt}_{topic}_{skill}_{NN}`) y **no va en el JSON**.

---

## Etiquetas (tags)

**Qué es y para qué sirve.** Cada ejercicio puede llevar un campo `tags` que identifica a qué **sub-familia o arquetipo** de la distribución objetivo de su skill pertenece (la misma sub-familia que ya documenta cada `topic-context.md`, sea como tabla A/B/C/D o como desglose por concepto). Sirve para tres cosas: (1) verificar programáticamente que la distribución real de un refactor coincide con la distribución objetivo, sin releer los 50 ejercicios a mano, (2) buscar en bloque todos los ejercicios de un sub-tipo puntual durante una auditoría, (3) análisis futuro de cómo les va a los usuarios por sub-tipo, no solo por skill.

**Shape:** `array<string>`, un solo slug por ahora (el array queda abierto a futuro, no es una promesa de que hoy haya más de uno).

```json
"tags": ["dominio"]
```

**Formato del slug:**
- Kebab-case, en español, sin tildes: `vertice-x`, `signo-de-h`, `anulacion-por-raiz`.
- 2 a 4 palabras, describiendo el concepto o mecánica del sub-tipo, no una letra ni un número (`A`, `B1` no sirven).
- El slug tiene que ser **el mismo** que la columna "slug" de la tabla de distribución de ese skill en su `topic-context.md` — no inventes uno nuevo al tagear un ejercicio, usá el de la tabla.

**Convención de esta ronda:** un tag por ejercicio, el de su sub-familia. Ejercicios legacy sin tagear simplemente no tienen el campo (no hace falta `[]` ni `null`).

**Ejemplo resuelto**, de `white/functions/definition` LEXI, sub-familia "dominio" de su tabla de distribución:

```json
{
  "question": "¿Cuál es el dominio de la función que asigna a cada alumno su legajo?",
  "options": ["..."],
  "tags": ["dominio"]
}
```

---

## Pistas de `feedback_incorrect`

**Qué es:** al elegir un distractor, el panel naranja muestra una pista corta y específica de *por qué esa opción es la confusión clásica que es*, sin revelar la respuesta correcta.

**Shape:** `array<string|null>` paralelo a `options`, mismo largo y mismo orden. El índice de `correct_index` es siempre `null`. Ejemplo con 4 opciones, correcta en índice 0:

```json
"options": ["$(-\\infty, 20]$", "$[0, 20]$", "$\\mathbb{R}$", "$[20, +\\infty)$"],
"correct_index": 0,
"feedback_incorrect": [
  null,
  "Estás restringiendo a alturas no negativas, pero la pregunta es por el rango matemático de la función, no por el contexto físico.",
  "$\\mathbb{R}$ sería la imagen si no hubiera vértice, pero acá $a<0$ sí limita los valores que toma la función.",
  "Esa cota mira para arriba del vértice, cuando con $a<0$ la parábola se abre hacia abajo."
]
```

**Reglas de redacción:**
- **Nombra el error, no la cura.** Señala la confusión específica (signo invertido, dominio↔imagen, contexto físico vs. matemático) sin decir cuál es la opción correcta ni dar el valor que faltaba.
- **NUNCA acusar al alumno en tercera persona.** Verbos como *"Confunde X con Y"*, *"Invierte los roles"*, *"Olvida el negativo"*, *"Interpreta mal"*, *"Ignora la restricción"* son inaceptables, suenan a diagnóstico frío del alumno. Reescribí así:
  - ❌ *"Confunde codominio con imagen."* → ✅ *"Esas son las notas ya obtenidas, es decir la imagen. El codominio es el conjunto teórico de llegada."*
  - ❌ *"Invierte la relación: el sueldo es la salida."* → ✅ *"El sueldo no se elige libremente, sale de aplicar la fórmula, así que es la variable dependiente."*
  - ❌ *"Falta un valor, elevar el $-5$ al cuadrado también da 25."* → ✅ *"Hay otra solución además del 5: elevar el $-5$ al cuadrado también da 25."*
  - Voces válidas: (a) **descriptiva del concepto** ("Ese es el codominio, no la imagen…"), (b) **segunda persona amable con tuteo** ("estás tomando…", "hay otra solución además…"). Nunca la voz *"[el alumno] confunde/invierte/olvida"*.
- **Corto:** ideal 1 oración, 2 como máximo. En renglones en celular: ideal ≤ 2, hasta 3 está bien, 4 como máximo absoluto. Es una pista para el segundo intento, no una mini-explicación, eso ya lo cubre `explanation`.
- **Sin pistas en cascada:** cada texto es autosuficiente para SU distractor; no asume que el usuario ya leyó la pista de otra opción.
- **Contenido típico de la pista según skill:**
  - `RESL` (cálculo): error de procedimiento, signo, regla mal aplicada, paso salteado, constante de integración olvidada. También cubre confusión entre el contexto cotidiano y el resultado matemático puro cuando el ejercicio se plantea en contexto.
  - `ESTR`/`CLSF` (conceptual): la condición que falta o se confundió, releer el concepto sin re-explicarlo entero.
  - `GRAF`: qué parte del gráfico releer, "fijate qué pasa a la izquierda del salto", sin nombrar el valor.
- **Migración:** los belts con `""` se completan al pasar por refactor; no hace falta backfill manual fuera de ese proceso.

---

## Cardinalidad de opciones por skill

**Regla general:** la cardinalidad depende del **tipo de respuesta**, no del skill:

- **Respuesta conceptual/textual** (nombre de concepto, categoría, descripción): **3 opciones** por defecto. Tres confusiones clásicas alcanzan.
- **Respuesta numérica corta** (un número, un conjunto chico, un intervalo, una expresión tipo `x ≥ 3`): **4 opciones**. Cuatro variantes del error de cálculo son cómodas de distinguir y **triggean la grilla 2×2** del frontend (ver límites exactos más abajo, distintos si la opción tiene LaTeX o es texto plano).
- **Binario** (2 opciones): reservado para casos donde el criterio es genuinamente binario y no hay una tercera confusión plausible (ej. "¿cumple unicidad? Sí/No"). En LEXI y CLSF de definición esto es raro, casi siempre hay una tercera confusión.

**Regla mecánica:** si las respuestas son valores numéricos (`$5$`, `$\{1,2,3\}$`, `$x \geq 3$`, fracciones cortas `$\dfrac{5}{12}$`) o expresiones cortas, hacé 4 opciones y verificá que todas quepan en el límite correspondiente (ancho visual estimado ≤12 si la opción tiene `$...$`, ≤25 caracteres crudos si es texto plano) para que el frontend las renderice en grilla 2×2 compacta. Si la respuesta es un párrafo, una descripción, o una ecuación completa (`$C(h) = 300 + 150h$`), hacé 3 opciones (no van a entrar en grilla y quedan como lista vertical) — una ecuación con operadores y coeficientes desborda la caja de la grilla aunque el string crudo sea corto, porque KaTeX renderiza el LaTeX mucho más ancho por carácter que texto plano.

**Guía por skill:**
- `ESTR`, `CLSF` (conceptual): **3 opciones por defecto.** Binario solo si el criterio es genuinamente sí/no y no hay tercera confusión.
- `LEXI` (léxico/recall): **3 opciones para conceptuales, 4 para numéricas**. Ver *topic-context.md* del tema.
- `GRAF` (lectura de gráfico): 3 cuando la propiedad leída es categórica; 4 cuando hay que elegir entre fórmulas o valores numéricos leídos del gráfico (grilla 2×2 si son cortos).
- `RESL` (cálculo, incluida aplicación en contexto): **4 sigue siendo el default**, porque acá la cantidad de errores de procedimiento clásicos sí sostiene 4 distractores reales. Si los 4 son numéricos cortos, se renderizan en grilla 2×2.

**Grilla 2×2 en frontend:** el componente activa layout `grid grid-cols-2` cuando `options.length === 4` y todas las opciones caben en el límite correspondiente: **ancho visual estimado ≤12 si alguna opción contiene `$` (LaTeX)**, **≤25 caracteres crudos si el set es texto plano**. El límite es más estricto en LaTeX porque KaTeX renderiza mucho más ancho por carácter que texto normal (cursiva, espaciado de operadores); fracciones cortas (`\frac`/`\dfrac`, 1-2 dígitos por numerador/denominador) entran cómodas en ese límite. Aprovechá el compactado siempre que la respuesta lo permita, pero no fuerces una ecuación completa a entrar recortando texto: si no entra en el límite, va como lista vertical de 3 o 4 opciones.

**Precedente:** unicidad en `CLSF` reformulada como "¿esta función cumple el criterio de unicidad?" con 2 opciones (Sí/No), caso raro de binario legítimo.

---

## Formato de Cálculo Numérico, grilla compacta 2×2

Para el skill de cálculo (`RESL`) y para cualquier ejercicio de respuesta numérica corta, cuando las 4 opciones son valores numéricos o expresiones cortas, el front las presenta en una **grilla compacta 2×2** en vez de la lista vertical apilada.

**Estado: implementado.** El componente activa el layout `grid grid-cols-2` cuando `exercise.options.length === 4` y todas las opciones caben en el límite correspondiente (ver `web/src/app/(app)/session/[sessionId]/session-runner.tsx`, función `latexVisualLength`/`hasLatex`/`limit` cerca de la línea 460):

- **Si alguna opción contiene `$` (LaTeX)**: límite **≤12**, medido no en caracteres crudos sino en un ancho visual estimado (`latexVisualLength`): `\operatorname{}`/`\sqrt{}`/`\frac{}{}`/`\dfrac{}{}`/funciones nombradas (`\sin`, `\log`, etc.) se colapsan a su ancho aproximado en pantalla en vez de contar cada carácter de código LaTeX. `\dfrac` pesa 1.4x el ancho de `\frac` (displaystyle vs. textstyle, más ancho por carácter).
- **Si ninguna opción tiene `$` (texto plano)**: límite **≤25 caracteres** crudos por opción.

El heurístico de LaTeX existe porque contar caracteres crudos sobre/subestima el ancho real: una ecuación como `$C(h) = 300 + 150h$` desborda la caja de la grilla aunque el string sea corto, mientras que `$\dfrac{5}{12}$` (14 caracteres crudos) es en realidad angosta una vez colapsada la fracción. Reservá la grilla para valores/expresiones genuinamente cortas (`$5$`, `$x \geq 3$`, `$\{1,2,3\}$`, `$(-1, -5)$`, fracciones de 1-2 dígitos como `$\dfrac{5}{12}$`), no para ecuaciones completas con operadores y coeficientes.

**Ojo con `\;` y otros comandos de espaciado LaTeX en pares ordenados.** El heurístico cuenta caracteres crudos, no ancho renderizado: preferí un espacio común después de la coma (`$(-1, -5)$`) en vez de `\;` (`$(-1,\; -5)$`), que suma caracteres sin sumar ancho visual real.

**Nunca** metas HTML ni tablas dentro del string de `options` para forzar una grilla: el `options` es un array plano de strings y el layout lo decide el componente. Tu única palanca es la cardinalidad (4) y la longitud (ancho visual ≤12 con LaTeX, ≤25 caracteres en texto plano) de cada opción.

---

## Modo inline (`$`) vs. display (`$$`)

- **Inline (`$...$`)**: variables sueltas, coordenadas de un punto, o expresiones algebraicas elementales que no alteren la altura de línea (`$x$`, `$(3, 20)$`, `$a < 0$`).
- **Display (`$$...$$`)**: obligatorio para cualquier expresión densa, fracciones, límites con subíndices, derivadas, sumatorias, integrales. Aislarla en su propio bloque evita que KaTeX reduzca el tamaño de fuente en mobile.
- Regla rápida: si la expresión "tiene partes arriba y abajo de la línea base" (fracción, límite, sumatoria) → `$$`.

**Preferencia de estilo en `explanation` (no obligatoria): centrada por sobre inline cuando la fórmula es el objeto central del razonamiento.** Cuando la `explanation` gira en torno a una fórmula puntual (la función del ejercicio, un resultado intermedio del cálculo), preferí mostrarla en su propio bloque `$$...$$` aunque sea corta, en vez de tejerla inline dentro de una oración larga. Varias fórmulas inline salpicadas en un mismo párrafo son difíciles de leer en mobile. Reservá el inline para números sueltos o variables que acompañan la prosa (`$x$`, `$a<0$`), no para la primera aparición de la función que define el ejercicio.
- ❌ `Un polinomio $f(x)=x^3-2x+5$ evaluado en $x=0$ da $f(0)=5$, que es el término independiente.` (fórmula central tejida inline en una oración larga)
- ✅ `Evaluando el polinomio en $x=0$:\n$$f(0) = 5$$\nEse valor coincide con el término independiente.`

**Preferencia de estilo en `explanation` (no obligatoria): intercalar fórmulas centradas entre segmentos de prosa para dar ritmo a una explicación o resolución larga.** Distinta de la preferencia anterior (que trata de *qué* fórmula centrar); esta trata del *ritmo de lectura*. En una explicación o resolución compleja, en vez de acumular varios pasos en un muro de prosa, cortá la lectura sacando a un bloque `$$...$$` centrado los momentos clave (el planteo, un resultado intermedio, el resultado final) y dejá la prosa entre medio narrando el porqué. La fórmula centrada actúa como un ancla visual que reengancha la lectura rápida (sistema 1) entre bloques de texto: el ojo la reconoce de un golpe y retoma la prosa con contexto. **No es centrar todo lo que pasa** (una explicación toda de bloques `$$` sin prosa entre medio pierde el razonamiento, y contradice la regla de los párrafos ≤200): es alternar prosa ↔ fórmula centrada ↔ prosa cuando el tramo es largo o denso. Si la explicación es corta y de un solo paso, no hace falta forzar el corte.
- ❌ `Aplicamos la regla del producto: la derivada de $u\cdot v$ es $u'v+uv'$, así que con $u=x^2$ y $v=e^x$ queda $u'=2x$ y $v'=e^x$, entonces $f'(x)=2x\,e^x+x^2 e^x$, que factorizando da $x e^x(2+x)$.` (todos los pasos amontonados inline en un solo párrafo denso)
- ✅ `Por la regla del producto, la derivada de $u\cdot v$ es:\n$$u'v + uv'$$\nAcá $u=x^2$ y $v=e^x$, con $u'=2x$ y $v'=e^x$. Sustituyendo cada parte:\n$$f'(x) = 2x\,e^x + x^2 e^x$$\nSacando $x e^x$ de factor común, queda la forma más compacta:\n$$f'(x) = x e^x (2 + x)$$` (cada momento clave anclado en su bloque, la prosa narra la transición entre uno y otro)

**En `question` la misma preferencia es regla crítica, no solo estilo (ver regla crítica 18).** La fórmula que define la función del ejercicio no se teje inline dentro de la pregunta: va en su propio bloque centrado, sobre todo si es una fracción. Ver regla crítica 18 para ejemplos.

### Declaraciones de tipo de función `A : X \to Y`: extensión corta por diseño

Las declaraciones tipo `$$A : X \to Y$$` tienen que caber **en una sola línea en mobile** (~30 caracteres visibles como máximo). **NO** resolvés el overflow partiendo en dos líneas con `\begin{aligned}`: visualmente queda cortada y pierde la lectura natural "de A en X hacia Y". La solución correcta es **diseñar el ejercicio con conjuntos chicos desde el principio**.

**Regla operativa:** dominio y codominio con **2-4 elementos**, cada elemento **de 1-2 caracteres**. Preferir dígitos sueltos o letras cortas. Palabras largas (`\text{lunes},\dots,\text{domingo}`, `\text{laborable, feriado}`, números grandes tipo `15000, 20000, 25000, 30000`) están prohibidas dentro de la declaración.

❌ **Mal** (aunque conceptualmente correcto, no cabe):
```
$$V : \{\text{días}\} \to \{15000, 20000, 25000, 30000\}$$
```

✅ **Bien** (reescribir el contexto para que la extensión sea chica):
```
$$P : \{1, 2, 3\} \to \{0, 1, 2\}$$   (examen de 3 preguntas puntuadas 0/1/2)
$$f : \{bn, co\} \to \{50, 150\}$$    (fotocopias b/n vs. color)
$$S : \{1, 2, 3\} \to \{r, a, v\}$$   (semáforo)
$$E : \{1, 2, 3\} \to \{S, N\}$$      (encuesta sí/no)
```

**Contextos válidos con extensiones cortas**:
- Encuesta binaria (S/N), (Sí/No), (0/1) → 2 elementos.
- Semáforo (r/a/v), (V/N/A) → 3 elementos.
- Clasificación par/impar (P/I), positivo/negativo/cero.
- Puntaje de examen (0/1/2), (mal/regular/bien).
- Categorías cortas con letras (A/B/C).

**Prohibido dentro de `$$A : X \to Y$$`**:
- Palabras completas envueltas en `\text{}`.
- Elipsis `\dots` con extremos largos (`\{15000, \dots, 30000\}`, si necesitás elipsis, la extensión ya es larga; usá conjuntos concretos chicos).
- Números de 4+ dígitos.

Si el ejercicio realmente exige un contexto con muchas o largas etiquetas, **describilo en prosa antes** y usá una variable neutra para la declaración: "Una liga clasifica jugadores por edad" + `$$K : E \to C$$` con la explicación en prosa. Pero eso ya es un ejercicio más avanzado; en LEXI/CLSF de definición preferí siempre la extensión corta.

### Enumeraciones de valores calculados: SIEMPRE vertical

**NUNCA** listar varios valores calculados en una sola línea display con `\quad` o `\qquad` separadores. En mobile la línea se corta o overflowa.

❌ **Mal** (se sale de la pantalla en mobile):
```
$$(-3)^2 = 9, \quad (-1)^2 = 1, \quad 0^2 = 0, \quad 1^2 = 1, \quad 3^2 = 9$$
```

✅ **Bien** (uno debajo del otro, alineados por `=`):
```
$$\begin{aligned} (-3)^2 &= 9 \\ (-1)^2 &= 1 \\ 0^2 &= 0 \\ 1^2 &= 1 \\ 3^2 &= 9 \end{aligned}$$
```

**Regla:** dos o más asignaciones/evaluaciones (`f(x) = y`, `x^2 = k`, `x \mapsto v`) en el mismo bloque display → **obligatorio** `\begin{aligned}...\end{aligned}` con `&=` como punto de alineación y `\\` entre líneas. Aplica también cuando son solo 2 valores unidos por `\text{y}`: usar `aligned` en vez de `1000 \quad \text{y} \quad 2000`.

**Excepción:** una sola igualdad o expresión (`f(3) = 27`, `x^2 = 25`) va en su propio bloque display sin `aligned`.

**Aclaración: la obligación de `aligned` es sobre cadenas que desbordan o confunden, no sobre cualquier cadena de 2+ igualdades por default.** Si una cadena corta de igualdades encadenadas entra cómoda en una línea de mobile y se lee de corrido sin esfuerzo, no hace falta partirla en `aligned`. El criterio es ancho/legibilidad, no la cantidad de signos `=`.
- ✅ `$$\frac{5^{x+2}}{5^x} = 5^{(x+2)-x} = 5^2 = 25$$` (3 igualdades, pero cada término es corto y la línea completa entra sin overflow, queda clara en una sola fila).
- Si la misma cadena tuviera términos más largos (fracciones grandes, expresiones con varios sumandos), ahí sí aplica partir en `aligned` o en bloques apilados, como en el resto de esta sección.

**Ojo: pasar a `aligned` no alcanza si una línea individual sigue siendo larga.** El `aligned` resuelve el problema de "muchas asignaciones amontonadas en una fila", no el de "una asignación cuyo lado derecho es en sí mismo ancho" (ej. una expansión de varios términos dentro de una sola línea del bloque). Cada línea de un `aligned` tiene que ser corta por sí sola; si un paso individual es inherentemente largo, partilo en dos líneas de `aligned` (un paso intermedio más) o simplificá la expresión, no lo dejes todo en una línea esperando que el `aligned` lo resuelva.

---

## Negrita: dos usos distintos

1. **En `incorrecta`/`falsa`/inversiones de la consigna**: anti-error de lectura. La palabra puede perderse en un escaneo rápido y el usuario termina respondiendo lo contrario. No es una concesión a la facilidad cognitiva, es evitar un error de parsing del enunciado antes de razonar el contenido.
2. **La restricción crítica del cierre del enunciado** (condicionantes de dominio, inversiones sintácticas que le dan el peso lógico final) **NO se negrita.** Ahí la fricción es deseada, es lo que obliga a abandonar la lectura automática y entrar en pensamiento analítico.

En síntesis: negritar lo que se puede perder por accidente; no negritar lo que se quiere que cueste a propósito.

---

## Formato de párrafos

`MathText` usa `whitespace-pre-line`, así que `\n` = salto de línea y `\n\n` = línea en blanco.

- **Entre dos párrafos de prosa** (dos ideas completas) → `\n\n` (línea en blanco). Aplica tanto a `question` como a `explanation`.
- **Pegado a una fórmula centrada `$$...$$`** (antes o después) → un solo `\n`. La fórmula pertenece a la oración que la rodea y KaTeX displayMode ya agrega margen vertical.

**Ejemplos:**

❌ Mal, doble salto rodeando la fórmula:
```
Al elevar al cuadrado se obtiene\n\n$$0^2 = 0, \quad (\pm 1)^2 = 1$$\n\nLas salidas distintas son $\{0, 1\}$.
```

✅ Bien, un solo salto pegado a la fórmula:
```
Al elevar al cuadrado se obtiene\n$$0^2 = 0, \quad (\pm 1)^2 = 1$$\nLas salidas distintas son $\{0, 1\}$.
```

✅ Bien, párrafo en blanco entre dos ideas de prosa (sin fórmula en el medio):
```
Una función transforma cada entrada en una única salida.\n\nAcá el 9 podría transformarse en 3 o en $-3$.
```

**Cómo se miden los límites de párrafo cuando hay una fórmula centrada en el medio.**
El tope de 200 caracteres de prosa y el umbral de 2+ inline de la regla 21 aplican a
**cada tramo de prosa entre bloques `$$...$$`**, no al párrafo completo. Una fórmula
centrada ya corta la lectura (displayMode agrega margen vertical), así que la prosa de
antes y la de después son tramos separados a los ojos del lector. Sin este criterio, la
regla del `\n` simple pegado a `$$` haría que un párrafo bien escrito se midiera como un
solo bloque largo, y el remedio que la propia regla 21 recomienda ("sacá la fórmula
central a un bloque `$$...$$`") nunca bajaría el conteo. `validate_content.py` lo
implementa así en `prose_segments()`.

### Fórmulas anchas: partir en pasos, nunca scroll horizontal

El frontend **no** agrega scroll horizontal a los bloques `$$...$$` ni a las fórmulas inline: una fórmula que no entra en el ancho de pantalla se corta contra el borde, y no hay que resolverlo con scroll. Nunca encadenes varias igualdades largas en una sola fórmula (`$$f(x) = 1 \cdot (x-1)^2 + (-3) = (x-1)^2 - 3$$`) ni pongas una expansión de varios términos en una fórmula inline (`$...$`, que además renderiza con `white-space: nowrap` y no puede partirse en dos líneas). Partí la derivación en **varios bloques `$$...$$` cortos, uno por paso**.

**Orden de preferencia para partir un paso:**
1. **Apilar los bloques verticalmente, sin texto entre medio**, cuando el paso siguiente se entiende solo (dos `$$...$$` consecutivos, cada uno con su `\n` de separación). Es la opción más limpia si no hace falta narrar nada entre un paso y el otro.
2. **Si apilarlos sin texto queda confuso** (el lector no entiende por qué se pasó de una expresión a la otra), agregar una frase corta de transición entre los dos bloques. Preferible a forzar todo en una sola expresión horizontal larga, aunque agregue una oración de más.

- ❌ `$$f(x) = 1 \cdot (x - 1)^2 + (-3) = (x-1)^2 - 3$$` (una sola fórmula con dos igualdades encadenadas, ancha).
- ❌ `Expandiendo: $(x-1)^2 - 3 = x^2 - 2x + 1 - 3 = x^2 - 2x - 2$.` (expansión de tres términos metida inline).
- ✅ Apilado directo, sin texto: `$$(x-1)^2 - 3 = x^2 - 2x + 1 - 3$$\n$$x^2 - 2x - 2$$`.
- ✅ Con texto de transición, cuando hace falta narrar el paso: `Sustituyendo $h=1$, $k=-3$ y $a=1$:\n$$f(x) = (x - 1)^2 - 3$$` para el primer paso, y `Expandiendo $(x-1)^2 - 3$:\n$$x^2 - 2x + 1 - 3$$\nQue se simplifica a\n$$x^2 - 2x - 2$$` para el segundo.

**Esta regla aplica a todos los campos con LaTeX, no solo a `explanation`/`question`.** `feedback_correct` también puede desbordar si carga una derivación completa en una sola fórmula larga. Como `feedback_correct` tiene que quedar en 1 oración corta, ahí la partición en pasos no es una opción: la solución es mantenerlo con la relación o el resultado final, corto, y mover cualquier paso intermedio de la derivación a `explanation`.
- ❌ `feedback_correct: "$(2x+1)^2 = (2x)^2 + 2(2x)(1) + 1^2 = 4x^2 + 4x + 1$."` (encadena 3 igualdades en un campo que debe ser 1 oración corta)
- ✅ `feedback_correct: "$(2x+1)^2 = 4x^2 + 4x + 1$."` (el desarrollo paso a paso va en `explanation`)

**Caso particular: multiplicar por un factor (conjugado, `1` disfrazado) antes de simplificar.** El primer renglón de una racionalización o de cualquier paso que "multiplica arriba y abajo por algo" tiende a desbordar porque junta 4 sub-expresiones en una sola línea (la fracción original, el factor, y el resultado ya multiplicado). Separar el **planteo de la multiplicación** de su **resultado simplificado** en renglones distintos del mismo `aligned`, en vez de mostrar los dos en la misma línea.
- ❌ `$$\begin{aligned} \frac{\sqrt{x+32}-6}{x-4} \cdot \frac{\sqrt{x+32}+6}{\sqrt{x+32}+6} &= \frac{(x+32)-36}{(x-4)(\sqrt{x+32}+6)} \\ &= \dots \end{aligned}$$` (primer renglón con 4 sub-expresiones, desborda en mobile)
- ✅ `$$\begin{aligned} &\frac{\sqrt{x+32}-6}{x-4} \cdot \frac{\sqrt{x+32}+6}{\sqrt{x+32}+6} \\ &= \frac{(x+32)-36}{(x-4)(\sqrt{x+32}+6)} \\ &= \dots \end{aligned}$$` (el planteo de la multiplicación va solo en su propio renglón, sin el resultado)

### Planteos de GRAF: contexto en dos párrafos

En enunciados con gráfico, separar el **contexto** en dos párrafos cuando hay dos oraciones distintas (situación + qué muestra el gráfico), y la **pregunta** en un tercer párrafo:

```
Un remis cobra una tarifa fija al subir al auto, más un monto por kilómetro recorrido.

La gráfica muestra el costo total, en cientos de pesos, según los kilómetros.

¿Qué representa el valor donde la recta toca el eje vertical?
```

**Ojo: esto aplica a contexto cotidiano (situación real), no a restablecer en prosa lo que el gráfico ya muestra directamente.** Si el ejercicio no tiene un contexto cotidiano (es lectura pura de un gráfico abstracto) y el párrafo inicial solo describe rasgos visuales que el propio gráfico ya deja ver (ej. "la gráfica muestra dos ramas separadas por una asíntota, que se aplanan cerca del eje $X$"), ese párrafo es redundante y sobra: ir directo a la pregunta. El párrafo de contexto se justifica cuando aporta información que el gráfico solo no da (una situación real, unidades, qué representa cada eje), no cuando repite en palabras lo que ya es visualmente obvio.
- ❌ `La gráfica muestra dos ramas separadas por una línea vertical, y ambas ramas se aplanan horizontalmente cerca del eje $X$ a medida que $x$ crece.\n\n¿A qué familia de funciones pertenece esta gráfica?` (describe en prosa lo que el gráfico ya muestra, sin agregar nada)
- ✅ `¿A qué familia de funciones pertenece esta gráfica?` (el gráfico ya comunica esos rasgos, no hace falta describirlos antes)

---

## Redacción del enunciado

- **Sin paréntesis para aclaraciones en el enunciado.** Si una aclaración es imprescindible, integrala como oración propia. No la resuelvas con muletillas "es decir…" / "o sea…" / "esto es…" (prohibidas en `question`, ver *Preguntas directas* más abajo) ni con guion (em-dash y en-dash prohibidos, ver regla crítica 6). Los `:` de notación matemática sí van, pero dentro de LaTeX.
- **Evitá dos puntos `:` en la prosa del cuerpo**: preferir `.` o `,`. **Excepción**: un `:` de cierre para introducir una fórmula display es válido y recomendado (`Consideremos la función:` antes de `$$...$$`), ver *Sin preámbulos colgantes* más abajo.
- **Terminología: "función", nunca "regla".** Referirse siempre al objeto matemático como "la función" (nunca "la regla" ni "la regla matemática"). "Regla" queda reservada para nombrar procedimientos con nombre propio ("regla del producto", "regla de la cadena", "regla de derivación"), nunca como sinónimo genérico de función. Para describir el mecanismo: "la función transforma [entradas] en [salidas]". NUNCA usar la flecha `A → B` en prosa (solo en la fórmula centrada).
- **Situación cotidiana concreta + pregunta puntual** (no "¿qué significa X?").
- **Estructura de embudo invertido**: contexto liviano → objeto matemático aislado en `$$` → restricción/pregunta final. Cada capa reduce en volumen pero aumenta en abstracción.
- **Contexto y pregunta en párrafos separados**: cuando el enunciado tiene una oración de contexto seguida de la pregunta, separarlas con `\n\n`.
  - ❌ `El costo incluye costo fijo más costo por unidad. ¿Qué familia?`
  - ✅ `Una fábrica tiene un costo fijo de \$5000 más \$10 por cada unidad producida.\n\n¿Qué familia de función modela el costo total de producción?`
- **Ejercicios de comparación entre dos objetos matemáticos**: siempre incluir las fórmulas concretas en el enunciado, no solo la referencia abstracta.
  - ❌ `Entre dos parábolas, ¿cuál se ve más abierta?`
  - ✅ `Considerá las dos parábolas\n$$p(x) = 0{,}2x^2 - 3$$\n$$q(x) = 4x^2 - 3$$\n¿Cuál de las dos se ve más abierta?`
- **Sin preámbulos colgantes antes de una fórmula display**: prohibido abrir el enunciado con un fragmento de 1-3 palabras sin verbo, seguido de un `$$...$$`. Queda un texto suelto arriba del bloque que no cierra ninguna idea. Reescribí con una frase completa que introduzca la fórmula.
  - ❌ `La función\n$$r(x) = \frac{1}{x^2 - 9}$$\n¿Qué valores no están en el dominio?`
  - ✅ `Una función racional está dada por\n$$r(x) = \frac{1}{x^2 - 9}$$\n¿Qué valores no están en el dominio?`
  - ✅ `Considerá la función:\n$$r(x) = \frac{1}{x^2 - 9}$$\n¿Qué valores no están en el dominio?`
  - Fragmentos aceptables antes de `$$`, siempre que cierren con `:`: frases que terminan en `:` (`Consideremos la función:`), imperativas cortas con verbo + objeto concreto (`Analizá la función:`, `Considerá la función:`), o frases descriptivas completas (`Una función lineal modela el costo:`). El `:` no es opcional: un imperativo con objeto es una cláusula completa, pero igual necesita el `:` para separarse formalmente del bloque display (ver regla crítica 32). Sustantivos sueltos como `La función`, `El modelo` no cuentan como frase, ni con `:` agregado: no tienen verbo, hay que reescribirlos completos.
  - **Nunca cortar una oración a la mitad para meter la fórmula en el medio.** El texto antes del `$$` tiene que cerrar como unidad (punto o dos puntos), y lo que sigue después de la fórmula empieza como oración nueva; no puede ser la continuación gramatical de la misma oración que la fórmula interrumpió.
    - ❌ `El costo total depende de la cantidad producida según\n$$C(q) = 500 + 10q$$\ny se mide en pesos.` (la oración "depende... según... y se mide en pesos" queda partida a la mitad por la fórmula)
    - ✅ `El costo total depende de la cantidad producida según la siguiente expresión.\n$$C(q) = 500 + 10q$$\nSe mide en pesos.`
- **Preguntas directas, sin muletillas de aclaración**: prohibido colgar "es decir…", "o sea…", "esto es…" después de la pregunta principal para reformularla en palabras simples. Si la primera formulación es clara, la aclaración sobra; si no es clara, reescribí la primera formulación directamente. Las muletillas de aclaración regalan la respuesta o inflan el enunciado sin agregar información.
  - ❌ `¿Cuál es la preimagen del 0, es decir qué número entra para que salga 0?`
  - ✅ `¿Cuál es la preimagen del 0?`
  - ❌ `¿En qué semana el saldo llega a cero, es decir queda saldada la deuda?`
  - ✅ `¿En qué semana el saldo llega a cero?`
  - ❌ `Un bien pierde el 10% de su valor cada año, es decir, se multiplica por 0,9 año a año.`
  - ✅ `Un bien pierde el 10% de su valor cada año.` (traducir a multiplicador es parte del problema)
- **Preguntas directas, no formalizadas**: si la pregunta apunta a etiquetar un rol matemático (imagen/preimagen, variable dependiente/independiente, dominio/codominio), redactala de forma coloquial y directa: **"¿Qué sería el X respecto del Y en este caso?"** o **"¿Qué sería el total P en este caso?"**. Prohibido "¿qué rótulo formal se le da?", "¿qué nombre formal recibe?", "¿qué clasificación formal cumple?", "¿qué rol formal asume?". La palabra "formal" en el enunciado es un olor a redacción académica pesada, casi siempre reemplazable por "¿qué sería?".
  - ❌ `¿Qué rótulo formal, como imagen o dominio, le corresponde al 1210?`
  - ✅ `¿Qué sería el 1210 respecto del 1000 en este caso?`
  - ❌ `Entre imagen y preimagen, ¿qué rol asume el 4 respecto del 64?`
  - ✅ `¿Qué sería el 4 respecto del 64 en este caso?`
- **Preguntas auto-contenidas, nunca telegráficas**: la pregunta debe nombrar la magnitud concreta que se evalúa.
  - ❌ `¿Qué familia?`
  - ✅ `¿Qué familia de función describe el sueldo total en función de las ventas?`
- **Negrita en consignas invertidas**: si la consigna pregunta por la opción que NO cumple algo (`¿cuál es incorrecta?`, `¿cuál es falsa?`), envolver esa palabra clave en `**negrita**`.
  - ❌ `¿Cuál de estas afirmaciones es incorrecta?`
  - ✅ `¿Cuál de estas afirmaciones es **incorrecta**?`
  - Aplica a `falsa`/`falso`/`no cumple`/`no es cierta`. No aplica a `correcta`/`verdadera` en consignas afirmativas estándar.
- **Distractores = confusiones clásicas** (inyectividad, codominio↔imagen, dominio↔imagen, cardinalidad, etc.).
- **Distractores del mismo orden de magnitud que la correcta.** Si la respuesta correcta es `$a = 5$`, un distractor `$a = 185$` (que sale de evaluar $C(35)$ en vez de despejar) se descarta a ojo por gut-check: el alumno no razona, solo mira que "es demasiado grande" y lo descarta. Un distractor efectivo requiere hacer el cálculo mal, no rechazarlo por tamaño. **Regla operativa**: si un distractor numérico está a más de ~3-5× de la correcta, reescribilo como un error aritmético plausible del mismo orden.
  - ❌ Correcta `$a = 5$`, distractor `$a = 185$` (viene de $C(35) = 5 \cdot 35 + 10$). Ratio 37×, gut-check trivial.
  - ✅ Correcta `$a = 5$`, distractor `$a = 6$` (viene de restar el coeficiente $5$ en vez del término independiente $10$: $35 - 5 = 30$, $30/5 = 6$). Ratio 1.2×, hay que hacer el cálculo para descartarlo.
  - ❌ Correcta `$\pm 5$`, distractor `$625$` (viene de evaluar $f(25) = 25^2$). Ratio 125×.
  - ✅ Correcta `$\pm 5$`, distractor `$\pm 12{,}5$` (dividir entre 2 en vez de sacar raíz). Ratio 2.5×.
  - **Excepción**: cuando la confusión clásica intrínsecamente produce magnitud distinta (ej. confundir "8%" con "8" y con "1,08" en base exponencial), el distractor grande es válido porque el error viene de una lectura errónea del enunciado, no de un cálculo. Ahí el gut-check no ayuda.
- **Sin pistas en las opciones**: la opción correcta no debe llevar una glosa aclaratoria entre paréntesis que las distractoras no tengan, delata la respuesta.
  - ❌ `Lineal (constante)` → ✅ `Lineal`
- **"Cuadrática" y "Polinómica" no pueden convivir en la misma grilla**: si la respuesta correcta es `Cuadrática`, ninguna opción puede ser `Polinómica de grado N` (porque toda cuadrática es un polinomio → ambigüedad). Elegir distractor de familia claramente distinta. La regla aplica en espejo: si la correcta es `Polinómica`, no ofrecer `Cuadrática`.
- El cierre de la explicación es advertencia/consejo por defecto; humor solo excepcional (analogía cotidiana exagerada, nunca antropomorfismo). Ver *Estructura de la explicación*.
- **Sin nombres propios**: usar roles genéricos, "un vendedor", "una empresa", "un estudiante", "un puesto de limonada", "un remis", etc.
- **Dos fórmulas en un mismo enunciado**: nunca poner dos funciones en la misma línea display con `\qquad`, en mobile se corta. Usar dos bloques `$$` separados:
  - ❌ `$$f(x) = 3x^2 + 1 \qquad g(x) = 0{,}5x^2 + 1$$`
  - ✅ `$$f(x) = 3x^2 + 1$$\n$$g(x) = 0{,}5x^2 + 1$$`
- **Fórmulas largas**: mostrar solo la forma final simplificada en el enunciado. El paso intermedio puede ir en la explicación.
  - ❌ `$$I(p) = p(80 + 4(10 - p)) = p(120 - 4p)$$`
  - ✅ `$$I(p) = 120p - 4p^2$$`
- **Opciones "Otra/Otra2/Otra3"**: marcador de ejercicio incompleto. Nunca reseedear con opciones placeholder.
- **Notación consistente dentro de un mismo `options`**: todas las opciones de un ejercicio comparten el mismo registro. Si una opción usa notación simbólica/LaTeX (un conjunto, $\mathbb{R}$, una condición), ninguna otra puede ser una frase de prosa libre.
  - ❌ `["Cualquier precio entre 1000 y 2000", "$\\{1000, 2000\\}$", "$\\{1000\\}$", "$\\{2000\\}$"]` (la primera desentona, rompe el registro simbólico de las otras tres)
  - ✅ `["$[1000, 2000]$", "$\\{1000, 2000\\}$", "$\\{1000\\}$", "$\\{2000\\}$"]`
  - ❌ `["$a \\geq 0$", "Todos los reales", "$a \\neq 0$", "$a > 100$"]`
  - ✅ `["$a \\geq 0$", "$\\mathbb{R}$", "$a \\neq 0$", "$a > 100$"]`
  - ❌ `["$\\{2, 3, \\dots, 10\\}$", "El conjunto de alumnos"]` (mezcla notación de conjunto con descripción textual del rol)
  - ✅ describir el otro conjunto también en notación de conjunto (`$\\{\\text{alumnos}\\}$`) o, si no es representable en esa notación, reformular todas las opciones en prosa pareja.
- **Preferencia por notación LaTeX/simbólica en `options`, no solo por consistencia.** Ante la duda entre redactar una opción en prosa o en LaTeX, preferí LaTeX: además de evitar la mezcla de registros, ejercita el vocabulario simbólico del alumno, que es parte del objetivo del curso. Reservá la prosa para cuando el concepto no tiene una notación simbólica natural (nombres de familia de función, descripciones de comportamiento).
  - ❌ `["$\\mathbb{R}$ (todos los reales)", "$(0, +\\infty)$", "$\\mathbb{R} \\setminus \\{0\\}$", "Depende del grado"]` (la glosa "(todos los reales)" solo en la correcta, y mezcla con una opción en prosa pura)
  - ✅ `["$\\mathbb{R}$", "$(0, +\\infty)$", "$\\mathbb{R} \\setminus \\{0\\}$", "Depende del grado del polinomio"]`
- **Nunca mezcles decimales con coma dentro de conjuntos.** En español los decimales se escriben con coma (`4,3`) y los conjuntos separan elementos con coma (`{a, b, c}`). Si mezclás ambos en la misma opción, se vuelve ilegible: `$\{4{,}3, 6{,}7, 6{,}2\}$` parece un conjunto de 6 números, no de 3 decimales.
  - ❌ `$\{4{,}3, 6{,}7, 6{,}2, 8{,}8, 8{,}1\}$` (¿5 decimales o 10 enteros?).
  - ✅ Elegí valores enteros para la función. Si el ejercicio requiere colapso o repetición de valores, usá contextos con salidas naturales enteras (precios en pesos, cantidades, puntos, edades) en vez de forzar decimales.
  - Si es indispensable usar decimales dentro de un conjunto, usar punto (`4.3`) o separar visualmente con punto y coma (`$\{4{,}3;\; 6{,}7;\; 6{,}2\}$`). Preferí evitar la situación antes que resolverla con puntuación exótica.

---

## Vocabulario: términos prohibidos y su reemplazo formal

Registro formal y sencillo, sin jerga ni informalismos, en `question`, `options`, `feedback_correct`, `feedback_incorrect` y `explanation`.

| Prohibido | Reemplazo |
|-----------|-----------|
| "regla" / "regla matemática" (como sinónimo de función) | "función" (ver *Terminología* en Redacción del enunciado) |
| "escupir" (la función escupe un valor) | "dar como resultado", "producir" |
| "fabricar" (fabricar una función/regla) | "definirse", "construirse" |
| "aterrizan" (los valores aterrizan en...) | reformular sin metáfora: "llegan a", "caen en", o directo "son" |
| "procesa valores" | "transforma [entradas] en [salidas]" |
| "salida matemática" | "salida", "el valor de la función" |
| "error habitual" (como cierre de `explanation`) | "una confusión común", "un error común" (tono empático, no de diagnóstico clínico) |
| "escapar"/"escapa" (la función escapa a infinito) | "diverge", "crece sin cota", "tiende a $+\infty$/$-\infty$" |
| "linealidad" a secas (como nombre de planteo de derivación) | "múltiplo escalar" (o "múltiplo escalar (linealidad)" solo la primera vez que se define el término en el topic, nunca como la única palabra en una opción). En `violet/derivatives`, "linealidad" sola no es lo bastante concreta para el alumno; siempre aludir directo a la constante que se factoriza. |

**Regla general:** si una palabra o metáfora no aparece en el resto del documento como convención aceptada, y suena coloquial o jergosa, no se usa. Ante la duda, preferir la formulación más simple y neutra en vez de la más "creativa".

---

## LaTeX y signo `$`

- Inline: `$...$`. Display centrado: `$$...$$`.
- **Dinero**: el signo de pesos en prosa va **escapado** como `\$` (en el JSON: `\\$`). Si se usa `$` sin escapar para un monto, KaTeX lo toma como delimitador de fórmula y empareja con el siguiente `$`, rompiendo el render.
  - ❌ `es decir $400. ... a $200 cada uno`
  - ✅ `es decir \$400. ... a \$200 cada uno`
  - `MathText` soporta `\$` como pesos literal; ver `web/src/components/math-text.tsx`.

---

## Gráficos (`graph_fn`, `graph_view`)

El componente `web/src/components/math-graph.tsx` renderiza con **relación de aspecto 1:1** (misma escala px/unidad en ambos ejes) y grilla cuadrada dinámica.

- **Pendientes legibles a 1:1**: `|m| ≤ 2`. Con 1:1, `m=2 → 63°`, todavía legible cuadrito a cuadrito. Pendientes grandes (ej. `m=15`) salen casi verticales e ilegibles.
- **`graph_view` cuadrado**: `[xmin, xmax, ymin, ymax]` con `xRange ≈ yRange`. Los puntos clave deben caer dentro de la vista.
- Si un contexto cotidiano exige magnitudes dispares, **rediseñar el ejercicio** con números chicos en vez de romper el 1:1.

### Qué lee cada GRAF por tema

| Tema | Foco del gráfico |
|------|------------------|
| `linear` | pendiente (signo/magnitud), ordenada al origen, raíz |
| `quadratic` | vértice, eje de simetría, raíces, concavidad |
| `polynomial` | grado/paridad por forma, raíces, extremos |
| `exponential` | crecimiento/decrecimiento, corte en $(0,1)$, asíntota horizontal |
| `logarithmic` | dominio $(0,\infty)$, corte en $(1,0)$, asíntota vertical |

---

## Estructura de la explicación (`explanation`)

Cada campo `explanation` sigue una estructura de **tres partes**:

1. **Concepto abstracto**: la fórmula, regla o propiedad general que aplica.
2. **Aplicación al ejemplo**: desglose paso a paso del caso concreto. Cuando hay dos o más pasos de álgebra o sustitución, usar el bloque alineado:
   ```
   $$\begin{aligned}
   \text{LHS} \\
   &= \text{paso 1} \\
   &= \text{resultado}
   \end{aligned}$$
   ```
3. **Cierre útil** (cuando aporte): una oración que continúa la explicación en voz directa, sin anunciarse como advertencia. **Prohibido** abrir con "La confusión típica es...", "Un error común/frecuente/clásico es...", "La trampa (típica) es..." o cualquier variante que rotule la oración antes de decirla — suena a informe de auditoría, no a alguien explicando. En cambio, afirmá el punto directo o usá un conector narrativo ("Ojo:", "Acá conviene...", "Vale la pena notar que...", o directamente segunda persona: "Si dividís antes de restar, te vas a equivocar de..."). Variá el conector entre ítems del mismo archivo — repetir el mismo arranque en varios ítems cae en la regla 32. El humor es **excepcional**: solo si surge naturalmente una **analogía cotidiana exagerada** (una consecuencia práctica o escena burocrática absurda) enunciada en tono formal, nunca antropomorfismos ni un chiste externo. Si no hay nada pertinente que decir en voz directa ni una analogía que cierre bien, terminá en la aplicación: un cierre forzado resta.
   - ❌ `Un error clásico es restar directamente los índices ($5-4=1$) sin expandir ningún factorial, tratando al símbolo $!$ como una operación lineal.` (rotula la oración como advertencia antes de decir el contenido)
   - ✅ `Restar los índices directo ($5-4=1$) da un número parecido mucho por casualidad: el $!$ no es una operación lineal, así que hay que expandir cada factorial antes de simplificar.`

**Nunca cortar una oración a la mitad para insertar una fórmula display en el medio** (misma regla que en *Redacción del enunciado* → *Sin preámbulos colgantes*, aplica igual acá): el texto antes del `$$` cierra en punto o dos puntos, y lo que sigue después empieza como oración nueva.

**Largo de párrafo: máximo ~200 caracteres, ideal ~100.** Cada párrafo (unidad separada por `\n\n`) no supera los 200 caracteres; el largo cómodo de lectura en mobile ronda los 100. Si un párrafo se pasa de 200, cortalo en dos separados por `\n\n`, no importa si eso parte una oración larga en dos frases más cortas o dos oraciones distintas en dos párrafos.
- ❌ `Ojo, unicidad no es inyectividad: acá miramos que cada entrada dé una sola salida, no al revés. Es un error habitual confundir ambos conceptos.` (un solo párrafo, ~145 caracteres pero rozando el límite y mezclando dos ideas)
- ✅ `Ojo, unicidad no es inyectividad: acá miramos que cada entrada dé una sola salida, no al revés.\n\nConfundir ambos conceptos es una confusión común.`
- Dos oraciones cortas que juntas no superan los ~100-160 caracteres pueden convivir en el mismo párrafo sin problema; no hay obligación de separar oración por oración.

**Extensión mínima:** las tres partes juntas deben superar los 300 caracteres. Una sola oración de resultado no es una explicación. Cuando el cierre no va, compensá con más detalle en el concepto o la aplicación.

**Errores frecuentes:**
- Poner solo el resultado de la cuenta sin explicar el concepto general.
- Declarar una regla o clasificación sin razonarla (ver regla crítica 25): nombrar "es una indeterminación" o "no cumple la condición" sin explicar el mecanismo que lo produce.
- Forzar humor donde no cierra: si no surge una analogía natural, la parte 3 va como advertencia/consejo o directamente no va.
- Cerrar con un antropomorfismo o un chiste externo al tema (prohibido, ver regla crítica 7).
- Usar la cadena horizontal `A = B = C = D` para derivaciones largas, usar `\begin{aligned}` vertical en su lugar.

---

## Bugs conocidos / pendientes técnicos

- **[CORREGIDO] Render de `$` de pesos**: montos con `$` sin escapar rompían KaTeX. Solución: `\$` en contenido + soporte de escape en `MathText`. Verificar que ningún ejercicio nuevo use `$` sin escapar para dinero.
- **[CORREGIDO A NIVEL GLOBAL] Saltos de línea doble-escapados (`\\n` en vez de `\n`)**: algunos ejercicios generados guardan el salto de línea como los dos caracteres literales `\` + `n` en el JSON en vez de un salto de línea real, lo que se mostraba como el texto crudo `\n` en pantalla en vez de un salto. `MathText` ahora normaliza cualquier `\n` literal a salto de línea real en los segmentos de texto plano (nunca dentro de `$...$`/`$$...$$`, así que no puede corromper comandos LaTeX como `\neq`/`\nu`/`\nabla`). No hace falta editar el contenido existente ni futuro para este problema puntual, pero **seguí escribiendo `\n` real (no `\\n`) al generar JSON nuevo**, es la forma correcta.
- Las **sesiones cachean** el contenido del ejercicio al construirse (`session_store.py`), en memoria. Tras reseedear, las sesiones ya abiertas siguen con el snapshot viejo; arrancar una sesión nueva para ver cambios.
- **[CORREGIDO EN CONTENIDO] Límites laterales sin punto de tendencia (`\lim^-`/`\lim^+` sueltos)**: 10 ejercicios entre `continuity/CLSF.json` y `lateral_limits/{GRAF,LEXI,RESL}.json` (33 ocurrencias) escribían el lateral sin el `_{x \to a}` debajo. Corregido con un script puntual (reemplazo directo por ejercicio, agregando el punto de tendencia correcto de cada caso). Ver regla crítica 27. Si aparece de nuevo en contenido nuevo, es un error de generación, no un bug de render.

---

## Resumen operativo, repetir mentalmente antes de cada ejercicio

Están duplicadas arriba a propósito, para que también estén disponibles al final del documento (donde el modelo suele buscarlas antes de generar).

**NUNCA:**
- NUNCA usar `**...**` dentro de `options`.
- NUNCA usar `\n\n` pegado a un bloque `$$...$$`.
- NUNCA agregar glosa solo a la opción correcta, ni dejar que la correcta sea la única notablemente más larga O más corta que el resto.
- NUNCA usar nombres propios (usar roles genéricos).
- NUNCA inflar el enunciado con adjetivos decorativos.
- NUNCA meter antropomorfismos ni chistes externos; el cierre es advertencia/consejo, y el humor (excepcional) va como analogía cotidiana formal.
- NUNCA decir "regla" por "función" (salvo nombre propio: "regla del producto", "regla de la cadena").
- NUNCA cortar una oración a la mitad para meter una fórmula display en el medio; el fragmento antes cierra en punto o dos puntos, y lo que sigue después es oración nueva.
- NUNCA mezclar registro de notación dentro de un mismo `options` (una opción en prosa libre y otras en notación simbólica/LaTeX).
- NUNCA usar vocabulario informal ("escupir", "fabricar", "aterrizan", "procesa valores", "salida matemática", "error habitual"); ver *Vocabulario: términos prohibidos*.
- NUNCA invocar derivadas, límites ni integrales (ni ningún concepto fuera de la frontera matemática del cinturón) para justificar una conclusión, aunque simplifique la explicación.
- NUNCA usar los símbolos ✓/✗/✘ en ningún campo.
- NUNCA dejar una línea de puro texto sin `&` dentro de un `aligned` que sí tiene `&` en otras líneas.
- NUNCA dejar un párrafo sin puntuación terminal.
- NUNCA tejer la fórmula central del enunciado inline dentro de la pregunta (sobre todo fracciones); va separada en su propio bloque, con el texto acompañándola.
- NUNCA repetir la etiqueta de eje/variable en una opción compuesta si la pregunta ya fija el orden de los valores.
- NUNCA describir en prosa, antes de la pregunta, rasgos de un gráfico que el gráfico ya muestra directamente (distinto del contexto cotidiano real, que sí va).
- NUNCA envolver un `\begin{aligned}` en `$...$` inline; siempre `$$...$$` display, con un solo `\\` por salto de línea (nunca `\\\\`).
- NUNCA usar `\frac` (textstyle, se ve chico) en opciones de fracciones cortas de grilla 2×2; usar `\dfrac` (apilada, displaystyle) en las 4. Reservar la notación de barra (`1/3`) para cuando el set mezcla fracciones con enteros sueltos y la fracción apilada desentona en altura contra ellos.
- NUNCA acumular 2 o más fórmulas LaTeX inline sueltas en el mismo párrafo de `explanation`; es señal de dividir el párrafo o subir la fórmula central a `$$...$$`.
- NUNCA agregar el nombre de familia entre paréntesis al lado de una opción que ya es una fórmula autoexplicativa.
- NUNCA declarar una regla, clasificación o resultado en el concepto abstracto sin razonar el mecanismo que lo produce.
- NUNCA meter una oración completa en español dentro de `\text{...}` en un bloque `$$...$$`; las palabras van en la prosa, la fórmula solo lleva símbolos y números.
- NUNCA usar "escapar"/"escapa" para describir divergencia (usar "diverge", "crece sin cota", "tiende a $\pm\infty$").
- NUNCA escribir un límite lateral sin el punto de tendencia en el subíndice (`\lim^-`/`\lim^+` sueltos); siempre `\lim_{x \to a^-}`/`\lim_{x \to a^+}`.
- NUNCA tejer una fracción $\tfrac{0}{0}$ apilada dentro de un párrafo de prosa; usar la forma horizontal `0/0` en texto corrido.
- NUNCA dejar caer el `\lim_{x \to a}` de las líneas intermedias de un desarrollo `aligned`, ni reemplazarlo por una flecha `\xrightarrow{}`; se repite en cada línea hasta el resultado final.
- NUNCA alinear con columna de `=` en un `aligned` para listar datos/valores evaluados de forma independiente; esa alineación se reserva para una ecuación que se despeja o una expresión que se transforma paso a paso.
- NUNCA asumir que el alumno ya vio la definición/fórmula central en otro ejercicio de la sesión; cada ejercicio la reintroduce si la necesita.
- NUNCA dejar un imperativo con objeto concreto ("Considerá la función", "Analizá la función") sin el `:` que lo cierra antes de un bloque `$$...$$`; y NUNCA usar un fragmento sin objeto propio ("Sabiendo que", "Para derivar", "En") como si el `:` solo lo arreglara, hay que reescribirlo como cláusula completa. En ambos casos, variar la redacción ejercicio a ejercicio, no repetir la misma apertura en toda una sub-familia.

**SIEMPRE:**
- SIEMPRE `\n\n` entre contexto y pregunta.
- SIEMPRE `\n$$...$$\n` (un solo salto) rodeando fórmulas display.
- SIEMPRE `**dominio**`, `**imagen**`, `**codominio**`, `**preimagen**`, `**unicidad**` en su primera mención en `question` y en `explanation`.
- SIEMPRE `feedback_incorrect` como array del mismo largo que `options`, con `null` en el índice correcto.
- SIEMPRE `\$` para pesos (en JSON: `\\$`).
- SIEMPRE párrafos de `explanation` ≤200 caracteres (ideal ~100); cortar con `\n\n` si se pasa.
- SIEMPRE mayúscula al empezar una oración, incluso si arranca con una variable en minúscula (`$b$`, `$x$`) o después de una fórmula display.
