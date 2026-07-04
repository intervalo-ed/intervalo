# Curso: Análisis Matemático I

Contexto de nivel **curso** para generar ejercicios de Intervalo. Está por encima de los `gem-instructions.md` (scoped por cinturón) y de los `topic-context.md` (scoped por tema). Define el alcance del curso, el mapa de cinturones y, sobre todo, **el estado matemático del alumno en cada cinturón**, que determina qué conceptos podés usar en distractores y explicaciones y cuáles todavía no existen para ese alumno.

> **Dónde encaja en la jerarquía de docs:**
> - `authoring-context.md`, cómo escribir (global, todos los cursos).
> - `gamification-context.md`, por qué (global).
> - `course-context.md` (este archivo), qué sabe el alumno en cada cinturón de **este** curso.
> - `analisis/{belt}/gem-instructions.md`, flujo + checklist + constraints, scoped al cinturón.
> - `analisis/{belt}/{unit}/{topic}/topic-context.md`, qué generar en el tema puntual.

---

## Alcance

Análisis Matemático I de una universidad, primer curso de cálculo para estudiantes de ingeniería y ciencias. Cubre funciones de una variable real, límites y continuidad, derivadas, integrales y análisis de funciones. No incluye varias variables, series ni ecuaciones diferenciales.

## Mapa de cinturones

La progresión de cinturones sigue el orden `white → blue → violet → brown → black`. Cada cinturón es una unidad temática:

| Cinturón | Unidad | Temas |
|----------|--------|-------|
| `white` | `functions` | definición, lineal, cuadrática, polinómica, racional, exponencial, logarítmica, trigonométrica, módulo |
| `blue` | `limits` | definición, laterales, infinitos, continuidad, factorización, racionalización |
| `violet` | `derivatives` | definición por límite, interpretación geométrica, reglas, producto, cociente, regla de la cadena, L'Hôpital |
| `brown` | `integrals` | definición, reglas, sustitución, partes, definidas |
| `black` | `analysis` | análisis de funciones, optimización, cálculo de área, teorema fundamental del cálculo (FTC) |

## Estado matemático del alumno por cinturón (regla dura)

El alumno de un cinturón **solo conoce lo de su cinturón y los anteriores**. Nunca uses conceptos de un cinturón posterior como distractor, en una explicación o en el enunciado. Esta regla anula cualquier atajo pedagógico: un ejercicio de funciones (white) no puede mencionar "la derivada se anula en el vértice" aunque sea cierto, porque el alumno todavía no vio derivadas.

- **`white` (funciones):** conjuntos, dominio/imagen/codominio/preimagen, unicidad, familias de funciones y sus gráficas, operaciones algebraicas. **No** existen todavía: límite, continuidad formal, derivada, integral.
- **`blue` (límites):** todo lo de white + noción de límite, límites laterales e infinitos, continuidad. **No** existen todavía: derivada, integral.
- **`violet` (derivadas):** todo lo anterior + derivada como límite, reglas de derivación, recta tangente, L'Hôpital. **No** existe todavía: integral.
- **`brown` (integrales):** todo lo anterior + antiderivada, integral definida e indefinida, técnicas de integración.
- **`black` (análisis):** todo el curso disponible. Es el único cinturón donde podés cruzar derivada, integral y análisis de función en un mismo ejercicio.

Cada `gem-instructions.md` de cinturón repite su propia frontera en la sección *Alcance*; este archivo es la vista de conjunto.

## Convenciones transversales del curso

- Decimales con **coma** (`4,3`), notación rioplatense. Nunca mezclar decimal con coma dentro de conjuntos (ver `authoring-context.md`).
- Dinero en pesos, signo escapado `\$`.
- Contextos cotidianos del mundo del estudiante universitario latinoamericano, sin nombres propios (ver `gamification-context.md`).
