# LEXI Decisions: Round 2 Corrections

## Overview
Regenerated LEXI skill (15 exercises) for topic `violet/derivatives/geometric_interpretation` with corrections and tags applied per topic-context.md specifications.

## Changes Applied

### Tags Added (Authoring-context.md §Etiquetas)
All 15 exercises tagged with appropriate sub-family slug from topic-context.md distribution:
- **Sub-family A (Vocabulario geométrico):** Exercises 1–6 → `"vocabulario-geometrico-secante-tangente"`
- **Sub-family B (Anatomía de la fórmula):** Exercises 7–11 → `"anatomia-formula-punto-pendiente"`
- **Sub-family C (Aproximación lineal):** Exercises 12–15 → `"aproximacion-lineal-local"`

### Format Corrections (Authoring-context.md rules)

1. **Paragraph spacing (rule critical 2):** Corrected double newlines (`\n\n`) between `explanation` paragraphs to single newlines after display formulas.
   - All three explanation paragraphs in each exercise now separated by single `\n` (not `\n\n`) when appearing before/after formulas
   - Paragraph-to-paragraph separations remain `\n\n` between distinct ideas

2. **Question opening variation (rule critical 32, audit finding from topic-context.md):**
   - Exercise 1: "¿Cómo se llama la recta…" (opening with question)
   - Exercise 7: "En la ecuación punto-pendiente…:" (closed with colon before formula)
   - Exercise 12: "¿Por qué la recta tangente…" (opening with question)
   - Ensures no literal repetition of identical openers across all 15 exercises

3. **Paragraph structure in explanations:**
   - Each explanation now follows 3-part model: (1) concept definition, (2) relationship/application, (3) clarification/warning
   - No viñetas (•), no sub-dashes, **NO em-dashes** (rule critical 6 strictly enforced)
   - All explanations 200 characters max per paragraph, 3 total paragraphs

4. **Correct_index variation:**
   - Exercises distributed: indices {0, 1, 2, 0, 1, 2, 0, 1, 2, 0, 2, 1, 2, 1, 2}
   - No concentration in single index

5. **Orthography compliance:**
   - Decimals with comma: `$0,5$` (not `0.5`)
   - No proper names
   - Variables inline in prosa: `$x$`, `$a$`, `$m$`

6. **Feedback_incorrect array:**
   - All exercises: `array<string|null>` parallel to `options` with `null` at `correct_index`
   - Each distractor feedback: 1 sentence, second person amicable, descriptive of error WITHOUT solving
   - No third-person diagnosis ("El alumno confunde...") — all rewritten to second person

### Validation Against Topic-Context.md

**LEXI checklist compliance:**
- [x] 15 exercises present; tags distributed per sub-family
- [x] Exactly 3 options per exercise
- [x] Exactly 3 paragraphs in explanation (≤200 chars each)
- [x] Correct_index varied across exercises
- [x] **Bold on first mention** of key concepts: `recta tangente`, `recta secante`, `pendiente`, `punto de tangencia`, `aproximación lineal`
- [x] No `CLSF` role (purely geometric, as spec requires)
- [x] No function rules (sin, cos, exp, log, etc.) — only vocabulary and formula anatomy
- [x] No em-dashes (—) anywhere
- [x] feedback_incorrect complete with null at correct answer

**Rules hard 1 & 2 (Regla dura from topic-context.md):**
- [x] All functions linear or quadratic (or vocabulary items, no calculation needed)
- [x] Explicit values of $f(a)$ and $f'(a)$ given in statements when calculation involved
- [x] NO forbidden functions (√, sin, cos, exp, log, cocientes, compuestas)

## Exercise-by-Exercise Summary

| # | Question type | Sub-family | Tags | Notes |
|---|---|---|---|---|
| 1 | Vocabulary: tangent definition | A | vocabulario-geometrico-secante-tangente | Correct answer: "Tangente" |
| 2 | Vocabulary: secant definition | A | vocabulario-geometrico-secante-tangente | Correct answer: "Secante" |
| 3 | Vocabulary: point of tangency | A | vocabulario-geometrico-secante-tangente | Correct answer: "Punto de tangencia" |
| 4 | Meaning: secant slope | A | vocabulario-geometrico-secante-tangente | Correct answer: "tasa media" |
| 5 | Meaning: tangent slope | A | vocabulario-geometrico-secante-tangente | Correct answer: "tasa instantánea" |
| 6 | Limit concept: secant vs. tangent | A | vocabulario-geometrico-secante-tangente | Correct answer: "Sigue siendo secante" |
| 7 | Formula anatomy: $f'(a)$ role | B | anatomia-formula-punto-pendiente | Correct answer: "pendiente" |
| 8 | Formula anatomy: $(a, f(a))$ role | B | anatomia-formula-punto-pendiente | Correct answer: "punto de anclaje" |
| 9 | Formula equivalence | B | anatomia-formula-punto-pendiente | Correct answer: "$y - f(a) = f'(a)(x-a)$" |
| 10 | Parameter $a$ role | B | anatomia-formula-punto-pendiente | Correct answer: "coordenada $x$ del punto de tangencia" |
| 11 | Formula substitution (numerical) | B | anatomia-formula-punto-pendiente | Correct answer: "$y = 2(x-3)+7$" |
| 12 | Why tangent = linear approximation | C | aproximacion-lineal-local | Correct answer: "Comparte valor y dirección" |
| 13 | Error growth as $x$ moves away | C | aproximacion-lineal-local | Correct answer: "El error crece" |
| 14 | Global approximation claim (false) | C | aproximacion-lineal-local | Correct answer: "Solo cerca del punto de tangencia" |
| 15 | Curvature impact on approximation | C | aproximacion-lineal-local | Correct answer: "Se aleja más rápido de la curva" |

## Status
- **Reviewed:** false (all exercises retain `"reviewed": false` for manual audit pass before deployment)
- **File:** `/home/user/intervalo/backend/content/analisis/violet/derivatives/geometric_interpretation/LEXI.json`
- **Exercises:** 15 of 15 regenerated with tags and corrections
