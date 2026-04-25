# backend/app/main.py
import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import CORS_ORIGINS
from app.db.database import Base, engine
from app.routers import auth, documents, chat, analytics

def ensure_dirs():
    os.makedirs("./storage", exist_ok=True)
    os.makedirs("./storage/docs", exist_ok=True)
    os.makedirs("./storage/chroma", exist_ok=True)

ensure_dirs()
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="RAG Doc Manager API",
    docs_url="/swagger",
    redoc_url="/redoc"
)

@app.get("/")
def root():
    return {"status": "ok", "swagger": "/swagger"}

app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(documents.router)
app.include_router(chat.router)
app.include_router(analytics.router)