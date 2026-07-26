#!/usr/bin/env python3
"""
Advanced pattern-based explanation warning fixer.

Targets remaining 1,346 rule 21 warnings by:
1. Splitting at semicolon boundaries with explicit continuations
2. Extracting parenthetical formulas to display blocks
3. Separating multiple independent examples
4. Breaking conditional + consequent pairs
5. Isolating formula + interpretation blocks
"""

import json
import re
from pathlib import Path
from collections import defaultdict
from typing import Optional, Tuple

# Thresholds
INLINE_FRAGMENTS_WARN = 3
PARAGRAPH_PROSE_MAX = 200
DISPLAY_RE = re.compile(r"\$\$.*?\$\$", re.DOTALL)
INLINE_RE = re.compile(r"(?<!\$)\$(?!\$)([^$\n]+)\$(?!\$)")


def count_inline_formulas(text: str) -> int:
    """Count inline LaTeX fragments, excluding display blocks."""
    stripped = DISPLAY_RE.sub(" ", text)
    return len(INLINE_RE.findall(stripped))


def prose_segments(p: str) -> list[str]:
    """Split paragraph by display formulas."""
    return [s for s in DISPLAY_RE.split(p) if s.strip()]


def has_violation(para: str) -> bool:
    """Check if paragraph has rule 21 or párrafos violation."""
    for segment in prose_segments(para):
        segment_clean = re.sub(r"\s+", " ", segment).strip()
        if len(segment_clean) > PARAGRAPH_PROSE_MAX:
            return True
        if count_inline_formulas(segment) >= INLINE_FRAGMENTS_WARN:
            return True
    return False


# ============================================================================
# PATTERN 1: Semicolon boundaries with explicit continuation
# ============================================================================

CONTINUATION_WORDS = [
    "moreover", "however", "therefore", "thus", "hence", "consequently",
    "additionally", "furthermore", "meanwhile", "besides", "rather",
    # Spanish equivalents
    "sin embargo", "por lo tanto", "así", "entonces", "además", "por otro lado",
    "en cambio", "de hecho", "en realidad", "al mismo tiempo",
]


def split_semicolon_continuation(text: str) -> Optional[str]:
    """
    If text contains "; [continuation_word]", split into two paragraphs.
    Preserves the semicolon pattern but moves content to separate paragraph.
    """
    # Match semicolon followed by spaces and a continuation word
    pattern = r";\s*(" + "|".join(CONTINUATION_WORDS) + r")\b"
    if not re.search(pattern, text, re.IGNORECASE):
        return None

    # Split at semicolon + continuation
    result = re.sub(
        pattern,
        r".\n\n\1",
        text,
        flags=re.IGNORECASE,
        count=1
    )

    # Only return if it actually changed
    return result if result != text else None


# ============================================================================
# PATTERN 2: Parenthetical formula extraction
# ============================================================================

PAREN_FORMULA_RE = re.compile(
    r"\b([A-Za-z\s,]+)\s*\((\$[^$]+\$)\)\s*([.,:!?]?)\s*",
    re.MULTILINE
)


def extract_parenthetical_formulas(text: str) -> Optional[str]:
    """
    Convert "Text (formula). More text" into:
    Text.
    $$formula$$
    More text
    """
    matches = list(PAREN_FORMULA_RE.finditer(text))
    if not matches:
        return None

    # Only process if extraction would reduce inline count meaningfully
    current_inline = count_inline_formulas(text)
    if current_inline < INLINE_FRAGMENTS_WARN + 1:
        return None

    result = text
    for match in reversed(matches):  # Process in reverse to maintain positions
        prefix = match.group(1).rstrip()
        formula = match.group(2)
        suffix = match.group(3) or "."

        # Check if this is actually meaningful extraction
        if len(formula) > 5:  # Reasonable formula length
            replacement = f"{prefix}{suffix}\n\n$${formula[1:-1]}$$"
            result = result[:match.start()] + replacement + result[match.end():]

    return result if result != text else None


# ============================================================================
# PATTERN 3: Multiple independent examples
# ============================================================================

EXAMPLE_PATTERN = re.compile(
    r"((?:Example|Case|Option|Instance|Caso|Ejemplo|Opción)\s+[A-Z0-9]?:?\s+[^.!?]*[.!?])",
    re.IGNORECASE | re.MULTILINE
)


def split_multiple_examples(text: str) -> Optional[str]:
    """
    Detect "Example 1: ... Example 2: ..." and split into separate paragraphs.
    """
    examples = list(EXAMPLE_PATTERN.finditer(text))
    if len(examples) < 2:
        return None

    # Build result by inserting paragraph breaks between examples
    result = text
    offset = 0

    for i in range(len(examples) - 1):
        end_of_example = examples[i].end()
        start_of_next = examples[i + 1].start()

        # Find the text between examples
        between = result[end_of_example:start_of_next]

        # If there's not already a paragraph break, add one
        if "\n\n" not in between:
            adjusted_pos = end_of_example + offset
            result = result[:adjusted_pos] + "\n\n" + result[adjusted_pos:]
            offset += 2

    return result if result != text else None


# ============================================================================
# PATTERN 4: Conditional + consequent pairs
# ============================================================================

CONDITIONAL_PATTERN = re.compile(
    r"((?:If|When|Whenever|Since|Because|Unless|Provided|Given|Cuando|Si|Puesto que|Como|Siempre que)\s+[^,.:!?]+[,]?\s+[^.!?]*[.!?])",
    re.IGNORECASE | re.MULTILINE
)


def split_conditional_blocks(text: str) -> Optional[str]:
    """
    Detect multiple "When X, Y. When Z, W." patterns and split into paragraphs.
    """
    matches = list(CONDITIONAL_PATTERN.finditer(text))
    if len(matches) < 2:
        return None

    # Only process if there are enough inline formulas to warrant it
    if count_inline_formulas(text) < INLINE_FRAGMENTS_WARN + 1:
        return None

    # Insert paragraph breaks between conditionals
    result = text
    offset = 0

    for i in range(len(matches) - 1):
        end_pos = matches[i].end()
        adjusted_pos = end_pos + offset

        # Check if next chars need a paragraph break
        if adjusted_pos < len(result) and result[adjusted_pos:adjusted_pos+2] != "\n\n":
            result = result[:adjusted_pos] + "\n\n" + result[adjusted_pos:]
            offset += 2

    return result if result != text else None


# ============================================================================
# PATTERN 5: Formula + interpretation separation
# ============================================================================

def split_formula_interpretation(text: str) -> Optional[str]:
    """
    Detect "Formula represents interpretation." and separate into:
    $$formula$$
    Interpretation.
    """
    # Match patterns like "$f(x)=x^2$ represents a parabola"
    pattern = r"(\$[^$]+\$)\s+(represents?|denotes?|means?|equals?|is\s+(?:a|the|an)|son|significa|denota|es|representa)\s+([^.!?]*[.!?])"

    if not re.search(pattern, text, re.IGNORECASE):
        return None

    # Only process if it would help
    current_count = count_inline_formulas(text)
    if current_count < INLINE_FRAGMENTS_WARN + 1:
        return None

    result = re.sub(
        pattern,
        r"$$\1$$\n\n\2 \3",
        text,
        flags=re.IGNORECASE,
        count=1
    )

    return result if result != text else None


# ============================================================================
# PATTERN 6: Sentence-level splitting with period + capital
# ============================================================================

def split_long_sentences_at_periods(text: str) -> Optional[str]:
    """
    Split sentences that contain 3+ inline formulas at natural sentence boundaries.
    Works by moving sentences after periods into new paragraphs when beneficial.
    """
    if count_inline_formulas(text) < INLINE_FRAGMENTS_WARN:
        return None

    # Split into sentences
    sentences = re.split(r'(?<=[.!?])\s+(?=[A-Z])', text)

    if len(sentences) < 2:
        return None

    # Group sentences by inline formula density
    result_parts = []
    current_group = []
    current_inline_count = 0

    for sentence in sentences:
        sent_inline = count_inline_formulas(sentence)

        # If adding this sentence would create too much density, break
        if current_inline_count + sent_inline >= INLINE_FRAGMENTS_WARN and current_group:
            result_parts.append(" ".join(current_group))
            current_group = [sentence]
            current_inline_count = sent_inline
        else:
            current_group.append(sentence)
            current_inline_count += sent_inline

    if current_group:
        result_parts.append(" ".join(current_group))

    result = "\n\n".join(result_parts)
    return result if result != text and "\n\n" in result else None


# ============================================================================
# Main fixer
# ============================================================================

def fix_explanation(text: str) -> Tuple[str, int]:
    """
    Apply pattern-based fixes to reduce rule 21 violations.
    Returns: (fixed_text, changes_applied)
    """
    changes = 0
    original = text

    # Track if we've made changes to avoid over-processing
    max_attempts = 5
    attempt = 0

    while has_violation(text) and attempt < max_attempts:
        attempt += 1
        old_text = text

        # Try each pattern in order of confidence
        strategies = [
            split_semicolon_continuation,
            extract_parenthetical_formulas,
            split_formula_interpretation,
            split_conditional_blocks,
            split_multiple_examples,
            split_long_sentences_at_periods,
        ]

        for strategy in strategies:
            result = strategy(text)
            if result:
                text = result
                changes += 1
                break

        # If no strategy worked, stop trying
        if text == old_text:
            break

    return text, changes if text != original else 0


def process_files():
    """Process all JSON files in analisis course."""
    content_dir = Path("/home/user/intervalo/backend/content/analisis")
    json_files = sorted(content_dir.glob("**/*.json"))

    total_fixed = 0
    errors = []
    fix_log = defaultdict(int)

    for file_path in json_files:
        try:
            data = json.loads(file_path.read_text(encoding="utf-8"))
            if not isinstance(data, list):
                continue

            modified = False
            for item in data:
                if not isinstance(item, dict):
                    continue

                exp = item.get("explanation")
                if not isinstance(exp, str) or not exp.strip():
                    continue

                if not has_violation(exp):
                    continue

                # Fix the explanation
                fixed, changes = fix_explanation(exp)
                if fixed != exp:
                    item["explanation"] = fixed
                    modified = True
                    total_fixed += 1
                    fix_log[file_path.name] += changes

            if modified:
                # Write back
                file_path.write_text(
                    json.dumps(data, ensure_ascii=False, indent=2) + "\n",
                    encoding="utf-8"
                )
                print(f"Fixed {file_path.relative_to(content_dir)}")

        except Exception as e:
            errors.append(f"{file_path}: {e}")

    return total_fixed, errors, fix_log


if __name__ == "__main__":
    total, errors, log = process_files()

    print(f"\n{'='*70}")
    print(f"Explanations fixed: {total}")
    print(f"Errors encountered: {len(errors)}")

    if errors:
        print("\nErrors:")
        for e in errors[:10]:
            print(f"  - {e}")
        if len(errors) > 10:
            print(f"  ... and {len(errors) - 10} more")

    if log:
        print("\nFiles modified:")
        for fname in sorted(log.keys())[:15]:
            print(f"  {fname}: {log[fname]} fixes")
        if len(log) > 15:
            print(f"  ... and {len(log) - 15} more files")
