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


@router.get("/deviations")
def get_deviations(db: Session = Depends(get_db)):
    deviations = (
        db.query(models.Deviation)
        .order_by(models.Deviation.created_at.desc())
        .limit(200)
        .all()
    )
    return deviations


@router.get("/recent-history")
def get_recent_history(db: Session = Depends(get_db)):
    slot_history = (
        db.query(models.SlotHistory, models.Container.container_code)
        .join(models.Container, models.Container.id == models.SlotHistory.container_id)
        .order_by(models.SlotHistory.changed_at.desc())
        .limit(200)
        .all()
    )

    work_events = (
        db.query(models.WorkSessionEvent, models.Container.container_code)
        .join(models.Container, models.Container.id == models.WorkSessionEvent.container_id)
        .order_by(models.WorkSessionEvent.completed_at.desc())
        .limit(200)
        .all()
    )

    combined = [
        {
            "type": "slot_history",
            "timestamp": item.changed_at,
            "truck_code": truck_code,
            "slot_number": item.slot_number,
            "old_part_number": item.old_part_number,
            "new_part_number": item.new_part_number,
            "changed_by": item.changed_by,
            "action": item.action,
            "changed_at": item.changed_at,
        }
        for item, truck_code in slot_history
    ] + [
        {
            "type": "work_completed",
            "timestamp": item.completed_at,
            "truck_code": truck_code,
            "work_center": item.work_center,
            "product_count": item.product_count,
            "elapsed_seconds": item.elapsed_seconds,
            "completed_by": item.completed_by,
            "action": item.action,
            "completed_at": item.completed_at,
        }
        for item, truck_code in work_events
    ]

    combined.sort(key=lambda entry: entry["timestamp"], reverse=True)
    return combined[:200]
