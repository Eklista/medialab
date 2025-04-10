// src/features/auth/components/AuthCard.tsx

import React from 'react';

interface AuthCardProps {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}

const AuthCard: React.FC<AuthCardProps> = ({ 
  title, 
  subtitle, 
  children, 
  footer 
}) => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full bg-white rounded-xl shadow-lg overflow-hidden">
        {/* Header */}
        <div className="py-6 px-8 bg-white border-b border-gray-200">
          <div className="text-center">
            {/* Logo del MediaLab */}
            <div className="flex justify-center mb-4">
              <div className="h-16 w-16 rounded-full bg-(--color-accent-1) flex items-center justify-center">
                <span className="text-2xl font-bold text-(--color-text-main)">ML</span>
              </div>
            </div>
            <h2 className="text-2xl font-bold text-(--color-text-main)">{title}</h2>
            {subtitle && (
              <p className="mt-2 text-sm text-(--color-text-secondary)">{subtitle}</p>
            )}
          </div>
        </div>
        
        {/* Form Content */}
        <div className="py-6 px-8">
          {children}
        </div>
        
        {/* Footer */}
        {footer && (
          <div className="py-4 px-8 bg-gray-50 border-t border-gray-200">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
};

export default AuthCard;