// ===================================================================
// frontend/src/services/users/hooks/useUserService.ts - 🆕 HOOKS PERSONALIZADOS
// ===================================================================
import { useState, useEffect, useCallback } from 'react';
import userService from '../users.service';
import { UserProfile, UserFormatted, UserListOptions } from '../types/user.types';

/**
 * 🎯 Hook para perfil de usuario actual con auto-refresh
 */
export const useCurrentUserProfile = (enhanced = true) => {
  const [user, setUser] = useState<UserProfile | UserFormatted | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadUser = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const userData = enhanced 
        ? await userService.getCurrentUserEnhanced()
        : await userService.profile.getCurrentProfile();
        
      setUser(userData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error cargando usuario');
    } finally {
      setIsLoading(false);
    }
  }, [enhanced]);

  useEffect(() => {
    loadUser();
  }, [loadUser]);

  return {
    user,
    isLoading,
    error,
    refresh: loadUser
  };
};

/**
 * 📋 Hook para lista de usuarios con opciones
 */
export const useUserList = (options: UserListOptions = {}) => {
  const [users, setUsers] = useState<UserFormatted[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadUsers = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const userData = await userService.list.getUsersFormatted(options);
      setUsers(userData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error cargando usuarios');
    } finally {
      setIsLoading(false);
    }
  }, [options]);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  return {
    users,
    isLoading,
    error,
    refresh: loadUsers
  };
};

/**
 * 👥 Hook para usuarios activos con auto-refresh
 */
export const useActiveUsers = (limit = 50, autoRefresh = 30000) => {
  const [users, setUsers] = useState<UserFormatted[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadActiveUsers = useCallback(async () => {
    try {
      setError(null);
      const activeUsers = await userService.list.getActiveUsers(limit);
      setUsers(activeUsers);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error cargando usuarios activos');
    } finally {
      setIsLoading(false);
    }
  }, [limit]);

  useEffect(() => {
    loadActiveUsers();
    
    if (autoRefresh > 0) {
      const interval = setInterval(loadActiveUsers, autoRefresh);
      return () => clearInterval(interval);
    }
  }, [loadActiveUsers, autoRefresh]);

  return {
    users,
    isLoading,
    error,
    refresh: loadActiveUsers
  };
};

/**
 * 🟢 Hook para monitoreo de presencia del usuario actual
 */
export const usePresenceTracking = (enabled = true) => {
  const [isOnline, setIsOnline] = useState(true);
  const [isTracking, setIsTracking] = useState(false);

  useEffect(() => {
    if (!enabled) return;

    setIsTracking(true);
    const stopTracking = userService.startPresenceTracking();

    return () => {
      stopTracking();
      setIsTracking(false);
    };
  }, [enabled]);

  const setOnlineStatus = useCallback(async (online: boolean) => {
    try {
      await userService.status.updateOnlineStatus(online);
      setIsOnline(online);
    } catch (error) {
      console.error('Error actualizando estado online:', error);
    }
  }, []);

  return {
    isOnline,
    isTracking,
    setOnlineStatus
  };
};