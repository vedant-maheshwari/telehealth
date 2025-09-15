from fastapi import Depends, APIRouter, HTTPException
from database import engine, SessionLocal, Base, get_db
import models, schemas, auth
from sqlalchemy.orm import session
import crud
from typing import List
from sqlalchemy.orm import Session
from models import ChatRoom

router = APIRouter(prefix='/admin',tags=['admin'])

Base.metadata.create_all(engine)

@router.get('/all_users', response_model=List[schemas.UsersOut])
def all_users(db : session = Depends(get_db), current_user = Depends(auth.check_admin)):
    return crud.get_all_users(db)


@router.delete('/delete_user/' )
def delete_user(user_id : int, current_user = Depends(auth.check_admin) , db : session = Depends(get_db)):
    user = crud.get_specific_user(db, user_id)
    
    if not user:
        raise HTTPException(status_code=404, detail='User not found')
    
    db.delete(user)
    db.commit()
    return {'message' : 'user deleted successfully'}


@router.post("/rooms/create")
def create_room(doctor_id: int, patient_id: int, db: Session = Depends(get_db), user=Depends(auth.check_admin)):
    chat = ChatRoom(doctor_id=doctor_id, patient_id=patient_id)
    db.add(chat)
    db.commit()
    db.refresh(chat)
    return {"chat_id": chat.id, "message": "Room created"}

@router.delete("/rooms/{room_id}")
def delete_room(room_id: int, db: Session = Depends(get_db), user=Depends(auth.check_admin)):
    chat = db.query(ChatRoom).filter(ChatRoom.id == room_id).first()
    if not chat:
        raise HTTPException(status_code=404, detail="Room not found")
    db.delete(chat)
    db.commit()
    return {"message": f"Room {room_id} deleted"}

@router.put("/rooms/{room_id}/stop")
def stop_room(room_id: int, db: Session = Depends(get_db), user=Depends(auth.check_admin)):
    chat = db.query(ChatRoom).filter(ChatRoom.id == room_id).first()
    if not chat:
        raise HTTPException(status_code=404, detail="Room not found")
    # simplest approach = delete; or you can add a "status" column to mark inactive
    db.delete(chat)
    db.commit()
    return {"message": f"Room {room_id} stopped"}

@router.get("/all", response_model=list[schemas.ChatRoomOut])
def get_all_chats(current_user: models.User = Depends(auth.check_admin)):
    
    db = SessionLocal()
    chats = db.query(models.ChatRoom).all()
    db.close()
    return chats