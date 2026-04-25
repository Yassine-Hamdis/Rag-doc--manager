from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.core.security import get_current_user_id
from app.services.analytics_service import AnalyticsService
from app.schemas.analytics import AnalyticsOverview, DailyStats, TopDocument

router = APIRouter(prefix="/analytics", tags=["analytics"])

@router.get("/overview", response_model=AnalyticsOverview)
def get_overview(
    user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    service = AnalyticsService(db, user_id)
    return service.get_overview()

@router.get("/daily", response_model=list[DailyStats])
def get_daily_stats(
    days: int = 7,
    user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    service = AnalyticsService(db, user_id)
    return service.get_daily_stats(days)

@router.get("/top-documents", response_model=list[TopDocument])
def get_top_documents(
    limit: int = 5,
    user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    service = AnalyticsService(db, user_id)
    return service.get_top_documents(limit)