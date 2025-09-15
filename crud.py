from sqlalchemy.orm import session
import models, schemas
from datetime import datetime

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
