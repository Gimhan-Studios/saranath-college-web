import io

from PIL import Image

from app.db import SessionLocal
from app.models import Feedback, User
from conftest import ADMIN_PW, login


def test_public_content_is_readable(client):
    assert client.get("/api/public/houses").status_code == 200
    assert len(client.get("/api/public/events").json()) > 0
    assert client.get("/api/public/settings").json()["school"]["motto_si"]


def test_security_headers(client):
    r = client.get("/api/public/houses")
    assert "default-src 'self'" in r.headers["content-security-policy"]
    assert r.headers["x-frame-options"] == "DENY"
    assert r.headers["x-content-type-options"] == "nosniff"


def test_admin_requires_login(client):
    for path in ["/api/admin/news", "/api/admin/feedback", "/api/admin/users", "/api/admin/dashboard", "/api/auth/me"]:
        assert client.get(path).status_code == 401, path
    assert client.post("/api/admin/events", json={"title": "Hack", "date": "2027-01-01"}).status_code == 401
    assert client.put("/api/admin/houses/1", json={"name": "x"}).status_code == 401
    assert client.patch("/api/admin/houses/1/points", json={"points": 9999}).status_code == 401


def test_forged_cookie_rejected(client):
    client.cookies.set("sc_session", "forged-token-value", path="/api")
    assert client.get("/api/admin/news").status_code == 401


def test_feedback_is_private_and_encrypted(client):
    r = client.post("/api/public/feedback", json={"kind": "complaint", "name": "Nimal", "email": "nimal@example.com", "message": "The canteen water filter is broken."})
    assert r.status_code == 202
    # no public way to read it
    assert client.get("/api/public/feedback").status_code in (404, 405)
    with SessionLocal() as db:
        row = db.query(Feedback).order_by(Feedback.id.desc()).first()
        assert "canteen" not in row.message_enc and "Nimal" not in row.name_enc
    csrf = login(client)
    msgs = client.get("/api/admin/feedback").json()
    assert any("canteen" in m["message"] for m in msgs)
    _ = csrf


def test_feedback_honeypot_and_rate_limit(client):
    r = client.post("/api/public/feedback", json={"kind": "comment", "message": "spam spam spam spam", "website": "http://spam"})
    assert r.status_code == 202
    codes = [client.post("/api/public/feedback", json={"kind": "comment", "message": "hello there school"}).status_code for _ in range(8)]
    assert 429 in codes


def test_csrf_required_for_changes(client):
    csrf = login(client)
    body = {"title": "Test Event", "date": "2027-05-01"}
    assert client.post("/api/admin/events", json=body).status_code == 403
    assert client.post("/api/admin/events", json=body, headers={"X-CSRF-Token": "wrong"}).status_code == 403
    r = client.post("/api/admin/events", json=body, headers={"X-CSRF-Token": csrf})
    assert r.status_code == 201
    assert r.json()["slug"] == "test-event"


def test_rejects_unknown_fields_and_bad_images(client):
    csrf = login(client)
    h = {"X-CSRF-Token": csrf}
    assert client.post("/api/admin/news", json={"title": "Hello", "date": "2027-01-01", "id": 1}, headers=h).status_code == 422
    assert client.post("/api/admin/news", json={"title": "Hello", "date": "2027-01-01", "image": "javascript:alert(1)"}, headers=h).status_code == 422
    assert client.post("/api/admin/news", json={"title": "Hello", "date": "2027-01-01", "image": "https://evil.example/x.png"}, headers=h).status_code == 422
    assert client.put("/api/admin/houses/1", json={"name": "Thisara", "color_hex": "red;background:url(x)"}, headers=h).status_code == 422


def test_xss_text_is_stored_as_plain_text(client):
    csrf = login(client)
    r = client.post("/api/admin/news", json={"title": "<script>alert(1)</script> Title", "date": "2027-01-01"}, headers={"X-CSRF-Token": csrf})
    assert r.status_code == 201
    # Stored verbatim as text; React escapes it on render. Slug is sanitised.
    assert r.json()["slug"] == "script-alert-1-script-title"


def test_upload_validation(client):
    csrf = login(client)
    h = {"X-CSRF-Token": csrf}
    bad = client.post("/api/admin/upload", files={"file": ("x.png", b"<?php system($_GET['c']); ?>", "image/png")}, headers=h)
    assert bad.status_code == 415
    buf = io.BytesIO()
    Image.new("RGB", (50, 40), "red").save(buf, "PNG")
    ok = client.post("/api/admin/upload", files={"file": ("../../evil.png", buf.getvalue(), "image/png")}, headers=h)
    assert ok.status_code == 200
    path = ok.json()["path"]
    assert path.startswith("/uploads/") and path.endswith(".webp") and "evil" not in path
    assert client.get(path).status_code == 200


def test_editor_cannot_manage_users(client):
    login(client, "editor")
    assert client.get("/api/admin/users").status_code == 403
    assert client.get("/api/admin/audit").status_code == 403


def test_lockout_after_failed_logins(client):
    with SessionLocal() as db:
        db.add(User(username="victim", role="editor", password_hash=__import__("app.security", fromlist=["x"]).hash_password(ADMIN_PW)))
        db.commit()
    for _ in range(5):
        assert client.post("/api/auth/login", json={"username": "victim", "password": "wrong-password"}).status_code == 401
    r = client.post("/api/auth/login", json={"username": "victim", "password": ADMIN_PW})
    assert r.status_code == 429  # locked even with the right password


def test_unknown_user_gets_same_message(client):
    a = client.post("/api/auth/login", json={"username": "nobody", "password": "x"}).json()["detail"]
    b = client.post("/api/auth/login", json={"username": "admin", "password": "x"}).json()["detail"]
    assert a == b


def test_logout_kills_session(client):
    csrf = login(client)
    assert client.get("/api/auth/me").status_code == 200
    client.post("/api/auth/logout", headers={"X-CSRF-Token": csrf})
    assert client.get("/api/auth/me").status_code == 401


def test_session_cookie_flags(client):
    r = client.post("/api/auth/login", json={"username": "admin", "password": ADMIN_PW})
    sc = r.headers["set-cookie"].lower()
    assert "httponly" in sc and "samesite=strict" in sc and "path=/api" in sc


def test_house_points_update(client):
    csrf = login(client)
    r = client.patch("/api/admin/houses/1/points", json={"points": 120}, headers={"X-CSRF-Token": csrf})
    assert r.status_code == 200
    assert client.get("/api/public/houses").json()[0]["points"] == 120


def test_weak_password_rejected(client):
    csrf = login(client)
    r = client.post("/api/admin/users", json={"username": "teacher1", "password": "password123"}, headers={"X-CSRF-Token": csrf})
    assert r.status_code == 400
