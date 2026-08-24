# Topic: Valor absoluto

Belt: `white`, Unit: `aritmetica`, Topic: `absolute_value`

Skills en este topic: `FORM`, `RESL`. **Sin `LEXI`** (según `course.json`): no hay ítem de vocabulario/identificación puro en este topic, se arranca directo en decisión (`FORM`) y resolución (`RESL`).

Este topic tiene 2 ítems (uno por skill): `FORM`, `RESL`.

Concepto: el **valor absoluto** de un número —también llamado **módulo**, que es el nombre que usa el apunte de Álgebra del CBC— mide su distancia al cero en la recta numérica, sin importar el signo: $|a| = a$ si $a \geq 0$, y $|a| = -a$ si $a < 0$. **La lectura primaria es la de distancia, no la de casos**: $|x-a|$ es lo que separa a $x$ de $a$ sobre la recta, y de ahí salen las tres equivalencias sin memorizar ninguna. Sexto topic de la unidad, después de `Notación científica`: última parada puramente numérica antes de `Propiedades algebraicas`, que ya introduce manejo simbólico con paréntesis. Ningún ejercicio asume repaso de topics anteriores (regla crítica 31).

**Nota de referencia editorial**: mismo criterio de contextos que el resto de la unidad, registro "Paenza": físicos, concretos, cotidianos. El valor absoluto tiene una motivación de contexto natural: cualquier situación donde importa la magnitud de una diferencia pero no su dirección (una tolerancia de fabricación, un error de medición, una diferencia de temperatura o de altura respecto de un valor de referencia).

---

## FORM, 18 ejercicios

| Sub-familia | Cantidad | Slug | Objetivo pedagógico | Conceptos que toca |
|---|---:|---|---|---|
| Elegir la equivalencia correcta de una ecuación con valor absoluto, antes de resolverla | 5 | `elegir-equivalencia-ecuacion` | Decidir que $\lvert A \rvert = k$ (con $k>0$) se separa en dos ecuaciones sin barras, $A=k$ y $A=-k$ | Dos ramas de solución, distinguir de dejar una sola rama o de un planteo con desigualdad |
| Elegir la equivalencia correcta de una inecuación "menor que" con valor absoluto, antes de resolverla | 5 | `elegir-equivalencia-menor` | Decidir que $\lvert A \rvert < k$ (con $k>0$) equivale a la doble desigualdad $-k < A < k$ | Doble desigualdad como intersección, distinguir de un planteo con "o" |
| Elegir la equivalencia correcta de una inecuación "mayor que" con valor absoluto, antes de resolverla | 5 | `elegir-equivalencia-mayor` | Decidir que $\lvert A \rvert > k$ (con $k>0$) equivale a $A < -k$ **o** $A > k$, dos condiciones separadas, no una cadena única | Unión de dos regiones, distinguir de una doble desigualdad encadenada como en el caso "menor que" |
| **Con tabla** (`table`, modo `column`): la tabla registra la distancia de cada $x$ a un valor de referencia, y las opciones son expresiones candidatas | 3 | `patron-tabla-distancia` | Elegir qué expresión genera la columna, separando la distancia del desvío con signo | $|x-a|$ contra $x-a$ y $|x|-a$; la referencia puede ser negativa; un ítem pide el desvío **con** signo, y ahí el módulo sobra |
| **Total** | **18** | | | |

**`patron-tabla-distancia` es la sub-familia que instala la lectura geométrica del topic.** El resto del corpus lee el módulo como *"distancia al cero"* del interior abstracto $A$, que es la lectura algebraica; acá la columna derecha es literalmente **la distancia de $x$ a un valor de referencia**, que es la lectura del apunte del CBC y la que vuelve obvias las tres equivalencias.

**Los dos distractores son las dos formas de perder esa lectura**: soltar el módulo ($x-a$, que deja un signo donde no va) y aplicarlo solo a $x$ ($|x|-a$, que mide otra cosa). La fila trampa existe porque para $x$ a la derecha de la referencia las tres expresiones coinciden: recién con un $x$ del otro lado se separan.

**El tercer ítem invierte la consigna a propósito: pide el desvío *con* signo, y ahí la correcta es la resta sin módulo.** Con tres ítems, si el módulo fuera siempre la respuesta el estudiante aprendería a elegirlo sin leer el enunciado. La posición de la fila trampa también rota entre los tres.

**Cardinalidad**: estos tres van con **3 opciones**, no con las 4 del resto del topic, porque las condiciones anti-descarte de la regla 71 aprietan más cuanto más candidatos hay.

---

## RESL, 15 ejercicios

| Sub-familia | Cantidad | Slug | Objetivo pedagógico | Conceptos que toca |
|---|---:|---|---|---|
| Resolver una ecuación con valor absoluto hasta el conjunto solución final | 5 | `resl-ecuacion` | Calcular ambas soluciones de $\lvert A \rvert = k$, sin perder ninguna de las dos ramas | Dos ramas de ecuación, conjunto solución con dos elementos (salvo caso borde $k=0$) |
| Resolver una inecuación "menor que" con valor absoluto hasta el intervalo solución final | 5 | `resl-inecuacion-menor` | Calcular el intervalo acotado que resuelve $\lvert A \rvert < k$ | Doble desigualdad, intervalo acotado (un solo tramo) |
| Resolver una inecuación "mayor que" con valor absoluto hasta el conjunto solución final | 5 | `resl-inecuacion-mayor` | Calcular la unión de dos intervalos no acotados que resuelve $\lvert A \rvert > k$ | Unión de dos regiones separadas, notación de unión $\cup$ |
| **Total** | **15** | | | |

**Se probó una sub-familia con tabla en `RESL` (`ramas-desde-tabla`) y se dio de baja tras el primer testeo.** La tabla traía **las dos ramas ya planteadas** y el estudiante solo tenía que despejar: o sea que la tabla hacía justo la parte que el ítem debía evaluar. Es la contraindicación principal del formato —cuando la dificultad real es el planteo, la tabla lo regala— y no se había detectado al escribirla. **No reintroducirla sin resolver eso primero.**

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
- **Notación de conjunto solución**: ecuaciones con llaves ($\{5, -2\}$), inecuaciones "menor que" con intervalo ($(-2; 8)$), inecuaciones "mayor que" con unión de intervalos ($(-\infty; -2) \cup (8; \infty)$). **Los intervalos van con punto y coma, los conjuntos con coma.** Es la convención rioplatense verificada contra el CBC —$(9; +\infty)$, $[0; 2\pi]$— y existe porque la coma ya es el separador decimal. En un conjunto no hay ambigüedad posible, así que ahí se mantiene la coma.
- **La distancia se lee sobre $x$, no solo sobre el interior abstracto.** Decir "el valor absoluto mide la distancia al cero de $A$" es correcto pero es la lectura algebraica; la que hace click es la geométrica: $|x-60| < 4$ pide **los puntos que distan menos de 4 del 60**. Todo ítem cuyo interior tenga la forma $x-a$ abre su `explanation` con esa lectura antes de plantear la cadena.
- **"Módulo" es sinónimo admitido de "valor absoluto"** y conviene usarlo al menos una vez por skill: es el término del apunte de Álgebra del CBC, así que es el que el estudiante se va a encontrar en la cursada. No reemplaza a "valor absoluto", convive con él.
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
