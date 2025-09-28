from sqlalchemy.orm import mapped_column, Mapped, relationship
from database import Base
from sqlalchemy import String, ForeignKey, DateTime, Enum, JSON, UniqueConstraint, Text
from typing import List
import enum
from datetime import datetime, time


class UserRoles(str, enum.Enum):
    PATIENT = "patient"
    DOCTOR = "doctor"  
    FAMILY = "family"
    ADMIN = "admin"

class RelationshipType(str, enum.Enum):
    SPOUSE = 'spouse'
    SIBLING = 'sibling'
    PARENT = 'parent'

class Status(str, enum.Enum):
    PENDING = 'pending'
    REJECTED = 'rejected'
    ACCECPTED = 'accepted'



class User(Base):
    __tablename__ = 'users'

    id : Mapped[int] = mapped_column(primary_key=True)
    name : Mapped[str] = mapped_column(String(30), nullable=False, index=True)
    email : Mapped[str] = mapped_column(String(50), nullable=False, index=True)
    hashed_password : Mapped[str] = mapped_column(String(100), nullable=False)
    role : Mapped[UserRoles] = mapped_column(Enum(UserRoles), nullable=False)
    date_of_birth : Mapped[DateTime] = mapped_column(DateTime(timezone=True))
    medical_license : Mapped[str] = mapped_column(String(50),nullable=True)

    family_connections : Mapped[List["FamilyConnections"]] = relationship(back_populates="patient", 
                                                                          foreign_keys="FamilyConnections.patient_id")
    
    related_as_family : Mapped[List["FamilyConnections"]] = relationship(back_populates='family_member',
                                                                         foreign_keys="FamilyConnections.family_member_id")
    
    sent_invitations : Mapped[List["FamilyInvitations"]] = relationship(back_populates='invited', foreign_keys='FamilyInvitations.inviter_id')
    
    received_invitations : Mapped[List["FamilyInvitations"]] = relationship(back_populates='invitee',foreign_keys='FamilyInvitations.invitee_id')
    
    family_member_permissions : Mapped[List["FamilyPermissions"]] = relationship(back_populates='family_member')

    patient_appointments : Mapped[List['Appointments']] = relationship(back_populates='patient', foreign_keys='Appointments.patient_id')

    doctor_appointments : Mapped[List['Appointments']] = relationship(back_populates='doctor', foreign_keys='Appointments.doctor_id')

    vitals : Mapped[List['Vitals']] = relationship(back_populates='patient', foreign_keys='Vitals.patient_id')

    doctor_for_patient : Mapped[List['Vitals']] = relationship(back_populates='doctor', foreign_keys='Vitals.doctor_id')

    availability_settings: Mapped[List["DoctorAvailability"]] = relationship(back_populates="doctor")


class FamilyConnections(Base):
    __tablename__ = 'family_connections'

    id : Mapped[int] = mapped_column(primary_key=True)
    patient_id : Mapped[int] = mapped_column(ForeignKey("users.id"))
    family_member_id : Mapped[int] = mapped_column(ForeignKey("users.id"))
    relationship_type : Mapped[str] = mapped_column(Enum(RelationshipType), nullable=False)

    patient : Mapped["User"] = relationship(back_populates='family_connections', foreign_keys=[patient_id])
    family_member : Mapped['User'] = relationship(back_populates='related_as_family', foreign_keys=[family_member_id])

    __table_args__ = (
        UniqueConstraint('patient_id', 'family_member_id', name='unique_relationship'),
    )


class FamilyInvitations(Base):
    __tablename__ = 'family_invitations'

    id : Mapped[int] = mapped_column(primary_key=True)
    inviter_id : Mapped[int] = mapped_column(ForeignKey('users.id'))
    invitee_id : Mapped[int] = mapped_column(ForeignKey('users.id'))
    relationship_type : Mapped[str] = mapped_column(Enum(RelationshipType), nullable=False)
    token : Mapped[str] = mapped_column(String)
    status : Mapped[str] = mapped_column(Enum(Status))

    invited : Mapped["User"] = relationship(back_populates='sent_invitations', foreign_keys=[inviter_id])
    invitee : Mapped["User"] = relationship(back_populates='received_invitations', foreign_keys=[invitee_id])


class FamilyPermissions(Base):
    __tablename__ = 'family_permissions'

    id : Mapped[int] = mapped_column(primary_key=True)
    family_member_id : Mapped[int] = mapped_column(ForeignKey('users.id'))
    permissions : Mapped[List[str]] = mapped_column(JSON)

    family_member : Mapped["User"] = relationship(back_populates='family_member_permissions')


class Appointments(Base):
    __tablename__ = 'appointments'

    id : Mapped[int] = mapped_column(primary_key=True)
    patient_id : Mapped[int] = mapped_column(ForeignKey('users.id'))
    doctor_id : Mapped[int] = mapped_column(ForeignKey('users.id'))
    date_time : Mapped[DateTime] = mapped_column(DateTime(timezone=True))
    status : Mapped[str] = mapped_column(Enum(Status), nullable=False)

    patient : Mapped['User'] = relationship(back_populates='patient_appointments', foreign_keys=[patient_id])
    doctor : Mapped['User'] = relationship(back_populates='doctor_appointments', foreign_keys=[doctor_id])

class Vitals(Base):
    __tablename__ = 'vitals'

    id : Mapped[int] = mapped_column(primary_key=True)
    patient_id : Mapped[int] = mapped_column(ForeignKey('users.id'))
    doctor_id : Mapped[int] = mapped_column(ForeignKey('users.id'))
    bp : Mapped[int] = mapped_column(nullable=False)

    patient : Mapped['User'] = relationship(back_populates='vitals', foreign_keys=[patient_id])
    doctor : Mapped['User'] = relationship(back_populates='doctor_for_patient', foreign_keys=[doctor_id])


class ChatRoom(Base):
    __tablename__ = "chat_rooms"
    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(120), nullable=False)
    created_by: Mapped[int] = mapped_column(ForeignKey("users.id"))

    # relationships
    participants: Mapped[List["ChatParticipant"]] = relationship("ChatParticipant", back_populates="chat_room", cascade="all, delete-orphan")
    messages: Mapped[List["ChatMessage"]] = relationship("ChatMessage", back_populates="chat_room", cascade="all, delete-orphan")


class ChatParticipant(Base):
    __tablename__ = "chat_participants"
    id: Mapped[int] = mapped_column(primary_key=True)
    chat_id: Mapped[int] = mapped_column(ForeignKey("chat_rooms.id"))
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"))

    chat_room: Mapped["ChatRoom"] = relationship("ChatRoom", back_populates="participants")
    # no backref to user required here; you can query users via models.User


class ChatMessage(Base):
    __tablename__ = "chat_messages"
    id: Mapped[int] = mapped_column(primary_key=True)
    chat_id: Mapped[int] = mapped_column(ForeignKey("chat_rooms.id"))
    sender_id: Mapped[int] = mapped_column(ForeignKey("users.id"))
    content: Mapped[str] = mapped_column(Text, nullable=False)
    timestamp: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow)

    chat_room: Mapped["ChatRoom"] = relationship("ChatRoom", back_populates="messages")
    # sender relationship optional:
    # sender: Mapped["User"] = relationship("User", foreign_keys=[sender_id])


class DoctorAvailability(Base):
    __tablename__ = 'doctor_availability'
    
    id: Mapped[int] = mapped_column(primary_key=True)
    doctor_id: Mapped[int] = mapped_column(ForeignKey('users.id'))
    day_of_week: Mapped[int] = mapped_column()  # 0-6 (Mon-Sun)
    start_time: Mapped[time] = mapped_column()
    end_time: Mapped[time] = mapped_column()
    appointment_duration: Mapped[int] = mapped_column()  # minutes
    break_start: Mapped[time] = mapped_column(nullable=True)
    break_end: Mapped[time] = mapped_column(nullable=True)
    is_active: Mapped[bool] = mapped_column(default=True)
    
    doctor: Mapped["User"] = relationship(back_populates="availability_settings")
    
