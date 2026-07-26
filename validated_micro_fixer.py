#!/usr/bin/env python3
"""
Ultra-safe validated micro-fixer for rule 21 violations.
STRICT VALIDATION: Every fix must maintain rule 2 compliance and reduce warnings.
Only uses patterns that have been proven safe in previous commits.
"""

import json
import re
from pathlib import Path
from collections import defaultdict
from typing import Optional, Tuple
import sys

# Thresholds
INLINE_FRAGMENTS_WARN = 3
PARAGRAPH_PROSE_MAX = 200
DISPLAY_RE = re.compile(r"\$\$.*?\$\$", re.DOTALL)
INLINE_RE = re.compile(r"(?<!\$)\$(?!\$)([^$\n]+)\$(?!\$)")

# Stats
stats = defaultdict(int)

def count_inline_formulas(text: str) -> int:
    """Count inline LaTeX fragments, excluding display blocks."""
    stripped = DISPLAY_RE.sub(" ", text)
    return len(INLINE_RE.findall(stripped))


def prose_segments(p: str) -> list[str]:
    """Split paragraph by display formulas."""
    return [s for s in DISPLAY_RE.split(p) if s.strip()]


def has_rule_21_violation(para: str) -> bool:
    """Check if paragraph violates rule 21 (3+ inline formulas in prose)."""
    for segment in prose_segments(para):
        segment_clean = re.sub(r"\s+", " ", segment).strip()
        if count_inline_formulas(segment) >= INLINE_FRAGMENTS_WARN:
            return True
    return False


def violates_rule_2(text: str) -> bool:
    """Check rule 2: no \n\n adjacent to $$ blocks."""
    return "\n\n$$" in text or "$$\n\n" in text


def violates_paragrapho_rule(para: str) -> bool:
    """Check if paragraph is too long (párrafos rule)."""
    for segment in prose_segments(para):
        segment_clean = re.sub(r"\s+", " ", segment).strip()
        if len(segment_clean) > PARAGRAPH_PROSE_MAX:
            return True
    return False


# ============================================================================
# PROVEN SAFE PATTERNS - Only those that have worked before
# ============================================================================

def fix_with_safe_clauses(para: str) -> Optional[str]:
    """
    Apply only proven-safe clause separator splits.
    These patterns have been used successfully in previous commits.
    """
    if not has_rule_21_violation(para):
        return None

    # List of proven-safe clause separators
    # Format: (pattern, replacement) - both tested to work
    safe_patterns = [
        # Critical to NOT create \n\n adjacent to $$ - use smart positioning
        (r',\s+(es\s+decir)\s+', '. Es decir '),
        (r',\s+(así\s+que)\s+', '. Así que '),
        (r',\s+(porque)\s+', '. Porque '),
        (r',\s+(ya\s+que)\s+', '. Ya que '),
        (r',\s+(sin\s+embargo)\s+', '. Sin embargo '),
        (r',\s+(pero)\s+', '. Pero '),
        (r',\s+(en\s+cambio)\s+', '. En cambio '),
        (r',\s+(de\s+todas\s+formas)\s+', '. De todas formas '),
        (r',\s+(por\s+lo\s+tanto)\s+', '. Por lo tanto '),
        (r',\s+(entonces)\s+', '. Entonces '),
        (r',\s+(en\s+realidad)\s+', '. En realidad '),
        (r',\s+(de\s+hecho)\s+', '. De hecho '),
        (r',\s+(al\s+mismo\s+tiempo)\s+', '. Al mismo tiempo '),
        # English variants
        (r',\s+(so)\s+', '. So '),
        (r',\s+(however)\s+', '. However '),
        (r',\s+(therefore)\s+', '. Therefore '),
        (r',\s+(thus)\s+', '. Thus '),
        (r',\s+(because)\s+', '. Because '),
    ]

    result = para
    for pattern, replacement in safe_patterns:
        match = re.search(pattern, para, re.IGNORECASE)
        if match:
            # Apply the replacement
            new_result = re.sub(pattern, replacement, result, count=1, flags=re.IGNORECASE)

            # CRITICAL VALIDATION
            # 1. Must not violate rule 2
            if violates_rule_2(new_result):
                continue

            # 2. Must actually reduce violations
            if not has_rule_21_violation(new_result):
                return new_result

    return None


def fix_with_sentence_boundary_breaks(para: str) -> Optional[str]:
    """
    Split at sentence boundaries when we have excess inline formulas.
    Pattern: "Sentence 1. Sentence 2. Sentence 3."
    Split into separate paragraphs when middle sentence has many formulas.
    """
    if not has_rule_21_violation(para):
        return None

    if count_inline_formulas(para) < INLINE_FRAGMENTS_WARN + 1:
        return None

    # Look for patterns like: ". Capitalize", not adjacent to $$
    # Split at sentence boundaries by moving to new paragraph
    sentences = re.split(r'(?<=[.!?])\s+(?=[A-Z])', para)

    if len(sentences) < 2:
        return None

    # Try grouping sentences to balance formula density
    result_parts = []
    current_group = []
    current_inline_count = 0

    for sentence in sentences:
        sent_inline = count_inline_formulas(sentence)

        # If adding this sentence would exceed threshold and we have a group, split
        if current_inline_count + sent_inline >= INLINE_FRAGMENTS_WARN and current_group:
            result_parts.append(" ".join(current_group))
            current_group = [sentence]
            current_inline_count = sent_inline
        else:
            current_group.append(sentence)
            current_inline_count += sent_inline

    if current_group:
        result_parts.append(" ".join(current_group))

    if len(result_parts) < 2:
        return None

    result = "\n\n".join(result_parts)

    # CRITICAL VALIDATION
    # 1. Must not violate rule 2
    if violates_rule_2(result):
        return None

    # 2. Must actually reduce violations
    if not has_rule_21_violation(result):
        return result

    return None


def fix_with_list_item_breaks(para: str) -> Optional[str]:
    """
    Split enumerated or bulleted items that are on same paragraph.
    Pattern: "1. First item with $x$ and $y$, 2. Second item with $a$ and $b$"
    Only when it's clear we have list items.
    """
    if not has_rule_21_violation(para):
        return None

    # Look for numbered list patterns
    if not re.search(r'[1-9]\)\s+[^.!?]+[,]\s+[1-9]\)', para):
        return None

    # Split at numbered items
    result = re.sub(
        r'([.!?])\s+([1-9]\))\s+',
        r'\1\n\n\2 ',
        para,
        count=1
    )

    if result == para:
        return None

    # CRITICAL VALIDATION
    if violates_rule_2(result):
        return None

    if not has_rule_21_violation(result):
        return result

    return None


# ============================================================================
# Main fixer with multi-pass approach
# ============================================================================

def fix_explanation_paragraph(para: str) -> Tuple[str, bool]:
    """
    Apply conservative fixes to reduce rule 21 violations.
    Returns: (fixed_text, was_modified)
    """
    if not has_rule_21_violation(para):
        return para, False

    original = para
    max_attempts = 3
    attempt = 0

    while has_rule_21_violation(para) and attempt < max_attempts:
        attempt += 1
        old_para = para

        # Try each pattern in order - SAFEST FIRST
        strategies = [
            fix_with_safe_clauses,
            fix_with_list_item_breaks,
            fix_with_sentence_boundary_breaks,
        ]

        for strategy in strategies:
            result = strategy(para)
            if result:
                para = result
                stats["fixes_applied"] += 1
                stats[f"strategy_{strategy.__name__}"] += 1
                break

        # If nothing changed, break
        if para == old_para:
            break

    if para != original:
        stats["items_modified"] += 1
        return para, True
    return para, False


def process_file(file_path: Path) -> Tuple[int, int, bool]:
    """
    Process a single JSON file.
    Returns: (warnings_before, warnings_after, file_modified)
    """
    with open(file_path, 'r', encoding='utf-8') as f:
        data = json.load(f)

    warnings_before = 0
    warnings_after = 0
    modified = False

    # Handle both list and dict formats
    items = data if isinstance(data, list) else data.get("items", [])

    for item_idx, item in enumerate(items):
        if "explanation" not in item:
            continue

        explanation = item["explanation"]

        # Count violations before
        for para in explanation.split("\n\n"):
            if has_rule_21_violation(para):
                warnings_before += 1

        # Fix each paragraph separately
        fixed_parts = []
        for para in explanation.split("\n\n"):
            fixed_para, was_modified = fix_explanation_paragraph(para)
            fixed_parts.append(fixed_para)
            if was_modified:
                modified = True

        new_explanation = "\n\n".join(fixed_parts)

        # Count violations after
        for para in new_explanation.split("\n\n"):
            if has_rule_21_violation(para):
                warnings_after += 1

        if new_explanation != explanation:
            item["explanation"] = new_explanation

    if modified:
        with open(file_path, 'w', encoding='utf-8') as f:
            json.dump(data, f, ensure_ascii=False, indent=2)

    return warnings_before, warnings_after, modified


def main():
    """Process all content files."""
    content_dir = Path("/home/user/intervalo/backend/content/analisis")

    json_files = sorted(content_dir.rglob("*.json"))
    print(f"Found {len(json_files)} JSON files")

    total_before = 0
    total_after = 0
    files_with_fixes = 0

    for file_path in json_files:
        before, after, modified = process_file(file_path)
        if before > after:
            files_with_fixes += 1
            fixed = before - after
            print(f"  {file_path.name}: {before} → {after} ({fixed} fixed)")
        total_before += before
        total_after += after

    print(f"\n{'='*70}")
    print(f"SUMMARY")
    print(f"{'='*70}")
    print(f"Files modified: {files_with_fixes}")
    print(f"Total fixes applied: {stats['fixes_applied']}")
    print(f"Items modified: {stats['items_modified']}")
    print(f"Warnings: {total_before} → {total_after}")
    print(f"Warnings fixed: {total_before - total_after}")
    print(f"\nStrategy breakdown:")
    for strategy, count in sorted(stats.items()):
        if strategy.startswith("strategy_"):
            print(f"  {strategy.replace('strategy_', '')}: {count}")
    print(f"{'='*70}")

    return total_before - total_after


if __name__ == "__main__":
    fixed_count = main()
    sys.exit(0 if fixed_count > 0 else 1)
