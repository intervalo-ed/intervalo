# Flujo de generación de contenido — curso `probabilidad`

Este es el documento maestro de la ronda de generación. Si vas a completar/regenerar
ejercicios del curso `probabilidad`, **empezá por acá**. Cada topic tiene (o va a
tener) su propio `topic-context.md` con el detalle fino de qué generar, y
eventualmente un `generation-prompt.md` operativo por ciclo; este archivo explica
el ciclo, el alcance de la ronda y cómo validar antes de commitear.

Todos los comandos se corren **desde `backend/`**.

---

## Qué es una ronda y en cuál estamos

**Estamos preparando la ronda 1.** Hoy los 31 topics del curso tienen cada uno un
único ejercicio dummy por skill (`SKILL.json` con un array de 1 elemento), generado como
placeholder al armar la estructura de carpetas y el catálogo (`course.json`). No hay
contenido real todavía.

- **Preparación (hecha):** se recorrieron los 31 topics escribiendo su
  `topic-context.md` (taxonomía por sub-familia con `tags`/slugs, confusiones
  fuente para `feedback_incorrect`, reglas duras propias del topic, checklist), y
  se dejaron listos los documentos de contexto del curso (`course-context.md`,
  `white/generation-instructions.md`, este archivo). **No se generó contenido
  nuevo en esta etapa**, solo se escribieron los documentos que van a guiar la
  generación.
- **Ronda 1 (próxima, una vez que un topic tenga su `topic-context.md` listo):**
  generación limpia desde el ejercicio dummy hasta el target de la tabla de abajo,
  siguiendo el patrón usado en `analisis` (ver
  `generation/content-analisis-round2/0-generation-prompt.md` para el modelo
  completo del ciclo).
- **Rondas futuras:** auditoría en vivo, corrección de hallazgos, y eventual
  expansión de `blue`/`violet`/`brown` si la ronda 1 los deja en un target menor
  al de `white` (ver nota de alcance).

---

## Alcance: los 31 topics

| Belt / unit | Topic | Skills | Ejercicios/skill (ronda 1) |
|-------------|-------|--------|:---------------------:|
| white/conteo | reglas | FORM, ESTR, RESL | 50 |
| white/conteo | factoriales | FORM, RESL | 50 |
| white/conteo | permutaciones | CLSF, FORM, RESL | 50 |
| white/conteo | variaciones | CLSF, FORM, RESL | 50 |
| white/conteo | combinaciones | CLSF, FORM, RESL | 50 |
| blue/probabilidad | espacios | LEXI, CLSF | 50 |
| blue/probabilidad | axiomas | LEXI, ESTR, RESL | 50 |
| blue/probabilidad | laplace | FORM, RESL | 50 |
| blue/probabilidad | condicional | ESTR, FORM, RESL | 50 |
| blue/probabilidad | independencia | CLSF, FORM, RESL | 50 |
| blue/probabilidad | total | ESTR, FORM, RESL | 50 |
| blue/probabilidad | bayes | ESTR, FORM, RESL | 50 |
| violet/variables | definicion_var | LEXI, CLSF | 15 |
| violet/variables | puntual | FORM, GRAF, RESL | 15 |
| violet/variables | densidad | FORM, GRAF, RESL | 15 |
| violet/variables | acumulada | FORM, GRAF, RESL | 15 |
| violet/variables | esperanza | FORM, RESL | 15 |
| violet/variables | varianza | FORM, RESL | 15 |
| brown/distribuciones | binomial | CLSF, FORM | 15 |
| brown/distribuciones | geometrica | CLSF, FORM | 15 |
| brown/distribuciones | negativa | CLSF, FORM | 15 |
| brown/distribuciones | hipergeometrica | CLSF, FORM | 15 |
| brown/distribuciones | poisson | CLSF, FORM | 15 |
| brown/distribuciones | uniforme | GRAF, FORM | 15 |
| brown/distribuciones | exponencial | GRAF, FORM | 15 |
| brown/distribuciones | normal | GRAF, FORM | 15 |

`vectores` (vectores aleatorios) quedó sin cinturón asignado en `course.json`
tras correr las unidades un cinturón hacia abajo (jul-2026); el contenido sigue
en disco en `backend/content/probabilidad/brown/vectores/`, pendiente de
retomar en una ronda futura. No forma parte del alcance de esta tabla.

**Por qué 50 en `white` y 15 en el resto:** mismo criterio que usó `analisis` en su
ronda 1 (ver tabla de alcance de
`generation/content-analisis-round2/0-generation-prompt.md`): el primer
cinturón, que es el que más alumnos recorren primero y el que fija el patrón de
calidad para el resto, sale completo desde el arranque; los cinturones siguientes
arrancan en un set más chico (15) para no bloquear el lanzamiento del curso
completo, y se expanden a 50 en una ronda futura si el volumen de uso lo justifica.

**Orden sugerido:** por unidad, `white → blue → violet → brown`, y dentro de cada
unidad en el orden de la tabla (`conteo` (white) antes que `probabilidad` (blue)
porque Laplace y Bayes usan combinatoria; dentro de `probabilidad`, `espacios →
axiomas → laplace → condicional → independencia → total → bayes` porque cada uno
depende conceptualmente del anterior). Cerrá un topic completo (todas sus skills)
antes de pasar al siguiente.

---

## Setup, una sola vez

Trabajás en la branch `content-probabilidad-round1`.

```bash
git checkout main && git pull
git checkout -b content-probabilidad-round1   # o: git checkout content-probabilidad-round1 si ya existe
```

Si la branch ya existe (porque alguien ya avanzó algún topic), hacé checkout y
seguí, no la pises.

---

## El ciclo, una vez por topic

### 1. Leer, en este orden

1. `backend/content/authoring-context.md` **completo** (todas las reglas críticas +
   secciones). Es la fuente de verdad de formato y estilo, por encima de cualquier
   resumen.
2. `backend/content/probabilidad/course-context.md` (qué sabe el alumno en cada
   belt, frontera matemática dura).
3. El `generation-instructions.md` del belt del topic: `white/generation-instructions.md`
   (unidad `conteo`) o `blue/generation-instructions.md` (unidad `probabilidad`).
   `violet`/`brown` todavía no tienen el suyo propio; referencian estos dos mientras
   no haya reglas específicas.
4. El `topic-context.md` del topic: distribución por sub-familia con slugs de
   `tags`, confusiones fuente, reglas duras propias del topic.

### 2. Escribir/confirmar el `topic-context.md` (etapa de preparación)

Si el topic todavía no tiene `topic-context.md`, diseñá la taxonomía leyendo el
`tooltip`/`short_description` del topic en `course.json` y el ejercicio dummy existente
como semilla de contexto (no como contenido a preservar). Seguí la estructura
recomendada en `agent-context.md` (distribución por sub-familia con cantidad
exacta y slug, confusiones fuente por skill, reglas específicas del topic,
checklist). Esto es preparación, no generación: no toques los `.json` en este
paso.

### 3. Generar (cuando la ronda 1 arranque para ese topic)

Seguí el "Paso 2" (planning) y "Paso 3" (generación) del `generation-instructions.md`
del belt correspondiente: plan numerado en el chat antes de escribir un solo
ejercicio, después generación siguiendo el plan.

### 4. Seedear (formato + integridad)

```bash
python seed_content.py --course probabilidad
```

Tiene que correr sin errores. Debería reportar los ejercicios del topic como `created`
o `updated`.

### 5. Validar (reglas automatizables)

```bash
python content/validate_content.py --course probabilidad --topic <belt/unit/topic>
```

Por ejemplo: `python content/validate_content.py --course probabilidad --topic white/probabilidad/bayes`.

- **ERROR**: violación inequívoca de una regla. **Se corrige siempre**, no se
  commitea con errores.
- **WARNING**: heurística que puede tener falsos positivos. Se revisa con
  criterio; cada warning que quede se justifica en el mensaje de commit.

### 6. Checklist manual del topic

Corré el checklist del final del `topic-context.md` y el self-critique de
`white/generation-instructions.md`, ejercicio por ejercicio.

### 7. Commitear (solo si 4, 5 y 6 cierran)

```
feat(probabilidad/<belt>/<topic>): generar ejercicios ronda 1
```

En el cuerpo del commit resumí: cantidad de ejercicios por skill, el conteo por `tags`,
y los warnings que quedaron con su justificación.

---

## Reglas de conducta

- Los docs de contexto (`authoring-context.md`, `course-context.md`,
  `topic-context.md`, `generation-instructions.md`) son **solo lectura** durante la
  generación (paso 3 en adelante). Sí se editan durante la etapa de preparación
  (paso 2), que es justamente escribir/ajustar esos documentos.
- Si tenés una duda de alcance, **marcala y seguí**, no te bloquees esperando
  respuesta. Dejá la duda anotada en el resumen del commit o del mensaje.
- No adelantes conceptos de un cinturón posterior al escribir un topic (ver
  frontera matemática dura en `course-context.md`).
