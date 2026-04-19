from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, field_validator
import re


class ContainerCreate(BaseModel):
    container_code: str
    status: str = "active"

    @field_validator("container_code")
    @classmethod
    def validate_code(cls, value: str):
        if not re.match(r"^(NT|BT)\d{3}$", value):
            raise ValueError("Container code must match NT000-NT999 or BT000-BT999")
        return value.upper()


class ContainerResponse(BaseModel):
    id: int
    container_code: str
    container_type: str
    slot_count: int
    status: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class SlotResponse(BaseModel):
    slot_number: int
    part_number: Optional[str] = None

    class Config:
        from_attributes = True


class SlotUpdate(BaseModel):
    part_number: str
    changed_by: str = "operator"


class HistoryResponse(BaseModel):
    slot_number: int
    old_part_number: Optional[str]
    new_part_number: Optional[str]
    changed_by: str
    action: str
    changed_at: datetime

    class Config:
        from_attributes = True


class ContainerDetailResponse(BaseModel):
    id: int
    container_code: str
    container_type: str
    slot_count: int
    status: str
    slots: List[SlotResponse]

    class Config:
        from_attributes = True


class AuditScanRequest(BaseModel):
    slot_number: int
    part_number: Optional[str] = None
    changed_by: str = "operator"


class AuditScanResponse(BaseModel):
    truck_code: str
    slot_number: int
    action: str
    old_part_number: Optional[str] = None
    new_part_number: Optional[str] = None
    moved_from_truck: Optional[str] = None
    moved_from_slot: Optional[int] = None
    deviation_code: Optional[str] = None


class DeviationResponse(BaseModel):
    id: int
    code: str
    truck_code: str
    slot_number: Optional[int]
    part_number: Optional[str]
    details: Optional[str]
    created_by: str
    created_at: datetime

    class Config:
        from_attributes = True


class WorkSessionCloseRequest(BaseModel):
    work_center: str
    product_count: int
    elapsed_seconds: int
    completed_by: str = "operator"


class WorkSessionCloseResponse(BaseModel):
    truck_code: str
    work_center: str
    product_count: int
    elapsed_seconds: int
    completed_by: str
    action: str
    completed_at: datetime
