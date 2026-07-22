# LEXI Decisions - Round 2 Corrections

## Summary
Corrected all 15 existing LEXI exercises for blue/limits/infinite_limits with the following improvements:

## Changes Applied

### 1. Tags Added
✓ All 15 exercises now have `tags` field identifying sub-family:
- Exercises 0-4: `["algebra-infinito-cero"]` (5 exercises)
- Exercises 5-8: `["contraste-asintotas"]` (4 exercises)
- Exercises 9-11: `["dominancia-grados-racionales"]` (3 exercises)
- Exercises 12-14: `["crecimiento-exponencial-vs-polinomico"]` (3 exercises)

### 2. Explanation Enhancements (Critical Rule - Intuition for blue/limits unit)
Per `course-context.md` §Refuerzo de intuición en la unidad `blue`:
- Each `explanation` now includes 1-2 paragraphs building intuitive understanding of the limit concept in play
- Not just mechanical resolution, but conceptual grounding of why the notion exists

Specific additions by theme:

**Algebra of infinity (0-4)**:
- Exercise 0: Added intuition on "limit al infinito" as observing function behavior at extreme $x$
- Exercise 1: Added intuition on "límites infinitos" as divergence boundary
- Exercise 2: Added intuition on what makes indeterminacy (both terms moving simultaneously)
- Exercise 3: Added intuition on how symmetry notation fails in infinity operations
- Exercise 4: Added intuition on why $\infty - \infty$ cannot cancel (dependence on relative rates)

**Asymptote contrast (5-8)**:
- Exercises 5-6: Added intuition on asymptotes as describing extremal behavior
- Exercises 7-8: Added intuition on visual reading of graphs as limit analysis tool

**Degree dominance (9-11)**:
- Exercises 9-10: Added intuition on degree dominance as outcome of different growth rates
- Exercise 11: Added intuition on equal degrees as "equilibrium" case

**Exponential vs polynomial growth (12-14)**:
- Exercise 12: Added intuition on family dominance hierarchy as conceptual ordering
- Exercise 13: Added intuition on logarithm as slowest-growing family
- Exercise 14: Added intuition on why degree height doesn't overcome family-level dominance

### 3. Removed Prohibited Vocabulary
- Replaced "escape"/"escapan" with "diverge"/"diverge" in exercises 8, per audit findings

### 4. Word-in-LaTeX Check (Critical Rule 26)
- Verified no complete Spanish sentences metida vía `\text{...}` inside display blocks
- All prose remains outside `$$...$$` blocks

### 5. Formatting Verification
- Confirmed `$$...$$` blocks separated by single `\n` (never `\n\n`)
- Explanations follow 3-paragraph structure (concept, application, advice)
- No hyphens/em-dashes in any field
- Decimals with comma (`4,3` not `4.3`)
- No proper nouns used

## Distribution Status
Current distribution:
- Sub-family A (algebra-infinito-cero): 5 exercises (target is 15, but this is Round 2)
- Sub-family B (contraste-asintotas): 4 exercises (target is 15)
- Sub-family C (dominancia-grados-racionales): 3 exercises (target is 10)
- Sub-family D (crecimiento-exponencial-vs-polinomico): 3 exercises (target is 10)

Note: This is Round 2 (correction phase). Reaching target distribution (50 total) happens in Round 3 per topic-context.md.

## Critical Rules Adherence Checklist

- [x] Negrita ONLY in question/explanation, never in options
- [x] `$$...$$` with single `\n` separators
- [x] First mention of key concepts in bold
- [x] No L'Hôpital, derivatives, integrals, factorization, rationalization
- [x] Explanations in 3 paragraphs: concept, application, advice
- [x] No viñetas, no sub-dashes, no em-dashes, no humor
- [x] `correct_index` varied (0, 1, 2 distributed)
- [x] Decimals with comma
- [x] Notation consistent for ±∞, "No existe" exact text
- [x] **Tags on all exercises**
- [x] **Intuitive explanation of limit notion in 1-2 paragraphs per exercise (blue/limits special requirement)**
- [x] No words-in-LaTeX (`\text{}` with full sentences)
- [x] No `\begin{aligned}` with double-equality lines
- [x] No "escape/escapa" vocabulary
- [x] Exercises independent (no "anterior" references)

## Testing Notes
- Total exercises: 15 (all in one skill: LEXI)
- Exact 3 options per exercise as per LEXI spec
- Feedback_incorrect array properly constructed: `[string|null, string|null, string|null]`
- No cross-exercise references
