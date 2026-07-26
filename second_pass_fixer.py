#!/usr/bin/env python3
"""
Second-pass fixer for rule 21 violations.

Targets additional patterns:
1. Formula enumerations with "y" conjunctions
2. Conditional structures that can be split
3. Long sequences of related formulas
"""

import json
import re
from pathlib import Path
from collections import defaultdict
from typing import Optional, Tuple

DISPLAY_RE = re.compile(r"\$\$.*?\$\$", re.DOTALL)
INLINE_RE = re.compile(r"(?<!\$)\$(?!\$)([^$\n]+)\$(?!\$)")


def count_inline_formulas(text: str) -> int:
    """Count inline LaTeX fragments."""
    stripped = DISPLAY_RE.sub(" ", text)
    return len(INLINE_RE.findall(stripped))


def prose_segments(p: str) -> list[str]:
    """Split paragraph by display formulas."""
    return [s for s in DISPLAY_RE.split(p) if s.strip()]


def violates_rule_2(text: str) -> bool:
    """Check rule 2: no \n\n adjacent to $$."""
    return "\n\n$$" in text or "$$\n\n" in text


def check_para_violation(para: str) -> Tuple[bool, str]:
    """Check if paragraph violates rule 21 or párrafos."""
    for segment in prose_segments(para):
        segment_clean = re.sub(r"\s+", " ", segment).strip()
        inline_count = count_inline_formulas(segment)

        if len(segment_clean) > 200:
            return True, f"párrafo ({len(segment_clean)} chars)"
        if inline_count >= 3:
            return True, f"rule 21 ({inline_count} formulas)"

    return False, ""


# ============================================================================
# PATTERN 1: "Y" conjunctions between formula references
# ============================================================================

def split_at_and_conjunction(para: str) -> Optional[str]:
    """
    Split at " y " when it connects two independent clauses with formulas.

    Pattern: "phrase $formula$ y phrase $formula$ ..."
    Strategy: "... $formula$. Y phrase..."

    DISABLED: Too risky - can create unintended splits.
    """
    return None


# ============================================================================
# PATTERN 2: Conditional structures
# ============================================================================

def split_conditional_clause(para: str) -> Optional[str]:
    """
    Handle "Cuando/Si...hay/existe/es..." structures.

    Example: "Cuando escapa hacia X y Y sin llegar, hay asíntota"
    Can split at natural points.

    DISABLED: This pattern tends to break rule 17 (paragraph ending punctuation).
    """
    # This pattern is too risky - it creates paragraphs ending in commas
    # which violates rule 17. Disabled for safety.
    return None


# ============================================================================
# PATTERN 3: Sentence splitting at period + space + capital
# ============================================================================

def split_at_sentence_boundary(para: str) -> Optional[str]:
    """
    For paragraphs with multiple inline formulas spread across sentences,
    try splitting at sentence boundaries.

    DISABLED: Risky pattern - can break rule 17 (ending punctuation).
    """
    return None


# ============================================================================
# Main fixer
# ============================================================================

def fix_explanation(text: str) -> Tuple[str, bool]:
    """Fix explanation by applying second-pass patterns."""
    original = text
    result = text

    paras = text.split("\n\n")
    fixed_paras = []

    for para in paras:
        fixed_para = para

        # Try each strategy
        strategies = [
            split_at_and_conjunction,
            split_conditional_clause,
            split_at_sentence_boundary,
        ]

        for strategy in strategies:
            fixed = strategy(fixed_para)
            if fixed:
                fixed_para = fixed
                break  # Stop after first successful fix

        fixed_paras.append(fixed_para)

    result = "\n\n".join(fixed_paras)
    return result, result != original


# ============================================================================
# Processor
# ============================================================================

def process_files():
    """Process all JSON files."""
    content_dir = Path("/home/user/intervalo/backend/content/analisis")
    json_files = sorted(content_dir.glob("**/*.json"))

    total_fixed = 0
    errors = []
    modified_files = defaultdict(int)

    for file_path in json_files:
        try:
            data = json.loads(file_path.read_text(encoding="utf-8"))
            if not isinstance(data, list):
                continue

            file_modified = False
            for item in data:
                if not isinstance(item, dict):
                    continue

                exp = item.get("explanation")
                if not isinstance(exp, str) or not exp.strip():
                    continue

                fixed, was_fixed = fix_explanation(exp)

                if was_fixed:
                    if not violates_rule_2(fixed):
                        item["explanation"] = fixed
                        file_modified = True
                        total_fixed += 1
                        modified_files[file_path.name] += 1

            if file_modified:
                file_path.write_text(
                    json.dumps(data, ensure_ascii=False, indent=2) + "\n",
                    encoding="utf-8"
                )

        except Exception as e:
            errors.append(f"{file_path}: {e}")

    return total_fixed, errors, modified_files


if __name__ == "__main__":
    total, errors, files = process_files()

    print(f"\n{'='*70}")
    print(f"Explanations fixed: {total}")
    print(f"Errors: {len(errors)}")

    if errors:
        print("\nErrors:")
        for e in errors[:5]:
            print(f"  - {e}")

    if files:
        print("\nFiles modified:")
        for fname in sorted(files.keys())[:15]:
            print(f"  {fname}: {files[fname]}")
