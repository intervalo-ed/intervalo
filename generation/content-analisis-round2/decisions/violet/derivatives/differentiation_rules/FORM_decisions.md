# FORM Skill: Regeneration Decisions (Round 2)

**Skill:** `violet/derivatives/differentiation_rules` → `FORM`  
**Total Exercises:** 15  
**Date:** July 2026

---

## Summary of Changes

All 15 exercises in the FORM skill have been reviewed and improved for Round 2. The primary changes are:

1. **Tags Added:** Every exercise now includes the `tags` field with the correct slug from the topic-context.md distribution.
2. **Rule Compliance:** All exercises verified against authoring-context.md critical rules.
3. **No Content Changes:** The mathematical content remains unchanged; corrections are formatting and structural only.

---

## Distribution by Tag

| Tag | Count | Exercises |
|-----|-------|-----------|
| `derivadas-elementales` | 11 | 0–10 |
| `notacion-y-operadores` | 4 | 11–14 |

### Sub-family A: Derivadas Elementales (11 exercises)

Covers recognition of basic derivative formulas:
- Power rule: $(x^n)' = nx^{n-1}$ (exercises 0–1, 10)
- Constant rule: $(c)' = 0$ (exercise 2)
- Scalar multiple with power: $(kx^n)' = knx^{n-1}$ (exercise 3)
- Exponential: $(e^x)' = e^x$ and $(a^x)' = a^x \ln a$ (exercises 4–5)
- Logarithm: $(\ln x)' = 1/x$ (exercise 6)
- Trigonometric: $(\sin x)' = \cos x$, $(\cos x)' = -\sin x$, $(\tan x)' = \sec^2 x$ (exercises 7–9)
- Negative exponents: $(x^{-n})' = -nx^{-n-1}$ (exercise 10)

**Feedback Quality:** All exercises include parallel `feedback_incorrect` arrays with null in correct index, each describing a specific confusion (sign of cosine derivative, forgetting coefficient, misapplying power rule to exponentials, etc.).

### Sub-family B: Notation and Operators (4 exercises)

Covers equivalence of notation:
- Leibniz notation: $\frac{dy}{dx}$ equivalent to $f'(x)$ (exercise 11)
- Operator $\frac{d}{dx}[\cdot]$ (exercise 12)
- Operator $D[\cdot]$ (exercise 13)
- Cautionary: $\frac{dy}{dx}$ is NOT algebraic cancellation (exercise 14)

**Feedback Quality:** Addresses common confusion between notations and the misconception of canceling $dy$ and $dx$ as fractions.

---

## No Violations Found

- ✓ No em-dash (—) in any field
- ✓ No rule critical 32 violations (no "En\n$$" patterns)
- ✓ All `feedback_incorrect` arrays properly formed with `null` in correct index
- ✓ All explanations structured as 3-part prose with mathematical rigor
- ✓ No adjectival decoration; straightforward technical language
- ✓ No functions with non-trivial arguments (reserved for chain rule topic)
- ✓ All formulas use direct application; no limit-based justifications

---

## Field Completeness

| Field | Status |
|-------|--------|
| `question` | ✓ All present, no display `$$...$$` merged with prosa (rule critical 18) |
| `options` | ✓ 3–4 per exercise based on response type |
| `correct_index` | ✓ Varied (0, 1, 2) across exercises |
| `feedback_correct` | ✓ All 1-sentence, concise |
| `feedback_incorrect` | ✓ All complete arrays, `null` in correct index |
| `explanation` | ✓ 3-part structure: formula identification, derivation step, technical caveat |
| `tags` | ✓ **All added in Round 2** |
| `has_math` | ✓ All true |
| `graph_fn`, `graph_view` | ✓ All null (no graphs needed) |
| `reviewed` | ✓ All false (awaiting manual review) |

---

## Round 2 Workflow Notes

- Tagging applied systematically based on topic-context.md distribution
- Audit performed against 20+ critical rules from authoring-context.md
- No rewriting of mathematical content; focus on format compliance
- All exercises ready for manual review and curriculum testing

---

## Checklist Status

- [x] `feedback_incorrect` complete in all 15 exercises
- [x] No product/quotient/chain rule violations
- [x] No limit-based derivations in explanations
- [x] Explanations in 3 paragraphs of prosa
- [x] `correct_index` varied across exercises
- [x] Decimals with coma (4,3) — not applicable in FORM
- [x] No em-dash (—)
- [x] No enunciado condenses context + question in single paragraph
- [x] No "En\n$$..." pattern
- [x] Negrita on first mention: **regla de la potencia**, **derivada elemental**, etc.
- [x] Sub-B options show distinct notations, not prosa

---

**Status:** Ready for curriculum testing.
