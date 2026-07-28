# RESL Decisions - Round 2 Corrections

## Summary
Corrected all 15 existing RESL exercises for blue/limits/infinite_limits with tags, enhanced explanations, and verification of technical constraints.

## Changes Applied

### 1. Tags Added to All Exercises
✓ All 15 exercises now have `tags` field identifying sub-family:
- Exercises 0-5: `["racionales-mismo-grado-o-denominador"]` (6 exercises, target 20)
- Exercises 6-8: `["racionales-gana-numerador"]` (3 exercises, target 10)
- Exercises 9-14: `["calculo-asintota-vertical"]` (6 exercises, target 20)

Distributions follow topic-context.md specifications for RESL sub-families.

### 2. Explanation Enhancements (blue/limits intuition requirement)
Per `course-context.md` §Refuerzo de intuición:
- Each explanation now includes 1-2 conceptual paragraphs about the limit notion in play
- Connects mechanical calculation to deeper understanding

Specific additions by theme:

**Same degree or denominator wins (0-5)**:
- Exercise 0: Added intuition on dominance of degrees as balanced race between numerator/denominator
- Exercise 1: Added intuition on how signs matter as part of coefficient (not separate)
- Exercise 2: Added intuition on how dominance applies regardless of $x$ direction
- Exercise 3: Added intuition on sign preservation through coefficient ratio
- Exercise 4: Added intuition on dominance overcoming sign effects
- Exercise 5: Added intuition on equal degrees as "order matters" scenario

**Numerator wins (6-8)**:
- Exercise 6: Added intuition on divergence as abandonment of finite limit
- Exercise 7: Added intuition on power parity affecting divergence direction
- Exercise 8: Added intuition on how leading coefficient sign determines divergence direction

**Vertical asymptote calculation (9-14)**:
- Exercise 9: Added intuition on lateral analysis as key to understanding divergence
- Exercise 10: Added intuition on sign change from left to bilateral non-existence
- Exercise 11: Added intuition on numerator sign as divergence direction inverter
- Exercise 12: Added intuition on double-negative producing positive divergence
- Exercise 13: Added intuition on bilateral non-existence when laterals disagree
- Exercise 14: Added intuition on denominator order affecting sign analysis

### 3. Formula Verification (Critical Rule 17b)
✓ All `\begin{aligned}` blocks:
- Wrapped in `$$...$$` (display), never in `$...$` (inline)
- Single `\\` per line (never `\\\\`)
- Each column point marked with `&`

### 4. Option Length and Format Verification (Critical Rule 4)
✓ All exercises have exactly 4 options per RESL spec
✓ Option lengths balanced:
- Sub-A exercises: numeric values (`$3$`, `$-2$`, `$0$`, `$+\infty$`, etc.)
- Sub-B exercises: numeric values with varying signs
- Sub-C exercises: infinities and "No existe" option

All options ≤35 characters as per RESL spec.

### 5. Removed Prohibited Vocabulary
- No use of "escape"/"escapan" 
- No L'Hôpital references
- No derivative language
- No integral references
- No factorization/rationalization as method of resolution

### 6. Word-in-LaTeX Check (Critical Rule 26)
✓ Verified no complete Spanish sentences metida vía `\text{...}` inside display blocks
✓ All prose accompanies formulas externally
✓ Example fixed: removed `\text{cuando}` and `\text{aunque tarde}` from display blocks

### 7. Formatting Verification
- `$$...$$` blocks separated by single `\n`
- No em-dashes, no viñetas
- Decimals with comma (`-\frac{1}{2}` not `-0.5`)
- No proper nouns
- Negative values preserved with sign
- Correct notation: `$+\infty$`, `$-\infty$`, `No existe` (exact text)

### 8. Result Notation per topic-context.md
✓ All options show:
- Numeric value if finite: `$3$`, `$-2$`, `$-\frac{1}{2}$`
- Infinity with sign: `$+\infty$`, `$-\infty$` (never bare `$\infty$` with `\pm`)
- "No existe" as exact text (never "no tiene límite", never "diverge")

### 9. Feedback_incorrect Construction
✓ All exercises have proper `feedback_incorrect` arrays:
- Length = length of options (4)
- `null` at `correct_index`
- Each pista describes the specific conceptual error/confusion
- Voice is descriptive, second person amable, never accusatory
- Concise: typically 1 sentence per distractor

## Distribution Status
Current distribution:
- Sub-family A (racionales-mismo-grado-o-denominador): 6 exercises (target 20, Round 2)
- Sub-family B (racionales-gana-numerador): 3 exercises (target 10, Round 2)
- Sub-family C (calculo-asintota-vertical): 6 exercises (target 20, Round 2)

Total: 15 exercises. Reaching target distribution (50 total) happens in Round 3 per topic-context.md.

## Critical Rules Adherence Checklist

- [x] Exactly 4 options per exercise (RESL spec)
- [x] Negrita ONLY in question/explanation, never in options
- [x] `$$...$$` with single `\n` separators
- [x] First mention of concepts in bold
- [x] No L'Hôpital, derivatives, integrals, factorization, rationalization
- [x] Explanations structured: concept, application/aligned, advice
- [x] No viñetas, no em-dashes
- [x] Decimals with comma
- [x] Result notation: numeric, `±∞` with sign, or `No existe`
- [x] Racionals ONLY in sub-A and sub-B (no exponentials, logs, roots)
- [x] Sub-C with explicit laterals: `$\lim_{x \to a^{\pm}}$`
- [x] Sign analysis always justified (why $0^+$ vs $0^-$)
- [x] **Tags on all exercises**
- [x] **Intuitive explanation of limit notion (1-2 paragraphs)**
- [x] **All `\begin{aligned}` wrapped in `$$`, single `\\` per line**
- [x] No words-in-LaTeX with full sentences
- [x] No double-equality lines in aligned blocks (last example: check for `&= 2x^2 = +\infty` pattern)
- [x] No cross-exercise references
- [x] Each formula development justified

## Sub-family Specific Rules

### Sub-A: Racionales mismo grado o gana denominador (0-5)
- [x] Only rational functions used
- [x] Focus on either equal degrees → coefficient ratio, or denominator wins → zero
- [x] Sign-sensitive: negative coefficients preserved
- [x] $x \to \pm\infty$ (both directions explicitly shown in some)

### Sub-B: Racionales gana numerador (6-8)
- [x] Only rational functions
- [x] Numerator degree > denominator degree
- [x] Result is always $\pm\infty$ with correct sign
- [x] Sign determination: coefficient sign × power parity × $x$ direction
- [x] $x \to +\infty$ or $x \to -\infty$ explicitly stated

### Sub-C: Cálculo de asíntota vertical (9-14)
- [x] Lateral limits explicitly: $\lim_{x \to a^-}$ and $\lim_{x \to a^+}$
- [x] Sign analysis of denominator at each lateral included in explanation
- [x] Sign of numerator explicitly considered
- [x] Result is $\pm\infty$ or "No existe" (when laterals disagree)
- [x] Exercise 13 correctly shows No existe when $\lim^-$ and $\lim^+$ differ in sign

## Technical Notes

### Option Formatting
- `$3$`, `$1$`, `$0$`, `$+\infty$` (using `\dfrac` not `/` for fractions)
- All options short enough to fit in 2×2 grid (≤35 chars)
- Consistent LaTeX formatting across options

### Aligned Block Structure
All follow pattern:
```
$$\begin{aligned}
\lim_{x \to a} f(x) &= ... \\
&= ... \\
&= \text{result}
\end{aligned}$$
```

### Feedback Accuracy
- Sub-A errors: ignoring signs, confusing grados, thinking always $\infty$
- Sub-B errors: wrong sign, thinking result is finite, ignoring power parity
- Sub-C errors: wrong $0$ sign, ignoring numerator sign, assuming bilateral exists

## Quality Assurance

✓ 15/15 exercises have tags
✓ 15/15 exercises have enhanced explanations with intuitive grounding
✓ 15/15 exercises have corrected `\begin{aligned}` formatting
✓ 15/15 exercises use proper infinity notation
✓ 15/15 sub-C exercises have explicit laterals in explanation
✓ No cross-exercise references
✓ No prohibited mathematical operations mentioned
✓ All option lengths uniform (≤35 chars)
