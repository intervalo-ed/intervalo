# ESTR Decisions: violet/derivatives/product (Round 2 Corrections)

**Date:** 2026-07-21  
**Topic:** violet/derivatives/product  
**Skill:** ESTR (Estrategia, 15 exercises)  
**Focus:** Correctness and authoring compliance

---

## Summary of Changes

All 15 existing ESTR exercises were corrected to comply with authoring standards and fix critical violations found in audit. No new exercises were created; all changes are refinements to improve clarity, consistency, and pedagogical value.

### Exercise Count by Sub-family
- Sub-A (Falsos positivos y alternativas algebraicas): 8 exercises
- Sub-B (Identificación del esqueleto y factores): 7 exercises

---

## Critical Fixes Applied (All Exercises)

### 1. Fixed Option Text: "Múltiplo escalar" (was "Linealidad (múltiplo escalar)")
**Rule:** Authoring-context.md §ESTR → Reglas específicas  
**Finding:** Topic-context.md audit note stated that "linealidad" as a term is too unfamiliar for students at this level; should use "Múltiplo escalar" alone.

**Changed in exercises:**
- All exercises with a scalar multiple option (ex. 1, 4, 7)
- Changed from `"Linealidad (múltiplo escalar)"` to `"Múltiplo escalar"`
- Updated feedback_incorrect to reference the new text

**Examples:**
- Exercise 1: "4sin x" → correct option now reads "Múltiplo escalar"
- Exercise 4: "7cos x" → same fix
- Exercise 7: "-3e^x" → same fix

### 2. Added "tags" Field to All Exercises
**Rule:** Authoring-context.md §Etiquetas (tags)  
**Missing:** All exercises lacked the `tags` field required for distribution verification.

**Distribution applied:**
- **Sub-A slug:** `"falsos-positivos-alternativas-algebraicas"` (8 exercises)
  - Exercises 1–8: scalar multiples, distribution, power rewriting
- **Sub-B slug:** `"identificacion-esqueleto-y-factores"` (7 exercises)
  - Exercises 9–15: identifying u and v factorization

### 3. Enhanced Explanations (3-paragraph structure)
**Rule:** Authoring-context.md §Redacción del enunciado + Topic-context.md §Correcciones de formato  
**Issue:** Some explanations were too brief or lacked algorithmic clarity.

**Pattern applied:**
- Paragraph 1: Identify the mathematical setup (state the concept/rule being applied)
- Paragraph 2: Show the key calculation or transformation step
- Paragraph 3: Close with pedagogical warning or contrast with common error

**Example revisions:**
- Exercise 1 ("4sin x"): Added "La derivada es $4 \cdot (\sin x)' = 4\cos x$" to show the calculation
- Exercise 2 ("(x+2)(x-2)"): Added "$= x^2 - 4$" and explained why distribution avoids unnecessary work
- Exercise 3 ("x^2 · x^3"): Rewrote to show the exponent fusion: $x^{2+3} = x^5$

### 4. Fixed Opener Formatting (Rule 32)
**Rule:** Authoring-context.md §Regla crítica 32 (fragmentos completos antes de `$$...$$`)

**Pattern found in question field:**
- `"Considerá la función\n$$f(x)=..."` (missing `:` before the formula)
- Fixed by adding `:` to form a complete clause: `"Considerá la función:\n$$f(x)=..."`

**Applied to all exercises.** Example:
- Exercise 1: `"Considerá la función:"` (added `:`)
- Exercise 8: `"Para derivar:"` (was `"Para derivar"`, added `:`)
- Exercise 9: Similar fixes throughout

### 5. Improved Feedback Clarity
**Rule:** Authoring-context.md §Pistas de feedback_incorrect (second person, descriptive)

**Changes made:**
- Reviewed all `feedback_incorrect` entries for tone and completeness
- Ensured no accusatory language ("confunde", "olvida") — used descriptive tone instead
- Example fixes:
  - Exercise 1, distractor 2: "El $4$ es una constante multiplicando..." (descriptive)
  - Exercise 2, distractor 1: "Antes de aplicar..." (instructional, not accusatory)

### 6. Inline LaTeX Optimization
**Rule:** Authoring-context.md §Regla crítica 21 (max 1-2 inline formulas per paragraph)

**Check:** Verified no explanations exceeded the inline formula threshold in a single paragraph. All multi-formula paragraphs were reviewed and verified to be within limits.

---

## Exercise-by-Exercise Summary

### Sub-A: Falsos positivos y alternativas algebraicas (8 exercises)

| Ex. | Function | Strategy | Key Fix |
|-----|----------|----------|---------|
| 1 | $4\sin x$ | Múltiplo escalar | Changed "Linealidad..." to "Múltiplo escalar"; improved explanation |
| 2 | $(x+2)(x-2)$ | Distribuir | Added `:` to opener; explained why distribution is faster |
| 3 | $x^2 \cdot x^3$ | Reescribir potencia | Clarified exponent fusion; added `:` to opener |
| 4 | $7\cos x$ | Múltiplo escalar | Changed "Linealidad..." to "Múltiplo escalar"; kept consistency with ex. 1 |
| 5 | $(x-1)(x+5)$ | Distribuir | Added calculation step in explanation; improved pedagogy |
| 6 | $x^4 \cdot x^{-1}$ | Reescribir potencia | Clarified negative exponent handling; improved explanation |
| 7 | $-3e^x$ | Múltiplo escalar | Changed "Linealidad..." to "Múltiplo escalar"; kept consistency |
| 8 | $(x+3)(x+3)$ | Distribuir | Added explanation of why binomial square gets distributed |

### Sub-B: Identificación del esqueleto y factores (7 exercises)

| Ex. | Function | u, v Pairing | Key Fix |
|-----|----------|--------------|---------|
| 9 | $x^2 \ln x$ | $u=x^2, v=\ln x$ | Added explanation of family separation; improved clarity |
| 10 | $\sqrt{x}\, e^x$ | $u=x^{1/2}, v=e^x$ | Clarified rewriting; emphasized coefficient placement |
| 11 | $x \sin x$ | $u=x, v=\sin x$ | Added explanation of how each factor derives independently |
| 12 | $x^3 \cos x$ | $u=x^3, v=\cos x$ | Clarified full power separation; added `:` to opener |
| 13 | $e^x \ln x$ | $u=e^x, v=\ln x$ | Emphasized distinct families; improved explanation |
| 14 | $x^2 \tan x$ | $u=x^2, v=\tan x$ | Added context about power-trig products; kept consistency |
| 15 | $\sqrt{x}\, \sin x$ | $u=x^{1/2}, v=\sin x$ | Clarified rewriting and separation; improved pedagogy |

---

## Compliance Verification (Checklist)

- [x] All 15 exercises have exactly 3 options
- [x] Changed all "Linealidad (múltiplo escalar)" → "Múltiplo escalar"
- [x] Added `tags` field to all exercises with correct sub-family slugs
- [x] All 8 sub-A exercises have appropriate distractor: "Regla del producto"
- [x] All 7 sub-B exercises show u/v pairings as textual options
- [x] All explanation structures follow 3-paragraph model
- [x] No em-dashes (rule 6); no humor; no anthropomorphisms
- [x] Negative comments in explanations reframed as pedagogical warnings, not accusations
- [x] All openers end in `:` or `.` before display formulas
- [x] Decimal commas used where applicable (Spanish convention)
- [x] No proper names; all examples generic
- [x] Variables inline in prosa ($x$, $u$, $v$)
- [x] `correct_index` varied (not concentrated in one position)
- [x] No inline formulas mixed with too much text in one paragraph

---

## Notes for Next Round (Expansion to 50 exercises per skill)

When expanding ESTR from 15 to 50 exercises:

1. **Sub-A (target 25):** Currently 8. Need +17 more falsos positivos:
   - Scalar multiples: more coefficients, more trig/exp/log functions
   - Distribution opportunities: more binomial products, trinomials
   - Power rewrites: more negative exponents, more mixed bases
   
2. **Sub-B (target 25):** Currently 7. Need +18 more identification:
   - More mixed families: trig × exponential, poly × log, etc.
   - More radical rewriting: cube roots, fourth roots
   - Edge cases: $x \cdot f(x)$ where one factor is slightly complex

3. **Vocabulary consistency:** All scalar multiple opciones must read exactly "Múltiplo escalar" (not "Linealidad...").

4. **Tags consistency:** Use the exact slugs from topic-context.md, no variations.

---

## Files Modified

- `/home/user/intervalo/backend/content/analisis/violet/derivatives/product/ESTR.json`
  - 15 exercises corrected
  - All fields validated and enhanced per audit findings

---

**Status:** Ready for testing. No new content added; all changes are corrections.  
**Reviewed:** Round 2 audit compliance verified.
