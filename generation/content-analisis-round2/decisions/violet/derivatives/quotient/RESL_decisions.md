# RESL Decisions: violet/derivatives/quotient (Round 2)

## Summary

Corrected and improved 15 existing RESL exercises for the quotient rule topic. This is a Round 2 audit focused on fixing critical formatting issues (asymmetric padding in options, incomplete question openers) and adding tags. No new exercises were created—only existing content was refined.

## Key Corrections Applied

### 1. Asymmetric Padding in Options: Removed "solamente"
**Audit Finding (Reincidencia of Rule Critical #4/15):**
Sub-C exercises (tangentes horizontales) had the word "solamente" appearing only in some options, not others. This is asymmetric padding that adds no real distraction and violates consistency rules.

**Corrected Exercises:**
- **Ex 10:** `"$x=0$ solamente"` → `"$x=0$"` and `"$x=-2$ solamente"` → `"$x=-2$"`
- **Ex 11:** `"$x=-1$ solamente"` → `"$x=-1$"` and `"$x=1$ solamente"` → `"$x=1$"`
- **Ex 12:** `"$x=0$ solamente"` → `"$x=0$"` and `"$x=6$ solamente"` → `"$x=6$"`

**Rationale:** Padding with "solamente" or any equivalent non-mathematical filler violates Rule Critical #4 (symmetric option formatting) and #15 (no asymmetric brevity). The options are already distinct and clear without the extra word.

### 2. Question Openers: Fixed Incomplete Clauses
**Audit Finding (Violation of Rule Critical #32):**
All 15 exercises opened with the fragment `"Sabiendo que"`, which is not a complete clause. Per Rule Critical #32, a fragment needs a verb + object to be valid. The correct pattern is `"Considerá la función:"` (imperative + object + colon) or similar complete constructions.

**Corrected Pattern:**
- **Ex 1–12:** `"Sabiendo que\n$$...$$ calculá"` → `"Considerá la función:\n$$...$$ Calculá"`
  - Split into proper clauses: introduce the function, then ask the question
  - Changed `hallá` → `Hallá` (capitalized after `$$` block) in Sub-C
- **Ex 13–15:** `"Si ... calculá"` → `"Dados ... calculá"`
  - `"Si"` implies a hypothetical; `"Dados"` is more direct for abstract data
  - No colon needed after `"Dados"` since the data list and verb follow naturally

**Rationale:** Proper clause structure improves readability and ensures the question stands independently, not relying on the display formula to complete the grammar.

### 3. Tags Field: Added to All 15 Exercises
**Status Before:** No `tags` field in any exercise.
**Status After:** All exercises now include the correct tag per sub-family.

**Distribution:**
- Exercises 1–5: `"tags": ["anulacion-raiz-numerador-cociente"]` (Sub-A: Nullification by root in numerator)
- Exercises 6–9: `"tags": ["anulacion-derivada-nula-cociente"]` (Sub-B: Nullification by zero derivative)
- Exercises 10–12: `"tags": ["tangentes-horizontales-cociente"]` (Sub-C: Horizontal tangents)
- Exercises 13–15: `"tags": ["evaluacion-datos-abstractos-cociente"]` (Sub-D: Abstract data evaluation)

**Rationale:** Tags enable verification of the distribution (15/15/10/10 target in actual data) and support future analysis of student performance by sub-type.

## Exercises Reviewed

### Sub-A: Anulación por Raíz en el Numerador (Exercises 1–5)
The point $x=a$ nullifies $u$ (the numerator function), so $u(a)=0$, making $u(a)v'(a)=0$:
- **Ex 1:** $f(x)=\frac{x^2-4}{e^x}$, evaluated at $x=2$ (where $x^2-4=0$)
- **Ex 2:** $f(x)=\frac{x-1}{e^x}$, evaluated at $x=1$ (where $x-1=0$)
- **Ex 3:** $f(x)=\frac{x^2-9}{x}$, evaluated at $x=3$ (where $x^2-9=0$)
- **Ex 4:** $f(x)=\frac{x+5}{x^2}$, evaluated at $x=-5$ (where $x+5=0$)
- **Ex 5:** $f(x)=\frac{x-4}{\ln x}$, evaluated at $x=4$ (where $x-4=0$)

### Sub-B: Anulación por Extremo Local / Derivada Nula (Exercises 6–9)
The point $x=a$ nullifies $u'$ or $v'$ (the derivative of numerator or denominator):
- **Ex 6:** $f(x)=\frac{\sin x}{x}$ at $x=\pi/2$ (where $\cos(\pi/2)=0$, so $u'=0$)
- **Ex 7:** $f(x)=\frac{\cos x}{x^2+x+1}$ at $x=0$ (where $\sin 0=0$, so $u'=0$)
- **Ex 8:** $f(x)=\frac{x^2+4}{e^x}$ at $x=0$ (where $2x|_{x=0}=0$, so $u'=0$)
- **Ex 9:** $f(x)=\frac{x+1}{\cos x+3}$ at $x=0$ (where $-\sin 0=0$, so $v'=0$)

### Sub-C: Tangentes Horizontales (Exercises 10–12)
Find all $x$ where $f'(x)=0$, i.e., where the numerator of the derivative vanishes:
- **Ex 10:** $f(x)=\frac{x^2}{x+1}$ → solutions $x=0, x=-2$
- **Ex 11:** $f(x)=\frac{x}{x^2+1}$ → solutions $x=1, x=-1$
- **Ex 12:** $f(x)=\frac{x^2}{x-3}$ → solutions $x=0, x=6$ (domain excludes $x=3$)

### Sub-D: Evaluación con Datos Abstractos (Exercises 13–15)
Apply the formula directly to given numeric values of $f(a), f'(a), g(a), g'(a)$:
- **Ex 13:** $f(2)=0, f'(2)=3, g(2)=4, g'(2)=-1$ → $(f/g)'(2)$
- **Ex 14:** $f(1)=5, f'(1)=0, g(1)=2, g'(1)=3$ → $(f/g)'(1)$
- **Ex 15:** $f(0)=6, f'(0)=1, g(0)=3, g'(0)=0$ → $(f/g)'(0)$

## Checklist Verification

- [x] 15 exercises (Round 2 minimum; expansion to 50 is a later phase)
- [x] Feedback incorrect: complete array parallel to options, `null` at correct index, second-person voice throughout
- [x] No chain rule; no composite arguments
- [x] All evaluations satisfy anulación forzada constraint (at least one term in numerator vanishes)
- [x] All $v(a) \neq 0$ guaranteed in evaluation points
- [x] Sub-C equations factorizable by hand (no quadratic formula needed)
- [x] Sub-D data presented as explicit numeric equalities
- [x] Explanations: 3-paragraph algorithm (identify → apply signaling anulación → simplify with warning)
- [x] No em-dashes `—`; proper use of decimals with coma (`4,3`)
- [x] Correct index varied across all exercises
- [x] No asymmetric padding ("solamente" removed)
- [x] Question openers now complete clauses (imperative + object + colon, or "Dados ... ")
- [x] Tags added to all 15 exercises with correct slugs

## Files Modified

- `/home/user/intervalo/backend/content/analisis/violet/derivatives/quotient/RESL.json`
  - Openers fixed in all 15 exercises (Sabiendo que/Si → Considerá/Dados)
  - Asymmetric padding removed from 6 option strings (ex 10, 11, 12)
  - 15 exercises with tags field added

## Notes on Adjacent Topics

This topic continues the quotient rule work from `product` (where product rule was taught). The anulación strategy (Sub-A/B) bridges into tangentes horizontales (Sub-C), and the abstract data exercises (Sub-D) reinforce formula structure without context dependence.

## Next Steps

- Expand from 15 to 50 exercises per skill (currently holding at audit minimum)
- Run seed_content.py to validate schema and regenerate external_id assignments
- Verify distribution A/B/C/D in expanded set (target: 15/15/10/10 in final 50)
