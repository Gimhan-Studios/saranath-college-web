"""Saranath College website: FastAPI application entry point."""
import logging
from pathlib import Path

from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.responses import FileResponse, JSONResponse, PlainTextResponse
from fastapi.staticfiles import StaticFiles
from starlette.exceptions import HTTPException as StarletteHTTPException
from starlette.middleware.gzip import GZipMiddleware
from starlette.middleware.trustedhost import TrustedHostMiddleware

from .config import BASE_DIR, get_settings
from .db import Base, engine
from .routers import admin, auth, public

settings = get_settings()
log = logging.getLogger("saranath")

Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Saranath College API",
    docs_url=None if settings.is_production else "/api/docs",
    redoc_url=None,
    openapi_url=None if settings.is_production else "/api/openapi.json",
)

CSP = (
    "default-src 'self'; "
    "script-src 'self'; "
    "style-src 'self' 'unsafe-inline'; "
    "img-src 'self' data: blob:; "
    "font-src 'self'; "
    "connect-src 'self'; "
    "frame-src https://www.google.com https://maps.google.com; "
    "object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'none'"
) + ("; upgrade-insecure-requests" if settings.is_production else "")
MAX_BODY = (settings.max_upload_mb + 1) * 1024 * 1024


@app.middleware("http")
async def security_headers(request: Request, call_next):
    cl = request.headers.get("content-length")
    if cl and cl.isdigit() and int(cl) > MAX_BODY:
        return JSONResponse({"detail": "Request too large."}, status_code=413)
    response = await call_next(request)
    h = response.headers
    h["Content-Security-Policy"] = CSP
    h["X-Content-Type-Options"] = "nosniff"
    h["X-Frame-Options"] = "DENY"
    h["Referrer-Policy"] = "strict-origin-when-cross-origin"
    h["Permissions-Policy"] = "camera=(), microphone=(), geolocation=(), payment=(), usb=()"
    h["Cross-Origin-Opener-Policy"] = "same-origin"
    h["Cross-Origin-Resource-Policy"] = "same-origin"
    if settings.is_production:
        h["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
    path = request.url.path
    if path.startswith("/api/admin") or path.startswith("/api/auth"):
        h["Cache-Control"] = "no-store"
        h["X-Robots-Tag"] = "noindex, nofollow"
    return response


app.add_middleware(GZipMiddleware, minimum_size=800)
app.add_middleware(TrustedHostMiddleware, allowed_hosts=settings.allowed_hosts)


@app.exception_handler(RequestValidationError)
async def validation_error(_: Request, exc: RequestValidationError):
    # Friendly, minimal messages: field name + reason, never the submitted value.
    errors = []
    for e in exc.errors()[:10]:
        loc = ".".join(str(p) for p in e.get("loc", []) if p != "body")
        errors.append({"field": loc, "message": e.get("msg", "Invalid value")})
    return JSONResponse({"detail": "Please check the highlighted fields.", "errors": errors}, status_code=422)


@app.exception_handler(Exception)
async def unhandled(_: Request, exc: Exception):
    log.exception("Unhandled error", exc_info=exc)
    return JSONResponse({"detail": "Something went wrong. Please try again."}, status_code=500)


app.include_router(public.router)
app.include_router(auth.router)
app.include_router(admin.router)


@app.get("/api/health")
def health():
    return {"ok": True}


@app.api_route("/api/{rest:path}", methods=["GET", "POST", "PUT", "PATCH", "DELETE"])
def api_not_found(rest: str):
    return JSONResponse({"detail": "Not found"}, status_code=404)


# ------------------------------------------------------- static files ----
settings.upload_dir.mkdir(parents=True, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=str(settings.upload_dir)), name="uploads")
MEDIA_DIR = BASE_DIR / "media"
MEDIA_DIR.mkdir(exist_ok=True)
app.mount("/media", StaticFiles(directory=str(MEDIA_DIR)), name="media")

DIST: Path = settings.frontend_dist
if (DIST / "assets").is_dir():
    app.mount("/assets", StaticFiles(directory=str(DIST / "assets")), name="assets")


@app.get("/robots.txt", include_in_schema=False)
def robots():
    return PlainTextResponse("User-agent: *\nDisallow: /admin\nDisallow: /api/\n")


@app.get("/{full_path:path}", include_in_schema=False)
def spa(full_path: str):
    # Serve real files from dist (favicon etc.), otherwise the SPA shell.
    if full_path and ".." not in full_path:
        candidate = (DIST / full_path).resolve()
        if candidate.is_file() and DIST.resolve() in candidate.parents:
            return FileResponse(candidate)
    index = DIST / "index.html"
    if index.is_file():
        return FileResponse(index, headers={"Cache-Control": "no-cache"})
    return PlainTextResponse("Frontend not built yet. Run `npm run build` in /frontend.", status_code=503)
