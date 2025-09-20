from jose import jwt, JWTError
from datetime import datetime, timedelta
from fastapi import Depends, HTTPException
from fastapi.security import OAuth2PasswordBearer
import models
from sqlalchemy.orm import Session
from database import get_db
import os

oauth2_schema = OAuth2PasswordBearer(tokenUrl='token')

SECRET_KEY = os.getenv('SECRET_KEY')
ALGORITHM = os.getenv('ALGORITHM')
ACCESS_TOKEN_EXPIRE_TIME = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", 30))

def create_access_token(data : dict):
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_TIME)
    to_encode.update({'exp' : expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

def decode_token(token : str = Depends(oauth2_schema)):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_email = payload.get('id')
        if user_email is None:
            raise HTTPException(401, 'invalid token')
        
    except JWTError:
        raise HTTPException(status_code=401, detail="Token is invalid or expired")
    
    
def get_current_user(token: str = Depends(oauth2_schema), db: Session = Depends(get_db)):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id = payload.get("id")
        if user_id is None:
            raise HTTPException(status_code=401, detail="Invalid token")
    except JWTError:
        raise HTTPException(status_code=401, detail="Token is invalid or expired")

    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user


def check_doctor(user = Depends(get_current_user)):
    if user.role == 'doctor':
        return user
    raise HTTPException(401, 'only doctor can view')

def check_patient(user = Depends(get_current_user)):
    if user.role == 'patient':
        return user
    raise HTTPException(401, 'only patient can view')

def check_family(user = Depends(get_current_user)):
    if user.role == 'family':
        return user
    raise HTTPException(401, 'only family can view')

def check_admin(user = Depends(get_current_user)):
    if user.role == 'admin':
        return user
    raise HTTPException(401, 'only admin can access')