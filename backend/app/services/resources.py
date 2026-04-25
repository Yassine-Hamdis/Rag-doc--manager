from functools import lru_cache
from app.services.embed_service import EmbedService
from app.services.vectordb_service import VectorDB

@lru_cache
def get_embedder() -> EmbedService:
    return EmbedService()

@lru_cache
def get_vectordb() -> VectorDB:
    return VectorDB(path="./storage/chroma")