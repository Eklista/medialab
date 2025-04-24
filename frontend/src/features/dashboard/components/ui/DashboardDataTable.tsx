// src/features/dashboard/components/ui/DashboardDataTable.tsx
import React from 'react';
import DashboardButton from './DashboardButton';

export interface Column<T> {
  header: string;
  accessor: keyof T | ((item: T) => React.ReactNode);
  className?: string;
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
}: DashboardDataTableProps<T>) {
  const renderCellContent = (item: T, column: Column<T>) => {
    if (typeof column.accessor === 'function') {
      return column.accessor(item);
    }
    
    // Otherwise, it's a key of T - convert to string to ensure it's React-renderable
    const value = item[column.accessor as keyof T];
    // Ensure the value is of type ReactNode (string, number, boolean, null, etc.)
    return (value === null || value === undefined) ? '' : String(value);
  };
  
  // Show loading skeleton
  if (isLoading) {
    return (
      <div className={`overflow-x-auto bg-white rounded-lg border border-gray-200 ${className}`}>
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              {columns.map((column, index) => (
                <th
                  key={index}
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  {column.header}
                </th>
              ))}
              {actionColumn && (
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Acciones
                </th>
              )}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {Array.from({ length: 3 }).map((_, rowIndex) => (
              <tr key={rowIndex}>
                {columns.map((_, colIndex) => (
                  <td key={colIndex} className="px-6 py-4 whitespace-nowrap">
                    <div className="h-4 bg-gray-200 rounded animate-pulse w-full max-w-xs"></div>
                  </td>
                ))}
                {actionColumn && (
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <div className="h-8 bg-gray-200 rounded animate-pulse w-20 ml-auto"></div>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }
  
  // No data
  if (data.length === 0) {
    return (
      <div className={`bg-white rounded-lg border border-gray-200 p-6 text-center ${className}`}>
        <p className="text-gray-500">{emptyMessage}</p>
      </div>
    );
  }
  
  return (
    <div className={`overflow-x-auto bg-white rounded-lg border border-gray-200 ${className}`}>
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            {columns.map((column, index) => (
              <th
                key={index}
                scope="col"
                className={`px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider ${column.className || ''}`}
              >
                {column.header}
              </th>
            ))}
            {actionColumn && (
              <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Acciones
              </th>
            )}
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {data.map((item) => (
            <tr key={keyExtractor(item)}>
              {columns.map((column, index) => (
                <td 
                  key={index}
                  className={`px-6 py-4 whitespace-nowrap ${column.className || ''}`}
                >
                  {renderCellContent(item, column)}
                </td>
              ))}
              {actionColumn && (
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                  {/* Custom actions if provided */}
                  {renderActions && renderActions(item)}
                  
                  {/* Default actions */}
                  {onView && (
                    <DashboardButton
                      variant="text"
                      size="sm"
                      onClick={() => onView(item)}
                      className="text-blue-600 hover:text-blue-900"
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
                    >
                      Eliminar
                    </DashboardButton>
                  )}
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
      
      {/* Pagination */}
      {pagination && (
        <div className="px-6 py-3 flex items-center justify-between border-t border-gray-200">
          <div>
            <p className="text-sm text-gray-700">
              Mostrando <span className="font-medium">{pagination.itemsPerPage}</span> de{' '}
              <span className="font-medium">{pagination.totalItems}</span> registros
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-700">
              Página <span className="font-medium">{pagination.currentPage}</span> de{' '}
              <span className="font-medium">{pagination.totalPages}</span>
            </span>
            <div className="flex space-x-2">
              <DashboardButton
                variant="outline"
                size="sm"
                onClick={() => pagination.onPageChange(pagination.currentPage - 1)}
                disabled={pagination.currentPage <= 1}
                className="disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Anterior
              </DashboardButton>
              <DashboardButton
                variant="outline"
                size="sm"
                onClick={() => pagination.onPageChange(pagination.currentPage + 1)}
                disabled={pagination.currentPage >= pagination.totalPages}
                className="disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Siguiente
              </DashboardButton>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default DashboardDataTable;