from fastapi import FastAPI, APIRouter, Depends, HTTPException
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
         

