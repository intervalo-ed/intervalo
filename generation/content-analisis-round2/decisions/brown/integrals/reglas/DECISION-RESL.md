# Decision File: RESL (Resolución de cálculo integral) - Ronda 2

**Topic:** `brown/integrals/reglas`  
**Skill:** `RESL` (Ejecución técnica: linealidad + tabla)  
**Ejercicios:** 15 (sin cambio de cantidad, regla de oro ronda 2)  
**Fecha de regeneración:** 2026-07-21

---

## Hallazgos de auditoría corregidos

### Regla crítica 32: Variación de openings y puntuación

**Problema identificado:**
- Todos 15 ejercicios abrían con `"Calculá\n$$..."` sin `:` antes del bloque display
- **Impacto:** 
  - Falta el `:` que cierre la cláusula completa (regla crítica 32)
  - 100% repetición idéntica de apertura (parecía plantilla)

**Regla aplicada:** Regla crítica 32 de authoring-context.md
> "El fragmento antes de un bloque `$$...$$` tiene que ser una cláusula completa que cierre en `.`/`:` antes de la fórmula, y esa apertura no puede repetirse literalmente ejercicio tras ejercicio."

---

## Cambios específicos

**Estructura:** `APERTURA:\n$$formula$$` o `¿PREGUNTA\n$$formula$$?`

| Ej. | Apertura anterior | Apertura nueva | Tipo |
|-----|------------------|-----------------|------|
| 1   | Calculá\n$$... | Calculá:\n$$... | Imperativo |
| 2   | Calculá\n$$... | Resolvé:\n$$... | Imperativo variado |
| 3   | Calculá\n$$... | Integrá:\n$$... | Imperativo de acción |
| 4   | Calculá\n$$... | ¿Cuál es el resultado de\n$$...? | Pregunta |
| 5   | Calculá\n$$... | Encontrá:\n$$... | Imperativo de búsqueda |
| 6   | Calculá\n$$... | Resolvé la integral:\n$$... | Imperativo con contexto |
| 7   | Calculá\n$$... | Integrá esta expresión:\n$$... | Imperativo con referencia |
| 8   | Calculá\n$$... | ¿Cuál es la primitiva de\n$$...? | Pregunta directa |
| 9   | Calculá\n$$... | Hallá:\n$$... | Imperativo (variante: "Hallá") |
| 10  | Calculá\n$$... | Calculá la integral:\n$$... | Imperativo con especificación |
| 11  | Calculá\n$$... | ¿Qué se obtiene al integrar\n$$...? | Pregunta reflexiva |
| 12  | Calculá\n$$... | Resolvé esta integral:\n$$... | Imperativo con referencia |
| 13  | Calculá\n$$... | Encontrá la antiderivada de:\n$$... | Imperativo con sinónimo |
| 14  | Calculá\n$$... | Integrá la siguiente expresión:\n$$... | Imperativo con navegación |
| 15  | Calculá\n$$... | ¿Cuál es el resultado de resolver\n$$...? | Pregunta con especificidad |

**Mejora:** 
- Variación de verbo (Calculá, Resolvé, Integrá, Hallá, Encontrá)
- Mezcla de imperativos y preguntas (equilibrio 10 imperativos / 5 preguntas)
- Todas las aperturas cierran en `:` o `?` según corresponda

---

## Checklist de validación

- [x] 15 ejercicios totales (sin cambio)
- [x] Exactamente 4 opciones por ejercicio (grilla 2×2, cardinalidad RESL)
- [x] Todas las opciones $\leq 35$ caracteres visuales (para grilla compacta)
- [x] Todas las opciones correctas contienen `+ C` (regla dura del topic)
- [x] Sin contextos cotidianos (mecánica pura; regla específica RESL)
- [x] Sin función compuesta en integrando (todo evaluado en $x$ solo)
- [x] `feedback_incorrect` array paralelo; error específico por distractor
- [x] Explicaciones con estructura algorítmica: (1) separar por linealidad, (2) aplicar tabla, (3) simplificar + agregar $C$
- [x] Sin em-dash `—` (regla crítica 6)
- [x] Decimales con coma
- [x] Sin nombres propios
- [x] Variación de openings: ✓ sin repetición literal 100%

---

## Distribución por sub-familia (del topic-context)

| Sub-familia | Slug | Ej. | Descripción |
|-------------|------|-----|-------------|
| A | suma-resta-terminos-elementales | 1-8 (aprox) | Combinaciones lineales de 2-3 familias |
| B | polinomios-fracciones-simples-combinadas | 9-15 (aprox) | Potencia + logaritmo (caso especial $n=-1$) |

---

## Notas de implementación

- No se agregaron ni se quitaron ejercicios (ronda 2)
- Cada apertura es una cláusula completa: imperativo con `:` o pregunta con `?`
- Todas las opciones ya satisfacen `$+C` (requisito hard del topic)
- Las explicaciones ya tienen estructura algorítmica: separar → aplicar → simplificar
- Cambio cosmético: solo variación de redacción del opening, conservando contenido educativo

---

## Alertas y observaciones

**Ninguna.** Los ejercicios ya cumplían con estructura algorítmica en explicaciones y con `+ C` obligatorio. La regeneración fue puramente de redacción siguiendo regla crítica 32.

