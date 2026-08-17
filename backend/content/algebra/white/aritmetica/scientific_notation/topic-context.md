# Topic: Notación científica

Belt: `white`, Unit: `aritmetica`, Topic: `scientific_notation`

Skills en este topic: `FORM`, `RESL`. **Sin `LEXI`** (según `course.json`): no hay ítem de vocabulario/identificación puro en este topic, se arranca directo en decisión (`FORM`) y resolución (`RESL`).

Este topic tiene 2 ítems (uno por skill): `FORM`, `RESL`.

Concepto: la **notación científica** expresa cualquier número como el producto de un valor entre $1$ y $10$ por una potencia de $10$: $a \times 10^n$, con $1 \leq |a| < 10$. Quinto topic de la unidad, después de `Logaritmos`: el alumno ya conoce las propiedades de la potenciación (producto, cociente, exponente negativo), que son las que sostienen la multiplicación/división de números en notación científica, aunque cada ejercicio reintroduce sus propias reglas sin asumir ese repaso (regla crítica 31).

**Nota de referencia editorial**: mismo criterio de contextos que el resto de la unidad, registro "Paenza": físicos, concretos, cotidianos. La notación científica tiene una motivación de contexto particularmente natural (a diferencia de topics anteriores donde hubo que buscarla): existe específicamente para manejar cantidades extremadamente grandes o pequeñas sin escribir todos los ceros, así que `RESL` ancla en esos dos extremos — magnitudes astronómicas/de gran escala (distancias, población, dinero agregado) y magnitudes microscópicas (tamaños de células, bacterias, partículas, medidas de tiempo o longitud muy chicas).

---

## FORM, 15 ejercicios

| Sub-familia | Cantidad | Slug | Objetivo pedagógico | Conceptos que toca |
|---|---:|---|---|---|
| Elegir la expresión en notación científica correcta para un número dado | 5 | `elegir-expresion-correcta` | Decidir qué opción cumple $1 \leq \lvert a \rvert < 10$ y tiene el exponente correcto, entre varias que "casi" cumplen | Condición $1 \leq \lvert a \rvert < 10$, contar correctamente los lugares que se mueve la coma |
| Elegir qué corresponde hacer primero al multiplicar o dividir dos números en notación científica | 5 | `elegir-orden-operacion` | Decidir que coeficientes y exponentes se operan por separado (coeficientes entre sí, exponentes entre sí), no mezclados | Multiplicar/dividir coeficientes, sumar/restar exponentes, $10^a \cdot 10^b = 10^{a+b}$ |
| Elegir qué corresponde hacer cuando el resultado de operar dos números en notación científica queda con un coeficiente fuera del rango $[1, 10)$ | 5 | `elegir-reajuste-coeficiente` | Decidir cómo renormalizar un resultado intermedio (ej. coeficiente $12$ o $0{,}5$) de vuelta a la forma válida, ajustando el exponente en consecuencia | Renormalización tras operar, mover la coma en el coeficiente resultante y compensar el exponente |
| **Total** | **15** | | | |

---

## RESL, 15 ejercicios

| Sub-familia | Cantidad | Slug | Objetivo pedagógico | Conceptos que toca |
|---|---:|---|---|---|
| Convertir un número decimal (grande o chico) a notación científica hasta el resultado final | 5 | `resl-convertir-a-notacion` | Calcular la forma $a \times 10^n$ de un número dado en escritura decimal completa | Contar lugares que se mueve la coma, signo del exponente según el número sea grande o chico |
| Multiplicar o dividir dos números en notación científica hasta el resultado final, ya renormalizado | 5 | `resl-multiplicar-dividir` | Calcular el producto o cociente combinando coeficientes y exponentes, dejando el resultado en forma válida | Operar coeficientes y exponentes por separado, renormalizar si el coeficiente queda fuera de $[1,10)$ |
| Sumar o restar dos números en notación científica hasta el resultado final | 5 | `resl-sumar-restar` | Calcular la suma o resta igualando primero los exponentes de ambos números, y renormalizar si hace falta | Igualar exponentes antes de sumar/restar coeficientes (a diferencia de multiplicar/dividir, que no lo requiere), renormalización final |
| **Total** | **15** | | | |

**Cardinalidad**: preferencia editorial de esta unidad (igual que `Fracciones`/`Potenciación`/`Radicales`/`Logaritmos`), **4 opciones para prácticamente todo** (`FORM` y `RESL`), no el default de 3.

**Nota de orden (self-contained por diseño)**: `Notación científica` viene después de `Logaritmos`, pero ningún ejercicio asume ese repaso. `resl-multiplicar-dividir` reintroduce $10^a \cdot 10^b = 10^{a+b}$ desde cero en cada ítem (regla crítica 31).

---

## Contextos variados

**Registro Paenza, no jerga técnica de nicho** (ver nota editorial arriba y regla 43 de `authoring-context.md`). `FORM` puede quedar en abstracto por diseño (excepción intencional de la regla 43); `RESL` siempre en contexto concreto.

- **Cantidades astronómicas / de gran escala**: la distancia entre planetas o estrellas, la población de un país o del mundo, la cantidad de granos de arena de una playa, el dinero agregado de un país (PBI), la cantidad de bytes de almacenamiento de un centro de datos.
- **Cantidades microscópicas / muy chicas**: el tamaño de una célula o una bacteria, el diámetro de un cabello, el tiempo que tarda la luz en recorrer un metro, la masa de un grano de polvo, el grosor de una hoja de papel.
- **Multiplicar/dividir**: combinar dos cantidades de escalas muy distintas (ej. cuántas bacterias caben en un volumen dado, cuántas veces más grande es una distancia que otra).
- **Sumar/restar**: agregar dos cantidades de la misma naturaleza pero registradas con distinto exponente (ej. sumar el presupuesto de dos países, o dos mediciones de longitud a distinta escala).

Ningún experimento supera ~30% de los ítems de una misma sub-familia (misma regla que rige en el resto del curso).

---

## `feedback_incorrect`, confusiones típicas (las 2 skills)

| Concepto preguntado | Confusión a diagnosticar |
|---|---|
| Expresión en notación científica correcta | Dejar más de un dígito antes de la coma en el coeficiente, o contar mal los lugares que se mueve la coma (uno de más o de menos) |
| Signo del exponente | Usar exponente negativo para números grandes o positivo para números chicos (invertir el signo esperado) |
| Orden de operación en producto/cociente | Sumar los coeficientes en vez de multiplicarlos, o mezclar coeficientes con exponentes |
| Suma/resta | Sumar los coeficientes sin antes igualar los exponentes de ambos números |
| Renormalización | Dejar el resultado final con el coeficiente fuera de $[1,10)$ sin ajustar el exponente en consecuencia |

---

## Reglas específicas del topic

- **Coeficiente siempre en el rango $1 \leq \lvert a \rvert < 10$** en todo resultado final, salvo que el ejercicio pida explícitamente identificar un estado intermedio sin renormalizar.
- **`RESL` siempre en contexto concreto** (ver tabla de arriba); `FORM` puede quedar en abstracto por diseño (excepción intencional de la regla 43).
- **Cada ejercicio reintroduce la fórmula o regla que usa** (regla crítica 31): especialmente crítico en `resl-multiplicar-dividir` ($10^a \cdot 10^b = 10^{a+b}$) y en `resl-sumar-restar` (necesidad de igualar exponentes antes de operar, a diferencia del producto/cociente).
- **Decimales con coma** (`4{,}75`), notación rioplatense (ver `course-context.md`), nunca punto decimal.
- **Toda propiedad se justifica, nunca solo se declara y se aplica** (regla 44 reforzada, ver `authoring-context.md`): multiplicar/dividir en notación científica se apoya directamente en la propiedad de potenciación $10^a \cdot 10^b = 10^{a+b}$ (vista en `Potenciación`): agrupar los factores de $10$ de ambos números en un solo exponente. Sumar/restar requiere igualar exponentes primero porque solo así los coeficientes representan la misma "unidad" de potencia de $10$ y se pueden combinar directamente, igual que no se pueden sumar fracciones con distinto denominador sin igualarlo antes. `FORM` que elige un paso o una propiedad reintroduce esta razón en su `explanation`, no solo el resultado mecánico.

## Checklist del topic

- [ ] Todo enunciado lleva un bloque `$$...$$` entre la apertura y la pregunta, con la notación abstracta del objeto en los conceptuales; solo se exceptúan los ítems cuyo objeto ya está en las opciones o **es** la respuesta que se pide construir (regla 66)
- [ ] Ningún contexto exige conocimiento previo de una carrera puntual (registro Paenza, sin jerga de nicho)
- [ ] Todo coeficiente final cumple $1 \leq \lvert a \rvert < 10$, salvo que el ejercicio pida explícitamente un estado intermedio
- [ ] `resl-multiplicar-dividir` y `resl-sumar-restar` reintroducen su regla desde cero, sin asumir que el alumno la recuerda de otro ejercicio
- [ ] `tags` con el slug de la tabla, conteo por slug verificado contra el target
- [ ] Cardinalidad: 4 opciones en `FORM`/`RESL` (preferencia de esta unidad)
- [ ] Decimales con coma, nunca punto
- [ ] Ningún experimento supera ~30% de los ítems de su sub-familia
