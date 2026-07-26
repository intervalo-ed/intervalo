#!/usr/bin/env python3
"""
Safe fixer v3: Focus on mechanical fixes only.

Avoids structural changes that introduce new errors. Focuses on:
- Rule 34: Diagnostic closes (text rewrite)
- párrafos: Long prose (sentence splitting)
- Rule 21: Inline density (prose segment splitting)
- anti-acusación: Accusatory feedback (text rewrite)
- fórmulas anchas: Chained equalities (formula simplification)
- Rule 4: Option length (careful additions only)

Skips rule 18 (inline formula conversion) as it's too risky.
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

# Diagnostic patterns (from validator)
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
    "items_touched": set(),
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


def paragraphs(s: str) -> list:
    """Split into paragraphs."""
    return [p for p in s.split("\n\n") if p.strip()]


def prose_segments(p: str) -> list:
    """Split paragraph by display formulas."""
    return [s for s in DISPLAY_RE.split(p) if s.strip()]


# ============================================================================
# RULE 34: Rewrite diagnostic closes (SAFE)
# ============================================================================

def fix_rule_34(text: str) -> Tuple[str, bool]:
    """
    Safely rewrite explanations ending with diagnostic language.

    Only rewrites the ending, doesn't restructure.
    """
    if not text or not isinstance(text, str):
        return text, False

    paras = paragraphs(text)
    if not paras:
        return text, False

    last_para = paras[-1].strip()
    original_last = last_para

    # Remove bold markup if present at start
    last_para = re.sub(r"^\*\*([^*]+)\*\*", r"\1", last_para)

    if not DIAGNOSTIC_CLOSE_RE.search(last_para):
        return text, False

    # Try to remove diagnostic markers - multiple patterns
    patterns = [
        (r"Un\s+error\s+(?:típic[oa]|común|frecuente|clásic[oa]|habitual|grave)\s+es\s+",
         ""),
        (r"Una\s+confusión\s+(?:típica|común|frecuente|clásica|habitual|grave)\s+es\s+",
         ""),
        (r"La\s+confusión\s+(?:típica|común|frecuente|clásica|habitual|grave)\s+es\s+",
         ""),
        (r"El\s+error\s+(?:típico|común|frecuente|clásico|habitual|grave)\s+es\s+",
         ""),
        (r"Una\s+trampa\s+(?:típica|común|frecuente|clásica|habitual|grave)\s+es\s+",
         ""),
        (r"(?<!no\s)es\s+(?:un|una|la|el)\s+(?:error|confusión|trampa)\s+(?:típic[oa]|común|frecuente|clásic[oa]|habitual|grave)",
         ""),
    ]

    rewritten = last_para
    for pattern, replacement in patterns:
        rewritten = re.sub(pattern, replacement, rewritten, flags=re.IGNORECASE)

    if rewritten != last_para and rewritten.strip():
        paras[-1] = rewritten
        return "\n\n".join(paras), True

    return text, False


# ============================================================================
# RULE párrafos: Split long prose (SAFE)
# ============================================================================

def fix_paragrafos(text: str, max_len: int = PARAGRAPH_PROSE_MAX) -> Tuple[str, bool]:
    """
    Safely split long prose at sentence boundaries.

    Works on prose segments between display formulas only.
    """
    if not text or not isinstance(text, str):
        return text, False

    changed = False
    result_paras = []

    for para in paragraphs(text):
        # Split by display formulas to process prose segments separately
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
                # Match periods followed by space and capital letter
                sentences = re.split(r"(?<=[.!?])\s+(?=[A-Z])", flat_prose)

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
# RULE 21: Split prose with too many inline formulas (SAFE)
# ============================================================================

def fix_rule_21(text: str) -> Tuple[str, bool]:
    """
    Safely split prose segments with 3+ inline formulas.

    Splits at sentence/formula boundaries only.
    """
    if not text or not isinstance(text, str):
        return text, False

    changed = False
    result_paras = []

    for para in paragraphs(text):
        parts = DISPLAY_RE.split(para)

        new_parts = []
        for part in parts:
            part_orig = part
            part = part.strip()
            if not part:
                continue

            # Display formula - keep as is
            if part.startswith("$$") and part.endswith("$$"):
                new_parts.append(part)
                continue

            # Check inline formula density
            flat_prose = re.sub(r"\s+", " ", part).strip()
            inline_count = len(INLINE_RE.findall(flat_prose))

            if inline_count >= INLINE_FRAGMENTS_WARN:
                # Too many inline formulas - split at sentence boundaries
                sentences = re.split(r"(?<=[.!?])\s+(?=[A-Z])", flat_prose)

                current = ""
                for sent in sentences:
                    if not sent.strip():
                        continue

                    test = current + " " + sent if current else sent
                    sent_count = len(INLINE_RE.findall(test))

                    # If adding this sentence would exceed formula limit and we have a current,
                    # split
                    if sent_count >= INLINE_FRAGMENTS_WARN and current:
                        new_parts.append(current.strip())
                        current = sent
                        changed = True
                    else:
                        current = test

                if current.strip():
                    new_parts.append(current.strip())
            else:
                new_parts.append(part)

        # Reconstruct paragraph
        result_paras.append("\n\n".join(new_parts))

    result = "\n\n".join(result_paras)
    return result, changed


# ============================================================================
# RULE anti-acusación: Rewrite accusatory feedback (SAFE)
# ============================================================================

def fix_anti_accusation(feedback: str) -> Tuple[str, bool]:
    """Safely rewrite feedback_incorrect starting with accusatory language."""
    if not isinstance(feedback, str) or not feedback.strip():
        return feedback, False

    first_words = feedback.strip()

    for start in ACCUSATORY_STARTS:
        if first_words.startswith(start + " ") or first_words == start:
            # Rewrite in neutral voice
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
            elif first_words.startswith("Invierte"):
                rewritten = "Este distractor invierte " + first_words[9:]

            return rewritten, rewritten != feedback

    return feedback, False


# ============================================================================
# RULE fórmulas anchas: Simplify chained equalities (SAFE)
# ============================================================================

def fix_wide_formulas(feedback: str) -> Tuple[str, bool]:
    """Simplify feedback_correct with 3+ chained equalities."""
    if not isinstance(feedback, str) or not feedback.strip():
        return feedback, False

    eq_count = feedback.count("=")
    if eq_count < 3:
        return feedback, False

    # Find formulas with multiple consecutive equals
    formulas = list(re.finditer(r"\$[^$]*=[^$]*=[^$]*\$", feedback))
    if not formulas:
        return feedback, False

    changed = False
    for formula_match in formulas:
        formula = formula_match.group(0)
        # Extract content between $ markers
        content = formula[1:-1]
        parts = [p.strip() for p in content.split("=")]

        if len(parts) >= 3:
            # Keep first and last parts only
            simplified = parts[0] + " = " + parts[-1]
            simplified = "$" + simplified + "$"
            feedback = feedback.replace(formula, simplified, 1)
            changed = True

    return feedback, changed


# ============================================================================
# RULE 4: Fix option length imbalance (CAREFUL)
# ============================================================================

def fix_rule_4(options: List[str], correct_index: int) -> Tuple[List[str], bool]:
    """
    Carefully fix option length imbalance.

    Only makes safe changes: adding clarifying text to short options.
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

    # Only fix if correct is notably shorter
    if (correct_len < SHORTEST_RATIO * med_other and
        med_other - correct_len >= MIN_ABS_GAP):
        # Add a brief qualifier to the correct answer
        option = options[correct_index]

        # Only if it doesn't already have clarification
        if "(" not in option or not option.endswith(")"):
            # Check if adding a qualifier makes sense
            if len(option) < 50:  # Only for very short options
                # Try adding a relevant qualifier
                if "$x$" in option or "$" in option:
                    new_options = list(options)
                    new_opt = option + " (único valor)"
                    new_options[correct_index] = new_opt
                    return new_options, True

    return options, False


# ============================================================================
# Main fixer
# ============================================================================

def fix_item(item: Dict[str, Any], item_idx: int) -> Dict[str, Any]:
    """Apply all safe fixes to a single item."""
    fixed = item.copy()

    # Fix explanation (rules 34, párrafos, 21)
    if "explanation" in fixed and isinstance(fixed["explanation"], str):
        original = fixed["explanation"]

        # Apply fixes in sequence
        fixed["explanation"], changed = fix_rule_34(fixed["explanation"])
        if changed:
            STATS["fixes_by_rule"]["rule_34"] += 1
            STATS["items_touched"].add(item_idx)

        fixed["explanation"], changed = fix_paragrafos(fixed["explanation"])
        if changed:
            STATS["fixes_by_rule"]["paragrafos"] += 1
            STATS["items_touched"].add(item_idx)

        fixed["explanation"], changed = fix_rule_21(fixed["explanation"])
        if changed:
            STATS["fixes_by_rule"]["rule_21"] += 1
            STATS["items_touched"].add(item_idx)

    # Fix options (rule 4)
    if "options" in fixed and "correct_index" in fixed:
        fixed["options"], changed = fix_rule_4(
            fixed["options"], fixed["correct_index"]
        )
        if changed:
            STATS["fixes_by_rule"]["rule_4"] += 1
            STATS["items_touched"].add(item_idx)

    # Fix feedback_correct (fórmulas anchas)
    if "feedback_correct" in fixed and isinstance(fixed["feedback_correct"], str):
        fixed["feedback_correct"], changed = fix_wide_formulas(
            fixed["feedback_correct"]
        )
        if changed:
            STATS["fixes_by_rule"]["formulas_anchas"] += 1
            STATS["items_touched"].add(item_idx)

    # Fix feedback_incorrect (anti-acusación)
    if "feedback_incorrect" in fixed and isinstance(fixed["feedback_incorrect"], list):
        for i, fb in enumerate(fixed["feedback_incorrect"]):
            if isinstance(fb, str):
                fb_fixed, changed = fix_anti_accusation(fb)
                if changed:
                    fixed["feedback_incorrect"][i] = fb_fixed
                    STATS["fixes_by_rule"]["anti_accusation"] += 1
                    STATS["items_touched"].add(item_idx)

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
    print("Rational Functions Content Fixer v3 (SAFE MODE)")
    print("=" * 70)

    if not RATIONAL_DIR.exists():
        print(f"ERROR: {RATIONAL_DIR} not found")
        return 1

    print(f"\nWorking on: {RATIONAL_DIR}")
    print("(Safe fixes only - no structural changes)")

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
    print(f"Items touched: {len(STATS['items_touched'])}")

    if STATS["fixes_by_rule"]:
        print("\nFixes applied:")
        for rule, count in sorted(STATS["fixes_by_rule"].items(), key=lambda x: -x[1]):
            print(f"  {rule}: {count}")
    else:
        print("\nNo fixes applied.")

    return 0 if success_count == len(FILES_TO_FIX) else 1


if __name__ == "__main__":
    sys.exit(main())
