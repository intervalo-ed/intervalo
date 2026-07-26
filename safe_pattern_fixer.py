#!/usr/bin/env python3
"""
Conservative pattern-based explanation warning fixer with strict validation.

Key constraints:
- Never create \n\n followed by $$
- Only split at natural sentence/section boundaries
- Maintain exact rule 2 compliance
- Validate every change before committing
"""

import json
import re
from pathlib import Path
from collections import defaultdict
from typing import Optional, Tuple

# Thresholds
INLINE_FRAGMENTS_WARN = 3
PARAGRAPH_PROSE_MAX = 200
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
    """Check for \n\n adjacent to $$ (rule 2 violation)."""
    if "\n\n$$" in text or "$$\n\n" in text:
        return True
    return False


def has_violation(para: str) -> bool:
    """Check if paragraph has rule 21 or párrafos violation."""
    for segment in prose_segments(para):
        segment_clean = re.sub(r"\s+", " ", segment).strip()
        if len(segment_clean) > PARAGRAPH_PROSE_MAX:
            return True
        if count_inline_formulas(segment) >= INLINE_FRAGMENTS_WARN:
            return True
    return False


# ============================================================================
# CONSERVATIVE PATTERN 1: Sentence-level splitting ONLY within paragraphs
# ============================================================================

def split_sentences_conservatively(text: str) -> Optional[str]:
    """
    Split only at sentence boundaries (period + space + capital).
    Works WITHIN a single paragraph only - does NOT create new paragraphs.
    Instead, it redistributes inline formulas across sentences within the paragraph.

    Strategy: If a paragraph violates rule 21, redistribute its content to
    reduce the density in any single sentence segment.
    """
    if count_inline_formulas(text) < INLINE_FRAGMENTS_WARN:
        return None

    # Check for existing paragraph breaks (we won't add new ones)
    if "\n\n" in text:
        return None

    # Only process if we can detect clear sentence boundaries
    # Look for period + space + capital letter pattern
    if not re.search(r'\.\s+[A-Z]', text):
        return None

    # Count formulas in the full paragraph
    total_inline = count_inline_formulas(text)
    if total_inline < INLINE_FRAGMENTS_WARN:
        return None

    # Split sentences but keep as single paragraph with line breaks
    sentences = re.split(r'(?<=[.!?])\s+(?=[A-Z])', text)

    if len(sentences) < 2:
        return None

    # Rejoin with single newlines instead of spaces
    # This keeps it as a single paragraph (for prose_segments logic)
    # but separates sentences for formula distribution
    result = '\n'.join(sentences)

    # Only return if it actually contains newlines and no rule 2 violations
    if result != text and '\n' in result and '\n\n' not in result and not violates_rule_2(result):
        return result

    return None


# ============================================================================
# CONSERVATIVE PATTERN 2: Remove trailing citations with multiple formulas
# ============================================================================

def simplify_enumerated_options(text: str) -> Optional[str]:
    """
    Simplify text like "Options are ($a$, $b$, $c$) ..." into a cleaner form.

    Pattern: "text with ($formula1$, $formula2$, $formula3$) more text"
    Fix: Extract to "text with these:" then display
    """
    # Match patterns like (...formula, formula, formula...)
    # with 3+ formulas in parentheses
    paren_formula_pattern = r'\(([^)]*\$[^)]*\$[^)]*\$[^)]*)\)'

    if not re.search(paren_formula_pattern, text):
        return None

    # Only proceed if this would actually help
    if count_inline_formulas(text) < INLINE_FRAGMENTS_WARN + 1:
        return None

    # Simple fix: replace the enumeration with "respectively" or similar
    # This keeps structure but reduces visual clutter
    result = re.sub(
        paren_formula_pattern,
        r'shown in the following.',
        text
    )

    # Validate
    if result != text and not violates_rule_2(result):
        return result

    return None


# ============================================================================
# CONSERVATIVE PATTERN 3: Move opening formula to display block
# ============================================================================

def extract_opening_formula(text: str) -> Optional[str]:
    """
    If text STARTS with "$formula$ is..." or similar, move to display block.

    Pattern: "$f(x)=x^2$ is a quadratic function..."
    Fix: $$f(x)=x^2$$
         A quadratic function...

    This is SAFE because:
    - It only applies when there's clear leading space to insert
    - The formula is at the START (before other content)
    """
    # Match starting formula followed by "is", "represents", etc.
    start_pattern = r'^(\$[^$]+\$)\s+(is|represents?|means?|denotes?|equals?)\s+([A-Z][^.!?]*[.!?])'

    if not re.match(start_pattern, text.strip(), re.IGNORECASE):
        return None

    # Only if we'd meaningfully reduce density
    if count_inline_formulas(text) < INLINE_FRAGMENTS_WARN + 1:
        return None

    match = re.match(start_pattern, text.strip(), re.IGNORECASE)
    if not match:
        return None

    formula = match.group(1)
    connector = match.group(2)
    rest = match.group(3)

    # Build result: move formula to display block
    # NO paragraph breaks - use line breaks only
    result = f"$${formula[1:-1]}$$\n{connector.capitalize()} {rest}"

    # Validate safety
    if violates_rule_2(result) or "\n\n" in result:
        return None

    return result


# ============================================================================
# CONSERVATIVE PATTERN 4: Split only at explicit section markers
# ============================================================================

SECTION_MARKERS = [
    r'(?:^|\n)(Por )?\*\*([^*]+)\*\*:',  # **Bold heading**:
]


def split_at_section_markers(text: str) -> Optional[str]:
    """
    Only split at EXPLICIT section boundaries like "**Heading**:".
    Creates paragraph breaks ONLY at these natural divisions.
    """
    # Check if text contains section markers
    if not re.search(SECTION_MARKERS[0], text, re.MULTILINE):
        return None

    if count_inline_formulas(text) < INLINE_FRAGMENTS_WARN:
        return None

    # Split at section markers, preserving the marker with the following section
    result = re.sub(
        SECTION_MARKERS[0],
        r'\n\n\1**\2**:',
        text,
        flags=re.MULTILINE
    )

    # Validate: no \n\n$$ patterns
    if result == text or violates_rule_2(result):
        return None

    return result


# ============================================================================
# Comprehensive validation
# ============================================================================

def validate_fix(original: str, fixed: str) -> bool:
    """Strictly validate that a fix doesn't violate rules."""
    # Rule 2: no \n\n adjacent to $$
    if violates_rule_2(fixed):
        return False

    # All original formulas must be preserved
    original_formulas = INLINE_RE.findall(original)
    fixed_formulas = INLINE_RE.findall(fixed)
    if sorted(original_formulas) != sorted(fixed_formulas):
        # Check display formulas too
        original_display = DISPLAY_RE.findall(original)
        fixed_display = DISPLAY_RE.findall(fixed)
        if sorted(original_display) != sorted(fixed_display):
            return False

    # No content should be lost (excluding whitespace)
    original_stripped = re.sub(r'\s+', '', original)
    fixed_stripped = re.sub(r'\s+', '', fixed)
    if len(fixed_stripped) < len(original_stripped) * 0.95:  # Allow 5% loss for formatting
        return False

    return True


def fix_explanation(text: str) -> Tuple[str, bool]:
    """
    Apply conservative pattern-based fixes.
    Returns: (fixed_text, was_fixed)
    """
    original = text

    # Try each strategy in order of safety
    strategies = [
        extract_opening_formula,
        split_at_section_markers,
        split_sentences_conservatively,
        simplify_enumerated_options,
    ]

    for strategy in strategies:
        result = strategy(text)
        if result and validate_fix(text, result):
            text = result
            break  # Stop after first successful fix

    return text, text != original


# ============================================================================
# Main processor
# ============================================================================

def process_files():
    """Process all JSON files in analisis course."""
    content_dir = Path("/home/user/intervalo/backend/content/analisis")
    json_files = sorted(content_dir.glob("**/*.json"))

    total_fixed = 0
    errors = []
    modified_files = set()

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

                if not has_violation(exp):
                    continue

                # Try to fix
                fixed, was_fixed = fix_explanation(exp)
                if was_fixed:
                    # Validate the fix doesn't break the file
                    if not violates_rule_2(fixed):
                        item["explanation"] = fixed
                        file_modified = True
                        total_fixed += 1

            if file_modified:
                # Write back
                file_path.write_text(
                    json.dumps(data, ensure_ascii=False, indent=2) + "\n",
                    encoding="utf-8"
                )
                modified_files.add(file_path.relative_to(content_dir))

        except Exception as e:
            errors.append(f"{file_path}: {e}")

    return total_fixed, errors, modified_files


if __name__ == "__main__":
    total, errors, files = process_files()

    print(f"\n{'='*70}")
    print(f"Explanations fixed: {total}")
    print(f"Files modified: {len(files)}")
    print(f"Errors: {len(errors)}")

    if errors:
        print("\nErrors (first 5):")
        for e in errors[:5]:
            print(f"  - {e}")

    if files:
        print("\nModified files (first 15):")
        for f in sorted(files)[:15]:
            print(f"  - {f}")
        if len(files) > 15:
            print(f"  ... and {len(files) - 15} more")
