// frontend/src/utils/userTypeHelpers.ts
import { User as AuthServiceUser } from '../services/auth.service';
import { User as UserServiceUser } from '../services/users.service';

/**
 * Verifica si un usuario tiene un rol específico
 * Maneja tanto AuthServiceUser como UserServiceUser
 */
export const userHasRole = (user: AuthServiceUser | UserServiceUser | null, roleName: string): boolean => {
  if (!user || !user.roles) return false;
  
  // AuthServiceUser tiene roles como Array<{id: number, name: string}>
  // UserServiceUser tiene roles como string[]
  return user.roles.some(role => 
    typeof role === 'string' ? role === roleName : role.name === roleName
  );
};

/**
 * Obtiene los nombres de roles de un usuario
 */
export const getUserRoleNames = (user: AuthServiceUser | UserServiceUser | null): string[] => {
  if (!user || !user.roles) return [];
  
  return user.roles.map(role => 
    typeof role === 'string' ? role : role.name
  );
};

/**
 * Verifica si un usuario es admin
 */
export const isAdmin = (user: AuthServiceUser | UserServiceUser | null): boolean => {
  return userHasRole(user, 'ADMIN');
};

/**
 * Obtiene el nombre completo del usuario
 */
export const getFullName = (user: AuthServiceUser | UserServiceUser | null): string => {
  if (!user) return '';
  
  const firstName = user.firstName || user.first_name || '';
  const lastName = user.lastName || user.last_name || '';
  
  return `${firstName} ${lastName}`.trim() || user.email || '';
};