// frontend/src/features/dashboard/components/ui/UserProfilePhoto.tsx - ENHANCED VERSION
// 🚀 COMPONENTE OPTIMIZADO CON CACHE INTELIGENTE Y WEBSOCKET

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '../../../auth/hooks/useAuth';
import { useAppData, useWebSocketStatus } from '../../../../context/AppDataContext';
import { userService } from '../../../../services';
import type { User } from '../../../../services/users/users.service';

export interface UserProfilePhotoProps {
  /** Tamaño del avatar */
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  /** Usuario específico con datos completos */
  user?: {
    id?: number;
    firstName?: string;
    lastName?: string;
    email?: string;
    profileImage?: string;
    profile_image?: string;
  };
  /** ID del usuario - si se proporciona, buscará los datos */
  userId?: number;
  /** Clase CSS adicional */
  className?: string;
  /** Si debe ser clickeable */
  clickable?: boolean;
  /** Función onClick personalizada */
  onClick?: () => void;
  /** Mostrar indicador online */
  showOnlineStatus?: boolean;
  /** Estado online personalizado */
  isOnline?: boolean;
  /** Mostrar loading placeholder mientras carga */
  showLoading?: boolean;
  /** 🆕 Cachear automáticamente los datos del usuario */
  enableCache?: boolean;
}

// ===== 🚀 CACHE INTELIGENTE MEJORADO =====
interface CacheEntry {
  data: User;
  timestamp: number;
  expiresAt: number;
}

class UserPhotoCache {
  private cache = new Map<number, CacheEntry>();
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutos
  private loadingPromises = new Map<number, Promise<User>>();
  
  get(userId: number): User | null {
    const entry = this.cache.get(userId);
    if (!entry) return null;
    
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(userId);
      return null;
    }
    
    return entry.data;
  }
  
  set(userId: number, data: User): void {
    const now = Date.now();
    this.cache.set(userId, {
      data,
      timestamp: now,
      expiresAt: now + this.CACHE_DURATION
    });
  }
  
  // 🆕 Deduplicación de requests
  async getWithFetch(userId: number): Promise<User> {
    // Si ya hay un request en progreso para este usuario, usarlo
    if (this.loadingPromises.has(userId)) {
      return this.loadingPromises.get(userId)!;
    }
    
    // Verificar cache primero
    const cached = this.get(userId);
    if (cached) return cached;
    
    // Crear nueva promesa de carga
    const loadPromise = userService.getUserById(userId)
      .then(user => {
        this.set(userId, user);
        this.loadingPromises.delete(userId);
        return user;
      })
      .catch(error => {
        this.loadingPromises.delete(userId);
        throw error;
      });
    
    this.loadingPromises.set(userId, loadPromise);
    return loadPromise;
  }
  
  // 🆕 Actualizar usuario específico (para WebSocket)
  update(userId: number, updates: Partial<User>): void {
    const existing = this.get(userId);
    if (existing) {
      this.set(userId, { ...existing, ...updates });
    }
  }
  
  // 🆕 Invalidar cache específico
  invalidate(userId: number): void {
    this.cache.delete(userId);
    this.loadingPromises.delete(userId);
  }
  
  // 🆕 Estadísticas del cache
  getStats() {
    return {
      size: this.cache.size,
      activeRequests: this.loadingPromises.size,
      entries: Array.from(this.cache.entries()).map(([id, entry]) => ({
        userId: id,
        age: Date.now() - entry.timestamp,
        expiresIn: entry.expiresAt - Date.now()
      }))
    };
  }
  
  clear(): void {
    this.cache.clear();
    this.loadingPromises.clear();
  }
}

// Cache singleton
const userPhotoCache = new UserPhotoCache();

// ===== 🚀 COMPONENTE PRINCIPAL =====
const UserProfilePhoto: React.FC<UserProfilePhotoProps> = ({
  size = 'md',
  user,
  userId,
  className = '',
  clickable = false,
  onClick,
  showOnlineStatus = false,
  isOnline = false,
  showLoading = true,
  enableCache = true
}) => {
  const { state } = useAuth();
  const { user: appDataUser, users: systemUsers } = useAppData();
  const { isOnline: wsOnline, lastUpdate } = useWebSocketStatus();
  
  const [fetchedUser, setFetchedUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [hasError, setHasError] = useState(false);
  
  // ===== 🆕 SMART USER RESOLUTION =====
  // Prioridad: prop user > fetchedUser > systemUsers > appDataUser > authUser
  const resolvedUser = useMemo(() => {
    if (user) return user;
    if (fetchedUser) return fetchedUser;
    
    // Buscar en usuarios del sistema si tenemos userId
    if (userId && systemUsers.length > 0) {
      const systemUser = systemUsers.find(u => u.id === userId);
      if (systemUser) return systemUser;
    }
    
    // Si no hay userId específico, usar usuario actual
    return appDataUser || state.user;
  }, [user, fetchedUser, userId, systemUsers, appDataUser, state.user]);
  
  // ===== 🆕 FETCH CON CACHE INTELIGENTE =====
  const fetchUserWithCache = useCallback(async (targetUserId: number) => {
    if (!enableCache) {
      // Sin cache, fetch directo
      try {
        setIsLoading(true);
        setHasError(false);
        const userData = await userService.getUserById(targetUserId);
        setFetchedUser(userData);
      } catch (error) {
        console.error(`Error al cargar usuario con ID ${targetUserId}:`, error);
        setHasError(true);
      } finally {
        setIsLoading(false);
      }
      return;
    }
    
    try {
      setIsLoading(true);
      setHasError(false);
      
      // Usar cache inteligente con deduplicación
      const userData = await userPhotoCache.getWithFetch(targetUserId);
      setFetchedUser(userData);
      
      console.log(`✅ Usuario ${targetUserId} cargado (cache: ${userPhotoCache.get(targetUserId) ? 'hit' : 'miss'})`);
      
    } catch (error) {
      console.error(`💥 Error al cargar usuario con ID ${targetUserId}:`, error);
      setHasError(true);
    } finally {
      setIsLoading(false);
    }
  }, [enableCache]);
  
  // ===== 🆕 EFECTOS OPTIMIZADOS =====
  
  // Cargar usuario por ID cuando sea necesario
  useEffect(() => {
    // Solo buscar si tenemos userId pero no tenemos datos del usuario
    if (userId && !user && !resolvedUser && enableCache) {
      fetchUserWithCache(userId);
    } else if (userId && !user && !enableCache) {
      // Fetch directo sin cache
      fetchUserWithCache(userId);
    }
  }, [userId, user, resolvedUser, enableCache, fetchUserWithCache]);
  
  // ===== 🆕 WEBSOCKET UPDATES =====
  // Actualizar cuando lleguen cambios por WebSocket
  useEffect(() => {
    if (lastUpdate && resolvedUser && wsOnline) {
      const targetUserId = typeof resolvedUser.id === 'number' ? resolvedUser.id : parseInt(resolvedUser.id as string);
      
      // Buscar actualizaciones en systemUsers
      const updatedSystemUser = systemUsers.find(u => u.id === targetUserId);
      if (updatedSystemUser && JSON.stringify(updatedSystemUser) !== JSON.stringify(fetchedUser)) {
        console.log(`🔄 Usuario ${targetUserId} actualizado via WebSocket`);
        setFetchedUser(updatedSystemUser);
        
        // Actualizar cache también
        if (enableCache) {
          userPhotoCache.set(targetUserId, updatedSystemUser);
        }
      }
    }
  }, [lastUpdate, resolvedUser, systemUsers, fetchedUser, wsOnline, enableCache]);
  
  // ===== 🆕 UTILITY FUNCTIONS =====
  
  const getFullImageUrl = useCallback((imagePath: string | undefined | null): string => {
    if (!imagePath || imagePath.trim() === '') return '';
    
    if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
      return imagePath;
    }
    
    let baseUrl: string;
    if (import.meta.env.MODE === 'production') {
      baseUrl = window.location.origin;
    } else {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
      baseUrl = apiUrl.replace('/api/v1', '');
    }
    
    const path = imagePath.startsWith('/') ? imagePath : `/${imagePath}`;
    return `${baseUrl}${path}`;
  }, []);
  
  const getInitials = useCallback((): string => {
    if (!resolvedUser) return 'U';
    
    const firstName = resolvedUser.firstName || '';
    const lastName = resolvedUser.lastName || '';
    
    if (firstName && lastName) {
      return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
    } else if (firstName) {
      return firstName.charAt(0).toUpperCase();
    } else if (resolvedUser.email) {
      return resolvedUser.email.charAt(0).toUpperCase();
    }
    
    return 'U';
  }, [resolvedUser]);
  
  // ===== 🆕 RENDER OPTIMIZATIONS =====
  
  const sizeClasses = useMemo(() => ({
    xs: 'h-6 w-6 text-xs',
    sm: 'h-8 w-8 text-sm',
    md: 'h-10 w-10 text-sm',
    lg: 'h-12 w-12 text-base',
    xl: 'h-16 w-16 text-lg',
    '2xl': 'h-20 w-20 text-xl'
  }), []);
  
  const indicatorSizes = useMemo(() => ({
    xs: 'h-1.5 w-1.5',
    sm: 'h-2 w-2',
    md: 'h-2.5 w-2.5',
    lg: 'h-3 w-3',
    xl: 'h-3.5 w-3.5',
    '2xl': 'h-4 w-4'
  }), []);
  
  const profileImage = resolvedUser?.profileImage || (resolvedUser as any)?.profile_image || null;
  const imageUrl = useMemo(() => getFullImageUrl(profileImage), [profileImage, getFullImageUrl]);
  
  const baseClasses = useMemo(() => `
    ${sizeClasses[size]} 
    rounded-full
    flex items-center justify-center font-semibold
    relative overflow-hidden
    bg-[var(--color-accent-1)]
    ${clickable ? 'cursor-pointer hover:opacity-80 transition-opacity' : ''}
    ${className}
  `, [sizeClasses, size, clickable, className]);
  
  // ===== 🆕 ERROR HANDLING OPTIMIZADO =====
  const handleImageError = useCallback((e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    const target = e.target as HTMLImageElement;
    console.warn('🚫 Error cargando imagen:', target.src);
    target.style.display = 'none';
    
    const parent = target.parentElement;
    if (parent && !parent.querySelector('.fallback-initials')) {
      const span = document.createElement('span');
      span.className = 'text-[var(--color-text-main)] select-none fallback-initials';
      span.textContent = getInitials();
      parent.appendChild(span);
    }
  }, [getInitials]);
  
  const handleImageLoad = useCallback(() => {
    if (import.meta.env.MODE === 'development') {
      console.log('✅ Imagen cargada exitosamente:', imageUrl);
    }
  }, [imageUrl]);
  
  // ===== 🆕 ONLINE STATUS INDICATOR =====
  const renderOnlineIndicator = useCallback(() => {
    if (!showOnlineStatus) return null;
    
    // Determinar si está online (usar WebSocket si está disponible)
    const userIsOnline = wsOnline && isOnline;
    
    return (
      <div 
        className={`
          absolute bottom-0 right-0 
          ${indicatorSizes[size]}
          ${userIsOnline ? 'bg-green-400' : 'bg-gray-400'}
          border-2 border-white rounded-full
          transition-colors duration-200
        `}
        title={userIsOnline ? 'En línea' : 'Desconectado'}
      />
    );
  }, [showOnlineStatus, wsOnline, isOnline, indicatorSizes, size]);
  
  // ===== 🆕 LOADING STATE MEJORADO =====
  if (isLoading && showLoading && !resolvedUser) {
    return (
      <div 
        className={`${baseClasses} bg-gray-200 animate-pulse`}
        onClick={clickable ? onClick : undefined}
        role={clickable ? 'button' : undefined}
        tabIndex={clickable ? 0 : undefined}
        title="Cargando usuario..."
      >
        <div className="w-full h-full bg-gray-300 rounded-full animate-pulse"></div>
        {renderOnlineIndicator()}
      </div>
    );
  }
  
  // ===== 🆕 ERROR STATE MEJORADO =====
  if (hasError || (!resolvedUser && userId)) {
    return (
      <div 
        className={`${baseClasses} bg-gray-400`}
        onClick={clickable ? onClick : undefined}
        role={clickable ? 'button' : undefined}
        tabIndex={clickable ? 0 : undefined}
        title={hasError ? 'Error al cargar usuario' : 'Usuario no encontrado'}
      >
        <span className="text-white select-none">?</span>
        {renderOnlineIndicator()}
      </div>
    );
  }
  
  // ===== 🆕 USER DISPLAY NAME =====
  const displayName = useMemo(() => {
    if (!resolvedUser) return undefined;
    return `${resolvedUser.firstName || ''} ${resolvedUser.lastName || ''}`.trim() || resolvedUser.email;
  }, [resolvedUser]);

  // ===== RENDER PRINCIPAL =====
  return (
    <div 
      className={baseClasses}
      onClick={clickable ? onClick : undefined}
      role={clickable ? 'button' : undefined}
      tabIndex={clickable ? 0 : undefined}
      title={displayName}
    >
      {imageUrl ? (
        <img
          src={imageUrl}
          alt={`${resolvedUser?.firstName || 'Usuario'} ${resolvedUser?.lastName || ''}`}
          className="h-full w-full object-cover"
          onError={handleImageError}
          onLoad={handleImageLoad}
          loading="lazy" // 🆕 Lazy loading nativo
        />
      ) : (
        <span className="text-[var(--color-text-main)] select-none">
          {getInitials()}
        </span>
      )}
      
      {renderOnlineIndicator()}
    </div>
  );
};

// ===== 🆕 HOC PARA DEBUGGING =====
export const UserProfilePhotoWithDebug: React.FC<UserProfilePhotoProps & { debug?: boolean }> = ({ 
  debug = false, 
  ...props 
}) => {
  useEffect(() => {
    if (debug) {
      console.log('🔍 UserProfilePhoto Cache Stats:', userPhotoCache.getStats());
    }
  }, [debug]);
  
  return <UserProfilePhoto {...props} />;
};

// ===== 🆕 UTILIDADES EXPORTADAS =====
export const clearUserPhotoCache = () => {
  userPhotoCache.clear();
  console.log('🧹 Cache de UserProfilePhoto limpiado');
};

export const getUserPhotoCacheStats = () => {
  return userPhotoCache.getStats();
};

export const invalidateUserPhotoCache = (userId: number) => {
  userPhotoCache.invalidate(userId);
  console.log(`🗑️ Cache invalidado para usuario ${userId}`);
};

export default UserProfilePhoto;