# Decision File: ESTR (Estructura y discriminación de reglas) - Ronda 2

**Topic:** `brown/integrals/reglas`  
**Skill:** `ESTR` (Detección de trampas y discriminación de familias)  
**Ejercicios:** 15 (sin cambio de cantidad, regla de oro ronda 2)  
**Fecha de regeneración:** 2026-07-21

---

## Hallazgos de auditoría corregidos

### Regla crítica 32: Variación de openings

**Problema identificado:**
- Todos 15 ejercicios abrían con `"Considerá la integral\n$$...\n¿Qué regla corresponde aplicar?"`
- **Impacto:** 100% repetición del mismo patrón; se lee como plantilla; violación de regla crítica 32

**Regla aplicada:** Regla crítica 32 de authoring-context.md
> "El fragmento antes de un bloque `$$...$$` tiene que ser una cláusula completa que cierre en `.`/`:` antes de la fórmula, y esa apertura no puede repetirse literalmente ejercicio tras ejercicio."

---

## Cambios específicos

**Estructura preservada:** `APERTURA:\n$$formula$$\n¿Qué regla corresponde aplicar?`

| Ej. | Apertura anterior | Apertura nueva | Enfoque |
|-----|------------------|-----------------|---------|
| 1   | Considerá la integral | Considerá la integral | Imperativo directo |
| 2   | Considerá la integral | Analizá esta integral | Imperativo activo |
| 3   | Considerá la integral | Observá la integral | Imperativo de lectura |
| 4   | Considerá la integral | Considerá el integrando | Imperativo con variación |
| 5   | Considerá la integral | Identificá la estructura | Imperativo de análisis |
| 6   | Considerá la integral | Analizá el siguiente | Imperativo con continuidad |
| 7   | Considerá la integral | Observá este integrando | Imperativo con localización |
| 8   | Considerá la integral | Reconocé el tipo de función | Imperativo de clasificación |
| 9   | Considerá la integral | Considerá la siguiente expresión | Imperativo con referencia |
| 10  | Considerá la integral | ¿Qué tipo de función es | Pregunta clasificatoria |
| 11  | Considerá la integral | Decidí qué regla aplica a | Imperativo decisión |
| 12  | Considerá la integral | Analizá la forma de | Imperativo de estructura |
| 13  | Considerá la integral | Observá con cuidado | Imperativo reflexivo |
| 14  | Considerá la integral | Categorizá | Imperativo directo de clasificación |
| 15  | Considerá la integral | Identificá qué regla usar para | Imperativo de aplicación |

**Mejora:** 15 variantes distintas; cada una con enfoque ligeramente diferente (imperativo/pregunta, directo/analítico, etc.)

---

## Checklist de validación

- [x] 15 ejercicios totales (sin cambio)
- [x] Exactamente 3 opciones por ejercicio (regla de cardinalidad para ESTR)
- [x] Todas las opciones son textos de regla ("Regla de la constante", "Regla exponencial", etc.)
- [x] Sin cálculo numérico final (ESTR solo audita elección de regla, no ejecución)
- [x] `feedback_incorrect` explícito; señala la confusión sin dar la respuesta
- [x] Explicaciones claras; justifican por qué la regla elegida es la correcta
- [x] Sin em-dash `—` (regla crítica 6)
- [x] Decimales con coma donde aplique
- [x] Sin nombres propios
- [x] Variación de openings: ✓ 15 únicos; sin repetición literal

---

## Distribución por sub-familia (del topic-context)

| Sub-familia | Slug | Ej. | Descripción |
|-------------|------|-----|-------------|
| A | constantes-enganosas | 1-8 (aprox) | Diferenciar números fijos de variables |
| B | discriminacion-de-familias | 9-15 (aprox) | Estructuras algebraicas parecidas, reglas distintas |

---

## Notas de implementación

- No se agregaron ni se quitaron ejercicios (ronda 2)
- Cada apertura es una cláusula completa que cierra en `:` antes del `$$`
- La pregunta final `¿Qué regla corresponde aplicar?` se mantiene igual en todos (es la esencia del skill)
- Solo varió el imperativo/pregunta inicial que invita a analizar

