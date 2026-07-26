#!/usr/bin/env python3
"""
Analyze patterns that appear in rule 21 violations to identify safe splits.
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
    patterns = defaultdict(int)
    comma_after_formula = 0
    period_after_formula = 0
    clause_separators = defaultdict(int)

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
                    violations.append(para)

                    # Check for patterns
                    if re.search(r'\$[^$]+\$,', para):
                        comma_after_formula += 1
                    if re.search(r'\$[^$]+\$\.', para):
                        period_after_formula += 1

                    # Check for clause separators
                    separators = [
                        ', es decir',
                        ', así que',
                        ', porque',
                        ', ya que',
                        ', puesto que',
                        ', sin embargo',
                        ', en cambio',
                        ', de hecho',
                        ', por lo tanto',
                        ', entonces',
                        ', pero',
                        ', en realidad',
                        ', al mismo tiempo',
                        ', mientras que',
                        ', cuando',
                        ', si',
                        ', aunque',
                        ', salvo que',
                        ', excepto',
                    ]
                    for sep in separators:
                        if sep.lower() in para.lower():
                            clause_separators[sep] += 1

                    # Check for periods between formulas
                    if re.search(r'\$[^$]+\$\.\s+[A-Z]', para):
                        patterns["Period + capital after formula"] += 1

    print(f"Total violations: {len(violations)}\n")
    print(f"Violations with formula+comma: {comma_after_formula}")
    print(f"Violations with formula+period: {period_after_formula}")
    print()
    print("Clause separators in violations (top 15):")
    for sep, count in sorted(clause_separators.items(), key=lambda x: -x[1])[:15]:
        print(f"  '{sep}': {count}")
    print()
    print("Other patterns:")
    for pattern, count in sorted(patterns.items(), key=lambda x: -x[1]):
        print(f"  {pattern}: {count}")


if __name__ == "__main__":
    main()
