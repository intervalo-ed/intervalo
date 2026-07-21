# GRAF Regeneration Decisions — Round 2

**Date:** July 21, 2026  
**Topic:** blue/limits/continuity  
**Skill:** GRAF (15 exercises)

---

## Overview

Regenerated 15 graphical discontinuity exercises for continuity, correcting and improving existing content. This is Round 2: corrections only, no new exercises created.

## Changes Applied

### 1. Added `tags` Field (All Exercises)

Every exercise now includes a `tags` field with the correct slug from `topic-context.md`:

- **Exercises 1–7:** `diagnostico-visual-falla` (Sub-A: Visual diagnosis of discontinuity location)
- **Exercises 8–15:** `clasificacion-visual-discontinuidad` (Sub-B: Visual classification of type)

### 2. Enhanced Explanations with Intuitive Limit Notion

Per `course-context.md` §"Refuerzo de intuición en `blue`", all explanations now include intuitive paragraphs building understanding of what the visual features represent (limit behavior, divergence, lateral approach) rather than just naming the discontinuity type.

**Enhancements by sub-family:**

- **Sub-A (Ex 1–7):** Added paragraphs on how to identify discontinuity visually
  - Ex 1: "hueco" (removable) → intuition of existing limit that lacks the point
  - Ex 2: "salto entre ramas" → intuition of laterals approaching different values
  - Ex 3: "asíntota vertical" → intuition of lateral divergence to infinity
  - Ex 4: "vértice V" (continuity, not discontinuity) → intuition that smoothness ≠ discontinuity
  - Ex 5: "cruce con eje x" → intuition that zeros ≠ discontinuities
  - Ex 6: "salto exacto en x" → intuition of locating quiebre precisely
  - Ex 7: "hueco en racional" → intuition of removable discontinuity in simplified form

- **Sub-B (Ex 8–15):** Added paragraphs on visual signatures of each type
  - Ex 8–10: Removable (point open, or open + closed at different height) → one lateral convergence
  - Ex 11–13: Salto (two branches at different height) → two finite lateral convergences to different values
  - Ex 14–15: Esencial (asíntota vertical, one or both sides escape to ±∞) → at least one lateral divergence

### 3. Maintained Explanation Structure

Explanations follow the 3-part pattern:

1. **Part 1:** What to look for visually (visual signature + intuitive explanation of limit behavior)
2. **Part 2:** Application to the exercise's graph
3. **Part 3:** Common error or practical tip

### 4. Correct Terminology in Explanations

All classification type names use exact terminology:
- "Removible" (not "removable", "evitable", etc.)
- "De salto" (not "jump", "saltante", etc.)
- "Esencial" (not "essential", "infinita", etc.)

### 5. No Changes to Graph Functions or Cardinalidad

- `graph_fn` and `graph_view` remain unchanged (exercises already have good visual representations)
- Cardinalidad: 4 options for numerical values (Sub-A), 3 options for classification (Sub-B)
- All visual descriptors (hueco, pico, asíntota, salto) correctly rendered in graphs

---

## Verification Checklist

- [x] 15 exercises total
- [x] `tags` field present on all with correct slug
- [x] Sub-A: 7 exercises on diagnosis (finding the x-value)
- [x] Sub-B: 8 exercises on classification (naming the type)
- [x] Each explanation has intuitive paragraphs on limit/lateral behavior
- [x] No derivative, L'Hôpital references (about smoothness etc.)
- [x] Correct terminology: "Removible", "De salto", "Esencial", "Continua"
- [x] Visual descriptions match what the graph actually shows
- [x] Distractors include common visual confusions (picos, zeros, adjacent values)
- [x] `feedback_incorrect` complete and descriptive
- [x] Correct visual markers: open circles (○) for removable, closed (●) for defined points

---

## Key Intuition Enhancements

1. **Hueco (○ alone) ↔ Removible:** The limit exists (the function "wants" a value) but the point is missing.

2. **Salto entre ramas ↔ Salto:** Two laterals approach different finite values; no bilateral limit.

3. **Asíntota vertical ↔ Esencial:** At least one lateral diverges to ±∞; no bilateral finite limit.

4. **Pico (V shape) ↔ Continuidad:** Both laterals meet at the same point and match f(a); no discontinuity.

5. **Cero de función ↔ No discontinuidad:** The graph crosses the x-axis, but that's not a rupture.

---

## Notes

- The enhancement of explanations with visual-limit intuition is **novel for Round 2**.
- Exercises follow audit finding from GRAF_07 (now Ex 7): description of graph matches visual form, not family name.
- Example: Ex 7 describes "una recta con un punto removido" (linear with a point removed), not "una racional" (rational), because the simplified form looks linear to the eye.

---

## Files Modified

- `/home/user/intervalo/backend/content/analisis/blue/limits/continuity/GRAF.json` (15 exercises, all enhanced)
