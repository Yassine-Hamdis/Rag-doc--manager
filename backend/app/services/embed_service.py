from sentence_transformers import SentenceTransformer

class EmbedService:
    def __init__(self):
        self.model = SentenceTransformer("all-MiniLM-L6-v2")

    def encode(self, texts: list[str]) -> list[list[float]]:
        emb = self.model.encode(texts, normalize_embeddings=True)
        return emb.tolist()