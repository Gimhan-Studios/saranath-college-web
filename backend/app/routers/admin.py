"""Admin-only API. Every route requires a signed-in admin; every change also
requires the CSRF header and is written to the audit log."""
from typing import List, Optional

from fastapi import APIRouter, Depends, File, HTTPException, Query, Request, UploadFile
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from ..crud import crud_router
from ..db import get_db
from ..models import (AcademicLevel, AcademicStream, AuditLog, Club, Event, Feedback, GalleryPhoto, House, NewsArticle,
                      TimelineItem, User)
from ..schemas import (AuditOut, ClubIn, ClubOut, EventIn, EventOut, FeedbackOut, FeedbackUpdate, GalleryIn, GalleryOut,
                       HouseIn, HouseOut, HousePointsIn, LevelIn, LevelOut, NewsIn, NewsOut, PrincipalSettings,
                       SchoolSettings, StreamIn, StreamOut, TimelineIn, TimelineOut, UserIn, UserOut, UserUpdate)
from ..security import (CurrentAdmin, audit, decrypt, destroy_user_sessions, encrypt, hash_password, now, password_problems,
                        require_admin, require_superadmin)
from ..settings_store import get_setting, put_setting
from ..uploads import save_image

router = APIRouter(prefix="/api/admin", tags=["admin"])

router.include_router(crud_router("news", NewsArticle, NewsIn, NewsOut, [NewsArticle.date.desc(), NewsArticle.id.desc()], has_slug=True))
router.include_router(crud_router("events", Event, EventIn, EventOut, [Event.date.desc(), Event.id.desc()], has_slug=True))
router.include_router(crud_router("houses", House, HouseIn, HouseOut, [House.position, House.id]))
router.include_router(crud_router("levels", AcademicLevel, LevelIn, LevelOut, [AcademicLevel.position, AcademicLevel.id]))
router.include_router(crud_router("streams", AcademicStream, StreamIn, StreamOut, [AcademicStream.position, AcademicStream.id]))
router.include_router(crud_router("clubs", Club, ClubIn, ClubOut, [Club.position, Club.id]))
router.include_router(crud_router("timeline", TimelineItem, TimelineIn, TimelineOut, [TimelineItem.position, TimelineItem.id]))
router.include_router(crud_router("gallery", GalleryPhoto, GalleryIn, GalleryOut, [GalleryPhoto.position, GalleryPhoto.id]))


@router.get("/dashboard")
def dashboard(db: Session = Depends(get_db), cur: CurrentAdmin = Depends(require_admin)):
    today = now().date()
    count = lambda m, *w: db.scalar(select(func.count()).select_from(m).where(*w)) or 0  # noqa: E731
    return {
        "news": count(NewsArticle),
        "upcoming_events": count(Event, Event.date >= today),
        "past_events": count(Event, Event.date < today),
        "clubs": count(Club),
        "gallery": count(GalleryPhoto),
        "feedback_new": count(Feedback, Feedback.status == "new"),
        "feedback_total": count(Feedback),
        "houses": [HouseOut.model_validate(h).model_dump() for h in db.scalars(select(House).order_by(House.points.desc()))],
        "recent_activity": [AuditOut.model_validate(a).model_dump() for a in db.scalars(select(AuditLog).order_by(AuditLog.id.desc()).limit(8))]
        if cur.user.role == "superadmin" else [],
    }


@router.patch("/houses/{house_id}/points", response_model=HouseOut)
def set_points(house_id: int, payload: HousePointsIn, request: Request, db: Session = Depends(get_db), cur: CurrentAdmin = Depends(require_admin)):
    house = db.get(House, house_id)
    if not house:
        raise HTTPException(404, "Not found")
    old = house.points
    house.points = payload.points
    audit(db, request, "houses.points", f"houses#{house.id}", f"{house.name}: {old} -> {payload.points}", cur.user)
    db.commit()
    db.refresh(house)
    return house


# ---------------------------------------------------------- settings ----
@router.get("/settings/school", response_model=SchoolSettings)
def get_school(db: Session = Depends(get_db), _: CurrentAdmin = Depends(require_admin)):
    return get_setting(db, "school")


@router.put("/settings/school", response_model=SchoolSettings)
def put_school(payload: SchoolSettings, request: Request, db: Session = Depends(get_db), cur: CurrentAdmin = Depends(require_admin)):
    put_setting(db, "school", payload)
    audit(db, request, "settings.school", "school", "", cur.user)
    db.commit()
    return payload


@router.get("/settings/principal", response_model=PrincipalSettings)
def get_principal(db: Session = Depends(get_db), _: CurrentAdmin = Depends(require_admin)):
    return get_setting(db, "principal")


@router.put("/settings/principal", response_model=PrincipalSettings)
def put_principal(payload: PrincipalSettings, request: Request, db: Session = Depends(get_db), cur: CurrentAdmin = Depends(require_admin)):
    put_setting(db, "principal", payload)
    audit(db, request, "settings.principal", "principal", "", cur.user)
    db.commit()
    return payload


# ------------------------------------------------------------ uploads ----
@router.post("/upload")
async def upload(request: Request, file: UploadFile = File(...), db: Session = Depends(get_db), cur: CurrentAdmin = Depends(require_admin)):
    path = await save_image(file)
    audit(db, request, "upload", path, "", cur.user)
    db.commit()
    return {"path": path}


# ----------------------------------------------------------- feedback ----
def _feedback_out(f: Feedback) -> FeedbackOut:
    return FeedbackOut(id=f.id, kind=f.kind, name=decrypt(f.name_enc), email=decrypt(f.email_enc), phone=decrypt(f.phone_enc),
                       subject=decrypt(f.subject_enc), message=decrypt(f.message_enc), status=f.status,
                       admin_note=decrypt(f.admin_note_enc), created_at=f.created_at)


@router.get("/feedback", response_model=List[FeedbackOut])
def list_feedback(status: Optional[str] = Query(None, pattern="^(new|read|resolved|archived)$"), db: Session = Depends(get_db),
                  _: CurrentAdmin = Depends(require_admin)):
    q = select(Feedback).order_by(Feedback.id.desc()).limit(500)
    if status:
        q = q.where(Feedback.status == status)
    return [_feedback_out(f) for f in db.scalars(q)]


@router.put("/feedback/{fid}", response_model=FeedbackOut)
def update_feedback(fid: int, payload: FeedbackUpdate, request: Request, db: Session = Depends(get_db), cur: CurrentAdmin = Depends(require_admin)):
    f = db.get(Feedback, fid)
    if not f:
        raise HTTPException(404, "Not found")
    f.status = payload.status
    f.admin_note_enc = encrypt(payload.admin_note)
    audit(db, request, "feedback.update", f"feedback#{fid}", payload.status, cur.user)
    db.commit()
    return _feedback_out(f)


@router.delete("/feedback/{fid}", status_code=204)
def delete_feedback(fid: int, request: Request, db: Session = Depends(get_db), cur: CurrentAdmin = Depends(require_superadmin)):
    f = db.get(Feedback, fid)
    if not f:
        raise HTTPException(404, "Not found")
    db.delete(f)
    audit(db, request, "feedback.delete", f"feedback#{fid}", "", cur.user)
    db.commit()


# -------------------------------------------------------------- users ----
@router.get("/users", response_model=List[UserOut])
def list_users(db: Session = Depends(get_db), _: CurrentAdmin = Depends(require_superadmin)):
    return db.scalars(select(User).order_by(User.id)).all()


@router.post("/users", response_model=UserOut, status_code=201)
def create_user(payload: UserIn, request: Request, db: Session = Depends(get_db), cur: CurrentAdmin = Depends(require_superadmin)):
    if db.scalar(select(User.id).where(func.lower(User.username) == payload.username.lower())):
        raise HTTPException(409, "That username is taken.")
    problem = password_problems(payload.password, payload.username)
    if problem:
        raise HTTPException(400, problem)
    u = User(username=payload.username, full_name=payload.full_name, role=payload.role, password_hash=hash_password(payload.password),
             must_change_password=True)
    db.add(u)
    db.flush()
    audit(db, request, "users.create", f"user#{u.id}", f"{u.username} ({u.role})", cur.user)
    db.commit()
    return u


@router.put("/users/{uid}", response_model=UserOut)
def update_user(uid: int, payload: UserUpdate, request: Request, db: Session = Depends(get_db), cur: CurrentAdmin = Depends(require_superadmin)):
    u = db.get(User, uid)
    if not u:
        raise HTTPException(404, "Not found")
    if u.id == cur.user.id and (payload.role != "superadmin" or not payload.is_active):
        raise HTTPException(400, "You cannot demote or disable your own account.")
    u.full_name, u.role, u.is_active = payload.full_name, payload.role, payload.is_active
    if payload.reset_password:
        problem = password_problems(payload.reset_password, u.username)
        if problem:
            raise HTTPException(400, problem)
        u.password_hash = hash_password(payload.reset_password)
        u.must_change_password = True
        u.locked_until = None
        u.failed_logins = 0
    if payload.reset_password or not payload.is_active:
        destroy_user_sessions(db, u.id)
    audit(db, request, "users.update", f"user#{u.id}", f"role={u.role} active={u.is_active} reset={'yes' if payload.reset_password else 'no'}", cur.user)
    db.commit()
    return u


@router.post("/users/{uid}/reset-2fa", status_code=204)
def reset_2fa(uid: int, request: Request, db: Session = Depends(get_db), cur: CurrentAdmin = Depends(require_superadmin)):
    u = db.get(User, uid)
    if not u:
        raise HTTPException(404, "Not found")
    u.totp_enabled, u.totp_secret_enc = False, None
    destroy_user_sessions(db, u.id)
    audit(db, request, "users.reset_2fa", f"user#{u.id}", u.username, cur.user)
    db.commit()


@router.get("/audit", response_model=List[AuditOut])
def audit_log(db: Session = Depends(get_db), _: CurrentAdmin = Depends(require_superadmin)):
    return db.scalars(select(AuditLog).order_by(AuditLog.id.desc()).limit(300)).all()
