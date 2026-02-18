import pdfplumber
from typing import Optional, Dict
import re

class PDFExtractor:
    """
    Service to extract text and structured data from PDF files using pdfplumber.
    """

    def __init__(self, file_path: str = None, file_stream = None):
        """
        Initialize the extractor with a file path or file stream.
        """
        self.file_path = file_path
        self.file_stream = file_stream

    def extract_text(self) -> str:
        """
        Extract raw text from the PDF.
        """
        text = ""
        try:
            if self.file_path:
                with pdfplumber.open(self.file_path) as pdf:
                    for page in pdf.pages:
                        extracted = page.extract_text()
                        if extracted:
                            text += extracted + "\n"
            elif self.file_stream:
                with pdfplumber.open(self.file_stream) as pdf:
                    for page in pdf.pages:
                        extracted = page.extract_text()
                        if extracted:
                            text += extracted + "\n"
            return text.strip()
        except Exception as e:
            print(f"Error extracting text from PDF: {e}")
            return ""

    def extract_key_fields(self, text: str) -> Dict[str, Optional[str]]:
        """
        Extract basic fields like email and phone number using regex.
        This is a preliminary extraction; for complex fields, consider using an LLM.
        """
        email_pattern = r'[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}'
        phone_pattern = r'(\+\d{1,3}[-.]?)?\(?\d{3}\)?[-.]?\d{3}[-.]?\d{4}'
        
        email = re.search(email_pattern, text)
        phone = re.search(phone_pattern, text)

        return {
            "email": email.group(0) if email else None,
            "phone": phone.group(0) if phone else None,
            "raw_text": text
        }

if __name__ == "__main__":
    # Example usage (for testing)
    # extractor = PDFExtractor(file_path="sample_cv.pdf")
    # text = extractor.extract_text()
    # print(extractor.extract_key_fields(text))
    pass
