from fastapi import APIRouter, Depends, UploadFile, File, HTTPException, BackgroundTasks
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.db.models import Document
from app.core.security import get_current_user_id
from app.schemas.documents import DocumentItem

from app.services.storage_service import save_pdf, delete_file
from app.services.resources import get_embedder, get_vectordb
from app.services.rag_service import index_pdf

router = APIRouter(prefix="/docs", tags=["documents"])

def index_document_background(doc_id: int, user_id: int, pdf_path: str, doc_name: str, db_session):
    """Background task for indexing"""
    embedder = get_embedder()
    vectordb = get_vectordb()
    
    # Need a new DB session for background task
    from app.db.database import SessionLocal
    db = SessionLocal()
    
    try:
        index_pdf(
            doc_id=doc_id,
            user_id=user_id,
            pdf_path=pdf_path,
            doc_name=doc_name,
            embedder=embedder,
            vectordb=vectordb,
        )
        doc = db.query(Document).filter(Document.id == doc_id).first()
        if doc:
            doc.status = "INDEXED"
            doc.error_message = None
            db.commit()
    except Exception as e:
        doc = db.query(Document).filter(Document.id == doc_id).first()
        if doc:
            doc.status = "ERROR"
            doc.error_message = str(e)
            db.commit()
    finally:
        db.close()

@router.post("/upload", response_model=DocumentItem)
def upload_pdf(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db),
):
    if not file.filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF allowed")

    stored_path = save_pdf(user_id, file)
    doc = Document(
        user_id=user_id,
        original_name=file.filename,
        stored_path=stored_path,
        status="PENDING",
    )
    db.add(doc)
    db.commit()
    db.refresh(doc)

    # Index in background
    background_tasks.add_task(
        index_document_background,
        doc.id,
        user_id,
        stored_path,
        doc.original_name,
        None  # db_session will be created inside
    )

    return DocumentItem(
        id=doc.id,
        original_name=doc.original_name,
        status=doc.status,
        created_at=doc.created_at,
        error_message=None
    )

@router.post("/{doc_id}/reindex")
def reindex_document(
    doc_id: int,
    background_tasks: BackgroundTasks,
    user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db),
):
    doc = db.query(Document).filter(Document.id == doc_id, Document.user_id == user_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    
    doc.status = "PENDING"
    doc.error_message = None
    db.commit()
    
    background_tasks.add_task(
        index_document_background,
        doc.id,
        user_id,
        doc.stored_path,
        doc.original_name,
        None
    )
    
    return {"ok": True, "message": "Reindexing started"}

@router.get("", response_model=list[DocumentItem])
def list_docs(
    user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db),
):
    docs = (
        db.query(Document)
        .filter(Document.user_id == user_id)
        .order_by(Document.created_at.desc())
        .all()
    )
    return [
        DocumentItem(
            id=d.id,
            original_name=d.original_name,
            status=d.status,
            created_at=d.created_at,
            error_message=d.error_message
        )
        for d in docs
    ]

@router.delete("/{doc_id}")
def delete_doc(
    doc_id: int,
    user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db),
):
    doc = db.query(Document).filter(Document.id == doc_id, Document.user_id == user_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Not found")

    vectordb = get_vectordb()
    vectordb.delete_where(where={"$and": [{"user_id": user_id}, {"doc_id": doc_id}]})

    delete_file(doc.stored_path)
    db.delete(doc)
    db.commit()
    return {"ok": True}