# Topic: Radicales

Belt: `white`, Unit: `aritmetica`, Topic: `radicals`

Skills en este topic: `LEXI`, `FORM`, `RESL`.

Este topic tiene 3 ítems (uno por skill): `LEXI`, `FORM`, `RESL`.

Concepto: la **raíz enésima** $\sqrt[n]{a}$ es la operación inversa de elevar a la potencia $n$: $\sqrt[n]{a} = a^{1/n}$. Tercer topic de la unidad, después de `Potenciación`: el alumno ya conoce las propiedades de la potencia (producto, cociente, potencia de potencia, exponente negativo), y este topic las apoya para simplificar radicales y racionalizar denominadores, aunque cada ejercicio reintroduce sus propias reglas sin asumir ese repaso (regla crítica 31).

**Nota de referencia editorial**: mismo criterio de contextos que `Fracciones` y `Potenciación` (ver sus `topic-context.md`), registro "Paenza": físicos, concretos, cotidianos. Este topic ancla sus contextos `RESL` en mediciones de terrenos y materiales (lado de un terreno cuadrado a partir de su área, comparar el lado de dos terrenos, longitud de alambre para cercar), un escenario geométrico simple y tangible sin necesitar conocimiento previo de ninguna carrera puntual.

---

## LEXI, 15 ejercicios

| Sub-familia | Cantidad | Slug | Objetivo pedagógico | Conceptos que toca |
|---|---:|---|---|---|
| Identificar índice y radicando en una expresión radical | 5 | `identificar-indice-radicando` | Reconocer qué rol cumple cada número en $\sqrt[n]{a}$ | Vocabulario índice/radicando, distinguir de un coeficiente que multiplica desde afuera |
| Reconocer para qué índice una raíz de un radicando negativo no tiene solución real | 5 | `reconocer-raiz-no-definida` | Identificar que el índice par de un radicando negativo no tiene raíz real, mientras que el índice impar sí | Potencia par siempre no negativa, potencia impar puede ser negativa |
| Reconocer si un radical ya está simplificado | 5 | `reconocer-radical-simplificado` | Identificar si el radicando tiene o no un factor que sea una potencia perfecta del índice | Factorización, cuadrado/cubo perfecto, noción de "radical simplificado" |
| **Total** | **15** | | | |

---

## FORM, 15 ejercicios

| Sub-familia | Cantidad | Slug | Objetivo pedagógico | Conceptos que toca |
|---|---:|---|---|---|
| Elegir el factor racionalizante correcto para eliminar una raíz del denominador | 5 | `elegir-factor-racionalizante` | Decidir con qué forma de $1$ multiplicar una fracción para eliminar el radical del denominador | Factor racionalizante, $(\sqrt{a})^2 = a$ |
| Elegir qué factor cuadrado (o cúbico) perfecto extraer primero al simplificar un radical | 5 | `elegir-factor-a-extraer` | Decidir cuál es el mayor factor de potencia perfecta que conviene extraer, entre varias opciones válidas pero no óptimas | Descomposición en factores, elegir el factor máximo en vez de cualquier factor válido |
| Elegir qué corresponde hacer antes de sumar o restar dos radicales | 5 | `elegir-condicion-radicales-semejantes` | Decidir que hay que simplificar cada radical primero para verificar si son semejantes, antes de intentar combinarlos | Radicales semejantes (mismo índice y radicando), simplificar antes de operar |
| **Total** | **15** | | | |

---

## RESL, 15 ejercicios

| Sub-familia | Cantidad | Slug | Objetivo pedagógico | Conceptos que toca |
|---|---:|---|---|---|
| Simplificar un radical extrayendo el mayor factor de potencia perfecta | 5 | `resl-simplificar-radical` | Calcular la forma simplificada de un radical hasta el resultado final | Descomposición en factores, extracción del mayor cuadrado/cubo perfecto |
| Racionalizar una fracción con un radical en el denominador hasta el resultado final | 5 | `resl-racionalizar` | Calcular el resultado racionalizado de una fracción con raíz en el denominador | Factor racionalizante, $(\sqrt{a})^2 = a$ |
| Sumar o restar radicales semejantes hasta el resultado final | 5 | `resl-combinar-radicales-semejantes` | Simplificar cada radical y combinar los que resulten semejantes | Radicales semejantes, simplificación previa a la suma/resta |
| **Total** | **15** | | | |

**Cardinalidad**: preferencia editorial de esta unidad (igual que `Fracciones` y `Potenciación`), **4 opciones para prácticamente todo** (`LEXI`, `FORM` y `RESL`), no el default de 3 para conceptual/textual del resto del curso.

**Nota de orden (self-contained por diseño)**: `Radicales` viene después de `Potenciación`, y su tooltip conecta ambos ($\sqrt[n]{a} = a^{1/n}$), pero ningún ejercicio asume que el alumno recuerda esa equivalencia ni las propiedades de potencia de otro ítem: cada ejercicio reintroduce lo que necesita desde cero (regla crítica 31).

---

## Contextos variados

**Registro Paenza, no jerga técnica de nicho** (ver nota editorial arriba y regla 43 de `authoring-context.md`). `LEXI` y `FORM` pueden quedar en abstracto por diseño (excepción intencional de la regla 43); `RESL` siempre en contexto concreto.

- **Simplificar un radical**: el lado de un terreno cuadrado a partir de su área (ej. área $72$ m², lado $\sqrt{72}=6\sqrt{2}$ m), la diagonal aproximada de un patio o de una habitación rectangular.
- **Racionalizar**: comparar el lado de dos terrenos cuadrados de distinta área expresando la razón entre ambos sin raíz en el denominador, expresar una escala de mapa sin dejar una raíz en el denominador.
- **Combinar radicales semejantes**: sumar dos tramos de alambre, cerco o cinta métrica cuyas longitudes son raíces distintas que, simplificadas, resultan semejantes; combinar dos cortes de un mismo material.

Ningún experimento supera ~30% de los ítems de una misma sub-familia (misma regla que rige en el resto del curso).

**Nota de diversidad de contextos (feedback editorial, ronda de ejercicios modelo)**: los 3 ejercicios modelo de `RESL` de esta ronda quedaron todos anclados en mediciones de terreno/materiales de obra. Es un ancla válida y concreta, pero al escalar a los 15 ejercicios por skill del target completo, variar hacia otros escenarios físicos ya usados en la unidad (repartos, recetas, señales que se atenúan, cortes de tela o cinta, escalas de mapas o maquetas) para no leerse repetitivo dentro de una misma sesión. No forzar un contexto donde no encaje naturalmente (`LEXI`/`FORM` siguen habilitados para quedar en abstracto por la excepción de la regla 43), pero mantener la intención de variedad en `RESL`.

---

## `feedback_incorrect`, confusiones típicas (las 3 skills)

| Concepto preguntado | Confusión a diagnosticar |
|---|---|
| Índice y radicando | Asumir siempre raíz cuadrada sin fijarse en la muesca del índice |
| Raíz de radicando negativo | Pensar que ninguna raíz de un número negativo tiene solución real, ignorando el caso de índice impar |
| Radical simplificado | No reconocer un cuadrado/cubo perfecto escondido dentro del radicando |
| Factor racionalizante | Multiplicar por un factor que no coincide con el radical del denominador, o multiplicar solo el denominador y no el numerador |
| Factor a extraer | Usar un cuadrado perfecto válido pero no el mayor, dejando el radical parcialmente simplificado |
| Radicales semejantes | Sumar los radicandos directamente ($\sqrt{a}+\sqrt{b} \ne \sqrt{a+b}$) sin simplificar ni verificar que sean semejantes |

---

## Reglas específicas del topic

- **Radicandos enteros positivos chicos** (hasta 3 dígitos) para que la factorización sea manejable a mano; índice $2$ o $3$ salvo en `LEXI`/`FORM` donde un índice mayor puede aparecer para ilustrar el concepto general.
- **`RESL` siempre en contexto concreto** (ver tabla de arriba); `LEXI` y `FORM` pueden quedar en abstracto por diseño (excepción intencional de la regla 43).
- **Cada ejercicio reintroduce la fórmula o regla que usa** (regla crítica 31): especialmente crítico en `resl-racionalizar` ($(\sqrt{a})^2=a$) y en la definición de radicales semejantes.
- **Todo resultado final de `RESL` queda completamente simplificado**, salvo que el ejercicio pida explícitamente identificar un estado intermedio.
- **Notación horizontal en prosa (regla 20 extendida)**: cualquier fracción que resulte de racionalizar y se mencione al pasar en `question`, `feedback_*` o `explanation` usa barra `x/y` para el radical suelto (ej. $\sqrt{3}/\sqrt{3}$), nunca apilada fuera de un bloque `$$...$$` aislado o de `options`.
- **Toda propiedad de radicales se justifica, nunca solo se declara y se aplica** (regla 44 reforzada, ver `authoring-context.md`): racionalizar se apoya en que elevar al cuadrado deshace la raíz cuadrada (operaciones inversas), extraer un factor se apoya en $\sqrt{a\cdot b}=\sqrt{a}\cdot\sqrt{b}$, y combinar radicales semejantes es la misma idea que sumar términos semejantes en álgebra ($2x+3x=(2+3)x$). `LEXI`/`FORM` que nombran o eligen una propiedad reintroducen esta razón en su `explanation`, no solo el resultado mecánico.

## Checklist del topic

- [ ] Todo enunciado lleva un bloque `$$...$$` entre la apertura y la pregunta, con la notación abstracta del objeto en los conceptuales; solo se exceptúan los ítems cuyo objeto ya está en las opciones o **es** la respuesta que se pide construir (regla 66)
- [ ] Ningún contexto exige conocimiento previo de una carrera puntual (registro Paenza, sin jerga de nicho)
- [ ] Todo radicando entero positivo, hasta 3 dígitos; índice $2$ o $3$ en `RESL`
- [ ] Todo resultado final de `RESL` está completamente simplificado
- [ ] `resl-racionalizar` reintroduce $(\sqrt{a})^2=a$ desde cero, sin asumir que el alumno la recuerda de otro ejercicio
- [ ] `tags` con el slug de la tabla, conteo por slug verificado contra el target
- [ ] Cardinalidad: 4 opciones en `LEXI`/`FORM`/`RESL` (preferencia de esta unidad)
- [ ] Fracciones/radicales sueltos en prosa (`question`/`feedback_*`/`explanation`) van en barra, nunca apilados fuera de un bloque `$$...$$`
- [ ] Ningún experimento supera ~30% de los ítems de su sub-familia
