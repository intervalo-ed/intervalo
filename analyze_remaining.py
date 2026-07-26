#!/usr/bin/env python3
"""
Analyze remaining violations to identify new patterns to fix.
"""

import json
import re
from pathlib import Path
from collections import defaultdict

DISPLAY_RE = re.compile(r"\$\$.*?\$\$", re.DOTALL)
INLINE_RE = re.compile(r"(?<!\$)\$(?!\$)([^$\n]+)\$(?!\$)")


def count_inline_formulas(text: str) -> int:
    """Count inline LaTeX fragments."""
    stripped = DISPLAY_RE.sub(" ", text)
    return len(INLINE_RE.findall(stripped))


def prose_segments(p: str) -> list[str]:
    """Split paragraph by display formulas."""
    return [s for s in DISPLAY_RE.split(p) if s.strip()]


def paragraphs(s: str) -> list[str]:
    """Split explanation by paragraph breaks."""
    return [p for p in s.split("\n\n") if p.strip()]


def has_violation(text: str) -> bool:
    """Check if text has rule 21 violations."""
    for para in paragraphs(text):
        for prose in prose_segments(para):
            if count_inline_formulas(prose) >= 3:
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
            if has_violation(explanation):
                violations.append((explanation, file_path.name))

    print(f"Total explanations with violations: {len(violations)}\n")
    print("Sample 15 violations:\n")

    for i, (expl, filename) in enumerate(violations[:15]):
        print(f"[{i+1}] ({filename})")
        # Show the prose parts that violate
        for para in paragraphs(expl):
            for prose in prose_segments(para):
                if count_inline_formulas(prose) >= 3:
                    # Show the violation
                    count = count_inline_formulas(prose)
                    print(f"    {prose[:150]}...")
                    print(f"    (formulas: {count})")
        print()


if __name__ == "__main__":
    main()
