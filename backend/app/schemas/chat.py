from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

class ChatAskRequest(BaseModel):
    question: str
    top_k: int = 4
    retrieval_mode: str = "hybrid"  # "vector", "bm25", "hybrid"
    session_id: Optional[int] = None
    doc_ids: Optional[List[int]] = None  # ⭐ NOUVEAU : filtre par documents

class SourceItem(BaseModel):
    doc_id: int
    doc_name: str
    page: Optional[int] = None
    snippet: str
    score: Optional[float] = None

class ChatAskResponse(BaseModel):
    answer: str
    sources: List[SourceItem]
    session_id: int
    message_id: int

class MessageResponse(BaseModel):
    id: int
    role: str
    content: str
    sources: Optional[List[SourceItem]] = None
    latency_ms: Optional[int] = None
    created_at: datetime

class ChatSessionResponse(BaseModel):
    id: int
    title: str
    created_at: datetime
    updated_at: datetime
    message_count: int

class ChatSessionDetailResponse(BaseModel):
    id: int
    title: str
    created_at: datetime
    updated_at: datetime
    messages: List[MessageResponse]

class CreateSessionRequest(BaseModel):
    title: Optional[str] = "Nouvelle conversation"