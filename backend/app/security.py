"""Security primitives: password hashing, admin sessions, CSRF, rate limiting,
field encryption and audit logging."""
import base64
import hashlib
import hmac
import re
import secrets
from datetime import datetime, timedelta
from typing import Optional

from argon2 import PasswordHasher
from argon2.exceptions import InvalidHashError, VerificationError, VerifyMismatchError
from cryptography.fernet import Fernet, InvalidToken
from fastapi import Depends, HTTPException, Request, Response, status
from sqlalchemy import delete, func, select
from sqlalchemy.orm import Session

from .config import get_settings
from .db import get_db
from .models import AdminSession, AuditLog, RateEvent, User, utcnow

settings = get_settings()

# ----------------------------------------------------------- passwords ----
_hasher = PasswordHasher(time_cost=3, memory_cost=64 * 1024, parallelism=2)
_DUMMY_HASH = _hasher.hash("timing-equaliser-" + secrets.token_hex(8))

_COMMON = {
    "password", "password123", "123456789012", "qwertyuiop12", "saranath1882", "saranathcollege",
    "admin12345678", "letmein12345", "iloveyou1234", "kuliyapitiya1",
}


def hash_password(password: str) -> str:
    return _hasher.hash(password)


def verify_password(password: str, password_hash: Optional[str]) -> bool:
    try:
        return _hasher.verify(password_hash or _DUMMY_HASH, password) and password_hash is not None
    except (VerifyMismatchError, VerificationError, InvalidHashError):
        return False


def needs_rehash(password_hash: str) -> bool:
    try:
        return _hasher.check_needs_rehash(password_hash)
    except InvalidHashError:
        return True


def password_problems(password: str, username: str = "") -> Optional[str]:
    if len(password) < 12:
        return "Password must be at least 12 characters."
    if len(password) > 128:
        return "Password is too long."
    if not re.search(r"[A-Za-z]", password) or not re.search(r"\d", password):
        return "Password must contain letters and numbers."
    if not re.search(r"[^A-Za-z0-9]", password) and not (re.search(r"[a-z]", password) and re.search(r"[A-Z]", password)):
        return "Use upper and lower case letters, or add a symbol."
    low = password.lower()
    if low in _COMMON or (username and username.lower() in low):
        return "Password is too easy to guess."
    return None


# ------------------------------------------------------------ crypto ----
def _fernet() -> Fernet:
    key = settings.data_encryption_key
    if not key:
        # Development fallback only; production startup refuses an empty key.
        key = base64.urlsafe_b64encode(hashlib.sha256(settings.secret_key.encode()).digest()).decode()
    return Fernet(key.encode() if isinstance(key, str) else key)


def encrypt(text: str) -> str:
    if not text:
        return ""
    return _fernet().encrypt(text.encode("utf-8")).decode("ascii")


def decrypt(token: str) -> str:
    if not token:
        return ""
    try:
        return _fernet().decrypt(token.encode("ascii")).decode("utf-8")
    except InvalidToken:
        return "[unreadable: encryption key changed]"


# ---------------------------------------------------------- client ip ----
def client_ip(request: Request) -> str:
    # Behind cPanel/Passenger the socket address is the real client. We do not
    # trust X-Forwarded-For, which any client can forge.
    return (request.client.host if request.client else "") or "unknown"


def ip_fingerprint(ip: str) -> str:
    return hmac.new(settings.secret_key.encode(), ip.encode(), hashlib.sha256).hexdigest()[:24]


# -------------------------------------------------------- rate limits ----
def rate_count(db: Session, bucket: str, window: timedelta) -> int:
    since = utcnow() - window
    return db.scalar(select(func.count()).select_from(RateEvent).where(RateEvent.bucket == bucket, RateEvent.created_at >= since)) or 0


def rate_hit(db: Session, bucket: str) -> None:
    db.add(RateEvent(bucket=bucket))


def rate_cleanup(db: Session) -> None:
    db.execute(delete(RateEvent).where(RateEvent.created_at < utcnow() - timedelta(days=2)))


# ------------------------------------------------------------ sessions ----
def _token_id(token: str) -> str:
    return hashlib.sha256(token.encode()).hexdigest()


def create_session(db: Session, user: User, request: Request, response: Response) -> AdminSession:
    # One login = one fresh session; old sessions of this user stay valid until they expire
    token = secrets.token_urlsafe(32)
    sess = AdminSession(
        id=_token_id(token),
        user_id=user.id,
        csrf_token=secrets.token_urlsafe(32),
        ip=client_ip(request)[:64],
        user_agent=(request.headers.get("user-agent") or "")[:255],
    )
    db.add(sess)
    response.set_cookie(
        settings.session_cookie_name,
        token,
        httponly=True,
        secure=settings.is_production,
        samesite="strict",
        path="/api",
        max_age=settings.session_absolute_hours * 3600,
    )
    return sess


def clear_session_cookie(response: Response) -> None:
    response.delete_cookie(settings.session_cookie_name, path="/api", secure=settings.is_production, httponly=True, samesite="strict")


def destroy_session(db: Session, request: Request) -> None:
    token = request.cookies.get(settings.session_cookie_name)
    if token:
        db.execute(delete(AdminSession).where(AdminSession.id == _token_id(token)))


def destroy_user_sessions(db: Session, user_id: int, keep: Optional[str] = None) -> None:
    q = delete(AdminSession).where(AdminSession.user_id == user_id)
    if keep:
        q = q.where(AdminSession.id != keep)
    db.execute(q)


class CurrentAdmin:
    def __init__(self, user: User, session: AdminSession):
        self.user = user
        self.session = session


_UNAUTH = HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Not signed in")


def _load_session(request: Request, db: Session) -> CurrentAdmin:
    token = request.cookies.get(settings.session_cookie_name)
    if not token or len(token) > 100:
        raise _UNAUTH
    sess = db.get(AdminSession, _token_id(token))
    if not sess:
        raise _UNAUTH
    now = utcnow()
    if now - sess.last_seen_at > timedelta(minutes=settings.session_idle_minutes) or now - sess.created_at > timedelta(
        hours=settings.session_absolute_hours
    ):
        db.delete(sess)
        db.commit()
        raise _UNAUTH
    user = db.get(User, sess.user_id)
    if not user or not user.is_active:
        db.delete(sess)
        db.commit()
        raise _UNAUTH
    if now - sess.last_seen_at > timedelta(seconds=60):
        sess.last_seen_at = now
        db.commit()
    return CurrentAdmin(user, sess)


def require_admin(request: Request, db: Session = Depends(get_db)) -> CurrentAdmin:
    current = _load_session(request, db)
    if request.method not in ("GET", "HEAD", "OPTIONS"):
        sent = request.headers.get("x-csrf-token", "")
        if not sent or not hmac.compare_digest(sent, current.session.csrf_token):
            raise HTTPException(status_code=403, detail="Security token missing or invalid. Please reload the page.")
    # Accounts that must change their password can only reach the auth endpoints.
    if current.user.must_change_password and not request.url.path.startswith("/api/auth/"):
        raise HTTPException(status_code=403, detail="Please change your password first.")
    return current


def require_superadmin(current: CurrentAdmin = Depends(require_admin)) -> CurrentAdmin:
    if current.user.role != "superadmin":
        raise HTTPException(status_code=403, detail="Only a super admin can do this.")
    return current


# --------------------------------------------------------------- audit ----
def audit(db: Session, request: Request, action: str, target: str = "", detail: str = "", user: Optional[User] = None) -> None:
    db.add(
        AuditLog(
            user_id=user.id if user else None,
            username=user.username if user else "",
            action=action[:64],
            target=target[:120],
            detail=detail[:500],
            ip=client_ip(request)[:64],
        )
    )


def lock_remaining(user: User) -> Optional[int]:
    if user.locked_until and user.locked_until > utcnow():
        return int((user.locked_until - utcnow()).total_seconds() // 60) + 1
    return None


def now() -> datetime:
    return utcnow()
