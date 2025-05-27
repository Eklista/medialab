// src/components/ui/LoadingSpinner.tsx
import React from 'react';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  text?: string;
  variant?: 'default' | 'dots' | 'pulse' | 'bars';
  fullScreen?: boolean;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'md',
  className = '',
  text,
  variant = 'default',
  fullScreen = false
}) => {
  const sizes = {
    sm: 'h-4 w-4',
    md: 'h-8 w-8',
    lg: 'h-12 w-12',
    xl: 'h-16 w-16'
  };

  const containerClass = fullScreen 
    ? 'fixed inset-0 bg-white bg-opacity-90 flex flex-col items-center justify-center z-50'
    : 'flex flex-col items-center justify-center';

  // Spinner por defecto con tus colores
  const DefaultSpinner = () => (
    <svg 
      className={`animate-spin ${sizes[size]}`}
      style={{ color: 'var(--color-accent-1)' }}
      fill="none" 
      viewBox="0 0 24 24"
    >
      <circle 
        className="opacity-25" 
        cx="12" 
        cy="12" 
        r="10" 
        stroke="currentColor" 
        strokeWidth="4"
      />
      <path 
        className="opacity-75" 
        fill="currentColor" 
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  );

  // Spinner de puntos
  const DotsSpinner = () => (
    <div className="flex gap-2">
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className={`rounded-full animate-pulse ${
            size === 'sm' ? 'h-2 w-2' :
            size === 'md' ? 'h-3 w-3' :
            size === 'lg' ? 'h-4 w-4' : 'h-5 w-5'
          }`}
          style={{ 
            backgroundColor: 'var(--color-accent-1)',
            animationDelay: `${i * 0.15}s`
          }}
        />
      ))}
    </div>
  );

  // Spinner de pulso
  const PulseSpinner = () => (
    <div className="relative">
      <div
        className={`${sizes[size]} rounded-full animate-ping absolute inset-0`}
        style={{ backgroundColor: 'var(--color-accent-1)', opacity: 0.4 }}
      />
      <div
        className={`${sizes[size]} rounded-full`}
        style={{ backgroundColor: 'var(--color-accent-1)' }}
      />
    </div>
  );

  // Spinner de barras
  const BarsSpinner = () => (
    <div className="flex items-center justify-center gap-1">
      {[0, 1, 2, 3].map((i) => (
        <div
          key={i}
          className={`animate-pulse ${
            size === 'sm' ? 'h-4 w-1' :
            size === 'md' ? 'h-6 w-1' :
            size === 'lg' ? 'h-8 w-1' : 'h-10 w-1'
          }`}
          style={{ 
            backgroundColor: 'var(--color-accent-1)',
            animationDelay: `${i * 0.1}s`,
            animationDuration: '0.6s'
          }}
        />
      ))}
    </div>
  );

  const renderSpinner = () => {
    switch (variant) {
      case 'dots':
        return <DotsSpinner />;
      case 'pulse':
        return <PulseSpinner />;
      case 'bars':
        return <BarsSpinner />;
      default:
        return <DefaultSpinner />;
    }
  };

  return (
    <div className={`${containerClass} ${className}`}>
      {renderSpinner()}
      
      {text && (
        <p className="mt-3 text-sm font-medium" style={{ color: 'var(--color-text-secondary)' }}>
          {text}
        </p>
      )}
    </div>
  );
};

// Componente de loading para páginas completas
export const PageLoader: React.FC<{ text?: string }> = ({ text = "Cargando..." }) => (
  <LoadingSpinner 
    size="lg" 
    text={text} 
    variant="default"
    fullScreen={true}
  />
);

// Componente de loading para cards/secciones
export const SectionLoader: React.FC<{ text?: string; className?: string }> = ({ 
  text, 
  className = "py-12" 
}) => (
  <div className={`w-full ${className}`}>
    <LoadingSpinner size="md" text={text} variant="default" />
  </div>
);

// Componente de loading inline
export const InlineLoader: React.FC = () => (
  <LoadingSpinner size="sm" variant="dots" />
);