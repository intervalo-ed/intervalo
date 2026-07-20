# Curso: Probabilidad y Estadística

Contexto de nivel **curso** para generar ejercicios de Intervalo. Está por encima de los `generation-instructions.md` (scoped por cinturón) y de los `topic-context.md` (scoped por tema). Ver `analisis/course-context.md` para el modelo completo de esta jerarquía de docs; acá se documenta lo propio de Probabilidad.

> **Estado:** arrancando la ronda 1 de generación (jul-2026). Hoy cada `SKILL.json` de los 31 topics tiene un único ítem dummy (ver `generation-workflow.md`). Este archivo fija el alcance y el mapa de cinturones; `white/generation-instructions.md` está escrito y los 31 `topic-context.md` por tema ya quedaron listos (ver tabla de alcance en `generation-workflow.md`).

---

## Alcance

Probabilidad y estadística introductoria para primer año: conteo, probabilidad, variables aleatorias y distribuciones discretas y continuas. No incluye inferencia estadística ni tests de hipótesis en esta primera versión.

## Mapa de cinturones

La progresión sigue el orden `white → blue → violet → brown` (`brown` está
`hidden: true` en `course.json`, no visible todavía para el alumno). No hay un
quinto cinturón: las distribuciones continuas (uniforme, exponencial, normal)
viven dentro de `violet/distribuciones` junto con las discretas, no en un
cinturón aparte.

| Cinturón | Unidades | Temas |
|----------|----------|-------|
| `white` | `conteo`, `probabilidad` | conteo (combinatoria) + probabilidad |
| `blue` | `variables` | variables aleatorias |
| `violet` | `distribuciones` | distribuciones discretas y continuas |
| `brown` | `vectores` | vectores aleatorios (conjunta, marginales, covarianza) |

## Estado matemático del alumno por cinturón (regla dura)

El alumno de un cinturón solo conoce lo de su cinturón y los anteriores. No uses conceptos de un cinturón posterior como distractor ni en explicaciones.

- **`white` (conteo + probabilidad):** principio de multiplicación, permutaciones, variaciones, combinaciones, factorial, espacio muestral, eventos, probabilidad clásica (Laplace), axiomas de Kolmogorov, condicional, independencia, probabilidad total, Bayes. **No** existen todavía: variable aleatoria, distribuciones, esperanza, varianza.
- **`blue` (variables):** todo lo de white + variable aleatoria, función de probabilidad puntual, función de densidad, función de distribución acumulada, esperanza, varianza.
- **`violet` (distribuciones):** todo lo anterior + los modelos paramétricos discretos (binomial, geométrica, binomial negativa, hipergeométrica, Poisson) y continuos (uniforme, exponencial, normal). **Las distribuciones continuas usan integrales** (ver nota de dependencia abajo).
- **`brown` (vectores):** todo lo anterior + vector aleatorio, distribución conjunta, marginales, covarianza, correlación, independencia de variables.

> **Nota de dependencia entre cursos:** las distribuciones continuas de `violet` (uniforme, exponencial, normal) usan integrales para calcular probabilidades como área bajo la densidad. Si el alumno cursa Probabilidad sin haber visto integrales en Análisis, `violet` asume esa herramienta igual. Tratamiento acordado: dar la integral ya resuelta (fórmula cerrada de $P(a \leq X \leq b)$ o el resultado numérico) en vez de pedir el cálculo paso a paso; el foco del ítem es la lectura/aplicación del modelo probabilístico, no la técnica de integración. Documentado también en el `topic-context.md` de cada topic continuo de `violet/distribuciones`.

## Convenciones transversales del curso

Aplican las mismas que en `analisis/course-context.md` (decimales con coma, dinero `\$`, sin nombres propios). Las convenciones de formato y redacción viven en `authoring-context.md`; el porqué, en `gamification-context.md`.
