#!/usr/bin/env python3
"""
Analyze actual violations to understand what patterns need fixing.
"""

import json
import re
from pathlib import Path
from typing import List, Tuple

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


def main():
    content_dir = Path("/home/user/intervalo/backend/content/analisis")
    json_files = sorted(content_dir.rglob("*.json"))

    violations = []

    for file_path in json_files:
        with open(file_path, 'r', encoding='utf-8') as f:
            data = json.load(f)

        items = data if isinstance(data, list) else data.get("items", [])

        for item in items:
            if "explanation" not in item:
                continue

            explanation = item["explanation"]
            for para in explanation.split("\n\n"):
                if has_rule_21_violation(para):
                    violations.append((para, file_path.name))

    print(f"Total violations: {len(violations)}\n")
    print("First 10 violations:\n")

    for i, (para, filename) in enumerate(violations[:10]):
        print(f"[{i+1}] ({filename})")
        print(f"    {para[:200]}...")
        inline_count = count_inline_formulas(para)
        print(f"    Inline formulas: {inline_count}")
        print()


if __name__ == "__main__":
    main()
