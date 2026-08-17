# Topic: Valor absoluto

Belt: `white`, Unit: `aritmetica`, Topic: `absolute_value`

Skills en este topic: `FORM`, `RESL`. **Sin `LEXI`** (según `course.json`): no hay ítem de vocabulario/identificación puro en este topic, se arranca directo en decisión (`FORM`) y resolución (`RESL`).

Este topic tiene 2 ítems (uno por skill): `FORM`, `RESL`.

Concepto: el **valor absoluto** $|a|$ de un número mide su distancia al cero en la recta numérica, sin importar el signo: $|a| = a$ si $a \geq 0$, y $|a| = -a$ si $a < 0$. Sexto topic de la unidad, después de `Notación científica`: última parada puramente numérica antes de `Propiedades algebraicas`, que ya introduce manejo simbólico con paréntesis. Ningún ejercicio asume repaso de topics anteriores (regla crítica 31).

**Nota de referencia editorial**: mismo criterio de contextos que el resto de la unidad, registro "Paenza": físicos, concretos, cotidianos. El valor absoluto tiene una motivación de contexto natural: cualquier situación donde importa la magnitud de una diferencia pero no su dirección (una tolerancia de fabricación, un error de medición, una diferencia de temperatura o de altura respecto de un valor de referencia).

---

## FORM, 15 ejercicios

| Sub-familia | Cantidad | Slug | Objetivo pedagógico | Conceptos que toca |
|---|---:|---|---|---|
| Elegir la equivalencia correcta de una ecuación con valor absoluto, antes de resolverla | 5 | `elegir-equivalencia-ecuacion` | Decidir que $\lvert A \rvert = k$ (con $k>0$) se separa en dos ecuaciones sin barras, $A=k$ y $A=-k$ | Dos ramas de solución, distinguir de dejar una sola rama o de un planteo con desigualdad |
| Elegir la equivalencia correcta de una inecuación "menor que" con valor absoluto, antes de resolverla | 5 | `elegir-equivalencia-menor` | Decidir que $\lvert A \rvert < k$ (con $k>0$) equivale a la doble desigualdad $-k < A < k$ | Doble desigualdad como intersección, distinguir de un planteo con "o" |
| Elegir la equivalencia correcta de una inecuación "mayor que" con valor absoluto, antes de resolverla | 5 | `elegir-equivalencia-mayor` | Decidir que $\lvert A \rvert > k$ (con $k>0$) equivale a $A < -k$ **o** $A > k$, dos condiciones separadas, no una cadena única | Unión de dos regiones, distinguir de una doble desigualdad encadenada como en el caso "menor que" |
| **Total** | **15** | | | |

---

## RESL, 15 ejercicios

| Sub-familia | Cantidad | Slug | Objetivo pedagógico | Conceptos que toca |
|---|---:|---|---|---|
| Resolver una ecuación con valor absoluto hasta el conjunto solución final | 5 | `resl-ecuacion` | Calcular ambas soluciones de $\lvert A \rvert = k$, sin perder ninguna de las dos ramas | Dos ramas de ecuación, conjunto solución con dos elementos (salvo caso borde $k=0$) |
| Resolver una inecuación "menor que" con valor absoluto hasta el intervalo solución final | 5 | `resl-inecuacion-menor` | Calcular el intervalo acotado que resuelve $\lvert A \rvert < k$ | Doble desigualdad, intervalo acotado (un solo tramo) |
| Resolver una inecuación "mayor que" con valor absoluto hasta el conjunto solución final | 5 | `resl-inecuacion-mayor` | Calcular la unión de dos intervalos no acotados que resuelve $\lvert A \rvert > k$ | Unión de dos regiones separadas, notación de unión $\cup$ |
| **Total** | **15** | | | |

**Cardinalidad**: preferencia editorial de esta unidad (igual que el resto de `Aritmética`), **4 opciones para prácticamente todo** (`FORM` y `RESL`), no el default de 3.

**Nota de orden (self-contained por diseño)**: `Valor absoluto` viene después de `Notación científica`, pero ningún ejercicio asume ese repaso. Cada ejercicio reintroduce desde cero la equivalencia sin barras que necesita (regla crítica 31).

---

## Contextos variados

**Registro Paenza, no jerga técnica de nicho** (ver nota editorial arriba y regla 43 de `authoring-context.md`). `FORM` puede quedar en abstracto por diseño (excepción intencional de la regla 43); `RESL` siempre en contexto concreto.

- **Ecuación (`resl-ecuacion`)**: una pieza fabricada cuyo error de medida respecto de una medida nominal debe ser exactamente un valor dado (dos medidas posibles, una de más y una de menos); una diferencia de temperatura respecto de un valor de referencia que debe ser exactamente $k$ grados.
- **Inecuación "menor que" (`resl-inecuacion-menor`)**: una tolerancia de fabricación, donde una pieza es aceptable si su medida está a menos de $k$ unidades del valor nominal (rango acotado de valores aceptables); un control de calidad de temperatura, presión o peso dentro de una tolerancia.
- **Inecuación "mayor que" (`resl-inecuacion-mayor`)**: una pieza se descarta si su error respecto del valor nominal supera $k$ unidades (dos regiones separadas: mucho de más o mucho de menos); una alarma que se dispara si una medición se aleja demasiado de un valor esperado, en cualquiera de los dos sentidos.

Ningún experimento supera ~30% de los ítems de una misma sub-familia (misma regla que rige en el resto del curso).

---

## `feedback_incorrect`, confusiones típicas (las 2 skills)

| Concepto preguntado | Confusión a diagnosticar |
|---|---|
| Ecuación con valor absoluto | Plantear una sola rama (solo el caso positivo) y perder la segunda solución |
| Inecuación "menor que" | Plantear las dos condiciones con "o" en vez de una doble desigualdad encadenada |
| Inecuación "mayor que" | Plantear una doble desigualdad encadenada en vez de dos condiciones separadas con "o" (al revés del caso "menor que") |
| Signo en la segunda rama/condición | Aplicar mal el signo al plantear el caso negativo (ej. $A=-k$ mal despejado) |
| Confundir "menor que" con "mayor que" | Usar la forma de intersección (doble desigualdad) cuando corresponde unión, o viceversa |

---

## Reglas específicas del topic

- **Coeficientes y constantes enteros chicos** (hasta 2 dígitos) para que el despeje sea manejable a mano.
- **`RESL` siempre en contexto concreto** (ver tabla de arriba); `FORM` puede quedar en abstracto por diseño (excepción intencional de la regla 43).
- **Cada ejercicio reintroduce la equivalencia que usa** (regla crítica 31): $\lvert A \rvert = k \iff A=k \text{ o } A=-k$; $\lvert A \rvert < k \iff -k<A<k$; $\lvert A \rvert > k \iff A<-k \text{ o } A>k$.
- **Notación de conjunto solución**: ecuaciones con llaves ($\{5, -2\}$), inecuaciones "menor que" con intervalo ($(-2, 8)$), inecuaciones "mayor que" con unión de intervalos ($(-\infty,-2)\cup(8,\infty)$).
- **Toda propiedad se justifica, nunca solo se declara y se aplica** (regla 44 reforzada, ver `authoring-context.md`): la razón detrás de las tres equivalencias es que $\lvert a \rvert$ mide una distancia al cero, sin importar el signo. Un número y su opuesto están a la misma distancia del cero, por eso $\lvert A \rvert = k$ tiene dos soluciones. Estar a menos de $k$ de distancia del cero significa estar entre $-k$ y $k$ (intersección, un solo tramo); estar a más de $k$ de distancia significa quedar afuera de ese rango por cualquiera de los dos lados (unión, dos tramos separados). `FORM` que elige una equivalencia reintroduce esta razón geométrica en su `explanation`, no solo la regla mecánica.

## Checklist del topic

- [ ] Todo enunciado lleva un bloque `$$...$$` entre la apertura y la pregunta, con la notación abstracta del objeto en los conceptuales; solo se exceptúan los ítems cuyo objeto ya está en las opciones o **es** la respuesta que se pide construir (regla 66)
- [ ] Ningún contexto exige conocimiento previo de una carrera puntual (registro Paenza, sin jerga de nicho)
- [ ] Toda constante entera, hasta 2 dígitos
- [ ] Notación de conjunto solución correcta según el tipo (llaves, intervalo, unión de intervalos)
- [ ] Cada ejercicio reintroduce su equivalencia desde cero, sin asumir que el alumno la recuerda de otro ejercicio
- [ ] `tags` con el slug de la tabla, conteo por slug verificado contra el target
- [ ] Cardinalidad: 4 opciones en `FORM`/`RESL` (preferencia de esta unidad)
- [ ] Ningún experimento supera ~30% de los ítems de su sub-familia
