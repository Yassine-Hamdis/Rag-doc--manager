def chunk_text(text: str, chunk_size: int = 900, overlap: int = 150):
    text = " ".join(text.split())   # normalize whitespace to avoid weird chunking due to newlines/tabs # example: "This is a\n\n\ntext with   weird   spacing." -> "This is a text with weird spacing."
    if not text:
        return []
    chunks = []
    start = 0
    while start < len(text):
        end = min(len(text), start + chunk_size)
        chunks.append(text[start:end])
        if end == len(text):
            break
        start = max(0, end - overlap)
    return [c for c in chunks if c.strip()]