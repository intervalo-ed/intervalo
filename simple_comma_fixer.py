#!/usr/bin/env python3
"""
Simple comma-based fixer for rule 21 violations.
Strategy: Split at commas before clause separators, one pass at a time.
Only applies if split actually reduces violations.
"""

import json
import re
from pathlib import Path
from collections import defaultdict
from typing import Optional, Tuple
import sys

# Thresholds - EXACT SAME AS VALIDATOR
INLINE_FRAGMENTS_WARN = 3
PARAGRAPH_PROSE_MAX = 200
DISPLAY_RE = re.compile(r"\$\$.*?\$\$", re.DOTALL)
INLINE_RE = re.compile(r"(?<!\$)\$(?!\$)([^$\n]+)\$(?!\$)")

# Stats
stats = defaultdict(int)


def count_inline_formulas(text: str) -> int:
    """Count inline LaTeX fragments."""
    stripped = DISPLAY_RE.sub(" ", text)
    return len(INLINE_RE.findall(stripped))


def prose_segments(p: str) -> list[str]:
    """Split paragraph by display formulas."""
    return [s for s in DISPLAY_RE.split(p) if s.strip()]


def violates_rule_2(text: str) -> bool:
    """Check rule 2: no \n\n adjacent to $$ blocks."""
    return "\n\n$$" in text or "$$\n\n" in text


def paragraphs(s: str) -> list[str]:
    """Split explanation by paragraph breaks."""
    return [p for p in s.split("\n\n") if p.strip()]


def check_explanation_violations(text: str) -> int:
    """
    Count rule 21 violations in full explanation.
    Exactly mimics validator logic.
    """
    violations = 0
    for para in paragraphs(text):
        for prose in prose_segments(para):
            if count_inline_formulas(prose) >= INLINE_FRAGMENTS_WARN:
                violations += 1
    return violations


def split_at_comma(para: str) -> Optional[str]:
    """
    Try to split paragraph at the FIRST comma that's followed by
    a clause separator. Returns new paragraph with \n\n inserted if successful.
    """
    # Look for comma + clause separator patterns
    # These are phrases that make sense at the start of a new sentence
    clause_starters = [
        r'así\s+que',
        r'sin\s+embargo',
        r'en\s+cambio',
        r'de\s+hecho',
        r'porque',
        r'ya\s+que',
        r'es\s+decir',
        r'entonces',
        r'pero',
        r'en\s+realidad',
        r'al\s+mismo\s+tiempo',
        r'mientras\s+que',
        r'cuando',
        r'si',
        r'aunque',
        r'salvo\s+que',
    ]

    # Build pattern: comma + space + one of the starters
    pattern = r',\s+(' + '|'.join(clause_starters) + r')\b'

    match = re.search(pattern, para, re.IGNORECASE)
    if not match:
        return None

    # Extract the start word/phrase for capitalization
    matched_clause = match.group(1)

    # Split at the comma
    pos = match.start()
    before = para[:pos].rstrip() + "."
    after_match_end = match.end()
    # Get the remaining text after the comma+space
    remaining = para[pos+1:].lstrip()  # Remove comma and leading spaces

    # Capitalize first letter of remaining text
    if remaining:
        remaining = remaining[0].upper() + remaining[1:]

    result = f"{before}\n\n{remaining}"

    # Validate: no rule 2 violations
    if violates_rule_2(result):
        return None

    # Validate: actually reduces violations
    before_violations = check_explanation_violations(para)
    after_violations = check_explanation_violations(result)

    if after_violations >= before_violations:
        return None

    return result


def fix_explanation(text: str) -> Tuple[str, int]:
    """
    Apply comma-based splits to reduce rule 21 violations.
    Returns: (fixed_text, violations_fixed)
    """
    original = text
    original_violations = check_explanation_violations(original)

    # Try to split paragraphs one at a time
    for attempt in range(10):  # Max 10 splits per explanation
        paras = paragraphs(text)

        # Try to fix first paragraph that still has violations
        fixed = False
        for i, para in enumerate(paras):
            for prose in prose_segments(para):
                if count_inline_formulas(prose) >= INLINE_FRAGMENTS_WARN:
                    # Try to split this paragraph
                    fixed_para = split_at_comma(para)
                    if fixed_para:
                        # Replace the paragraph in the text
                        # Need to be careful about paragraph boundaries
                        paras[i] = fixed_para.split("\n\n")  # Split into multiple paragraphs
                        text = "\n\n".join([p for sublist in paras for p in (sublist if isinstance(sublist, list) else [sublist])])
                        stats["splits_applied"] += 1
                        fixed = True
                        break
            if fixed:
                break

        if not fixed:
            break

    final_violations = check_explanation_violations(text)
    fixed_count = max(0, original_violations - final_violations)

    return text, fixed_count


def process_file(file_path: Path) -> Tuple[int, bool]:
    """
    Process a single JSON file.
    Returns: (total_fixed, file_modified)
    """
    with open(file_path, 'r', encoding='utf-8') as f:
        data = json.load(f)

    total_fixed = 0
    modified = False

    items = data if isinstance(data, list) else data.get("items", [])

    for item in items:
        if "explanation" not in item:
            continue

        explanation = item["explanation"]
        new_explanation, fixed = fix_explanation(explanation)

        if fixed > 0:
            item["explanation"] = new_explanation
            modified = True
            total_fixed += fixed
            stats["items_with_fixes"] += 1

    if modified:
        with open(file_path, 'w', encoding='utf-8') as f:
            json.dump(data, f, ensure_ascii=False, indent=2)

    return total_fixed, modified


def main():
    """Process all content files."""
    content_dir = Path("/home/user/intervalo/backend/content/analisis")
    json_files = sorted(content_dir.rglob("*.json"))

    print(f"Processing {len(json_files)} JSON files...")

    total_fixed = 0
    files_with_fixes = 0

    for file_path in json_files:
        fixed, modified = process_file(file_path)
        if fixed > 0:
            files_with_fixes += 1
            print(f"  {file_path.name}: {fixed} violations fixed")
        total_fixed += fixed

    print(f"\n{'='*70}")
    print(f"SUMMARY")
    print(f"{'='*70}")
    print(f"Files modified: {files_with_fixes}")
    print(f"Total splits applied: {stats['splits_applied']}")
    print(f"Items with fixes: {stats['items_with_fixes']}")
    print(f"Violations fixed: {total_fixed}")
    print(f"{'='*70}")

    return total_fixed


if __name__ == "__main__":
    fixed_count = main()
    sys.exit(0 if fixed_count > 0 else 1)
