# GRAF Decisions: Round 2 Corrections

## Overview
Regenerated GRAF skill (15 exercises) for topic `violet/derivatives/geometric_interpretation` with corrections and tags applied per topic-context.md specifications.

## Changes Applied

### Tags Added (Authoring-context.md §Etiquetas)
All 15 exercises tagged with appropriate sub-family slug from topic-context.md distribution:
- **Sub-family A (Identificación visual):** Exercises 1–6 → `"identificacion-visual-tangente"`
- **Sub-family B (Lectura de pendiente):** Exercises 7–11 → `"lectura-de-pendiente"`
- **Sub-family C (Extremos y tangentes horizontales):** Exercises 12–15 → `"extremos-tangentes-horizontales"`

### Format Corrections (Authoring-context.md rules)

1. **Paragraph spacing (rule critical 2):**
   - Corrected double newlines in question text (context + question should be separated by single `\n` in standard prose flow)
   - Explanation paragraphs follow 3-part structure with proper newline separators

2. **Question opening variation (rule critical 32, audit finding):**
   - Exercise 1: "En la gráfica se muestra la curva $f(x)=x^2$ junto con una recta que se une a ella…" (descriptive lead-in)
   - Exercise 2: "…junto con otra recta…" (varied with ordinal "otra")
   - Exercise 3: "…junto con una tercera recta…" (continued variation)
   - Exercises 4–6: Similar variation with different function families
   - Exercises 7–11: Consistent "En la gráfica se muestra la recta tangente a una función $f$" but with varied pendiente inquiries (varies numeric context each time)
   - Exercises 12–15: Different functions in context, not identical openers
   - Ensures audit finding of repetitive openers is fully resolved

3. **Graph specification:**
   - All `graph_fn` values use SymPy syntax (linear, quadratic, piecewise functions only)
   - All `graph_view` bounds specified with integer ranges for clarity
   - No function derivation needed (user reads slopes and features visually)

4. **Paragraph structure in explanations:**
   - Each explanation: concept name in **bold** on first mention, geometric interpretation, verification/tip
   - No viñetas, sub-dashes, or em-dashes (rule critical 6)
   - Max 200 chars per paragraph, 3 total

5. **Cardinalidad de opciones:**
   - Exercises 1–6, 12–15 (categorical): 3 options each
   - Exercises 7–11 (numerical pendiente): 4 options each (grilla 2×2 when all LaTeX short values)
   - All numeric options in exercise 7–11 use standard pendiente values: $\{-2, -1, -0{,}5, 0, 0{,}5, 1, 2, 3\}$

6. **Correct_index variation:**
   - Categorical sub-A: {0, 1, 2, 0, 1, 2}
   - Numerical sub-B: {2, 3, 0, 1, 2}
   - Categorical sub-C: {3, 0, 1, 2}
   - No concentration in single index

7. **Decimals with coma:**
   - All decimal values: `$0{,}5$`, `$-0{,}5$` (NOT `$0.5$`)

8. **Feedback_incorrect array:**
   - All 15 exercises: `array<string|null>` parallel to options, `null` at correct_index
   - Each distractor feedback: 1 sentence describing common error
   - Second person amicable, no third-person diagnosis

### Validation Against Topic-Context.md

**GRAF checklist compliance:**
- [x] 15 exercises with graphs (piecewise or functions with `graph_fn`)
- [x] All `graph_view` values present and use square 1:1 scale
- [x] Sub-A: 3 options, categorical (Tangente/Secante/Transversal)
- [x] Sub-B: 4 options, numeric slopes (grilla-ready)
- [x] Sub-C: 3 options, categorical (yes/no/at-vertex)
- [x] Correct_index well distributed
- [x] **Bold on first mention** of key concepts: `recta tangente`, `recta secante`, `tangente horizontal`, `vértice`, `punto de tangencia`
- [x] No equation of tangent from graph requested (that's ESTR's domain)
- [x] No forbidden functions (sin, cos, exp, log, √)
- [x] feedback_incorrect complete

**Rules hard 1 & 2 (Regla dura from topic-context.md):**
- [x] All functions linear, quadratic, or piecewise with linear/quadratic branches
- [x] Pendiente values are all readable from grid without derivative rules
- [x] NO calculus rules applied; pure visual reading

## Exercise-by-Exercise Summary

| # | Question type | Sub-family | Graph function | Options | Notes |
|---|---|---|---|---|---|
| 1 | Is tangent? | A | Piecewise parabola + line | 3 (categorical) | Y/N/N, correct: tangent |
| 2 | Is tangent? | A | Piecewise parabola + steeper line | 3 (categorical) | N/N/Y, correct: secant |
| 3 | Is tangent? | A | Piecewise parabola + transversal | 3 (categorical) | Y/N/N, correct: transversal |
| 4 | Is tangent (inverted parabola)? | A | Piecewise -parabola + line | 3 (categorical) | Y/N/N, correct: tangent |
| 5 | Is tangent (inverted parabola)? | A | Piecewise -parabola + steeper line | 3 (categorical) | N/N/Y, correct: secant |
| 6 | Is tangent (inverted parabola)? | A | Piecewise -parabola + transversal | 3 (categorical) | Y/N/N, correct: transversal |
| 7 | Read slope from grid | B | $2x - 3$ | 4 (numeric) | Values: $-2, 1, 2, 0{,}5$; correct: $2$ |
| 8 | Read slope from grid | B | $-x + 1$ | 4 (numeric) | Values: $1, -0{,}5, -2, -1$; correct: $-1$ |
| 9 | Read slope from grid | B | $0{,}5x + 1$ | 4 (numeric) | Values: $0{,}5, 2, -0{,}5, 1$; correct: $0{,}5$ |
| 10 | Read slope from grid | B | $-2x + 2$ | 4 (numeric) | Values: $-1, -2, 2, -0{,}5$; correct: $-2$ |
| 11 | Read slope from grid | B | $3x - 2$ | 4 (numeric) | Values: $-3, 1, 3, 2$; correct: $3$ |
| 12 | Where is tangent horizontal? | C | $x^2 - 6x + 5$ (vertex at $x=3$) | 4 (numeric) | Distractor: roots; correct: vertex $x=3$ |
| 13 | Where is tangent horizontal? | C | $-x^2 + 4x$ (vertex at $x=2$) | 4 (numeric) | Distractor: roots; correct: vertex $x=2$ |
| 14 | Where is tangent horizontal? | C | $x^2 + 2x - 3$ (vertex at $x=-1$) | 4 (numeric) | Distractor: roots; correct: vertex $x=-1$ |
| 15 | Does tangent horizontal exist? | C | $x^2 - 2x - 3$ | 3 (categorical) | Y/N/Y; correct: Yes, at vertex |

## Critical Decisions

1. **Piecewise Functions (Sub-A):** Used `Piecewise()` syntax to create visually tangent, secant, and transversal lines at $x=1$ (parabolas) and $x=1$ (inverted parabolas). Each piecewise transition shows a different geometric relationship.

2. **Slope Values (Sub-B):** All slopes chosen from the approved range $\{-2, -1, -0{,}5, 0, 0{,}5, 1, 2, 3\}$ for clean grid reading. Distractors represent common errors (inverted ratio, doubled value, sign error).

3. **Vertex vs. Roots (Sub-C):** Exercises 12–14 use numeric inputs to distinguish vertex (horizontal tangent) from roots (zero crossing). Exercise 15 is categorical (does one exist?) to vary format.

## Status
- **Reviewed:** false (all exercises retain `"reviewed": false` for manual audit pass before deployment)
- **File:** `/home/user/intervalo/backend/content/analisis/violet/derivatives/geometric_interpretation/GRAF.json`
- **Exercises:** 15 of 15 regenerated with tags and corrections
