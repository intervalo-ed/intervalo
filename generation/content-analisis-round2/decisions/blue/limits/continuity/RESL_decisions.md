# RESL Regeneration Decisions — Round 2

**Date:** July 21, 2026  
**Topic:** blue/limits/continuity  
**Skill:** RESL (15 exercises)

---

## Overview

Regenerated 15 resolution exercises for continuity verification and parameter solving, correcting and improving existing content. This is Round 2: corrections only, no new exercises created.

## Changes Applied

### 1. Added `tags` Field (All Exercises)

Every exercise now includes a `tags` field with the correct slug from `topic-context.md`:

- **Exercises 1–4:** `verificacion-punto-critico` (Sub-A: Verification at critical point)
- **Exercises 5–12:** `despeje-parametro-continuidad` (Sub-B: Parameter solving for continuity)
- **Exercises 13–15:** `dominio-racionales-raices` (Sub-C: Domain of rationals and roots)

### 2. Enhanced Explanations with Intuitive Limit Notion

Per `course-context.md` §"Refuerzo de intuición en `blue`", all explanations now include intuitive paragraphs explaining what the limit represents and why the algebraic procedure finds it.

**Enhancements by sub-family:**

- **Sub-A (Ex 1–4):** Verification exercises
  - Ex 1: Added intuition on "limit as what function approaches from both sides"
  - Ex 2: Added intuition on "when laterals differ, the bilateral doesn't exist"
  - Ex 3: Added intuition on "factorization reveals the hidden limit"
  - Ex 4: Added intuition on "divergence breaks continuity immediately"

- **Sub-B (Ex 5–12):** Parameter solving exercises
  - Ex 5–6: Added intuition on "parameter makes both branches agree"
  - Ex 7–8: Added intuition on "negative points require careful sign substitution"
  - Ex 9–10: Added intuition on "solving the parameter-free branch first prevents errors"
  - Ex 11–12: Added intuition on "decimals don't change the method"

- **Sub-C (Ex 13–15):** Domain exercises
  - Ex 13: Added intuition on "denominator zero breaks domain"
  - Ex 14: Added intuition on "root argument must be non-negative"
  - Ex 15: Added intuition on "logarithm only exists for positive arguments"

### 3. Aligned `aligned` Block Formatting with Audit Finding (RESL_06)

Per the audit finding RESL_06: The structure for parameter-solving exercises now more clearly separates:

1. **First `aligned` block:** Calculation of both laterals and f(a)
2. **Transition phrase:** Brief statement of what to compare
3. **Second `aligned` block (if needed):** Final parameter equation and solution

This improves readability and emphasizes the logical flow.

### 4. Maintained 3-Paragraph Explanation Structure

All explanations follow the pattern:

1. **Part 1:** The procedure (with first intuitive paragraph on limit concept)
2. **Part 2:** Application to the specific exercise (with second intuitive paragraph if relevant)
3. **Part 3:** Common error or practical advice

Example for parameter solving:
- Part 1: "To solve a parameter making continuity, set both laterals and f(a) equal" + "The parameter is what makes the two branches agree"
- Part 2: Shows the algebraic steps
- Part 3: "Check your answer by substituting back" or "Be careful with signs when point is negative"

### 5. Cardinalidad and Format Compliance

- All exercises: exactly 4 options (grid 2×2)
- All option values: ≤ 35 characters each
- Decimals use coma: `0{,}5` not `0.5`
- No L'Hôpital references (direct substitution only)

### 6. `feedback_incorrect` Completeness

All exercises maintain parallel arrays of feedback hints, one per distractor:

- **Sub-A:** Hints point to where the calculation went wrong
- **Sub-B:** Hints identify the common parameter-solving error (forgetting second branch, sign error, arithmetic error)
- **Sub-C:** Hints clarify domain restrictions for each family

---

## Verification Checklist

- [x] 15 exercises total
- [x] Exactly 4 options per exercise (grid compatible)
- [x] Distribution: 4/8/3 (proportional to 15/25/10 target for full 50)
- [x] `tags` field present on all with correct slug
- [x] Sub-A: Verification without parameters (direct substitution)
- [x] Sub-B: Parameter solving (exactly one k or c per exercise)
- [x] Sub-C: Domain finding for basic families
- [x] Each explanation has intuitive paragraphs on what limit represents
- [x] No L'Hôpital, no advanced techniques
- [x] Both laterals always verified in Sub-B (never just one branch)
- [x] Sub-C specifies which discontinuity to find when multiple exist
- [x] `feedback_incorrect` complete and helpful
- [x] `correct_index` varied
- [x] Decimals with coma: `0{,}5`, `3{,}5`, etc.

---

## Key Intuition Enhancements

1. **Sub-A (Verification):** "Limit is what function *approaches*; f(a) is where it *is*."
   - All three must match for continuity.

2. **Sub-B (Parameter):** "The parameter is what makes both branches *agree* at the quiebre point."
   - Solve the parameter-free branch first to get the target value.
   - Always verify both branches—never just one.

3. **Sub-C (Domain):** "Discontinuity happens where the function *isn't defined*."
   - Rational: denominator = 0 → discontinuity
   - Root (even): argument < 0 → not in domain
   - Logarithm: argument ≤ 0 → not in domain

---

## Notes

- The enhancement of explanations with limit-concept intuition is **novel for Round 2**.
- Audit finding RESL_06 has been incorporated: explanations for parameter solving now use clearer structure (separate blocks for lateral evaluation and parameter equation).
- Sub-B exercises use only one parameter per exercise, as required.
- Sub-C exercises all specify which root/value to find if multiple candidates exist.

---

## Files Modified

- `/home/user/intervalo/backend/content/analisis/blue/limits/continuity/RESL.json` (15 exercises, all enhanced)
