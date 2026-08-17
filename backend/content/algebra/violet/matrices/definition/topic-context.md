# Topic: Definición

Belt: `violet`, Unit: `matrices`, Topic: `definition`

Skills en este topic: `LEXI`, `CLSF`, `FORM`. **Sin `RESL`** (rediseño de la unidad, ago-2026): en este topic todavía no hay ninguna operación entre matrices que calcular, eso empieza en `operations`. **Sin `GRAF`**: el componente de dibujo de vectores y transformaciones no existe en el frontend, se pospone.

Este topic tiene 3 ítems (uno por skill): `LEXI`, `CLSF`, `FORM`.

Concepto: una **matriz** es un arreglo rectangular de números dispuestos en filas y columnas, donde cada posición está identificada por dos índices:
$$A \in \mathbb{R}^{m \times n}, \quad a_{ij}$$
Primer topic de la unidad `matrices` y del cinturón `violet`. El alumno viene de `blue/vectors`, así que conoce vectores, sus operaciones, la norma, el producto escalar, la ortogonalidad y el producto vectorial. Todavía no conoce `operations`, `product`, `determinants`, `inverse` ni `systems` (regla crítica 31).

**Este topic absorbió el viejo topic `transpose`** (rediseño ago-2026): la traspuesta y la simetría se enseñan acá como parte de la anatomía de la matriz, no como tema aparte. Ninguna de las once cátedras relevadas (UBA, UTN, UNLP) trata la traspuesta como unidad separada.

**Este topic instala el puente hacia la lectura de transformación**: la **combinación lineal** y la **base canónica** de $\mathbb{R}^2$ y $\mathbb{R}^3$. Sin ellas no se puede definir la matriz como el registro de en qué se convierte cada dirección básica, que es la lectura sobre la que se apoyan `product` y `determinants` más adelante.

**Nota de referencia editorial**: registro "Paenza", contextos de tablas reales (stock por sucursal, puntajes, distancias entre ciudades, respuestas de una encuesta), evitando jerga de carrera puntual (regla 43).

---

## LEXI, 15 ejercicios

| Sub-familia | Cantidad | Slug | Objetivo pedagógico | Conceptos que toca |
|---|---:|---|---|---|
| Por qué la posición de cada número importa | 5 | `por-que-la-posicion-importa` | Entender que una matriz no es un conjunto de números sino números con dirección, y que en $a_{ij}$ el primer índice es la fila y el segundo la columna | Notación de subíndices, orden fila-columna, dos celdas distintas pueden guardar el mismo valor |
| Qué es una combinación lineal y qué son las direcciones básicas | 5 | `combinacion-lineal-y-base` | Entender que las coordenadas de un vector son los coeficientes que lo arman a partir de las direcciones básicas, no una medida del vector | Combinación lineal, base canónica de $\mathbb{R}^2$/$\mathbb{R}^3$, el signo del coeficiente indica sentido |
| Por qué las columnas describen la transformación entera | 5 | `por-que-las-columnas-describen` | Entender que registrar en qué se convierten las direcciones básicas alcanza para saber adónde va cualquier vector | Conservación de la combinación lineal, columnas como imágenes de la base |
| **Total** | **15** | | | |

## CLSF, 15 ejercicios

| Sub-familia | Cantidad | Slug | Objetivo pedagógico | Conceptos que toca |
|---|---:|---|---|---|
| Clasificar una matriz por su forma | 5 | `clasificar-por-forma` | Leer el orden $m \times n$ de una matriz dada y nombrar su forma | Matriz fila, columna, cuadrada, rectangular, orden como filas por columnas |
| Identificar un tipo especial de matriz cuadrada | 5 | `identificar-matriz-especial` | Reconocer diagonal, triangular superior, triangular inferior e identidad a partir de dónde están los valores no nulos | El nombre "triangular" se toma del lado donde quedan los datos, no del lado de los ceros |
| Reconocer simetría y antisimetría | 5 | `reconocer-simetria` | Decidir si una matriz coincide con su traspuesta, o si cada valor es el opuesto de su reflejo | Traspuesta, condición $a_{ij}=a_{ji}$, condición $a_{ij}=-a_{ji}$, diagonal nula |
| **Total** | **15** | | | |

## FORM, 15 ejercicios

| Sub-familia | Cantidad | Slug | Objetivo pedagógico | Conceptos que toca |
|---|---:|---|---|---|
| Escribir la matriz que representa una situación tabular | 5 | `escribir-matriz-desde-situacion` | Decidir qué ocupa las filas y qué las columnas, y armar la matriz respetando ese acuerdo | Orden $m \times n$, la traspuesta guarda los mismos datos pero responde otra pregunta |
| Escribir la matriz definida por una fórmula de sus índices | 5 | `escribir-matriz-desde-formula` | Evaluar $a_{ij}$ posición por posición, con los índices arrancando en $1$ | Generación por fórmula, numeración de índices desde uno |
| Escribir la matriz a partir de las imágenes de las direcciones básicas | 5 | `escribir-matriz-desde-imagenes-de-base` | Armar la matriz poniendo cada imagen de una dirección básica como una columna | Columnas como destino de la base, contraste contra escribirlas como filas |
| **Total** | **15** | | | |

**Cardinalidad**: 3 opciones en las tres skills. `FORM` trabaja con matrices completas como opciones, que son anchas y van como lista vertical, no en grilla 2×2.

---

## Contextos variados

**Registro Paenza, sin jerga de nicho** (regla 43): tablas de la vida cotidiana donde filas y columnas tienen un significado claro.

- **`clasificar-por-forma` / `escribir-matriz-desde-situacion`**: stock de productos por sucursal, puntajes de varios jueces a un participante, ventas por día y por producto, respuestas de una encuesta.
- **`reconocer-simetria`**: la tabla de distancias entre ciudades es el ejemplo canónico y conviene reservarlo para esta sub-familia, porque la simetría sale sola del significado y no hay que verificarla entrada por entrada. Otras opciones: cantidad de partidos jugados entre equipos, llamadas cruzadas entre sucursales.
- **`combinacion-lineal-y-base` / `por-que-las-columnas-describen`**: pueden quedar en registro abstracto por diseño (regla 43 permite esto en `LEXI`), porque el objetivo es entender una definición general, no aplicarla a un caso.
- **`escribir-matriz-desde-formula` / `escribir-matriz-desde-imagenes-de-base`**: abstractas por naturaleza, no forzar contexto.

Ningún experimento supera ~30% de los ítems de una misma sub-familia.

---

## `feedback_incorrect`, confusiones típicas (las 3 skills)

| Concepto preguntado | Confusión a diagnosticar |
|---|---|
| Posición de un elemento | Leer $a_{ij}$ como columna-fila en vez de fila-columna, o creer que dos celdas con el mismo valor son la misma celda |
| Combinación lineal | Interpretar las coordenadas como longitudes medidas sobre cada eje, lo que vuelve inexplicable un coeficiente negativo |
| Columnas como imágenes | Creer que la transformación solo mueve a los vectores básicos y deja quietos a los demás |
| Forma de la matriz | Invertir el orden y llamar $1 \times 3$ a lo que es $3 \times 1$ |
| Matriz triangular | Nombrarla por el lado donde están los ceros en vez del lado donde están los datos, invirtiendo superior e inferior |
| Simetría | Confundir simétrica con antisimétrica por el solo hecho de que la diagonal sea nula |
| Matriz desde una situación | Escribir la traspuesta, con las categorías de las filas y las columnas intercambiadas |
| Matriz desde una fórmula | Numerar los índices desde $0$ en vez de desde $1$ |
| Matriz desde la base | Escribir las imágenes como filas en vez de como columnas |

---

## Reglas específicas del topic

- **Constantes enteras chicas** (hasta 2 dígitos) y matrices de a lo sumo $3 \times 3$, para que la lectura de una posición sea inmediata.
- **`FORM` nunca opera entre matrices**: no hay sumas, productos ni escalares en este topic, solo traducción de una descripción a un arreglo.
- **Notación de la base canónica**: $\vec{e}_1$, $\vec{e}_2$, $\vec{e}_3$, con flecha superior y **el subíndice fuera de la flecha** (`\vec{e}_1`, no `\vec{e_1}`), siguiendo la convención transversal del curso. **No usar** $\hat{\imath}$/$\hat{\jmath}$, que no es la notación de las cátedras relevadas.
- **Se dice "traspuesta"**, no "transpuesta", de forma consistente en todo el curso.
- **La lectura de transformación se presenta, no se deriva**: en este topic la matriz *se define* como el registro de las imágenes de la base. La justificación mediante el cálculo del producto matriz por vector llega en `product`, y no se puede adelantar acá (regla crítica 31).
- **Prohibido nombrar espacio columna, generadores, span, independencia lineal o dimensión**: la combinación lineal se usa en su sentido concreto de sumar vectores escalados, nunca como herramienta estructural (ver la frontera fina de `violet` en `course-context.md`).
- **Toda propiedad se justifica, nunca solo se declara y se aplica** (regla 44): la razón de que las columnas alcancen para describir la transformación entera es que todo vector es una combinación de las direcciones básicas y la transformación respeta esa combinación.

## Hallazgos de testing (ronda 1)

- **`CLSF` (`reconocer-simetria`):** el enunciado describía la tabla de distancias en prosa sin mostrarla. Fix: se muestra la matriz de distancias entre Rosario, Córdoba y Mendoza. Como con la matriz a la vista la simetría se lee de un vistazo, **la pregunta subió un nivel**: pasó de "¿qué propiedad tiene?" a "¿por qué es necesariamente simétrica?", y los distractores pasaron a ser razones plausibles pero falsas, entre ellas la diagonal nula. Esto quedó documentado como regla 62 en `authoring-context.md`.
- **`FORM` (`escribir-matriz-desde-formula`):** la apertura sonaba a explicación de una regla del temario en vez de al planteo de un caso. Fix: se reescribió como "Se tiene una matriz de orden $2 \times 3$ cuyos valores no están escritos, sino que salen de una fórmula". Documentado como regla 63.
- **Grilla 2×2 de opciones con matrices:** el heurístico `latexVisualLength` del frontend no medía los entornos de matriz y les asignaba un ancho de 32, así que ninguna opción con matriz llegaba nunca a la grilla compacta. Corregido midiendo la fila más ancha del entorno. Las opciones de $2\times2$ de este topic y de `product`/`inverse` ahora entran en grilla.

## Checklist del topic

- [ ] Todo enunciado lleva un bloque `$$...$$` entre la apertura y la pregunta, con la notación abstracta del objeto en los conceptuales; solo se exceptúan los ítems cuyo objeto ya está en las opciones o **es** la respuesta que se pide construir (regla 66)
- [ ] Ningún contexto exige conocimiento previo de una carrera puntual (registro Paenza)
- [ ] Toda constante entera, matrices de hasta $3 \times 3$
- [ ] Ningún ítem opera entre matrices (eso es de `operations` en adelante)
- [ ] Ningún ítem usa vocabulario de espacios vectoriales (span, generadores, independencia, dimensión)
- [ ] Cada ítem de `LEXI` reintroduce la razón detrás de lo que pregunta (regla 44)
- [ ] `tags` con el slug de la tabla, conteo por slug verificado contra el target (5 por sub-familia)
- [ ] Cardinalidad: 3 opciones en las tres skills
- [ ] Ningún experimento supera ~30% de los ítems de su sub-familia
