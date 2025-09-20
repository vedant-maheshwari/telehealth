export interface User {
  id: number;
  name: string;
  email: string;
  role: 'patient' | 'doctor' | 'family' | 'admin';
  dateofbirth?: string;
  medicallicense?: string;
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  access_token: string;
  token_type: string;
  role: string;
  user_id: number;
}

export interface RegisterPatientRequest {
  name: string;
  email: string;
  password: string;
  dateofbirth: string;
}

export interface RegisterDoctorRequest {
  name: string;
  email: string;
  password: string;
  dateofbirth: string;
  medicallicense: string;
}

export interface RegisterFamilyRequest {
  name: string;
  email: string;
  password: string;
  dateofbirth: string;
}

export interface Appointment {
  id: number;
  patient_id?: number;
  doctor_id?: number;
  datetime?: string;
  status?: 'pending' | 'accepted' | 'rejected';
  title?: string;
  start?: string;
  end?: string;
  patient?: {
    id: number;
    name: string;
    email: string;
  };
  doctor?: {
    id: number;
    name: string;
    email: string;
  };
}

export interface BookAppointmentRequest {
  doctor_id: number;
  appointment_date: string;
}

export interface AppointmentResponse {
  appointment_id: number;
  action: 'accept' | 'reject';
}

export interface Vital {
  id: number;
  patient_id: number;
  doctor_id: number;
  bp: number;
  heart_rate?: number;
  temperature?: number;
  oxygen_saturation?: number;
  weight?: number;
  height?: number;
  created_at: string;
}

export interface VitalUpdate {
  patient_email: string;
  bp: number;
  heart_rate?: number;
  temperature?: number;
  oxygen_saturation?: number;
  weight?: number;
  height?: number;
}

export interface ChatRoom {
  id: number;
  name: string;
  created_by: number;
  participants?: User[];
  last_message?: string;
  last_activity?: string;
  unread_count?: number;
}

export interface ChatMessage {
  id: number;
  chat_id: number;
  sender_id: number;
  content: string;
  timestamp: string;
  sender_name?: string;
}

export interface CreateChatRoomRequest {
  name: string;
  participant_ids: number[];
}

export interface DoctorAvailability {
  day_of_week: number; // 0 = Monday, 6 = Sunday
  start_time: string; // HH:MM format
  end_time: string; // HH:MM format
  appointment_duration: number; // minutes
  break_start?: string; // HH:MM format
  break_end?: string; // HH:MM format
}

export interface SetAvailabilityRequest {
  availabilities: DoctorAvailability[];
}