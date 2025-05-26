// frontend/src/components/debug/PermissionsDebug.tsx
import React, { useState } from 'react';
import { usePermissions } from '../../hooks/usePermissions';
import { useAuth } from '../../features/auth/hooks/useAuth';

interface PermissionsDebugProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PermissionsDebug: React.FC<PermissionsDebugProps> = ({ isOpen, onClose }) => {
  const { state: authState } = useAuth();
  const {
    userPermissions,
    categories,
    isLoading,
    error,
    isAdmin,
    hasAnyAdminPermission,
    hasPermission,
    canView,
    canCreate,
    canEdit,
    canDelete,
    refreshPermissions
  } = usePermissions();

  const [testPermission, setTestPermission] = useState('user_view');
  const [testCategory, setTestCategory] = useState('user');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-4xl max-h-[90vh] overflow-y-auto w-full mx-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">🔍 Debug de Permisos</h2>
          <button 
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            ✕
          </button>
        </div>

        {/* Estado de autenticación */}
        <div className="mb-6 p-4 bg-blue-50 rounded-lg">
          <h3 className="font-semibold mb-2">👤 Estado de Autenticación</h3>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <strong>Autenticado:</strong> {authState.isAuthenticated ? '✅' : '❌'}
            </div>
            <div>
              <strong>Usuario:</strong> {authState.user?.email || 'N/A'}
            </div>
            <div>
              <strong>Rol:</strong> {authState.user?.role || 'N/A'}
            </div>
            <div>
              <strong>Es Admin:</strong> {isAdmin ? '✅' : '❌'}
            </div>
          </div>
        </div>

        {/* Estado de carga */}
        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
          <h3 className="font-semibold mb-2">⚡ Estado de Carga</h3>
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div>
              <strong>Cargando:</strong> {isLoading ? '🔄' : '✅'}
            </div>
            <div>
              <strong>Error:</strong> {error ? '❌' : '✅'}
            </div>
            <div>
              <strong>Permisos Admin:</strong> {hasAnyAdminPermission ? '✅' : '❌'}
            </div>
          </div>
          {error && (
            <div className="mt-2 p-2 bg-red-100 text-red-700 rounded text-sm">
              <strong>Error:</strong> {error}
            </div>
          )}
        </div>

        {/* Permisos del usuario */}
        <div className="mb-6 p-4 bg-green-50 rounded-lg">
          <div className="flex justify-between items-center mb-2">
            <h3 className="font-semibold">🔑 Permisos del Usuario ({userPermissions.length})</h3>
            <button
              onClick={refreshPermissions}
              className="px-3 py-1 bg-blue-500 text-white rounded text-sm hover:bg-blue-600"
              disabled={isLoading}
            >
              {isLoading ? '🔄' : '🔄 Refrescar'}
            </button>
          </div>
          <div className="max-h-32 overflow-y-auto">
            {userPermissions.length > 0 ? (
              <div className="grid grid-cols-2 gap-1 text-sm">
                {userPermissions.map((permission, index) => (
                  <div key={index} className="bg-white p-1 rounded text-xs">
                    {permission}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-gray-500 text-sm">No hay permisos cargados</div>
            )}
          </div>
        </div>

        {/* Test de permisos específicos */}
        <div className="mb-6 p-4 bg-yellow-50 rounded-lg">
          <h3 className="font-semibold mb-2">🧪 Test de Permisos</h3>
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium mb-1">
                Probar permiso específico:
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={testPermission}
                  onChange={(e) => setTestPermission(e.target.value)}
                  className="px-3 py-1 border rounded text-sm flex-1"
                  placeholder="ej: user_view"
                />
                <div className={`px-3 py-1 rounded text-sm ${
                  hasPermission(testPermission) ? 'bg-green-200 text-green-800' : 'bg-red-200 text-red-800'
                }`}>
                  {hasPermission(testPermission) ? '✅ Tiene' : '❌ No tiene'}
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                Probar categoría CRUD:
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={testCategory}
                  onChange={(e) => setTestCategory(e.target.value)}
                  className="px-3 py-1 border rounded text-sm"
                  placeholder="ej: user"
                />
                <div className="flex gap-1">
                  {[
                    { action: 'View', fn: () => canView(testCategory) },
                    { action: 'Create', fn: () => canCreate(testCategory) },
                    { action: 'Edit', fn: () => canEdit(testCategory) },
                    { action: 'Delete', fn: () => canDelete(testCategory) }
                  ].map(({ action, fn }) => (
                    <div
                      key={action}
                      className={`px-2 py-1 rounded text-xs ${
                        fn() ? 'bg-green-200 text-green-800' : 'bg-red-200 text-red-800'
                      }`}
                    >
                      {action}: {fn() ? '✅' : '❌'}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Categorías */}
        <div className="mb-6 p-4 bg-purple-50 rounded-lg">
          <h3 className="font-semibold mb-2">📂 Categorías ({categories.length})</h3>
          <div className="max-h-32 overflow-y-auto">
            {categories.length > 0 ? (
              <div className="space-y-1 text-sm">
                {categories.map((category, index) => (
                  <div key={index} className="bg-white p-2 rounded">
                    <strong>{category.display_name}</strong> ({category.name}) - 
                    {category.permissions.length} permisos
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-gray-500 text-sm">No hay categorías cargadas</div>
            )}
          </div>
        </div>

        {/* Permisos críticos del sidebar */}
        <div className="p-4 bg-orange-50 rounded-lg">
          <h3 className="font-semibold mb-2">🎯 Permisos Críticos del Sidebar</h3>
          <div className="grid grid-cols-2 gap-2 text-sm">
            {[
              'profile_edit',
              'user_view',
              'user_create', 
              'user_edit',
              'role_view',
              'area_view',
              'service_view',
              'request_view'
            ].map(permission => (
              <div
                key={permission}
                className={`p-2 rounded ${
                  hasPermission(permission) ? 'bg-green-200 text-green-800' : 'bg-red-200 text-red-800'
                }`}
              >
                {permission}: {hasPermission(permission) ? '✅' : '❌'}
              </div>
            ))}
          </div>
        </div>

        <div className="mt-4 text-xs text-gray-500">
          💡 Este componente es solo para debugging y debe removerse en producción
        </div>
      </div>
    </div>
  );
};