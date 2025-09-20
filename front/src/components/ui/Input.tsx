import React from 'react';
import { cn } from '@/lib/utils';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, leftIcon, rightIcon, ...props }, ref) => {
    const inputId = React.useId();

    return (
      <div className="space-y-1">
        {label && (
          <label
            htmlFor={inputId}
            className="block text-sm font-medium text-medical-700"
          >
            {label}
          </label>
        )}
        <div className="relative">
          {leftIcon && (
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <div className="h-5 w-5 text-medical-400">
                {leftIcon}
              </div>
            </div>
          )}
          <input
            id={inputId}
            className={cn(
              'block w-full rounded-lg border-medical-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm',
              leftIcon && 'pl-10',
              rightIcon && 'pr-10',
              error && 'border-red-300 text-red-900 placeholder-red-300 focus:border-red-500 focus:ring-red-500',
              className
            )}
            ref={ref}
            {...props}
          />
          {rightIcon && (
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
              <div className="h-5 w-5 text-medical-400">
                {rightIcon}
              </div>
            </div>
          )}
        </div>
        {error && (
          <p className="text-sm text-red-600">{error}</p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

export { Input };