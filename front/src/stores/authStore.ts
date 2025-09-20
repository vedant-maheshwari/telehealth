import { create } from 'zustand';

export interface User {
  id: number;
  name: string;
  email: string;
  role: 'patient' | 'doctor' | 'family' | 'admin';
  dateofbirth?: string;
  medicallicense?: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (token: string, user: User) => void;
  logout: () => void;
  updateUser: (user: Partial<User>) => void;
}

export const useAuthStore = create<AuthState>()((set, get) => ({
  user: null,
  token: null,
  isAuthenticated: false,
  login: (token: string, user: User) => {
    localStorage.setItem('access_token', token);
    localStorage.setItem('user_data', JSON.stringify(user));
    set({ token, user, isAuthenticated: true });
  },
  logout: () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('user_data');
    set({ token: null, user: null, isAuthenticated: false });
  },
  updateUser: (updatedUser: Partial<User>) => {
    const currentUser = get().user;
    if (currentUser) {
      const newUser = { ...currentUser, ...updatedUser };
      localStorage.setItem('user_data', JSON.stringify(newUser));
      set({ user: newUser });
    }
  },
}));