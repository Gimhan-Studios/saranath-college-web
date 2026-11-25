"""Request/response schemas. Every input model forbids unknown fields and caps
lengths, so the API only ever stores what the admin forms are meant to send."""
import datetime as dt
import re
from typing import Annotated, List, Literal, Optional

from pydantic import AfterValidator, BaseModel, ConfigDict, EmailStr, Field, StringConstraints

# Images may only point at files this site serves itself. This blocks
# javascript:, data: and third-party tracking URLs from ever reaching an <img>.
_IMAGE_RE = re.compile(r"^(/uploads/[A-Za-z0-9_\-]+\.(webp|jpg|jpeg|png)|/media/[A-Za-z0-9_\-/]+\.(webp|jpg|jpeg|png|svg))?$")


def _check_image(v: str) -> str:
    if not _IMAGE_RE.match(v):
        raise ValueError("Image must be uploaded through the admin panel")
    return v


def _clean(v: str) -> str:
    # Strip control characters (keeps newlines and tabs) and surrounding space.
    return re.sub(r"[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]", "", v).strip()


def Text(max_len: int, min_len: int = 0):
    return Annotated[str, StringConstraints(max_length=max_len, min_length=min_len), AfterValidator(_clean)]


ImagePath = Annotated[str, StringConstraints(max_length=300), AfterValidator(_check_image)]
HexColor = Annotated[str, StringConstraints(pattern=r"^#[0-9a-fA-F]{6}$")]


class In(BaseModel):
    model_config = ConfigDict(extra="forbid", str_strip_whitespace=True)


class Out(BaseModel):
    model_config = ConfigDict(from_attributes=True)


# ------------------------------------------------------------ news ----
class NewsIn(In):
    title: Text(200, 3)
    category: Text(60) = "General"
    date: dt.date
    excerpt: Text(400) = ""
    body: Text(20000) = ""
    image: ImagePath = ""
    image_alt: Text(200) = ""
    featured: bool = False
    published: bool = True


class NewsOut(Out):
    id: int
    slug: str
    title: str
    category: str
    date: dt.date
    excerpt: str
    body: str
    image: str
    image_alt: str
    featured: bool
    published: bool


# ---------------------------------------------------------- events ----
class EventIn(In):
    title: Text(200, 3)
    category: Text(60) = "General"
    date: dt.date
    time: Text(40) = ""
    venue: Text(160) = ""
    excerpt: Text(400) = ""
    body: Text(20000) = ""
    outcome: Text(5000) = ""
    image: ImagePath = ""
    image_alt: Text(200) = ""
    published: bool = True


class EventOut(Out):
    id: int
    slug: str
    title: str
    category: str
    date: dt.date
    time: str
    venue: str
    excerpt: str
    body: str
    outcome: str
    image: str
    image_alt: str
    published: bool


# ---------------------------------------------------------- houses ----
class HouseIn(In):
    name: Text(60, 1)
    name_si: Text(60) = ""
    symbol: Text(60) = ""
    colour_name: Text(60) = ""
    color_hex: HexColor = "#1c57c4"
    motto: Text(160) = ""
    description: Text(2000) = ""
    points: int = Field(0, ge=0, le=1_000_000)
    captain: Text(120) = ""
    position: int = Field(0, ge=0, le=10_000)


class HouseOut(Out):
    id: int
    name: str
    name_si: str
    symbol: str
    colour_name: str
    color_hex: str
    motto: str
    description: str
    points: int
    captain: str
    position: int


class HousePointsIn(In):
    points: int = Field(ge=0, le=1_000_000)


# -------------------------------------------------------- academics ----
class LevelIn(In):
    grade_range: Text(60, 1)
    name: Text(120, 1)
    description: Text(2000) = ""
    image: ImagePath = ""
    position: int = Field(0, ge=0, le=10_000)


class LevelOut(Out):
    id: int
    grade_range: str
    name: str
    description: str
    image: str
    position: int


class StreamIn(In):
    name: Text(120, 1)
    category: Text(80) = ""
    focus: Text(300) = ""
    careers: Text(300) = ""
    description: Text(3000) = ""
    subjects: List[Text(120)] = Field(default_factory=list, max_length=20)
    image: ImagePath = ""
    position: int = Field(0, ge=0, le=10_000)


class StreamOut(Out):
    id: int
    name: str
    category: str
    focus: str
    careers: str
    description: str
    subjects: List[str]
    image: str
    position: int


# ------------------------------------------------------------ clubs ----
class ClubIn(In):
    name: Text(120, 1)
    kind: Literal["club", "sport"] = "club"
    category: Text(60) = ""
    description: Text(2000) = ""
    details: Text(4000) = ""
    teacher_in_charge: Text(120) = ""
    image: ImagePath = ""
    position: int = Field(0, ge=0, le=10_000)


class ClubOut(Out):
    id: int
    name: str
    kind: str
    category: str
    description: str
    details: str
    teacher_in_charge: str
    image: str
    position: int


# --------------------------------------------------------- timeline ----
class TimelineIn(In):
    year: Text(20, 1)
    date_note: Text(40) = ""
    title: Text(160, 1)
    description: Text(2000) = ""
    position: int = Field(0, ge=0, le=10_000)


class TimelineOut(Out):
    id: int
    year: str
    date_note: str
    title: str
    description: str
    position: int


# ---------------------------------------------------------- gallery ----
class GalleryIn(In):
    image: ImagePath = Field(min_length=1)
    caption: Text(160) = ""
    alt: Text(200) = ""
    category: Literal["sport", "learning", "arts", "community", "events"] = "community"
    size: Literal["normal", "wide", "tall"] = "normal"
    position: int = Field(0, ge=0, le=10_000)


class GalleryOut(Out):
    id: int
    image: str
    caption: str
    alt: str
    category: str
    size: str
    position: int


# --------------------------------------------------------- feedback ----
class FeedbackIn(In):
    kind: Literal["comment", "feedback", "suggestion", "complaint"]
    name: Text(120) = ""
    email: Optional[EmailStr] = None
    phone: Annotated[str, StringConstraints(max_length=20, pattern=r"^[0-9+\-\s()]*$")] = ""
    subject: Text(160) = ""
    message: Text(4000, 10)
    # Honeypot: real people never see or fill this field.
    website: str = Field("", max_length=200)


class FeedbackOut(BaseModel):
    id: int
    kind: str
    name: str
    email: str
    phone: str
    subject: str
    message: str
    status: str
    admin_note: str
    created_at: dt.datetime


class FeedbackUpdate(In):
    status: Literal["new", "read", "resolved", "archived"]
    admin_note: Text(2000) = ""


# --------------------------------------------------------- settings ----
class StatItem(In):
    value: Text(20)
    suffix: Text(10) = ""
    label: Text(60)


class SchoolSettings(In):
    name: Text(120) = "Saranath College"
    location: Text(120) = "Kuliyapitiya"
    founded: int = Field(1882, ge=1500, le=2100)
    motto_si: Text(120) = ""
    motto_en: Text(200) = ""
    tagline: Text(300) = ""
    intro_statement: Text(800) = ""
    address: Text(300) = ""
    phone: Text(40) = ""
    email: Text(120) = ""
    facebook: Annotated[str, StringConstraints(max_length=300, pattern=r"^(https://[^\s<>\"']+)?$")] = ""
    youtube: Annotated[str, StringConstraints(max_length=300, pattern=r"^(https://[^\s<>\"']+)?$")] = ""
    map_embed_query: Text(200) = ""
    office_hours: Text(120) = ""
    hero_image: ImagePath = ""
    logo: ImagePath = ""
    stats: List[StatItem] = Field(default_factory=list, max_length=8)
    sports_meet_title: Text(120) = "Inter-House Sports Meet"
    sports_meet_note: Text(400) = ""


class PrincipalSettings(In):
    name: Text(120) = ""
    title: Text(120) = "Principal"
    photo: ImagePath = ""
    quote: Text(400) = ""
    message: Text(8000) = ""


# ------------------------------------------------------------- auth ----
class LoginIn(In):
    username: Text(64, 1)
    password: str = Field(min_length=1, max_length=128)
    otp: Optional[Annotated[str, StringConstraints(pattern=r"^\d{6}$")]] = None


class MeOut(BaseModel):
    id: int
    username: str
    full_name: str
    role: str
    totp_enabled: bool
    must_change_password: bool
    csrf_token: str


class ChangePasswordIn(In):
    current_password: str = Field(min_length=1, max_length=128)
    new_password: str = Field(min_length=1, max_length=128)


class TotpConfirmIn(In):
    otp: Annotated[str, StringConstraints(pattern=r"^\d{6}$")]


class TotpDisableIn(In):
    password: str = Field(min_length=1, max_length=128)


class UserIn(In):
    username: Annotated[str, StringConstraints(pattern=r"^[a-zA-Z0-9_.\-]{3,64}$")]
    full_name: Text(120) = ""
    role: Literal["superadmin", "editor"] = "editor"
    password: str = Field(min_length=1, max_length=128)


class UserUpdate(In):
    full_name: Text(120) = ""
    role: Literal["superadmin", "editor"] = "editor"
    is_active: bool = True
    reset_password: Optional[str] = Field(None, max_length=128)


class UserOut(Out):
    id: int
    username: str
    full_name: str
    role: str
    is_active: bool
    totp_enabled: bool
    last_login_at: Optional[dt.datetime]
    created_at: dt.datetime


class AuditOut(Out):
    id: int
    username: str
    action: str
    target: str
    detail: str
    ip: str
    created_at: dt.datetime
