#!/usr/bin/env python3
"""
Intelligent paragraph splitter for rule 21 violations.

Key insight: The validator checks rule 21 PER PROSE SEGMENT (segments split by $$...$$).
A single paragraph with 3+ inline formulas violates rule 21.
But if we split it into TWO paragraphs (using \n\n), each with fewer than 3 inline formulas,
the violation goes away!

Strategy: Find natural break points (clause separators) and insert paragraph breaks (\n\n).
This ensures we never create rule 2 violations (which only happen when \n\n is adjacent to $$).
"""

import json
import re
from pathlib import Path
from collections import defaultdict
from typing import Optional, Tuple

DISPLAY_RE = re.compile(r"\$\$.*?\$\$", re.DOTALL)
INLINE_RE = re.compile(r"(?<!\$)\$(?!\$)([^$\n]+)\$(?!\$)")


def count_inline_formulas(text: str) -> int:
    """Count inline LaTeX fragments."""
    stripped = DISPLAY_RE.sub(" ", text)
    return len(INLINE_RE.findall(stripped))


def prose_segments(p: str) -> list[str]:
    """Split paragraph by display formulas."""
    return [s for s in DISPLAY_RE.split(p) if s.strip()]


def violates_rule_2(text: str) -> bool:
    """Check rule 2: no \n\n adjacent to $$."""
    return "\n\n$$" in text or "$$\n\n" in text


def check_para_violation(para: str) -> Tuple[bool, str]:
    """
    Check if paragraph violates rule 21 or párrafos.
    Returns: (has_violation, reason)
    """
    for segment in prose_segments(para):
        segment_clean = re.sub(r"\s+", " ", segment).strip()
        inline_count = count_inline_formulas(segment)

        if len(segment_clean) > 200:
            return True, f"párrafo ({len(segment_clean)} chars)"
        if inline_count >= 3:
            return True, f"rule 21 ({inline_count} formulas)"

    return False, ""


# ============================================================================
# Clause separators that create natural break points
# ============================================================================

BREAK_POINTS = [
    # Spanish - high confidence clause separators
    (r',\s+así\s+que\s+', '. Así que '),
    (r',\s+porque\s+', '. Porque '),
    (r',\s+ya\s+que\s+', '. Ya que '),
    (r',\s+puesto\s+que\s+', '. Puesto que '),
    (r',\s+sin\s+embargo\s+', '. Sin embargo '),
    (r',\s+en\s+cambio\s+', '. En cambio '),
    (r',\s+de\s+todas\s+formas\s+', '. De todas formas '),
    (r',\s+por\s+lo\s+tanto\s+', '. Por lo tanto '),
    (r',\s+entonces\s+', '. Entonces '),
    (r',\s+mientras\s+que\s+', '. Mientras que '),
    (r',\s+en\s+realidad\s+', '. En realidad '),
    (r',\s+de\s+hecho\s+', '. De hecho '),
    (r',\s+independientemente\s+(?:de|que)\s+', '. Independientemente '),
    (r',\s+al\s+mismo\s+tiempo\s+', '. Al mismo tiempo '),
    (r',\s+a\s+diferencia\s+de\s+', '. A diferencia de '),
    (r',\s+en\s+contraste\s+(?:con|a)\s+', '. En contraste '),
    (r',\s+sin\s+llegar\s+', '. Sin llegar '),
    (r',\s+sin\s+estabilizarse\s+', '. Sin estabilizarse '),
    (r',\s+justo\s+', '. Justo '),
    # English - high confidence clause separators
    (r',\s+so\s+', '. So '),
    (r',\s+because\s+', '. Because '),
    (r',\s+therefore\s+', '. Therefore '),
    (r',\s+however\s+', '. However '),
    (r',\s+in\s+fact\s+', '. In fact '),
    (r',\s+meanwhile\s+', '. Meanwhile '),
    (r',\s+indeed\s+', '. Indeed '),
    (r',\s+whereas\s+', '. Whereas '),
    (r',\s+while\s+', '. While '),
]


def split_at_natural_breakpoint(para: str) -> Optional[str]:
    """
    Split paragraph at natural language break points (clause separators).
    Returns new paragraph with \n\n inserted OR None if no split made.
    """
    # First check: does this paragraph have a violation?
    has_violation, reason = check_para_violation(para)
    if not has_violation:
        return None

    # Only proceed if it's a rule 21 violation (3+ inline formulas)
    # (párrafos violations are harder to fix this way)
    if "formulas" not in reason:
        return None

    # Try each break point
    for pattern, replacement in BREAK_POINTS:
        match = re.search(pattern, para, re.IGNORECASE)
        if match:
            # Insert \n\n at the separator position
            # But replace ", phrase" with ".\n\nPhrase" (period + paragraph break + capitalized continuation)
            start_pos = match.start()
            end_pos = match.end()

            # Extract the matched text to get the connector word
            matched_text = para[start_pos:end_pos]

            # Build result: text before + "." + "\n\n" + connector + text after
            prefix = para[:start_pos].rstrip() + "."
            connector_match = re.search(r'(?:así|porque|mientras|en|por|entonces|a)\s+\w+', matched_text, re.IGNORECASE)

            if connector_match:
                connector = connector_match.group(0)
                # Capitalize first letter if not already
                connector = connector[0].upper() + connector[1:] if len(connector) > 0 else connector
                suffix = para[end_pos:]

                result = f"{prefix}\n\n{connector} {suffix}"

                # Check if this helps
                new_paras = result.split("\n\n")
                all_good = True
                for new_para in new_paras:
                    new_has_violation, _ = check_para_violation(new_para)
                    if new_has_violation:
                        all_good = False
                        break

                # If it resolved violations and doesn't create rule 2 issues
                if all_good and not violates_rule_2(result):
                    return result

    return None


def fix_explanation(text: str) -> Tuple[str, bool]:
    """
    Fix an entire explanation by splitting dense paragraphs at break points.
    Returns: (fixed_text, was_modified)
    """
    original = text
    result = text

    # Split into paragraphs
    paras = text.split("\n\n")
    fixed_paras = []

    for para in paras:
        # Try to split this paragraph if it has violations
        fixed_para = split_at_natural_breakpoint(para)

        if fixed_para:
            # Successfully split - now we have multiple paragraphs
            fixed_paras.extend(fixed_para.split("\n\n"))
        else:
            # No split possible, keep original
            fixed_paras.append(para)

    result = "\n\n".join(fixed_paras)
    return result, result != original


# ============================================================================
# Processor
# ============================================================================

def process_files():
    """Process all JSON files."""
    content_dir = Path("/home/user/intervalo/backend/content/analisis")
    json_files = sorted(content_dir.glob("**/*.json"))

    total_fixed = 0
    errors = []
    modified_files = defaultdict(int)

    for file_path in json_files:
        try:
            data = json.loads(file_path.read_text(encoding="utf-8"))
            if not isinstance(data, list):
                continue

            file_modified = False
            for item in data:
                if not isinstance(item, dict):
                    continue

                exp = item.get("explanation")
                if not isinstance(exp, str) or not exp.strip():
                    continue

                fixed, was_fixed = fix_explanation(exp)

                if was_fixed:
                    # Validate no rule 2 violations
                    if not violates_rule_2(fixed):
                        item["explanation"] = fixed
                        file_modified = True
                        total_fixed += 1
                        modified_files[file_path.name] += 1

            if file_modified:
                file_path.write_text(
                    json.dumps(data, ensure_ascii=False, indent=2) + "\n",
                    encoding="utf-8"
                )

        except Exception as e:
            errors.append(f"{file_path}: {e}")

    return total_fixed, errors, modified_files


if __name__ == "__main__":
    total, errors, files = process_files()

    print(f"\n{'='*70}")
    print(f"Explanations fixed: {total}")
    print(f"Errors: {len(errors)}")

    if errors:
        print("\nErrors:")
        for e in errors[:5]:
            print(f"  - {e}")

    if files:
        print("\nFiles modified (top 15):")
        sorted_files = sorted(files.items(), key=lambda x: x[1], reverse=True)
        for fname, count in sorted_files[:15]:
            print(f"  {fname}: {count}")
        if len(files) > 15:
            print(f"  ... and {len(files) - 15} more")
