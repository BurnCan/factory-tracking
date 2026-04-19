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


def add_deviation(
    db: Session,
    code: str,
    truck_code: str,
    slot_number: int | None,
    part_number: str | None,
    details: str,
    created_by: str,
):
    deviation = models.Deviation(
        code=code,
        truck_code=truck_code,
        slot_number=slot_number,
        part_number=part_number,
        details=details,
        created_by=created_by,
    )
    db.add(deviation)
    return deviation


def get_deviations(db: Session, limit: int = 100):
    return db.query(models.Deviation).order_by(models.Deviation.created_at.desc()).limit(limit).all()


def audit_slot(db: Session, container: models.Container, slot_number: int, part_number: str | None, changed_by: str):
    if slot_number < 1 or slot_number > container.slot_count:
        raise ValueError("Invalid slot number")

    current_slot = (
        db.query(models.ContainerSlot)
        .filter(models.ContainerSlot.container_id == container.id, models.ContainerSlot.slot_number == slot_number)
        .first()
    )
    if not current_slot:
        raise ValueError("Slot not found")

    scanned_part = part_number.strip() if part_number else None
    old_value = current_slot.part_number

    # Missing part from expected slot
    if not scanned_part:
        if old_value:
            current_slot.part_number = None
            db.add(models.SlotHistory(
                container_id=container.id,
                slot_number=slot_number,
                old_part_number=old_value,
                new_part_number=None,
                changed_by=changed_by,
                action="audit_missing",
            ))
            add_deviation(
                db,
                code="M",
                truck_code=container.container_code,
                slot_number=slot_number,
                part_number=old_value,
                details=f"Part missing from {container.container_code}-{slot_number}",
                created_by=changed_by,
            )
            db.commit()
            return {
                "truck_code": container.container_code,
                "slot_number": slot_number,
                "action": "audit_missing",
                "old_part_number": old_value,
                "new_part_number": None,
                "deviation_code": "M",
            }
        return {
            "truck_code": container.container_code,
            "slot_number": slot_number,
            "action": "no_change",
            "old_part_number": None,
            "new_part_number": None,
        }

    existing_slot = db.query(models.ContainerSlot).filter(models.ContainerSlot.part_number == scanned_part).first()

    # Found part is already in another slot/truck -> move it
    if existing_slot and existing_slot.id != current_slot.id:
        from_container = db.query(models.Container).filter(models.Container.id == existing_slot.container_id).first()
        from_truck_code = from_container.container_code if from_container else "unknown"
        existing_old = existing_slot.part_number
        current_old = current_slot.part_number

        existing_slot.part_number = None
        current_slot.part_number = scanned_part

        db.add(models.SlotHistory(
            container_id=existing_slot.container_id,
            slot_number=existing_slot.slot_number,
            old_part_number=existing_old,
            new_part_number=None,
            changed_by=changed_by,
            action="move_out",
        ))
        db.add(models.SlotHistory(
            container_id=container.id,
            slot_number=slot_number,
            old_part_number=current_old,
            new_part_number=scanned_part,
            changed_by=changed_by,
            action="move_in",
        ))
        if current_old and current_old != scanned_part:
            add_deviation(
                db,
                code="M",
                truck_code=container.container_code,
                slot_number=slot_number,
                part_number=current_old,
                details=f"Replaced by moved part {scanned_part}",
                created_by=changed_by,
            )

        db.commit()
        return {
            "truck_code": container.container_code,
            "slot_number": slot_number,
            "action": "move_in",
            "old_part_number": current_old,
            "new_part_number": scanned_part,
            "moved_from_truck": from_truck_code,
            "moved_from_slot": existing_slot.slot_number,
        }

    # Found part wasn't assigned anywhere
    action = "audit_found" if not old_value else "audit_update"
    current_slot.part_number = scanned_part
    db.add(models.SlotHistory(
        container_id=container.id,
        slot_number=slot_number,
        old_part_number=old_value,
        new_part_number=scanned_part,
        changed_by=changed_by,
        action=action,
    ))
    deviation_code = None
    if not old_value:
        deviation_code = "F"
        add_deviation(
            db,
            code="F",
            truck_code=container.container_code,
            slot_number=slot_number,
            part_number=scanned_part,
            details=f"Found unassigned part in {container.container_code}-{slot_number}",
            created_by=changed_by,
        )
    db.commit()
    return {
        "truck_code": container.container_code,
        "slot_number": slot_number,
        "action": action,
        "old_part_number": old_value,
        "new_part_number": scanned_part,
        "deviation_code": deviation_code,
    }
