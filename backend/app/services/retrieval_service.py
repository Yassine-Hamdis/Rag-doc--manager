from typing import List, Dict, Any
import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

class RetrievalService:
    def __init__(self, vectordb, embedder):
        self.vectordb = vectordb
        self.embedder = embedder
        self.tfidf_vectorizer = None
        self.tfidf_matrix = None
        self.tfidf_texts = []
        self.tfidf_metadata = []
    
    def _build_where_filter(self, user_id: int, doc_ids: list = None) -> dict:
        """Construit le filtre WHERE pour ChromaDB"""
        if doc_ids and len(doc_ids) > 0:
            return {
                "$and": [
                    {"user_id": user_id},
                    {"doc_id": {"$in": doc_ids}}
                ]
            }
        return {"user_id": user_id}
    
    def retrieve_vector(self, query: str, user_id: int, top_k: int, doc_ids: list = None) -> tuple:
        """Vector search using embeddings"""
        q_emb = self.embedder.encode([query])[0]
        
        where_filter = self._build_where_filter(user_id, doc_ids)
        
        res = self.vectordb.query(
            embedding=q_emb,
            n_results=top_k,
            where=where_filter
        )
        
        docs = res["documents"][0] if res.get("documents") else []
        metas = res["metadatas"][0] if res.get("metadatas") else []
        dists = res["distances"][0] if res.get("distances") else []
        
        # Convert distance to similarity score
        scores = [float(1.0 / (1.0 + d)) if d is not None else 0.0 for d in dists]
        
        return docs, metas, scores
    
    def build_tfidf_index(self, user_id: int, doc_ids: list = None):
        """Build TF-IDF index from user documents (filtered if doc_ids given)"""
        where_filter = self._build_where_filter(user_id, doc_ids)
        
        res = self.vectordb.collection.get(
            where=where_filter,
            include=["documents", "metadatas"]
        )
        
        self.tfidf_texts = res.get("documents", [])
        self.tfidf_metadata = res.get("metadatas", [])
        
        if self.tfidf_texts:
            self.tfidf_vectorizer = TfidfVectorizer(max_features=5000)
            self.tfidf_matrix = self.tfidf_vectorizer.fit_transform(self.tfidf_texts)
    
    def retrieve_bm25(self, query: str, user_id: int, top_k: int, doc_ids: list = None) -> tuple:
        """TF-IDF based retrieval (simplified BM25)"""
        # Toujours rebuild pour respecter le filtre
        self.build_tfidf_index(user_id, doc_ids)
        
        if not self.tfidf_texts or self.tfidf_vectorizer is None:
            return [], [], []
        
        query_vec = self.tfidf_vectorizer.transform([query])
        similarities = cosine_similarity(query_vec, self.tfidf_matrix)[0]
            
        top_indices = np.argsort(similarities)[-top_k:][::-1]
        
        docs = [self.tfidf_texts[i] for i in top_indices if similarities[i] > 0]
        metas = [self.tfidf_metadata[i] for i in top_indices if similarities[i] > 0]
        scores = [float(similarities[i]) for i in top_indices if similarities[i] > 0]
        
        return docs, metas, scores
    
    def retrieve_hybrid(self, query: str, user_id: int, top_k: int, doc_ids: list = None) -> tuple:
        """Hybrid retrieval: combine vector and TF-IDF"""
        vec_docs, vec_metas, vec_scores = self.retrieve_vector(query, user_id, top_k * 2, doc_ids)
        tfidf_docs, tfidf_metas, tfidf_scores = self.retrieve_bm25(query, user_id, top_k * 2, doc_ids)
        
        combined = {}
        
        for i, (doc, meta, score) in enumerate(zip(vec_docs, vec_metas, vec_scores)):
            key = f"{meta.get('doc_id')}_{meta.get('page')}_{doc[:50]}"
            combined[key] = (doc, meta, score * 0.7)
        
        for i, (doc, meta, score) in enumerate(zip(tfidf_docs, tfidf_metas, tfidf_scores)):
            key = f"{meta.get('doc_id')}_{meta.get('page')}_{doc[:50]}"
            if key in combined:
                combined[key] = (doc, meta, combined[key][2] + score * 0.3)
            else:
                combined[key] = (doc, meta, score * 0.3)
        
        sorted_items = sorted(combined.values(), key=lambda x: x[2], reverse=True)[:top_k]
        
        docs = [item[0] for item in sorted_items]
        metas = [item[1] for item in sorted_items]
        scores = [item[2] for item in sorted_items]
        
        return docs, metas, scores
    
    def retrieve(self, query: str, user_id: int, top_k: int, mode: str = "hybrid", doc_ids: list = None) -> tuple:
        """Main retrieval method"""
        if mode == "vector":
            return self.retrieve_vector(query, user_id, top_k, doc_ids)
        elif mode == "bm25":
            return self.retrieve_bm25(query, user_id, top_k, doc_ids)
        else:  # hybrid
            return self.retrieve_hybrid(query, user_id, top_k, doc_ids)