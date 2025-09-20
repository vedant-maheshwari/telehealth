import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import { useAuthStore } from '@/stores/authStore';

// Layout
import { Layout } from '@/components/layout/Layout';
import { ProtectedRoute } from '@/components/ProtectedRoute';

// Auth Pages
import { LoginPage } from '@/pages/auth/LoginPage';
import { RegisterPatientPage } from '@/pages/auth/RegisterPatientPage';
import { RegisterDoctorPage } from '@/pages/auth/RegisterDoctorPage';
import { RegisterFamilyPage } from '@/pages/auth/RegisterFamilyPage';

// Dashboard Pages
import { DashboardPage } from '@/pages/dashboard/DashboardPage';

// Feature Pages
import { AppointmentsPage } from '@/pages/appointments/AppointmentsPage';
import { MessagesPage } from '@/pages/messages/MessagesPage';
import { ChatRoomPage } from '@/pages/messages/ChatRoomPage';
import { VitalsPage } from '@/pages/vitals/VitalsPage';
import { FamilyPage } from '@/pages/family/FamilyPage';
import { HealthRecordsPage } from '@/pages/health-records/HealthRecordsPage';
import { SettingsPage } from '@/pages/settings/SettingsPage';

// Admin Pages
import { UsersPage } from '@/pages/admin/UsersPage';
import { AnalyticsPage } from '@/pages/admin/AnalyticsPage';

// Error Pages
import { UnauthorizedPage } from '@/pages/error/UnauthorizedPage';
import { NotFoundPage } from '@/pages/error/NotFoundPage';

import './App.css';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function App() {
  const { isAuthenticated, user } = useAuthStore();

  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <div className="App">
          <Routes>
            {/* Public Routes */}
            <Route 
              path="/login" 
              element={!isAuthenticated ? <LoginPage /> : <Navigate to="/dashboard" />} 
            />
            <Route 
              path="/register/patient" 
              element={!isAuthenticated ? <RegisterPatientPage /> : <Navigate to="/dashboard" />} 
            />
            <Route 
              path="/register/doctor" 
              element={!isAuthenticated ? <RegisterDoctorPage /> : <Navigate to="/dashboard" />} 
            />
            <Route 
              path="/register/family" 
              element={!isAuthenticated ? <RegisterFamilyPage /> : <Navigate to="/dashboard" />} 
            />

            {/* Protected Routes */}
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <Layout />
                </ProtectedRoute>
              }
            >
              {/* Dashboard - Available to all authenticated users */}
              <Route index element={<Navigate to="/dashboard" />} />
              <Route path="dashboard" element={<DashboardPage />} />

              {/* Appointments - Patient, Doctor, Family */}
              <Route 
                path="appointments" 
                element={
                  <ProtectedRoute allowedRoles={['patient', 'doctor', 'family']}>
                    <AppointmentsPage />
                  </ProtectedRoute>
                } 
              />

              {/* Messages - Patient, Doctor, Family */}
              <Route 
                path="messages" 
                element={
                  <ProtectedRoute allowedRoles={['patient', 'doctor', 'family']}>
                    <MessagesPage />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="messages/:chatId" 
                element={
                  <ProtectedRoute allowedRoles={['patient', 'doctor', 'family']}>
                    <ChatRoomPage />
                  </ProtectedRoute>
                } 
              />

              {/* Health Records - Patient, Doctor, Family */}
              <Route 
                path="health-records" 
                element={
                  <ProtectedRoute allowedRoles={['patient', 'doctor', 'family']}>
                    <HealthRecordsPage />
                  </ProtectedRoute>
                } 
              />

              {/* Vitals - Patient, Doctor */}
              <Route 
                path="vitals" 
                element={
                  <ProtectedRoute allowedRoles={['patient', 'doctor']}>
                    <VitalsPage />
                  </ProtectedRoute>
                } 
              />

              {/* Family Management - Patient, Family */}
              <Route 
                path="family" 
                element={
                  <ProtectedRoute allowedRoles={['patient', 'family']}>
                    <FamilyPage />
                  </ProtectedRoute>
                } 
              />

              {/* Analytics - Doctor, Admin */}
              <Route 
                path="analytics" 
                element={
                  <ProtectedRoute allowedRoles={['doctor', 'admin']}>
                    <AnalyticsPage />
                  </ProtectedRoute>
                } 
              />

              {/* User Management - Admin only */}
              <Route 
                path="users" 
                element={
                  <ProtectedRoute requiredRole="admin">
                    <UsersPage />
                  </ProtectedRoute>
                } 
              />

              {/* Settings - All users */}
              <Route path="settings" element={<SettingsPage />} />
            </Route>

            {/* Error Routes */}
            <Route path="/unauthorized" element={<UnauthorizedPage />} />
            <Route path="*" element={<NotFoundPage />} />
          </Routes>

          <Toaster
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: '#363636',
                color: '#fff',
              },
              success: {
                duration: 3000,
                iconTheme: {
                  primary: '#10b981',
                  secondary: '#fff',
                },
              },
              error: {
                duration: 5000,
                iconTheme: {
                  primary: '#ef4444',
                  secondary: '#fff',
                },
              },
            }}
          />
        </div>
      </Router>
    </QueryClientProvider>
  );
}

export default App;