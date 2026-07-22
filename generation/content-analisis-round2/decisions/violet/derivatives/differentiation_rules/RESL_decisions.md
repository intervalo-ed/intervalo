# RESL Skill: Regeneration Decisions (Round 2)

**Skill:** `violet/derivatives/differentiation_rules` → `RESL`  
**Total Exercises:** 15  
**Date:** July 2026

---

## Summary of Changes

All 15 exercises in the RESL skill have been reviewed and verified for Round 2. Changes applied:

1. **Tags Added:** Every exercise now includes the `tags` field with the correct sub-family slug from topic-context.md.
2. **Audit Complete:** All exercises verified against authoring-context.md critical rules and topic-specific rules.
3. **No Content Rewriting:** Mathematical content remains unchanged; focus is on format compliance and tagging.

---

## Distribution by Tag

| Tag | Count | Exercises | Focus |
|-----|-------|-----------|-------|
| `derivadas-elementales-aplicacion` | 5 | 0–4 | Single-term direct application |
| `combinaciones-lineales` | 5 | 5–9 | Multiple terms combined linearly |
| `tangentes-rapidas` | 3 | 10–12 | Evaluating at a point, tangent line equation |
| `razones-de-cambio` | 2 | 13–14 | Velocity, parallel tangent |

**Note:** Current 15-exercise distribution (5+5+3+2) reflects sub-family imbalance relative to target 15/20/10/5 split in topic-context.md. Expected for Round 2; expansion to 50 per skill is deferred.

---

## Sub-family Analysis

### A. Derivadas Elementales: Aplicación (5 exercises)

Single-term derivative calculation using direct formula application.

- **Ex 0:** Power rule $(x^6)' = 6x^5$ — standard application
- **Ex 1:** Logarithm $(\ln x)' = 1/x$ — recall elemental formula
- **Ex 2:** Trigonometric $(\cos x)' = -\sin x$ — sign caveat
- **Ex 3:** Exponential $(e^x)' = e^x$ — distinguishing from power rule
- **Ex 4:** Trigonometric $(\sin x)' = \cos x$ — basic trig derivative

**Cardinalidad:** All have 4 options (numeric/short expressions).

**Feedback Pattern:** Addresses common errors per formula type (sign of cosine, exponent reduction, confusing base vs. exponent, misapplying power rule to exponentials).

---

### B. Combinaciones Lineales (5 exercises)

Multiple elementary terms combined via linearity (sum/subtract, scalar multiples).

- **Ex 5:** Three terms: $4x^3 - 2\sin x + \ln x$ — mixed types
- **Ex 6:** Three terms: $5x^2 + 3\cos x - 4$ — trigonometric and constant
- **Ex 7:** Two terms: $x^4 - 6\tan x$ — power and trig
- **Ex 8:** Two terms: $2e^x + 5x$ — exponential and linear
- **Ex 9:** Three terms: $7 - 3x^2 + \sin x$ — constant, power, trig

**Cardinalidad:** All have 4 options (short expressions, typically with LaTeX for mixed types).

**Feedback Pattern:** 
- Coefficient multiplication errors (forgetting to multiply coefficient by exponent)
- Sign errors on trigonometric derivatives
- Constant term handling (disappears in derivative)
- Evaluation vs. derivation confusion (mixing $f(a)$ with $f'(a)$)

---

### C. Tangentes Rápidas (3 exercises)

Evaluate derivative at specific points; construct tangent line equation $y = mx + b$.

- **Ex 10:** Evaluate $f'(2)$ where $f(x) = x^3$ — order of operations (derive first, then evaluate)
- **Ex 11:** Evaluate $f'(0)$ where $f(x) = \sin x$ — numeric evaluation with trig
- **Ex 12:** Tangent line equation at $x = 0$ for $f(x) = e^x + x$ — use point-slope form $y = m(x - x_0) + f(x_0)$

**Cardinalidad:** All have 4 options.

**Feedback Pattern:**
- Evaluating before deriving (confusing $f(a)$ with $f'(a)$)
- Missing evaluation step (giving $f'(x)$ instead of $f'(a)$)
- Incorrect point-slope formula application
- Sign errors on trigonometric evaluations

---

### D. Razones de Cambio (2 exercises)

Application to velocity, parallel tangent lines with given slope.

- **Ex 13:** Find velocity $v(t) = s'(t)$ from position $s(t) = t^3 - 2t$ — direct derivative as rate
- **Ex 14:** Find $x$ where $f'(x) = m$ for $f(x) = x^2$, $m = 4$ — tangent parallel to given line

**Cardinalidad:** Both have 4 options (numeric).

**Feedback Pattern:**
- Forgetting to derive term-by-term (leaving linear coefficient as $2t$ instead of $2$)
- Forgetting to evaluate (solving equation incompletely)
- Sign errors on solution
- Confusing independent vs. dependent variable roles

---

## Compliance Verification

All exercises verified against authoring-context.md and topic-context.md:

### Critical Rules (No Violations)
- ✓ Rule 6: No em-dash (—)
- ✓ Rule 9: No fragmentos colgantes before `$$...$$`
- ✓ Rule 18: Formula for function separated from text; not tejida inline
- ✓ Rule 30: `\begin{aligned}` used only for actual derivation steps, not independent evaluations (verified: explanation in Ex 10–12 shows step-by-step with aligned alineated by `=`)
- ✓ Rule 32: No short opener before formula; all questions have complete openers

### Topic-Specific Rules
- ✓ No function composition or non-trivial arguments (all $\sin x$, $\cos x$, $e^x$, $\ln x$, not $\sin(2x)$, $e^{3x}$, etc.)
- ✓ No limit-based justification in explanations (direct formula application)
- ✓ No product/quotient rule application (topic rule hard)
- ✓ Sub-C: Points $a$ are simple integers ($0, 2$), no fractions or $\pi$ multiples
- ✓ Sub-D: No elaborate word problems; simple velocity and parallel tangent only
- ✓ Results simplified and final (not left as intermediate steps)
- ✓ Decimals with coma (4,3) not present in numeric answers (all integers in current exercises)

---

## Field Completeness

| Field | Status | Notes |
|-------|--------|-------|
| `question` | ✓ All have complete intro + formula + question; no rule 32 violations | Imperatives like "Calculá", "Sabiendo que", "Hallá" |
| `options` | ✓ Exactly 4 per exercise (numeric/expression) | All fit grilla 2×2 when LaTeX visual length ≤12 |
| `correct_index` | ✓ Varied across all exercises (0, 1, 2, 3) | No concentrated pattern |
| `feedback_correct` | ✓ All 1-sentence, result-focused | E.g., "Correcto, $f'(x)=3x^2$ evaluada en $x=2$ da $12$." |
| `feedback_incorrect` | ✓ All complete arrays parallel to options; `null` in correct index | Each describes specific procedure error: coefficient omitted, sign lost, evaluation before derivation |
| `explanation` | ✓ 3-part structure: identify terms → apply rules with `\begin{aligned}` → combine/simplify | All structured algorithmically per topic-context |
| `tags` | ✓ **All added in Round 2** | One slug per exercise matching sub-family |
| `has_math` | ✓ All true | LaTeX in every exercise |
| `graph_fn`, `graph_view` | ✓ All null | No graphs required for RESL |
| `reviewed` | ✓ All false | Awaiting manual curriculum review |

---

## Cardinalidad Verification

| Sub-family | Requirement | Actual | Status |
|------------|-------------|--------|--------|
| A, B, C, D | 4 options each | 4 each | ✓ All match |
| A, C, D | Numeric/short expressions | All ≤35 chars or visual ≤12 (LaTeX) | ✓ All fit grilla 2×2 |

---

## Round 2 Workflow Notes

- All exercises verified for topic-context.md compliance
- No violations of authoring-context.md critical rules (6, 9, 18, 30, 32)
- Tagging applied systematically to enable distribution auditing
- No mathematical rewrites; only verification of format and structure
- Exercises preserve pedagogical grouping (Ex 10–12 build on tangent concept; Ex 13–14 on rate of change)

---

## Checklist Status (per topic-context.md)

**Transversal:**
- [x] `feedback_incorrect` complete: array of strings with `null` in correct index
- [x] No product/quotient/chain rule
- [x] No limit-based justifications
- [x] Explanations in 3-paragraph prosa; algorithmic structure
- [x] No viñetas, no em-dash (—), no humor
- [x] `correct_index` varied
- [x] Decimals with coma (if any) — not present in current exercise set
- [x] No context + question merged in single paragraph
- [x] No `\begin{aligned}` with independent evaluations misaligned

**RESL Specific:**
- [x] 15 exercises (target 50, deferred)
- [x] **Exactly 4 options** per exercise ✓
- [x] All expressions ≤35 characters (visual fit 2×2 grilla)
- [x] Distribution A/B/C/D noted (5/5/3/2 current; target 15/20/10/5)
- [x] Explanations: identify → apply → combine
- [x] No non-trivial function arguments
- [x] Sub-C: Points $a$ simple (integers, simple multiples of $\pi$ if any)
- [x] Sub-D: No complex word problems; direct application only
- [x] Results fully simplified (no intermediate steps left)

---

**Status:** All verified; ready for curriculum testing and expansion to 50 exercises per skill in future round.
