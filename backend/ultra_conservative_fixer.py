#!/usr/bin/env python3
"""
Ultra-conservative fixer targeting only very safe, specific patterns.

Only fixes patterns with extremely low risk of introducing errors:
- Very specific accusatory starters in feedback
- Complete closing marker removal (not rewriting)
- Option trimming only for extremely asymmetric cases
"""

import json
import re
import sys
from pathlib import Path

CONTENT_DIR = Path(__file__).resolve().parent / "content"

def fix_very_accusatory_feedback(text):
    """Only fix very obvious accusatory patterns."""
    if not text or len(text) < 10:
        return text

    # Only fix if starts EXACTLY with these patterns (not "starts with pattern anywhere")
    very_obvious = [
        (r"^Falta ", "Hay que "),
        (r"^Error ", "Es posible "),
    ]

    for pattern, replacement in very_obvious:
        if re.match(pattern, text):
            text = re.sub(pattern, replacement, text)
            return text

    return text

def remove_obvious_markers(text):
    """Remove standalone closing markers that are obviously wrong."""
    if not text or len(text) < 5:
        return text

    # Only if the ENTIRE text is just a marker
    if text.strip() == "Ojo:" or text.strip() == "Ojo" or text.strip() == "Atención:":
        return ""

    return text

def fix_extreme_option_length(options, correct_index):
    """Only trim options that are EXTREMELY long compared to others."""
    if not options or len(options) < 2:
        return options

    def measure(text):
        if not text:
            return 0
        return len(re.sub(r"\s+", " ", text).strip())

    lengths = [measure(opt) for opt in options]
    if not lengths or max(lengths) == 0:
        return options

    # Only fix if one option is 3x longer than median
    median = sorted(lengths)[len(lengths) // 2]
    max_len = max(lengths)

    if max_len > median * 3:
        # Try to trim the longest option
        longest_idx = lengths.index(max_len)
        if longest_idx != correct_index:
            # It's a distractor that's way too long
            opt = options[longest_idx]
            # Very conservative trim: just remove common padding
            opt = re.sub(r"\s*,\s*que\s+[^,]*$", "", opt)  # Remove "que" clause at end
            if len(opt) < max_len * 0.8:  # Only if we actually trimmed something meaningful
                options[longest_idx] = opt

    return options

def fix_exercise(exercise):
    """Apply only ultra-conservative fixes."""
    fixed = False

    # Fix very obvious accusatory patterns in feedback
    if "feedback_incorrect" in exercise and exercise["feedback_incorrect"]:
        for i, feedback in enumerate(exercise["feedback_incorrect"]):
            if feedback and isinstance(feedback, str):
                original = feedback
                feedback = fix_very_accusatory_feedback(feedback)
                if feedback != original:
                    exercise["feedback_incorrect"][i] = feedback
                    fixed = True

    # Remove standalone markers
    if "explanation" in exercise and exercise["explanation"]:
        original = exercise["explanation"]
        if original.strip().endswith("Ojo:") or original.strip().endswith("Atención:"):
            exercise["explanation"] = original.rstrip() + " (revisar)"
            fixed = True

    # Only trim extremely long options
    if "options" in exercise and exercise["options"]:
        ci = exercise.get("correct_index", 0)
        original_opts = exercise["options"][:]
        fixed_opts = fix_extreme_option_length(exercise["options"], ci)
        if fixed_opts != original_opts:
            exercise["options"] = fixed_opts
            fixed = True

    return fixed

def fix_file(file_path):
    """Fix a single JSON file."""
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            exercises = json.load(f)
    except:
        return 0, 0

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
