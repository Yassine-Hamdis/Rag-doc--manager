import json
from app.services.pdf_service import extract_pages_text
from app.services.chunk_service import chunk_text
from app.services.llm_service import ollama_generate

SYSTEM_RULES = """You are an assistant. Answer ONLY using the CONTEXT.
If the answer is not in the context, say exactly:
"I couldn't find the information in the provided documents."

Answer in the SAME language as the QUESTION (French/English/Arabic).
Be clear and structured.
"""

def build_prompt(question: str, contexts: list[str]) -> str:
    context_block = "\n\n---\n\n".join(contexts)
    return f"""{SYSTEM_RULES}

CONTEXTE:
{context_block}

QUESTION:
{question}

RÉPONSE:
"""

def index_pdf(doc_id: int, user_id: int, pdf_path: str, doc_name: str, embedder, vectordb):
    pages = extract_pages_text(pdf_path)
    
    chunk_texts: list[str] = []
    metadatas: list[dict] = []
    ids: list[str] = []
    
    for p in pages:
        for j, ch in enumerate(chunk_text(p["text"])):
            chunk_id = f"u{user_id}_d{doc_id}_p{p['page']}_c{j}"
            ids.append(chunk_id)
            chunk_texts.append(ch)
            metadatas.append({
                "user_id": user_id,
                "doc_id": doc_id,
                "doc_name": doc_name,
                "page": p["page"],
            })
    
    if not chunk_texts:
        return
    
    embeddings = embedder.encode(chunk_texts)
    vectordb.add(ids=ids, embeddings=embeddings, documents=chunk_texts, metadatas=metadatas)

def ask_rag(user_id: int, question: str, top_k: int, retrieval_service, embedder, vectordb, mode: str = "hybrid", doc_ids: list = None):
    # Use retrieval service with optional doc_ids filter
    docs, metas, scores = retrieval_service.retrieve(question, user_id, top_k, mode, doc_ids)
    
    if not docs:
        if doc_ids and len(doc_ids) > 0:
            return "I couldn't find the information in the provided documents.", []
        return "I couldn't find the information in the provided documents.", []
    
    # Filter by relevance threshold
    MIN_SCORE = 0.3
    relevant_indices = [i for i, score in enumerate(scores) if score >= MIN_SCORE]
    
    if not relevant_indices:
        return "I couldn't find sufficiently relevant information in the provided documents.", []
    
    filtered_docs = [docs[i] for i in relevant_indices]
    filtered_metas = [metas[i] for i in relevant_indices]
    filtered_scores = [scores[i] for i in relevant_indices]
    
    prompt = build_prompt(question, filtered_docs)
    answer = ollama_generate(prompt).strip()
    
    sources = []
    for i in range(len(filtered_docs)):
        sources.append({
            "doc_id": filtered_metas[i].get("doc_id"),
            "doc_name": filtered_metas[i].get("doc_name"),
            "page": filtered_metas[i].get("page"),
            "snippet": filtered_docs[i][:280],
            "score": filtered_scores[i],
        })
    
    return answer, sources