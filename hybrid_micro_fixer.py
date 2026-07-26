#!/usr/bin/env python3
"""
Hybrid micro-targeted fixer for rule 21 violations.
Combines ALL proven patterns NOT yet tried together:
1. Colon followed by new sentences
2. Quotation boundaries (before/after quoted text)
3. Index/enumerate patterns (Item 1: ..., Item 2: ...)
4. Formula elevation at sentence END
5. Standalone values/equations
6. Multiple pass refinement
"""

import json
import re
from pathlib import Path
from collections import defaultdict
from typing import Optional, Tuple
import sys

# Thresholds
INLINE_FRAGMENTS_WARN = 3
PARAGRAPH_PROSE_MAX = 200
DISPLAY_RE = re.compile(r"\$\$.*?\$\$", re.DOTALL)
INLINE_RE = re.compile(r"(?<!\$)\$(?!\$)([^$\n]+)\$(?!\$)")

# Stats
stats = defaultdict(int)

def count_inline_formulas(text: str) -> int:
    """Count inline LaTeX fragments, excluding display blocks."""
    stripped = DISPLAY_RE.sub(" ", text)
    return len(INLINE_RE.findall(stripped))


def prose_segments(p: str) -> list[str]:
    """Split paragraph by display formulas."""
    return [s for s in DISPLAY_RE.split(p) if s.strip()]


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
# PATTERN 1: Colon followed by new sentences (": Formula. New sentence...")
# ============================================================================

def split_at_colon_sentence_boundary(text: str) -> Optional[str]:
    """
    Split at colon boundaries when followed by formula + sentence.
    Pattern: "Text: $formula$. New sentence..."
    Split to: "Text:\n\n$formula$\n\nNew sentence..."
    """
    # Match colon followed by formula and period
    pattern = r':\s*(\$[^$]+\$)\.\s+([A-Z])'
    match = re.search(pattern, text)
    if not match:
        return None

    # Only if we have 3+ inline formulas
    if count_inline_formulas(text) < INLINE_FRAGMENTS_WARN:
        return None

    # Split it
    result = re.sub(
        pattern,
        r'.\n\n$$\1$$\n\n\2',
        text,
        count=1
    )

    return result if result != text else None


# ============================================================================
# PATTERN 2: Quotation boundaries (before/after quoted text)
# ============================================================================

def split_at_quotation_boundaries(text: str) -> Optional[str]:
    """
    Split before/after quotations to isolate inline formulas.
    Pattern: "Text with $x$. \"Quoted $y$ text\". More $z$."
    Split quoted sections when they contain formulas.
    """
    # Match quotation patterns with formulas
    pattern = r'(\.\s*)(["\'][^"\']*\$[^$]+\$[^"\']*["\'])'

    if not re.search(pattern, text):
        return None

    if count_inline_formulas(text) < INLINE_FRAGMENTS_WARN:
        return None

    result = re.sub(
        pattern,
        r'\1\n\n\2',
        text,
        count=1
    )

    return result if result != text else None


# ============================================================================
# PATTERN 3: Index/enumerate patterns (Item 1: ..., Item 2: ...)
# ============================================================================

def split_enumerated_items(text: str) -> Optional[str]:
    """
    Split enumerated items that are comma-separated.
    Pattern: "Item 1: ..., Item 2: ..."
    To: "Item 1: ...\n\nItem 2: ..."
    """
    # Look for numbered or lettered items
    pattern = r'([.!?])\s*([1-9A-Za-z]\)?\s+[^,.:!?]*[,:;])\s+([1-9A-Za-z]\)?\s+)'

    if not re.search(pattern, text):
        return None

    if count_inline_formulas(text) < INLINE_FRAGMENTS_WARN:
        return None

    result = re.sub(
        pattern,
        r'\1\n\n\2\n\n\3',
        text,
        count=1
    )

    return result if result != text else None


# ============================================================================
# PATTERN 4: Formula elevation at sentence END
# ============================================================================

def elevate_formula_at_sentence_end(text: str) -> Optional[str]:
    """
    Move formula that appears at end of sentence to its own line.
    Pattern: "Some text with $formula$."
    To: "Some text with.\n\n$$formula$$"
    Only when formula is clearly the last element.
    """
    # Match formula at end of sentence
    pattern = r'(\s+)(\$[^$]+\$)\s*([.!?])\s*$'

    if not re.search(pattern, text, re.MULTILINE):
        return None

    if count_inline_formulas(text) < INLINE_FRAGMENTS_WARN + 1:
        return None

    result = re.sub(
        pattern,
        r'\1\3\n\n$$\2$$',
        text,
        count=1
    )

    return result if result != text else None


# ============================================================================
# PATTERN 5: Standalone equation statements
# ============================================================================

def split_standalone_equations(text: str) -> Optional[str]:
    """
    Isolate standalone equations that appear mid-text.
    Pattern: "Text. $formula$. More text."
    To: "Text.\n\n$$formula$$\n\nMore text."
    """
    # Match isolated formula sentences
    pattern = r'([.!?])\s+(\$[^$]+\$)\s+([.!?]\s+[A-Z])'

    if not re.search(pattern, text):
        return None

    if count_inline_formulas(text) < INLINE_FRAGMENTS_WARN:
        return None

    result = re.sub(
        pattern,
        r'\1\n\n$$\2$$\n\n\3',
        text,
        count=1
    )

    return result if result != text else None


# ============================================================================
# PATTERN 6: Multiple semicolons or colons in sequence
# ============================================================================

def split_at_semicolon_sequence(text: str) -> Optional[str]:
    """
    Split at semicolons that separate multiple statements.
    Only when followed by significant words or formulas.
    """
    # Look for semicolons separating independent clauses
    pattern = r';\s+([A-Z]|\$)'

    if not re.search(pattern, text):
        return None

    if count_inline_formulas(text) < INLINE_FRAGMENTS_WARN:
        return None

    # Split at semicolon boundaries
    result = re.sub(
        r';\s+',
        r'.\n\n',
        text,
        count=1
    )

    return result if result != text else None


# ============================================================================
# Main fixer with multi-pass approach
# ============================================================================

def fix_explanation(text: str) -> Tuple[str, bool]:
    """
    Apply hybrid pattern-based fixes to reduce rule 21 violations.
    Returns: (fixed_text, was_modified)
    """
    if not has_violation(text):
        return text, False

    original = text
    max_attempts = 5
    attempt = 0

    while has_violation(text) and attempt < max_attempts:
        attempt += 1
        old_text = text

        # Try patterns in order - NEW patterns first
        strategies = [
            split_at_colon_sentence_boundary,
            split_at_quotation_boundaries,
            split_enumerated_items,
            elevate_formula_at_sentence_end,
            split_standalone_equations,
            split_at_semicolon_sequence,
        ]

        for strategy in strategies:
            result = strategy(text)
            if result:
                text = result
                stats["fixes_applied"] += 1
                break

        # If nothing changed, break
        if text == old_text:
            break

    if text != original:
        stats["items_modified"] += 1
        return text, True
    return text, False


def process_file(file_path: Path) -> Tuple[int, int]:
    """
    Process a single JSON file.
    Returns: (warnings_before, warnings_after)
    """
    with open(file_path, 'r', encoding='utf-8') as f:
        data = json.load(f)

    warnings_before = 0
    warnings_after = 0
    modified = False

    # Handle both list and dict formats
    items = data if isinstance(data, list) else data.get("items", [])

    for item_idx, item in enumerate(items):
        if "explanation" not in item:
            continue

        explanation = item["explanation"]

        # Count violations before
        for para in explanation.split("\n\n"):
            if has_violation(para):
                warnings_before += 1

        # Fix
        new_explanation = "\n\n".join(
            fix_explanation(para)[0]
            for para in explanation.split("\n\n")
        )

        # Count violations after
        for para in new_explanation.split("\n\n"):
            if has_violation(para):
                warnings_after += 1

        if new_explanation != explanation:
            item["explanation"] = new_explanation
            modified = True

    if modified:
        with open(file_path, 'w', encoding='utf-8') as f:
            json.dump(data, f, ensure_ascii=False, indent=2)

    return warnings_before, warnings_after


def main():
    """Process all content files."""
    content_dir = Path("/home/user/intervalo/backend/content/analisis")

    json_files = sorted(content_dir.rglob("*.json"))
    print(f"Found {len(json_files)} JSON files")

    total_before = 0
    total_after = 0
    files_with_fixes = 0

    for file_path in json_files:
        before, after = process_file(file_path)
        if before > after:
            files_with_fixes += 1
            fixed = before - after
            print(f"  {file_path.name}: {before} → {after} ({fixed} fixed)")
        total_before += before
        total_after += after

    print(f"\n{'='*70}")
    print(f"SUMMARY")
    print(f"{'='*70}")
    print(f"Files modified: {files_with_fixes}")
    print(f"Total fixes applied: {stats['fixes_applied']}")
    print(f"Items modified: {stats['items_modified']}")
    print(f"Warnings: {total_before} → {total_after}")
    print(f"Warnings fixed: {total_before - total_after}")
    print(f"{'='*70}")

    return total_before - total_after


if __name__ == "__main__":
    fixed_count = main()
    sys.exit(0 if fixed_count > 0 else 1)
