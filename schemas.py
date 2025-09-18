from pydantic import BaseModel, EmailStr
from datetime import date, datetime, time
from typing import Optional, List
from enum import Enum

class UserBase(BaseModel):
    name : str
    email : EmailStr
    password : str
    date_of_birth : date

class InsertPatient(UserBase):
    pass

class InsertFamily(UserBase):
    pass

class InsertDoctor(UserBase):
    medical_license : str

class PatientLogin(BaseModel):
    email : EmailStr
    password : str

class UsersOut(BaseModel):
    id: int
    name: str
    email: EmailStr
    role: str
    date_of_birth: Optional[date]
    medical_license: Optional[str] = None  # only for doctors

    class config:
        from_attributes = True


class RelationshipType(str, Enum):
    SPOUSE = 'spouse'
    SIBLING = 'sibling'
    PARENT = 'parent'

class Status(str, Enum):
    PENDING = 'pending'
    REJECTED = 'rejected'
    ACCECPTED = 'accepted'

class FamilyConnectionRequest(BaseModel):
    patient_id : int
    family_member_email : EmailStr
    relationship_type : RelationshipType

class FamilyPermissionUpdate(BaseModel):
    patient_id: int
    family_member_id: int
    can_view_records: Optional[bool] = None
    can_book_appointments: Optional[bool] = None
    can_message_doctor: Optional[bool] = None

class FamilyConnectionResponse(BaseModel):
    id: int
    patient_id: int
    family_member_id: int
    relationship_type: RelationshipType

    class Config:
        from_attributes = True

class InvitationRequest(BaseModel):
    invitee_email: EmailStr
    relationship_type : RelationshipType

class InvitationOut(BaseModel):
    id: int
    inviter_name: str
    relationship_type: str
    token: str   # <-- we still send it, but frontend won’t display it

class InvitationResponse(BaseModel):
    token: str
    action: str  # "accept" or "reject"

class BookAppointment(BaseModel):
    doctor_id : int
    appointment_date : datetime

class AppointmentResponse(BaseModel):
    appointment_id : int
    action : str  # "accept" or "reject"

class Vitals_update(BaseModel):
    patient_email : EmailStr
    bp : int


class CreateChatRoomIn(BaseModel):
    name: str
    participant_ids: List[int]  # patient + family ids

class ChatRoomOut(BaseModel):
    id: int
    name: str
    created_by: int

    class Config:
        from_attributes = True

class ChatMessageOut(BaseModel):
    id: int
    chat_id: int
    sender_id: int
    content: str
    timestamp: str

    class Config:
        from_attributes = True

class DoctorAvailability(BaseModel):
    day_of_week: int  # 0=Monday, 6=Sunday
    start_time: time
    end_time: time
    appointment_duration: int  # minutes
    break_start: Optional[time] = None
    break_end: Optional[time] = None

class SetAvailabilityRequest(BaseModel):
    availabilities: List[DoctorAvailability]