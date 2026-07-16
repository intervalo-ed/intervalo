# Curso: Álgebra Lineal I

Contexto de nivel **curso** para generar ejercicios de Intervalo. Está por encima de los `generation-instructions.md` (scoped por cinturón) y de los `topic-context.md` (scoped por tema). Define el alcance del curso, el mapa de cinturones y, sobre todo, **el estado matemático del alumno en cada cinturón**, que determina qué conceptos podés usar en distractores y explicaciones y cuáles todavía no existen para ese alumno.

---

## Alcance

Álgebra Lineal I de nivel universitario, primer curso para estudiantes de ingeniería, ciencias de la computación, ciencia de datos y matemática. Cubre la estructura elemental de vectores en el espacio real $\mathbb{R}^n$, ecuaciones matriciales, resolución de sistemas de ecuaciones lineales, espacios vectoriales abstractos de dimensión finita y mapeos lineales entre ellos (transformaciones lineales). No incluye autovalores/autovectores (diagonalización), descomposición SVD ni formas bilineales, que pertenecen a cursos avanzados.

## Mapa de cinturones

La progresión de cinturones sigue el orden `white → blue → violet → brown`. Cada cinturón es una unidad temática que organiza los tópicos de forma acumulativa:

| Cinturón | Unidad | Temas |
|----------|--------|-------|
| `white` | `vectors` | definición, operaciones, norma, escalar, ortogonalidad, producto, rectas, planos |
| `blue` | `matrices` | definición, operaciones, transpuesta, determinantes, inversa, sistemas, eliminación |
| `violet` | `spaces` | subespacios, combinaciones, independencia, generadores, bases, dimensión |
| `brown` | `transformations` | definición, núcleo, imagen, teorema, asociada |

---

## Estado matemático del alumno por cinturón (regla dura)

El alumno de un cinturón **solo conoce lo de su cinturón y los anteriores**. Nunca uses conceptos de un cinturón posterior como distractor, en una explicación o en el enunciado. Esta regla anula cualquier atajo pedagógico o simplificación formal que desborde el estado cognitivo de ese momento.

- **`white` (vectores):** operaciones de espacio euclídeo básico en $\mathbb{R}^2$ y $\mathbb{R}^3$. Se manejan la norma, el producto interno (llamado **escalar**), la perpendicularidad (**ortogonalidad**), el producto cruz o exterior (llamado **producto** en $\mathbb{R}^3$), rectas parametrizadas y planos expresados tanto vectorial como implícitamente. **No** existen todavía: matrices, sistemas de ecuaciones abstractos (G-J), espacios vectoriales formales ni transformaciones lineales.
- **`blue` (matrices):** todo lo de white + manipulación algebraica de arreglos numéricos. Se introducen operaciones matriciales básicas, propiedades de la matriz transpuesta, cálculo y propiedades de determinantes, la matriz inversa y su cálculo, y la formulación matricial de sistemas $A\vec{x}=\vec{b}$ resueltos sistemáticamente por el método de eliminación gaussiana. **No** existen todavía: las definiciones abstractas de espacio vectorial, combinaciones lineales formales, bases ni transformaciones lineales.
- **`violet` (espacios):** todo lo anterior + la abstracción estructural. Se formaliza el concepto de espacio y subespacio vectorial (axiomas de clausura). Se estudian las combinaciones lineales de vectores, el concepto de dependencia e independencia lineal, sistemas de generadores, la noción óptima de base (coordenadas unívocas) y la dimensión. **No** existen todavía: las transformaciones lineales ni sus subespacios asociados ($núcleo$ e $imagen$).
- **`brown` (transformaciones):** todo lo de los cinturones anteriores. Se introducen las funciones entre espacios vectoriales que preservan sumas y productos por escalares (**transformaciones lineales**). Se definen formalmente sus dos subespacios asociados esenciales: el **núcleo** (kernel) y la **imagen**. Se estudia y aplica el **teorema de la dimensión** para analizar inyectividad/sobreyectividad y se construye algebraicamente la **matriz asociada** a una transformación respecto de diferentes bases.

---

## Convenciones transversales del curso

- Decimales con **coma** (`4,3`), notación rioplatense. Nunca mezclar decimal con coma dentro de conjuntos (para conjuntos separar coordenadas con punto y coma si fuera necesario, o diseñar exclusivamente con enteros o fracciones simplificadas).
- Dinero en pesos argentinos, signo escapado `\$`.
- Contextos cotidianos del mundo del estudiante universitario latinoamericano, evitando nombres propios (usar roles abstractos como "un operador", "un dron", "un centro de logística", "una fábrica").
- **Notación consistente de vectores**: los vectores se escriben siempre en LaTeX con flecha superior (`\vec{v}`, `\vec{u}`).
- **Notación consistente de matrices**: las matrices se representan con letras mayúsculas en cursiva (`A`, `B`, `M`).
- **Notación de transformaciones**: las transformaciones se escriben como `T: V \to W` o utilizando la letra `T` o `L`.
- Las ecuaciones del enunciado van destacadas en bloques display (`$$...$$`) respetando siempre la visualización en dispositivos móviles (líneas cortas y limpias).
