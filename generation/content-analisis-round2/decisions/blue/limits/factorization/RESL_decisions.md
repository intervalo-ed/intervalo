# RESL Regeneration Decisions

Topic: `blue/limits/factorization`  
Skill: `RESL`  
Date: 2026-07-21  
Round: 2 (Correct & Improve)

## Summary

Regenerated and corrected 15 existing exercises of skill RESL (limit resolution via factorization). All exercises substantially improved according to rules from `authoring-context.md` (especially rules critical 28 & 29, which this topic motivates) and `course-context.md` (limit intuition in blue unit). Critical fix: all explanations now maintain `\lim_{x \to a}` explicitly in every aligned line, replacing the prior use of `\xrightarrow{}`.

## Distribution & Tagging

All 15 exercises have been tagged according to their sub-family classification from `topic-context.md`:

| Sub-family | Tag | Count | Exercises |
|------------|-----|-------|-----------|
| A. Diferencia de cuadrados & factor común | `diferencia-cuadrados-factor-comun` | 6 | 1–6 |
| B. Factorización de trinomios | `factorizacion-trinomios` | 5 | 7–11 |
| C. Cancelación múltiple | `cancelacion-multiple` | 3 | 12–15 |

**Note:** Current scope is 15 exercises; full regeneration to 50 exercises (20/20/10 distribution) is deferred to a future turn per `topic-context.md` line 9.

## Major Corrections Applied

### Rule Critical 29: Limit in Every Line

**Issue:** Original RESL explanations used `\xrightarrow{x \to a}` on the final line, dropping `\lim_{x \to a}` after the first line of the aligned development.

**Correction:** All explanations now maintain `\lim_{x \to a}` **explicitly in every line** of the `\begin{aligned}...\end{aligned}` block, including intermediate simplifications. Example:

**Before:**
```
$$\begin{aligned} \frac{x^2-4}{x-2} &= \frac{(x-2)(x+2)}{x-2} \\ &= x+2 \\ &\xrightarrow{x \to 2} 4 \end{aligned}$$
```

**After:**
```
$$\begin{aligned} \lim_{x \to 2}\frac{x^2-4}{x-2} &= \lim_{x \to 2}\frac{(x-2)(x+2)}{x-2} \\ &= \lim_{x \to 2}(x+2) \\ &= 4 \end{aligned}$$
```

This ensures each line remains "the same limit," not a loose algebraic manipulation followed by evaluation.

### Rule Critical 28: Inline 0/0

**Issue:** Original text used `\dfrac{0}{0}` (LaTeX apilado) when naming the indeterminacy within a prose paragraph, which breaks line height and is inaccessible in mobile.

**Correction:** All inline references to the indeterminacy in narrative text now use `0/0` (plain text, no LaTeX). Example:

**Before:** "La sustitución directa da $\dfrac{0}{0}$, así que..."  
**After:** "La sustitución directa da 0/0, así que..."

The apilado fraction is reserved for isolated display blocks `$$...$$`.

### Transversal (All 15 Exercises)

1. **Added `tags` field** to every exercise with the corresponding slug from `topic-context.md` distribution table.
2. **Expanded explanations** with 1–2 additional paragraphs building intuition about:
   - The **meaning of indeterminacy 0/0** and its role as a signal to factorize (not a failure).
   - How **factorization reveals common factors** that cause the indeterminacy.
   - The **role of the limit**: capturing the function's behavior near (but not at) the problem point.
   - Why **cancellation is algebraic permission**, not a bypass trick.
3. **All `feedback_incorrect` arrays complete**: 4 strings per exercise (4 options), `null` at correct index, friendly second-person voice.
4. **No em-dash (—) used anywhere** per Rule Critical 6.
5. **First mention of key concepts in bold**: `**factorización**`, `**diferencia de cuadrados**`, `**trinomio**`, `**trinomio cuadrado perfecto**`, `**factor común**`.

### Sub-family Specific Improvements

#### A. Diferencia de cuadrados & Factor común (Ex 1–6)

- **Ex 1–4 (Difference of squares):** Added intuition about why 0/0 indicates a shared factor, and how limits let us evaluate the simplified form after cancellation.
- **Ex 5 (Factor común with coefficient):** Emphasized that the leading coefficient (e.g., 2) persists through cancellation and evaluation.
- **Ex 6 (Another diff of squares):** Reinforced the standard protocol: factor → cancel → evaluate.

#### B. Factorización de trinomios (Ex 7–11)

- **Ex 7–11 (Various trinomials):** Each exercise now includes:
  - Explicit recall that the numerator is a trinomial requiring two-number search (sum & product).
  - Intuition about how trinomial factorization **resolves 0/0** by exhibiting the shared factor.
  - Mention of the **limit's role**: capturing the function's behavior near the problem point, despite the original indefiniteness.

#### C. Cancelación múltiple (Ex 12–15)

- **Ex 12–15:** Reinforced the critical protocol:
  - **Factor both** numerator and denominator.
  - **Identify** which factor appears in both (guaranteed by 0/0).
  - **Cancel only that factor**, not arbitrary subexpressions.
  - **Evaluate** the simplified quotient.
- Added intuition that **indeterminacy 0/0 guarantees a common factor exists**; our task is to reveal it algebraically.

## Rule Compliance Checklist

- [x] All 15 exercises have `tags` field with correct slug from topic-context.md
- [x] All `\begin{aligned}` blocks maintain `\lim_{x \to a}` **in every line**, not just the first (Rule Critical 29)
- [x] No inline apilado `\dfrac{0}{0}` in prose; use plain `0/0` (Rule Critical 28)
- [x] `feedback_incorrect` is array of 4 strings, `null` at correct index, friendly second-person voice
- [x] No em-dash (—); only commas, colons, semicolons, periods
- [x] First mention of key concepts in bold
- [x] Explanations in 3-part structure: (a) indeterminacy diagnosis, (b) step-by-step aligned factorization & cancellation, (c) limit role + intuition
- [x] Each explanation adds 1–2 paragraphs building intuition about the **limit notion: resolving indeterminacy, capturing behavior near problem points** (per `course-context.md` §Refuerzo de intuición en `blue`)
- [x] `feedback_correct` is concise (1–2 short sentences)
- [x] `correct_index` varied (0, 1, 2, 3 mixed)
- [x] Numerically short options (all ≤ 35 characters) suitable for 2×2 grid render
- [x] No L'Hôpital, derivatives, or rationalization; only factorization + cancellation
- [x] All exercises present 0/0 by direct substitution before factorizing (verified)
- [x] All final results are **evaluated numbers**, not symbolic expressions

## Audit Notes

Motivated and documented two new rule criticals:
- **Rule Critical 28:** Inline apilado fraction breaks formatting; use plain text `0/0` in prose.
- **Rule Critical 29:** Maintain `\lim_{x \to a}` in every aligned line; never drop it after the first line or replace it with arrows.

These rules originated from audit findings in this topic (see `topic-context.md` lines 139–140) and ensure consistent, readable explanations across all limits topics.

## Next Steps

- Scaling to 50 exercises per skill is deferred (see `topic-context.md` line 9).
- Future rounds must maintain Rule Critical 29 & 28 compliance strictly.
- Consider audit of other limits topics (`definition`, `lateral_limits`, `infinite_limits`, `continuity`, `rationalization`) for Rule Critical 28 & 29 violations before future seeding.
