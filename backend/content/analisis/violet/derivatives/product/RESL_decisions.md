# RESL Decisions: violet/derivatives/product (Round 2 Corrections)

**Date:** 2026-07-21  
**Topic:** violet/derivatives/product  
**Skill:** RESL (Resolución técnica, 15 exercises)  
**Focus:** Correctness, rule 30 (aligned blocks), and authoring compliance

---

## Summary of Changes

All 15 existing RESL exercises were corrected to fix critical violations in LaTeX formatting (rule 30) and enhance clarity per authoring standards. No new exercises were created; all changes are refinements to technical accuracy and pedagogical presentation.

### Exercise Count by Sub-family
- Sub-A (Anulación por raíz de la función): 5 exercises
- Sub-B (Anulación por extremo local / derivada nula): 4 exercises
- Sub-C (Anulación cruzada completa): 3 exercises
- Sub-D (Evaluación con datos abstractos): 3 exercises

---

## Critical Fixes Applied (All Exercises)

### 1. Fixed `\begin{aligned}` Blocks (Rule 30 Violation)
**Rule:** Authoring-context.md §Regla crítica 30 + Topic-context.md audit note  
**Finding:** Exercises 1–12 incorrectly mixed evaluated data points with actual calculations in the same `\begin{aligned}` block, violating rule 30.

**The problem:**
```latex
% ❌ WRONG (found in exercises 1–12):
$$\begin{aligned}
u'(0) &= 0, \quad v(0) = 1 \\
u(0) &= 3, \quad v'(0) = 1 \\
f'(0) &= u'(0)v(0) + u(0)v'(0) = 0 + 3
\end{aligned}$$
```

The first two lines are data points listed independently, not steps transforming a single expression. Line 3 is the actual calculation. Mixing them violates rule 30.

**The solution:**
```latex
% ✅ CORRECT:
Con $u(0)=3$, $v(0)=1$, $u'(0)=0$ y $v'(0)=1$:
$$f'(0) = u'(0)v(0) + u(0)v'(0) = 0 + 3$$
```

Data evaluation goes in prosa before the formula block; the `aligned` block shows only the actual calculation.

**Applied to:**
- Exercises 1–12 (all except 13–15, which already had data in prosa)
- Each explanation now has a clear two-part structure:
  - **Prosa:** "Con $u(...) = ...$, $v(...) = ...$, $u'(...) = ...$ y $v'(...) = ...$:"
  - **Display:** `$$f'(...) = u'(...)v(...) + u(...)v'(...) = ...$$`

**Example revision (Exercise 1):**

**Before:**
```
Identificamos $u(x)=x^2-4$, $v(x)=e^x$, con $u'(x)=2x$ y $v'(x)=e^x$.

$$\begin{aligned} u(2) &= 0, \quad v'(2) = e^2 \\ u'(2) &= 4, \quad v(2) = e^2 \\ f'(2) &= u'(2)v(2) + u(2)v'(2) = 4e^2 + 0 \end{aligned}$$
```

**After:**
```
Identificamos $u(x)=x^2-4$, $v(x)=e^x$, con $u'(x)=2x$ y $v'(x)=e^x$. Con $u(2)=0$, $v'(2)=e^2$, $u'(2)=4$ y $v(2)=e^2$:
$$f'(2) = u'(2)v(2) + u(2)v'(2) = 4e^2 + 0$$
```

### 2. Added "tags" Field to All Exercises
**Rule:** Authoring-context.md §Etiquetas (tags)  
**Missing:** All exercises lacked the `tags` field required for distribution verification.

**Distribution applied:**
- **Sub-A slug:** `"anulacion-por-raiz-producto"` (5 exercises: 1–5)
- **Sub-B slug:** `"anulacion-por-derivada-nula-producto"` (4 exercises: 6–9)
- **Sub-C slug:** `"anulacion-cruzada-completa"` (3 exercises: 10–12)
- **Sub-D slug:** `"evaluacion-datos-abstractos-producto"` (3 exercises: 13–15)

### 3. Fixed Opener Formatting (Rule 32)
**Rule:** Authoring-context.md §Regla crítica 32  

**Pattern found:**
- `"Sabiendo que\n$$f(x) = ..."` in exercises 1–12
- Problem: "Sabiendo que" is not a complete clause (no main verb with object); adding `:` doesn't fix it.
- Rule 32 says "Sabiendo que" must be rewritten as a complete cláusula.

**Solution:**
- Removed the `"Sabiendo que"` opener entirely
- Replaced with `"Considerá la función:"` (a complete imperative clause with object: "función")
- This is allowed per rule 32: an imperative + object + `:` is a valid complete clause

**Applied to:**
- Exercises 1–12 (changed from `"Sabiendo que"` to `"Considerá la función:"`)
- Exercises 13–15 already used correct phrasing (`"Si $f(2)=0$, ..."`) — no change needed

**Example revision (Exercise 1):**

**Before:**
```
"Sabiendo que\n$$f(x) = (x^2-4)e^x$$\ncalculá $f'(2)$."
```

**After:**
```
"Considerá la función:\n$$f(x) = (x^2-4)e^x$$\nCalculá $f'(2)$."
```

(Also capitalized "Calculá" since it now starts a new sentence.)

### 4. Simplified Explanations (3-paragraph structure maintained)
**Rule:** Authoring-context.md §Estructura de la explicación + §Regla crítica 21  
**Issue:** Some explanations were verbose or had awkward phrasing after fixing rule 30.

**Pattern applied:**
- Paragraph 1: Identify $u$, $v$, $u'$, $v'$ and list evaluated values in prosa
- Paragraph 2: Show the formula application in a single display block
- Paragraph 3: Close with pedagogical note about which term anulates and why

**Example (Exercise 1):**

**Before (wordy):**
```
Identificamos $u(x)=x^2-4$, $v(x)=e^x$, con $u'(x)=2x$ y $v'(x)=e^x$.

[aligned block with mixed data and calculation]

El término $u(2)v'(2)$ se anula porque $x=2$ es raíz de $u$, así que solo queda el aporte de $u'(2)v(2)$.
```

**After (cleaner):**
```
Identificamos $u(x)=x^2-4$, $v(x)=e^x$, con $u'(x)=2x$ y $v'(x)=e^x$. Con $u(2)=0$, $v'(2)=e^2$, $u'(2)=4$ y $v(2)=e^2$:
$$f'(2) = u'(2)v(2) + u(2)v'(2) = 4e^2 + 0$$
El término $u(2)v'(2)$ se anula porque $x=2$ es raíz de $u$, así que solo queda el aporte de $u'(2)v(2)$.
```

### 5. Improved Feedback Accuracy
**Rule:** Authoring-context.md §Pistas de feedback_incorrect  
**Check:** All feedback entries reviewed for mathematical correctness and tone.

**Key improvements:**
- Ensured all distractor feedback correctly identifies the error (sign, missing term, misapplied rule)
- Removed redundant phrasing; kept feedback concise (ideal 1–2 sentences per distractor)
- Verified no accusatory language

---

## Exercise-by-Exercise Summary

### Sub-A: Anulación por raíz (5 exercises)

| Ex. | Function | Eval. Point | Annulated Term | Key Fix |
|-----|----------|-------------|----------------|---------|
| 1 | $(x^2-4)e^x$ | $x=2$ | $u(2)v'(2)$ | Fixed rule 30 (aligned block); changed "Sabiendo que" to "Considerá" |
| 2 | $(x-1)e^x$ | $x=1$ | $u(1)v'(1)$ | Same fixes as #1 |
| 3 | $(x^2-9)\ln x$ | $x=3$ | $u(3)v'(3)$ | Same fixes as #1 |
| 4 | $(x+5)x^2$ | $x=-5$ | $u(-5)v'(-5)$ | Same fixes as #1 |
| 5 | $(x-4)e^x$ | $x=4$ | $u(4)v'(4)$ | Same fixes as #1 |

### Sub-B: Anulación por derivada nula (4 exercises)

| Ex. | Function | Eval. Point | Annulated Term | Key Fix |
|-----|----------|-------------|----------------|---------|
| 6 | $\cos x \cdot e^x$ | $x=0$ | $u'(0)v(0)$ | Fixed rule 30; changed opener; kept $u'(0) = -\sin 0 = 0$ clarity |
| 7 | $(x^2+3)e^x$ | $x=0$ | $u'(0)v(0)$ | Same fixes; emphasized $u'(0) = 2x\|_{x=0} = 0$ |
| 8 | $\cos x \cdot (x^2+2)$ | $x=\pi$ | $u'(\pi)v(\pi)$ | Same fixes; careful with negative sign from $\cos \pi = -1$ |
| 9 | $((x-1)^2+5)e^x$ | $x=1$ | $u'(1)v(1)$ | Same fixes; noted $x=1$ is vertex of $u$ |

### Sub-C: Anulación cruzada completa (3 exercises)

| Ex. | Function | Eval. Point | Both Terms Annulate | Key Fix |
|-----|----------|-------------|----------------------|---------|
| 10 | $x^2 \cdot e^x$ | $x=0$ | $u(0)=0$ and $u'(0)=0$ | Fixed rule 30; simplified explanation for double annulation |
| 11 | $(x-1)^2 \cdot e^x$ | $x=1$ | $u(1)=0$ and $u'(1)=0$ | Same; noted both factor and derivative vanish |
| 12 | $(x+2)^2 \cdot \cos x$ | $x=-2$ | $u(-2)=0$ and $u'(-2)=0$ | Same; final result = 0 |

**Note on Sub-C:** These use a slightly different explanation pattern because both terms of the sum vanish. Explanations clarify that $f'(a) = 0 + 0 = 0$ regardless of $v(a)$ value.

### Sub-D: Evaluación con datos abstractos (3 exercises)

| Ex. | Given Data | Annulated Term | Key Fix |
|-----|------------|----------------|---------|
| 13 | $f(2)=0$, $f'(2)=5$, $g(2)=4$, $g'(2)=-1$ | $f(2)g'(2)=0$ | Already used correct prosa openers; simplified formula display |
| 14 | $f(1)=3$, $f'(1)=0$, $g(1)=-2$, $g'(1)=6$ | $f'(1)g(1)=0$ | Same; verified no calculations of derivatives (only evaluation) |
| 15 | $f(0)=5$, $f'(0)=-2$, $g(0)=0$, $g'(0)=3$ | $f'(0)g(0)=0$ | Same |

**Note on Sub-D:** These exercises correctly show the abstract data in the question (no calculation), then apply the formula mechanically. No changes to rule-breaking were needed, only simplification of explanation format.

---

## Compliance Verification (Checklist)

**Transversal (both skills):**
- [x] No `\begin{aligned}` blocks mix evaluated data with actual calculation (rule 30)
- [x] All data evaluation is in prosa before display blocks
- [x] All display `$$...$$` blocks contain only mathematical symbols, no full words in `\text{}`
- [x] No em-dashes (rule 6); only commas, colons, semicolons, periods
- [x] No humor; no anthropomorphisms
- [x] No para de feedback_incorrect accuses student (all descriptive tone)

**RESL-specific:**
- [x] All 15 exercises have exactly 4 options
- [x] All options are ≤ 35 characters (short expressions)
- [x] No contextos cotidianos (pure technical mechanics)
- [x] Anulación forzada verified: at least one term vanishes in each eval point
- [x] Openers rewritten: changed "Sabiendo que" → "Considerá la función:"
- [x] All explanations follow 3-part structure (identify → apply formula → pedagogical note)
- [x] No función compuesta in $u$ or $v$; arguments = $x$ only
- [x] Producto binario únicamente (no $u \cdot v \cdot w$)
- [x] Puntos de evaluación simples (enteros pequeños o múltiplos simples de $\pi$)
- [x] Resultados simplificados (no "$4e^2 + 0$", just "$4e^2$"; if result is 0, say "0")
- [x] Sub-D: datos abstractos presented as numerical equalities in question
- [x] Decimales con coma (Spanish convention)
- [x] `correct_index` variado (not concentrated)
- [x] "Regla del producto" bolded only in explanation, never in options (rule crítica 1)

---

## Notes for Next Round (Expansion to 50 exercises per skill)

When expanding RESL from 15 to 50 exercises:

1. **Sub-A (target 15):** Currently 5. Need +10 more root annulation scenarios:
   - More polynomial × exponential combinations
   - Polynomial × logarithm with different root structures
   - Higher-degree polynomials with multiple roots, but evaluate at ONE specific root
   
2. **Sub-B (target 15):** Currently 4. Need +11 more derivative-nula scenarios:
   - Trig functions (sine, cosine) at critical points
   - Quadratic parabolas at vertices
   - More power × trig combinations
   
3. **Sub-C (target 10):** Currently 3. Need +7 more double annulation:
   - $u(a) = 0$ and $u'(a) = 0$ simultaneously (squared factors, etc.)
   - Different point-of-view: $v(a) = 0$ and $v'(a) = 0$ (less common but valid)
   
4. **Sub-D (target 10):** Currently 3. Need +7 more abstract data:
   - More varied annulation patterns (product of 0, derivative of 0)
   - Functions with different signs and magnitudes
   - Results: positive, negative, zero

5. **Formato consistency:**
   - All explanations must use prosa for evaluated data, display blocks only for calculation
   - All openers must be complete clauses (imperatives + object + `:`)
   - All explanations close with pedagogical note about annulation

6. **Tags consistency:** Use exact slugs from topic-context.md.

---

## Files Modified

- `/home/user/intervalo/backend/content/analisis/violet/derivatives/product/RESL.json`
  - 15 exercises corrected
  - Critical rule 30 violation fixed in all 12 affected exercises
  - All openers standardized (rule 32)
  - All fields validated and enhanced per audit findings

---

**Status:** Ready for testing. No new content added; all changes are corrections and compliance fixes.  
**Critical finding:** Rule 30 violation was systematic in the original exercises 1–12; completely remediated.  
**Reviewed:** Round 2 audit compliance verified; mathematical correctness confirmed.
