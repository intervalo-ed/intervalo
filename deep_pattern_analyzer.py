#!/usr/bin/env python3
"""
Deep analysis of remaining rule 21 violations.
Identify specific patterns that are NOT being split.
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
    text_patterns = defaultdict(int)

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

                # Analyze patterns
                for para in paragraphs(explanation):
                    for prose in prose_segments(para):
                        if count_inline_formulas(prose) >= 3:
                            # Look for specific patterns
                            if ' y ' in prose:
                                text_patterns['contains " y "'] += 1
                            if ', ' in prose:
                                text_patterns['contains ", "'] += 1
                            if '; ' in prose:
                                text_patterns['contains "; "'] += 1
                            if 'tanto' in prose.lower():
                                text_patterns['contains "tanto"'] += 1
                            if 'también' in prose.lower():
                                text_patterns['contains "también"'] += 1
                            if 'ejemplo' in prose.lower():
                                text_patterns['contains "ejemplo"'] += 1
                            if 'ambos' in prose.lower():
                                text_patterns['contains "ambos"'] += 1
                            if 'ambas' in prose.lower():
                                text_patterns['contains "ambas"'] += 1

    print(f"Total violations remaining: {len(violations)}\n")
    print("Pattern occurrence in violations:")
    for pattern, count in sorted(text_patterns.items(), key=lambda x: -x[1]):
        print(f"  {pattern}: {count}")

    print(f"\n\nSample violations (first 5):\n")
    for i, (expl, filename) in enumerate(violations[:5]):
        print(f"[{i+1}] ({filename})")
        for para in paragraphs(expl):
            for prose in prose_segments(para):
                if count_inline_formulas(prose) >= 3:
                    print(f"    {prose[:200]}...")
                    print(f"    Formulas: {count_inline_formulas(prose)}")
        print()


if __name__ == "__main__":
    main()
