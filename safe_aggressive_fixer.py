#!/usr/bin/env python3
"""
Safe aggressive fixer that respects explanation length minimums.
Won't split if total explanation becomes < 300 chars.
"""

import json
import re
from pathlib import Path
from collections import defaultdict
from typing import Optional, Tuple

# Thresholds - EXACT SAME AS VALIDATOR
INLINE_FRAGMENTS_WARN = 3
EXPLANATION_MIN = 300
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


def explanation_length(text: str) -> int:
    """Get explanation length (exact same as validator)."""
    # Remove $$ blocks and $ delimiters
    t = text.replace("$$", "").replace("$", "")
    # Collapse whitespace
    t = re.sub(r"\s+", " ", t).strip()
    return len(t)


# ============================================================================
# SAFE AGGRESSIVE PATTERNS
# ============================================================================

def split_at_formula_and_conjunction(para: str) -> Optional[str]:
    """Split at patterns like "$y=2$ y la derecha..."."""
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
    """Split patterns with multiple items/examples like "Con $k=0$ ..., Con $k=1$ ..."""
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


def split_at_listing_commas(para: str) -> Optional[str]:
    """Split at commas that separate listed items/values."""
    pattern = r'(\$[^$]+\$),\s+(\$[^$]+\$|\w+\s+\$)'
    match = re.search(pattern, para)
    if not match:
        return None

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
    """Split at subordinate clauses like ", cuando...", ", donde..."."""
    subordinates = [r'cuando', r'donde', r'que', r'cual']
    pattern = r',\s+(' + '|'.join(subordinates) + r')\s+'

    match = re.search(pattern, para, re.IGNORECASE)
    if not match:
        return None

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
# Main fixer with length validation
# ============================================================================

def fix_explanation(text: str) -> Tuple[str, int]:
    """Apply safe aggressive patterns, respecting explanation length."""
    original = text
    original_violations = check_explanation_violations(original)
    original_length = explanation_length(original)

    # Early exit: if explanation is already at minimum, can't split
    if original_length <= EXPLANATION_MIN + 50:
        return original, 0

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
                split_at_subordinate_clause,
            ]

            for strategy in strategies:
                fixed_para = strategy(para)
                if fixed_para:
                    # Check if this would violate explanation length
                    test_text = "\n\n".join(paras[:i] + fixed_para.split("\n\n") + paras[i+1:])
                    if explanation_length(test_text) < EXPLANATION_MIN:
                        # Skip this fix, it would make explanation too short
                        continue

                    # Replace paragraph
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

    print(f"Processing {len(json_files)} JSON files (safe aggressive fixer)...")

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
