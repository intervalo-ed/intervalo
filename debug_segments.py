#!/usr/bin/env python3
"""
Debug the prose_segments function to understand rule 21 better.
"""

import re

DISPLAY_RE = re.compile(r"\$\$.*?\$\$", re.DOTALL)
INLINE_RE = re.compile(r"(?<!\$)\$(?!\$)([^$\n]+)\$(?!\$)")


def count_inline_formulas(text: str) -> int:
    """Count inline LaTeX fragments."""
    stripped = DISPLAY_RE.sub(" ", text)
    matches = INLINE_RE.findall(stripped)
    return len(matches)


def prose_segments(p: str) -> list[str]:
    """Split paragraph by display formulas."""
    segments = [s for s in DISPLAY_RE.split(p) if s.strip()]
    return segments


def main():
    # Sample violation
    sample = "La rama izquierda se acerca a $y=2$ y la derecha arranca en $y=5$, un salto de $3$ unidades exactamente en $x=2$, así que existe un salto discontinuo en $x=2$."

    print("SAMPLE TEXT:")
    print(sample)
    print()

    print("PROSE SEGMENTS:")
    segments = prose_segments(sample)
    for i, seg in enumerate(segments):
        count = count_inline_formulas(seg)
        print(f"  Segment {i+1} (formulas: {count}): {seg[:100]}...")
    print()

    print("TOTAL INLINE FORMULAS IN TEXT: ", count_inline_formulas(sample))
    print()

    # Try with split
    split_sample = "La rama izquierda se acerca a $y=2$ y la derecha arranca en $y=5$.\n\nUn salto de $3$ unidades exactamente en $x=2$.\n\nAsí que existe un salto discontinuo en $x=2$."

    print("AFTER SPLIT:")
    print(split_sample)
    print()

    print("PROSE SEGMENTS AFTER SPLIT:")
    segments = prose_segments(split_sample)
    for i, seg in enumerate(segments):
        count = count_inline_formulas(seg)
        print(f"  Segment {i+1} (formulas: {count}): {seg[:100]}...")
    print()

    # Check each paragraph separately
    print("PARAGRAPH-BY-PARAGRAPH CHECK:")
    for para in split_sample.split("\n\n"):
        print(f"  Para: {para[:80]}...")
        print(f"    Segments: {prose_segments(para)}")
        for seg in prose_segments(para):
            count = count_inline_formulas(seg)
            print(f"      Segment (formulas: {count}): {seg[:60]}...")


if __name__ == "__main__":
    main()
