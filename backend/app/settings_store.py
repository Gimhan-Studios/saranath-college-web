from sqlalchemy.orm import Session

from .models import SiteSetting
from .schemas import PrincipalSettings, SchoolSettings

SCHEMAS = {"school": SchoolSettings, "principal": PrincipalSettings}


def get_setting(db: Session, key: str):
    row = db.get(SiteSetting, key)
    schema = SCHEMAS[key]
    if not row:
        return schema()
    # Validate on read too, so a bad row can never reach the public site.
    try:
        return schema.model_validate(row.value)
    except Exception:
        return schema()


def put_setting(db: Session, key: str, value) -> None:
    row = db.get(SiteSetting, key)
    data = value.model_dump()
    if row:
        row.value = data
    else:
        db.add(SiteSetting(key=key, value=data))
