import api from '@/lib/api';
import {
  LoginRequest,
  LoginResponse,
  RegisterPatientRequest,
  RegisterDoctorRequest,
  RegisterFamilyRequest,
  User,
} from '@/types';

export const authApi = {
  login: async (credentials: LoginRequest): Promise<LoginResponse> => {
    const formData = new FormData();
    formData.append('username', credentials.username);
    formData.append('password', credentials.password);
    
    const response = await api.post('/token', formData, {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    });
    return response.data;
  },

  registerPatient: async (data: RegisterPatientRequest): Promise<User> => {
    const response = await api.post('/register_patient', data);
    return response.data;
  },

  registerDoctor: async (data: RegisterDoctorRequest): Promise<User> => {
    const response = await api.post('/register_doctor', data);
    return response.data;
  },

  registerFamily: async (data: RegisterFamilyRequest): Promise<User> => {
    const response = await api.post('/register_family', data);
    return response.data;
  },

  getCurrentUser: async (): Promise<User> => {
    const response = await api.get('/user/me');
    return response.data;
  },
};