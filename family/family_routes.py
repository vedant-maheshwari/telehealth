from fastapi import FastAPI, APIRouter, Depends, HTTPException
import crud
from database import engine, SessionLocal, Base, get_db
import models, schemas, auth
from sqlalchemy.orm import Session
from family.crud import send_invitation, respond_invitation
from typing import List


router = APIRouter(prefix='/family', tags=['Family'])

Base.metadata.create_all(engine)

@router.post('/send_invitation')
def send_invitation_route(request : schemas.InvitationRequest, db : Session = Depends(get_db), current_user = Depends(auth.get_current_user)):
    invitation = send_invitation(db, current_user.id, request.invitee_email, request.relationship_type)

    if not invitation:
        raise HTTPException(404, detail='Invitation not found')
    
    return {'token' : invitation.token, 'status' : invitation.status}


@router.put('/respond_invitation')
def respond(response : schemas.InvitationResponse, db : Session = Depends(get_db)):
    result = respond_invitation(db, response.token, response.action)

    if not result:
         raise HTTPException(status_code=404, detail="Invitation not found")
    return {"status": response.action}

@router.get('/family_invitation_table')
def table(db : Session = Depends(get_db)):
        # Convert to list of dicts
        invitations = db.query(models.FamilyInvitations).all()
        result = []
        for inv in invitations:
            result.append({
                "id": inv.id,
                "inviter_id": inv.inviter_id,
                "invitee_id": inv.invitee_id,
                "relationship_type": inv.relationship_type,
                "token": inv.token,
                "status": inv.status.name  # if Enum
            })
        
        return result

@router.get('/family_invitation_for_current_user', response_model=List[schemas.InvitationOut])
def table(db : Session = Depends(get_db), current_user = Depends(auth.get_current_user)):
        invitations = db.query(models.FamilyInvitations).filter(
                models.FamilyInvitations.invitee_id == current_user.id,
                models.FamilyInvitations.status == "pending").all()
         

            # Build the Pydantic response manually
        result = []
        for inv in invitations:
            inviter = db.query(models.User).filter(models.User.id == inv.inviter_id).first()
            result.append({
                "id": inv.id,
                "inviter_name": inviter.name if inviter else "Unknown",
                "relationship_type": inv.relationship_type,
                "token": inv.token
            })
        return result


@router.delete('/family_invitation/{invitation_id}', status_code=204)
def delete_invitation(invitation_id: int, db: Session = Depends(get_db)):
    # Fetch the invitation
    invitation = db.query(models.FamilyInvitations).filter(models.FamilyInvitations.id == invitation_id).first()
    
    if not invitation:
        raise HTTPException(status_code=404, detail="Invitation not found")
    
    db.delete(invitation)
    db.commit()
    
    return {"detail": "Invitation deleted successfully"}


@router.get('/get_all_family_members')
def all_family_members(current_user = Depends(auth.get_current_user)):
    result = []
    for connection in current_user.family_connections:
         result.append({
            "id": connection.family_member.id,
            "name": connection.family_member.name,
            "relationship_type": connection.relationship_type
        })
    return result


@router.get('/get_related_family_members')
def all_family_members(current_user = Depends(auth.get_current_user)):
    result = []
    for connection in current_user.related_as_family:
         result.append({
            "id": connection.family_member.id,
            "name": connection.family_member.name,
            "relationship_type": connection.relationship_type
        })
    return result

@router.get('/permissions/{patient_id}')
def get_family_permissions(
    patient_id: int,
    current_user = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    """Get family permissions for a patient (accessible by patient or their family members)"""
    
    # Check if current user is the patient or a family member
    is_patient = current_user.id == patient_id
    is_family_member = False
    
    if not is_patient:
        # Check if current user is a family member of this patient
        family_connection = db.query(models.FamilyConnections).filter(
            models.FamilyConnections.patient_id == patient_id,
            models.FamilyConnections.family_member_id == current_user.id
        ).first()
        is_family_member = family_connection is not None
    
    if not (is_patient or is_family_member):
        raise HTTPException(status_code=403, detail="Access denied")
    
    # Get all family members and their permissions
    family_members = db.query(models.FamilyConnections).filter(
        models.FamilyConnections.patient_id == patient_id
    ).all()
    
    result = []
    for connection in family_members:
        family_member = connection.family_member
        
        # Get permissions for this family member
        permissions = db.query(models.FamilyPermissions).filter(
            models.FamilyPermissions.family_member_id == family_member.id
        ).first()
        
        permission_list = permissions.permissions if permissions else []
        
        result.append({
            "family_member_id": family_member.id,
            "name": family_member.name,
            "email": family_member.email,
            "relationship_type": connection.relationship_type,
            "permissions": {
                "can_view_records": "view_records" in permission_list,
                "can_book_appointments": "book_appointments" in permission_list,
                "can_message_doctor": "message_doctor" in permission_list,
                "can_view_vitals": "view_vitals" in permission_list,
                "can_manage_family": "manage_family" in permission_list
            }
        })
    
    return result

@router.put('/permissions/{family_member_id}')
def update_family_permissions(
    family_member_id: int,
    permission_update: schemas.FamilyPermissionUpdate,
    current_user = Depends(auth.check_patient),  # Only patients can update permissions
    db: Session = Depends(get_db)
):
    """Update permissions for a family member"""
    
    # Verify that the family member belongs to the current patient
    family_connection = db.query(models.FamilyConnections).filter(
        models.FamilyConnections.patient_id == current_user.id,
        models.FamilyConnections.family_member_id == family_member_id
    ).first()
    
    if not family_connection:
        raise HTTPException(status_code=404, detail="Family member not found")
    
    # Get or create permissions record
    permissions_record = db.query(models.FamilyPermissions).filter(
        models.FamilyPermissions.family_member_id == family_member_id
    ).first()
    
    if not permissions_record:
        permissions_record = models.FamilyPermissions(
            family_member_id=family_member_id,
            permissions=[]
        )
        db.add(permissions_record)
    
    # Update permissions list
    current_permissions = set(permissions_record.permissions or [])
    
    if permission_update.can_view_records is not None:
        if permission_update.can_view_records:
            current_permissions.add("view_records")
        else:
            current_permissions.discard("view_records")
    
    if permission_update.can_book_appointments is not None:
        if permission_update.can_book_appointments:
            current_permissions.add("book_appointments")
        else:
            current_permissions.discard("book_appointments")
    
    if permission_update.can_message_doctor is not None:
        if permission_update.can_message_doctor:
            current_permissions.add("message_doctor")
        else:
            current_permissions.discard("message_doctor")
    
    # Add view_vitals permission handling
    if permission_update.can_view_vitals is not None:
        if permission_update.can_view_vitals:
            current_permissions.add("view_vitals")
        else:
            current_permissions.discard("view_vitals")
    
    # Add manage_family permission handling
    if permission_update.can_manage_family is not None:
        if permission_update.can_manage_family:
            current_permissions.add("manage_family")
        else:
            current_permissions.discard("manage_family")
    
    permissions_record.permissions = list(current_permissions)
    
    # If messaging permission is being granted, add family member to all patient's chat rooms
    if permission_update.can_message_doctor and "message_doctor" in current_permissions:
        print(f"🔗 Adding family member {family_member_id} to patient {current_user.id}'s chats")
        
        # Get all chat rooms for this patient
        patient_chats = db.query(models.ChatRoom).filter(
            models.ChatRoom.patient_id == current_user.id
        ).all()
        
        if not patient_chats:
            # If no patient_id set, find by participants
            patient_chats = (
                db.query(models.ChatRoom)
                .join(models.ChatParticipant, models.ChatParticipant.chat_id == models.ChatRoom.id)
                .filter(models.ChatParticipant.user_id == current_user.id)
                .all()
            )
        
        added_to_chats = 0
        for chat in patient_chats:
            # Check if family member is already a participant
            existing_participant = db.query(models.ChatParticipant).filter(
                models.ChatParticipant.chat_id == chat.id,
                models.ChatParticipant.user_id == family_member_id
            ).first()
            
            if not existing_participant:
                # Add family member as participant
                new_participant = models.ChatParticipant(
                    chat_id=chat.id,
                    user_id=family_member_id
                )
                db.add(new_participant)
                added_to_chats += 1
                print(f"✅ Added family member {family_member_id} to chat {chat.id}")
        
        print(f"🎉 Added family member to {added_to_chats} chat rooms")
    
    db.commit()
    db.refresh(permissions_record)
    
    return {
        "message": "Permissions updated successfully",
        "family_member_id": family_member_id,
        "permissions": {
            "can_view_records": "view_records" in current_permissions,
            "can_book_appointments": "book_appointments" in current_permissions,
            "can_message_doctor": "message_doctor" in current_permissions,
            "can_view_vitals": "view_vitals" in current_permissions,
            "can_manage_family": "manage_family" in current_permissions
        }
    }


@router.get('/permissions/my')
def get_my_family_permissions(
    current_user = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    """Get permissions that the current user has as a family member"""
    
    # Get all patients for whom current user is a family member
    family_connections = db.query(models.FamilyConnections).filter(
        models.FamilyConnections.family_member_id == current_user.id
    ).all()
    
    result = []
    for connection in family_connections:
        patient = connection.patient
        
        # Get permissions for this patient
        permissions = db.query(models.FamilyPermissions).filter(
            models.FamilyPermissions.family_member_id == current_user.id
        ).first()
        
        permission_list = permissions.permissions if permissions else []
        
        result.append({
            "patient_id": patient.id,
            "patient_name": patient.name,
            "patient_email": patient.email,
            "relationship_type": connection.relationship_type,
            "permissions": {
                "can_view_records": "view_records" in permission_list,
                "can_book_appointments": "book_appointments" in permission_list,
                "can_message_doctor": "message_doctor" in permission_list,
                "can_view_vitals": "view_vitals" in permission_list,
                "can_manage_family": "manage_family" in permission_list
            }
        })
    
    return result


@router.get('/permissions/check')
def check_family_permissions(
    patient_id: int,
    current_user = Depends(auth.check_family),
    db: Session = Depends(get_db)
):
    """Check what permissions the current family member has for a specific patient"""
    
    # Verify family member relationship
    family_connection = db.query(models.FamilyConnections).filter(
        models.FamilyConnections.patient_id == patient_id,
        models.FamilyConnections.family_member_id == current_user.id
    ).first()
    
    if not family_connection:
        raise HTTPException(status_code=403, detail="No family relationship found")
    
    # Get permissions
    permissions = db.query(models.FamilyPermissions).filter(
        models.FamilyPermissions.family_member_id == current_user.id
    ).first()
    
    permission_list = permissions.permissions if permissions else []
    
    return {
        "patient_id": patient_id,
        "patient_name": family_connection.patient.name,
        "relationship_type": family_connection.relationship_type,
        "permissions": {
            "can_view_records": "view_records" in permission_list,
            "can_book_appointments": "book_appointments" in permission_list,
            "can_message_doctor": "message_doctor" in permission_list,
            "can_view_vitals": "view_vitals" in permission_list,
            "can_manage_family": "manage_family" in permission_list
        }
    }

@router.get('/my-patients')
def get_my_patients(
    current_user = Depends(auth.check_family),
    db: Session = Depends(get_db)
):
    """Get all patients that this family member has access to"""
    
    family_connections = db.query(models.FamilyConnections).filter(
        models.FamilyConnections.family_member_id == current_user.id
    ).all()
    
    result = []
    for connection in family_connections:
        patient = connection.patient
        
        # Get permissions
        permissions = db.query(models.FamilyPermissions).filter(
            models.FamilyPermissions.family_member_id == current_user.id
        ).first()
        
        permission_list = permissions.permissions if permissions else []
        
        result.append({
            "patient_id": patient.id,
            "patient_name": patient.name,
            "patient_email": patient.email,
            "relationship_type": connection.relationship_type,
            "permissions": {
                "can_view_records": "view_records" in permission_list,
                "can_book_appointments": "book_appointments" in permission_list,
                "can_message_doctor": "message_doctor" in permission_list,
                "can_view_vitals": "view_vitals" in permission_list,
                "can_manage_family": "manage_family" in permission_list
            }
        })
    
    return result

@router.post('/book-appointment/{patient_id}')
def family_book_appointment(
    patient_id: int,
    appointment: schemas.BookAppointment,
    current_user = Depends(auth.check_family),
    db: Session = Depends(get_db)
):
    """Allow family member to book appointment for patient if they have permission"""
    
    # Check family relationship
    family_connection = db.query(models.FamilyConnections).filter(
        models.FamilyConnections.patient_id == patient_id,
        models.FamilyConnections.family_member_id == current_user.id
    ).first()
    
    if not family_connection:
        raise HTTPException(status_code=403, detail="No family relationship found")
    
    # Check permissions
    permissions = db.query(models.FamilyPermissions).filter(
        models.FamilyPermissions.family_member_id == current_user.id
    ).first()
    
    permission_list = permissions.permissions if permissions else []
    
    if "book_appointments" not in permission_list:
        raise HTTPException(status_code=403, detail="No permission to book appointments")
    
    # Book appointment for the patient
    return crud.book_appointment(db, appointment, patient_id)

@router.get('/patient-appointments/{patient_id}')
def get_patient_appointments_for_family(
    patient_id: int,
    current_user = Depends(auth.check_family),
    db: Session = Depends(get_db)
):
    """Get patient appointments if family member has view_records permission"""
    
    # Check family relationship
    family_connection = db.query(models.FamilyConnections).filter(
        models.FamilyConnections.patient_id == patient_id,
        models.FamilyConnections.family_member_id == current_user.id
    ).first()
    
    if not family_connection:
        raise HTTPException(status_code=403, detail="No family relationship found")
    
    # Check permissions
    permissions = db.query(models.FamilyPermissions).filter(
        models.FamilyPermissions.family_member_id == current_user.id
    ).first()
    
    permission_list = permissions.permissions if permissions else []
    
    if "view_records" not in permission_list:
        raise HTTPException(status_code=403, detail="No permission to view appointments")
    
    # Get appointments
    appointments = db.query(models.Appointments).filter(
        models.Appointments.patient_id == patient_id
    ).all()
    
    result = []
    for appointment in appointments:
        doctor_info = db.query(models.User).filter(models.User.id == appointment.doctor_id).first()
        
        result.append({
            "id": appointment.id,
            "doctor_id": appointment.doctor_id,
            "doctor_name": doctor_info.name if doctor_info else "Unknown Doctor",
            "appointment_date": appointment.date_time.isoformat(),
            "appointment_time": appointment.date_time.strftime("%I:%M %p"),
            "appointment_day": appointment.date_time.strftime("%A, %B %d, %Y"),
            "status": appointment.status.value,
            "status_display": appointment.status.value.title(),
            "can_cancel": False  # Family members typically can't cancel
        })
    
    return result

@router.get('/patient-vitals/{patient_id}')
def get_patient_vitals_for_family(
    patient_id: int,
    current_user = Depends(auth.check_family),
    db: Session = Depends(get_db)
):
    """Get patient vitals if family member has view_records permission"""
    
    # Check family relationship
    family_connection = db.query(models.FamilyConnections).filter(
        models.FamilyConnections.patient_id == patient_id,
        models.FamilyConnections.family_member_id == current_user.id
    ).first()
    
    if not family_connection:
        raise HTTPException(status_code=403, detail="No family relationship found")
    
    # Check permissions - FIXED: Check for view_records instead of view_vitals
    permissions = db.query(models.FamilyPermissions).filter(
        models.FamilyPermissions.family_member_id == current_user.id
    ).first()
    
    permission_list = permissions.permissions if permissions else []
    
    # CHANGED: "view_vitals" -> "view_records"
    if "view_records" not in permission_list:
        raise HTTPException(status_code=403, detail="No permission to view medical records")
    
    # Get patient
    patient = db.query(models.User).filter(models.User.id == patient_id).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
    
    return crud.get_vitals(patient)

@router.get("/patient-records/{patient_id}")
def get_patient_records_for_family(
    patient_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.check_family)
):
    """
    Family members can fetch vitals for a patient if they have view_records permission.
    """
    # Verify family relationship
    fc = db.query(models.FamilyConnections).filter(
        models.FamilyConnections.patient_id == patient_id,
        models.FamilyConnections.family_member_id == current_user.id
    ).first()
    if not fc:
        raise HTTPException(status_code=403, detail="No access to this patient")

    # Check view_records permission
    fp = db.query(models.FamilyPermissions).filter(
        models.FamilyPermissions.family_member_id == current_user.id
    ).first()
    if not fp or "view_records" not in fp.permissions:
        raise HTTPException(status_code=403, detail="No permission to view records")

    # Fetch vitals
    vitals = db.query(models.Vitals).filter(
        models.Vitals.patient_id == patient_id
    ).order_by(models.Vitals.timestamp.desc()).all()
    return vitals



# Helper function to check family permissions
def check_family_permission(patient_id: int, permission: str, family_member_id: int, db: Session):
    """Helper function to check if family member has specific permission for patient"""
    
    # Check family relationship
    family_connection = db.query(models.FamilyConnections).filter(
        models.FamilyConnections.patient_id == patient_id,
        models.FamilyConnections.family_member_id == family_member_id
    ).first()
    
    if not family_connection:
        return False
    
    # Check permissions
    permissions = db.query(models.FamilyPermissions).filter(
        models.FamilyPermissions.family_member_id == family_member_id
    ).first()
    
    permission_list = permissions.permissions if permissions else []
    return permission in permission_list

@router.post('/add-family-to-chats/{patient_id}')
def add_family_to_patient_chats(
    patient_id: int,
    current_user = Depends(auth.check_family),
    db: Session = Depends(get_db)
):
    """Add family member to all chat rooms of a patient they have access to"""
    
    # Verify family connection
    family_connection = db.query(models.FamilyConnections).filter(
        models.FamilyConnections.patient_id == patient_id,
        models.FamilyConnections.family_member_id == current_user.id
    ).first()
    
    if not family_connection:
        raise HTTPException(status_code=403, detail="No family relationship found")
    
    # Check permissions
    permissions = db.query(models.FamilyPermissions).filter(
        models.FamilyPermissions.family_member_id == current_user.id
    ).first()
    
    permission_list = permissions.permissions if permissions else []
    
    if "message_doctor" not in permission_list:
        raise HTTPException(status_code=403, detail="No permission to message doctor")
    
    # Get all chat rooms for this patient
    patient_chats = db.query(models.ChatRoom).filter(
        models.ChatRoom.patient_id == patient_id
    ).all()
    
    if not patient_chats:
        # Fallback: find by participants
        patient_chats = (
            db.query(models.ChatRoom)
            .join(models.ChatParticipant, models.ChatParticipant.chat_id == models.ChatRoom.id)
            .filter(models.ChatParticipant.user_id == patient_id)
            .all()
        )
    
    added_count = 0
    for chat in patient_chats:
        existing_participant = db.query(models.ChatParticipant).filter(
            models.ChatParticipant.chat_id == chat.id,
            models.ChatParticipant.user_id == current_user.id
        ).first()
        
        if not existing_participant:
            new_participant = models.ChatParticipant(
                chat_id=chat.id,
                user_id=current_user.id
            )
            db.add(new_participant)
            added_count += 1
    
    db.commit()
    
    return {
        "message": f"Added to {added_count} chat rooms",
        "patient_id": patient_id,
        "added_to_chats": added_count
    }

    


         

