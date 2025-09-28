from sqlalchemy.orm import session
from sqlalchemy import func
import models, schemas
from datetime import datetime, time, timedelta
import hashlib
import main

def insert_patient(db : session, user : schemas.InsertPatient):
    patient = models.User(
        name = user.name,
        email = user.email,
        hashed_password = user.password,
        date_of_birth = user.date_of_birth,
        role = 'patient'
    )
    db.add(patient)
    db.commit()
    db.refresh(patient)
    return patient


def insert_doctor(db : session, user : schemas.InsertDoctor):
    doctor = models.User(
        name = user.name,
        email = user.email,
        hashed_password = user.password,
        date_of_birth = user.date_of_birth,
        role = 'doctor',
        medical_license = user.medical_license
    )

    db.add(doctor)
    db.commit()
    db.refresh(doctor)
    return doctor

def insert_family(db : session, user : schemas.InsertFamily):
    doctor = models.User(
        name = user.name,
        email = user.email,
        hashed_password = user.password,
        date_of_birth = user.date_of_birth,
        role = 'family',
    )

    db.add(doctor)
    db.commit()
    db.refresh(doctor)
    return doctor


def get_all_users(db : session):
    return db.query(models.User).all()

def get_specific_user(db : session, id : int):
    return db.query(models.User).filter(models.User.id == id).first()

def check_user_by_email(db : session, email : str):
    if db.query(models.User).filter(models.User.email == email).first():
        return True
    else :
        return False

def get_all_patients(db : session):
    return db.query(models.User).filter(models.User.role == 'patient')

def get_all_doctors(db : session):
    return db.query(models.User).filter(models.User.role == 'doctor')


def book_appointment(db : session, appointment : schemas.BookAppointment, patient_id : int):
    create_appointment = models.Appointments(
        patient_id = patient_id,
        doctor_id = appointment.doctor_id,
        date_time = appointment.appointment_date,
        status = models.Status.PENDING
    )

    db.add(create_appointment)
    db.commit()
    db.refresh(create_appointment)
    return create_appointment

def appointment_response(db : session, response : schemas.AppointmentResponse):
    appointment = db.query(models.Appointments).filter(models.Appointments.id == response.appointment_id).first()
    
    if response.action == 'accept':
        appointment.status = models.Status.ACCECPTED
        
    else:
        appointment.status = models.Status.REJECTED

    db.commit()
    db.refresh(appointment)
    return appointment

def add_vital(vital : schemas.Vitals_update, doctor_id : int, db : session):
    add_patient = db.query(models.User).filter(models.User.email == vital.patient_email).first()
    if not add_patient:
        return None
    add_vital = models.Vitals(
        patient_id = add_patient.id,
        doctor_id = doctor_id,
        bp = vital.bp
    )
    db.add(add_vital)
    db.commit()
    db.refresh(add_vital)
    return add_vital

def get_vitals(patient : models.User):
    return patient.vitals


# def set_doctor_availability(
#     request: schemas.DoctorAvailability, 
#     doctor_id : int,
#     db: session
# ):
#     doctor_availability = models.DoctorAvailability(
#         doctor_id= doctor_id,
#         day_of_week=request.day_of_week,
#         start_time=request.start_time,
#         end_time=request.end_time,
#         appointment_duration=request.appointment_duration,
#         break_start=request.break_start,
#         break_end=request.break_end
#     )

#     db.add(doctor_availability)
#     db.commit()
#     db.refresh(doctor_availability)
#     return doctor_availability

def set_doctor_availability(
    request: schemas.SetAvailabilityRequest, 
    doctor_id: int,
    db: session
):
    # First delete existing availability entries for doctor
    db.query(models.DoctorAvailability).filter(
        models.DoctorAvailability.doctor_id == doctor_id
    ).delete()

    # Add all new availabilities
    for item in request.availabilities:
        doctor_availability = models.DoctorAvailability(
            doctor_id=doctor_id,
            day_of_week=item.day_of_week,
            start_time=item.start_time,
            end_time=item.end_time,
            appointment_duration=item.appointment_duration,
            break_start=item.break_start,
            break_end=item.break_end
        )
        db.add(doctor_availability)

    db.commit()

    # Optionally return all current availabilities for confirmation
    return db.query(models.DoctorAvailability).filter(
        models.DoctorAvailability.doctor_id == doctor_id
    ).all()


# async def get_doctor_free_slots(doctor_id : int, date : datetime, db : session):
#     accepted_appointments = db.query(models.Appointments).filter(models.Appointments.doctor_id == doctor_id,
#                                           func.date(models.Appointments.date_time) == date,
#                                           models.Appointments.status.in_(['ACCECPTED', 'PENDING'])).all()

    
#     pattern = f"slot_hold:doctor:{doctor_id}:{date.isoformat()}T*"
#     held_keys = await main.redis_client.keys(pattern)
#     held_times = set()
#     for key in held_keys:
#         if isinstance(key, bytes):
#             key = key.decode()
#         _, _, _, iso_dt = key.split(":", 3)
#         dt = datetime.fromisoformat(iso_dt)
#         held_times.add(dt.time())
    
#     un_available_slots = [slot.date_time.time() for slot in accepted_appointments]

#     day_to_num = {'Sunday' : 0, 'Monday' : 1, 'Tuesday' : 2, 'Wednesday' : 3, 'Thursday' : 4, 'Friday' : 5, 'Saturday' : 6}

#     day_num = day_to_num[date.strftime('%A')]

#     doctor_availability = db.query(models.DoctorAvailability).filter(models.DoctorAvailability.doctor_id == doctor_id,
#                                                                      models.DoctorAvailability.day_of_week == day_num).first()

#     doctor_start_time = doctor_availability.start_time

#     doctor_end_time = doctor_availability.end_time

#     doctor_break_start = doctor_availability.break_start

#     doctor_break_end = doctor_availability.break_end

#     doctor_appointment_duration = doctor_availability.appointment_duration

#     available_slots = []

#     current_time = datetime.combine(date,doctor_start_time)

#     doctor_end_time = datetime.combine(date,doctor_end_time)

#     while current_time < doctor_end_time:
#         slot_time = current_time.time()

#         in_booked = slot_time in un_available_slots
#         in_held   = slot_time in held_times
#         in_break  = doctor_break_start and doctor_break_end and (doctor_break_start <= slot_time < doctor_break_end)

#         if not (in_booked or in_held or in_break):
#                     available_slots.append(slot_time)

#         current_time = current_time + timedelta(minutes=doctor_appointment_duration)

#     return available_slots
# crud.py (FIXED get_doctor_free_slots)

async def get_doctor_free_slots(doctor_id : int, date : datetime, db : session):
    # --- Existing logic to find booked and held slots ---
    accepted_appointments = db.query(models.Appointments).filter(models.Appointments.doctor_id == doctor_id,
                                         func.date(models.Appointments.date_time) == date, # FIX 1: Use date.date()
                                         models.Appointments.status.in_(['ACCECPTED', 'PENDING'])).all()

    # ... (Redis logic unchanged) ...
    pattern = f"slot_hold:doctor:{doctor_id}:{date.isoformat()}T*" # FIX 2: Use date.date() for key
    held_keys = await main.redis_client.keys(pattern)
    held_times = set()
    for key in held_keys:
        if isinstance(key, bytes):
            key = key.decode()
        # The key should only contain the date, not the full datetime from the frontend
        # Assuming the date part of the key is sufficient:
        _, _, _, iso_dt = key.split(":", 3) 
        try:
            # Only extract the time part for checking against slots
            dt = datetime.fromisoformat(iso_dt)
            held_times.add(dt.time())
        except ValueError:
            continue # Skip malformed keys

    un_available_slots = [slot.date_time.time() for slot in accepted_appointments]

    # --- Availability Lookup (CRASH FIX HERE) ---
    # Note: date here is a datetime object, but your type hint in main.py is 'date'.
    # I will assume the input 'date' is a Python date/datetime object.
    day_to_num = {'Sunday' : 0, 'Monday' : 1, 'Tuesday' : 2, 'Wednesday' : 3, 'Thursday' : 4, 'Friday' : 5, 'Saturday' : 6}
    
    # Use date.strftime('%A') to get the full day name (e.g., 'Friday')
    day_num = day_to_num[date.strftime('%A')] 

    doctor_availability = db.query(models.DoctorAvailability).filter(
        models.DoctorAvailability.doctor_id == doctor_id,
        models.DoctorAvailability.day_of_week == day_num
    ).first()

    # ******************** FIX 3: CRASH CHECK ********************
    if not doctor_availability:
        # If the doctor has no availability for this specific day, return an empty list
        return []
    # ************************************************************

    doctor_start_time = doctor_availability.start_time
    doctor_end_time = doctor_availability.end_time
    doctor_break_start = doctor_availability.break_start
    doctor_break_end = doctor_availability.break_end
    doctor_appointment_duration = doctor_availability.appointment_duration

    available_slots = []

    # Combine the date part (from input) with time objects for correct comparison
    current_time = datetime.combine(date, doctor_start_time)
    doctor_end_dt = datetime.combine(date, doctor_end_time)

    while current_time < doctor_end_dt:
        slot_time = current_time.time()

        in_booked = slot_time in un_available_slots
        in_held = slot_time in held_times
        in_break = doctor_break_start and doctor_break_end and (doctor_break_start <= slot_time < doctor_break_end)

        if not (in_booked or in_held or in_break):
            available_slots.append(slot_time.strftime('%H:%M:%S')) # FIX 4: Format time as string

        current_time = current_time + timedelta(minutes=doctor_appointment_duration)

    return available_slots

def make_slot_key(doctor_id : int, slot_time : datetime):
    normalized_dt = slot_time.replace(microsecond=0, tzinfo=None)
    raw =  f'slot_hold:doctor:{doctor_id}:{normalized_dt.isoformat()}'
    return raw


