"""Read-only public API plus the private feedback form.

Nothing here can change site content. The only write is feedback, which is
rate limited, encrypted, and never readable through this router."""
from datetime import date, timedelta
from typing import List

from fastapi import APIRouter, Depends, HTTPException, Request, Response
from sqlalchemy import select
from sqlalchemy.orm import Session

from ..config import get_settings
from ..db import get_db
from ..models import AcademicLevel, AcademicStream, Club, Event, Feedback, GalleryPhoto, House, NewsArticle, TimelineItem
from ..schemas import (ClubOut, EventOut, FeedbackIn, GalleryOut, HouseOut, LevelOut, NewsOut, StreamOut, TimelineOut)
from ..security import client_ip, encrypt, ip_fingerprint, rate_cleanup, rate_count, rate_hit
from ..settings_store import get_setting

settings = get_settings()
router = APIRouter(prefix="/api/public", tags=["public"])


def _cache(response: Response, seconds: int = 60) -> None:
    response.headers["Cache-Control"] = f"public, max-age={seconds}"


@router.get("/settings")
def site_settings(response: Response, db: Session = Depends(get_db)):
    _cache(response)
    return {"school": get_setting(db, "school").model_dump(), "principal": get_setting(db, "principal").model_dump()}


@router.get("/news", response_model=List[NewsOut])
def list_news(response: Response, db: Session = Depends(get_db)):
    _cache(response)
    return db.scalars(select(NewsArticle).where(NewsArticle.published.is_(True)).order_by(NewsArticle.date.desc(), NewsArticle.id.desc())).all()


@router.get("/news/{slug}", response_model=NewsOut)
def get_news(slug: str, response: Response, db: Session = Depends(get_db)):
    obj = db.scalar(select(NewsArticle).where(NewsArticle.slug == slug[:140], NewsArticle.published.is_(True)))
    if not obj:
        raise HTTPException(404, "Story not found")
    _cache(response)
    return obj


@router.get("/events", response_model=List[EventOut])
def list_events(response: Response, db: Session = Depends(get_db)):
    _cache(response)
    return db.scalars(select(Event).where(Event.published.is_(True)).order_by(Event.date.asc())).all()


@router.get("/events/{slug}", response_model=EventOut)
def get_event(slug: str, response: Response, db: Session = Depends(get_db)):
    obj = db.scalar(select(Event).where(Event.slug == slug[:140], Event.published.is_(True)))
    if not obj:
        raise HTTPException(404, "Event not found")
    _cache(response)
    return obj


@router.get("/houses", response_model=List[HouseOut])
def list_houses(response: Response, db: Session = Depends(get_db)):
    _cache(response, 30)
    return db.scalars(select(House).order_by(House.position, House.id)).all()


@router.get("/academics")
def academics(response: Response, db: Session = Depends(get_db)):
    _cache(response)
    levels = db.scalars(select(AcademicLevel).order_by(AcademicLevel.position, AcademicLevel.id)).all()
    streams = db.scalars(select(AcademicStream).order_by(AcademicStream.position, AcademicStream.id)).all()
    return {
        "levels": [LevelOut.model_validate(x).model_dump() for x in levels],
        "streams": [StreamOut.model_validate(x).model_dump() for x in streams],
    }


@router.get("/clubs", response_model=List[ClubOut])
def list_clubs(response: Response, db: Session = Depends(get_db)):
    _cache(response)
    return db.scalars(select(Club).order_by(Club.position, Club.id)).all()


@router.get("/timeline", response_model=List[TimelineOut])
def list_timeline(response: Response, db: Session = Depends(get_db)):
    _cache(response)
    return db.scalars(select(TimelineItem).order_by(TimelineItem.position, TimelineItem.id)).all()


@router.get("/gallery", response_model=List[GalleryOut])
def list_gallery(response: Response, db: Session = Depends(get_db)):
    _cache(response)
    return db.scalars(select(GalleryPhoto).order_by(GalleryPhoto.position, GalleryPhoto.id)).all()


@router.post("/feedback", status_code=202)
def submit_feedback(payload: FeedbackIn, request: Request, db: Session = Depends(get_db)):
    bucket = "feedback:" + ip_fingerprint(client_ip(request))
    if rate_count(db, bucket, timedelta(hours=1)) >= settings.feedback_max_per_hour:
        raise HTTPException(429, "You have sent several messages recently. Please try again later.")
    rate_hit(db, bucket)
    if payload.website:
        # Bot filled the hidden field: pretend success, store nothing.
        db.commit()
        return {"ok": True}
    db.add(
        Feedback(
            kind=payload.kind,
            name_enc=encrypt(payload.name),
            email_enc=encrypt(payload.email or ""),
            phone_enc=encrypt(payload.phone),
            subject_enc=encrypt(payload.subject),
            message_enc=encrypt(payload.message),
        )
    )
    rate_cleanup(db)
    db.commit()
    return {"ok": True}
