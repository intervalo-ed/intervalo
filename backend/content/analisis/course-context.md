# Curso: Análisis Matemático I

Contexto de nivel **curso** para generar ejercicios de Intervalo. Está por encima de los `generation-instructions.md` (scoped por cinturón) y de los `topic-context.md` (scoped por tema). Define el alcance del curso, el mapa de cinturones y, sobre todo, **el estado matemático del alumno en cada cinturón**, que determina qué conceptos podés usar en distractores y explicaciones y cuáles todavía no existen para ese alumno.

> **Dónde encaja en la jerarquía de docs:**
> - `authoring-context.md`, cómo escribir (global, todos los cursos).
> - `gamification-context.md`, por qué (global).
> - `course-context.md` (este archivo), qué sabe el alumno en cada cinturón de **este** curso.
> - `analisis/{belt}/generation-instructions.md`, flujo + checklist + constraints, scoped al cinturón.
> - `analisis/{belt}/{unit}/{topic}/topic-context.md`, qué generar en el tema puntual.

---

## Alcance

Análisis Matemático I de una universidad, primer curso de cálculo para estudiantes de ingeniería y ciencias. Cubre funciones de una variable real, límites y continuidad, derivadas, integrales y análisis de funciones. No incluye varias variables, series ni ecuaciones diferenciales.

## Mapa de cinturones

La progresión de cinturones sigue el orden `white → blue → violet → brown`. Cada cinturón es una unidad temática:

| Cinturón | Unidad | Temas |
|----------|--------|-------|
| `white` | `functions` | definición, lineal, cuadrática, polinómica, racional, exponencial, logarítmica, trigonométrica |
| `blue` | `limits` | definición, laterales, infinitos, continuidad, factorización, racionalización |
| `violet` | `derivatives` | definición por límite, interpretación geométrica, reglas, producto, cociente, regla de la cadena |
| `brown` | `integrals` | definición, reglas, sustitución, partes, definidas |

Un quinto cinturón `black` (análisis de funciones, optimización, áreas, TFC) queda **fuera de alcance por ahora**: no tiene contenido ni specs en el repo.

## Estado matemático del alumno por cinturón (regla dura)

El alumno de un cinturón **solo conoce lo de su cinturón y los anteriores**. Nunca uses conceptos de un cinturón posterior como distractor, en una explicación o en el enunciado. Esta regla anula cualquier atajo pedagógico: un ejercicio de funciones (white) no puede mencionar "la derivada se anula en el vértice" aunque sea cierto, porque el alumno todavía no vio derivadas.

- **`white` (funciones):** conjuntos, dominio/imagen/codominio/preimagen, unicidad, familias de funciones y sus gráficas, operaciones algebraicas. **No** existen todavía: límite, continuidad formal, derivada, integral.
- **`blue` (límites):** todo lo de white + noción de límite, límites laterales e infinitos, continuidad. **No** existen todavía: derivada, integral.
- **`violet` (derivadas):** todo lo anterior + derivada como límite, reglas de derivación, recta tangente. **No** existe todavía: integral.
- **`brown` (integrales):** todo lo anterior + antiderivada, integral definida e indefinida, técnicas de integración. Es el último cinturón activo: nada de análisis de funciones con integrales, optimización ni áreas entre curvas (eran temas del cinturón `black`, hoy fuera de alcance).

Cada `generation-instructions.md` de cinturón repite su propia frontera en la sección *Alcance*; este archivo es la vista de conjunto.

## Refuerzo de intuición en la unidad `blue` (límites)

En **todos los topics** de esta unidad (`definition`, `lateral_limits`, `infinite_limits`, `continuity`, `factorization`, `rationalization`), las `explanation` priorizan la explicación intuitiva de la **noción de límite** en juego, no solo la resolución mecánica del problema puntual.

Es una extensión de la regla crítica 25 de `authoring-context.md` (el porqué, no solo el qué), un paso más allá: además de razonar por qué el mecanismo del ítem funciona, agregar **1 o 2 párrafos cortos** que construyan la intuición general de la noción de límite en juego (qué representa, por qué se define así, qué problema resuelve), en el mismo lenguaje formal ya establecido en `authoring-context.md` (sin antropomorfismo, sin humor forzado). La estructura de 3 partes de la explicación sigue siendo la base; estos párrafos son un agregado, no un reemplazo.

Aplica a todo campo `explanation` de la unidad al generar o regenerar ítems, no solo a los ítems puntuales ya señalados en auditorías previas. Sumar este chequeo al checklist de cada topic al auditarlo.

**Ejemplo ya aplicado** (sub-familia "tamaño del salto" de `lateral_limits`): no alcanza con calcular $\lim^+ - \lim^-$ y dar el resultado; la explicación agrega un párrafo construyendo la intuición de por qué esa resta representa el tamaño del salto (la distancia entre las dos alturas a las que "apunta" cada rama al acercarse al punto de quiebre), antes de aplicarlo al caso puntual del ítem.

## Convenciones transversales del curso

- Decimales con **coma** (`4,3`), notación rioplatense. Nunca mezclar decimal con coma dentro de conjuntos (ver `authoring-context.md`).
- Dinero en pesos, signo escapado `\$`.
- Contextos cotidianos del mundo del estudiante universitario latinoamericano, sin nombres propios (ver `gamification-context.md`).
