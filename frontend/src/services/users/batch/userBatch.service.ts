// ===================================================================
// frontend/src/services/users/batch/userBatch.service.ts
// Maneja cargas en paralelo y operaciones batch optimizadas
// ===================================================================

import userProfileService from '../profile/userProfile.service';
import userListService from '../list/userList.service';
import userStatusService from '../status/userStatus.service';
import userEditService from '../edit/userEdit.service';
import { handleApiError } from '../../api';

export interface EssentialUserData {
  currentUser: any;
  activeUsers: any[];
  stats: any;
  timestamp: number;
  loadTime: number;
}

export interface DashboardData {
  online: any[];
  stats: any;
  recent: any[];
  timestamp: number;
}

export interface ManagementData {
  users: any[];
  stats: any;
  timestamp: number;
}

class UserBatchService {
  /**
   * 🚀 Carga datos esenciales del usuario en paralelo
   * Una sola operación para obtener todo lo necesario al iniciar sesión
   */
  async loadEssentialData(_userId?: number): Promise<EssentialUserData> {
    const startTime = Date.now();
    console.log('🚀 Cargando datos esenciales del usuario...');

    try {
      // Ejecutar requests en paralelo con Promise.allSettled para manejar errores individuales
      const [currentUserResult, activeUsersResult, statsResult] = await Promise.allSettled([
        userProfileService.getCurrentProfileEnhanced(),
        userListService.getActiveUsers(20),
        userListService.getUserStats()
      ]);

      // Extraer datos o usar fallbacks
      const currentUser = currentUserResult.status === 'fulfilled' 
        ? currentUserResult.value 
        : null;

      const activeUsers = activeUsersResult.status === 'fulfilled' 
        ? activeUsersResult.value 
        : [];

      const stats = statsResult.status === 'fulfilled' 
        ? statsResult.value 
        : null;

      const loadTime = Date.now() - startTime;
      
      console.log(`✅ Datos esenciales cargados en ${loadTime}ms`);

      return {
        currentUser,
        activeUsers,
        stats,
        timestamp: Date.now(),
        loadTime
      };

    } catch (error) {
      console.error('💥 Error en carga esencial:', error);
      throw new Error(handleApiError(error));
    }
  }

  /**
   * 📊 Carga datos para dashboard de administración
   */
  async loadDashboardData(): Promise<DashboardData> {
    console.log('📊 Cargando datos para dashboard...');

    try {
      const [onlineResult, statsResult, recentResult] = await Promise.allSettled([
        userStatusService.getOnlineUsers(),
        userListService.getUserStats(),
        userListService.getActiveUsers(10)
      ]);

      return {
        online: onlineResult.status === 'fulfilled' ? onlineResult.value : [],
        stats: statsResult.status === 'fulfilled' ? statsResult.value : null,
        recent: recentResult.status === 'fulfilled' ? recentResult.value : [],
        timestamp: Date.now()
      };

    } catch (error) {
      console.error('💥 Error cargando datos de dashboard:', error);
      throw new Error(handleApiError(error));
    }
  }

  /**
   * ⚙️ Carga datos para gestión de usuarios (admin)
   */
  async loadManagementData(): Promise<ManagementData> {
    console.log('⚙️ Cargando datos para gestión de usuarios...');

    try {
      const [usersResult, statsResult] = await Promise.allSettled([
        userListService.getUsersFormatted({ limit: 100, formatType: 'complete' }),
        userListService.getUserStats()
      ]);

      return {
        users: usersResult.status === 'fulfilled' ? usersResult.value : [],
        stats: statsResult.status === 'fulfilled' ? statsResult.value : null,
        timestamp: Date.now()
      };

    } catch (error) {
      console.error('💥 Error cargando datos de gestión:', error);
      throw new Error(handleApiError(error));
    }
  }

  /**
   * 🔍 Búsqueda avanzada con múltiples criterios
   */
  async advancedSearch(options: {
    query?: string;
    role?: string;
    area?: string;
    isActive?: boolean;
    limit?: number;
  }) {
    console.log('🔍 Ejecutando búsqueda avanzada:', options);

    try {
      // Si hay query text, usar búsqueda de texto
      if (options.query) {
        return await userProfileService.searchUsers(options.query, {
          role: options.role,
          area: options.area,
          isActive: options.isActive
        });
      }

      // Si no hay query, filtrar desde la lista
      let users = await userListService.getUsersFormatted({ 
        limit: options.limit || 100,
        formatType: 'with_roles'
      });

      // Aplicar filtros
      if (options.role) {
        users = users.filter(user => 
          user.roles?.includes(options.role!) || 
          user.roleDisplay?.includes(options.role!)
        );
      }

      if (options.area) {
        users = users.filter(user => 
          user.areas?.some(area => area.name === options.area) ||
          user.areaDisplay?.includes(options.area!)
        );
      }

      if (options.isActive !== undefined) {
        users = users.filter(user => user.isActive === options.isActive);
      }

      return users;

    } catch (error) {
      console.error('💥 Error en búsqueda avanzada:', error);
      throw new Error(handleApiError(error));
    }
  }

  /**
   * 🔄 Actualización masiva de usuarios
   */
  async bulkUpdate(userIds: number[], updates: any): Promise<{
    success: number[];
    failed: Array<{ id: number; error: string }>;
  }> {
    console.log(`🔄 Actualizando ${userIds.length} usuarios en lote...`);

    const results = await Promise.allSettled(
      userIds.map(async (id) => {
        try {
          const updatedUser = await userEditService.updateUser(id, updates);
          return { id, success: true, user: updatedUser };
        } catch (error) {
          return { 
            id, 
            success: false, 
            error: error instanceof Error ? error.message : 'Error desconocido' 
          };
        }
      })
    );

    const success: number[] = [];
    const failed: Array<{ id: number; error: string }> = [];

    results.forEach((result, index) => {
      if (result.status === 'fulfilled' && result.value.success) {
        success.push(result.value.id);
      } else {
        const id = userIds[index];
        const errorMessage = result.status === 'fulfilled' 
          ? result.value.error || 'Error desconocido'
          : 'Error en la operación';
        failed.push({ id, error: errorMessage });
      }
    });

    console.log(`✅ Actualización masiva completada: ${success.length} exitosos, ${failed.length} fallos`);

    return { success, failed };
  }

  /**
   * 🏥 Health check de todos los módulos de usuario
   */
  async healthCheck(): Promise<{
    healthy: boolean;
    checks: Record<string, boolean>;
    timestamp: number;
    details: Record<string, any>;
  }> {
    console.log('🏥 Ejecutando health check de módulos de usuario...');

    const checks: Record<string, boolean> = {};
    const details: Record<string, any> = {};

    // Test profile module
    try {
      await userProfileService.getCurrentProfile();
      checks.profile = true;
      details.profile = 'OK';
    } catch (error) {
      checks.profile = false;
      details.profile = error instanceof Error ? error.message : 'Error';
    }

    // Test list module
    try {
      await userListService.getUsers({ limit: 1 });
      checks.list = true;
      details.list = 'OK';
    } catch (error) {
      checks.list = false;
      details.list = error instanceof Error ? error.message : 'Error';
    }

    // Test status module
    try {
      await userStatusService.getOnlineUsers();
      checks.status = true;
      details.status = 'OK';
    } catch (error) {
      checks.status = false;
      details.status = error instanceof Error ? error.message : 'Error';
    }

    // Images module (no requiere API call)
    checks.images = true;
    details.images = 'OK - No API required';

    const healthy = Object.values(checks).every(Boolean);

    console.log(`🏥 Health check completado: ${healthy ? 'SALUDABLE' : 'PROBLEMAS DETECTADOS'}`);

    return {
      healthy,
      checks,
      details,
      timestamp: Date.now()
    };
  }

  /**
   * 📈 Obtiene métricas de rendimiento de las operaciones
   */
  async getPerformanceMetrics(): Promise<{
    averageLoadTime: number;
    lastOperations: Array<{ operation: string; duration: number; timestamp: number }>;
  }> {
    // Esta sería una implementación básica
    // En producción podrías usar una biblioteca de métricas más sofisticada
    
    const testOperations = [
      { name: 'getCurrentUser', fn: () => userProfileService.getCurrentProfile() },
      { name: 'getActiveUsers', fn: () => userListService.getActiveUsers(5) },
      { name: 'getUserStats', fn: () => userListService.getUserStats() }
    ];

    const results = [];

    for (const op of testOperations) {
      const start = Date.now();
      try {
        await op.fn();
        const duration = Date.now() - start;
        results.push({
          operation: op.name,
          duration,
          timestamp: Date.now()
        });
      } catch (error) {
        results.push({
          operation: op.name,
          duration: -1, // Indica error
          timestamp: Date.now()
        });
      }
    }

    const validDurations = results.filter(r => r.duration > 0).map(r => r.duration);
    const averageLoadTime = validDurations.length > 0 
      ? validDurations.reduce((a, b) => a + b, 0) / validDurations.length 
      : 0;

    return {
      averageLoadTime,
      lastOperations: results
    };
  }
}

export default new UserBatchService();