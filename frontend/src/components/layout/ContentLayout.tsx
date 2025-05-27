// src/components/layout/ContentLayout.tsx
interface ContentLayoutProps {
  children: React.ReactNode;
  sidebar?: React.ReactNode;
  header?: React.ReactNode;
  sidebarPosition?: 'left' | 'right';
  sidebarWidth?: 'sm' | 'md' | 'lg';
  className?: string;
  containerSize?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
}

export const ContentLayout: React.FC<ContentLayoutProps> = ({
  children,
  sidebar,
  header,
  sidebarPosition = 'left',
  sidebarWidth = 'md',
  className = '',
  containerSize = 'xl'
}) => {
  const sidebarWidths = {
    sm: 'w-64',
    md: 'w-80',
    lg: 'w-96'
  };

  const containerSizes = {
    sm: 'max-w-4xl',
    md: 'max-w-6xl',
    lg: 'max-w-7xl',
    xl: 'max-w-screen-xl',
    full: 'max-w-full'
  };

  return (
    <div className={`container mx-auto px-4 sm:px-6 lg:px-8 ${containerSizes[containerSize]} ${className}`}>
      {header && (
        <div className="mb-8">
          {header}
        </div>
      )}
      
      <div className={`flex gap-8 ${sidebarPosition === 'right' ? 'flex-row-reverse' : 'flex-row'}`}>
        {/* Sidebar */}
        {sidebar && (
          <aside className={`${sidebarWidths[sidebarWidth]} flex-shrink-0 hidden lg:block`}>
            <div className="sticky top-8">
              {sidebar}
            </div>
          </aside>
        )}
        
        {/* Main content */}
        <div className="flex-1 min-w-0">
          {children}
        </div>
      </div>
      
      {/* Mobile sidebar overlay */}
      {sidebar && (
        <div className="lg:hidden">
          {/* Add mobile sidebar implementation */}
        </div>
      )}
    </div>
  );
};