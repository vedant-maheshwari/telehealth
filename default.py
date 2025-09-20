import schemas, utils, models
from sqlalchemy.orm import session
from database import Base, SessionLocal, engine
from fastapi import APIRouter, FastAPI, HTTPException, Depends, Request, Query
from fastapi.responses import JSONResponse
import crud
from typing import List
from fastapi.security import OAuth2PasswordRequestForm
import auth
from family.family_routes import router as family_routes
from chat.chat import router as chat_router
from chat.chat_auth import router as chat_auth
from admin.admin_routes import router as admin_router
from realtime import router as realtime_router
import realtime
from datetime import timedelta
from fastapi.middleware.cors import CORSMiddleware
import logging
import colorlog
import traceback
from datetime import datetime, date, time
import redis.asyncio as redis
import asyncio
from contextlib import asynccontextmanager
import os
import socket

async def listen_for_expired_keys():
    pubsub = redis_client.pubsub()
    await pubsub.subscribe("__keyevent@0__:expired")
    async for message in pubsub.listen():
        if message['type'] == 'message':
            expired_key = message['data'].decode()
            # Parse expired_key to extract doctor_id, slot_time
            if expired_key.startswith("slot_hold:doctor:"):
                parts = expired_key.split(":")
                doctor_id = int(parts[2])
                slot_time = datetime.fromisoformat(parts[3])
                await realtime.notify_slot_update(doctor_id, slot_time, "freed")

@asynccontextmanager
async def lifespan(router: FastAPI):
    # Start your background task
    task = asyncio.create_task(listen_for_expired_keys())
    try:
        yield
    finally:
        # Cancel background task gracefully on shutdown
        task.cancel()
        try:
            await task
        except asyncio.CancelledError:
            pass


HOLD_TTL = 5 * 60  # 5 minutes in seconds

log_colors = {
    'DEBUG': 'cyan',
    'INFO': 'green',
    'WARNING': 'yellow',
    'ERROR': 'red',
    'CRITICAL': 'bold_red'
}


logging.basicConfig(
    level=logging.INFO,
    # format="[%(asctime)s] (line no %(lineno)s) : %(levelname)s %(message)s",
    # datefmt="%d-%m-%Y %H:%M:%S",
    handlers=[colorlog.StreamHandler()]
)


logging.getLogger().handlers[0].setFormatter(
    colorlog.ColoredFormatter(
        "%(log_color)s[%(asctime)s] (%(filename)s:%(lineno)d) : %(levelname)s %(message)s",
        datefmt="%d-%m-%Y %H:%M:%S",
        log_colors=log_colors
    )
)

Base.metadata.create_all(engine)

router = APIRouter(lifespan=lifespan)

# redis_client = redis.Redis(host='localhost', port=6379, db=0)

# Try resolving "redis" inside Docker
# try:
#     socket.gethostbyname("redis")
#     default_url = "redis://redis:6379/0"
# except socket.gaierror:
#     default_url = "redis://localhost:6379/0"

# redis_client = redis.from_url(default_url)
REDIS_URL = os.getenv("REDIS_URL")
redis_client = redis.from_url(REDIS_URL, decode_responses=True)

# @router.exception_handler(Exception)
# async def global_exception_handler(request : Request, exc : Exception):
#     # Get only the last traceback entry (the cause of the error)
#     tb = traceback.TracebackException.from_exception(exc)
#     # last_frame = "".join(tb.format_exception_only())

#     # Or if you also want the file + line:
#     formatted = "".join(tb.format())  # full traceback (many frames)
#     last_part = formatted.strip().splitlines()[-5:]  # last 3 lines usually enough

#     logging.error("\n".join(last_part))  # clean log
#     return JSONResponse(
#         status_code=500,
#         content={
#             "message": "Internal server error occurred.",
#             "details": str(exc)
#         }
#     )

# router.add_middleware(
#     CORSMiddleware,
#     allow_origins=["*"],  # for development, allow all. Later restrict to your frontend domain
#     allow_credentials=True,
#     allow_methods=["*"],
#     allow_headers=["*"],
# )


# router.include_router(family_routes)
# router.include_router(chat_router)
# router.include_router(chat_auth)
# router.include_router(admin_router)
# router.include_router(realtime_router)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@router.post('/register_patient', response_model=schemas.UsersOut)
def create_patient(patient : schemas.InsertPatient, db : session = Depends(get_db)):

    if crud.check_user_by_email(db, patient.email):
        raise HTTPException(status_code=400, detail='patient already exists')
    
    patient.password = utils.hash_password(patient.password)

    return crud.insert_patient(db, patient)


@router.post('/register_doctor', response_model=schemas.UsersOut)
def create_doctor(doctor : schemas.InsertDoctor, db : session = Depends(get_db)):

    if crud.check_user_by_email(db, doctor.email):
        raise HTTPException(status_code=400, detail='doctor already exists')

    doctor.password = utils.hash_password(doctor.password)

    return crud.insert_doctor(db, doctor)


@router.post('/register_family', response_model=schemas.UsersOut)
def create_family(family : schemas.InsertFamily, db : session = Depends(get_db)):

    if crud.check_user_by_email(db, family.email):
        HTTPException(status_code=400, detail='family member already exists')

    family.password = utils.hash_password(family.password)

    return crud.insert_family(db, family)


@router.post('/token')  # This matches your tokenUrl
def login_for_swagger(form_data: OAuth2PasswordRequestForm = Depends(), db: session = Depends(get_db)):
    # Use form_data.username as email (since users will enter email in username field)
    user = db.query(models.User).filter(models.User.email == form_data.username).first()
    if not user:
        raise HTTPException(400, "Invalid email or password")
    if not utils.verify_password(form_data.password, user.hashed_password):
        raise HTTPException(400, "Invalid email or password")
    access_token = auth.create_access_token(
        data={'sub' : user.email, 'id' : user.id, 'role' : user.role}
    )
    return {'access_token' : access_token, 'token_type' : 'bearer', 'role' : user.role, 'user_id' : user.id}


@router.get('/user/me')
def read_users_me(current_user = Depends(auth.get_current_user)):
    return current_user


@router.get('/all_doctors', response_model=List[schemas.UsersOut])
def all_users(db : session = Depends(get_db)):
    return crud.get_all_doctors(db)

@router.post('/create_appointment')
def create_appointment(appointment : schemas.BookAppointment, db : session = Depends(get_db), current_user = Depends(auth.get_current_user)):
    return crud.book_appointment(db, appointment, current_user.id)

@router.get('/get_all_appointments')
def get_all_appointments(doctor = Depends(auth.check_doctor)):
    result = []

    for router in doctor.doctor_appointments:
        result.append({
            "id": router.id,
            "title": router.patient.name,
            "start": router.date_time.isoformat(),
            "end": (router.date_time + timedelta(hours=1)).isoformat(),
            "status": router.status.value
        })

    return result

@router.put('/appointment_response')
def appointment_response(response : schemas.AppointmentResponse, db : session = Depends(get_db), doctor = Depends(auth.check_doctor)):
    return crud.appointment_response(db, response)

@router.post('/add_vital')
def add_vital(vital : schemas.Vitals_update, db : session = Depends(get_db), doctor = Depends(auth.check_doctor)):
    result = crud.add_vital(vital,doctor.id, db)
    if result is None:
        raise HTTPException(status_code=404, detail='patient not found')
    else:
        return result
    
@router.get('/get_vital')
def get_vital(patient = Depends(auth.check_patient)):
    return crud.get_vitals(patient)


@router.post('/doctor/set_availability')
def set_doctor_availability(
    request: schemas.SetAvailabilityRequest, 
    doctor = Depends(auth.check_doctor),
    db: session = Depends(get_db)
):
    return crud.set_doctor_availability(request, doctor.id, db)

@router.get('/doctor/availability')
def get_doctor_availability(
    doctor = Depends(auth.check_doctor),  # Ensure only doctors can access
    db: session = Depends(get_db)
):
    """
    Get the doctor's availability settings (working hours, appointment duration, etc.)
    """
    # Query the doctor's availability from database
    availability_records = db.query(models.DoctorAvailability).filter(
        models.DoctorAvailability.doctor_id == doctor.id,
        models.DoctorAvailability.is_active == True
    ).all()
    
    if not availability_records:
        # Return empty response if no availability set
        return {
            "availabilities": [],
            "message": "No availability settings found. Please set your working hours."
        }
    
    # Format the response
    availabilities = []
    for record in availability_records:
        availabilities.append({
            "day_of_week": record.day_of_week,
            "start_time": record.start_time.strftime("%H:%M"),
            "end_time": record.end_time.strftime("%H:%M"),
            "appointment_duration": record.appointment_duration,
            "break_start": record.break_start.strftime("%H:%M") if record.break_start else None,
            "break_end": record.break_end.strftime("%H:%M") if record.break_end else None
        })
    
    return {
        "availabilities": availabilities,
        "doctor_id": doctor.id,
        "doctor_name": doctor.name
    }

@router.get('/available_appointment')
async def get_available_appointment(
    app_date : date,
    doctor_id : int,
    db: session = Depends(get_db),
):
    return await crud.get_doctor_free_slots(doctor_id, app_date, db)

@router.post('/reserve_slot')
async def reserve_slot(appointment : schemas.BookAppointment, user_id: int):
    
    slot_reserve_key = crud.make_slot_key(appointment.doctor_id, appointment.appointment_date)
    success = await redis_client.set(slot_reserve_key, user_id, ex=HOLD_TTL, nx=True) #NX = "Not eXists" = Only set if key does not exist.

    if not success:
        raise HTTPException(status_code=409, detail='Slot already reserved by another user')

    await realtime.notify_slot_update(
        doctor_id=appointment.doctor_id,
        slot_time=appointment.appointment_date,
        action="reserved"
    )

    return {"message": "Slot reserved", "expires_in": HOLD_TTL}

@router.post('/confirm_slot')
async def confirm_slot(appointment : schemas.BookAppointment, user_id: int = Query(...), db : session = Depends(get_db)):
    
    slot_reserve_key = crud.make_slot_key(appointment.doctor_id, appointment.appointment_date)
    holder = await redis_client.get(slot_reserve_key)

    if holder is None:
        raise HTTPException(410, "Reservation expired or not found")
    if int(holder.decode()) != user_id:
        raise HTTPException(403, "You do not hold this reservation")
    
    booking = crud.book_appointment(db, appointment, user_id)

    if not booking:
        HTTPException(status_code=409, detail='booking cannot be processed')

    await redis_client.delete(slot_reserve_key)

    await redis_client.aclose()

    return {"message": "Booking confirmed", "slot_time": appointment.appointment_date}


@router.post("/cancel_slot")
async def cancel_slot(doctor_id: int, slot_time: datetime, user_id: int):
    key = crud.make_slot_key(doctor_id, slot_time)
    holder = await redis_client.get(key)
    if holder and int(holder) == user_id:
        await redis_client.delete(key)
        await realtime.notify_slot_update(doctor_id, slot_time, "freed")
        return {"message": "Reservation cancelled and slot freed"}
    raise HTTPException(404, "No active reservation found")

@router.get('/patient/appointments')
def get_patient_appointments(
    current_user = Depends(auth.check_patient),  # Only patients can access
    db: session = Depends(get_db)
):
    """Get appointments for the current patient"""
    appointments = db.query(models.Appointments).filter(
        models.Appointments.patient_id == current_user.id
    ).all()
    
    return appointments
    

