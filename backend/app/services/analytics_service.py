from sqlalchemy.orm import Session
from sqlalchemy import func
from app.db.models import Document, ChatSession, Message
import json
from collections import Counter

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
    
    def get_daily_stats(self, days: int = 7) -> list[dict]:
        """
        Returns per-day:
          - questions: count of user messages
          - avg_latency_ms: average latency of assistant messages
        Note: these are computed independently per day (simple & reliable).
        """

        # Questions/day (user messages)
        q_rows = (
            self.db.query(
                func.date(Message.created_at).label("d"),
                func.count(Message.id).label("questions"),
            )
            .join(ChatSession, ChatSession.id == Message.session_id)
            .filter(ChatSession.user_id == self.user_id, Message.role == "user")
            .group_by(func.date(Message.created_at))
            .order_by(func.date(Message.created_at).desc())
            .limit(days)
            .all()
        )

        # Avg latency/day (assistant messages)
        l_rows = (
            self.db.query(
                func.date(Message.created_at).label("d"),
                func.avg(Message.latency_ms).label("avg_latency"),
            )
            .join(ChatSession, ChatSession.id == Message.session_id)
            .filter(
                ChatSession.user_id == self.user_id,
                Message.role == "assistant",
                Message.latency_ms.isnot(None),
            )
            .group_by(func.date(Message.created_at))
            .order_by(func.date(Message.created_at).desc())
            .limit(days)
            .all()
        )

        q_map = {r.d: int(r.questions) for r in q_rows if r.d is not None}
        l_map = {r.d: float(r.avg_latency or 0.0) for r in l_rows if r.d is not None}

        # Merge dates (some days may have questions but no assistant latency, etc.)
        dates = sorted(set(q_map.keys()) | set(l_map.keys()), reverse=True)[:days]

        return [
            {
                "date": d,  # SQLite func.date returns 'YYYY-MM-DD'
                "questions": q_map.get(d, 0),
                "avg_latency_ms": round(l_map.get(d, 0.0), 2),
            }
            for d in dates
        ]

    def get_top_documents(self, limit: int = 5) -> list[dict]:
        """
        Counts how many assistant answers cited each document (based on sources_json).
        usage_count = number of assistant messages where the document appears at least once.
        """

        assistant_msgs = (
            self.db.query(Message)
            .join(ChatSession, ChatSession.id == Message.session_id)
            .filter(
                ChatSession.user_id == self.user_id,
                Message.role == "assistant",
                Message.sources_json.isnot(None),
            )
            .all()
        )

        counter = Counter()  # (doc_id, doc_name) -> count

        for m in assistant_msgs:
            try:
                sources = json.loads(m.sources_json) or []
            except Exception:
                continue

            seen_docs = set()
            for s in sources:
                doc_id = s.get("doc_id")
                doc_name = s.get("doc_name") or ""
                if doc_id is None:
                    continue
                key = (int(doc_id), doc_name)
                seen_docs.add(key)

            for key in seen_docs:
                counter[key] += 1

        top = counter.most_common(limit)
        return [
            {"doc_id": doc_id, "doc_name": doc_name, "usage_count": count}
            for (doc_id, doc_name), count in top
        ]