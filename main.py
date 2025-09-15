import schemas, utils, models
from sqlalchemy.orm import session
from database import Base, SessionLocal, engine
from fastapi import FastAPI, HTTPException, Depends, Request
from fastapi.responses import JSONResponse
import crud
from typing import List
from fastapi.security import OAuth2PasswordRequestForm
import auth
from family.family_routes import router as family_routes
from chat.chat import router as chat_router
from chat.chat_auth import router as chat_auth
from admin.admin_routes import router as admin_router
from datetime import timedelta
from fastapi.middleware.cors import CORSMiddleware
import logging
import colorlog
import traceback


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

app = FastAPI()

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

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # for development, allow all. Later restrict to your frontend domain
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


app.include_router(family_routes)
app.include_router(chat_router)
app.include_router(chat_auth)
app.include_router(admin_router)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


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
            "end": (app.date_time + timedelta(hours=1)).isoformat(),
            "status": app.status.value
        })

    return result

@app.put('/appointment_response')
def appointment_response(response : schemas.AppointmentResponse, db : session = Depends(get_db), doctor = Depends(auth.check_doctor)):
    return crud.appointment_response(db, response)

@app.post('/add_vital')
def add_vital(vital : schemas.Vitals_update, db : session = Depends(get_db), doctor = Depends(auth.check_doctor)):
    result = crud.add_vital(vital,doctor.id, db)
    if result is None:
        raise HTTPException(status_code=404, detail='patient not found')
    else:
        return result
    
@app.get('/get_vital')
def get_vital(patient = Depends(auth.check_patient)):
    return crud.get_vitals(patient)

