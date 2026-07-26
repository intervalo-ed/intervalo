#!/usr/bin/env python3
"""
Analyze specific comma patterns in remaining violations.
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

    comma_patterns = defaultdict(int)
    sample_texts = defaultdict(list)

    for file_path in json_files:
        with open(file_path, 'r', encoding='utf-8') as f:
            data = json.load(f)

        items = data if isinstance(data, list) else data.get("items", [])

        for item in items:
            if "explanation" not in item:
                continue

            explanation = item["explanation"]
            if has_violation(explanation):
                for para in paragraphs(explanation):
                    for prose in prose_segments(para):
                        if count_inline_formulas(prose) >= 3:
                            # Extract comma patterns (word after comma)
                            matches = re.finditer(r',\s+([a-zá-ú]+)', prose, re.IGNORECASE)
                            for match in matches:
                                word = match.group(1)
                                if word not in sample_texts:
                                    sample_texts[word] = []
                                if len(sample_texts[word]) < 2:
                                    sample_texts[word].append(prose[:150])
                                comma_patterns[word] += 1

    print("Top 30 words after commas in remaining violations:\n")
    for word, count in sorted(comma_patterns.items(), key=lambda x: -x[1])[:30]:
        examples = sample_texts.get(word, [])
        print(f"{count:3d}x  ', {word}'")
        if examples:
            print(f"       Example: {examples[0][:100]}...")
        print()


if __name__ == "__main__":
    main()
