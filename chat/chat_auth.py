# routers/chat_auth.py
from fastapi import APIRouter, Depends, HTTPException
from datetime import datetime, timedelta
from jose import jwt
import auth  # your existing auth module
from sqlalchemy.orm import Session
from database import get_db

router = APIRouter(tags=["chat-auth"])

# Use a separate key for WS tokens (you can also derive from auth.SECRET_KEY)
WS_SECRET_KEY = getattr(auth, "WS_SECRET_KEY", auth.SECRET_KEY + "_ws")
WS_ALGORITHM = getattr(auth, "WS_ALGORITHM", auth.ALGORITHM)
WS_TOKEN_EXPIRE_SECONDS = 60  # short-lived

@router.post("/ws-token")
def generate_ws_token(current_user = Depends(auth.get_current_user)):
    """
    Returns a short-lived token for WebSocket authentication.
    Frontend should POST here with Authorization: Bearer <jwt>
    """
    expire = datetime.utcnow() + timedelta(seconds=WS_TOKEN_EXPIRE_SECONDS)
    payload = {"sub": str(current_user.id), "exp": expire}
    token = jwt.encode(payload, WS_SECRET_KEY, algorithm=WS_ALGORITHM)
    return {"ws_token": token, "expires_in": WS_TOKEN_EXPIRE_SECONDS}
