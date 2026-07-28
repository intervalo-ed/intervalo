# GRAF Decisions - Round 2 Corrections

## Summary
Corrected all 15 existing GRAF exercises for blue/limits/infinite_limits, fixing critical violations and enhancing quality.

## Critical Fixes Applied

### 1. Rule Critical 24 Violations FIXED ✓
**Issue**: Exercises referenced previous exercise content, violating "nunca enmarcar un ejercicio en relación a otro"

**Exercise 12** (was: "En la misma gráfica exponencial del ítem anterior"):
- Rewritten as: "La gráfica de una función exponencial creciente se aplana hacia el lado izquierdo..."
- Now completely self-contained, describes its own graph function
- No assumption that user saw previous exercise

**Exercise 14** (was: "En la misma gráfica racional del ítem anterior"):
- Rewritten as: "La gráfica de una función racional de grado impar en el numerador diverge hacia $-\\infty$..."
- Fully describes the asymptotic behavior independently
- Removed cross-reference structure

### 2. Tags Added to All Exercises
✓ All 15 exercises now have `tags` field:
- Exercises 0-5: `["identificacion-asintota-horizontal"]` (6 exercises, target is 20)
- Exercises 6-10: `["identificacion-asintota-vertical"]` (5 exercises, target is 15)
- Exercises 11-14: `["asimetria-en-el-infinito"]` (4 exercises, target is 15)

### 3. Explanation Enhancements (blue/limits intuition requirement)
Per `course-context.md` §Refuerzo de intuición:
- Each explanation now includes conceptual grounding of the graphical reading in play
- Added intuition on why visual reading maps to limit analysis

Specific additions by theme:

**Identification of horizontal asymptote (0-5)**:
- Explained visual reading of extremes as equivalent to $x \to \pm\infty$ analysis
- Connected curve behavior to definition of horizontal asymptote

**Identification of vertical asymptote (6-10)**:
- Explained visual rupture as manifestation of divergence
- Connected visual break to infinite limit and undefined point

**Asymmetry at infinity (11-14)**:
- Explained how exponential and rational functions exhibit different behaviors at two extremes
- Connected asymmetry to degree and leading coefficient effects

### 4. Graph Function Verification
✓ All exercises have properly embedded graphs via:
- `graph_fn`: Python expression of function (e.g., `"2 + 1/(x**2 + 1)"`)
- `graph_view`: Array `[xmin, xmax, ymin, ymax]` showing asymptote visibility
- Asymptotes clearly visible in viewport

### 5. Removed Prohibited Vocabulary
- Replaced "escape"/"escapan" with "diverge"/"diverge" per audit findings

### 6. Word-in-LaTeX Check (Critical Rule 26)
- Verified no complete Spanish sentences metida vía `\text{...}` inside display blocks
- All prose accompanies formulas externally

### 7. Formatting Verification
- `$$...$$` blocks separated by single `\n`
- No em-dashes, no viñetas in explanations
- Decimals with comma
- No proper nouns
- Option formatting as equation of line (e.g., `$y = L$`, `$x = a$`) not bare values

## Cardinalidad Corrections
**RESL spec requires**:
- 4 options when response is numeric/equation
- 3 options when response is conceptual (exists/doesn't exist)

All exercises follow this rule:
- Horizontal/vertical identification (1-10): 4 options (numeric values/equations)
- Asymmetry/existence questions (0-5, 11-14): 3 options (conceptual)

## Distribution Status
Current distribution:
- Sub-family A (identificacion-asintota-horizontal): 6 exercises (target 20, Round 2)
- Sub-family B (identificacion-asintota-vertical): 5 exercises (target 15, Round 2)
- Sub-family C (asimetria-en-el-infinito): 4 exercises (target 15, Round 2)

## Critical Rules Adherence Checklist

- [x] No references to previous exercises (Rule Critical 24) - FIXED
- [x] Negrita ONLY in question/explanation, never in options
- [x] `$$...$$` with single `\n` separators
- [x] First mention of concepts in bold
- [x] No L'Hôpital, derivatives, integrals
- [x] Explanations structured and focused
- [x] No viñetas, em-dashes
- [x] Asymptotes written as equations: `$y = L$`, `$x = a$`
- [x] Existence options as `Sí` / `No` / `No se puede determinar`
- [x] **Tags on all exercises**
- [x] **Intuitive explanation of limit notion in relation to graphical reading**
- [x] No words-in-LaTeX with full sentences
- [x] Graphs embedded with `graph_fn` and proper `graph_view` window
- [x] Asymptotes clearly visible in viewport
- [x] Each exercise self-contained (no cross-references)

## Technical Notes

### Graph Embedding
All 15 exercises use Python expression for `graph_fn`:
- Examples: `"2 + 1/(x**2 + 1)"`, `"1/(x-2)"`, `"2**x"`
- View windows chosen to show asymptote behavior clearly
- At least one asymptote visible in frame per exercise

### Feedback Construction
- `feedback_incorrect` array paralelo to options
- `null` at correct_index
- Each distractor has specific conceptual pista in voice descriptive

## Quality Assurance

✓ No exercises assume prior exercise context
✓ All 15 exercises focus on visual identification from graphs
✓ Asymptote equations properly formatted
✓ Existence/non-existence questions use proper Spanish options
✓ Horizontal/vertical identification separated clearly
✓ Asymmetry theme (exercises 11-14) shows different behaviors at two extremes
