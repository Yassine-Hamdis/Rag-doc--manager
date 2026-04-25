from pydantic import BaseModel
from datetime import datetime
from typing import Optional

class DocumentItem(BaseModel):
    id: int
    original_name: str
    status: str
    created_at: datetime
    error_message: Optional[str] = None