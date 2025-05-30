// src/components/layout/Section.tsx
interface SectionProps {
  children: React.ReactNode;
  id?: string;
  className?: string;
  background?: 'white' | 'gray' | 'gradient' | 'transparent';
  padding?: 'none' | 'sm' | 'md' | 'lg' | 'xl';
  title?: string;
  subtitle?: string;
  titleAlign?: 'left' | 'center' | 'right';
}

export const Section: React.FC<SectionProps> = ({
  children,
  id,
  className = '',
  background = 'transparent',
  padding = 'lg',
  title,
  subtitle,
  titleAlign = 'center'
}) => {
  const backgrounds = {
    white: 'bg-white',
    gray: 'bg-gray-50',
    gradient: 'bg-gradient-to-br from-gray-50 to-white',
    transparent: 'bg-transparent'
  };

  const paddings = {
    none: '',
    sm: 'py-8',
    md: 'py-12',
    lg: 'py-16',
    xl: 'py-24'
  };

  const titleAligns = {
    left: 'text-left',
    center: 'text-center',
    right: 'text-right'
  };

  return (
    <section
      id={id}
      className={`${backgrounds[background]} ${paddings[padding]} ${className}`}
    >
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {(title || subtitle) && (
          <div className={`mb-12 ${titleAligns[titleAlign]}`}>
            {title && (
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900">
                {title}
              </h2>
            )}
            {subtitle && (
              <p className="text-lg text-gray-600">
                {subtitle}
              </p>
            )}
          </div>
        )}
       
        {children}
      </div>
    </section>
  );
};