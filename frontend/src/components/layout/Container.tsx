// src/components/layout/Container.tsx
import React from 'react';

interface ContainerProps {
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  className?: string;
  as?: React.ElementType;
}

export const Container: React.FC<ContainerProps> = ({
  children,
  size = 'xl',
  className = '',
  as: Component = 'div'
}) => {
  const sizes = {
    sm: 'max-w-4xl',
    md: 'max-w-6xl',
    lg: 'max-w-7xl',
    xl: 'max-w-screen-xl',
    full: 'max-w-full'
  };

  return (
    <Component className={`container mx-auto px-4 sm:px-6 lg:px-8 ${sizes[size]} ${className}`}>
      {children}
    </Component>
  );
};