// frontend/src/services/users/hooks/useUserService.ts - 🔧 HOOK PARA PROFILE AÑADIDO
import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import apiClient, { createCacheKey } from '../../api';
import { UserProfile, UserFormatted, UserListOptions } from '../types/user.types';

// ===== CACHE INTELIGENTE =====
const userCache = new Map<string, { data: any; timestamp: number; ttl: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutos

const getCachedData = <T>(key: string): T | null => {
  const cached = userCache.get(key);
  if (!cached) return null;
  
  if (Date.now() > cached.timestamp + cached.ttl) {
    userCache.delete(key);
    return null;
  }
  
  return cached.data;
};

const setCachedData = <T>(key: string, data: T, ttl = CACHE_TTL): void => {
  userCache.set(key, { data, timestamp: Date.now(), ttl });
};

// ===== API CALLS DIRECTAS Y ROBUSTAS =====
const userApi = {
  /**
   * 🎯 Obtiene usuarios con el nuevo endpoint /formatted
   */
  async getUsersFormatted(options: UserListOptions = {}): Promise<UserFormatted[]> {
    const cacheKey = createCacheKey('users_formatted', options);
    
    // Verificar cache primero
    const cached = getCachedData<UserFormatted[]>(cacheKey);
    if (cached) {
      console.log('📦 Cache hit: users_formatted');
      return cached;
    }
    
    try {
      const params = new URLSearchParams({
        skip: (options.skip || 0).toString(),
        limit: (options.limit || 100).toString(),
        format_type: options.formatType || 'with_roles'
      });
      
      console.log('🔄 Fetching formatted users from API...');
      const response = await apiClient.get<UserFormatted[]>(`/users/formatted?${params}`);
      
      // Normalizar datos
      const normalizedUsers = response.data.map(user => ({
        ...user,
        fullName: user.fullName || userApi.getFullName(user),
        initials: user.initials || userApi.getInitials(user),
        roles: user.roles || [],
        areas: user.areas || [],
        status: (user.status || (user.isActive ? 'offline' : 'inactive')) as 'online' | 'away' | 'offline' | 'inactive'
      }));
      
      setCachedData(cacheKey, normalizedUsers);
      console.log(`✅ Loaded ${normalizedUsers.length} formatted users`);
      
      return normalizedUsers;
      
    } catch (error) {
      console.warn('⚠️ Formatted endpoint failed, using fallback...');
      return userApi.getUsersBasicWithFallback(options);
    }
  },

  /**
   * 🔄 Fallback: usuarios básicos + transformación
   */
  async getUsersBasicWithFallback(options: UserListOptions = {}): Promise<UserFormatted[]> {
    const params = new URLSearchParams({
      skip: (options.skip || 0).toString(),
      limit: (options.limit || 100).toString()
    });
    
    const response = await apiClient.get<UserProfile[]>(`/users/?${params}`);
    
    return response.data.map(user => userApi.transformToFormatted(user));
  },

  /**
   * 👥 Usuarios activos para menú
   */
  async getActiveUsers(limit = 50): Promise<UserFormatted[]> {
    const cacheKey = `active_users_${limit}`;
    
    const cached = getCachedData<UserFormatted[]>(cacheKey);
    if (cached) return cached;
    
    try {
      const response = await apiClient.get<UserFormatted[]>(`/users/active-menu?limit=${limit}`);
      const users = response.data.map(user => ({
        ...user,
        fullName: user.fullName || userApi.getFullName(user),
        initials: user.initials || userApi.getInitials(user)
      }));
      
      setCachedData(cacheKey, users, 2 * 60 * 1000); // Cache más corto para datos de presencia
      return users;
      
    } catch (error) {
      console.warn('⚠️ Active users endpoint failed, using fallback...');
      const allUsers = await userApi.getUsersFormatted({ limit: limit * 2 });
      return allUsers.filter(u => u.isActive).slice(0, limit);
    }
  },

  /**
   * 👤 Usuario actual con datos completos
   */
  async getCurrentUserEnhanced(): Promise<UserFormatted> {
    const cacheKey = 'current_user_enhanced';
    
    const cached = getCachedData<UserFormatted>(cacheKey);
    if (cached) return cached;
    
    try {
      const response = await apiClient.get<UserFormatted>('/users/me/enhanced');
      const user = {
        ...response.data,
        fullName: response.data.fullName || userApi.getFullName(response.data),
        initials: response.data.initials || userApi.getInitials(response.data)
      };
      
      setCachedData(cacheKey, user, 3 * 60 * 1000); // Cache más corto para usuario actual
      return user;
      
    } catch (error) {
      console.warn('⚠️ Enhanced user endpoint failed, using basic...');
      const basicResponse = await apiClient.get<UserProfile>('/users/me');
      return userApi.transformToFormatted(basicResponse.data);
    }
  },

  /**
   * 🆕 Usuario por ID - NUEVO PARA PROFILE PAGE
   */
  async getUserById(userId: number): Promise<UserFormatted> {
    const cacheKey = `user_profile_${userId}`;
    
    const cached = getCachedData<UserFormatted>(cacheKey);
    if (cached) {
      console.log(`📦 Cache hit: user_profile_${userId}`);
      return cached;
    }
    
    try {
      console.log(`🔄 Fetching user ${userId} from API...`);
      const response = await apiClient.get<UserProfile>(`/users/${userId}`);
      
      const formattedUser = userApi.transformToFormatted(response.data);
      
      setCachedData(cacheKey, formattedUser, 3 * 60 * 1000);
      console.log(`✅ Loaded user profile for ID ${userId}`);
      
      return formattedUser;
      
    } catch (error) {
      console.error(`❌ Error fetching user ${userId}:`, error);
      throw error;
    }
  },

  /**
   * 🔍 Búsqueda de usuarios
   */
  async searchUsers(query: string, filters?: any): Promise<UserFormatted[]> {
    const params = new URLSearchParams({ q: query });
    if (filters?.role) params.append('role', filters.role);
    if (filters?.area) params.append('area', filters.area);
    if (filters?.isActive !== undefined) params.append('is_active', filters.isActive.toString());
    
    const response = await apiClient.get<UserFormatted[]>(`/users/search?${params}`);
    return response.data.map(user => ({
      ...user,
      fullName: user.fullName || userApi.getFullName(user),
      initials: user.initials || userApi.getInitials(user)
    }));
  },

  // ===== TRANSFORMADORES =====
  transformToFormatted(user: UserProfile): UserFormatted {
    return {
      ...user,
      fullName: userApi.getFullName(user),
      initials: userApi.getInitials(user),
      roles: [],
      areas: [],
      status: (user.isActive ? 'offline' : 'inactive') as 'online' | 'away' | 'offline' | 'inactive'
    };
  },

  getFullName(user: any): string {
    const first = user.firstName || user.first_name || '';
    const last = user.lastName || user.last_name || '';
    return first && last ? `${first} ${last}` : first || last || user.email?.split('@')[0] || 'Usuario';
  },

  getInitials(user: any): string {
    const first = user.firstName || user.first_name || '';
    const last = user.lastName || user.last_name || '';
    if (first && last) return `${first[0]}${last[0]}`.toUpperCase();
    if (first) return first[0].toUpperCase();
    return user.email?.[0]?.toUpperCase() || 'U';
  }
};

// ===== HOOKS PRINCIPALES =====

/**
 * 🎯 Hook principal para lista de usuarios - ROBUSTO Y SIN LOOPS
 */
export const useUserList = (options: UserListOptions = {}) => {
  const [users, setUsers] = useState<UserFormatted[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Memoizar opciones para evitar re-renders infinitos
  const memoizedOptions = useMemo(() => ({
    limit: options.limit || 100,
    formatType: options.formatType || 'with_roles',
    skip: options.skip || 0,
    includeInactive: options.includeInactive ?? true
  }), [options.limit, options.formatType, options.skip, options.includeInactive]);
  
  // Ref para evitar requests duplicados
  const loadingRef = useRef(false);
  
  const loadUsers = useCallback(async () => {
    if (loadingRef.current) {
      console.log('🔄 Request already in progress, skipping...');
      return;
    }
    
    loadingRef.current = true;
    setIsLoading(true);
    setError(null);
    
    try {
      console.log('🔄 Loading users with options:', memoizedOptions);
      const userData = await userApi.getUsersFormatted(memoizedOptions);
      setUsers(userData);
      console.log(`✅ Loaded ${userData.length} users successfully`);
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error cargando usuarios';
      console.error('❌ Error loading users:', errorMessage);
      setError(errorMessage);
    } finally {
      setIsLoading(false);
      loadingRef.current = false;
    }
  }, [memoizedOptions]);
  
  // Efecto con dependencias estables
  useEffect(() => {
    loadUsers();
  }, [loadUsers]);
  
  // Memoizar return para evitar re-renders innecesarios
  return useMemo(() => ({
    users,
    isLoading,
    error,
    refresh: loadUsers
  }), [users, isLoading, error, loadUsers]);
};

/**
 * 👤 Hook para perfil de usuario actual
 */
export const useCurrentUserProfile = (enhanced = true) => {
  const [user, setUser] = useState<UserFormatted | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const loadUser = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const userData = enhanced 
        ? await userApi.getCurrentUserEnhanced()
        : await userApi.getUsersFormatted({ limit: 1 }).then(users => users[0]);
        
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

  return { user, isLoading, error, refresh: loadUser };
};

/**
 * 🆕 Hook para perfil de usuario por ID - NUEVO PARA PROFILE PAGE
 */
export const useUserProfile = (userId: number | null) => {
  const [user, setUser] = useState<UserFormatted | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const loadUserProfile = useCallback(async () => {
    if (!userId) {
      setUser(null);
      setIsLoading(false);
      return;
    }
    
    try {
      setIsLoading(true);
      setError(null);
      
      console.log(`🔍 Loading profile for user ID: ${userId}`);
      const userData = await userApi.getUserById(userId);
      setUser(userData);
      console.log(`✅ Profile loaded for user: ${userData.fullName}`);
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error cargando perfil';
      console.error(`❌ Error loading profile for user ${userId}:`, errorMessage);
      setError(errorMessage);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    loadUserProfile();
  }, [loadUserProfile]);

  return { user, isLoading, error, refresh: loadUserProfile };
};

/**
 * 👥 Hook para usuarios activos
 */
export const useActiveUsers = (limit = 50, autoRefresh = 30000) => {
  const [users, setUsers] = useState<UserFormatted[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadActiveUsers = useCallback(async () => {
    try {
      setError(null);
      const activeUsers = await userApi.getActiveUsers(limit);
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

  return { users, isLoading, error, refresh: loadActiveUsers };
};

/**
 * 🔍 Hook para búsqueda de usuarios
 */
export const useUserSearch = () => {
  const [results, setResults] = useState<UserFormatted[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  
  const search = useCallback(async (query: string, filters?: any) => {
    if (!query.trim()) {
      setResults([]);
      return;
    }
    
    setIsSearching(true);
    setSearchError(null);
    
    try {
      const searchResults = await userApi.searchUsers(query, filters);
      setResults(searchResults);
    } catch (err) {
      setSearchError(err instanceof Error ? err.message : 'Error en búsqueda');
      setResults([]);
    } finally {
      setIsSearching(false);
    }
  }, []);
  
  const clearSearch = useCallback(() => {
    setResults([]);
    setSearchError(null);
  }, []);
  
  return { results, isSearching, searchError, search, clearSearch };
};

/**
 * 💾 Hook para gestión de cache
 */
export const useUserCache = () => {
  const clearCache = useCallback((pattern?: string) => {
    if (pattern) {
      for (const key of userCache.keys()) {
        if (key.includes(pattern)) {
          userCache.delete(key);
        }
      }
    } else {
      userCache.clear();
    }
    console.log('🧹 User cache cleared');
  }, []);

  const getCacheStats = useCallback(() => {
    const entries = Array.from(userCache.entries());
    return {
      size: userCache.size,
      keys: Array.from(userCache.keys()),
      oldestEntry: entries.length > 0 ? Math.min(...entries.map(([, v]) => v.timestamp)) : 0,
      newestEntry: entries.length > 0 ? Math.max(...entries.map(([, v]) => v.timestamp)) : 0
    };
  }, []);

  return { clearCache, getCacheStats };
};