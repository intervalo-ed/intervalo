#!/usr/bin/env python3
"""
Aggressive fixer for remaining rule 21 violations.
Targets patterns not yet caught: "y" conjunctions, formula+comma sequences, etc.
"""

import json
import re
from pathlib import Path
from collections import defaultdict
from typing import Optional, Tuple

# Thresholds
INLINE_FRAGMENTS_WARN = 3
DISPLAY_RE = re.compile(r"\$\$.*?\$\$", re.DOTALL)
INLINE_RE = re.compile(r"(?<!\$)\$(?!\$)([^$\n]+)\$(?!\$)")

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
    """Count rule 21 violations."""
    violations = 0
    for para in paragraphs(text):
        for prose in prose_segments(para):
            if count_inline_formulas(prose) >= INLINE_FRAGMENTS_WARN:
                violations += 1
    return violations


# ============================================================================
# NEW PATTERNS - Aggressive approach
# ============================================================================

def split_at_formula_and_conjunction(para: str) -> Optional[str]:
    """
    Split at patterns like "$y=2$ y la derecha..."
    Match: formula + ", y " or " y "
    """
    # Look for: $...$ followed by comma or "y" at the start of phrase
    pattern = r'(\$[^$]+\$)\s*,\s*y\s+'

    match = re.search(pattern, para, re.IGNORECASE)
    if not match:
        return None

    pos = match.start() + len(match.group(1))
    before = para[:pos].rstrip() + "."
    remaining = para[pos+1:].lstrip()

    if remaining:
        remaining = remaining[0].upper() + remaining[1:]

    result = f"{before}\n\n{remaining}"

    if violates_rule_2(result):
        return None

    return result


def split_at_multiple_items(para: str) -> Optional[str]:
    """
    Split patterns with multiple items/examples.
    "Con $k=0$ ..., Con $k=1$ ..."
    """
    # Look for phrase repeats like "Con $k=..." followed by ", Con $k=..."
    pattern = r'(Con\s+\$[^$]+\$[^,]*),\s+(Con\s+\$)'

    match = re.search(pattern, para, re.IGNORECASE)
    if not match:
        return None

    pos = match.start(2)
    before = para[:pos].rstrip()
    remaining = para[pos:]

    result = f"{before}.\n\n{remaining}"

    if violates_rule_2(result):
        return None

    return result


def split_at_descriptive_phrase(para: str) -> Optional[str]:
    """
    Split at descriptive phrases after formulas.
    Pattern: "$formula$, [descriptive phrase]"
    Like: "$y=5$, un salto de $3$ unidades exactamente en $x=2$"
    """
    # Match: formula + comma + lowercase phrase
    pattern = r'(\$[^$]+\$),\s+([a-z][^.!?]*[.!?])'

    match = re.search(pattern, para)
    if not match:
        return None

    formula = match.group(1)
    phrase = match.group(2)

    # Only split if both parts would have manageable formula counts
    before_text = para[:match.start()].rstrip() + " " + formula
    after_text = phrase

    if count_inline_formulas(before_text) >= INLINE_FRAGMENTS_WARN or count_inline_formulas(after_text) >= INLINE_FRAGMENTS_WARN:
        return None

    result = f"{before_text}.\n\n{after_text[0].upper() + after_text[1:]}"

    if violates_rule_2(result):
        return None

    return result


def split_at_listing_commas(para: str) -> Optional[str]:
    """
    Split at commas that separate listed items/values.
    Like: "$x=0$, $x=-1$ y $x=4$"
    """
    # Look for: $formula$, (lowercase word or another formula)
    # Pattern should match listing separators
    pattern = r'(\$[^$]+\$),\s+(\$[^$]+\$|\w+\s+\$)'

    match = re.search(pattern, para)
    if not match:
        return None

    # Check if we have high formula density
    if count_inline_formulas(para) < INLINE_FRAGMENTS_WARN + 1:
        return None

    pos = match.start() + len(match.group(1))
    before = para[:pos].rstrip() + "."
    remaining = para[pos+1:].lstrip()

    if remaining:
        remaining = remaining[0].upper() + remaining[1:]

    result = f"{before}\n\n{remaining}"

    if violates_rule_2(result):
        return None

    return result


def split_at_subordinate_clause(para: str) -> Optional[str]:
    """
    Split at subordinate clauses introduced by words like "cuando", "donde".
    Pattern: "Main clause $x$, cuando/donde/que $y$..."
    """
    # Look for comma + subordinate introducer
    subordinates = [
        r'cuando',
        r'donde',
        r'que',
        r'cual',
    ]

    pattern = r',\s+(' + '|'.join(subordinates) + r')\s+'

    match = re.search(pattern, para, re.IGNORECASE)
    if not match:
        return None

    # Check formula density
    if count_inline_formulas(para) < INLINE_FRAGMENTS_WARN:
        return None

    pos = match.start()
    before = para[:pos].rstrip() + "."
    remaining = para[pos+1:].lstrip()

    if remaining:
        remaining = remaining[0].upper() + remaining[1:]

    result = f"{before}\n\n{remaining}"

    if violates_rule_2(result):
        return None

    return result


# ============================================================================
# Main fixer
# ============================================================================

def fix_explanation(text: str) -> Tuple[str, int]:
    """Apply aggressive patterns to reduce rule 21 violations."""
    original = text
    original_violations = check_explanation_violations(original)

    # Try multiple passes
    for attempt in range(20):
        paras = paragraphs(text)
        fixed_any = False

        for i, para in enumerate(paras):
            # Check if this paragraph has violations
            para_violations = sum(1 for prose in prose_segments(para) if count_inline_formulas(prose) >= INLINE_FRAGMENTS_WARN)
            if para_violations == 0:
                continue

            # Try each strategy
            strategies = [
                split_at_formula_and_conjunction,
                split_at_multiple_items,
                split_at_listing_commas,
                split_at_descriptive_phrase,
                split_at_subordinate_clause,
            ]

            for strategy in strategies:
                fixed_para = strategy(para)
                if fixed_para:
                    # Replace paragraph and split if needed
                    new_paras = fixed_para.split("\n\n")
                    paras = paras[:i] + new_paras + paras[i+1:]
                    stats["splits_applied"] += 1
                    fixed_any = True
                    break

            if fixed_any:
                break

        # Rejoin paragraphs
        text = "\n\n".join(paras)

        if not fixed_any:
            break

    final_violations = check_explanation_violations(text)
    fixed_count = max(0, original_violations - final_violations)

    return text, fixed_count


def process_file(file_path: Path) -> Tuple[int, bool]:
    """Process a single JSON file."""
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

    print(f"Processing {len(json_files)} JSON files (aggressive fixer)...")

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
    main()
