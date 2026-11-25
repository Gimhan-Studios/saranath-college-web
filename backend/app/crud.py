"""Generic admin CRUD router used for every simple content type."""
import re
import unicodedata
from typing import List, Type

from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.orm import Session

from .db import Base, get_db
from .security import CurrentAdmin, audit, require_admin


def slugify(text: str) -> str:
    text = unicodedata.normalize("NFKD", text).encode("ascii", "ignore").decode()
    text = re.sub(r"[^a-zA-Z0-9]+", "-", text).strip("-").lower()
    return text[:100] or "item"


def unique_slug(db: Session, model, title: str, exclude_id: int = 0) -> str:
    base = slugify(title)
    slug, n = base, 2
    while db.scalar(select(model.id).where(model.slug == slug, model.id != exclude_id)):
        slug = f"{base}-{n}"
        n += 1
    return slug


def crud_router(name: str, model: Type[Base], schema_in: Type[BaseModel], schema_out: Type[BaseModel], order_by, has_slug: bool = False) -> APIRouter:
    r = APIRouter(prefix=f"/{name}", tags=[f"admin:{name}"])

    @r.get("", response_model=List[schema_out])
    def list_items(db: Session = Depends(get_db), _: CurrentAdmin = Depends(require_admin)):
        return db.scalars(select(model).order_by(*order_by)).all()

    @r.post("", response_model=schema_out, status_code=201)
    def create_item(payload: schema_in, request: Request, db: Session = Depends(get_db), cur: CurrentAdmin = Depends(require_admin)):
        obj = model(**payload.model_dump())
        if has_slug:
            obj.slug = unique_slug(db, model, payload.title)
        db.add(obj)
        db.flush()
        audit(db, request, f"{name}.create", f"{name}#{obj.id}", getattr(obj, "title", "") or getattr(obj, "name", ""), cur.user)
        db.commit()
        db.refresh(obj)
        return obj

    @r.put("/{item_id}", response_model=schema_out)
    def update_item(item_id: int, payload: schema_in, request: Request, db: Session = Depends(get_db), cur: CurrentAdmin = Depends(require_admin)):
        obj = db.get(model, item_id)
        if not obj:
            raise HTTPException(404, "Not found")
        data = payload.model_dump()
        for k, v in data.items():
            setattr(obj, k, v)
        if has_slug:
            obj.slug = unique_slug(db, model, payload.title, exclude_id=obj.id)
        audit(db, request, f"{name}.update", f"{name}#{obj.id}", getattr(obj, "title", "") or getattr(obj, "name", ""), cur.user)
        db.commit()
        db.refresh(obj)
        return obj

    @r.delete("/{item_id}", status_code=204)
    def delete_item(item_id: int, request: Request, db: Session = Depends(get_db), cur: CurrentAdmin = Depends(require_admin)):
        obj = db.get(model, item_id)
        if not obj:
            raise HTTPException(404, "Not found")
        label = getattr(obj, "title", "") or getattr(obj, "name", "") or getattr(obj, "caption", "")
        db.delete(obj)
        audit(db, request, f"{name}.delete", f"{name}#{item_id}", label, cur.user)
        db.commit()

    return r
