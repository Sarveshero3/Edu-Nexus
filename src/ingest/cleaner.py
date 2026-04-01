from __future__ import annotations

import re
import json
from pathlib import Path
from typing import List, Tuple
from collections import Counter

import pdfplumber


# -------------------- PDF extraction --------------------

def extract_text_from_pdf(path: Path, use_ocr: bool = False) -> List[str]:
    pages = []
    with pdfplumber.open(path) as pdf:
        for page in pdf.pages:
            pages.append(page.extract_text() or "")
    return pages


# -------------------- Header / footer helpers --------------------

def detect_repeated_lines(pages: List[str], min_count: int = 3) -> set:
    counter = Counter()
    for page in pages:
        for line in page.splitlines():
            line = re.sub(r"\s+", " ", line).strip()
            if 2 < len(line) < 200:
                counter[line] += 1
    return {line for line, count in counter.items() if count >= min_count}


def is_page_number_line(line: str) -> bool:
    return line.isdigit() or line.lower().startswith("page ")


def is_short_allcaps_header(line: str) -> bool:
    letters = re.sub(r"[^A-Za-z]", "", line)
    return letters and sum(c.isupper() for c in letters) / len(letters) > 0.7


def remove_headers_and_footers_from_page(page: str, repeated_lines: set) -> str:
    out = []
    for line in page.splitlines():
        norm = re.sub(r"\s+", " ", line).strip()
        if not norm:
            continue
        if norm in repeated_lines:
            continue
        if is_page_number_line(norm):
            continue
        if is_short_allcaps_header(norm):
            continue
        out.append(line)
    return "\n".join(out)


# -------------------- Text normalization --------------------

def fix_hyphenation(text: str) -> str:
    return re.sub(r"(\w)-\n(\w)", r"\1\2", text)


def merge_broken_lines(text: str) -> str:
    lines = text.splitlines()
    merged = []
    buf = ""

    for line in lines:
        line = line.strip()
        if not line:
            if buf:
                merged.append(buf)
                buf = ""
            continue

        if not buf:
            buf = line
        elif buf.endswith((".", "?", "!", ":", ";")):
            merged.append(buf)
            buf = line
        else:
            buf += " " + line

    if buf:
        merged.append(buf)

    return "\n\n".join(merged)


# -------------------- Main cleaner --------------------

def clean_pages(pages: List[str], source_type: str = "pdf") -> str:
    repeated = detect_repeated_lines(pages) if len(pages) >= 5 else set()

    cleaned = [
        remove_headers_and_footers_from_page(p, repeated)
        for p in pages
    ]

    text = "\n".join(cleaned)
    text = fix_hyphenation(text)
    text = merge_broken_lines(text)

    text = re.sub(r"\n{3,}", "\n\n", text)
    text = re.sub(r"[ \t]{2,}", " ", text)

    return text.strip()


# -------------------- FAST sentence splitter (NO NLTK) --------------------

def split_sentences_fast(text: str) -> List[str]:
    return re.split(r"(?<=[.!?])\s+", text)


def chunk_text_by_sentences(
    text: str,
    max_tokens: int = 500,
    overlap: int = 100
) -> List[Tuple[int, int, str]]:
    sentences = split_sentences_fast(text)

    chunks = []
    current = []
    token_count = 0
    start = 0

    for i, sent in enumerate(sentences):
        words = sent.split()
        if token_count + len(words) > max_tokens:
            chunks.append((start, i, " ".join(current)))

            if overlap > 0:
                overlap_words = []
                count = 0
                for s in reversed(current):
                    count += len(s.split())
                    overlap_words.insert(0, s)
                    if count >= overlap:
                        break
                current = overlap_words
                token_count = sum(len(s.split()) for s in current)
                start = i - len(current)
            else:
                current = []
                token_count = 0
                start = i

        current.append(sent)
        token_count += len(words)

    if current:
        chunks.append((start, len(sentences), " ".join(current)))

    return chunks


# -------------------- Output helpers --------------------

def write_cleaned_text(out_dir: Path, basename: str, text: str) -> Path:
    out_dir.mkdir(parents=True, exist_ok=True)
    path = out_dir / f"{basename}.cleaned.txt"
    path.write_text(text, encoding="utf-8")
    return path


def write_chunks_jsonl(
    out_dir: Path,
    basename: str,
    source_path: Path,
    chunks: List[Tuple[int, int, str]]
) -> Path:
    out_dir.mkdir(parents=True, exist_ok=True)
    path = out_dir / f"{basename}.chunks.jsonl"

    with open(path, "w", encoding="utf-8") as f:
        for i, (s, e, txt) in enumerate(chunks):
            f.write(json.dumps({
                "id": f"{basename}_chunk_{i}",
                "source": str(source_path),
                "start_sentence": s,
                "end_sentence": e,
                "text": txt
            }, ensure_ascii=False) + "\n")

    return path
