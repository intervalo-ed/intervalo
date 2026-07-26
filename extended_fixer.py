#!/usr/bin/env python3
"""
Extended fixer for remaining rule 21 violations.
Targets additional patterns beyond the safe aggressive fixer:
1. Logical connectors (además, incluso, sino, etc.)
2. Comparison phrases (a diferencia de, en contraste con)
3. Range/series patterns
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
# NEW PATTERNS FOR EXTENDED FIXER
# ============================================================================

def split_at_logical_connector(para: str) -> Optional[str]:
    """
    Split at logical connectors after commas.
    Examples: además, incluso, sino, al contrario, por el contrario
    """
    connectors = [
        r'además',
        r'incluso',
        r'sino',
        r'al\s+contrario',
        r'por\s+el\s+contrario',
        r'contrariamente',
        r'en\s+conclusión',
        r'en\s+resumen',
    ]

    pattern = r',\s+(' + '|'.join(connectors) + r')\b'
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


def split_at_comparison(para: str) -> Optional[str]:
    """
    Split at comparison phrases like "a diferencia de", "en contraste".
    Pattern: "... $x$, a diferencia de ..."
    """
    comparisons = [
        r'a\s+diferencia\s+de',
        r'en\s+contraste\s+(?:con|a)',
        r'a\s+diferencia\s+de\s+lo\s+anterior',
        r'no\s+así',
    ]

    pattern = r',\s+(' + '|'.join(comparisons) + r')\s+'
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


def split_at_temporal_marker(para: str) -> Optional[str]:
    """
    Split at temporal markers like "después", "luego", "antes".
    Pattern: "... $x$, luego ..."
    """
    temporal = [
        r'después',
        r'luego',
        r'antes',
        r'anteriormente',
        r'posteriormente',
        r'inmediatamente',
        r'seguidamente',
    ]

    pattern = r',\s+(' + '|'.join(temporal) + r')\b'
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


def split_at_causality(para: str) -> Optional[str]:
    """
    Split at causality markers (causas/consecuencias).
    Pattern: "... $x$, resultado ..." or "... $x$, consecuencia ..."
    """
    causality = [
        r'resultando',
        r'resultante',
        r'resultado',
        r'consecuencia',
        r'consecuentemente',
        r'causando',
        r'causa',
    ]

    pattern = r',\s+(' + '|'.join(causality) + r')\b'
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
    """Apply extended patterns to reduce rule 21 violations."""
    original = text
    original_violations = check_explanation_violations(original)
    original_length = explanation_length(original)

    # Early exit
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
                split_at_logical_connector,
                split_at_comparison,
                split_at_temporal_marker,
                split_at_causality,
            ]

            for strategy in strategies:
                fixed_para = strategy(para)
                if fixed_para:
                    # Check length
                    test_text = "\n\n".join(paras[:i] + fixed_para.split("\n\n") + paras[i+1:])
                    if explanation_length(test_text) < EXPLANATION_MIN:
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

    print(f"Processing {len(json_files)} JSON files (extended fixer)...")

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
