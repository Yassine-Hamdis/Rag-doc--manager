import chromadb
from chromadb.config import Settings

class VectorDB:
    def __init__(self, path: str = "./storage/chroma"):
        self.client = chromadb.PersistentClient(
            path=path,
            settings=Settings(anonymized_telemetry=False),
        )
        self.collection = self.client.get_or_create_collection(
            name="chunks",
            metadata={"hnsw:space": "cosine"},
        )

    def add(self, ids, embeddings, documents, metadatas):
        self.collection.add(ids=ids, embeddings=embeddings, documents=documents, metadatas=metadatas)

    def query(self, embedding, n_results: int, where: dict):
        return self.collection.query(
            query_embeddings=[embedding],
            n_results=n_results,
            where=where,
            include=["documents", "metadatas", "distances"]
        )

    def delete_where(self, where: dict):
        self.collection.delete(where=where)