#!/usr/bin/env python3
"""
Fix rule 21 (inline LaTeX density) by converting select inline formulas to display blocks.

Strategy:
- Identify prose segments with 3+ inline formulas
- Convert the longest/most complex formulas to display blocks
- Rewrite surrounding text to accommodate display blocks
"""

import json
import re
import sys
from pathlib import Path

CONTENT_DIR = Path(__file__).resolve().parent / "content"

def find_inline_formulas(text):
    """Find all inline formulas in text, return positions and content."""
    pattern = r"(?<!\$)\$(?!\$)([^$\n]+)\$(?!\$)"
    matches = []
    for m in re.finditer(pattern, text):
        matches.append({
            'start': m.start(),
            'end': m.end(),
            'content': m.group(1),
            'length': len(m.group(1))
        })
    return matches

def should_move_to_display(formula):
    """Determine if a formula is complex enough to move to display."""
    # Complex = contains fractions, multiple operators, or is long
    if '\\frac' in formula or '\\dfrac' in formula:
        return True
    if len(formula) > 30:
        return True
    if formula.count('_') + formula.count('^') > 2:
        return True
    if formula.count(' ') > 2:
        return True
    return False

def convert_inline_to_display(paragraph):
    """Convert complex inline formulas to display blocks where there are 3+ inline."""
    formulas = find_inline_formulas(paragraph)

    if len(formulas) < 3:
        return paragraph

    # Identify which formulas to move
    candidates = [f for f in formulas if should_move_to_display(f['content'])]

    if len(candidates) == 0:
        # No good candidates, try moving the longest ones
        candidates = sorted(formulas, key=lambda x: x['length'], reverse=True)[:len(formulas)//2]

    if len(candidates) == 0:
        return paragraph

    # Convert candidates from end to start (to preserve positions)
    result = paragraph
    for formula in sorted(candidates, key=lambda x: x['start'], reverse=True):
        # Get context around the formula
        start = max(0, formula['start'] - 100)
        end = min(len(result), formula['end'] + 100)
        context = result[start:end]

        # Only convert if it's not already in certain contexts
        before_formula = result[max(0, formula['start'] - 30):formula['start']]

        # Don't move if it's in a title/heading or already followed by sentence end
        if re.search(r'\*\*[^*]*$', before_formula):
            continue

        # Don't move if converting would create bad formatting
        if re.search(r'[,;]\s*$', before_formula):
            # Formula is in middle of sentence, risky to move
            continue

        # Extract the full content to replace
        # Find the exact position in result
        actual_start = result.find('$' + formula['content'] + '$', max(0, formula['start'] - 10))
        if actual_start < 0:
            continue

        actual_end = actual_start + len('$' + formula['content'] + '$')

        # Check if we should add newlines before/after
        before = result[:actual_start]
        after = result[actual_end:]

        # Ensure proper newlines
        if not before.endswith('\n'):
            before += '\n'
        if not after.startswith('\n'):
            after = '\n' + after

        # Create display version
        display_formula = f"$${ formula['content']}$$"

        result = before + display_formula + after

    return result

def fix_prose_segments(text):
    """Fix all prose segments in text."""
    if not text:
        return text

    # Split by display math blocks
    display_pattern = r"\$\$[^$]*\$\$"
    parts = re.split(f'({display_pattern})', text, flags=re.DOTALL)

    result = []
    for i, part in enumerate(parts):
        # Even indices are prose, odd indices are display math
        if i % 2 == 0:
            # Prose part - try to fix it
            if part.strip():
                part = convert_inline_to_display(part)
        result.append(part)

    return ''.join(result)

def fix_exercise(exercise):
    """Apply fixes to an exercise."""
    fixed = False

    # Fix explanation (most impactful)
    if "explanation" in exercise and exercise["explanation"]:
        original = exercise["explanation"]
        # Only process if it actually has multiple inline formulas
        if len(re.findall(r"(?<!\$)\$(?!\$)[^$\n]+?\$(?!\$)", original)) >= 3:
            fixed_text = fix_prose_segments(original)
            if fixed_text != original and len(fixed_text) >= 300:  # Preserve minimum length
                exercise["explanation"] = fixed_text
                fixed = True

    # Fix feedback_correct if needed
    if "feedback_correct" in exercise and exercise["feedback_correct"]:
        original = exercise["feedback_correct"]
        if len(re.findall(r"(?<!\$)\$(?!\$)[^$\n]+?\$(?!\$)", original)) >= 3:
            fixed_text = fix_prose_segments(original)
            if fixed_text != original:
                exercise["feedback_correct"] = fixed_text
                fixed = True

    # Fix feedback_incorrect if needed
    if "feedback_incorrect" in exercise and exercise["feedback_incorrect"]:
        for i, feedback in enumerate(exercise["feedback_incorrect"]):
            if feedback and len(re.findall(r"(?<!\$)\$(?!\$)[^$\n]+?\$(?!\$)", feedback)) >= 3:
                original = feedback
                fixed_text = fix_prose_segments(feedback)
                if fixed_text != original:
                    exercise["feedback_incorrect"][i] = fixed_text
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
