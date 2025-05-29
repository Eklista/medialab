// frontend/src/context/AppDataContext.tsx
import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { authService, userService, permissionsService } from '../services';
import { User as UserServiceUser, Role, Area } from '../services/users.service';
import { User as AuthServiceUser } from '../services/auth.service';
import { PermissionCategory } from '../services/permissions.service';

// ===== INTERFACES =====
interface AppData {
  // Usuario y auth
  user: AuthServiceUser | null; // 🔥 Usar AuthServiceUser para consistencia
  isAuthenticated: boolean;
  permissions: string[];
  
  // Datos del sistema (una sola carga)
  roles: Role[];
  areas: Area[];
  permissionCategories: PermissionCategory[];
  users: UserServiceUser[]; // 🔥 Para la lista de usuarios usar UserServiceUser
  
  // Estados de carga
  isLoading: boolean;
  isInitialized: boolean; // Para saber si ya cargamos todo
  error: string | null;
  
  // Métodos de refresh selectivos
  refreshUser: () => Promise<void>;
  refreshRoles: () => Promise<void>;
  refreshAll: () => Promise<void>;
}

const AppDataContext = createContext<AppData | null>(null);

// 🔥 EXPORTAR EL CONTEXTO
export { AppDataContext };

// ===== PROVIDER =====
interface AppDataProviderProps {
  children: React.ReactNode;
}

export const AppDataProvider: React.FC<AppDataProviderProps> = ({ children }) => {
  const [state, setState] = useState<Omit<AppData, 'refreshUser' | 'refreshRoles' | 'refreshAll'>>({
    user: null,
    isAuthenticated: false,
    permissions: [],
    roles: [],
    areas: [],
    permissionCategories: [],
    users: [],
    isLoading: true,
    isInitialized: false,
    error: null
  });

  // Ref para evitar múltiples cargas simultáneas
  const loadingRef = useRef(false);
  const retryCountRef = useRef(0);

  // 🔥 CARGA INICIAL ÚNICA Y PARALELA
  const loadAllData = async (isRetry = false) => {
    // Prevenir múltiples cargas simultáneas
    if (loadingRef.current && !isRetry) {
      console.log('🔒 Carga ya en progreso, omitiendo...');
      return;
    }

    loadingRef.current = true;
    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      console.log('🚀 Iniciando carga completa de datos...');
      const startTime = Date.now();

      // ✅ PARALELA: Todas las consultas al mismo tiempo
      const [
        user,
        userPermissions,
        roles,
        areas,
        permissionCategories,
        allUsers
      ] = await Promise.all([
        authService.getCurrentUser().catch(() => null),
        authService.getUserPermissions().catch(() => []),
        userService.getRoles().catch(() => []),
        userService.getAreas().catch(() => []),
        permissionsService.getPermissionsByCategories().catch(() => []),
        userService.getUsers().catch(() => [])
      ]);

      // 🔥 NO normalizar - usar directamente

      const endTime = Date.now();
      console.log(`✅ Datos cargados en ${endTime - startTime}ms:`, {
        user: user?.id,
        permissions: userPermissions.length,
        roles: roles.length,
        areas: areas.length,
        categories: permissionCategories.length,
        users: allUsers.length
      });

      setState({
        user,
        isAuthenticated: !!user,
        permissions: userPermissions,
        roles,
        areas,
        permissionCategories,
        users: allUsers,
        isLoading: false,
        isInitialized: true,
        error: null
      });

      retryCountRef.current = 0; // Reset retry counter
      
    } catch (error) {
      console.error('💥 Error en carga de datos:', error);
      
      retryCountRef.current++;
      const maxRetries = 3;
      
      if (retryCountRef.current < maxRetries) {
        console.log(`🔄 Reintentando carga... (${retryCountRef.current}/${maxRetries})`);
        setTimeout(() => loadAllData(true), 2000); // Retry después de 2 segundos
      } else {
        setState(prev => ({
          ...prev,
          isLoading: false,
          isInitialized: true,
          error: `Error cargando datos: ${error instanceof Error ? error.message : 'Error desconocido'}`
        }));
      }
    } finally {
      loadingRef.current = false;
    }
  };

  // 🔥 REFRESH SELECTIVOS (solo cuando sea necesario)
  const refreshUser = async () => {
    try {
      console.log('🔄 Refrescando usuario...');
      const [user, permissions] = await Promise.all([
        authService.getCurrentUser(),
        authService.getUserPermissions()
      ]);
      
      // 🔥 No normalizar - usar directamente
      
      setState(prev => ({
        ...prev,
        user,
        isAuthenticated: !!user,
        permissions
      }));
      console.log('✅ Usuario refrescado');
    } catch (error) {
      console.error('❌ Error refrescando usuario:', error);
    }
  };

  const refreshRoles = async () => {
    try {
      console.log('🔄 Refrescando roles...');
      const roles = await userService.getRoles();
      setState(prev => ({ ...prev, roles }));
      console.log('✅ Roles refrescados');
    } catch (error) {
      console.error('❌ Error refrescando roles:', error);
    }
  };

  const refreshAll = async () => {
    retryCountRef.current = 0;
    await loadAllData();
  };

  // Carga inicial al montar
  useEffect(() => {
    // Solo cargar si no estamos inicializados y no hay carga en progreso
    if (!state.isInitialized && !loadingRef.current) {
      loadAllData();
    }
  }, []);

  // Crear valor del contexto
  const contextValue: AppData = {
    ...state,
    refreshUser,
    refreshRoles,
    refreshAll
  };

  return (
    <AppDataContext.Provider value={contextValue}>
      {children}
    </AppDataContext.Provider>
  );
};

// ===== HOOK PERSONALIZADO =====
export const useAppData = () => {
  const context = useContext(AppDataContext);
  
  if (!context) {
    throw new Error('useAppData debe usarse dentro de AppDataProvider');
  }
  
  return context;
};

// ===== HOOKS ESPECÍFICOS PARA CONVENIENCIA =====
export const useAuth = () => {
  const { user, isAuthenticated, permissions, refreshUser } = useAppData();
  return { user, isAuthenticated, permissions, refreshUser };
};

export const useRoles = () => {
  const { roles, refreshRoles } = useAppData();
  return { roles, refreshRoles };
};

export const useAreas = () => {
  const { areas } = useAppData();
  return { areas };
};

export const useUsers = () => {
  const { users, refreshAll } = useAppData();
  return { users, refresh: refreshAll };
};

export const usePermissionCategories = () => {
  const { permissionCategories } = useAppData();
  return { categories: permissionCategories };
};