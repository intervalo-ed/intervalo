# Topic: Norma

Belt: `blue`, Unit: `vectors`, Topic: `norm`

Skills en este topic: `LEXI`, `RESL`. **Sin `GRAF`**: el componente de dibujo de vectores todavía no existe en el frontend, se pospone para una ronda futura (se descartó también el ítem de comparar longitudes a simple vista sobre un dibujo, por la misma razón).

Este topic tiene 2 ítems (uno por skill): `LEXI`, `RESL`.

Concepto: la **norma** (o módulo) de un vector, $\|\vec{v}\|$, mide su longitud: la distancia entre el origen y el punto que marca el vector.
$$\|\vec{v}\| = \sqrt{v_1^2 + v_2^2 + \dots + v_n^2}$$
Tercer topic de la unidad, después de `definition` y `operations`: el alumno ya sabe qué es un vector y cómo sumarlo/escalarlo, pero todavía no conoce `scalar`, `orthogonality` ni `product` (regla crítica 31).

**Nota de referencia editorial**: registro "Paenza", contextos físicos y cotidianos donde importa la magnitud de un desplazamiento (distancia recorrida, distancia entre dos puntos), evitando jerga de carrera puntual (regla 43).

---

## LEXI, 15 ejercicios

| Sub-familia | Cantidad | Slug | Objetivo pedagógico | Conceptos que toca |
|---|---:|---|---|---|
| Por qué la norma nunca es negativa | 5 | `por-que-norma-no-negativa` | Entender que la norma es una raíz cuadrada de una suma de cuadrados, y por eso nunca da negativo | Suma de cuadrados no negativa, raíz cuadrada de un número no negativo |
| Por qué el único vector con norma cero es el vector nulo | 5 | `unico-vector-norma-cero` | Entender que una suma de cuadrados solo da cero si cada término es cero | Suma de términos no negativos, condición para que dé cero |
| Qué distancia mide la norma | 5 | `norma-como-distancia` | Entender que la norma es la distancia entre el origen y el punto que marca el vector | Interpretación geométrica de la norma como longitud de una flecha desde el origen |
| **Total** | **15** | | | |

## RESL, 15 ejercicios

| Sub-familia | Cantidad | Slug | Objetivo pedagógico | Conceptos que toca |
|---|---:|---|---|---|
| Calcular la norma de un vector dado directamente | 5 | `resl-norma-directa` | Calcular la magnitud de un desplazamiento o una velocidad a partir de sus componentes | Fórmula de la norma |
| Calcular la distancia entre dos puntos como norma del vector diferencia | 5 | `resl-distancia-entre-puntos` | Reconocer que la distancia entre dos puntos es la norma del vector que va de uno al otro | Vector diferencia entre dos puntos, norma aplicada a ese vector |
| Comparar la norma de dos vectores calculados a partir de sus componentes | 5 | `resl-comparacion-normas` | Reconocer que la norma no se puede estimar mirando una sola componente, hay que calcularla completa | Comparación de magnitudes, una componente chica no implica norma chica |
| **Total** | **15** | | | |

**Cardinalidad**: 3 opciones para `LEXI` (conceptual). 4 opciones para `RESL` (cálculo numérico, default de la guía de `authoring-context.md`).

---

## Contextos variados

**Registro Paenza, sin jerga de nicho** (regla 43): desplazamientos de drones y repartidores, distancias entre dos ubicaciones.

- **`resl-norma-directa`**: la distancia recorrida en línea recta por un dron que se desplaza según un vector dado; la rapidez como magnitud de un vector velocidad.
- **`resl-distancia-entre-puntos`**: la distancia en línea recta entre dos ubicaciones de un repartidor, dadas como coordenadas.
- **`resl-comparacion-normas`**: comparar qué dron recorrió más distancia, dados los puntos de llegada de cada uno.

Ningún experimento supera ~30% de los ítems de una misma sub-familia.

---

## `feedback_incorrect`, confusiones típicas (las 2 skills)

| Concepto preguntado | Confusión a diagnosticar |
|---|---|
| Por qué la norma no es negativa | Pensar que depende del signo de las componentes originales, en vez de que se elevan al cuadrado |
| Vector nulo y norma cero | Pensar que alguna combinación de signos puede anular la norma sin que todas las componentes sean cero |
| Norma como distancia | Confundir la norma con una diferencia entre componentes, en vez de una distancia al origen |
| Cálculo de la norma | Sumar las componentes en vez de elevarlas al cuadrado antes de sumar, u olvidar la raíz cuadrada final |
| Distancia entre dos puntos | Restar las coordenadas en el orden incorrecto, o no restar y calcular la norma de los puntos originales |
| Comparación de normas | Juzgar la magnitud mirando una sola componente, sin calcular la norma completa de cada vector |

---

## Reglas específicas del topic

- **Coeficientes y constantes enteros chicos** (hasta 2 dígitos), priorizando ternas donde la norma da un número entero (como $3$-$4$-$5$) para que el resultado sea fácil de verificar.
- **Toda propiedad se justifica, nunca solo se declara y se aplica** (regla 44): la razón de que la norma nunca sea negativa es que suma cuadrados (siempre no negativos) bajo una raíz cuadrada; la razón de que el vector nulo sea el único con norma cero es que una suma de términos no negativos solo da cero si cada término lo es.
- **Notación de vectores**: siempre con flecha superior (`\vec{v}`), según convención transversal del curso.

## Hallazgos de testing (ronda 1)

- **`RESL` (`resl-comparacion-normas`):** la cuenta mental de comparar $\sqrt{100}$ contra $\sqrt{169}$ resultó pesada. Fix: se cambió la pregunta para pedir *cuál* dron recorrió más (no la distancia exacta en km), así la comparación se resuelve comparando $100$ contra $169$ sin necesitar la raíz final. Mismos vectores, mismo insight pedagógico (no alcanza con mirar componente por componente), menos carga aritmética en el momento de responder.

## Checklist del topic

- [ ] Todo enunciado lleva un bloque `$$...$$` entre la apertura y la pregunta, con la notación abstracta del objeto en los conceptuales; solo se exceptúan los ítems cuyo objeto ya está en las opciones o **es** la respuesta que se pide construir (regla 66)
- [ ] Ningún contexto exige conocimiento previo de una carrera puntual (registro Paenza)
- [ ] Toda constante entera, hasta 2 dígitos; se prioriza que la norma resultante sea entera
- [ ] Cada ítem de `LEXI` reintroduce la razón detrás de lo que pregunta (regla 44), no solo la fórmula mecánica
- [ ] `tags` con el slug de la tabla, conteo por slug verificado contra el target (5 por sub-familia)
- [ ] Cardinalidad: 3 opciones en `LEXI`, 4 en `RESL`
- [ ] Ningún experimento supera ~30% de los ítems de su sub-familia
