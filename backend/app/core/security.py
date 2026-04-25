from datetime import datetime, timedelta
from passlib.context import CryptContext
from jose import jwt
from fastapi import Depends, HTTPException
from fastapi.security import OAuth2PasswordBearer
import hashlib

from app.core.config import SECRET_KEY, ACCESS_TOKEN_EXPIRE_MINUTES

ALGORITHM = "HS256"
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")


def _hash_input(password: str) -> str:
    # normalize password length safely
    return hashlib.sha256(password.encode("utf-8")).hexdigest()


def hash_password(password: str) -> str:
    return pwd_context.hash(_hash_input(password))


def verify_password(password: str, password_hash: str) -> bool:
    return pwd_context.verify(_hash_input(password), password_hash)


def create_access_token(subject: str) -> str:
    expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    payload = {"sub": subject, "exp": expire}
    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)


def get_current_user_id(token: str = Depends(oauth2_scheme)) -> int:
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return int(payload["sub"])
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid token")