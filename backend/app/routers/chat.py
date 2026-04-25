from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
import json
import time

from app.db.database import get_db
from app.db.models import ChatSession, Message
from app.core.security import get_current_user_id
from app.schemas.chat import (
    ChatAskRequest, ChatAskResponse, ChatSessionResponse,
    ChatSessionDetailResponse, CreateSessionRequest, MessageResponse, SourceItem
)
from app.services.resources import get_embedder, get_vectordb
from app.services.retrieval_service import RetrievalService
from app.services.rag_service import ask_rag

router = APIRouter(prefix="/chat", tags=["chat"])

@router.post("/sessions", response_model=ChatSessionResponse)
def create_session(
    payload: CreateSessionRequest,
    user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    session = ChatSession(user_id=user_id, title=payload.title)
    db.add(session)
    db.commit()
    db.refresh(session)
    
    return ChatSessionResponse(
        id=session.id,
        title=session.title,
        created_at=session.created_at,
        updated_at=session.updated_at,
        message_count=0
    )

@router.get("/sessions", response_model=list[ChatSessionResponse])
def list_sessions(
    user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    sessions = db.query(ChatSession).filter(
        ChatSession.user_id == user_id
    ).order_by(ChatSession.updated_at.desc()).all()
    
    result = []
    for s in sessions:
        msg_count = db.query(Message).filter(Message.session_id == s.id).count()
        result.append(ChatSessionResponse(
            id=s.id,
            title=s.title,
            created_at=s.created_at,
            updated_at=s.updated_at,
            message_count=msg_count
        ))
    
    return result

@router.get("/sessions/{session_id}", response_model=ChatSessionDetailResponse)
def get_session(
    session_id: int,
    user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    session = db.query(ChatSession).filter(
        ChatSession.id == session_id,
        ChatSession.user_id == user_id
    ).first()
    
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    
    messages = db.query(Message).filter(Message.session_id == session_id).order_by(Message.created_at).all()
    
    msg_responses = []
    for m in messages:
        sources = None
        if m.sources_json:
            try:
                sources = [SourceItem(**s) for s in json.loads(m.sources_json)]
            except:
                pass
        
        msg_responses.append(MessageResponse(
            id=m.id,
            role=m.role,
            content=m.content,
            sources=sources,
            latency_ms=m.latency_ms,
            created_at=m.created_at
        ))
    
    return ChatSessionDetailResponse(
        id=session.id,
        title=session.title,
        created_at=session.created_at,
        updated_at=session.updated_at,
        messages=msg_responses
    )

@router.post("/ask", response_model=ChatAskResponse)
def ask(
    payload: ChatAskRequest,
    user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    start_time = time.time()
    
    # Get or create session
    session_id = payload.session_id
    if not session_id:
        title = payload.question[:50] + "..." if len(payload.question) > 50 else payload.question
        session = ChatSession(user_id=user_id, title=title)
        db.add(session)
        db.commit()
        db.refresh(session)
        session_id = session.id
    else:
        session = db.query(ChatSession).filter(
            ChatSession.id == session_id,
            ChatSession.user_id == user_id
        ).first()
        if not session:
            raise HTTPException(status_code=404, detail="Session not found")
    
    # Save user message
    user_msg = Message(
        session_id=session_id,
        role="user",
        content=payload.question
    )
    db.add(user_msg)
    db.commit()
    
    # Get services
    embedder = get_embedder()
    vectordb = get_vectordb()
    retrieval_service = RetrievalService(vectordb, embedder)
    
    # Get answer (avec filtre doc_ids si fourni)
    answer, sources = ask_rag(
        user_id=user_id,
        question=payload.question,
        top_k=payload.top_k,
        retrieval_service=retrieval_service,
        embedder=embedder,
        vectordb=vectordb,
        mode=payload.retrieval_mode,
        doc_ids=payload.doc_ids  # ⭐ NOUVEAU
    )
    
    latency_ms = int((time.time() - start_time) * 1000)
    
    # Save assistant message
    assistant_msg = Message(
        session_id=session_id,
        role="assistant",
        content=answer,
        sources_json=json.dumps(sources),
        latency_ms=latency_ms
    )
    db.add(assistant_msg)
    
    # Update session updated_at
    session.updated_at = func.now()
    db.commit()
    db.refresh(assistant_msg)
    
    return ChatAskResponse(
        answer=answer,
        sources=[SourceItem(**s) for s in sources],
        session_id=session_id,
        message_id=assistant_msg.id
    )

@router.delete("/sessions/{session_id}")
def delete_session(
    session_id: int,
    user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    session = db.query(ChatSession).filter(
        ChatSession.id == session_id,
        ChatSession.user_id == user_id
    ).first()
    
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    
    db.delete(session)
    db.commit()
    
    return {"ok": True}