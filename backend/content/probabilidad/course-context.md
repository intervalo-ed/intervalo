# Curso: Probabilidad y Estadística

Contexto de nivel **curso** para generar ejercicios de Intervalo. Está por encima de los `gem-instructions.md` (scoped por cinturón) y de los `topic-context.md` (scoped por tema). Ver `analisis/course-context.md` para el modelo completo de esta jerarquía de docs; acá se documenta lo propio de Probabilidad.

> **Estado:** curso en etapa temprana. Los `gem-instructions.md` por cinturón y los `topic-context.md` por tema todavía no están escritos. Este archivo fija el alcance y el mapa de cinturones para cuando se armen.

---

## Alcance

Probabilidad y estadística introductoria para primer año: conteo, probabilidad, variables aleatorias y distribuciones discretas y continuas. No incluye inferencia estadística ni tests de hipótesis en esta primera versión.

## Mapa de cinturones

La progresión sigue el orden `white → blue → violet → brown → black`.

| Cinturón | Unidad | Temas |
|----------|--------|-------|
| `white` | `counting` | conteo (combinatoria) |
| `blue` | `probability` | probabilidad |
| `violet` | `variables` | variables aleatorias |
| `brown` | `discrete` | distribuciones discretas |
| `black` | `continuous` | distribuciones continuas |

## Estado matemático del alumno por cinturón (regla dura)

El alumno de un cinturón solo conoce lo de su cinturón y los anteriores. No uses conceptos de un cinturón posterior como distractor ni en explicaciones.

- **`white` (conteo):** principio de multiplicación, permutaciones, variaciones, combinaciones, factorial. **No** existen todavía: probabilidad, variable aleatoria, distribuciones.
- **`blue` (probabilidad):** todo lo de white + espacio muestral, eventos, probabilidad clásica, condicional, independencia, Bayes.
- **`violet` (variables aleatorias):** todo lo anterior + variable aleatoria, función de distribución, esperanza, varianza.
- **`brown` (discretas):** todo lo anterior + distribuciones discretas (binomial, Poisson, geométrica, hipergeométrica).
- **`black` (continuas):** todo el curso disponible + distribuciones continuas (uniforme, exponencial, normal), función de densidad.

> **Nota de dependencia entre cursos:** las distribuciones continuas (black) usan integrales. Si el alumno cursa Probabilidad sin haber visto integrales en Análisis, el cinturón black asume esa herramienta. Documentar en el `gem-instructions.md` de black cómo tratar la integral (dar la fórmula ya resuelta vs. pedir el cálculo).

## Convenciones transversales del curso

Aplican las mismas que en `analisis/course-context.md` (decimales con coma, dinero `\$`, sin nombres propios). Las convenciones de formato y redacción viven en `authoring-context.md`; el porqué, en `gamification-context.md`.
