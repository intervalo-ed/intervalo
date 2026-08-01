# Flujo de generación de contenido — curso `probabilidad`, ronda 2

Este es el documento maestro de la ronda 2. **Es para el curso completo**, no
solo para una unidad: los 26 topics de `probabilidad` (`white/conteo`,
`blue/probabilidad`, `violet/variables`, `brown/distribuciones`). Cada topic
ya tiene su `topic-context.md` con la taxonomía completa (tabla de
sub-familias con target y slug, contextos variados, confusiones fuente,
reglas duras propias del topic); este archivo explica el ciclo, el alcance
exacto de la ronda y cómo validar antes de commitear.

Todos los comandos se corren **desde `backend/`**.

---

## Qué es esta ronda

Ninguna unidad del curso llegó nunca a su target real de ejercicios por ítem:
lo que hoy hay en disco, en las 4 unidades por igual, son muestras chicas (1-2
ejercicios por sub-familia, a veces menos), no el contenido completo. Esto se
confirmó auditando la cantidad real de ejercicios de cada `SKILL.json` (ver
tabla de alcance abajo), no por memoria de rondas anteriores.

**Ronda 2 (esta) unifica el target de todo el curso a 15 ejercicios por
ítem**, incluida una baja deliberada de `white/conteo` y `blue/probabilidad`
(que en la planificación original apuntaban a 50) a los mismos 15 que ya
tenían `violet/variables` y `brown/distribuciones`. Como consecuencia, **las
tablas de "Distribución objetivo" de los 12 `topic-context.md` de
`white/conteo` y `blue/probabilidad` ya fueron reescaladas de 50 a 15**
(proporcionalmente, por el método del mayor resto, conservando las mismas
sub-familias y slugs, solo cambiaron las cantidades). No hace falta volver a
tocar esas tablas, ya están en su target final.

**Esto no es una poda.** La cantidad real de ejercicios existentes en disco
está muy por debajo de 15 en absolutamente todos los ítems del curso (entre 1
y 5 según el ítem), así que unificar a 15 es en todos los casos **completar
hacia arriba**, nunca recortar contenido ya escrito.

**Regla de oro:** cada archivo `SKILL.json` de las 4 unidades termina con
**exactamente 15 ejercicios**, con la distribución por sub-familia que ya
está escrita en la tabla de su `topic-context.md` (esas tablas ya suman 15
cada una).

---

## Alcance: 26 topics, 64 ítems

| Unit | Topic | Ítems (skills) |
|------|-------|-----------------|
| white/conteo | reglas | ESTR, FORM, RESL |
| white/conteo | factoriales | FORM, RESL |
| white/conteo | permutaciones | CLSF, FORM, RESL |
| white/conteo | variaciones | CLSF, FORM, RESL |
| white/conteo | combinaciones | CLSF, FORM, RESL |
| blue/probabilidad | espacios | LEXI, CLSF |
| blue/probabilidad | axiomas | LEXI, ESTR, RESL |
| blue/probabilidad | laplace | FORM, RESL |
| blue/probabilidad | condicional | ESTR, FORM, RESL |
| blue/probabilidad | independencia | CLSF, FORM, RESL |
| blue/probabilidad | total | ESTR, FORM, RESL |
| blue/probabilidad | bayes | ESTR, FORM, RESL |
| violet/variables | definicion_var | LEXI, CLSF |
| violet/variables | puntual | FORM, GRAF, RESL |
| violet/variables | densidad | FORM, GRAF, RESL |
| violet/variables | acumulada | FORM, GRAF, RESL |
| violet/variables | esperanza | FORM, RESL |
| violet/variables | varianza | FORM, RESL |
| brown/distribuciones | binomial | CLSF, FORM |
| brown/distribuciones | geometrica | CLSF, FORM |
| brown/distribuciones | hipergeometrica | CLSF, FORM |
| brown/distribuciones | negativa | CLSF, FORM |
| brown/distribuciones | poisson | CLSF, FORM |
| brown/distribuciones | uniforme | GRAF, FORM |
| brown/distribuciones | exponencial | GRAF, FORM |
| brown/distribuciones | normal | GRAF, FORM |

`vectores` (vectores aleatorios) sigue sin cinturón asignado en `course.json`
y queda **fuera de alcance** de esta ronda.

**Cuánto falta por ítem, antes de arrancar cada topic, se audita así** (no
confíes en un número fijo escrito acá, la cantidad real cambia a medida que
avanza la ronda):

```bash
python - <<'EOF'
import json, os
base = "content/probabilidad"
for unit in ["white/conteo", "blue/probabilidad", "violet/variables", "brown/distribuciones"]:
    print(f"\n=== {unit} ===")
    for topic in sorted(os.listdir(os.path.join(base, unit))):
        tpath = os.path.join(base, unit, topic)
        if not os.path.isdir(tpath):
            continue
        skills = []
        for fname in sorted(os.listdir(tpath)):
            if fname.endswith(".json"):
                with open(os.path.join(tpath, fname), encoding="utf-8") as f:
                    skills.append(f"{fname[:-5]}={len(json.load(f))}")
        print(f"  {topic}: {', '.join(skills)}")
EOF
```

**Orden sugerido:** por unidad, `white → blue → violet → brown` (respeta la
dependencia conceptual acumulativa entre unidades: `laplace`/`bayes`
reutilizan combinatoria de `white/conteo`, `brown/distribuciones` reutiliza
`esperanza`/`varianza` de `violet/variables`). Dentro de cada unidad, el
orden de la tabla de arriba. Cerrá un topic completo (todos sus ítems) antes
de pasar al siguiente.

---

## Setup, una sola vez

La branch `content-probabilidad-round2` **ya existe**. No la crees de nuevo:

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

1. `backend/content/authoring-context.md` **completo**. Es la fuente de
   verdad de formato y estilo, por encima de cualquier resumen.
2. `backend/content/probabilidad/course-context.md` (frontera matemática del
   alumno en cada belt).
3. El `generation-instructions.md` del belt del topic, si existe
   (`white/generation-instructions.md`, `blue/generation-instructions.md`).
   `violet`/`brown` todavía no tienen uno propio; referencian esos dos
   mientras no haya reglas específicas de belt.
4. El `topic-context.md` del topic. Ahí está todo el detalle operativo
   específico de este ítem:
   - La tabla de sub-familias con **target exacto (ya en 15) y slug**
     (columna `tags`).
   - "Contextos variados": la lista de escenarios a rotar (tope ~30% del
     mismo contexto dentro de una sub-familia, regla 43 de
     `authoring-context.md`).
   - La regla de **interpretación intuitiva** en `explanation` cuando el
     topic la documenta explícitamente (regla 44 de `authoring-context.md`
     aplica siempre; algunos `topic-context.md` de `violet`/`brown` la
     extienden con una regla específica del topic, seguila si está escrita).
   - Para los ítems `GRAF` de `brown/distribuciones` (`uniforme`,
     `exponencial`, `normal`), la sección **"Diseño de gráficos reales"**:
     qué sub-familia lleva imagen y cuál no, la regla de que el `question`
     nunca repite en texto un dato que el gráfico debería aportar, y la
     regla de **alturas prolijas** (elegir la magnitud de
     $\lambda$/$\sigma$/el intervalo para que el pico caiga en un rango
     ~0,15 a ~1, nunca dejar que el margen del `graph_view` intente
     compensar un dato con mala magnitud de por sí). Salen de testing real,
     no son teóricas: seguilas al pie de la letra. El resto de las unidades
     (`white`/`blue`/`violet`) no usa `GRAF` con imagen real.
5. Los ejercicios ya existentes en el propio `SKILL.json` (los que ya tienen
   `"tags": [...]` con un slug de la tabla). Usalos como **referencia de
   formato exacto** (todos los campos del JSON) y de **tono/nivel** ya
   validado, si el ítem tiene alguno. No los edites ni los borres.

### 2. Planificar (en el chat, antes de tocar el `.json`)

Para el ítem que estés por completar, escribí en el chat una tabla:
sub-familia → target de la tabla → cuántos ya hay (contá el `tags` real del
archivo, no asumas) → cuántos faltan. Elegí, para cada ejercicio nuevo, un
contexto distinto de la lista de "Contextos variados" (rotando, sin repetir
el mismo más del ~30% de las veces dentro de la misma sub-familia) y números
que no dupliquen los ya usados en los ejercicios existentes del mismo ítem.
Mostrá 1 ejercicio de muestra antes de generar el resto del ítem.

### 3. Generar

Agregá los ejercicios nuevos al array del `.json` existente (no crees un
archivo nuevo; si el ítem ya tiene ejercicios, no los toques). Cada ejercicio
nuevo lleva su `tags` con el slug correspondiente de la tabla. Respetá el
esquema completo de campos que ya usan los ejercicios existentes del archivo
(incluidos los de gráfico si el ítem es `GRAF` de una distribución continua,
aunque sean `null` en los que no llevan imagen).

### 4. Seedear (formato + integridad)

```bash
python seed_content.py --course probabilidad
```

Tiene que correr sin errores. Debería reportar el ítem como `updated` (o
`created` si el topic todavía no tenía nada seedeado).

### 5. Validar y reducir errores

```bash
python content/validate_content.py --course probabilidad --topic <belt/unit/topic>
```

Por ejemplo: `python content/validate_content.py --course probabilidad --topic blue/probabilidad/bayes`.

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
completos (no solo sobre los nuevos). Si el belt tiene
`generation-instructions.md` con un checklist de self-critique, corré ese
también. Prestá atención especial a lo que el validador no puede chequear
automáticamente: que la interpretación/intuición de cada `explanation` sea
real y no relleno, que los ejercicios de `GRAF` con imagen (solo en
`brown/distribuciones`) realmente obliguen a mirar el gráfico para resolver,
y que la variedad de contextos entre los 15 ejercicios de un ítem sea
genuina.

### 7. Anotar las decisiones tomadas

Antes de commitear, escribí (o actualizá) un archivo de decisiones en:

```
generation/content-probabilidad-round2/decisions/<belt>/<unit>/<topic>/<SKILL>_decisions.md
```

Por ejemplo: `generation/content-probabilidad-round2/decisions/blue/probabilidad/bayes/ESTR_decisions.md`.
(Mismo patrón de carpetas que `generation/content-analisis-round2/decisions/`,
ver ese directorio como referencia de formato general.) El archivo documenta,
para ese ítem:

```markdown
# Decisiones, <SKILL>.json (topic: <belt>/<unit>/<topic>)

## Plan cumplido

| Sub-familia | Target | Ya había | Generados (ronda 2) | Total |
|---|---:|---:|---:|---:|
| <slug-1> | N | N0 | N-N0 | N |
| <slug-2> | N | N0 | N-N0 | N |
| ... | | | | |
| **Total** | **15** | | | **15** |

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
existente ejercicio por ejercicio en un refactor; acá alcanza con el resumen
por sub-familia más los dos puntos de arriba).

### 8. Commitear (solo si 4, 5 y 6 cierran)

```
content(probabilidad/<belt>/<unit>/<topic>): completar <SKILL> a 15 ejercicios (ronda 2)
```

Un commit por ítem (`SKILL.json`) o uno por topic (todos sus ítems juntos) si
te resulta más cómodo, lo que prefieras. En el cuerpo del commit resumí:
cuántos ejercicios se agregaron, el conteo final por `tags`, y los warnings
que quedaron con su justificación (o referenciá el archivo de decisiones en
vez de repetirlo).

Si algo de 4/5/6 no cierra, **no commitees**: arreglá y repetí desde el punto 4.

---

## Al terminar los 26 topics

1. `python seed_content.py --course probabilidad --prune` desde `backend/`
   (limpia cualquier fila vieja si cambiara la cantidad de algún ítem).
2. Correr `python content/validate_content.py --course probabilidad` (sin
   `--topic`, corre las 4 unidades completas) y confirmar **0 ERRORS** en
   todo el curso, y 0 warnings de `structure (regla tags)` sin justificar
   (ya deberían haber desaparecido al llegar todos los ítems a 15).
3. `bun run scripts/sync-catalog.ts` desde `web/` si cambió algo del catálogo
   (no debería, esta ronda no agrega/quita topics ni skills, solo completa
   ejercicios).
4. Push de la branch y **abrir un PR a `staging`** (no mergees directo a
   `main` ni a `staging` sin revisión — a diferencia de rondas anteriores,
   esta la trabaja otra persona, así que el merge final lo decide quien la
   generó después de que alguien más la pruebe en `/test`).

---

## Reglas de conducta

- `authoring-context.md`, `course-context.md` y los `topic-context.md` son
  **solo lectura** durante la generación. Si encontrás una regla ambigua o un
  target que no cierra (ej. la tabla no suma 15), marcalo en el resumen del
  commit y seguí con tu mejor criterio, no te bloquees esperando respuesta.
- No cambies la cantidad de sub-familias ni sus slugs de ningún
  `topic-context.md` — ya están fijados (incluidas las 12 tablas de
  `white`/`blue` que se reescalaron de 50 a 15 para esta ronda).
- No adelantes conceptos fuera de la frontera matemática de cada belt (ver
  `course-context.md`): nada de `axiomas`/Laplace en `white`, nada de
  variable aleatoria/distribuciones en `blue`, nada de distribuciones
  paramétricas en `violet`, nada de vectores aleatorios/conjuntas/correlación
  en `brown` (esa unidad no tiene cinturón asignado todavía).
- Los ejercicios que ya existen en un `SKILL.json` **no se tocan** salvo que
  tengan un problema real (no solo de estilo). Si al planificar encontrás uno
  con un problema, marcalo en el archivo de decisiones en vez de editarlo
  silenciosamente, y preguntá si conviene corregirlo en esta ronda o dejarlo
  para una posterior.
