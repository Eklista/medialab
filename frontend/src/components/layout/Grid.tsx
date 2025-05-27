// src/components/layout/Grid.tsx
interface GridProps {
  children: React.ReactNode;
  columns?: 1 | 2 | 3 | 4 | 5 | 6 | 12;
  gap?: 'sm' | 'md' | 'lg' | 'xl';
  responsive?: boolean;
  className?: string;
}

export const Grid: React.FC<GridProps> = ({
  children,
  columns = 3,
  gap = 'md',
  responsive = true,
  className = ''
}) => {
  const getGridCols = () => {
    if (!responsive) {
      return `grid-cols-${columns}`;
    }

    switch (columns) {
      case 1: return 'grid-cols-1';
      case 2: return 'grid-cols-1 md:grid-cols-2';
      case 3: return 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3';
      case 4: return 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4';
      case 5: return 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5';
      case 6: return 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-6';
      case 12: return 'grid-cols-12';
      default: return 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3';
    }
  };

  const gaps = {
    sm: 'gap-3',
    md: 'gap-6',
    lg: 'gap-8',
    xl: 'gap-12'
  };

  return (
    <div className={`grid ${getGridCols()} ${gaps[gap]} ${className}`}>
      {children}
    </div>
  );
};

// src/components/layout/Stack.tsx
interface StackProps {
  children: React.ReactNode;
  direction?: 'row' | 'column';
  spacing?: 'none' | 'sm' | 'md' | 'lg' | 'xl';
  align?: 'start' | 'center' | 'end' | 'stretch';
  justify?: 'start' | 'center' | 'end' | 'between' | 'around' | 'evenly';
  wrap?: boolean;
  className?: string;
}

export const Stack: React.FC<StackProps> = ({
  children,
  direction = 'column',
  spacing = 'md',
  align = 'stretch',
  justify = 'start',
  wrap = false,
  className = ''
}) => {
  const directions = {
    row: 'flex-row',
    column: 'flex-col'
  };

  const spacings = {
    none: '',
    sm: direction === 'row' ? 'gap-2' : 'space-y-2',
    md: direction === 'row' ? 'gap-4' : 'space-y-4',
    lg: direction === 'row' ? 'gap-6' : 'space-y-6',
    xl: direction === 'row' ? 'gap-8' : 'space-y-8'
  };

  const alignments = {
    start: 'items-start',
    center: 'items-center',
    end: 'items-end',
    stretch: 'items-stretch'
  };

  const justifications = {
    start: 'justify-start',
    center: 'justify-center',
    end: 'justify-end',
    between: 'justify-between',
    around: 'justify-around',
    evenly: 'justify-evenly'
  };

  return (
    <div className={`
      flex ${directions[direction]} ${spacings[spacing]} 
      ${alignments[align]} ${justifications[justify]}
      ${wrap ? 'flex-wrap' : ''}
      ${className}
    `}>
      {children}
    </div>
  );
};
