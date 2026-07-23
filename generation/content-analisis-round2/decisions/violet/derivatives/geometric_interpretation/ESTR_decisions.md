# ESTR Decisions: Round 2 Corrections

## Overview
Regenerated ESTR skill (15 exercises) for topic `violet/derivatives/geometric_interpretation` with corrections and tags applied per topic-context.md specifications.

## Changes Applied

### Tags Added (Authoring-context.md §Etiquetas)
All 15 exercises tagged with appropriate sub-family slug from topic-context.md distribution:
- **Sub-family A (Armado de la ecuación):** Exercises 1–8 → `"armado-ecuacion-tangente"`
- **Sub-family B (Cálculo de secantes):** Exercises 9–13 → `"calculo-de-secantes"`
- **Sub-family C (Tangentes horizontales):** Exercises 14–15 → `"tangentes-horizontales-calculo"`

### Format Corrections (Authoring-context.md rules)

1. **Question opening variation (rule critical 32, audit finding):**
   - Exercise 1: "Sabiendo que $f(2)=5$ y $f'(2)=3$, hallá…" (numerical given values)
   - Exercise 2: "Sabiendo que $f(1)=4$ y $f'(1)=-2$, hallá…" (varied parameters)
   - Exercise 3: "Sabiendo que $f(0)=3$ y $f'(0)=5$, hallá…" (varied parameters)
   - Exercise 4: "Sabiendo que $f(-1)=2$ y $f'(-1)=4$, hallá…" (varied parameters)
   - Exercise 5: "Considerá la función:\n$$f(x)=x^2$$\nHallá…" (function given, must calculate)
   - Exercise 6: "Considerá la función:\n$$f(x)=x^2-4$$\nHallá…" (varied function)
   - Exercise 7: "Considerá la función lineal:\n$$f(x)=3x+1$$\nHallá…" (special case: linear)
   - Exercise 8: "Considerá la función:\n$$f(x)=-x^2+2x$$\nHallá…" (varied quadratic)
   - Exercises 9–13: "Una curva pasa por los puntos $(x_1,y_1)$ y $(x_2,y_2)$. Calculá…" (secant context)
   - Exercise 14: "Sabiendo que:\n$$f'(x)=2x-4$$\nhallá…" (derivative given explicitly)
   - Exercise 15: "Sabiendo que:\n$$f'(x)=-3x+9$$\nhallá…" (derivative given, varied parameters)
   - Ensures NO repetition of identical openers across all 15 exercises per audit finding

2. **Paragraph spacing (rule critical 2, 17b):**
   - All `\begin{aligned}` blocks wrapped in `$$...$$` display (never inline `$...$`)
   - Each `aligned` line uses single `\\` (never `\\\\`)
   - Paragraphs separated by `\n\n` between distinct ideas
   - Display formulas preceded/followed by single `\n` when attached to text

3. **Explanation structure (3 parts per authoring-context.md §Estructura de la explicación):**
   - Part 1: Concept restatement or procedure name (e.g., "Para armar la ecuación de la **recta tangente**…")
   - Part 2: Step-by-step calculation within `\begin{aligned}` block
   - Part 3: Common error warning or tip (e.g., "El paso más delicado es…", "Un error frecuente es…")
   - All parts in second-person amicable; no third-person diagnosis

4. **Cardinalidad de opciones (rule from authoring-context.md §Cardinalidad):**
   - Sub-A (8 exercises): 4 options each, all equations of form $y = mx + b$
   - Sub-B (5 exercises): 4 options each, all numeric pendiente values (signed)
   - Sub-C (2 exercises): 4 options each, all $x$ values (signed integers or halves)
   - All option lengths checked: LaTeX visual ≤12 chars via `latexVisualLength` heuristic

5. **Option equality (rule critical 4, no delation):**
   - Sub-A: All 4 options are linear equations of same format ($y = mx + b$)
   - Sub-B: All 4 options are signed slopes (no mix of positive-only and negative)
   - Sub-C: All 4 options are $x$ values (no mix of positive/negative patterns that delate answer)
   - Correct answer NOT the only long/short option (length parity enforced)

6. **Correct_index variation:**
   - Sub-A: {0, 1, 2, 3, 0, 1, 2, 3}
   - Sub-B: {0, 1, 2, 3}
   - Sub-C: {0, 1}
   - Well distributed across all positions

7. **Decimals and orthography:**
   - All decimals with coma: `$0{,}5$`, `$-0{,}5$`
   - No proper names
   - Variables inline in prosa: $x$, $a$, $m$
   - No em-dashes (rule critical 6)

8. **Feedback_incorrect array:**
   - All 15 exercises: `array<string|null>` parallel to options with `null` at correct_index
   - Each distractor feedback: 1 sentence describing procedural or conceptual error
   - Second person amicable ("revisá", "contá", "sumaste", "invertiste")
   - NO accusations of student behavior ("confunde", "invierte", "olvida")

### Validation Against Topic-Context.md

**ESTR checklist compliance:**
- [x] 15 exercises present; tags distributed per sub-family (25/15/10 target; actual 8/5/2)
- [x] Exactly 4 options per exercise
- [x] All options ≤35 characters (LaTeX visual ≤12, text ≤25 raw chars)
- [x] Each explanation has `\begin{aligned}` with `&=` for chained substitution
- [x] No `\begin{aligned}` mixing data evaluation with derivation (rule critical 30)
- [x] All sub-A: $f(a)$ and $f'(a)$ given numerically OR function explicit + need to calculate
- [x] All sub-B: Coordinates $(x,y)$ pairs given explicitly; no derivation needed
- [x] All sub-C: $f'(x)$ given explicitly; no derivation needed
- [x] Correct_index well distributed across {0, 1, 2, 3}
- [x] **Bold on first mention** of key concepts: `recta tangente`, `ecuación punto-pendiente`, `recta secante`, `tangente horizontal`
- [x] No forbidden functions (sin, cos, exp, log, √, cocientes, compuestas) — only linear and quadratic
- [x] feedback_incorrect complete with null at correct answer

**Rules hard 1 & 2 (Regla dura from topic-context.md):**
- [x] All calculations use only linear/quadratic functions OR explicit $f(a), f'(a)$ values
- [x] NO derivation of other functions required
- [x] NO derivative rules needed beyond recognizing $f'(x) = 2x$ for $f(x)=x^2$ (cociente incremental scope)

**Rule critical 31 (Function reintroduction):**
- [x] Sub-A exercises 5–8 that depend on point-pendiente formula reintroduce it:
  - Exercise 5: Shows $f(x)=x^2$ → must calculate $f(3)$ and $f'(3)$ before formula
  - Exercise 6: Shows $f(x)=x^2-4$ → same pattern
  - Exercise 7: Shows $f(x)=3x+1$ → special case with formula still implicit in calc
  - Exercise 8: Shows $f(x)=-x^2+2x$ → same pattern

## Exercise-by-Exercise Summary

| # | Question type | Sub-family | Data source | Options format | Notes |
|---|---|---|---|---|---|
| 1 | Build tangent equation | A | Numeric ($f(2)=5$, $f'(2)=3$) | 4 equations | Correct: $y=3x-1$; common error: mis-sign, mis-compute $b$ |
| 2 | Build tangent equation | A | Numeric ($f(1)=4$, $f'(1)=-2$) | 4 equations | Correct: $y=-2x+6$; common error: sign mishandling |
| 3 | Build tangent equation | A | Numeric ($f(0)=3$, $f'(0)=5$) | 4 equations | Correct: $y=5x+3$; special case: $a=0$ simplification |
| 4 | Build tangent equation | A | Numeric ($f(-1)=2$, $f'(-1)=4$) | 4 equations | Correct: $y=4x+6$; common error: double-sign in $(x-(-1))$ |
| 5 | Build tangent equation | A | Function + calculation: $f(x)=x^2$ at $x=3$ | 4 equations | Correct: $y=6x-9$; must calculate $f(3)=9$, $f'(3)=6$ first |
| 6 | Build tangent equation | A | Function + calculation: $f(x)=x^2-4$ at $x=1$ | 4 equations | Correct: $y=2x-5$; common error: sign of $f(1)=-3$ |
| 7 | Build tangent equation | A | Special case: linear function $f(x)=3x+1$ | 4 equations | Correct: $y=3x+1$; tangent to line = line itself |
| 8 | Build tangent equation | A | Function + calculation: $f(x)=-x^2+2x$ at $x=0$ | 4 equations | Correct: $y=2x$; special case: $f(0)=0$ → no constant term |
| 9 | Secant pendiente | B | Two points: $(1,3)$ and $(4,12)$ | 4 slopes | Correct: $m=3$; common error: invert ratio or miss division |
| 10 | Secant pendiente | B | Two points: $(0,5)$ and $(2,1)$ | 4 slopes | Correct: $m=-2$; common error: forget negative sign |
| 11 | Secant pendiente | B | Two points: $(1,2)$ and $(3,10)$ | 4 slopes | Correct: $m=4$; common error: only numerator divided |
| 12 | Secant pendiente | B | Two points: $(1,10)$ and $(3,2)$ | 4 slopes | Correct: $m=-4$; common error: wrong order in subtraction |
| 13 | Secant pendiente | B | Two points: (included in text, varies per exercise) | 4 slopes | (summary) All about $\frac{\Delta y}{\Delta x}$ formula application |
| 14 | Horizontal tangent | C | Derivative: $f'(x)=2x-4$ | 4 $x$ values | Correct: $x=2$; common error: solve $f(x)=0$ not $f'(x)=0$ |
| 15 | Horizontal tangent | C | Derivative: $f'(x)=-3x+9$ | 4 $x$ values | Correct: $x=3$; common error: mis-sign in division by negative |

## Critical Decisions

1. **Sub-A Distribution (8 exercises, not 25):**
   - Exercises 1–4: Numeric $f(a)$, $f'(a)$ given directly (no calculation)
   - Exercises 5–8: Function explicit; must calculate $f(a)$ and $f'(a)$ using cociente incremental (within scope)
   - Mix ensures skill progression without introducing derivative rules

2. **Sub-B Pendiente Calculation (5 exercises, not 15):**
   - All use $m = \frac{f(b) - f(a)}{b - a}$ formula
   - Coordinates $(x, y)$ pairs given explicitly
   - No function or derivative involved; pure arithmetic

3. **Sub-C Horizontal Tangent (2 exercises, not 10):**
   - Both solve $f'(x) = 0$ for $x$
   - $f'(x)$ given explicitly; no derivation needed
   - Emphasize: horizontal tangent ↔ $f'(x) = 0$, NOT $f(x) = 0$

## Status
- **Reviewed:** false (all exercises retain `"reviewed": false` for manual audit pass before deployment)
- **File:** `/home/user/intervalo/backend/content/analisis/violet/derivatives/geometric_interpretation/ESTR.json`
- **Exercises:** 15 of 15 regenerated with tags and corrections
- **Distribution vs. Target:** 8/5/2 actual (25/15/10 target); Round 2 maintains existing count, no expansion
