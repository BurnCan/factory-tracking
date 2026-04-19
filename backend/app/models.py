from datetime import datetime
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, UniqueConstraint
from sqlalchemy.orm import relationship
from .db import Base


class Container(Base):
    __tablename__ = "containers"

    id = Column(Integer, primary_key=True, index=True)
    container_code = Column(String, unique=True, nullable=False, index=True)
    container_type = Column(String, nullable=False)
    slot_count = Column(Integer, nullable=False)
    status = Column(String, nullable=False, default="active")
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    slots = relationship("ContainerSlot", back_populates="container", cascade="all, delete-orphan")
    history = relationship("SlotHistory", back_populates="container", cascade="all, delete-orphan")


class ContainerSlot(Base):
    __tablename__ = "container_slots"
    __table_args__ = (UniqueConstraint("container_id", "slot_number", name="uq_container_slot"),)

    id = Column(Integer, primary_key=True, index=True)
    container_id = Column(Integer, ForeignKey("containers.id"), nullable=False)
    slot_number = Column(Integer, nullable=False)
    part_number = Column(String, nullable=True)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    container = relationship("Container", back_populates="slots")


class SlotHistory(Base):
    __tablename__ = "slot_history"

    id = Column(Integer, primary_key=True, index=True)
    container_id = Column(Integer, ForeignKey("containers.id"), nullable=False)
    slot_number = Column(Integer, nullable=False)
    old_part_number = Column(String, nullable=True)
    new_part_number = Column(String, nullable=True)
    changed_by = Column(String, nullable=False, default="system")
    action = Column(String, nullable=False)
    changed_at = Column(DateTime, default=datetime.utcnow)

    container = relationship("Container", back_populates="history")


class Deviation(Base):
    __tablename__ = "deviations"

    id = Column(Integer, primary_key=True, index=True)
    code = Column(String, nullable=False)  # M=missing, F=found
    truck_code = Column(String, nullable=False, index=True)
    slot_number = Column(Integer, nullable=True)
    part_number = Column(String, nullable=True)
    details = Column(String, nullable=True)
    created_by = Column(String, nullable=False, default="system")
    created_at = Column(DateTime, default=datetime.utcnow)


class WorkSessionEvent(Base):
    __tablename__ = "work_session_events"

    id = Column(Integer, primary_key=True, index=True)
    container_id = Column(Integer, ForeignKey("containers.id"), nullable=False)
    work_center = Column(String, nullable=False)
    product_count = Column(Integer, nullable=False)
    elapsed_seconds = Column(Integer, nullable=False)
    completed_by = Column(String, nullable=False, default="operator")
    action = Column(String, nullable=False, default="work_completed")
    completed_at = Column(DateTime, default=datetime.utcnow)

    container = relationship("Container")
