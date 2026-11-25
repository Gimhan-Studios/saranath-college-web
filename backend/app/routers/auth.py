"""Admin sign-in, sign-out, password change and two-factor authentication."""
import base64
import io
from datetime import timedelta

import pyotp
import qrcode
import qrcode.image.svg
from fastapi import APIRouter, Depends, HTTPException, Request, Response
from sqlalchemy import select
from sqlalchemy.orm import Session

from ..config import get_settings
from ..db import get_db
from ..models import User
from ..schemas import ChangePasswordIn, LoginIn, MeOut, TotpConfirmIn, TotpDisableIn
from ..security import (CurrentAdmin, audit, clear_session_cookie, client_ip, create_session, decrypt, destroy_session,
                        destroy_user_sessions, encrypt, hash_password, ip_fingerprint, lock_remaining, needs_rehash, now,
                        password_problems, rate_count, rate_hit, require_admin, verify_password)

settings = get_settings()
router = APIRouter(prefix="/api/auth", tags=["auth"])

GENERIC_FAIL = "Incorrect username or password."


def _me(user: User, csrf: str) -> MeOut:
    return MeOut(id=user.id, username=user.username, full_name=user.full_name, role=user.role, totp_enabled=user.totp_enabled,
                 must_change_password=user.must_change_password, csrf_token=csrf)


@router.post("/login", response_model=MeOut)
def login(payload: LoginIn, request: Request, response: Response, db: Session = Depends(get_db)):
    ip_bucket = "login-ip:" + ip_fingerprint(client_ip(request))
    window = timedelta(minutes=settings.login_lockout_minutes)
    if rate_count(db, ip_bucket, window) >= settings.login_ip_max_attempts:
        raise HTTPException(429, "Too many sign-in attempts from this network. Try again later.")

    user = db.scalar(select(User).where(User.username == payload.username))
    if user and (mins := lock_remaining(user)):
        rate_hit(db, ip_bucket)
        db.commit()
        raise HTTPException(429, f"This account is temporarily locked. Try again in {mins} minutes.")

    ok = verify_password(payload.password, user.password_hash if user else None)
    if not ok or not user or not user.is_active:
        rate_hit(db, ip_bucket)
        if user:
            user.failed_logins += 1
            if user.failed_logins >= settings.login_max_attempts:
                user.locked_until = now() + window
                user.failed_logins = 0
                audit(db, request, "auth.locked", f"user#{user.id}", "Too many failed attempts", user)
        audit(db, request, "auth.failed", payload.username[:64], "", None)
        db.commit()
        raise HTTPException(401, GENERIC_FAIL)

    if user.totp_enabled:
        if not payload.otp:
            db.commit()
            raise HTTPException(401, "otp_required")
        totp = pyotp.TOTP(decrypt(user.totp_secret_enc or ""))
        if not totp.verify(payload.otp, valid_window=1):
            rate_hit(db, ip_bucket)
            user.failed_logins += 1
            if user.failed_logins >= settings.login_max_attempts:
                user.locked_until = now() + window
                user.failed_logins = 0
            audit(db, request, "auth.failed_otp", f"user#{user.id}", "", user)
            db.commit()
            raise HTTPException(401, "Incorrect 6-digit code.")

    if needs_rehash(user.password_hash):
        user.password_hash = hash_password(payload.password)
    user.failed_logins = 0
    user.locked_until = None
    user.last_login_at = now()
    sess = create_session(db, user, request, response)
    audit(db, request, "auth.login", f"user#{user.id}", "", user)
    db.commit()
    return _me(user, sess.csrf_token)


@router.post("/logout", status_code=204)
def logout(request: Request, response: Response, db: Session = Depends(get_db)):
    destroy_session(db, request)
    db.commit()
    clear_session_cookie(response)


@router.get("/me", response_model=MeOut)
def me(cur: CurrentAdmin = Depends(require_admin)):
    return _me(cur.user, cur.session.csrf_token)


@router.post("/change-password", status_code=204)
def change_password(payload: ChangePasswordIn, request: Request, db: Session = Depends(get_db), cur: CurrentAdmin = Depends(require_admin)):
    if not verify_password(payload.current_password, cur.user.password_hash):
        raise HTTPException(400, "Current password is incorrect.")
    problem = password_problems(payload.new_password, cur.user.username)
    if problem:
        raise HTTPException(400, problem)
    if verify_password(payload.new_password, cur.user.password_hash):
        raise HTTPException(400, "New password must be different.")
    cur.user.password_hash = hash_password(payload.new_password)
    cur.user.must_change_password = False
    destroy_user_sessions(db, cur.user.id, keep=cur.session.id)  # sign out other devices
    audit(db, request, "auth.password_changed", f"user#{cur.user.id}", "", cur.user)
    db.commit()


@router.post("/2fa/setup")
def totp_setup(request: Request, db: Session = Depends(get_db), cur: CurrentAdmin = Depends(require_admin)):
    if cur.user.totp_enabled:
        raise HTTPException(400, "Two-factor sign-in is already on.")
    secret = pyotp.random_base32()
    cur.user.totp_secret_enc = encrypt(secret)
    db.commit()
    uri = pyotp.TOTP(secret).provisioning_uri(name=cur.user.username, issuer_name="Saranath College Admin")
    img = qrcode.make(uri, image_factory=qrcode.image.svg.SvgPathImage, box_size=8)
    buf = io.BytesIO()
    img.save(buf)
    svg_b64 = base64.b64encode(buf.getvalue()).decode()
    return {"secret": secret, "qr_svg_data_url": f"data:image/svg+xml;base64,{svg_b64}"}


@router.post("/2fa/confirm", status_code=204)
def totp_confirm(payload: TotpConfirmIn, request: Request, db: Session = Depends(get_db), cur: CurrentAdmin = Depends(require_admin)):
    if not cur.user.totp_secret_enc:
        raise HTTPException(400, "Start the setup first.")
    if not pyotp.TOTP(decrypt(cur.user.totp_secret_enc)).verify(payload.otp, valid_window=1):
        raise HTTPException(400, "That code did not match. Check your phone's time and try again.")
    cur.user.totp_enabled = True
    audit(db, request, "auth.2fa_enabled", f"user#{cur.user.id}", "", cur.user)
    db.commit()


@router.post("/2fa/disable", status_code=204)
def totp_disable(payload: TotpDisableIn, request: Request, db: Session = Depends(get_db), cur: CurrentAdmin = Depends(require_admin)):
    if not verify_password(payload.password, cur.user.password_hash):
        raise HTTPException(400, "Password is incorrect.")
    cur.user.totp_enabled = False
    cur.user.totp_secret_enc = None
    audit(db, request, "auth.2fa_disabled", f"user#{cur.user.id}", "", cur.user)
    db.commit()
