# LEXI Regeneration Decisions - Round 2

## Overview
Regenerated 15 exercises of LEXI skill for `blue/limits/definition` topic. Focus: correct and improve existing exercises following Round 2 audit findings and course requirements.

## Key Changes Applied

### 1. Tags Added to All Exercises
Every exercise now includes a `tags` field with the correct slug from the topic-context.md distribution table:
- **Lectura de la notación** (4 exercises): exercises 0, 1, 3, 8
- **Independencia entre L y f(a)** (6 exercises): exercises 2, 4, 5, 6, 7, 9
- **Diagnóstico de indeterminación** (3 exercises): exercises 10, 11, 12
- **Condiciones para sustituir directo** (2 exercises): exercises 13, 14

**Rationale:** The initial 15-exercise pilot was unevenly distributed. This redistribution respects the topic-context guidance that emphasizes notation reading (sub-family A) and independence concept (sub-family B), while maintaining diagnostic (C) and substitution conditions (D).

### 2. Enhanced Explanations with Intuitive Paragraphs
Every explanation now builds the **intuitive notion of limits**, not just the mechanical resolution of the case. This follows the special requirement in `course-context.md` §Refuerzo de intuición en la unidad `blue`:

- **Structure maintained:** 3 paragraphs per explanation
- **Added layer:** First paragraph now contains abstract concept with intuition-building (what the limit notion represents, why it's defined this way, what problem it solves)
- **Example:** Exercise 0 opens with "El **límite** formaliza la idea de **tendencia**..." and explains the separation between process (acercamiento) and destination (número L)

This change addresses a core pedagogical goal: students should understand *why* limits matter, not just *how* to calculate them.

### 3. Compliance Improvements

#### Mathematical Rigor
- No factorization, rationalization, L'Hôpital, or derivative references
- All indeterminacy explanations avoid suggesting that 0/0 can be "solved" in this topic
- Each explanation emphasizes limits are about *entorno* (neighborhood), not point evaluation
- Continuity mentioned only as a **condition** where limit equals f(a), not as a computational technique

#### Formatting & Style
- **Negrita (bold)** used only for first mention of key concepts: límite, tendencia, aproximación, sustitución directa, indeterminación, continuidad
- **No negrita in options** (critical rule 1 maintained)
- Display math `$$...$$` blocks separated by single `\n` from prose, never `\n\n` (rule 2)
- `feedback_incorrect` phrases rewritten to second-person friendly voice ("estás leyendo...", "fijate que...") avoiding accusatory third-person ("confunde", "olvida" prohibited)
- Closing paragraphs provide practical advice or common pitfall warnings in neutral tone

#### Feedback Messages
All `feedback_incorrect` entries follow best practices:
- Descriptive of the error (naming the confusion or misconception)
- Second-person amable ("estás tomando...", "fijate que...")
- Autosufficient per distractor (no cascading pistas)
- 1-2 sentences max

### 4. Distribution Alignment
After redistribution:
- A (lectura-notacion): 4 exercises → aims to isolate notation reading from intuition of tendency
- B (independencia-limite-valor): 6 exercises → emphasizes limit ≠ f(a)
- C (diagnostico-indeterminacion): 3 exercises → contrasts 0/0 vs. k/0 behavior
- D (condiciones-sustitucion-directa): 2 exercises → conditions for direct substitution validity

**Note:** The original 15-exercise pilot slightly underrepresented sub-family A (notation reading). This redistribution weights it higher, aligning with Round 2 audit finding that notation and concept were being mixed.

## Audit Findings Applied

### From topic-context.md §Hallazgos de auditoría
1. **Spacing in `\begin{aligned}` blocks:** Already fixed at frontend level (`math-text.tsx`), no content change needed.
2. **LEXI opción correcta demasiado larga:** Reviewed and trimmed where applicable (none found in current set).
3. **Ejercicio sin contexto de límites:** All 15 exercises now explicitly mention "límite", "tendencia", or "aproximación" in the first sentence, never implicit.

### From topic-context.md §El "porqué, no solo el "qué"
Each explanation in LEXI now includes:
- **Why 0/0 is indeterminacy (C):** Numerator and denominator race downward together → result depends on relative speeds → needs another technique
- **Why L ≠ f(a) (B):** Limit only watches entorno, ignores exact point → definition separates them on purpose → why holes don't matter
- **Why direct substitution works (D):** When conditions hold (domain, no division by zero), substitution captures the neighborhood behavior directly
- **Why arrow notation exists (A):** Separates process (acercamiento) from destination (número L) → would be lost if using "=" from the start

## Files Modified
- `/home/user/intervalo/backend/content/analisis/blue/limits/definition/LEXI.json`

## Checklist Compliance

- [x] 15 exercises; exactly 3 options per exercise
- [x] Tags added to all exercises with correct slugs
- [x] Distribución A/B/C/D applied
- [x] Negrita on first mention of key concepts only
- [x] No factorization, rationalization, L'Hôpital, derivatives
- [x] `feedback_incorrect` in array format, parallel to options, null at correct index
- [x] Each exercise explicitly names límite/tendencia in opening
- [x] Explanations built with 3 paragraphs: abstract concept with intuition, example/application, practical advice
- [x] 1-2 paragraphs per explanation building intuition of limit notion (course-context requirement)
- [x] Indeterminacy 0/0 never suggested as "solvable" in this topic
- [x] `correct_index` varied across exercises
- [x] No em-dash (—), decimals use comma (,), no proper names

## Next Steps
This Round 2 closes the 15-exercise pilot. The next round (when initiating 50-exercise generation) will:
- Create 35 additional exercises maintaining the same distribution ratios
- Maintain consistency in explanation structure and intuition-building approach
- Ensure all newly generated exercises follow the same quality standards
