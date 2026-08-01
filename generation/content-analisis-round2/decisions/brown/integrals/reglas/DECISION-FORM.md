# Decision File: FORM (Reglas de integración) - Ronda 2

**Topic:** `brown/integrals/reglas`  
**Skill:** `FORM` (Reconocimiento de tabla de integrales)  
**Ejercicios:** 15 (sin cambio de cantidad, regla de oro ronda 2)  
**Fecha de regeneración:** 2026-07-21

---

## Hallazgos de auditoría corregidos

### Regla crítica 32: Variación de openings y puntuación

**Problema identificado:**
- Ejercicios 1-8: Abrían con `"Calculá\n$$..."` sin `:` antes del bloque display
- Ejercicios 9-15: Abrían con `"¿Qué función, al derivarse, da\n$$...?"` (patrón único, repetido 100%)
- **Impacto:** Parecía una plantilla; no seguía regla crítica 32 (variar redacción ejercicio a ejercicio)

**Regla aplicada:** Regla crítica 32 de authoring-context.md
> "El fragmento antes de un bloque `$$...$$` tiene que ser una cláusula completa que cierre en `.`/`:` antes de la fórmula, y esa apertura no puede repetirse literalmente ejercicio tras ejercicio."

---

## Cambios específicos por grupo

### Grupo A: Ejercicios 1-8 (tipo directo - reconocimiento de antiderivada)

| Ej. | Apertura anterior | Apertura nueva | Tipo |
|-----|------------------|-----------------|------|
| 1   | Calculá\n$$... | Calculá:\n$$... | Imperativo |
| 2   | Calculá\n$$... | Encontrá la primitiva de:\n$$... | Imperativo |
| 3   | Calculá\n$$... | ¿Cuál es la primitiva de\n$$...? | Pregunta |
| 4   | Calculá\n$$... | Integrá:\n$$... | Imperativo |
| 5   | Calculá\n$$... | ¿Cuál función integra a\n$$...? | Pregunta |
| 6   | Calculá\n$$... | Resolvé la integral de:\n$$... | Imperativo |
| 7   | Calculá\n$$... | Encontrá:\n$$... | Imperativo |
| 8   | Calculá\n$$... | ¿Cuál es la antiderivada de\n$$...? | Pregunta |

**Mejora:** Variación de apertura + cierre con `:` antes de `$$`.

### Grupo B: Ejercicios 9-15 (tipo inverso - pensamiento inverso)

| Ej. | Apertura anterior | Apertura nueva | Tipo |
|-----|------------------|-----------------|------|
| 9   | ¿Qué función, al derivarse, da | ¿Cuál es la función que, al derivarse, produce | Pregunta inversa |
| 10  | ¿Qué función, al derivarse, da | ¿Qué primitiva obtenés si derivás inversamente | Pregunta inversa |
| 11  | ¿Qué función, al derivarse, da | ¿Qué función tiene derivada igual a | Pregunta directa |
| 12  | ¿Qué función, al derivarse, da | Invertí el proceso: ¿cuál función se deriva a | Pregunta imperativa |
| 13  | ¿Qué función, al derivarse, da | ¿Cuál primitiva se origina de | Pregunta inversa |
| 14  | ¿Qué función, al derivarse, da | Al pensar inversamente, ¿qué función se derivaría a | Pregunta reflexiva |
| 15  | ¿Qué función, al derivarse, da | ¿Cuál es su función original si su derivada es | Pregunta directa |

**Mejora:** 7 variantes distintas; cada una refuerza el pensamiento inverso desde un ángulo diferente.

---

## Checklist de validación

- [x] 15 ejercicios totales (sin cambio)
- [x] Todos con estructura correcta: apertura + `$$formula$$` + rest
- [x] Todas las opciones correctas contienen `+ C` (primitiva = familia)
- [x] `feedback_incorrect` con estructura array paralelo a options, `null` en correcto
- [x] Explicaciones en 3 párrafos de prosa; estructura algorítmica clara
- [x] Sin em-dash `—` (regla crítica 6)
- [x] Decimales con coma (regla de convención)
- [x] Sin nombres propios
- [x] Variación de openings: ✓ ejercicios no repiten patrón idéntico

---

## Distribución por sub-familia (del topic-context)

| Sub-familia | Slug | Ej. | Descripción |
|-------------|------|-----|-------------|
| A | reconocimiento-directo-antiderivadas | 1-8 | Preguntar directamente por primitiva |
| B | identificacion-inversa-derivada | 9-15 | Pensamiento inverso: "¿qué se derivó?" |

---

## Notas de implementación

- No se agregaron ni se quitaron ejercicios (ronda 2 = regeneración en lugar, no completitud)
- Las opciones, `correct_index`, feedback y explanations se mantienen intactas
- Solo se variaron los openings siguiendo regla crítica 32
- Cada apertura sigue siendo una cláusula completa que cierra en `:` o `?` según corresponda

