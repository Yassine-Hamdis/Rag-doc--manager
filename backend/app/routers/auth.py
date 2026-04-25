from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.db.models import User
from app.schemas.auth import RegisterRequest, LoginRequest, TokenResponse, MeResponse
from app.core.security import hash_password, verify_password, create_access_token, get_current_user_id

router = APIRouter(prefix="/auth", tags=["auth"])

@router.post("/register")
def register(payload: RegisterRequest, db: Session = Depends(get_db)):
    exists = db.query(User).filter(User.email == payload.email).first()
    if exists:
        raise HTTPException(status_code=400, detail="Email already exists")

    user = User(email=payload.email, password_hash=hash_password(payload.password))
    db.add(user)
    db.commit()
    return {"ok": True}

@router.post("/login", response_model=TokenResponse)
def login(payload: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == payload.email).first()
    if not user or not verify_password(payload.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid credentials")

    token = create_access_token(str(user.id))
    return TokenResponse(access_token=token)

@router.get("/me", response_model=MeResponse)
def me(user_id: int = Depends(get_current_user_id), db: Session = Depends(get_db)):
    user = db.query(User).get(user_id)
    return MeResponse(id=user.id, email=user.email)