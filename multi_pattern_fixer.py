#!/usr/bin/env python3
"""
Multi-pattern fixer for rule 21 violations.
Applies multiple strategies in sequence.
"""

import json
import re
from pathlib import Path
from collections import defaultdict
from typing import Optional, Tuple

# Thresholds - EXACT SAME AS VALIDATOR
INLINE_FRAGMENTS_WARN = 3
DISPLAY_RE = re.compile(r"\$\$.*?\$\$", re.DOTALL)
INLINE_RE = re.compile(r"(?<!\$)\$(?!\$)([^$\n]+)\$(?!\$)")

# Stats
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
    """Count rule 21 violations in full explanation."""
    violations = 0
    for para in paragraphs(text):
        for prose in prose_segments(para):
            if count_inline_formulas(prose) >= INLINE_FRAGMENTS_WARN:
                violations += 1
    return violations


# ============================================================================
# PATTERN 1: Comma + clause separators (PROVEN)
# ============================================================================

def split_at_comma_clause(para: str) -> Optional[str]:
    """Split at comma + clause separator."""
    clause_starters = [
        r'así\s+que',
        r'sin\s+embargo',
        r'en\s+cambio',
        r'de\s+hecho',
        r'porque',
        r'ya\s+que',
        r'es\s+decir',
        r'entonces',
        r'pero',
        r'en\s+realidad',
        r'al\s+mismo\s+tiempo',
        r'mientras\s+que',
        r'cuando',
        r'si',
        r'aunque',
        r'salvo\s+que',
    ]

    pattern = r',\s+(' + '|'.join(clause_starters) + r')\b'
    match = re.search(pattern, para, re.IGNORECASE)
    if not match:
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
# PATTERN 2: Period-based sentence splitting
# ============================================================================

def split_at_sentence_boundary(para: str) -> Optional[str]:
    """
    Split paragraph at sentence boundaries when prose gets too dense.
    Pattern: "Sentence 1. Sentence 2. Sentence 3."
    """
    # Only if we have multiple sentences
    if not re.search(r'\.\s+[A-Z]', para):
        return None

    # Only if current prose has 3+ inline formulas
    current_violations = sum(1 for prose in prose_segments(para) if count_inline_formulas(prose) >= INLINE_FRAGMENTS_WARN)
    if current_violations == 0:
        return None

    # Split at first period + capital
    match = re.search(r'(\.\s+)([A-Z])', para)
    if not match:
        return None

    # Only split if the first sentence has most formulas
    first_sent = para[:match.start() + 1]  # Include the period
    first_formulas = count_inline_formulas(first_sent)

    if first_formulas < 2:
        return None

    # Create the split
    second_part = para[match.start() + 1:].lstrip()
    result = f"{first_sent}\n\n{second_part}"

    if violates_rule_2(result):
        return None

    return result


# ============================================================================
# PATTERN 3: Semicolon separation
# ============================================================================

def split_at_semicolon(para: str) -> Optional[str]:
    """
    Split at semicolons that separate independent clauses.
    Pattern: "Clause 1; Clause 2"
    """
    # Look for semicolon followed by capital or lowercase letter
    if ';' not in para:
        return None

    match = re.search(r';\s+([A-Z])', para)
    if not match:
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
# PATTERN 4: Extract formulas at end of sentence
# ============================================================================

def extract_trailing_formula(para: str) -> Optional[str]:
    """
    Move formula that appears at end of sentence to separate paragraph.
    Pattern: "Text with $formula$."
    To: "Text with.\n\n$$formula$$"
    Only when: formula is the last element and causes violation.
    """
    # Look for formula at sentence end
    if not re.search(r'\$[^$]+\$\s*[.!?]\s*$', para):
        return None

    # Check if we have violation
    current_violations = sum(1 for prose in prose_segments(para) if count_inline_formulas(prose) >= INLINE_FRAGMENTS_WARN)
    if current_violations == 0:
        return None

    # Extract the trailing formula
    match = re.search(r'(\$[^$]+\$)\s*([.!?])\s*$', para)
    if not match:
        return None

    formula = match.group(1)
    punct = match.group(2)

    # Remove formula from text
    before = para[:match.start()].rstrip() + punct

    # Convert to display block
    formula_content = formula[1:-1]  # Remove $ delimiters
    result = f"{before}\n\n$${formula_content}$$"

    if violates_rule_2(result):
        return None

    return result


# ============================================================================
# Main fixer
# ============================================================================

def fix_explanation(text: str) -> Tuple[str, int]:
    """Apply patterns to reduce rule 21 violations."""
    original = text
    original_violations = check_explanation_violations(original)

    # Try multiple passes
    for attempt in range(15):
        paras = paragraphs(text)
        fixed_any = False

        for i, para in enumerate(paras):
            # Check if this paragraph has violations
            para_violations = sum(1 for prose in prose_segments(para) if count_inline_formulas(prose) >= INLINE_FRAGMENTS_WARN)
            if para_violations == 0:
                continue

            # Try each strategy
            strategies = [
                split_at_comma_clause,
                split_at_semicolon,
                split_at_sentence_boundary,
                extract_trailing_formula,
            ]

            for strategy in strategies:
                fixed_para = strategy(para)
                if fixed_para:
                    # Replace paragraph and split if needed
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

    print(f"Processing {len(json_files)} JSON files (multi-pattern fixer)...")

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
