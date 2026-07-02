# Agent context, aprendizajes para diseñar topic-context.md

> **Audiencia:** este archivo es para el agente (Claude) que asiste al usuario en configurar `topic-context.md` de nuevos topics. **NO es para la Gem de Gemini.** La Gem tiene sus propias reglas en `gem-instructions.md`.
>
> **Propósito:** compilar los aprendizajes de las iteraciones LEXI/definition (jun-2026) para reutilizarlos al configurar futuros topics. Cada punto acá viene de un fallo o acierto observado en un audit real, no de intuiciones.

---

## Contexto general del sistema

El pipeline es:
1. El usuario define un `topic-context.md` con la ayuda del agente.
2. El usuario pega el `topic-context.md` en un chat de una Gem de Gemini (ya configurada con `authoring-context.md`, `gamification-context.md`, `gem-instructions.md`).
3. La Gem devuelve `SKILL.json` + `SKILL_decisions.md`.
4. El usuario audita, seedea, y prueba en la app.

El `topic-context.md` es lo único que cambia entre topics. Sus errores de diseño se pagan caro porque la Gem no los detecta, los replica ítem por ítem.

---

## Cosas que la Gem hace bien sin ayuda extra

No hace falta reforzarlas en el `topic-context.md`:

- Estructura JSON: `question`, `options`, `correct_index`, `feedback_incorrect` como array del mismo largo con `null` en el índice correcto.
- Cardinalidad 3 en LEXI/CLSF (una vez explicitada en el `authoring-context.md`).
- Formato de párrafos y bloques `$$...$$` (una vez con ejemplos ❌/✅).
- `\$` para dinero.
- Sin nombres propios.
- Escapado JSON correcto (después de la primera iteración fallida).

Estos ya están cubiertos por `authoring-context.md` y `gem-instructions.md`. **No los duplicar en el `topic-context.md`**, hincha el archivo sin ganancia.

---

## Cosas que la Gem hace mal sistemáticamente, y cómo prevenirlas

### 1. Rellena buckets vagos con contenido de otros buckets

Si el `topic-context.md` incluye un bucket llamado "contexto general" u "otros", la Gem va a llenar ese cupo con ítems de otros conceptos ya cubiertos, disfrazándolos ligeramente. En LEXI/definition, "contexto general (6 ítems)" terminó siendo 4 items de imagen puntual + 2 de preimagen puntual.

**Cómo prevenirlo:**
- **Nunca dejar un bucket vago.** Todo cupo debe tener una definición clara y ejemplos.
- Si necesitás capturar variantes del mismo concepto (ej. "imagen como conjunto" vs. "imagen puntual"), **usá sub-tipos explícitos con cantidad exacta** en vez de un bucket "otros".
- Si un concepto no aporta ítems distintos, **no lo agregues al cupo**, mejor 44 ítems bien definidos que 50 con 6 rellenos.

### 2. Sobre-representa el concepto más fácil de escribir

Sin cupos estrictos, la Gem sobre-representa el concepto con más contextos cotidianos disponibles. En LEXI/definition fue "unicidad" (10 ítems vs. target 4-5 en las primeras iteraciones) porque "una entrada con dos salidas" admite infinitas variantes (asientos, casilleros, descuentos, etc.).

**Cómo prevenirlo:**
- Cupos con número **exacto**, no rangos ("4", no "4-5").
- Frase explícita en el archivo: "Cantidades exactas, no aproximadas."
- El `gem-instructions.md` ya obliga al planning con contador `(k/N)`. Al llegar a `N/N`, ese concepto se cierra.

### 3. Sustituye contextos específicos por "equivalentes"

Si pedís "cajero automático con dos saldos", la Gem lo sustituye por "supermercado con dos precios" u otro contexto parecido. En iter 1 pasó con los 2 obligatorios de unicidad práctica.

**Cómo prevenirlo:**
- **Enumerar textualmente** los contextos obligatorios en el `topic-context.md`.
- Marcar como "OBLIGATORIO, no negociable" (mayúsculas, negrita).
- `gem-instructions.md` ya dice "o los generás textual o los marcás como `[PENDIENTE]`". Confirmar que la sección obligatoria del `topic-context.md` sea idéntica en fraseo a la que aparece en `gem-instructions.md` para que la Gem las cruce.

### 4. Ignora "1-2" o "al menos" en cantidades

"Incluir al menos 1-2 ítems que…" fue interpretado como "opcional". La Gem no lo generó nunca.

**Cómo prevenirlo:**
- Nunca usar "al menos", "idealmente", "sería bueno". Solo "exactamente N ítems".
- Todo cupo secundario también debe tener número exacto.

### 5. Comprime `explanation` cuando se compacta `question`

Reglas de compresión aplicadas a `question` (60 palabras, sin adjetivos decorativos) contaminan `explanation`. Aparecen explanations de 220-249 chars cuando el piso es 250.

**Cómo prevenirlo:**
- Esto se cubre en `gem-instructions.md` explicitando "el límite de 60 palabras aplica solo a `question`, NO a `explanation`". No hace falta repetirlo en el `topic-context.md`.

### 6. Salta negrita de concepto cuando la pregunta es corta

Si la question del ítem es corta y termina en "¿cuál es el dominio?", la Gem tiende a olvidar la negrita en `**dominio**`.

**Cómo prevenirlo:**
- Cubierto en `gem-instructions.md`. Si aparece de nuevo, reforzar el bullet del self-critique con "verificá ítem por ítem, incluso si la palabra aparece dentro de una pregunta corta".
- Adicionalmente en `explanation`: la Gem tiende a olvidar la negrita en la **primera oración** de la explicación ("El dominio es el conjunto de entradas…" sin `**dominio**`). Es el caso más frecuente de regresión, incluso cuando en `question` sí se cumple. Hay un bullet dedicado en el self-critique de `gem-instructions.md` para esto.

### 7. Baja calidad de redacción en ítems generados desde cero (vs. refactorizados)

Cuando la Gem hace un refactor con reemplazos parciales (ej. agregar 4 ítems nuevos a un JSON existente de 46), los ítems compuestos desde cero tienen redacción más artificial que los mantenidos. Observado en iter 4:

- "Una regla transforma **abstractamente y sin demora** cada ingreso numérico"
- "La regla matemática **milenaria** determina un **gran volumen** de cubo"
- "Una **inflexible** tarifa telefónica **local** calcula cobros **a medida guiándose libre de** los minutos"

Los ítems mantenidos heredan la calidad del original. Los nuevos degradan.

**Cómo prevenirlo:**
- Cuando el batch nuevo es grande (5+ ítems), pedirlo como generación limpia separada, no como refactor incremental.
- Para batches chicos (1-4 nuevos), hacer una segunda pasada solo sobre los ítems marcados como "nuevo" en el `.md`, pedir "revisá los ítems 47-50 y corregí adjetivos decorativos y construcciones forzadas".

### 8. Colapso del `.md` de decisiones en modo refactor

Sin regla explícita, la Gem interpreta que en un refactor solo necesita detallar los cambios. En iter 4 entregó:

```
## Ítem 1 a 50
Se siguieron las reglas de distribución y formato...
* Ítem 13: cajero, implementado.
* Ítem 47: nuevo (restaurante).
* Ítem 48-50: nuevos.
```

Y perdimos la auditabilidad por ítem que era el motivo principal del archivo.

**Cómo prevenirlo:**
- Cubierto en `gem-instructions.md` Constraint 12: "el `.md` se genera completo con los N ítems del target, no como resumen. Los ítems no modificados llevan la nota `, sin cambios respecto de iter N`".

### 9. La lista veto de adjetivos siempre queda corta

Cada iteración descubre sinónimos nuevos: iter 3 → "artesanal", "electrónico"; iter 4 → "milenario", "inflexible", "genuino", "abstractamente", "natural", "local", "total".

**Cómo prevenirlo:**
- El `gem-instructions.md` ahora usa una **regla positiva** en Constraint 13: "el enunciado usa solo palabras que aportan información necesaria para responder la pregunta. Antes de escribir un adjetivo, preguntate: '¿si lo saco, cambia el problema?'". Esto reemplaza la lista veto como fuente de verdad.
- La lista veto se mantiene como ayuda mnemotécnica pero **no es la regla**. Cualquier adjetivo decorativo nuevo va contra la regla positiva aunque no esté en la lista.

### 10. AI Studio y la Gem web no son equivalentes en modo refactor

Con exactamente el mismo `.md` de instrucciones, la Gem web y AI Studio dan outputs distintos:

- **Gem web** aplica reglas a todo el output, incluso a ítems no modificados. Bien para respetar `gem-instructions.md` completo. Mal para calidad de redacción de ítems nuevos (introduce adjetivos raros como "milenaria", "inflexible", "abstractamente").
- **AI Studio** interpreta "refactor" más literal: conserva la estructura histórica de los ítems no modificados (cardinalidad 4, sin negrita si no la tenía) y solo aplica reglas a los ítems que reemplaza. Bien para calidad de redacción de ítems nuevos (contextos concretos, sin adjetivos raros). Mal para aplicar reglas globales (iter 5 dejó 45/50 con cardinalidad 4 cuando la regla es 2-3).

**Cómo prevenirlo:**
- El `gem-instructions.md` ahora tiene un párrafo dedicado en Paso 1: "en modo refactor aplicás TODAS las reglas actuales a TODOS los ítems, no solo a los que decidís reemplazar". Esto es para forzar el comportamiento de la Gem web en AI Studio.
- Alternativa: dividir el trabajo en dos pasadas cuando la calidad importa más que la eficiencia, (a) regenerar los ítems mantenidos aplicando reglas nuevas (usar Gem web); (b) agregar los nuevos con redacción limpia (usar AI Studio).
- **La calidad de la redacción es intrínseca al generador; las reglas mecánicas son intrínsecas al prompt.** No confundir las dos.

### 11. La regla de negrita en `explanation` es la más regresada de todas

3 iteraciones seguidas fallaron (iter 3: 8; iter 4: 15; iter 5: 22, está empeorando). Los refuerzos verbales del checklist ("verificá ítem por ítem") no bastan.

**Cómo prevenirlo:**
- Convertir la verificación en **pasada mecánica final** en el self-critique. Formulación en `gem-instructions.md`: "para cada uno de los 50 ítems, buscá en la `explanation` la primera aparición literal de `dominio`/`imagen`/`codominio`/`preimagen`/`unicidad`; si no está envuelta en `**...**`, envolvela ahora". Trabajarlo como find & replace masivo, no como criterio estético.
- La pasada mecánica funcionó: iter 6 bajó a 3 casos (contra 22 de iter 5).
- Si la regla sigue regresando, la próxima escalada es correr el script de audit y devolverle el output a la Gem con "estos son los ítems que faltaron, corregilos y reenviá".

### 12. Sesgo de `correct_index` hacia la posición 0

En iter 6 los 50/50 ítems tenían `correct_index: 0`. No lo habíamos detectado antes porque el frontend randomiza las opciones al render, así que el sesgo era invisible para el alumno pero real en el JSON. Es un problema de diseño de dataset (auditorías estadísticas, exportación a otras plataformas) más que de experiencia.

**Cómo prevenirlo:**
- Constraint 14 explícita en `gem-instructions.md`: "distribuí `correct_index` entre 0, 1 y 2 de forma aproximadamente uniforme".
- Bullet mecánico en el self-critique: contar la distribución al final y rebalancear (reordenar `options` + `feedback_incorrect` en paralelo) si más del 50% cae en la misma posición.
- No requiere cambio en `topic-context.md`. Es transversal a todos los topics.

### 13b. `feedback_incorrect` en voz acusatoria en tercera persona

Regresión iter 7: ~24 casos de `feedback_incorrect` arrancando con "Confunde X con Y", "Invierte la relación", "Olvida el negativo", "Interpreta mal". Suenan a diagnóstico frío sobre el alumno, no a pista amable. La causa parece ser que la Gem tomó al pie de la letra "nombra el error" y lo formuló como sentencia sobre el estudiante.

**Cómo prevenirlo:**
- Regla explícita en `authoring-context.md` sección *Pistas de feedback_incorrect*: prohibición de arrancar con `Confunde`/`Invierte`/`Olvida`/`Ignora`/`Interpreta`/`Falla`/`Falta`, con ejemplos ❌/✅.
- Constraint 15 en `gem-instructions.md` con la misma prohibición explícita.
- Bullet mecánico en el self-critique: escanear cada `feedback_incorrect[i]` contra la lista prohibida y reescribir.
- Voces permitidas: (a) descriptiva del concepto ("Ese es el codominio, no la imagen…"); (b) segunda persona amable con tuteo ("Hay otra solución además del 5…").

### 12c. Cardinalidad binaria abusiva en items conceptuales o numéricos

Regresión detectada en iter 7 (LEXI/definition, después de la primera pasada de correcciones): 22 de 50 ítems quedaron con 2 opciones (binario). Aun cuando cada binario era técnicamente válido (dos confusiones plausibles), el **conjunto** resultaba demasiado fácil — el alumno no debe poder tirar una moneda 22 veces. Además, los ítems numéricos con 2 opciones desperdiciaban espacio: en el frontend hay una grilla 2×2 disponible cuando `length === 4 && all(o.length <= 35)`.

**Cómo prevenirlo:**
- Regla operativa en `authoring-context.md` sección *Cardinalidad de opciones por skill* (rehecha): la cardinalidad depende del **tipo de respuesta**, no del skill.
  - Respuesta numérica corta → 4 opciones (triggea grilla 2×2 en frontend).
  - Respuesta conceptual/textual → 3 opciones.
  - Binario → excepcional (≤ 3 ítems en un archivo de 50).
- Constraint 20 en `gem-instructions.md` explícito.
- Bullet mecánico en el self-critique: contar la distribución y rebalancear.
- **Referencia frontend**: `web/src/app/(app)/session/[sessionId]/session-runner.tsx` líneas 293-295 (heurística de grilla).

### 12b. Distractores numéricos con magnitud descartable por gut-check

Regresión detectada en iter 7 (ítems 45 y 48 de LEXI/definition): el distractor "canónico" para preimagen es `$f(y)$` en vez de `$f^{-1}(y)$` (confundir despejar con evaluar). Formalmente es una confusión clásica documentada. En la práctica, si `$f(y)$` da un número muy distinto en magnitud a la correcta (ej. correcta $5$, distractor $185$; correcta $\pm 5$, distractor $625$), el alumno descarta el distractor a ojo sin razonar. El error no se diagnostica: solo se filtra por tamaño.

**Cómo prevenirlo:**
- Regla explícita en `authoring-context.md` sección *Distractores del mismo orden de magnitud*: ratio máximo aceptable ~3-5× entre correcta y distractor numérico.
- Constraint 18 en `gem-instructions.md`.
- Bullet mecánico en el self-critique: calcular ratio y reemplazar si supera 3-5×.
- **Reemplazos válidos**: errores aritméticos plausibles del mismo orden. Ej. `$5a + 10 = 35$` → distractor `$6$` (restó $5$ en vez de $10$), no `$185$` (evaluó $C(35)$).
- **Excepción documentada**: cuando la confusión intrínseca produce magnitud distinta (ej. lectura de porcentaje `8%` → `8` vs `1,08`), el gap grande es parte del error, no bandera roja.

### 13. Humor y antropomorfismos se filtran al cuerpo de la explicación

En iter 6 aparecieron frases como "la raíz cuadrada detesta a los negativos" o "la regla se cansa de emitir respuestas rotativas" dentro del cuerpo de la explanation (definición o aplicación), no solo en el cierre. La regla original de `authoring-context.md` decía humor "al final", pero la Gem lo interpretaba flojo.

**Cómo prevenirlo:**
- Constraint 15 explícita: humor y antropomorfismos **exclusivamente** en el cierre (tercera parte de la explanation).
- Reforzado en `authoring-context.md` en la sección *Reglas críticas* (bullet 5) y en *Estructura de la explicación*.
- No requiere cambio en `topic-context.md`.

---

## Estructura recomendada para un `topic-context.md`

Basado en lo que funcionó en `definition`:

```markdown
# Topic: <nombre>

Belt: `<belt>`, Unit: `<unit>`, Topic: `<topic>`

Skills en este topic: `SKILL1`, `SKILL2`.

---

## SKILL1, N ítems

### Distribución objetivo

Tabla con concepto | sub-tipo | cantidad exacta. Sumar exactamente N.
Enfatizar "cantidades exactas, no aproximadas".
Enfatizar "no hay bucket 'contexto general', si un ítem no encaja, descartalo".

### <Concepto especial con obligatoriedad>

Cupo estricto: N ítems. Enumerar textualmente los ítems obligatorios con sus contextos específicos.
"OBLIGATORIO, no negociable."

### Cardinalidad

Ya está en `authoring-context.md` como regla global. Solo mencionar acá excepciones específicas de este skill.

### `feedback_incorrect`, confusiones típicas

Tabla: concepto preguntado | confusión a diagnosticar. Es la fuente directa de distractores.

### Reglas específicas del topic

Solo las que no están cubiertas por `authoring-context.md`. Ej: qué términos van en negrita en primera mención (para este topic), qué contextos son válidos, qué distinciones semánticas cuidar (ej. "inyectiva ≠ unicidad").

---

## SKILL2, N ítems

...

---

## Checklist del topic

Al final, checklist específico. No repetir el checklist global de `gem-instructions.md`.
```

---

## Qué NO poner en el `topic-context.md`

- Reglas de formato JSON, LaTeX, párrafos, escape de caracteres, van en `authoring-context.md`.
- Reglas de flujo, output format, cardinalidad global, van en `gem-instructions.md`.
- Rationale de Core Drives o Sistema 1/2, va en `gamification-context.md`.
- El checklist global de self-critique, va en `gem-instructions.md`.

El `topic-context.md` es exclusivamente **qué generar** para este topic. No cómo escribir ni por qué.

---

## Cómo iterar con la Gem, proceso comprobado

1. **Primer batch chico de testing.** Pedirle 5 ítems primero, no 50. Auditar. Ver qué reglas ignoró.
2. **Comparar `.md` de decisiones con conteo real.** Contar manualmente los ítems del JSON y compararlos con lo que declaró la Gem en el `.md`. Discrepancias entre plan y realidad son la fuente principal de bugs de distribución.
3. **Fijar cupos exactos si sobre-representa un concepto.** Nunca dejar rangos ("4-5"), nunca dejar buckets vagos.
4. **Enumerar textualmente contextos obligatorios.** La Gem los sustituye si son opcionales.
5. **Cuando algo funciona, no tocarlo.** Cada regla nueva puede causar regresión en otras. Iter 3 introdujo "60 palabras" y compactó `explanation` como efecto secundario.

---

## Adjetivos decorativos detectados (lista viva)

Detectados en outputs reales de la Gem. **La lista no es la regla, la regla es la positiva del Constraint 13**. Esta lista sirve solo como ayuda mnemotécnica para el script de audit y para acelerar detección visual.

**Iter 1-3:** `artesanal`, `moderno`, `automatizado`, `eficiente`, `estratégico`, `innovador`, `digital`, `inteligente`, `electrónico`, `sofisticado`, `complejo`, `urbano`, `avanzado`.

**Iter 4 (nuevos):** `milenario`, `inflexible`, `genuino`, `natural` (en "arista natural"), `local` (en "tarifa local"), `total`, `oficial`, `regulado`, `abstractamente`, `directo`, `general` (en "precios globales"), `estándar`.

Cada iteración descubre sinónimos nuevos. **No sirve seguir engordando la lista;** la regla positiva ("¿aporta información necesaria?") es lo que hay que reforzar.

Si un output futuro trae un adjetivo decorativo nuevo, agregarlo acá para el script de audit, pero no agregarlo al `gem-instructions.md` como veto explícito, porque el veto por lista no escala.

---

## Script de audit, dónde vive

El script Python de auditoría automática vive en:
`C:\Users\ADMINI~1\AppData\Local\Temp\claude\C--Users-Administrator-intervalo\<session>\scratchpad\audit*.py`

No está versionado. Si se pierde, reconstruirlo con estos checks mínimos:

- `fi_length_mismatch`: `feedback_incorrect` debe tener el mismo largo que `options`.
- `fi_correct_not_null`: el índice de `correct_index` en `feedback_incorrect` debe ser `null`.
- `negrita_en_options`: ningún `**...**` dentro de `options`.
- `formato_bloque_display_Q/E`: ningún `\n\n$$` ni `$$\n\n` en `question` ni en `explanation`.
- `explanation_menos_250`: `len(explanation) >= 250`.
- `concepto_sin_negrita_Q/E`: primera mención de conceptos clave del topic debe estar en `**...**`.
- `dinero_sin_escapar`: `$` seguido de dígito, no precedido por `\`.
- `adjetivos_decorativos`: lista de arriba.
- `question_over_60_words`: `question` completa (excluyendo `$$...$$`) no supera 60 palabras.
- Validación de wrapper: el archivo debe ser un array `[...]`, no `{"filename": ..., "content": [...]}`.
- Conteo por concepto vs. target del `topic-context.md`.
