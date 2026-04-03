import re
from typing import List


def chunk_text(text: str, chunk_size: int = 500, chunk_overlap: int = 50) -> List[str]:
    """
    Split text into overlapping chunks by word count.
    Mirrors the behaviour of RecursiveCharacterTextSplitter without requiring langchain.
    """
    if not text or not text.strip():
        return []

    separators = ["\n\n", "\n", " ", ""]
    chunks: List[str] = []

    def _split(t: str, seps: List[str]) -> List[str]:
        if not seps:
            return [t]
        sep = seps[0]
        if sep == "":
            parts = list(t)
        else:
            parts = re.split(re.escape(sep), t)
        good, pending = [], ""
        for part in parts:
            candidate = (pending + sep + part).lstrip(sep) if pending else part
            if len(candidate.split()) <= chunk_size:
                pending = candidate
            else:
                if pending:
                    good.append(pending)
                if len(part.split()) > chunk_size:
                    good.extend(_split(part, seps[1:]))
                    pending = ""
                else:
                    pending = part
        if pending:
            good.append(pending)
        return good

    raw_chunks = _split(text, separators)

    overlap_buf: List[str] = []
    overlap_count = 0
    for chunk in raw_chunks:
        if overlap_buf:
            chunk = " ".join(overlap_buf) + " " + chunk
        chunks.append(chunk.strip())
        words = chunk.split()
        overlap_buf, overlap_count = [], 0
        for w in reversed(words):
            overlap_count += 1
            overlap_buf.insert(0, w)
            if overlap_count >= chunk_overlap:
                break

    return [c for c in chunks if c.strip()]
