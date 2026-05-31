import fitz  # PyMuPDF
import docx
import pypandoc
from typing import Dict, Any, Optional
import io

class DocumentProcessor:
    @staticmethod
    async def process_pdf(file_bytes: bytes) -> str:
        doc = fitz.open(stream=file_bytes, filetype="pdf")
        text = ""
        for page in doc:
            text += page.get_text()
        return text

    @staticmethod
    async def process_docx(file_bytes: bytes) -> str:
        doc = docx.Document(io.BytesIO(file_bytes))
        full_text = []
        for para in doc.paragraphs:
            full_text.append(para.text)
        return "\n".join(full_text)

    @staticmethod
    async def process_txt(file_bytes: bytes) -> str:
        return file_bytes.decode("utf-8")

    @staticmethod
    async def process_markdown(file_bytes: bytes) -> str:
        # pypandoc can convert MD to plain text or just return it
        return file_bytes.decode("utf-8")

    @classmethod
    async def extract_content(cls, file_bytes: bytes, extension: str) -> Optional[str]:
        extension = extension.lower().strip(".")
        if extension == "pdf":
            return await cls.process_pdf(file_bytes)
        elif extension == "docx":
            return await cls.process_docx(file_bytes)
        elif extension == "txt":
            return await cls.process_txt(file_bytes)
        elif extension == "md":
            return await cls.process_markdown(file_bytes)
        return None

    @staticmethod
    def get_metadata(content: str) -> Dict[str, Any]:
        words = content.split()
        return {
            "word_count": len(words),
            "char_count": len(content),
            "estimated_pages": max(1, len(words) // 500)
        }
