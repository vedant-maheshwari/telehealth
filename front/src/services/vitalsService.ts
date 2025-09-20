import api from '@/lib/api';
import { Vital, VitalUpdate } from '@/types';

export const vitalsApi = {
  // Doctor endpoints
  addVital: async (vital: VitalUpdate): Promise<Vital> => {
    const response = await api.post('/add_vital', vital);
    return response.data;
  },

  // Patient endpoints
  getPatientVitals: async (): Promise<Vital[]> => {
    const response = await api.get('/get_vital');
    return response.data;
  },
};