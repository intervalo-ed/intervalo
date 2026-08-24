# Topic: Potenciación

Belt: `white`, Unit: `aritmetica`, Topic: `powers`

Skills en este topic: `LEXI`, `FORM`, `RESL`.

Este topic tiene 3 ítems (uno por skill): `LEXI`, `FORM`, `RESL`.

Concepto: la **potenciación** $a^n$ representa la multiplicación repetida de una base $a$ por sí misma $n$ veces, y sus propiedades (producto y cociente de potencias de igual base, potencia de potencia, exponente negativo) permiten operar exponentes sin desarrollar la multiplicación completa. Segundo topic de la unidad, después de `Fracciones`: el alumno ya sabe operar con fracciones (incluida la potencia de una fracción con exponente negativo, vista ahí de forma autocontenida), pero este topic no asume ese repaso, cada ejercicio reintroduce sus propias reglas desde cero (regla crítica 31).

**Nota de referencia editorial**: mismo criterio de contextos que `Fracciones` (ver su `topic-context.md`), registro "Paenza": físicos, concretos, cotidianos, entendibles sin formación previa de una carrera puntual. **Corrección de calibración aplicada tras feedback editorial**: el ejemplo clásico del tablero de ajedrez y los granos de arroz (leyenda que Adrián Paenza cuenta en *Matemática... ¿estás ahí?*) se descartó como ancla porque el tablero como escenario resultó forzado para plantear repartos; se prefieren en su lugar repartos directos de cantidades cotidianas (bolsas, cajas) y bloques de crecimiento repetidos (tandas, ciclos), variando el escenario entre ejercicios para no repetir siempre el mismo experimento (regla 43).

---

## LEXI, 15 ejercicios

| Sub-familia | Cantidad | Slug | Objetivo pedagógico | Conceptos que toca |
|---|---:|---|---|---|
| Identificar base y exponente en una expresión potencial | 5 | `identificar-base-exponente` | Reconocer qué rol cumple cada número en $a^n$ | Vocabulario base/exponente, distinguir de un coeficiente que multiplica desde afuera |
| Reconocer la forma equivalente de una potencia con exponente negativo | 5 | `reconocer-exponente-negativo-equivalente` | Identificar que $a^{-n}$ y $\dfrac{1}{a^n}$ son la misma cantidad | $a^{-n} = \dfrac{1}{a^n}$, distinguir de invertir solo el signo del resultado |
| Razonar por qué es válido un paso ya resuelto, no solo nombrar la propiedad | 5 | `reconocer-propiedad-de-potencias` | Dado un paso como $a^5 \cdot a^2 = a^7$, elegir la justificación intuitiva correcta (contar factores de la base repetidos), no el nombre de la propiedad | El exponente cuenta repeticiones de la base; distractores que son justificaciones plausibles pero falsas (multiplicar exponentes, un promedio, una coincidencia numérica puntual), no nombres de otras propiedades |
| **Total** | **15** | | | |

---

## FORM, 21 ejercicios

| Sub-familia | Cantidad | Slug | Objetivo pedagógico | Conceptos que toca |
|---|---:|---|---|---|
| Elegir qué propiedad corresponde aplicar primero en una expresión combinada | 5 | `elegir-propiedad-de-potencias-primero` | Decidir con qué parte de una expresión con varias potencias de igual base conviene empezar | Jerarquía de resolución cuando hay producto y cociente combinados en la misma expresión |
| Elegir cómo reescribir una potencia con exponente negativo antes de seguir operando | 5 | `elegir-reescritura-exponente-negativo` | Decidir la reescritura correcta ($a^{-n} \to \dfrac{1}{a^n}$) frente a reescrituras plausibles pero erróneas | $a^{-n} = \dfrac{1}{a^n}$, distinguir de invertir solo el exponente o solo la base |
| Elegir el orden de resolución en una potencia de potencia anidada dentro de un producto o cociente | 5 | `elegir-orden-potencia-de-potencia` | Decidir si conviene resolver primero la potencia interna o aplicar la propiedad $(a^m)^n = a^{m \cdot n}$ directamente | $(a^m)^n = a^{m \cdot n}$, jerarquía de resolución interna cuando hay una potencia dentro de otra |
| **Con tabla** (`table`, modo `column`): la tabla registra una magnitud que crece, y las opciones son expresiones candidatas para la fila simbólica | 4 | `patron-tabla-crecimiento` | Elegir qué expresión genera la columna, distinguiendo crecimiento exponencial de lineal y de cuadrático | $2^{n}$ contra $2n$, $n^{2}$ y $n+2$; el exponente cuenta repeticiones del factor, no del sumando |
| **Con tabla** (`table`, modo `column`): la magnitud decrece, y las opciones compiten entre caída exponencial y caída por reparto | 2 | `patron-tabla-decaimiento` | Elegir la expresión que genera una columna decreciente, separando $2^{-n}$ de $1/(2n)$ | $a^{-n} = 1/a^{n}$ como "dividir $n$ veces", contra dividir una sola vez entre $n$ partes |
| **Total** | **21** | | | |

### Las dos sub-familias con tabla: tres excepciones y una regla propia

**Excepción 1, cardinalidad: van con 3 opciones, no con 4.** El resto de la unidad usa 4 por preferencia editorial, pero acá aprietan las condiciones anti-descarte de la regla 71 (A1, A2, A3): con cuatro candidatos es mucho más difícil que todos coincidan en la fila trampa y que cada uno siga siendo un error real. Es el mismo criterio que rige en `probabilidad/white/conteo/reglas`.

**Excepción 2, contexto: estos ítems de `FORM` NO son abstractos.** Los otros 15 arrancan con `Se quiere simplificar…` / `Se quiere resolver…`, amparados en la excepción intencional a la regla 43 que este topic declara. Una tabla de patrón necesita una magnitud concreta en el encabezado, así que estos seis rompen esa convención a propósito.

**Excepción 3, regla 66: no llevan bloque `$$...$$` en el enunciado.** Cae bajo la excepción que la propia regla contempla: el objeto matemático **es** la respuesta que se pide construir, y ya está en las opciones.

**Regla propia de la sub-familia, y es la que más cuesta sostener: la respuesta correcta rota de tipo, y la fila trampa cambia de posición.** Con un solo ítem no importa; con cuatro, si la correcta fuera siempre la exponencial el estudiante aprende una meta-estrategia —*elegí la que crece más rápido*— que funciona sin entender nada y que después exporta al resto del banco. Por eso los cuatro de `patron-tabla-crecimiento` rotan la correcta entre $2^{n}$, $n^{2}$, $2n$ y $n+2$, y en dos de ellos **la exponencial es distractora**. Lo mismo en `patron-tabla-decaimiento`: uno tiene $2^{-n}$ como correcta y el otro la tiene como distractora.

El mismo razonamiento aplica a la **posición** de la fila trampa: si siempre fuera la primera, la meta-estrategia pasaría a ser *ignorá la primera fila*. Está repartida entre la posición 0 y la 1. Ninguna de las dos cosas la ve el validador (A1 no es automatizable), así que se chequean leyendo la sub-familia entera de corrido.

**Todas las filas de datos van completas; la única celda vacía es la simbólica.** Se corrigió así tras el primer testeo real: los seis ítems se habían escrito con una fila numérica vacía además de la simbólica, y confundía —no se entendía si también había que completarla—. El problema de fondo era peor: con solo dos filas dadas la regla se puede *verificar* pero no *generar*, así que el estudiante terminaba probando opciones, que es la inducción ingenua que el formato existe para combatir. Ver la sección Tablas de `authoring-context.md`.

**Las entradas siguen siendo irregulares en el ítem exponencial, y no es un capricho.** Con $2, 3, 4$ la fila del $4$ da $16$ tanto para $2^{n}$ como para $n^{2}$, así que una sola fila discrimina las tres opciones; con $2, 3, 5$ discriminan dos, y además la del $5$ es la que hace visible la explosión ($32$ contra $10$), que es el argumento pedagógico central del formato. En los ítems lineales y cuadrático, en cambio, las entradas $1, 2, 3$ alcanzan y se leen mejor.

**La familia numérica que hace posible la fila trampa** es $\{2n,\ n+2,\ n^{2},\ 2^{n}\}$, que **vale $4$ en $n=2$ las cuatro** (regla 71). Todo ítem nuevo de `patron-tabla-crecimiento` sale de elegir la correcta de ese conjunto y dos distractoras del resto. En `patron-tabla-decaimiento` el punto de cruce es $n=1$, donde $2^{-n}$, $1/(2n)$ y $n/2$ valen todas $1/2$.

---

## RESL, 19 ejercicios

| Sub-familia | Cantidad | Slug | Objetivo pedagógico | Conceptos que toca |
|---|---:|---|---|---|
| Resolver una cadena de producto y cociente de potencias de igual base hasta el resultado final | 5 | `resl-cadena-igual-base` | Calcular el exponente final combinando sumas y restas de exponentes en una sola expresión | $a^m \cdot a^n = a^{m+n}$, $\dfrac{a^m}{a^n} = a^{m-n}$, combinados en una cadena |
| Resolver una expresión con exponente negativo hasta el resultado numérico final | 5 | `resl-exponente-negativo` | Calcular el valor final de una potencia con exponente negativo, incluido dentro de una expresión más larga | $a^{-n} = \dfrac{1}{a^n}$, reintroducida en cada ejercicio que la usa (regla crítica 31) |
| Resolver una potencia de potencia hasta el resultado final | 5 | `resl-potencia-de-potencia` | Calcular $(a^m)^n$ multiplicando los exponentes, sin desarrollar cada potencia por separado | $(a^m)^n = a^{m \cdot n}$, reintroducida en cada ejercicio que la usa |
| **Con tabla** (`table`, modo `cell`): la tabla desglosa por cuánto multiplica o divide cada paso de la cadena y deja vacía la fila del resultado | 4 | `cadena-desde-tabla` | Calcular el exponente final leyendo el desglose, sin que la cadena viva en la prosa | Suma y resta de exponentes de igual base, exponente negativo y potencia de potencia, según el ítem |
| **Total** | **19** | | | |

**Cardinalidad**: preferencia editorial de esta unidad (igual que `Fracciones`), **4 opciones para prácticamente todo** (`LEXI`, `FORM` y `RESL`), no el default de 3 para conceptual/textual del resto del curso. Cuando las 4 opciones son potencias numéricas cortas entre sí, usar formato de barra/exponente simple (`$2^{-1}$`, `$1/8$`) sin apilar, ancho ≤12 en grilla 2×2; cuando son textos/propiedades (`FORM`) no aplica la restricción de ancho, van como lista.

**Nota de orden (self-contained por diseño)**: `Potenciación` viene después de `Fracciones`, pero ningún ejercicio asume ese repaso. La sub-familia `resl-exponente-negativo` reintroduce $a^{-n} = \dfrac{1}{a^n}$ desde cero en cada ítem (regla crítica 31), igual que `elegir-reescritura-exponente-negativo` y `reconocer-exponente-negativo-equivalente`.

---

## Contextos variados

**Registro Paenza, no jerga técnica de nicho** (ver nota editorial arriba y regla 43 de `authoring-context.md`). `LEXI` y `FORM` pueden quedar en abstracto por diseño (excepción intencional de la regla 43); `RESL` siempre en contexto concreto.

- **Reparto sucesivo de una cantidad**: un depósito con una cantidad de bolsas de arroz (o cajas, o litros) que se reparte en partes iguales entre varios grupos, y lo que le toca a cada grupo se vuelve a repartir en partes iguales entre subgrupos más chicos; combina un producto de potencias de igual base en el denominador con un cociente.
- **Crecimiento por duplicación**: una población de bacterias en un cultivo que se duplica cada cierto tiempo, un rumor o una cadena de mensajes que se reenvía y duplica sus destinatarios en cada ronda ("tanda") de reenvíos, el grosor de una hoja de papel que se duplica en cada doblez.
- **Exponente negativo, ir hacia atrás en el tiempo**: conocer la población actual de un cultivo que se duplica cada hora y preguntar cuántos había hace $n$ horas; una señal de radio o de red que pierde la mitad de su intensidad cada cierta distancia recorrida y preguntar la intensidad original a partir de la medida actual.
- **Potencia de potencia, repetición de un mismo bloque de crecimiento**: un rumor cuyo alcance se multiplica por un factor fijo en cada tanda de reenvíos, y esa tanda se repite varias veces seguidas; una población que se multiplica por un factor fijo en cada ciclo, repetido durante varios ciclos. Preferir bloques de crecimiento repetidos (tandas, ciclos, rondas) por sobre escalados geométricos (lado/área/volumen), que resultaron menos intuitivos en la práctica.
- **Cociente de potencias, repartos sucesivos**: repartir una cantidad en partes iguales entre varios grupos, y lo que le toca a cada grupo repartirlo de nuevo entre subgrupos más chicos; comparar la intensidad de dos señales medidas a distinta distancia.

Ningún experimento supera ~30% de los ítems de una misma sub-familia (misma regla que rige en el resto del curso).

---

## `feedback_incorrect`, confusiones típicas (las 3 skills)

| Concepto preguntado | Confusión a diagnosticar |
|---|---|
| Base y exponente | Invertir los roles, pensar que el exponente es el número que se repite |
| Exponente negativo | Aplicar el signo negativo al resultado en vez de invertir la base; o invertir solo el exponente sin invertir la base |
| Producto de potencias de igual base | Multiplicar los exponentes en vez de sumarlos |
| Cociente de potencias de igual base | Sumar los exponentes en vez de restarlos, o restar en el orden inverso |
| Potencia de potencia | Sumar los exponentes en vez de multiplicarlos |
| Propiedad aplicada en un paso dado | Confundir producto de potencias de igual base con potencia de potencia cuando ambos "combinan" exponentes de alguna forma |
| Orden de resolución en expresión combinada | Aplicar el cociente antes de simplificar un producto que aparece en el numerador o denominador |

---

## Reglas específicas del topic

- **Bases enteras chicas** (2 a 5 en valor absoluto) y **exponentes chicos** (hasta 5, o hasta $-4$ en el caso negativo) para que el cálculo sea manejable a mano y de cabeza.
- **Todo resultado final queda como una única potencia** (o su valor numérico cuando el ejercicio lo pide explícitamente), nunca una expresión sin simplificar con varias potencias sueltas.
- **`RESL` siempre en contexto concreto** (ver tabla de arriba); `LEXI` y `FORM` pueden quedar en abstracto por diseño (excepción intencional de la regla 43).
- **Cada ejercicio reintroduce la fórmula o regla que usa** (regla crítica 31): especialmente crítico en `resl-exponente-negativo`, `elegir-reescritura-exponente-negativo` y `resl-potencia-de-potencia` por la nota de orden de arriba.
- **Resultados con exponente negativo**: cuando el ejercicio pide el resultado final como potencia (no como número), dejarlo como potencia negativa (ej. $2^{-1}$) es válido salvo que la sub-familia pida explícitamente convertir a fracción.
- **Notación horizontal en prosa (regla 20 extendida)**: cualquier fracción que resulte de aplicar $a^{-n} = \dfrac{1}{a^n}$ y se mencione al pasar en `question`, `feedback_*` o `explanation` usa barra `x/y`, nunca `\dfrac{x}{y}` apilada. `\dfrac` se reserva para bloques `$$...$$` aislados y para `options` cuando el set completo son fracciones cortas entre sí.
- **Toda propiedad de la potenciación se justifica contando factores de la base repetidos, nunca solo se declara y se aplica** (regla 44 reforzada, ver `authoring-context.md`): producto de potencias de igual base = juntar factores de ambas ($5+2=7$ factores), potencia de potencia = repetir un grupo de factores varias veces ($(a^2)^3$ = 3 grupos de 2 factores), exponente negativo = el recíproco que hace que $a^n\cdot a^{-n}=1$. `LEXI`/`FORM` que nombran o eligen una propiedad reintroducen esta cuenta de factores en su `explanation`, no solo el resultado mecánico.

## Checklist del topic

- [ ] Todo enunciado lleva un bloque `$$...$$` entre la apertura y la pregunta, con la notación abstracta del objeto en los conceptuales; solo se exceptúan los ítems cuyo objeto ya está en las opciones o **es** la respuesta que se pide construir (regla 66)
- [ ] Ningún contexto exige conocimiento previo de una carrera puntual (registro Paenza, sin jerga de nicho)
- [ ] Toda base entera, valor absoluto entre 2 y 5; todo exponente entre $-4$ y $5$
- [ ] Todo resultado final queda como una única potencia o su valor numérico, según lo que pida el ejercicio
- [ ] `resl-exponente-negativo`, `elegir-reescritura-exponente-negativo` y `resl-potencia-de-potencia` reintroducen su regla desde cero, sin asumir que el alumno la recuerda de otro ejercicio
- [ ] `tags` con el slug de la tabla, conteo por slug verificado contra el target
- [ ] Cardinalidad: 4 opciones en `LEXI`/`FORM`/`RESL` (preferencia de esta unidad); opciones numéricas ≤12 de ancho en grilla 2×2
- [ ] Fracciones simples en prosa (`question`/`feedback_*`/`explanation`) van en barra `x/y`, nunca `\dfrac` apilada fuera de un bloque `$$...$$`
- [ ] Ningún experimento supera ~30% de los ítems de su sub-familia
