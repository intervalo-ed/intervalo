#!/usr/bin/env python3
"""
Smart pattern-based fixer targeting remaining rule 21 violations.

Focuses on:
1. Condensing formula enumerations with better wording
2. Reformatting conditional examples
3. Strategic use of display blocks for central formulas
4. Intelligent paragraph restructuring
"""

import json
import re
from pathlib import Path
from collections import defaultdict
from typing import Optional, Tuple, List

INLINE_FRAGMENTS_WARN = 3
PARAGRAPH_PROSE_MAX = 200
DISPLAY_RE = re.compile(r"\$\$.*?\$\$", re.DOTALL)
INLINE_RE = re.compile(r"(?<!\$)\$(?!\$)([^$\n]+)\$(?!\$)")


def count_inline_formulas(text: str) -> int:
    """Count inline LaTeX fragments."""
    stripped = DISPLAY_RE.sub(" ", text)
    return len(INLINE_RE.findall(stripped))


def prose_segments(p: str) -> list[str]:
    """Split paragraph by display formulas."""
    return [s for s in DISPLAY_RE.split(p) if s.strip()]


def render_len(s: str) -> int:
    """Estimate render length (matching validator)."""
    t = s
    t = t.replace("$$", "").replace("$", "")
    t = re.sub(r"\\text\{([^{}]*)\}", r"\1", t)
    t = re.sub(r"\\[a-zA-Z]+", "", t)
    t = re.sub(r"[{}^_&]|\\\\|\\[,;!:]", "", t)
    t = re.sub(r"\s+", " ", t).strip()
    return len(t)


def violates_rule_2(text: str) -> bool:
    """Check rule 2: no \n\n adjacent to $$."""
    return "\n\n$$" in text or "$$\n\n" in text


def has_violation(para: str) -> bool:
    """Check if paragraph has violations."""
    for segment in prose_segments(para):
        segment_clean = re.sub(r"\s+", " ", segment).strip()
        if len(segment_clean) > PARAGRAPH_PROSE_MAX:
            return True
        if count_inline_formulas(segment) >= INLINE_FRAGMENTS_WARN:
            return True
    return False


def validate_fix(original: str, fixed: str) -> bool:
    """Strict validation of fixes."""
    if violates_rule_2(fixed):
        return False

    # Preserve all math
    orig_inline = sorted(INLINE_RE.findall(original))
    fixed_inline = sorted(INLINE_RE.findall(fixed))
    orig_display = sorted(DISPLAY_RE.findall(original))
    fixed_display = sorted(DISPLAY_RE.findall(fixed))

    if orig_inline != fixed_inline or orig_display != fixed_display:
        return False

    return True


# ============================================================================
# PATTERN 1: Condense enumerated options
# ============================================================================

def condense_option_enumeration(text: str) -> Optional[str]:
    """
    Convert "text ($option1$, $option2$, $option3$)" to cleaner form.

    Examples:
    - "Options are ($a$, $b$, $c$)" → "Candidates are $a$, $b$, $c$"
    - "The values ($x$, $y$, $z$) mean..." → "These values: $x$, $y$, $z$ mean..."
    """
    if count_inline_formulas(text) < INLINE_FRAGMENTS_WARN:
        return None

    # Pattern: word (formula, formula, formula) more text
    pattern = r'(\w+)\s+\((\$[^)]+\$(?:\s*,\s*\$[^)]+\$)+)\)'

    match = re.search(pattern, text)
    if not match:
        return None

    # Count formulas in the enumeration
    enum_text = match.group(2)
    enum_count = len(INLINE_RE.findall(enum_text))

    # Only condense if it has 3+ formulas (the problem)
    if enum_count < INLINE_FRAGMENTS_WARN:
        return None

    word = match.group(1)
    enum = match.group(2)

    # Rewrite: move enumeration to be less dense
    # "Options are (a, b, c)" → "The following options: a, b, c"
    replacements = [
        (r'Options are \(', 'We have: '),
        (r'Cases are \(', 'Consider: '),
        (r'Opciones son \(', 'Tenemos: '),
        (r'Casos son \(', 'Consideremos: '),
    ]

    result = text
    for old, new in replacements:
        result = re.sub(old, new, result)

    # Remove the trailing )
    result = re.sub(r'\)', '', result)

    if result == text or not validate_fix(text, result):
        return None

    return result


# ============================================================================
# PATTERN 2: Use display block for central formula
# ============================================================================

def extract_central_formula(text: str) -> Optional[str]:
    """
    If text has a "central" formula mentioned multiple times or as key equation,
    move it to a display block.

    Pattern: "In formula $f(x)=x^2$, when $x=3$, we get $f(3)=9$"
    Fix:     "In the equation:\n$$f(x)=x^2$$\nWhen $x=3$, we get $f(3)=9$"
    """
    if count_inline_formulas(text) < INLINE_FRAGMENTS_WARN:
        return None

    # Look for a "central" formula that appears or is emphasized
    # Pattern: "formula $LONG_FORMULA$ ..." with more formulas after
    pattern = r'((?:formula|equation|expression|function|igualdad|ecuación|expresión|función)\s+)(\$[^$]{10,}\$)'

    match = re.search(pattern, text, re.IGNORECASE)
    if not match:
        return None

    # Count remaining formulas after this position
    after_match = text[match.end():]
    remaining_inline = count_inline_formulas(after_match)

    # Only proceed if moving the formula would reduce density
    if remaining_inline < INLINE_FRAGMENTS_WARN - 1:
        return None

    prefix = match.group(1).rstrip()
    formula = match.group(2)

    # Extract the formula content and create display version
    formula_content = formula[1:-1]  # Remove $ delimiters

    # Build replacement
    replacement = f"{prefix}:\n$${formula_content}$$"
    result = text[:match.start()] + replacement + text[match.end():]

    # Validate
    if result == text or not validate_fix(text, result):
        return None

    return result


# ============================================================================
# PATTERN 3: Split at "and" conjunctions with formulas
# ============================================================================

def split_at_and_with_formulas(text: str) -> Optional[str]:
    """
    Find "formula and formula and formula" patterns and separate.

    Example: "$f(x)=x^2$ and $g(x)=x^3$ and $h(x)=x^4$ are polynomials"
    Can be rewritten with better structure.
    """
    if count_inline_formulas(text) < INLINE_FRAGMENTS_WARN:
        return None

    # Pattern: multiple formulas joined by "and"
    # $formula$ and $formula$ and $formula$
    pattern = r'\$[^$]+\$\s+and\s+\$[^$]+\$(?:\s+and\s+\$[^$]+\$)+'

    if not re.search(pattern, text, re.IGNORECASE):
        return None

    # Try to improve readability by using a list format
    # Find the "and" conjunctions with formulas
    result = text

    # Replace "formula and formula and formula" with better punctuation
    # $a$ and $b$ and $c$ → $a$, $b$, and $c$ (Oxford comma + separate sentence)
    result = re.sub(
        r'(\$[^$]+\$)\s+and\s+(\$[^$]+\$)\s+and\s+(\$[^$]+\$)',
        r'\1, \2, and \3',
        result,
        flags=re.IGNORECASE
    )

    # Now try to further break at commas if they exist and reduce density
    # "Items: $a$, $b$, $c$" → "Items: $a$,\n$b$,\n$c$" (line breaks, not paragraphs)
    if ", $" in result and not "\n\n" in result:
        # Only use if we're within a single paragraph
        result = re.sub(r', (\$)', r',\n\1', result)

    if result == text or not validate_fix(text, result):
        return None

    return result


# ============================================================================
# PATTERN 4: Handle comparative structures
# ============================================================================

def extract_comparative_structure(text: str) -> Optional[str]:
    """
    Handle patterns like "When $x=1$, $f(x)=2$. When $x=3$, $f(x)=6$."
    Can be better structured.
    """
    if count_inline_formulas(text) < INLINE_FRAGMENTS_WARN:
        return None

    # Pattern: "When $...$ , $...$. When $...$ , $...$"
    pattern = r'(When|Si|Cuando)\s+([^.!?]*\$[^.!?]*)\.\s+(When|Si|Cuando)\s+'

    if not re.search(pattern, text, re.IGNORECASE):
        return None

    # Count how many such patterns
    matches = list(re.finditer(pattern, text, re.IGNORECASE))
    if len(matches) < 2:
        return None

    # Insert line breaks to separate conditions
    result = text
    for match in reversed(matches[1:]):  # All but first
        pos = match.start()
        # Insert newline before the second/third/etc conditional
        if result[pos-2:pos] != "\n\n":  # Don't create double newlines
            result = result[:pos] + "\n" + result[pos:]

    if result == text or not validate_fix(text, result):
        return None

    return result


# ============================================================================
# PATTERN 5: Smart paragraph restructuring
# ============================================================================

def restructure_dense_paragraph(text: str) -> Optional[str]:
    """
    For very dense paragraphs, find natural breaks and restructure.
    """
    if not has_violation(text):
        return None

    # Check what the violation is
    for segment in prose_segments(text):
        segment_clean = re.sub(r"\s+", " ", segment).strip()
        inline_count = count_inline_formulas(segment)

        # If it's a prose length violation, try shortening
        if len(segment_clean) > PARAGRAPH_PROSE_MAX and inline_count >= INLINE_FRAGMENTS_WARN:
            # Find the longest sentence and consider moving it
            sentences = re.split(r'(?<=[.!?])\s+', segment)

            if len(sentences) > 2:
                # Rebuild by restructuring sentence order
                # Move explanatory sentences to separate paragraph
                longest_idx = max(range(len(sentences)), key=lambda i: len(sentences[i]))

                if longest_idx > 0:
                    # Move a later sentence elsewhere
                    new_segment = '\n'.join(
                        sentences[:longest_idx] +
                        ['\n\n'] +
                        sentences[longest_idx:]
                    )

                    result = text.replace(segment, new_segment)

                    if result != text and validate_fix(text, result):
                        return result

    return None


# ============================================================================
# Main fixer with all strategies
# ============================================================================

def fix_explanation(text: str, attempt: int = 0) -> Tuple[str, int]:
    """Apply all strategies until violation resolved."""
    if not has_violation(text) or attempt >= 3:
        return text, attempt

    original = text

    strategies = [
        extract_central_formula,
        split_at_and_with_formulas,
        condense_option_enumeration,
        extract_comparative_structure,
        restructure_dense_paragraph,
    ]

    for strategy in strategies:
        result = strategy(text)
        if result:
            text = result
            return fix_explanation(text, attempt + 1)

    return text, attempt


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

                if not has_violation(exp):
                    continue

                fixed, attempts = fix_explanation(exp)
                if fixed != exp:
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
        print("\nErrors (first 5):")
        for e in errors[:5]:
            print(f"  - {e}")

    if files:
        print("\nFiles modified (by type):")
        by_type = defaultdict(int)
        for fname, count in files.items():
            file_type = fname.split('.')[0]
            by_type[file_type] += count
        for ftype in sorted(by_type.keys()):
            print(f"  {ftype}: {by_type[ftype]}")
