# Flujo de generación de contenido — curso `probabilidad`, ronda 2

Este es el documento maestro de la ronda 2. Si vas a completar ejercicios de
`brown/distribuciones`, **empezá por acá**. Cada uno de los 8 topics ya tiene su
`topic-context.md` con la taxonomía completa (tabla de sub-familias con target y
slug, contextos variados, reglas de gráficos, regla de interpretación
intuitiva); este archivo explica el ciclo, el alcance exacto de la ronda y cómo
validar antes de commitear.

Todos los comandos se corren **desde `backend/`**.

---

## Qué es esta ronda

**Ronda 1** generó, para `brown/distribuciones`, un ejercicio de muestra por
cada sub-familia de cada ítem (`CLSF`/`FORM`/`GRAF` según el topic): 3
ejercicios por ítem, ya seedeados, validados en 0 errores y probados a mano en
`/test` (incluye una vuelta de correcciones sobre los gráficos: qué
sub-familias llevan imagen y cuáles no, y por qué la magnitud de los
parámetros importa más que el margen del `graph_view`, todo documentado en
cada `topic-context.md`).

**Ronda 2 (esta) completa esos 3 ejercicios hasta el target de 15 por ítem**,
manteniendo los 3 ya escritos (no se tocan, no se regeneran) y agregando los
que faltan por sub-familia hasta llenar la tabla de cada `topic-context.md`.

**Regla de oro:** cada archivo `SKILL.json` de este alcance termina con
**exactamente 15 ejercicios**, ni más ni menos, con la distribución por
sub-familia que ya está escrita en la tabla de su `topic-context.md` (esas
tablas ya suman 15 cada una, no hay que recalcular nada, solo restarle los 3
ya hechos).

---

## Alcance: 8 topics, 16 ítems

| Topic | Ítems | Ya hecho (ronda 1) | Falta (ronda 2) |
|-------|-------|:---:|:---:|
| `binomial` | CLSF, FORM | 3 c/u | 12 c/u |
| `geometrica` | CLSF, FORM | 3 c/u | 12 c/u |
| `hipergeometrica` | CLSF, FORM | 3 c/u | 12 c/u |
| `negativa` | CLSF, FORM | 3 c/u | 12 c/u |
| `poisson` | CLSF, FORM | 3 c/u | 12 c/u |
| `uniforme` | GRAF, FORM | 3 c/u | 12 c/u |
| `exponencial` | GRAF, FORM | 3 c/u | 12 c/u |
| `normal` | GRAF, FORM | 3 c/u | 12 c/u |

Ningún otro topic ni curso está en alcance de esta ronda (ni `brown/vectores`,
ni el resto de `probabilidad`, ni `analisis`/`algebra`).

**Orden sugerido:** el orden de la tabla de arriba (discretas primero,
continuas al final), y dentro de cada topic cerrar `CLSF`/`GRAF` antes que
`FORM`. Cerrá un topic completo (sus 2 ítems) antes de pasar al siguiente.

---

## Setup, una sola vez

La branch `content-probabilidad-round2` **ya existe** (fast-forwardeada a
`main` con el trabajo de la ronda 1 de `brown/distribuciones` como primer
commit). No la crees de nuevo:

```bash
git fetch origin
git checkout content-probabilidad-round2
git pull origin content-probabilidad-round2
```

Si por algún motivo no existe en tu remoto, avisá antes de crearla de cero, no
asumas.

---

## El ciclo, una vez por ítem (`SKILL.json`)

### 1. Leer, en este orden

1. `backend/content/authoring-context.md` **completo**. Es la fuente de verdad
   de formato y estilo, por encima de cualquier resumen.
2. `backend/content/probabilidad/course-context.md` (frontera matemática del
   alumno de `brown`).
3. El `topic-context.md` del topic (`backend/content/probabilidad/brown/distribuciones/<topic>/topic-context.md`).
   Ahí está todo el detalle operativo específico de este ítem:
   - La tabla de sub-familias con **target exacto y slug** (columna `tags`).
   - "Contextos variados": la lista de escenarios a rotar (tope ~30% del mismo
     contexto dentro de una sub-familia, regla 43 de `authoring-context.md`).
   - La regla de **interpretación intuitiva obligatoria** en toda
     `explanation` (qué significa el concepto/parámetro/distribución en el
     contexto, no solo el mecanismo de cálculo).
   - Para los topics con `GRAF` (`uniforme`, `exponencial`, `normal`), la
     sección **"Diseño de gráficos reales"**: qué sub-familia lleva imagen y
     cuál no, la regla de que el `question` nunca repite en texto un dato que
     el gráfico debería aportar (si no, la imagen queda decorativa), y la
     regla de **alturas prolijas** (elegir la magnitud de $\lambda$/$\sigma$/el
     intervalo para que el pico caiga en un rango ~0,15 a ~1, nunca dejar que
     el margen del `graph_view` intente compensar un dato con una magnitud
     mala de por sí). Estas reglas salen de testing real de la ronda 1, no son
     teóricas: seguilas al pie de la letra.
4. Los 3 ejercicios ya generados en el propio `SKILL.json` (los que tienen
   `"tags": [...]` con un slug de la tabla). Usalos como **referencia de
   formato exacto** (todos los campos del JSON, incluidos `graph_fn`/
   `graph_view`/`graph_shade`/`graph_free_aspect` cuando aplica) y de **tono/
   nivel** ya validado. No los edites ni los borres.

### 2. Planificar (en el chat, antes de tocar el `.json`)

Para el ítem que estés por completar, escribí en el chat una tabla: sub-familia
→ target de la tabla → cuántos ya hay (1, el de ronda 1) → cuántos faltan.
Elegí, para cada ejercicio nuevo, un contexto distinto de la lista de
"Contextos variados" (rotando, sin repetir el mismo más del ~30% de las veces
dentro de la misma sub-familia) y números que no dupliquen los ya usados en
los ejercicios existentes del mismo ítem. Mostrá 1 ejercicio de muestra antes
de generar el resto del ítem.

### 3. Generar

Agregá los ejercicios nuevos al array del `.json` existente (no crees un
archivo nuevo, no toques los 3 que ya están). Cada ejercicio nuevo lleva su
`tags` con el slug correspondiente de la tabla. Respetá el esquema completo de
campos que ya usan los ejercicios existentes del archivo (incluidos los de
gráfico, aunque sean `null` en los ítems que no llevan imagen).

### 4. Seedear (formato + integridad)

```bash
python seed_content.py --course probabilidad
```

Tiene que correr sin errores. Debería reportar el ítem como `updated`.

### 5. Validar y reducir errores

```bash
python content/validate_content.py --course probabilidad --topic brown/distribuciones/<topic>
```

- **ERROR**: se corrige siempre, no se avanza al siguiente ítem con errores
  pendientes. Volvé a seedear y validar después de cada corrección hasta
  llegar a **0 ERRORS** en el topic.
- **WARNING**: se revisa con criterio (puede ser falso positivo). El único
  warning esperable y que se puede dejar tal cual es el de `structure (regla
  tags)` que compara conteo por slug contra el target de la tabla, **mientras
  el ítem siga incompleto** — una vez que un ítem llega a sus 15 ejercicios
  completos, ese warning tiene que desaparecer solo; si no desaparece, algo
  quedó mal contado. Cualquier otro warning que quede se justifica en el
  mensaje de commit.

### 6. Checklist manual del ítem

Corré el checklist del final del `topic-context.md` sobre los 15 ejercicios
completos (no solo sobre los nuevos). Prestá atención especial a lo que el
validador no puede chequear automáticamente: que la interpretación intuitiva
de cada `explanation` sea real y no un párrafo de relleno, que los ejercicios
de `GRAF` con imagen realmente obliguen a mirar el gráfico para resolver (no
repitan en texto lo que el gráfico debería aportar), y que la variedad de
contextos entre los 15 ejercicios de un ítem sea genuina (no 15 variaciones
del mismo escenario con números distintos).

### 7. Anotar las decisiones tomadas

Antes de commitear, escribí (o actualizá) un archivo de decisiones en:

```
generation/content-probabilidad-round2/decisions/brown/distribuciones/<topic>/<SKILL>_decisions.md
```

(mismo patrón de carpetas que `generation/content-analisis-round2/decisions/`,
ver ese directorio como referencia de formato). El archivo documenta, para ese
ítem:

```markdown
# Decisiones, <SKILL>.json (topic: <topic>)

## Plan cumplido

| Sub-familia | Target | Generados (ronda 2) | Total |
|---|---:|---:|---:|
| <slug-1> | N | N-1 | N |
| <slug-2> | N | N-1 | N |
| ... | | | |
| **Total** | **15** | **12** | **15** |

## Contextos usados
Lista breve de qué escenario de "Contextos variados" se usó en cada ejercicio
nuevo, para poder auditar variedad de un vistazo.

## Decisiones de contenido
Cualquier ambigüedad, número elegido con criterio propio, o desvío menor del
plan original (y por qué). Si no hubo ninguna, decilo explícitamente ("sin
desvíos del plan").

## Warnings que quedaron
Cada warning del validador que no se corrigió, con la razón puntual.
```

No hace falta el detalle ejercicio-por-ejercicio que tiene
`content-analisis-round2/decisions/` (ese fue para auditar contenido ya
existente ejercicio por ejercicio; acá alcanza con el resumen por sub-familia
más los dos puntos de arriba).

### 8. Commitear (solo si 4, 5 y 6 cierran)

```
content(probabilidad/brown/distribuciones/<topic>): completar <SKILL> a 15 ejercicios (ronda 2)
```

Un commit por ítem (`SKILL.json`) o uno por topic (sus 2 ítems juntos) si te
resulta más cómodo, lo que prefieras. En el cuerpo del commit resumí: cuántos
ejercicios se agregaron, el conteo final por `tags`, y los warnings que
quedaron con su justificación (o referenciá el archivo de decisiones en vez de
repetirlo).

Si algo de 4/5/6 no cierra, **no commitees**: arreglá y repetí desde el punto 4.

---

## Al terminar los 8 topics

1. `python seed_content.py --course probabilidad --prune` desde `backend/`
   (limpia cualquier fila vieja si cambiara la cantidad de algún ítem).
2. `python content/validate_content.py --course probabilidad --topic brown/distribuciones/<topic>`
   para cada uno de los 8 topics: **0 ERRORS** y 0 warnings de `structure
   (regla tags)` sin justificar (ya deberían haber desaparecido al llegar a
   15).
3. Push de la branch y **abrir un PR a `staging`** (no mergees directo a
   `main` ni a `staging` sin revisión — a diferencia de la ronda 1, esta la
   trabaja otra persona, así que el merge final lo decide quien la generó
   después de que alguien más la pruebe en `/test`).

---

## Reglas de conducta

- `authoring-context.md`, `course-context.md` y los `topic-context.md` son
  **solo lectura** durante la generación. Si encontrás una regla ambigua o un
  target que no cierra (ej. la tabla no suma 15), marcalo en el resumen del
  commit y seguí con tu mejor criterio, no te bloquees esperando respuesta.
- No cambies la cantidad de sub-familias ni sus slugs — ya están fijados por
  `topic-context.md` y por los 3 ejercicios de ronda 1 que ya los usan.
- No adelantes conceptos fuera de la frontera matemática de `brown` (ver
  `course-context.md`): nada de vectores aleatorios, conjuntas ni
  correlación, eso es contenido de una unidad sin cinturón asignado todavía.
- Los 3 ejercicios de ronda 1 de cada ítem **no se tocan**. Si al planificar
  encontrás que alguno tiene un problema real, marcalo en el archivo de
  decisiones en vez de editarlo silenciosamente.
