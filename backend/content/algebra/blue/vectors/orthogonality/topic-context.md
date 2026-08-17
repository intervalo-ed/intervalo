# Topic: Ortogonalidad

Belt: `blue`, Unit: `vectors`, Topic: `orthogonality`

Skills en este topic: `LEXI`, `CLSF`, `RESL`. Mismo trío que ya tenía antes del rediseño de la unidad (ago-2026); acá el cambio es de contenido, no de skills: se recontextualizan los tres con situaciones concretas (el topic es el más visual de la unidad y hasta ahora era puro cálculo abstracto). **Sin `GRAF`**: se pospone para una ronda futura.

Este topic tiene 3 ítems (uno por skill): `LEXI`, `CLSF`, `RESL`.

Concepto: dos vectores son **ortogonales** (perpendiculares) si el ángulo entre ellos es de $90°$, lo cual se verifica analíticamente cuando su producto escalar es cero:
$$\vec{u}\cdot\vec{v} = 0$$
Quinto topic de la unidad, después de `definition`, `operations`, `norm` y `scalar`: el alumno ya conoce el producto escalar y puede construir directamente sobre él. Todavía no conoce `product` (regla crítica 31).

**Nota de referencia editorial**: registro "Paenza", contextos donde el ángulo recto tiene un significado concreto (rutas que se cruzan, direcciones de fuerzas que no se interfieren), evitando jerga de carrera puntual (regla 43).

---

## LEXI, 15 ejercicios

| Sub-familia | Cantidad | Slug | Objetivo pedagógico | Conceptos que toca |
|---|---:|---|---|---|
| Por qué un producto escalar nulo garantiza el ángulo recto | 5 | `por-que-condicion-cero` | Entender la recíproca, que es lo que convierte al producto escalar en un test: con las dos normas positivas, el único factor que puede anularse es el coseno | Recíproca de la condición, por qué hace falta que ninguno de los dos vectores sea nulo |
| Por qué los vectores de los ejes canónicos son ortogonales entre sí | 5 | `ortogonalidad-y-ejes` | Verificar con un caso ilustrativo simple que dos ejes perpendiculares dan producto escalar cero | Caso particular de la condición general, vectores de la base canónica |
| Por qué la ortogonalidad no depende de que los vectores tengan la misma norma | 5 | `ortogonalidad-no-implica-igual-norma` | Desligar la ortogonalidad (una propiedad angular) de la longitud de los vectores | La norma no interviene en el criterio de perpendicularidad, solo el ángulo |
| **Total** | **15** | | | |

## CLSF, 15 ejercicios

| Sub-familia | Cantidad | Slug | Objetivo pedagógico | Conceptos que toca |
|---|---:|---|---|---|
| Identificar cuál par de vectores, dados por sus componentes, es ortogonal | 5 | `identificar-par-ortogonal-numerico` | Calcular el producto escalar de varios pares y elegir el que da cero | Cálculo directo por componentes |
| Identificar en un contexto cuál dirección cruza en ángulo recto a una dirección dada | 5 | `identificar-par-ortogonal-contexto` | Aplicar el mismo criterio numérico dentro de una situación concreta | Interpretación de "cruzar en ángulo recto" como ortogonalidad |
| Reconocer que un producto escalar chico pero no nulo no es ortogonalidad | 5 | `identificar-no-ortogonal-cercano` | Reforzar que el criterio es exacto: cualquier valor distinto de cero, por chico que sea, descarta la ortogonalidad | Precisión del criterio, distinguir "cercano a cero" de "igual a cero" |
| **Total** | **15** | | | |

## RESL, 15 ejercicios

| Sub-familia | Cantidad | Slug | Objetivo pedagógico | Conceptos que toca |
|---|---:|---|---|---|
| Hallar un vector perpendicular a uno dado en $\mathbb{R}^2$ | 5 | `resl-hallar-perpendicular-2d` | Calcular un vector perpendicular intercambiando componentes e invirtiendo un signo, y verificarlo | Construcción de un perpendicular en el plano, verificación por producto escalar |
| Verificar mediante cálculo si un par de vectores dado es ortogonal | 5 | `resl-verificar-mediante-calculo` | Calcular el producto escalar de un par dado y concluir si son o no ortogonales | Cálculo directo, conclusión binaria a partir del resultado |
| Hallar el valor de un parámetro que hace ortogonales a dos vectores | 5 | `resl-hallar-parametro-para-ortogonalidad` | Plantear el producto escalar igualado a cero como ecuación y despejar la incógnita | Ecuación lineal con una incógnita, condición de ortogonalidad como restricción |
| **Total** | **15** | | | |

**Cardinalidad**: 3 opciones para `LEXI` y `CLSF` (conceptuales). 4 opciones para `RESL` (cálculo numérico, default de la guía de `authoring-context.md`).

---

## Contextos variados

**Registro Paenza, sin jerga de nicho** (regla 43): rutas o rumbos que se cruzan en ángulo recto, direcciones de fuerzas o desplazamientos que no se interfieren entre sí.

- **`identificar-par-ortogonal-contexto`**: la ruta de un dron y el rumbo de otro que la cruza en ángulo recto; dos calles que se cruzan perpendicularmente.
- **`resl-hallar-perpendicular-2d` / `resl-hallar-parametro-para-ortogonalidad`**: pueden quedar en un registro más abstracto/algebraico, ya que son ejercicios de construcción y despeje, no de aplicación directa a una situación.

Ningún experimento supera ~30% de los ítems de una misma sub-familia.

---

## `feedback_incorrect`, confusiones típicas (las 3 skills)

| Concepto preguntado | Confusión a diagnosticar |
|---|---|
| Condición de ortogonalidad | Pensar que depende de la norma de los vectores, o que aplica a cualquier par por definición |
| Ejes canónicos | Confundir ortogonalidad (ángulo) con tener la misma norma (longitud) |
| Precisión del criterio | Aceptar un producto escalar chico pero no nulo como si fuera cero |
| Identificar el par ortogonal | Elegir un par cuyo producto escalar no es cero por error de cálculo |
| Hallar un perpendicular en 2D | Intercambiar las componentes sin invertir ningún signo, lo que da el mismo vector rotado mal |
| Hallar un parámetro | Invertir el signo al despejar la incógnita de la ecuación |

---

## Reglas específicas del topic

- **Frontera con `scalar`** (regla 67): `scalar` ya explicó por qué dos vectores perpendiculares dan producto cero. Acá la pregunta es **la recíproca**, que es lo que convierte al producto escalar en un test: por qué un cero garantiza el ángulo recto, y por qué hace falta que ninguno de los dos vectores sea nulo. Ningún ítem de este topic puede limitarse a la dirección que `scalar` ya cubrió. En `RESL`, la respuesta es siempre binaria y los pares se eligen alrededor del cero; pedir el valor del producto es de `scalar`.
- **Coeficientes y constantes enteros chicos** (hasta 2 dígitos) para que el cálculo del producto escalar sea manejable a mano.
- **`CLSF` de la sub-familia `identificar-no-ortogonal-cercano` nunca usa un producto escalar igual a cero** entre las opciones incorrectas: el objetivo es reforzar que "chico" no es lo mismo que "cero".
- **Toda propiedad se justifica, nunca solo se declara y se aplica** (regla 44): la razón de que "producto escalar cero" equivalga a "ángulo recto" es que $\cos(90°)=0$, y ese cero anula el producto sin importar las normas.
- **Notación de vectores**: siempre con flecha superior (`\vec{v}`), según convención transversal del curso.

## Hallazgos de testing (ronda 1)

- **`RESL` (`resl-verificar-mediante-calculo`):** la explicación aplicaba la fórmula y llegaba a cero sin decir *por qué* eso implica perpendicularidad. Fix: se agregó un párrafo de intuición — cada término del producto mide cuánto se refuerzan los vectores en esa dirección, y que se cancelen exactamente significa que no queda ningún alineamiento neto entre ambos.
- **`LEXI` ("¿tienen que tener la misma norma?"):** la opción correcta decía "depende solo de la dirección relativa", y "relativa" sonaba a relleno sin anclar a qué. Fix: reescrita como "depende de que el ángulo entre ellos sea de $90°$, no de sus tamaños".

## Checklist del topic

- [ ] Todo enunciado lleva un bloque `$$...$$` entre la apertura y la pregunta, con la notación abstracta del objeto en los conceptuales; solo se exceptúan los ítems cuyo objeto ya está en las opciones o **es** la respuesta que se pide construir (regla 66)
- [ ] Ningún contexto exige conocimiento previo de una carrera puntual (registro Paenza)
- [ ] Toda constante entera, hasta 2 dígitos
- [ ] `CLSF` de `identificar-no-ortogonal-cercano` usa siempre un producto escalar chico pero distinto de cero
- [ ] Cada ítem de `LEXI` reintroduce la razón geométrica detrás de lo que pregunta (regla 44)
- [ ] `tags` con el slug de la tabla, conteo por slug verificado contra el target (5 por sub-familia)
- [ ] Cardinalidad: 3 opciones en `LEXI`/`CLSF`, 4 en `RESL`
- [ ] Ningún experimento supera ~30% de los ítems de su sub-familia
