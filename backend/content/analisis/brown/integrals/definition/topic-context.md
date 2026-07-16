# Topic: definition (Definición — Integral indefinida)

Belt: `brown`, Unit: `integrals`, Topic: `definition`

Skills en este topic: `LEXI`, `FORM`, `ESTR`. **50 ítems cada uno (150 en total)** al cerrar el refactor.

**Estado.** Este tópico es la **puerta de entrada al cinturón brown**: define qué es la integral indefinida, fija el vocabulario (integrando, diferencial, primitiva, constante de integración) y prepara el terreno para el tópico siguiente (`reglas`), donde el alumno va a aplicar las fórmulas de integración directa.

**Sin RESL en este tópico.** La resolución numérica de integrales vive en los tópicos siguientes (`reglas`, `sustitución`, `partes`). Acá se trabaja anatomía + linealidad + acondicionamiento algebraico previo, sin cálculo final.

Renombrado desde `indefinite_integral/`; los `external_id` se regeneran en la próxima seed (`brown_definition_lexi_01…`), lo que rompe el progreso guardado en DB — asumido y aceptado.

---

## Estado matemático del alumno (restricción de alcance)

- **Lo que sabe:** todo el cinturón violet cerrado — **derivadas** de funciones elementales, **linealidad** de la derivada, **reglas del producto y cociente**, **regla de la cadena**. Del cinturón blue y white: **funciones**, **límites**, **continuidad**.
- **Lo que está aprendiendo acá:** el concepto de **antiderivada** ($F' = f \Rightarrow F$ es primitiva de $f$), la **notación integral** $\int f(x) \, dx = F(x) + C$ y sus piezas (integrando, diferencial, constante de integración), la **linealidad** del operador integral (extraer constantes, separar sumas y restas) y el **acondicionamiento algebraico** que precede a la integración (desarrollar productos, reescribir raíces y cocientes como potencias).
- **Lo que NO sabe todavía:** las **fórmulas de integración directa** (regla de la potencia para integrar, integrales de exponenciales/trigonométricas/logarítmicas — todo eso vive en `reglas`), **sustitución**, **integración por partes**, **integral definida** y su interpretación como **área** neta bajo la curva.

### Regla dura

En este tópico se trabaja **sin ejecutar el cálculo integral final**. El alumno reconoce la anatomía, arma la estructura y decide el acondicionamiento algebraico. La ejecución de $\int x^n \, dx = \tfrac{x^{n+1}}{n+1} + C$ se hace en el tópico siguiente.

**Prohibido**:

- **Aplicar la regla de la potencia para integrar** ($\int x^n \, dx = \tfrac{x^{n+1}}{n+1} + C$) como paso resolutivo dentro de un ítem. En ESTR se puede indicar la **reescritura previa** ($\tfrac{1}{x^3} \to x^{-3}$), pero no dar el resultado ya integrado.
- **Integral definida** ($\int_a^b$), **área bajo la curva**, **Teorema Fundamental del Cálculo**: son tópicos posteriores (`definite`, `ftc` en cinturón black). Se pueden usar como **distractores explícitos** en LEXI sub-B para descartar la confusión "la integral devuelve un área" en esta etapa.
- **Integración por sustitución** ($u$-sub) o **por partes**: tópicos siguientes; no aparecen ni como método ni como distractor razonable acá.
- **Justificar por sumas de Riemann** o construcciones de tipo "límite de la suma": el alumno todavía no vio la definición integral formal; se toma la antiderivada como definición operativa.
- **Constante de integración omitida**: todo ítem que muestre una primitiva sin $+ C$ (fuera de contextos donde se auditara explícitamente esa omisión) se descarta. La familia infinita de primitivas es constitutiva del concepto.

Los ítems que quiebren esta regla se descartan y se reescriben.

---

## Correcciones de formato transversales (los 3 skills)

Reglas de authoring que se aplican al escribir los 150 ítems:

1. **`$$...$$` display separados por un solo `\n`**, nunca `\n\n`.
2. **Explicaciones en 3 párrafos de prosa** separados por `\n\n`. Estructura: (a) nombrar el objeto matemático evaluado (concepto de primitiva, anatomía de la notación, linealidad, reescritura), (b) desarrollar la lógica con al menos un `\begin{aligned}` donde corresponda, (c) cerrar con advertencia técnica sobre la confusión típica (integrando ≠ resultado, $dx$ no multiplica, no separar productos, $\tfrac{1}{x^n} = x^{-n}$). Sin viñetas `•`, sin sub-`-`, **sin em-dash `—` (prohibido estricto)**, sin humor.
3. **Feedback incorrecto**: array paralelo a `options`, `null` en el correcto. Contrastar el error común con el procedimiento correcto ("el $dx$ no es un factor", "no podés separar el producto en dos integrales", "reescribí $\tfrac{1}{x^3}$ como $x^{-3}$ antes de integrar"). Voz descriptiva, segunda persona amable.
4. **Negrita en primera mención** de conceptos clave: **integral indefinida**, **antiderivada**, **primitiva**, **integrando**, **diferencial**, **constante de integración**, **linealidad**. Nunca negritas dentro de `options`.
5. **Variables inline** ($x$, $f$, $F$, $C$) en la prosa.
6. **Ortotipografía**: decimales con **coma** (`4,3`). Sin nombres propios.
7. **`correct_index` variado**, no concentrado en un solo índice.

---

## LEXI, 50 ítems

### Qué evalúa
**Anatomía matemática y consolidación del Sistema 1** para el nuevo operador. Reconocimiento de qué pieza de la notación cumple qué rol y de la relación conceptual entre primitiva y derivada. Sin cálculo.

### Cardinalidad
**Exactamente 3 opciones** por ítem.

`tags` (ver `authoring-context.md` §Etiquetas): cada ítem lleva el slug de su fila como `"tags": ["<slug>"]`.

### Distribución por sub-familia

| Sub-familia | Foco | Slug | Cant. |
|-------------|------|------|:-----:|
| A. Anatomía de la notación | Identificar el rol de cada pieza en $\int f(x) \, dx = F(x) + C$: el **integrando** $f(x)$, el **diferencial** $dx$ marcando la variable de integración, el símbolo $\int$ como operador, la **primitiva** $F(x)$ como resultado y la **constante de integración** $C$ como parte inseparable del resultado. | `anatomia-notacion-integral` | 25 |
| B. Concepto de primitiva y traslación geométrica | Fijar la relación operativa con la derivada ($F' = f \Rightarrow F$ es primitiva de $f$) y su impacto visual: todas las primitivas de una misma función forman una **familia de curvas paralelas**, desplazadas verticalmente por el valor de $C$. | `concepto-primitiva-traslacion-geometrica` | 25 |

### `feedback_incorrect`, confusiones fuente

- **Integrando vs resultado**: creer que el integrando $f(x)$ es "lo que se integra a" en vez de "lo que se integra". El integrando es la función **de entrada**; la primitiva es la **de salida**.
- **$dx$ como factor multiplicador**: leer $\int 3x \, dx$ como "3x por dx", intentar operar aritméticamente con $dx$. El diferencial **marca la variable** de integración; no multiplica.
- **Constante de integración olvidada o mal ubicada**: dar $F(x)$ como respuesta sin el $+ C$, o creer que $C$ es una constante fija universal en vez de un parámetro libre.
- **Símbolo $\int$ como suma**: interpretarlo como una sumatoria discreta. Es el operador integral, no un $\sum$.
- **Primitiva mal definida**: dar la relación al revés ($f' = F$) o creer que la primitiva y la derivada son la misma operación aplicada distinto.
- **La integral devuelve un área**: creer que $\int f(x) \, dx$ da un valor numérico igual al área bajo la curva. Ese es el rol de la **integral definida** $\int_a^b$ (tópico posterior); la indefinida devuelve una **familia de funciones**.
- **Las curvas de $F(x) + C$ se cruzan**: creer que las primitivas se intersectan en el origen o en algún punto. Al diferir en una constante, son **estrictamente paralelas verticalmente**; no se cruzan nunca.

### Reglas específicas
- **Ningún cálculo** en LEXI: solo reconocimiento y relaciones conceptuales.
- **Sub-A** con opciones que muestran los términos etiquetados como texto exacto (por ejemplo, `"f(x) es el integrando"`, `"f(x) es la primitiva"`, `"f(x) es el diferencial"`).
- **Sub-B** con opciones tipo "$F' = f$", "$f' = F$", "$F' = f + C$" para auditar la relación conceptual con la derivada.
- **Negrita en primera mención** de `integral indefinida`, `antiderivada`, `primitiva`, `integrando`, `diferencial`, `constante de integración`.

---

## FORM, 50 ítems

### Qué evalúa
**Comprensión teórica de la linealidad** del operador integral. Desarmar un integrando en integrales elementales sin ejecutar el cálculo. Distinguir propiedades válidas (linealidad) de propiedades falsas (integral de un producto ≠ producto de integrales; integral de un cociente ≠ cociente de integrales).

### Cardinalidad
**3 opciones por defecto**. **4 opciones** cuando los esqueletos de la respuesta son numéricos cortos que entran en la grilla 2×2 (≤ 35 caracteres cada uno) — típicamente en sub-A cuando las opciones son formas como `"4∫x²dx - 3∫sin x dx"`.

`tags` (ver `authoring-context.md` §Etiquetas): cada ítem lleva el slug de su fila como `"tags": ["<slug>"]`.

### Distribución por sub-familia

| Sub-familia | Foco | Slug | Cant. |
|-------------|------|------|:-----:|
| A. Extracción y separación de términos | Desarmar un integrando complejo aplicando la **linealidad** completa. Ejemplo: dada $\int (4x^2 - 3\sin x) \, dx$, elegir la forma armada $4\int x^2 \, dx - 3\int \sin x \, dx$. Extraer constantes multiplicativas fuera de la integral y separar sumas/restas en integrales independientes. | `extraccion-separacion-terminos` | 25 |
| B. Límites de la linealidad y falsas propiedades | Diferenciar propiedades válidas de inventos algebraicos. Ejemplo: $\int (x \cdot \cos x) \, dx$ **no** se puede partir como $\int x \, dx \cdot \int \cos x \, dx$. Igual con cocientes: $\int \tfrac{f(x)}{g(x)} \, dx \neq \tfrac{\int f(x) \, dx}{\int g(x) \, dx}$. Reconocer qué operaciones respeta la linealidad y cuáles no. | `limites-linealidad-falsas-propiedades` | 25 |

### `feedback_incorrect`, confusiones fuente

- **Constantes dejadas adentro**: en $\int 4x^2 \, dx$, dar $\int 4x^2 \, dx$ como forma final "ya armada" en vez de $4 \int x^2 \, dx$. La linealidad **extrae el escalar** fuera de la integral.
- **Signos mal separados**: en $\int (4x^2 - 3\sin x) \, dx$, dar $4 \int x^2 + 3 \int \sin x$ (perdiendo el signo). La linealidad respeta el signo de cada término: $4 \int x^2 \, dx - 3 \int \sin x \, dx$.
- **Diferencial solo al último término**: en $\int (x + \sin x) \, dx$, dar $\int x + \int \sin x \, dx$ (con $dx$ solo en el segundo). El diferencial pertenece a **cada** integral por separado: $\int x \, dx + \int \sin x \, dx$.
- **Integral del producto = producto de integrales**: dar $\int x \cdot \cos x \, dx = \int x \, dx \cdot \int \cos x \, dx$. La linealidad **no vale para productos**. La forma correcta requiere integración por partes (tópico posterior); acá solo se pide **reconocer que no se puede separar**.
- **Integral del cociente = cociente de integrales**: dar $\int \tfrac{f(x)}{g(x)} \, dx = \tfrac{\int f(x) \, dx}{\int g(x) \, dx}$. Igual que con productos: la linealidad no aplica.
- **Suma dentro de la integral distribuida a exponentes**: en $\int (x^2 + x) \, dx$, intentar armar $\int x^{2+1} \, dx$. La suma **de términos** dentro del integrando se separa; los exponentes no se combinan.

### Reglas específicas
- **Sin cálculo final**: no dar el valor de la integral resuelta; solo la forma armada usando linealidad.
- **Sub-A** con opciones tipo `"4∫x²dx - 3∫sin x dx"` como texto (cortas, entran en grilla 2×2 si son ≤ 35 caracteres → 4 opciones; si no, 3).
- **Sub-B** con opciones que muestran una propuesta de separación como texto, más una opción "no se puede separar así" o "la linealidad no aplica a este caso". El distractor mayoritario es la separación indebida (producto o cociente).
- **Negrita en primera mención** de `linealidad`.

---

## ESTR, 50 ítems

### Qué evalúa
**Decisiones de acondicionamiento algebraico** previas al armado. Bloquear vicios operativos que arruinarían el cálculo posterior. Preparar el terreno para el tópico `reglas` reconociendo qué expresiones **necesitan reescritura** antes de aplicar cualquier fórmula de integración.

### Cardinalidad
**Exactamente 3 opciones** por ítem.

`tags` (ver `authoring-context.md` §Etiquetas): cada ítem lleva el slug de su fila como `"tags": ["<slug>"]`.

### Distribución por sub-familia

| Sub-familia | Foco | Slug | Cant. |
|-------------|------|------|:-----:|
| A. Expansión y distribución obligatoria | Detectar cuándo el paso previo eficiente es álgebra básica antes de integrar. Ejemplos: frente a $(x + 2)^2$ desarrollar el trinomio a $x^2 + 4x + 4$; frente a $\tfrac{x^3 + 5x}{x}$ repartir el denominador y quedar con $x^2 + 5$; frente a $x(x^2 - 1)$ distribuir a $x^3 - x$. | `expansion-distribucion-obligatoria` | 25 |
| B. Reescritura de potencias y raíces | Auditar la conversión a formato de potencia como paso previo. Ejemplos: $\tfrac{1}{x^3} \to x^{-3}$; $\sqrt{x} \to x^{1/2}$; $\sqrt[3]{x^2} \to x^{2/3}$; $\tfrac{1}{\sqrt{x}} \to x^{-1/2}$. | `reescritura-potencias-y-raices` | 25 |

### `feedback_incorrect`, confusiones fuente

- **Integrar el interior y elevar al cuadrado**: frente a $\int (x + 2)^2 \, dx$, proponer "integrar $(x + 2)$ y elevar al cuadrado". El cuadrado no conmuta con la integración; **primero se desarrolla** el trinomio y luego se integra término a término.
- **Derivar el integrando para simplificar**: proponer derivar $(x + 2)^2$ antes de integrar. Derivar cambia la función; el acondicionamiento **preserva la función** (identidades algebraicas), la derivada no.
- **Cociente sin repartir el denominador**: frente a $\tfrac{x^3 + 5x}{x}$, dejar la expresión intacta e intentar integrar cociente y denominador por separado. Se debe **repartir**: $\tfrac{x^3}{x} + \tfrac{5x}{x} = x^2 + 5$.
- **Subir la variable dejando el exponente positivo**: frente a $\tfrac{1}{x^3}$, escribir $x^3$ (subir sin negar) en vez de $x^{-3}$ (subir invirtiendo el signo del exponente). La regla es $\tfrac{1}{x^n} = x^{-n}$.
- **Raíz sin convertir**: dejar $\sqrt{x}$ o $\sqrt[3]{x^2}$ tal cual e intentar aplicar la regla de la potencia (tópico siguiente) sin reescritura previa. Se debe pasar a **exponente fraccionario**: $\sqrt{x} = x^{1/2}$, $\sqrt[3]{x^2} = x^{2/3}$.
- **Distribuir mal en un producto**: frente a $x(x^2 - 1)$, dejar como producto o distribuir con signo incorrecto ($x^3 + x$). Se debe distribuir correctamente: $x \cdot x^2 - x \cdot 1 = x^3 - x$.
- **Denominador integrado aislado**: frente a $\tfrac{1}{x^3}$, proponer "integrar $x^3$ y usar el $\tfrac{1}{\cdot}$ como resultado". La integración no invierte cocientes; se reescribe como potencia negativa y se aplica linealidad + regla de la potencia.

### Reglas específicas
- **Sin cálculo final**: ESTR solo audita **cuál es el paso previo correcto**, no el valor integrado.
- **Opciones con textos exactos** para la elección de método: `"Desarrollar el binomio y luego integrar"`, `"Repartir el denominador"`, `"Reescribir como potencia negativa"`, `"Reescribir la raíz como potencia fraccionaria"`, `"Integrar el interior y elevar al cuadrado"` (distractor), `"Derivar el integrando"` (distractor).
- **Sub-A**: la respuesta correcta es siempre el desarrollo/reparto/distribución algebraica; el distractor mayoritario es "integrar sin acondicionar" o "invertir el orden de operaciones".
- **Sub-B**: la respuesta correcta es la reescritura a potencia; el distractor mayoritario es dejar la expresión sin reescribir o convertir con signo/exponente equivocado.
- **Ninguna aplicación de la regla de la potencia para integrar** ($\int x^n \, dx = \tfrac{x^{n+1}}{n+1} + C$) como parte de la respuesta o la explicación final. Ese cálculo vive en el tópico `reglas`.

---

## Checklist del topic, verificar antes de dar por cerrado cada skill

**Transversal (los 3 skills):**
- [ ] `feedback_incorrect` completo en los 50 ítems: array del largo de `options`, `null` en el correcto, una oración por distractor en segunda persona amable
- [ ] Ninguna aplicación de fórmulas de integración directa (regla de la potencia, integrales de $e^x$, $\sin x$, $\ln x$, etc.)
- [ ] Ninguna mención de integral definida, área bajo la curva, TFC, sustitución o integración por partes como métodos aplicables acá
- [ ] Explicaciones en 3 párrafos de prosa; estructura conceptual; sin viñetas, sub-`-`, em-dash (prohibido estricto), humor
- [ ] `correct_index` variado
- [ ] Decimales con coma; sin nombres propios; variables inline en la prosa
- [ ] Constante de integración $C$ presente en todo resultado mostrado como primitiva

**LEXI:**
- [ ] 50 ítems; **exactamente 3 opciones** por ítem
- [ ] Distribución A/B respetada (25/25)
- [ ] Ningún cálculo; solo anatomía y relaciones conceptuales
- [ ] Sub-A con opciones que etiquetan los términos como texto exacto
- [ ] Sub-B con opciones tipo "$F' = f$" para auditar la relación con la derivada
- [ ] "La integral devuelve un área" y "las curvas se cruzan en el origen" presentes como distractores en al menos algunos ítems de sub-B

**FORM:**
- [ ] 50 ítems; **3 opciones por defecto**, **4 opciones** cuando la respuesta sea numérica corta que entre en grilla 2×2 (≤ 35 caracteres)
- [ ] Distribución A/B respetada (25/25)
- [ ] Sin cálculo final; solo forma armada aplicando linealidad
- [ ] Sub-A con opciones tipo `"4∫x²dx - 3∫sin x dx"` textuales
- [ ] Sub-B con opciones que incluyen una separación indebida (producto o cociente) y una opción "no se puede separar así"

**ESTR:**
- [ ] 50 ítems; **exactamente 3 opciones** por ítem
- [ ] Distribución A/B respetada (25/25)
- [ ] Sin cálculo final; solo elección del paso previo de acondicionamiento
- [ ] Sub-A con opciones tipo "Desarrollar el binomio y luego integrar" textuales; distractor mayoritario "integrar el interior y elevar al cuadrado" o "derivar el integrando"
- [ ] Sub-B con opciones que reescriben la expresión como potencia; distractor mayoritario "dejar sin reescribir" o "subir sin invertir el signo del exponente"
- [ ] Ninguna aplicación de la regla de la potencia para integrar en la respuesta o explicación
