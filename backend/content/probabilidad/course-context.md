# Curso: Probabilidad y Estadística

Contexto de nivel **curso** para generar ejercicios de Intervalo. Está por encima de los `generation-instructions.md` (scoped por cinturón) y de los `topic-context.md` (scoped por tema). Ver `analisis/course-context.md` para el modelo completo de esta jerarquía de docs; acá se documenta lo propio de Probabilidad.

> **Estado:** arrancando la ronda 1 de generación (jul-2026). Hoy cada `SKILL.json` de los topics tiene un único ejercicio dummy (ver `generation-workflow.md`). Este archivo fija el alcance y el mapa de cinturones; `white/generation-instructions.md` y `blue/generation-instructions.md` están escritos y los `topic-context.md` por tema ya quedaron listos (ver tabla de alcance en `generation-workflow.md`).
>
> **jul-2026:** se corrieron las unidades un cinturón hacia abajo (`probabilidad`→blue, `variables`→violet, `distribuciones`→brown) para poder habilitar contenido nuevo en `white`; `vectores` quedó sin cinturón asignado (ver nota más abajo).

---

## Alcance

Probabilidad y estadística introductoria para primer año: conteo, probabilidad, variables aleatorias y distribuciones discretas y continuas. No incluye inferencia estadística ni tests de hipótesis en esta primera versión.

## Mapa de cinturones

La progresión sigue el orden `white → blue → violet → brown`, todos visibles
para el alumno. No hay un quinto cinturón: las distribuciones continuas
(uniforme, exponencial, normal) viven dentro de `brown/distribuciones` junto
con las discretas, no en un cinturón aparte.

| Cinturón | Unidades | Temas |
|----------|----------|-------|
| `white` | `conteo` | conteo (combinatoria) |
| `blue` | `probabilidad` | espacios, axiomas, laplace, condicional, independencia, total, bayes |
| `violet` | `variables` | variables aleatorias |
| `brown` | `distribuciones` | distribuciones discretas y continuas |

> **`vectores` (vectores aleatorios: conjunta, marginales, covarianza,
> correlación, independencia de variables) no tiene cinturón asignado por
> ahora.** Se sacó del `course.json` al correr las demás unidades un cinturón
> hacia abajo; el contenido queda preservado en disco en
> `backend/content/probabilidad/brown/vectores/` para retomarlo en una ronda
> futura (decisión explícita del usuario, jul-2026).

## Estado matemático del alumno por cinturón (regla dura)

El alumno de un cinturón solo conoce lo de su cinturón y los anteriores. No uses conceptos de un cinturón posterior como distractor ni en explicaciones.

- **`white` (conteo):** principio de multiplicación, permutaciones, variaciones, combinaciones, factorial. **No** existen todavía: espacio muestral, probabilidad, variable aleatoria, distribuciones, esperanza, varianza.
- **`blue` (probabilidad):** todo lo de white + espacio muestral, eventos, probabilidad clásica (Laplace), axiomas de Kolmogorov, condicional, independencia, probabilidad total, Bayes. **No** existen todavía: variable aleatoria, distribuciones, esperanza, varianza.
- **`violet` (variables):** todo lo anterior + variable aleatoria, función de probabilidad puntual, función de densidad, función de distribución acumulada, esperanza, varianza.
- **`brown` (distribuciones):** todo lo anterior + los modelos paramétricos discretos (binomial, geométrica, binomial negativa, hipergeométrica, Poisson) y continuos (uniforme, exponencial, normal). **Las distribuciones continuas usan integrales** (ver nota de dependencia abajo).

> **Nota de dependencia entre cursos:** las distribuciones continuas de `violet` (uniforme, exponencial, normal) usan integrales para calcular probabilidades como área bajo la densidad. Si el alumno cursa Probabilidad sin haber visto integrales en Análisis, `violet` asume esa herramienta igual. Tratamiento acordado: dar la integral ya resuelta (fórmula cerrada de $P(a \leq X \leq b)$ o el resultado numérico) en vez de pedir el cálculo paso a paso; el foco del ejercicio es la lectura/aplicación del modelo probabilístico, no la técnica de integración. Documentado también en el `topic-context.md` de cada topic continuo de `violet/distribuciones`.

## Convenciones transversales del curso

Aplican las mismas que en `analisis/course-context.md` (decimales con coma, dinero `\$`, sin nombres propios). Las convenciones de formato y redacción viven en `authoring-context.md`; el porqué, en `gamification-context.md`.
