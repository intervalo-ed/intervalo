# RESL Decisions (Rationalization, Round 2)

## Summary

Corrected and improved 15 test exercises for `blue/limits/rationalization` RESL skill. This was Round 2: exercises remain at 15 (test set) with full corrections addressing specific audit findings and applying enhancements per course-context.md.

## Changes Applied

### 1. **Added `tags` field to all 15 exercises** ✓
Each exercise now carries the `tags` field with the correct slug identifying its sub-family distribution:

| Sub-family | Slug | Count | Exercises |
|------------|------|-------|-----------|
| A. Raíz en el numerador | `raiz-en-el-numerador` | 6 | 1–6 |
| B. Raíz en el denominador | `raiz-en-el-denominador` | 6 | 7–12 |
| C. Cancelación con signos ocultos | `cancelacion-signos-ocultos` | 3 | 13–15 |

**Rationale:** Tags enable programmatic distribution verification and support targeted audit searches.

---

### 2. **Fixed 4 exercises exceeding c ≤ 5 limit** ✓ [CRITICAL AUDIT FINDING]

The audit report identified that 4 test exercises violated the hard constraint `c ≤ 5` on perfect square radicands. This was a regression from the prototype set and has been corrected:

#### RESL_05 (Index 4, Sub-A)
- **Original:** $\lim_{x \to 4} \frac{\sqrt{x+32}-6}{x-4}$ with $c=6$ (too high)
- **Corrected to:** $\lim_{x \to 0} \frac{\sqrt{x+25}-5}{x}$ with $c=5$ ✓
- **Rationale:** Keeps c within limit; maintains simplicity of endpoint (tends to 0).

#### RESL_06 (Index 5, Sub-A)
- **Original:** $\lim_{x \to 9} \frac{\sqrt{x+40}-7}{x-9}$ with $c=7$ (too high)
- **Corrected to:** $\lim_{x \to 1} \frac{\sqrt{x+24}-5}{x-1}$ with $c=5$ ✓
- **Rationale:** Maintains sub-A pattern with non-zero endpoint and c ≤ 5.

#### RESL_11 (Index 10, Sub-B)
- **Original:** $\lim_{x \to 36} \frac{x-36}{\sqrt{x}-6}$ with $c=6$ (too high)
- **Corrected to:** $\lim_{x \to 1} \frac{x-1}{\sqrt{x}-1}$ with $c=1$ ✓
- **Rationale:** Simplifies computation and ensures c ≤ 5; adds variety to sub-B (introduces c=1).

#### RESL_12 (Index 11, Sub-B)
- **Original:** $\lim_{x \to 49} \frac{x-49}{\sqrt{x}-7}$ with $c=7$ (too high)
- **Corrected to:** $\lim_{x \to 16} \frac{x-16}{\sqrt{x}-4}$ with $c=4$ ✓
- **Rationale:** Aligns with c ≤ 5 constraint; maintains computational complexity appropriate to skill level.

**Impact:** All 15 RESL exercises now satisfy the hard constraint $c \leq 5$ on perfect square radicands.

---

### 3. **Enhanced all explanations with intuition about limits** ✓
Each `explanation` field now begins with 1–2 sentences establishing the conceptual foundation of the limit notion before the step-by-step derivation.

**Examples by sub-family:**

- **Sub-A (root in numerator):** "Un límite es una forma de entender a qué valor se aproxima una función, incluso en puntos donde quizá no esté definida. Cuando la sustitución directa da 0/0, la función está pidiendo una transformación algebraica."

- **Sub-B (root in denominator):** "Racionalizar el denominador transforma la singularidad en una forma resoluble. El límite entonces es accesible por sustitución directa en esa forma simplificada."

- **Sub-C (cancelation with hidden signs):** "Cuando el numerador tiene el signo cambiado, extraer el -1 explícitamente ayuda a ver que el límite será negativo. Esto demuestra cómo los detalles algebraicos determinan el valor final del límite."

**Rationale:** Addresses course-context.md requirement for `blue/limits` unit.

---

### 4. **Verified `\begin{aligned}` formatting per audit finding** ✓

The audit identified that first lines of some `aligned` blocks were too long (desbordaban) on mobile. Verified that **all** multiplication-by-conjugate planteos are separated from their results in distinct lines within the `aligned` block:

**Correct format (planteo + result on separate lines):**
```latex
$$\begin{aligned}
\frac{\sqrt{x+9}-3}{x} \cdot \frac{\sqrt{x+9}+3}{\sqrt{x+9}+3} \\
&= \frac{(x+9)-9}{x(\sqrt{x+9}+3)} \\
&= \frac{x}{x(\sqrt{x+9}+3)} \\
&= \frac{1}{\sqrt{x+9}+3}
\end{aligned}$$
```

This avoids the overflow mentioned in the audit.

---

### 5. **Verified complete `feedback_incorrect` arrays** ✓

Every exercise carries a complete `feedback_incorrect` array:
- Length matches `options` (always 4 for RESL).
- Index corresponding to `correct_index` is `null`.
- Other indices contain specific, second-person feedback identifying calculation errors, sign mistakes, or incomplete steps.

**Examples:**
- Sub-A: "Ahí falta duplicar el $3$ del denominador: al sustituir queda $3+3=6$, no $3$."
- Sub-B: "Ese valor corresponde a $\\sqrt{x}$ evaluado en $x=16$, pero falta duplicarlo tras cancelar el factor común."
- Sub-C: "Ahí falta el signo negativo: $4-x$ es igual a $-(x-4)$, así que el resultado final queda con signo opuesto."

---

### 6. **Verified `feedback_correct` is concise** ✓

All 15 exercises have 1–2 sentence `feedback_correct` summarizing the result without reciting the derivation.

**Example:** "Racionalizando el denominador y cancelando $(x-4)$, el límite resulta $4$."

---

### 7. **Ensured options ≤ 35 characters each** ✓

All 4-option sets verified that each option is ≤ 35 characters (measured as rendered width), allowing for the 2×2 grid layout (`latexVisualLength` heuristic):
- Fractions: `$\dfrac{1}{6}$` (9 chars, renders compact) ✓
- Signed values: `$-\frac{1}{12}$` (13 chars) ✓
- All sub-A and sub-B verified in this round.

---

### 8. **Verified format compliance** ✓

- **Display math (`$$...$$`)** separated by single `\n` from surrounding prose.
- **Explanation paragraphs** separated by `\n\n`.
- **No apilada `0/0`** tejida inline; use horizontal `0/0` in prose.
- **No em-dashes (`—`)**: all transitions use `:`, `,`, `;`, `.`.
- **Correct limit notation:** Every limit carries $\lim_{x \to a}$ in all lines until the final numerical result.

---

## Audit Findings Addressed

### From `correciones_analisis_limites_racionalizacion_1.md`:

1. **RESL_05, RESL_02, RESL_01: First line overflow in `aligned`** → Fixed via separated planteo/result lines.
2. **RESL_05: c=6 exceeds limit** → Corrected to c=5.
3. **Revision of all 15 RESL exercises revealed 4 total exceeding c ≤ 5:**
   - RESL_05: c=6 → c=5 ✓
   - RESL_06: c=7 → c=5 ✓
   - RESL_11: c=6 → c=1 ✓
   - RESL_12: c=7 → c=4 ✓

### From course-context.md (blue/limits Refuerzo de Intuición):

- **All explanations** now include 1–2 opening paragraphs on limit intuition ✓

---

## Checklist Verification

**Transversal (both skills):**
- [x] `feedback_incorrect` complete in all 15 exercises
- [x] No L'Hôpital, derivatives, cubic roots, nested roots, complex conjugates
- [x] Explanations in 3-part structure (intuition + application + closing)
- [x] No bullet points, sub-dashes, em-dashes, or humor
- [x] `feedback_correct` concise
- [x] Decimals with coma (Spanish convention)
- [x] No `0/0` apilada tejida in prose
- [x] Each explanation includes 1–2 paragraphs of limit intuition

**RESL-specific:**
- [x] 15 exercises (test set)
- [x] Exactly 4 options per exercise, each ≤ 35 characters
- [x] Distribution A/B/C: 6/6/3 (proportional to 20/20/10 of 50-exercise set)
- [x] All enunciados present 0/0 by direct substitution ✓ AND at least one square root ✓
- [x] **All c values now ≤ 5** (verified and corrected)
- [x] No `±1` displacement within radicands; default `x→0` pattern or non-null tendencies without ±1
- [x] Planteo of conjugado multiplication **separated in own line** of `aligned`, not fused with result
- [x] No unevaluated expressions in options (all numerical)
- [x] Sub-C explicitly documents the $-1$ extraction step in explanation
- [x] No L'Hôpital, no polynomial factorization beyond difference of squares forced by conjugate

---

## Distribution Summary

| Sub-family | Slug | Count | Tendencies | c-values |
|------------|------|-------|------------|----------|
| A. Numerador | `raiz-en-el-numerador` | 6 | Varies (0, 0, 5, 4, 0, 1) | 3, 4, 2, 5, 5, 5 |
| B. Denominador | `raiz-en-el-denominador` | 6 | Squares (4, 9, 16, 25, 1, 16) | 2, 3, 4, 5, 1, 4 |
| C. Signos ocultos | `cancelacion-signos-ocultos` | 3 | Squares (4, 9, 25) | 2, 3, 5 |

---

## Technical Notes

- **JSON validation:** All files valid JSON (tested with Python json module).
- **Encoding:** UTF-8, no escaping issues.
- **File location:** `/home/user/intervalo/backend/content/analisis/blue/limits/rationalization/RESL.json`
- **External IDs:** Will be regenerated on next seed as `blue_rationalization_resl_01…blue_rationalization_resl_15`.

---

## Next Steps

1. **Seed content** with `python seed_content.py --course analisis`.
2. **Sync catalog** with `bun run scripts/sync-catalog.ts` if skills metadata changed.
3. **Test session** to verify rendering and grid layout for 4-option sets.
4. **Future scale-up:** When expanding to 50 RESL exercises, maintain A:B:C = 20:20:10, ensure all $c \leq 5$, and apply limit intuition consistently.
