import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { format, formatDistanceToNow } from 'date-fns';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const formatDate = (date: Date | string) => {
  return format(new Date(date), 'MMM dd, yyyy');
};

export const formatDateTime = (date: Date | string) => {
  return format(new Date(date), 'MMM dd, yyyy at h:mm a');
};

export const formatRelativeTime = (date: Date | string) => {
  return formatDistanceToNow(new Date(date), { addSuffix: true });
};

export const formatTime = (date: Date | string) => {
  return format(new Date(date), 'h:mm a');
};

export const generateRandomId = () => {
  return Math.random().toString(36).substr(2, 9);
};

export const capitalize = (str: string) => {
  return str.charAt(0).toUpperCase() + str.slice(1);
};

export const truncate = (str: string, length: number) => {
  if (str.length <= length) return str;
  return str.slice(0, length) + '...';
};

export const validateEmail = (email: string) => {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
};

export const validatePassword = (password: string) => {
  return password.length >= 8;
};

export const getRoleColor = (role: string) => {
  switch (role.toLowerCase()) {
    case 'admin':
      return 'bg-red-100 text-red-800';
    case 'doctor':
      return 'bg-blue-100 text-blue-800';
    case 'patient':
      return 'bg-green-100 text-green-800';
    case 'family':
      return 'bg-purple-100 text-purple-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

export const getStatusColor = (status: string) => {
  switch (status.toLowerCase()) {
    case 'accepted':
    case 'confirmed':
    case 'active':
      return 'bg-green-100 text-green-800';
    case 'pending':
      return 'bg-yellow-100 text-yellow-800';
    case 'rejected':
    case 'cancelled':
    case 'inactive':
      return 'bg-red-100 text-red-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};