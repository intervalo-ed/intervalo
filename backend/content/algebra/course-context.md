# Curso: Álgebra

Contexto de nivel **curso** para generar ejercicios de Intervalo. Está por encima de los `generation-instructions.md` (scoped por cinturón) y de los `topic-context.md` (scoped por tema). Ver `analisis/course-context.md` para el modelo completo de esta jerarquía de docs; acá se documenta lo propio de Álgebra.

> **Estado:** curso en etapa temprana. Los `generation-instructions.md` por cinturón y los `topic-context.md` por tema todavía no están escritos. Este archivo fija el alcance y el mapa de cinturones para cuando se armen.

---

## Alcance

Álgebra lineal introductoria para primer año de ingeniería y ciencias: vectores, matrices y espacios vectoriales. No incluye autovalores/autovectores ni formas cuadráticas en esta primera versión (pendiente de definir si entran en un cinturón posterior).

## Mapa de cinturones

| Cinturón | Unidad | Temas |
|----------|--------|-------|
| `white` | `vectors` | vectores |
| `blue` | `matrices` | matrices |
| `violet` | `vector_spaces` | espacios vectoriales |

## Estado matemático del alumno por cinturón (regla dura)

El alumno de un cinturón solo conoce lo de su cinturón y los anteriores. No uses conceptos de un cinturón posterior como distractor ni en explicaciones.

- **`white` (vectores):** operaciones con vectores, combinación lineal, producto escalar, norma, ángulo. **No** existen todavía: matrices, independencia lineal formal, espacios vectoriales abstractos.
- **`blue` (matrices):** todo lo de white + matrices, producto matricial, determinante, sistemas de ecuaciones, inversa.
- **`violet` (espacios vectoriales):** todo lo anterior + espacio vectorial, subespacio, base, dimensión, independencia lineal.

## Convenciones transversales del curso

Aplican las mismas que en `analisis/course-context.md` (decimales con coma, dinero `\$`, sin nombres propios). Las convenciones de formato y redacción viven en `authoring-context.md`; el porqué, en `gamification-context.md`.
