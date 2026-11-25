"""cPanel "Setup Python App" entry point.

cPanel runs Python apps through Phusion Passenger, which speaks WSGI. FastAPI is
ASGI, so a2wsgi bridges the two."""
import os
import sys

sys.path.insert(0, os.path.dirname(__file__))

from a2wsgi import ASGIMiddleware  # noqa: E402

from app.main import app as asgi_app  # noqa: E402

application = ASGIMiddleware(asgi_app)
