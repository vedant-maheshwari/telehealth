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
    date_of_birth: Optional[datetime]  # Changed from date to datetime
    medical_license: Optional[str] = None
    
    class Config:
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

class VitalsCreate(BaseModel):
    patient_email: EmailStr
    bp: Optional[int] = None
    heart_rate: Optional[int] = None
    temperature: Optional[float] = None
    notes: Optional[str] = None

class ChatCreateWithEmails(BaseModel):
    name: str
    participant_emails: List[EmailStr]


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


class AppointmentDetailOut(BaseModel):
    id: int
    doctor_id: int
    doctor_name: str
    doctor_email: str
    appointment_date: str
    appointment_time: str
    appointment_day: str
    status: str
    status_display: str
    can_cancel: bool
    created_at: str
    
    class Config:
        from_attributes = True

class AppointmentCancelResponse(BaseModel):
    message: str
    appointment_id: int
    status: str

class FamilyPermissionUpdate(BaseModel):
    can_view_records: Optional[bool] = None
    can_book_appointments: Optional[bool] = None
    can_message_doctor: Optional[bool] = None
    can_view_vitals: Optional[bool] = None
    can_manage_family: Optional[bool] = None

class FamilyMemberPermissions(BaseModel):
    family_member_id: int
    name: str
    email: EmailStr
    relationship_type: str
    permissions: dict
    
    class Config:
        from_attributes = True

class MyFamilyPermissions(BaseModel):
    patient_id: int
    patient_name: str
    patient_email: EmailStr
    relationship_type: str
    permissions: dict
    
    class Config:
        from_attributes = True