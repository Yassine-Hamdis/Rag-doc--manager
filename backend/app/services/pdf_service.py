from pypdf import PdfReader

def extract_pages_text(pdf_path: str): # [{"page": 1, "text": "..."}, {"page": 2, "text": "..."}, ...]
    reader = PdfReader(pdf_path)
    pages = []
    for i, page in enumerate(reader.pages):
        text = page.extract_text() or ""
        pages.append({"page": i + 1, "text": text})
    return pages