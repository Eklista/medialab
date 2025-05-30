// frontend/src/features/dashboard/components/ui/UserProfilePhoto.tsx - 🔧 CORREGIDO
// 🚀 COMPONENTE OPTIMIZADO CON CACHE INTELIGENTE Y WEBSOCKET

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '../../../auth/hooks/useAuth';
import { useAppData, useWebSocketStatus } from '../../../../context/AppDataContext';

// 🔧 IMPORTS CORREGIDOS - usando la nueva estructura modular
import { userService } from '../../../../services';
import { UserProfile, UserFormatted } from '../../../../services/users/types/user.types';

// 🔧 TIPO UNIFICADO PARA EL COMPONENTE
type ComponentUser = UserProfile | UserFormatted | {
  id?: number;
  firstName?: string;
  lastName?: string;
  first_name?: string;
  last_name?: string;
  email?: string;
  profileImage?: string;
  profile_image?: string;
};

export interface UserProfilePhotoProps {
  /** Tamaño del avatar */
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  /** Usuario específico con datos completos */
  user?: ComponentUser;
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
  data: UserProfile;
  timestamp: number;
  expiresAt: number;
}

class UserPhotoCache {
  private cache = new Map<number, CacheEntry>();
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutos
  private loadingPromises = new Map<number, Promise<UserProfile>>();
  
  get(userId: number): UserProfile | null {
    const entry = this.cache.get(userId);
    if (!entry) return null;
    
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(userId);
      return null;
    }
    
    return entry.data;
  }
  
  set(userId: number, data: UserProfile): void {
    const now = Date.now();
    this.cache.set(userId, {
      data,
      timestamp: now,
      expiresAt: now + this.CACHE_DURATION
    });
  }
  
  // 🆕 Deduplicación de requests usando el nuevo servicio modular
  async getWithFetch(userId: number): Promise<UserProfile> {
    // Si ya hay un request en progreso para este usuario, usarlo
    if (this.loadingPromises.has(userId)) {
      return this.loadingPromises.get(userId)!;
    }
    
    // Verificar cache primero
    const cached = this.get(userId);
    if (cached) return cached;
    
    // 🔧 USAR EL NUEVO SERVICIO MODULAR
    const loadPromise = userService.profile.getProfileById(userId)
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
  update(userId: number, updates: Partial<UserProfile>): void {
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
  
  const [fetchedUser, setFetchedUser] = useState<UserProfile | null>(null);
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
      // Sin cache, fetch directo usando el nuevo servicio
      try {
        setIsLoading(true);
        setHasError(false);
        const userData = await userService.profile.getProfileById(targetUserId);
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
  
  // 🔧 USAR EL SERVICIO DE IMÁGENES DEL NUEVO MÓDULO
  const getFullImageUrl = useCallback((imagePath: string | undefined | null): string => {
    if (!imagePath || imagePath.trim() === '') return '';
    
    // Usar el servicio de imágenes del nuevo módulo
    return userService.images.getImageUrl(imagePath);
  }, []);
  
  const getInitials = useCallback((): string => {
    if (!resolvedUser) return 'U';
    
    // 🔧 MANEJAR DIFERENTES FORMATOS DE NOMBRES
    const firstName = (resolvedUser as any).firstName || (resolvedUser as any).first_name || '';
    const lastName = (resolvedUser as any).lastName || (resolvedUser as any).last_name || '';
    
    if (firstName && lastName) {
      return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
    } else if (firstName) {
      return firstName.charAt(0).toUpperCase();
    } else if ((resolvedUser as any).email) {
      return (resolvedUser as any).email.charAt(0).toUpperCase();
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
  
  // 🔧 MANEJAR DIFERENTES FORMATOS DE IMAGEN
  const profileImage = (resolvedUser as any)?.profileImage || (resolvedUser as any)?.profile_image || null;
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
    
    // 🔧 MANEJAR DIFERENTES FORMATOS DE NOMBRES
    const firstName = (resolvedUser as any).firstName || (resolvedUser as any).first_name || '';
    const lastName = (resolvedUser as any).lastName || (resolvedUser as any).last_name || '';
    const email = (resolvedUser as any).email || '';
    
    return `${firstName} ${lastName}`.trim() || email;
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
          alt={`${displayName || 'Usuario'}`}
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