from sqlalchemy.orm import Session
from . import models


def create_container(db: Session, container_code: str, status: str = "active"):
    container_type = "neck" if container_code.startswith("NT") else "body"
    slot_count = 28 if container_type == "neck" else 14

    container = models.Container(
        container_code=container_code,
        container_type=container_type,
        slot_count=slot_count,
        status=status,
    )
    db.add(container)
    db.flush()

    for slot_number in range(1, slot_count + 1):
        db.add(models.ContainerSlot(container_id=container.id, slot_number=slot_number, part_number=None))

    db.commit()
    db.refresh(container)
    return container


def get_containers(db: Session):
    return db.query(models.Container).order_by(models.Container.container_code).all()


def get_container_by_code(db: Session, code: str):
    return db.query(models.Container).filter(models.Container.container_code == code.upper()).first()


def update_slot(db: Session, container: models.Container, slot_number: int, part_number: str, changed_by: str):
    if slot_number < 1 or slot_number > container.slot_count:
        raise ValueError("Invalid slot number")

    slot = (
        db.query(models.ContainerSlot)
        .filter(models.ContainerSlot.container_id == container.id, models.ContainerSlot.slot_number == slot_number)
        .first()
    )
    if not slot:
        raise ValueError("Slot not found")

    old_value = slot.part_number
    slot.part_number = part_number.strip()

    action = "assign" if not old_value else "update"
    db.add(models.SlotHistory(
        container_id=container.id,
        slot_number=slot_number,
        old_part_number=old_value,
        new_part_number=slot.part_number,
        changed_by=changed_by,
        action=action,
    ))
    db.commit()
    db.refresh(slot)
    return slot


def clear_slot(db: Session, container: models.Container, slot_number: int, changed_by: str):
    if slot_number < 1 or slot_number > container.slot_count:
        raise ValueError("Invalid slot number")

    slot = (
        db.query(models.ContainerSlot)
        .filter(models.ContainerSlot.container_id == container.id, models.ContainerSlot.slot_number == slot_number)
        .first()
    )
    if not slot:
        raise ValueError("Slot not found")

    old_value = slot.part_number
    slot.part_number = None

    db.add(models.SlotHistory(
        container_id=container.id,
        slot_number=slot_number,
        old_part_number=old_value,
        new_part_number=None,
        changed_by=changed_by,
        action="clear",
    ))
    db.commit()
    db.refresh(slot)
    return slot
