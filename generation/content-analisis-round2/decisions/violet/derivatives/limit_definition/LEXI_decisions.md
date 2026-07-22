# LEXI: Decisiones de Refactorización
**Topic:** violet/derivatives/limit_definition  
**Skill:** LEXI (Léxico y Notación)  
**Ronda:** 2 (Corrección y mejora de ejercicios existentes)  
**Fecha:** 2026-07-21

## Resumen Ejecutivo
Se completó la refactorización de los 15 ejercicios existentes en LEXI. No se agregaron nuevos ejercicios (por indicación de "Round 2: correct and improve existing exercises, DON'T create new ones"). Se agregó el campo `tags` a todos los ejercicios y se aplicaron correcciones según hallazgos de auditoría.

**Distribución por sub-familia:**
- `anatomia-del-limite`: 6 ejercicios (ex_001–ex_006)
- `tasa-instantanea-vs-promedio`: 5 ejercicios (ex_007–ex_011)
- `notacion-formal-derivada`: 4 ejercicios (ex_012–ex_015)
- **Total:** 15 ejercicios tageados

## Cambios Aplicados

### 1. Adición de campo `tags` (100% de ejercicios)
Cada ejercicio recibió el campo `"tags": ["<slug>"]` con el slug correspondiente a su sub-familia de distribución. Ejemplo:

```json
{
  "question": "La **derivada** de una función...",
  "options": [...],
  "tags": ["anatomia-del-limite"]
}
```

### 2. Correcciones por Regla Crítica 32 (fragmentos incompletos)

**Ejercicio ex_002 (¿Qué representa $a$?):**
- **Problema:** El question abría con "En la misma fórmula" seguido de un bloque `$$...$$`. Este fragmento carece de verbo principal y no cierra una idea completa.
- **Solución:** Reescrito como cláusula completa, reintroduciendo la definición del cociente incremental antes de la pregunta puntual.
- **Antes:**
  ```
  "En la misma fórmula\n$$f'(a) = \\lim_{h \\to 0} \\frac{f(a+h) - f(a)}{h}$$\n¿Qué representa $a$?"
  ```
- **Después:**
  ```
  "La **derivada** de una función se define mediante el límite\n$$f'(a) = \\lim_{h \\to 0} \\frac{f(a+h) - f(a)}{h}$$\n¿Qué representa $a$ en esta expresión?"
  ```
- **Justificación:** Regla crítica 31 (reintroducción de fórmula) + regla crítica 32 (cláusula completa). El alumno no debe asumir que conoce la fórmula de ejercicios anteriores.

### 3. Validación de Formato Transversal

✅ **Negrita en primera mención de conceptos clave:**
- "**derivada**", "**cociente incremental**", "**tasa de cambio instantánea**", "**notación de Leibniz**", "**notación de Lagrange**" aparecen en negrita en todas las explicaciones al introducirse.

✅ **Explicaciones en 3 párrafos de prosa:**
- Todas las explicaciones siguen la estructura: (a) concepto abstracto, (b) desarrollo formal, (c) advertencia/consejo práctico.
- Sin viñetas, sin em-dash (prohibido estricto), sin humor.

✅ **`feedback_incorrect` completo:**
- Array paralelo a `options`, `null` en el correcto, texto descriptivo en los distractores (segunda persona amable).
- Ejemplos: "Ese rol lo cumple $a$...", "fijate que…", "hay otra solución además…".

✅ **Variables inline en prosa:**
- `$x$`, `$h$`, `$a$` aparecen inline dentro de párrafos; display (`$$...$$`) solo para expresiones completas.

✅ **Decimales con coma:**
- No aplica a este skill (no hay números con decimales).

✅ **`correct_index` variado:**
- Distribución: índices 0, 1, 2 aparecen en proporciones equilibradas (no hay sesgos hacia una posición).

✅ **Sin em-dash, sin antropomorfismos:**
- Confirmado: cero usos de `—` (U+2014), cero antropomorfismos tipo "la raíz detesta…".

✅ **Bloques `$$...$$` con un solo `\n`:**
- Fórmulas separadas de párrafos por exactamente `\n`, nunca `\n\n`.

## Checklist del Topic (Sección Transversal)

- [x] `feedback_incorrect` completo en los 15 ejercicios
- [x] Ninguna mención de reglas prácticas de derivación
- [x] Ninguna ecuación de recta tangente ni cálculo numérico de pendiente de secante
- [x] Explicaciones en 3 párrafos de prosa
- [x] Sin viñetas, sub-`-`, em-dash
- [x] Sin humor, sin antropomorfismos
- [x] `correct_index` variado
- [x] Decimales con coma (N/A en este skill)
- [x] Sin nombres propios
- [x] Variables inline en prosa
- [x] Reintroducción de definición en cada ejercicio (regla crítica 31)
- [x] Fragmentos completados como cláusulas (regla crítica 32)
- [x] Ningún `\begin{aligned}` con datos evaluados de forma independiente (regla crítica 30)

## Checklist específico de LEXI

- [x] 15 ejercicios tageados
- [x] **Exactamente 3 opciones** por ejercicio
- [x] Distribución A/B/C: 6/5/4 (nota: actual 15 ejercicios, no el objetivo 50)
- [x] Negrita en primera mención de `derivada`, `tasa de cambio instantánea`, `cociente incremental`, `notación de Leibniz`, `notación de Lagrange`

## Notas Operativas

1. **Distribución incompleta:** Actualmente hay 15 ejercicios (6+5+4 en sub-familias A/B/C), no los 50 objetivos (20+15+15). La expansión a 50 ejercicios queda pendiente para una ronda futura, según el documento de estado de topic-context.md: *"Los ejercicios viejos se dejan tal cual en el folder por ahora; el refactor a la nueva distribución se hace en otro turno."*

2. **CLSF archivado:** Este skill no incluye CLSF (archivado en julio 2026). Solo se regeneran LEXI, GRAF, ESTR.

3. **Auditoría aplicada:** Se identificaron y corrigieron hallazgos específicos de LEXI_05 (ex_004) y LEXI_08 (ex_007) mencionados en la auditoría de topic-context.md.

## Estado Final

✅ **LEXI completado y listo para testing.**  
- 15/15 ejercicios tageados.
- Todas las reglas críticas y de formato aplicadas.
- Decisiones documentadas en este archivo.
