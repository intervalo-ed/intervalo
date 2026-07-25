#!/usr/bin/env python3
"""
Auto-fix script for content warnings.

Conservative approach: only fix the most straightforward issues.
- Párrafos: Split prose segments over 200 chars at sentence boundaries
"""

import json
import re
import sys
from pathlib import Path

CONTENT_DIR = Path(__file__).resolve().parent / "content"
PARAGRAPH_PROSE_MAX = 200
DISPLAY_RE = re.compile(r"\$\$.*?\$\$", re.DOTALL)
INLINE_RE = re.compile(r"(?<!\$)\$(?!\$)([^$\n]+)\$(?!\$)")

def prose_segments(paragraph):
    """Split paragraph by display math blocks."""
    return [s.strip() for s in DISPLAY_RE.split(paragraph) if s.strip()]

def split_long_prose(segment):
    """Split a prose segment that's over 200 chars at sentence boundaries."""
    # Flatten whitespace for length measurement
    flat = re.sub(r"\s+", " ", segment).strip()

    if len(flat) <= PARAGRAPH_PROSE_MAX:
        return segment

    # Split on sentence boundaries
    sentences = re.split(r'(?<=[.!?])\s+', segment)

    if len(sentences) <= 1:
        # Can't split, return as-is
        return segment

    result = []
    current = ""

    for sentence in sentences:
        test = current + (" " if current else "") + sentence
        test_flat = re.sub(r"\s+", " ", test).strip()

        # If adding this sentence exceeds limit and we have something, start new para
        if current and len(test_flat) > PARAGRAPH_PROSE_MAX:
            result.append(current)
            current = sentence
        else:
            current = test

    if current:
        result.append(current)

    # Only split if we got multiple result paragraphs
    if len(result) > 1:
        return "\n\n".join(result)

    return segment

def fix_text_field(text):
    """Fix a text field by splitting long prose segments."""
    if not text or not isinstance(text, str):
        return text

    paragraphs = text.split("\n\n")
    result = []

    for para in paragraphs:
        # Get prose segments (parts between display math)
        segments = prose_segments(para)

        if not segments or len(segments) == 0:
            # No prose content, keep as-is
            result.append(para)
            continue

        # Check if any segment is too long
        has_long_segments = any(
            len(re.sub(r"\s+", " ", seg).strip()) > PARAGRAPH_PROSE_MAX
            for seg in segments
        )

        if not has_long_segments:
            # No long segments, keep paragraph as-is
            result.append(para)
            continue

        # Rebuild paragraph, fixing long segments
        parts = DISPLAY_RE.split(para)
        output = []

        for part in parts:
            if DISPLAY_RE.match(part):
                # Display math block, keep as-is
                output.append(part)
            elif part.strip():
                # Prose, maybe split
                fixed = split_long_prose(part.strip())
                output.append(fixed)

        # Join parts with proper formatting
        fixed_para = ""
        for part in output:
            if part.startswith("$$"):
                # Display math
                if fixed_para and not fixed_para.endswith("\n"):
                    fixed_para += "\n"
                fixed_para += part
                if not part.endswith("\n"):
                    fixed_para += "\n"
            else:
                # Prose
                if fixed_para and not fixed_para.endswith("\n"):
                    fixed_para += "\n\n"
                fixed_para += part

        result.append(fixed_para.strip())

    return "\n\n".join(result)

def fix_exercise(exercise):
    """Apply fixes to a single exercise."""
    fixed = False

    # Fix explanation
    if "explanation" in exercise and exercise["explanation"]:
        original = exercise["explanation"]
        fixed_text = fix_text_field(original)
        if fixed_text != original:
            exercise["explanation"] = fixed_text
            fixed = True

    # Fix feedback_correct
    if "feedback_correct" in exercise and exercise["feedback_correct"]:
        original = exercise["feedback_correct"]
        fixed_text = fix_text_field(original)
        if fixed_text != original:
            exercise["feedback_correct"] = fixed_text
            fixed = True

    # Fix feedback_incorrect
    if "feedback_incorrect" in exercise and exercise["feedback_incorrect"]:
        for i, feedback in enumerate(exercise["feedback_incorrect"]):
            if feedback:
                fixed_text = fix_text_field(feedback)
                if fixed_text != feedback:
                    exercise["feedback_incorrect"][i] = fixed_text
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
