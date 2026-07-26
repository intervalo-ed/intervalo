#!/usr/bin/env python3
"""
Final targeted fixer for remaining rule 21 violations.
ULTRA-CONSERVATIVE: Only targets high-confidence remaining patterns.
"""

import json
import re
from pathlib import Path
from collections import defaultdict
from typing import Optional, Tuple

# Thresholds
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
    """Get explanation length."""
    t = text.replace("$$", "").replace("$", "")
    t = re.sub(r"\s+", " ", t).strip()
    return len(t)


# ============================================================================
# FINAL TARGETED PATTERNS (ULTRA-CONSERVATIVE)
# ============================================================================

def split_at_with_pattern(para: str) -> Optional[str]:
    """
    Split at ", con" when followed by specific patterns.
    """
    pattern = r',\s+con\s+(\$|[a-z])'

    match = re.search(pattern, para, re.IGNORECASE)
    if not match:
        return None

    if count_inline_formulas(para) < INLINE_FRAGMENTS_WARN + 1:
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


def split_at_verb_forms(para: str) -> Optional[str]:
    """
    Split at verb forms like ", se obtiene", ", reemplazamos".
    """
    verbs = [
        r'se\s+(?:obtiene|obtienen|divide|multiplica|multiplican|suma|suman)',
        r'reemplaz[ao]s?',
        r'evaluamos',
        r'resulta',
        r'notemos',
    ]

    pattern = r',\s+(' + '|'.join(verbs) + r')\b'

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


def split_at_relative_clause(para: str) -> Optional[str]:
    """
    Split at relative clauses like ", que es ...", ", que forma ...".
    """
    pattern = r',\s+que\s+(?:es|son|forma|tiene|tienen|indica|muestra)\b'

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


def split_at_negation(para: str) -> Optional[str]:
    """
    Split at negation patterns ", no ..." that introduce contrast.
    """
    pattern = r',\s+no\s+(?:es|son|importa|tiene|tienen|olvides|debemos)\b'

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
# Main fixer
# ============================================================================

def fix_explanation(text: str) -> Tuple[str, int]:
    """Apply final targeted patterns."""
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
                split_at_with_pattern,
                split_at_verb_forms,
                split_at_relative_clause,
                split_at_negation,
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

    print(f"Processing {len(json_files)} JSON files (final targeted fixer)...")

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
