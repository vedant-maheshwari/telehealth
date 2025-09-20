import React from 'react';
import { useAuthStore } from '@/stores/authStore';
import { useQuery } from '@tanstack/react-query';
import { appointmentApi } from '@/services/appointmentService';
import { vitalsApi } from '@/services/vitalsService';
import { chatApi } from '@/services/chatService';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import {
  CalendarIcon,
  ChatBubbleLeftRightIcon,
  HeartIcon,
  UserGroupIcon,
  ClipboardDocumentListIcon,
  PlusIcon,
} from '@heroicons/react/24/outline';
import { formatDate, formatTime, getStatusColor } from '@/lib/utils';
import { Link } from 'react-router-dom';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  color: string;
  description?: string;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, icon: Icon, color, description }) => (
  <Card className="hover:shadow-md transition-shadow">
    <CardContent className="p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-medical-600">{title}</p>
          <p className="text-2xl font-bold text-medical-900">{value}</p>
          {description && (
            <p className="text-sm text-medical-500 mt-1">{description}</p>
          )}
        </div>
        <div className={`p-3 rounded-lg ${color}`}>
          <Icon className="h-6 w-6 text-white" />
        </div>
      </div>
    </CardContent>
  </Card>
);

const RecentAppointmentCard: React.FC<{ appointment: any }> = ({ appointment }) => (
  <div className="flex items-center justify-between p-4 bg-white rounded-lg border border-medical-200">
    <div className="flex items-center space-x-3">
      <div className="flex-shrink-0">
        <CalendarIcon className="h-5 w-5 text-medical-400" />
      </div>
      <div>
        <p className="text-sm font-medium text-medical-900">
          {appointment.title || `Dr. ${appointment.doctor?.name || 'Unknown'}`}
        </p>
        <p className="text-xs text-medical-500">
          {appointment.start ? formatDate(appointment.start) + ' at ' + formatTime(appointment.start) : 'No date set'}
        </p>
      </div>
    </div>
    {appointment.status && (
      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(appointment.status)}`}>
        {appointment.status}
      </span>
    )}
  </div>
);

export const DashboardPage: React.FC = () => {
  const { user } = useAuthStore();

  // Fetch data based on user role
  const { data: appointments } = useQuery({
    queryKey: ['appointments', user?.role],
    queryFn: () => {
      if (user?.role === 'doctor') {
        return appointmentApi.getDoctorAppointments();
      } else if (user?.role === 'patient') {
        return appointmentApi.getPatientAppointments();
      }
      return [];
    },
    enabled: !!user && (user.role === 'doctor' || user.role === 'patient'),
  });

  const { data: vitals } = useQuery({
    queryKey: ['vitals'],
    queryFn: vitalsApi.getPatientVitals,
    enabled: !!user && user.role === 'patient',
  });

  const { data: chatRooms } = useQuery({
    queryKey: ['chatRooms'],
    queryFn: chatApi.getMyChatRooms,
    enabled: !!user,
  });

  const getDashboardStats = () => {
    const stats = [];

    if (user?.role === 'patient') {
      stats.push(
        {
          title: 'Upcoming Appointments',
          value: appointments?.filter(apt => apt.status === 'accepted').length || 0,
          icon: CalendarIcon,
          color: 'bg-primary-500',
          description: 'Next 30 days',
        },
        {
          title: 'Health Records',
          value: '12',
          icon: ClipboardDocumentListIcon,
          color: 'bg-green-500',
          description: 'Total records',
        },
        {
          title: 'Active Chats',
          value: chatRooms?.length || 0,
          icon: ChatBubbleLeftRightIcon,
          color: 'bg-blue-500',
          description: 'With healthcare team',
        },
        {
          title: 'Latest Vitals',
          value: vitals?.[0]?.bp ? `${vitals[0].bp} mmHg` : 'No data',
          icon: HeartIcon,
          color: 'bg-red-500',
          description: 'Blood pressure',
        }
      );
    } else if (user?.role === 'doctor') {
      const today = new Date().toDateString();
      stats.push(
        {
          title: 'Today\'s Appointments',
          value: appointments?.filter(apt => 
            apt.start && new Date(apt.start).toDateString() === today
          ).length || 0,
          icon: CalendarIcon,
          color: 'bg-primary-500',
          description: 'Scheduled for today',
        },
        {
          title: 'Pending Reviews',
          value: appointments?.filter(apt => apt.status === 'pending').length || 0,
          icon: ClipboardDocumentListIcon,
          color: 'bg-yellow-500',
          description: 'Awaiting response',
        },
        {
          title: 'Active Patients',
          value: '24',
          icon: UserGroupIcon,
          color: 'bg-green-500',
          description: 'Under your care',
        },
        {
          title: 'Chat Rooms',
          value: chatRooms?.length || 0,
          icon: ChatBubbleLeftRightIcon,
          color: 'bg-blue-500',
          description: 'Active conversations',
        }
      );
    } else if (user?.role === 'admin') {
      stats.push(
        {
          title: 'Total Users',
          value: '1,234',
          icon: UserGroupIcon,
          color: 'bg-primary-500',
          description: 'Active users',
        },
        {
          title: 'Total Appointments',
          value: '567',
          icon: CalendarIcon,
          color: 'bg-green-500',
          description: 'This month',
        },
        {
          title: 'Active Chats',
          value: '89',
          icon: ChatBubbleLeftRightIcon,
          color: 'bg-blue-500',
          description: 'Currently active',
        },
        {
          title: 'System Health',
          value: '99.9%',
          icon: HeartIcon,
          color: 'bg-green-500',
          description: 'Uptime',
        }
      );
    }

    return stats;
  };

  const getQuickActions = () => {
    const actions = [];

    if (user?.role === 'patient') {
      actions.push(
        { title: 'Book Appointment', href: '/appointments', color: 'bg-primary-600', icon: PlusIcon },
        { title: 'View Health Records', href: '/health-records', color: 'bg-green-600', icon: ClipboardDocumentListIcon },
        { title: 'Check Vitals', href: '/vitals', color: 'bg-red-600', icon: HeartIcon },
        { title: 'Family Management', href: '/family', color: 'bg-purple-600', icon: UserGroupIcon },
      );
    } else if (user?.role === 'doctor') {
      actions.push(
        { title: 'View Schedule', href: '/appointments', color: 'bg-primary-600', icon: CalendarIcon },
        { title: 'Patient Records', href: '/health-records', color: 'bg-green-600', icon: ClipboardDocumentListIcon },
        { title: 'Start Chat', href: '/messages', color: 'bg-blue-600', icon: ChatBubbleLeftRightIcon },
        { title: 'Analytics', href: '/analytics', color: 'bg-purple-600', icon: ClipboardDocumentListIcon },
      );
    } else if (user?.role === 'admin') {
      actions.push(
        { title: 'Manage Users', href: '/users', color: 'bg-primary-600', icon: UserGroupIcon },
        { title: 'System Analytics', href: '/analytics', color: 'bg-green-600', icon: ClipboardDocumentListIcon },
        { title: 'View All Chats', href: '/messages', color: 'bg-blue-600', icon: ChatBubbleLeftRightIcon },
        { title: 'Settings', href: '/settings', color: 'bg-gray-600', icon: ClipboardDocumentListIcon },
      );
    }

    return actions;
  };

  const stats = getDashboardStats();
  const quickActions = getQuickActions();
  const recentAppointments = appointments?.slice(0, 5) || [];

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-primary-600 to-primary-700 rounded-lg text-white p-8">
        <h1 className="text-2xl font-bold mb-2">
          Welcome back, {user?.name}!
        </h1>
        <p className="text-primary-100">
          {user?.role === 'patient' && "Here's an overview of your health journey."}
          {user?.role === 'doctor' && "Ready to provide exceptional care to your patients."}
          {user?.role === 'admin' && "Monitor and manage your TeleHealth platform."}
          {user?.role === 'family' && "Stay connected with your family member's healthcare."}
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <StatCard key={index} {...stat} />
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Quick Actions */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <h3 className="text-lg font-medium text-medical-900">Quick Actions</h3>
            </CardHeader>
            <CardContent className="space-y-3">
              {quickActions.map((action, index) => (
                <Link key={index} to={action.href}>
                  <Button
                    variant="outline"
                    className="w-full justify-start"
                  >
                    <action.icon className="h-4 w-4 mr-3" />
                    {action.title}
                  </Button>
                </Link>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Recent Activity */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <h3 className="text-lg font-medium text-medical-900">
                Recent {user?.role === 'doctor' ? 'Appointments' : 'Activity'}
              </h3>
              <Link to="/appointments">
                <Button variant="outline" size="sm">
                  View All
                </Button>
              </Link>
            </CardHeader>
            <CardContent>
              {recentAppointments.length > 0 ? (
                <div className="space-y-3">
                  {recentAppointments.map((appointment) => (
                    <RecentAppointmentCard key={appointment.id} appointment={appointment} />
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-medical-500">
                  <CalendarIcon className="h-12 w-12 mx-auto mb-4 text-medical-300" />
                  <p>No recent appointments</p>
                  {user?.role === 'patient' && (
                    <Link to="/appointments">
                      <Button className="mt-4">
                        Book Your First Appointment
                      </Button>
                    </Link>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};