# Curso: Álgebra Lineal I

Contexto de nivel **curso** para generar ejercicios de Intervalo. Está por encima de los `generation-instructions.md` (scoped por cinturón) y de los `topic-context.md` (scoped por tema). Define el alcance del curso, el mapa de cinturones y, sobre todo, **el estado matemático del alumno en cada cinturón**, que determina qué conceptos podés usar en distractores y explicaciones y cuáles todavía no existen para ese alumno.

---

## Alcance

Álgebra Lineal I de nivel universitario, primer curso para estudiantes de ingeniería, ciencias de la computación, ciencia de datos y matemática. Cubre la estructura elemental de vectores en el espacio real $\mathbb{R}^n$, ecuaciones matriciales, resolución de sistemas de ecuaciones lineales, espacios vectoriales abstractos de dimensión finita y mapeos lineales entre ellos (transformaciones lineales). No incluye autovalores/autovectores (diagonalización), descomposición SVD ni formas bilineales, que pertenecen a cursos avanzados.

## Mapa de cinturones

La progresión de cinturones sigue el orden `white → blue → violet → brown`, más un cinturón `black` oculto para contenido todavía no habilitado. Cada cinturón es una unidad temática que organiza los tópicos de forma acumulativa. **Estado actual (jul-2026):** el curso arranca en `white/aritmetica`; `spaces` se separó de `transformations` y pasó a ocupar `brown` en solitario, ya **visible**; `transformations` quedó sola en un nuevo cinturón `black`, todavía **oculto** (`"hidden": true` en `course.json`) — sus datos siguen en `/content` pero no se sirven al usuario. Al estar en cinturones distintos, `spaces/definition` y `transformations/definition` ya no colisionan en `external_id` (que se arma como `{belt}_{topic}_{skill}_{idx}`, sin el segmento de unit).

| Cinturón | Unidad(es) | Temas | Estado |
|----------|--------|-------|--------|
| `white` | `aritmetica` | fracciones, potenciación, radicales, logaritmos, notación (científica), absoluto (valor absoluto), propiedades (algebraicas) | Visible |
| `blue` | `vectors` | definición, operaciones, norma, escalar, ortogonalidad, producto | Visible (se podaron `rectas`/`planos`, ver nota abajo) |
| `violet` | `matrices` | definición, operaciones, transpuesta, determinantes, inversa | Visible (se podaron `sistemas`/`eliminación`, ver nota abajo) |
| `brown` | `spaces` | subespacios, combinaciones, independencia, generadores, bases, dimensión | Visible |
| `black` | `transformations` | definición, núcleo, imagen, teorema, asociada | Oculto (`hidden`), pendiente de habilitar en una ronda futura |

> **Poda de temas (jul-2026):** `lines`/`planes` (Rectas/Planos) se sacaron de `vectors`, y `systems`/`elimination` (Sistemas/Eliminación) se sacaron de `matrices`. El contenido no se borró, se archivó en `backend/content/archive/algebra/{blue/vectors,violet/matrices}/...`. Ambas units sumaron 2 skills nuevas (una en cada uno de 2 topics restantes) para compensar el volumen perdido — ver sus `topic-context.md` para el detalle.

---

## Estado matemático del alumno por cinturón (regla dura)

El alumno de un cinturón **solo conoce lo de su cinturón y los anteriores**. Nunca uses conceptos de un cinturón posterior como distractor, en una explicación o en el enunciado. Esta regla anula cualquier atajo pedagógico o simplificación formal que desborde el estado cognitivo de ese momento.

- **`white` (aritmética):** es el punto de partida del curso, no asume ningún cinturón anterior. Repasa operaciones aritméticas pre-universitarias en este orden: fracciones (incluida divisibilidad/MCD/MCM por factorización en primos como herramienta de simplificación, fracciones compuestas, signo y comparación sin decimales), propiedades de la potenciación (incluido exponente negativo), radicales y racionalización, logaritmos numéricos (sin variable, ubicados junto a potenciación/radicales por ser su operación inversa), notación científica, valor absoluto y propiedades algebraicas básicas (distributiva, factor común, signos al abrir paréntesis, como puente hacia la notación simbólica de las unidades siguientes). **No** existen todavía: vectores, matrices, ni ningún objeto propio del álgebra lineal.
- **`blue` (vectores):** todo lo de white + operaciones de espacio euclídeo básico en $\mathbb{R}^2$ y $\mathbb{R}^3$. Se manejan la norma, el producto interno (llamado **escalar**), la perpendicularidad (**ortogonalidad**) y el producto cruz o exterior (llamado **producto** en $\mathbb{R}^3$). **No** existen todavía: rectas ni planos (temas podados, ver nota arriba), matrices, sistemas de ecuaciones abstractos (G-J), espacios vectoriales formales ni transformaciones lineales.
- **`violet` (matrices):** todo lo anterior + manipulación algebraica de arreglos numéricos. Se introducen operaciones matriciales básicas, propiedades de la matriz transpuesta, cálculo y propiedades de determinantes, y la matriz inversa y su cálculo. **No** existen todavía: sistemas de ecuaciones ni eliminación gaussiana (temas podados, ver nota arriba), las definiciones abstractas de espacio vectorial, combinaciones lineales formales, bases ni transformaciones lineales.
- **`brown` (espacios):** todo lo anterior + la abstracción estructural: `spaces` formaliza el concepto de espacio y subespacio vectorial (axiomas de clausura), combinaciones lineales, dependencia e independencia, generadores, base y dimensión. **No** existen todavía: transformaciones lineales (cinturón `black`, oculto).
- **`black` (transformaciones, oculto):** todo lo anterior + las funciones entre espacios vectoriales que preservan sumas y productos por escalares (**transformaciones lineales**), sus dos subespacios asociados (**núcleo** e **imagen**), el **teorema de la dimensión** y la construcción de la **matriz asociada** a una transformación.

---

## Convenciones transversales del curso

- Decimales con **coma** (`4,3`), notación rioplatense. Nunca mezclar decimal con coma dentro de conjuntos (para conjuntos separar coordenadas con punto y coma si fuera necesario, o diseñar exclusivamente con enteros o fracciones simplificadas).
- Dinero en pesos argentinos, signo escapado `\$`.
- Contextos cotidianos del mundo del estudiante universitario latinoamericano, evitando nombres propios (usar roles abstractos como "un operador", "un dron", "un centro de logística", "una fábrica").
- **Notación consistente de vectores**: los vectores se escriben siempre en LaTeX con flecha superior (`\vec{v}`, `\vec{u}`).
- **Notación consistente de matrices**: las matrices se representan con letras mayúsculas en cursiva (`A`, `B`, `M`).
- **Notación de transformaciones**: las transformaciones se escriben como `T: V \to W` o utilizando la letra `T` o `L`.
- Las ecuaciones del enunciado van destacadas en bloques display (`$$...$$`) respetando siempre la visualización en dispositivos móviles (líneas cortas y limpias).
