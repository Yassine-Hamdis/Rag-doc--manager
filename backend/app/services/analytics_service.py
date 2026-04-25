from sqlalchemy.orm import Session
from sqlalchemy import func
from app.db.models import Document, ChatSession, Message
import json

class AnalyticsService:
    def __init__(self, db: Session, user_id: int):
        self.db = db
        self.user_id = user_id
    
    def get_overview(self) -> dict:
        # Document stats
        total_docs = self.db.query(Document).filter(Document.user_id == self.user_id).count()
        docs_by_status = {
            "INDEXED": self.db.query(Document).filter(
                Document.user_id == self.user_id, Document.status == "INDEXED"
            ).count(),
            "PENDING": self.db.query(Document).filter(
                Document.user_id == self.user_id, Document.status == "PENDING"
            ).count(),
            "ERROR": self.db.query(Document).filter(
                Document.user_id == self.user_id, Document.status == "ERROR"
            ).count(),
        }
        
        # Session stats
        total_sessions = self.db.query(ChatSession).filter(ChatSession.user_id == self.user_id).count()
        
        # Message stats
        messages = self.db.query(Message).join(ChatSession).filter(
            ChatSession.user_id == self.user_id
        ).all()
        
        total_questions = len([m for m in messages if m.role == "user"])
        
        # Latency stats
        latencies = [m.latency_ms for m in messages if m.latency_ms is not None]
        avg_latency = sum(latencies) / len(latencies) if latencies else 0
        
        # Traceability rate
        assistant_messages = [m for m in messages if m.role == "assistant"]
        messages_with_sources = 0
        for m in assistant_messages:
            if m.sources_json:
                try:
                    sources = json.loads(m.sources_json)
                    if sources:
                        messages_with_sources += 1
                except:
                    pass
        
        traceability_rate = (messages_with_sources / len(assistant_messages) * 100) if assistant_messages else 0
        
        return {
            "total_documents": total_docs,
            "total_sessions": total_sessions,
            "total_questions": total_questions,
            "avg_latency_ms": round(avg_latency, 2),
            "traceability_rate": round(traceability_rate, 1),
            "documents_by_status": docs_by_status
        }
    
    def get_daily_stats(self, days: int = 7) -> list:
        # Simplified - you can enhance with actual date grouping
        messages = self.db.query(Message).join(ChatSession).filter(
            ChatSession.user_id == self.user_id,
            Message.role == "user"
        ).order_by(Message.created_at.desc()).limit(days * 10).all