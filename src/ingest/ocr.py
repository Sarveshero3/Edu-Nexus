import logging

import pytesseract
from PIL import Image

logger = logging.getLogger("OCR")

# path to tesseract executable (Windows)
pytesseract.pytesseract.tesseract_cmd = r"C:\Program Files\Tesseract-OCR\tesseract.exe"


class OCR:
    def image_to_text(self, image_path: str) -> str:
        """
        Extract text from image using Tesseract.
        Will never crash — returns empty string if fails.
        """
        try:
            img = Image.open(image_path)
            text = pytesseract.image_to_string(img)
            return text.strip()
        except Exception as e:
            logger.warning(f"OCR error for {image_path}: {e}")
            return ""
