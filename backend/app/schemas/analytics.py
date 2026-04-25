from pydantic import BaseModel
from typing import List
from datetime import datetime

class AnalyticsOverview(BaseModel):
    total_documents: int
    total_sessions: int
    total_questions: int
    avg_latency_ms: float
    traceability_rate: float  # % responses with sources
    documents_by_status: dict

class DailyStats(BaseModel):
    date: str
    questions: int
    avg_latency_ms: float

class TopDocument(BaseModel):
    doc_id: int
    doc_name: str
    usage_count: int