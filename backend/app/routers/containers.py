from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from ..db import get_db
from .. import crud, schemas, models

router = APIRouter(prefix="/api/containers", tags=["containers"])


@router.get("", response_model=list[schemas.ContainerResponse])
def list_containers(db: Session = Depends(get_db)):
    return crud.get_containers(db)


@router.post("", response_model=schemas.ContainerResponse)
def create_container(payload: schemas.ContainerCreate, db: Session = Depends(get_db)):
    existing = crud.get_container_by_code(db, payload.container_code)
    if existing:
        raise HTTPException(status_code=400, detail="Container code already exists")
    return crud.create_container(db, payload.container_code, payload.status)


@router.get("/{code}", response_model=schemas.ContainerDetailResponse)
def get_container(code: str, db: Session = Depends(get_db)):
    container = crud.get_container_by_code(db, code)
    if not container:
        raise HTTPException(status_code=404, detail="Container not found")
    return container


@router.put("/{code}/slots/{slot_number}", response_model=schemas.SlotResponse)
def set_slot(code: str, slot_number: int, payload: schemas.SlotUpdate, db: Session = Depends(get_db)):
    container = crud.get_container_by_code(db, code)
    if not container:
        raise HTTPException(status_code=404, detail="Container not found")
    try:
        return crud.update_slot(db, container, slot_number, payload.part_number, payload.changed_by)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))


@router.delete("/{code}/slots/{slot_number}", response_model=schemas.SlotResponse)
def remove_slot(code: str, slot_number: int, changed_by: str = "operator", db: Session = Depends(get_db)):
    container = crud.get_container_by_code(db, code)
    if not container:
        raise HTTPException(status_code=404, detail="Container not found")
    try:
        return crud.clear_slot(db, container, slot_number, changed_by)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))


@router.get("/{code}/history", response_model=list[schemas.HistoryResponse])
def get_history(code: str, db: Session = Depends(get_db)):
    container = crud.get_container_by_code(db, code)
    if not container:
        raise HTTPException(status_code=404, detail="Container not found")
    return (
        db.query(models.SlotHistory)
        .filter(models.SlotHistory.container_id == container.id)
        .order_by(models.SlotHistory.changed_at.desc())
        .limit(100)
        .all()
    )


@router.post("/{code}/audit-scan", response_model=schemas.AuditScanResponse)
def audit_scan(code: str, payload: schemas.AuditScanRequest, db: Session = Depends(get_db)):
    container = crud.get_container_by_code(db, code)
    if not container:
        raise HTTPException(status_code=404, detail="Container not found")
    try:
        return crud.audit_slot(db, container, payload.slot_number, payload.part_number, payload.changed_by)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))


@router.post("/{code}/close-work", response_model=schemas.WorkSessionCloseResponse)
def close_work(code: str, payload: schemas.WorkSessionCloseRequest, db: Session = Depends(get_db)):
    container = crud.get_container_by_code(db, code)
    if not container:
        raise HTTPException(status_code=404, detail="Container not found")

    event = crud.close_work_session(
        db,
        container,
        payload.work_center,
        payload.product_count,
        payload.elapsed_seconds,
        payload.completed_by,
    )
    return {
        "truck_code": container.container_code,
        "work_center": event.work_center,
        "product_count": event.product_count,
        "elapsed_seconds": event.elapsed_seconds,
        "completed_by": event.completed_by,
        "action": event.action,
        "completed_at": event.completed_at,
    }
