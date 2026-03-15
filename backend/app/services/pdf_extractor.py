
import pdfplumber
from typing import Optional, Dict
import re

class PDFExtractor:
    """
    Service to extract text and structured data from PDF files using pdfplumber.
    """

    def __init__(self, file_path: str = None, file_stream = None):
        """
        initialize the extractor with a file path or file stream , file is got from the mail
        """
        self.file_path = file_path
        self.file_stream = file_stream

    def extract_text(self) -> str:
        """
        extract raw text from the pdf
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

    def _extract_name(self, text: str) -> Optional[str]:
        """
        Try to extract the name (usually at the beginning of the text).
        """
        lines = text.split('\n')
        for line in lines[:10]:  # Look in first 10 lines
            stripped = line.strip()
            # Heuristic: Name is usually short, 2-4 words, often first non-empty line
            if stripped and 2 <= len(stripped.split()) <= 4:
                if not any(keyword in stripped.lower() for keyword in ["resume", "cv", "curriculum", "vitae", "profile", "email", "phone"]):
                    return stripped
        return None

    def _extract_sections(self, text: str) -> Dict[str, Optional[str]]:
        """
        Identify and extract common CV sections.
        """
        sections = {
            "summary": None,
            "experience": None,
            "education": None,
            "skills": None,
            "projects": None
        }
        
        keywords = {
            "summary": ["summary", "professional summary", "objective", "profile", "about me"],
            "experience": ["experience", "work experience", "employment history", "professional experience", "professional background", "work history", "related experience"],
            "education": ["education", "academic background", "academic qualifications", "scholastic background", "educational background", "qualification"],
            "skills": ["skills", "technical skills", "core competencies", "technologies", "expertise", "proficiencies", "skill set"],
            "projects": ["projects", "personal projects", "academic projects", "key projects", "notable projects"]
        }
        
        lines = text.split('\n')
        current_section = None
        current_content = []

        for line in lines:
            stripped = line.strip()
            if not stripped:
                continue
            
            # Check if line is a section header
            found_header = False
            for section_name, header_keys in keywords.items():
                if any(stripped.lower() == k or stripped.lower() == k + ":" for k in header_keys):
                    # Save block if we were already in a section
                    if current_section:
                        sections[current_section] = "\n".join(current_content).strip()
                    
                    current_section = section_name
                    current_content = []
                    found_header = True
                    break
            
            if not found_header and current_section:
                current_content.append(stripped)
        
        # Save last section
        if current_section and current_content:
            sections[current_section] = "\n".join(current_content).strip()
            
        return sections

    def extract_key_fields(self, text: str) -> Dict[str, any]:
        """
        Extract basic fields and structured sections from CV text.
        """
        email_pattern = r'[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}'
        phone_pattern = r'(\+\d{1,3}[-.]?)?\(?\d{3}\)?[-.]?\d{3}[-.]?\d{4}'
        
        email = re.search(email_pattern, text)
        phone = re.search(phone_pattern, text)
        
        name = self._extract_name(text)
        sections = self._extract_sections(text)

        return {
            "name": name,
            "email": email.group(0) if email else None,
            "phone": phone.group(0) if phone else None,
            "education": sections.get("education"),
            "experience": sections.get("experience"),
            "skills": sections.get("skills"),
            "summary": sections.get("summary"),
            "projects": sections.get("projects"),
            "raw_text": text
        }

if __name__ == "__main__":
    # Example usage (for testing)
    # extractor = PDFExtractor(file_path="sample_cv.pdf")
    # text = extractor.extract_text()
    # print(extractor.extract_key_fields(text))
    pass
