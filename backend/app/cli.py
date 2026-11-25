"""Command-line helpers.

  python -m app.cli gen-secret          print a random SECRET_KEY
  python -m app.cli gen-fernet          print a DATA_ENCRYPTION_KEY
  python -m app.cli seed                load starter content into an empty database
  python -m app.cli create-admin        create a super admin (prompts for password)
"""
import getpass
import secrets
import sys

from cryptography.fernet import Fernet
from sqlalchemy import select


def main(argv):
    cmd = argv[1] if len(argv) > 1 else ""
    if cmd == "gen-secret":
        print(secrets.token_urlsafe(48))
    elif cmd == "gen-fernet":
        print(Fernet.generate_key().decode())
    elif cmd == "seed":
        from .db import Base, SessionLocal, engine
        from .seed import seed

        Base.metadata.create_all(bind=engine)
        with SessionLocal() as db:
            print("Seeded starter content." if seed(db) else "Database already has content; nothing changed.")
    elif cmd == "create-admin":
        from .db import Base, SessionLocal, engine
        from .models import User
        from .security import hash_password, password_problems

        Base.metadata.create_all(bind=engine)
        username = input("Username: ").strip()
        full_name = input("Full name: ").strip()
        while True:
            pw = getpass.getpass("Password (min 12 chars, letters + numbers): ")
            problem = password_problems(pw, username)
            if problem:
                print(problem)
                continue
            if pw != getpass.getpass("Repeat password: "):
                print("Passwords do not match.")
                continue
            break
        with SessionLocal() as db:
            if db.scalar(select(User).where(User.username == username)):
                print("That username already exists.")
                return 1
            db.add(User(username=username, full_name=full_name, role="superadmin", password_hash=hash_password(pw)))
            db.commit()
        print(f"Super admin '{username}' created.")
    else:
        print(__doc__)
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv))
