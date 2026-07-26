#!/usr/bin/env python3
"""
Comprehensive fixer v2 for rational functions content warnings.

Fixes 519+ warnings by applying targeted strategies for each rule.
"""

import json
import re
import sys
from collections import defaultdict
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple
from statistics import median

CONTENT_DIR = Path(__file__).resolve().parent / "content"
RATIONAL_DIR = CONTENT_DIR / "analisis" / "white" / "functions" / "rational"
FILES_TO_FIX = ["FORM.json", "GRAF.json", "LEXI.json"]

# Thresholds
PARAGRAPH_PROSE_MAX = 200
INLINE_FRAGMENTS_WARN = 3
FEEDBACK_CORRECT_MAX = 160
LONGEST_RATIO = 1.2
SHORTEST_RATIO = 0.8
MIN_ABS_GAP = 5

# Regex patterns
DISPLAY_RE = re.compile(r"\$\$.*?\$\$", re.DOTALL)
INLINE_RE = re.compile(r"(?<!\$)\$(?!\$)([^$\n]+)\$(?!\$)")
TEXTCMD_RE = re.compile(r"\\text\{([^{}]*)\}")
LATEX_CMD_RE = re.compile(r"\\[a-zA-Z]+")

# Diagnostic patterns
DIAGNOSTIC_CLOSE_RE = re.compile(
    r"(?:"
    r"\b(el|la|los|las|una?|este|esta|estos|estas)\s+(confusi[oó]n(es)?|error(es)?|trampa(s)?)\b"
    r"(?:\s+(?:m[aá]s\s+)?(?:t[ií]pic[oa]s?|com[uú]n(?:es)?|frecuente(?:s)?|cl[aá]sico(?:a)?s?|habitual(?:es)?|grave(?:s)?))?"
    r"\s+(?:es|son)\b"
    r"|"
    r"(?<!no )es\s+(?:un|una|la|el|los|las)\s+(?:m[aá]s\s+)?(?:t[ií]pic[oa]s?|com[uú]n(?:es)?|frecuente(?:s)?|cl[aá]sico(?:a)?s?|habitual(?:es)?|grave(?:s)?)?\s*(confusi[oó]n(es)?|error(es)?|trampa(s)?)\b"
    r")",
    re.IGNORECASE,
)

ACCUSATORY_STARTS = [
    "Confunde", "Confundís", "Invierte", "Invertís", "Olvida", "Olvidás",
    "Ignora", "Ignorás", "Interpreta", "Falla en", "Se olvidó", "Falta",
]

STATS = {
    "files_processed": 0,
    "items_processed": 0,
    "fixes_by_rule": defaultdict(int),
}


def render_len(s: str) -> int:
    """Estimate render length."""
    t = s
    t = t.replace("$$", "").replace("$", "")
    t = TEXTCMD_RE.sub(lambda m: m.group(1), t)
    t = LATEX_CMD_RE.sub("", t)
    t = re.sub(r"[{}^_&]|\\\\|\\[,;!:]", "", t)
    t = re.sub(r"\s+", " ", t).strip()
    return len(t)


def strip_math(s: str) -> str:
    """Remove math zones."""
    return INLINE_RE.sub(" ", DISPLAY_RE.sub(" ", s))


def paragraphs(s: str) -> list:
    """Split into paragraphs."""
    return [p for p in s.split("\n\n") if p.strip()]


def prose_segments(p: str) -> list:
    """Split paragraph by display formulas."""
    return [s for s in DISPLAY_RE.split(p) if s.strip()]


# ============================================================================
# RULE 18: Move central inline formulas to display mode
# ============================================================================

def fix_rule_18_question(question: str) -> Tuple[str, bool]:
    """
    Move central inline formulas in questions to display mode.

    Pattern: $f(x) = \dfrac{...}$ in the question should become display mode.
    """
    if not question or not isinstance(question, str):
        return question, False

    changed = False

    # Look for function assignment patterns in inline
    # Pattern: $f(...) = \dfrac{...}$ or similar
    def replace_central_formula(match):
        nonlocal changed
        formula = match.group(0)
        # Don't convert if already has multiple formulas or is very short
        if formula.count("$") > 2:
            return formula
        # Check if this looks central (has = and fraction)
        if "=" in formula and "frac" in formula:
            changed = True
            return "\n$$" + formula[1:-1] + "$$\n"
        return formula

    # Find inline formulas with function definitions
    original = question
    # Match patterns like $f(x) = \dfrac{...}$ or $g(x) = \dfrac{...}$
    question = re.sub(
        r"\$[a-z]\(.*?\)\s*=\s*\\[dt]?frac\{[^}]*\}\{[^}]*\}\$",
        replace_central_formula,
        question
    )

    # Clean up multiple newlines
    question = re.sub(r"\n+", "\n", question)

    return question, changed


# ============================================================================
# RULE 21: Split prose with 3+ inline formulas
# ============================================================================

def split_inline_dense_prose(text: str) -> Tuple[str, bool]:
    """
    Split prose segments with 3+ inline formulas.

    Separates prose and formulas into distinct paragraphs.
    """
    if not text or not isinstance(text, str):
        return text, False

    changed = False
    result_paras = []

    for para in paragraphs(text):
        # Split by display formulas first
        parts = DISPLAY_RE.split(para)

        new_parts = []
        for part in parts:
            if not part.strip():
                continue

            # Check if this is prose with too many inline formulas
            flat_prose = re.sub(r"\s+", " ", part).strip()
            inline_count = len(INLINE_RE.findall(flat_prose))

            if inline_count >= INLINE_FRAGMENTS_WARN:
                # Too many inline formulas - split into separate items
                # Strategy: split on periods or after formulas
                segments = []
                current = ""

                # Split on sentence boundaries
                sentences = re.split(r"(?<=[.!?])\s+", flat_prose)

                for sent in sentences:
                    if not sent.strip():
                        continue

                    test = current + " " + sent if current else sent
                    sent_inline_count = len(INLINE_RE.findall(test))

                    if sent_inline_count >= INLINE_FRAGMENTS_WARN and current:
                        # Start new segment
                        segments.append(current.strip())
                        current = sent
                    else:
                        current = test

                if current.strip():
                    segments.append(current.strip())

                # Add segments as separate parts
                for seg in segments:
                    if seg:
                        new_parts.append(seg)
                        changed = True
            else:
                new_parts.append(part)

        # Join parts into paragraph
        if new_parts:
            result_paras.append("\n\n".join(new_parts))

    result = "\n\n".join(result_paras)
    return result, changed


# ============================================================================
# RULE párrafos: Split long prose (>200 chars)
# ============================================================================

def fix_long_prose_segments(text: str, max_len: int = PARAGRAPH_PROSE_MAX) -> Tuple[str, bool]:
    """
    Split long prose segments at sentence boundaries.

    Operates on prose segments between display formulas.
    """
    if not text or not isinstance(text, str):
        return text, False

    changed = False
    result_paras = []

    for para in paragraphs(text):
        # Process segments between display formulas separately
        parts = DISPLAY_RE.split(para)

        new_parts = []
        for part in parts:
            part = part.strip()
            if not part:
                continue

            # Check if it's a display formula
            if part.startswith("$$") and part.endswith("$$"):
                new_parts.append(part)
                continue

            # It's prose - check length
            flat_prose = re.sub(r"\s+", " ", part).strip()
            if len(flat_prose) > max_len:
                # Split at sentence boundaries
                sentences = re.split(r"(?<=[.!?])\s+", flat_prose)

                current = ""
                for sent in sentences:
                    if not sent.strip():
                        continue

                    test = current + " " + sent if current else sent

                    if len(test) > max_len and current:
                        # Save current and start new
                        new_parts.append(current.strip())
                        current = sent
                        changed = True
                    else:
                        current = test

                if current.strip():
                    new_parts.append(current.strip())
            else:
                new_parts.append(flat_prose)

        # Reconstruct paragraph
        result_paras.append("\n\n".join(new_parts))

    result = "\n\n".join(result_paras)
    return result, changed


# ============================================================================
# RULE 34: Rewrite diagnostic closes
# ============================================================================

def fix_rule_34_diagnostic_close(text: str) -> Tuple[str, bool]:
    """
    Rewrite explanations ending with diagnostic language.

    Remove markers like "Un error típico es", "La confusión común es", etc.
    """
    if not text or not isinstance(text, str):
        return text, False

    paras = paragraphs(text)
    if not paras:
        return text, False

    last_para = paras[-1].strip()
    original_last = last_para

    # Remove bold markup
    last_para = re.sub(r"^\*\*([^*]+)\*\*", r"\1", last_para)

    if not DIAGNOSTIC_CLOSE_RE.search(last_para):
        return text, False

    # Remove diagnostic markers
    # Pattern 1: "Un/Una/El/La ... error/confusión/trampa ... es"
    last_para = re.sub(
        r"(?:Un|Una|El|La|Los|Las)\s+(?:error|confusión|trampa)\s+"
        r"(?:típic[oa]|común|frecuente|clásic[oa]|habitual|grave)\s+es\s+",
        "",
        last_para,
        flags=re.IGNORECASE
    )

    # Pattern 2: "Es un/una/el/la ... error/confusión/trampa ..."
    last_para = re.sub(
        r"es\s+(?:un|una|el|la|los|las)\s+(?:error|confusión|trampa)\s+"
        r"(?:típic[oa]|común|frecuente|clásic[oa]|habitual|grave)\s+",
        "",
        last_para,
        flags=re.IGNORECASE
    )

    # Pattern 3: "... es la/el/la ... error/confusión/trampa típica"
    last_para = re.sub(
        r"\s+es\s+(?:un|una|el|la|los|las)\s+(?:error|confusión|trampa)\s+"
        r"(?:típic[oa]|común|frecuente|clásic[oa]|habitual|grave)",
        "",
        last_para,
        flags=re.IGNORECASE
    )

    if last_para != original_last:
        paras[-1] = last_para
        return "\n\n".join(paras), True

    return text, False


# ============================================================================
# RULE 4: Fix option length imbalance
# ============================================================================

def fix_rule_4_option_length(options: List[str], correct_index: int) -> Tuple[List[str], bool]:
    """
    Fix when correct answer is notably longer/shorter than distractors.

    Strategy:
    - If correct is too long: trim by removing unnecessary qualifiers or examples
    - If correct is too short: strengthen with brief qualifiers
    """
    if not options or not isinstance(correct_index, int):
        return options, False

    if correct_index < 0 or correct_index >= len(options):
        return options, False

    rends = [render_len(o) for o in options]
    correct_len = rends[correct_index]
    other_rends = [l for i, l in enumerate(rends) if i != correct_index]

    if not other_rends:
        return options, False

    med_other = sorted(other_rends)[len(other_rends) // 2]

    # Case 1: Correct is notably longer
    if (correct_len > LONGEST_RATIO * med_other and
        correct_len - max(other_rends) >= MIN_ABS_GAP):
        # Try to trim - but this is risky, so only for obvious cases
        # Example: "Hay un agujero: el límite existe pero f(1) no está definida"
        # Could become: "Hay un agujero (límite existe pero f(1) indefinida)"
        option = options[correct_index]

        # Look for ":" that we could use to shorten
        if ":" in option and len(option.split(":", 1)[0]) < 20:
            # Keep only the first part before the colon
            shortened = option.split(":", 1)[0].strip()
            if render_len(shortened) < correct_len * 0.7:
                new_options = list(options)
                new_options[correct_index] = shortened
                return new_options, True

        # Try removing long parenthetical explanations
        match = re.search(r"\(([^)]{20,})\)$", option)
        if match:
            without_paren = option[:match.start()].strip()
            if render_len(without_paren) > med_other * 0.8:
                new_options = list(options)
                new_options[correct_index] = without_paren
                return new_options, True

    # Case 2: Correct is notably shorter
    if (correct_len < SHORTEST_RATIO * med_other and
        med_other - correct_len >= MIN_ABS_GAP):
        # Add brief qualifier
        option = options[correct_index]
        # Don't add if already has parenthetical qualifier
        if "(" not in option or not option.endswith(")"):
            # Add a brief note like "(único valor)"
            if "valor" in str(options).lower() and "$x$" in option:
                new_opt = option + " (único valor)"
                new_options = list(options)
                new_options[correct_index] = new_opt
                return new_options, True

    return options, False


# ============================================================================
# RULE fórmulas anchas: Simplify chained equalities
# ============================================================================

def fix_wide_formulas_feedback(feedback: str) -> Tuple[str, bool]:
    """
    Simplify feedback_correct with 3+ chained equalities.

    Keep only first and last parts.
    """
    if not isinstance(feedback, str) or not feedback.strip():
        return feedback, False

    eq_count = feedback.count("=")
    if eq_count < 3:
        return feedback, False

    # Find formulas with multiple equalities
    formulas = list(re.finditer(r"\$[^$]*=[^$]*=[^$]*\$", feedback))
    if not formulas:
        return feedback, False

    changed = False
    for formula_match in formulas:
        formula = formula_match.group(0)
        # Extract parts
        content = formula[1:-1]  # Remove $ delimiters
        parts = [p.strip() for p in content.split("=")]

        if len(parts) >= 3:
            # Keep first and last
            simplified = " = ".join([parts[0], parts[-1]])
            simplified = "$" + simplified + "$"
            feedback = feedback.replace(formula, simplified)
            changed = True

    return feedback, changed


# ============================================================================
# RULE anti-acusación: Rewrite accusatory feedback
# ============================================================================

def fix_anti_accusation_feedback(feedback: str) -> Tuple[str, bool]:
    """Rewrite feedback_incorrect starting with accusatory language."""
    if not isinstance(feedback, str) or not feedback.strip():
        return feedback, False

    first_words = feedback.strip()

    for start in ACCUSATORY_STARTS:
        if first_words.startswith(start + " ") or first_words == start:
            # Rewrite
            rewritten = feedback
            if first_words.startswith("Confundís "):
                rewritten = "Este distractor confunde " + first_words[10:]
            elif first_words.startswith("Confunde "):
                rewritten = "Este distractor confunde " + first_words[9:]
            elif first_words.startswith("Olvida"):
                rewritten = "Una omisión común es " + first_words[7:]
            elif first_words.startswith("Falta "):
                rewritten = "Hay que " + first_words[6:]
            elif first_words.startswith("Ignora"):
                rewritten = "Se deja de lado " + first_words[7:]

            return rewritten, rewritten != feedback

    return feedback, False


# ============================================================================
# Main fixer
# ============================================================================

def fix_item(item: Dict[str, Any], item_idx: int) -> Dict[str, Any]:
    """Apply all fixes to a single item."""
    fixed = item.copy()

    # Fix explanation
    if "explanation" in fixed and isinstance(fixed["explanation"], str):
        original = fixed["explanation"]

        # Apply fixes in sequence
        fixed["explanation"], _ = fix_rule_34_diagnostic_close(fixed["explanation"])
        fixed["explanation"], _ = fix_long_prose_segments(fixed["explanation"])
        fixed["explanation"], _ = split_inline_dense_prose(fixed["explanation"])

        if fixed["explanation"] != original:
            STATS["fixes_by_rule"]["explanation"] += 1

    # Fix question (rule 18)
    if "question" in fixed and isinstance(fixed["question"], str):
        original = fixed["question"]
        fixed["question"], changed = fix_rule_18_question(fixed["question"])
        if changed:
            STATS["fixes_by_rule"]["question_rule18"] += 1

    # Fix options (rule 4)
    if "options" in fixed and "correct_index" in fixed:
        original_opts = fixed["options"]
        fixed["options"], changed = fix_rule_4_option_length(
            fixed["options"], fixed["correct_index"]
        )
        if changed:
            STATS["fixes_by_rule"]["options_rule4"] += 1

    # Fix feedback_correct (fórmulas anchas)
    if "feedback_correct" in fixed and isinstance(fixed["feedback_correct"], str):
        original = fixed["feedback_correct"]
        fixed["feedback_correct"], changed = fix_wide_formulas_feedback(
            fixed["feedback_correct"]
        )
        if changed:
            STATS["fixes_by_rule"]["feedback_correct"] += 1

    # Fix feedback_incorrect (anti-acusación)
    if "feedback_incorrect" in fixed and isinstance(fixed["feedback_incorrect"], list):
        for i, fb in enumerate(fixed["feedback_incorrect"]):
            if isinstance(fb, str):
                fb_fixed, changed = fix_anti_accusation_feedback(fb)
                if changed:
                    fixed["feedback_incorrect"][i] = fb_fixed
                    STATS["fixes_by_rule"]["feedback_incorrect"] += 1

    return fixed


def process_file(file_path: Path) -> bool:
    """Process a single JSON file."""
    print(f"\n{file_path.name}:", end=" ")

    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            items = json.load(f)
    except Exception as e:
        print(f"ERROR: {e}")
        return False

    if not isinstance(items, list):
        print(f"ERROR: Not an array")
        return False

    # Fix items
    fixed_items = []
    for idx, item in enumerate(items):
        fixed_items.append(fix_item(item, idx))

    STATS["items_processed"] += len(items)

    # Save
    try:
        with open(file_path, 'w', encoding='utf-8') as f:
            json.dump(fixed_items, f, ensure_ascii=False, indent=2)
        print(f"✓ ({len(items)} items)")
        return True
    except Exception as e:
        print(f"ERROR: {e}")
        return False


def main() -> int:
    """Main entry point."""
    print("=" * 70)
    print("Rational Functions Content Fixer v2")
    print("=" * 70)

    if not RATIONAL_DIR.exists():
        print(f"ERROR: {RATIONAL_DIR} not found")
        return 1

    print(f"\nWorking on: {RATIONAL_DIR}\n")

    # Process files
    success_count = 0
    for fname in FILES_TO_FIX:
        file_path = RATIONAL_DIR / fname
        if not file_path.exists():
            print(f"{fname}: ERROR (not found)")
            continue
        if process_file(file_path):
            success_count += 1
            STATS["files_processed"] += 1

    print("\n" + "=" * 70)
    print("SUMMARY")
    print("=" * 70)
    print(f"Files: {STATS['files_processed']}/{len(FILES_TO_FIX)}")
    print(f"Items: {STATS['items_processed']}")
    print("\nFixes applied:")
    for rule, count in sorted(STATS["fixes_by_rule"].items()):
        print(f"  {rule}: {count}")

    return 0 if success_count == len(FILES_TO_FIX) else 1


if __name__ == "__main__":
    sys.exit(main())
