"""
Docling-based document extractor — Edu Nexus
=============================================
Higher quality extraction than default extractors, especially for:
- Scanned PDFs (OCR)
- Tables and multi-column layouts
- Academic papers with complex formatting

Downloads ~1.5GB of models on first use.
Activated when: DOCLING_ENABLED=true in .env

This is OPT-IN. The existing extractor.py / ocr.py / cleaner.py are
the default fallback and are NOT replaced by this module.
"""

import logging
from pathlib import Path

logger = logging.getLogger("DoclingExtractor")

try:
    from docling.document_converter import DocumentConverter
    DOCLING_AVAILABLE = True
except ImportError:
    DOCLING_AVAILABLE = False


def extract_with_docling(file_path: Path) -> str:
    """
    Extract text from a document using Docling.
    Returns markdown-formatted text.

    Raises ImportError if docling is not installed.
    Raises RuntimeError on conversion failure.
    """
    if not DOCLING_AVAILABLE:
        raise ImportError(
            "Docling not installed. Run: pip install docling"
        )

    logger.info(f"Extracting with Docling: {file_path.name}")
    try:
        converter = DocumentConverter()
        result = converter.convert(str(file_path))
        text = result.document.export_to_markdown()
        logger.info(f"Docling extraction complete: {len(text)} chars from {file_path.name}")
        return text
    except Exception as e:
        logger.error(f"Docling extraction failed for {file_path.name}: {e}")
        raise RuntimeError(f"Docling extraction failed: {e}") from e
