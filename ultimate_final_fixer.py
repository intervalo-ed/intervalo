#!/usr/bin/env python3
"""
Ultimate final fixer - absolute last pass.
Targets the most specific remaining patterns we haven't exploited yet.
"""

import json
import re
from pathlib import Path
from collections import defaultdict
from typing import Optional, Tuple

INLINE_FRAGMENTS_WARN = 3
EXPLANATION_MIN = 300
DISPLAY_RE = re.compile(r"\$\$.*?\$\$", re.DOTALL)
INLINE_RE = re.compile(r"(?<!\$)\$(?!\$)([^$\n]+)\$(?!\$)")

stats = defaultdict(int)


def count_inline_formulas(text: str) -> int:
    stripped = DISPLAY_RE.sub(" ", text)
    return len(INLINE_RE.findall(stripped))


def prose_segments(p: str) -> list[str]:
    return [s for s in DISPLAY_RE.split(p) if s.strip()]


def violates_rule_2(text: str) -> bool:
    return "\n\n$$" in text or "$$\n\n" in text


def paragraphs(s: str) -> list[str]:
    return [p for p in s.split("\n\n") if p.strip()]


def check_explanation_violations(text: str) -> int:
    violations = 0
    for para in paragraphs(text):
        for prose in prose_segments(para):
            if count_inline_formulas(prose) >= INLINE_FRAGMENTS_WARN:
                violations += 1
    return violations


def explanation_length(text: str) -> int:
    t = text.replace("$$", "").replace("$", "")
    t = re.sub(r"\s+", " ", t).strip()
    return len(t)


# ============================================================================
# ULTIMATE PATTERNS
# ============================================================================

def split_at_conditional(para: str) -> Optional[str]:
    """
    Split at conditional clauses: independientemente de, sin que, sin llegar
    """
    pattern = r',\s+(?:independientemente\s+de|sin\s+que|sin\s+llegar|sin\s+estabilizarse)\b'

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


def split_at_descriptive_continuation(para: str) -> Optional[str]:
    """
    Split at descriptive phrases: exactamente en, justo en, específicamente
    """
    pattern = r',\s+(?:exactamente|justo|específicamente)\s+(?:en|cuando|donde)\b'

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


def split_at_evaluative_phrase(para: str) -> Optional[str]:
    """
    Split at evaluative phrases: sin embargo, de igual manera, asimismo
    Already tried some, but this catches more nuanced variants
    """
    pattern = r',\s+(?:de\s+igual\s+manera|asimismo|del\s+mismo\s+modo|similarmente)\b'

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


def split_at_y_boundary(para: str) -> Optional[str]:
    """
    Split at specific " y " patterns that are clearly conjunctions between formulas.
    Pattern: "$x$ y la $y$" where we split after the first formula
    """
    # Only split if we have VERY high formula density
    if count_inline_formulas(para) < INLINE_FRAGMENTS_WARN + 2:
        return None

    # Look for formula + ", y " or " y la/el" patterns
    pattern = r'(\$[^$]+\$)\s*,?\s+y\s+(?:la|el|los|las|de|una|un)\s+(?:\$|[a-z])'

    match = re.search(pattern, para, re.IGNORECASE)
    if not match:
        return None

    # Extract position after the first formula
    formula_end = match.start(1) + len(match.group(1))

    # Check if there's a comma before "y"
    between = para[formula_end:match.end(1) + 10]
    if ',' not in between:
        # Only split if there's high density
        before_text = para[:formula_end].rstrip()
        if count_inline_formulas(before_text) < 2:
            return None

    # Make the split
    before = para[:formula_end].rstrip() + "."
    remaining = para[formula_end:].lstrip()

    if remaining.startswith(","):
        remaining = remaining[1:].lstrip()

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
    original = text
    original_violations = check_explanation_violations(original)
    original_length = explanation_length(original)

    if original_length <= EXPLANATION_MIN + 50:
        return original, 0

    for attempt in range(15):
        paras = paragraphs(text)
        fixed_any = False

        for i, para in enumerate(paras):
            para_violations = sum(1 for prose in prose_segments(para) if count_inline_formulas(prose) >= INLINE_FRAGMENTS_WARN)
            if para_violations == 0:
                continue

            strategies = [
                split_at_conditional,
                split_at_descriptive_continuation,
                split_at_evaluative_phrase,
                split_at_y_boundary,
            ]

            for strategy in strategies:
                fixed_para = strategy(para)
                if fixed_para:
                    test_text = "\n\n".join(paras[:i] + fixed_para.split("\n\n") + paras[i+1:])
                    if explanation_length(test_text) < EXPLANATION_MIN:
                        continue

                    new_paras = fixed_para.split("\n\n")
                    paras = paras[:i] + new_paras + paras[i+1:]
                    stats["splits_applied"] += 1
                    fixed_any = True
                    break

            if fixed_any:
                break

        text = "\n\n".join(paras)

        if not fixed_any:
            break

    final_violations = check_explanation_violations(text)
    fixed_count = max(0, original_violations - final_violations)

    return text, fixed_count


def process_file(file_path: Path) -> Tuple[int, bool]:
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
    content_dir = Path("/home/user/intervalo/backend/content/analisis")
    json_files = sorted(content_dir.rglob("*.json"))

    print(f"Processing {len(json_files)} JSON files (ultimate final fixer)...")

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
