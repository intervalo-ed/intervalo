#!/usr/bin/env python3
"""
Ultra-minimal focused fixer for rule 21 violations.

Philosophy: Only apply fixes to TEXT SEGMENTS where we can identify EXPLICIT
natural language break points. Never create new violations.

Strategy: Convert natural clause separators into sentence boundaries.
- ", así que " → ". Así que "
- ", porque " → ". Porque "
- ", independientemente " → ". Independientemente "
- ", mientras que " → ". Mientras que "
- etc.
"""

import json
import re
from pathlib import Path
from collections import defaultdict
from typing import Optional, Tuple

INLINE_FRAGMENTS_WARN = 3
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


def check_violation(segment: str) -> bool:
    """Check if segment violates rule 21."""
    segment_clean = re.sub(r"\s+", " ", segment).strip()
    return len(segment_clean) > 200 or count_inline_formulas(segment) >= INLINE_FRAGMENTS_WARN


# ============================================================================
# PATTERN 1: Separating clauses with "así que", "porque", etc.
# ============================================================================

# High-confidence Spanish connectors that clearly separate independent clauses
CLAUSE_SEPARATORS = [
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
    (r',\s+independientemente\s+', '. Independientemente '),
]

# English variants
CLAUSE_SEPARATORS += [
    (r',\s+so\s+', '. So '),
    (r',\s+because\s+', '. Because '),
    (r',\s+therefore\s+', '. Therefore '),
    (r',\s+however\s+', '. However '),
    (r',\s+in\s+fact\s+', '. In fact '),
    (r',\s+meanwhile\s+', '. Meanwhile '),
    (r',\s+indeed\s+', '. Indeed '),
]


def split_at_clause_separators(text: str) -> Optional[str]:
    """
    Convert comma-separated independent clauses into sentence boundaries.
    Only applies to segments that HAVE violations.
    """
    if count_inline_formulas(text) < INLINE_FRAGMENTS_WARN:
        return None

    original = text
    result = text

    # Try each separator in order of confidence
    for pattern, replacement in CLAUSE_SEPARATORS:
        result = re.sub(pattern, replacement, result, count=1, flags=re.IGNORECASE)

        # If we made a change, check if it helped
        if result != original:
            # Verify the fix doesn't create rule 2 violations
            if not violates_rule_2(result):
                # Check if the violation is actually reduced
                # Split into paragraphs and check each prose segment
                paras = [p.strip() for p in result.split("\n\n") if p.strip()]
                improved = False
                for para in paras:
                    for segment in prose_segments(para):
                        if check_violation(segment):
                            improved = False
                            break
                    if not improved and check_violation(para):
                        continue
                    improved = True

                if improved or count_inline_formulas(result) < count_inline_formulas(original):
                    return result

            # Revert if it didn't help
            result = original

    return None


# ============================================================================
# PATTERN 2: "A diferencia de" → sentence break
# ============================================================================

def split_contrast_clauses(text: str) -> Optional[str]:
    """
    Convert contrast clauses starting with commas to sentence breaks.
    ", a diferencia de" → ". A diferencia de"
    """
    if count_inline_formulas(text) < INLINE_FRAGMENTS_WARN:
        return None

    patterns = [
        (r',\s+a\s+diferencia\s+de\s+', '. A diferencia de '),
        (r',\s+unlike\s+', '. Unlike '),
        (r',\s+en\s+contraste\s+(?:con|a)\s+', '. En contraste con '),
    ]

    for pattern, replacement in patterns:
        if re.search(pattern, text, re.IGNORECASE):
            result = re.sub(pattern, replacement, text, count=1, flags=re.IGNORECASE)

            if not violates_rule_2(result):
                # Simple heuristic: did we reduce inline count or paragraph length?
                if (count_inline_formulas(result) < count_inline_formulas(text) or
                    len(result) > len(text) + 10):  # Added content
                    return result

    return None


# ============================================================================
# PATTERN 3: Remove redundant formula references
# ============================================================================

def remove_redundant_formula(text: str) -> Optional[str]:
    """
    If a formula is mentioned multiple times in quick succession,
    remove the redundant occurrence.

    Example: "se necesita $x-2 \geq 0$, es decir $x \geq 2$"
    Note: This is risky, so only apply if very confident.
    """
    if count_inline_formulas(text) < INLINE_FRAGMENTS_WARN + 1:
        return None

    # Pattern: same formula twice within 100 chars
    # (Only for very simple formulas to avoid false positives)
    simple_formula_pattern = r'\$([a-zA-Z\s\-\+\=0-9]{1,8})\$.*\$\1\$'

    match = re.search(simple_formula_pattern, text)
    if not match:
        return None

    # Remove the second occurrence
    first_pos = match.start()
    # Find the second occurrence after the first
    second_match = re.search(
        r'\$([a-zA-Z\s\-\+\=0-9]{1,8})\$',
        text[match.end():]
    )

    if second_match and second_match.group(1) == match.group(1):
        pos_second = match.end() + second_match.start()
        # Remove it along with preceding comma/whitespace if present
        before_second = text[max(0, pos_second - 5):pos_second]
        if ',' in before_second:
            # Remove from the comma
            comma_pos = text.rfind(',', max(0, pos_second - 5), pos_second)
            result = text[:comma_pos] + text[pos_second + len(match.group(0)) + 1:]
        else:
            result = text[:pos_second] + text[pos_second + len(match.group(0)) + 1:]

        if not violates_rule_2(result) and count_inline_formulas(result) < count_inline_formulas(text):
            return result

    return None


# ============================================================================
# PATTERN 4: Convert example enumerations to cleaner form
# ============================================================================

def clean_enumerated_examples(text: str) -> Optional[str]:
    """
    Simplify dense example lists.
    "se tiene $a$, $b$, $c$ son..." → "se tienen $a$, $b$, $c$. Todos son..."
    """
    if count_inline_formulas(text) < INLINE_FRAGMENTS_WARN:
        return None

    # Pattern: multiple formulas followed by verb
    pattern = r'(\$[^$]+\$(?:\s*,\s*\$[^$]+\$)+)\s+(son|es|están|pertenecen)'

    match = re.search(pattern, text)
    if not match:
        return None

    enum = match.group(1)
    verb = match.group(2)

    # Count formulas
    enum_formulas = len(re.findall(INLINE_RE, enum))
    if enum_formulas < 3:
        return None

    # Slight rewrite
    result = text[:match.start()] + enum + '. Estos ' + verb + ' ' + text[match.end() + len(verb):]

    if not violates_rule_2(result):
        return result

    return None


# ============================================================================
# Main fixer
# ============================================================================

def fix_segment(text: str) -> Optional[str]:
    """Try to fix a single prose segment."""
    if not check_violation(text):
        return None

    strategies = [
        split_at_clause_separators,
        split_contrast_clauses,
        remove_redundant_formula,
        clean_enumerated_examples,
    ]

    for strategy in strategies:
        result = strategy(text)
        if result:
            return result

    return None


def fix_explanation(text: str) -> Tuple[str, bool]:
    """Fix an entire explanation by working on segments."""
    original = text

    # Process each paragraph
    paras = text.split("\n\n")
    fixed_paras = []

    for para in paras:
        fixed_para = para
        # Check each prose segment within the paragraph
        for segment in prose_segments(para):
            if check_violation(segment):
                fixed = fix_segment(segment)
                if fixed:
                    fixed_para = fixed_para.replace(segment, fixed, 1)

        fixed_paras.append(fixed_para)

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

                if was_fixed and not violates_rule_2(fixed):
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
        print("\nFiles modified:")
        for fname in sorted(files.keys())[:20]:
            count = files[fname]
            print(f"  {fname}: {count}")
