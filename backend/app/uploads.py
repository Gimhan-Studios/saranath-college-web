"""Safe image uploads.

Every upload is opened with Pillow, which rejects anything that is not a real
image. It is then re-encoded to WebP. Re-encoding drops EXIF data (phone GPS
location, for example) and anything hidden inside the original file. Files get
random names, so a user-chosen filename never reaches the disk.
"""
import io
import secrets

from fastapi import HTTPException, UploadFile
from PIL import Image, ImageOps, UnidentifiedImageError

from .config import get_settings

settings = get_settings()
Image.MAX_IMAGE_PIXELS = 40_000_000  # decompression-bomb guard
ALLOWED_FORMATS = {"JPEG", "PNG", "WEBP"}
MAX_SIDE = 2400


async def save_image(file: UploadFile) -> str:
    limit = settings.max_upload_mb * 1024 * 1024
    data = await file.read(limit + 1)
    if len(data) > limit:
        raise HTTPException(413, f"Image is larger than {settings.max_upload_mb} MB.")
    if not data:
        raise HTTPException(400, "Empty file.")
    try:
        with Image.open(io.BytesIO(data)) as probe:
            fmt = probe.format
            probe.verify()
        if fmt not in ALLOWED_FORMATS:
            raise HTTPException(415, "Only JPG, PNG or WebP images are allowed.")
        img = Image.open(io.BytesIO(data))
        img = ImageOps.exif_transpose(img)
        if img.mode not in ("RGB", "RGBA"):
            img = img.convert("RGBA" if "A" in img.getbands() else "RGB")
        img.thumbnail((MAX_SIDE, MAX_SIDE))
    except HTTPException:
        raise
    except (UnidentifiedImageError, OSError, Image.DecompressionBombError, SyntaxError):
        raise HTTPException(415, "That file is not a valid image.")

    settings.upload_dir.mkdir(parents=True, exist_ok=True)
    name = secrets.token_hex(12) + ".webp"
    img.save(settings.upload_dir / name, "WEBP", quality=82, method=5)
    return f"/uploads/{name}"
