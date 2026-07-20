# Flujo de generación de contenido — curso `analisis`

Este es el documento maestro de la ronda de generación. Si vas a completar/regenerar
ejercicios del curso `analisis`, **empezá por acá**. Cada topic tiene su propio
`generation-prompt.md` con el detalle fino; este archivo explica el ciclo, el
alcance de la ronda y cómo validar antes de commitear.

Todos los comandos se corren **desde `backend/`**.

---

## Qué es una ronda y en cuál estamos

El contenido se construye en rondas. **Hoy arrancamos la ronda 2.** No mezcles el
trabajo de una ronda con el de otra.

- **Ronda 1 (hecha):** se generó un set de prueba chico por skill (15 ítems) para
  las unidades `blue`, `violet` y `brown`, y el set completo (50 ítems por skill)
  para `white`. Sobre ese contenido se hicieron auditorías manuales y se
  documentaron los hallazgos por topic.
- **Ronda 2 (esta):** **regenerar y corregir en el lugar los ítems que ya
  existen**, contra los hallazgos de auditoría y todas las reglas de
  `authoring-context.md`. **No se agregan ni se quitan ítems.** El objetivo es
  llevar el contenido existente a calidad final, no aumentar la cantidad.
- **Ronda 3 (futura, solo si la ronda 2 quedó validada):** completar cada skill de
  `blue`/`violet`/`brown` desde sus 15 ítems hasta los 50 de la meta, siguiendo la
  distribución por sub-familia de cada `topic-context.md`.

**Regla de oro de la ronda 2:** la cantidad de ítems de cada archivo `.json` **no
cambia**. Si un archivo tiene 15 ítems, sale con 15. Si tiene 50, sale con 50.
Donde un `generation-prompt.md` diga "completar hasta 50" o "ítems nuevos", es
lenguaje heredado de la planificación de la ronda 3: en la ronda 2 se ignora (cada
prompt de `blue`/`violet`/`brown` lo aclara en su callout de alcance).

---

## Alcance: los 25 topics

`white` ya está en 50 ítems por skill, así que su ronda 2 es un **refactor en el
lugar** del set completo (no tiene ronda 3). `blue`/`violet`/`brown` están en 15
por skill: ronda 2 regenera esos 15, ronda 3 los lleva a 50.

El quinto cinturón `black` (análisis de funciones, optimización, áreas, TFC) **está
fuera de alcance** y no tiene contenido en el repo.

| Belt / unit | Topic | Skills | Ítems/skill (ronda 2) |
|-------------|-------|--------|:---------------------:|
| white/functions | definition | LEXI, CLSF | 50 |
| white/functions | linear | LEXI, CLSF, FORM, GRAF | 50 |
| white/functions | quadratic | LEXI, CLSF, FORM, GRAF | 50 |
| white/functions | polynomial | LEXI, CLSF, FORM, GRAF | 50 |
| white/functions | rational | LEXI, CLSF, FORM, GRAF | 50 |
| white/functions | exponential | LEXI, CLSF, FORM, GRAF | 50 |
| white/functions | logarithmic | LEXI, CLSF, FORM, GRAF | 50 |
| white/functions | trigonometric | LEXI, CLSF, FORM, GRAF | 50 |
| blue/limits | definition | LEXI, RESL | 15 |
| blue/limits | lateral_limits | LEXI, GRAF, RESL | 15 |
| blue/limits | infinite_limits | LEXI, GRAF, RESL | 15 |
| blue/limits | continuity | CLSF, GRAF, RESL | 15 |
| blue/limits | factorization | LEXI, RESL | 15 |
| blue/limits | rationalization | LEXI, RESL | 15 |
| violet/derivatives | limit_definition | LEXI, CLSF, GRAF, ESTR | 15 |
| violet/derivatives | geometric_interpretation | LEXI, GRAF, ESTR, RESL | 15 |
| violet/derivatives | differentiation_rules | FORM, ESTR, RESL | 15 |
| violet/derivatives | product | ESTR, RESL | 15 |
| violet/derivatives | quotient | ESTR, RESL | 15 |
| violet/derivatives | chain_rule | ESTR, RESL | 15 |
| brown/integrals | definition | LEXI, FORM, ESTR | 15 |
| brown/integrals | reglas | FORM, ESTR, RESL | 15 |
| brown/integrals | substitution | ESTR, RESL | 15 |
| brown/integrals | parts | ESTR, RESL | 15 |
| brown/integrals | definite | GRAF, RESL | 15 |

**Orden sugerido:** por unidad, `white → blue → violet → brown`, y dentro de cada
unidad en el orden de la tabla (respeta la dependencia conceptual: cada topic asume
los anteriores). Podés tomar un topic, cerrarlo completo (las 2-4 skills) y recién
ahí pasar al siguiente.

---

## Setup, una sola vez

Trabajás en la branch `content-analisis-round2`. No commitees a `main`.

```bash
git checkout main && git pull
git checkout -b content-analisis-round2   # o: git checkout content-analisis-round2 si ya existe
```

Si la branch ya existe (porque alguien ya avanzó algún topic), hacé checkout y
seguí, no la pises.

---

## El ciclo, una vez por topic

### 1. Leer, en este orden

1. `backend/content/authoring-context.md` **completo** (las 32 reglas + secciones).
   Es la fuente de verdad de formato y estilo, por encima de cualquier resumen.
2. `backend/content/analisis/course-context.md` (qué sabe el alumno en cada belt).
3. Si el topic es de `white`: `backend/content/analisis/white/generation-instructions.md`.
4. El `topic-context.md` del topic (distribución por sub-familia con slugs de
   `tags`, confusiones fuente, reglas duras, y la sección **"Hallazgos de
   auditoría"** con los defectos concretos a corregir).
5. El `generation-prompt.md` del topic (el detalle operativo de este ciclo).

### 2. Planificar (en el chat, antes de tocar un `.json`)

Seguí el "Paso 1" del `generation-prompt.md`: por skill y sub-familia, qué
corrección aplica a cada ítem existente. En la ronda 2 **no hay ítems nuevos**:
cada uno de los 15 (o 50 en `white`) se revisa y se reescribe donde haga falta.
Mostrá 1-2 ítems reescritos como muestra antes de hacer el resto.

### 3. Ejecutar

Reescribí los ítems en sus `.json`. No cambies la cantidad. No toques
`external_id`, `belt`, `topic`, `exercise_type` si aparecen (los pone el seeder).

### 4. Seedear (formato + integridad)

```bash
python seed_content.py --course analisis
```

Tiene que correr sin errores. Debería reportar los ítems del topic como `updated`.

### 5. Validar (reglas automatizables)

```bash
python content/validate_content.py --course analisis --topic <belt/unit/topic>
```

Por ejemplo: `python content/validate_content.py --course analisis --topic brown/integrals/definite`.

- **ERROR**: violación inequívoca de una regla (explanation < 300, `\n\n$$`,
  em-dash, ✓/✗, feedback mal formado, opener que corta una oración con la fórmula,
  `\text{}` con cláusula larga, `tags` faltante o inválido, `correct_index`
  sesgado > 50%, etc.). **Exit code 1. Se corrige siempre**, no se commitea con
  errores.
- **WARNING**: heurística que puede tener falsos positivos (sesgo de longitud de
  opciones, párrafo de prosa largo, 3+ inline en un párrafo, feedback con arranque
  acusatorio, conteo por slug distinto del target). **Se revisa con criterio.** Si
  después de mirarlo decidís que está bien, lo dejás; pero **cada warning que
  quede se justifica en una línea del mensaje de commit**.

Flags útiles: `--check options,structure` para correr solo algunas familias;
`--json` para salida parseable. Sin `--topic` corre todo el curso.

**Lo que el validador NO chequea** (queda en el checklist manual del punto 6, no es
automatizable): que la explicación justifique el *porqué* y no solo el *qué* (regla
25), que un `\begin{aligned}` no aliñe datos sueltos en vez de una derivación real
(regla 30), que cada ítem reintroduzca su definición central (regla 31), y las
**reglas duras propias del topic** (`+C` obligatorio, límites actualizados al
sustituir, frontera matemática del belt, etc.).

### 6. Checklist manual del topic

Corré el checklist del final del `topic-context.md`, ítem por ítem, prestando
atención a los puntos que el validador no cubre (regla 25/30/31 y las reglas duras
del topic).

### 7. Commitear (solo si 4, 5 y 6 cierran)

Con el seeder sin errores, `validate_content.py` en **0 ERRORs** y el checklist
manual limpio, commiteá con el formato del `generation-prompt.md`:

```
feat(analisis/<belt>/<topic>): regenerar ítems de prueba y correcciones de la ronda
```

En el cuerpo del commit resumí: qué se corrigió y por qué regla, los warnings que
quedaron y por qué se dejaron, y el conteo por `tags` de cada skill.

Si algo de 4/5/6 no cierra, **no commitees**: arreglá y repetí desde el punto 4.

---

## Reglas de conducta

- Los docs de contexto (`authoring-context.md`, `course-context.md`,
  `topic-context.md`, `generation-instructions.md`) son **solo lectura**. No los
  edites durante la generación.
- Si tenés una duda de alcance, **marcala y seguí**, no te bloquees esperando
  respuesta. Dejá la duda anotada en el resumen del commit.
- Hay bugs que **ya se corrigieron** en una pasada previa y no son hallazgos
  nuevos: el `\n\n` pegado a `$$` (todos los topics de `brown`), la notación
  `\lim^-`/`\lim^+` sin punto de tendencia (`blue`), y el `\n` literal como texto.
  No los vuelvas a reportar como si fueran nuevos; solo asegurate de no
  reintroducirlos.
- No cambies la cantidad de ítems (ronda 2). No adelantes temas del belt siguiente.
