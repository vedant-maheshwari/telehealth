import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useMutation } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { authApi } from '@/services/authService';
import { useAuthStore } from '@/stores/authStore';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import { validateEmail } from '@/lib/utils';
import { LoginRequest } from '@/types';
import { EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline';

interface LoginForm {
  email: string;
  password: string;
}

export const LoginPage: React.FC = () => {
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuthStore();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginForm>();

  const loginMutation = useMutation({
    mutationFn: (credentials: LoginRequest) => authApi.login(credentials),
    onSuccess: async (response) => {
      try {
        // Get user data with the token
        localStorage.setItem('access_token', response.access_token);
        const userData = await authApi.getCurrentUser();
        
        login(response.access_token, userData);
        toast.success('Welcome back!');
        
        // Redirect based on role
        switch (userData.role) {
          case 'admin':
            navigate('/dashboard');
            break;
          case 'doctor':
            navigate('/dashboard');
            break;
          case 'patient':
            navigate('/dashboard');
            break;
          case 'family':
            navigate('/dashboard');
            break;
          default:
            navigate('/dashboard');
        }
      } catch (error) {
        toast.error('Failed to get user data');
        localStorage.removeItem('access_token');
      }
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || 'Login failed');
    },
  });

  const onSubmit = (data: LoginForm) => {
    loginMutation.mutate({
      username: data.email,
      password: data.password,
    });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 to-medical-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="mx-auto h-16 w-16 bg-primary-600 rounded-full flex items-center justify-center">
            <svg
              className="h-8 w-8 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
              />
            </svg>
          </div>
          <h2 className="mt-6 text-3xl font-bold text-medical-900">
            Welcome back to TeleHealth
          </h2>
          <p className="mt-2 text-sm text-medical-600">
            Sign in to your account to continue
          </p>
        </div>

        <Card>
          <CardHeader className="text-center">
            <h3 className="text-lg font-medium text-medical-900">Sign In</h3>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <Input
                label="Email address"
                type="email"
                placeholder="Enter your email"
                {...register('email', {
                  required: 'Email is required',
                  validate: (value) =>
                    validateEmail(value) || 'Please enter a valid email',
                })}
                error={errors.email?.message}
              />

              <div>
                <Input
                  label="Password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter your password"
                  {...register('password', {
                    required: 'Password is required',
                  })}
                  error={errors.password?.message}
                  rightIcon={
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="text-medical-400 hover:text-medical-500"
                    >
                      {showPassword ? (
                        <EyeSlashIcon className="h-5 w-5" />
                      ) : (
                        <EyeIcon className="h-5 w-5" />
                      )}
                    </button>
                  }
                />
              </div>

              <Button
                type="submit"
                className="w-full"
                loading={loginMutation.isPending}
              >
                Sign In
              </Button>
            </form>

            <div className="mt-6">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-medical-300" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white text-medical-500">
                    Don't have an account?
                  </span>
                </div>
              </div>

              <div className="mt-6 grid grid-cols-3 gap-3">
                <Link to="/register/patient">
                  <Button variant="outline" size="sm" className="w-full">
                    Patient
                  </Button>
                </Link>
                <Link to="/register/doctor">
                  <Button variant="outline" size="sm" className="w-full">
                    Doctor
                  </Button>
                </Link>
                <Link to="/register/family">
                  <Button variant="outline" size="sm" className="w-full">
                    Family
                  </Button>
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="text-center">
          <p className="text-xs text-medical-500">
            By signing in, you agree to our{' '}
            <Link to="/terms" className="underline hover:text-medical-700">
              Terms of Service
            </Link>{' '}
            and{' '}
            <Link to="/privacy" className="underline hover:text-medical-700">
              Privacy Policy
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};