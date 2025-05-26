// src/features/dashboard/components/ui/DashboardDataTable.tsx
import React, { useState } from 'react';
import DashboardButton from './DashboardButton';
import { ChevronUpIcon, ChevronDownIcon, EyeIcon, PencilIcon, TrashIcon } from '@heroicons/react/24/outline';

export interface Column<T> {
  header: string;
  accessor: keyof T | ((item: T) => React.ReactNode);
  className?: string;
  sortable?: boolean;
  width?: string;
  align?: 'left' | 'center' | 'right';
}

export interface DashboardDataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  keyExtractor: (item: T) => string | number;
  emptyMessage?: string;
  onEdit?: (item: T) => void;
  onDelete?: (item: T) => void;
  onView?: (item: T) => void;
  actionColumn?: boolean;
  className?: string;
  isLoading?: boolean;
  pagination?: {
    currentPage: number;
    totalPages: number;
    onPageChange: (page: number) => void;
    itemsPerPage: number;
    totalItems: number;
  };
  renderActions?: (item: T) => React.ReactNode;
  selectable?: boolean;
  selectedItems?: Set<string | number>;
  onSelectionChange?: (selectedItems: Set<string | number>) => void;
  striped?: boolean;
  hover?: boolean;
  compact?: boolean;
  sticky?: boolean;
  sortBy?: string;
  sortDirection?: 'asc' | 'desc';
  onSort?: (column: string, direction: 'asc' | 'desc') => void;
}

function DashboardDataTable<T>({
  columns,
  data,
  keyExtractor,
  emptyMessage = 'No hay datos disponibles',
  onEdit,
  onDelete,
  onView,
  actionColumn = false,
  className = '',
  isLoading = false,
  pagination,
  renderActions,
  selectable = false,
  selectedItems = new Set(),
  onSelectionChange,
  striped = true,
  hover = true,
  compact = false,
  sticky = false,
  sortBy,
  sortDirection = 'asc',
  onSort,
}: DashboardDataTableProps<T>) {
  const [localSortBy, setLocalSortBy] = useState<string | null>(sortBy || null);
  const [localSortDirection, setLocalSortDirection] = useState<'asc' | 'desc'>(sortDirection);

  const handleSort = (column: Column<T>) => {
    if (!column.sortable || typeof column.accessor !== 'string') return;

    const columnKey = column.accessor as string;
    let newDirection: 'asc' | 'desc' = 'asc';

    if (localSortBy === columnKey && localSortDirection === 'asc') {
      newDirection = 'desc';
    }

    setLocalSortBy(columnKey);
    setLocalSortDirection(newDirection);

    if (onSort) {
      onSort(columnKey, newDirection);
    }
  };

  const handleSelectAll = () => {
    if (!onSelectionChange) return;

    const allKeys = data.map(item => keyExtractor(item));
    const allSelected = allKeys.every(key => selectedItems.has(key));

    if (allSelected) {
      onSelectionChange(new Set());
    } else {
      onSelectionChange(new Set(allKeys));
    }
  };

  const handleSelectItem = (item: T) => {
    if (!onSelectionChange) return;

    const key = keyExtractor(item);
    const newSelection = new Set(selectedItems);

    if (newSelection.has(key)) {
      newSelection.delete(key);
    } else {
      newSelection.add(key);
    }

    onSelectionChange(newSelection);
  };

  const renderCellContent = (item: T, column: Column<T>) => {
    if (typeof column.accessor === 'function') {
      return column.accessor(item);
    }
    
    const value = item[column.accessor as keyof T];
    return (value === null || value === undefined) ? '' : String(value);
  };

  const getAlignmentClasses = (align?: string) => {
    switch (align) {
      case 'center': return 'text-center';
      case 'right': return 'text-right';
      default: return 'text-left';
    }
  };

  const tableClasses = [
    'min-w-full divide-y divide-gray-200',
    compact ? 'text-sm' : 'text-base'
  ].filter(Boolean).join(' ');

  const containerClasses = [
    'overflow-hidden bg-white rounded-xl border border-gray-200 shadow-sm',
    sticky ? 'sticky top-0 z-10' : '',
    className
  ].filter(Boolean).join(' ');

  // Loading skeleton
  if (isLoading) {
    return (
      <div className={containerClasses}>
        <div className="overflow-x-auto">
          <table className={tableClasses}>
            <thead className="bg-gray-50">
              <tr>
                {selectable && (
                  <th className="w-4 px-6 py-4">
                    <div className="h-4 w-4 bg-gray-200 rounded animate-pulse"></div>
                  </th>
                )}
                {columns.map((column, index) => (
                  <th
                    key={index}
                    className={`px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider ${column.className || ''}`}
                    style={{ width: column.width }}
                  >
                    <div className="h-4 bg-gray-200 rounded animate-pulse w-24"></div>
                  </th>
                ))}
                {actionColumn && (
                  <th className="px-6 py-4 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <div className="h-4 bg-gray-200 rounded animate-pulse w-16 ml-auto"></div>
                  </th>
                )}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {Array.from({ length: 5 }).map((_, rowIndex) => (
                <tr key={rowIndex} className={striped && rowIndex % 2 === 1 ? 'bg-gray-50' : ''}>
                  {selectable && (
                    <td className="px-6 py-4">
                      <div className="h-4 w-4 bg-gray-200 rounded animate-pulse"></div>
                    </td>
                  )}
                  {columns.map((_, colIndex) => (
                    <td key={colIndex} className={`px-6 py-4 ${compact ? 'py-2' : 'py-4'}`}>
                      <div className="h-4 bg-gray-200 rounded animate-pulse w-full max-w-xs"></div>
                    </td>
                  ))}
                  {actionColumn && (
                    <td className={`px-6 ${compact ? 'py-2' : 'py-4'} text-right`}>
                      <div className="h-8 bg-gray-200 rounded animate-pulse w-20 ml-auto"></div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }
  
  // Empty state
  if (data.length === 0) {
    return (
      <div className={containerClasses}>
        <div className="text-center py-12">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2 2m16-7H4m16 0l-2-2m2 2l-2 2M4 13l2-2m-2 2l2 2" />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900">Sin datos</h3>
          <p className="mt-1 text-sm text-gray-500">{emptyMessage}</p>
        </div>
      </div>
    );
  }
  
  const allSelected = data.length > 0 && data.every(item => selectedItems.has(keyExtractor(item)));
  const someSelected = data.some(item => selectedItems.has(keyExtractor(item)));

  return (
    <div className={containerClasses}>
      <div className="overflow-x-auto">
        <table className={tableClasses}>
          <thead className="bg-gray-50">
            <tr>
              {selectable && (
                <th className="w-4 px-6 py-4">
                  <input
                    type="checkbox"
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    checked={allSelected}
                    ref={(el) => {
                      if (el) el.indeterminate = someSelected && !allSelected;
                    }}
                    onChange={handleSelectAll}
                  />
                </th>
              )}
              {columns.map((column, index) => (
                <th
                  key={index}
                  className={`
                    px-6 py-4 text-xs font-medium text-gray-500 uppercase tracking-wider
                    ${getAlignmentClasses(column.align)}
                    ${column.sortable ? 'cursor-pointer hover:bg-gray-100 transition-colors' : ''}
                    ${column.className || ''}
                  `}
                  style={{ width: column.width }}
                  onClick={() => handleSort(column)}
                >
                  <div className="flex items-center gap-1">
                    <span>{column.header}</span>
                    {column.sortable && (
                      <div className="flex flex-col">
                        <ChevronUpIcon 
                          className={`h-3 w-3 ${
                            localSortBy === column.accessor && localSortDirection === 'asc' 
                              ? 'text-blue-600' 
                              : 'text-gray-400'
                          }`} 
                        />
                        <ChevronDownIcon 
                          className={`h-3 w-3 -mt-0.5 ${
                            localSortBy === column.accessor && localSortDirection === 'desc' 
                              ? 'text-blue-600' 
                              : 'text-gray-400'
                          }`} 
                        />
                      </div>
                    )}
                  </div>
                </th>
              ))}
              {actionColumn && (
                <th className="px-6 py-4 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Acciones
                </th>
              )}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {data.map((item, index) => {
              const isSelected = selectedItems.has(keyExtractor(item));
              return (
                <tr 
                  key={keyExtractor(item)}
                  className={`
                    ${striped && index % 2 === 1 ? 'bg-gray-50' : ''}
                    ${hover ? 'hover:bg-gray-100 transition-colors' : ''}
                    ${isSelected ? 'bg-blue-50 border-blue-200' : ''}
                  `}
                >
                  {selectable && (
                    <td className="px-6 py-4">
                      <input
                        type="checkbox"
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        checked={isSelected}
                        onChange={() => handleSelectItem(item)}
                      />
                    </td>
                  )}
                  {columns.map((column, colIndex) => (
                    <td 
                      key={colIndex}
                      className={`
                        px-6 whitespace-nowrap
                        ${compact ? 'py-2' : 'py-4'}
                        ${getAlignmentClasses(column.align)}
                        ${column.className || ''}
                      `}
                    >
                      {renderCellContent(item, column)}
                    </td>
                  ))}
                  {actionColumn && (
                    <td className={`px-6 ${compact ? 'py-2' : 'py-4'} whitespace-nowrap text-right text-sm font-medium`}>
                      <div className="flex items-center justify-end gap-2">
                        {renderActions && renderActions(item)}
                        
                        {onView && (
                          <DashboardButton
                            variant="text"
                            size="sm"
                            onClick={() => onView(item)}
                            className="text-blue-600 hover:text-blue-900"
                            leftIcon={<EyeIcon className="h-4 w-4" />}
                          >
                            Ver
                          </DashboardButton>
                        )}
                        {onEdit && (
                          <DashboardButton
                            variant="text"
                            size="sm"
                            onClick={() => onEdit(item)}
                            className="text-blue-600 hover:text-blue-900"
                            leftIcon={<PencilIcon className="h-4 w-4" />}
                          >
                            Editar
                          </DashboardButton>
                        )}
                        {onDelete && (
                          <DashboardButton
                            variant="text"
                            size="sm"
                            onClick={() => onDelete(item)}
                            className="text-red-600 hover:text-red-900"
                            leftIcon={<TrashIcon className="h-4 w-4" />}
                          >
                            Eliminar
                          </DashboardButton>
                        )}
                      </div>
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      
      {/* Enhanced Pagination */}
      {pagination && (
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-sm text-gray-700">
            Mostrando{' '}
            <span className="font-medium">
              {((pagination.currentPage - 1) * pagination.itemsPerPage) + 1}
            </span>{' '}
            a{' '}
            <span className="font-medium">
              {Math.min(pagination.currentPage * pagination.itemsPerPage, pagination.totalItems)}
            </span>{' '}
            de{' '}
            <span className="font-medium">{pagination.totalItems}</span>{' '}
            registros
          </div>
          
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-700">
              Página <span className="font-medium">{pagination.currentPage}</span> de{' '}
              <span className="font-medium">{pagination.totalPages}</span>
            </span>
            
            <div className="flex items-center gap-1">
              <DashboardButton
                variant="outline"
                size="sm"
                onClick={() => pagination.onPageChange(1)}
                disabled={pagination.currentPage <= 1}
                className="hidden sm:inline-flex"
              >
                Primera
              </DashboardButton>
              
              <DashboardButton
                variant="outline"
                size="sm"
                onClick={() => pagination.onPageChange(pagination.currentPage - 1)}
                disabled={pagination.currentPage <= 1}
              >
                Anterior
              </DashboardButton>
              
              <DashboardButton
                variant="outline"
                size="sm"
                onClick={() => pagination.onPageChange(pagination.currentPage + 1)}
                disabled={pagination.currentPage >= pagination.totalPages}
              >
                Siguiente
              </DashboardButton>
              
              <DashboardButton
                variant="outline"
                size="sm"
                onClick={() => pagination.onPageChange(pagination.totalPages)}
                disabled={pagination.currentPage >= pagination.totalPages}
                className="hidden sm:inline-flex"
              >
                Última
              </DashboardButton>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default DashboardDataTable;