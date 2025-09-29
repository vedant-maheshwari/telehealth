from dotenv import load_dotenv
load_dotenv()

from fastapi.staticfiles import StaticFiles
import schemas, utils, models
from sqlalchemy.orm import session
from database import Base, SessionLocal, engine
from fastapi import APIRouter, FastAPI, HTTPException, Depends, Request, Query
from fastapi.responses import JSONResponse, RedirectResponse
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
from datetime import datetime, date
import time
import redis.asyncio as redis
import asyncio
from contextlib import asynccontextmanager
import os
import socket
from starlette.middleware.base import BaseHTTPMiddleware




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
async def lifespan(app: FastAPI):
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

app = FastAPI(lifespan=lifespan)

app.mount("/frontend", StaticFiles(directory="frontend", html=True), name="frontend")

# api_router = APIRouter()

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

@app.exception_handler(Exception)
async def global_exception_handler(request : Request, exc : Exception):
    # Get only the last traceback entry (the cause of the error)
    tb = traceback.TracebackException.from_exception(exc)
    # last_frame = "".join(tb.format_exception_only())

    # Or if you also want the file + line:
    formatted = "".join(tb.format())  # full traceback (many frames)
    last_part = formatted.strip().splitlines()[-5:]  # last 3 lines usually enough

    logging.error("\n".join(last_part))  # clean log
    return JSONResponse(
        status_code=500,
        content={
            "message": "Internal server error occurred.",
            "details": str(exc)
        }
    )

# app.add_middleware(
#     CORSMiddleware,
#     allow_origins=["*"],  # for development, allow all. Later restrict to your frontend domain
#     allow_credentials=True,
#     allow_methods=["*"],
#     allow_headers=["*"],
# )

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://localhost:8080", 
        "http://127.0.0.1:8000",
        "https://telehealth-webapp-123.azurewebsites.net",  # Add your Azure domain
        "https://*.azurewebsites.net"  # Allow all Azure subdomains
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

os.makedirs("logs", exist_ok=True)

class RequestLoggingMiddleware(BaseHTTPMiddleware):
    def __init__(self, app):
        super().__init__(app)
        # Paths to exclude from logging (admin dashboard polling)
        self.excluded_paths = [
            "/admin/logs/recent",
            "/admin/analytics/overview", 
            "/favicon.ico",
            "/apple-touch-icon.png",
            "/apple-touch-icon-precomposed.png"
        ]
        
        # Rate limiting for specific endpoints
        self.rate_limited = {}
        self.rate_limit_seconds = 30  # Only log once per 30 seconds for admin endpoints
    
    def should_log_request(self, request: Request) -> bool:
        """Determine if request should be logged"""
        path = str(request.url.path)
        
        # Skip excluded paths completely
        if any(excluded in path for excluded in self.excluded_paths):
            return False
        
        # Rate limit admin endpoints
        if path.startswith("/admin/"):
            current_time = time.time()
            last_logged = self.rate_limited.get(path, 0)
            
            if current_time - last_logged < self.rate_limit_seconds:
                return False  # Skip logging
            else:
                self.rate_limited[path] = current_time
                return True
        
        return True
    
    async def dispatch(self, request: Request, call_next):
        start_time = time.time()
        
        # Get client IP address
        client_host = request.client.host if request.client else "unknown"
        client_port = request.client.port if request.client else 0
        
        # Check forwarded headers for real IP (useful behind proxy/load balancer)
        real_ip = request.headers.get("X-Forwarded-For", "").split(",")[0].strip()
        if real_ip:
            client_host = real_ip
        elif request.headers.get("X-Real-IP"):
            client_host = request.headers.get("X-Real-IP")
        
        should_log = self.should_log_request(request)
        
        response = await call_next(request)
        
        if should_log:
            # Calculate processing time
            process_time = time.time() - start_time
            
            # Create log entry in the desired format
            timestamp = datetime.utcnow().strftime('%Y-%m-%dT%H:%M:%S.%fZ')
            status_text = self.get_status_text(response.status_code)
            
            log_entry = f'INFO:     {client_host}:{client_port} - "{request.method} {request.url.path} HTTP/1.1" {response.status_code} {status_text}'
            
            # Add query parameters if they exist
            if request.url.query:
                log_entry = f'INFO:     {client_host}:{client_port} - "{request.method} {request.url.path}?{request.url.query} HTTP/1.1" {response.status_code} {status_text}'
            
            try:
                with open("logs/telehealth.log", "a") as f:
                    f.write(log_entry + '\n')
            except Exception as e:
                print(f"Failed to write log: {e}")
        
        return response
    
    def get_status_text(self, status_code: int) -> str:
        """Get HTTP status text"""
        status_texts = {
            200: "OK",
            201: "Created", 
            204: "No Content",
            301: "Moved Permanently",
            302: "Found",
            307: "Temporary Redirect",
            400: "Bad Request",
            401: "Unauthorized",
            403: "Forbidden",
            404: "Not Found",
            405: "Method Not Allowed",
            500: "Internal Server Error",
            502: "Bad Gateway",
            503: "Service Unavailable"
        }
        return status_texts.get(status_code, f"HTTP {status_code}")

# Add the middleware to your app
app.add_middleware(RequestLoggingMiddleware)


app.include_router(family_routes)
app.include_router(chat_router)
app.include_router(chat_auth)
app.include_router(admin_router)
app.include_router(realtime_router)

# app.include_router(api_router, prefix="/api")

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@app.get("/")
async def root():
    return RedirectResponse(url="/frontend/")

@app.post('/register_patient', response_model=schemas.UsersOut)
def create_patient(patient : schemas.InsertPatient, db : session = Depends(get_db)):

    if crud.check_user_by_email(db, patient.email):
        raise HTTPException(status_code=400, detail='patient already exists')
    
    patient.password = utils.hash_password(patient.password)

    return crud.insert_patient(db, patient)


@app.post('/register_doctor', response_model=schemas.UsersOut)
def create_doctor(doctor : schemas.InsertDoctor, db : session = Depends(get_db)):

    if crud.check_user_by_email(db, doctor.email):
        raise HTTPException(status_code=400, detail='doctor already exists')

    doctor.password = utils.hash_password(doctor.password)

    return crud.insert_doctor(db, doctor)


@app.post('/register_family', response_model=schemas.UsersOut)
def create_family(family : schemas.InsertFamily, db : session = Depends(get_db)):

    if crud.check_user_by_email(db, family.email):
        HTTPException(status_code=400, detail='family member already exists')

    family.password = utils.hash_password(family.password)

    return crud.insert_family(db, family)


@app.post('/token')  # This matches your tokenUrl
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


@app.get('/user/me')
def read_users_me(current_user = Depends(auth.get_current_user)):
    return current_user


@app.get('/all_doctors', response_model=List[schemas.UsersOut])
def all_users(db : session = Depends(get_db)):
    return crud.get_all_doctors(db)

@app.post('/create_appointment')
def create_appointment(appointment : schemas.BookAppointment, db : session = Depends(get_db), current_user = Depends(auth.get_current_user)):
    return crud.book_appointment(db, appointment, current_user.id)

@app.get('/get_all_appointments')
def get_all_appointments(doctor = Depends(auth.check_doctor)):
    result = []

    for app in doctor.doctor_appointments:
        result.append({
            "id": app.id,
            "title": app.patient.name,
            "start": app.date_time.isoformat(),
            "end": (app.date_time + timedelta(hours=30)).isoformat(),
            "status": app.status.value
        })

    return result

@app.put('/appointment_response')
def appointment_response(response : schemas.AppointmentResponse, db : session = Depends(get_db), doctor = Depends(auth.check_doctor)):
    return crud.appointment_response(db, response)

@app.post('/add_vital')
def add_vital(
    vital_data: schemas.VitalsCreate, 
    db: session = Depends(get_db), 
    doctor = Depends(auth.check_doctor)
):
    # Find patient by email
    patient = db.query(models.User).filter(
        models.User.email == vital_data.patient_email,
        models.User.role == models.UserRoles.PATIENT
    ).first()
    
    if not patient:
        raise HTTPException(status_code=404, detail='Patient not found with this email')
    
    # Create vital record with timestamp
    vital_record = models.Vitals(
        patient_id=patient.id,
        doctor_id=doctor.id,
        bp=vital_data.bp,
        heart_rate=vital_data.heart_rate,
        temperature=vital_data.temperature,
        notes=vital_data.notes,
        timestamp=datetime.utcnow()
    )
    
    db.add(vital_record)
    db.commit()
    db.refresh(vital_record)
    
    return {
        "message": "Vitals added successfully",
        "vital_id": vital_record.id,
        "patient_name": patient.name,
        "timestamp": vital_record.timestamp
    }

@app.get('/get_vital')
def get_vitals(patient = Depends(auth.check_patient), db: session = Depends(get_db)):
    vitals = db.query(models.Vitals).filter(
        models.Vitals.patient_id == patient.id
    ).order_by(models.Vitals.timestamp.desc()).all()
    
    return vitals

@app.post('/doctor/set_availability')
def set_doctor_availability(
    request: schemas.SetAvailabilityRequest, 
    doctor = Depends(auth.check_doctor),
    db: session = Depends(get_db)
):
    return crud.set_doctor_availability(request, doctor.id, db)

@app.get('/doctor/availability')
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

@app.get('/available_appointment')
async def get_available_appointment(
    app_date : date,
    doctor_id : int,
    db: session = Depends(get_db),
):
    return await crud.get_doctor_free_slots(doctor_id, app_date, db)

@app.post('/reserve_slot')
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

# @app.post('/confirm_slot')
# async def confirm_slot(appointment : schemas.BookAppointment, user_id: int = Query(...), db : session = Depends(get_db)):
    
#     slot_reserve_key = crud.make_slot_key(appointment.doctor_id, appointment.appointment_date)
#     holder = await redis_client.get(slot_reserve_key)

#     if holder is None:
#         raise HTTPException(410, "Reservation expired or not found")
#     if int(holder.decode()) != user_id:
#         raise HTTPException(403, "You do not hold this reservation")
    
#     booking = crud.book_appointment(db, appointment, user_id)

#     if not booking:
#         HTTPException(status_code=409, detail='booking cannot be processed')

#     await redis_client.delete(slot_reserve_key)

#     await redis_client.aclose()

#     return {"message": "Booking confirmed", "slot_time": appointment.appointment_date}

# @app.post('/confirm_slot')
# async def confirm_slot(appointment : schemas.BookAppointment, user_id: int = Query(...), db : session = Depends(get_db)):
    
#     slot_reserve_key = crud.make_slot_key(appointment.doctor_id, appointment.appointment_date)
#     holder = await redis_client.get(slot_reserve_key)

#     if holder is None:
#         raise HTTPException(410, "Reservation expired or not found")
    
#     # Handle both bytes and string responses
#     try:
#         if isinstance(holder, bytes):
#             holder_value = int(holder.decode())
#         else:
#             holder_value = int(holder)
#     except (ValueError, AttributeError) as e:
#         raise HTTPException(500, f"Invalid reservation data: {e}")
    
#     if holder_value != user_id:
#         raise HTTPException(403, "You do not hold this reservation")
    
#     booking = crud.book_appointment(db, appointment, user_id)

#     if not booking:
#         raise HTTPException(status_code=409, detail='booking cannot be processed')

#     await redis_client.delete(slot_reserve_key)

#     await redis_client.aclose()

#     return {"message": "Booking confirmed", "slot_time": appointment.appointment_date}


@app.post('/confirm_slot')
async def confirm_slot(appointment : schemas.BookAppointment, user_id: int = Query(...), db : session = Depends(get_db)):
    
    slot_reserve_key = crud.make_slot_key(appointment.doctor_id, appointment.appointment_date)
    holder = await redis_client.get(slot_reserve_key)

    if holder is None:
        raise HTTPException(410, "Reservation expired or not found")
    
    # Handle both bytes and string responses
    try:
        if isinstance(holder, bytes):
            holder_value = int(holder.decode())
        else:
            holder_value = int(holder)
    except (ValueError, AttributeError) as e:
        raise HTTPException(500, f"Invalid reservation data: {e}")
    
    if holder_value != user_id:
        raise HTTPException(403, "You do not hold this reservation")
    
    booking = crud.book_appointment(db, appointment, user_id)

    if not booking:
        raise HTTPException(status_code=409, detail='booking cannot be processed')

    await redis_client.delete(slot_reserve_key)
    
    # Remove this line - don't close the connection
    # await redis_client.aclose()

    return {"message": "Booking confirmed", "slot_time": appointment.appointment_date}


@app.post("/cancel_slot")
async def cancel_slot(doctor_id: int, slot_time: datetime, user_id: int):
    key = crud.make_slot_key(doctor_id, slot_time)
    holder = await redis_client.get(key)
    if holder and int(holder) == user_id:
        await redis_client.delete(key)
        await realtime.notify_slot_update(doctor_id, slot_time, "freed")
        return {"message": "Reservation cancelled and slot freed"}
    raise HTTPException(404, "No active reservation found")

@app.get('/patient/appointments')
def get_patient_appointments(
    current_user = Depends(auth.check_patient),  # Only patients can access
    db: session = Depends(get_db)
):
    """Get appointments for the current patient"""
    appointments = db.query(models.Appointments).filter(
        models.Appointments.patient_id == current_user.id
    ).all()
    
    return appointments


@app.get("/redis_test")
async def redis_test():
    try:
        pong = await redis_client.ping()
        return {"status": "success", "message": "Redis connection successful", "pong": pong}
    except Exception as e:
        return {"status": "error", "message": str(e)}


@app.get('/patient/appointments/detailed')
def get_patient_appointments_detailed(
    current_user = Depends(auth.check_patient),
    db: session = Depends(get_db)
):
    """Get detailed appointments for the current patient with doctor info"""
    appointments = db.query(models.Appointments).filter(
        models.Appointments.patient_id == current_user.id
    ).all()
    
    result = []
    for appointment in appointments:
        doctor_info = db.query(models.User).filter(models.User.id == appointment.doctor_id).first()
        
        result.append({
            "id": appointment.id,
            "doctor_id": appointment.doctor_id,
            "doctor_name": doctor_info.name if doctor_info else "Unknown Doctor",
            "doctor_email": doctor_info.email if doctor_info else "",
            "appointment_date": appointment.date_time.isoformat(),
            "appointment_time": appointment.date_time.strftime("%I:%M %p"),
            "appointment_day": appointment.date_time.strftime("%A, %B %d, %Y"),
            "status": appointment.status.value,
            "status_display": appointment.status.value.title(),
            "can_cancel": appointment.status.value == "pending",
            "created_at": appointment.date_time.isoformat()
        })
    
    # Sort by appointment date (most recent first)
    result.sort(key=lambda x: x["appointment_date"], reverse=True)
    return result

@app.put('/patient/appointments/{appointment_id}/cancel')
def cancel_patient_appointment(
    appointment_id: int,
    current_user = Depends(auth.check_patient),
    db: session = Depends(get_db)
):
    """Cancel a patient's appointment"""
    appointment = db.query(models.Appointments).filter(
        models.Appointments.id == appointment_id,
        models.Appointments.patient_id == current_user.id
    ).first()
    
    if not appointment:
        raise HTTPException(status_code=404, detail="Appointment not found")
    
    if appointment.status.value != "pending":
        raise HTTPException(status_code=400, detail="Can only cancel pending appointments")
    
    appointment.status = models.Status.REJECTED
    db.commit()
    
    return {
        "message": "Appointment cancelled successfully",
        "appointment_id": appointment_id,
        "status": "cancelled"
    }

@app.post('/patient/appointments/{appointment_id}/reschedule')
def reschedule_appointment(
    appointment_id: int,
    new_appointment: schemas.BookAppointment,
    current_user = Depends(auth.check_patient),
    db: session = Depends(get_db)
):
    """Reschedule an existing appointment"""
    # Find the existing appointment
    existing_appointment = db.query(models.Appointments).filter(
        models.Appointments.id == appointment_id,
        models.Appointments.patient_id == current_user.id
    ).first()
    
    if not existing_appointment:
        raise HTTPException(status_code=404, detail="Appointment not found")
    
    if existing_appointment.status.value != "pending":
        raise HTTPException(status_code=400, detail="Can only reschedule pending appointments")
    
    # Update the appointment
    existing_appointment.doctor_id = new_appointment.doctor_id
    existing_appointment.date_time = new_appointment.appointment_date
    existing_appointment.status = models.Status.PENDING
    
    db.commit()
    db.refresh(existing_appointment)
    
    return {
        "message": "Appointment rescheduled successfully",
        "appointment": {
            "id": existing_appointment.id,
            "doctor_id": existing_appointment.doctor_id,
            "appointment_date": existing_appointment.date_time.isoformat(),
            "status": existing_appointment.status.value
        }
    }

