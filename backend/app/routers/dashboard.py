from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from ..db import get_db
from .. import models

router = APIRouter(prefix="/api/dashboard", tags=["dashboard"])


@router.get("/summary")
def get_summary(db: Session = Depends(get_db)):
    total_neck = db.query(func.count(models.Container.id)).filter(models.Container.container_type == "neck").scalar()
    total_body = db.query(func.count(models.Container.id)).filter(models.Container.container_type == "body").scalar()
    occupied_slots = db.query(func.count(models.ContainerSlot.id)).filter(models.ContainerSlot.part_number.isnot(None)).scalar()
    empty_slots = db.query(func.count(models.ContainerSlot.id)).filter(models.ContainerSlot.part_number.is_(None)).scalar()

    return {
        "total_neck_trucks": total_neck,
        "total_body_trucks": total_body,
        "occupied_slots": occupied_slots,
        "empty_slots": empty_slots,
    }
