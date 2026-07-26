#!/usr/bin/env python3
"""
Examine specific violations and try different split strategies.
"""

import json
import re
from pathlib import Path

DISPLAY_RE = re.compile(r"\$\$.*?\$\$", re.DOTALL)
INLINE_RE = re.compile(r"(?<!\$)\$(?!\$)([^$\n]+)\$(?!\$)")


def count_inline_formulas(text: str) -> int:
    """Count inline LaTeX fragments."""
    stripped = DISPLAY_RE.sub(" ", text)
    return len(INLINE_RE.findall(stripped))


def prose_segments(p: str) -> list[str]:
    """Split paragraph by display formulas."""
    return [s for s in DISPLAY_RE.split(p) if s.strip()]


def has_rule_21_violation(para: str) -> bool:
    """Check if paragraph violates rule 21."""
    for segment in prose_segments(para):
        if count_inline_formulas(segment) >= 3:
            return True
    return False


def test_split_at_pattern(text: str, pattern: str, replacement: str) -> str:
    """Test splitting at a specific pattern."""
    return re.sub(pattern, replacement, text, count=1, flags=re.IGNORECASE)


def main():
    # Sample violation with ", así que"
    sample1 = "La rama izquierda se acerca a $y=2$ y la derecha arranca en $y=5$, un salto de $3$ unidades exactamente en $x=2$, así que existe un salto discontinuo en $x=2$."

    print("SAMPLE 1: Violation with ', así que'")
    print(f"Original: {sample1[:100]}...")
    print(f"Formulas: {count_inline_formulas(sample1)}")
    print(f"Has violation: {has_rule_21_violation(sample1)}")
    print()

    # Try different splits
    splits = [
        (r',\s+así\s+que\s+', '. Así que '),
        (r'(\$[^$]+\$),\s+(un\s+salto)', r'\1.\n\nUn salto'),
        (r',\s+', '.\n\n'),  # Split at first comma
    ]

    for pattern, replacement in splits:
        result = test_split_at_pattern(sample1, pattern, replacement)
        print(f"Pattern: {pattern} → {replacement}")
        if "\n\n" in result:
            parts = result.split("\n\n")
            print(f"  Part 1: {parts[0][:80]}... (formulas: {count_inline_formulas(parts[0])})")
            print(f"  Part 2: {parts[1][:80]}... (formulas: {count_inline_formulas(parts[1])})")
        print(f"  Has violation: {has_rule_21_violation(result)}")
        print()


if __name__ == "__main__":
    main()
