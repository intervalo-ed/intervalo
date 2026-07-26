#!/usr/bin/env python3
"""Fix Rule 21 (3+ inline formulas) and Párrafos (>200 chars) warnings intelligently.

Handles FORM.json files in backend/content/analisis/white/functions/*/

Strategy:
1. For Párrafos: Split long prose (>200 chars) at natural boundaries
   - Try to keep formulas balanced (avoid creating 3+ in one split)
   - Prefer splitting sentences that keep formulas under 2-3 per split

2. For Rule 21: Only fix if 5+ formulas (aggressive cases)
   - Split to keep ~2 formulas per group

Key: When a prose segment is too long, we split sentences intelligently to both:
- Reduce character count below 200
- Avoid creating new 3+ formula segments in the splits
"""

import json
import re
from pathlib import Path

# --- Constants ---

INLINE_RE = re.compile(r"(?<!\$)\$(?!\$)([^$\n]+)\$(?!\$)")
DISPLAY_RE = re.compile(r"\$\$.*?\$\$", re.DOTALL)

PARAGRAPH_PROSE_MAX = 200
INLINE_FRAGMENTS_WARN = 3
# Only fix Rule 21 if 5+ formulas
RULE21_AGGRESSIVE_THRESHOLD = 5


def paragraphs(s: str) -> list[str]:
    """Split text by double newlines."""
    return [p for p in s.split("\n\n") if p.strip()]


def prose_segments(p: str) -> list[str]:
    """Split paragraph by display formulas ($$...$$)."""
    return [s for s in DISPLAY_RE.split(p) if s.strip()]


def count_inline_formulas(prose: str) -> int:
    """Count inline formulas in a prose segment."""
    return len(INLINE_RE.findall(prose))


def split_prose_sentence_by_sentence(prose: str) -> list[str]:
    """Split prose into sentences."""
    # Try periods first (most natural)
    if ". " in prose:
        sentences = re.split(r'(?<=\.)\s+', prose)
    elif "; " in prose:
        sentences = re.split(r'(?<=;)\s+', prose)
    elif ": " in prose:
        sentences = re.split(r'(?<=:)\s+', prose)
    else:
        return [prose]

    # Filter out empty strings
    return [s.strip() for s in sentences if s.strip()]


def smart_group_sentences(sentences: list[str], target_len: int = PARAGRAPH_PROSE_MAX, target_formulas: int = 2) -> list[str]:
    """
    Group sentences intelligently to respect both length and formula density limits.

    This is smarter than naive grouping: it avoids creating 3+ formula groups
    when possible. It tries to keep formulas balanced across groups.
    """
    if not sentences:
        return []

    # Calculate formula count for each sentence
    sent_formulas = [count_inline_formulas(s) for s in sentences]

    # Greedy grouping: for each sentence, decide if it goes with current group or starts new
    groups = []
    current = []
    current_len = 0
    current_formulas = 0

    for i, sentence in enumerate(sentences):
        sent_len = len(sentence)
        sent_form = sent_formulas[i]

        # Decision: should this sentence go in current group or start a new one?
        # Heuristic: if adding it would exceed BOTH limits, or would create 3+ formulas, start new
        exceeds_len = current_len + sent_len + 1 > target_len
        exceeds_forms = current_formulas + sent_form >= INLINE_FRAGMENTS_WARN
        would_create_3plus = current_formulas + sent_form >= INLINE_FRAGMENTS_WARN

        if current and (exceeds_len or would_create_3plus):
            # Start a new group
            groups.append(" ".join(current))
            current = [sentence]
            current_len = sent_len
            current_formulas = sent_form
        else:
            # Add to current group
            current.append(sentence)
            current_len += sent_len + 1  # +1 for space
            current_formulas += sent_form

    if current:
        groups.append(" ".join(current))

    return groups


def capitalize_first(text: str) -> str:
    """Ensure text starts with uppercase if it starts with a letter."""
    text = text.strip()
    if text and text[0].isalpha() and text[0].islower() and not text.startswith("$"):
        text = text[0].upper() + text[1:]
    return text


def fix_prose_segment(prose: str) -> list[str]:
    """
    Fix a single prose segment (text between display formulas).

    Returns a list of prose parts (to be separated by \n\n when rebuilding).

    Tries to minimize creating new Rule 21 violations while fixing Párrafos.
    """
    inline_count = count_inline_formulas(prose)
    prose_len = len(prose)

    # Check if this segment needs fixing
    needs_length_fix = prose_len > PARAGRAPH_PROSE_MAX
    needs_formula_fix = inline_count >= RULE21_AGGRESSIVE_THRESHOLD  # Only fix 5+

    if not needs_length_fix and not needs_formula_fix:
        # No fixing needed
        return [prose]

    # Try to split into sentences
    sentences = split_prose_sentence_by_sentence(prose)

    if len(sentences) <= 1:
        # Can't split further - return as-is
        return [prose]

    # Use smart grouping to fix while avoiding new violations
    groups = smart_group_sentences(sentences)

    # If grouping didn't help (only 1 group), return as-is
    if len(groups) <= 1:
        return [prose]

    # Verify that the split doesn't create new Rule 21 violations
    # If it does, try a more aggressive split (max 2 formulas even for middle groups)
    has_violation = False
    for group in groups:
        if count_inline_formulas(group) >= INLINE_FRAGMENTS_WARN:
            has_violation = True
            break

    if has_violation and not needs_formula_fix:
        # This was a Párrafos fix that created Rule 21 violation
        # Try to regroup more aggressively
        groups = []
        current = []
        current_formulas = 0

        for sentence in sentences:
            sent_formulas = count_inline_formulas(sentence)

            # Much stricter: aim for max 2 formulas per group
            if current_formulas + sent_formulas >= 2 and current:
                groups.append(" ".join(current))
                current = [sentence]
                current_formulas = sent_formulas
            else:
                current.append(sentence)
                current_formulas += sent_formulas

        if current:
            groups.append(" ".join(current))

    # Capitalize each group
    return [capitalize_first(g) for g in groups]


def fix_paragraph(para: str) -> str:
    """
    Fix Párrafos and Rule 21 violations in a paragraph.

    Handles the full paragraph including display formulas.
    """
    # Parse paragraph into blocks: prose and display formulas
    blocks = []
    last_end = 0

    for match in DISPLAY_RE.finditer(para):
        # Add text before formula
        text_before = para[last_end:match.start()].strip()
        if text_before:
            blocks.append(("prose", text_before))
        # Add formula block
        blocks.append(("formula", match.group()))
        last_end = match.end()

    # Add remaining text
    if last_end < len(para):
        text_after = para[last_end:].strip()
        if text_after:
            blocks.append(("prose", text_after))

    # Process each prose block
    fixed_blocks = []
    for block_type, content in blocks:
        if block_type == "formula":
            fixed_blocks.append(("formula", content))
        else:
            # Prose block
            prose_parts = fix_prose_segment(content)
            for part in prose_parts:
                fixed_blocks.append(("prose", part))

    # Rebuild: convert blocks back to text
    # Consecutive prose blocks are separated by \n\n
    result_parts = []
    for i, (block_type, content) in enumerate(fixed_blocks):
        if block_type == "prose":
            result_parts.append(content)
            # Check if next is also prose
            if i + 1 < len(fixed_blocks) and fixed_blocks[i + 1][0] == "prose":
                result_parts.append("\n\n")
        else:  # formula
            result_parts.append(content)

    result = "".join(result_parts).strip()
    return result


def count_violations(items: list) -> dict:
    """Count Rule 21 and Párrafos violations (matching validator logic)."""
    rule21 = 0
    paragrafos = 0

    for item in items:
        explanation = item.get("explanation", "")
        for para in paragraphs(explanation):
            for prose in prose_segments(para):
                prose_flat = re.sub(r"\s+", " ", prose).strip()
                inline_count = count_inline_formulas(prose_flat)
                if inline_count >= INLINE_FRAGMENTS_WARN:
                    rule21 += 1
                if len(prose_flat) > PARAGRAPH_PROSE_MAX:
                    paragrafos += 1

    return {"rule21": rule21, "paragrafos": paragrafos}


def process_file(json_path: Path) -> dict:
    """Process a FORM.json file and return statistics."""
    with open(json_path, encoding="utf-8") as f:
        items = json.load(f)

    if not isinstance(items, list):
        return {"error": "File is not an array of items"}

    # Count violations before
    stats_before = count_violations(items)

    # Apply fixes to all explanations
    for item in items:
        if "explanation" in item:
            explanation = item["explanation"]
            paras = paragraphs(explanation)
            fixed_paras = [fix_paragraph(p) for p in paras]
            item["explanation"] = "\n\n".join(fixed_paras)

    # Count violations after
    stats_after = count_violations(items)

    # Save back
    with open(json_path, "w", encoding="utf-8") as f:
        json.dump(items, f, ensure_ascii=False, indent=2)

    return {
        "file": str(json_path),
        "items": len(items),
        "before": stats_before,
        "after": stats_after,
        "improvements": {
            "rule21": stats_before["rule21"] - stats_after["rule21"],
            "paragrafos": stats_before["paragrafos"] - stats_after["paragrafos"],
        },
    }


def main():
    """Fix warnings in all function FORM.json files."""
    base_dir = Path("backend/content/analisis/white/functions")

    if not base_dir.exists():
        print(f"Error: {base_dir} does not exist")
        return 1

    all_results = []
    functions = ["rational", "linear", "quadratic", "polynomial", "exponential", "logarithmic", "trigonometric"]

    for func_name in functions:
        json_path = base_dir / func_name / "FORM.json"
        if not json_path.exists():
            continue

        print(f"\nProcessing {func_name}/FORM.json...")
        result = process_file(json_path)
        all_results.append(result)

        if "error" not in result:
            improvements = result["improvements"]
            print(f"  Items: {result['items']}")
            print(f"  Before: Rule 21={result['before']['rule21']}, Párrafos={result['before']['paragrafos']}")
            print(f"  After:  Rule 21={result['after']['rule21']}, Párrafos={result['after']['paragrafos']}")
            print(f"  Fixed:  Rule 21={improvements['rule21']}, Párrafos={improvements['paragrafos']}")

    # Summary
    print("\n" + "="*70)
    print("SUMMARY")
    print("="*70)
    total_before_r21 = sum(r["before"]["rule21"] for r in all_results if "error" not in r)
    total_after_r21 = sum(r["after"]["rule21"] for r in all_results if "error" not in r)
    total_before_par = sum(r["before"]["paragrafos"] for r in all_results if "error" not in r)
    total_after_par = sum(r["after"]["paragrafos"] for r in all_results if "error" not in r)

    print(f"Total Rule 21:   {total_before_r21} -> {total_after_r21} ({total_before_r21 - total_after_r21} fixed)")
    print(f"Total Párrafos:  {total_before_par} -> {total_after_par} ({total_before_par - total_after_par} fixed)")

    return 0


if __name__ == "__main__":
    exit(main())
