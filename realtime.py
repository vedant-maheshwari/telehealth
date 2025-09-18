from fastapi import WebSocket, WebSocketDisconnect, APIRouter
from typing import List
import json
from datetime import datetime

router = APIRouter()

class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        self.active_connections.remove(websocket)

    async def broadcast(self, message: str):
        for connection in self.active_connections:
            await connection.send_text(message)

manager = ConnectionManager()

@router.websocket("/ws/doctor/{doctor_id}/slots")
async def websocket_endpoint(websocket: WebSocket, doctor_id: int):
    await manager.connect(websocket)
    try:
        while True:
            # Keep connection alive; clients don't necessarily need to send data
            await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(websocket)


async def notify_slot_update(doctor_id: int, slot_time: datetime, action: str):
    """
    action: 'reserved' or 'freed'
    """
    message = {
        "doctor_id": doctor_id,
        "slot_time": slot_time.isoformat(),
        "action": action
    }
    await manager.broadcast(json.dumps(message))
