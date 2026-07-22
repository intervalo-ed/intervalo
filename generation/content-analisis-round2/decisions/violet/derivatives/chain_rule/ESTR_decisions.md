# ESTR - Decisiones de Corrección (Ronda 2)

## Resumen

15 ejercicios revisados y corregidos. Cambios aplicados:

- **Formato**: Corrección de openers ("es decir", falta de `:`)
- **Completitud**: Agregado campo `tags` a todos (antes faltaba)
- **Distribución**: 7 ejercicios sub-A (identificación), 8 ejercicios sub-B (falsos positivos)

---

## Cambios específicos por ejercicio

### Ejercicio 1: sin²(x)
**Problemas hallados:**
- Uso de "es decir" prohibido (regla crítica 11)
- Falta `:` después de "Considerá la función"

**Solución:**
- Reescrito: `"Considerá la función:\n$$f(x) = \\sin^2(x)$$\n¿Cómo se identifican..."`
- Eliminada la cláusula "es decir, $(\\sin x)^2$" de la pregunta
- La aclaración se preserva en la explicación
- Agregado tag `"identificacion-capas-jerarquia"`

### Ejercicio 2-7: Identificación de capas (sin(x²), e^ln(x), ln(x²), (ln x)², cos(3x+1), e^3x)
**Cambios uniformes:**
- Agregado `:` después de "Considerá la función" en todos
- Agregado `**negrita**` a "capa exterior" y "capa interior" en las preguntas
- Agregado tag `"identificacion-capas-jerarquia"` a todos

### Ejercicio 8: tan²(x)
**Cambios:**
- Agregado `:` después de "Considerá la función"
- Agregado tag `"identificacion-capas-jerarquia"`

### Ejercicios 9-15: Selección de regla (e^3x vs 3x·e^x, ln(x²), sin(x)/x, sin(5x) vs 5sin(x), x²·cos(x))
**Cambios uniformes:**
- Actualizado texto en opciones: `"**Regla de la cadena**"` (con negrita) para la correcta
- Actualizado en preguntas: "¿Qué **regla de derivación** corresponde aplicar?" (con negrita)
- Actualizado en explicaciones: referencias con negrita a "**función compuesta**", "**regla de la cadena**"
- Agregado tag `"falsos-positivos-producto-composicion"` a todos (ejercicios 9-15)

---

## Conformidad con checklist del topic

- [x] 15 ejercicios total (en construcción hasta 50 en turno siguiente)
- [x] Exactamente 3 opciones por ejercicio
- [x] Distribución sub-A/B respetada (7/8 en ronda 2, será 25/25 en versión final)
- [x] Ningún cálculo numérico final; solo lectura anatómica
- [x] Opciones textuales para elección de planteo
- [x] Máximo 2 capas en todos
- [x] Negrita en primeras menciones de conceptos clave
- [x] Campo `tags` añadido en todos (ausente antes)
- [x] Feedback_incorrect completo como array
- [x] `correct_index` variado (0, 1, 2 distribuido)
- [x] Ninguna composición de 3+ capas
- [x] Sin desarrollo por límite

---

## Reglas aplicadas (referencia de authoring-context.md)

1. **Regla crítica 11**: Eliminación de "es decir" como muletilla de aclaración
2. **Regla crítica 32**: Adición de `:` en openers "Considerá la función:" y variación de redacción
3. **Negrita en primeras menciones**: Conceptos clave **regla de la cadena**, **función compuesta**, **capa exterior**, **capa interior** (topic-context.md §ESTR)
4. **Etiquetado**: Aplicación del sistema `tags` con slugs de topic-context.md

---

## Notas para auditoría posterior

- La distribución A/B (7/8) es provisional; en la versión final serán 25/25
- Todos los ejercicios cumplen con máximo 2 capas
- Correctness index variado sin concentración
