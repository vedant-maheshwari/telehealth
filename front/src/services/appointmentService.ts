import api from '@/lib/api';
import {
  Appointment,
  BookAppointmentRequest,
  AppointmentResponse,
  User,
  DoctorAvailability,
  SetAvailabilityRequest,
} from '@/types';

export const appointmentApi = {
  // Patient endpoints
  bookAppointment: async (appointment: BookAppointmentRequest): Promise<Appointment> => {
    const response = await api.post('/create_appointment', appointment);
    return response.data;
  },

  getPatientAppointments: async (): Promise<Appointment[]> => {
    const response = await api.get('/patient/appointments');
    return response.data;
  },

  // Doctor endpoints
  getDoctorAppointments: async (): Promise<Appointment[]> => {
    const response = await api.get('/get_all_appointments');
    return response.data;
  },

  respondToAppointment: async (response: AppointmentResponse): Promise<Appointment> => {
    const apiResponse = await api.put('/appointment_response', response);
    return apiResponse.data;
  },

  // Availability management
  setDoctorAvailability: async (request: SetAvailabilityRequest): Promise<DoctorAvailability[]> => {
    const response = await api.post('/doctor/set_availability', request);
    return response.data;
  },

  getDoctorAvailability: async (): Promise<{ availabilities: DoctorAvailability[]; doctor_id: number; doctor_name: string }> => {
    const response = await api.get('/doctor/availability');
    return response.data;
  },

  getAvailableSlots: async (doctorId: number, date: string): Promise<string[]> => {
    const response = await api.get(`/available_appointment?app_date=${date}&doctor_id=${doctorId}`);
    return response.data;
  },

  // Slot reservation system
  reserveSlot: async (appointment: BookAppointmentRequest, userId: number): Promise<{ message: string; expires_in: number }> => {
    const response = await api.post(`/reserve_slot?user_id=${userId}`, appointment);
    return response.data;
  },

  confirmSlot: async (appointment: BookAppointmentRequest, userId: number): Promise<{ message: string; slot_time: string }> => {
    const response = await api.post(`/confirm_slot?user_id=${userId}`, appointment);
    return response.data;
  },

  cancelSlot: async (doctorId: number, slotTime: string, userId: number): Promise<{ message: string }> => {
    const response = await api.post(`/cancel_slot?doctor_id=${doctorId}&slot_time=${encodeURIComponent(slotTime)}&user_id=${userId}`);
    return response.data;
  },

  // Get all doctors
  getAllDoctors: async (): Promise<User[]> => {
    const response = await api.get('/all_doctors');
    return response.data;
  },
};