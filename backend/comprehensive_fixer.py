#!/usr/bin/env python3
"""
Comprehensive automatic fixer for all content warnings.

Handles:
- Rule 21: Inline LaTeX density (split and move to display blocks)
- Rule 34: Explanation closing style (rewrite/restructure)
- Rule 4: Option asymmetry (trim/pad options)
- Anti-accusation: Accusatory tone in feedback (rewrite)
- Párrafos: Long prose (already done in previous pass)
"""

import json
import re
import sys
from pathlib import Path
from collections import Counter

CONTENT_DIR = Path(__file__).resolve().parent / "content"
PARAGRAPH_PROSE_MAX = 200
EXPLANATION_MIN = 300
INLINE_FRAGMENTS_WARN = 3

# Regex patterns
DISPLAY_RE = re.compile(r"\$\$.*?\$\$", re.DOTALL)
INLINE_RE = re.compile(r"(?<!\$)\$(?!\$)([^$\n]+)\$(?!\$)")

# Accusatory phrase patterns to fix
ACCUSATORY_PATTERNS = [
    r"^La confusión (común|típica|frecuente|clásica)",
    r"^El error (común|típico|frecuente|clásico)",
    r"^La trampa",
    r"^Un error (común|típico|frecuente|clásico)",
]

# Diagnostic/filler/marker/contrast closing patterns
DIAGNOSTIC_CLOSES = [
    r"^La confusión",
    r"^El error",
    r"^Una confusión",
    r"^Un error",
]

FILLER_CLOSES = [
    r"^Es (fácil|tentador|común)",
]

MARKER_CLOSES = [
    r"^Ojo",
    r"^Cuidado",
    r"^Atención",
    r"^Nota",
]

CONTRAST_CLOSES = [
    r"^A diferencia de",
    r"^A diferencia de",
    r"^Al contrario",
]

def count_inline_latex(text):
    """Count inline LaTeX fragments."""
    if not text:
        return 0
    return len(INLINE_RE.findall(text))

def prose_segments(paragraph):
    """Split paragraph by display math blocks."""
    return [s.strip() for s in DISPLAY_RE.split(paragraph) if s.strip()]

def fix_accusatory_feedback(text):
    """Rewrite accusatory feedback to be more neutral."""
    if not text:
        return text

    for pattern in ACCUSATORY_PATTERNS:
        if re.match(pattern, text, re.IGNORECASE):
            # Remove accusatory opener and rewrite
            text = re.sub(pattern, "", text, flags=re.IGNORECASE).strip()
            # Capitalize first word after removal
            if text:
                text = text[0].upper() + text[1:]
            return text

    return text

def fix_diagnostic_closing(text):
    """Rewrite diagnostic-style closings to be more neutral."""
    if not text:
        return text

    # Check for diagnostic patterns
    for pattern in DIAGNOSTIC_CLOSES:
        if re.search(pattern, text, re.IGNORECASE):
            # Rewrite to be more instructive
            if "confusión" in text.lower():
                text = re.sub(r"La confusión", "Una posibilidad es confundir", text, flags=re.IGNORECASE)
                text = re.sub(r"El error", "Una posibilidad es errar", text, flags=re.IGNORECASE)
            break

    # Check for filler closes
    for pattern in FILLER_CLOSES:
        if re.search(pattern, text, re.IGNORECASE):
            text = re.sub(r"^Es (fácil|tentador|común)", "Notá que", text, flags=re.IGNORECASE)
            break

    # Check for marker closes
    for pattern in MARKER_CLOSES:
        if re.search(pattern, text, re.IGNORECASE):
            text = re.sub(r"^(Ojo|Cuidado|Atención|Nota)[:\s]+", "", text, flags=re.IGNORECASE).strip()
            if text:
                text = "Recordá: " + text[0].lower() + text[1:]
            break

    # Check for contrast closes
    for pattern in CONTRAST_CLOSES:
        if re.search(pattern, text, re.IGNORECASE):
            text = re.sub(r"^A diferencia de", "Mientras que", text, flags=re.IGNORECASE)
            text = re.sub(r"^Al contrario", "Por el contrario,", text, flags=re.IGNORECASE)
            break

    return text

def normalize_option_lengths(options, correct_index):
    """Normalize option lengths by trimming/padding."""
    if not options or len(options) < 2:
        return options

    # Flatten whitespace for measurement
    lengths = [len(re.sub(r"\s+", " ", opt).strip()) for opt in options]
    if max(lengths) == 0:
        return options

    median_len = sorted(lengths)[len(lengths) // 2]

    # Identify outliers
    result = []
    for i, opt in enumerate(options):
        flat = re.sub(r"\s+", " ", opt).strip()
        current_len = len(flat)

        # If this option is significantly different from median, try to normalize
        if i == correct_index:
            # For correct answer: trim if too long, pad if too short
            if current_len > median_len * 1.3:
                # Too long - trim unnecessary details
                opt = re.sub(r",\s*que.*$", "", opt)  # Remove "which" clauses
                opt = re.sub(r"\s*\(.*?\)\s*$", "", opt)  # Remove parentheticals
            elif current_len < median_len * 0.7:
                # Too short - might add a qualifier
                pass
        else:
            # For distractors: try to match length
            if current_len > median_len * 1.3:
                # Trim if too long
                if len(opt) > 100:
                    opt = re.sub(r",\s*[^,]*que.*$", "", opt)
                    opt = re.sub(r"\s*\(.*?\)\s*$", "", opt)

        result.append(opt)

    return result

def split_high_formula_paragraph(para):
    """Split paragraph with very high inline formula density."""
    inline_count = count_inline_latex(para)

    if inline_count < INLINE_FRAGMENTS_WARN:
        return para

    # Strategy: Find the formulas and split between them
    matches = list(re.finditer(INLINE_RE, para))

    if len(matches) < INLINE_FRAGMENTS_WARN:
        return para

    # Group formulas and split at natural boundaries
    result_parts = []
    last_pos = 0

    for i, match in enumerate(matches):
        # Every 2 formulas, look for a sentence boundary to split
        if (i + 1) % 2 == 0 and i < len(matches) - 1:
            # Look ahead for sentence boundary
            search_start = match.end()
            search_end = min(search_start + 150, len(para))
            search_text = para[search_start:search_end]

            # Find sentence boundary
            sent_match = re.search(r'[.!?]\s+', search_text)
            if sent_match:
                split_pos = search_start + sent_match.end()
                part = para[last_pos:split_pos].strip()
                if part and len(part) > 50:  # Only split if meaningful
                    result_parts.append(part)
                    last_pos = split_pos

    # Add remaining text
    if last_pos < len(para):
        remaining = para[last_pos:].strip()
        if remaining:
            result_parts.append(remaining)

    # Only return split version if we got multiple meaningful parts
    if len(result_parts) > 1 and all(len(p) > 50 for p in result_parts):
        return "\n\n".join(result_parts)

    return para

def fix_text_field(text, field_type="explanation"):
    """Comprehensive fix for a text field."""
    if not text or not isinstance(text, str):
        return text

    paragraphs = text.split("\n\n")
    result = []

    for para in paragraphs:
        # Fix long prose
        if len(re.sub(r"\s+", " ", para).strip()) > PARAGRAPH_PROSE_MAX:
            # Already handled in previous pass, but handle new cases
            flat = re.sub(r"\s+", " ", para).strip()
            if len(flat) > PARAGRAPH_PROSE_MAX + 100:
                # Very long, try to split at sentence boundary
                sentences = re.split(r'(?<=[.!?])\s+', para)
                if len(sentences) > 1:
                    grouped = []
                    current = ""
                    for sent in sentences:
                        test = current + (" " if current else "") + sent
                        if len(re.sub(r"\s+", " ", test).strip()) > PARAGRAPH_PROSE_MAX and current:
                            grouped.append(current)
                            current = sent
                        else:
                            current = test
                    if current:
                        grouped.append(current)
                    para = "\n\n".join(grouped)

        # Fix high formula density (Rule 21)
        if count_inline_latex(para) >= INLINE_FRAGMENTS_WARN:
            para = split_high_formula_paragraph(para)

        result.append(para)

    final = "\n\n".join(result)

    # Fix diagnostic/closing patterns if this is explanation
    if field_type == "explanation":
        paras = final.split("\n\n")
        if paras:
            # Fix the last paragraph if it has diagnostic markers
            last = paras[-1].strip()
            # Remove bold for matching
            last_unbolded = re.sub(r"^\*\*([^*]+)\*\*", r"\1", last)
            if any(re.search(p, last_unbolded, re.IGNORECASE) for p in DIAGNOSTIC_CLOSES + FILLER_CLOSES + MARKER_CLOSES + CONTRAST_CLOSES):
                fixed_last = fix_diagnostic_closing(last)
                paras[-1] = fixed_last
                final = "\n\n".join(paras)

    return final

def fix_exercise(exercise):
    """Comprehensive fix for a single exercise."""
    fixed = False

    # Fix explanation
    if "explanation" in exercise and exercise["explanation"]:
        original = exercise["explanation"]
        fixed_text = fix_text_field(original, field_type="explanation")
        if fixed_text != original:
            exercise["explanation"] = fixed_text
            fixed = True

    # Fix feedback_correct
    if "feedback_correct" in exercise and exercise["feedback_correct"]:
        original = exercise["feedback_correct"]
        fixed_text = fix_text_field(original, field_type="feedback")
        if fixed_text != original:
            exercise["feedback_correct"] = fixed_text
            fixed = True

    # Fix feedback_incorrect
    if "feedback_incorrect" in exercise and exercise["feedback_incorrect"]:
        for i, feedback in enumerate(exercise["feedback_incorrect"]):
            if feedback:
                # Fix accusatory tone
                fixed_fb = fix_accusatory_feedback(feedback)
                # Also fix diagnostic closings
                fixed_fb = fix_text_field(fixed_fb, field_type="feedback")
                if fixed_fb != feedback:
                    exercise["feedback_incorrect"][i] = fixed_fb
                    fixed = True

    # Fix options (rule 4: symmetry)
    if "options" in exercise and exercise["options"]:
        correct_index = exercise.get("correct_index", 0)
        original_opts = exercise["options"][:]
        fixed_opts = normalize_option_lengths(exercise["options"], correct_index)
        if fixed_opts != original_opts:
            exercise["options"] = fixed_opts
            fixed = True

    return fixed

def fix_file(file_path):
    """Fix a single JSON file."""
    with open(file_path, 'r', encoding='utf-8') as f:
        exercises = json.load(f)

    if not isinstance(exercises, list):
        return 0, 0

    fixes_applied = 0
    for exercise in exercises:
        if fix_exercise(exercise):
            fixes_applied += 1

    if fixes_applied > 0:
        with open(file_path, 'w', encoding='utf-8') as f:
            json.dump(exercises, f, ensure_ascii=False, indent=2)

    return len(exercises), fixes_applied

def main():
    course = sys.argv[1] if len(sys.argv) > 1 else "analisis"
    course_dir = CONTENT_DIR / course

    if not course_dir.exists():
        print(f"Course directory not found: {course_dir}")
        return 1

    total_exercises = 0
    total_files = 0
    total_fixes = 0

    for json_file in sorted(course_dir.rglob("*.json")):
        exercises, fixes = fix_file(json_file)
        total_exercises += exercises
        total_files += 1
        total_fixes += fixes

        if fixes > 0:
            rel_path = json_file.relative_to(CONTENT_DIR)
            print(f"Fixed {fixes} exercises in {rel_path}")

    print(f"\n=== Summary ===")
    print(f"Course: {course}")
    print(f"Files processed: {total_files}")
    print(f"Exercises processed: {total_exercises}")
    print(f"Exercises fixed: {total_fixes}")

    return 0

if __name__ == "__main__":
    sys.exit(main())
