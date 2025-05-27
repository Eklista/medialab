// src/components/layout/PublicLayout.tsx
import React from 'react';
import { Navbar } from './Navbar';
import { Footer } from './Footer';
import { ThemeToggle } from '../ui/ThemeToggle';

interface PublicLayoutProps {
  children: React.ReactNode;
  showThemeToggle?: boolean;
  className?: string;
}

export const PublicLayout: React.FC<PublicLayoutProps> = ({ 
  children, 
  showThemeToggle = true,
  className = '' 
}) => {
  return (
    <div className="min-h-screen bg-(--color-bg-main) dark:bg-gray-900 transition-colors">
      <Navbar />
      
      <main className={`${className}`}>
        {children}
      </main>
      
      <Footer />
      
      {/* Floating theme toggle for mobile */}
      {showThemeToggle && (
        <div className="fixed bottom-6 left-6 z-50 lg:hidden">
          <ThemeToggle size="lg" />
        </div>
      )}
    </div>
  );
};