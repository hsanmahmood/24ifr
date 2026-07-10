#!/usr/bin/env python3
"""
Strip comments from repository files.
- For Python files: removes COMMENT tokens using the tokenize module (keeps docstrings).
- For JS/JSX/TS/TSX/CSS/HTML: removes // line comments and /* */ block comments (best-effort).

WARNING: This is destructive. Files will be overwritten in-place.
"""
import io
import os
import re
import sys
from pathlib import Path
import tokenize

ROOT = Path(__file__).resolve().parents[1]

JS_EXT = {'.js', '.jsx', '.ts', '.tsx', '.css', '.html'}
PY_EXT = {'.py'}
IGNORE_DIRS = {'.git', 'node_modules', 'dist', '__pycache__', '.venv'}

block_comment_re = re.compile(r"/\*.*?\*/", re.DOTALL)
line_comment_re = re.compile(r"//.*?$", re.MULTILINE)

def strip_python_comments(path: Path):
    try:
        with path.open('rb') as f:
            src = f.read()
        tokens = tokenize.tokenize(io.BytesIO(src).readline)
        out = []
        prev_end = (1, 0)
        last_line = ''
        for toknum, tokval, start, end, line in tokens:
            if toknum == tokenize.COMMENT:
                continue
            out.append((toknum, tokval, start, end))
        # Reconstruct source
        new_src = tokenize.untokenize(out)
        with path.open('w', encoding='utf-8') as f:
            f.write(new_src)
        return True
    except Exception as e:
        print(f"Failed to strip comments from {path}: {e}")
        return False


def strip_js_comments(path: Path):
    try:
        text = path.read_text(encoding='utf-8')
        # remove block comments first
        text2 = block_comment_re.sub('', text)
        # remove line comments (but avoid removing within URLs like https://)
        def repl_line(m):
            s = m.group(0)
            if s.strip().startswith('//'):
                # if it contains '://' leave it
                if '://' in s:
                    return s
                return ''
            return s
        text3 = line_comment_re.sub(repl_line, text2)
        path.write_text(text3, encoding='utf-8')
        return True
    except Exception as e:
        print(f"Failed to strip js comments from {path}: {e}")
        return False


def should_ignore(path: Path):
    for part in path.parts:
        if part in IGNORE_DIRS:
            return True
    return False


def main():
    changed = []
    for p in ROOT.rglob('*'):
        if p.is_file():
            if should_ignore(p):
                continue
            ext = p.suffix.lower()
            try:
                if ext in PY_EXT:
                    ok = strip_python_comments(p)
                    if ok: changed.append(str(p))
                elif ext in JS_EXT:
                    ok = strip_js_comments(p)
                    if ok: changed.append(str(p))
            except Exception as e:
                print(f"Error processing {p}: {e}")
    print(f"Stripped comments from {len(changed)} files")

if __name__ == '__main__':
    main()
