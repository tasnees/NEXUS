
import pdfplumber
from typing import Optional, Dict, Any, List
import re

class PDFExtractor:
    """
    Service to extract text and structured data from PDF files using pdfplumber.
    """

    def __init__(self, file_path: Optional[str] = None, file_stream: Any = None):
        """
        initialize the extractor with a file path or file stream
        """
        self.file_path = file_path
        self.file_stream = file_stream

    def extract_text(self) -> str:
        """
        extract raw text from the pdf
        """
        text_content: str = ""
        try:
            if self.file_path:
                with pdfplumber.open(self.file_path) as pdf:
                    for page in pdf.pages:
                        extracted = page.extract_text()
                        if extracted:
                            text_content = f"{text_content}{extracted}\n"
            elif self.file_stream:
                with pdfplumber.open(self.file_stream) as pdf:
                    for page in pdf.pages:
                        extracted = page.extract_text()
                        if extracted:
                            text_content = f"{text_content}{extracted}\n"
            return text_content.strip()
        except Exception as e:
            print(f"Error extracting text from PDF: {e}")
            return ""

    def _extract_name(self, text: str) -> Optional[str]:
        """
        Try to extract the name (usually at the beginning of the text).
        """
        lines = [line.strip() for line in text.split('\n') if line.strip()]
        # Linter-friendly slicing
        limit = min(len(lines), 5)
        for i in range(limit):
            line = lines[i]
            # Heuristic: Name is usually short, 2-4 words, often first non-empty line
            # Avoid lines with numbers (often phone) or @ (often email)
            if 2 <= len(line.split()) <= 4 and not any(char.isdigit() for char in line) and '@' not in line:
                if not any(keyword in line.lower() for keyword in ["resume", "cv", "curriculum", "vitae", "profile", "email", "phone", "contact", "address"]):
                    return line
        return None

    def _extract_sections(self, text: str) -> Dict[str, Optional[str]]:
        """
        Identify and extract common CV sections using more robust header detection.
        """
        sections: Dict[str, Optional[str]] = {
            "summary": None,
            "experience": None,
            "education": None,
            "skills": None,
            "projects": None
        }
        
        # Expanded keywords with prefix/suffix flexibility
        keywords: Dict[str, List[str]] = {
            "summary": ["summary", "professional summary", "objective", "profile", "about me", "professional profile", "career objective"],
            "experience": ["experience", "work experience", "employment history", "professional experience", "professional background", "work history", "related experience", "employment"],
            "education": ["education", "academic background", "academic qualifications", "scholastic background", "educational background", "qualification", "academic history"],
            "skills": ["skills", "technical skills", "core competencies", "technologies", "expertise", "proficiencies", "skill set", "technical expertise", "skills & tools"],
            "projects": ["projects", "personal projects", "academic projects", "key projects", "notable projects", "recent projects"]
        }
        
        lines = text.split('\n')
        current_section: Optional[str] = None
        current_content: List[str] = []

        for line in lines:
            stripped = line.strip()
            if not stripped:
                continue
            
            # Heuristic for header: short line, maybe all caps, often contains keywords
            is_header = False
            lower_line = stripped.lower().rstrip(':')
            
            # 1. Exact match or starts with keyword match
            if len(stripped.split()) <= 5: # Headers are usually short
                for section_name, header_keys in keywords.items():
                    if any(lower_line == k or lower_line.startswith(k + " ") or lower_line.startswith(k + ":") for k in header_keys):
                        # Save previous section block
                        if current_section:
                            sections[current_section] = str("\n".join(current_content).strip())
                        
                        current_section = section_name
                        current_content = []
                        is_header = True
                        break
            
            if not is_header and current_section:
                current_content.append(stripped)
        
        # Save last section
        if current_section:
            sections[current_section] = str("\n".join(current_content).strip())
            
        return sections

    def extract_key_fields(self, text: str) -> Dict[str, Any]:
        """
        Extract basic fields and structured sections from CV text with improved regex and heuristics.
        """
        # Improved email regex
        email_pattern = r'[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}'
        
        # Improved phone regex (handles common formats like (123) 456-7890, +1 123-456-7890, etc.)
        phone_pattern = r'(\+?\d{1,3}[-.\s]?)?\(?\d{2,4}\)?[-.\s]?\d{3,4}[-.\s]?\d{4}'
        
        emails = re.findall(email_pattern, text)
        phones = re.findall(phone_pattern, text)
        
        name = self._extract_name(text)
        sections = self._extract_sections(text)

        # Filter out short or mostly empty sections
        for key in list(sections.keys()):
            val = sections[key]
            if val and len(str(val)) < 20: 
                sections[key] = None

        return {
            "name": name,
            "email": emails[0] if emails else None,
            "phone": phones[0] if phones else None,
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
