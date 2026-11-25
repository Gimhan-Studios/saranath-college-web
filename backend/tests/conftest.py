import os
import sys
import tempfile
from pathlib import Path

_tmp = tempfile.mkdtemp()
os.environ["DATABASE_URL"] = f"sqlite:///{_tmp}/test.db"
os.environ["UPLOAD_DIR"] = f"{_tmp}/uploads"
os.environ["SECRET_KEY"] = "test-secret-key-that-is-long-enough-1234567890"
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

import pytest  # noqa: E402
from fastapi.testclient import TestClient  # noqa: E402

from app.db import SessionLocal  # noqa: E402
from app.main import app  # noqa: E402
from app.models import User  # noqa: E402
from app.security import hash_password  # noqa: E402
from app.seed import seed  # noqa: E402

ADMIN_PW = "Str0ng-Test-Passw0rd!"

with SessionLocal() as db:
    seed(db)
    db.add(User(username="admin", full_name="Test Admin", role="superadmin", password_hash=hash_password(ADMIN_PW)))
    db.add(User(username="editor", full_name="Test Editor", role="editor", password_hash=hash_password(ADMIN_PW)))
    db.commit()


@pytest.fixture
def client():
    return TestClient(app)


def login(client, username="admin", password=ADMIN_PW):
    r = client.post("/api/auth/login", json={"username": username, "password": password})
    assert r.status_code == 200, r.text
    return r.json()["csrf_token"]
